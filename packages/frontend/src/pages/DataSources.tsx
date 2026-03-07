import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Switch, Card, Row, Col, message, Popconfirm, Divider, Drawer, Descriptions, Badge } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, ApiOutlined } from '@ant-design/icons';
import { dataSourceApi, DataSource, DataSourceStatus } from '../api/datasource';

const { Option } = Select;

type DataSourceType = 'postgresql' | 'mysql' | 'restapi' | 'novadb';

const dataSourceTypeInfo: Record<DataSourceType, { label: string; icon: string; color: string }> = {
  postgresql: { label: 'PostgreSQL', icon: '🐘', color: '#336791' },
  mysql: { label: 'MySQL', icon: '🐬', color: '#00758F' },
  restapi: { label: 'REST API', icon: '🌐', color: '#009688' },
  novadb: { label: 'NovaDB', icon: '💾', color: '#52c41a' },
};

const DataSources = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<DataSource | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DataSourceType>('postgresql');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchDataSources = async () => {
    setLoading(true);
    try {
      const list = await dataSourceApi.list();
      setDataSources(list);
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取数据源列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (modalOpen) {
      setConnectionTested(false);
      setConnectionResult(null);
    }
  }, [modalOpen]);

  const handleOpenCreate = () => {
    setModalType('create');
    setEditingId(null);
    setSelectedType('postgresql');
    form.resetFields();
    form.setFieldValue('type', 'postgresql');
    form.setFieldValue('port', 5432);
    form.setFieldValue('ssl', false);
    setModalOpen(true);
  };

  const handleOpenEdit = async (record: DataSource) => {
    setModalType('edit');
    setEditingId(record.id);
    setSelectedType(record.type);

    try {
      const detail = await dataSourceApi.get(record.id);
      const config = detail.config || {};

      // Prefill form with decrypted config
      if (record.type === 'restapi') {
        form.setFieldsValue({
          name: detail.name,
          baseUrl: config.baseUrl,
          authType: config.auth?.type || 'none',
          authValue: '', // Don't show actual token, show placeholder
        });
      } else {
        form.setFieldsValue({
          name: detail.name,
          host: config.host,
          port: config.port,
          database: config.database,
          username: config.username,
          password: '', // Don't show actual password, show placeholder
          ssl: config.ssl || false,
        });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取数据源详情失败');
      return;
    }

    setModalOpen(true);
  };

  const handleOpenDetail = async (record: DataSource) => {
    try {
      const detail = await dataSourceApi.get(record.id);
      setDetailData(detail);
      setDetailOpen(true);
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取数据源详情失败');
    }
  };

  const handleTestConnectionFromList = async (record: DataSource) => {
    try {
      const result = await dataSourceApi.testConnection(record.id);
      if (result.success) {
        message.success('连接成功');
      } else {
        message.error(`连接失败: ${result.message}`);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '测试连接失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dataSourceApi.delete(id);
      message.success('删除成功');
      fetchDataSources();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTested(false);
    try {
      const values = await form.validateFields();
      const testConfig = buildConfig(values);
      const result = await dataSourceApi.testConnectionDirect(selectedType, testConfig);
      setConnectionResult(result);
    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: error.response?.data?.message || '测试连接失败',
      });
    } finally {
      setTestingConnection(false);
      setConnectionTested(true);
    }
  };

  const handleTestConnectionInDetail = async () => {
    if (!detailData) return;
    setTestingConnection(true);
    try {
      const result = await dataSourceApi.testConnection(detailData.id);
      setConnectionResult(result);
      // Refresh detail data
      const updated = await dataSourceApi.get(detailData.id);
      setDetailData(updated);
      fetchDataSources();
    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: error.response?.data?.message || '测试连接失败',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const buildConfig = (values: any) => {
    if (selectedType === 'restapi') {
      return {
        type: 'restapi',
        baseUrl: values.baseUrl,
        auth: {
          type: values.authType || 'none',
          value: values.authValue || undefined, // If empty, don't send
        },
        defaultHeaders: values.defaultHeaders,
      };
    }
    return {
      type: selectedType,
      host: values.host,
      port: values.port,
      database: values.database,
      username: values.username,
      password: values.password || undefined, // If empty, don't send (keep original)
      ssl: values.ssl || false,
    };
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!connectionTested) {
        message.warning('请先测试连接');
        return;
      }
      if (connectionResult && !connectionResult.success) {
        message.warning('连接测试失败，请检查配置');
        return;
      }

      setSaving(true);
      const config = buildConfig(values);

      // Remove undefined values (empty passwords)
      Object.keys(config).forEach(key => {
        if ((config as any)[key] === undefined) {
          delete (config as any)[key];
        }
      });
      if (config.auth && !config.auth.value) {
        delete (config as any).auth;
      }

      if (modalType === 'create') {
        await dataSourceApi.create({
          name: values.name,
          type: selectedType as 'postgresql' | 'mysql' | 'restapi',
          config,
        });
        message.success('创建成功');
      } else if (editingId) {
        await dataSourceApi.update(editingId, {
          name: values.name,
          config,
        });
        message.success('更新成功');
      }

      setModalOpen(false);
      fetchDataSources();
    } catch (error: any) {
      if (error.errorFields) return; // Form validation error
      message.error(error.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (type: DataSourceType) => {
    setSelectedType(type);
    setConnectionTested(false);
    setConnectionResult(null);
    if (type === 'postgresql') {
      form.setFieldValue('port', 5432);
    } else if (type === 'mysql') {
      form.setFieldValue('port', 3306);
    }
  };

  const getStatusBadge = (status?: DataSourceStatus) => {
    switch (status) {
      case 'connected':
        return <Badge status="success" text="已连接" />;
      case 'failed':
        return <Badge status="error" text="连接失败" />;
      default:
        return <Badge status="default" text="未测试" />;
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DataSource) => (
        <Button type="link" onClick={() => handleOpenDetail(record)} style={{ padding: 0 }}>
          {name}
        </Button>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: DataSourceType) => {
        const info = dataSourceTypeInfo[type] || { label: type, icon: '📦', color: '#666' };
        return (
          <Tag color={info.color} icon={<span>{info.icon}</span>}>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DataSourceStatus) => getStatusBadge(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DataSource) => (
        <Space>
          <Button type="link" icon={<ApiOutlined />} onClick={() => handleTestConnectionFromList(record)}>
            测试连接
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个数据源吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            okType="danger"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>数据源管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          新建数据源
        </Button>
      </div>

      {/* NovaDB Built-in */}
      <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <Space>
          <span style={{ fontSize: 20 }}>💾</span>
          <div>
            <div style={{ fontWeight: 500 }}>NovaDB</div>
            <div style={{ fontSize: 12, color: '#888' }}>内置数据源 - 用于存储应用数据</div>
          </div>
          <Tag color="green">内置</Tag>
        </Space>
      </Card>

      {/* Data Sources Table */}
      <Table
        columns={columns}
        dataSource={dataSources}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: '暂无数据源，点击上方按钮创建' }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={modalType === 'create' ? '新建数据源' : '编辑数据源'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saving}
        width={640}
        okText="保存"
        okButtonProps={{ disabled: !connectionTested || (connectionResult !== null && !connectionResult.success) }}
      >
        <Form form={form} layout="vertical">
          {/* Step 1: Select Type */}
          {modalType === 'create' && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>选择类型</div>
                <Row gutter={16}>
                  {(['postgresql', 'mysql', 'restapi'] as DataSourceType[]).map((type) => (
                    <Col span={8} key={type}>
                      <Card
                        hoverable
                        size="small"
                        onClick={() => handleTypeChange(type)}
                        style={{
                          border: selectedType === type ? `2px solid ${dataSourceTypeInfo[type].color}` : '1px solid #d9d9d9',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 24 }}>{dataSourceTypeInfo[type].icon}</div>
                        <div>{dataSourceTypeInfo[type].label}</div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
              <Divider />
            </>
          )}

          {/* Step 2: Configuration */}
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入数据源名称' }]}>
            <Input placeholder="请输入数据源名称" />
          </Form.Item>

          {selectedType === 'restapi' ? (
            // REST API Config
            <>
              <Form.Item name="baseUrl" label="Base URL" rules={[{ required: true, message: '请输入 Base URL' }]}>
                <Input placeholder="https://api.example.com" />
              </Form.Item>
              <Form.Item name="authType" label="认证方式" initialValue="none">
                <Select>
                  <Option value="none">无</Option>
                  <Option value="bearer">Bearer Token</Option>
                  <Option value="apikey">API Key</Option>
                  <Option value="basic">Basic Auth</Option>
                </Select>
              </Form.Item>
              <Form.Item name="authValue" label={modalType === 'edit' ? 'Token/密钥（留空则不修改）' : 'Token/密钥'}>
                <Input.Password placeholder={modalType === 'edit' ? '留空则不修改' : '请输入认证信息'} />
              </Form.Item>
            </>
          ) : (
            // PostgreSQL / MySQL Config
            <>
              <Form.Item name="host" label="主机" rules={[{ required: true, message: '请输入主机地址' }]}>
                <Input placeholder="localhost" />
              </Form.Item>
              <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口' }]}>
                <Input type="number" placeholder={selectedType === 'postgresql' ? '5432' : '3306'} />
              </Form.Item>
              <Form.Item name="database" label="数据库名" rules={[{ required: true, message: '请输入数据库名' }]}>
                <Input placeholder="请输入数据库名" />
              </Form.Item>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item name="password" label={modalType === 'edit' ? '密码（留空则不修改）' : '密码'}>
                <Input.Password placeholder={modalType === 'edit' ? '留空则不修改' : '请输入密码'} />
              </Form.Item>
              <Form.Item name="ssl" label="SSL 连接" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </>
          )}

          {/* Test Connection */}
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={handleTestConnection} loading={testingConnection}>
                测试连接
              </Button>
              {connectionTested && connectionResult && (
                <span style={{ color: connectionResult.success ? '#52c41a' : '#ff4d4f' }}>
                  {connectionResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  {' '}{connectionResult.message}
                </span>
              )}
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="数据源详情"
        width={480}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          <Button type="primary" onClick={handleTestConnectionInDetail} loading={testingConnection}>
            测试连接
          </Button>
        }
      >
        {detailData && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="名称">{detailData.name}</Descriptions.Item>
              <Descriptions.Item label="类型">
                {dataSourceTypeInfo[detailData.type]?.icon} {dataSourceTypeInfo[detailData.type]?.label || detailData.type}
              </Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusBadge(detailData.status)}</Descriptions.Item>
              {detailData.type !== 'restapi' && detailData.config && (
                <>
                  <Descriptions.Item label="主机">{detailData.config.host}</Descriptions.Item>
                  <Descriptions.Item label="端口">{detailData.config.port}</Descriptions.Item>
                  <Descriptions.Item label="数据库">{detailData.config.database}</Descriptions.Item>
                  <Descriptions.Item label="用户名">{detailData.config.username}</Descriptions.Item>
                  <Descriptions.Item label="密码">******</Descriptions.Item>
                  <Descriptions.Item label="SSL">{detailData.config.ssl ? '是' : '否'}</Descriptions.Item>
                </>
              )}
              {detailData.type === 'restapi' && detailData.config && (
                <>
                  <Descriptions.Item label="Base URL">{detailData.config.baseUrl}</Descriptions.Item>
                  <Descriptions.Item label="认证方式">{detailData.config.auth?.type || '无'}</Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="创建时间">{new Date(detailData.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
              <Descriptions.Item label="最后测试时间">
                {detailData.lastTestedAt ? new Date(detailData.lastTestedAt).toLocaleString('zh-CN') : '从未测试'}
              </Descriptions.Item>
            </Descriptions>

            {connectionResult && (
              <div style={{ marginTop: 16, padding: 12, background: connectionResult.success ? '#f6ffed' : '#fff2f0', borderRadius: 4 }}>
                <Space>
                  {connectionResult.success ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  <span>{connectionResult.message}</span>
                </Space>
              </div>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default DataSources;

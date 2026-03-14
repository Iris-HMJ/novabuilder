import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Input, Space, Tag, Modal, message, Spin, Select, Empty, Dropdown } from 'antd';
import { PlusOutlined, SearchOutlined, MoreOutlined, CopyOutlined, DeleteOutlined, EditOutlined as RenameOutlined, RobotOutlined, FileTextOutlined } from '@ant-design/icons';
import { appApi } from '../api/app';
import { useAuthStore } from '../stores/authStore';
import type { App } from '@novabuilder/shared';

const { Search } = Input;

const getRelativeTime = (date: Date | string) => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return then.toLocaleDateString();
};

type CreateType = 'blank' | 'ai';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'name'>('updatedAt');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createType, setCreateType] = useState<CreateType>('blank');
  const [newAppName, setNewAppName] = useState('未命名应用');

  // 判断是否为 end_user
  const isEndUser = user?.role === 'end_user';

  // 重命名状态
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameAppId, setRenameAppId] = useState<string | null>(null);
  const [renameAppName, setRenameAppName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const result = await appApi.list({ search: searchText });
      let sortedApps = [...result.data];

      // Sort apps
      if (sortBy === 'name') {
        sortedApps.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      } else if (sortBy === 'createdAt') {
        sortedApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        sortedApps.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }

      setApps(sortedApps);
    } catch (error) {
      message.error('获取应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [searchText, sortBy]);

  const handleCreateApp = async () => {
    if (!newAppName.trim()) {
      message.warning('请输入应用名称');
      return;
    }
    setCreateLoading(true);
    try {
      const app = await appApi.create({ name: newAppName, workspaceId: 'default' });
      message.success('创建成功');
      setCreateModalOpen(false);
      setNewAppName('未命名应用');
      navigate(`/apps/${app.id}/edit`);
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteApp = async (appId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个应用吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        try {
          await appApi.delete(appId);
          message.success('删除成功');
          fetchApps();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleCloneApp = async (appId: string) => {
    try {
      await appApi.clone(appId);
      message.success('克隆成功');
      fetchApps();
    } catch (error) {
      message.error('克隆失败');
    }
  };

  // 打开重命名弹窗
  const handleOpenRename = (app: App) => {
    setRenameAppId(app.id);
    setRenameAppName(app.name);
    setRenameModalOpen(true);
  };

  // 确认重命名
  const handleRename = async () => {
    if (!renameAppId || !renameAppName.trim()) {
      message.warning('请输入应用名称');
      return;
    }
    setRenameLoading(true);
    try {
      await appApi.update(renameAppId, { name: renameAppName.trim() });
      message.success('重命名成功');
      setRenameModalOpen(false);
      setRenameAppId(null);
      setRenameAppName('');
      fetchApps();
    } catch (error: any) {
      message.error(error.response?.data?.message || '重命名失败');
    } finally {
      setRenameLoading(false);
    }
  };

  const getAppActions = (app: App) => {
    return [
      {
        key: 'clone',
        icon: <CopyOutlined />,
        label: '复制',
        onClick: (e?: any) => {
          e?.stopPropagation?.();
          handleCloneApp(app.id);
        },
      },
      {
        key: 'rename',
        icon: <RenameOutlined />,
        label: '重命名',
        onClick: (e?: any) => {
          e?.stopPropagation?.();
          handleOpenRename(app);
        },
      },
      { type: 'divider' as const, key: 'divider' },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: (e?: any) => {
          e?.stopPropagation?.();
          handleDeleteApp(app.id);
        },
      },
    ];
  };

  return (
    <div>
      {/* 顶部工具栏 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <Space wrap>
          <Search
            placeholder="搜索应用..."
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          {!isEndUser && (
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 140 }}
              options={[
                { value: 'updatedAt', label: '最近更新' },
                { value: 'createdAt', label: '最近创建' },
                { value: 'name', label: '名称' },
              ]}
            />
          )}
        </Space>
        {!isEndUser && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)} size="large">
            新建应用
          </Button>
        )}
      </div>

      <Spin spinning={loading}>
        {apps.length === 0 && !searchText ? (
          // 空状态
          <div>
            {!isEndUser && (
              <Row gutter={[16, 16]}>
                {/* AI 生成特殊卡片 */}
                <Col xs={24} sm={12} lg={6}>
                  <Card
                    className="ai-create-card"
                    hoverable
                    onClick={() => {
                      setCreateType('ai');
                      setCreateModalOpen(true);
                    }}
                    style={{ height: 200 }}
                  >
                    <div className="ai-card-content">
                      <RobotOutlined className="ai-icon" />
                      <div className="ai-title">用 AI 创建你的第一个应用</div>
                      <div className="ai-desc">描述你的需求，AI 自动生成应用</div>
                      <Button type="primary" className="ai-btn">开始创建</Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            )}
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={isEndUser ? "暂无可用应用" : "还没有应用，点击上方按钮开始创建"}
              style={{ marginTop: 48 }}
            />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {/* AI 生成特殊卡片 - 始终显示在第一个位置 */}
            {!searchText && !isEndUser && (
              <Col xs={24} sm={12} lg={6}>
                <Card
                  className="ai-create-card"
                  hoverable
                  onClick={() => {
                    setCreateType('ai');
                    setCreateModalOpen(true);
                  }}
                  style={{ height: 200 }}
                >
                  <div className="ai-card-content">
                    <RobotOutlined className="ai-icon" />
                    <div className="ai-title">用 AI 创建你的第一个应用</div>
                    <div className="ai-desc">描述你的需求，AI 自动生成应用</div>
                    <Button type="primary" className="ai-btn">开始创建</Button>
                  </div>
                </Card>
              </Col>
            )}

            {/* 应用卡片 */}
            {apps.map((app) => (
              <Col key={app.id} xs={24} sm={12} lg={6}>
                <Card
                  className="app-card"
                  hoverable
                  style={{ height: 200 }}
                  onClick={() => navigate(isEndUser ? `/apps/${app.id}` : `/apps/${app.id}/edit`)}
                >
                  <Card.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: 500 }}>
                          {app.name}
                        </span>
                        <Tag color={app.status === 'published' ? 'success' : 'default'}>
                          {app.status === 'published' ? '已发布' : '草稿'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div className="app-card-desc">
                        <div>更新于 {getRelativeTime(app.updatedAt)}</div>
                      </div>
                    }
                  />
                  {!isEndUser && (
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        menu={{ items: getAppActions(app) }}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <Button type="text" icon={<MoreOutlined />}>
                          更多
                        </Button>
                      </Dropdown>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {/* 新建应用弹窗 */}
      <Modal
        title="新建应用"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          setNewAppName('未命名应用');
          setCreateType('blank');
        }}
        footer={null}
        width={520}
        centered
      >
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          {/* 选择类型卡片 */}
          <Row gutter={16}>
            <Col span={12}>
              <Card
                className={`type-card ${createType === 'blank' ? 'selected' : ''}`}
                hoverable
                onClick={() => setCreateType('blank')}
              >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <FileTextOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                  <div style={{ marginTop: 8, fontWeight: 500 }}>空白应用</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>从零开始搭建</div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                className={`type-card ${createType === 'ai' ? 'selected' : ''}`}
                hoverable
                onClick={() => setCreateType('ai')}
              >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <RobotOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                  <div style={{ marginTop: 8, fontWeight: 500 }}>AI 生成</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>描述需求，AI 创建</div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* 应用名称 */}
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>应用名称</div>
            <Input
              placeholder="请输入应用名称"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              size="large"
            />
          </div>

          {/* 按钮 */}
          <Button
            type="primary"
            size="large"
            block
            loading={createLoading}
            onClick={handleCreateApp}
          >
            {createType === 'ai' ? '开始 AI 创建' : '创建应用'}
          </Button>
        </Space>
      </Modal>

      {/* 重命名弹窗 */}
      <Modal
        title="重命名应用"
        open={renameModalOpen}
        onCancel={() => {
          setRenameModalOpen(false);
          setRenameAppId(null);
          setRenameAppName('');
        }}
        onOk={handleRename}
        confirmLoading={renameLoading}
      >
        <Input
          placeholder="请输入新名称"
          value={renameAppName}
          onChange={(e) => setRenameAppName(e.target.value)}
          onPressEnter={handleRename}
          autoFocus
        />
      </Modal>

      <style>{`
        .ai-create-card {
          height: 200px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 2px dashed rgba(255, 255, 255, 0.5);
        }

        .ai-create-card .ant-card-body {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-card-content {
          text-align: center;
          color: #fff;
        }

        .ai-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .ai-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .ai-desc {
          font-size: 13px;
          opacity: 0.85;
          margin-bottom: 16px;
        }

        .ai-btn {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .ai-btn:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          border-color: #fff !important;
        }

        .app-card {
          height: 200px;
          position: relative;
        }

        .app-card-desc {
          font-size: 13px;
          color: #8c8c8c;
        }

        .card-actions {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: flex;
          gap: 4px;
        }

        .type-card {
          border: 2px solid #f0f0f0;
          transition: all 0.3s ease;
        }

        .type-card.selected {
          border-color: #1677ff;
          background: rgba(22, 119, 255, 0.04);
        }

        .type-card:hover {
          border-color: #91d5ff;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

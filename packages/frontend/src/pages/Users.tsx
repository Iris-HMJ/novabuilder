import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, message, Dropdown, Badge } from 'antd';
import { PlusOutlined, MoreOutlined, UserOutlined, DeleteOutlined, StopOutlined, CheckOutlined } from '@ant-design/icons';
import { userApi } from '../api/user';
import type { User, UserRole } from '@novabuilder/shared';

const roleColors: Record<UserRole, string> = {
  admin: 'red',
  builder: 'blue',
  end_user: 'green',
};

const roleLabels: Record<UserRole, string> = {
  admin: '管理员',
  builder: '开发者',
  end_user: '终端用户',
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await userApi.list();
      setUsers(result.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async () => {
    try {
      await form.validateFields();
      setInviteLoading(true);

      // Since there's no invite API, we'll show a message
      // In a real app, this would call an invite endpoint
      message.info('邀请功能需要后端支持，请直接在注册页面注册新用户');
      setInviteModalOpen(false);
      form.resetFields();
    } catch (error) {
      // Validation failed
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, data: { name?: string; role?: UserRole; isActive?: boolean }) => {
    try {
      await userApi.update(userId, data);
      message.success('更新成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个用户吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        try {
          await userApi.delete(userId);
          message.success('删除成功');
          fetchUsers();
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      },
    });
  };

  const handleToggleUserStatus = (user: User) => {
    handleUpdateUser(user.id, { isActive: !user.isActive });
  };

  const getUserActions = (user: User) => {
    return [
      {
        key: 'role',
        label: '修改角色',
        children: [
          { key: 'admin', label: '管理员', onClick: () => handleUpdateUser(user.id, { role: 'admin' }) },
          { key: 'builder', label: '开发者', onClick: () => handleUpdateUser(user.id, { role: 'builder' }) },
          { key: 'end_user', label: '终端用户', onClick: () => handleUpdateUser(user.id, { role: 'end_user' }) },
        ],
      },
      {
        key: 'status',
        label: user.isActive ? '禁用用户' : '启用用户',
        icon: user.isActive ? <StopOutlined /> : <CheckOutlined />,
        onClick: () => handleToggleUserStatus(user),
      },
      { type: 'divider' as const },
      {
        key: 'delete',
        label: '删除用户',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteUser(user.id),
      },
    ];
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: User) => (
        <Space>
          <UserOutlined />
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive: boolean) => (
        isActive
          ? <Badge status="success" text="正常" />
          : <Badge status="default" text="已禁用" />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Dropdown
          menu={{ items: getUserActions(record) }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />}>
            更多
          </Button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>用户管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setInviteModalOpen(true)}
        >
          邀请用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* 邀请用户弹窗 */}
      <Modal
        title="邀请用户"
        open={inviteModalOpen}
        onCancel={() => {
          setInviteModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleInvite}
        >
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            name="password"
            label="初始密码"
            rules={[
              { required: true, message: '请输入初始密码' },
              { min: 8, message: '密码至少需要8个字符' },
            ]}
          >
            <Input.Password placeholder="请输入初始密码" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="builder"
          >
            <Select placeholder="请选择角色">
              <Select.Option value="admin">
                <Tag color="red">管理员</Tag> 拥有所有权限
              </Select.Option>
              <Select.Option value="builder">
                <Tag color="blue">开发者</Tag> 可以创建和管理应用
              </Select.Option>
              <Select.Option value="end_user">
                <Tag color="green">终端用户</Tag> 仅能使用已发布应用
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setInviteModalOpen(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={inviteLoading}>
                邀请
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;

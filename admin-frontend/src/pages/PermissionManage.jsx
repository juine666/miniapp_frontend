import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, Tag, message, Transfer, Divider, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyOutlined, KeyOutlined, AppstoreAddOutlined } from '@ant-design/icons'
import { PERMISSIONS, ROLE_PERMISSIONS } from '../config/permissions'

const { Option } = Select

// 权限分组配置
const PERMISSION_GROUPS = {
  '分类管理': [
    { key: PERMISSIONS.CATEGORY_VIEW, label: '查看分类' },
    { key: PERMISSIONS.CATEGORY_CREATE, label: '创建分类' },
    { key: PERMISSIONS.CATEGORY_EDIT, label: '编辑分类' },
    { key: PERMISSIONS.CATEGORY_DELETE, label: '删除分类' },
  ],
  '商品管理': [
    { key: PERMISSIONS.PRODUCT_VIEW, label: '查看商品' },
    { key: PERMISSIONS.PRODUCT_CREATE, label: '创建商品' },
    { key: PERMISSIONS.PRODUCT_EDIT, label: '编辑商品' },
    { key: PERMISSIONS.PRODUCT_AUDIT, label: '审核商品' },
    { key: PERMISSIONS.PRODUCT_PUBLISH, label: '发布商品' },
    { key: PERMISSIONS.PRODUCT_REJECT, label: '驳回商品' },
    { key: PERMISSIONS.PRODUCT_OFFLINE, label: '下线商品' },
  ],
  '用户管理': [
    { key: PERMISSIONS.USER_VIEW, label: '查看用户' },
    { key: PERMISSIONS.USER_BAN, label: '封禁用户' },
    { key: PERMISSIONS.USER_UNBAN, label: '解封用户' },
  ],
  '系统管理': [
    { key: PERMISSIONS.SYSTEM_CONFIG, label: '系统配置' },
    { key: PERMISSIONS.SYSTEM_THEME, label: '主题设置' },
    { key: PERMISSIONS.EXCEL_IMPORT, label: 'Excel导入' },
  ],
  '学生登记': [
    { key: PERMISSIONS.STUDENT_ENROLLMENT_VIEW, label: '查看登记' },
    { key: PERMISSIONS.STUDENT_ENROLLMENT_CREATE, label: '创建登记' },
    { key: PERMISSIONS.STUDENT_ENROLLMENT_EDIT, label: '编辑登记' },
    { key: PERMISSIONS.STUDENT_ENROLLMENT_DELETE, label: '删除登记' },
    { key: PERMISSIONS.STUDENT_ENROLLMENT_EXPORT, label: '导出登记' },
  ],
  '订单管理': [
    { key: PERMISSIONS.ORDER_VIEW, label: '查看订单' },
    { key: PERMISSIONS.ORDER_CREATE, label: '创建订单' },
    { key: PERMISSIONS.ORDER_EDIT, label: '编辑订单' },
    { key: PERMISSIONS.ORDER_DELETE, label: '删除订单' },
    { key: PERMISSIONS.ORDER_EXPORT, label: '导出订单' },
  ],
}

// 获取所有权限列表
const getAllPermissions = () => {
  const permissions = []
  Object.entries(PERMISSION_GROUPS).forEach(([group, items]) => {
    items.forEach(item => {
      permissions.push({
        key: item.key,
        title: item.label,
        group: group
      })
    })
  })
  return permissions
}

export default function PermissionManage() {
  const [activeTab, setActiveTab] = useState('roles')
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const [permissionDefineModalVisible, setPermissionDefineModalVisible] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [editingPermission, setEditingPermission] = useState(null)
  const [targetKeys, setTargetKeys] = useState([])
  const [form] = Form.useForm()
  const [permissionForm] = Form.useForm()

  // 加载角色数据
  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  const loadRoles = () => {
    // 模拟数据，实际应该从后端API获取
    const mockRoles = [
      {
        id: 1,
        name: 'ADMIN',
        displayName: '管理员',
        description: '系统管理员，拥有大部分权限',
        permissions: ROLE_PERMISSIONS.ADMIN || [],
        createdAt: '2024-01-01'
      },
      {
        id: 2,
        name: 'AUDITOR',
        displayName: '审核员',
        description: '负责商品审核',
        permissions: ROLE_PERMISSIONS.AUDITOR || [],
        createdAt: '2024-01-01'
      },
      {
        id: 3,
        name: 'EDITOR',
        displayName: '编辑员',
        description: '负责分类和商品管理',
        permissions: ROLE_PERMISSIONS.EDITOR || [],
        createdAt: '2024-01-01'
      },
      {
        id: 4,
        name: 'VIEWER',
        displayName: '查看员',
        description: '只能查看数据',
        permissions: ROLE_PERMISSIONS.VIEWER || [],
        createdAt: '2024-01-01'
      },
    ]
    setRoles(mockRoles)
  }

  // 加载权限定义
  const loadPermissions = () => {
    const mockPermissions = getAllPermissions().map((perm, index) => ({
      id: index + 1,
      code: perm.key,
      name: perm.title,
      group: perm.group,
      description: `${perm.group} - ${perm.title}`,
      createdAt: '2024-01-01'
    }))
    setPermissions(mockPermissions)
  }

  // 打开新建/编辑角色弹窗
  const handleOpenModal = (role = null) => {
    setEditingRole(role)
    if (role) {
      form.setFieldsValue({
        name: role.name,
        displayName: role.displayName,
        description: role.description
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 打开权限配置弹窗
  const handleOpenPermissionModal = (role) => {
    setEditingRole(role)
    setTargetKeys(role.permissions || [])
    setPermissionModalVisible(true)
  }

  // 保存角色
  const handleSaveRole = async () => {
    try {
      const values = await form.validateFields()
      console.log('保存角色:', values)
      message.success(editingRole ? '角色更新成功' : '角色创建成功')
      setModalVisible(false)
      loadRoles()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  // 保存权限配置
  const handleSavePermissions = () => {
    console.log('保存权限配置:', { roleId: editingRole?.id, permissions: targetKeys })
    message.success('权限配置已保存')
    setPermissionModalVisible(false)
    loadRoles()
  }

  // 删除角色
  const handleDeleteRole = (role) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除角色 "${role.displayName}" 吗？`,
      onOk: () => {
        console.log('删除角色:', role.id)
        message.success('角色已删除')
        loadRoles()
      }
    })
  }

  // 打开权限定义弹窗
  const handleOpenPermissionDefineModal = (permission = null) => {
    setEditingPermission(permission)
    if (permission) {
      permissionForm.setFieldsValue({
        code: permission.code,
        name: permission.name,
        group: permission.group,
        description: permission.description
      })
    } else {
      permissionForm.resetFields()
    }
    setPermissionDefineModalVisible(true)
  }

  // 保存权限定义
  const handleSavePermissionDefine = async () => {
    try {
      const values = await permissionForm.validateFields()
      console.log('保存权限定义:', values)
      // await api.post('/api/admin/permissions', values)
      message.success(editingPermission ? '权限更新成功' : '权限创建成功')
      setPermissionDefineModalVisible(false)
      loadPermissions()
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 删除权限定义
  const handleDeletePermission = (permission) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除权限 "${permission.name}" 吗？`,
      onOk: async () => {
        try {
          // await api.delete(`/api/admin/permissions/${permission.id}`)
          message.success('权限已删除')
          loadPermissions()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 权限定义列表列配置
  const permissionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80
    },
    {
      title: '权限代码',
      dataIndex: 'code',
      width: 250,
      render: (text) => <Tag color="purple">{text}</Tag>
    },
    {
      title: '权限名称',
      dataIndex: 'name',
      width: 150
    },
    {
      title: '所属分组',
      dataIndex: 'group',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleOpenPermissionDefineModal(record)}
          >
            编辑
          </Button>
          <Button 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePermission(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  const columns = [
    {
      title: '角色代码',
      dataIndex: 'name',
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '显示名称',
      dataIndex: 'displayName',
      width: 150
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      width: 120,
      render: (permissions) => (
        <Tag color="green">{permissions?.length || 0} 个权限</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150
    },
    {
      title: '操作',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<KeyOutlined />}
            onClick={() => handleOpenPermissionModal(record)}
          >
            配置权限
          </Button>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Button 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRole(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card 
        bordered={false}
        style={{ 
          marginBottom: 24,
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(31, 38, 135, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ 
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            <SafetyOutlined /> 权限管理
          </h2>
          {activeTab === 'roles' ? (
            <Button 
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              style={{
                borderRadius: '12px',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                fontWeight: '600'
              }}
            >
              新建角色
            </Button>
          ) : (
            <Button 
              type="primary"
              size="large"
              icon={<AppstoreAddOutlined />}
              onClick={() => handleOpenPermissionDefineModal()}
              style={{
                borderRadius: '12px',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                fontWeight: '600'
              }}
            >
              新建权限
            </Button>
          )}
        </div>
      </Card>

      <Card 
        bordered={false}
        style={{
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(31, 38, 135, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'roles',
              label: (
                <span>
                  <SafetyOutlined />
                  角色管理
                </span>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={roles}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个角色`
                  }}
                />
              )
            },
            {
              key: 'permissions',
              label: (
                <span>
                  <KeyOutlined />
                  权限定义
                </span>
              ),
              children: (
                <Table
                  rowKey="id"
                  columns={permissionColumns}
                  dataSource={permissions}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 个权限`
                  }}
                />
              )
            }
          ]}
        />
      </Card>

      {/* 新建/编辑角色弹窗 */}
      <Modal
        title={editingRole ? '编辑角色' : '新建角色'}
        open={modalVisible}
        onOk={handleSaveRole}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="角色代码"
            name="name"
            rules={[
              { required: true, message: '请输入角色代码' },
              { pattern: /^[A-Z_]+$/, message: '只能包含大写字母和下划线' }
            ]}
          >
            <Input placeholder="例如: ADMIN, EDITOR" disabled={!!editingRole} />
          </Form.Item>
          <Form.Item
            label="显示名称"
            name="displayName"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="例如: 管理员, 编辑员" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="角色描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限配置弹窗 */}
      <Modal
        title={`配置权限 - ${editingRole?.displayName}`}
        open={permissionModalVisible}
        onOk={handleSavePermissions}
        onCancel={() => setPermissionModalVisible(false)}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue">已选择 {targetKeys.length} 个权限</Tag>
        </div>
        <Transfer
          dataSource={getAllPermissions()}
          titles={['可用权限', '已分配权限']}
          targetKeys={targetKeys}
          onChange={setTargetKeys}
          render={item => `${item.group} - ${item.title}`}
          listStyle={{
            width: 350,
            height: 400,
          }}
          showSearch
          filterOption={(inputValue, option) =>
            option.title.toLowerCase().indexOf(inputValue.toLowerCase()) > -1 ||
            option.group.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
          }
        />
        
        <Divider />
        
        <div>
          <h4>权限分组预览：</h4>
          {Object.entries(PERMISSION_GROUPS).map(([group, items]) => {
            const selectedInGroup = items.filter(item => targetKeys.includes(item.key))
            if (selectedInGroup.length === 0) return null
            return (
              <div key={group} style={{ marginBottom: 12 }}>
                <strong>{group}:</strong>
                <div style={{ marginTop: 8 }}>
                  {selectedInGroup.map(item => (
                    <Tag key={item.key} color="blue" style={{ margin: '4px' }}>
                      {item.label}
                    </Tag>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Modal>

      {/* 权限定义弹窗 */}
      <Modal
        title={editingPermission ? '编辑权限' : '新建权限'}
        open={permissionDefineModalVisible}
        onOk={handleSavePermissionDefine}
        onCancel={() => setPermissionDefineModalVisible(false)}
        width={600}
      >
        <Form form={permissionForm} layout="vertical">
          <Form.Item
            label="权限代码"
            name="code"
            rules={[
              { required: true, message: '请输入权限代码' },
              { pattern: /^[a-z_:]+$/, message: '只能包含小写字母、下划线和冒号' }
            ]}
            extra="例如: order:view, product:create"
          >
            <Input placeholder="例如: order:view" disabled={!!editingPermission} />
          </Form.Item>
          <Form.Item
            label="权限名称"
            name="name"
            rules={[{ required: true, message: '请输入权限名称' }]}
            extra="例如: 查看订单, 创建商品"
          >
            <Input placeholder="例如: 查看订单" />
          </Form.Item>
          <Form.Item
            label="所属分组"
            name="group"
            rules={[{ required: true, message: '请选择所属分组' }]}
          >
            <Select placeholder="请选择所属分组">
              {Object.keys(PERMISSION_GROUPS).map(group => (
                <Option key={group} value={group}>{group}</Option>
              ))}
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="权限描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

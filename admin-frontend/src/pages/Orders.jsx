import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, Select, Tag, message, DatePicker } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ShoppingCartOutlined, ExportOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'
import { PERMISSIONS } from '../config/permissions'

const { Option } = Select

export default function Orders() {
  const { api, hasPermission } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [form] = Form.useForm()

  // 加载订单数据
  const loadData = async () => {
    setLoading(true)
    try {
      // const res = await api.get('/api/admin/orders')
      // setData(res.data.data || [])
      
      // 模拟数据
      const mockData = [
        {
          id: 1,
          orderNo: 'ORD20240101001',
          userName: '张三',
          totalAmount: 299.00,
          status: 'PAID',
          createdAt: '2024-01-01 10:30:00'
        },
        {
          id: 2,
          orderNo: 'ORD20240101002',
          userName: '李四',
          totalAmount: 599.00,
          status: 'PENDING',
          createdAt: '2024-01-01 11:20:00'
        },
      ]
      setData(mockData)
    } catch (error) {
      message.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // 打开新建/编辑弹窗
  const handleOpenModal = (order = null) => {
    setEditingOrder(order)
    if (order) {
      form.setFieldsValue(order)
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 保存订单
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      console.log('保存订单:', values)
      // await api.post('/api/admin/orders', values)
      message.success(editingOrder ? '订单更新成功' : '订单创建成功')
      setModalVisible(false)
      loadData()
    } catch (error) {
      message.error('保存失败')
    }
  }

  // 删除订单
  const handleDelete = (order) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除订单 "${order.orderNo}" 吗？`,
      onOk: async () => {
        try {
          // await api.delete(`/api/admin/orders/${order.id}`)
          message.success('删除成功')
          loadData()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 导出订单
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  // 订单状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      PENDING: { color: 'orange', text: '待支付' },
      PAID: { color: 'green', text: '已支付' },
      SHIPPED: { color: 'blue', text: '已发货' },
      COMPLETED: { color: 'cyan', text: '已完成' },
      CANCELLED: { color: 'red', text: '已取消' },
    }
    const config = statusMap[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      width: 80 
    },
    { 
      title: '订单号', 
      dataIndex: 'orderNo',
      width: 180
    },
    { 
      title: '用户', 
      dataIndex: 'userName',
      width: 120
    },
    { 
      title: '订单金额', 
      dataIndex: 'totalAmount',
      width: 120,
      render: (amount) => `¥${amount.toFixed(2)}`
    },
    { 
      title: '状态', 
      dataIndex: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt',
      width: 180
    },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <Space>
          {hasPermission(PERMISSIONS.ORDER_EDIT) && (
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleOpenModal(record)}
            >
              编辑
            </Button>
          )}
          {hasPermission(PERMISSIONS.ORDER_DELETE) && (
            <Button 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      {/* 标题栏 */}
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
            📦 订单管理
          </h2>
          <Space>
            {hasPermission(PERMISSIONS.ORDER_EXPORT) && (
              <Button 
                size="large"
                icon={<ExportOutlined />}
                onClick={handleExport}
                style={{
                  borderRadius: '12px',
                  height: '48px',
                  fontWeight: '600'
                }}
              >
                导出订单
              </Button>
            )}
            {hasPermission(PERMISSIONS.ORDER_CREATE) && (
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
                新建订单
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* 订单列表 */}
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
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      {/* 新建/编辑弹窗 */}
      <Modal
        title={editingOrder ? '编辑订单' : '新建订单'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="订单号"
            name="orderNo"
            rules={[{ required: true, message: '请输入订单号' }]}
          >
            <Input placeholder="请输入订单号" />
          </Form.Item>
          <Form.Item
            label="用户名"
            name="userName"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="订单金额"
            name="totalAmount"
            rules={[{ required: true, message: '请输入订单金额' }]}
          >
            <Input type="number" placeholder="请输入订单金额" />
          </Form.Item>
          <Form.Item
            label="订单状态"
            name="status"
            rules={[{ required: true, message: '请选择订单状态' }]}
          >
            <Select placeholder="请选择订单状态">
              <Option value="PENDING">待支付</Option>
              <Option value="PAID">已支付</Option>
              <Option value="SHIPPED">已发货</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

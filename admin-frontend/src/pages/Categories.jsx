import React, { useEffect, useState, useCallback } from 'react'
import { Button, Modal, Form, Input, Space, Table, message, Card, Popconfirm } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'
import { PermissionCheck } from '../components/PermissionCheck'
import { PERMISSIONS } from '../config/permissions'

const { Search } = Input

export default function Categories() {
  const { api } = useAuth()
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [keyword, setKeyword] = useState('')

  const load = useCallback(async (page = 0, size = 20) => {
    setLoading(true)
    try {
      const params = {
        page,
        size,
        ...(keyword && { keyword })
      }
      const res = await api.get('/api/admin/categories', { params })
      if (res.data.code === 0) {
        const pageData = res.data.data
        setData({
          content: pageData.content || [],
          totalElements: pageData.totalElements || 0,
          totalPages: pageData.totalPages || 0
        })
        setPagination({
          current: page + 1,
          pageSize: size,
          total: pageData.totalElements || 0
        })
      }
    } catch (error) {
      console.error('加载分类列表失败', error)
    } finally {
      setLoading(false)
    }
  }, [keyword, api])

  useEffect(() => {
    load(0, pagination.pageSize)
  }, [keyword])

  const handleTableChange = (newPagination) => {
    load(newPagination.current - 1, newPagination.pageSize)
  }

  const handleSearch = (value) => {
    setKeyword(value)
  }

  const handleAdd = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const handleEdit = (record) => {
    setEditing(record)
    form.setFieldsValue(record)
    setOpen(true)
  }

  const handleCancel = () => {
    setOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await api.put(`/api/admin/categories/${editing.id}`, values)
        message.success('分类已更新')
      } else {
        await api.post('/api/admin/categories', values)
        message.success('分类已创建')
      }
      setOpen(false)
      setEditing(null)
      form.resetFields()
      load(pagination.current - 1, pagination.pageSize)
    } catch (error) {
      console.error('保存失败', error)
    }
  }

  const onDelete = async (record) => {
    try {
      await api.delete(`/api/admin/categories/${record.id}`)
      message.success('分类已删除')
      load(pagination.current - 1, pagination.pageSize)
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      width: 80,
      sorter: true
    },
    { 
      title: '名称', 
      dataIndex: 'name',
      ellipsis: true
    },
    { 
      title: '描述', 
      dataIndex: 'description',
      ellipsis: true
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt',
      width: 180,
      render: (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'
    },
    { 
      title: '更新时间', 
      dataIndex: 'updatedAt',
      width: 180,
      render: (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'
    },
    { 
      title: '操作', 
      width: 150,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <PermissionCheck permission={PERMISSIONS.CATEGORY_EDIT}>
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(r)}
            >
              编辑
            </Button>
          </PermissionCheck>
          <PermissionCheck permission={PERMISSIONS.CATEGORY_DELETE}>
            <Popconfirm
              title="确定要删除这个分类吗？"
              onConfirm={() => onDelete(r)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                size="small" 
                danger 
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          </PermissionCheck>
        </Space>
      )
    }
  ]

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Search
            placeholder="搜索分类（名称、描述）"
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <PermissionCheck permission={PERMISSIONS.CATEGORY_CREATE}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增分类
            </Button>
          </PermissionCheck>
          <Button onClick={() => load(pagination.current - 1, pagination.pageSize)}>刷新</Button>
        </Space>
        
        <Table
          rowKey="id"
          dataSource={data.content}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Space>

      <Modal
        title={editing ? '编辑分类' : '新增分类'}
        open={open}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          onFinish={onSubmit}
          layout="vertical"
          initialValues={editing || {}}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[
              { required: true, message: '请输入分类名称' },
              { max: 50, message: '分类名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[
              { max: 200, message: '描述不能超过200个字符' }
            ]}
          >
            <Input.TextArea 
              placeholder="请输入分类描述（可选）"
              rows={4}
              showCount
              maxLength={200}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editing ? '更新' : '创建'}
              </Button>
              <Button onClick={handleCancel}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

















import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Tooltip } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'

const CATEGORIES = [
  { label: '政治', value: '政治' },
  { label: '不雅', value: '不雅' },
  { label: '诈骗', value: '诈骗' },
  { label: '暴力', value: '暴力' },
  { label: '色情', value: '色情' },
  { label: '赌博', value: '赌博' },
  { label: '毒品', value: '毒品' },
  { label: '广告', value: '广告' },
  { label: '人身', value: '人身' },
  { label: '违法', value: '违法' }
]

const SEVERITY_COLORS = {
  'HIGH': 'red',
  'MEDIUM': 'orange',
  'LOW': 'green'
}

const SEVERITY_TEXT = {
  'HIGH': '高',
  'MEDIUM': '中',
  'LOW': '低'
}

export default function BannedWords() {
  const { api } = useAuth()
  const [loading, setLoading] = useState(false)
  const [words, setWords] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [searchText, setSearchText] = useState('')
  const [filterCategory, setFilterCategory] = useState(undefined)
  const [filterActive, setFilterActive] = useState(undefined)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWord, setEditingWord] = useState(null)
  const [form] = Form.useForm()

  // 加载违禁词列表
  const loadWords = async (pageNum = 1, pageSize = 20, category = undefined, isActive = undefined) => {
    setLoading(true)
    try {
      const params = { pageNum, pageSize }
      if (category) params.category = category
      if (isActive !== undefined) params.isActive = isActive
      
      const res = await api.get('/api/admin/banned-words', { params })
      if (res.data.code === 0) {
        const data = res.data.data
        setWords(data.records || [])
        setPagination({
          current: data.current,
          pageSize: data.size,
          total: data.total
        })
      }
    } catch (error) {
      console.error('加载违禁词失败', error)
      message.error('加载违禁词失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWords(pagination.current, pagination.pageSize, filterCategory, filterActive)
  }, [])

  const handleAdd = () => {
    setEditingWord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingWord(record)
    form.setFieldsValue({
      word: record.word,
      category: record.category,
      severity: record.severity,
      isActive: record.isActive,
      remark: record.remark
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingWord) {
        // 编辑
        const res = await api.put(`/api/admin/banned-words/${editingWord.id}`, values)
        if (res.data.code === 0) {
          message.success('违禁词已更新')
          setModalOpen(false)
          loadWords(pagination.current, pagination.pageSize, filterCategory, filterActive)
        }
      } else {
        // 新增
        const res = await api.post('/api/admin/banned-words', values)
        if (res.data.code === 0) {
          message.success('违禁词已添加')
          setModalOpen(false)
          loadWords(1, pagination.pageSize, filterCategory, filterActive)
        } else if (res.data.code === 400) {
          message.error(res.data.msg || '违禁词已存在')
        }
      }
    } catch (error) {
      console.error('保存失败', error)
      message.error('保存失败')
    }
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '删除违禁词',
      content: `确定删除"${record.word}"吗？`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await api.delete(`/api/admin/banned-words/${record.id}`)
          if (res.data.code === 0) {
            message.success('违禁词已删除')
            loadWords(pagination.current, pagination.pageSize, filterCategory, filterActive)
          }
        } catch (error) {
          console.error('删除失败', error)
          message.error('删除失败')
        }
      }
    })
  }

  const handleToggle = async (record) => {
    try {
      const res = await api.post(`/api/admin/banned-words/${record.id}/toggle`, {
        isActive: !record.isActive
      })
      if (res.data.code === 0) {
        message.success(record.isActive ? '已禁用' : '已启用')
        loadWords(pagination.current, pagination.pageSize, filterCategory, filterActive)
      }
    } catch (error) {
      console.error('状态切换失败', error)
      message.error('状态切换失败')
    }
  }

  const handleTableChange = (newPagination) => {
    loadWords(newPagination.current, newPagination.pageSize, filterCategory, filterActive)
  }

  const handleSearch = () => {
    loadWords(1, pagination.pageSize, filterCategory, filterActive)
  }

  const handleReset = () => {
    setSearchText('')
    setFilterCategory(undefined)
    setFilterActive(undefined)
    loadWords(1, pagination.pageSize, undefined, undefined)
  }

  const columns = [
    {
      title: '违禁词',
      dataIndex: 'word',
      width: 120,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (text) => {
        const colors = {
          '政治': 'red',
          '不雅': 'orange',
          '诈骗': 'red',
          '暴力': 'red',
          '色情': 'red',
          '赌博': 'volcano',
          '毒品': 'red',
          '广告': 'blue',
          '人身': 'orange',
          '违法': 'red'
        }
        return <Tag color={colors[text] || 'default'}>{text}</Tag>
      }
    },
    {
      title: '严重级别',
      dataIndex: 'severity',
      width: 100,
      render: (text) => (
        <Tag color={SEVERITY_COLORS[text]}>
          {SEVERITY_TEXT[text]}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (text) => (
        <Tag color={text ? 'green' : 'red'}>
          {text ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type={record.isActive ? 'default' : 'dashed'}
            size="small"
            onClick={() => handleToggle(record)}
          >
            {record.isActive ? '禁用' : '启用'}
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Card 
      title="违禁词管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加违禁词
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 搜索和筛选 */}
        <Space style={{ background: '#fafafa', padding: '12px', borderRadius: '4px', width: '100%' }}>
          <Input
            placeholder="搜索违禁词..."
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="筛选分类"
            style={{ width: 150 }}
            value={filterCategory}
            onChange={setFilterCategory}
            allowClear
            options={CATEGORIES}
          />
          <Select
            placeholder="筛选状态"
            style={{ width: 120 }}
            value={filterActive}
            onChange={setFilterActive}
            allowClear
            options={[
              { label: '启用', value: true },
              { label: '禁用', value: false }
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button onClick={handleReset}>
            重置
          </Button>
        </Space>

        {/* 说明 */}
        <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '4px', border: '1px solid #91d5ff' }}>
          <strong>说明：</strong>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
            • 添加的违禁词会自动应用于评论内容过滤
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
            • 违禁词列表每5分钟自动刷新缓存，无需重启服务
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
            • 可以启用/禁用违禁词，而不必删除，方便后续恢复
          </p>
        </div>

        {/* 表格 */}
        <Table
          rowKey="id"
          dataSource={words}
          columns={columns}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
            showTotal: (total) => `共 ${total} 条`
          }}
          onChange={handleTableChange}
          scroll={{ x: true }}
        />
      </Space>

      {/* 编辑/新增模态框 */}
      <Modal
        title={editingWord ? '编辑违禁词' : '添加违禁词'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="违禁词"
            name="word"
            rules={[{ required: true, message: '请输入违禁词' }]}
          >
            <Input 
              placeholder="输入违禁词" 
              disabled={editingWord !== null}
            />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="选择分类" options={CATEGORIES} />
          </Form.Item>

          <Form.Item
            label="严重级别"
            name="severity"
            rules={[{ required: true, message: '请选择严重级别' }]}
            initialValue="MEDIUM"
          >
            <Select
              options={[
                { label: '高', value: 'HIGH' },
                { label: '中', value: 'MEDIUM' },
                { label: '低', value: 'LOW' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="是否启用"
            name="isActive"
            rules={[{ required: true, message: '请选择是否启用' }]}
            initialValue={true}
          >
            <Select
              options={[
                { label: '启用', value: true },
                { label: '禁用', value: false }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea
              rows={3}
              placeholder="输入备注信息（可选）"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

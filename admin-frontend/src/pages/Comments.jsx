import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Space, 
  Tag, 
  Popconfirm,
  Divider,
  Typography
} from 'antd'
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

export default function Comments() {
  const { api } = useAuth()
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState(null)
  const [form] = Form.useForm()

  // 加载评论列表
  const loadComments = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const res = await api.get(`/api/admin/comments/list?pageNum=${page}&pageSize=${pageSize}`)
      if (res.data.code === 0) {
        setComments(res.data.data.records || [])
        setPagination({
          current: res.data.data.current,
          pageSize: res.data.data.size,
          total: res.data.data.total
        })
      } else {
        message.error(res.data.message || '加载评论失败')
      }
    } catch (error) {
      console.error('加载评论失败', error)
      message.error('加载评论失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [])

  const handleTableChange = (pagination) => {
    loadComments(pagination.current, pagination.pageSize)
  }

  const handleDelete = async (commentId) => {
    try {
      const res = await api.delete(`/api/admin/comments/${commentId}`, {
        data: { reason: '内容违规' }
      })
      
      if (res.data.code === 0) {
        message.success('评论已删除')
        loadComments(pagination.current, pagination.pageSize)
      } else {
        message.error(res.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除评论失败', error)
      message.error('删除评论失败')
    }
  }

  const handleViewDetail = (record) => {
    setSelectedComment(record)
    setDetailModalOpen(true)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80
    },
    {
      title: '用户',
      dataIndex: 'user',
      width: 150,
      render: (user) => user?.nickname || user?.username || '未知用户'
    },
    {
      title: '内容',
      dataIndex: 'content',
      render: (content) => (
        <Text ellipsis={{ tooltip: content }} style={{ maxWidth: 200 }}>
          {content}
        </Text>
      )
    },
    {
      title: '商品',
      dataIndex: 'product',
      render: (product) => product?.name || '未知商品'
    },
    {
      title: '类型',
      dataIndex: 'parentId',
      width: 100,
      render: (parentId) => (
        <Tag color={parentId === 0 ? 'blue' : 'green'}>
          {parentId === 0 ? '一级评论' : '回复'}
        </Tag>
      )
    },
    {
      title: '点赞数',
      dataIndex: 'likes',
      width: 80
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (createdAt) => new Date(createdAt).toLocaleString()
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Popconfirm
            title="确定要删除这条评论吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Card title="评论管理">
      <Table
        rowKey="id"
        dataSource={comments}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
      
      <Modal
        title="评论详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedComment && (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>用户：</Text>
              <Text>{selectedComment.user?.nickname || selectedComment.user?.username || '未知用户'}</Text>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>商品：</Text>
              <Text>{selectedComment.product?.name || '未知商品'}</Text>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>内容：</Text>
              <TextArea 
                value={selectedComment.content} 
                autoSize 
                readOnly 
                style={{ marginTop: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>类型：</Text>
              <Tag color={selectedComment.parentId === 0 ? 'blue' : 'green'}>
                {selectedComment.parentId === 0 ? '一级评论' : '回复'}
              </Tag>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>点赞数：</Text>
              <Text>{selectedComment.likes}</Text>
            </div>
            <div>
              <Text strong>创建时间：</Text>
              <Text>{new Date(selectedComment.createdAt).toLocaleString()}</Text>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  )
}
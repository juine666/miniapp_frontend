import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, InputNumber, Divider, Tabs } from 'antd'
import { EditOutlined, SaveOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'

const { Option } = Select
const { TabPane } = Tabs

export default function SystemConfig() {
  const { api } = useAuth()
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState({})
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [activeTab, setActiveTab] = useState('oss')
  const [form] = Form.useForm()
  
  const groupOptions = [
    { label: 'OSS 配置', value: 'oss' },
    { label: '微信配置', value: 'wechat' },
    { label: '服务器配置', value: 'server' },
    { label: '腾讯云配置', value: 'tencent' },
    { label: '邮件配置', value: 'email' },
    { label: '短信配置', value: 'sms' }
  ]
  
  // 加载所有配置
  const loadAllConfigs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/system-config/all')
      if (res.data.code === 0) {
        setConfigs(res.data.data || {})
      }
    } catch (error) {
      console.error('加载配置失败', error)
      message.error('加载配置失败')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadAllConfigs()
  }, [])
  
  const handleEdit = (record) => {
    setEditingConfig(record)
    form.setFieldsValue({
      configKey: record.configKey,
      configValue: record.configValue,
      description: record.description,
      groupName: record.groupName,
      isSensitive: record.isSensitive
    })
    setEditModalOpen(true)
  }
  
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const res = await api.put('/api/admin/system-config', {
        configKey: values.configKey,
        configValue: values.configValue,
        description: values.description,
        groupName: values.groupName,
        isSensitive: values.isSensitive
      })
      
      if (res.data.code === 0) {
        message.success('配置已保存')
        setEditModalOpen(false)
        loadAllConfigs()
      }
    } catch (error) {
      console.error('保存配置失败', error)
      message.error('保存配置失败')
    }
  }
  
  const columns = [
    {
      title: '配置项',
      dataIndex: 'configKey',
      width: 200
    },
    {
      title: '配置值',
      dataIndex: 'configValue',
      width: 300,
      render: (value, record) => {
        if (record.isSensitive) {
          return <span style={{ color: '#999' }}>***敏感信息***</span>
        }
        return value || '-'
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      )
    }
  ]
  
  return (
    <Card title="系统配置管理">
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
      >
        {Object.keys(configs).map(groupName => {
          const groupLabel = groupOptions.find(opt => opt.value === groupName)?.label || groupName
          return (
            <TabPane tab={groupLabel} key={groupName}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ background: '#f0f2f5', padding: '12px', borderRadius: '4px' }}>
                  <strong>{groupLabel}说明：</strong>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                    • 在下方表格中编辑{groupLabel}相关配置
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                    • 敏感信息（如密钥、密码等）不会明文显示，但可以更新
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                    • 配置优先级：数据库 &gt; 环境变量 &gt; 默认值
                  </p>
                </div>
                
                <Table
                  rowKey="configKey"
                  dataSource={configs[groupName] || []}
                  columns={columns}
                  loading={loading}
                  pagination={false}
                />
              </Space>
            </TabPane>
          )
        })}
      </Tabs>
      
      <Modal
        title="编辑配置"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSave}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="配置项" name="configKey" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item 
            label="配置值" 
            name="configValue"
            rules={[{ required: true, message: '请输入配置值' }]}
          >
            <Input.TextArea rows={4} placeholder="输入配置值" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input placeholder="输入配置描述" />
          </Form.Item>
          <Form.Item label="分组" name="groupName">
            <Input disabled />
          </Form.Item>
          <Form.Item label="敏感信息" name="isSensitive" valuePropName="checked">
            <Select disabled>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
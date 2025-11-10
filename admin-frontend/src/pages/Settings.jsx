import React, { useState } from 'react'
import { Card, Form, Input, Button, Space, ColorPicker, Select, Divider, message } from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTheme } from '../components/ThemeProvider'
import { PRESET_THEMES, DEFAULT_THEME } from '../config/theme'
import { useAuth } from '../auth/AuthContext'
import { PERMISSIONS } from '../config/permissions'
import { PermissionCheck } from '../components/PermissionCheck'

const { Option } = Select

export default function Settings() {
  const { theme, setTheme, setPresetTheme, resetTheme } = useTheme()
  const { hasPermission } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    form.setFieldsValue(theme)
  }, [theme, form])

  const handlePresetChange = (value) => {
    setPresetTheme(value)
    message.success('主题已切换')
  }

  const handleReset = () => {
    resetTheme()
    form.setFieldsValue(DEFAULT_THEME)
    message.success('主题已重置')
  }

  const handleSave = async (values) => {
    setLoading(true)
    try {
      setTheme(values)
      message.success('主题已保存')
    } catch (error) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="系统设置">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 主题配置 */}
        <Card title="主题配置" size="small">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={theme}
          >
            <Form.Item label="预设主题">
              <Select
                defaultValue="default"
                onChange={handlePresetChange}
                style={{ width: 200 }}
              >
                {Object.keys(PRESET_THEMES).map(key => (
                  <Option key={key} value={key}>{PRESET_THEMES[key].name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Divider>自定义颜色</Divider>

            <Form.Item label="主色调" name="primaryColor">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="侧边栏背景色" name="siderBg">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="侧边栏文字颜色" name="siderTextColor">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="侧边栏选中背景色" name="siderSelectedBg">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="头部背景色" name="headerBg">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="头部文字颜色" name="headerTextColor">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="内容区背景色" name="contentBg">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="卡片背景色" name="cardBg">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="文字颜色" name="textColor">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="次要文字颜色" name="textSecondaryColor">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item label="边框颜色" name="borderColor">
              <ColorPicker showText format="hex" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  保存
                </Button>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* 权限信息 */}
        <PermissionCheck permission={PERMISSIONS.SYSTEM_CONFIG}>
          <Card title="权限信息" size="small">
            <p>当前用户权限：{hasPermission(PERMISSIONS.SYSTEM_CONFIG) ? '有系统配置权限' : '无系统配置权限'}</p>
          </Card>
        </PermissionCheck>
      </Space>
    </Card>
  )
}


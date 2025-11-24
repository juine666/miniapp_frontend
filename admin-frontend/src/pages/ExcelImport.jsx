import React, { useState } from 'react'
import {
  Card,
  Button,
  Upload,
  Table,
  message,
  Modal,
  Space,
  Tabs,
  Tag,
  Alert,
  Steps,
  Divider,
  Form,
  Select,
  InputNumber
} from 'antd'
import {
  UploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import axios from 'axios'

const ExcelImport = () => {
  const [fileList, setFileList] = useState([])
  const [sheetData, setSheetData] = useState([])
  const [sheetNames, setSheetNames] = useState([])
  const [activeSheet, setActiveSheet] = useState(0)
  const [importType, setImportType] = useState('products')
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [importProgress, setImportProgress] = useState(null)
  const [columnMapping, setColumnMapping] = useState({})
  const [form] = Form.useForm()

  // 处理文件上传
  const handleFileChange = (info) => {
    const file = info.file
    
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        const names = workbook.SheetNames
        setSheetNames(names)
        
        // 读取第一个sheet
        const firstSheet = workbook.Sheets[names[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        
        // 提取列名
        const cols = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
        setColumns(cols)
        setSheetData(jsonData)
        setActiveSheet(0)
        
        message.success('Excel 文件读取成功')
      } catch (error) {
        message.error('Excel 文件读取失败：' + error.message)
      }
    }
    
    reader.readAsArrayBuffer(file)
    setFileList([file])
  }

  // 处理Sheet切换
  const handleSheetChange = (sheetIndex) => {
    setActiveSheet(sheetIndex)
    
    const workbook = XLSX.read(fileList[0], { type: 'array' })
    const sheet = workbook.Sheets[sheetNames[sheetIndex]]
    const jsonData = XLSX.utils.sheet_to_json(sheet)
    
    const cols = jsonData.length > 0 ? Object.keys(jsonData[0]) : []
    setColumns(cols)
    setSheetData(jsonData)
  }

  // 验证导入数据
  const validateData = () => {
    const errors = []
    
    sheetData.forEach((row, index) => {
      if (importType === 'products') {
        if (!row.name || !row.price) {
          errors.push(`第 ${index + 2} 行：商品名称或价格缺失`)
        }
        if (row.price && isNaN(parseFloat(row.price))) {
          errors.push(`第 ${index + 2} 行：价格必须是数字`)
        }
      }
    })
    
    return errors
  }

  // 执行导入
  const handleImport = async () => {
    const errors = validateData()
    
    if (errors.length > 0) {
      Modal.error({
        title: '数据验证失败',
        content: (
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {errors.map((err, idx) => (
              <div key={idx} style={{ color: 'red', marginBottom: 8 }}>
                {err}
              </div>
            ))}
          </div>
        )
      })
      return
    }

    Modal.confirm({
      title: '确认导入',
      icon: <ExclamationCircleOutlined />,
      content: `即将导入 ${sheetData.length} 条数据，是否继续？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        await executeImport()
      }
    })
  }

  const executeImport = async () => {
    setLoading(true)
    setImportProgress({
      total: sheetData.length,
      current: 0,
      success: 0,
      failed: 0,
      errors: []
    })

    try {
      const batchSize = 10
      
      for (let i = 0; i < sheetData.length; i += batchSize) {
        const batch = sheetData.slice(i, i + batchSize)
        
        try {
          const response = await axios.post('/api/admin/excel-import', {
            type: importType,
            data: batch
          }, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          })

          setImportProgress(prev => ({
            ...prev,
            current: i + batch.length,
            success: prev.success + (response.data.successCount || batch.length)
          }))
        } catch (error) {
          const errorMsg = error.response?.data?.message || error.message
          setImportProgress(prev => ({
            ...prev,
            current: i + batch.length,
            failed: prev.failed + batch.length,
            errors: [...prev.errors, errorMsg]
          }))
        }
      }

      message.success('导入完成')
    } catch (error) {
      message.error('导入过程出错：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // 导出模板
  const handleExportTemplate = () => {
    const template = {
      products: [
        { name: '商品名称', price: 99.99, category: '分类', description: '商品描述', stock: 100 },
        { name: '商品名称2', price: 199.99, category: '分类2', description: '商品描述2', stock: 50 }
      ],
      users: [
        { username: '用户名', email: 'email@example.com', phone: '13800000000', role: 'USER' },
        { username: '用户名2', email: 'email2@example.com', phone: '13800000001', role: 'USER' }
      ],
      orders: [
        { orderId: 'ORD001', userId: '1', total: 299.99, status: 'COMPLETED', createdAt: '2024-01-01' },
        { orderId: 'ORD002', userId: '2', total: 199.99, status: 'PENDING', createdAt: '2024-01-02' }
      ]
    }

    const data = template[importType] || template.products
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, importType)
    XLSX.writeFile(workbook, `${importType}_template.xlsx`)
    message.success('模板已下载')
  }

  const uploadProps = {
    accept: '.xlsx,.xls,.csv',
    beforeUpload: (file) => {
      handleFileChange({ file })
      return false
    },
    onRemove: () => {
      setFileList([])
      setSheetData([])
      setColumns([])
      setSheetNames([])
      setColumnMapping({})
    }
  }

  const tableColumns = columns.map(col => ({
    title: col,
    dataIndex: col,
    key: col,
    width: 150,
    ellipsis: true,
    render: (text) => {
      if (text === null || text === undefined) {
        return <Tag color="red">缺失</Tag>
      }
      return String(text)
    }
  }))

  const tableData = sheetData.map((row, index) => ({
    ...row,
    key: index
  }))

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Excel 数据导入"
        extra={
          <Space>
            <Select
              value={importType}
              onChange={setImportType}
              style={{ width: 150 }}
              options={[
                { label: '导入商品', value: 'products' },
                { label: '导入用户', value: 'users' },
                { label: '导入订单', value: 'orders' }
              ]}
            />
            <Button onClick={handleExportTemplate} type="dashed">
              下载模板
            </Button>
          </Space>
        }
      >
        <Divider>第一步：选择文件</Divider>
        
        <Upload {...uploadProps} fileList={fileList}>
          <Button icon={<UploadOutlined />}>
            选择 Excel 文件
          </Button>
        </Upload>

        {fileList.length > 0 && (
          <>
            <Divider>第二步：选择数据表</Divider>
            
            {sheetNames.length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <Space>
                  {sheetNames.map((name, idx) => (
                    <Button
                      key={idx}
                      type={activeSheet === idx ? 'primary' : 'default'}
                      onClick={() => handleSheetChange(idx)}
                    >
                      {name}
                    </Button>
                  ))}
                </Space>
              </div>
            )}

            <Divider>第三步：预览数据</Divider>
            
            <Alert
              message={`已读取 ${sheetData.length} 行数据，${columns.length} 列`}
              type="info"
              style={{ marginBottom: 16 }}
            />

            <div style={{ maxHeight: '400px', overflow: 'auto', marginBottom: 16 }}>
              <Table
                columns={tableColumns}
                dataSource={tableData}
                pagination={{ pageSize: 10 }}
                size="small"
                scroll={{ x: 'max-content' }}
              />
            </div>

            <Divider>第四步：导入</Divider>
            
            <Space style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleImport}
                loading={loading}
                disabled={sheetData.length === 0}
              >
                开始导入
              </Button>
              <Button
                danger
                onClick={() => {
                  setFileList([])
                  setSheetData([])
                  setColumns([])
                  setSheetNames([])
                }}
              >
                清空
              </Button>
            </Space>

            {importProgress && (
              <Card
                title="导入进度"
                style={{ marginTop: 16 }}
                type="inner"
              >
                <Steps
                  current={importProgress.current}
                  status={importProgress.current === importProgress.total ? 'finish' : 'process'}
                  percent={Math.round((importProgress.current / importProgress.total) * 100)}
                />
                
                <div style={{ marginTop: 16, display: 'flex', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#999' }}>总计</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                      {importProgress.total}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#52c41a' }}>成功</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                      {importProgress.success}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#ff4d4f' }}>失败</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f' }}>
                      {importProgress.failed}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#1890ff' }}>进度</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                      {Math.round((importProgress.current / importProgress.total) * 100)}%
                    </div>
                  </div>
                </div>

                {importProgress.errors.length > 0 && (
                  <Alert
                    message="导入错误"
                    description={
                      <ul>
                        {importProgress.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    }
                    type="error"
                    style={{ marginTop: 16 }}
                    showIcon
                  />
                )}
              </Card>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

export default ExcelImport

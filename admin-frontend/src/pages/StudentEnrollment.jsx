import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Drawer,
  Row,
  Col,
  Divider,
  Tooltip,
  Alert
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  SearchOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { useAuth } from '../auth/AuthContext'

const StudentEnrollment = () => {
  const { api } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [form] = Form.useForm()
  const [editingRecord, setEditingRecord] = useState(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [exportDrawerVisible, setExportDrawerVisible] = useState(false)
  const [filterParams, setFilterParams] = useState({
    keyword: '',
    grade: '',
    motherBirthdaySort: '' // 母亲身份证年月日排序：'asc' 升序，'desc' 降序
  })
  const [selectedColumns, setSelectedColumns] = useState(getDefaultColumns())
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [importDrawerVisible, setImportDrawerVisible] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [gradeList, setGradeList] = useState([]) // 年级列表

  // 获取所有列选项
  const columnOptions = [
    { label: '教育机构名称', value: 'institutionName' },
    { label: '所属年级', value: 'grade' },
    { label: '班级名称', value: 'className' },
    { label: '班主任', value: 'teacherName' },
    { label: '儿童姓名', value: 'studentName' },
    { label: '儿童身份证号码', value: 'studentIdCard' },
    { label: '儿童出生年月日', value: 'birthDate' },
    { label: '性别', value: 'gender' },
    { label: '联系电话', value: 'contactPhone' },
    { label: '母亲姓名', value: 'motherName' },
    { label: '母亲身份证号码', value: 'motherIdCard' }
  ]

  // 默认导出列
  function getDefaultColumns() {
    return [
      'institutionName',
      'grade',
      'className',
      'teacherName',
      'studentName',
      'studentIdCard',
      'birthDate',
      'gender',
      'contactPhone',
      'motherName',
      'motherIdCard'
    ]
  }

  // 表格列定义
  const tableColumns = [
    {
      title: '学生姓名',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 120,
      align: 'center',
      render: (text) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{text}</span>
    },
    {
      title: '身份证号',
      dataIndex: 'studentIdCard',
      key: 'studentIdCard',
      width: 150,
      align: 'center',
      render: (text) => <span style={{ fontSize: 12, color: '#666' }}>{text}</span>
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 120,
      align: 'center',
      render: (text) => <span style={{ color: '#ff7a45', fontWeight: '500' }}>{text}</span>
    },
    {
      title: '家长姓名',
      dataIndex: 'motherName',
      key: 'motherName',
      width: 120,
      align: 'center'
    },
    {
      title: '家长身份证',
      dataIndex: 'motherIdCard',
      key: 'motherIdCard',
      width: 150,
      align: 'center',
      render: (text) => <span style={{ fontSize: 12, color: '#999' }}>{text || '-'}</span>
    },
    {
      title: '教育机构',
      dataIndex: 'institutionName',
      key: 'institutionName',
      width: 180,
      ellipsis: { showTitle: false },
      align: 'center',
      render: (text) => <Tooltip title={text}><span style={{ color: '#722ed1' }}>{text}</span></Tooltip>
    },
    {
      title: '班级',
      key: 'classInfo',
      width: 120,
      align: 'center',
      render: (_, record) => {
        // 合并年级和班级
        const classInfo = `${record.grade || ''}${record.className || ''}`
        return <span style={{ fontWeight: '500', color: '#13c2c2' }}>{classInfo || '-'}</span>
      }
    },
    {
      title: '班主任',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 100,
      align: 'center'
    },
    {
      title: '出生日期',
      dataIndex: 'birthDate',
      key: 'birthDate',
      width: 120,
      align: 'center',
      render: (text) => <span style={{ color: '#faad14' }}>{text || '-'}</span>
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      align: 'center',
      render: (text) => {
        const color = text === '男' ? 'blue' : text === '女' ? 'magenta' : 'default'
        return <Tag color={color} style={{ fontWeight: 'bold' }}>{text || '-'}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ borderRadius: '4px' }}>
            编辑
          </Button>
          <Popconfirm
            title="删除确认"
            description="确定要删除该学生信息吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: '4px' }}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 页面加载
  useEffect(() => {
    fetchData()
    // 获取所有年级列表
    if (data.length > 0) {
      const grades = [...new Set(data.map(item => item.grade).filter(Boolean))].sort()
      setGradeList(grades.map(grade => ({ label: grade, value: grade })))
    }
  }, [pagination.current, pagination.pageSize, filterParams])

  // 从后端 API 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/student-enrollment/page', {
        params: {
          pageNum: pagination.current,
          pageSize: pagination.pageSize,
          keyword: filterParams.keyword || undefined,
          grade: filterParams.grade || undefined,
          motherBirthdaySort: filterParams.motherBirthdaySort || undefined
        }
      })
      
      if (response.data?.code === 0) {
        const pageData = response.data.data
        setData(pageData.records || [])
        setPagination({
          current: pageData.current,
          pageSize: pageData.size,
          total: pageData.total
        })
      } else {
        message.error('加载数据失败')
      }
    } catch (error) {
      message.error('加载数据失败：' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 打开新增/编辑抽屉
  const handleOpenDrawer = (record = null) => {
    if (record) {
      form.setFieldsValue({
        ...record,
        birthDate: record.birthDate ? dayjs(record.birthDate) : null
      })
      setEditingRecord(record)
    } else {
      form.resetFields()
      setEditingRecord(null)
    }
    setDrawerVisible(true)
  }

  // 保存学生信息
  const handleSaveEnrollment = async (values) => {
    try {
      const payload = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null
      }

      let response
      if (editingRecord) {
        // 编辑
        response = await api.put(`/admin/student-enrollment/${editingRecord.id}`, payload)
        if (response.data?.code === 0) {
          message.success('修改成功')
        }
      } else {
        // 新增
        response = await api.post('/admin/student-enrollment', payload)
        if (response.data?.code === 0) {
          message.success('添加成功')
        }
      }

      setDrawerVisible(false)
      fetchData()
    } catch (error) {
      message.error('保存失败：' + (error.response?.data?.message || error.message))
    }
  }

  // 编辑
  const handleEdit = (record) => {
    handleOpenDrawer(record)
  }

  // 删除
  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/admin/student-enrollment/${id}`)
      if (response.data?.code === 0) {
        message.success('删除成功')
        fetchData()
      }
    } catch (error) {
      message.error('删除失败：' + (error.response?.data?.message || error.message))
    }
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的记录')
      return
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.post('/admin/student-enrollment/batch-delete', selectedRowKeys)
          if (response.data?.code === 0) {
            message.success('删除成功')
            setSelectedRowKeys([])
            fetchData()
          }
        } catch (error) {
          message.error('删除失败：' + (error.response?.data?.message || error.message))
        }
      }
    })
  }

  // 导出
  const handleExport = async () => {
    try {
      const response = await api.post('/admin/student-enrollment/export', {
        columns: selectedColumns
      }, { responseType: 'blob' })

      // 创建 blob 并下载
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', '学生登记表.xlsx')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      
      message.success('导出成功')
      setExportDrawerVisible(false)
    } catch (error) {
      message.error('导出失败：' + (error.response?.data?.message || error.message))
    }
  }

  // 导入
  const handleImport = () => {
    if (!importFile) {
      message.warning('请先选择文件')
      return
    }

    setImportLoading(true)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        
        // 读取所有原始行（不使用表头）
        const allRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        
        console.log('原始行数:', allRows.length)
        console.log('前 5 行数据:', allRows.slice(0, 5))
        
        // 跳过前两行说明，从第三行（索引为 2）读取表头
        const headerRowIndex = 2
        const headers = allRows[headerRowIndex]
        
        if (!headers || headers.length === 0) {
          message.warning('找不到表头行')
          setImportLoading(false)
          return
        }
        
        console.log('表头:', headers)
        
        // 从第四行（索引为 3）开始读取数据
        const dataRows = allRows.slice(headerRowIndex + 1)
        
        // 转换为对象数组
        const jsonData = dataRows.map(row => {
          const obj = {}
          headers.forEach((header, idx) => {
            if (header && !header.toString().includes('__EMPTY')) {
              // 移除 (必填) 标记
              const cleanHeader = header.toString().replace(/\(必填\)/g, '').trim()
              obj[cleanHeader] = row[idx] || ''
            }
          })
          return obj
        })
        
        console.log('转换后的数据:', jsonData.slice(0, 2))
        
        // 过滤掉空行、公式行和 [object Object] 行
        const actualData = jsonData.filter(row => {
          const values = Object.values(row)
          // 检查是否有有效的非空值
          const hasValidData = values.some(v => {
            const str = v?.toString().trim() || ''
            // 过滤掉 [object Object]、空字符串、公式标记等
            return str && str !== '[object Object]' && !str.includes('[Formula:') && str.length > 0
          })
          return hasValidData
        })
        
        console.log('清理空行后有', actualData.length, '条有效数据')
        console.log('实际第一行数据:', actualData[0])

        // 创建列名映射函数，处理带括号的列名
        const getColumnValue = (row, columnNames) => {
          for (const name of columnNames) {
            // 不完全匹配，只需要匹配主要部分
            for (const key of Object.keys(row)) {
              if (key.includes(name) || name.includes(key.split('(')[0].trim())) {
                return row[key]
              }
            }
          }
          return ''
        }

        // 验证必填字段 - 更宽松的验证，忽略 EMPTY 列
        const errors = []
        actualData.forEach((row, index) => {
          // 过滤掉只有 EMPTY 列的行
          const nonEmptyValues = Object.entries(row)
            .filter(([key, val]) => !key.includes('EMPTY') && val && val.toString().trim())
            .map(([, val]) => val)
          
          if (nonEmptyValues.length === 0) {
            return // 跳过空行
          }
          
          // 获取学生姓名
          const studentName = getColumnValue(row, ['儿童姓名', '学生姓名', 'studentName', '姓名', 'name'])
          // 获取教育机构
          const institutionName = getColumnValue(row, ['教育机构名称', '教育机构', '机构名称', 'institutionName', 'institution'])
          
          if (!studentName || studentName.toString().trim() === '') {
            errors.push(`第 ${index + 4} 行：缺少学生姓名`)
          }
          if (!institutionName || institutionName.toString().trim() === '') {
            errors.push(`第 ${index + 4} 行：缺少教育机构名称`)
          }
        })

        if (errors.length > 0) {
          Modal.error({
            title: '导入数据验证失败',
            content: (
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                <p style={{ marginBottom: 16, color: '#666' }}>检测到的 Excel 列名：</p>
                <div style={{ marginBottom: 16, padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
                  {Object.keys(actualData[0] || {})
                    .filter(key => !key.includes('EMPTY'))
                    .map((key, idx) => (
                    <div key={idx}>{key}</div>
                  ))}
                </div>
                <p style={{ marginBottom: 16, fontWeight: 'bold', color: 'red' }}>验证错误：</p>
                {errors.map((err, idx) => (
                  <div key={idx} style={{ color: 'red', marginBottom: 8 }}>
                    {err}
                  </div>
                ))}
              </div>
            )
          })
          setImportLoading(false)
          return
        }

        // 确认导入
        Modal.confirm({
          title: '确认导入',
          content: `即将导入 ${actualData.length} 条学生信息，是否继续？`,
          okText: '确定',
          cancelText: '取消',
          onOk: async () => {
            try {
              // 日期格式转换函数
              const normalizeDateFormat = (dateStr) => {
                if (!dateStr) return ''
                dateStr = dateStr.toString().trim()
                
                // 处理 Excel 序列号格式（纯数字且大于等于 30000）
                if (/^\d+$/.test(dateStr)) {
                  const num = parseInt(dateStr, 10)
                  if (num > 1000 && num < 100000) { // Excel 日期范围
                    try {
                      // Excel 日期从 1900-01-01 开始（序列号 1）
                      const baseDate = new Date(1900, 0, 1)
                      const excelDate = new Date(baseDate.getTime() + (num - 2) * 24 * 60 * 60 * 1000)
                      const year = excelDate.getFullYear()
                      const month = String(excelDate.getMonth() + 1).padStart(2, '0')
                      const day = String(excelDate.getDate()).padStart(2, '0')
                      return `${year}-${month}-${day}`
                    } catch (e) {
                      console.error('Excel 日期转换失败:', dateStr, e)
                      return dateStr
                    }
                  }
                }
                
                // 处理多种日期格式
                if (dateStr.includes('.')) {
                  // 2018.10.22 -> 2018-10-22
                  return dateStr.replace(/\./g, '-')
                } else if (dateStr.includes('/')) {
                  // 2018/10/22 -> 2018-10-22
                  return dateStr.replace(/\//g, '-')
                } else if (/^\d{8}$/.test(dateStr)) {
                  // 20181022 -> 2018-10-22
                  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
                }
                return dateStr
              }

              // 映射 Excel 列到数据库字段
              const mappedData = actualData.map(row => {
                const gender = getColumnValue(row, ['性别', 'gender', 'sex'])
                // 处理 [object Object] 的情况
                const genderStr = gender?.toString().trim() === '[object Object]' ? '' : (gender?.toString().trim() || '')
                              
                return {
                  institutionName: getColumnValue(row, ['教育机构名称', '教育机构', '机构名称', 'institutionName']),
                  grade: getColumnValue(row, ['所属年级', '年级', 'grade']),
                  className: getColumnValue(row, ['班级名称', '班级', 'className', 'class']),
                  teacherName: getColumnValue(row, ['班主任', '班主任名', 'teacherName', 'teacher']),
                  studentName: getColumnValue(row, ['儿童姓名', '学生姓名', 'studentName', '姓名']),
                  studentIdCard: getColumnValue(row, ['儿童身份证', '身份证', 'studentIdCard', 'idcard']),
                  birthDate: normalizeDateFormat(getColumnValue(row, ['儿童出生年月日', '出生年月日', 'birthDate'])),
                  gender: genderStr,
                  contactPhone: getColumnValue(row, ['联系电话', '电话', 'contactPhone', 'phone']),
                  motherName: getColumnValue(row, ['母了姓名', 'motherName']),
                  motherIdCard: getColumnValue(row, ['母予身份证', 'motherIdCard'])
                }
              })
              .filter(item => item.studentName && item.institutionName) // 再次过滤空数据

              // 使用后端导入接口，直接上传文件
              const formData = new FormData()
              formData.append('file', importFile)
              const response = await api.post('/api/admin/student-enrollment/import', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
              
              if (response.data?.code === 0) {
                const result = response.data.data
                message.success(`成功导入 ${result.imported} 条记录，跳过 ${result.skipped || 0} 条重复记录`)
                if (result.errors) {
                  Modal.warning({
                    title: '导入完成（部分失败）',
                    content: (
                      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{result.errors}</p>
                      </div>
                    )
                  })
                }
              } else {
                message.error(response.data?.message || '导入失败')
              }
              
              setImportFile(null)
              setImportDrawerVisible(false)
              fetchData()
            } catch (error) {
              message.error('导入失败：' + (error.response?.data?.message || error.message))
            } finally {
              setImportLoading(false)
            }
          },
          onCancel: () => {
            setImportLoading(false)
          }
        })
      } catch (error) {
        message.error('Excel 文件读取失败：' + error.message)
        setImportLoading(false)
      }
    }

    reader.readAsArrayBuffer(importFile)
  }

  // 获取列标签
  function getColumnLabel(column) {
    const option = columnOptions.find(opt => opt.value === column)
    return option ? option.label : column
  }

  // 重置搜索
  const handleResetSearch = () => {
    setFilterParams({ keyword: '', grade: '', motherBirthdaySort: '' })
    setPagination({ current: 1, pageSize: 10, total: 0 })
  }

  // 表格行选择
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="学生登记管理"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDrawer()}>
              新增学生
            </Button>
            <Button danger onClick={handleBatchDelete} disabled={selectedRowKeys.length === 0}>
              批量删除
            </Button>
            <Button icon={<ExportOutlined />} onClick={() => setExportDrawerVisible(true)}>
              导出
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => setImportDrawerVisible(true)}>
              导入
            </Button>
          </Space>
        }
      >
        <Alert
          message="提示：此页面已连接后端 API 服务。"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 搜索区域 */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="搜索学生姓名、身份证或电话"
                value={filterParams.keyword}
                onChange={(e) => setFilterParams({ ...filterParams, keyword: e.target.value })}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="按年级筛选"
                value={filterParams.grade || undefined}
                onChange={(value) => setFilterParams({ ...filterParams, grade: value || '' })}
                options={[
                  { label: '所有年级', value: '' },
                  ...gradeList
                ]}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="按母亲身份证年月日排序"
                value={filterParams.motherBirthdaySort || undefined}
                onChange={(value) => setFilterParams({ ...filterParams, motherBirthdaySort: value || '' })}
                options={[
                  { label: '不排序', value: '' },
                  { label: '升序（年龄大的在前）', value: 'asc' },
                  { label: '降序（年龄小的在前）', value: 'desc' }
                ]}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Button type="primary" onClick={() => setPagination({ ...pagination, current: 1 })}>
                  搜索
                </Button>
                <Button onClick={handleResetSearch}>重置</Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 表格 */}
        <Table
          columns={tableColumns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={(page) => {
            setPagination({
              current: page.current,
              pageSize: page.pageSize,
              total: pagination.total
            })
          }}
          scroll={{ x: 'max-content' }}
          style={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          rowClassName={(_, index) => index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
          size="large"
        />
        <style>{`
          .table-row-even {
            background-color: #fafafa;
          }
          .table-row-odd {
            background-color: #ffffff;
          }
          .ant-table-thead > tr > th {
            background-color: #1890ff !important;
            color: white !important;
            font-weight: bold !important;
            text-align: center !important;
          }
          .ant-table-thead > tr > th::before {
            display: none !important;
          }
        `}</style>
      </Card>

      {/* 新增/编辑抽屉 */}
      <Drawer
        title={editingRecord ? '编辑学生信息' : '添加学生信息'}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveEnrollment}>
          <Form.Item label="教育机构" name="institutionName" rules={[{ required: true, message: '请输入教育机构名称' }]}>
            <Input placeholder="例：华中师大一附中光谷汤逊湖学校（北校区）" />
          </Form.Item>

          <Form.Item label="所属年级" name="grade" rules={[{ required: true, message: '请输入所属年级' }]}>
            <Input placeholder="例：一年级" />
          </Form.Item>

          <Form.Item label="班级名称" name="className" rules={[{ required: true, message: '请输入班级名称' }]}>
            <Input placeholder="例：二班" />
          </Form.Item>

          <Form.Item label="班主任" name="teacherName">
            <Input placeholder="请输入班主任名称" />
          </Form.Item>

          <Divider>学生信息</Divider>

          <Form.Item label="学生姓名" name="studentName" rules={[{ required: true, message: '请输入学生姓名' }]}>
            <Input placeholder="请输入学生姓名" />
          </Form.Item>

          <Form.Item
            label="身份证号码"
            name="studentIdCard"
            rules={[
              { required: true, message: '请输入身份证号码' },
              { len: 18, message: '身份证号码长度必须为18位' }
            ]}
          >
            <Input placeholder="请输入身份证号码" />
          </Form.Item>

          <Form.Item label="出生年月日" name="birthDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="性别" name="gender">
            <Select placeholder="选择性别" options={[{ label: '男', value: '男' }, { label: '女', value: '女' }]} />
          </Form.Item>

          <Form.Item label="联系电话" name="contactPhone">
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Divider>母亲信息</Divider>

          <Form.Item label="母亲姓名" name="motherName">
            <Input placeholder="请输入母亲姓名" />
          </Form.Item>

          <Form.Item label="母亲身份证号码" name="motherIdCard">
            <Input placeholder="请输入母亲身份证号码" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setDrawerVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 导出列选择抽屉 */}
      <Drawer
        title="选择导出列"
        placement="right"
        onClose={() => setExportDrawerVisible(false)}
        open={exportDrawerVisible}
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="选择要导出的列">
            <Select
              mode="multiple"
              placeholder="选择要导出的列"
              value={selectedColumns}
              onChange={setSelectedColumns}
              options={columnOptions}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setExportDrawerVisible(false)}>取消</Button>
              <Button type="primary" onClick={handleExport} disabled={selectedColumns.length === 0}>
                导出 Excel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* 导入抽屉 */}
      <Drawer
        title="导入学生数据"
        placement="right"
        onClose={() => setImportDrawerVisible(false)}
        open={importDrawerVisible}
        width={500}
      >
        <Form layout="vertical">
          <Alert
            message="注意：上传的 Excel 需要包含以下列（可以是中文或英文）: 
            教育机构名称、所属年级、班级名称、班主任、儿童姓名、儿童身份证号码、儿童出生年月日、性别、联系电话、母亲姓名、母亲身份证号码。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item label="选择 Excel 文件">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              style={{ width: '100%' }}
            />
          </Form.Item>

          {importFile && (
            <Form.Item>
              <div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '16px' }}>
                <strong>选择的文件:</strong> {importFile.name}
              </div>
            </Form.Item>
          )}

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setImportDrawerVisible(false)
                setImportFile(null)
              }}>取消</Button>
              <Button type="primary" onClick={handleImport} loading={importLoading} disabled={!importFile}>
                开始导入
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}

export default StudentEnrollment

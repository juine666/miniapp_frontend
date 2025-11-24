import React, { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Statistic, Table, Select, Space, Spin, message, Tabs } from 'antd'
import { ShoppingOutlined, EyeOutlined, RedditOutlined, DollarOutlined } from '@ant-design/icons'
import * as echarts from 'echarts'
import { useAuth } from '../auth/AuthContext'

const { Option } = Select

export default function Dashboard() {
  const { api } = useAuth()
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('week')
  const [stats, setStats] = useState({
    totalViews: 0,
    totalRepurchase: 0,
    totalSalesAmount: 0,
    totalProducts: 0,
    viewsTrend: [],
    repurchaseTrend: [],
    salesTrend: [],
    topProducts: [],
    categoryStats: []
  })

  // ECharts 实例引用
  const viewsChartRef = useRef(null)
  const salesChartRef = useRef(null)
  const repurchaseChartRef = useRef(null)
  const categoryChartRef = useRef(null)

  // 加载数据
  const loadDashboardData = async (range) => {
    setLoading(true)
    try {
      const response = await api.get(`/api/admin/statistics/dashboard?timeRange=${range}`)
      console.log('后端返回数据:', response.data)
      if (response.data.code === 0) {
        console.log('统计数据:', response.data.data)
        setStats(response.data.data)
      } else {
        message.error('获取数据失败')
      }
    } catch (error) {
      console.error('加载数据失败', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData(timeRange)
  }, [timeRange, api])

  // 初始化图表
  useEffect(() => {
    if (stats.viewsTrend.length > 0) {
      initCharts()
    }
  }, [stats])

  const initCharts = () => {
    // 浏览量趋势图
    initViewsChart()
    // 销售额趋势图
    initSalesChart()
    // 复购趋势图
    initRepurchaseChart()
    // 分类占比图
    initCategoryChart()
  }

  const initViewsChart = () => {
    const chart = echarts.init(viewsChartRef.current)
    const option = {
      title: { 
        text: '浏览量趋势',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#1890ff',
        textStyle: { color: '#fff' }
      },
      xAxis: {
        type: 'category',
        data: stats.viewsTrend.map(d => d.date.substring(5)),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666' }
      },
      yAxis: { 
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [
        {
          data: stats.viewsTrend.map(d => d.views),
          type: 'line',
          smooth: true,
          name: '浏览量',
          itemStyle: { color: '#1890ff' },
          areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
          lineStyle: { width: 3 }
        }
      ],
      grid: { left: 40, right: 20, top: 80, bottom: 20 }
    }
    chart.setOption(option)
    window.addEventListener('resize', () => chart.resize())
  }

  const initSalesChart = () => {
    const chart = echarts.init(salesChartRef.current)
    const option = {
      title: { 
        text: '销售额趋势',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#faad14',
        textStyle: { color: '#fff' },
        formatter: (params) => {
          if (params.length > 0) {
            return `${params[0].axisValue}<br/>销售额: ¥${params[0].value.toFixed(2)}`
          }
          return ''
        }
      },
      xAxis: {
        type: 'category',
        data: stats.salesTrend.map(d => d.date.substring(5)),
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666' }
      },
      yAxis: { 
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [
        {
          data: stats.salesTrend.map(d => d.sales),
          type: 'bar',
          name: '销售额',
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#faad14' },
              { offset: 1, color: '#ffc53d' }
            ]),
            borderRadius: [8, 8, 0, 0]
          }
        }
      ],
      grid: { left: 40, right: 20, top: 80, bottom: 20 }
    }
    chart.setOption(option)
    window.addEventListener('resize', () => chart.resize())
  }

  const initRepurchaseChart = () => {
    const chart = echarts.init(repurchaseChartRef.current)
    const option = {
      title: { 
        text: '复购趋势',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: { 
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#52c41a',
        textStyle: { color: '#fff' }
      },
      xAxis: {
        type: 'category',
        data: stats.repurchaseTrend.map(d => d.date.substring(5)),
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisLabel: { color: '#666' }
      },
      yAxis: { 
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [
        {
          data: stats.repurchaseTrend.map(d => d.repurchase),
          type: 'line',
          smooth: true,
          name: '复购人数',
          itemStyle: { color: '#52c41a' },
          areaStyle: { color: 'rgba(82, 196, 26, 0.2)' },
          lineStyle: { width: 3 },
          symbolSize: 6,
          symbol: 'circle'
        }
      ],
      grid: { left: 40, right: 20, top: 80, bottom: 20 }
    }
    chart.setOption(option)
    window.addEventListener('resize', () => chart.resize())
  }

  const initCategoryChart = () => {
    const chart = echarts.init(categoryChartRef.current)
    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#13c2c2']
    const option = {
      title: { 
        text: '分类销售占比',
        left: 'center',
        top: 15,
        textStyle: { fontSize: 18, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: { 
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#1890ff',
        textStyle: { color: '#fff' },
        formatter: (params) => {
          return `${params.name}<br/>占比: ${params.percent}%`
        }
      },
      legend: { 
        orient: 'horizontal',
        bottom: 55,
        left: 'center',
        textStyle: { color: '#666', fontSize: 13 },
        itemGap: 20,
        icon: 'circle'
      },
      series: [
        {
          name: '占比',
          type: 'pie',
          radius: [90, 200],
          center: ['50%', '42%'],
          data: stats.categoryStats.map((item, idx) => ({
            ...item,
            itemStyle: { 
              color: colors[idx % colors.length],
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
          })),
          label: { 
            show: false
          },
          labelLine: {
            show: false
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 25,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              borderColor: '#fff',
              borderWidth: 3
            },
            scale: true,
            scaleSize: 10
          }
        }
      ]
    }
    chart.setOption(option)
    window.addEventListener('resize', () => chart.resize())
  }

  const productColumns = [
    {
      title: '商品名称',
      dataIndex: 'name',
      width: 200
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      width: 100,
      render: (val) => <span style={{ color: '#1890ff' }}>{val}</span>
    },
    {
      title: '销售额',
      dataIndex: 'sales',
      width: 120,
      render: (val) => `¥${val.toFixed(2)}`
    },
    {
      title: '复购次数',
      dataIndex: 'repurchase',
      width: 100,
      render: (val) => <span style={{ color: '#52c41a' }}>{val}</span>
    }
  ]

  const items = [
    {
      key: '1',
      label: '趋势分析',
      children: (
        <Row gutter={16} style={{ marginBottom: '0' }}>
          <Col xs={24} lg={12}>
            <Card style={{ height: '500px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', padding: '16px' }}>
              <div ref={viewsChartRef} style={{ width: '100%', height: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card style={{ height: '500px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', padding: '16px' }}>
              <div ref={salesChartRef} style={{ width: '100%', height: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card style={{ height: '580px', marginTop: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', padding: '16px' }}>
              <div ref={repurchaseChartRef} style={{ width: '100%', height: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card style={{ height: '580px', marginTop: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', padding: '16px' }}>
              <div ref={categoryChartRef} style={{ width: '100%', height: '580px' }} />
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: '2',
      label: '热销商品',
      children: (
        <Card>
          <Table
            dataSource={stats.topProducts}
            columns={productColumns}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )
    }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '24px' }}>
      <Spin spinning={loading}>
        {/* 统计卡片 */}
        <Row gutter={24} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: 'none',
                borderLeft: '4px solid #1890ff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Statistic
                title="总浏览量"
                value={stats.totalViews}
                prefix={<EyeOutlined style={{ color: '#1890ff', marginRight: '8px' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: 'none',
                borderLeft: '4px solid #52c41a',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Statistic
                title="复购人数"
                value={stats.totalRepurchase}
                prefix={<RedditOutlined style={{ color: '#52c41a', marginRight: '8px' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: 'none',
                borderLeft: '4px solid #faad14',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Statistic
                title="销售额"
                value={stats.totalSalesAmount.toFixed(2)}
                prefix={<DollarOutlined style={{ color: '#faad14', marginRight: '8px' }} />}
                suffix="元"
                valueStyle={{ color: '#faad14', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: 'none',
                borderLeft: '4px solid #722ed1',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Statistic
                title="商品数"
                value={stats.totalProducts}
                prefix={<ShoppingOutlined style={{ color: '#722ed1', marginRight: '8px' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 时间范围选择 */}
        <Card style={{ marginBottom: '24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', border: 'none' }}>
          <Space>
            <span style={{ fontWeight: 'bold', color: '#262626' }}>时间周期：</span>
            <Select value={timeRange} onChange={setTimeRange} style={{ width: 150 }} size="large">
              <Option value="week">📅 最近一周</Option>
              <Option value="month">📅 最近一月</Option>
              <Option value="year">📅 最近一年</Option>
            </Select>
          </Space>
        </Card>

        {/* 图表标签页 */}
        <Card style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', border: 'none' }}>
          <Tabs items={items} />
        </Card>
      </Spin>
    </div>
  )
}

// 现代化后台主题配置
export const modernTheme = {
  // 卡片样式
  card: {
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 24px rgba(31, 38, 135, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  
  // 主按钮样式
  primaryButton: {
    borderRadius: '12px',
    height: '48px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
    fontWeight: '600'
  },
  
  // 标题样式
  title: {
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  
  // 渐变背景色
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    warning: 'linear-gradient(135deg, #fa8c16 0%, #fadb14 100%)',
    danger: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  
  // 统计卡片配置
  statCard: (gradient) => ({
    background: gradient,
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
  }),
  
  // 表格样式
  table: {
    borderRadius: '12px',
    overflow: 'hidden'
  }
}

export default modernTheme

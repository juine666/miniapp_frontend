/**
 * 主题配置
 * 支持自定义颜色主题
 */

// 默认主题配置
export const DEFAULT_THEME = {
  // 主色调
  primaryColor: '#1890ff',
  
  // 侧边栏
  siderBg: '#001529',
  siderTextColor: '#fff',
  siderSelectedBg: '#1890ff',
  
  // 头部
  headerBg: '#fff',
  headerTextColor: '#000',
  
  // 内容区
  contentBg: '#f0f2f5',
  cardBg: '#fff',
  
  // 文字颜色
  textColor: '#000',
  textSecondaryColor: '#666',
  
  // 边框颜色
  borderColor: '#d9d9d9',
  
  // 成功/警告/错误颜色
  successColor: '#52c41a',
  warningColor: '#faad14',
  errorColor: '#ff4d4f',
}

// 预设主题
export const PRESET_THEMES = {
  default: {
    name: '默认主题',
    ...DEFAULT_THEME,
  },
  dark: {
    name: '深色主题',
    primaryColor: '#1890ff',
    siderBg: '#000000',
    siderTextColor: '#fff',
    siderSelectedBg: '#1890ff',
    headerBg: '#141414',
    headerTextColor: '#fff',
    contentBg: '#000000',
    cardBg: '#1f1f1f',
    textColor: '#fff',
    textSecondaryColor: '#999',
    borderColor: '#434343',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#ff4d4f',
  },
  blue: {
    name: '蓝色主题',
    primaryColor: '#1890ff',
    siderBg: '#001529',
    siderTextColor: '#fff',
    siderSelectedBg: '#1890ff',
    headerBg: '#1890ff',
    headerTextColor: '#fff',
    contentBg: '#f0f2f5',
    cardBg: '#fff',
    textColor: '#000',
    textSecondaryColor: '#666',
    borderColor: '#d9d9d9',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#ff4d4f',
  },
  green: {
    name: '绿色主题',
    primaryColor: '#52c41a',
    siderBg: '#002140',
    siderTextColor: '#fff',
    siderSelectedBg: '#52c41a',
    headerBg: '#fff',
    headerTextColor: '#000',
    contentBg: '#f0f2f5',
    cardBg: '#fff',
    textColor: '#000',
    textSecondaryColor: '#666',
    borderColor: '#d9d9d9',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#ff4d4f',
  },
  purple: {
    name: '紫色主题',
    primaryColor: '#722ed1',
    siderBg: '#1a0d2e',
    siderTextColor: '#fff',
    siderSelectedBg: '#722ed1',
    headerBg: '#fff',
    headerTextColor: '#000',
    contentBg: '#f0f2f5',
    cardBg: '#fff',
    textColor: '#000',
    textSecondaryColor: '#666',
    borderColor: '#d9d9d9',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#ff4d4f',
  },
}

/**
 * 获取主题配置
 * @returns {object}
 */
export function getTheme() {
  const saved = localStorage.getItem('adminTheme')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error('解析主题配置失败', e)
    }
  }
  return DEFAULT_THEME
}

/**
 * 保存主题配置
 * @param {object} theme - 主题配置
 */
export function saveTheme(theme) {
  localStorage.setItem('adminTheme', JSON.stringify(theme))
}

/**
 * 应用主题到页面
 * @param {object} theme - 主题配置
 */
export function applyTheme(theme) {
  const root = document.documentElement
  
  // 设置CSS变量
  root.style.setProperty('--primary-color', theme.primaryColor)
  root.style.setProperty('--sider-bg', theme.siderBg)
  root.style.setProperty('--sider-text-color', theme.siderTextColor)
  root.style.setProperty('--sider-selected-bg', theme.siderSelectedBg)
  root.style.setProperty('--header-bg', theme.headerBg)
  root.style.setProperty('--header-text-color', theme.headerTextColor)
  root.style.setProperty('--content-bg', theme.contentBg)
  root.style.setProperty('--card-bg', theme.cardBg)
  root.style.setProperty('--text-color', theme.textColor)
  root.style.setProperty('--text-secondary-color', theme.textSecondaryColor)
  root.style.setProperty('--border-color', theme.borderColor)
  root.style.setProperty('--success-color', theme.successColor)
  root.style.setProperty('--warning-color', theme.warningColor)
  root.style.setProperty('--error-color', theme.errorColor)
}


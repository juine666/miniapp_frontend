import React, { createContext, useContext, useEffect, useState } from 'react'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { getTheme, saveTheme, applyTheme, PRESET_THEMES, DEFAULT_THEME } from '../config/theme'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getTheme())
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 应用主题
    applyTheme(theme)
    
    // 判断是否为深色主题
    const isDarkMode = theme.siderBg === '#000000' || theme.siderBg === '#141414'
    setIsDark(isDarkMode)
  }, [theme])

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    saveTheme(newTheme)
    applyTheme(newTheme)
  }

  const setPresetTheme = (themeName) => {
    const preset = PRESET_THEMES[themeName]
    if (preset) {
      setTheme(preset)
    }
  }

  const resetTheme = () => {
    setTheme(DEFAULT_THEME)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, setPresetTheme, resetTheme, isDark }}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: theme.primaryColor,
            colorSuccess: theme.successColor,
            colorWarning: theme.warningColor,
            colorError: theme.errorColor,
          },
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}


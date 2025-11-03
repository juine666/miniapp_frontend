import React, { createContext, useContext, useMemo, useState } from 'react'
import axios from 'axios'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '')
  const api = useMemo(() => {
    const instance = axios.create({ baseURL: 'http://localhost:8080' })
    instance.interceptors.request.use(cfg => {
      if (token) cfg.headers['Authorization'] = `Bearer ${token}`
      return cfg
    })
    return instance
  }, [token])

  const login = async (username, password) => {
    const res = await axios.post('http://localhost:8080/api/admin/auth/login', { username, password })
    if (res.data?.code === 0) {
      const t = res.data.data.token
      setToken(t)
      localStorage.setItem('adminToken', t)
      return true
    }
    return false
  }
  const logout = () => { setToken(''); localStorage.removeItem('adminToken') }

  return <AuthCtx.Provider value={{ token, api, login, logout }}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }

















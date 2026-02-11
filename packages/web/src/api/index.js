import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8083'
const IS_DEV = import.meta.env.DEV || true // Vite 默认开发模式

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests (dev mode uses mock admin key)
api.interceptors.request.use((config) => {
  if (IS_DEV) {
    // 开发模式：使用模拟 admin key
    config.headers.Authorization = 'Bearer dev_admin_key'
  } else {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/api/v1/auth/register', data),
  login: (data) => api.post('/api/v1/auth/login', data),
  profile: () => api.get('/api/v1/auth/me'),
}

// Agent APIs
export const agentAPI = {
  list: (params) => api.get('/api/v1/agents', { params }),
  get: (id) => api.get(`/api/v1/agents/${encodeURIComponent(id)}`),
  enable: (id) => api.post(`/api/v1/agents/${encodeURIComponent(id)}/enable`),
  disable: (id) => api.post(`/api/v1/agents/${encodeURIComponent(id)}/disable`),
}

// Console APIs
export const consoleAPI = {
  listKeys: () => api.get('/api/v1/console/keys'),
  createKey: (data) => api.post('/api/v1/console/keys', data),
  deleteKey: (uuid) => api.delete(`/api/v1/console/keys/${uuid}`),
  rotateKey: (uuid) => api.post(`/api/v1/console/keys/${uuid}/rotate`),
  getBalance: () => api.get('/api/v1/console/balance'),
  getUsageStats: (period) => api.get('/api/v1/console/usage/stats', { params: { period } }),
  getUsageLogs: (params) => api.get('/api/v1/console/usage/logs', { params }),
}

// Chat API (OpenAI compatible)
export const chatAPI = {
  completions: (data) => api.post('/v1/chat/completions', data),
  listModels: () => api.get('/v1/models'),
}

export default api

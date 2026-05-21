import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const msg = err.response?.data?.message || '请求失败，请重试'
    if (status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else {
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.error(msg)
      })
    }
    return Promise.reject(err)
  }
)

export default api

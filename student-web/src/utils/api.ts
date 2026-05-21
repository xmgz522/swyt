import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

// 请求拦截：带上 studentId
http.interceptors.request.use((config) => {
  const sid = localStorage.getItem('studentId')
  if (sid) {
    config.headers['x-student-id'] = sid
  }
  return config
})

// 响应拦截
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || '网络异常，请重试'
    console.error('[API Error]', msg)
    // 非静默请求时自动弹出错误提示
    if (!err.config?.headers?.['x-silent']) {
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.error(msg)
      })
    }
    return Promise.reject(err.response || err)
  }
)

export default http

const BASE_URL = 'http://localhost:3000/api'

export function request(url: string, options: any = {}) {
  return new Promise<any>((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
      },
      success: (res) => {
        if (res.statusCode >= 400) {
          const msg = (res.data as any)?.message || '请求失败'
          if (!options.silent) uni.showToast({ title: msg, icon: 'none', duration: 2000 })
          reject(res.data)
        } else {
          resolve(res.data)
        }
      },
      fail: (err) => {
        if (!options.silent) uni.showToast({ title: '网络异常，请重试', icon: 'none', duration: 2000 })
        reject(err)
      },
    })
  })
}

export function get(url: string) {
  return request(url)
}

export function post(url: string, data: any) {
  return request(url, { method: 'POST', data })
}

export function put(url: string, data: any) {
  return request(url, { method: 'PUT', data })
}

export function del(url: string) {
  return request(url, { method: 'DELETE' })
}

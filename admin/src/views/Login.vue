<template>
  <div class="login-container">
    <div class="login-card">
      <h2>浙江三位一体测评系统</h2>
      <p class="subtitle">管理后台</p>
      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%" @click="handleLogin" :loading="loading">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <p class="hint">默认账号: admin / admin123 或 teacher / teacher123</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api'

const router = useRouter()
const loading = ref(false)
const form = ref({ username: '', password: '' })

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const { data } = await api.post('/auth/login', form.value)
    if (data.success) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error(data.message)
    }
  } catch (e) {
    ElMessage.error('登录失败，请检查服务是否启动')
  }
  loading.value = false
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.login-card h2 {
  text-align: center;
  margin-bottom: 4px;
  color: #333;
}
.subtitle {
  text-align: center;
  color: #999;
  margin-bottom: 30px;
}
.hint {
  text-align: center;
  color: #aaa;
  font-size: 12px;
  margin-top: 12px;
}
</style>

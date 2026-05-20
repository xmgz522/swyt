<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent mx-auto flex items-center justify-center mb-4">
          <span class="text-white text-2xl font-bold">E</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">三位一体测评系统</h1>
        <p class="text-gray-400 text-sm mt-2">登录后查看院校推荐、做模拟卷、获取测评报告</p>
      </div>

      <!-- 登录卡片 -->
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <!-- Tab 切换 -->
        <div class="flex mb-6 bg-gray-100 rounded-xl p-1">
          <button
            :class="['flex-1 py-2.5 rounded-lg text-sm font-medium transition-all', mode === 'login' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500']"
            @click="mode = 'login'"
          >手机号登录</button>
          <button
            :class="['flex-1 py-2.5 rounded-lg text-sm font-medium transition-all', mode === 'register' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500']"
            @click="mode = 'register'"
          >新用户注册</button>
        </div>

        <!-- 登录表单 -->
        <div v-if="mode === 'login'">
          <div class="mb-3">
            <label class="block text-sm text-gray-600 mb-1.5">手机号</label>
            <el-input v-model="loginPhone" placeholder="请输入注册时的手机号" size="large" maxlength="11" />
          </div>
          <div class="mb-4">
            <label class="block text-sm text-gray-600 mb-1.5">密码</label>
            <el-input v-model="loginPassword" type="password" placeholder="请输入密码" size="large" show-password @keyup.enter="handleLogin" />
          </div>
          <el-button type="primary" class="w-full" size="large" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
          <div class="flex justify-between mt-4">
            <p class="text-xs text-gray-400">通过手机号找回你的学考成绩和做题记录</p>
            <button class="text-xs text-primary-500 hover:underline" @click="requestReset">忘记密码？</button>
          </div>
        </div>

        <!-- 注册表单 -->
        <div v-else>
          <div class="mb-3">
            <label class="block text-sm text-gray-600 mb-1.5">姓名</label>
            <el-input v-model="regForm.name" placeholder="请输入姓名" size="large" />
          </div>
          <div class="mb-3">
            <label class="block text-sm text-gray-600 mb-1.5">手机号</label>
            <el-input v-model="regForm.phone" placeholder="请输入手机号" size="large" maxlength="11" />
          </div>
          <div class="mb-3">
            <label class="block text-sm text-gray-600 mb-1.5">年级</label>
            <el-select v-model="regForm.grade" placeholder="请选择年级" size="large" class="w-full">
              <el-option label="高一" value="高一" />
              <el-option label="高二" value="高二" />
              <el-option label="高三" value="高三" />
            </el-select>
          </div>
          <div class="mb-3">
            <label class="block text-sm text-gray-600 mb-1.5">设置密码</label>
            <el-input v-model="regForm.password" type="password" placeholder="至少6位" size="large" show-password />
          </div>
          <div class="mb-4">
            <label class="block text-sm text-gray-600 mb-1.5">注册码</label>
            <el-input v-model="regForm.inviteCode" placeholder="请输入机构发放的注册码" size="large" style="letter-spacing: 1px;" />
          </div>
          <el-button type="primary" class="w-full" size="large" :loading="loading" @click="handleRegister">
            注册并进入
          </el-button>
          <p class="text-xs text-gray-400 text-center mt-4">注册后可在「我的信息」页完善学考成绩</p>
        </div>
      </div>

      <!-- 底部提示 -->
      <p class="text-center text-xs text-gray-300 mt-6">数据安全存储在服务器，退出后随时可登录找回</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const router = useRouter()
const store = useStudentStore()

const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const loginPhone = ref('')
const loginPassword = ref('')
const regForm = ref({ name: '', phone: '', grade: '', password: '', inviteCode: '' })

async function handleLogin() {
  if (!loginPhone.value || !/^1[3-9]\d{9}$/.test(loginPhone.value)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (!loginPassword.value) {
    ElMessage.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    const res: any = await http.post('/students/login', { phone: loginPhone.value, password: loginPassword.value, platform: 'web' })
    if (res.success && res.data) {
      store.studentId = res.data.id
      store.profile = res.data
      localStorage.setItem('studentId', String(res.data.id))
      ElMessage.success(`欢迎回来，${res.data.name}`)
      router.push('/')
    } else {
      ElMessage.error(res.message || '该手机号未注册')
    }
  } catch (e: any) {
    ElMessage.error(e?.data?.message || '登录失败')
  }
  loading.value = false
}

async function handleRegister() {
  if (!regForm.value.name.trim()) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!regForm.value.phone || !/^1[3-9]\d{9}$/.test(regForm.value.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  if (!regForm.value.grade) {
    ElMessage.warning('请选择年级')
    return
  }
  if (!regForm.value.password || regForm.value.password.length < 6) {
    ElMessage.warning('密码至少6位')
    return
  }
  if (!regForm.value.inviteCode.trim()) {
    ElMessage.warning('请输入注册码')
    return
  }
  loading.value = true
  try {
    const res: any = await http.post('/students', {
      name: regForm.value.name,
      phone: regForm.value.phone,
      grade: regForm.value.grade,
      password: regForm.value.password,
      inviteCode: regForm.value.inviteCode.trim().toUpperCase(),
    })
    if (res?.id) {
      store.studentId = res.id
      store.profile = res
      localStorage.setItem('studentId', String(res.id))
      ElMessage.success('注册成功！')
      router.push('/profile')
    }
  } catch (e: any) {
    ElMessage.error(e?.data?.message || '注册失败')
  }
  loading.value = false
}

async function requestReset() {
  if (!loginPhone.value || !/^1[3-9]\d{9}$/.test(loginPhone.value)) {
    ElMessage.warning('请先输入手机号')
    return
  }
  try {
    const res: any = await http.post('/students/request-reset', { phone: loginPhone.value })
    ElMessage.success(res.message || '已提交重置申请，请等待管理员处理')
  } catch (e: any) {
    ElMessage.error(e?.data?.message || '操作失败')
  }
}
</script>

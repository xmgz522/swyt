<template>
  <view class="page">
    <!-- Logo 区 -->
    <view class="logo-area">
      <text class="app-name">三位一体测评</text>
      <text class="app-desc">登录后查看院校推荐、做模拟卷、获取测评报告</text>
    </view>

    <!-- 切换 -->
    <view class="mode-bar">
      <view :class="['mode-item', mode === 'login' ? 'active' : '']" @tap="mode = 'login'">
        <text>手机号登录</text>
      </view>
      <view :class="['mode-item', mode === 'register' ? 'active' : '']" @tap="mode = 'register'">
        <text>新用户注册</text>
      </view>
    </view>

    <!-- 登录 -->
    <view v-if="mode === 'login'" class="form-area">
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="loginPhone" type="number" placeholder="请输入注册时的手机号" maxlength="11" class="input" placeholder-class="ph" />
      </view>
      <view class="form-item">
        <text class="label">密码</text>
        <input v-model="loginPassword" type="text" password placeholder="请输入密码" class="input" placeholder-class="ph" />
      </view>
      <button class="primary-btn" @tap="handleLogin" :loading="loading">登 录</button>
      <view style="display: flex; justify-content: space-between; margin-top: 16rpx;">
        <text class="tip">通过手机号找回你的学考成绩和做题记录</text>
        <text class="forgot-link" @tap="requestReset">忘记密码？</text>
      </view>
    </view>

    <!-- 注册 -->
    <view v-else class="form-area">
      <view class="form-item">
        <text class="label">姓名</text>
        <input v-model="regForm.name" placeholder="请输入姓名" class="input" placeholder-class="ph" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="regForm.phone" type="number" placeholder="请输入手机号" maxlength="11" class="input" placeholder-class="ph" />
      </view>
      <view class="form-item">
        <text class="label">年级</text>
        <picker :range="['高一','高二','高三']" @change="onGrade">
          <view class="picker-val">
            <text :style="{ color: regForm.grade ? '#333' : '#c0c4cc' }">{{ regForm.grade || '请选择年级' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="form-item">
        <text class="label">设置密码</text>
        <input v-model="regForm.password" type="text" password placeholder="至少6位" class="input" placeholder-class="ph" />
      </view>
      <view class="form-item">
        <text class="label">注册码</text>
        <input v-model="regForm.inviteCode" placeholder="请输入机构发放的注册码" class="input" placeholder-class="ph" style="letter-spacing: 2rpx;" />
      </view>
      <button class="primary-btn" @tap="handleRegister" :loading="loading">注册并进入</button>
      <text class="tip">注册后可在「我的」页面完善学考成绩</text>
    </view>

    <text class="footer">数据安全存储在服务器，退出后随时可登录找回</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { post, get } from '../../utils/api'

const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const loginPhone = ref('')
const loginPassword = ref('')
const regForm = ref({ name: '', phone: '', grade: '', password: '', inviteCode: '' })

function onGrade(e: any) {
  regForm.value.grade = ['高一', '高二', '高三'][e.detail.value]
}

async function handleLogin() {
  if (!loginPhone.value || !/^1[3-9]\d{9}$/.test(loginPhone.value)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' }); return
  }
  if (!loginPassword.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' }); return
  }
  loading.value = true
  try {
    const res: any = await post('/students/login', { phone: loginPhone.value, password: loginPassword.value, platform: 'miniapp' })
    if (res.success && res.data) {
      uni.setStorageSync('studentId', res.data.id)
      // 从服务端恢复已选院校
      await restoreSelectedSchools(res.data.id)
      uni.showToast({ title: `欢迎回来，${res.data.name}`, icon: 'success' })
      setTimeout(() => { uni.switchTab({ url: '/pages/index/index' }) }, 800)
    } else {
      uni.showToast({ title: res.message || '该手机号未注册', icon: 'none' })
    }
  } catch {
    uni.showToast({ title: '登录失败', icon: 'none' })
  }
  loading.value = false
}

async function handleRegister() {
  if (!regForm.value.name.trim()) {
    uni.showToast({ title: '请输入姓名', icon: 'none' }); return
  }
  if (!regForm.value.phone || !/^1[3-9]\d{9}$/.test(regForm.value.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' }); return
  }
  if (!regForm.value.grade) {
    uni.showToast({ title: '请选择年级', icon: 'none' }); return
  }
  if (!regForm.value.password || regForm.value.password.length < 6) {
    uni.showToast({ title: '密码至少6位', icon: 'none' }); return
  }
  if (!regForm.value.inviteCode.trim()) {
    uni.showToast({ title: '请输入注册码', icon: 'none' }); return
  }
  loading.value = true
  try {
    const res: any = await post('/students', {
      name: regForm.value.name,
      phone: regForm.value.phone,
      grade: regForm.value.grade,
      password: regForm.value.password,
      inviteCode: regForm.value.inviteCode.trim().toUpperCase(),
    })
    if (res?.id) {
      uni.setStorageSync('studentId', res.id)
      uni.setStorageSync('selectedSchools', '[]')
      uni.showToast({ title: '注册成功！', icon: 'success' })
      setTimeout(() => { uni.switchTab({ url: '/pages/profile/index' }) }, 800)
    }
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || '注册失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
  loading.value = false
}

async function requestReset() {
  if (!loginPhone.value || !/^1[3-9]\d{9}$/.test(loginPhone.value)) {
    uni.showToast({ title: '请先输入手机号', icon: 'none' }); return
  }
  try {
    const res: any = await post('/students/request-reset', { phone: loginPhone.value })
    uni.showToast({ title: res.message || '已提交申请', icon: 'none', duration: 2500 })
  } catch (e: any) {
    uni.showToast({ title: e?.data?.message || '操作失败', icon: 'none' })
  }
}

async function restoreSelectedSchools(sid: number) {
  try {
    const data: any = await get(`/students/${sid}`)
    if (data?.selectedSchools) {
      uni.setStorageSync('selectedSchools', data.selectedSchools)
    } else {
      uni.setStorageSync('selectedSchools', '[]')
    }
  } catch {
    uni.setStorageSync('selectedSchools', '[]')
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f4f5f7; padding: 0 36rpx; }

.logo-area { text-align: center; padding: 120rpx 0 48rpx; }
.app-name { display: block; color: #222; font-size: 40rpx; font-weight: 800; letter-spacing: 2rpx; }
.app-desc { display: block; color: #999; font-size: 24rpx; margin-top: 12rpx; }

.mode-bar { display: flex; background: #ebedf0; border-radius: 14rpx; padding: 6rpx; margin-bottom: 32rpx; }
.mode-item { flex: 1; text-align: center; padding: 18rpx 0; border-radius: 10rpx; }
.mode-item text { font-size: 28rpx; color: #888; }
.mode-item.active { background: #fff; box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05); }
.mode-item.active text { color: #2e4a78; font-weight: 600; }

.form-area { background: #fff; border-radius: 20rpx; padding: 36rpx 28rpx; }
.form-item { margin-bottom: 24rpx; }
.label { display: block; font-size: 26rpx; color: #555; margin-bottom: 10rpx; }
.input { background: #f7f8fa; border-radius: 12rpx; padding: 22rpx 24rpx; font-size: 28rpx; color: #333; border: 1rpx solid #eee; }
.ph { color: #c0c4cc; }
.picker-val { display: flex; align-items: center; justify-content: space-between; background: #f7f8fa; border-radius: 12rpx; padding: 22rpx 24rpx; border: 1rpx solid #eee; }
.picker-val text { font-size: 28rpx; }
.picker-arrow { color: #ccc; font-size: 28rpx; }

.primary-btn { margin-top: 16rpx; background: #2e4a78; color: #fff; border: none; border-radius: 12rpx; font-size: 30rpx; height: 88rpx; line-height: 88rpx; font-weight: 600; }
.tip { display: block; text-align: center; font-size: 22rpx; color: #bbb; margin-top: 20rpx; }
.forgot-link { font-size: 22rpx; color: #2e4a78; }
.footer { display: block; text-align: center; font-size: 22rpx; color: #ccc; margin-top: 40rpx; }
</style>

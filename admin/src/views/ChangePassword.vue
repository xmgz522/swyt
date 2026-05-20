<template>
  <div>
    <el-card style="max-width: 480px;">
      <template #header><span style="font-weight: bold;">修改密码</span></template>
      <el-form :model="form" label-width="100px" @submit.prevent="submit">
        <el-form-item label="原密码" required>
          <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="form.newPassword" type="password" show-password placeholder="至少6位" />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit" :loading="loading">确认修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const form = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(false)

async function submit() {
  if (!form.value.oldPassword || !form.value.newPassword) {
    ElMessage.warning('请填写完整'); return
  }
  if (form.value.newPassword.length < 6) {
    ElMessage.warning('新密码至少6位'); return
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    ElMessage.warning('两次密码不一致'); return
  }
  loading.value = true
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const { data } = await api.post('/auth/change-password', {
      userId: user.id,
      oldPassword: form.value.oldPassword,
      newPassword: form.value.newPassword,
    })
    if (data.success) {
      ElMessage.success('密码修改成功')
      form.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      ElMessage.error(data.message || '修改失败')
    }
  } catch {
    ElMessage.error('修改失败')
  }
  loading.value = false
}
</script>

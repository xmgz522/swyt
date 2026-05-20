<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px;">用户管理</span>
          <el-button type="primary" @click="openAdd">添加用户</el-button>
        </div>
      </template>

      <el-table :data="users" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="row.role === 'superadmin' ? 'danger' : row.role === 'admin' ? 'warning' : ''">
              {{ roleMap[row.role] || row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ row.createdAt?.substring(0, 16).replace('T', ' ') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button size="small" link @click="openEdit(row)">编辑</el-button>
              <el-button size="small" link type="warning" @click="openReset(row)">重置密码</el-button>
              <el-button size="small" link type="danger" @click="handleDelete(row)" :disabled="row.role === 'superadmin'">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑用户' : '添加用户'" width="440px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="显示名称" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="初始密码" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width: 100%;">
            <el-option label="老师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submit">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="showReset" title="重置密码" width="380px">
      <p style="margin-bottom: 12px;">为 <b>{{ resetTarget.name }}</b> ({{ resetTarget.username }}) 设置新密码：</p>
      <el-input v-model="newPassword" type="password" show-password placeholder="新密码（至少6位）" />
      <template #footer>
        <el-button @click="showReset = false">取消</el-button>
        <el-button type="primary" @click="doReset">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const roleMap: Record<string, string> = { superadmin: '超级管理员', admin: '管理员', teacher: '老师' }

const users = ref<any[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref(0)
const form = ref({ username: '', name: '', password: '', role: 'teacher' })

const showReset = ref(false)
const resetTarget = ref<any>({})
const newPassword = ref('')

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/auth/users')
    users.value = Array.isArray(data) ? data : []
  } catch {}
  loading.value = false
}

function openAdd() {
  isEdit.value = false
  editId.value = 0
  form.value = { username: '', name: '', password: '', role: 'teacher' }
  showDialog.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  editId.value = row.id
  form.value = { username: row.username, name: row.name, password: '', role: row.role }
  showDialog.value = true
}

async function submit() {
  if (!form.value.username || !form.value.name) {
    ElMessage.warning('请填写完整'); return
  }
  if (isEdit.value) {
    const { data } = await api.put(`/auth/users/${editId.value}`, {
      username: form.value.username,
      name: form.value.name,
      role: form.value.role,
    })
    if (data.success) {
      ElMessage.success('已更新')
      showDialog.value = false
      load()
    } else {
      ElMessage.error(data.message || '更新失败')
    }
  } else {
    if (!form.value.password || form.value.password.length < 6) {
      ElMessage.warning('密码至少6位'); return
    }
    const { data } = await api.post('/auth/users', form.value)
    if (data.success) {
      ElMessage.success('已创建')
      showDialog.value = false
      load()
    } else {
      ElMessage.error(data.message || '创建失败')
    }
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除用户「${row.name}」？此操作不可撤回。`, '删除确认', { type: 'warning' })
  const { data } = await api.delete(`/auth/users/${row.id}`)
  if (data.success) {
    ElMessage.success('已删除')
    load()
  } else {
    ElMessage.error(data.message || '删除失败')
  }
}

function openReset(row: any) {
  resetTarget.value = row
  newPassword.value = ''
  showReset.value = true
}

async function doReset() {
  if (!newPassword.value || newPassword.value.length < 6) {
    ElMessage.warning('密码至少6位'); return
  }
  const { data } = await api.put(`/auth/reset-password/${resetTarget.value.id}`, { newPassword: newPassword.value })
  if (data.success) {
    ElMessage.success('密码已重置')
    showReset.value = false
  } else {
    ElMessage.error(data.message || '重置失败')
  }
}
</script>

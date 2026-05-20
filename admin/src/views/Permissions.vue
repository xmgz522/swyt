<template>
  <div>
    <el-card>
      <template #header>
        <span style="font-weight: bold; font-size: 16px;">权限分配</span>
      </template>

      <el-table :data="users" stripe v-loading="loading">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="username" label="账号" width="130" />
        <el-table-column label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="row.role === 'superadmin' ? 'danger' : row.role === 'admin' ? 'warning' : ''">
              {{ roleMap[row.role] || row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可用功能" min-width="300">
          <template #default="{ row }">
            <template v-if="row.role === 'superadmin'">
              <el-tag size="small" type="danger">全部权限</el-tag>
            </template>
            <template v-else>
              <el-tag v-for="p in getUserPerms(row)" :key="p" size="small" style="margin: 2px 4px 2px 0;">{{ permLabel(p) }}</el-tag>
              <el-tag v-if="getUserPerms(row).length === 0" size="small" type="info">默认权限</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)" :disabled="row.role === 'superadmin'">配置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 权限编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="`配置权限 — ${editUser?.name}`" width="600px">
      <div style="margin-bottom: 16px;">
        <el-alert :closable="false" type="info" show-icon>
          <template #title>
            <span v-if="editUser?.role === 'admin'">管理员默认拥有大部分功能权限，下方可额外调整。</span>
            <span v-else>教师默认只有基础功能，勾选后可开放更多功能。</span>
          </template>
        </el-alert>
      </div>

      <div style="margin-bottom: 12px; font-weight: bold;">角色</div>
      <el-radio-group v-model="editRole" style="margin-bottom: 20px;">
        <el-radio value="teacher">老师</el-radio>
        <el-radio value="admin">管理员</el-radio>
      </el-radio-group>

      <div style="margin-bottom: 12px; font-weight: bold;">功能权限</div>
      <el-checkbox-group v-model="editPerms">
        <div v-for="group in permGroups" :key="group.label" style="margin-bottom: 16px;">
          <div style="font-size: 13px; color: #999; margin-bottom: 6px;">{{ group.label }}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <el-checkbox v-for="p in group.items" :key="p.value" :value="p.value" :label="p.value" border size="small">
              {{ p.label }}
            </el-checkbox>
          </div>
        </div>
      </el-checkbox-group>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const roleMap: Record<string, string> = { superadmin: '超级管理员', admin: '管理员', teacher: '老师' }
const users = ref<any[]>([])
const loading = ref(false)
const showDialog = ref(false)
const editUser = ref<any>(null)
const editRole = ref('teacher')
const editPerms = ref<string[]>([])
const saving = ref(false)

const permGroups = [
  {
    label: '基础管理',
    items: [
      { value: 'students', label: '学生管理' },
      { value: 'schools', label: '院校管理' },
      { value: 'majors', label: '专业管理' },
    ],
  },
  {
    label: '考试中心',
    items: [
      { value: 'questions', label: '题库管理' },
      { value: 'papers', label: '试卷管理' },
      { value: 'grading', label: '批卷管理' },
      { value: 'answer-sheets', label: '答卷记录' },
      { value: 'interview', label: '面试题库' },
      { value: 'mock-interview', label: '模拟面试' },
    ],
  },
  {
    label: '数据分析',
    items: [
      { value: 'wrong-notes', label: '错题管理' },
      { value: 'analysis', label: 'AI 分析' },
      { value: 'report', label: '测评报告' },
      { value: 'weekly-report', label: '学情周报' },
    ],
  },
  {
    label: '运营管理',
    items: [
      { value: 'policies', label: '政策管理' },
      { value: 'notifications', label: '消息通知' },
      { value: 'import-export', label: '导入导出' },
    ],
  },
]

const allPermValues = permGroups.flatMap(g => g.items.map(i => i.value))
const permLabelMap: Record<string, string> = {}
permGroups.forEach(g => g.items.forEach(i => { permLabelMap[i.value] = i.label }))
function permLabel(v: string) { return permLabelMap[v] || v }

function getUserPerms(user: any): string[] {
  if (!user.permissions) return []
  try { return JSON.parse(user.permissions) } catch { return [] }
}

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/auth/users')
    users.value = Array.isArray(data) ? data : []
  } catch {}
  loading.value = false
}

function openEdit(row: any) {
  editUser.value = row
  editRole.value = row.role || 'teacher'
  editPerms.value = getUserPerms(row)
  showDialog.value = true
}

async function save() {
  saving.value = true
  try {
    await api.put(`/auth/users/${editUser.value.id}`, {
      role: editRole.value,
      permissions: JSON.stringify(editPerms.value),
    })
    ElMessage.success('权限已更新')
    showDialog.value = false
    load()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  }
  saving.value = false
}
</script>

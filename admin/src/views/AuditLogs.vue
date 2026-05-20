<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px;">操作日志</span>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" :model="filter" class="mb-4">
        <el-form-item label="操作人">
          <el-input v-model="filter.username" placeholder="用户名" clearable style="width: 140px;" @clear="load" />
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="filter.module" placeholder="全部" clearable style="width: 120px;" @change="load">
            <el-option v-for="m in modules" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作">
          <el-select v-model="filter.action" placeholder="全部" clearable style="width: 120px;" @change="load">
            <el-option label="登录" value="login" />
            <el-option label="创建" value="create" />
            <el-option label="修改" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="批改" value="grade" />
            <el-option label="导入" value="import" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
            @change="load"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="load">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="username" label="操作人" width="110" />
        <el-table-column label="模块" width="90">
          <template #default="{ row }">
            <el-tag size="small">{{ row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="actionColor[row.action] || ''">{{ actionMap[row.action] || row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="130" />
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          :page-size="50"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="load"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const actionMap: Record<string, string> = { login: '登录', create: '创建', update: '修改', delete: '删除', grade: '批改', import: '导入', export: '导出' }
const actionColor: Record<string, string> = { login: '', create: 'success', update: 'warning', delete: 'danger', grade: 'primary', import: '' }

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const modules = ref<string[]>([])

const filter = ref({
  username: '',
  module: '',
  action: '',
  dateRange: null as string[] | null,
})

onMounted(async () => {
  load()
  try {
    const { data } = await api.get('/audit/modules')
    modules.value = Array.isArray(data) ? data : []
  } catch {}
})

async function load() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: 50 }
    if (filter.value.username) params.username = filter.value.username
    if (filter.value.module) params.module = filter.value.module
    if (filter.value.action) params.action = filter.value.action
    if (filter.value.dateRange && filter.value.dateRange.length === 2) {
      params.startDate = filter.value.dateRange[0]
      params.endDate = filter.value.dateRange[1]
    }
    const { data } = await api.get('/audit/logs', { params })
    list.value = data.data || []
    total.value = data.total || 0
  } catch {}
  loading.value = false
}

function formatTime(t: string) {
  if (!t) return ''
  return t.substring(0, 19).replace('T', ' ')
}
</script>

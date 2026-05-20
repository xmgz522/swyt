<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">学生登录日志</h2>
    </div>

    <!-- 筛选 -->
    <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
      <el-input v-model="filterPhone" placeholder="手机号筛选" clearable style="width: 180px;" @clear="loadLogs" @keyup.enter="loadLogs" />
      <el-button type="primary" @click="loadLogs">查询</el-button>
      <span style="margin-left: auto; font-size: 14px; color: #999;">共 {{ total }} 条</span>
    </div>

    <el-table :data="list" border stripe v-loading="loading" style="width: 100%;">
      <el-table-column prop="studentName" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="platform" label="平台" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.platform === 'miniapp' ? '' : 'success'">
            {{ row.platform === 'miniapp' ? '小程序' : row.platform === 'web' ? 'PC端' : row.platform }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP地址" width="150" />
      <el-table-column prop="createdAt" label="登录时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="userAgent" label="设备信息">
        <template #default="{ row }">
          <span style="font-size: 12px; color: #999;">{{ shortUA(row.userAgent) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadLogs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 20
const filterPhone = ref('')

onMounted(() => loadLogs())

async function loadLogs() {
  loading.value = true
  try {
    let url = `/students/login-logs?page=${page.value}&pageSize=${pageSize}`
    if (filterPhone.value) url += `&phone=${filterPhone.value}`
    const { data: res } = await api.get(url)
    list.value = res.data || []
    total.value = res.total || 0
  } catch {
    list.value = []
  }
  loading.value = false
}

function formatTime(t: string) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function shortUA(ua: string) {
  if (!ua) return '-'
  if (ua.length > 80) return ua.substring(0, 80) + '...'
  return ua
}
</script>

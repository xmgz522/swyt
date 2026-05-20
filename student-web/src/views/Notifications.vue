<template>
  <div class="max-w-3xl mx-auto">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">消息通知</h2>
      <div class="flex gap-2">
        <el-button v-if="list.length > 0" size="small" @click="markAllRead">全部已读</el-button>
        <el-button v-if="list.length > 0" size="small" type="danger" plain @click="clearAll">清空所有</el-button>
      </div>
    </div>

    <el-skeleton :loading="loading" :rows="5" animated>
      <template #default>
        <el-empty v-if="list.length === 0" description="暂无通知" />
        <div v-for="n in list" :key="n.id"
          class="flex gap-3 p-4 rounded-xl mb-3 cursor-pointer transition-colors"
          :class="n.isRead ? 'bg-white' : 'bg-indigo-50'"
          @click="tapNotif(n)"
        >
          <div v-if="!n.isRead" class="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
          <div v-else class="w-2.5 flex-shrink-0"></div>
          <div class="flex-1">
            <div class="flex justify-between items-center mb-1">
              <el-tag size="small" :type="typeColor[n.type]">{{ typeMap[n.type] || '系统' }}</el-tag>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400">{{ n.createdAt?.substring(0, 16).replace('T', ' ') }}</span>
                <el-button size="small" type="danger" link @click.stop="deleteNotif(n.id)">删除</el-button>
              </div>
            </div>
            <div class="font-semibold text-gray-800">{{ n.title }}</div>
            <div v-if="n.content" class="text-sm text-gray-500 mt-1">{{ n.content }}</div>
          </div>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const store = useStudentStore()
const typeMap: Record<string, string> = { system: '系统', score: '成绩', policy: '政策', exam: '考试', reminder: '提醒' }
const typeColor: Record<string, string> = { system: '', score: 'success', policy: 'warning', exam: 'primary', reminder: 'danger' }

const list = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  if (!store.studentId) { loading.value = false; return }
  try {
    const data: any = await http.get(`/notifications/student/${store.studentId}`)
    list.value = Array.isArray(data) ? data : []
  } catch {}
  loading.value = false
})

async function tapNotif(n: any) {
  if (!n.isRead) {
    n.isRead = true
    try { await http.put(`/notifications/${n.id}/read`) } catch {}
  }
}

async function markAllRead() {
  if (!store.studentId) return
  try {
    await http.put(`/notifications/student/${store.studentId}/read-all`)
    list.value.forEach(n => n.isRead = true)
    ElMessage.success('全部已读')
  } catch {}
}

async function deleteNotif(id: number) {
  try {
    await http.delete(`/notifications/${id}`)
    list.value = list.value.filter(n => n.id !== id)
  } catch { ElMessage.error('删除失败') }
}

async function clearAll() {
  if (!store.studentId) return
  try {
    for (const n of list.value) {
      await http.delete(`/notifications/${n.id}`)
    }
    list.value = []
    ElMessage.success('已清空所有通知')
  } catch { ElMessage.error('操作失败') }
}
</script>

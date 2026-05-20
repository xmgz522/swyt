<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-800">做题记录</h1>
        <p class="text-sm text-gray-400 mt-1">{{ title }}历史答题记录</p>
      </div>
      <el-button class="!rounded-lg" @click="router.back()">返回</el-button>
    </div>

    <div v-if="records.length" class="space-y-3">
      <div
        v-for="r in records"
        :key="r.id"
        class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md cursor-pointer transition-all"
        @click="router.push(`/result/${r.id}`)"
      >
        <div :class="['w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0', paperType === 'real' ? 'bg-red-50 text-red-500' : 'bg-primary-50 text-primary-500']">
          {{ paperType === 'real' ? '真' : '模' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-bold text-gray-800 truncate">{{ r.paperTitle || `试卷 #${r.paperId}` }}</p>
          <div class="flex gap-3 text-xs text-gray-400 mt-1">
            <span>{{ formatTime(r.createdAt) }}</span>
            <span>{{ statusMap[r.status] || r.status }}</span>
          </div>
        </div>
        <div class="text-right">
          <p :class="['text-xl font-bold', paperType === 'real' ? 'text-red-500' : 'text-primary-500']">{{ r.totalScore || r.objectiveScore || 0 }}<span class="text-xs text-gray-400 font-normal"> 分</span></p>
          <p class="text-xs text-gray-400 mt-1">查看详情 →</p>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-50">
      <p class="text-gray-400">暂无做题记录</p>
      <p class="text-xs text-gray-300 mt-1">完成试卷后会显示在这里</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const route = useRoute()
const router = useRouter()
const store = useStudentStore()
const records = ref<any[]>([])
const loading = ref(true)
const paperType = computed(() => route.query.type === 'real' ? 'real' : 'mock')
const title = computed(() => paperType.value === 'real' ? '历年真题' : '模拟测试')
const statusMap: Record<string, string> = { submitted: '待批改', graded: '已批改' }

onMounted(async () => {
  if (!store.studentId) {
    loading.value = false
    return
  }
  try {
    const data: any = await http.get(`/exam/answer-sheets?studentId=${store.studentId}&paperType=${paperType.value}&bankType=triad`)
    records.value = Array.isArray(data) ? data : []
  } catch {}
  loading.value = false
})

function formatTime(t: string) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { hour12: false })
}
</script>

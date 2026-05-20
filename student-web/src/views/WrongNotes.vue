<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-6">我的错题</h1>

    <!-- 统计 -->
    <div class="grid grid-cols-3 gap-4 mb-6" v-if="wrongStats">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 text-center">
        <p class="text-3xl font-bold text-red-500">{{ wrongStats.unmasteredCount || 0 }}</p>
        <p class="text-xs text-gray-400 mt-1">待攻克</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 text-center">
        <p class="text-3xl font-bold text-green-500">{{ wrongStats.masteredCount || 0 }}</p>
        <p class="text-xs text-gray-400 mt-1">已掌握</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 text-center">
        <p class="text-3xl font-bold text-gray-600">{{ wrongStats.total || 0 }}</p>
        <p class="text-xs text-gray-400 mt-1">总错题</p>
      </div>
    </div>

    <!-- 掌握状态筛选 -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        :class="['px-4 py-1.5 rounded-full text-sm font-medium transition-all', activeFilter === tab.value ? 'bg-pink-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300']"
        @click="activeFilter = tab.value; loadWrongNotes()"
      >{{ tab.label }}</button>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading" class="space-y-3 mb-6 animate-pulse">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl h-28 border border-gray-50"></div>
    </div>

    <!-- 错题列表 -->
    <div v-else class="space-y-3 mb-6">
      <div
        v-for="item in wrongNotes"
        :key="item.id"
        :class="['bg-white rounded-xl p-5 shadow-sm border transition-all', item.mastered ? 'border-green-100 opacity-60' : 'border-gray-50']"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 mb-2">
              <span v-if="item.question?.subject" class="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-500 font-medium">{{ item.question.subject }}</span>
              <span v-if="item.question?.knowledgePoint" class="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-500 font-medium">{{ item.question.knowledgePoint }}</span>
              <span v-if="item.wrongCount > 1" class="text-xs px-2 py-0.5 rounded bg-red-50 text-red-500 font-bold">错{{ item.wrongCount }}次</span>
              <span v-if="item.mastered" class="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 font-medium">✓ 已掌握</span>
            </div>
            <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{{ item.question?.content }}</p>
            <div v-if="expanded.has(item.id)" class="mt-3 p-3 bg-gray-50 rounded-lg text-xs space-y-1 border border-gray-100">
              <p><span class="font-semibold text-green-600">正确答案：</span>{{ item.question?.answer }}</p>
              <p v-if="item.lastWrongAnswer"><span class="font-semibold text-red-500">你的答案：</span>{{ item.lastWrongAnswer }}</p>
              <p v-if="item.question?.explanation"><span class="font-semibold text-gray-600">解析：</span>{{ item.question.explanation }}</p>
            </div>
          </div>
          <div class="flex flex-col gap-1.5 flex-shrink-0">
            <el-button size="small" text @click="expanded.has(item.id) ? expanded.delete(item.id) : expanded.add(item.id)">
              {{ expanded.has(item.id) ? '收起' : '解析' }}
            </el-button>
            <el-button size="small" :type="item.mastered ? 'default' : 'success'" @click="toggleMastered(item)">
              {{ item.mastered ? '取消' : '掌握' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div class="text-center mb-6" v-if="wrongTotal > wrongNotes.length">
      <el-button text type="primary" @click="loadMore">加载更多 ({{ wrongNotes.length }}/{{ wrongTotal }})</el-button>
    </div>

    <!-- 空态 -->
    <div v-if="!loading && wrongNotes.length === 0" class="text-center py-16">
      <div class="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
        <span class="text-3xl">🎉</span>
      </div>
      <p class="text-gray-400">{{ activeFilter === 'false' ? '没有待攻克的错题了！' : '暂无错题记录' }}</p>
      <p class="text-xs text-gray-300 mt-1">完成模拟卷和真题后，错题会自动收录</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const store = useStudentStore()
const wrongStats = ref<any>(null)
const wrongNotes = ref<any[]>([])
const wrongTotal = ref(0)
const page = ref(1)
const loading = ref(true)
const activeFilter = ref('false')
const activeBank = ref('triad')
const expanded = reactive(new Set<number>())

const filterTabs = [
  { label: '待攻克', value: 'false' },
  { label: '已掌握', value: 'true' },
  { label: '全部', value: '' },
]

async function reloadAll() {
  if (!store.studentId) return
  const bankParam = activeBank.value ? `?bankType=${activeBank.value}` : ''
  try { wrongStats.value = await http.get(`/exam/wrong-notes/${store.studentId}/stats${bankParam}`) } catch {}
  await loadWrongNotes()
}

async function loadWrongNotes() {
  if (!store.studentId) return
  page.value = 1
  loading.value = true
  try {
    const params = `page=1&pageSize=20${activeFilter.value ? `&mastered=${activeFilter.value}` : ''}${activeBank.value ? `&bankType=${activeBank.value}` : ''}`
    const res: any = await http.get(`/exam/wrong-notes/${store.studentId}?${params}`)
    wrongNotes.value = res.data || []
    wrongTotal.value = res.total || 0
  } catch {}
  loading.value = false
}

async function loadMore() {
  page.value++
  try {
    const params = `page=${page.value}&pageSize=20${activeFilter.value ? `&mastered=${activeFilter.value}` : ''}${activeBank.value ? `&bankType=${activeBank.value}` : ''}`
    const res: any = await http.get(`/exam/wrong-notes/${store.studentId}?${params}`)
    wrongNotes.value = [...wrongNotes.value, ...(res.data || [])]
  } catch {}
}

async function toggleMastered(item: any) {
  try {
    await http.put(`/exam/wrong-notes/${item.id}/toggle`, { mastered: !item.mastered })
    item.mastered = !item.mastered
    ElMessage.success(item.mastered ? '已标记掌握' : '已取消掌握')
    const bankParam = activeBank.value ? `?bankType=${activeBank.value}` : ''
    try { wrongStats.value = await http.get(`/exam/wrong-notes/${store.studentId}/stats${bankParam}`) } catch {}
  } catch {}
}

onMounted(async () => {
  if (!store.studentId) { loading.value = false; return }
  await reloadAll()
})
</script>

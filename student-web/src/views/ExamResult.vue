<template>
  <div>
    <el-button text @click="$router.push('/exams')" class="mb-4 !text-gray-400">← 返回试卷列表</el-button>

    <div v-if="!sheet" class="text-center py-20 text-gray-300">加载中...</div>

    <div v-else>
      <!-- 分数卡 -->
      <div class="bg-gradient-to-r from-primary-500 via-accent to-purple-400 rounded-2xl p-8 text-white text-center mb-6">
        <p class="text-sm opacity-70 mb-2">{{ sheet.paperTitle || '模拟测试' }}</p>
        <div class="w-32 h-32 rounded-full border-4 border-white/30 flex flex-col items-center justify-center mx-auto mb-4">
          <span class="text-5xl font-bold">{{ sheet.totalScore ?? '-' }}</span>
          <span class="text-xs opacity-60">分</span>
        </div>
        <div class="flex justify-center gap-4">
          <span class="bg-white/15 px-3 py-1 rounded-full text-sm">客观题 {{ sheet.objectiveScore ?? 0 }}分</span>
          <span class="bg-white/15 px-3 py-1 rounded-full text-sm">主观题 {{ sheet.subjectiveScore ?? '待批' }}{{ typeof sheet.subjectiveScore === 'number' ? '分' : '' }}</span>
        </div>
      </div>

      <!-- 状态 + 统计 -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-50 text-center">
          <div :class="['w-3 h-3 rounded-full mx-auto mb-1', sheet.status === 'graded' ? 'bg-green-500' : sheet.status === 'auto_graded' ? 'bg-orange-500' : 'bg-gray-300']"></div>
          <p class="text-sm font-medium text-gray-700">{{ statusMap[sheet.status] }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-50 text-center">
          <p class="text-2xl font-bold text-green-500">{{ correctCount }}</p>
          <p class="text-xs text-gray-400">答对</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-50 text-center">
          <p class="text-2xl font-bold text-red-500">{{ wrongCount }}</p>
          <p class="text-xs text-gray-400">答错</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-50 text-center">
          <p class="text-2xl font-bold text-orange-500">{{ pendingCount }}</p>
          <p class="text-xs text-gray-400">待批</p>
        </div>
      </div>

      <!-- 答题详情 -->
      <div v-if="sheet.questions?.length" class="bg-white rounded-xl p-6 shadow-sm border border-gray-50 mb-4">
        <h3 class="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-primary-500"></span>答题详情
        </h3>
        <div v-for="(q, idx) in sheet.questions" :key="q.questionId" class="flex gap-3 py-3 border-b border-gray-50 last:border-0">
          <div :class="['w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold flex-shrink-0', q.isCorrect === true ? 'bg-green-500' : q.isCorrect === false ? 'bg-red-500' : 'bg-orange-400']">
            {{ idx + 1 }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-700 truncate">{{ q.content }}</p>
            <div v-if="q.isCorrect === false" class="text-xs mt-1 space-y-0.5">
              <p class="text-red-400">你的答案: {{ q.studentAnswer || '-' }}</p>
              <p class="text-green-500">正确答案: {{ q.correctAnswer }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 薄弱点 -->
      <div v-if="weakPoints.length" class="bg-white rounded-xl p-6 shadow-sm border border-gray-50 mb-4">
        <h3 class="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>薄弱知识点
        </h3>
        <div class="flex flex-wrap gap-2">
          <span v-for="p in weakPoints" :key="p" class="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">{{ p }}</span>
        </div>
      </div>

      <!-- 评语 -->
      <div v-if="sheet.comment" class="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6 mb-4">
        <h3 class="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>老师评语
        </h3>
        <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ sheet.comment }}</p>
      </div>

      <!-- 待批改提示 -->
      <div v-if="sheet.status === 'auto_graded'" class="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-4">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span class="text-orange-500 text-lg">⏳</span>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-orange-800">主观题等待老师批改</p>
            <p class="text-xs text-orange-600 mt-1">批改完成后总分将自动更新，客观题得分已显示</p>
            <div class="mt-3 flex items-center gap-3">
              <div class="flex-1 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <div class="h-full bg-orange-400 rounded-full animate-pulse" style="width: 40%"></div>
              </div>
              <span class="text-xs text-orange-500">{{ pollCountdown }}s 后自动刷新</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import http from '@/utils/api'

const route = useRoute()
const statusMap: any = { pending: '待提交', auto_graded: '待批改', graded: '已批改' }
const sheet = ref<any>(null)
const pollCountdown = ref(30)
let pollTimer: any = null
let countdownTimer: any = null

const weakPoints = computed(() => {
  if (!sheet.value?.weakPoints) return []
  try { return JSON.parse(sheet.value.weakPoints) } catch { return [] }
})
const correctCount = computed(() => sheet.value?.questions?.filter((q: any) => q.isCorrect === true).length || 0)
const wrongCount = computed(() => sheet.value?.questions?.filter((q: any) => q.isCorrect === false).length || 0)
const pendingCount = computed(() => sheet.value?.questions?.filter((q: any) => q.isCorrect == null).length || 0)

async function fetchSheet() {
  const id = route.params.sheetId
  if (!id) return
  sheet.value = await http.get(`/exam/answer-sheets/${id}`)
}

function startPolling() {
  pollCountdown.value = 30
  countdownTimer = setInterval(() => {
    pollCountdown.value--
    if (pollCountdown.value <= 0) pollCountdown.value = 30
  }, 1000)
  pollTimer = setInterval(async () => {
    await fetchSheet()
    pollCountdown.value = 30
    if (sheet.value?.status === 'graded') stopPolling()
  }, 30000)
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

onMounted(async () => {
  await fetchSheet()
  if (sheet.value?.status === 'auto_graded') startPolling()
})

onUnmounted(() => stopPolling())
</script>

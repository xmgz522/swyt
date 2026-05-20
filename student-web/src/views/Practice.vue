<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <button type="button" class="text-gray-400 hover:text-gray-600 transition-colors" @click="$router.back()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h1 class="text-xl font-bold text-gray-800">{{ bankType === 'xuekao' ? '学考专项刷题' : '考点练题' }}</h1>
      <span class="text-sm text-gray-400">{{ subject }} · {{ knowledgePoint }}</span>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-20 text-gray-400">加载题目中...</div>

    <!-- 无题目 -->
    <div v-else-if="questions.length === 0" class="text-center py-20">
      <p class="text-3xl mb-2">📝</p>
      <p class="text-gray-400">该分类暂无题目</p>
    </div>

    <!-- 答题区 -->
    <div v-else>
      <!-- 进度条 -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-50 mb-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-500">第 {{ currentIdx + 1 }} / {{ questions.length }} 题</span>
          <span class="text-sm font-bold" :class="correctCount > 0 ? 'text-green-500' : 'text-gray-400'">
            正确 {{ correctCount }} / 已答 {{ answeredCount }}
          </span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-purple-500 rounded-full transition-all" :style="{ width: ((currentIdx + 1) / questions.length * 100) + '%' }"></div>
        </div>
      </div>

      <!-- 当前题目 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50 mb-4">
        <div class="flex items-center gap-2 mb-4">
          <span class="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded">{{ typeLabel(currentQ.type) }}</span>
          <span class="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">{{ currentQ.difficulty === 'easy' ? '简单' : currentQ.difficulty === 'hard' ? '困难' : '中等' }}</span>
        </div>
        <p class="text-base text-gray-800 leading-relaxed mb-6">{{ currentQ.content }}</p>

        <!-- 选择题选项 -->
        <div v-if="currentQ.type === 'single_choice' || currentQ.type === 'multi_choice' || currentQ.type === 'judge'" class="space-y-3">
          <button
            v-for="(opt, oi) in parsedOptions"
            :key="oi"
            type="button"
            :disabled="!!currentResult"
            :class="[
              'w-full text-left p-4 rounded-xl border-2 transition-all',
              !currentResult
                ? (myAnswer === opt ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50')
                : opt === currentResult.correctAnswer
                  ? 'border-green-500 bg-green-50'
                  : myAnswer === opt && !currentResult.isCorrect
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-100 bg-gray-50 opacity-60'
            ]"
            @click="selectOption(opt)"
          >
            <span class="text-sm" :class="currentResult && opt === currentResult.correctAnswer ? 'text-green-700 font-bold' : 'text-gray-700'">{{ opt }}</span>
          </button>
        </div>

        <!-- 填空题 -->
        <div v-else-if="currentQ.type === 'fill'" class="space-y-3">
          <input
            v-model="myAnswer"
            :disabled="!!currentResult"
            class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="请输入答案"
            @keyup.enter="submitAnswer"
          />
        </div>

        <!-- 简答题 -->
        <div v-else class="space-y-3">
          <textarea
            v-model="myAnswer"
            :disabled="!!currentResult"
            class="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:outline-none transition-colors min-h-[120px] resize-y"
            placeholder="请输入答案"
          ></textarea>
        </div>

        <!-- 提交按钮 -->
        <div v-if="!currentResult" class="mt-6">
          <button
            type="button"
            :disabled="!myAnswer"
            class="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium py-3 rounded-xl disabled:opacity-40 transition-all hover:shadow-lg"
            @click="submitAnswer"
          >确认答案</button>
        </div>

        <!-- 答题结果 -->
        <div v-if="currentResult" class="mt-6 p-4 rounded-xl" :class="currentResult.isCorrect ? 'bg-green-50 border border-green-200' : currentResult.needManualGrade ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'">
          <div class="flex items-center gap-2 mb-2">
            <span v-if="currentResult.isCorrect" class="text-green-600 font-bold text-sm">✓ 回答正确</span>
            <span v-else-if="currentResult.needManualGrade" class="text-blue-600 font-bold text-sm">📝 主观题，参考答案如下</span>
            <span v-else class="text-red-600 font-bold text-sm">✗ 回答错误</span>
          </div>
          <p v-if="!currentResult.isCorrect && currentResult.correctAnswer" class="text-sm text-gray-600 mb-1">
            <span class="font-medium">正确答案：</span>{{ currentResult.correctAnswer }}
          </p>
          <p v-if="currentResult.explanation" class="text-sm text-gray-500 leading-relaxed">
            <span class="font-medium">解析：</span>{{ currentResult.explanation }}
          </p>
        </div>
      </div>

      <!-- 导航按钮 -->
      <div class="flex gap-3">
        <button
          type="button"
          :disabled="currentIdx === 0"
          class="flex-1 bg-white border border-gray-200 text-gray-600 font-medium py-3 rounded-xl disabled:opacity-40 transition-all hover:bg-gray-50"
          @click="currentIdx--; resetCurrent()"
        >上一题</button>
        <button
          v-if="currentIdx < questions.length - 1"
          type="button"
          class="flex-1 bg-purple-500 text-white font-medium py-3 rounded-xl transition-all hover:bg-purple-600"
          @click="currentIdx++; resetCurrent()"
        >下一题</button>
        <button
          v-else
          type="button"
          class="flex-1 bg-green-500 text-white font-medium py-3 rounded-xl transition-all hover:bg-green-600"
          @click="$router.back()"
        >练习完成</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const route = useRoute()
const store = useStudentStore()
const subject = (route.query.subject as string) || ''
const knowledgePoint = (route.query.kp as string) || ''
const qType = (route.query.type as string) || ''
const qLimit = (route.query.limit as string) || ''
const bankType = (route.query.bankType as string) || 'triad'

const loading = ref(true)
const questions = ref<any[]>([])
const currentIdx = ref(0)
const myAnswer = ref('')
const currentResult = ref<any>(null)
const results = ref<Record<number, any>>({})

const currentQ = computed(() => questions.value[currentIdx.value] || {})
const parsedOptions = computed(() => {
  if (!currentQ.value.options) return []
  try { return JSON.parse(currentQ.value.options) } catch { return [] }
})

const answeredCount = computed(() => Object.keys(results.value).length)
const correctCount = computed(() => Object.values(results.value).filter((r: any) => r.isCorrect).length)

function typeLabel(type: string) {
  const map: Record<string, string> = { single_choice: '单选', multi_choice: '多选', judge: '判断', fill: '填空', short_answer: '简答' }
  return map[type] || type
}

function selectOption(opt: string) {
  if (currentResult.value) return
  myAnswer.value = opt
}

function resetCurrent() {
  const qid = currentQ.value?.id
  if (qid && results.value[qid]) {
    currentResult.value = results.value[qid]
    myAnswer.value = results.value[qid].myAnswer || ''
  } else {
    currentResult.value = null
    myAnswer.value = ''
  }
}

async function submitAnswer() {
  if (!myAnswer.value) return
  const qid = currentQ.value.id
  try {
    const res: any = await http.post('/exam/practice/check', { questionId: qid, answer: myAnswer.value, studentId: store.studentId })
    if (res.success !== false) {
      currentResult.value = { ...res, myAnswer: myAnswer.value }
      results.value[qid] = currentResult.value
    }
  } catch {
    currentResult.value = { isCorrect: false, correctAnswer: '(网络错误)', explanation: '', myAnswer: myAnswer.value }
  }
}

onMounted(async () => {
  try {
    const params = new URLSearchParams()
    if (subject) params.set('subject', subject)
    if (knowledgePoint) params.set('knowledgePoint', knowledgePoint)
    if (qType) params.set('type', qType)
    if (qLimit) params.set('limit', qLimit)
    if (bankType) params.set('bankType', bankType)
    const res: any = await http.get(`/exam/practice/questions?${params.toString()}`)
    questions.value = Array.isArray(res) ? res : []
  } catch {}
  loading.value = false
})
</script>

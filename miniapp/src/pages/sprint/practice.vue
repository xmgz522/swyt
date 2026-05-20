<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="top-bar">
      <text class="top-title">{{ bankType === 'xuekao' ? '学考专项刷题' : '考点练题' }}</text>
      <text class="top-sub">{{ subject }}{{ knowledgePoint ? ' · ' + knowledgePoint : '' }}</text>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="empty-state">
      <text class="empty-text">加载题目中...</text>
    </view>

    <!-- 无题 -->
    <view v-else-if="questions.length === 0" class="empty-state">
      <text class="empty-icon">📝</text>
      <text class="empty-text">该分类暂无题目</text>
    </view>

    <!-- 答题区 -->
    <view v-else>
      <!-- 进度 -->
      <view class="section-card progress-card">
        <view class="progress-top">
          <text class="progress-label">第 {{ currentIdx + 1 }} / {{ questions.length }} 题</text>
          <text :class="['progress-score', correctCount > 0 ? 'good' : '']">正确 {{ correctCount }} / 已答 {{ answeredCount }}</text>
        </view>
        <view class="progress-bar-bg">
          <view class="progress-bar-fill" :style="{ width: ((currentIdx + 1) / questions.length * 100) + '%' }"></view>
        </view>
      </view>

      <!-- 当前题 -->
      <view class="section-card">
        <view class="q-tags">
          <view class="q-tag purple"><text>{{ typeLabel(currentQ.type) }}</text></view>
          <view class="q-tag gray"><text>{{ currentQ.difficulty === 'easy' ? '简单' : currentQ.difficulty === 'hard' ? '困难' : '中等' }}</text></view>
        </view>
        <text class="q-content">{{ currentQ.content }}</text>

        <!-- 选项 -->
        <view v-if="currentQ.type === 'single_choice' || currentQ.type === 'multi_choice' || currentQ.type === 'judge'" class="opt-list">
          <view
            v-for="(opt, oi) in parsedOptions"
            :key="oi"
            :class="['opt-item',
              !currentResult ? (myAnswer === opt ? 'selected' : '') :
                opt === currentResult.correctAnswer ? 'correct' :
                myAnswer === opt && !currentResult.isCorrect ? 'wrong' : 'dim']"
            @tap="selectOption(opt)"
          >
            <text>{{ opt }}</text>
          </view>
        </view>

        <!-- 填空 -->
        <view v-else-if="currentQ.type === 'fill'" class="fill-area">
          <input
            v-model="myAnswer"
            :disabled="!!currentResult"
            class="fill-input"
            placeholder="请输入答案"
            confirm-type="done"
            @confirm="submitAnswer"
          />
        </view>

        <!-- 简答 -->
        <view v-else class="fill-area">
          <textarea
            v-model="myAnswer"
            :disabled="!!currentResult"
            class="fill-textarea"
            placeholder="请输入答案"
          ></textarea>
        </view>

        <!-- 提交 -->
        <view v-if="!currentResult" class="submit-row">
          <view :class="['submit-btn', !myAnswer ? 'disabled' : '']" @tap="submitAnswer">
            <text>确认答案</text>
          </view>
        </view>

        <!-- 结果 -->
        <view v-if="currentResult" :class="['result-card', currentResult.isCorrect ? 'correct' : currentResult.needManualGrade ? 'manual' : 'wrong']">
          <text v-if="currentResult.isCorrect" class="result-label good">✓ 回答正确</text>
          <text v-else-if="currentResult.needManualGrade" class="result-label manual">📝 主观题，参考答案如下</text>
          <text v-else class="result-label bad">✗ 回答错误</text>
          <text v-if="!currentResult.isCorrect && currentResult.correctAnswer" class="result-answer">正确答案：{{ currentResult.correctAnswer }}</text>
          <text v-if="currentResult.explanation" class="result-explain">解析：{{ currentResult.explanation }}</text>
        </view>
      </view>

      <!-- 导航 -->
      <view class="nav-row">
        <view :class="['nav-btn prev', currentIdx === 0 ? 'disabled' : '']" @tap="goPrev">
          <text>上一题</text>
        </view>
        <view v-if="currentIdx < questions.length - 1" class="nav-btn next" @tap="goNext">
          <text>下一题</text>
        </view>
        <view v-else class="nav-btn done" @tap="uni.navigateBack()">
          <text>练习完成</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get, post } from '../../utils/api'

const subject = ref('')
const knowledgePoint = ref('')
const qType = ref('')
const qLimit = ref('')
const bankType = ref('triad')
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

function goPrev() {
  if (currentIdx.value > 0) { currentIdx.value--; resetCurrent() }
}
function goNext() {
  if (currentIdx.value < questions.value.length - 1) { currentIdx.value++; resetCurrent() }
}

async function submitAnswer() {
  if (!myAnswer.value) return
  const qid = currentQ.value.id
  try {
    const studentId = uni.getStorageSync('studentId')
    const res: any = await post('/exam/practice/check', { questionId: qid, answer: myAnswer.value, studentId })
    if (res.success !== false) {
      currentResult.value = { ...res, myAnswer: myAnswer.value }
      results.value[qid] = currentResult.value
    }
  } catch {
    currentResult.value = { isCorrect: false, correctAnswer: '(网络错误)', explanation: '', myAnswer: myAnswer.value }
  }
}

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  const opts = page.options || {}
  subject.value = decodeURIComponent(opts.subject || '')
  knowledgePoint.value = decodeURIComponent(opts.knowledgePoint || opts.kp || '')
  qType.value = decodeURIComponent(opts.type || '')
  qLimit.value = decodeURIComponent(opts.limit || '')
  bankType.value = decodeURIComponent(opts.bankType || 'triad')
  uni.setNavigationBarTitle({ title: bankType.value === 'xuekao' ? '学考专项刷题' : '考点练题' })
  try {
    const paramsArr: string[] = []
    if (subject.value) paramsArr.push(`subject=${encodeURIComponent(subject.value)}`)
    if (knowledgePoint.value) paramsArr.push(`knowledgePoint=${encodeURIComponent(knowledgePoint.value)}`)
    if (qType.value) paramsArr.push(`type=${encodeURIComponent(qType.value)}`)
    if (qLimit.value) paramsArr.push(`limit=${encodeURIComponent(qLimit.value)}`)
    if (bankType.value) paramsArr.push(`bankType=${encodeURIComponent(bankType.value)}`)
    const params = paramsArr.join('&')
    const res = await get(`/exam/practice/questions?${params}`)
    questions.value = Array.isArray(res) ? res : []
  } catch {}
  loading.value = false
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 60rpx; }
.top-bar { background: #2e4a78; padding: 40rpx 36rpx 32rpx; }
.top-title { color: #fff; font-size: 34rpx; font-weight: 600; display: block; }
.top-sub { color: rgba(255,255,255,0.8); font-size: 26rpx; display: block; margin-top: 6rpx; }

.section-card { margin: 20rpx 24rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }

.empty-state { text-align: center; padding: 100rpx 0; }
.empty-icon { font-size: 60rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; display: block; }

.progress-card { padding: 20rpx 28rpx; }
.progress-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.progress-label { font-size: 26rpx; color: #666; }
.progress-score { font-size: 26rpx; color: #ccc; font-weight: 600; }
.progress-score.good { color: #52c41a; }
.progress-bar-bg { height: 10rpx; background: #f0f0f0; border-radius: 5rpx; overflow: hidden; }
.progress-bar-fill { height: 100%; background: #722ed1; border-radius: 5rpx; transition: width 0.3s; }

.q-tags { display: flex; gap: 10rpx; margin-bottom: 16rpx; }
.q-tag { padding: 4rpx 14rpx; border-radius: 8rpx; }
.q-tag.purple { background: #f3e8ff; }
.q-tag.purple text { color: #722ed1; font-size: 22rpx; font-weight: 600; }
.q-tag.gray { background: #f5f5f5; }
.q-tag.gray text { color: #999; font-size: 22rpx; }
.q-content { font-size: 30rpx; color: #333; line-height: 1.7; display: block; margin-bottom: 28rpx; }

.opt-list { display: flex; flex-direction: column; gap: 16rpx; }
.opt-item { padding: 24rpx; border-radius: 16rpx; border: 2rpx solid #e8e8e8; background: #fafafa; }
.opt-item text { font-size: 28rpx; color: #333; }
.opt-item.selected { border-color: #722ed1; background: #f3e8ff; }
.opt-item.selected text { color: #722ed1; font-weight: 600; }
.opt-item.correct { border-color: #52c41a; background: #f6ffed; }
.opt-item.correct text { color: #389e0d; font-weight: 600; }
.opt-item.wrong { border-color: #f5222d; background: #fff2f0; }
.opt-item.wrong text { color: #cf1322; }
.opt-item.dim { opacity: 0.5; }

.fill-area { margin-top: 8rpx; }
.fill-input { width: 100%; border: 2rpx solid #e8e8e8; border-radius: 16rpx; padding: 24rpx; font-size: 28rpx; }
.fill-textarea { width: 100%; border: 2rpx solid #e8e8e8; border-radius: 16rpx; padding: 24rpx; font-size: 28rpx; min-height: 200rpx; }

.submit-row { margin-top: 28rpx; }
.submit-btn { background: #2e4a78; padding: 24rpx 0; border-radius: 16rpx; text-align: center; }
.submit-btn text { color: #fff; font-size: 30rpx; font-weight: 600; }
.submit-btn.disabled { opacity: 0.4; }

.result-card { margin-top: 28rpx; padding: 24rpx; border-radius: 16rpx; }
.result-card.correct { background: #f6ffed; border: 1rpx solid #b7eb8f; }
.result-card.wrong { background: #fff2f0; border: 1rpx solid #ffa39e; }
.result-card.manual { background: #e6f7ff; border: 1rpx solid #91d5ff; }
.result-label { font-size: 28rpx; font-weight: 600; display: block; margin-bottom: 8rpx; }
.result-label.good { color: #389e0d; }
.result-label.bad { color: #cf1322; }
.result-label.manual { color: #096dd9; }
.result-answer { font-size: 26rpx; color: #555; display: block; margin-bottom: 6rpx; }
.result-explain { font-size: 24rpx; color: #888; line-height: 1.6; display: block; }

.nav-row { display: flex; gap: 16rpx; margin: 20rpx 24rpx; }
.nav-btn { flex: 1; padding: 22rpx 0; border-radius: 16rpx; text-align: center; }
.nav-btn text { font-size: 28rpx; font-weight: 600; }
.nav-btn.prev { background: #fff; border: 1rpx solid #e8e8e8; }
.nav-btn.prev text { color: #666; }
.nav-btn.next { background: #722ed1; }
.nav-btn.next text { color: #fff; }
.nav-btn.done { background: #52c41a; }
.nav-btn.done text { color: #fff; }
.nav-btn.disabled { opacity: 0.4; }
</style>

<template>
  <view class="page">
    <view v-if="!paper" class="loading-state">
      <text class="loading-text">正在加载试卷...</text>
    </view>

    <view v-else>
      <!-- 顶部固定栏：进度+计时 -->
      <view class="sticky-bar">
        <view class="bar-left">
          <text class="pause-btn" @tap="pauseExam">暂停保存</text>
          <text class="bar-progress">{{ answeredCount }}/{{ paper.questions.length }}</text>
          <view class="progress-track">
            <view class="progress-fill" :style="{ width: (answeredCount / paper.questions.length * 100) + '%' }"></view>
          </view>
        </view>
        <view class="bar-right" @tap="showAnswerCard = true">
          <text class="bar-timer">{{ formatTimer(elapsedSeconds) }}</text>
          <view class="card-btn">
            <text>答题卡</text>
          </view>
        </view>
      </view>

      <!-- 题目列表 -->
      <view v-for="(q, idx) in paper.questions" :key="q.id" :id="'q' + idx" class="question-card">
        <view class="q-header">
          <view class="q-num-badge">
            <text>{{ idx + 1 }}</text>
          </view>
          <view class="q-tags">
            <text class="q-type-tag">{{ typeMap[q.type] }}</text>
            <text class="q-score-tag">{{ q.score }}分</text>
          </view>
          <view class="q-status" v-if="answers[q.id]">
            <text class="q-done-dot"></text>
          </view>
        </view>
        <text class="q-content">{{ q.content }}</text>

        <!-- 选择题 -->
        <view v-if="['single_choice', 'judge'].includes(q.type)" class="options">
          <view
            v-for="(opt, oi) in parseOptions(q.options)"
            :key="oi"
            :class="['option', { selected: answers[q.id] === opt }]"
            @tap="answers[q.id] = opt"
          >
            <view class="opt-radio" :class="{ checked: answers[q.id] === opt }">
              <text v-if="answers[q.id] === opt" class="opt-check">V</text>
            </view>
            <text class="opt-text">{{ opt }}</text>
          </view>
        </view>

        <!-- 多选题 -->
        <view v-if="q.type === 'multi_choice'" class="options">
          <view
            v-for="(opt, oi) in parseOptions(q.options)"
            :key="oi"
            :class="['option', { selected: isMultiSelected(q.id, opt) }]"
            @tap="toggleMulti(q.id, opt)"
          >
            <view class="opt-checkbox" :class="{ checked: isMultiSelected(q.id, opt) }">
              <text v-if="isMultiSelected(q.id, opt)" class="opt-check">V</text>
            </view>
            <text class="opt-text">{{ opt }}</text>
          </view>
        </view>

        <!-- 填空/简答 -->
        <view v-if="['fill', 'short_answer'].includes(q.type)" class="textarea-wrap">
          <textarea
            v-model="answers[q.id]"
            :placeholder="q.type === 'fill' ? '请填写答案' : '请输入你的回答'"
            :maxlength="q.type === 'fill' ? 100 : 2000"
            class="answer-input"
            auto-height
          />
          <!-- 拍照上传 -->
          <view v-if="q.type === 'short_answer'" class="upload-area">
            <view class="upload-preview" v-for="(img, ii) in (imageMap[q.id] || [])" :key="ii">
              <image :src="img" mode="aspectFill" class="upload-thumb" @tap="previewImg(img)" />
              <view class="upload-del" @tap="removeImage(q.id, ii)"><text>X</text></view>
            </view>
            <view class="upload-btn" @tap="chooseImage(q.id)" v-if="(imageMap[q.id] || []).length < 3">
              <text class="upload-icon">📷</text>
              <text class="upload-text">拍照/相册</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部提交 -->
      <view class="bottom-area">
        <button class="submit-btn" @tap="confirmSubmit">
          提交答卷
        </button>
      </view>

      <!-- 答题卡弹层 -->
      <view v-if="showAnswerCard" class="overlay" @tap="showAnswerCard = false">
        <view class="answer-card" @tap.stop>
          <view class="ac-header">
            <text class="ac-title">答题卡</text>
            <text class="ac-close" @tap="showAnswerCard = false">X</text>
          </view>
          <view class="ac-grid">
            <view
              v-for="(q, idx) in paper.questions"
              :key="q.id"
              :class="['ac-item', { done: !!answers[q.id] }]"
              @tap="scrollToQ(idx)"
            >
              <text>{{ idx + 1 }}</text>
            </view>
          </view>
          <view class="ac-footer">
            <view class="ac-legend">
              <view class="ac-dot done"></view>
              <text>已答 {{ answeredCount }}</text>
            </view>
            <view class="ac-legend">
              <view class="ac-dot"></view>
              <text>未答 {{ paper.questions.length - answeredCount }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 提交确认弹窗 -->
      <view v-if="showConfirm" class="overlay" @tap="showConfirm = false">
        <view class="confirm-modal" @tap.stop>
          <text class="confirm-title">确认提交？</text>
          <text class="confirm-desc">
            已答 {{ answeredCount }} 题，未答 {{ paper.questions.length - answeredCount }} 题。
            {{ paper.questions.length - answeredCount > 0 ? '还有未完成的题目，确定提交吗？' : '确认提交答卷？' }}
          </text>
          <view class="confirm-btns">
            <button class="btn-cancel" @tap="showConfirm = false">再想想</button>
            <button class="btn-ok" :disabled="submitting" @tap="handleSubmit">{{ submitting ? '提交中...' : '确认提交' }}</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { get, post } from '../../utils/api'

const typeMap: any = { single_choice: '单选', multi_choice: '多选', judge: '判断', fill: '填空', short_answer: '简答' }
const paper = ref<any>(null)
const answers = reactive<Record<number, string>>({})
const imageMap = reactive<Record<number, string[]>>({})
const showAnswerCard = ref(false)
const showConfirm = ref(false)
const elapsedSeconds = ref(0)
let timer: any = null

const answeredCount = computed(() => {
  if (!paper.value) return 0
  return paper.value.questions.filter((q: any) => !!answers[q.id]).length
})

let currentPaperId = ''

function saveProgress() {
  if (!paper.value) return
  const data = {
    paperId: paper.value.id,
    answers: { ...answers },
    imageMap: { ...imageMap },
    elapsed: elapsedSeconds.value,
    savedAt: Date.now(),
  }
  uni.setStorageSync(`exam_progress_${currentPaperId}`, JSON.stringify(data))
}

function restoreProgress() {
  try {
    const raw = uni.getStorageSync(`exam_progress_${currentPaperId}`)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data.answers) {
      Object.entries(data.answers).forEach(([k, v]) => { answers[+k] = v as string })
    }
    if (data.imageMap) {
      Object.entries(data.imageMap).forEach(([k, v]) => { imageMap[+k] = v as string[] })
    }
    if (data.elapsed) elapsedSeconds.value = data.elapsed
  } catch {}
}

function clearProgress() {
  uni.removeStorageSync(`exam_progress_${currentPaperId}`)
}

function pauseExam() {
  saveProgress()
  uni.showToast({ title: '答题进度已保存', icon: 'success' })
  setTimeout(() => { uni.navigateBack() }, 800)
}

onMounted(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  currentPaperId = (page as any).options?.paperId || ''
  if (currentPaperId) loadPaper(+currentPaperId)
  timer = setInterval(() => { elapsedSeconds.value++ }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  // 退出时自动保存草稿
  saveProgress()
})

// 每次答题自动保存草稿（防意外退出丢失）
let autoSaveTimer: any = null
watch(() => ({ ...answers }), () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => saveProgress(), 2000)
}, { deep: true })

async function loadPaper(id: number) {
  paper.value = await get(`/exam/papers/${id}`)
  restoreProgress()
}

function parseOptions(optStr: string) {
  try { return JSON.parse(optStr) } catch { return [] }
}

function isMultiSelected(qid: number, opt: string) {
  const val = answers[qid] || ''
  const arr = val ? val.split('||') : []
  return arr.includes(opt)
}

function toggleMulti(qid: number, opt: string) {
  const val = answers[qid] || ''
  const arr = val ? val.split('||') : []
  const idx = arr.indexOf(opt)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(opt)
  answers[qid] = arr.join('||')
}

function formatTimer(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function scrollToQ(idx: number) {
  showAnswerCard.value = false
  uni.pageScrollTo({ selector: `#q${idx}`, duration: 300 })
}

function confirmSubmit() {
  showConfirm.value = true
}

function chooseImage(qid: number) {
  uni.chooseImage({
    count: 3 - (imageMap[qid] || []).length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      res.tempFilePaths.forEach(path => {
        uni.uploadFile({
          url: '/api/exam/upload-image',
          filePath: path,
          name: 'file',
          success: (upRes) => {
            try {
              const data = JSON.parse(upRes.data)
              if (data.success) {
                if (!imageMap[qid]) imageMap[qid] = []
                imageMap[qid].push(data.url)
              }
            } catch {}
          },
        })
      })
    },
  })
}

function removeImage(qid: number, idx: number) {
  imageMap[qid]?.splice(idx, 1)
}

function previewImg(url: string) {
  uni.previewImage({ current: url, urls: [url] })
}

const submitting = ref(false)

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  showConfirm.value = false
  const studentId = uni.getStorageSync('studentId')
  if (!studentId) {
    uni.showToast({ title: '请先填写个人信息', icon: 'none' }); submitting.value = false; return
  }
  const answerList = Object.entries(answers).map(([qid, answer]) => ({
    questionId: +qid, answer,
  }))
  const allImages: string[] = []
  Object.values(imageMap).forEach(arr => allImages.push(...arr))
  const res = await post('/exam/submit', {
    studentId, paperId: paper.value.id, answers: answerList,
    images: allImages.length > 0 ? JSON.stringify(allImages) : undefined,
  })
  if (res.success) {
    uni.showToast({ title: '提交成功', icon: 'success' })
    if (timer) clearInterval(timer)
    clearProgress()
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/exam/result?sheetId=${res.data.id}` })
    }, 1000)
  } else {
    uni.showToast({ title: res.message || '提交失败', icon: 'none' })
  }
  submitting.value = false
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 160rpx; }
.loading-state { display: flex; align-items: center; justify-content: center; height: 60vh; }
.loading-text { font-size: 28rpx; color: #999; }

.sticky-bar { position: sticky; top: 0; z-index: 10; background: #fff; padding: 16rpx 24rpx; padding-top: calc(env(safe-area-inset-top) + 16rpx); display: flex; align-items: center; justify-content: space-between; border-bottom: 1rpx solid #f0f0f0; }
.bar-left { display: flex; align-items: center; gap: 12rpx; flex: 1; }
.pause-btn { font-size: 24rpx; color: #fff; background: #2e4a78; padding: 10rpx 20rpx; border-radius: 8rpx; white-space: nowrap; }
.bar-progress { font-size: 26rpx; font-weight: 600; color: #2e4a78; white-space: nowrap; }
.progress-track { flex: 1; height: 6rpx; background: #eee; border-radius: 3rpx; overflow: hidden; margin-right: 20rpx; }
.progress-fill { height: 100%; background: #2e4a78; border-radius: 3rpx; transition: width 0.3s; }
.bar-right { display: flex; align-items: center; gap: 12rpx; }
.bar-timer { font-size: 26rpx; color: #888; font-variant-numeric: tabular-nums; }
.card-btn { background: #2e4a78; padding: 8rpx 20rpx; border-radius: 8rpx; }
.card-btn text { color: #fff; font-size: 22rpx; }

.question-card { margin: 16rpx 24rpx; background: #fff; border-radius: 16rpx; padding: 28rpx; }
.q-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
.q-num-badge { width: 44rpx; height: 44rpx; border-radius: 10rpx; background: #2e4a78; display: flex; align-items: center; justify-content: center; }
.q-num-badge text { color: #fff; font-size: 24rpx; font-weight: 600; }
.q-tags { display: flex; gap: 8rpx; flex: 1; }
.q-type-tag { font-size: 22rpx; color: #5a7ab5; background: #edf2fa; padding: 4rpx 14rpx; border-radius: 6rpx; }
.q-score-tag { font-size: 22rpx; color: #8b6914; background: #faf5ee; padding: 4rpx 14rpx; border-radius: 6rpx; }
.q-status { }
.q-done-dot { display: block; width: 16rpx; height: 16rpx; border-radius: 50%; background: #52c41a; }
.q-content { font-size: 30rpx; line-height: 1.7; color: #333; margin-bottom: 20rpx; display: block; }

.options { display: flex; flex-direction: column; gap: 14rpx; }
.option { display: flex; align-items: center; gap: 16rpx; padding: 22rpx 24rpx; border: 2rpx solid #e8e8e8; border-radius: 16rpx; transition: all 0.2s; }
.option.selected { border-color: #2e4a78; background: #edf2fa; }
.opt-radio { width: 36rpx; height: 36rpx; border-radius: 50%; border: 3rpx solid #d9d9d9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.opt-radio.checked { border-color: #2e4a78; background: #2e4a78; }
.opt-checkbox { width: 36rpx; height: 36rpx; border-radius: 8rpx; border: 3rpx solid #d9d9d9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.opt-checkbox.checked { border-color: #2e4a78; background: #2e4a78; }
.opt-check { color: #fff; font-size: 22rpx; font-weight: bold; }
.opt-text { font-size: 28rpx; color: #333; flex: 1; line-height: 1.5; }

.textarea-wrap { margin-top: 8rpx; }
.answer-input { width: 100%; min-height: 160rpx; border: 2rpx solid #e8e8e8; border-radius: 16rpx; padding: 20rpx; font-size: 28rpx; line-height: 1.6; box-sizing: border-box; }

.upload-area { display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 16rpx; }
.upload-preview { position: relative; width: 160rpx; height: 160rpx; }
.upload-thumb { width: 160rpx; height: 160rpx; border-radius: 12rpx; border: 2rpx solid #e8e8e8; }
.upload-del { position: absolute; top: -10rpx; right: -10rpx; width: 36rpx; height: 36rpx; border-radius: 50%; background: #f5222d; display: flex; align-items: center; justify-content: center; }
.upload-del text { color: #fff; font-size: 20rpx; font-weight: bold; }
.upload-btn { width: 160rpx; height: 160rpx; border: 2rpx dashed #d9d9d9; border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8rpx; background: #fafafa; }
.upload-icon { font-size: 40rpx; }
.upload-text { font-size: 22rpx; color: #999; }

.bottom-area { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx; background: #fff; box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.06); z-index: 10; }
.submit-btn { background: #2e4a78; color: #fff; border: none; border-radius: 16rpx; font-size: 32rpx; height: 88rpx; line-height: 88rpx; font-weight: 600; }

.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
.answer-card { background: #fff; border-radius: 32rpx 32rpx 0 0; width: 100%; max-height: 70vh; padding: 32rpx; }
.ac-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.ac-title { font-size: 32rpx; font-weight: 600; color: #333; }
.ac-close { font-size: 32rpx; color: #999; padding: 8rpx; }
.ac-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.ac-item { width: 72rpx; height: 72rpx; border-radius: 14rpx; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
.ac-item text { font-size: 26rpx; color: #999; }
.ac-item.done { background: #2e4a78; }
.ac-item.done text { color: #fff; }
.ac-footer { display: flex; gap: 32rpx; margin-top: 24rpx; padding-top: 20rpx; border-top: 1rpx solid #f0f0f0; }
.ac-legend { display: flex; align-items: center; gap: 8rpx; font-size: 24rpx; color: #666; }
.ac-dot { width: 20rpx; height: 20rpx; border-radius: 6rpx; background: #f5f5f5; }
.ac-dot.done { background: #2e4a78; }

.confirm-modal { background: #fff; border-radius: 32rpx 32rpx 0 0; width: 100%; padding: 48rpx 32rpx; }
.confirm-title { font-size: 34rpx; font-weight: 600; color: #333; display: block; text-align: center; margin-bottom: 16rpx; }
.confirm-desc { font-size: 28rpx; color: #666; line-height: 1.6; display: block; text-align: center; margin-bottom: 36rpx; }
.confirm-btns { display: flex; gap: 20rpx; }
.btn-cancel { flex: 1; height: 80rpx; line-height: 80rpx; border-radius: 40rpx; background: #f5f5f5; color: #666; font-size: 28rpx; border: none; }
.btn-ok { flex: 1; height: 80rpx; line-height: 80rpx; border-radius: 12rpx; background: #2e4a78; color: #fff; font-size: 28rpx; border: none; }
</style>

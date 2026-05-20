<template>
  <view class="page">
    <!-- 阶段1: 选学校 -->
    <view v-if="step === 'select'" class="stage">
      <view class="page-header">
        <text class="page-title">模拟面试</text>
        <text class="page-sub">选择目标院校，随机抽题模拟面试</text>
      </view>

      <!-- 雷达图概览 -->
      <view v-if="radarData && radarData.radar" class="radar-card">
        <text class="radar-title">我的面试能力</text>
        <view class="radar-chart">
          <canvas canvas-id="radarCanvas" id="radarCanvas" class="radar-canvas" />
        </view>
        <view class="radar-scores">
          <view class="rs-item" v-for="item in radarItems" :key="item.key">
            <text class="rs-label">{{ item.label }}</text>
            <view class="rs-bar-bg">
              <view class="rs-bar" :style="{ width: (radarData.radar[item.key] / 10 * 100) + '%' }"></view>
            </view>
            <text class="rs-val">{{ radarData.radar[item.key] }}</text>
          </view>
        </view>
        <text class="radar-avg">综合评分: {{ radarData.radar.total }}/10</text>
      </view>

      <!-- 学校列表 -->
      <view class="school-list">
        <view v-for="s in schoolList" :key="s.schoolId" class="school-card" @tap="chooseSchool(s)">
          <view class="school-avatar"><text>{{ s.schoolName.charAt(0) }}</text></view>
          <view class="school-info">
            <text class="school-name">{{ s.schoolName }}</text>
            <text class="school-count">{{ s.questionCount }} 道面试题</text>
          </view>
          <text class="school-arrow">›</text>
        </view>
      </view>

      <!-- 历史记录 -->
      <view v-if="history.length > 0" class="history-section">
        <text class="section-title">历史记录</text>
        <view v-for="h in history" :key="h.id" class="history-item" @tap="viewDetail(h.id)">
          <view class="hi-left">
            <text class="hi-school">{{ h.schoolName }}</text>
            <text class="hi-time">{{ formatTime(h.createdAt) }}</text>
          </view>
          <view class="hi-right">
            <text :class="['hi-status', 'st-' + h.status]">{{ statusMap[h.status] }}</text>
            <text v-if="h.status === 'graded'" class="hi-score">{{ h.totalScore }}分</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 阶段2: 答题 -->
    <view v-if="step === 'answering'" class="stage">
      <view class="answer-header">
        <text class="ah-school">{{ mockData.schoolName }}</text>
        <text class="ah-progress">{{ currentIdx + 1 }}/{{ mockData.questions.length }}</text>
      </view>

      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: ((currentIdx + 1) / mockData.questions.length * 100) + '%' }"></view>
      </view>

      <view class="question-card">
        <view class="qc-tags">
          <view v-if="currentQ.category" class="qc-tag purple"><text>{{ currentQ.category }}</text></view>
          <view v-if="currentQ.difficulty" :class="['qc-tag', diffClass[currentQ.difficulty]]"><text>{{ diffLabel[currentQ.difficulty] }}</text></view>
        </view>
        <text class="qc-question">{{ currentQ.question }}</text>
        <view v-if="currentQ.tips" class="qc-tips">
          <text class="tips-icon">💡</text>
          <text class="tips-text">{{ currentQ.tips }}</text>
        </view>
      </view>

      <view class="answer-input">
        <text class="ai-label">你的回答</text>
        <textarea
          v-model="answers[currentIdx].answer"
          placeholder="请输入你的回答..."
          class="ai-textarea"
          :maxlength="2000"
        />
        <text class="ai-count">{{ (answers[currentIdx].answer || '').length }}/2000</text>
      </view>

      <view class="answer-nav">
        <button v-if="currentIdx > 0" class="nav-btn prev" @tap="currentIdx--">上一题</button>
        <button v-if="currentIdx < mockData.questions.length - 1" class="nav-btn next" @tap="nextQ">下一题</button>
        <button v-if="currentIdx === mockData.questions.length - 1" class="nav-btn submit" @tap="submitAll">提交面试</button>
      </view>
    </view>

    <!-- 阶段3: 查看结果 -->
    <view v-if="step === 'result'" class="stage">
      <view v-if="!detail" class="loading"><text>加载中...</text></view>
      <view v-else>
        <view class="result-header" :class="'rh-' + detail.status">
          <text class="rh-school">{{ detail.schoolName }}</text>
          <text class="rh-status">{{ statusMap[detail.status] }}</text>
          <text v-if="detail.status === 'graded'" class="rh-score">{{ detail.totalScore }}分</text>
        </view>

        <!-- 评分雷达（已评分时显示） -->
        <view v-if="detail.status === 'graded'" class="score-card">
          <text class="sc-title">面试评分</text>
          <view class="sc-dimensions">
            <view class="sc-dim" v-for="dim in dimensions" :key="dim.key">
              <text class="sc-label">{{ dim.label }}</text>
              <view class="sc-bar-bg">
                <view class="sc-bar" :style="{ width: (detail[dim.key] / 10 * 100) + '%' }"></view>
              </view>
              <text class="sc-val">{{ detail[dim.key] }}</text>
            </view>
          </view>
          <view v-if="detail.feedback" class="sc-feedback">
            <text class="sc-fb-label">老师评语</text>
            <text class="sc-fb-text">{{ detail.feedback }}</text>
          </view>
        </view>

        <view v-if="detail.status === 'submitted'" class="pending-card">
          <text class="pending-icon">⏳</text>
          <text class="pending-text">回答已提交，等待老师评分</text>
        </view>

        <!-- 问答详情 -->
        <view class="qa-list">
          <text class="section-title">问答详情</text>
          <view v-for="(q, idx) in detail.questions" :key="q.id" class="qa-item">
            <text class="qa-num">第 {{ idx + 1 }} 题</text>
            <text class="qa-question">{{ q.question }}</text>
            <view class="qa-block student">
              <text class="qa-label">我的回答</text>
              <text class="qa-content">{{ q.studentAnswer || '未作答' }}</text>
            </view>
            <view class="qa-block ref">
              <text class="qa-label">参考答案</text>
              <text class="qa-content">{{ q.referenceAnswer }}</text>
            </view>
          </view>
        </view>

        <button class="back-btn" @tap="backToSelect">返回</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { get, post } from '../../utils/api'

const diffLabel: Record<string, string> = { easy: '简单', medium: '中等', hard: '较难' }
const diffClass: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }
const statusMap: Record<string, string> = { pending: '答题中', submitted: '待评分', graded: '已评分' }

const radarItems = [
  { key: 'logic', label: '逻辑表达' },
  { key: 'knowledge', label: '知识面' },
  { key: 'quality', label: '综合素质' },
  { key: 'expression', label: '语言表达' },
  { key: 'adaptability', label: '应变能力' },
]
const dimensions = [
  { key: 'scoreLogic', label: '逻辑表达' },
  { key: 'scoreKnowledge', label: '知识面' },
  { key: 'scoreQuality', label: '综合素质' },
  { key: 'scoreExpression', label: '语言表达' },
  { key: 'scoreAdaptability', label: '应变能力' },
]

const step = ref<'select' | 'answering' | 'result'>('select')
const schoolList = ref<any[]>([])
const history = ref<any[]>([])
const radarData = ref<any>(null)
const mockData = ref<any>({ questions: [] })
const currentIdx = ref(0)
const answers = ref<{ questionId: number; answer: string }[]>([])
const detail = ref<any>(null)

function getStudentId() {
  return uni.getStorageSync('studentId')
}

onMounted(async () => {
  const sid = getStudentId()
  if (!sid) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  try {
    const [schools, hist, radar]: any = await Promise.all([
      get('/interview/schools'),
      get(`/interview/mock/history/${sid}`),
      get(`/interview/mock/radar/${sid}`),
    ])
    schoolList.value = schools || []
    history.value = hist || []
    radarData.value = radar
    if (radar?.radar) {
      nextTick(() => drawRadar(radar.radar))
    }
  } catch {}
})

const currentQ = computed(() => {
  return mockData.value.questions[currentIdx.value] || {}
})

async function chooseSchool(s: any) {
  const sid = getStudentId()
  if (!sid) { uni.showToast({ title: '请先登录', icon: 'none' }); return }
  uni.showLoading({ title: '正在抽题...' })
  try {
    const data = await post('/interview/mock/start', { studentId: +sid, schoolId: s.schoolId, count: 5 })
    mockData.value = data
    answers.value = data.questions.map((q: any) => ({ questionId: q.id, answer: '' }))
    currentIdx.value = 0
    step.value = 'answering'
  } catch (e: any) {
    uni.showToast({ title: e.message || '抽题失败', icon: 'none' })
  }
  uni.hideLoading()
}

function nextQ() {
  if (currentIdx.value < mockData.value.questions.length - 1) {
    currentIdx.value++
  }
}

async function submitAll() {
  const unanswered = answers.value.filter(a => !a.answer.trim()).length
  if (unanswered > 0) {
    uni.showModal({
      title: '提示',
      content: `还有 ${unanswered} 道题未作答，确定提交？`,
      success: async (res) => {
        if (res.confirm) await doSubmit()
      }
    })
  } else {
    await doSubmit()
  }
}

async function doSubmit() {
  uni.showLoading({ title: '提交中...' })
  try {
    await post(`/interview/mock/${mockData.value.id}/submit`, { answers: answers.value })
    uni.showToast({ title: '提交成功，等待老师评分', icon: 'none', duration: 2000 })
    // 跳到结果页
    await loadDetail(mockData.value.id)
    step.value = 'result'
  } catch {
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
  uni.hideLoading()
}

async function viewDetail(id: number) {
  await loadDetail(id)
  step.value = 'result'
}

async function loadDetail(id: number) {
  try {
    detail.value = await get(`/interview/mock/detail/${id}`)
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function backToSelect() {
  step.value = 'select'
  detail.value = null
  // 刷新历史和雷达
  const sid = getStudentId()
  if (sid) {
    try {
      const [hist, radar]: any = await Promise.all([
        get(`/interview/mock/history/${sid}`),
        get(`/interview/mock/radar/${sid}`),
      ])
      history.value = hist || []
      radarData.value = radar
      if (radar?.radar) {
        nextTick(() => drawRadar(radar.radar))
      }
    } catch {}
  }
}

function formatTime(t: string) {
  if (!t) return ''
  return t.substring(0, 16).replace('T', ' ')
}

// 绘制雷达图（使用 Canvas）
function drawRadar(radar: any) {
  try {
    const ctx = uni.createCanvasContext('radarCanvas')
    const w = 260, h = 260
    const cx = w / 2, cy = h / 2
    const r = 90
    const labels = radarItems.map(i => i.label)
    const values = radarItems.map(i => (radar[i.key] || 0) / 10)
    const n = labels.length
    const angleStep = (Math.PI * 2) / n
    const startAngle = -Math.PI / 2

    // 背景网格
    for (let level = 1; level <= 5; level++) {
      const lr = r * (level / 5)
      ctx.beginPath()
      for (let i = 0; i <= n; i++) {
        const angle = startAngle + i * angleStep
        const x = cx + lr * Math.cos(angle)
        const y = cy + lr * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.setStrokeStyle(level === 5 ? '#d9d9d9' : '#f0f0f0')
      ctx.setLineWidth(1)
      ctx.stroke()
    }

    // 轴线
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
      ctx.setStrokeStyle('#e8e8e8')
      ctx.setLineWidth(1)
      ctx.stroke()
    }

    // 数据区域
    ctx.beginPath()
    for (let i = 0; i <= n; i++) {
      const idx = i % n
      const angle = startAngle + idx * angleStep
      const val = values[idx]
      const x = cx + r * val * Math.cos(angle)
      const y = cy + r * val * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.setFillStyle('rgba(114, 46, 209, 0.15)')
    ctx.fill()
    ctx.setStrokeStyle('#722ed1')
    ctx.setLineWidth(2)
    ctx.stroke()

    // 数据点
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep
      const val = values[i]
      const x = cx + r * val * Math.cos(angle)
      const y = cy + r * val * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.setFillStyle('#722ed1')
      ctx.fill()
    }

    // 标签
    ctx.setFillStyle('#666')
    ctx.setFontSize(11)
    ctx.setTextAlign('center')
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep
      const x = cx + (r + 22) * Math.cos(angle)
      const y = cy + (r + 22) * Math.sin(angle) + 4
      ctx.fillText(labels[i], x, y)
    }

    ctx.draw()
  } catch {}
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 40rpx; }
.stage { padding: 0 0 40rpx; }
.loading { display: flex; justify-content: center; padding: 200rpx 0; color: #999; }

/* 选校页 */
.page-header { padding: 32rpx 32rpx 20rpx; }
.page-title { font-size: 40rpx; font-weight: bold; color: #1a1a2e; display: block; }
.page-sub { font-size: 26rpx; color: #999; margin-top: 8rpx; display: block; }

.radar-card { margin: 0 24rpx 20rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; }
.radar-title { font-size: 30rpx; font-weight: 600; color: #333; display: block; margin-bottom: 16rpx; }
.radar-chart { display: flex; justify-content: center; }
.radar-canvas { width: 260px; height: 260px; }
.radar-scores { margin-top: 16rpx; }
.rs-item { display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx; }
.rs-label { font-size: 24rpx; color: #666; width: 120rpx; flex-shrink: 0; }
.rs-bar-bg { flex: 1; height: 12rpx; background: #f0f0f5; border-radius: 6rpx; overflow: hidden; }
.rs-bar { height: 100%; background: linear-gradient(90deg, #722ed1, #b37feb); border-radius: 6rpx; transition: width 0.6s; }
.rs-val { font-size: 24rpx; color: #722ed1; font-weight: 600; width: 60rpx; text-align: right; }
.radar-avg { display: block; text-align: center; font-size: 28rpx; font-weight: 600; color: #722ed1; margin-top: 16rpx; }

.school-list { padding: 0 24rpx; }
.school-card { display: flex; align-items: center; gap: 20rpx; background: #fff; border-radius: 20rpx; padding: 28rpx 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.school-avatar { width: 80rpx; height: 80rpx; border-radius: 16rpx; background: linear-gradient(135deg, #722ed1, #b37feb); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.school-avatar text { color: #fff; font-size: 36rpx; font-weight: bold; }
.school-info { flex: 1; }
.school-name { font-size: 30rpx; font-weight: 600; color: #333; display: block; }
.school-count { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }
.school-arrow { font-size: 40rpx; color: #ccc; }

.history-section { margin: 24rpx 24rpx 0; background: #fff; border-radius: 20rpx; padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: 600; color: #333; display: block; margin-bottom: 16rpx; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.hi-left { display: flex; flex-direction: column; gap: 4rpx; }
.hi-school { font-size: 28rpx; color: #333; font-weight: 500; }
.hi-time { font-size: 22rpx; color: #999; }
.hi-right { display: flex; align-items: center; gap: 12rpx; }
.hi-status { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 8rpx; }
.st-pending { background: #fff7e6; color: #fa8c16; }
.st-submitted { background: #e6f7ff; color: #1890ff; }
.st-graded { background: #f6ffed; color: #52c41a; }
.hi-score { font-size: 28rpx; font-weight: 600; color: #722ed1; }

/* 答题页 */
.answer-header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 32rpx; background: linear-gradient(135deg, #722ed1, #b37feb); }
.ah-school { font-size: 32rpx; font-weight: bold; color: #fff; }
.ah-progress { font-size: 28rpx; color: rgba(255,255,255,0.8); }

.progress-bar { height: 8rpx; background: #e8e8e8; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #722ed1, #b37feb); transition: width 0.3s; }

.question-card { margin: 24rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; }
.qc-tags { display: flex; gap: 10rpx; margin-bottom: 16rpx; flex-wrap: wrap; }
.qc-tag { padding: 4rpx 14rpx; border-radius: 8rpx; }
.qc-tag text { font-size: 22rpx; }
.qc-tag.purple { background: #f0ebff; }
.qc-tag.purple text { color: #722ed1; }
.qc-tag.green { background: #f0fff4; }
.qc-tag.green text { color: #52c41a; }
.qc-tag.orange { background: #fff7e6; }
.qc-tag.orange text { color: #fa8c16; }
.qc-tag.red { background: #fff1f0; }
.qc-tag.red text { color: #f5222d; }
.qc-question { font-size: 32rpx; color: #333; line-height: 1.7; display: block; font-weight: 500; }
.qc-tips { display: flex; gap: 8rpx; margin-top: 16rpx; background: #fffbe6; border-radius: 12rpx; padding: 16rpx; }
.tips-icon { font-size: 26rpx; }
.tips-text { font-size: 24rpx; color: #8c6e00; line-height: 1.5; flex: 1; }

.answer-input { margin: 0 24rpx; background: #fff; border-radius: 20rpx; padding: 24rpx; }
.ai-label { font-size: 26rpx; font-weight: 600; color: #333; display: block; margin-bottom: 12rpx; }
.ai-textarea { width: 100%; height: 300rpx; border: 2rpx solid #e8e8e8; border-radius: 12rpx; padding: 16rpx; font-size: 28rpx; line-height: 1.6; box-sizing: border-box; }
.ai-count { font-size: 22rpx; color: #ccc; display: block; text-align: right; margin-top: 8rpx; }

.answer-nav { display: flex; gap: 16rpx; padding: 24rpx; }
.nav-btn { flex: 1; height: 80rpx; line-height: 80rpx; border-radius: 12rpx; font-size: 28rpx; border: none; }
.nav-btn.prev { background: #f0f0f5; color: #666; }
.nav-btn.next { background: linear-gradient(135deg, #722ed1, #b37feb); color: #fff; }
.nav-btn.submit { background: linear-gradient(135deg, #52c41a, #95de64); color: #fff; }

/* 结果页 */
.result-header { padding: 40rpx 32rpx; text-align: center; border-radius: 0 0 32rpx 32rpx; }
.rh-graded { background: linear-gradient(135deg, #52c41a, #95de64); }
.rh-submitted { background: linear-gradient(135deg, #1890ff, #69c0ff); }
.rh-pending { background: linear-gradient(135deg, #fa8c16, #ffc069); }
.rh-school { font-size: 34rpx; font-weight: bold; color: #fff; display: block; }
.rh-status { font-size: 26rpx; color: rgba(255,255,255,0.85); display: block; margin-top: 8rpx; }
.rh-score { font-size: 60rpx; font-weight: bold; color: #fff; display: block; margin-top: 12rpx; }

.score-card { margin: 24rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; }
.sc-title { font-size: 30rpx; font-weight: 600; color: #333; display: block; margin-bottom: 20rpx; }
.sc-dimensions { }
.sc-dim { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; }
.sc-label { font-size: 26rpx; color: #666; width: 120rpx; flex-shrink: 0; }
.sc-bar-bg { flex: 1; height: 16rpx; background: #f0f0f5; border-radius: 8rpx; overflow: hidden; }
.sc-bar { height: 100%; background: linear-gradient(90deg, #722ed1, #b37feb); border-radius: 8rpx; transition: width 0.6s; }
.sc-val { font-size: 26rpx; color: #722ed1; font-weight: 600; width: 60rpx; text-align: right; }
.sc-feedback { margin-top: 20rpx; background: #f9f0ff; border-radius: 12rpx; padding: 20rpx; }
.sc-fb-label { font-size: 26rpx; font-weight: 600; color: #722ed1; display: block; margin-bottom: 8rpx; }
.sc-fb-text { font-size: 28rpx; color: #444; line-height: 1.7; display: block; white-space: pre-wrap; }

.pending-card { margin: 40rpx 24rpx; background: #fff; border-radius: 20rpx; padding: 60rpx 40rpx; text-align: center; }
.pending-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
.pending-text { font-size: 28rpx; color: #999; }

.qa-list { margin: 24rpx; }
.qa-item { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.qa-num { font-size: 24rpx; color: #999; display: block; margin-bottom: 8rpx; }
.qa-question { font-size: 30rpx; color: #333; line-height: 1.6; display: block; font-weight: 500; margin-bottom: 16rpx; }
.qa-block { border-radius: 12rpx; padding: 16rpx; margin-bottom: 12rpx; }
.qa-block.student { background: #f0ebff; }
.qa-block.ref { background: #f6f8ff; }
.qa-label { font-size: 24rpx; font-weight: 600; display: block; margin-bottom: 6rpx; }
.qa-block.student .qa-label { color: #722ed1; }
.qa-block.ref .qa-label { color: #1890ff; }
.qa-content { font-size: 28rpx; color: #444; line-height: 1.7; display: block; white-space: pre-wrap; }

.back-btn { margin: 24rpx; background: #722ed1; color: #fff; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 28rpx; }
</style>

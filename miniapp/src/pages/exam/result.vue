<template>
  <view class="page">
    <view v-if="!sheet" class="loading-state">
      <text>加载中...</text>
    </view>

    <view v-else>
      <!-- 分数大卡 -->
      <view class="score-hero">
        <view class="score-bg"></view>
        <view class="score-content">
          <text class="paper-name">{{ sheet.paperTitle || '模拟测试' }}</text>
          <view class="score-ring">
            <text class="score-value">{{ sheet.totalScore ?? '-' }}</text>
            <text class="score-unit">分</text>
          </view>
          <view class="score-detail-row">
            <view class="detail-chip">
              <text class="chip-label">客观题</text>
              <text class="chip-val">{{ sheet.objectiveScore ?? 0 }}分</text>
            </view>
            <view class="detail-chip">
              <text class="chip-label">主观题</text>
              <text class="chip-val">{{ sheet.subjectiveScore ?? '待批' }}{{ typeof sheet.subjectiveScore === 'number' ? '分' : '' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 状态条 -->
      <view class="status-bar">
        <view class="status-left">
          <view :class="['status-dot', sheet.status]"></view>
          <text class="status-text">{{ statusMap[sheet.status] }}</text>
        </view>
        <text class="status-time" v-if="sheet.createdAt">{{ sheet.createdAt?.substring(0, 16) }}</text>
      </view>

      <!-- 答题统计 -->
      <view v-if="sheet.questions && sheet.questions.length > 0" class="stats-row">
        <view class="stat-card correct">
          <text class="stat-num">{{ correctCount }}</text>
          <text class="stat-label">答对</text>
        </view>
        <view class="stat-card wrong">
          <text class="stat-num">{{ wrongCount }}</text>
          <text class="stat-label">答错</text>
        </view>
        <view class="stat-card pending">
          <text class="stat-num">{{ pendingCount }}</text>
          <text class="stat-label">待批</text>
        </view>
      </view>

      <!-- 答题详情 -->
      <view v-if="sheet.questions && sheet.questions.length > 0" class="section-card">
        <view class="section-header">
          <view class="section-dot" style="background: #2e4a78;"></view>
          <text class="section-title">答题详情</text>
        </view>
        <view v-for="(q, idx) in sheet.questions" :key="q.questionId" class="q-item">
          <view class="q-row">
            <view :class="['q-num', q.isCorrect === true ? 'right' : q.isCorrect === false ? 'wrong' : 'wait']">
              <text>{{ idx + 1 }}</text>
            </view>
            <view class="q-body">
              <text class="q-text">{{ q.content.length > 50 ? q.content.substring(0, 50) + '...' : q.content }}</text>
              <view v-if="q.isCorrect === false" class="q-compare">
                <text class="q-your">你的答案: {{ q.studentAnswer || '-' }}</text>
                <text class="q-correct">正确答案: {{ q.correctAnswer }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 薄弱知识点 -->
      <view v-if="weakPoints.length > 0" class="section-card">
        <view class="section-header">
          <view class="section-dot" style="background: #f5222d;"></view>
          <text class="section-title">薄弱知识点</text>
        </view>
        <view class="weak-grid">
          <view v-for="point in weakPoints" :key="point" class="weak-tag">
            <text>{{ point }}</text>
          </view>
        </view>
      </view>

      <!-- 老师评语 -->
      <view v-if="sheet.comment" class="section-card comment-card">
        <view class="section-header">
          <view class="section-dot" style="background: #722ed1;"></view>
          <text class="section-title">老师评语</text>
        </view>
        <text class="comment-text">{{ sheet.comment }}</text>
      </view>

      <!-- 待批改提示 -->
      <view v-if="sheet.status === 'auto_graded'" class="notice-bar">
        <text class="notice-icon">!</text>
        <text class="notice-text">主观题尚未批改，请等待老师批改后查看完整成绩</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '../../utils/api'

const statusMap: any = { pending: '待提交', auto_graded: '待人工批改', graded: '已批改' }
const sheet = ref<any>(null)

const weakPoints = computed(() => {
  if (!sheet.value?.weakPoints) return []
  try { return JSON.parse(sheet.value.weakPoints) } catch { return [] }
})

const correctCount = computed(() => {
  if (!sheet.value?.questions) return 0
  return sheet.value.questions.filter((q: any) => q.isCorrect === true).length
})
const wrongCount = computed(() => {
  if (!sheet.value?.questions) return 0
  return sheet.value.questions.filter((q: any) => q.isCorrect === false).length
})
const pendingCount = computed(() => {
  if (!sheet.value?.questions) return 0
  return sheet.value.questions.filter((q: any) => q.isCorrect == null).length
})

onMounted(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const sheetId = (page as any).options?.sheetId
  if (sheetId) loadSheet(+sheetId)
})

async function loadSheet(id: number) {
  sheet.value = await get(`/exam/answer-sheets/${id}`)
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 60rpx; }
.loading-state { display: flex; align-items: center; justify-content: center; height: 60vh; color: #999; font-size: 28rpx; }

.score-hero { position: relative; overflow: hidden; }
.score-bg { position: absolute; top: 0; left: 0; right: 0; height: 440rpx; background: #2e4a78; border-radius: 0 0 48rpx 48rpx; }
.score-content { position: relative; z-index: 1; padding: 40rpx 36rpx 50rpx; text-align: center; }
.paper-name { color: rgba(255,255,255,0.75); font-size: 26rpx; display: block; margin-bottom: 16rpx; }
.score-ring { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; width: 200rpx; height: 200rpx; border-radius: 50%; border: 8rpx solid rgba(255,255,255,0.3); margin-bottom: 20rpx; }
.score-value { color: #fff; font-size: 72rpx; font-weight: 600; line-height: 1; }
.score-unit { color: rgba(255,255,255,0.7); font-size: 24rpx; margin-top: 4rpx; }
.score-detail-row { display: flex; justify-content: center; gap: 24rpx; }
.detail-chip { background: rgba(255,255,255,0.15); padding: 10rpx 24rpx; border-radius: 20rpx; display: flex; gap: 8rpx; align-items: center; }
.chip-label { color: rgba(255,255,255,0.7); font-size: 24rpx; }
.chip-val { color: #fff; font-size: 24rpx; font-weight: 600; }

.status-bar { margin: -16rpx 24rpx 16rpx; background: #fff; border-radius: 16rpx; padding: 20rpx 28rpx; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4rpx 16rpx rgba(102,126,234,0.12); position: relative; z-index: 2; }
.status-left { display: flex; align-items: center; gap: 10rpx; }
.status-dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.status-dot.graded { background: #52c41a; }
.status-dot.auto_graded { background: #fa8c16; }
.status-dot.pending { background: #d9d9d9; }
.status-text { font-size: 28rpx; font-weight: 600; color: #333; }
.status-time { font-size: 24rpx; color: #bbb; }

.stats-row { display: flex; gap: 16rpx; padding: 0 24rpx; margin-bottom: 16rpx; }
.stat-card { flex: 1; background: #fff; border-radius: 16rpx; padding: 20rpx; text-align: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.stat-card .stat-num { font-size: 40rpx; font-weight: 600; display: block; }
.stat-card .stat-label { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
.stat-card.correct .stat-num { color: #52c41a; }
.stat-card.wrong .stat-num { color: #f5222d; }
.stat-card.pending .stat-num { color: #fa8c16; }

.section-card { margin: 0 24rpx 16rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.section-header { display: flex; align-items: center; gap: 10rpx; margin-bottom: 20rpx; }
.section-dot { width: 12rpx; height: 12rpx; border-radius: 50%; }
.section-title { font-size: 30rpx; font-weight: 600; color: #333; }

.q-item { padding: 16rpx 0; border-bottom: 1rpx solid #f8f8f8; }
.q-item:last-child { border-bottom: none; }
.q-row { display: flex; gap: 16rpx; }
.q-num { width: 44rpx; height: 44rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.q-num text { font-size: 22rpx; font-weight: 600; color: #fff; }
.q-num.right { background: #52c41a; }
.q-num.wrong { background: #f5222d; }
.q-num.wait { background: #fa8c16; }
.q-body { flex: 1; }
.q-text { font-size: 26rpx; color: #333; line-height: 1.5; display: block; }
.q-compare { margin-top: 8rpx; display: flex; flex-direction: column; gap: 4rpx; }
.q-your { font-size: 24rpx; color: #f5222d; }
.q-correct { font-size: 24rpx; color: #52c41a; }

.weak-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.weak-tag { background: #fff1f0; border: 1rpx solid #ffa39e; padding: 8rpx 20rpx; border-radius: 10rpx; }
.weak-tag text { font-size: 24rpx; color: #cf1322; }

.comment-card { background: #f8f5ff !important; }
.comment-text { font-size: 28rpx; color: #555; line-height: 1.8; display: block; }

.notice-bar { margin: 0 24rpx 16rpx; background: #fffbe6; border: 1rpx solid #ffe58f; border-radius: 16rpx; padding: 20rpx 24rpx; display: flex; align-items: center; gap: 12rpx; }
.notice-icon { width: 36rpx; height: 36rpx; border-radius: 50%; background: #fa8c16; color: #fff; font-size: 24rpx; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; text-align: center; line-height: 36rpx; }
.notice-text { font-size: 26rpx; color: #ad6800; line-height: 1.5; }
</style>

<template>
  <view class="page">
    <!-- 未登录 -->
    <view v-if="!studentId" class="empty-state">
      <text class="empty-icon">🔒</text>
      <text class="empty-title">请先登录</text>
      <text class="empty-desc">登录后 AI 自动分析你的做题数据</text>
      <button class="empty-btn" @tap="uni.navigateTo({ url: '/pages/login/index' })">去登录</button>
    </view>

    <template v-else>
      <!-- 总览卡片 -->
      <view class="overview-card">
        <view class="ov-header">
          <view class="ov-icon"><text>🤖</text></view>
          <view class="ov-title-wrap">
            <text class="ov-title">AI 学习诊断</text>
            <text class="ov-subtitle">基于你的做题数据智能分析</text>
          </view>
        </view>

        <view v-if="analysisLoading" class="ov-loading">
          <text>正在分析你的做题数据...</text>
        </view>

        <view v-else-if="analysis.totalQuestions === 0" class="ov-empty">
          <text class="ov-empty-icon">📝</text>
          <text class="ov-empty-title">暂无做题记录</text>
          <text class="ov-empty-desc">完成模拟卷或真题后，AI 自动生成诊断报告</text>
          <button class="go-exam-btn" @tap="uni.navigateTo({ url: '/pages/exam/list' })">去做模拟卷</button>
        </view>

        <view v-else class="ov-content">
          <!-- 核心数据 -->
          <view class="stats-row">
            <view class="stat-card">
              <text class="stat-num blue">{{ analysis.totalExams }}</text>
              <text class="stat-label">完成试卷</text>
            </view>
            <view class="stat-card">
              <text class="stat-num">{{ analysis.totalQuestions }}</text>
              <text class="stat-label">答题总数</text>
            </view>
            <view class="stat-card">
              <text class="stat-num green">{{ analysis.totalCorrect }}</text>
              <text class="stat-label">答对</text>
            </view>
            <view class="stat-card">
              <text :class="['stat-num', analysis.overallAccuracy >= 80 ? 'green' : analysis.overallAccuracy >= 60 ? 'orange' : 'red']">
                {{ analysis.overallAccuracy }}%
              </text>
              <text class="stat-label">正确率</text>
            </view>
          </view>

          <!-- AI 总结 -->
          <view class="summary-card" v-if="analysis.summary">
            <view class="summary-header">
              <text class="summary-icon">💡</text>
              <text class="summary-title">AI 总结</text>
            </view>
            <text class="summary-text">{{ analysis.summary }}</text>
          </view>

          <!-- 知识点分析 -->
          <view class="section-card" v-if="analysis.knowledgePoints && analysis.knowledgePoints.length">
            <view class="sc-header">
              <text class="sc-title">知识点掌握度</text>
              <text class="sc-sub">{{ analysis.knowledgePoints.length }}个知识点</text>
            </view>
            <view v-for="kp in analysis.knowledgePoints" :key="kp.name" class="kp-row">
              <view class="kp-head">
                <text class="kp-name">{{ kp.name }}</text>
                <text :class="['kp-acc', kp.accuracy >= 80 ? 'green' : kp.accuracy >= 60 ? 'orange' : 'red']">{{ kp.accuracy }}%</text>
              </view>
              <view class="kp-bar">
                <view class="kp-fill" :style="{ width: kp.accuracy + '%', background: kp.accuracy >= 80 ? '#52c41a' : kp.accuracy >= 60 ? '#fa8c16' : '#f5222d' }"></view>
              </view>
              <view class="kp-detail">
                <text class="kp-detail-text">{{ kp.correct }}/{{ kp.total }}题正确</text>
                <text v-if="kp.wrongSamples && kp.wrongSamples.length" class="kp-detail-weak">常错: {{ kp.wrongSamples.join('、') }}</text>
              </view>
            </view>
          </view>

          <!-- AI 建议 -->
          <view class="section-card" v-if="analysis.suggestions && analysis.suggestions.length">
            <view class="sc-header">
              <text class="sc-title">学习建议</text>
            </view>
            <view v-for="(s, idx) in analysis.suggestions" :key="idx" class="sug-item">
              <view :class="['sug-dot', idx === 0 ? 'red' : idx === 1 ? 'orange' : 'green']"></view>
              <text class="sug-text">{{ s }}</text>
            </view>
          </view>

          <!-- 薄弱知识点快速入口 -->
          <view class="section-card" v-if="analysis.weak && analysis.weak.length">
            <view class="sc-header">
              <text class="sc-title">薄弱知识点</text>
              <text class="sc-sub red-text">需重点突破</text>
            </view>
            <view class="weak-tags">
              <view v-for="w in analysis.weak" :key="w" class="weak-tag">
                <text>{{ w }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '../../utils/api'

const studentId = ref<any>(null)
const analysisLoading = ref(true)
const analysis = ref<any>({ totalExams: 0, totalQuestions: 0, totalCorrect: 0, overallAccuracy: 0, knowledgePoints: [], suggestions: [], summary: '', weak: [] })
onMounted(async () => {
  studentId.value = uni.getStorageSync('studentId')
  if (!studentId.value) {
    analysisLoading.value = false
    return
  }

  // 加载 AI 分析
  try {
    const res: any = await get(`/exam/analysis/${studentId.value}?bankType=triad`)
    if (res.success) analysis.value = res.data
  } catch {}
  analysisLoading.value = false
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding: 20rpx 24rpx 140rpx; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 200rpx 60rpx 0; }
.empty-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.empty-title { font-size: 30rpx; font-weight: 600; color: #333; }
.empty-desc { font-size: 26rpx; color: #999; margin-top: 8rpx; text-align: center; }
.empty-btn { margin-top: 40rpx; background: #2e4a78; color: #fff; border: none; border-radius: 12rpx; font-size: 28rpx; padding: 0 60rpx; height: 76rpx; line-height: 76rpx; }

.overview-card { background: #fff; border-radius: 24rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.05); }
.ov-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 24rpx; }
.ov-icon { width: 72rpx; height: 72rpx; border-radius: 20rpx; background: #e8453c; display: flex; align-items: center; justify-content: center; }
.ov-icon.red-bg { background: #c41d7f; }
.ov-icon text { font-size: 36rpx; }
.ov-title-wrap { flex: 1; }
.ov-title { font-size: 30rpx; font-weight: 600; color: #333; display: block; }
.ov-subtitle { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }

.ov-loading { text-align: center; padding: 60rpx 0; }
.ov-loading text { font-size: 26rpx; color: #999; }
.ov-empty { text-align: center; padding: 40rpx 0; }
.ov-empty-icon { font-size: 48rpx; display: block; margin-bottom: 12rpx; }
.ov-empty-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; }
.ov-empty-desc { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }
.go-exam-btn { margin-top: 24rpx; background: #2e4a78; color: #fff; border: none; border-radius: 12rpx; font-size: 26rpx; height: 68rpx; line-height: 68rpx; }

.stats-row { display: flex; gap: 12rpx; margin-bottom: 24rpx; }
.stat-card { flex: 1; background: #f8f9ff; border-radius: 16rpx; padding: 20rpx 0; text-align: center; }
.stat-num { display: block; font-size: 38rpx; font-weight: 600; color: #333; }
.stat-num.blue { color: #2e4a78; }
.stat-num.green { color: #52c41a; }
.stat-num.orange { color: #fa8c16; }
.stat-num.red { color: #f5222d; }
.stat-label { display: block; font-size: 20rpx; color: #999; margin-top: 6rpx; }

.summary-card { background: #fffbf0; border: 1rpx solid #ffe58f; border-radius: 16rpx; padding: 20rpx; margin-bottom: 20rpx; }
.summary-header { display: flex; align-items: center; gap: 8rpx; margin-bottom: 10rpx; }
.summary-icon { font-size: 28rpx; }
.summary-title { font-size: 26rpx; font-weight: 600; color: #d48806; }
.summary-text { font-size: 26rpx; color: #666; line-height: 1.7; }

.section-card { margin-bottom: 20rpx; }
.sc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.sc-title { font-size: 28rpx; font-weight: 600; color: #333; }
.sc-sub { font-size: 22rpx; color: #999; }
.sc-sub.red-text { color: #f5222d; font-weight: 600; }

.kp-row { margin-bottom: 20rpx; }
.kp-head { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.kp-name { font-size: 26rpx; color: #555; }
.kp-acc { font-size: 26rpx; font-weight: 600; }
.kp-acc.green { color: #52c41a; }
.kp-acc.orange { color: #fa8c16; }
.kp-acc.red { color: #f5222d; }
.kp-bar { height: 12rpx; background: #f0f0f0; border-radius: 6rpx; overflow: hidden; }
.kp-fill { height: 100%; border-radius: 6rpx; transition: width 0.5s; }
.kp-detail { margin-top: 6rpx; display: flex; justify-content: space-between; }
.kp-detail-text { font-size: 22rpx; color: #aaa; }
.kp-detail-weak { font-size: 22rpx; color: #f5222d; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.sug-item { display: flex; align-items: flex-start; gap: 12rpx; margin-bottom: 14rpx; }
.sug-dot { width: 14rpx; height: 14rpx; border-radius: 50%; margin-top: 10rpx; flex-shrink: 0; }
.sug-dot.red { background: #f5222d; }
.sug-dot.orange { background: #fa8c16; }
.sug-dot.green { background: #52c41a; }
.sug-text { font-size: 26rpx; color: #555; line-height: 1.6; }

.weak-tags { display: flex; flex-wrap: wrap; gap: 12rpx; }
.weak-tag { background: #fff1f0; border: 1rpx solid #ffa39e; padding: 10rpx 24rpx; border-radius: 12rpx; }
.weak-tag text { font-size: 24rpx; color: #cf1322; font-weight: 600; }

</style>

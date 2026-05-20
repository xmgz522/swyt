<template>
  <view class="page">
    <!-- 最新周报 -->
    <view v-if="!selectedReport && latest" class="latest">
      <view class="banner" @tap="selectReport(latest)">
        <text class="banner-title">📊 本周学情</text>
        <text class="banner-week">{{ latest.weekStart }} ~ {{ latest.weekEnd }}</text>
      </view>

      <!-- 核心指标 -->
      <view class="stats-grid">
        <view class="stat-card blue">
          <text class="sc-num">{{ latest.totalQuestions }}</text>
          <text class="sc-label">做题总数</text>
          <text v-if="compare" :class="['sc-change', compare.questionsChange >= 0 ? 'up' : 'down']">
            {{ compare.questionsChange >= 0 ? '↑' : '↓' }}{{ Math.abs(compare.questionsChange) }}
          </text>
        </view>
        <view class="stat-card green">
          <text class="sc-num">{{ latest.accuracy }}%</text>
          <text class="sc-label">正确率</text>
          <text v-if="compare" :class="['sc-change', compare.accuracyChange >= 0 ? 'up' : 'down']">
            {{ compare.accuracyChange >= 0 ? '↑' : '↓' }}{{ Math.abs(compare.accuracyChange) }}%
          </text>
        </view>
        <view class="stat-card orange">
          <text class="sc-num">{{ latest.checkinDays }}</text>
          <text class="sc-label">打卡天数</text>
          <text v-if="compare" :class="['sc-change', compare.checkinChange >= 0 ? 'up' : 'down']">
            {{ compare.checkinChange >= 0 ? '↑' : '↓' }}{{ Math.abs(compare.checkinChange) }}
          </text>
        </view>
        <view class="stat-card purple">
          <text class="sc-num">{{ latest.examCount }}</text>
          <text class="sc-label">完成试卷</text>
        </view>
      </view>

      <!-- 任务完成 -->
      <view class="card">
        <text class="card-title">📋 任务完成</text>
        <view class="task-bar-row">
          <view class="task-bar-bg">
            <view class="task-bar-fill" :style="{ width: taskRate + '%' }"></view>
          </view>
          <text class="task-rate">{{ latest.completedTasks }}/{{ latest.totalTasks }}</text>
        </view>
      </view>

      <!-- 错题统计 -->
      <view class="card">
        <text class="card-title">❌ 错题动态</text>
        <view class="wrong-row">
          <view class="wrong-item">
            <text class="wi-num red">+{{ latest.newWrongCount }}</text>
            <text class="wi-label">新增错题</text>
          </view>
          <view class="wrong-item">
            <text class="wi-num green">{{ latest.masteredCount }}</text>
            <text class="wi-label">已掌握</text>
          </view>
        </view>
      </view>

      <!-- 薄弱知识点 -->
      <view v-if="weakPoints.length > 0" class="card">
        <text class="card-title">⚠️ 薄弱知识点</text>
        <view v-for="(w, idx) in weakPoints" :key="idx" class="weak-item">
          <text class="weak-rank">{{ idx + 1 }}</text>
          <text class="weak-name">{{ w.point }}</text>
          <view class="weak-bar-bg">
            <view class="weak-bar" :style="{ width: w.rate + '%' }"></view>
          </view>
          <text class="weak-rate">错{{ w.wrongCount }}/{{ w.total }}</text>
        </view>
      </view>

      <!-- 各科正确率 -->
      <view v-if="Object.keys(subjectStats).length > 0" class="card">
        <text class="card-title">📚 各科表现</text>
        <view v-for="(v, k) in subjectStats" :key="k" class="subj-item">
          <text class="subj-name">{{ k }}</text>
          <view class="subj-bar-bg">
            <view class="subj-bar" :style="{ width: v.rate + '%' }"></view>
          </view>
          <text class="subj-rate">{{ v.rate }}%</text>
        </view>
      </view>

      <!-- 文字总结 -->
      <view v-if="latest.summary" class="card summary-card">
        <text class="card-title">📝 本周总结</text>
        <text class="summary-text">{{ latest.summary }}</text>
      </view>
    </view>

    <!-- 详情模式 -->
    <view v-if="selectedReport && selectedReport.id !== latest?.id" class="detail-mode">
      <view class="detail-back" @tap="selectedReport = null">
        <text>‹ 返回</text>
      </view>
      <view class="banner small">
        <text class="banner-title">📊 周报详情</text>
        <text class="banner-week">{{ selectedReport.weekStart }} ~ {{ selectedReport.weekEnd }}</text>
      </view>
      <view class="stats-grid">
        <view class="stat-card blue"><text class="sc-num">{{ selectedReport.totalQuestions }}</text><text class="sc-label">做题</text></view>
        <view class="stat-card green"><text class="sc-num">{{ selectedReport.accuracy }}%</text><text class="sc-label">正确率</text></view>
        <view class="stat-card orange"><text class="sc-num">{{ selectedReport.checkinDays }}</text><text class="sc-label">打卡</text></view>
        <view class="stat-card purple"><text class="sc-num">{{ selectedReport.examCount }}</text><text class="sc-label">试卷</text></view>
      </view>

      <view class="card">
        <text class="card-title">📋 任务完成</text>
        <view class="task-bar-row">
          <view class="task-bar-bg">
            <view class="task-bar-fill" :style="{ width: detailTaskRate + '%' }"></view>
          </view>
          <text class="task-rate">{{ selectedReport.completedTasks }}/{{ selectedReport.totalTasks }}</text>
        </view>
      </view>

      <view class="card">
        <text class="card-title">❌ 错题动态</text>
        <view class="wrong-row">
          <view class="wrong-item">
            <text class="wi-num red">+{{ selectedReport.newWrongCount }}</text>
            <text class="wi-label">新增错题</text>
          </view>
          <view class="wrong-item">
            <text class="wi-num green">{{ selectedReport.masteredCount }}</text>
            <text class="wi-label">已掌握</text>
          </view>
        </view>
      </view>

      <view v-if="detailWeakPoints.length > 0" class="card">
        <text class="card-title">⚠️ 薄弱知识点</text>
        <view v-for="(w, idx) in detailWeakPoints" :key="idx" class="weak-item">
          <text class="weak-rank">{{ idx + 1 }}</text>
          <text class="weak-name">{{ w.point }}</text>
          <view class="weak-bar-bg">
            <view class="weak-bar" :style="{ width: w.rate + '%' }"></view>
          </view>
          <text class="weak-rate">错{{ w.wrongCount }}/{{ w.total }}</text>
        </view>
      </view>

      <view v-if="Object.keys(detailSubjectStats).length > 0" class="card">
        <text class="card-title">📚 各科表现</text>
        <view v-for="(v, k) in detailSubjectStats" :key="k" class="subj-item">
          <text class="subj-name">{{ k }}</text>
          <view class="subj-bar-bg">
            <view class="subj-bar" :style="{ width: v.rate + '%' }"></view>
          </view>
          <text class="subj-rate">{{ v.rate }}%</text>
        </view>
      </view>

      <view v-if="selectedReport.summary" class="card summary-card">
        <text class="card-title">📝 总结</text>
        <text class="summary-text">{{ selectedReport.summary }}</text>
      </view>
    </view>

    <!-- 无数据 -->
    <view v-if="!latest && !loading" class="empty">
      <text class="empty-icon">📊</text>
      <text class="empty-text">暂无周报数据</text>
      <text class="empty-sub">系统每周一自动生成学情周报</text>
    </view>

    <view v-if="loading" class="empty">
      <text class="empty-text">加载中...</text>
    </view>

    <!-- 历史列表 -->
    <view v-if="!selectedReport && historyList.length > 1" class="card">
      <text class="card-title">📅 历史周报</text>
      <view v-for="h in historyList.slice(1)" :key="h.id" class="history-item" @tap="selectReport(h)">
        <view class="hi-left">
          <text class="hi-week">{{ h.weekStart }} ~ {{ h.weekEnd }}</text>
        </view>
        <view class="hi-right">
          <text class="hi-stat">做题{{ h.totalQuestions }} · 正确率{{ h.accuracy }}%</text>
          <text class="hi-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '../../utils/api'

const loading = ref(true)
const latest = ref<any>(null)
const historyList = ref<any[]>([])
const selectedReport = ref<any>(null)

const weakPoints = computed(() => {
  if (!latest.value?.weakPoints) return []
  try { return JSON.parse(latest.value.weakPoints) } catch { return [] }
})

const subjectStats = computed(() => {
  if (!latest.value?.subjectStats) return {}
  try { return JSON.parse(latest.value.subjectStats) } catch { return {} }
})

const compare = computed(() => {
  if (!latest.value?.lastWeekCompare) return null
  try { return JSON.parse(latest.value.lastWeekCompare) } catch { return null }
})

const taskRate = computed(() => {
  if (!latest.value || latest.value.totalTasks === 0) return 0
  return +((latest.value.completedTasks / latest.value.totalTasks) * 100).toFixed(0)
})

const detailWeakPoints = computed(() => {
  if (!selectedReport.value?.weakPoints) return []
  try { return JSON.parse(selectedReport.value.weakPoints) } catch { return [] }
})

const detailSubjectStats = computed(() => {
  if (!selectedReport.value?.subjectStats) return {}
  try { return JSON.parse(selectedReport.value.subjectStats) } catch { return {} }
})

const detailTaskRate = computed(() => {
  if (!selectedReport.value || selectedReport.value.totalTasks === 0) return 0
  return +((selectedReport.value.completedTasks / selectedReport.value.totalTasks) * 100).toFixed(0)
})

onMounted(async () => {
  const sid = uni.getStorageSync('studentId')
  if (!sid) { loading.value = false; return }
  try {
    const [latestData, list]: any = await Promise.all([
      get(`/report/weekly/student/${sid}/latest`),
      get(`/report/weekly/student/${sid}`),
    ])
    latest.value = latestData || null
    historyList.value = Array.isArray(list) ? list : []
  } catch {}
  loading.value = false
})

function selectReport(r: any) {
  if (r.id === latest.value?.id) {
    selectedReport.value = null
  } else {
    selectedReport.value = r
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f0f5ff; padding-bottom: 40rpx; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 200rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }
.empty-sub { font-size: 24rpx; color: #ccc; margin-top: 8rpx; }

.banner { background: linear-gradient(135deg, #1890ff, #69c0ff); padding: 32rpx; border-radius: 0 0 32rpx 32rpx; }
.banner.small { padding: 24rpx 32rpx; }
.banner-title { font-size: 36rpx; font-weight: bold; color: #fff; display: block; }
.banner-week { font-size: 26rpx; color: rgba(255,255,255,0.8); display: block; margin-top: 6rpx; }

.stats-grid { display: flex; flex-wrap: wrap; padding: 20rpx 16rpx 0; gap: 12rpx; }
.stat-card { flex: 1; min-width: 140rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; text-align: center; position: relative; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.sc-num { font-size: 40rpx; font-weight: bold; display: block; }
.sc-label { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
.sc-change { font-size: 20rpx; display: block; margin-top: 4rpx; }
.sc-change.up { color: #52c41a; }
.sc-change.down { color: #f5222d; }
.stat-card.blue .sc-num { color: #1890ff; }
.stat-card.green .sc-num { color: #52c41a; }
.stat-card.orange .sc-num { color: #fa8c16; }
.stat-card.purple .sc-num { color: #722ed1; }

.card { margin: 20rpx 20rpx 0; background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.card-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; margin-bottom: 16rpx; }

.task-bar-row { display: flex; align-items: center; gap: 16rpx; }
.task-bar-bg { flex: 1; height: 20rpx; background: #f0f0f5; border-radius: 10rpx; overflow: hidden; }
.task-bar-fill { height: 100%; background: linear-gradient(90deg, #1890ff, #69c0ff); border-radius: 10rpx; transition: width 0.6s; }
.task-rate { font-size: 26rpx; color: #1890ff; font-weight: 600; }

.wrong-row { display: flex; gap: 24rpx; }
.wrong-item { flex: 1; text-align: center; background: #fafafa; border-radius: 12rpx; padding: 16rpx; }
.wi-num { font-size: 36rpx; font-weight: bold; display: block; }
.wi-num.red { color: #f5222d; }
.wi-num.green { color: #52c41a; }
.wi-label { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }

.weak-item { display: flex; align-items: center; gap: 12rpx; margin-bottom: 14rpx; }
.weak-rank { width: 36rpx; height: 36rpx; border-radius: 50%; background: #f5222d; color: #fff; font-size: 20rpx; text-align: center; line-height: 36rpx; font-weight: bold; flex-shrink: 0; }
.weak-item:nth-child(n+4) .weak-rank { background: #fa8c16; }
.weak-item:nth-child(n+6) .weak-rank { background: #ccc; }
.weak-name { font-size: 26rpx; color: #333; width: 140rpx; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.weak-bar-bg { flex: 1; height: 12rpx; background: #f0f0f5; border-radius: 6rpx; overflow: hidden; }
.weak-bar { height: 100%; background: linear-gradient(90deg, #f5222d, #ff7875); border-radius: 6rpx; }
.weak-rate { font-size: 22rpx; color: #999; width: 100rpx; text-align: right; flex-shrink: 0; }

.subj-item { display: flex; align-items: center; gap: 12rpx; margin-bottom: 14rpx; }
.subj-name { font-size: 26rpx; color: #333; width: 100rpx; flex-shrink: 0; }
.subj-bar-bg { flex: 1; height: 14rpx; background: #f0f0f5; border-radius: 7rpx; overflow: hidden; }
.subj-bar { height: 100%; background: linear-gradient(90deg, #52c41a, #95de64); border-radius: 7rpx; }
.subj-rate { font-size: 24rpx; color: #52c41a; font-weight: 600; width: 80rpx; text-align: right; }

.summary-card { background: #f0f5ff; border: 1rpx solid #d6e4ff; }
.summary-text { font-size: 28rpx; color: #444; line-height: 1.7; display: block; }

.history-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.hi-left { }
.hi-week { font-size: 26rpx; color: #333; font-weight: 500; }
.hi-right { display: flex; align-items: center; gap: 8rpx; }
.hi-stat { font-size: 22rpx; color: #999; }
.hi-arrow { font-size: 32rpx; color: #ccc; }

.detail-mode { }
.detail-back { padding: 20rpx 24rpx; }
.detail-back text { font-size: 28rpx; color: #1890ff; }
</style>

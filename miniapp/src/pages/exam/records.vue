<template>
  <view class="page">
    <view v-if="records.length">
      <view v-for="r in records" :key="r.id" class="record-item" @tap="goResult(r.id)">
        <view :class="['record-badge', paperType === 'real' ? 'real' : 'mock']">
          <text>{{ paperType === 'real' ? '真' : '模' }}</text>
        </view>
        <view class="record-main">
          <text class="record-paper">{{ r.paperTitle || `试卷 #${r.paperId}` }}</text>
          <view class="record-meta">
            <text>{{ formatTime(r.createdAt) }}</text>
            <text>{{ statusMap[r.status] || r.status }}</text>
          </view>
        </view>
        <view class="record-score">
          <text :class="['score-num', paperType === 'real' ? 'real' : 'mock']">{{ r.totalScore || r.objectiveScore || 0 }}</text>
          <text class="score-unit">分</text>
        </view>
      </view>
    </view>

    <view v-else-if="!loading" class="empty-state">
      <text class="empty-icon">📝</text>
      <text class="empty-title">暂无做题记录</text>
      <text class="empty-desc">完成试卷后会显示在这里</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get } from '../../utils/api'

const records = ref<any[]>([])
const loading = ref(true)
const paperType = ref('mock')
const statusMap: Record<string, string> = { submitted: '待批改', graded: '已批改' }

onLoad(async (options: any) => {
  paperType.value = options?.type === 'real' ? 'real' : 'mock'
  uni.setNavigationBarTitle({ title: paperType.value === 'real' ? '真题记录' : '模拟记录' })
  const studentId = uni.getStorageSync('studentId')
  if (!studentId) {
    loading.value = false
    return
  }
  try {
    const data = await get(`/exam/answer-sheets?studentId=${studentId}&paperType=${paperType.value}&bankType=triad`)
    records.value = Array.isArray(data) ? data : []
  } catch {}
  loading.value = false
})

function goResult(id: number) {
  uni.navigateTo({ url: `/pages/exam/result?sheetId=${id}` })
}

function formatTime(t: string) {
  if (!t) return ''
  return t.substring(0, 16).replace('T', ' ')
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding: 24rpx 24rpx 140rpx; }
.record-item { display: flex; align-items: center; gap: 18rpx; background: #fff; border-radius: 20rpx; padding: 26rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.record-badge { width: 64rpx; height: 64rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.record-badge.mock { background: #f0f3fa; }
.record-badge.real { background: #fff7e6; }
.record-badge text { font-size: 28rpx; font-weight: 600; }
.record-badge.mock text { color: #2e4a78; }
.record-badge.real text { color: #fa8c16; }
.record-main { flex: 1; min-width: 0; }
.record-paper { font-size: 28rpx; font-weight: 600; color: #333; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.record-meta { display: flex; gap: 16rpx; margin-top: 8rpx; }
.record-meta text { font-size: 22rpx; color: #999; }
.record-score { display: flex; align-items: baseline; gap: 4rpx; }
.score-num { font-size: 36rpx; font-weight: 600; }
.score-num.mock { color: #2e4a78; }
.score-num.real { color: #fa8c16; }
.score-unit { font-size: 22rpx; color: #999; }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 160rpx 0; }
.empty-icon { font-size: 64rpx; margin-bottom: 20rpx; }
.empty-title { font-size: 30rpx; font-weight: 600; color: #333; margin-bottom: 8rpx; }
.empty-desc { font-size: 24rpx; color: #bbb; }
</style>

<template>
  <view class="page">
    <view class="page-header">
      <text class="page-title">模拟测试</text>
      <view class="record-btn" @tap="goRecords">
        <text>做题记录</text>
      </view>
    </view>

    <!-- 试卷列表 -->
    <view v-for="(paper, idx) in papers" :key="paper.id" class="paper-card" @tap="startExam(paper.id)">
      <view class="paper-order">
        <text>{{ String(idx + 1).padStart(2, '0') }}</text>
      </view>
      <view class="paper-body">
        <text class="paper-title">{{ paper.title }}</text>
        <view class="paper-meta">
          <text class="meta-text">{{ paper.questionCount || '?' }}题</text>
          <text class="meta-sep">·</text>
          <text class="meta-text">{{ paper.totalScore }}分</text>
          <text v-if="paper.duration" class="meta-sep">·</text>
          <text v-if="paper.duration" class="meta-text">{{ paper.duration }}分钟</text>
        </view>
      </view>
      <view class="paper-action">
        <view v-if="hasProgress(paper.id)" class="action-btn resume">
          <text>继续</text>
        </view>
        <view v-else class="action-btn">
          <text>开始</text>
        </view>
      </view>
    </view>

    <!-- 空态 -->
    <view v-if="!loading && papers.length === 0" class="empty-state">
      <view class="empty-icon"><text>E</text></view>
      <text class="empty-title">暂无可用模拟卷</text>
      <text class="empty-desc">老师还没有发布试卷，请稍后再来</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '../../utils/api'

const papers = ref<any[]>([])
const loading = ref(true)
const studentId = ref<any>(null)

onMounted(async () => {
  studentId.value = uni.getStorageSync('studentId')
  try {
    const data = await get('/exam/papers?type=mock&bankType=triad')
    papers.value = (Array.isArray(data) ? data : []).filter((p: any) => p.isPublished)
  } catch {}
  loading.value = false
})

function hasProgress(paperId: number) {
  return !!uni.getStorageSync(`exam_progress_${paperId}`)
}

function startExam(paperId: number) {
  if (!studentId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/exam/do?paperId=${paperId}` })
}

function goRecords() {
  uni.navigateTo({ url: '/pages/exam/records?type=mock' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f4f5f7; padding: 24rpx 24rpx 140rpx; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; }
.page-title { font-size: 36rpx; font-weight: 600; color: #222; }
.record-btn { background: #eef1f5; border-radius: 999rpx; padding: 12rpx 24rpx; }
.record-btn text { color: #555; font-size: 24rpx; }

.paper-card { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 16rpx; display: flex; align-items: center; gap: 20rpx; }
.paper-order { width: 52rpx; height: 52rpx; border-radius: 12rpx; background: #f0f2f5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.paper-order text { font-size: 24rpx; font-weight: 600; color: #888; }
.paper-body { flex: 1; }
.paper-title { font-size: 28rpx; font-weight: 600; color: #222; display: block; margin-bottom: 8rpx; }
.paper-meta { display: flex; align-items: center; gap: 6rpx; }
.meta-text { font-size: 22rpx; color: #aaa; }
.meta-sep { font-size: 22rpx; color: #ddd; }
.paper-action {}
.action-btn { background: #2e4a78; padding: 14rpx 28rpx; border-radius: 12rpx; }
.action-btn.resume { background: #d97706; }
.action-btn text { color: #fff; font-size: 24rpx; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-icon { width: 100rpx; height: 100rpx; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin-bottom: 20rpx; }
.empty-icon text { font-size: 40rpx; color: #ccc; }
.empty-title { font-size: 28rpx; color: #666; margin-bottom: 8rpx; }
.empty-desc { font-size: 24rpx; color: #bbb; }

</style>

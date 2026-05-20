<template>
  <view class="page">
    <view class="page-header">
      <text class="page-title">历年真题</text>
      <view class="record-btn" @tap="goRecords">
        <text>做题记录</text>
      </view>
    </view>

    <!-- 科目筛选 Tab -->
    <view class="tab-bar">
      <view v-for="t in tabs" :key="t.value" :class="['tab', activeTab === t.value ? 'active' : '']" @tap="activeTab = t.value">
        <text>{{ t.label }}</text>
      </view>
    </view>

    <!-- 试卷列表 -->
    <view v-for="(paper, idx) in filteredPapers" :key="paper.id" class="paper-card" @tap="startExam(paper.id)">
      <view class="paper-left">
        <view class="paper-badge">
          <text>{{ paper.subject || '综合' }}</text>
        </view>
      </view>
      <view class="paper-body">
        <text class="paper-title">{{ paper.title }}</text>
        <view class="paper-meta">
          <text class="meta-tag">{{ paper.questionCount || '?' }}题</text>
          <text class="meta-tag">{{ paper.totalScore }}分</text>
          <text class="meta-tag" v-if="paper.duration">{{ paper.duration }}分钟</text>
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
    <view v-if="!loading && filteredPapers.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-title">暂无{{ activeTab === 'all' ? '' : activeTab }}真题</text>
      <text class="empty-desc">历年真题持续更新中，敬请期待</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '../../utils/api'

const papers = ref<any[]>([])
const loading = ref(true)
const activeTab = ref('all')
const studentId = ref<any>(null)

const tabs = [
  { label: '全部', value: 'all' },
  { label: '英语', value: '英语' },
  { label: '语文', value: '语文' },
  { label: '数学', value: '数学' },
  { label: '物理', value: '物理' },
  { label: '化学', value: '化学' },
  { label: '生物', value: '生物' },
  { label: '政治', value: '政治' },
  { label: '历史', value: '历史' },
  { label: '地理', value: '地理' },
  { label: '技术', value: '技术' },
]

const filteredPapers = computed(() => {
  if (activeTab.value === 'all') return papers.value
  return papers.value.filter(p => p.subject === activeTab.value)
})

onMounted(async () => {
  studentId.value = uni.getStorageSync('studentId')
  try {
    const data = await get('/exam/papers?type=real&bankType=triad')
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
  uni.navigateTo({ url: '/pages/exam/records?type=real' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f4f5f7; padding: 24rpx 24rpx 140rpx; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8rpx; }
.page-title { font-size: 36rpx; font-weight: 600; color: #222; }
.record-btn { background: #eef1f5; border-radius: 999rpx; padding: 12rpx 24rpx; }
.record-btn text { color: #555; font-size: 24rpx; }

.tab-bar { display: flex; gap: 12rpx; padding: 16rpx 0 20rpx; overflow-x: auto; white-space: nowrap; }
.tab { padding: 10rpx 24rpx; border-radius: 8rpx; background: #fff; font-size: 24rpx; color: #666; flex-shrink: 0; }
.tab.active { background: #2e4a78; color: #fff; }

.paper-card { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 16rpx; display: flex; align-items: center; gap: 20rpx; }
.paper-left {}
.paper-badge { background: #f5f0eb; padding: 10rpx 14rpx; border-radius: 10rpx; min-width: 64rpx; text-align: center; }
.paper-badge text { font-size: 24rpx; font-weight: 600; color: #8b6914; }
.paper-body { flex: 1; }
.paper-title { font-size: 28rpx; font-weight: 600; color: #222; display: block; margin-bottom: 8rpx; }
.paper-meta { display: flex; gap: 12rpx; }
.meta-tag { font-size: 22rpx; color: #aaa; }
.paper-action {}
.action-btn { background: #d97706; padding: 14rpx 28rpx; border-radius: 12rpx; }
.action-btn.resume { background: #2e4a78; }
.action-btn text { color: #fff; font-size: 24rpx; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-icon { font-size: 56rpx; margin-bottom: 16rpx; }
.empty-title { font-size: 28rpx; color: #666; margin-bottom: 8rpx; }
.empty-desc { font-size: 24rpx; color: #bbb; }

</style>

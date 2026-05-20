<template>
  <view class="page">
    <!-- 未登录 -->
    <view v-if="!studentId" class="empty-state">
      <text class="empty-icon">🔒</text>
      <text class="empty-title">请先登录</text>
      <text class="empty-desc">登录后自动收录练习错题</text>
      <button class="empty-btn" @tap="uni.navigateTo({ url: '/pages/login/index' })">去登录</button>
    </view>

    <template v-else>
      <!-- 顶部统计 -->
      <view class="stats-card">
        <view class="stats-row">
          <view class="stat-item">
            <text class="stat-num red">{{ wrongStats?.unmasteredCount || 0 }}</text>
            <text class="stat-label">待攻克</text>
          </view>
          <view class="stat-item">
            <text class="stat-num green">{{ wrongStats?.masteredCount || 0 }}</text>
            <text class="stat-label">已掌握</text>
          </view>
          <view class="stat-item">
            <text class="stat-num blue">{{ wrongStats?.total || 0 }}</text>
            <text class="stat-label">错题总数</text>
          </view>
        </view>

      </view>

      <!-- 筛选 Tab -->
      <view class="filter-bar">
        <view :class="['filter-tab', activeFilter === 'unmastered' ? 'active' : '']" @tap="switchFilter('unmastered')">
          <text>待攻克</text>
        </view>
        <view :class="['filter-tab', activeFilter === 'mastered' ? 'active' : '']" @tap="switchFilter('mastered')">
          <text>已掌握</text>
        </view>
        <view :class="['filter-tab', activeFilter === 'all' ? 'active' : '']" @tap="switchFilter('all')">
          <text>全部</text>
        </view>
      </view>

      <!-- 错题列表 -->
      <view v-for="item in wrongNotes" :key="item.id" :class="['wrong-card', item.mastered ? 'mastered' : '']">
        <view class="wrong-tags">
          <text v-if="item.question?.subject" class="wtag blue">{{ item.question.subject }}</text>
          <text v-if="item.question?.knowledgePoint" class="wtag purple">{{ item.question.knowledgePoint }}</text>
          <text v-if="item.wrongCount > 1" class="wtag red-bold">错{{ item.wrongCount }}次</text>
          <text v-if="item.mastered" class="wtag green">✓ 已掌握</text>
        </view>
        <text class="wrong-content">{{ item.question?.content }}</text>
        <view v-if="wrongExpanded[item.id]" class="wrong-analysis">
          <text class="wa-line green-text">正确答案：{{ item.question?.answer }}</text>
          <text v-if="item.lastWrongAnswer" class="wa-line red-text">你的答案：{{ item.lastWrongAnswer }}</text>
          <text v-if="item.question?.explanation" class="wa-line gray-text">解析：{{ item.question.explanation }}</text>
        </view>
        <view class="wrong-actions">
          <view class="wa-btn" @tap="wrongExpanded[item.id] = !wrongExpanded[item.id]">
            <text>{{ wrongExpanded[item.id] ? '收起' : '查看解析' }}</text>
          </view>
          <view :class="['wa-btn', item.mastered ? '' : 'green-btn']" @tap="toggleMastered(item)">
            <text>{{ item.mastered ? '取消掌握' : '标记已掌握' }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="wrongTotal > wrongNotes.length" class="load-more" @tap="loadMore">
        <text>加载更多 ({{ wrongNotes.length }}/{{ wrongTotal }})</text>
      </view>

      <!-- 空态 -->
      <view v-if="!loading && wrongNotes.length === 0" class="empty-state small">
        <text class="empty-icon">🎉</text>
        <text class="empty-title">{{ activeFilter === 'mastered' ? '还没有已掌握的错题' : '暂无错题' }}</text>
        <text class="empty-desc">完成模拟考试、历年真题或考点练题后，错题自动收录</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { get, put } from '../../utils/api'

const studentId = ref<any>(null)
const loading = ref(true)
const wrongStats = ref<any>(null)
const wrongNotes = ref<any[]>([])
const wrongTotal = ref(0)
const wrongPage = ref(1)
const wrongExpanded = reactive<Record<number, boolean>>({})
const activeFilter = ref('unmastered')
async function loadStats() {
  try { wrongStats.value = await get(`/exam/wrong-notes/${studentId.value}/stats?bankType=triad`) } catch {}
}

async function loadWrongNotes(reset = true) {
  if (!studentId.value) return
  if (reset) {
    wrongPage.value = 1
    wrongNotes.value = []
  }
  const mastered = activeFilter.value === 'all' ? '' : activeFilter.value === 'mastered' ? 'true' : 'false'
  const masteredParam = mastered ? `&mastered=${mastered}` : ''
  try {
    const res: any = await get(`/exam/wrong-notes/${studentId.value}?page=${wrongPage.value}&pageSize=20&bankType=triad${masteredParam}`)
    if (reset) {
      wrongNotes.value = res.data || []
    } else {
      wrongNotes.value = [...wrongNotes.value, ...(res.data || [])]
    }
    wrongTotal.value = res.total || 0
  } catch {}
}

function switchFilter(f: string) {
  activeFilter.value = f
  loadWrongNotes()
}

async function loadMore() {
  wrongPage.value++
  await loadWrongNotes(false)
}

async function toggleMastered(item: any) {
  try {
    await put(`/exam/wrong-notes/${item.id}/toggle`, { mastered: !item.mastered })
    item.mastered = !item.mastered
    uni.showToast({ title: item.mastered ? '已标记掌握' : '已取消', icon: 'success' })
    loadStats()
  } catch {}
}

onMounted(async () => {
  studentId.value = uni.getStorageSync('studentId')
  if (studentId.value) {
    await Promise.all([loadStats(), loadWrongNotes()])
  }
  loading.value = false
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding: 20rpx 24rpx 140rpx; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 200rpx 60rpx 0; }
.empty-state.small { padding: 80rpx 60rpx 0; }
.empty-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.empty-title { font-size: 30rpx; font-weight: 600; color: #333; }
.empty-desc { font-size: 26rpx; color: #999; margin-top: 8rpx; text-align: center; }
.empty-btn { margin-top: 40rpx; background: #2e4a78; color: #fff; border: none; border-radius: 12rpx; font-size: 28rpx; padding: 0 60rpx; height: 76rpx; line-height: 76rpx; }

/* 统计卡 */
.stats-card { background: #fff; border-radius: 24rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.05); }
.stats-row { display: flex; gap: 12rpx; margin-bottom: 20rpx; }
.stat-item { flex: 1; background: #f8f9ff; border-radius: 16rpx; padding: 20rpx 0; text-align: center; }
.stat-num { display: block; font-size: 42rpx; font-weight: 600; color: #333; }
.stat-num.red { color: #f5222d; }
.stat-num.green { color: #52c41a; }
.stat-num.blue { color: #2e4a78; }
.stat-label { display: block; font-size: 22rpx; color: #999; margin-top: 6rpx; }

/* 筛选 */
.filter-bar { display: flex; align-items: center; gap: 12rpx; margin-bottom: 20rpx; }
.filter-tab { padding: 12rpx 28rpx; border-radius: 30rpx; background: #fff; font-size: 26rpx; color: #666; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.filter-tab.active { background: #cf1322; color: #fff; }

/* 错题卡片 */
.wrong-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); border-left: 6rpx solid #f5222d; }
.wrong-card.mastered { border-left-color: #52c41a; opacity: 0.8; }
.wrong-tags { display: flex; gap: 8rpx; margin-bottom: 12rpx; flex-wrap: wrap; }
.wtag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 8rpx; }
.wtag.blue { background: #e6f7ff; color: #1890ff; }
.wtag.purple { background: #f9f0ff; color: #722ed1; }
.wtag.red-bold { background: #fff1f0; color: #f5222d; font-weight: 600; }
.wtag.green { background: #f6ffed; color: #52c41a; }
.wrong-content { font-size: 28rpx; color: #333; line-height: 1.6; display: block; margin-bottom: 12rpx; }
.wrong-analysis { background: #fafafa; border-radius: 12rpx; padding: 16rpx; margin-bottom: 12rpx; }
.wa-line { font-size: 26rpx; display: block; margin-bottom: 8rpx; line-height: 1.5; }
.wa-line:last-child { margin-bottom: 0; }
.green-text { color: #52c41a; }
.red-text { color: #f5222d; }
.gray-text { color: #999; }
.wrong-actions { display: flex; gap: 16rpx; }
.wa-btn { padding: 10rpx 24rpx; border-radius: 20rpx; background: #f5f5f5; }
.wa-btn text { font-size: 24rpx; color: #666; }
.wa-btn.green-btn { background: #f6ffed; }
.wa-btn.green-btn text { color: #52c41a; font-weight: 600; }

.load-more { text-align: center; padding: 20rpx; }
.load-more text { font-size: 26rpx; color: #1890ff; }
</style>

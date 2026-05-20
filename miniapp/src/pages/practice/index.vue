<template>
  <view class="page">
    <view class="hero">
      <text class="hero-title">考点练题</text>
      <text class="hero-sub">按方向、题型和知识点自主组题</text>
    </view>

    <view class="section-card">
      <view class="card-header">
        <text class="card-title">选择方向</text>
      </view>
      <view class="subject-grid">
        <view v-for="s in directions" :key="s.value" :class="['subject-card', selectedDirection === s.value ? 'active' : '']" @tap="selectDirection(s.value)">
          <text class="subject-name">{{ s.label }}</text>
        </view>
      </view>
    </view>

    <view class="section-card">
      <view class="card-header">
        <text class="card-title">选择题型</text>
      </view>
      <view class="chip-row">
        <view v-for="t in questionTypes" :key="t.value" :class="['chip', selectedType === t.value ? 'active-orange' : '']" @tap="selectedType = t.value">
          <text>{{ t.label }}</text>
        </view>
      </view>
    </view>


    <view class="section-card">
      <view class="card-header">
        <text class="card-title">练习设置</text>
      </view>
      <text class="setting-label">题目数量</text>
      <view class="count-row">
        <view v-for="n in countOptions" :key="n" :class="['count-chip', questionCount === n ? 'active' : '']" @tap="questionCount = n">
          <text>{{ n === 0 ? '全部' : n + '题' }}</text>
        </view>
      </view>
    </view>

    <view class="summary-card">
      <text class="summary-title">练习摘要</text>
      <view class="summary-line"><text>方向</text><text>{{ directionLabel || '未选择' }}</text></view>
      <view class="summary-line"><text>题型</text><text>{{ typeLabel }}</text></view>
      <view class="summary-line"><text>题量</text><text>{{ questionCount === 0 ? '全部' : questionCount + '题' }}</text></view>
      <view :class="['start-btn', !selectedDirection ? 'disabled' : '']" @tap="startPractice">
        <text>开始练题</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { get } from '../../utils/api'

const directions = [
  { value: '时事热点', label: '时事热点' },
  { value: '逻辑推理', label: '逻辑推理' },
  { value: '人文素养', label: '人文素养' },
  { value: '科学常识', label: '科学常识' },
  { value: '综合思辨', label: '综合思辨' },
]

const questionTypes = [
  { value: '', label: '全部' },
  { value: 'single_choice', label: '单选' },
  { value: 'multi_choice', label: '多选' },
  { value: 'judge', label: '判断' },
  { value: 'fill', label: '填空' },
  { value: 'short_answer', label: '简答' },
]

const countOptions = [10, 20, 50, 0]
const selectedDirection = ref('')
const selectedType = ref('')
const questionCount = ref(20)
const totalForDirection = ref(0)

const directionLabel = computed(() => directions.find(s => s.value === selectedDirection.value)?.label || '')
const typeLabel = computed(() => questionTypes.find(t => t.value === selectedType.value)?.label || '全部')

function selectDirection(val: string) {
  selectedDirection.value = val
}

async function loadCategoryCount() {
  const dir = selectedDirection.value
  if (!dir) { totalForDirection.value = 0; return }
  let url = `/exam/practice/categories?knowledgePoint=${encodeURIComponent(dir)}&bankType=triad`
  if (selectedType.value) url += `&type=${encodeURIComponent(selectedType.value)}`
  try {
    const res = await get(url)
    const arr = Array.isArray(res) ? res : []
    totalForDirection.value = arr.reduce((sum: number, c: any) => sum + (c.count || 0), 0)
  } catch { totalForDirection.value = 0 }
}

watch(selectedDirection, () => loadCategoryCount())
watch(selectedType, () => loadCategoryCount())

function startPractice() {
  if (!selectedDirection.value) {
    uni.showToast({ title: '请先选择方向', icon: 'none' })
    return
  }
  let url = `/pages/sprint/practice?knowledgePoint=${encodeURIComponent(selectedDirection.value)}&bankType=triad`
  if (selectedType.value) url += `&type=${encodeURIComponent(selectedType.value)}`
  if (questionCount.value > 0) url += `&limit=${questionCount.value}`
  uni.navigateTo({ url })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f4f5f7; padding-bottom: 60rpx; }
.hero { background: #2e4a78; padding: 48rpx 36rpx 36rpx; }
.hero-title { color: #fff; font-size: 36rpx; font-weight: 600; display: block; }
.hero-sub { color: rgba(255,255,255,0.7); font-size: 24rpx; display: block; margin-top: 8rpx; }
.section-card { margin: 20rpx 24rpx; background: #fff; border-radius: 16rpx; padding: 28rpx; }
.card-header { display: flex; align-items: center; margin-bottom: 20rpx; }
.card-title { font-size: 28rpx; font-weight: 600; color: #333; }
.subject-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14rpx; }
.subject-card { padding: 22rpx 0; border-radius: 12rpx; background: #f7f8fa; border: 2rpx solid transparent; text-align: center; }
.subject-card.active { background: #edf2fa; border-color: #2e4a78; }
.subject-name { display: block; font-size: 24rpx; color: #555; }
.subject-card.active .subject-name { color: #2e4a78; font-weight: 600; }
.chip-row { display: flex; flex-wrap: wrap; gap: 12rpx; }
.chip { padding: 12rpx 24rpx; border-radius: 8rpx; background: #f7f8fa; border: 1rpx solid transparent; }
.chip text { font-size: 24rpx; color: #666; }
.chip.active-orange { background: #fef6ee; border-color: #d97706; }
.chip.active-orange text { color: #d97706; font-weight: 600; }
.setting-label { display: block; font-size: 26rpx; color: #555; margin-bottom: 14rpx; }
.count-row { display: flex; gap: 14rpx; }
.count-chip { flex: 1; text-align: center; padding: 16rpx 0; border-radius: 10rpx; background: #f7f8fa; border: 1rpx solid transparent; }
.count-chip text { font-size: 24rpx; color: #666; }
.count-chip.active { background: #edf7ed; border-color: #3d8c40; }
.count-chip.active text { color: #3d8c40; font-weight: 600; }
.summary-card { margin: 20rpx 24rpx; padding: 28rpx; border-radius: 16rpx; background: #2e4a78; }
.summary-title { color: rgba(255,255,255,0.85); font-size: 26rpx; font-weight: 600; display: block; margin-bottom: 16rpx; }
.summary-line { display: flex; justify-content: space-between; padding: 8rpx 0; }
.summary-line text { color: rgba(255,255,255,0.6); font-size: 24rpx; }
.summary-line text:last-child { color: #fff; max-width: 420rpx; text-align: right; }
.start-btn { margin-top: 24rpx; background: #fff; border-radius: 12rpx; padding: 22rpx 0; text-align: center; }
.start-btn text { color: #2e4a78; font-size: 30rpx; font-weight: 600; }
.start-btn.disabled { opacity: 0.4; }
</style>

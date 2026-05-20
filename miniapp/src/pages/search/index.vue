<template>
  <view class="page">
    <!-- 搜索框 -->
    <view class="search-bar">
      <input v-model="keyword" class="search-input" placeholder="搜索院校、题目..." confirm-type="search" @confirm="doSearch" />
      <text class="search-btn" @tap="doSearch">搜索</text>
    </view>

    <!-- Tab 切换 -->
    <view class="tabs">
      <view :class="['tab', { active: tab === 'school' }]" @tap="tab = 'school'; doSearch()"><text>院校</text></view>
      <view :class="['tab', { active: tab === 'question' }]" @tap="tab = 'question'; doSearch()"><text>题目</text></view>
    </view>

    <view v-if="loading" class="loading"><text>搜索中...</text></view>

    <view v-else-if="results.length === 0 && searched" class="empty">
      <text>未找到相关结果</text>
    </view>

    <!-- 院校结果 -->
    <view v-if="tab === 'school' && !loading" class="result-list">
      <view v-for="s in results" :key="s.id" class="school-item" @tap="goSchool(s.id)">
        <text class="school-name">{{ s.name }}</text>
        <view class="school-tags">
          <text v-if="s.region" class="tag">{{ s.region }}</text>
          <text v-if="s.type" class="tag">{{ s.type }}</text>
        </view>
        <text v-if="s.gradeRequirements" class="school-grade">{{ s.gradeRequirements }}</text>
      </view>
    </view>

    <!-- 题目结果 -->
    <view v-if="tab === 'question' && !loading" class="result-list">
      <view v-for="q in results" :key="q.id" class="q-item">
        <view class="q-header">
          <text class="q-type">{{ typeMap[q.type] || q.type }}</text>
          <text v-if="q.subject" class="q-subject">{{ q.subject }}</text>
          <text v-if="q.knowledgePoint" class="q-kp">{{ q.knowledgePoint }}</text>
        </view>
        <text class="q-content">{{ q.content }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { get } from '../../utils/api'

const typeMap: Record<string, string> = { single_choice: '单选', multi_choice: '多选', judge: '判断', fill: '填空', short_answer: '简答' }

const keyword = ref('')
const tab = ref('school')
const results = ref<any[]>([])
const loading = ref(false)
const searched = ref(false)

async function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  loading.value = true
  searched.value = true
  try {
    if (tab.value === 'school') {
      const data = await get(`/schools?keyword=${encodeURIComponent(kw)}`)
      results.value = Array.isArray(data) ? data : []
    } else {
      const data = await get(`/exam/questions?keyword=${encodeURIComponent(kw)}`)
      results.value = Array.isArray(data) ? data : []
    }
  } catch { results.value = [] }
  loading.value = false
}

function goSchool(id: number) {
  uni.navigateTo({ url: `/pages/school/detail?id=${id}` })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; }
.search-bar { display: flex; align-items: center; gap: 16rpx; padding: 20rpx 24rpx; background: #fff; }
.search-input { flex: 1; height: 72rpx; background: #f5f6fa; border-radius: 36rpx; padding: 0 24rpx; font-size: 28rpx; }
.search-btn { color: #2e4a78; font-size: 28rpx; padding: 0 12rpx; white-space: nowrap; }
.tabs { display: flex; background: #fff; border-bottom: 1rpx solid #f0f0f0; }
.tab { flex: 1; text-align: center; padding: 20rpx 0; font-size: 28rpx; color: #999; position: relative; }
.tab.active { color: #2e4a78; font-weight: 600; }
.tab.active::after { content: ''; position: absolute; bottom: 0; left: 30%; right: 30%; height: 4rpx; background: #2e4a78; border-radius: 2rpx; }
.loading { text-align: center; padding: 80rpx 0; color: #999; font-size: 28rpx; }
.empty { text-align: center; padding: 80rpx 0; color: #ccc; font-size: 28rpx; }
.result-list { padding: 16rpx 24rpx; }
.school-item { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.school-name { font-size: 30rpx; font-weight: 600; color: #333; display: block; margin-bottom: 8rpx; }
.school-tags { display: flex; gap: 12rpx; margin-bottom: 8rpx; }
.tag { font-size: 22rpx; color: #2e4a78; background: #edf2fa; padding: 4rpx 14rpx; border-radius: 6rpx; }
.school-grade { font-size: 24rpx; color: #fa8c16; display: block; }
.q-item { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.q-header { display: flex; gap: 12rpx; margin-bottom: 12rpx; flex-wrap: wrap; }
.q-type { font-size: 22rpx; color: #fff; background: #2e4a78; padding: 4rpx 14rpx; border-radius: 6rpx; }
.q-subject { font-size: 22rpx; color: #fa8c16; background: #fff7e6; padding: 4rpx 14rpx; border-radius: 6rpx; }
.q-kp { font-size: 22rpx; color: #52c41a; background: #f6ffed; padding: 4rpx 14rpx; border-radius: 6rpx; }
.q-content { font-size: 28rpx; color: #333; line-height: 1.6; display: block; }
</style>

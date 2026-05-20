<template>
  <view class="page">
    <!-- 选学校阶段 -->
    <view v-if="!selectedSchool" class="school-select">
      <view class="page-header">
        <text class="page-title">面试题库</text>
        <text class="page-sub">选择目标院校，查看历年面试真题与参考答案</text>
      </view>
      <view class="mock-entry" @tap="goMock">
        <view class="mock-icon"><text>🎙️</text></view>
        <view class="mock-info">
          <text class="mock-title">模拟面试</text>
          <text class="mock-desc">随机抽题 · 限时作答 · 老师评分 · 能力雷达</text>
        </view>
        <text class="mock-arrow">›</text>
      </view>
      <view v-if="loading" class="empty-state">
        <text class="empty-text">加载中...</text>
      </view>
      <view v-else-if="schoolList.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无面试题数据</text>
      </view>
      <view v-else class="school-list">
        <view
          v-for="s in schoolList"
          :key="s.schoolId"
          class="school-card"
          @tap="selectSchool(s)"
        >
          <view class="school-left">
            <view class="school-avatar">
              <text>{{ s.schoolName.charAt(0) }}</text>
            </view>
            <view class="school-info">
              <text class="school-name">{{ s.schoolName }}</text>
              <text class="school-count">{{ s.questionCount }} 道面试题</text>
            </view>
          </view>
          <text class="school-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 题目列表阶段 -->
    <view v-else class="question-view">
      <view class="q-header">
        <view class="q-back" @tap="selectedSchool = null">
          <text class="back-arrow">‹</text>
          <text class="back-text">返回</text>
        </view>
        <text class="q-school-name">{{ selectedSchool.schoolName }}</text>
        <text class="q-total">共 {{ questions.length }} 题</text>
      </view>

      <!-- 分类tabs -->
      <scroll-view scroll-x class="cat-scroll" v-if="categories.length > 1">
        <view class="cat-tabs">
          <view
            :class="['cat-tab', activeCat === '' ? 'active' : '']"
            @tap="switchCat('')"
          ><text>全部</text></view>
          <view
            v-for="c in categories"
            :key="c.category"
            :class="['cat-tab', activeCat === c.category ? 'active' : '']"
            @tap="switchCat(c.category)"
          ><text>{{ c.category }}({{ c.count }})</text></view>
        </view>
      </scroll-view>

      <!-- 题目卡片 -->
      <view v-if="loadingQ" class="empty-state">
        <text class="empty-text">加载中...</text>
      </view>
      <view v-else-if="questions.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">该分类暂无题目</text>
      </view>
      <view v-else class="q-list">
        <view
          v-for="(q, idx) in questions"
          :key="q.id"
          class="q-card"
        >
          <view class="q-top">
            <text class="q-num">{{ idx + 1 }}.</text>
            <view v-if="q.category" class="q-tag purple"><text>{{ q.category }}</text></view>
            <view v-if="q.difficulty" :class="['q-tag', diffClass[q.difficulty]]"><text>{{ diffLabel[q.difficulty] }}</text></view>
            <view v-if="q.year" class="q-tag gray"><text>{{ q.year }}</text></view>
          </view>
          <text class="q-question">{{ q.question }}</text>

          <!-- 展开/收起答案 -->
          <view class="answer-toggle" @tap="toggleAnswer(q.id)">
            <text class="toggle-text">{{ expandedIds[q.id] ? '收起答案 ▲' : '查看参考答案 ▼' }}</text>
          </view>
          <view v-if="expandedIds[q.id]" class="answer-area">
            <view class="answer-block">
              <text class="answer-label">📝 参考答案</text>
              <text class="answer-content">{{ q.answer }}</text>
            </view>
            <view v-if="q.tips" class="tips-block">
              <text class="tips-label">💡 答题要点</text>
              <text class="tips-content">{{ q.tips }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { get } from '../../utils/api'

const diffLabel: Record<string, string> = { easy: '简单', medium: '中等', hard: '较难' }
const diffClass: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }

const loading = ref(true)
const loadingQ = ref(false)
const schoolList = ref<any[]>([])
const selectedSchool = ref<any>(null)
const categories = ref<any[]>([])
const activeCat = ref('')
const questions = ref<any[]>([])
const expandedIds = reactive<Record<number, boolean>>({})

onMounted(async () => {
  try {
    const data: any = await get('/interview/schools')
    schoolList.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

async function selectSchool(s: any) {
  selectedSchool.value = s
  activeCat.value = ''
  loadingQ.value = true
  try {
    const [cats, qs]: any = await Promise.all([
      get(`/interview/schools/${s.schoolId}/categories`),
      get(`/interview/schools/${s.schoolId}/questions`),
    ])
    categories.value = cats || []
    questions.value = qs || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingQ.value = false
  }
}

async function switchCat(cat: string) {
  activeCat.value = cat
  loadingQ.value = true
  try {
    const url = `/interview/schools/${selectedSchool.value.schoolId}/questions` + (cat ? `?category=${encodeURIComponent(cat)}` : '')
    const data: any = await get(url)
    questions.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingQ.value = false
  }
}

function toggleAnswer(id: number) {
  expandedIds[id] = !expandedIds[id]
}

function goMock() {
  uni.navigateTo({ url: '/pages/interview/mock' })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 40rpx; }
.page-header { padding: 40rpx 32rpx 20rpx; }
.page-title { font-size: 40rpx; font-weight: bold; color: #1a1a2e; display: block; }
.page-sub { font-size: 26rpx; color: #999; margin-top: 8rpx; display: block; }

/* 模拟面试入口 */
.mock-entry { display: flex; align-items: center; gap: 20rpx; margin: 0 24rpx 20rpx; background: linear-gradient(135deg, #722ed1, #b37feb); border-radius: 20rpx; padding: 28rpx 24rpx; box-shadow: 0 4rpx 20rpx rgba(114,46,209,0.25); }
.mock-icon { width: 72rpx; height: 72rpx; background: rgba(255,255,255,0.2); border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mock-icon text { font-size: 36rpx; }
.mock-info { flex: 1; }
.mock-title { font-size: 30rpx; font-weight: bold; color: #fff; display: block; }
.mock-desc { font-size: 22rpx; color: rgba(255,255,255,0.75); display: block; margin-top: 4rpx; }
.mock-arrow { font-size: 40rpx; color: rgba(255,255,255,0.6); }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #bbb; }

.school-list { padding: 0 24rpx; }
.school-card { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 20rpx; padding: 28rpx 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.school-left { display: flex; align-items: center; gap: 20rpx; }
.school-avatar { width: 80rpx; height: 80rpx; border-radius: 16rpx; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; }
.school-avatar text { color: #fff; font-size: 36rpx; font-weight: bold; }
.school-info { display: flex; flex-direction: column; }
.school-name { font-size: 30rpx; font-weight: 600; color: #333; }
.school-count { font-size: 24rpx; color: #999; margin-top: 4rpx; }
.school-arrow { font-size: 40rpx; color: #ccc; }

/* 题目视图 */
.q-header { display: flex; align-items: center; gap: 16rpx; padding: 24rpx 32rpx; background: linear-gradient(135deg, #667eea, #764ba2); }
.q-back { display: flex; align-items: center; gap: 4rpx; }
.back-arrow { font-size: 40rpx; color: #fff; }
.back-text { font-size: 26rpx; color: rgba(255,255,255,0.8); }
.q-school-name { font-size: 32rpx; font-weight: bold; color: #fff; flex: 1; }
.q-total { font-size: 24rpx; color: rgba(255,255,255,0.7); }

.cat-scroll { white-space: nowrap; background: #fff; }
.cat-tabs { display: flex; padding: 16rpx 24rpx; gap: 16rpx; }
.cat-tab { padding: 10rpx 24rpx; border-radius: 24rpx; background: #f0f0f5; flex-shrink: 0; }
.cat-tab text { font-size: 24rpx; color: #666; }
.cat-tab.active { background: linear-gradient(135deg, #667eea, #764ba2); }
.cat-tab.active text { color: #fff; }

.q-list { padding: 16rpx 24rpx; }
.q-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.q-top { display: flex; align-items: center; gap: 10rpx; margin-bottom: 12rpx; flex-wrap: wrap; }
.q-num { font-size: 30rpx; font-weight: bold; color: #333; }
.q-tag { padding: 4rpx 14rpx; border-radius: 8rpx; }
.q-tag text { font-size: 22rpx; }
.q-tag.purple { background: #f0ebff; }
.q-tag.purple text { color: #722ed1; }
.q-tag.green { background: #f0fff4; }
.q-tag.green text { color: #52c41a; }
.q-tag.orange { background: #fff7e6; }
.q-tag.orange text { color: #fa8c16; }
.q-tag.red { background: #fff1f0; }
.q-tag.red text { color: #f5222d; }
.q-tag.gray { background: #f5f5f5; }
.q-tag.gray text { color: #999; }

.q-question { font-size: 30rpx; color: #333; line-height: 1.6; display: block; }

.answer-toggle { margin-top: 16rpx; text-align: center; padding: 12rpx 0; border-top: 1rpx solid #f0f0f5; }
.toggle-text { font-size: 26rpx; color: #667eea; }

.answer-area { margin-top: 12rpx; }
.answer-block { background: #f6f8ff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 12rpx; }
.answer-label { font-size: 26rpx; font-weight: 600; color: #667eea; display: block; margin-bottom: 10rpx; }
.answer-content { font-size: 28rpx; color: #444; line-height: 1.7; display: block; white-space: pre-wrap; }
.tips-block { background: #fffbe6; border-radius: 12rpx; padding: 20rpx; }
.tips-label { font-size: 26rpx; font-weight: 600; color: #fa8c16; display: block; margin-bottom: 10rpx; }
.tips-content { font-size: 26rpx; color: #666; line-height: 1.6; display: block; white-space: pre-wrap; }
</style>

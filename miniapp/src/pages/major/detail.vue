<template>
  <view class="page">
    <view v-if="loading" class="loading"><text>加载中...</text></view>
    <template v-else-if="major">
      <!-- 头部 -->
      <view class="header">
        <text class="h-name">{{ major.name }}</text>
        <view class="h-meta">
          <text v-if="major.code" class="h-tag">{{ major.code }}</text>
          <text v-if="major.category" class="h-tag blue">{{ major.category }}</text>
          <text v-if="major.duration" class="h-tag">{{ major.duration }}</text>
          <text v-if="major.degree" class="h-tag">{{ major.degree }}</text>
        </view>
      </view>

      <!-- 专业简介 -->
      <view v-if="major.description" class="card">
        <text class="card-title">📖 专业简介</text>
        <text class="card-content">{{ major.description }}</text>
      </view>

      <!-- 核心课程 -->
      <view v-if="courseList.length" class="card">
        <text class="card-title">📚 核心课程</text>
        <view class="course-grid">
          <view v-for="(c, i) in courseList" :key="i" class="course-item">
            <text>{{ c }}</text>
          </view>
        </view>
      </view>

      <!-- 就业方向 -->
      <view v-if="major.employment" class="card">
        <text class="card-title">💼 就业方向</text>
        <text class="card-content">{{ major.employment }}</text>
      </view>

      <!-- 适合人群 -->
      <view v-if="major.suitableFor" class="card">
        <text class="card-title">🎯 适合人群</text>
        <text class="card-content">{{ major.suitableFor }}</text>
      </view>

      <!-- 相关院校 -->
      <view v-if="major.relatedSchools" class="card">
        <text class="card-title">🏫 相关院校</text>
        <text class="card-content">{{ major.relatedSchools }}</text>
      </view>

      <!-- 备注 -->
      <view v-if="major.remark" class="card">
        <text class="card-title">📝 补充说明</text>
        <text class="card-content">{{ major.remark }}</text>
      </view>
    </template>

    <view v-else class="empty">
      <text>专业不存在</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get } from '../../utils/api'

const major = ref<any>(null)
const loading = ref(true)

const courseList = computed(() => {
  if (!major.value?.courses) return []
  try {
    const parsed = JSON.parse(major.value.courses)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return major.value.courses.split(/[,，、]/).filter(Boolean)
})

onLoad(async (opts: any) => {
  if (!opts?.id) { loading.value = false; return }
  try {
    const res = await get(`/majors/${opts.id}`)
    major.value = res || null
  } catch {}
  loading.value = false
})
</script>

<style scoped>
.page { padding: 0 0 40rpx 0; background: #f5f7fa; min-height: 100vh; }
.loading { text-align: center; padding: 100rpx; color: #999; font-size: 28rpx; }
.empty { text-align: center; padding: 100rpx; color: #999; font-size: 28rpx; }
.header { background: linear-gradient(135deg, #4f8ef7, #6db3f2); padding: 48rpx 32rpx 40rpx; color: #fff; }
.h-name { font-size: 40rpx; font-weight: bold; display: block; margin-bottom: 16rpx; }
.h-meta { display: flex; gap: 12rpx; flex-wrap: wrap; }
.h-tag { font-size: 22rpx; background: rgba(255,255,255,0.2); padding: 6rpx 16rpx; border-radius: 16rpx; color: #fff; }
.h-tag.blue { background: rgba(255,255,255,0.35); }
.card { background: #fff; margin: 20rpx 24rpx 0; border-radius: 16rpx; padding: 28rpx; }
.card-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.card-content { font-size: 28rpx; color: #555; line-height: 1.7; display: block; }
.course-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.course-item { background: #f0f7ff; padding: 10rpx 20rpx; border-radius: 8rpx; font-size: 26rpx; color: #4f8ef7; }
</style>

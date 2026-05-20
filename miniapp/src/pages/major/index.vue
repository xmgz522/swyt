<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input class="search-input" v-model="keyword" placeholder="搜索专业名称" confirm-type="search" @confirm="search" />
      <view class="search-btn" @tap="search"><text>搜索</text></view>
    </view>

    <!-- 学科门类筛选 -->
    <scroll-view scroll-x class="cate-scroll">
      <view :class="['cate-tag', !activeCategory ? 'active' : '']" @tap="pickCategory('')">
        <text>全部</text>
      </view>
      <view v-for="c in categories" :key="c" :class="['cate-tag', activeCategory === c ? 'active' : '']" @tap="pickCategory(c)">
        <text>{{ c }}</text>
      </view>
    </scroll-view>

    <!-- 专业列表 -->
    <view v-if="loading && list.length === 0" class="loading-tip">
      <text>加载中...</text>
    </view>

    <view v-for="item in list" :key="item.id" class="major-card" @tap="goDetail(item.id)">
      <view class="mc-header">
        <text class="mc-name">{{ item.name }}</text>
        <text v-if="item.category" class="mc-cate">{{ item.category }}</text>
      </view>
      <view class="mc-meta">
        <text v-if="item.duration" class="mc-tag">{{ item.duration }}</text>
        <text v-if="item.degree" class="mc-tag">{{ item.degree }}</text>
        <text v-if="item.code" class="mc-tag">{{ item.code }}</text>
      </view>
      <text v-if="item.description" class="mc-desc">{{ item.description }}</text>
    </view>

    <!-- 加载更多 -->
    <view v-if="list.length > 0 && list.length < total" class="load-more" @tap="loadMore">
      <text>加载更多</text>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && list.length === 0" class="empty">
      <text class="empty-icon">📚</text>
      <text class="empty-text">暂无专业数据</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '../../utils/api'

const keyword = ref('')
const activeCategory = ref('')
const categories = ref<string[]>([])
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)

onMounted(async () => {
  try { categories.value = await get('/majors/categories') || [] } catch {}
  await loadList()
})

async function loadList(reset = true) {
  if (reset) { page.value = 1; list.value = [] }
  loading.value = true
  try {
    const params: string[] = [`page=${page.value}`, 'pageSize=20']
    if (keyword.value) params.push(`keyword=${encodeURIComponent(keyword.value)}`)
    if (activeCategory.value) params.push(`category=${encodeURIComponent(activeCategory.value)}`)
    const res: any = await get(`/majors?${params.join('&')}`)
    if (reset) {
      list.value = res.data || []
    } else {
      list.value = [...list.value, ...(res.data || [])]
    }
    total.value = res.total || 0
  } catch {}
  loading.value = false
}

function search() { loadList() }
function pickCategory(c: string) { activeCategory.value = c; loadList() }
function loadMore() { page.value++; loadList(false) }

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/major/detail?id=${id}` })
}
</script>

<style scoped>
.page { padding: 20rpx 24rpx; background: #f5f7fa; min-height: 100vh; }
.search-bar { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.search-input { flex: 1; height: 72rpx; background: #fff; border-radius: 36rpx; padding: 0 28rpx; font-size: 28rpx; border: 1px solid #e8e8e8; }
.search-btn { width: 120rpx; height: 72rpx; background: linear-gradient(135deg, #4f8ef7, #6db3f2); border-radius: 36rpx; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 28rpx; }
.cate-scroll { white-space: nowrap; margin-bottom: 20rpx; }
.cate-tag { display: inline-block; padding: 12rpx 28rpx; background: #fff; border-radius: 30rpx; font-size: 26rpx; color: #666; margin-right: 16rpx; border: 1px solid #e8e8e8; }
.cate-tag.active { background: #4f8ef7; color: #fff; border-color: #4f8ef7; }
.major-card { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.mc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.mc-name { font-size: 32rpx; font-weight: bold; color: #333; }
.mc-cate { font-size: 24rpx; background: #e8f4fd; color: #4f8ef7; padding: 4rpx 16rpx; border-radius: 16rpx; }
.mc-meta { display: flex; gap: 12rpx; margin-bottom: 12rpx; flex-wrap: wrap; }
.mc-tag { font-size: 22rpx; background: #f5f5f5; color: #888; padding: 4rpx 14rpx; border-radius: 8rpx; }
.mc-desc { font-size: 26rpx; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.6; }
.load-more { text-align: center; padding: 24rpx; color: #4f8ef7; font-size: 28rpx; }
.loading-tip { text-align: center; padding: 60rpx; color: #999; font-size: 28rpx; }
.empty { text-align: center; padding: 100rpx 0; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }
</style>

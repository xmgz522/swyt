<template>
  <view class="page">
    <!-- 顶部模式切换 -->
    <view class="mode-switch">
      <view :class="['mode-btn', mode === 'recommend' ? 'mode-active' : '']" @tap="mode = 'recommend'">
        <text>推荐院校</text>
      </view>
      <view :class="['mode-btn', mode === 'all' ? 'mode-active' : '']" @tap="switchToAll">
        <text>全部院校</text>
      </view>
    </view>

    <!-- ========= 推荐院校模式 ========= -->
    <template v-if="mode === 'recommend'">
      <!-- 未登录提示 -->
      <view v-if="!studentId" class="empty-state">
        <view class="empty-icon">
          <text>?</text>
        </view>
        <text class="empty-title">还未登录</text>
        <text class="empty-desc">请先登录或注册，完善学考成绩后获取院校推荐</text>
        <button class="empty-btn" @tap="goLogin">去登录</button>
      </view>

      <view v-else>
        <!-- 成绩摘要条 -->
        <view class="summary-bar">
          <view class="summary-grades">
            <text class="sg-item" v-if="profile.gradeA">{{ profile.gradeA }}A</text>
            <text class="sg-item" v-if="profile.gradeB">{{ profile.gradeB }}B</text>
            <text class="sg-item" v-if="profile.gradeC">{{ profile.gradeC }}C</text>
            <text class="sg-item" v-if="profile.gradeD">{{ profile.gradeD }}D</text>
            <text class="sg-item" v-if="profile.gradeE">{{ profile.gradeE }}E</text>
          </view>
          <text class="summary-count" v-if="!loading">共匹配 {{ recommendations.length }} 所院校</text>
        </view>
        <!-- 潜力提示 -->
        <view class="potential-tip" v-if="meta.remaining > 0">
          <text class="pt-text">还有{{ meta.remaining }}门未考，潜力预估 {{ meta.potentialA }}A{{ meta.potentialB }}B，已为你匹配潜力院校</text>
        </view>

        <!-- 筛选 Tab -->
        <view class="filter-tabs">
          <view :class="['tab', activeTab === 'all' ? 'active' : '']" @tap="activeTab = 'all'">
            <text>全部</text>
            <text class="tab-badge" v-if="recommendations.length">{{ recommendations.length }}</text>
          </view>
          <view :class="['tab tab-reach', activeTab === 'reach' ? 'active' : '']" @tap="activeTab = 'reach'">
            <text>冲刺</text>
            <text class="tab-badge" v-if="countByLevel('reach')">{{ countByLevel('reach') }}</text>
          </view>
          <view :class="['tab tab-stable', activeTab === 'stable' ? 'active' : '']" @tap="activeTab = 'stable'">
            <text>稳妥</text>
            <text class="tab-badge" v-if="countByLevel('stable')">{{ countByLevel('stable') }}</text>
          </view>
          <view :class="['tab tab-safe', activeTab === 'safe' ? 'active' : '']" @tap="activeTab = 'safe'">
            <text>保底</text>
            <text class="tab-badge" v-if="countByLevel('safe')">{{ countByLevel('safe') }}</text>
          </view>
          <view :class="['tab tab-potential', activeTab === 'potential' ? 'active' : '']" @tap="activeTab = 'potential'">
            <text>潜力</text>
            <text class="tab-badge" v-if="countByLevel('potential')">{{ countByLevel('potential') }}</text>
          </view>
        </view>

        <!-- Loading -->
        <view v-if="loading" class="loading-wrap">
          <view class="loading-dot"></view>
          <text class="loading-text">正在智能匹配院校...</text>
        </view>

        <!-- 院校列表 -->
        <view v-else class="school-list">
          <view v-for="item in filteredList" :key="item.school.id" class="school-card" @tap="goDetail(item.school.id)">
            <view class="card-left">
              <view :class="['level-stripe', item.level]"></view>
              <view class="card-body">
                <view class="card-top">
                  <text class="school-name">{{ item.school.name }}</text>
                  <view :class="['level-badge', item.level]">
                    <text>{{ item.levelText }}</text>
                  </view>
                </view>
                <view class="card-tags">
                  <text class="tag">{{ item.school.region || '浙江' }}</text>
                  <text class="tag">{{ item.school.type || '综合' }}</text>
                  <text class="tag tag-req" v-if="item.requirement">≥{{ item.requirement.minA }}A{{ item.requirement.minB }}B</text>
                </view>
                <!-- 潜力详细说明 -->
                <view v-if="item.isPotential && item.potentialGrade" class="potential-detail">
                  <text class="pd-current">当前 {{ item.currentGrade }}</text>
                  <text class="pd-arrow">→</text>
                  <text class="pd-potential">预计 {{ item.potentialGrade }}</text>
                </view>
                <text class="card-reason" v-if="item.reason">{{ item.reason }}</text>
              </view>
            </view>
            <view :class="['select-btn', isSelected(item.school.id) ? 'selected' : '']" @tap.stop="toggleSelectRecommend(item)">
              <text>{{ isSelected(item.school.id) ? '✓ 已选' : '+ 选择' }}</text>
            </view>
          </view>

          <view v-if="filteredList.length === 0" class="empty-filter">
            <text>该分类下暂无匹配院校</text>
          </view>
        </view>
      </view>
    </template>

    <!-- ========= 全部院校模式 ========= -->
    <template v-if="mode === 'all'">
      <!-- 搜索框 -->
      <view class="search-bar">
        <input class="search-input" v-model="searchText" placeholder="搜索院校名称、地区..." confirm-type="search" />
      </view>

      <!-- 地区筛选 -->
      <view class="region-tabs" v-if="allRegions.length > 1">
        <view v-for="r in ['全部', ...allRegions]" :key="r" :class="['region-btn', filterRegion === r ? 'region-active' : '']" @tap="filterRegion = r">
          <text>{{ r }}</text>
        </view>
      </view>

      <!-- Loading -->
      <view v-if="allLoading" class="loading-wrap">
        <view class="loading-dot"></view>
        <text class="loading-text">加载院校列表...</text>
      </view>

      <!-- 院校列表 -->
      <view v-else class="school-list">
        <view v-for="school in filteredAllSchools" :key="school.id" class="school-card" @tap="goDetail(school.id)">
          <view class="card-left">
            <view class="all-school-icon">
              <text>{{ school.name?.substring(0, 1) }}</text>
            </view>
            <view class="card-body">
              <view class="card-top">
                <text class="school-name">{{ school.name }}</text>
                <view class="type-badge" v-if="school.type">
                  <text>{{ school.type }}</text>
                </view>
              </view>
              <view class="card-tags">
                <text class="tag">{{ school.region || '浙江' }}</text>
                <text class="tag tag-grade" v-if="school.gradeRequirements">学考：{{ school.gradeRequirements }}</text>
              </view>
              <text class="card-desc" v-if="school.description">{{ school.description }}</text>
            </view>
          </view>
          <view :class="['select-btn', isSelected(school.id) ? 'selected' : '']" @tap.stop="toggleSelect(school)">
            <text>{{ isSelected(school.id) ? '✓ 已选' : '+ 选择' }}</text>
          </view>
        </view>

        <view v-if="filteredAllSchools.length === 0" class="empty-filter">
          <text>没有找到匹配的院校</text>
        </view>

        <view class="list-footer">
          <text>共 {{ filteredAllSchools.length }} 所院校</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { get, put } from '../../utils/api'

const mode = ref<'recommend' | 'all'>('recommend')
const studentId = ref<number | null>(null)
const profile = ref<any>({})
const recommendations = ref<any[]>([])
const loading = ref(false)
const activeTab = ref('all')
const meta = ref<any>({ remaining: 0, potentialA: 0, potentialB: 0 })

// 全部院校
const allSchools = ref<any[]>([])
const allLoading = ref(false)
const searchText = ref('')
const filterRegion = ref('全部')

const filteredList = computed(() => {
  if (activeTab.value === 'all') return recommendations.value
  return recommendations.value.filter(r => r.level === activeTab.value)
})

function countByLevel(level: string) {
  return recommendations.value.filter(r => r.level === level).length
}

const allRegions = computed(() => {
  const regions = new Set<string>()
  allSchools.value.forEach(s => { if (s.region) regions.add(s.region) })
  return [...regions].sort()
})

const filteredAllSchools = computed(() => {
  let list = allSchools.value
  if (filterRegion.value !== '全部') {
    list = list.filter(s => s.region === filterRegion.value)
  }
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    list = list.filter(s =>
      (s.name || '').toLowerCase().includes(kw) ||
      (s.region || '').toLowerCase().includes(kw) ||
      (s.type || '').toLowerCase().includes(kw) ||
      (s.description || '').toLowerCase().includes(kw)
    )
  }
  return list
})

async function switchToAll() {
  mode.value = 'all'
  if (allSchools.value.length === 0) {
    allLoading.value = true
    try {
      const res: any = await get('/schools')
      allSchools.value = (Array.isArray(res) ? res : []).filter((s: any) => s.isActive)
    } catch {}
    allLoading.value = false
  }
}

onMounted(async () => {
  loadSelected()
  const saved = uni.getStorageSync('studentId')
  if (saved) {
    studentId.value = saved
    try {
      const data = await get(`/students/${saved}`)
      profile.value = data || {}
    } catch {}
    await loadRecommendations()
  }
})

onShow(async () => {
  const saved = uni.getStorageSync('studentId')
  if (saved && saved !== studentId.value) {
    studentId.value = saved
    try {
      const data = await get(`/students/${saved}`)
      profile.value = data || {}
    } catch {}
    await loadRecommendations()
  } else if (!saved) {
    studentId.value = null
    profile.value = {}
    recommendations.value = []
  }
})

async function loadRecommendations() {
  loading.value = true
  try {
    const res = await get(`/recommend/student/${studentId.value}`)
    if (res.success) {
      recommendations.value = res.data || []
      if (res.meta) meta.value = res.meta
    }
  } catch {}
  loading.value = false
}

onPullDownRefresh(async () => {
  if (studentId.value) {
    await loadRecommendations()
  }
  uni.stopPullDownRefresh()
})

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/school/detail?id=${id}` })
}

function goProfile() {
  uni.switchTab({ url: '/pages/profile/index' })
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

// 院校选择（本地存储）
const selectedIds = ref<Set<number>>(new Set())

function loadSelected() {
  try {
    const saved = uni.getStorageSync('selectedSchools')
    const list = saved ? JSON.parse(saved) : []
    selectedIds.value = new Set(list.map((s: any) => s.id))
  } catch {
    selectedIds.value = new Set()
  }
}

function isSelected(id: number) {
  return selectedIds.value.has(id)
}

function toggleSelectRecommend(item: any) {
  const school = item.school
  const req = item.requirement
  const gradeReq = req ? `${req.minA}A${req.minB}B` : (school.gradeRequirements || '')
  doToggle(school.id, { id: school.id, name: school.name, region: school.region || '浙江', gradeRequirements: gradeReq, status: 'pending' })
}

function toggleSelect(school: any) {
  doToggle(school.id, { id: school.id, name: school.name, region: school.region || '浙江', gradeRequirements: school.gradeRequirements || '', status: 'pending' })
}

function doToggle(id: number, data: any) {
  try {
    const saved = uni.getStorageSync('selectedSchools')
    let list: any[] = saved ? JSON.parse(saved) : []
    const idx = list.findIndex((s: any) => s.id === id)
    if (idx >= 0) {
      list.splice(idx, 1)
      selectedIds.value.delete(id)
      uni.showToast({ title: '已取消选择', icon: 'none' })
    } else {
      list.push(data)
      selectedIds.value.add(id)
      uni.showToast({ title: '已添加到我的院校', icon: 'success' })
    }
    uni.setStorageSync('selectedSchools', JSON.stringify(list))
    // 同步到服务端
    const sid = uni.getStorageSync('studentId')
    if (sid) {
      put(`/students/${sid}`, { selectedSchools: JSON.stringify(list) }).catch(() => {})
    }
  } catch {}
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 140rpx; }

.mode-switch { display: flex; margin: 20rpx 24rpx 0; background: #eee; border-radius: 16rpx; padding: 6rpx; }
.mode-btn { flex: 1; text-align: center; padding: 16rpx 0; border-radius: 12rpx; font-size: 28rpx; color: #888; font-weight: 500; }
.mode-btn.mode-active { background: #fff; color: #2e4a78; font-weight: 600; box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05); }

.search-bar { margin: 16rpx 24rpx 0; }
.search-input { width: 100%; background: #fff; border-radius: 16rpx; padding: 20rpx 28rpx; font-size: 28rpx; color: #333; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.region-tabs { display: flex; flex-wrap: wrap; gap: 12rpx; padding: 16rpx 24rpx 0; }
.region-btn { padding: 10rpx 24rpx; border-radius: 24rpx; font-size: 24rpx; color: #888; background: #fff; border: 1rpx solid #e8e8e8; }
.region-btn.region-active { background: #2e4a78; color: #fff; border-color: #2e4a78; }
.all-school-icon { width: 72rpx; height: 72rpx; border-radius: 16rpx; background: #f0f3fa; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin: 24rpx 0 24rpx 20rpx; }
.all-school-icon text { font-size: 30rpx; font-weight: 600; color: #2e4a78; }
.type-badge { padding: 2rpx 12rpx; border-radius: 8rpx; background: #f0f3fa; }
.type-badge text { font-size: 20rpx; color: #2e4a78; }
.tag-grade { background: #fff7e6 !important; color: #fa8c16 !important; }
.card-desc { font-size: 24rpx; color: #bbb; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; margin-top: 4rpx; }
.list-footer { text-align: center; padding: 24rpx 0; font-size: 24rpx; color: #ccc; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 160rpx 60rpx 0; }
.empty-icon { width: 120rpx; height: 120rpx; border-radius: 50%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin-bottom: 24rpx; }
.empty-icon text { font-size: 48rpx; color: #ccc; }
.empty-title { font-size: 30rpx; font-weight: 600; color: #333; margin-bottom: 8rpx; }
.empty-desc { font-size: 26rpx; color: #999; text-align: center; line-height: 1.6; }
.empty-btn { margin-top: 40rpx; background: #2e4a78; color: #fff; border: none; border-radius: 12rpx; font-size: 28rpx; padding: 0 60rpx; height: 76rpx; line-height: 76rpx; }

.summary-bar { margin: 20rpx 24rpx 0; background: #fff; border-radius: 20rpx; padding: 24rpx 28rpx; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.summary-grades { display: flex; gap: 12rpx; }
.sg-item { font-size: 28rpx; font-weight: 600; color: #2e4a78; background: #f0f3fa; padding: 4rpx 16rpx; border-radius: 8rpx; }
.summary-count { font-size: 24rpx; color: #999; }

.filter-tabs { display: flex; gap: 12rpx; padding: 20rpx 24rpx 8rpx; }
.tab { flex: 1; background: #fff; border-radius: 14rpx; padding: 16rpx 0; text-align: center; font-size: 26rpx; color: #666; position: relative; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: center; gap: 8rpx; }
.tab.active { color: #fff; font-weight: 600; }
.tab.active { background: #2e4a78; }
.tab.tab-reach.active { background: #d97706; }
.tab.tab-stable.active { background: #2e6bc6; }
.tab.tab-safe.active { background: #3d8c40; }
.tab.tab-potential.active { background: #4a3780; }
.tab-badge { font-size: 20rpx; background: rgba(0,0,0,0.1); padding: 2rpx 10rpx; border-radius: 10rpx; }
.tab.active .tab-badge { background: rgba(255,255,255,0.3); }

.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 100rpx; gap: 16rpx; }
.loading-dot { width: 48rpx; height: 48rpx; border: 4rpx solid #2e4a78; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 26rpx; color: #999; }

.school-list { padding: 8rpx 24rpx; }
.school-card { background: #fff; border-radius: 20rpx; margin-bottom: 16rpx; display: flex; align-items: center; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.card-left { display: flex; flex: 1; overflow: hidden; }
.level-stripe { width: 8rpx; flex-shrink: 0; }
.level-stripe.reach { background: #fa8c16; }
.level-stripe.stable { background: #1890ff; }
.level-stripe.safe { background: #52c41a; }
.level-stripe.potential { background: #722ed1; }
.card-body { padding: 24rpx 20rpx; flex: 1; }
.card-top { display: flex; align-items: center; gap: 12rpx; margin-bottom: 10rpx; }
.card-name { font-size: 30rpx; font-weight: 600; color: #333; flex: 1; }
.level-badge { padding: 4rpx 14rpx; border-radius: 8rpx; }
.level-badge text { font-size: 22rpx; color: #fff; }
.level-badge.reach { background: #fa8c16; }
.level-badge.stable { background: #1890ff; }
.level-badge.safe { background: #52c41a; }
.level-badge.potential { background: #722ed1; }
.card-tags { display: flex; gap: 12rpx; margin-bottom: 8rpx; }
.tag { font-size: 22rpx; color: #888; background: #f5f5f5; padding: 4rpx 14rpx; border-radius: 6rpx; }
.card-reason { font-size: 24rpx; color: #aaa; display: block; }
.card-arrow { color: #ddd; font-size: 28rpx; padding-right: 24rpx; }

.empty-filter { text-align: center; padding: 80rpx 0; color: #ccc; font-size: 26rpx; }

.potential-tip { margin: 0 24rpx 8rpx; background: #f8f5ff; border: 1rpx solid #d3adf7; border-radius: 12rpx; padding: 16rpx 20rpx; }
.pt-text { font-size: 24rpx; color: #722ed1; line-height: 1.5; }

.tag-req { background: #fff1f0 !important; color: #cf1322 !important; }
.potential-detail { display: flex; align-items: center; gap: 8rpx; margin-top: 8rpx; background: #f5f2fc; padding: 8rpx 16rpx; border-radius: 8rpx; }
.pd-current { font-size: 22rpx; color: #999; font-weight: 600; }
.pd-arrow { font-size: 22rpx; color: #722ed1; font-weight: bold; }
.pd-potential { font-size: 22rpx; color: #722ed1; font-weight: 600; }

.select-btn { padding: 16rpx 24rpx; flex-shrink: 0; margin-right: 16rpx; }
.select-btn text { font-size: 24rpx; color: #2e4a78; font-weight: 600; background: #f0f3fa; padding: 10rpx 24rpx; border-radius: 10rpx; }
.select-btn.selected text { color: #52c41a; background: #f6ffed; }
</style>

<template>
  <view class="page">
    <view v-if="!school" class="loading-state">
      <text>加载中...</text>
    </view>

    <view v-else>
      <!-- 顶部大卡 -->
      <view class="hero">
        <view class="hero-bg"></view>
        <view class="hero-content">
          <view class="hero-top">
            <text class="school-name">{{ school.name }}</text>
            <view class="fav-btn" :class="{ on: isSelected }" @tap="toggleSelect">
              <text class="fav-icon">{{ isSelected ? '★' : '☆' }}</text>
              <text class="fav-text">{{ isSelected ? '已加入' : '加入院校' }}</text>
            </view>
          </view>
          <view class="hero-tags">
            <view class="htag">
              <text>{{ school.region || '浙江' }}</text>
            </view>
            <view class="htag">
              <text>{{ school.type || '综合' }}</text>
            </view>
          </view>
          <!-- 报名状态 -->
          <view v-if="isSelected" class="status-bar">
            <view :class="['status-opt', { active: currentStatus === 'pending' }]" @tap="setStatus('pending')">
              <text>✉️ 待报名</text>
            </view>
            <view :class="['status-opt', { active: currentStatus === 'applied' }]" @tap="setStatus('applied')">
              <text>✅ 已报名</text>
            </view>
            <view :class="['status-opt', { active: currentStatus === 'abandoned' }]" @tap="setStatus('abandoned')">
              <text>❌ 已放弃</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 信息卡片列表 -->
      <view class="info-list">
        <view class="info-card" v-if="school.description">
          <view class="card-header">
            <view class="card-dot" style="background: #2e4a78;"></view>
            <text class="card-title">学校简介</text>
          </view>
          <text class="card-text">{{ school.description }}</text>
        </view>

        <view class="info-card" v-if="school.requirements">
          <view class="card-header">
            <view class="card-dot" style="background: #f5576c;"></view>
            <text class="card-title">招生要求</text>
          </view>
          <text class="card-text">{{ school.requirements }}</text>
        </view>

        <view class="info-card" v-if="school.gradeRequirements">
          <view class="card-header">
            <view class="card-dot" style="background: #fa8c16;"></view>
            <text class="card-title">学考要求</text>
          </view>
          <text class="card-text">{{ school.gradeRequirements }}</text>
        </view>

        <view class="info-card" v-if="school.interviewType">
          <view class="card-header">
            <view class="card-dot" style="background: #1890ff;"></view>
            <text class="card-title">面试形式</text>
          </view>
          <text class="card-text">{{ school.interviewType }}</text>
        </view>

        <view class="info-card" v-if="school.suitableFor">
          <view class="card-header">
            <view class="card-dot" style="background: #52c41a;"></view>
            <text class="card-title">适合人群</text>
          </view>
          <text class="card-text">{{ school.suitableFor }}</text>
        </view>

        <view class="info-card advice" v-if="school.advice">
          <view class="card-header">
            <view class="card-dot" style="background: #722ed1;"></view>
            <text class="card-title">报考建议</text>
          </view>
          <text class="card-text">{{ school.advice }}</text>
        </view>

        <!-- 时间节点 -->
        <view class="info-card" v-if="schoolEvents.length > 0">
          <view class="card-header">
            <view class="card-dot" style="background: #eb2f96;"></view>
            <text class="card-title">报考时间线</text>
          </view>
          <view class="timeline">
            <view v-for="(ev, i) in schoolEvents" :key="ev.id" class="tl-item">
              <view class="tl-left">
                <view :class="['tl-dot', { past: isEventPast(ev), current: isEventCurrent(ev) }]"></view>
                <view v-if="i < schoolEvents.length - 1" class="tl-line"></view>
              </view>
              <view class="tl-content">
                <view class="tl-row">
                  <text class="tl-title">{{ ev.title }}</text>
                  <text :class="['tl-countdown', { urgent: getCountdown(ev) <= 3 && getCountdown(ev) >= 0 }]" v-if="!isEventPast(ev)">
                    {{ getCountdown(ev) > 0 ? `还有${getCountdown(ev)}天` : getCountdown(ev) === 0 ? '今天' : '' }}
                  </text>
                  <text v-else class="tl-past">已结束</text>
                </view>
                <text class="tl-date">{{ ev.date }}{{ ev.endDate ? ' ~ ' + ev.endDate : '' }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 官网链接 -->
        <view class="info-card website-card" v-if="school.website" @tap="openWebsite">
          <view class="website-inner">
            <text class="website-icon">🌐</text>
            <view class="website-text">
              <text class="website-label">访问官网</text>
              <text class="website-url">{{ school.website }}</text>
            </view>
            <text class="website-arrow">›</text>
          </view>
        </view>

        <!-- 无任何信息时 -->
        <view class="info-card" v-if="!school.description && !school.requirements && !school.gradeRequirements">
          <text class="card-text" style="color: #ccc; text-align: center;">暂无详细信息</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, put } from '../../utils/api'

const school = ref<any>(null)
const isSelected = ref(false)
const currentStatus = ref('pending')
const schoolEvents = ref<any[]>([])

onMounted(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const id = (page as any).options?.id
  if (id) loadSchool(+id)
})

async function loadSchool(id: number) {
  school.value = await get(`/schools/${id}`)
  const selected = loadSelected()
  const found = selected.find((s: any) => s.id === id)
  isSelected.value = !!found
  if (found) currentStatus.value = found.status || 'pending'
  try {
    const evts = await get(`/schools/${id}/events`)
    schoolEvents.value = Array.isArray(evts) ? evts : []
  } catch {}
}

function isEventPast(ev: any) {
  const d = ev.endDate || ev.date
  return new Date(d + 'T23:59:59') < new Date()
}

function isEventCurrent(ev: any) {
  const today = new Date().toISOString().slice(0, 10)
  if (ev.endDate) return ev.date <= today && today <= ev.endDate
  return ev.date === today
}

function getCountdown(ev: any) {
  const target = ev.endDate || ev.date
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.ceil((new Date(target).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function openWebsite() {
  if (school.value?.website) {
    uni.setClipboardData({
      data: school.value.website,
      success: () => {
        uni.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' })
      }
    })
  }
}

function loadSelected(): any[] {
  try {
    const s = uni.getStorageSync('selectedSchools')
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

function toggleSelect() {
  if (!school.value) return
  const list = loadSelected()
  const idx = list.findIndex((s: any) => s.id === school.value.id)
  if (idx >= 0) {
    list.splice(idx, 1)
    isSelected.value = false
    uni.showToast({ title: '已移除', icon: 'none' })
  } else {
    list.push({
      id: school.value.id,
      name: school.value.name,
      region: school.value.region,
      type: school.value.type,
      gradeRequirements: school.value.gradeRequirements,
      status: 'pending',
    })
    isSelected.value = true
    currentStatus.value = 'pending'
    uni.showToast({ title: '已加入我的院校', icon: 'success' })
  }
  syncList(list)
}

function setStatus(status: string) {
  currentStatus.value = status
  const list = loadSelected()
  const item = list.find((s: any) => s.id === school.value?.id)
  if (item) {
    item.status = status
    syncList(list)
    const labels: Record<string, string> = { pending: '待报名', applied: '已报名', abandoned: '已放弃' }
    uni.showToast({ title: `已标记为${labels[status]}`, icon: 'none' })
  }
}

function syncList(list: any[]) {
  uni.setStorageSync('selectedSchools', JSON.stringify(list))
  const sid = uni.getStorageSync('studentId')
  if (sid) {
    put(`/students/${sid}`, { selectedSchools: JSON.stringify(list) }).catch(() => {})
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; }
.loading-state { display: flex; align-items: center; justify-content: center; height: 60vh; font-size: 28rpx; color: #999; }

.hero { position: relative; overflow: hidden; }
.hero-bg { position: absolute; top: 0; left: 0; right: 0; height: 340rpx; background: #2e4a78; border-radius: 0 0 32rpx 32rpx; }
.hero-content { position: relative; z-index: 1; padding: 48rpx 32rpx 60rpx; }
.hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20rpx; margin-bottom: 18rpx; }
.school-name { color: #fff; font-size: 38rpx; font-weight: 700; display: block; flex: 1; }
.fav-btn { display: flex; align-items: center; gap: 6rpx; background: rgba(255,255,255,0.18); padding: 10rpx 20rpx; border-radius: 30rpx; flex-shrink: 0; }
.fav-btn.on { background: #fff; }
.fav-icon { font-size: 26rpx; color: #fff; }
.fav-btn.on .fav-icon { color: #f5a623; }
.fav-text { font-size: 22rpx; color: #fff; font-weight: 500; }
.fav-btn.on .fav-text { color: #2e4a78; font-weight: 600; }
.hero-tags { display: flex; gap: 12rpx; }
.htag { background: rgba(255,255,255,0.2); padding: 8rpx 20rpx; border-radius: 20rpx; }
.htag text { color: rgba(255,255,255,0.9); font-size: 24rpx; }

.info-list { padding: 0 24rpx 40rpx; margin-top: -20rpx; position: relative; z-index: 2; }
.info-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.info-card.advice { background: #f8f5ff; border: 1rpx solid #e8d5ff; }
.card-header { display: flex; align-items: center; gap: 12rpx; margin-bottom: 14rpx; }
.card-dot { width: 12rpx; height: 12rpx; border-radius: 50%; }
.card-title { font-size: 30rpx; font-weight: 600; color: #333; }
.card-text { font-size: 28rpx; color: #555; line-height: 1.8; display: block; }

/* 时间线 */
.timeline { padding-left: 4rpx; }
.tl-item { display: flex; gap: 16rpx; }
.tl-left { display: flex; flex-direction: column; align-items: center; width: 24rpx; flex-shrink: 0; }
.tl-dot { width: 18rpx; height: 18rpx; border-radius: 50%; background: #d9d9d9; margin-top: 8rpx; flex-shrink: 0; }
.tl-dot.current { background: #2e4a78; box-shadow: 0 0 0 6rpx rgba(46,74,120,0.2); }
.tl-dot.past { background: #bbb; }
.tl-line { width: 3rpx; flex: 1; background: #e8e8e8; min-height: 40rpx; }
.tl-content { flex: 1; padding-bottom: 24rpx; }
.tl-row { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }
.tl-title { font-size: 28rpx; color: #333; font-weight: 500; }
.tl-countdown { font-size: 24rpx; color: #2e4a78; font-weight: 600; }
.tl-countdown.urgent { color: #f5222d; }
.tl-past { font-size: 22rpx; color: #ccc; }
.tl-date { font-size: 24rpx; color: #999; margin-top: 4rpx; display: block; }

/* 报名状态 */
.status-bar { display: flex; gap: 12rpx; margin-top: 20rpx; }
.status-opt { padding: 10rpx 20rpx; border-radius: 24rpx; background: rgba(255,255,255,0.15); }
.status-opt text { font-size: 22rpx; color: rgba(255,255,255,0.8); }
.status-opt.active { background: #fff; }
.status-opt.active text { color: #2e4a78; font-weight: 600; }

/* 官网卡片 */
.website-card { cursor: pointer; }
.website-inner { display: flex; align-items: center; gap: 16rpx; }
.website-icon { font-size: 40rpx; }
.website-text { flex: 1; }
.website-label { font-size: 28rpx; color: #333; font-weight: 500; display: block; }
.website-url { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.website-arrow { font-size: 36rpx; color: #ccc; }
</style>

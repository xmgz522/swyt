<template>
  <view class="page">
    <!-- 顶部区域 -->
    <view class="header" :style="{ paddingTop: (statusBarHeight + 44) + 'px' }">
      <view class="header-top">
        <view class="header-left">
          <view class="avatar">
            <text class="avatar-text">{{ profile.name ? profile.name.substring(0, 1) : '✉' }}</text>
          </view>
          <view class="header-info">
            <text class="header-greeting">{{ greetingText }}</text>
            <text class="header-sub">{{ profile.name || '同学' }}，加油</text>
          </view>
        </view>
        <view class="header-right">
          <view class="icon-btn" @tap="goNav('/pages/notification/index')">
            <text class="icon-text">🔔</text>
            <view v-if="unreadCount > 0" class="badge"><text>{{ unreadCount > 9 ? '9+' : unreadCount }}</text></view>
          </view>
        </view>
      </view>

      <!-- 倒计时 -->
      <view class="countdown-bar" @tap="showCountdownPicker = true">
        <view class="cd-left">
          <text class="cd-label">距 {{ countdownTarget }}</text>
          <text class="cd-date">{{ countdownDateStr }}</text>
        </view>
        <view class="cd-right">
          <text class="cd-num">{{ countdownDays }}</text>
          <text class="cd-unit">天</text>
        </view>
      </view>
    </view>

    <!-- 倒计时选择弹窗 -->
    <view v-if="showCountdownPicker" class="picker-mask" @tap="showCountdownPicker = false">
      <view class="picker-body" @tap.stop>
        <text class="picker-title">切换倒计时目标</text>
        <view v-for="opt in countdownOptions" :key="opt.label" class="picker-option" @tap="selectCountdown(opt)">
          <text class="picker-opt-label">{{ opt.label }}</text>
          <text class="picker-opt-date">{{ opt.dateStr }}</text>
        </view>
      </view>
    </view>

    <!-- 目标院校 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">目标院校</text>
        <text class="section-more" @tap="goTo('/pages/recommend/index')">去选择 ›</text>
      </view>
      <view class="school-scroll">
        <scroll-view scroll-x class="school-list">
          <view v-if="selectedSchools.length === 0" class="school-empty">
            <text class="school-empty-text" @tap="goTo('/pages/recommend/index')">还没有选择院校，去推荐页看看</text>
          </view>
          <view v-for="s in selectedSchools" :key="s.id" class="school-card" @tap="goSchool(s.id)">
            <text class="school-name">{{ s.name }}</text>
            <text :class="['school-status', 'ss-' + (s.status || 'pending')]">{{ statusLabel(s.status) }}</text>
            <text class="school-tag">{{ s.region || '浙江' }}</text>
            <text v-if="s.gradeRequirements" class="school-grade">{{ s.gradeRequirements }}</text>
            <view v-if="getNextEvent(s.id)" class="school-event">
              <text :class="['se-text', { urgent: getNextEvent(s.id).days <= 3 }]">{{ getNextEvent(s.id).title }}  {{ getNextEvent(s.id).days > 0 ? `还有${getNextEvent(s.id).days}天` : getNextEvent(s.id).days === 0 ? '今天' : '进行中' }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 今日任务 -->
    <view v-if="todayTasks.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">今日任务</text>
        <text class="section-more" @tap="goNav('/pages/calendar/index')">全部 ›</text>
      </view>
      <view v-for="t in todayTasks" :key="t.id" class="task-row">
        <view :class="['task-ck', { done: t.completed }]" @tap="toggleTask(t)">
          <text v-if="t.completed">✓</text>
        </view>
        <text :class="['task-text', { finished: t.completed }]">{{ t.title }}</text>
      </view>
      <view v-if="todayTasksTotal > 3" class="task-footer">
        <text class="task-footer-text" @tap="goNav('/pages/calendar/index')">还有 {{ todayTasksTotal - 3 }} 项任务 ›</text>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">功能</text>
      </view>
      <view class="func-grid">
        <view class="func-item" @tap="goNav('/pages/exam/list')">
          <view class="fi-icon c1"><text>模拟</text></view>
          <text class="fi-name">模拟考试</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/exam/real')">
          <view class="fi-icon c2"><text>真题</text></view>
          <text class="fi-name">历年真题</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/practice/index')">
          <view class="fi-icon c3"><text>练题</text></view>
          <text class="fi-name">考点练题</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/sprint/index')">
          <view class="fi-icon c4"><text>冲刺</text></view>
          <text class="fi-name">学考冲刺</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/policy/index')">
          <view class="fi-icon c5"><text>政策</text></view>
          <text class="fi-name">招生政策</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/analysis/index')">
          <view class="fi-icon c6"><text>分析</text></view>
          <text class="fi-name">分析报告</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/wrong/index')">
          <view class="fi-icon c7"><text>错题</text></view>
          <text class="fi-name">错题本</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/calendar/index')">
          <view class="fi-icon c8"><text>日历</text></view>
          <text class="fi-name">学习日历</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/interview/index')">
          <view class="fi-icon c9"><text>面试</text></view>
          <text class="fi-name">面试题库</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/interview/mock')">
          <view class="fi-icon c11"><text>模面</text></view>
          <text class="fi-name">模拟面试</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/weekly/index')">
          <view class="fi-icon c10"><text>周报</text></view>
          <text class="fi-name">学情周报</text>
        </view>
        <view class="func-item" @tap="goNav('/pages/major/index')">
          <view class="fi-icon c12"><text>专业</text></view>
          <text class="fi-name">专业解析</text>
        </view>
      </view>
    </view>

    <!-- 最近考试 -->
    <view v-if="recentSheets.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">最近考试</text>
      </view>
      <view v-for="s in recentSheets" :key="s.id" class="history-item" @tap="goResult(s.id)">
        <view class="history-left">
          <view :class="['history-dot', s.status === 'graded' ? 'done' : 'pending']"></view>
          <view class="history-info">
            <text class="history-title">{{ s.paperTitle || '模拟卷' }}</text>
            <text class="history-time">{{ formatTime(s.createdAt) }}</text>
          </view>
        </view>
        <view class="history-right">
          <text class="history-score">{{ s.totalScore ?? '-' }}</text>
          <text class="history-unit">分</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get, put } from '../../utils/api'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'

const statusBarHeight = ref(20)
try {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 20
} catch {}

const profile = ref<any>({})
const hasProfile = ref(false)
const recentSheets = ref<any[]>([])
const selectedSchools = ref<any[]>([])
const upcomingEvents = ref<any[]>([])
const showCountdownPicker = ref(false)
const unreadCount = ref(0)
const todayTasks = ref<any[]>([])
const todayTasksTotal = ref(0)

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，早点休息'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const countdownTarget = ref('三位一体报名')
const countdownDate = ref('')

// 默认考试节点
const countdownOptions = computed(() => {
  const year = new Date().getFullYear()
  const nextYear = year + (new Date().getMonth() >= 6 ? 1 : 0)
  return [
    { label: '三位一体报名', date: `${nextYear}-03-01`, dateStr: `${nextYear}年3月` },
    { label: '三位一体笔试', date: `${nextYear}-04-15`, dateStr: `${nextYear}年4月` },
    { label: '学考（1月）', date: `${nextYear}-01-06`, dateStr: `${nextYear}年1月` },
    { label: '学考（6月）', date: `${year}-06-29`, dateStr: `${year}年6月` },
    { label: '高考', date: `${nextYear}-06-07`, dateStr: `${nextYear}年6月7日` },
  ]
})

const countdownDateStr = computed(() => {
  if (!countdownDate.value) return ''
  const d = new Date(countdownDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const countdownDays = computed(() => {
  if (!countdownDate.value) return '--'
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(countdownDate.value)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

function selectCountdown(opt: any) {
  countdownTarget.value = opt.label
  countdownDate.value = opt.date
  uni.setStorageSync('countdown_target', opt.label)
  uni.setStorageSync('countdown_date', opt.date)
  showCountdownPicker.value = false
}

onMounted(async () => {
  // 恢复倒计时设置
  const savedTarget = uni.getStorageSync('countdown_target')
  const savedDate = uni.getStorageSync('countdown_date')
  if (savedTarget && savedDate) {
    countdownTarget.value = savedTarget
    countdownDate.value = savedDate
  } else {
    // 默认设为三位一体报名
    const defaults = countdownOptions.value[0]
    countdownTarget.value = defaults.label
    countdownDate.value = defaults.date
  }

  const sid = uni.getStorageSync('studentId')
  if (sid) {
    try {
      const data = await get(`/students/${sid}`)
      if (data && data.name) {
        profile.value = data
        hasProfile.value = true
      }
    } catch {}
    try {
      const sheets = await get(`/exam/answer-sheets?studentId=${sid}`)
      if (Array.isArray(sheets)) {
        recentSheets.value = sheets.slice(0, 3)
      }
    } catch {}
  }

  // 加载用户自选院校
  loadSelectedSchools()

  // 加载今日任务
  if (sid) { loadTodayTasks(sid) }

  // 通知未读数
  if (sid) {
    try {
      get(`/notifications/student/${sid}/unread`).then((res: any) => {
        if (res && typeof res.count === 'number') unreadCount.value = res.count
      })
    } catch {}
  }
})

onShow(async () => {
  loadSelectedSchools()
  const sid = uni.getStorageSync('studentId')
  if (sid) {
    // 状态校验：检查账号是否停用/过期
    try {
      const status: any = await get(`/students/check-status/${sid}`)
      if (!status.valid) {
        uni.removeStorageSync('studentId')
        uni.showToast({ title: status.message || '账号异常', icon: 'none', duration: 2000 })
        setTimeout(() => { uni.redirectTo({ url: '/pages/login/index' }) }, 1500)
        return
      }
      profile.value = status.data
      hasProfile.value = true
    } catch {
      // 网络异常时不强制退出，用本地缓存
      try {
        const data = await get(`/students/${sid}`)
        if (data && data.name) {
          profile.value = data
          hasProfile.value = true
        }
      } catch {}
    }
    // 刷新最近考试
    try {
      const sheets = await get(`/exam/answer-sheets?studentId=${sid}`)
      if (Array.isArray(sheets)) {
        recentSheets.value = sheets.slice(0, 3)
      }
    } catch {}
    get(`/notifications/student/${sid}/unread`).then((res: any) => {
      if (res && typeof res.count === 'number') unreadCount.value = res.count
    }).catch(() => {})
    loadTodayTasks(sid)
    // 加载目标院校事件
    loadUpcomingEvents()
  } else {
    // 退出登录后清空数据
    profile.value = {}
    hasProfile.value = false
    recentSheets.value = []
    todayTasks.value = []
    unreadCount.value = 0
    upcomingEvents.value = []
  }
})

onPullDownRefresh(async () => {
  const sid = uni.getStorageSync('studentId')
  if (sid) {
    loadSelectedSchools()
    try {
      const data = await get(`/students/${sid}`)
      if (data && data.name) { profile.value = data; hasProfile.value = true }
    } catch {}
    try {
      const sheets = await get(`/exam/answer-sheets?studentId=${sid}`)
      if (Array.isArray(sheets)) recentSheets.value = sheets.slice(0, 3)
    } catch {}
    loadTodayTasks(sid)
    loadUpcomingEvents()
  }
  uni.stopPullDownRefresh()
})

function loadSelectedSchools() {
  try {
    const saved = uni.getStorageSync('selectedSchools')
    selectedSchools.value = saved ? JSON.parse(saved) : []
  } catch {
    selectedSchools.value = []
  }
}

async function loadUpcomingEvents() {
  if (selectedSchools.value.length === 0) { upcomingEvents.value = []; return }
  try {
    const ids = selectedSchools.value.map((s: any) => s.id).join(',')
    const data = await get(`/schools/events/upcoming?schoolIds=${ids}`)
    upcomingEvents.value = Array.isArray(data) ? data : []
  } catch { upcomingEvents.value = [] }
}

function getNextEvent(schoolId: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const evts = upcomingEvents.value.filter((e: any) => e.schoolId === schoolId)
  if (evts.length === 0) return null
  const ev = evts[0]
  const target = new Date(ev.endDate || ev.date)
  const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return { title: ev.title, days }
}

function statusLabel(status?: string) {
  const map: Record<string, string> = { pending: '待报名', applied: '已报名', abandoned: '已放弃' }
  return map[status || 'pending'] || '待报名'
}

function goTo(url: string) {
  uni.switchTab({ url }).catch(() => {
    uni.navigateTo({ url })
  })
}

function goNav(url: string) {
  uni.navigateTo({ url })
}

function goSchool(id: number) {
  uni.navigateTo({ url: `/pages/school/detail?id=${id}` })
}

function goResult(id: number) {
  uni.navigateTo({ url: `/pages/exam/result?sheetId=${id}` })
}

function formatTime(t: string) {
  if (!t) return ''
  return t.substring(0, 10)
}

async function loadTodayTasks(sid: string) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const data = await get(`/study-plan/${sid}/date?date=${today}`)
    if (Array.isArray(data)) {
      todayTasksTotal.value = data.length
      todayTasks.value = data.slice(0, 3)
    }
  } catch {}
}

async function toggleTask(task: any) {
  task.completed = !task.completed
  try { await put(`/study-plan/${task.id}/toggle`, { completed: task.completed }) } catch {}
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f4f5f7; padding-bottom: 140rpx; }

/* 顶部 */
.header { background: #2e4a78; padding: 0 0 28rpx; border-radius: 0 0 28rpx 28rpx; }
.header-top { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 28rpx; }
.header-left { display: flex; align-items: center; gap: 20rpx; }
.header-right { display: flex; align-items: center; gap: 16rpx; }
.icon-btn { position: relative; width: 64rpx; height: 64rpx; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; }
.icon-text { font-size: 32rpx; }
.badge { position: absolute; top: -6rpx; right: -6rpx; min-width: 28rpx; height: 28rpx; border-radius: 14rpx; background: #f5222d; display: flex; align-items: center; justify-content: center; padding: 0 6rpx; }
.badge text { color: #fff; font-size: 18rpx; font-weight: bold; }
.avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; border: 3rpx solid rgba(255,255,255,0.3); flex-shrink: 0; }
.avatar-text { color: #fff; font-size: 34rpx; font-weight: 600; }
.header-info {}
.header-greeting { display: block; font-size: 30rpx; font-weight: 600; color: #fff; }
.header-sub { display: block; font-size: 24rpx; color: rgba(255,255,255,0.65); margin-top: 4rpx; }

/* 倒计时 */
.countdown-bar { margin: 0 20rpx; background: rgba(255,255,255,0.12); border-radius: 16rpx; padding: 20rpx 24rpx; display: flex; justify-content: space-between; align-items: center; }
.cd-left {}
.cd-label { font-size: 26rpx; font-weight: 500; color: rgba(255,255,255,0.9); display: block; }
.cd-date { font-size: 20rpx; color: rgba(255,255,255,0.55); display: block; margin-top: 4rpx; }
.cd-right { display: flex; align-items: baseline; gap: 4rpx; }
.cd-num { font-size: 52rpx; font-weight: 800; color: #fff; }
.cd-unit { font-size: 22rpx; color: rgba(255,255,255,0.7); font-weight: 500; }

/* 弹窗 */
.picker-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); z-index: 999; display: flex; align-items: flex-end; }
.picker-body { width: 100%; background: #fff; border-radius: 24rpx 24rpx 0 0; padding: 36rpx 28rpx 56rpx; }
.picker-title { display: block; font-size: 30rpx; font-weight: 600; color: #333; margin-bottom: 24rpx; }
.picker-option { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 16rpx; border-bottom: 1rpx solid #f5f5f5; }
.picker-opt-label { font-size: 28rpx; color: #333; }
.picker-opt-date { font-size: 24rpx; color: #aaa; }

/* 栏目 */
.section { margin: 20rpx 20rpx 0; background: #fff; border-radius: 20rpx; padding: 28rpx; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: 600; color: #333; }
.section-more { font-size: 24rpx; color: #999; }

/* 院校 */
.school-scroll { margin: 0 -8rpx; }
.school-list { white-space: nowrap; padding: 0 8rpx; }
.school-card { display: inline-flex; flex-direction: column; width: 200rpx; min-height: 100rpx; background: #f7f8fc; border-radius: 14rpx; padding: 18rpx; margin-right: 14rpx; vertical-align: top; border: 1rpx solid #eeeff3; gap: 8rpx; }
.school-name { font-size: 24rpx; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.school-status { font-size: 18rpx; padding: 2rpx 8rpx 2rpx 0; border-radius: 0; white-space: nowrap; align-self: flex-start; }
.ss-pending { background: #fff7e6; color: #fa8c16; }
.ss-applied { background: #f6ffed; color: #52c41a; }
.ss-abandoned { background: #f5f5f5; color: #999; }
.school-tag { font-size: 20rpx; color: #5a7ab5; margin-top: 8rpx; display: block; }
.school-grade { font-size: 20rpx; color: #c07a00; margin-top: 4rpx; display: block; font-weight: 600; }
.school-event { margin-top: 10rpx; background: #eef2ff; border-radius: 8rpx; padding: 6rpx 10rpx; }
.se-text { font-size: 20rpx; color: #2e4a78; font-weight: 500; white-space: normal; }
.se-text.urgent { color: #f5222d; }
.school-empty { padding: 30rpx 0; text-align: center; width: 100%; }
.school-empty-text { font-size: 24rpx; color: #999; }

/* 今日任务 */
.task-row { display: flex; align-items: center; gap: 16rpx; padding: 14rpx 0; border-bottom: 1rpx solid #f8f8f8; }
.task-row:last-child { border-bottom: none; }
.task-ck { width: 36rpx; height: 36rpx; border-radius: 50%; border: 3rpx solid #d9d9d9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.task-ck.done { border-color: #52c41a; background: #52c41a; }
.task-ck.done text { color: #fff; font-size: 20rpx; font-weight: bold; }
.task-text { font-size: 28rpx; color: #333; flex: 1; }
.task-text.finished { text-decoration: line-through; color: #bbb; }
.task-footer { text-align: center; padding-top: 12rpx; }
.task-footer-text { font-size: 24rpx; color: #999; }

/* 功能入口 */
.func-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20rpx 0; }
.func-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; padding: 12rpx 0; }
.fi-icon { width: 72rpx; height: 72rpx; border-radius: 18rpx; display: flex; align-items: center; justify-content: center; }
.fi-icon text { font-size: 24rpx; font-weight: bold; color: #fff; }
.fi-icon.c1, .fi-icon.c2, .fi-icon.c3, .fi-icon.c4, .fi-icon.c5,
.fi-icon.c6, .fi-icon.c7, .fi-icon.c8, .fi-icon.c9, .fi-icon.c10, .fi-icon.c11, .fi-icon.c12 { background: linear-gradient(135deg, #4f8ef7, #6db3f2); }
.fi-name { font-size: 24rpx; color: #444; }

/* 最近考试 */
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.history-item:last-child { border-bottom: none; }
.history-left { display: flex; align-items: center; gap: 16rpx; }
.history-dot { width: 14rpx; height: 14rpx; border-radius: 50%; flex-shrink: 0; }
.history-dot.done { background: #047857; }
.history-dot.pending { background: #c07a00; }
.history-info {}
.history-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; }
.history-time { font-size: 22rpx; color: #bbb; margin-top: 4rpx; display: block; }
.history-right { display: flex; align-items: baseline; gap: 4rpx; }
.history-score { font-size: 36rpx; font-weight: 600; color: #2e4a78; }
.history-unit { font-size: 22rpx; color: #999; }
</style>

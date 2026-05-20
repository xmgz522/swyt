<template>
  <view class="page">
    <!-- 月份切换 -->
    <view class="month-bar">
      <text class="arrow" @tap="changeMonth(-1)">‹</text>
      <text class="month-text">{{ year }}年{{ month }}月</text>
      <text class="arrow" @tap="changeMonth(1)">›</text>
    </view>

    <!-- 打卡统计 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-num">{{ stats.streak }}</text>
        <text class="stat-label">连续打卡</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.completed }}</text>
        <text class="stat-label">已完成</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.total }}</text>
        <text class="stat-label">总任务</text>
      </view>
    </view>

    <!-- 日历网格 -->
    <view class="cal-header">
      <text v-for="d in weekDays" :key="d" class="cal-hd">{{ d }}</text>
    </view>
    <view class="cal-grid">
      <view v-for="(cell, i) in calendarCells" :key="i"
        :class="['cal-cell', { today: cell.isToday, selected: cell.date === selectedDate, hasTask: cell.hasTask, checked: cell.checked }]"
        @tap="cell.date && selectDate(cell.date)"
      >
        <text class="cal-day">{{ cell.day || '' }}</text>
        <view class="dot-row">
          <view v-if="cell.hasTask" class="cal-dot" :class="{ done: cell.checked }"></view>
          <view v-if="cell.hasEvent" class="cal-dot event-dot"></view>
        </view>
      </view>
    </view>

    <!-- 每日任务管理 -->
    <view class="task-section">
      <view class="task-header">
        <view class="daily-header-left">
          <text class="task-date">每日任务</text>
          <text class="daily-hint">设置后每天自动出现</text>
        </view>
        <text class="task-add" @tap="showAddDaily = true">+ 添加</text>
      </view>
      <view v-if="dailyTasks.length === 0" class="task-empty">
        <text>添加每日任务后，无需每天重复添加</text>
      </view>
      <view v-for="dt in dailyTasks" :key="dt.id" class="task-item">
        <view class="daily-dot"></view>
        <view class="task-body">
          <text class="task-title">{{ dt.title }}</text>
          <text v-if="dt.description" class="task-desc">{{ dt.description }}</text>
        </view>
        <text class="task-del" @tap="deleteDailyTask(dt.id)">X</text>
      </view>
    </view>

    <!-- 当天任务 -->
    <view class="task-section">
      <view class="task-header">
        <text class="task-date">{{ selectedDate || '选择日期' }}</text>
        <text class="task-add" @tap="showAdd = true">+ 添加任务</text>
      </view>

      <!-- 院校事件 -->
      <view v-for="ev in dayEvents" :key="'ev-' + ev.id" class="event-item">
        <view class="event-badge">
          <text class="event-badge-text">🏫</text>
        </view>
        <view class="event-body">
          <text class="event-title">{{ ev.schoolName }} - {{ ev.title }}</text>
          <text class="event-date">{{ ev.date }}{{ ev.endDate ? ' ~ ' + ev.endDate : '' }}</text>
        </view>
      </view>

      <view v-if="dayTasks.length === 0 && dayEvents.length === 0" class="task-empty">
        <text>当天暂无任务和事件</text>
      </view>

      <view v-for="t in dayTasks" :key="t.id" class="task-item">
        <view :class="['task-check', { done: t.completed }]" @tap="toggleTask(t)">
          <text v-if="t.completed">V</text>
        </view>
        <view class="task-body">
          <view class="task-title-row">
            <text :class="['task-title', { 'line-through': t.completed }]">{{ t.title }}</text>
            <text v-if="t.type === 'daily'" class="daily-tag">每日</text>
          </view>
          <text v-if="t.description" class="task-desc">{{ t.description }}</text>
        </view>
        <text v-if="t.type !== 'daily'" class="task-del" @tap="deleteTask(t.id)">X</text>
      </view>
    </view>

    <!-- 添加任务弹窗 -->
    <view v-if="showAdd" class="overlay" @tap="showAdd = false">
      <view class="add-modal" @tap.stop>
        <text class="add-title">添加任务</text>
        <input v-model="newTitle" placeholder="任务标题" class="add-input" />
        <textarea v-model="newDesc" placeholder="描述（可选）" class="add-textarea" />
        <button class="add-btn" @tap="addTask">确认添加</button>
      </view>
    </view>

    <!-- 添加每日任务弹窗 -->
    <view v-if="showAddDaily" class="overlay" @tap="showAddDaily = false">
      <view class="add-modal" @tap.stop>
        <text class="add-title">添加每日任务</text>
        <text class="add-hint">设置后每天自动出现，无需重复添加</text>
        <input v-model="dailyTitle" placeholder="如：背20个单词" class="add-input" />
        <textarea v-model="dailyDesc" placeholder="描述（可选）" class="add-textarea" />
        <button class="add-btn" @tap="addDailyTask">确认添加</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { get, post, put, del } from '../../utils/api'

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const monthPlans = ref<any[]>([])
const dayTasks = ref<any[]>([])
const stats = ref({ streak: 0, completed: 0, total: 0 })
const showAdd = ref(false)
const newTitle = ref('')
const newDesc = ref('')
const dailyTasks = ref<any[]>([])
const showAddDaily = ref(false)
const dailyTitle = ref('')
const dailyDesc = ref('')
const schoolEvents = ref<any[]>([])
const dayEvents = ref<any[]>([])

function getStudentId() {
  return uni.getStorageSync('studentId')
}

const calendarCells = computed(() => {
  const firstDay = new Date(year.value, month.value - 1, 1).getDay()
  const daysInMonth = new Date(year.value, month.value, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)
  const cells: any[] = []

  for (let i = 0; i < firstDay; i++) cells.push({ day: '', date: '' })

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const tasksForDay = monthPlans.value.filter(p => p.date === dateStr)
    const hasEvent = schoolEvents.value.some(e => {
      if (e.endDate) return e.date <= dateStr && dateStr <= e.endDate
      return e.date === dateStr
    })
    cells.push({
      day: d,
      date: dateStr,
      isToday: dateStr === today,
      hasTask: tasksForDay.length > 0,
      checked: tasksForDay.length > 0 && tasksForDay.every(t => t.completed),
      hasEvent,
    })
  }
  return cells
})

function changeMonth(delta: number) {
  month.value += delta
  if (month.value > 12) { month.value = 1; year.value++ }
  if (month.value < 1) { month.value = 12; year.value-- }
  loadMonth()
}

function selectDate(date: string) {
  selectedDate.value = date
  loadDay()
  loadDayEvents()
}

async function loadMonth() {
  const sid = getStudentId()
  if (!sid) return
  try {
    const data = await get(`/study-plan/${sid}/month?year=${year.value}&month=${month.value}`)
    monthPlans.value = Array.isArray(data) ? data : []
  } catch {}
}

async function loadDay() {
  const sid = getStudentId()
  if (!sid) return
  try {
    const data = await get(`/study-plan/${sid}/date?date=${selectedDate.value}`)
    dayTasks.value = Array.isArray(data) ? data : []
  } catch {}
}

async function loadStats() {
  const sid = getStudentId()
  if (!sid) return
  try {
    const data = await get(`/study-plan/${sid}/stats?days=30`)
    if (data) stats.value = data
  } catch {}
}

async function toggleTask(task: any) {
  task.completed = !task.completed
  if (task.type === 'daily' && task.dailyTaskId) {
    try {
      await put(`/study-plan/daily-tasks/${task.dailyTaskId}/toggle`, {
        studentId: +getStudentId(),
        date: selectedDate.value,
        completed: task.completed,
      })
    } catch {}
  } else {
    try { await put(`/study-plan/${task.id}/toggle`, { completed: task.completed }) } catch {}
  }
  loadMonth()
  loadStats()
}

async function deleteTask(id: number) {
  const [err] = await new Promise<any>(resolve => {
    uni.showModal({
      title: '提示', content: '确定删除这个任务吗？',
      success: (res) => resolve(res.confirm ? [null] : ['cancel']),
      fail: () => resolve(['fail']),
    })
  })
  if (err) return
  try { await del(`/study-plan/${id}`) } catch {}
  uni.showToast({ title: '已删除', icon: 'success' })
  loadDay()
  loadMonth()
}

async function addTask() {
  if (!newTitle.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' }); return
  }
  const sid = getStudentId()
  if (!sid) { uni.showToast({ title: '请先登录', icon: 'none' }); return }
  await post('/study-plan', {
    studentId: +sid,
    title: newTitle.value,
    description: newDesc.value,
    date: selectedDate.value,
    type: 'task',
  })
  newTitle.value = ''
  newDesc.value = ''
  showAdd.value = false
  loadDay()
  loadMonth()
  loadStats()
}

async function loadDailyTasks() {
  const sid = getStudentId()
  if (!sid) return
  try {
    const data = await get(`/study-plan/daily-tasks/${sid}`)
    dailyTasks.value = Array.isArray(data) ? data : []
  } catch {}
}

async function addDailyTask() {
  if (!dailyTitle.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' }); return
  }
  const sid = getStudentId()
  if (!sid) { uni.showToast({ title: '请先登录', icon: 'none' }); return }
  await post('/study-plan/daily-tasks', {
    studentId: +sid,
    title: dailyTitle.value,
    description: dailyDesc.value,
  })
  dailyTitle.value = ''
  dailyDesc.value = ''
  showAddDaily.value = false
  uni.showToast({ title: '已添加', icon: 'success' })
  loadDailyTasks(); loadMonth(); loadDay()
}

async function deleteDailyTask(id: number) {
  const [err] = await new Promise<any>(resolve => {
    uni.showModal({
      title: '删除每日任务', content: '删除后每天将不再自动显示该任务',
      success: (res) => resolve(res.confirm ? [null] : ['cancel']),
      fail: () => resolve(['fail']),
    })
  })
  if (err) return
  try { await del(`/study-plan/daily-tasks/${id}`) } catch {}
  uni.showToast({ title: '已删除', icon: 'success' })
  loadDailyTasks(); loadMonth(); loadDay()
}

onMounted(() => {
  loadMonth()
  loadDay()
  loadStats()
  loadDailyTasks()
  loadSchoolEvents()
})

onShow(() => {
  loadSchoolEvents()
})

onPullDownRefresh(async () => {
  await Promise.all([loadMonth(), loadDay(), loadStats(), loadDailyTasks(), loadSchoolEvents()])
  uni.stopPullDownRefresh()
})

async function loadSchoolEvents() {
  try {
    const saved = uni.getStorageSync('selectedSchools')
    const list = saved ? JSON.parse(saved) : []
    if (list.length === 0) { schoolEvents.value = []; dayEvents.value = []; return }
    const ids = list.map((s: any) => s.id).join(',')
    const data = await get(`/schools/events/by-schools?schoolIds=${ids}`)
    schoolEvents.value = Array.isArray(data) ? data : []
    loadDayEvents()
  } catch { schoolEvents.value = [] }
}

function loadDayEvents() {
  const date = selectedDate.value
  dayEvents.value = schoolEvents.value.filter(e => {
    if (e.endDate) return e.date <= date && date <= e.endDate
    return e.date === date
  })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 40rpx; }
.month-bar { display: flex; justify-content: center; align-items: center; gap: 32rpx; padding: 24rpx 0; }
.arrow { font-size: 40rpx; color: #2e4a78; padding: 0 20rpx; }
.month-text { font-size: 32rpx; font-weight: 600; color: #333; }

.stats-bar { display: flex; justify-content: space-around; padding: 16rpx 32rpx 24rpx; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 34rpx; font-weight: 600; color: #2e4a78; }
.stat-label { font-size: 22rpx; color: #999; margin-top: 4rpx; }

.cal-header { display: flex; padding: 0 24rpx; }
.cal-hd { flex: 1; text-align: center; font-size: 24rpx; color: #999; padding: 8rpx 0; }
.cal-grid { display: flex; flex-wrap: wrap; padding: 0 24rpx; }
.cal-cell { width: 14.285%; display: flex; flex-direction: column; align-items: center; padding: 12rpx 0; position: relative; }
.cal-day { font-size: 28rpx; color: #333; width: 60rpx; height: 60rpx; line-height: 60rpx; text-align: center; border-radius: 50%; }
.cal-cell.today .cal-day { background: #2e4a78; color: #fff; }
.cal-cell.selected .cal-day { border: 2rpx solid #2e4a78; }
.dot-row { display: flex; gap: 4rpx; justify-content: center; margin-top: 4rpx; min-height: 10rpx; }
.cal-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background: #fa8c16; }
.cal-dot.done { background: #52c41a; }
.cal-dot.event-dot { background: #f5222d; }

.task-section { margin: 24rpx 24rpx 0; background: #fff; border-radius: 20rpx; padding: 24rpx; }
.task-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.task-date { font-size: 28rpx; font-weight: 600; color: #333; }
.task-add { font-size: 26rpx; color: #2e4a78; }
.task-empty { padding: 40rpx 0; text-align: center; color: #ccc; font-size: 26rpx; }

.task-item { display: flex; align-items: flex-start; gap: 16rpx; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.task-check { width: 40rpx; height: 40rpx; border-radius: 50%; border: 3rpx solid #d9d9d9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 4rpx; transition: all 0.2s ease; }
.task-check.done { border-color: #52c41a; background: #52c41a; transform: scale(1.1); }
.task-check text { color: #fff; font-size: 22rpx; font-weight: bold; }
.task-body { flex: 1; }
.task-title { font-size: 28rpx; color: #333; display: block; }
.task-title.line-through { text-decoration: line-through; color: #ccc; }
.task-desc { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
.task-del { font-size: 24rpx; color: #f5222d; padding: 8rpx; flex-shrink: 0; }
.task-title-row { display: flex; align-items: center; gap: 8rpx; }
.daily-tag { font-size: 20rpx; padding: 2rpx 10rpx; border-radius: 8rpx; background: #e8f4ff; color: #1890ff; flex-shrink: 0; }
.daily-header-left { display: flex; flex-direction: column; }
.daily-hint { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.daily-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #7c8cf5; flex-shrink: 0; margin-top: 10rpx; }
.add-hint { font-size: 24rpx; color: #999; display: block; text-align: center; margin-bottom: 20rpx; }

.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: flex-end; }
.add-modal { background: #fff; border-radius: 32rpx 32rpx 0 0; width: 100%; padding: 40rpx 32rpx; }
.add-title { font-size: 32rpx; font-weight: 600; display: block; margin-bottom: 24rpx; text-align: center; }
.add-input { border: 2rpx solid #e8e8e8; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 28rpx; margin-bottom: 16rpx; width: 100%; box-sizing: border-box; }
.add-textarea { border: 2rpx solid #e8e8e8; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 26rpx; height: 120rpx; margin-bottom: 16rpx; width: 100%; box-sizing: border-box; }
.add-types { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.type-tag { padding: 10rpx 24rpx; border-radius: 20rpx; background: #f5f5f5; font-size: 24rpx; }
.add-btn { background: #2e4a78; color: #fff; border: none; border-radius: 12rpx; height: 80rpx; line-height: 80rpx; font-size: 30rpx; }

/* 院校事件 */
.event-item { display: flex; align-items: center; gap: 16rpx; padding: 16rpx 0; border-bottom: 1rpx solid #fff0f0; }
.event-badge { width: 48rpx; height: 48rpx; border-radius: 50%; background: #fff1f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.event-badge-text { font-size: 28rpx; }
.event-body { flex: 1; }
.event-title { font-size: 28rpx; color: #333; font-weight: 500; display: block; }
.event-date { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
</style>

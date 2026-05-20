<template>
  <div class="student-home">
    <div class="top-panel">
      <div>
        <p class="text-sm text-gray-500 mb-2">{{ todayStr }}</p>
        <h1 class="text-2xl font-semibold text-gray-900">{{ greeting }}，{{ store.profile?.name || '同学' }}</h1>
        <p class="text-sm text-gray-500 mt-2">查看测评进度、推荐院校和近期学习任务</p>
        <div class="flex flex-wrap items-center gap-2 mt-4" v-if="store.profile && store.gradeTotal > 0">
          <span v-if="store.profile.gradeA" class="grade-pill grade-a">{{ store.profile.gradeA }}A</span>
          <span v-if="store.profile.gradeB" class="grade-pill grade-b">{{ store.profile.gradeB }}B</span>
          <span v-if="store.profile.gradeC" class="grade-pill grade-c">{{ store.profile.gradeC }}C</span>
          <span v-if="store.profile.gradeD" class="grade-pill grade-d">{{ store.profile.gradeD }}D</span>
          <span v-if="store.profile.gradeE" class="grade-pill grade-e">{{ store.profile.gradeE }}E</span>
          <span v-if="store.profile?.schoolName" class="text-xs text-gray-500 ml-1">{{ store.profile.schoolName }}</span>
        </div>
      </div>

      <div class="countdown-card" @click="showCountdownPicker = true">
        <div class="flex items-center gap-3">
          <div class="icon-box"><el-icon><Calendar /></el-icon></div>
          <div>
            <p class="text-sm font-medium text-gray-900">距离 {{ countdownTarget }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ countdownDateStr }} · 点击切换</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-3xl font-semibold text-blue-600">{{ countdownDays }}</span>
          <span class="text-sm text-gray-500 ml-1">天</span>
        </div>
      </div>
    </div>

    <!-- 倒计时选择弹窗 -->
    <el-dialog v-model="showCountdownPicker" title="选择倒计时目标" width="420px" align-center>
      <div class="space-y-2">
        <div
          v-for="opt in countdownOptions"
          :key="opt.label"
          class="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-200 transition-all"
          @click="selectCountdown(opt)"
        >
          <span class="text-sm font-medium text-gray-700">{{ opt.label }}</span>
          <span class="text-xs text-gray-400">{{ opt.dateStr }}</span>
        </div>
      </div>
    </el-dialog>

    <div class="max-w-[1400px] mx-auto pb-10">
      <!-- 加载骨架 -->
      <div v-if="homeLoading" class="flex flex-col gap-4 animate-pulse">
        <div class="grid grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="bg-white rounded-2xl h-24 border border-gray-100"></div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl h-64 border border-gray-100 col-span-2"></div>
          <div class="bg-white rounded-2xl h-64 border border-gray-100"></div>
        </div>
      </div>

      <div v-show="!homeLoading">
      <!-- 数据概览卡片 -->
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="stat-card">
          <div class="icon-box"><el-icon><Document /></el-icon></div>
          <div>
            <p class="text-2xl font-bold text-gray-800 leading-tight">{{ examCount }}</p>
            <p class="text-xs text-gray-400 mt-0.5">完成考试</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon-box"><el-icon><School /></el-icon></div>
          <div>
            <p class="text-2xl font-bold text-gray-800 leading-tight">{{ schoolCount }}</p>
            <p class="text-xs text-gray-400 mt-0.5">推荐院校</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon-box"><el-icon><Warning /></el-icon></div>
          <div>
            <p class="text-2xl font-bold text-gray-800 leading-tight">{{ wrongCount }}</p>
            <p class="text-xs text-gray-400 mt-0.5">待攻克错题</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="icon-box"><el-icon><DataAnalysis /></el-icon></div>
          <div>
            <p class="text-2xl font-bold text-gray-800 leading-tight">{{ store.gradeTotal || 0 }}</p>
            <p class="text-xs text-gray-400 mt-0.5">学考科目</p>
          </div>
        </div>
      </div>

      <!-- 2 列主布局 -->
      <div class="grid grid-cols-3 gap-4">
        <!-- 左侧主内容 -->
        <div class="col-span-2 space-y-4">
          <!-- 我的院校 -->
          <section class="panel-card">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-1 h-5 rounded bg-blue-500"></span>
              <h3 class="text-base font-bold text-gray-800">目标院校</h3>
              <router-link to="/recommend" class="ml-auto text-xs text-gray-400 hover:text-primary-500">去选院校 →</router-link>
            </div>
            <div v-if="selectedSchools.length === 0" class="text-center py-6">
              <router-link to="/recommend" class="text-sm text-primary-500 hover:underline">去推荐页选择心仪院校 →</router-link>
            </div>
            <div v-else class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              <div
                v-for="s in selectedSchools"
                :key="s.id"
                class="flex-shrink-0 w-48 bg-gray-50 border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-blue-200 transition-all"
                @click="goSchool(s.id)"
              >
                <p class="text-sm font-semibold text-gray-800 line-clamp-2">{{ s.name }}</p>
                <p class="text-xs text-blue-500 mt-2">{{ s.region || '浙江' }}</p>
                <p v-if="s.gradeRequirements" class="text-xs text-orange-500 mt-1 font-semibold">{{ s.gradeRequirements }}</p>
              </div>
            </div>
          </section>

          <!-- 智能练题 -->
          <section class="panel-card">
            <div class="flex items-center gap-3 mb-5">
              <span class="w-1 h-5 rounded bg-orange-500"></span>
              <h3 class="text-base font-bold text-gray-800">智能练题</h3>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <router-link to="/exams" class="func-item">
                <div class="fi-icon fi-c1">模拟</div>
                <span class="fi-name">模拟考试</span>
              </router-link>
              <router-link to="/exam-real" class="func-item">
                <div class="fi-icon fi-c2">真题</div>
                <span class="fi-name">历年真题</span>
              </router-link>
              <router-link to="/practice" class="func-item">
                <div class="fi-icon fi-c3">练题</div>
                <span class="fi-name">考点练题</span>
              </router-link>
              <router-link to="/sprint" class="func-item">
                <div class="fi-icon fi-c4">冲刺</div>
                <span class="fi-name">学考冲刺</span>
              </router-link>
            </div>
          </section>

          <!-- 学习工具 -->
          <section class="panel-card">
            <div class="flex items-center gap-3 mb-5">
              <span class="w-1 h-5 rounded bg-red-500"></span>
              <h3 class="text-base font-bold text-gray-800">学习工具</h3>
            </div>
            <div class="grid grid-cols-4 gap-4">
              <router-link to="/analysis" class="func-item">
                <div class="fi-icon fi-c6">分析</div>
                <span class="fi-name">薄弱项分析</span>
              </router-link>
              <router-link to="/wrong-notes" class="func-item">
                <div class="fi-icon fi-c7">错题</div>
                <span class="fi-name">我的错题</span>
              </router-link>
              <router-link to="/recommend" class="func-item">
                <div class="fi-icon fi-c5">院校</div>
                <span class="fi-name">院校推荐</span>
              </router-link>
              <router-link to="/interview" class="func-item">
                <div class="fi-icon fi-c9">面试</div>
                <span class="fi-name">面试题库</span>
              </router-link>
              <router-link to="/mock-interview" class="func-item">
                <div class="fi-icon fi-c11">模面</div>
                <span class="fi-name">模拟面试</span>
              </router-link>
              <router-link to="/weekly-report" class="func-item">
                <div class="fi-icon fi-c10">周报</div>
                <span class="fi-name">学情周报</span>
              </router-link>
              <router-link to="/majors" class="func-item">
                <div class="fi-icon fi-c12">专业</div>
                <span class="fi-name">专业解析</span>
              </router-link>
              <router-link to="/profile" class="func-item">
                <div class="fi-icon fi-c8">我的</div>
                <span class="fi-name">我的信息</span>
              </router-link>
            </div>
          </section>

        </div>

        <!-- 右侧边栏 -->
        <div class="col-span-1 space-y-4">

          <!-- 每日打卡 -->
          <section class="panel-card">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-1 h-5 rounded bg-orange-500"></span>
              <h3 class="text-base font-bold text-gray-800">每日打卡</h3>
              <span class="ml-auto text-xs font-medium text-orange-500">{{ streak }} 天连续</span>
            </div>
            <div v-if="!showCheckinMonth" class="flex gap-1.5 mb-4">
              <div v-for="d in last7days" :key="d.date" class="flex-1 flex flex-col items-center gap-1.5">
                <div :class="['w-7 h-7 rounded-lg flex items-center justify-center text-xs', d.checked ? 'bg-orange-500 text-white font-bold' : 'bg-gray-100 text-gray-300']">{{ d.checked ? '✓' : '' }}</div>
                <span class="text-[10px] text-gray-400">{{ d.label }}</span>
              </div>
            </div>
            <div v-else class="mb-4">
              <div class="flex items-center justify-between mb-3">
                <button class="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" @click="changeCheckinMonth(-1)">‹</button>
                <span class="text-sm font-semibold text-gray-700">{{ checkinYear }}年{{ checkinMonth }}月</span>
                <button class="w-7 h-7 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" @click="changeCheckinMonth(1)">›</button>
              </div>
              <div class="grid grid-cols-7 text-center text-[10px] text-gray-400 mb-1">
                <span v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</span>
              </div>
              <div class="grid grid-cols-7 gap-1">
                <div
                  v-for="(cell, i) in checkinMonthCells"
                  :key="i"
                  :class="['h-8 rounded-lg flex items-center justify-center text-xs',
                    !cell.date ? 'text-transparent' :
                    cell.checked ? 'bg-orange-500 text-white font-bold' :
                    cell.isToday ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' :
                    'bg-gray-50 text-gray-400']"
                >
                  {{ cell.day || '' }}
                </div>
              </div>
            </div>
            <button
              v-if="!checkedToday"
              class="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
              @click="doCheckIn"
            >今日打卡</button>
            <div v-else class="text-center py-2.5 text-sm text-green-600 font-medium bg-green-50 rounded-xl">✓ 今日已打卡</div>
            <button class="w-full mt-2 text-xs text-gray-400 hover:text-orange-500" @click="showCheckinMonth = !showCheckinMonth">
              {{ showCheckinMonth ? '收起月历' : '展开月历' }}
            </button>
          </section>

          <!-- 成绩趋势 -->
          <section v-if="gradedSheets.length >= 2" class="panel-card">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-1 h-5 rounded bg-green-500"></span>
              <h3 class="text-base font-bold text-gray-800">成绩趋势</h3>
              <span class="ml-auto text-xs text-gray-400">近 {{ gradedSheets.length }} 次</span>
            </div>
            <svg class="w-full" height="72" :viewBox="`0 0 ${chartW} 72`" preserveAspectRatio="none">
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#22c55e" stop-opacity="0.2"/>
                  <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <polygon :points="chartFillPoints" fill="url(#scoreGrad)"/>
              <polyline :points="chartPoints" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle v-for="(pt, i) in chartDots" :key="i" :cx="pt.x" :cy="pt.y" r="3.5" fill="#22c55e" stroke="#fff" stroke-width="1.5"/>
            </svg>
            <div class="flex justify-between mt-2">
              <span class="text-xs text-gray-400">最低 {{ Math.min(...gradedSheets.map(s => s.totalScore)) }}</span>
              <span class="text-xs font-bold text-green-600">最新 {{ gradedSheets[gradedSheets.length - 1]?.totalScore }} 分</span>
            </div>
          </section>

          <!-- 最近考试 -->
          <section class="panel-card">
            <div class="flex items-center gap-3 mb-4">
              <span class="w-1 h-5 rounded bg-purple-500"></span>
              <h3 class="text-base font-bold text-gray-800">最近考试</h3>
              <router-link to="/exams" class="ml-auto text-xs text-gray-400 hover:text-primary-500">全部 →</router-link>
            </div>
            <div v-if="recentSheets.length === 0" class="text-center py-8">
              <p class="text-xs text-gray-400">暂无考试记录</p>
            </div>
            <div v-else class="divide-y divide-gray-50">
              <div
                v-for="s in recentSheets"
                :key="s.id"
                class="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-all"
                @click="goResult(s.id)"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span :class="['w-2 h-2 rounded-full flex-shrink-0', s.status === 'graded' ? 'bg-green-500' : 'bg-orange-400']"></span>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">{{ s.paperTitle || '模拟卷' }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ formatTime(s.createdAt) }}</p>
                  </div>
                </div>
                <div class="flex items-baseline gap-1 flex-shrink-0">
                  <span :class="['text-xl font-bold', s.status === 'graded' ? 'text-primary-500' : 'text-orange-400']">{{ s.totalScore ?? '待批' }}</span>
                  <span v-if="s.status === 'graded'" class="text-xs text-gray-400">分</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 完善信息提示 -->
          <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3" v-if="!store.isLoggedIn || store.gradeTotal === 0">
            <div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">!</div>
            <div>
              <p class="text-sm font-medium text-blue-800">完善你的信息</p>
              <p class="text-xs text-blue-600 mt-0.5">填写学考等级后可生成推荐结果</p>
              <router-link to="/profile" class="text-xs text-blue-700 font-medium mt-2 inline-block hover:underline">前往填写 →</router-link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentStore } from '@/stores/student'
import { Calendar, DataAnalysis, Document, School, User, Warning } from '@element-plus/icons-vue'
import http from '@/utils/api'

const router = useRouter()
const store = useStudentStore()
const recentSheets = ref<any[]>([])
const selectedSchools = ref<any[]>([])
const showCountdownPicker = ref(false)
const homeLoading = ref(true)
const examCount = ref(0)
const schoolCount = ref(0)
const wrongCount = ref(0)
const allSheets = ref<any[]>([])

// 打卡
const checkinDates = ref<string[]>([])
const showCheckinMonth = ref(false)
const checkinYear = ref(new Date().getFullYear())
const checkinMonth = ref(new Date().getMonth() + 1)
const checkedToday = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return checkinDates.value.includes(today)
})
const streak = computed(() => {
  const dates = [...checkinDates.value].sort().reverse()
  let count = 0
  const cur = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(cur)
    d.setDate(d.getDate() - i)
    const s = d.toISOString().slice(0, 10)
    if (dates.includes(s)) count++
    else if (i > 0) break
  }
  return count
})
const last7days = computed(() => {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().slice(0, 10)
    return { date, label: '周' + days[d.getDay()], checked: checkinDates.value.includes(date) }
  })
})
const checkinMonthCells = computed(() => {
  const firstDay = new Date(checkinYear.value, checkinMonth.value - 1, 1).getDay()
  const daysInMonth = new Date(checkinYear.value, checkinMonth.value, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)
  const cells: any[] = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: '', date: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${checkinYear.value}-${String(checkinMonth.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      day: d,
      date,
      checked: checkinDates.value.includes(date),
      isToday: date === today,
    })
  }
  return cells
})
function changeCheckinMonth(delta: number) {
  checkinMonth.value += delta
  if (checkinMonth.value > 12) {
    checkinMonth.value = 1
    checkinYear.value++
  }
  if (checkinMonth.value < 1) {
    checkinMonth.value = 12
    checkinYear.value--
  }
}
async function doCheckIn() {
  const today = new Date().toISOString().slice(0, 10)
  if (checkinDates.value.includes(today)) return
  checkinDates.value = [...checkinDates.value, today]
  localStorage.setItem('checkin_dates', JSON.stringify(checkinDates.value))
  // 同步到后端 study-plan
  if (store.studentId) {
    try {
      await http.post('/study-plan', {
        studentId: store.studentId,
        title: '每日打卡',
        date: today,
        type: 'task',
        completed: true,
      })
    } catch {}
  }
}
async function loadCheckin() {
  // 优先从后端加载打卡记录
  if (store.studentId) {
    try {
      const data: any = await http.get(`/study-plan/${store.studentId}/stats`, { params: { days: 60 } })
      if (data && Array.isArray(data.checkedDates)) {
        checkinDates.value = data.checkedDates
        localStorage.setItem('checkin_dates', JSON.stringify(checkinDates.value))
        return
      }
    } catch {}
  }
  // 兜底用 localStorage
  try {
    const s = localStorage.getItem('checkin_dates')
    checkinDates.value = s ? JSON.parse(s) : []
  } catch { checkinDates.value = [] }
}


// 成绩趋势图
const gradedSheets = computed(() =>
  allSheets.value.filter(s => s.status === 'graded' && s.totalScore != null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-8)
)
const chartW = 220
const chartPoints = computed(() => {
  const pts = gradedSheets.value
  if (pts.length < 2) return ''
  const scores = pts.map(s => Number(s.totalScore))
  const min = Math.min(...scores) - 5
  const max = Math.max(...scores) + 5
  const range = max - min || 1
  return pts.map((s, i) => {
    const x = (i / (pts.length - 1)) * (chartW - 8) + 4
    const y = 68 - ((Number(s.totalScore) - min) / range) * 60
    return `${x},${y}`
  }).join(' ')
})
const chartFillPoints = computed(() => {
  if (!chartPoints.value) return ''
  const pts = gradedSheets.value
  const first = `4,72`
  const last = `${(chartW - 4)},72`
  return `${first} ${chartPoints.value} ${last}`
})
const chartDots = computed(() => {
  const pts = gradedSheets.value
  if (pts.length < 2) return []
  const scores = pts.map(s => Number(s.totalScore))
  const min = Math.min(...scores) - 5
  const max = Math.max(...scores) + 5
  const range = max - min || 1
  return pts.map((s, i) => ({
    x: (i / (pts.length - 1)) * (chartW - 8) + 4,
    y: 68 - ((Number(s.totalScore) - min) / range) * 60
  }))
})

const countdownTarget = ref('三位一体报名')
const countdownDate = ref('')

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
  localStorage.setItem('countdown_target', opt.label)
  localStorage.setItem('countdown_date', opt.date)
  showCountdownPicker.value = false
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '上午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const todayStr = computed(() => {
  const d = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · ${weekdays[d.getDay()]}`
})

function loadSelectedSchools() {
  try {
    const saved = localStorage.getItem('selectedSchools')
    selectedSchools.value = saved ? JSON.parse(saved) : []
  } catch {
    selectedSchools.value = []
  }
}

function goSchool(id: number) {
  router.push(`/school/${id}`)
}

function goResult(id: number) {
  router.push(`/result/${id}`)
}

function formatTime(t: string) {
  if (!t) return ''
  return t.substring(0, 10)
}

onMounted(async () => {
  // 恢复倒计时设置
  const savedTarget = localStorage.getItem('countdown_target')
  const savedDate = localStorage.getItem('countdown_date')
  if (savedTarget && savedDate) {
    countdownTarget.value = savedTarget
    countdownDate.value = savedDate
  } else {
    const defaults = countdownOptions.value[0]
    countdownTarget.value = defaults.label
    countdownDate.value = defaults.date
  }

  loadSelectedSchools()

  loadCheckin()

  if (store.isLoggedIn) {
    try {
      const sheets: any = await http.get(`/exam/answer-sheets?studentId=${store.studentId}`)
      if (Array.isArray(sheets)) {
        allSheets.value = sheets
        recentSheets.value = sheets.slice(0, 4)
        examCount.value = sheets.length
      }
    } catch {}
    try {
      const rec: any = await http.get(`/recommend/student/${store.studentId}`)
      if (rec.success) schoolCount.value = rec.data?.length || 0
    } catch {}
    try {
      const ws: any = await http.get(`/exam/wrong-notes/${store.studentId}/stats`)
      wrongCount.value = ws.unmasteredCount || 0
    } catch {}
  }
  homeLoading.value = false
})
</script>

<style scoped>
.student-home {
  @apply -mx-8 -my-6 min-h-screen bg-slate-50 px-8 py-6;
}
.top-panel {
  @apply max-w-[1400px] mx-auto mb-5 bg-white border border-gray-100 rounded-2xl px-6 py-5 flex items-center justify-between;
}
.countdown-card {
  @apply w-[360px] border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-blue-200 transition-colors bg-gray-50;
}
.stat-card {
  @apply bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4;
}
.panel-card {
  @apply bg-white border border-gray-100 rounded-2xl p-6;
}
.icon-box {
  @apply w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl;
}
.grade-pill {
  @apply text-xs font-semibold px-2.5 py-1 rounded-full;
}
.grade-a {
  @apply bg-red-50 text-red-600;
}
.grade-b {
  @apply bg-orange-50 text-orange-600;
}
.grade-c {
  @apply bg-cyan-50 text-cyan-600;
}
.grade-d {
  @apply bg-gray-100 text-gray-600;
}
.grade-e {
  @apply bg-gray-100 text-gray-500;
}
.func-item {
  @apply flex flex-col items-center gap-2.5 cursor-pointer rounded-xl py-3 hover:bg-gray-50 transition-colors;
}
.fi-icon {
  @apply w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold text-white;
}
.fi-c1, .fi-c2, .fi-c3, .fi-c4, .fi-c5,
.fi-c6, .fi-c7, .fi-c8, .fi-c9, .fi-c10, .fi-c11, .fi-c12 { background: linear-gradient(135deg, #4f8ef7, #6db3f2); }
.fi-name {
  @apply text-xs font-medium text-gray-700;
}
</style>

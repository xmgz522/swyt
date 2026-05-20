<template>
  <div class="max-w-3xl mx-auto">
    <!-- 月份切换 + 打卡统计 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <el-button circle @click="changeMonth(-1)"><el-icon><ArrowLeft /></el-icon></el-button>
        <span class="text-xl font-bold">{{ year }}年{{ month }}月</span>
        <el-button circle @click="changeMonth(1)"><el-icon><ArrowRight /></el-icon></el-button>
      </div>
      <div class="flex gap-6 text-center">
        <div><div class="text-2xl font-bold text-indigo-500">{{ stats.streak }}</div><div class="text-xs text-gray-400">连续打卡</div></div>
        <div><div class="text-2xl font-bold text-green-500">{{ stats.completed }}</div><div class="text-xs text-gray-400">已完成</div></div>
        <div><div class="text-2xl font-bold text-gray-400">{{ stats.total }}</div><div class="text-xs text-gray-400">总任务</div></div>
      </div>
    </div>

    <!-- 每日任务管理 -->
    <el-card class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="font-bold">每日任务</span>
            <span class="text-xs text-gray-400">设置后每天自动出现</span>
          </div>
          <el-button type="primary" size="small" @click="showAddDaily = true">+ 添加每日任务</el-button>
        </div>
      </template>
      <el-empty v-if="dailyTasks.length === 0" description="暂无每日任务，添加后每天自动出现" :image-size="48" />
      <div v-for="dt in dailyTasks" :key="dt.id" class="flex items-center gap-3 py-2.5 border-b last:border-b-0">
        <div class="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"></div>
        <div class="flex-1">
          <span class="font-medium text-sm">{{ dt.title }}</span>
          <span v-if="dt.description" class="text-xs text-gray-400 ml-2">{{ dt.description }}</span>
        </div>
        <el-switch v-model="dt.active" size="small" @change="(v: any) => toggleDailyActive(dt, v)" />
        <el-button size="small" type="danger" link @click="deleteDailyTask(dt.id)">删除</el-button>
      </div>
    </el-card>

    <!-- 日历 -->
    <el-card class="mb-6">
      <div class="grid grid-cols-7 text-center text-sm text-gray-400 mb-2">
        <span v-for="d in ['日','一','二','三','四','五','六']" :key="d">{{ d }}</span>
      </div>
      <div class="grid grid-cols-7 text-center">
        <div v-for="(cell, i) in calendarCells" :key="i"
          class="py-2 cursor-pointer rounded-lg transition-colors"
          :class="{
            'bg-indigo-500 text-white': cell.isToday,
            'ring-2 ring-indigo-400': cell.date === selectedDate && !cell.isToday,
            'hover:bg-gray-100': cell.date && !cell.isToday,
          }"
          @click="cell.date && selectDate(cell.date)"
        >
          <div class="text-sm">{{ cell.day || '' }}</div>
          <div v-if="cell.hasTask" class="w-1.5 h-1.5 rounded-full mx-auto mt-1" :class="cell.checked ? 'bg-green-400' : 'bg-orange-400'"></div>
        </div>
      </div>
    </el-card>

    <!-- 当天任务 -->
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-bold">{{ selectedDate }} 的任务</span>
          <el-button type="primary" size="small" @click="showAdd = true">+ 添加任务</el-button>
        </div>
      </template>
      <el-empty v-if="dayTasks.length === 0" description="当天暂无任务" :image-size="64" />
      <div v-for="t in dayTasks" :key="t.id" class="flex items-start gap-3 py-3 border-b last:border-b-0">
        <el-checkbox :model-value="t.completed" @change="(v: any) => toggleTask(t, v)" />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span :class="['font-medium', t.completed ? 'line-through text-gray-300' : '']">{{ t.title }}</span>
            <el-tag v-if="t.type === 'daily'" size="small" type="info" round>每日</el-tag>
          </div>
          <div v-if="t.description" class="text-xs text-gray-400 mt-1">{{ t.description }}</div>
        </div>
        <el-button v-if="t.type !== 'daily'" size="small" type="danger" link @click="deleteTask(t.id)">删除</el-button>
      </div>
    </el-card>

    <!-- 添加普通任务弹窗 -->
    <el-dialog v-model="showAdd" title="添加任务" width="420px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="任务标题" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" placeholder="选填" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" :loading="addingTask" @click="addTask">确认</el-button>
      </template>
    </el-dialog>

    <!-- 添加每日任务弹窗 -->
    <el-dialog v-model="showAddDaily" title="添加每日任务" width="420px">
      <p class="text-xs text-gray-400 mb-4">每日任务会在每天自动出现，无需重复添加</p>
      <el-form :model="dailyForm" label-width="70px">
        <el-form-item label="标题"><el-input v-model="dailyForm.title" placeholder="如：背20个单词" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="dailyForm.description" type="textarea" :rows="2" placeholder="选填" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDaily = false">取消</el-button>
        <el-button type="primary" :loading="addingDaily" @click="addDailyTask">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const store = useStudentStore()

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const monthPlans = ref<any[]>([])
const dayTasks = ref<any[]>([])
const stats = ref({ streak: 0, completed: 0, total: 0 })
const showAdd = ref(false)
const form = ref({ title: '', description: '' })

// 每日任务
const dailyTasks = ref<any[]>([])
const showAddDaily = ref(false)
const dailyForm = ref({ title: '', description: '' })
const addingTask = ref(false)
const addingDaily = ref(false)

const calendarCells = computed(() => {
  const firstDay = new Date(year.value, month.value - 1, 1).getDay()
  const daysInMonth = new Date(year.value, month.value, 0).getDate()
  const today = new Date().toISOString().slice(0, 10)
  const cells: any[] = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: '', date: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const tasksForDay = monthPlans.value.filter((p: any) => p.date === dateStr)
    cells.push({
      day: d, date: dateStr, isToday: dateStr === today,
      hasTask: tasksForDay.length > 0,
      checked: tasksForDay.length > 0 && tasksForDay.every((t: any) => t.completed),
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
}

async function loadMonth() {
  if (!store.studentId) return
  try {
    const data: any = await http.get(`/study-plan/${store.studentId}/month`, { params: { year: year.value, month: month.value } })
    monthPlans.value = Array.isArray(data) ? data : []
  } catch {}
}

async function loadDay() {
  if (!store.studentId) return
  try {
    const data: any = await http.get(`/study-plan/${store.studentId}/date`, { params: { date: selectedDate.value } })
    dayTasks.value = Array.isArray(data) ? data : []
  } catch {}
}

async function loadStats() {
  if (!store.studentId) return
  try {
    const data: any = await http.get(`/study-plan/${store.studentId}/stats`, { params: { days: 30 } })
    if (data) stats.value = data
  } catch {}
}

async function toggleTask(task: any, val: boolean) {
  task.completed = val
  if (task.type === 'daily' && task.dailyTaskId) {
    try {
      await http.put(`/study-plan/daily-tasks/${task.dailyTaskId}/toggle`, {
        studentId: store.studentId,
        date: selectedDate.value,
        completed: val,
      })
    } catch {}
  } else {
    try { await http.put(`/study-plan/${task.id}/toggle`, { completed: val }) } catch {}
  }
  loadMonth(); loadStats()
}

async function deleteTask(id: number) {
  try {
    await ElMessageBox.confirm('确定删除这个任务吗？', '提示', { type: 'warning' })
  } catch { return }
  try { await http.delete(`/study-plan/${id}`) } catch {}
  ElMessage.success('已删除')
  loadDay(); loadMonth()
}

async function addTask() {
  if (!form.value.title.trim()) { ElMessage.warning('请输入标题'); return }
  if (!store.studentId) { ElMessage.warning('请先登录'); return }
  addingTask.value = true
  try {
    await http.post('/study-plan', {
      studentId: store.studentId,
      title: form.value.title,
      description: form.value.description,
      date: selectedDate.value,
      type: 'task',
    })
    form.value = { title: '', description: '' }
    showAdd.value = false
    ElMessage.success('任务已添加')
    loadDay(); loadMonth(); loadStats()
  } catch {}
  addingTask.value = false
}

// ===== 每日任务 =====

async function loadDailyTasks() {
  if (!store.studentId) return
  try {
    const data: any = await http.get(`/study-plan/daily-tasks/${store.studentId}`)
    dailyTasks.value = Array.isArray(data) ? data : []
  } catch {}
}

async function addDailyTask() {
  if (!dailyForm.value.title.trim()) { ElMessage.warning('请输入标题'); return }
  if (!store.studentId) { ElMessage.warning('请先登录'); return }
  addingDaily.value = true
  try {
    await http.post('/study-plan/daily-tasks', {
      studentId: store.studentId,
      title: dailyForm.value.title,
      description: dailyForm.value.description,
    })
    dailyForm.value = { title: '', description: '' }
    showAddDaily.value = false
    ElMessage.success('已添加每日任务')
    loadDailyTasks(); loadMonth(); loadDay()
  } catch {}
  addingDaily.value = false
}

async function toggleDailyActive(dt: any, val: boolean) {
  try { await http.put(`/study-plan/daily-tasks/${dt.id}`, { active: val }) } catch {}
  loadMonth(); loadDay()
}

async function deleteDailyTask(id: number) {
  try {
    await ElMessageBox.confirm('删除后每天将不再自动显示该任务', '删除每日任务', { type: 'warning' })
  } catch { return }
  try { await http.delete(`/study-plan/daily-tasks/${id}`) } catch {}
  ElMessage.success('已删除')
  loadDailyTasks(); loadMonth(); loadDay()
}

onMounted(() => { loadMonth(); loadDay(); loadStats(); loadDailyTasks() })
</script>

<template>
  <div class="max-w-5xl mx-auto py-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">学情周报</h1>
        <p class="text-sm text-gray-500 mt-1">每周学习数据汇总与分析</p>
      </div>
      <el-select v-if="reportList.length > 1" v-model="selectedId" placeholder="选择周报" style="width: 260px;" @change="onSelect">
        <el-option
          v-for="r in reportList"
          :key="r.id"
          :label="`${r.weekStart} ~ ${r.weekEnd}`"
          :value="r.id"
        />
      </el-select>
    </div>

    <div v-if="loading" class="text-center py-20 text-gray-400">加载中...</div>
    <div v-else-if="!report" class="text-center py-20">
      <p class="text-5xl mb-4">📊</p>
      <p class="text-gray-400">暂无周报数据</p>
      <p class="text-sm text-gray-300 mt-2">系统每周一自动生成学情周报</p>
    </div>

    <div v-else>
      <!-- 周期 Banner -->
      <div class="banner mb-6">
        <div>
          <p class="text-lg font-bold text-white">📊 学情周报</p>
          <p class="text-sm text-white/80 mt-1">{{ report.weekStart }} ~ {{ report.weekEnd }}</p>
        </div>
      </div>

      <!-- 核心指标 -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <p class="text-2xl font-bold text-blue-600">{{ report.totalQuestions }}</p>
          <p class="text-xs text-gray-500 mt-1">做题总数</p>
          <p v-if="compare" :class="['text-xs mt-1 font-medium', compare.questionsChange >= 0 ? 'text-green-500' : 'text-red-500']">
            {{ compare.questionsChange >= 0 ? '↑' : '↓' }}{{ Math.abs(compare.questionsChange) }} 较上周
          </p>
        </div>
        <div class="stat-card">
          <p class="text-2xl font-bold text-green-600">{{ report.accuracy }}%</p>
          <p class="text-xs text-gray-500 mt-1">正确率</p>
          <p v-if="compare" :class="['text-xs mt-1 font-medium', compare.accuracyChange >= 0 ? 'text-green-500' : 'text-red-500']">
            {{ compare.accuracyChange >= 0 ? '↑' : '↓' }}{{ Math.abs(compare.accuracyChange) }}%
          </p>
        </div>
        <div class="stat-card">
          <p class="text-2xl font-bold text-orange-500">{{ report.checkinDays }}</p>
          <p class="text-xs text-gray-500 mt-1">打卡天数</p>
          <p v-if="compare" :class="['text-xs mt-1 font-medium', compare.checkinChange >= 0 ? 'text-green-500' : 'text-red-500']">
            {{ compare.checkinChange >= 0 ? '↑' : '↓' }}{{ Math.abs(compare.checkinChange) }} 天
          </p>
        </div>
        <div class="stat-card">
          <p class="text-2xl font-bold text-purple-600">{{ report.examCount }}</p>
          <p class="text-xs text-gray-500 mt-1">完成试卷</p>
          <p v-if="report.avgExamScore > 0" class="text-xs mt-1 text-gray-400">均分 {{ report.avgExamScore }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- 任务完成 -->
        <div class="panel-card">
          <h3 class="text-sm font-bold text-gray-800 mb-3">📋 任务完成</h3>
          <div class="flex items-center gap-3">
            <el-progress :percentage="taskRate" :stroke-width="18" :format="() => `${report.completedTasks}/${report.totalTasks}`" class="flex-1" />
          </div>
        </div>
        <!-- 错题动态 -->
        <div class="panel-card">
          <h3 class="text-sm font-bold text-gray-800 mb-3">❌ 错题动态</h3>
          <div class="flex gap-6">
            <div class="text-center">
              <p class="text-xl font-bold text-red-500">+{{ report.newWrongCount }}</p>
              <p class="text-xs text-gray-400">新增错题</p>
            </div>
            <div class="text-center">
              <p class="text-xl font-bold text-green-500">{{ report.masteredCount }}</p>
              <p class="text-xs text-gray-400">已掌握</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <!-- 薄弱知识点 -->
        <div v-if="weakPoints.length > 0" class="panel-card">
          <h3 class="text-sm font-bold text-gray-800 mb-3">⚠️ 薄弱知识点</h3>
          <div class="space-y-2.5">
            <div v-for="(w, idx) in weakPoints" :key="idx" class="flex items-center gap-2">
              <span :class="['w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0',
                idx < 3 ? 'bg-red-500' : idx < 5 ? 'bg-orange-400' : 'bg-gray-300']">{{ idx + 1 }}</span>
              <span class="text-sm text-gray-700 w-28 truncate flex-shrink-0">{{ w.point }}</span>
              <el-progress :percentage="w.rate" :stroke-width="10" :show-text="false" class="flex-1" status="exception" />
              <span class="text-xs text-gray-400 w-16 text-right flex-shrink-0">错{{ w.wrongCount }}/{{ w.total }}</span>
            </div>
          </div>
        </div>

        <!-- 各科正确率 -->
        <div v-if="Object.keys(subjectStats).length > 0" class="panel-card">
          <h3 class="text-sm font-bold text-gray-800 mb-3">📚 各科表现</h3>
          <div class="space-y-2.5">
            <div v-for="(v, k) in subjectStats" :key="k" class="flex items-center gap-2">
              <span class="text-sm text-gray-700 w-20 flex-shrink-0">{{ k }}</span>
              <el-progress :percentage="v.rate" :stroke-width="10" :show-text="false" class="flex-1" status="success" />
              <span class="text-xs font-semibold text-green-600 w-12 text-right">{{ v.rate }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 文字总结 -->
      <div v-if="report.summary" class="panel-card bg-blue-50 border-blue-100 mb-6">
        <h3 class="text-sm font-bold text-blue-700 mb-2">📝 本周总结</h3>
        <p class="text-sm text-gray-700 leading-relaxed">{{ report.summary }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import http from '@/utils/api'

const loading = ref(true)
const report = ref<any>(null)
const reportList = ref<any[]>([])
const selectedId = ref<number | ''>('')

const weakPoints = computed(() => {
  if (!report.value?.weakPoints) return []
  try { return JSON.parse(report.value.weakPoints) } catch { return [] }
})

const subjectStats = computed(() => {
  if (!report.value?.subjectStats) return {}
  try { return JSON.parse(report.value.subjectStats) } catch { return {} }
})

const compare = computed(() => {
  if (!report.value?.lastWeekCompare) return null
  try { return JSON.parse(report.value.lastWeekCompare) } catch { return null }
})

const taskRate = computed(() => {
  if (!report.value || report.value.totalTasks === 0) return 0
  return +((report.value.completedTasks / report.value.totalTasks) * 100).toFixed(0)
})

onMounted(async () => {
  const sid = localStorage.getItem('studentId')
  if (!sid) { loading.value = false; return }
  try {
    const [latest, list]: any = await Promise.all([
      http.get(`/report/weekly/student/${sid}/latest`),
      http.get(`/report/weekly/student/${sid}`),
    ])
    report.value = latest || null
    reportList.value = Array.isArray(list) ? list : []
    if (report.value) selectedId.value = report.value.id
  } catch {}
  loading.value = false
})

function onSelect(id: number) {
  const found = reportList.value.find(r => r.id === id)
  if (found) report.value = found
}
</script>

<style scoped>
.banner {
  @apply bg-gradient-to-r from-blue-500 to-blue-400 rounded-xl px-6 py-5;
}
.stat-card {
  @apply bg-white rounded-xl border border-gray-100 p-4 text-center;
}
.panel-card {
  @apply bg-white rounded-xl border border-gray-100 p-5;
}
</style>

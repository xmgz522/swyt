<template>
  <div class="dashboard" v-loading="loading">
    <el-row :gutter="16" class="stat-row">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-blue">
          <div class="stat-icon"><el-icon :size="28"><User /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.students }}</div>
            <div class="stat-label">学生总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-green">
          <div class="stat-icon"><el-icon :size="28"><School /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.schools }}</div>
            <div class="stat-label">院校数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-orange">
          <div class="stat-icon"><el-icon :size="28"><Document /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.papers }}</div>
            <div class="stat-label">试卷数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-red">
          <div class="stat-icon"><el-icon :size="28"><Edit /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.pendingGrade }}</div>
            <div class="stat-label">待批改</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-purple">
          <div class="stat-icon"><el-icon :size="28"><Finished /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.completedExams }}</div>
            <div class="stat-label">已完成考试</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card stat-pink">
          <div class="stat-icon"><el-icon :size="28"><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.wrongNotes }}</div>
            <div class="stat-label">题目总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表行 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight: bold;">学考等级分布</span></template>
          <v-chart :option="gradeChartOption" style="height: 280px;" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight: bold;">成绩分布</span></template>
          <v-chart v-if="scoreChartOption" :option="scoreChartOption" style="height: 280px;" autoresize />
          <div v-else class="empty-tip">暂无成绩数据</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 本周学情 -->
    <el-row :gutter="20" style="margin-top: 20px;" v-if="weeklyStats">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold;">📊 本周学情概览</span>
              <el-button size="small" text type="primary" @click="$router.push('/weekly-report')">查看详情 →</el-button>
            </div>
          </template>
          <div style="display: flex; gap: 40px; padding: 8px 0;">
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #1890ff;">{{ weeklyStats.count }}</div>
              <div style="font-size: 13px; color: #999; margin-top: 4px;">已生成周报</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #52c41a;">{{ weeklyStats.avgAccuracy }}%</div>
              <div style="font-size: 13px; color: #999; margin-top: 4px;">平均正确率</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #fa8c16;">{{ weeklyStats.avgQuestions }}</div>
              <div style="font-size: 13px; color: #999; margin-top: 4px;">平均做题量</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #722ed1;">{{ weeklyStats.weekStart }}</div>
              <div style="font-size: 13px; color: #999; margin-top: 4px;">统计周期起始</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight: bold;">最近学生</span></template>
          <el-table :data="recentStudents" stripe size="small">
            <el-table-column prop="name" label="姓名" width="80" />
            <el-table-column label="学考等级" width="120">
              <template #default="{ row }">
                <el-tag size="small" type="danger" v-if="row.gradeA">{{ row.gradeA }}A</el-tag>
                <el-tag size="small" type="warning" v-if="row.gradeB">{{ row.gradeB }}B</el-tag>
                <el-tag size="small" v-if="row.gradeC">{{ row.gradeC }}C</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="schoolName" label="学校" />
            <el-table-column prop="createdAt" label="注册时间" width="100">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <div v-if="recentStudents.length === 0" class="empty-tip">暂无学生数据</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight: bold;">待批改答卷</span></template>
          <el-table :data="pendingSheets" stripe size="small">
            <el-table-column prop="studentName" label="学生" width="80" />
            <el-table-column prop="paperTitle" label="试卷" />
            <el-table-column prop="objectiveScore" label="客观题分" width="90" />
            <el-table-column prop="createdAt" label="提交时间" width="100">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <div v-if="pendingSheets.length === 0" class="empty-tip">暂无待批改答卷</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import api from '../api'

use([CanvasRenderer, PieChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const stats = ref({ students: 0, schools: 0, papers: 0, pendingGrade: 0, completedExams: 0, wrongNotes: 0 })
const recentStudents = ref([])
const pendingSheets = ref([])
const weeklyStats = ref<any>(null)
const gradeDistribution = ref({ A: 0, B: 0, C: 0, D: 0, E: 0 })
const loading = ref(true)
const scoreRanges = ref<number[]>([])

function formatDate(d: string) {
  if (!d) return ''
  return d.substring(0, 10)
}

const gradeChartOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { bottom: 0 },
  color: ['#f5222d', '#fa8c16', '#1890ff', '#8c8c8c', '#bfbfbf'],
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{b}\n{c}门' },
    data: [
      { name: 'A等第', value: gradeDistribution.value.A },
      { name: 'B等第', value: gradeDistribution.value.B },
      { name: 'C等第', value: gradeDistribution.value.C },
      { name: 'D等第', value: gradeDistribution.value.D },
      { name: 'E等第', value: gradeDistribution.value.E },
    ],
  }],
}))

const scoreChartOption = computed(() => {
  if (scoreRanges.value.every(v => v === 0)) return null
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: ['0-20', '21-40', '41-60', '61-80', '81-100'] },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      type: 'bar',
      data: scoreRanges.value,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] },
      },
    }],
  }
})

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get('/dashboard/stats')
    stats.value.students = data.students || 0
    stats.value.schools = data.schools || 0
    stats.value.papers = data.papers || 0
    stats.value.pendingGrade = data.pendingGrade || 0
    stats.value.completedExams = data.completedExams || 0
    stats.value.wrongNotes = data.questions || 0
    gradeDistribution.value = data.gradeDistribution || { A: 0, B: 0, C: 0, D: 0, E: 0 }
    scoreRanges.value = data.scoreRanges || [0, 0, 0, 0, 0]
    recentStudents.value = data.recentStudents || []
    pendingSheets.value = (data.pendingSheetList || []).map((s: any) => ({
      ...s,
      studentName: `学生#${s.studentId}`,
      paperTitle: `试卷#${s.paperId}`,
    }))
  } catch (e) {
    console.error('Dashboard load error', e)
  }
  // 加载周报概览
  try {
    const { data: weeklyList } = await api.get('/report/weekly/all')
    if (Array.isArray(weeklyList) && weeklyList.length > 0) {
      const latest = weeklyList[0]
      weeklyStats.value = {
        count: latest.count,
        avgAccuracy: (+latest.avgAccuracy).toFixed(1),
        avgQuestions: (+latest.avgQuestions).toFixed(0),
        weekStart: latest.weekStart,
      }
    }
  } catch {}
  loading.value = false
})
</script>

<style scoped>
.stat-row .el-col { margin-bottom: 0; }
.stat-card { border-radius: 12px; }
.stat-card :deep(.el-card__body) { display: flex; align-items: center; gap: 16px; padding: 24px; }
.stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
.stat-blue .stat-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-green .stat-icon { background: linear-gradient(135deg, #43e97b, #38f9d7); }
.stat-orange .stat-icon { background: linear-gradient(135deg, #fa709a, #fee140); }
.stat-red .stat-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-purple .stat-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-pink .stat-icon { background: linear-gradient(135deg, #eb2f96, #ff85c0); }
.stat-num { font-size: 28px; font-weight: bold; color: #333; line-height: 1; }
.stat-label { font-size: 13px; color: #999; margin-top: 4px; }
.empty-tip { text-align: center; padding: 24px; color: #ccc; font-size: 13px; }
</style>

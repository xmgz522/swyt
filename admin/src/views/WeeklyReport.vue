<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px;">学情周报</span>
          <div style="display: flex; gap: 10px;">
            <el-button type="primary" @click="generate" :loading="generating">生成本周周报</el-button>
          </div>
        </div>
      </template>

      <!-- 周汇总列表 -->
      <el-table :data="weekList" stripe v-loading="loading">
        <el-table-column prop="weekStart" label="周起始" width="120" />
        <el-table-column prop="weekEnd" label="周结束" width="120" />
        <el-table-column label="学生数" width="80">
          <template #default="{ row }">{{ row.count }}</template>
        </el-table-column>
        <el-table-column label="平均正确率" width="110">
          <template #default="{ row }">
            <span style="font-weight: 600; color: #52c41a;">{{ (+row.avgAccuracy).toFixed(1) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="平均做题量" width="110">
          <template #default="{ row }">{{ (+row.avgQuestions).toFixed(0) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button size="small" @click="viewWeek(row.weekStart)">查看详情</el-button>
              <el-button size="small" type="warning" @click="notify(row.weekStart)" :loading="notifying">推送通知</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 某周学生详情弹窗 -->
    <el-dialog v-model="showDetail" :title="`周报详情 (${detailWeek})`" width="900px">
      <el-table :data="detailList" stripe>
        <el-table-column label="学生" width="120">
          <template #default="{ row }">{{ row.studentName || `学生${row.studentId}` }}</template>
        </el-table-column>
        <el-table-column prop="totalQuestions" label="做题数" width="80" />
        <el-table-column label="正确率" width="90">
          <template #default="{ row }">
            <span :style="{ color: row.accuracy >= 60 ? '#52c41a' : '#f5222d', fontWeight: 'bold' }">{{ row.accuracy }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="examCount" label="试卷数" width="80" />
        <el-table-column label="平均分" width="80">
          <template #default="{ row }">{{ row.avgExamScore || '-' }}</template>
        </el-table-column>
        <el-table-column prop="checkinDays" label="打卡天" width="80" />
        <el-table-column label="任务" width="90">
          <template #default="{ row }">{{ row.completedTasks }}/{{ row.totalTasks }}</template>
        </el-table-column>
        <el-table-column prop="newWrongCount" label="新错题" width="80" />
        <el-table-column prop="masteredCount" label="已掌握" width="80" />
        <el-table-column label="通知" width="70">
          <template #default="{ row }">
            <el-tag :type="row.notified ? 'success' : 'info'" size="small">{{ row.notified ? '已推' : '未推' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const weekList = ref<any[]>([])
const loading = ref(false)
const generating = ref(false)
const notifying = ref(false)
const showDetail = ref(false)
const detailWeek = ref('')
const detailList = ref<any[]>([])

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/report/weekly/all')
    weekList.value = Array.isArray(data) ? data : []
  } catch { weekList.value = [] }
  loading.value = false
}

async function generate() {
  generating.value = true
  try {
    const { data } = await api.post('/report/weekly/generate')
    ElMessage.success(`已生成 ${data.generated} 份周报`)
    load()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '生成失败')
  }
  generating.value = false
}

async function viewWeek(weekStart: string) {
  detailWeek.value = weekStart
  try {
    const { data } = await api.get(`/report/weekly/week?weekStart=${weekStart}`)
    detailList.value = Array.isArray(data) ? data : []
    showDetail.value = true
  } catch {
    ElMessage.error('加载失败')
  }
}

async function notify(weekStart: string) {
  notifying.value = true
  try {
    const { data } = await api.post(`/report/weekly/notify?weekStart=${weekStart}`)
    ElMessage.success(`已推送 ${data.notified} 条通知`)
    load()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '推送失败')
  }
  notifying.value = false
}
</script>

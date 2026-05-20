<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px;">模拟面试管理</span>
          <div style="display: flex; gap: 10px;">
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px;" @change="load">
              <el-option label="待评分" value="submitted" />
              <el-option label="已评分" value="graded" />
              <el-option label="答题中" value="pending" />
            </el-select>
            <el-badge :value="pendingCount" :hidden="pendingCount === 0">
              <el-button type="warning" @click="filterStatus = 'submitted'; load()">待评分</el-button>
            </el-badge>
          </div>
        </div>
      </template>

      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="studentId" label="学生ID" width="80" />
        <el-table-column prop="schoolName" label="学校" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总分" width="80">
          <template #default="{ row }">
            <span v-if="row.status === 'graded'" style="font-weight: bold; color: #722ed1;">{{ row.totalScore }}</span>
            <span v-else style="color: #ccc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            {{ row.createdAt?.substring(0, 16).replace('T', ' ') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button v-if="row.status === 'submitted'" type="primary" size="small" @click="openGrade(row)">评分</el-button>
              <el-button size="small" @click="openDetail(row)">查看</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 评分弹窗 -->
    <el-dialog v-model="showGrade" title="面试评分" width="640px" :close-on-click-modal="false">
      <div v-if="currentMock" style="margin-bottom: 20px;">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="学生ID">{{ currentMock.studentId }}</el-descriptions-item>
          <el-descriptions-item label="学校">{{ currentMock.schoolName }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form label-width="100px" label-position="left">
        <el-form-item v-for="dim in dimensions" :key="dim.key" :label="dim.label">
          <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
            <el-slider v-model="gradeForm[dim.key]" :min="0" :max="10" :step="0.5" style="flex: 1;" show-input :show-input-controls="false" />
          </div>
        </el-form-item>
        <el-form-item label="老师评语">
          <el-input v-model="gradeForm.feedback" type="textarea" :rows="4" placeholder="请输入对学生的面试评语和改进建议..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showGrade = false">取消</el-button>
        <el-button type="primary" @click="submitGrade" :loading="grading">提交评分</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetail" title="面试详情" width="700px">
      <div v-if="detailData">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="学生ID">{{ detailData.studentId }}</el-descriptions-item>
          <el-descriptions-item label="学校">{{ detailData.schoolName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType[detailData.status]" size="small">{{ statusMap[detailData.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总分" v-if="detailData.status === 'graded'">
            <span style="font-weight: bold; color: #722ed1;">{{ detailData.totalScore }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 评分维度 -->
        <div v-if="detailData.status === 'graded'" style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px;">评分维度</h4>
          <div v-for="dim in dimensions" :key="dim.key" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="width: 80px; font-size: 13px; color: #666;">{{ dim.label }}</span>
            <el-progress :percentage="(detailData[dim.key] || 0) * 10" :stroke-width="14" :format="() => detailData[dim.key]" style="flex: 1;" />
          </div>
          <div v-if="detailData.feedback" style="margin-top: 12px; background: #f9f0ff; padding: 12px; border-radius: 8px;">
            <strong style="color: #722ed1;">老师评语：</strong>
            <p style="margin: 6px 0 0; color: #444; white-space: pre-wrap;">{{ detailData.feedback }}</p>
          </div>
        </div>

        <!-- 问答内容 -->
        <h4 style="margin: 0 0 8px;">问答详情</h4>
        <el-collapse>
          <el-collapse-item v-for="(q, idx) in detailData.questions" :key="q.id" :title="`第${idx + 1}题: ${q.question.substring(0, 40)}...`">
            <div style="margin-bottom: 8px;">
              <strong>题目：</strong>{{ q.question }}
            </div>
            <div style="background: #f0ebff; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
              <strong style="color: #722ed1;">学生回答：</strong>
              <p style="margin: 4px 0 0; white-space: pre-wrap;">{{ q.studentAnswer || '未作答' }}</p>
            </div>
            <div style="background: #f6f8ff; padding: 10px; border-radius: 6px;">
              <strong style="color: #1890ff;">参考答案：</strong>
              <p style="margin: 4px 0 0; white-space: pre-wrap;">{{ q.referenceAnswer }}</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const statusMap: Record<string, string> = { pending: '答题中', submitted: '待评分', graded: '已评分' }
const statusType: Record<string, string> = { pending: 'warning', submitted: 'primary', graded: 'success' }
const dimensions = [
  { key: 'scoreLogic', label: '逻辑表达' },
  { key: 'scoreKnowledge', label: '知识面' },
  { key: 'scoreQuality', label: '综合素质' },
  { key: 'scoreExpression', label: '语言表达' },
  { key: 'scoreAdaptability', label: '应变能力' },
]

const list = ref<any[]>([])
const loading = ref(false)
const filterStatus = ref('submitted')
const pendingCount = ref(0)

const showGrade = ref(false)
const grading = ref(false)
const currentMock = ref<any>(null)
const gradeForm = ref<any>({
  scoreLogic: 5,
  scoreKnowledge: 5,
  scoreQuality: 5,
  scoreExpression: 5,
  scoreAdaptability: 5,
  feedback: '',
})

const showDetail = ref(false)
const detailData = ref<any>(null)

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filterStatus.value) params.set('status', filterStatus.value)
    const { data } = await api.get(`/interview/mock/all?${params.toString()}`)
    list.value = Array.isArray(data) ? data : []
    // 获取待评分数量
    const { data: pending } = await api.get('/interview/mock/all?status=submitted')
    pendingCount.value = Array.isArray(pending) ? pending.length : 0
  } catch {
    list.value = []
  }
  loading.value = false
}

async function openGrade(row: any) {
  currentMock.value = row
  gradeForm.value = {
    scoreLogic: 5,
    scoreKnowledge: 5,
    scoreQuality: 5,
    scoreExpression: 5,
    scoreAdaptability: 5,
    feedback: '',
  }
  // 加载详情以便评分时参考
  try {
    const { data } = await api.get(`/interview/mock/detail/${row.id}`)
    detailData.value = data
  } catch {}
  showGrade.value = true
}

async function submitGrade() {
  if (!currentMock.value) return
  grading.value = true
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    await api.post(`/interview/mock/${currentMock.value.id}/grade`, {
      ...gradeForm.value,
      gradedBy: user.id || 0,
    })
    ElMessage.success('评分已提交')
    showGrade.value = false
    load()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '评分失败')
  }
  grading.value = false
}

async function openDetail(row: any) {
  try {
    const { data } = await api.get(`/interview/mock/detail/${row.id}`)
    detailData.value = data
    showDetail.value = true
  } catch {
    ElMessage.error('加载失败')
  }
}
</script>

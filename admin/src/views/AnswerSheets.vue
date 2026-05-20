<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: bold; font-size: 16px;">答卷记录</span>
            <el-tag size="small" type="info">共 {{ sheets.length }} 份</el-tag>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 140px;" @change="loadData">
              <el-option label="自动批改" value="auto_graded" />
              <el-option label="已完成" value="graded" />
              <el-option label="进行中" value="in_progress" />
            </el-select>
            <el-select v-model="filterStudent" placeholder="筛选学生" clearable filterable style="width: 160px;" @change="loadData">
              <el-option v-for="s in students" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </div>
        </div>
      </template>

      <el-empty v-if="sheets.length === 0" description="暂无答卷记录" />
      <el-table v-else :data="sheets" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="学生" width="100">
          <template #default="{ row }">{{ studentMap[row.studentId] || `#${row.studentId}` }}</template>
        </el-table-column>
        <el-table-column label="试卷" min-width="180">
          <template #default="{ row }">
            <span style="font-weight: 600;">{{ paperMap[row.paperId]?.title || `#${row.paperId}` }}</span>
            <el-tag v-if="paperMap[row.paperId]?.type === 'real'" size="small" type="danger" style="margin-left: 6px;">真题</el-tag>
            <el-tag v-else-if="paperMap[row.paperId]" size="small" style="margin-left: 6px;">模拟</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="客观题" width="90" align="center">
          <template #default="{ row }">
            <span style="font-weight: 600;">{{ row.objectiveScore ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="主观题" width="90" align="center">
          <template #default="{ row }">
            <span :style="{ fontWeight: '600', color: row.subjectiveScore != null ? '#333' : '#fa8c16' }">
              {{ row.subjectiveScore ?? '待批' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="总分" width="90" align="center">
          <template #default="{ row }">
            <span style="font-weight: bold; color: #667eea; font-size: 15px;">{{ row.totalScore ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewDetail(row)" v-if="row.status !== 'in_progress'">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetail" title="答卷详情" width="700px">
      <template v-if="detailSheet">
        <div style="margin-bottom: 16px; display: flex; gap: 16px;">
          <el-tag>学生: {{ studentMap[detailSheet.studentId] || '-' }}</el-tag>
          <el-tag type="primary">试卷: {{ paperMap[detailSheet.paperId]?.title || '-' }}</el-tag>
          <el-tag :type="statusType(detailSheet.status)">{{ statusText(detailSheet.status) }}</el-tag>
          <el-tag type="danger">总分: {{ detailSheet.totalScore ?? '-' }}</el-tag>
        </div>
        <el-table :data="detailAnswers" stripe size="small">
          <el-table-column label="#" width="50">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="题目" show-overflow-tooltip>
            <template #default="{ row }">{{ row.content }}</template>
          </el-table-column>
          <el-table-column label="学生答案" width="120">
            <template #default="{ row }">
              <span :style="{ color: row.isCorrect ? '#52c41a' : '#f5222d' }">{{ row.studentAnswer || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="正确答案" width="120">
            <template #default="{ row }">{{ row.answer || '(主观)' }}</template>
          </el-table-column>
          <el-table-column label="得分" width="70" align="center">
            <template #default="{ row }">{{ row.earnedScore ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="结果" width="70" align="center">
            <template #default="{ row }">
              <span v-if="row.isCorrect === true" style="color: #52c41a; font-weight: bold;">✓</span>
              <span v-else-if="row.isCorrect === false" style="color: #f5222d; font-weight: bold;">✗</span>
              <span v-else style="color: #fa8c16;">待批</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const sheets = ref<any[]>([])
const students = ref<any[]>([])
const studentMap = ref<Record<number, string>>({})
const paperMap = ref<Record<number, any>>({})
const filterStatus = ref('')
const filterStudent = ref<number | null>(null)
const showDetail = ref(false)
const detailSheet = ref<any>(null)
const detailAnswers = ref<any[]>([])

function statusText(s: string) {
  const map: Record<string, string> = { in_progress: '进行中', auto_graded: '待人工批改', graded: '已完成' }
  return map[s] || s
}
function statusType(s: string) {
  const map: Record<string, string> = { in_progress: 'info', auto_graded: 'warning', graded: 'success' }
  return (map[s] || '') as any
}
function formatTime(t: string) {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const loading = ref(false)

async function loadData() {
  loading.value = true
  const params: any = {}
  if (filterStatus.value) params.status = filterStatus.value
  if (filterStudent.value) params.studentId = filterStudent.value
  try {
    const { data } = await api.get('/exam/answer-sheets', { params })
    sheets.value = Array.isArray(data) ? data : []
  } catch {
    sheets.value = []
  }
  loading.value = false
}

async function viewDetail(row: any) {
  detailSheet.value = row
  detailAnswers.value = []
  showDetail.value = true
  // 获取试卷题目详情
  try {
    const { data } = await api.get(`/exam/answer-sheets/${row.id}`)
    if (data && data.detail) {
      detailAnswers.value = data.detail
    } else if (data && data.answers) {
      // 从 paper 获取题目匹配答案
      const paperRes = await api.get(`/exam/papers/${row.paperId}`)
      const questions = paperRes.data?.questions || []
      const answers = typeof data.answers === 'string' ? JSON.parse(data.answers) : data.answers || {}
      detailAnswers.value = questions.map((q: any) => ({
        content: q.content,
        answer: q.answer,
        studentAnswer: answers[q.id] || '',
        isCorrect: q.answer && answers[q.id] === q.answer,
        earnedScore: q.answer && answers[q.id] === q.answer ? q.score : 0,
      }))
    }
  } catch {}
}

onMounted(async () => {
  const [studentsRes, papersRes] = await Promise.all([
    api.get('/students'),
    api.get('/exam/papers'),
  ])
  const sList = Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data?.data || []
  students.value = sList
  const sMap: Record<number, string> = {}
  sList.forEach((s: any) => { sMap[s.id] = s.name })
  studentMap.value = sMap

  const pList = Array.isArray(papersRes.data) ? papersRes.data : []
  const pMap: Record<number, any> = {}
  pList.forEach((p: any) => { pMap[p.id] = p })
  paperMap.value = pMap

  await loadData()
})
</script>

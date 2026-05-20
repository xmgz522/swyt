<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: bold; font-size: 16px;">批卷管理</span>
            <el-tag v-if="pendingCount > 0" type="danger" size="small">{{ pendingCount }} 份待批改</el-tag>
          </div>
          <el-radio-group v-model="statusFilter" @change="loadSheets">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="auto_graded">待人工批改</el-radio-button>
            <el-radio-button value="graded">已批改</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-empty v-if="sheets.length === 0" description="暂无答卷数据" />
      <el-table v-else :data="sheets" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="学生" width="100">
          <template #default="{ row }">
            <span style="font-weight: 600;">{{ row._studentName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="试卷" width="180">
          <template #default="{ row }">{{ row._paperTitle }}</template>
        </el-table-column>
        <el-table-column label="客观题" width="80" align="center">
          <template #default="{ row }">
            <span style="color: #1890ff; font-weight: 600;">{{ row.objectiveScore ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="主观题" width="80" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.status === 'graded' ? '#52c41a' : '#999' }">
              {{ row.status === 'graded' ? row.subjectiveScore : '待批' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="得分/满分" width="100" align="center">
          <template #default="{ row }">
            <span style="font-weight: bold; font-size: 15px;">{{ row.totalScore ?? '-' }}</span>
            <span v-if="row.paperTotalScore" style="color: #999; font-size: 12px;"> / {{ row.paperTotalScore }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'graded' ? 'success' : row.status === 'auto_graded' ? 'warning' : 'info'" size="small">
              {{ statusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="薄弱知识点">
          <template #default="{ row }">
            <template v-if="row.weakPoints">
              <el-tag v-for="p in safeParseArr(row.weakPoints)" :key="p" size="small" type="danger" style="margin: 2px;">{{ p }}</el-tag>
            </template>
            <span v-else style="color: #ccc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button v-if="row.status === 'auto_graded'" size="small" type="primary" @click="openGrade(row)">批改</el-button>
            <el-button v-else size="small" @click="openGrade(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 答卷详情抽屉 -->
    <el-drawer v-model="showGrade" :title="currentSheet?.status === 'auto_graded' ? '批改答卷' : '答卷详情'" size="720px">
      <template v-if="sheetDetail">
        <div class="grade-header">
          <div><strong>学生：</strong>{{ currentSheet?._studentName }}</div>
          <div><strong>试卷：</strong>{{ sheetDetail.paperTitle }}</div>
          <div>
            <el-tag type="primary">客观: {{ sheetDetail.objectiveScore }}分</el-tag>
            <el-tag v-if="sheetDetail.status === 'graded'" type="success" style="margin-left: 6px;">主观: {{ sheetDetail.subjectiveScore }}分</el-tag>
            <el-tag style="margin-left: 6px;">总计: {{ sheetDetail.totalScore }}分</el-tag>
          </div>
        </div>

        <el-divider content-position="left">答题详情</el-divider>
        <div v-for="(q, idx) in sheetDetail.questions" :key="q.questionId" class="question-card" :class="{ correct: q.isCorrect === true, wrong: q.isCorrect === false, manual: q.needManualGrade }">
          <div class="q-header">
            <span class="q-num">{{ idx + 1 }}.</span>
            <el-tag :type="typeColor[q.type]" size="small">{{ typeMap[q.type] }}</el-tag>
            <el-tag size="small" type="info">{{ q.score }}分</el-tag>
            <el-tag v-if="q.knowledgePoint" size="small">{{ q.knowledgePoint }}</el-tag>
            <span class="q-result">
              <el-tag v-if="q.isCorrect === true" type="success" size="small">正确</el-tag>
              <el-tag v-else-if="q.isCorrect === false" type="danger" size="small">错误</el-tag>
              <el-tag v-else type="warning" size="small">待批改</el-tag>
            </span>
          </div>
          <div class="q-content">{{ q.content }}</div>
          <div v-if="q.options" class="q-options">
            <div v-for="(opt, oi) in q.options" :key="oi" class="opt-item" :class="{ 'opt-correct': opt.startsWith(q.correctAnswer), 'opt-wrong': opt.startsWith(q.studentAnswer) && q.studentAnswer !== q.correctAnswer }">
              {{ opt }}
            </div>
          </div>
          <div class="q-answers">
            <div><strong>学生答案：</strong><span :class="q.isCorrect === false ? 'text-red' : ''">{{ q.studentAnswer || '（未作答）' }}</span></div>
            <div v-if="!q.needManualGrade"><strong>正确答案：</strong><span class="text-green">{{ q.correctAnswer }}</span></div>
          </div>
          <div v-if="q.explanation" class="q-explain">
            <strong>解析：</strong>{{ q.explanation }}
          </div>
          <!-- 主观题逐题打分 -->
          <div v-if="q.needManualGrade" class="q-grade-row">
            <div class="q-grade-input">
              <span class="q-grade-label">打分：</span>
              <el-input-number
                v-model="questionGradeMap[q.questionId].score"
                :min="0"
                :max="q.score"
                :disabled="currentSheet?.status === 'graded'"
                size="small"
                style="width: 120px;"
              />
              <span class="q-grade-total">/ {{ q.score }}分</span>
              <span v-if="q.studentScore !== null" class="q-grade-saved">（已批: {{ q.studentScore }}分）</span>
            </div>
            <div class="q-grade-comment">
              <span class="q-grade-label">评语：</span>
              <el-input
                v-model="questionGradeMap[q.questionId].comment"
                :disabled="currentSheet?.status === 'graded'"
                size="small"
                placeholder="写点评语..."
                style="flex: 1;"
              />
            </div>
          </div>
        </div>

        <!-- 学生上传的图片 -->
        <div v-if="sheetImages.length > 0" style="margin-top: 16px;">
          <el-divider content-position="left">学生上传的图片</el-divider>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <el-image
              v-for="(img, i) in sheetImages"
              :key="i"
              :src="getImageUrl(img)"
              :preview-src-list="sheetImages.map(getImageUrl)"
              :initial-index="i"
              fit="cover"
              style="width: 120px; height: 120px; border-radius: 8px; cursor: pointer;"
            />
          </div>
        </div>

        <el-divider content-position="left">总评</el-divider>
        <el-form :model="gradeForm" label-width="100px">
          <el-form-item label="主观题总分">
            <span style="font-weight: 600; font-size: 16px; color: #1890ff;">{{ computedSubjectiveTotal }} 分</span>
            <span style="color: #999; margin-left: 8px;">（各题自动汇总）</span>
          </el-form-item>
          <el-form-item label="老师总评">
            <el-input v-model="gradeForm.comment" type="textarea" :rows="3" placeholder="总体评价..." :disabled="currentSheet?.status === 'graded'" />
          </el-form-item>
          <el-form-item>
            <el-button v-if="currentSheet?.status === 'auto_graded'" type="primary" @click="handleGrade">提交批改</el-button>
            <el-button @click="showGrade = false">{{ currentSheet?.status === 'graded' ? '关闭' : '取消' }}</el-button>
          </el-form-item>
        </el-form>
      </template>
      <el-skeleton v-else :rows="6" animated />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const typeMap: any = { single_choice: '单选', multi_choice: '多选', judge: '判断', fill: '填空', short_answer: '简答' }
const typeColor: any = { single_choice: 'primary', multi_choice: 'success', judge: 'warning', fill: 'info', short_answer: 'danger' }
const statusMap: any = { pending: '待提交', auto_graded: '待人工批改', graded: '已批改' }
const sheets = ref<any[]>([])
const statusFilter = ref('')
const showGrade = ref(false)
const currentSheet = ref<any>(null)
const sheetDetail = ref<any>(null)
const gradeForm = ref({ comment: '' })
const questionGradeMap = ref<Record<number, { score: number; comment: string }>>({})
const sheetImages = ref<string[]>([])

const pendingCount = computed(() => sheets.value.filter(s => s.status === 'auto_graded').length)

const computedSubjectiveTotal = computed(() => {
  return Object.values(questionGradeMap.value).reduce((sum, q) => sum + (q.score || 0), 0)
})

function safeParseArr(s: string) {
  try { return JSON.parse(s) } catch { return [] }
}

const loading = ref(false)

onMounted(() => { loadSheets() })

async function loadSheets() {
  loading.value = true
  try {
    const [sheetsRes, studentsRes, papersRes] = await Promise.all([
      api.get('/exam/answer-sheets', { params: statusFilter.value ? { status: statusFilter.value } : {} }),
      api.get('/students'),
      api.get('/exam/papers'),
    ])
    const studentMap: any = {}
    ;(Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data?.data || []).forEach((s: any) => { studentMap[s.id] = s.name })
    const paperMap: any = {}
    const paperScoreMap: any = {}
    papersRes.data.forEach((p: any) => { paperMap[p.id] = p.title; paperScoreMap[p.id] = p.totalScore })

    sheets.value = sheetsRes.data.map((s: any) => ({
      ...s,
      _studentName: studentMap[s.studentId] || `学生#${s.studentId}`,
      _paperTitle: paperMap[s.paperId] || `试卷#${s.paperId}`,
      paperTotalScore: paperScoreMap[s.paperId] || null,
    }))
  } catch {}
  loading.value = false
}

function getImageUrl(url: string) {
  if (url.startsWith('http')) return url
  return `http://localhost:3000${url}`
}

async function openGrade(row: any) {
  currentSheet.value = row
  sheetDetail.value = null
  sheetImages.value = []
  gradeForm.value = { comment: row.comment || '' }
  questionGradeMap.value = {}
  showGrade.value = true
  const { data } = await api.get(`/exam/answer-sheets/${row.id}`)
  sheetDetail.value = data
  try { sheetImages.value = data.images ? JSON.parse(data.images) : [] } catch { sheetImages.value = [] }
  // 初始化每道主观题的打分
  for (const q of data.questions || []) {
    if (q.needManualGrade) {
      questionGradeMap.value[q.questionId] = {
        score: q.studentScore ?? 0,
        comment: q.teacherComment || '',
      }
    }
  }
}

async function handleGrade() {
  const questionScores = Object.entries(questionGradeMap.value).map(([qid, val]) => ({
    questionId: +qid,
    score: val.score,
    comment: val.comment,
  }))
  await api.post(`/exam/answer-sheets/${currentSheet.value.id}/grade`, {
    questionScores,
    comment: gradeForm.value.comment,
  })
  ElMessage.success('批改完成')
  showGrade.value = false
  loadSheets()
}
</script>

<style scoped>
.grade-header { background: #f5f7fa; padding: 14px 18px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px; }
.question-card { background: #fff; border: 1px solid #ebeef5; border-radius: 8px; padding: 14px 18px; margin-bottom: 14px; }
.question-card.correct { border-left: 4px solid #52c41a; }
.question-card.wrong { border-left: 4px solid #f5222d; }
.question-card.manual { border-left: 4px solid #fa8c16; }
.q-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.q-num { font-weight: bold; font-size: 15px; }
.q-result { margin-left: auto; }
.q-content { font-size: 14px; color: #333; margin-bottom: 8px; line-height: 1.6; }
.q-options { margin-bottom: 8px; }
.opt-item { padding: 4px 12px; margin: 4px 0; border-radius: 4px; font-size: 13px; }
.opt-correct { background: #f6ffed; color: #52c41a; }
.opt-wrong { background: #fff2f0; color: #f5222d; }
.q-answers { font-size: 13px; color: #666; margin-bottom: 6px; display: flex; gap: 24px; }
.text-red { color: #f5222d; font-weight: 600; }
.text-green { color: #52c41a; font-weight: 600; }
.q-explain { font-size: 12px; color: #999; background: #fafafa; padding: 8px 12px; border-radius: 4px; }
.q-grade-row { margin-top: 10px; padding: 10px 12px; background: #fffbe6; border-radius: 6px; border: 1px dashed #ffe58f; }
.q-grade-input { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.q-grade-label { font-size: 13px; color: #666; font-weight: 600; }
.q-grade-total { font-size: 12px; color: #999; }
.q-grade-saved { font-size: 12px; color: #52c41a; }
.q-grade-comment { display: flex; align-items: center; gap: 8px; }
</style>

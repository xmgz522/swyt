<template>
  <div class="max-w-5xl mx-auto py-6">
    <!-- 阶段1: 选学校 -->
    <div v-if="step === 'select'">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">模拟面试</h1>
          <p class="text-sm text-gray-500 mt-1">选择目标院校，随机抽题模拟面试</p>
        </div>
      </div>

      <!-- 雷达图数据 -->
      <div v-if="radarData?.radar" class="panel-card mb-6">
        <div class="flex items-center gap-3 mb-5">
          <span class="w-1 h-5 rounded bg-purple-500"></span>
          <h3 class="text-base font-bold text-gray-800">我的面试能力</h3>
          <span class="ml-auto text-sm font-semibold text-purple-600">综合: {{ radarData.radar.total }}/10</span>
        </div>
        <div class="grid grid-cols-5 gap-4">
          <div v-for="item in radarItems" :key="item.key" class="text-center">
            <div class="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div class="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-700"
                :style="{ width: (radarData.radar[item.key] / 10 * 100) + '%' }"></div>
            </div>
            <p class="text-lg font-bold text-purple-600">{{ radarData.radar[item.key] }}</p>
            <p class="text-xs text-gray-500">{{ item.label }}</p>
          </div>
        </div>
      </div>

      <!-- 学校列表 -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div
          v-for="s in schoolList"
          :key="s.schoolId"
          class="panel-card cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
          @click="chooseSchool(s)"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              {{ s.schoolName.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">{{ s.schoolName }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ s.questionCount }} 道面试题</p>
            </div>
            <el-icon class="text-gray-300 group-hover:text-purple-400"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <!-- 历史记录 -->
      <div v-if="history.length > 0" class="panel-card">
        <div class="flex items-center gap-3 mb-4">
          <span class="w-1 h-5 rounded bg-gray-400"></span>
          <h3 class="text-base font-bold text-gray-800">历史记录</h3>
        </div>
        <el-table :data="history" size="small" stripe>
          <el-table-column prop="schoolName" label="学校" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusType[row.status]" size="small">{{ statusMap[row.status] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="总分" width="70">
            <template #default="{ row }">
              <span v-if="row.status === 'graded'" class="font-bold text-purple-600">{{ row.totalScore }}</span>
              <span v-else class="text-gray-300">-</span>
            </template>
          </el-table-column>
          <el-table-column label="时间" width="140">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="" width="80">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="viewDetail(row.id)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 阶段2: 答题 -->
    <div v-if="step === 'answering'">
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-xl font-bold text-gray-900">{{ mockData.schoolName }}</h1>
        <span class="text-sm text-gray-500">{{ currentIdx + 1 }} / {{ mockData.questions.length }}</span>
      </div>
      <el-progress :percentage="((currentIdx + 1) / mockData.questions.length * 100)" :show-text="false" :stroke-width="6" color="#722ed1" class="mb-6" />

      <div class="panel-card mb-4">
        <div class="flex gap-2 mb-3 flex-wrap">
          <el-tag v-if="currentQ.category" type="primary" size="small">{{ currentQ.category }}</el-tag>
          <el-tag v-if="currentQ.difficulty" :type="diffType[currentQ.difficulty]" size="small">{{ diffLabel[currentQ.difficulty] }}</el-tag>
        </div>
        <p class="text-base text-gray-800 leading-relaxed font-medium">{{ currentQ.question }}</p>
        <div v-if="currentQ.tips" class="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
          <p class="text-sm text-amber-700"><span class="font-semibold">💡 提示：</span>{{ currentQ.tips }}</p>
        </div>
      </div>

      <div class="panel-card mb-4">
        <p class="text-sm font-semibold text-gray-700 mb-2">你的回答</p>
        <el-input
          v-model="answers[currentIdx].answer"
          type="textarea"
          :rows="8"
          placeholder="请输入你的回答..."
          :maxlength="2000"
          show-word-limit
        />
      </div>

      <div class="flex gap-3 justify-end">
        <el-button v-if="currentIdx > 0" @click="currentIdx--">上一题</el-button>
        <el-button v-if="currentIdx < mockData.questions.length - 1" type="primary" color="#722ed1" @click="nextQ">下一题</el-button>
        <el-button v-if="currentIdx === mockData.questions.length - 1" type="success" @click="submitAll">提交面试</el-button>
      </div>
    </div>

    <!-- 阶段3: 结果 -->
    <div v-if="step === 'result'">
      <el-button text @click="backToSelect" class="mb-4"><el-icon><ArrowLeft /></el-icon> 返回列表</el-button>

      <div v-if="!detail" class="text-center py-20 text-gray-400">加载中...</div>
      <div v-else>
        <!-- 顶部概览 -->
        <div :class="['result-banner', 'rb-' + detail.status]">
          <div>
            <h2 class="text-xl font-bold text-white">{{ detail.schoolName }}</h2>
            <p class="text-sm text-white/80 mt-1">{{ statusMap[detail.status] }}</p>
          </div>
          <div v-if="detail.status === 'graded'" class="text-right">
            <p class="text-4xl font-bold text-white">{{ detail.totalScore }}</p>
            <p class="text-sm text-white/70">总分</p>
          </div>
        </div>

        <!-- 评分维度 -->
        <div v-if="detail.status === 'graded'" class="panel-card mb-4">
          <h3 class="text-base font-bold text-gray-800 mb-4">面试评分</h3>
          <div class="space-y-3">
            <div v-for="dim in dimensions" :key="dim.key" class="flex items-center gap-3">
              <span class="w-20 text-sm text-gray-600">{{ dim.label }}</span>
              <el-progress :percentage="(detail[dim.key] || 0) * 10" :stroke-width="16" :format="() => detail[dim.key]" class="flex-1" color="#722ed1" />
            </div>
          </div>
          <div v-if="detail.feedback" class="mt-5 bg-purple-50 border border-purple-100 rounded-lg p-4">
            <p class="text-sm font-semibold text-purple-700 mb-1">老师评语</p>
            <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{{ detail.feedback }}</p>
          </div>
        </div>

        <div v-if="detail.status === 'submitted'" class="panel-card text-center py-10 mb-4">
          <p class="text-4xl mb-3">⏳</p>
          <p class="text-gray-500">回答已提交，等待老师评分</p>
        </div>

        <!-- 问答详情 -->
        <div class="panel-card">
          <h3 class="text-base font-bold text-gray-800 mb-4">问答详情</h3>
          <el-collapse>
            <el-collapse-item v-for="(q, idx) in detail.questions" :key="q.id" :title="`第${idx + 1}题: ${q.question}`">
              <div class="space-y-3">
                <div class="bg-purple-50 border border-purple-100 rounded-lg p-3">
                  <p class="text-sm font-semibold text-purple-700 mb-1">我的回答</p>
                  <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ q.studentAnswer || '未作答' }}</p>
                </div>
                <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p class="text-sm font-semibold text-blue-700 mb-1">参考答案</p>
                  <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ q.referenceAnswer }}</p>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import http from '@/utils/api'

const diffLabel: Record<string, string> = { easy: '简单', medium: '中等', hard: '较难' }
const diffType: Record<string, string> = { easy: 'success', medium: 'warning', hard: 'danger' }
const statusMap: Record<string, string> = { pending: '答题中', submitted: '待评分', graded: '已评分' }
const statusType: Record<string, string> = { pending: 'warning', submitted: '', graded: 'success' }

const radarItems = [
  { key: 'logic', label: '逻辑表达' },
  { key: 'knowledge', label: '知识面' },
  { key: 'quality', label: '综合素质' },
  { key: 'expression', label: '语言表达' },
  { key: 'adaptability', label: '应变能力' },
]
const dimensions = [
  { key: 'scoreLogic', label: '逻辑表达' },
  { key: 'scoreKnowledge', label: '知识面' },
  { key: 'scoreQuality', label: '综合素质' },
  { key: 'scoreExpression', label: '语言表达' },
  { key: 'scoreAdaptability', label: '应变能力' },
]

const step = ref<'select' | 'answering' | 'result'>('select')
const schoolList = ref<any[]>([])
const history = ref<any[]>([])
const radarData = ref<any>(null)
const mockData = ref<any>({ questions: [] })
const currentIdx = ref(0)
const answers = ref<{ questionId: number; answer: string }[]>([])
const detail = ref<any>(null)

const currentQ = computed(() => mockData.value.questions[currentIdx.value] || {})

function getSid() {
  return localStorage.getItem('studentId')
}

onMounted(async () => {
  const sid = getSid()
  if (!sid) return
  try {
    const [schools, hist, radar]: any = await Promise.all([
      http.get('/interview/schools'),
      http.get(`/interview/mock/history/${sid}`),
      http.get(`/interview/mock/radar/${sid}`),
    ])
    schoolList.value = schools || []
    history.value = hist || []
    radarData.value = radar
  } catch {}
})

async function chooseSchool(s: any) {
  const sid = getSid()
  if (!sid) { ElMessage.warning('请先登录'); return }
  try {
    const data: any = await http.post('/interview/mock/start', { studentId: +sid, schoolId: s.schoolId, count: 5 })
    mockData.value = data
    answers.value = data.questions.map((q: any) => ({ questionId: q.id, answer: '' }))
    currentIdx.value = 0
    step.value = 'answering'
  } catch (e: any) {
    ElMessage.error(e?.data?.message || '抽题失败')
  }
}

function nextQ() {
  if (currentIdx.value < mockData.value.questions.length - 1) currentIdx.value++
}

async function submitAll() {
  const unanswered = answers.value.filter(a => !a.answer.trim()).length
  if (unanswered > 0) {
    try {
      await ElMessageBox.confirm(`还有 ${unanswered} 道题未作答，确定提交？`, '提示', { type: 'warning' })
    } catch { return }
  }
  try {
    await http.post(`/interview/mock/${mockData.value.id}/submit`, { answers: answers.value })
    ElMessage.success('提交成功，等待老师评分')
    await loadDetail(mockData.value.id)
    step.value = 'result'
  } catch {
    ElMessage.error('提交失败')
  }
}

async function viewDetail(id: number) {
  await loadDetail(id)
  step.value = 'result'
}

async function loadDetail(id: number) {
  try {
    detail.value = await http.get(`/interview/mock/detail/${id}`)
  } catch {
    ElMessage.error('加载失败')
  }
}

async function backToSelect() {
  step.value = 'select'
  detail.value = null
  const sid = getSid()
  if (sid) {
    try {
      const [hist, radar]: any = await Promise.all([
        http.get(`/interview/mock/history/${sid}`),
        http.get(`/interview/mock/radar/${sid}`),
      ])
      history.value = hist || []
      radarData.value = radar
    } catch {}
  }
}

function formatTime(t: string) {
  return t ? t.substring(0, 16).replace('T', ' ') : ''
}
</script>

<style scoped>
.panel-card {
  @apply bg-white rounded-xl border border-gray-100 p-5;
}
.result-banner {
  @apply rounded-xl p-6 flex items-center justify-between mb-4;
}
.rb-graded { @apply bg-gradient-to-r from-green-500 to-emerald-400; }
.rb-submitted { @apply bg-gradient-to-r from-blue-500 to-blue-400; }
.rb-pending { @apply bg-gradient-to-r from-orange-500 to-orange-400; }
</style>

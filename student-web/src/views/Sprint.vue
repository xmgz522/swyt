<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-6">学考冲刺</h1>

    <!-- 进度环 -->
    <div class="bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl p-8 text-white mb-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-lg font-bold mb-1">{{ gradeTotal }}/10 门已出分</p>
          <p class="opacity-80 text-sm">还有 {{ remaining }} 门待考</p>
        </div>
        <div class="flex gap-1.5">
          <span v-for="i in 10" :key="i" :class="['w-4 h-4 rounded-full border-2', i <= gradeTotal ? 'bg-white border-white' : 'border-white/40']"></span>
        </div>
      </div>
    </div>

    <!-- AI 薄弱项分析 -->
    <div class="bg-white rounded-xl p-6 shadow-sm border-2 border-red-100 mb-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
        <h3 class="text-base font-bold text-gray-700">综合薄弱项分析</h3>
        <span class="ml-auto bg-red-50 text-red-500 text-xs font-bold px-2.5 py-0.5 rounded">综合</span>
      </div>

      <!-- 学科筛选 -->
      <div class="flex flex-wrap gap-2 mb-5">
        <button
          v-for="s in analysisSubjects"
          :key="s"
          type="button"
          :class="['px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
            analysisSubject === s
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100']"
          @click="switchAnalysisSubject(s)"
        >{{ s }}</button>
      </div>

      <div v-if="analysisLoading" class="text-center py-8 text-gray-400 text-sm">正在分析做题数据...</div>

      <div v-else-if="analysis.totalQuestions === 0" class="text-center py-8">
        <p class="text-3xl mb-2">📝</p>
        <p class="font-medium text-gray-600">{{ analysisSubject === '全部' ? '暂无做题记录' : `暂无${analysisSubject}做题记录` }}</p>
        <p class="text-sm text-gray-400 mt-1">{{ analysisSubject === '全部' ? '完成本页学考试卷或学考专项刷题后可查看薄弱项' : `先在本页完成${analysisSubject}相关学考试卷或专项练习` }}</p>
      </div>

      <div v-else>
        <!-- 统计概览 -->
        <div class="grid grid-cols-3 gap-4 mb-5">
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <p class="text-2xl font-bold text-gray-700">{{ analysis.totalExams }}</p>
            <p class="text-xs text-gray-400 mt-1">完成试卷</p>
          </div>
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <p class="text-2xl font-bold text-gray-700">{{ analysis.totalQuestions }}</p>
            <p class="text-xs text-gray-400 mt-1">答题总数</p>
          </div>
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <p :class="['text-2xl font-bold', analysis.overallAccuracy >= 80 ? 'text-green-500' : analysis.overallAccuracy >= 60 ? 'text-orange-500' : 'text-red-500']">{{ analysis.overallAccuracy }}%</p>
            <p class="text-xs text-gray-400 mt-1">正确率</p>
          </div>
        </div>

        <!-- 知识点条形图 -->
        <div class="space-y-4 mb-5">
          <div v-for="kp in analysis.knowledgePoints" :key="kp.name">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-gray-600 font-medium">{{ kp.name }}</span>
              <span :class="['text-sm font-bold', kp.accuracy >= 80 ? 'text-green-500' : kp.accuracy >= 60 ? 'text-orange-500' : 'text-red-500']">{{ kp.accuracy }}%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :style="{ width: kp.accuracy + '%', background: kp.accuracy >= 80 ? '#52c41a' : kp.accuracy >= 60 ? '#fa8c16' : '#f5222d' }"></div>
            </div>
            <div v-if="kp.wrongSamples.length" class="mt-1">
              <span class="text-xs text-red-400">易错：</span>
              <span v-for="(s, si) in kp.wrongSamples" :key="si" class="text-xs text-gray-400 ml-1">{{ s }}...</span>
            </div>
          </div>
        </div>

        <!-- AI 建议 -->
        <div v-if="analysis.suggestions.length" class="space-y-2 mb-4">
          <div v-for="(s, idx) in analysis.suggestions" :key="idx" class="flex items-start gap-2">
            <span :class="['w-2 h-2 rounded-full mt-1.5 flex-shrink-0', idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-400' : 'bg-green-500']"></span>
            <p class="text-sm text-gray-600 leading-relaxed">{{ s }}</p>
          </div>
        </div>

        <p class="text-xs text-gray-400 pt-3 border-t border-gray-100">{{ analysis.summary }}</p>
      </div>
    </div>

    <!-- 学考刷题 -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50 mb-6">
      <h3 class="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-primary-500"></span>学考刷题
        <span class="text-xs text-gray-400 font-normal ml-1">（按科目练习）</span>
      </h3>
      <!-- 科目 tab -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="s in sprintSubjects"
          :key="s"
          type="button"
          :class="['px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
            activeSubject === s
              ? 'bg-primary-500 text-white border-primary-500'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100']"
          @click="switchSubject(s)"
        >{{ s }}</button>
      </div>
      <!-- 该科目试卷 -->
      <div class="space-y-3">
        <div v-for="p in filteredPapers" :key="p.id" class="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" @click="$router.push(`/exam/${p.id}`)">
          <div>
            <p class="text-sm font-medium text-gray-700">{{ p.title }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ p.totalScore }}分 · {{ p.duration || '不限' }}分钟</p>
          </div>
          <button type="button" class="bg-gradient-to-r from-primary-500 to-accent text-white text-xs font-medium px-4 py-1.5 rounded-full">开始</button>
        </div>
        <p v-if="filteredPapers.length === 0" class="text-center text-sm text-gray-300 py-4">该科目暂无试卷</p>
      </div>
    </div>

    <!-- 专项练习 -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50 mb-6">
      <h3 class="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>专项练习
        <span class="text-xs text-gray-400 font-normal ml-1">（按题型针对性刷题）</span>
      </h3>
      <!-- 科目选择 -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="s in allSubjects"
          :key="s"
          type="button"
          :class="['px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
            practiceSubject === s
              ? 'bg-purple-500 text-white border-purple-500'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100']"
          @click="switchPracticeSubject(s)"
        >{{ s }}</button>
      </div>
      <!-- 题型分类卡片 -->
      <div v-if="categoriesLoading" class="text-center py-6 text-gray-400 text-sm">加载中...</div>
      <div v-else-if="categories.length === 0" class="text-center py-6">
        <p class="text-sm text-gray-300">该科目暂无题目</p>
      </div>
      <div v-else class="grid grid-cols-2 gap-3">
        <div
          v-for="cat in categories"
          :key="cat.name"
          class="p-4 rounded-xl bg-gray-50 hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all cursor-pointer group"
          @click="startPractice(practiceSubject, cat.name)"
        >
          <p class="text-sm font-medium text-gray-700 group-hover:text-purple-600">{{ cat.name }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ cat.count }} 道题</p>
        </div>
      </div>
    </div>

    <!-- 学考错题本 -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50 mb-6" v-if="store.isLoggedIn">
      <div class="flex items-center gap-2 mb-4">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
        <h3 class="text-base font-bold text-gray-700">学考错题本</h3>
        <span class="ml-auto text-xs text-gray-400" v-if="wrongStats">{{ wrongStats.unmasteredCount }} 题待攻克 / {{ wrongStats.total }} 总错题</span>
      </div>

      <!-- 科目筛选 -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button v-for="s in wrongSubjects" :key="'w'+s" type="button"
          :class="['px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
            wrongSubject === s ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100']"
          @click="switchWrongSubject(s)"
        >{{ s }}</button>
      </div>

      <div v-if="wrongNotes.length === 0" class="text-center py-6">
        <p class="text-3xl mb-2">🎉</p>
        <p class="text-sm text-gray-400">{{ wrongSubject === '全部' ? '还没有错题，做完试卷后错题自动收录' : `${wrongSubject}没有错题` }}</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="item in wrongNotes" :key="item.id" :class="['p-4 rounded-xl border transition-all', item.mastered ? 'border-green-100 bg-green-50/30 opacity-60' : 'border-gray-100 bg-gray-50']">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-2">
                <span class="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-500 font-medium">{{ item.question?.subject || '未分类' }}</span>
                <span v-if="item.question?.knowledgePoint" class="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-500 font-medium">{{ item.question.knowledgePoint }}</span>
                <span v-if="item.wrongCount > 1" class="text-xs px-2 py-0.5 rounded bg-red-50 text-red-500 font-bold">错{{ item.wrongCount }}次</span>
                <span v-if="item.mastered" class="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 font-medium">✓ 已掌握</span>
              </div>
              <p class="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap line-clamp-2">{{ item.question?.content }}</p>
              <div v-if="wrongExpanded.has(item.id)" class="mt-3 p-3 bg-white rounded-lg text-xs space-y-1 border border-gray-100">
                <p><span class="font-semibold text-green-600">正确答案：</span>{{ item.question?.answer }}</p>
                <p v-if="item.lastWrongAnswer"><span class="font-semibold text-red-500">你的答案：</span>{{ item.lastWrongAnswer }}</p>
                <p v-if="item.question?.explanation"><span class="font-semibold text-gray-600">解析：</span>{{ item.question.explanation }}</p>
              </div>
            </div>
            <div class="flex flex-col gap-1.5 flex-shrink-0">
              <el-button size="small" text @click="wrongExpanded.has(item.id) ? wrongExpanded.delete(item.id) : wrongExpanded.add(item.id)">
                {{ wrongExpanded.has(item.id) ? '收起' : '解析' }}
              </el-button>
              <el-button size="small" :type="item.mastered ? 'default' : 'success'" @click="toggleWrongMastered(item)">
                {{ item.mastered ? '取消' : '掌握' }}
              </el-button>
            </div>
          </div>
        </div>

        <div class="text-center pt-2" v-if="wrongTotal > wrongNotes.length">
          <el-button text type="primary" @click="loadMoreWrong">加载更多 ({{ wrongNotes.length }}/{{ wrongTotal }})</el-button>
        </div>
      </div>
    </div>

    <!-- 潜力分析 -->
    <div class="grid grid-cols-2 gap-4 mb-6" v-if="remaining > 0">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 text-center">
        <p class="text-xs text-gray-400 mb-2">当前成绩</p>
        <p class="text-lg font-bold text-gray-700">
          {{ store.profile?.gradeA || 0 }}A {{ store.profile?.gradeB || 0 }}B {{ store.profile?.gradeC || 0 }}C
        </p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-orange-100 text-center">
        <p class="text-xs text-gray-400 mb-2">乐观预估</p>
        <p class="text-lg font-bold text-orange-500">{{ potentialA }}A {{ potentialB }}B</p>
        <p class="text-xs text-gray-300 mt-1">剩余{{ remaining }}门按70%A 30%B估算</p>
      </div>
    </div>

    <!-- 科目状态 -->
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50 mb-6">
      <h3 class="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>各科目状态
      </h3>
      <div class="grid grid-cols-2 gap-3">
        <div v-for="s in subjects" :key="s.name" class="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <span class="text-sm text-gray-700">{{ s.name }}</span>
          <span :class="['text-xs font-bold px-2 py-0.5 rounded-full', s.status === 'done' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500']">
            {{ s.status === 'done' ? s.grade : '待考' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const router = useRouter()

const store = useStudentStore()
const TOTAL = 10
const analysis = ref<any>({ totalExams: 0, totalQuestions: 0, overallAccuracy: 0, knowledgePoints: [], suggestions: [], summary: '' })
const analysisLoading = ref(true)
const papers = ref<any[]>([])

// AI 分析学科筛选
const analysisSubjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const analysisSubject = ref('全部')

async function switchAnalysisSubject(s: string) {
  analysisSubject.value = s
  analysisLoading.value = true
  try {
    const query = s === '全部' ? '?bankType=xuekao' : `?subject=${encodeURIComponent(s)}&bankType=xuekao`
    const res: any = await http.get(`/exam/analysis/${store.studentId}${query}`)
    if (res.success) analysis.value = res.data
  } catch {}
  analysisLoading.value = false
}

const gradeTotal = computed(() => store.gradeTotal)
const remaining = computed(() => Math.max(0, TOTAL - gradeTotal.value))
const potentialA = computed(() => (store.profile?.gradeA || 0) + Math.round(remaining.value * 0.7))
const potentialB = computed(() => (store.profile?.gradeB || 0) + Math.round(remaining.value * 0.3))

const allSubjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const sprintSubjects = ['全部', ...allSubjects]
const activeSubject = ref('全部')

function switchSubject(s: string) {
  activeSubject.value = s
}

// 专项练习
const practiceSubject = ref('语文')
const categories = ref<{ name: string; count: number }[]>([])
const categoriesLoading = ref(false)

async function switchPracticeSubject(s: string) {
  practiceSubject.value = s
  categoriesLoading.value = true
  try {
    const res: any = await http.get(`/exam/practice/categories?subject=${encodeURIComponent(s)}&bankType=xuekao`)
    categories.value = Array.isArray(res) ? res : []
  } catch { categories.value = [] }
  categoriesLoading.value = false
}

function startPractice(subject: string, knowledgePoint: string) {
  router.push({ path: '/practice/do', query: { subject, kp: knowledgePoint, bankType: 'xuekao' } })
}

// 错题本
const wrongSubjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const wrongSubject = ref('全部')
const wrongStats = ref<any>(null)
const wrongNotes = ref<any[]>([])
const wrongTotal = ref(0)
const wrongPage = ref(1)
const wrongExpanded = reactive(new Set<number>())

async function loadWrongData(subject?: string) {
  if (!store.studentId) return
  try { wrongStats.value = await http.get(`/exam/wrong-notes/${store.studentId}/stats?bankType=xuekao`) } catch {}
  try {
    let url = `/exam/wrong-notes/${store.studentId}?page=1&pageSize=10&mastered=false&bankType=xuekao`
    if (subject && subject !== '全部') url += `&subject=${encodeURIComponent(subject)}`
    const res: any = await http.get(url)
    wrongNotes.value = res.data || []
    wrongTotal.value = res.total || 0
    wrongPage.value = 1
  } catch {}
}

function switchWrongSubject(s: string) {
  wrongSubject.value = s
  loadWrongData(s)
}

async function loadMoreWrong() {
  wrongPage.value++
  try {
    let url = `/exam/wrong-notes/${store.studentId}?page=${wrongPage.value}&pageSize=10&mastered=false&bankType=xuekao`
    if (wrongSubject.value !== '全部') url += `&subject=${encodeURIComponent(wrongSubject.value)}`
    const res: any = await http.get(url)
    wrongNotes.value = [...wrongNotes.value, ...(res.data || [])]
  } catch {}
}

async function toggleWrongMastered(item: any) {
  try {
    await http.put(`/exam/wrong-notes/${item.id}/toggle`, { mastered: !item.mastered })
    item.mastered = !item.mastered
    ElMessage.success(item.mastered ? '已标记掌握' : '已取消掌握')
    try { wrongStats.value = await http.get(`/exam/wrong-notes/${store.studentId}/stats?bankType=xuekao`) } catch {}
  } catch {}
}

// 只显示有 subject 字段的学考卷
const filteredPapers = computed(() => {
  const xuekao = papers.value.filter(p => p.subject)
  if (activeSubject.value === '全部') return xuekao
  return xuekao.filter(p => p.subject === activeSubject.value)
})

const subjects = computed(() => {
  if (!store.profile) return allSubjects.map(name => ({ name, status: 'pending', grade: '' }))
  // 优先使用 subjectGrades
  if (store.profile.subjectGrades) {
    try {
      const sg = typeof store.profile.subjectGrades === 'string' ? JSON.parse(store.profile.subjectGrades) : store.profile.subjectGrades
      return allSubjects.map(name => sg[name] ? { name, status: 'done', grade: sg[name] } : { name, status: 'pending', grade: '' })
    } catch {}
  }
  // 兼容旧数据
  const grades: string[] = []
  for (let i = 0; i < (store.profile.gradeA || 0); i++) grades.push('A')
  for (let i = 0; i < (store.profile.gradeB || 0); i++) grades.push('B')
  for (let i = 0; i < (store.profile.gradeC || 0); i++) grades.push('C')
  for (let i = 0; i < (store.profile.gradeD || 0); i++) grades.push('D')
  for (let i = 0; i < (store.profile.gradeE || 0); i++) grades.push('E')
  return allSubjects.map((name, idx) => idx < grades.length ? { name, status: 'done', grade: grades[idx] } : { name, status: 'pending', grade: '' })
})

onMounted(async () => {
  if (store.isLoggedIn && !store.profile) store.loadProfile()
  if (store.isLoggedIn) {
    try {
      const res: any = await http.get(`/exam/analysis/${store.studentId}?bankType=xuekao`)
      if (res.success) analysis.value = res.data
    } catch {}
  }
  analysisLoading.value = false
  try {
    const res: any = await http.get('/exam/papers?bankType=xuekao')
    papers.value = (Array.isArray(res) ? res : []).filter((p: any) => p.isPublished)
  } catch {}
  // 加载初始科目的专项分类
  switchPracticeSubject(practiceSubject.value)
  // 加载错题
  if (store.studentId) loadWrongData()
})
</script>

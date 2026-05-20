<template>
  <view class="page">
    <!-- 顶部 Hero -->
    <view class="hero">
      <text class="hero-title">学考冲刺</text>
      <text class="hero-sub">{{ gradeTotal }}/10 门已出分 · 还有 {{ remaining }} 门待考</text>
      <view class="hero-ring-row">
        <view class="ring-item" v-for="i in 10" :key="i">
          <view :class="['ring-dot', i <= gradeTotal ? 'filled' : 'empty']"></view>
        </view>
      </view>
    </view>

    <!-- AI 薄弱项分析 -->
    <view class="section-card ai-card">
      <view class="card-header">
        <text class="card-title">综合薄弱项分析</text>
        <view class="ai-badge"><text>综合</text></view>
      </view>

      <!-- 学科筛选 -->
      <view class="subj-tabs" style="margin-bottom: 20rpx;">
        <view v-for="s in analysisSubjects" :key="'a'+s" :class="['subj-tab', analysisSubject === s ? 'active-red' : '']" @tap="switchAnalysisSubject(s)">
          <text>{{ s }}</text>
        </view>
      </view>

      <view v-if="analysisLoading" class="ai-loading">
        <text class="ai-loading-text">正在分析你的做题数据...</text>
      </view>

      <view v-else-if="analysis.totalQuestions === 0" class="ai-empty">
        <text class="ai-empty-icon">📝</text>
        <text class="ai-empty-title">{{ analysisSubject === '全部' ? '暂无做题记录' : `暂无${analysisSubject}做题记录` }}</text>
        <text class="ai-empty-desc">{{ analysisSubject === '全部' ? '完成本页学考试卷或学考专项刷题后可查看薄弱项' : `先在本页完成${analysisSubject}相关学考试卷或专项练习` }}</text>
      </view>

      <view v-else>
        <!-- 总体概览 -->
        <view class="ai-summary-row">
          <view class="ai-stat">
            <text class="ai-stat-num">{{ analysis.totalExams }}</text>
            <text class="ai-stat-label">完成试卷</text>
          </view>
          <view class="ai-stat">
            <text class="ai-stat-num">{{ analysis.totalQuestions }}</text>
            <text class="ai-stat-label">答题总数</text>
          </view>
          <view class="ai-stat">
            <text :class="['ai-stat-num', analysis.overallAccuracy >= 80 ? 'good' : analysis.overallAccuracy >= 60 ? 'mid' : 'bad']">{{ analysis.overallAccuracy }}%</text>
            <text class="ai-stat-label">正确率</text>
          </view>
        </view>

        <!-- 知识点雷达 -->
        <view class="kp-list">
          <view v-for="kp in analysis.knowledgePoints" :key="kp.name" class="kp-item">
            <view class="kp-top">
              <text class="kp-name">{{ kp.name }}</text>
              <text :class="['kp-acc', kp.accuracy >= 80 ? 'good' : kp.accuracy >= 60 ? 'mid' : 'bad']">{{ kp.accuracy }}%</text>
            </view>
            <view class="kp-bar-bg">
              <view class="kp-bar-fill" :style="{ width: kp.accuracy + '%', background: kp.accuracy >= 80 ? '#52c41a' : kp.accuracy >= 60 ? '#fa8c16' : '#f5222d' }"></view>
            </view>
            <view v-if="kp.wrongSamples.length > 0" class="kp-wrong">
              <text class="kp-wrong-label">易错题：</text>
              <text class="kp-wrong-item" v-for="(s, si) in kp.wrongSamples" :key="si">{{ s }}...</text>
            </view>
          </view>
        </view>

        <!-- AI 建议 -->
        <view class="ai-suggestions" v-if="analysis.suggestions.length">
          <view class="suggestion-item" v-for="(s, idx) in analysis.suggestions" :key="idx">
            <view :class="['sug-dot', idx === 0 ? 'red' : idx === 1 ? 'orange' : 'green']"></view>
            <text class="sug-text">{{ s }}</text>
          </view>
        </view>

        <text class="ai-summary-text">{{ analysis.summary }}</text>
      </view>
    </view>

    <!-- 学考刷题 -->
    <view class="section-card">
      <view class="card-header">
        <text class="card-title">学考刷题</text>
        <text class="card-sub">按科目练习</text>
      </view>
      <!-- 科目 tab -->
      <view class="subj-tabs">
        <view v-for="s in sprintSubjects" :key="s" :class="['subj-tab', activeSubject === s ? 'active' : '']" @tap="activeSubject = s">
          <text>{{ s }}</text>
        </view>
      </view>
      <view class="exam-entry-list">
        <view v-for="p in filteredPapers" :key="p.id" class="exam-entry" @tap="startExam(p.id)">
          <view class="exam-entry-left">
            <text class="exam-entry-name">{{ p.title }}</text>
            <text class="exam-entry-meta">{{ p.totalScore }}分 · {{ p.duration || '不限' }}分钟</text>
          </view>
          <view class="exam-entry-btn">
            <text>开始</text>
          </view>
        </view>
        <view v-if="filteredPapers.length === 0" class="exam-entry-empty">
          <text>该科目暂无试卷</text>
        </view>
      </view>
    </view>

    <!-- 学考专项刷题 -->
    <view class="section-card">
      <view class="card-header">
        <text class="card-title">学考专项刷题</text>
        <text class="card-sub">学考题库</text>
      </view>
      <view class="subj-tabs">
        <view v-for="s in allSubjects" :key="'p'+s" :class="['subj-tab', practiceSubject === s ? 'active-purple' : '']" @tap="switchPracticeSubject(s)">
          <text>{{ s }}</text>
        </view>
      </view>
      <view v-if="categoriesLoading" class="exam-entry-empty">
        <text>加载中...</text>
      </view>
      <view v-else-if="categories.length === 0" class="exam-entry-empty">
        <text>该科目暂无学考专项题</text>
      </view>
      <view v-else class="xk-cat-grid">
        <view v-for="cat in categories" :key="cat.name" class="xk-cat-card" @tap="startXuekaoPractice(practiceSubject, cat.name)">
          <text class="xk-cat-name">{{ cat.name }}</text>
          <text class="xk-cat-count">{{ cat.count }} 题</text>
        </view>
      </view>
    </view>

    <!-- 学考错题本 -->
    <view v-if="studentId" class="section-card">
      <view class="card-header">
        <text class="card-title">学考错题本</text>
        <text class="card-sub" v-if="wrongStats">({{ wrongStats.unmasteredCount }}题待攻克)</text>
      </view>

      <!-- 科目筛选 -->
      <view class="subj-tabs" style="margin-bottom: 16rpx;">
        <view v-for="s in wrongSubjects" :key="'wn'+s" :class="['subj-tab', wrongSubject === s ? 'active-red' : '']" @tap="switchWrongSubject(s)">
          <text>{{ s }}</text>
        </view>
      </view>

      <view v-if="wrongNotes.length === 0" class="exam-entry-empty">
        <text>{{ wrongSubject === '全部' ? '还没有错题，做完试卷自动收录' : `${wrongSubject}没有错题` }}</text>
      </view>
      <view v-else>
        <view v-for="item in wrongNotes" :key="item.id" :class="['wrong-card', item.mastered ? 'mastered' : '']">
          <view class="wrong-tags">
            <text class="wtag blue">{{ item.question?.subject || '未分类' }}</text>
            <text v-if="item.question?.knowledgePoint" class="wtag purple">{{ item.question.knowledgePoint }}</text>
            <text v-if="item.wrongCount > 1" class="wtag red-bold">错{{ item.wrongCount }}次</text>
            <text v-if="item.mastered" class="wtag green">✓ 已掌握</text>
          </view>
          <text class="wrong-content">{{ item.question?.content }}</text>
          <view v-if="wrongExpanded[item.id]" class="wrong-analysis">
            <text class="wa-line green-text">正确答案：{{ item.question?.answer }}</text>
            <text v-if="item.lastWrongAnswer" class="wa-line red-text">你的答案：{{ item.lastWrongAnswer }}</text>
            <text v-if="item.question?.explanation" class="wa-line gray-text">解析：{{ item.question.explanation }}</text>
          </view>
          <view class="wrong-actions">
            <view class="wa-btn" @tap="wrongExpanded[item.id] = !wrongExpanded[item.id]">
              <text>{{ wrongExpanded[item.id] ? '收起' : '解析' }}</text>
            </view>
            <view :class="['wa-btn', item.mastered ? '' : 'green-btn']" @tap="toggleWrongMastered(item)">
              <text>{{ item.mastered ? '取消掌握' : '已掌握' }}</text>
            </view>
          </view>
        </view>
        <view v-if="wrongTotal > wrongNotes.length" class="load-more-wrong" @tap="loadMoreWrong">
          <text>加载更多 ({{ wrongNotes.length }}/{{ wrongTotal }})</text>
        </view>
      </view>
    </view>

    <!-- 潜力分析卡 -->
    <view class="section-card" v-if="remaining > 0">
      <view class="card-header">
        <view class="card-dot" style="background: #fa8c16;"></view>
        <text class="card-title">潜力分析</text>
      </view>
      <view class="potential-row">
        <view class="potential-item">
          <text class="pot-label">当前成绩</text>
          <text class="pot-value">{{ profile.gradeA || 0 }}A {{ profile.gradeB || 0 }}B {{ profile.gradeC || 0 }}C</text>
        </view>
        <view class="potential-arrow">
          <text>→</text>
        </view>
        <view class="potential-item best-bg">
          <text class="pot-label">乐观预估</text>
          <text class="pot-value best">{{ potentialA }}A {{ potentialB }}B</text>
        </view>
      </view>
      <text class="potential-desc">
        剩余 {{ remaining }} 门中约 {{ Math.round(remaining * 0.7) }} 门可冲A，{{ Math.round(remaining * 0.3) }} 门保B
      </text>
    </view>

    <!-- 科目进度 -->
    <view class="section-card">
      <view class="card-header">
        <view class="card-dot" style="background: #1890ff;"></view>
        <text class="card-title">各科目状态</text>
      </view>
      <view class="subject-list">
        <view v-for="s in subjects" :key="s.name" class="subject-item">
          <text class="subj-name">{{ s.name }}</text>
          <view :class="['subj-badge', s.status === 'done' ? 'done' : 'pending']">
            <text>{{ s.status === 'done' ? s.grade : '待考' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { get, put } from '../../utils/api'

const studentId = ref<any>(null)
const profile = ref<any>({})
const analysis = ref<any>({ totalExams: 0, totalQuestions: 0, overallAccuracy: 0, knowledgePoints: [], suggestions: [], summary: '' })
const analysisLoading = ref(true)
const papers = ref<any[]>([])
const TOTAL = 10

// 错题本
const wrongSubjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const wrongSubject = ref('全部')
const wrongStats = ref<any>(null)
const wrongNotes = ref<any[]>([])
const wrongTotal = ref(0)
const wrongPage = ref(1)
const wrongExpanded = reactive<Record<number, boolean>>({})

async function loadWrongData(subject?: string) {
  if (!studentId.value) return
  try { wrongStats.value = await get(`/exam/wrong-notes/${studentId.value}/stats?bankType=xuekao`) } catch {}
  try {
    let url = `/exam/wrong-notes/${studentId.value}?page=1&pageSize=10&mastered=false&bankType=xuekao`
    if (subject && subject !== '全部') url += `&subject=${encodeURIComponent(subject)}`
    const res: any = await get(url)
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
    let url = `/exam/wrong-notes/${studentId.value}?page=${wrongPage.value}&pageSize=10&mastered=false&bankType=xuekao`
    if (wrongSubject.value !== '全部') url += `&subject=${encodeURIComponent(wrongSubject.value)}`
    const res: any = await get(url)
    wrongNotes.value = [...wrongNotes.value, ...(res.data || [])]
  } catch {}
}

async function toggleWrongMastered(item: any) {
  try {
    await put(`/exam/wrong-notes/${item.id}/toggle`, { mastered: !item.mastered })
    item.mastered = !item.mastered
    uni.showToast({ title: item.mastered ? '已标记掌握' : '已取消', icon: 'success' })
    try { wrongStats.value = await get(`/exam/wrong-notes/${studentId.value}/stats?bankType=xuekao`) } catch {}
  } catch {}
}

// AI 分析学科筛选
const analysisSubjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const analysisSubject = ref('全部')

async function switchAnalysisSubject(s: string) {
  analysisSubject.value = s
  analysisLoading.value = true
  const sid = uni.getStorageSync('studentId')
  if (!sid) { analysisLoading.value = false; return }
  try {
    const query = s === '全部' ? '?bankType=xuekao' : `?subject=${encodeURIComponent(s)}&bankType=xuekao`
    const res = await get(`/exam/analysis/${sid}${query}`)
    if (res.success) analysis.value = res.data
  } catch {}
  analysisLoading.value = false
}

const gradeTotal = computed(() => (profile.value.gradeA || 0) + (profile.value.gradeB || 0) + (profile.value.gradeC || 0) + (profile.value.gradeD || 0) + (profile.value.gradeE || 0))
const remaining = computed(() => Math.max(0, TOTAL - gradeTotal.value))
const potentialA = computed(() => (profile.value.gradeA || 0) + Math.round(remaining.value * 0.7))
const potentialB = computed(() => (profile.value.gradeB || 0) + Math.round(remaining.value * 0.3))

const allSubjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const sprintSubjects = ['全部', ...allSubjects]
const activeSubject = ref('全部')
const practiceSubject = ref('语文')
const categories = ref<{ name: string; count: number }[]>([])
const categoriesLoading = ref(false)

async function switchPracticeSubject(s: string) {
  practiceSubject.value = s
  categoriesLoading.value = true
  try {
    const res = await get(`/exam/practice/categories?subject=${encodeURIComponent(s)}&bankType=xuekao`)
    categories.value = Array.isArray(res) ? res : []
  } catch { categories.value = [] }
  categoriesLoading.value = false
}

function startXuekaoPractice(subject: string, knowledgePoint: string) {
  uni.navigateTo({ url: `/pages/sprint/practice?subject=${encodeURIComponent(subject)}&kp=${encodeURIComponent(knowledgePoint)}&bankType=xuekao` })
}

// 只显示有 subject 的学考卷
const filteredPapers = computed(() => {
  const xuekao = papers.value.filter(p => p.subject)
  if (activeSubject.value === '全部') return xuekao
  return xuekao.filter(p => p.subject === activeSubject.value)
})

const subjects = computed(() => {
  // 优先使用 subjectGrades
  if (profile.value.subjectGrades) {
    try {
      const sg = typeof profile.value.subjectGrades === 'string' ? JSON.parse(profile.value.subjectGrades) : profile.value.subjectGrades
      return allSubjects.map(name => sg[name] ? { name, status: 'done', grade: sg[name] } : { name, status: 'pending', grade: '' })
    } catch {}
  }
  // 兼容旧数据
  const grades: string[] = []
  for (let i = 0; i < (profile.value.gradeA || 0); i++) grades.push('A')
  for (let i = 0; i < (profile.value.gradeB || 0); i++) grades.push('B')
  for (let i = 0; i < (profile.value.gradeC || 0); i++) grades.push('C')
  for (let i = 0; i < (profile.value.gradeD || 0); i++) grades.push('D')
  for (let i = 0; i < (profile.value.gradeE || 0); i++) grades.push('E')
  return allSubjects.map((name, idx) => idx < grades.length ? { name, status: 'done', grade: grades[idx] } : { name, status: 'pending', grade: '' })
})

onMounted(async () => {
  const sid = uni.getStorageSync('studentId')
  studentId.value = sid
  if (sid) {
    try { const data = await get(`/students/${sid}`); if (data) profile.value = data } catch {}
    try {
      const res = await get(`/exam/analysis/${sid}?bankType=xuekao`)
      if (res.success) analysis.value = res.data
    } catch {}
  }
  analysisLoading.value = false
  try {
    const data = await get('/exam/papers?bankType=xuekao')
    papers.value = (Array.isArray(data) ? data : []).filter((p: any) => p.isPublished)
  } catch {}
  switchPracticeSubject(practiceSubject.value)
  // 加载错题
  if (sid) loadWrongData()
})

function startExam(paperId: number) {
  const sid = uni.getStorageSync('studentId')
  if (!sid) { uni.showToast({ title: '请先填写信息', icon: 'none' }); return }
  uni.navigateTo({ url: `/pages/exam/do?paperId=${paperId}` })
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 140rpx; }

.hero { background: #b8700f; padding: 48rpx 36rpx 40rpx; text-align: center; }
.hero-title { color: #fff; font-size: 36rpx; font-weight: 600; display: block; }
.hero-sub { color: rgba(255,255,255,0.8); font-size: 26rpx; display: block; margin-top: 8rpx; }
.hero-ring-row { display: flex; justify-content: center; gap: 12rpx; margin-top: 24rpx; }
.ring-dot { width: 24rpx; height: 24rpx; border-radius: 50%; border: 3rpx solid rgba(255,255,255,0.4); }
.ring-dot.filled { background: #fff; border-color: #fff; }
.ring-dot.empty { background: transparent; }

.section-card { margin: 20rpx 24rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.card-header { display: flex; align-items: center; gap: 10rpx; margin-bottom: 20rpx; }
.card-title { font-size: 28rpx; font-weight: 600; color: #333; }

/* AI分析卡 */
.ai-card { border: 2rpx solid #ffe0e0; }
.ai-badge { background: #cf1322; padding: 4rpx 14rpx; border-radius: 8rpx; margin-left: auto; }
.ai-badge text { color: #fff; font-size: 20rpx; }
.ai-loading { text-align: center; padding: 40rpx 0; }
.ai-loading-text { font-size: 26rpx; color: #999; }
.ai-empty { text-align: center; padding: 30rpx 0; }
.ai-empty-icon { font-size: 48rpx; display: block; margin-bottom: 12rpx; }
.ai-empty-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; }
.ai-empty-desc { font-size: 24rpx; color: #999; display: block; margin-top: 8rpx; }
.ai-empty-btn { display: inline-flex; margin-top: 20rpx; background: #2e4a78; padding: 12rpx 40rpx; border-radius: 12rpx; }
.ai-empty-btn text { color: #fff; font-size: 26rpx; }

.ai-summary-row { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.ai-stat { flex: 1; text-align: center; background: #fafafa; border-radius: 12rpx; padding: 16rpx 0; }
.ai-stat-num { font-size: 34rpx; font-weight: 600; color: #333; display: block; }
.ai-stat-num.good { color: #52c41a; }
.ai-stat-num.mid { color: #fa8c16; }
.ai-stat-num.bad { color: #f5222d; }
.ai-stat-label { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }

.kp-list { margin-bottom: 16rpx; }
.kp-item { margin-bottom: 16rpx; }
.kp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6rpx; }
.kp-name { font-size: 26rpx; color: #333; font-weight: 500; }
.kp-acc { font-size: 24rpx; font-weight: 600; }
.kp-acc.good { color: #52c41a; }
.kp-acc.mid { color: #fa8c16; }
.kp-acc.bad { color: #f5222d; }
.kp-bar-bg { height: 12rpx; background: #f0f0f0; border-radius: 6rpx; overflow: hidden; }
.kp-bar-fill { height: 100%; border-radius: 6rpx; transition: width 0.5s; }
.kp-wrong { margin-top: 6rpx; }
.kp-wrong-label { font-size: 20rpx; color: #f5222d; }
.kp-wrong-item { font-size: 20rpx; color: #999; display: block; padding-left: 10rpx; }

.ai-suggestions { margin-bottom: 16rpx; }
.suggestion-item { display: flex; align-items: flex-start; gap: 10rpx; padding: 10rpx 0; }
.sug-dot { width: 14rpx; height: 14rpx; border-radius: 50%; margin-top: 8rpx; flex-shrink: 0; }
.sug-dot.red { background: #f5222d; }
.sug-dot.orange { background: #fa8c16; }
.sug-dot.green { background: #52c41a; }
.sug-text { font-size: 24rpx; color: #555; line-height: 1.6; }
.ai-summary-text { font-size: 24rpx; color: #999; line-height: 1.6; display: block; padding-top: 12rpx; border-top: 1rpx solid #f5f5f5; }

.card-sub { font-size: 22rpx; color: #999; font-weight: 400; margin-left: 4rpx; }

/* 科目 tab */
.subj-tabs { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 20rpx; }
.subj-tab { padding: 8rpx 24rpx; border-radius: 30rpx; border: 1rpx solid #e8e8e8; background: #fafafa; }
.subj-tab text { font-size: 24rpx; color: #666; }
.subj-tab.active { background: #2e4a78; border-color: #2e4a78; }
.subj-tab.active text { color: #fff; }
.subj-tab.active-purple { background: #4a3780; border-color: #4a3780; }
.subj-tab.active-purple text { color: #fff; }
.subj-tab.active-red { background: #f5222d; border-color: #f5222d; }
.subj-tab.active-red text { color: #fff; font-weight: 600; }

/* 刷题入口 */
.exam-entry-list {}
.exam-entry { display: flex; align-items: center; justify-content: space-between; padding: 18rpx 0; border-bottom: 1rpx solid #f8f8f8; }
.exam-entry:last-child { border-bottom: none; }
.exam-entry-name { font-size: 28rpx; color: #333; font-weight: 500; display: block; }
.exam-entry-meta { font-size: 22rpx; color: #bbb; display: block; margin-top: 4rpx; }
.exam-entry-btn { background: #2e4a78; padding: 10rpx 28rpx; border-radius: 10rpx; }
.exam-entry-btn text { color: #fff; font-size: 24rpx; }
.exam-entry-empty { text-align: center; padding: 30rpx; }
.exam-entry-empty text { font-size: 26rpx; color: #ccc; }
.xk-cat-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.xk-cat-card { flex: 0 0 calc(50% - 8rpx); background: #fafafa; border-radius: 16rpx; padding: 20rpx; border: 1rpx solid transparent; box-sizing: border-box; }
.xk-cat-card:active { background: #f9f0ff; border-color: #722ed1; }
.xk-cat-name { font-size: 28rpx; color: #333; font-weight: 600; display: block; }
.xk-cat-count { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }

/* 潜力分析 */
.potential-row { display: flex; gap: 12rpx; align-items: center; margin-bottom: 16rpx; }
.potential-item { flex: 1; background: #f9f9f9; border-radius: 12rpx; padding: 16rpx; text-align: center; }
.potential-item.best-bg { background: #fff7e6; border: 1rpx solid #ffe58f; }
.potential-arrow { flex-shrink: 0; }
.potential-arrow text { font-size: 32rpx; font-weight: 600; color: #d97706; }
.pot-label { font-size: 22rpx; color: #999; display: block; margin-bottom: 6rpx; }
.pot-value { font-size: 28rpx; font-weight: 600; color: #333; display: block; }
.pot-value.best { color: #fa8c16; }
.potential-desc { font-size: 24rpx; color: #999; line-height: 1.6; }

/* 科目状态 */
.subject-item { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid #f8f8f8; }
.subject-item:last-child { border-bottom: none; }
.subj-name { font-size: 28rpx; color: #333; }
.subj-badge { padding: 6rpx 20rpx; border-radius: 20rpx; }
.subj-badge text { font-size: 24rpx; font-weight: 600; }
.subj-badge.done { background: #f0f9ff; }
.subj-badge.done text { color: #1890ff; }
.subj-badge.pending { background: #fff7e6; }
.subj-badge.pending text { color: #fa8c16; }

/* 备考工具 */
.tools-grid { display: flex; gap: 20rpx; }
.tool-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10rpx; }
.tool-icon { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; }
.tool-icon text { color: #fff; font-size: 28rpx; font-weight: 600; }
.tool-label { font-size: 24rpx; color: #666; }

/* 错题本 */
.wrong-card { padding: 20rpx; border-radius: 16rpx; background: #f8f8f8; margin-bottom: 12rpx; }
.wrong-card.mastered { opacity: 0.6; border: 1rpx solid #d9f7be; }
.wrong-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-bottom: 10rpx; }
.wtag { font-size: 20rpx; padding: 4rpx 12rpx; border-radius: 6rpx; }
.wtag.blue { background: #e6f7ff; color: #1890ff; }
.wtag.purple { background: #f9f0ff; color: #722ed1; }
.wtag.red-bold { background: #fff1f0; color: #f5222d; font-weight: 600; }
.wtag.green { background: #f6ffed; color: #52c41a; }
.wrong-content { font-size: 26rpx; color: #333; line-height: 1.7; display: block; }
.wrong-analysis { margin-top: 12rpx; padding: 14rpx; background: #fff; border-radius: 10rpx; }
.wa-line { display: block; font-size: 22rpx; line-height: 1.8; }
.green-text { color: #52c41a; }
.red-text { color: #f5222d; }
.gray-text { color: #666; }
.wrong-actions { display: flex; gap: 12rpx; margin-top: 14rpx; }
.wa-btn { padding: 8rpx 24rpx; border-radius: 20rpx; background: #eee; }
.wa-btn text { font-size: 22rpx; color: #666; }
.wa-btn.green-btn { background: #f6ffed; border: 1rpx solid #b7eb8f; }
.wa-btn.green-btn text { color: #52c41a; font-weight: 600; }
.load-more-wrong { text-align: center; padding: 20rpx 0; }
.load-more-wrong text { font-size: 24rpx; color: #2e4a78; }
</style>

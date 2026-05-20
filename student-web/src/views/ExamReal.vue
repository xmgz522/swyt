<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-gray-800">历年真题</h1>
      <el-button type="danger" plain class="!rounded-lg" @click="router.push('/exam-records?type=real')">做题记录</el-button>
    </div>

    <!-- 搜索 -->
    <div class="mb-4">
      <el-input v-model="keyword" placeholder="搜索试卷名称" clearable class="!rounded-lg">
        <template #prefix><span class="text-gray-400">🔍</span></template>
      </el-input>
    </div>

    <!-- 科目筛选 -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <button
        v-for="tab in subjectTabs"
        :key="tab"
        :class="['px-4 py-1.5 rounded-full text-sm font-medium transition-all', activeSubject === tab ? 'bg-red-500 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-red-300']"
        @click="activeSubject = tab"
      >{{ tab }}</button>
    </div>

    <!-- 试卷列表 -->
    <div class="space-y-3 mb-6">
      <div
        v-for="(paper, idx) in filteredPapers"
        :key="paper.id"
        class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-all group"
      >
        <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 font-bold text-lg flex-shrink-0">
          {{ String(idx + 1).padStart(2, '0') }}
        </div>
        <div class="flex-1">
          <p class="font-bold text-gray-800 mb-1">{{ paper.title }}</p>
          <div class="flex gap-3 text-xs text-gray-400">
            <span v-if="paper.subject" class="text-red-400 font-medium">{{ paper.subject }}</span>
            <span>{{ paper.questionCount || '?' }} 题</span>
            <span>{{ paper.totalScore }} 分</span>
            <span v-if="paper.duration">{{ paper.duration }} 分钟</span>
          </div>
        </div>
        <el-tag type="danger" size="small" effect="light" class="mr-2">真题</el-tag>
        <el-button v-if="hasProgress(paper.id)" type="warning" class="!rounded-lg" @click="startExam(paper.id)">继续做题</el-button>
        <el-button v-else type="danger" class="!rounded-lg" @click="startExam(paper.id)">开始答题</el-button>
      </div>
    </div>

    <!-- 空态 -->
    <div v-if="!loading && filteredPapers.length === 0" class="text-center py-16">
      <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <span class="text-3xl">📜</span>
      </div>
      <p class="text-gray-400">暂无历年真题</p>
      <p class="text-xs text-gray-300 mt-1">老师还没有上传真题试卷</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const router = useRouter()
const store = useStudentStore()
const papers = ref<any[]>([])
const loading = ref(true)
const activeSubject = ref('全部')
const keyword = ref('')

const subjectTabs = computed(() => {
  const subjects = new Set<string>()
  papers.value.forEach(p => { if (p.subject) subjects.add(p.subject) })
  return ['全部', ...Array.from(subjects).sort()]
})

const filteredPapers = computed(() => {
  let list = papers.value
  if (activeSubject.value !== '全部') {
    list = list.filter(p => p.subject === activeSubject.value)
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(p => p.title.toLowerCase().includes(kw))
  }
  return list
})

onMounted(async () => {
  try {
    const data: any = await http.get('/exam/papers?type=real&bankType=triad')
    papers.value = (Array.isArray(data) ? data : []).filter((p: any) => p.isPublished)
  } catch {}
  loading.value = false
})

function hasProgress(paperId: number) {
  return !!localStorage.getItem(`exam_progress_${paperId}`)
}

function startExam(paperId: number) {
  if (!store.isLoggedIn) {
    ElMessage.warning('请先登录或填写个人信息')
    return
  }
  router.push(`/exam/${paperId}`)
}

</script>

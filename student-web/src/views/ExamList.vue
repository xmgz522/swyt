<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-gray-800">模拟测试</h1>
      <el-button type="primary" plain class="!rounded-lg" @click="router.push('/exam-records?type=mock')">做题记录</el-button>
    </div>

    <!-- 搜索 -->
    <div class="mb-4">
      <el-input v-model="keyword" placeholder="搜索试卷名称" clearable class="!rounded-lg">
        <template #prefix><span class="text-gray-400">🔍</span></template>
      </el-input>
    </div>

    <!-- 加载骨架 -->
    <div v-if="loading" class="space-y-3 mb-6 animate-pulse">
      <div v-for="i in 4" :key="i" class="bg-white rounded-xl h-20 border border-gray-50"></div>
    </div>

    <!-- 试卷列表 -->
    <div v-else class="space-y-3 mb-6">
      <div
        v-for="(paper, idx) in filteredPapers"
        :key="paper.id"
        class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-all group"
      >
        <div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 font-bold text-lg flex-shrink-0">
          {{ String(idx + 1).padStart(2, '0') }}
        </div>
        <div class="flex-1">
          <p class="font-bold text-gray-800 mb-1">{{ paper.title }}</p>
          <div class="flex gap-3 text-xs text-gray-400">
            <span>{{ paper.questionCount || '?' }} 题</span>
            <span>{{ paper.totalScore }} 分</span>
            <span v-if="paper.duration">{{ paper.duration }} 分钟</span>
          </div>
        </div>
        <el-button v-if="hasProgress(paper.id)" type="warning" class="!rounded-lg" @click="startExam(paper.id)">继续做题</el-button>
        <el-button v-else type="primary" class="!rounded-lg" @click="startExam(paper.id)">开始答题</el-button>
      </div>
    </div>

    <!-- 空态 -->
    <div v-if="!loading && filteredPapers.length === 0" class="text-center py-16">
      <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <span class="text-3xl text-gray-300">E</span>
      </div>
      <p class="text-gray-400">暂无可用模拟卷</p>
      <p class="text-xs text-gray-300 mt-1">老师还没有发布试卷，请稍后再来</p>
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
const keyword = ref('')

const filteredPapers = computed(() => {
  if (!keyword.value.trim()) return papers.value
  const kw = keyword.value.trim().toLowerCase()
  return papers.value.filter(p => p.title.toLowerCase().includes(kw))
})

onMounted(async () => {
  try {
    const data: any = await http.get('/exam/papers?type=mock&bankType=triad')
    papers.value = (Array.isArray(data) ? data : []).filter((p: any) => p.isPublished)
  } catch {}
  loading.value = false

})

function hasProgress(paperId: number) {
  return !!localStorage.getItem(`exam_progress_${paperId}`)
}

function startExam(paperId: number) {
  if (!store.isLoggedIn) {
    ElMessage.warning('请先填写个人信息')
    return
  }
  router.push(`/exam/${paperId}`)
}

</script>

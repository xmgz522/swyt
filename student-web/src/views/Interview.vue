<template>
  <div class="max-w-5xl mx-auto py-6">
    <!-- 顶部：标题 + 学校下拉框 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">面试题库</h1>
        <p class="text-sm text-gray-500 mt-1">选择目标院校，查看历年面试真题与参考答案</p>
      </div>
      <el-select
        v-model="selectedSchoolId"
        placeholder="请选择学校"
        style="width: 260px;"
        size="large"
        filterable
        :loading="loading"
        @change="onSchoolChange"
      >
        <el-option
          v-for="s in schoolList"
          :key="s.schoolId"
          :label="`${s.schoolName}（${s.questionCount}题）`"
          :value="s.schoolId"
        />
      </el-select>
    </div>

    <!-- 未选择学校 -->
    <div v-if="!selectedSchoolId" class="text-center py-20">
      <p class="text-5xl mb-4">🎤</p>
      <p class="text-gray-400">请在右上角下拉框中选择学校</p>
    </div>

    <!-- 已选学校 -->
    <div v-else>
      <!-- 分类标签 -->
      <div v-if="categories.length > 1" class="flex gap-2 mb-4 flex-wrap">
        <el-tag
          :type="activeCat === '' ? '' : 'info'"
          :effect="activeCat === '' ? 'dark' : 'plain'"
          class="cursor-pointer"
          @click="switchCat('')"
        >全部</el-tag>
        <el-tag
          v-for="c in categories"
          :key="c.category"
          :type="activeCat === c.category ? '' : 'info'"
          :effect="activeCat === c.category ? 'dark' : 'plain'"
          class="cursor-pointer"
          @click="switchCat(c.category)"
        >{{ c.category }} ({{ c.count }})</el-tag>
      </div>

      <div v-if="loadingQ" class="text-center py-16 text-gray-400">加载中...</div>
      <div v-else-if="questions.length === 0" class="text-center py-16">
        <p class="text-4xl mb-3">📝</p>
        <p class="text-gray-400">该分类暂无题目</p>
      </div>
      <div v-else class="space-y-4">
        <div v-for="(q, idx) in questions" :key="q.id" class="q-card">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-base font-bold text-gray-700">{{ idx + 1 }}.</span>
            <el-tag v-if="q.category" size="small" type="primary">{{ q.category }}</el-tag>
            <el-tag v-if="q.difficulty" size="small" :type="diffType[q.difficulty]">{{ diffLabel[q.difficulty] }}</el-tag>
            <el-tag v-if="q.year" size="small" type="info">{{ q.year }}</el-tag>
          </div>
          <p class="text-[15px] text-gray-800 leading-relaxed">{{ q.question }}</p>
          <div class="mt-3">
            <el-button size="small" text type="primary" @click="toggleAnswer(q.id)">
              {{ expandedIds[q.id] ? '收起答案 ▲' : '查看参考答案 ▼' }}
            </el-button>
          </div>
          <div v-if="expandedIds[q.id]" class="mt-3 space-y-3">
            <div class="answer-box">
              <p class="font-semibold text-blue-600 text-sm mb-1">📝 参考答案</p>
              <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{{ q.answer }}</p>
            </div>
            <div v-if="q.tips" class="tips-box">
              <p class="font-semibold text-amber-600 text-sm mb-1">💡 答题要点</p>
              <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ q.tips }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import http from '@/utils/api'

const diffLabel: Record<string, string> = { easy: '简单', medium: '中等', hard: '较难' }
const diffType: Record<string, string> = { easy: 'success', medium: 'warning', hard: 'danger' }

const loading = ref(true)
const loadingQ = ref(false)
const schoolList = ref<any[]>([])
const selectedSchoolId = ref<number | ''>('')
const categories = ref<any[]>([])
const activeCat = ref('')
const questions = ref<any[]>([])
const expandedIds = reactive<Record<number, boolean>>({})

onMounted(async () => {
  try {
    const data: any = await http.get('/interview/schools')
    schoolList.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

async function onSchoolChange(schoolId: number) {
  activeCat.value = ''
  loadingQ.value = true
  try {
    const [cats, qs]: any = await Promise.all([
      http.get(`/interview/schools/${schoolId}/categories`),
      http.get(`/interview/schools/${schoolId}/questions`),
    ])
    categories.value = cats || []
    questions.value = qs || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingQ.value = false
  }
}

async function switchCat(cat: string) {
  activeCat.value = cat
  loadingQ.value = true
  try {
    const data: any = await http.get(`/interview/schools/${selectedSchoolId.value}/questions`, { params: cat ? { category: cat } : {} })
    questions.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loadingQ.value = false
  }
}

function toggleAnswer(id: number) {
  expandedIds[id] = !expandedIds[id]
}
</script>

<style scoped>
.q-card {
  @apply bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow;
}
.answer-box {
  @apply bg-blue-50 rounded-lg p-4 border border-blue-100;
}
.tips-box {
  @apply bg-amber-50 rounded-lg p-4 border border-amber-100;
}
</style>

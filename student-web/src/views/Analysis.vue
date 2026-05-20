<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-2">薄弱项分析</h1>
    <p class="text-sm text-gray-500 mb-6">统计范围包含模拟测试、历年真题和考点练习的客观题答题记录。</p>

    <div v-if="loading" class="text-center py-16 text-gray-400">
      <div class="w-10 h-10 border-3 border-red-300 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p>正在分析做题数据...</p>
    </div>

    <template v-else-if="analysis.totalQuestions > 0">
      <!-- 总览 -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 text-center">
          <p class="text-3xl font-bold text-primary-500">{{ analysis.totalExams }}</p>
          <p class="text-xs text-gray-400 mt-1">完成试卷</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 text-center">
          <p class="text-3xl font-bold text-gray-700">{{ analysis.totalQuestions }}</p>
          <p class="text-xs text-gray-400 mt-1">答题总数</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 text-center">
          <p class="text-3xl font-bold text-green-500">{{ analysis.totalCorrect }}</p>
          <p class="text-xs text-gray-400 mt-1">答对数量</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 text-center">
          <p :class="['text-3xl font-bold', analysis.overallAccuracy >= 80 ? 'text-green-500' : analysis.overallAccuracy >= 60 ? 'text-orange-500' : 'text-red-500']">
            {{ analysis.overallAccuracy }}%
          </p>
          <p class="text-xs text-gray-400 mt-1">总正确率</p>
        </div>
      </div>

      <!-- AI 总结 -->
      <div v-if="analysis.summary" class="bg-white border border-orange-100 rounded-xl p-6 mb-6">
        <div class="flex items-center gap-2 mb-3">
          <span class="bg-orange-50 text-orange-600 text-xs font-bold px-2.5 py-0.5 rounded">综合</span>
          <span class="text-base font-bold text-gray-700">答题表现总结</span>
        </div>
        <p class="text-sm text-gray-600 leading-relaxed">{{ analysis.summary }}</p>
      </div>

      <div class="grid grid-cols-2 gap-6 mb-6">
        <!-- 知识点掌握 -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50">
          <h3 class="text-base font-bold text-gray-700 mb-4">知识点掌握情况</h3>
          <div class="space-y-4">
            <div v-for="kp in analysis.knowledgePoints" :key="kp.name">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-gray-600 font-medium">{{ kp.name }}</span>
                <span :class="['text-sm font-bold', kp.accuracy >= 80 ? 'text-green-500' : kp.accuracy >= 60 ? 'text-orange-500' : 'text-red-500']">
                  {{ kp.accuracy }}% ({{ kp.correct }}/{{ kp.total }})
                </span>
              </div>
              <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" :style="{ width: kp.accuracy + '%', background: kp.accuracy >= 80 ? '#52c41a' : kp.accuracy >= 60 ? '#fa8c16' : '#f5222d' }"></div>
              </div>
            </div>
          </div>
          <p v-if="!analysis.knowledgePoints?.length" class="text-center text-gray-300 py-6">暂无知识点数据</p>
        </div>

        <!-- 建议 + 薄弱 -->
        <div class="space-y-6">
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50">
            <h3 class="text-base font-bold text-gray-700 mb-4">改进建议</h3>
            <div class="space-y-3">
              <div v-for="(s, idx) in analysis.suggestions" :key="idx" class="flex items-start gap-2">
                <span :class="['w-2 h-2 rounded-full mt-1.5 flex-shrink-0', idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-400' : 'bg-green-500']"></span>
                <p class="text-sm text-gray-600 leading-relaxed">{{ s }}</p>
              </div>
            </div>
            <p v-if="!analysis.suggestions?.length" class="text-center text-gray-300 py-4">暂无建议</p>
          </div>

          <div v-if="analysis.weak?.length" class="bg-white rounded-xl p-6 shadow-sm border-2 border-red-100">
            <div class="flex items-center gap-2 mb-4">
              <h3 class="text-base font-bold text-gray-700">薄弱知识点</h3>
              <span class="bg-red-50 text-red-500 text-xs font-bold px-2 py-0.5 rounded">需重点关注</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="w in analysis.weak" :key="w" class="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border border-red-200">
                {{ w }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 空态 -->
    <div v-else class="text-center py-16">
      <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <span class="text-3xl">--</span>
      </div>
      <p class="font-medium text-gray-600 mb-1">暂无做题数据</p>
      <p class="text-sm text-gray-400">完成模拟测试、历年真题或考点练习后，这里会汇总你的薄弱项</p>
      <router-link to="/exams" class="inline-block mt-4 text-sm text-primary-500 hover:text-primary-600 font-medium">去做模拟卷 →</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const store = useStudentStore()
const loading = ref(true)
const analysis = ref<any>({ totalExams: 0, totalQuestions: 0, totalCorrect: 0, overallAccuracy: 0, knowledgePoints: [], suggestions: [], summary: '', weak: [] })

onMounted(async () => {
  if (!store.studentId) { loading.value = false; return }
  try {
    const res: any = await http.get(`/exam/analysis/${store.studentId}?bankType=triad`)
    if (res.success) analysis.value = res.data
  } catch {}
  loading.value = false
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- 搜索框 -->
    <div class="flex gap-3 mb-6">
      <el-input
        v-model="keyword"
        placeholder="搜索院校、题目..."
        size="large"
        clearable
        @keyup.enter="doSearch"
        class="flex-1"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" size="large" @click="doSearch">搜索</el-button>
    </div>

    <!-- Tab -->
    <el-radio-group v-model="tab" class="mb-4" @change="doSearch">
      <el-radio-button value="school">院校</el-radio-button>
      <el-radio-button value="question">题目</el-radio-button>
    </el-radio-group>

    <el-skeleton :loading="loading" :rows="6" animated>
      <template #default>
        <el-empty v-if="results.length === 0 && searched" description="未找到相关结果" />

        <!-- 院校 -->
        <div v-if="tab === 'school'" class="space-y-3">
          <el-card v-for="s in results" :key="s.id" shadow="hover" class="cursor-pointer" @click="$router.push(`/school/${s.id}`)">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-bold text-lg">{{ s.name }}</span>
                <el-tag v-if="s.region" size="small" class="ml-2">{{ s.region }}</el-tag>
                <el-tag v-if="s.type" size="small" type="warning" class="ml-1">{{ s.type }}</el-tag>
              </div>
              <span v-if="s.gradeRequirements" class="text-orange-500 text-sm">{{ s.gradeRequirements }}</span>
            </div>
            <p v-if="s.description" class="text-gray-500 text-sm mt-2">{{ s.description }}</p>
          </el-card>
        </div>

        <!-- 题目 -->
        <div v-if="tab === 'question'" class="space-y-3">
          <el-card v-for="q in results" :key="q.id" shadow="hover">
            <div class="flex gap-2 mb-2 flex-wrap">
              <el-tag size="small" type="primary">{{ typeMap[q.type] || q.type }}</el-tag>
              <el-tag v-if="q.subject" size="small" type="warning">{{ q.subject }}</el-tag>
              <el-tag v-if="q.knowledgePoint" size="small" type="success">{{ q.knowledgePoint }}</el-tag>
            </div>
            <p class="text-gray-800">{{ q.content }}</p>
          </el-card>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import http from '@/utils/api'

const typeMap: Record<string, string> = { single_choice: '单选', multi_choice: '多选', judge: '判断', fill: '填空', short_answer: '简答' }
const keyword = ref('')
const tab = ref('school')
const results = ref<any[]>([])
const loading = ref(false)
const searched = ref(false)

async function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  loading.value = true
  searched.value = true
  try {
    if (tab.value === 'school') {
      results.value = await http.get('/schools', { params: { keyword: kw } }) as any
    } else {
      results.value = await http.get('/exam/questions', { params: { keyword: kw } }) as any
    }
    if (!Array.isArray(results.value)) results.value = []
  } catch { results.value = [] }
  loading.value = false
}
</script>

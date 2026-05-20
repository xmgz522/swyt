<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-gray-800">政策中心</h1>
      <span class="text-xs text-gray-400">三位一体招生政策 · 一站了解</span>
    </div>

    <div>
      <!-- 分类标签 -->
      <div class="flex gap-2 flex-wrap mb-6">
        <button
          v-for="t in tabs"
          :key="t"
          :class="['px-4 py-2 rounded-full text-sm font-medium transition-all border',
            activeTab === t
              ? 'bg-primary-500 text-white border-primary-500'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50']"
          @click="activeTab = t"
        >{{ t }}</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20 text-gray-400">
        <div class="inline-block w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-sm">加载政策列表...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredList.length === 0" class="text-center py-20 text-gray-300">
        <p class="text-lg mb-1">暂无政策内容</p>
        <p class="text-sm">管理员尚未发布该分类政策</p>
      </div>

      <!-- 政策卡片 -->
      <div v-else class="grid grid-cols-2 gap-4">
        <div
          v-for="p in filteredList"
          :key="p.id"
          class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
        >
          <!-- 头部 -->
          <div
            class="px-5 py-4 cursor-pointer select-none flex items-start gap-3"
            @click="toggle(p.id)"
          >
            <span :class="['text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5', tagClass(p.tag)]">{{ p.tag }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-800 leading-snug">{{ p.title }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ p.publishDate || '' }}</p>
            </div>
            <span class="text-gray-300 text-xs flex-shrink-0 transition-transform" :class="expanded === p.id ? 'rotate-90' : ''">▶</span>
          </div>

          <!-- 展开内容 -->
          <div v-if="expanded === p.id" class="px-5 pb-5 border-t border-gray-50 bg-gray-50/50">
            <p class="text-sm text-gray-600 leading-relaxed mt-4 whitespace-pre-line">{{ p.content }}</p>
            <a
              v-if="p.url"
              :href="p.url"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1 mt-4 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium px-3 py-1.5 rounded-lg transition-all"
            >查看原文 →</a>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-gray-300 mt-8">* 政策信息仅供参考，以浙江省教育考试院官方公告为准</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import http from '@/utils/api'

const policies = ref<any[]>([])
const loading = ref(true)
const activeTab = ref('全部')
const expanded = ref<number | null>(null)

const tabs = ['全部', '招生政策', '报名条件', '学考政策', '校考说明', '志愿填报', '时间节点']

const filteredList = computed(() => {
  if (activeTab.value === '全部') return policies.value
  return policies.value.filter(p => p.tag === activeTab.value)
})

function tagClass(tag: string): string {
  const map: Record<string, string> = {
    '招生政策': 'bg-blue-100 text-blue-700',
    '报名条件': 'bg-green-100 text-green-700',
    '学考政策': 'bg-orange-100 text-orange-700',
    '校考说明': 'bg-purple-100 text-purple-700',
    '志愿填报': 'bg-red-100 text-red-700',
    '时间节点': 'bg-gray-100 text-gray-700',
  }
  return map[tag] || 'bg-gray-100 text-gray-600'
}

function toggle(id: number) {
  expanded.value = expanded.value === id ? null : id
}

onMounted(async () => {
  try {
    const res: any = await http.get('/policies/active')
    policies.value = Array.isArray(res) ? res : []
  } catch { policies.value = [] }
  loading.value = false
})
</script>

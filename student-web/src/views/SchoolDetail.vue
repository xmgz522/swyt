<template>
  <div>
    <el-button text @click="$router.back()" class="mb-4 !text-gray-400">← 返回推荐列表</el-button>

    <div v-if="!school" class="text-center py-20 text-gray-300">加载中...</div>

    <div v-else>
      <!-- Hero -->
      <div class="bg-gradient-to-r from-primary-500 via-accent to-purple-400 rounded-2xl p-8 text-white mb-6 relative">
        <button
          class="absolute top-5 right-5 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-full transition-all flex items-center gap-1.5"
          @click="toggleSelect"
        >
          <span>{{ isSelected ? '★' : '☆' }}</span>
          <span>{{ isSelected ? '已加入我的院校' : '加入我的院校' }}</span>
        </button>
        <h1 class="text-2xl font-bold mb-2">{{ school.name }}</h1>
        <div class="flex gap-2">
          <span class="bg-white/20 text-sm px-3 py-1 rounded-full">{{ school.region || '浙江' }}</span>
          <span class="bg-white/20 text-sm px-3 py-1 rounded-full">{{ school.type || '综合' }}</span>
        </div>
      </div>

      <!-- 信息卡 -->
      <div class="space-y-4">
        <InfoCard v-if="school.description" title="学校简介" color="bg-primary-500" :content="school.description" />
        <InfoCard v-if="school.requirements" title="招生要求" color="bg-rose-500" :content="school.requirements" />
        <InfoCard v-if="school.gradeRequirements" title="学考要求" color="bg-orange-500" :content="school.gradeRequirements" />
        <InfoCard v-if="school.interviewType" title="面试形式" color="bg-blue-500" :content="school.interviewType" />
        <InfoCard v-if="school.suitableFor" title="适合人群" color="bg-green-500" :content="school.suitableFor" />

        <div v-if="school.advice" class="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6">
          <h3 class="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>报考建议
          </h3>
          <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ school.advice }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineComponent, h } from 'vue'
import { useRoute } from 'vue-router'
import http from '@/utils/api'

const route = useRoute()
const school = ref<any>(null)
const isSelected = ref(false)

function loadSelected(): any[] {
  try {
    const s = localStorage.getItem('selectedSchools')
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

function toggleSelect() {
  if (!school.value) return
  const list: any[] = loadSelected()
  const idx = list.findIndex(s => s.id === school.value.id)
  if (idx >= 0) {
    list.splice(idx, 1)
    isSelected.value = false
  } else {
    list.push({
      id: school.value.id,
      name: school.value.name,
      region: school.value.region,
      type: school.value.type,
      gradeRequirements: school.value.gradeRequirements,
    })
    isSelected.value = true
  }
  localStorage.setItem('selectedSchools', JSON.stringify(list))
}

// 小组件
const InfoCard = defineComponent({
  props: { title: String, color: String, content: String },
  setup(props) {
    return () => h('div', { class: 'bg-white rounded-xl p-6 shadow-sm border border-gray-50' }, [
      h('h3', { class: 'text-sm font-bold text-gray-700 mb-2 flex items-center gap-2' }, [
        h('span', { class: `w-2.5 h-2.5 rounded-full ${props.color}` }),
        props.title,
      ]),
      h('p', { class: 'text-sm text-gray-600 leading-relaxed whitespace-pre-wrap' }, props.content),
    ])
  },
})

onMounted(async () => {
  const id = route.params.id
  if (id) {
    school.value = await http.get(`/schools/${id}`)
    isSelected.value = loadSelected().some(s => s.id === school.value?.id)
  }
})
</script>

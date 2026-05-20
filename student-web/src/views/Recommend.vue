<template>
  <div>
    <!-- 顶部模式切换 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        <button
          :class="['px-5 py-2 rounded-lg text-sm font-medium transition-all', mode === 'recommend' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
          @click="mode = 'recommend'"
        >推荐院校</button>
        <button
          :class="['px-5 py-2 rounded-lg text-sm font-medium transition-all', mode === 'all' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
          @click="switchToAll"
        >全部院校</button>
      </div>
      <div class="flex items-center gap-2" v-if="store.profile">
        <span v-if="store.profile.gradeA" class="text-xs font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">{{ store.profile.gradeA }}A</span>
        <span v-if="store.profile.gradeB" class="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{{ store.profile.gradeB }}B</span>
        <span v-if="store.profile.gradeC" class="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{{ store.profile.gradeC }}C</span>
      </div>
    </div>

    <!-- ========= 推荐院校模式 ========= -->
    <template v-if="mode === 'recommend'">
      <!-- 未登录 -->
      <div v-if="!store.isLoggedIn" class="bg-white rounded-xl p-16 text-center shadow-sm">
        <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl text-gray-300">?</span>
        </div>
        <p class="text-gray-500 mb-2">请先填写信息后获取推荐</p>
        <router-link to="/profile">
          <el-button type="primary" class="!rounded-lg">去填写</el-button>
        </router-link>
      </div>

      <div v-else>
        <!-- 筛选 Tab -->
        <div class="flex gap-2 mb-4">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="['px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === tab.value ? tab.activeClass : 'bg-white text-gray-500 hover:bg-gray-50']"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
            <span v-if="countByLevel(tab.value)" class="ml-1 text-xs opacity-70">({{ countByLevel(tab.value) }})</span>
          </button>
        </div>

        <!-- 潜力提示 -->
        <div v-if="meta.remaining > 0" class="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4 flex items-start gap-3">
          <div class="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">★</div>
          <div>
            <p class="text-sm text-purple-700">还有{{ meta.remaining }}门未考，潜力预估 <b>{{ meta.potentialA }}A{{ meta.potentialB }}B</b>，已为你匹配潜力院校</p>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-20">
          <el-icon class="is-loading text-primary-500" :size="32"><Loading /></el-icon>
          <p class="text-sm text-gray-400 mt-3">正在智能匹配院校...</p>
        </div>

        <!-- 院校列表 -->
        <div v-else class="space-y-3">
          <div
            v-for="item in filteredList"
            :key="item.school.id"
            class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
            @click="$router.push(`/school/${item.school.id}`)"
          >
            <div :class="['w-1.5 h-14 rounded-full', levelColor(item.level)]"></div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-gray-800">{{ item.school.name }}</span>
                <span :class="['text-xs px-2 py-0.5 rounded-full text-white', levelBg(item.level)]">{{ item.levelText }}</span>
              </div>
              <div class="flex gap-2">
                <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{{ item.school.region || '浙江' }}</span>
                <span class="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{{ item.school.type || '综合' }}</span>
                <span v-if="item.requirement" class="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">≥{{ item.requirement.minA }}A{{ item.requirement.minB }}B</span>
              </div>
              <div v-if="item.isPotential && item.potentialGrade" class="flex items-center gap-1.5 mt-1.5 bg-purple-50 rounded-lg px-3 py-1 w-fit">
                <span class="text-xs text-gray-400 font-medium">当前 {{ item.currentGrade }}</span>
                <span class="text-xs text-purple-500 font-bold">→</span>
                <span class="text-xs text-purple-600 font-bold">预计 {{ item.potentialGrade }}</span>
              </div>
              <p v-if="item.reason" class="text-xs text-gray-400 mt-1">{{ item.reason }}</p>
            </div>
            <button
              type="button"
              :class="['target-btn', isSelectedSchool(item.school.id) ? 'target-btn-active' : '']"
              @click.stop="toggleSelectedSchool(item.school)"
            >
              {{ isSelectedSchool(item.school.id) ? '已加入' : '加入目标' }}
            </button>
            <el-icon class="text-gray-300 group-hover:text-primary-500 transition-colors"><ArrowRight /></el-icon>
          </div>

          <div v-if="filteredList.length === 0" class="text-center py-16 text-gray-300 text-sm">
            该分类下暂无匹配院校
          </div>
        </div>
      </div>
    </template>

    <!-- ========= 全部院校模式 ========= -->
    <template v-if="mode === 'all'">
      <!-- 搜索框 -->
      <div class="mb-4">
        <input
          v-model="searchText"
          type="text"
          placeholder="搜索院校名称、地区..."
          class="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
        />
      </div>

      <!-- 地区筛选 -->
      <div class="flex flex-wrap gap-2 mb-4" v-if="allRegions.length > 1">
        <button
          v-for="r in ['全部', ...allRegions]"
          :key="r"
          :class="['px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer',
            filterRegion === r ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50']"
          @click="filterRegion = r"
        >{{ r }}</button>
      </div>

      <!-- Loading -->
      <div v-if="allLoading" class="text-center py-20">
        <el-icon class="is-loading text-primary-500" :size="32"><Loading /></el-icon>
        <p class="text-sm text-gray-400 mt-3">加载院校列表...</p>
      </div>

      <!-- 院校列表 -->
      <div v-else class="space-y-3">
        <div
          v-for="school in filteredAllSchools"
          :key="school.id"
          class="bg-white rounded-xl p-5 shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
          @click="$router.push(`/school/${school.id}`)"
        >
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center flex-shrink-0">
            <span class="text-primary-600 font-bold text-sm">{{ school.name?.substring(0, 1) }}</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-gray-800">{{ school.name }}</span>
              <span v-if="school.type" class="text-xs text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">{{ school.type }}</span>
            </div>
            <div class="flex gap-2">
              <span class="text-xs text-gray-400">{{ school.region || '浙江' }}</span>
              <span v-if="school.gradeRequirements" class="text-xs text-orange-500">学考要求：{{ school.gradeRequirements }}</span>
            </div>
            <p v-if="school.description" class="text-xs text-gray-400 mt-1 line-clamp-1">{{ school.description }}</p>
          </div>
          <button
            type="button"
            :class="['target-btn', isSelectedSchool(school.id) ? 'target-btn-active' : '']"
            @click.stop="toggleSelectedSchool(school)"
          >
            {{ isSelectedSchool(school.id) ? '已加入' : '加入目标' }}
          </button>
          <el-icon class="text-gray-300 group-hover:text-primary-500 transition-colors"><ArrowRight /></el-icon>
        </div>

        <div v-if="filteredAllSchools.length === 0" class="text-center py-16 text-gray-300 text-sm">
          没有找到匹配的院校
        </div>

        <p class="text-center text-xs text-gray-300 py-4">共 {{ filteredAllSchools.length }} 所院校</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loading, ArrowRight } from '@element-plus/icons-vue'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const store = useStudentStore()
const mode = ref<'recommend' | 'all'>('recommend')
const recommendations = ref<any[]>([])
const loading = ref(false)
const activeTab = ref('all')
const meta = ref<any>({ remaining: 0, potentialA: 0, potentialB: 0 })

// 全部院校
const allSchools = ref<any[]>([])
const allLoading = ref(false)
const searchText = ref('')
const filterRegion = ref('全部')
const selectedSchools = ref<any[]>([])

const tabs = [
  { value: 'all', label: '全部', activeClass: 'bg-primary-500 text-white' },
  { value: 'reach', label: '冲刺', activeClass: 'bg-orange-500 text-white' },
  { value: 'stable', label: '稳妥', activeClass: 'bg-blue-500 text-white' },
  { value: 'safe', label: '保底', activeClass: 'bg-green-500 text-white' },
  { value: 'potential', label: '潜力', activeClass: 'bg-purple-500 text-white' },
]

const filteredList = computed(() => {
  if (activeTab.value === 'all') return recommendations.value
  return recommendations.value.filter(r => r.level === activeTab.value)
})

function countByLevel(level: string) {
  if (level === 'all') return recommendations.value.length
  return recommendations.value.filter(r => r.level === level).length
}

function levelColor(l: string) {
  return l === 'reach' ? 'bg-orange-500' : l === 'stable' ? 'bg-blue-500' : l === 'potential' ? 'bg-purple-500' : 'bg-green-500'
}
function levelBg(l: string) {
  return l === 'reach' ? 'bg-orange-500' : l === 'stable' ? 'bg-blue-500' : l === 'potential' ? 'bg-purple-500' : 'bg-green-500'
}

function loadSelectedSchools() {
  try {
    const saved = localStorage.getItem('selectedSchools')
    selectedSchools.value = saved ? JSON.parse(saved) : []
  } catch {
    selectedSchools.value = []
  }
}

function saveSelectedSchools() {
  localStorage.setItem('selectedSchools', JSON.stringify(selectedSchools.value))
}

function isSelectedSchool(id: number) {
  return selectedSchools.value.some(s => s.id === id)
}

function toggleSelectedSchool(school: any) {
  if (isSelectedSchool(school.id)) {
    selectedSchools.value = selectedSchools.value.filter(s => s.id !== school.id)
  } else {
    selectedSchools.value = [...selectedSchools.value, school]
  }
  saveSelectedSchools()
}

// 全部院校：地区列表
const allRegions = computed(() => {
  const regions = new Set<string>()
  allSchools.value.forEach(s => { if (s.region) regions.add(s.region) })
  return [...regions].sort()
})

// 全部院校：筛选
const filteredAllSchools = computed(() => {
  let list = allSchools.value
  if (filterRegion.value !== '全部') {
    list = list.filter(s => s.region === filterRegion.value)
  }
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    list = list.filter(s =>
      (s.name || '').toLowerCase().includes(kw) ||
      (s.region || '').toLowerCase().includes(kw) ||
      (s.type || '').toLowerCase().includes(kw) ||
      (s.description || '').toLowerCase().includes(kw)
    )
  }
  return list
})

async function switchToAll() {
  mode.value = 'all'
  if (allSchools.value.length === 0) {
    allLoading.value = true
    try {
      const res: any = await http.get('/schools')
      allSchools.value = Array.isArray(res) ? res.filter((s: any) => s.isActive) : []
    } catch {}
    allLoading.value = false
  }
}

onMounted(async () => {
  loadSelectedSchools()
  if (!store.isLoggedIn) return
  loading.value = true
  try {
    const res: any = await http.get(`/recommend/student/${store.studentId}`)
    if (res.success) {
      recommendations.value = res.data || []
      if (res.meta) meta.value = res.meta
    }
  } catch {}
  loading.value = false
})
</script>

<style scoped>
.target-btn {
  @apply flex-shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors;
}
.target-btn-active {
  @apply border-green-100 bg-green-50 text-green-600 hover:bg-green-100;
}
</style>

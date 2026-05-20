<template>
  <div class="p-6 max-w-5xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">专业解析</h2>

    <!-- 搜索和筛选 -->
    <div class="flex gap-3 mb-5 flex-wrap">
      <el-input v-model="keyword" placeholder="搜索专业名称" clearable style="width: 240px;" @keyup.enter="search" @clear="search">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="activeCategory" placeholder="学科门类" clearable style="width: 160px;" @change="search">
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
    </div>

    <!-- 列表 -->
    <div v-if="loading && list.length === 0" class="text-center text-gray-400 py-20">加载中...</div>

    <div class="grid gap-4">
      <div v-for="item in list" :key="item.id"
        class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        @click="openDetail(item)">
        <div class="flex items-center justify-between mb-2">
          <span class="text-lg font-bold text-gray-800">{{ item.name }}</span>
          <el-tag v-if="item.category" size="small" type="primary" effect="plain">{{ item.category }}</el-tag>
        </div>
        <div class="flex gap-2 mb-2 flex-wrap">
          <el-tag v-if="item.duration" size="small" type="info">{{ item.duration }}</el-tag>
          <el-tag v-if="item.degree" size="small" type="info">{{ item.degree }}</el-tag>
          <el-tag v-if="item.code" size="small" type="info">{{ item.code }}</el-tag>
        </div>
        <p v-if="item.description" class="text-sm text-gray-500 line-clamp-2">{{ item.description }}</p>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="list.length > 0 && list.length < total" class="text-center mt-6">
      <el-button @click="loadMore" :loading="loading">加载更多</el-button>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && list.length === 0" class="text-center text-gray-400 py-20">
      <p class="text-4xl mb-3">📚</p>
      <p>暂无专业数据</p>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetail" :title="detail?.name || '专业详情'" width="700px" top="5vh">
      <template v-if="detail">
        <div class="flex gap-2 mb-4 flex-wrap">
          <el-tag v-if="detail.category" type="primary">{{ detail.category }}</el-tag>
          <el-tag v-if="detail.code" type="info">{{ detail.code }}</el-tag>
          <el-tag v-if="detail.duration" type="info">{{ detail.duration }}</el-tag>
          <el-tag v-if="detail.degree" type="info">{{ detail.degree }}</el-tag>
        </div>

        <div v-if="detail.description" class="mb-4">
          <h4 class="font-bold text-gray-700 mb-1">📖 专业简介</h4>
          <p class="text-gray-600 text-sm leading-relaxed">{{ detail.description }}</p>
        </div>

        <div v-if="detailCourses.length" class="mb-4">
          <h4 class="font-bold text-gray-700 mb-2">📚 核心课程</h4>
          <div class="flex gap-2 flex-wrap">
            <el-tag v-for="(c, i) in detailCourses" :key="i" size="small" effect="plain">{{ c }}</el-tag>
          </div>
        </div>

        <div v-if="detail.employment" class="mb-4">
          <h4 class="font-bold text-gray-700 mb-1">💼 就业方向</h4>
          <p class="text-gray-600 text-sm leading-relaxed">{{ detail.employment }}</p>
        </div>

        <div v-if="detail.suitableFor" class="mb-4">
          <h4 class="font-bold text-gray-700 mb-1">🎯 适合人群</h4>
          <p class="text-gray-600 text-sm leading-relaxed">{{ detail.suitableFor }}</p>
        </div>

        <div v-if="detail.relatedSchools" class="mb-4">
          <h4 class="font-bold text-gray-700 mb-1">🏫 相关院校</h4>
          <p class="text-gray-600 text-sm leading-relaxed">{{ detail.relatedSchools }}</p>
        </div>

        <div v-if="detail.remark" class="mb-4">
          <h4 class="font-bold text-gray-700 mb-1">📝 补充说明</h4>
          <p class="text-gray-600 text-sm leading-relaxed">{{ detail.remark }}</p>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import http from '@/utils/api'

const keyword = ref('')
const activeCategory = ref('')
const categories = ref<string[]>([])
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const showDetail = ref(false)
const detail = ref<any>(null)

const detailCourses = computed(() => {
  if (!detail.value?.courses) return []
  try {
    const parsed = JSON.parse(detail.value.courses)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  return detail.value.courses.split(/[,，、]/).filter(Boolean)
})

onMounted(async () => {
  try {
    const res: any = await http.get('/majors/categories')
    categories.value = Array.isArray(res) ? res : []
  } catch {}
  await loadList()
})

async function loadList(reset = true) {
  if (reset) { page.value = 1; list.value = [] }
  loading.value = true
  try {
    const params: string[] = [`page=${page.value}`, 'pageSize=20']
    if (keyword.value) params.push(`keyword=${encodeURIComponent(keyword.value)}`)
    if (activeCategory.value) params.push(`category=${encodeURIComponent(activeCategory.value)}`)
    const res: any = await http.get(`/majors?${params.join('&')}`)
    if (reset) {
      list.value = res.data || []
    } else {
      list.value = [...list.value, ...(res.data || [])]
    }
    total.value = res.total || 0
  } catch {}
  loading.value = false
}

function search() { loadList() }
function loadMore() { page.value++; loadList(false) }

function openDetail(item: any) {
  detail.value = item
  showDetail.value = true
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

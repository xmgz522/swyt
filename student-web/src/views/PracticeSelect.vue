<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-6">考点练题</h1>

    <div class="grid grid-cols-3 gap-6">
      <!-- 左侧：选科目 + 选题型 -->
      <div class="col-span-2 space-y-5">
        <!-- 选学科 -->
        <section class="bg-white rounded-2xl shadow-sm p-6">
          <div class="flex items-center gap-3 mb-5">
            <span class="w-1 h-5 rounded bg-blue-500"></span>
            <h3 class="text-base font-bold text-gray-800">选择方向</h3>
          </div>
          <div class="grid grid-cols-5 gap-3">
            <button
              v-for="s in subjects"
              :key="s.value"
              type="button"
              :class="[
                'flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all',
                selectedSubject === s.value
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
              ]"
              @click="selectSubject(s.value)"
            >
              <span class="text-sm font-medium" :class="selectedSubject === s.value ? 'text-blue-600' : 'text-gray-700'">{{ s.label }}</span>
            </button>
          </div>
        </section>

        <!-- 选题型 -->
        <section class="bg-white rounded-2xl shadow-sm p-6">
          <div class="flex items-center gap-3 mb-5">
            <span class="w-1 h-5 rounded bg-orange-500"></span>
            <h3 class="text-base font-bold text-gray-800">选择题型</h3>
          </div>
          <div class="grid grid-cols-6 gap-3">
            <button
              v-for="t in questionTypes"
              :key="t.value"
              type="button"
              :class="[
                'py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all text-center',
                selectedType === t.value
                  ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                  : 'border-gray-100 bg-gray-50 hover:border-gray-200 text-gray-700'
              ]"
              @click="selectedType = t.value"
            >
              {{ t.label }}
            </button>
          </div>
        </section>

        <!-- 题目统计 -->
        <section v-if="selectedSubject" class="bg-white rounded-2xl shadow-sm p-6">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-1 h-5 rounded bg-purple-500"></span>
            <h3 class="text-base font-bold text-gray-800">{{ selectedSubject }}</h3>
            <span v-if="!loadingKP && categories.length > 0" class="text-sm text-gray-400">共 {{ categories[0]?.count || 0 }} 道题</span>
          </div>
          <div v-if="loadingKP" class="text-sm text-gray-400">加载中...</div>
          <div v-else-if="categories.length === 0" class="text-sm text-gray-400">该方向暂无题目</div>
          <p v-else class="text-sm text-gray-500">选好题型和题量后点击右侧"开始练题"即可</p>
        </section>
      </div>

      <!-- 右侧：设置 + 开始 -->
      <div class="col-span-1 space-y-5">
        <!-- 练习设置 -->
        <section class="bg-white rounded-2xl shadow-sm p-6">
          <div class="flex items-center gap-3 mb-5">
            <span class="w-1 h-5 rounded bg-green-500"></span>
            <h3 class="text-base font-bold text-gray-800">练习设置</h3>
          </div>

          <div class="space-y-4">
            <div>
              <p class="text-sm text-gray-500 mb-2">题目数量</p>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="n in countOptions"
                  :key="n"
                  type="button"
                  :class="[
                    'py-2 rounded-lg border text-sm font-medium transition-all',
                    questionCount === n
                      ? 'border-green-500 bg-green-50 text-green-600'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  ]"
                  @click="questionCount = n"
                >{{ n === 0 ? '全部' : n + '题' }}</button>
              </div>
            </div>
          </div>
        </section>

        <!-- 当前选择摘要 -->
        <section class="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-sm p-6 text-white">
          <h3 class="text-base font-bold mb-4">练习摘要</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="opacity-80">方向</span>
              <span class="font-medium">{{ subjectLabel || '未选择' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-80">题型</span>
              <span class="font-medium">{{ typeLabel }}</span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-80">题量</span>
              <span class="font-medium">{{ questionCount === 0 ? '全部' : questionCount + ' 题' }}</span>
            </div>
          </div>
          <button
            type="button"
            class="w-full mt-6 bg-white text-blue-600 font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!selectedSubject"
            @click="startPractice"
          >
            开始练题
          </button>
        </section>

        <!-- 快速入口 -->
        <section class="bg-white rounded-2xl shadow-sm p-6">
          <h3 class="text-sm font-bold text-gray-700 mb-3">快速入口</h3>
          <div class="space-y-2">
            <router-link to="/wrong-notes" class="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-all">
              <span class="quick-icon text-orange-600"><el-icon><Warning /></el-icon></span>
              <div>
                <p class="text-sm font-medium text-gray-800">错题重做</p>
                <p class="text-xs text-gray-400">巩固薄弱知识点</p>
              </div>
            </router-link>
            <router-link to="/analysis" class="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-all">
              <span class="quick-icon text-blue-600"><el-icon><DataAnalysis /></el-icon></span>
              <div>
                <p class="text-sm font-medium text-gray-800">薄弱项分析</p>
                <p class="text-xs text-gray-400">查看薄弱项报告</p>
              </div>
            </router-link>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DataAnalysis, Warning } from '@element-plus/icons-vue'
import http from '@/utils/api'

const router = useRouter()

const subjects = [
  { value: '时事热点', label: '时事热点' },
  { value: '逻辑推理', label: '逻辑推理' },
  { value: '人文素养', label: '人文素养' },
  { value: '科学常识', label: '科学常识' },
  { value: '综合思辨', label: '综合思辨' },
]

const questionTypes = [
  { value: '', label: '全部' },
  { value: 'single_choice', label: '单选题' },
  { value: 'multi_choice', label: '多选题' },
  { value: 'judge', label: '判断题' },
  { value: 'fill', label: '填空题' },
  { value: 'short_answer', label: '简答题' },
]

const countOptions = [10, 20, 50, 0]

const selectedSubject = ref('')
const selectedType = ref('')
const selectedKP = ref('')
const questionCount = ref(20)
const categories = ref<{ name: string; count: number }[]>([])
const loadingKP = ref(false)

const subjectLabel = computed(() => subjects.find(s => s.value === selectedSubject.value)?.label || '')
const typeLabel = computed(() => questionTypes.find(t => t.value === selectedType.value)?.label || '全部')

function selectSubject(val: string) {
  selectedSubject.value = val
  selectedKP.value = ''
}

async function fetchCount() {
  const val = selectedSubject.value
  if (!val) { categories.value = []; return }
  loadingKP.value = true
  try {
    let url = `/exam/practice/categories?knowledgePoint=${encodeURIComponent(val)}&bankType=triad`
    if (selectedType.value) url += `&type=${selectedType.value}`
    const res: any = await http.get(url)
    categories.value = Array.isArray(res) ? res : []
  } catch {
    categories.value = []
  }
  loadingKP.value = false
}

watch(selectedSubject, fetchCount)
watch(selectedType, fetchCount)

function startPractice() {
  if (!selectedSubject.value) return
  const query: Record<string, string> = { kp: selectedKP.value || selectedSubject.value, bankType: 'triad' }
  if (selectedType.value) query.type = selectedType.value
  if (questionCount.value > 0) query.limit = String(questionCount.value)
  router.push({ path: '/practice/do', query })
}
</script>

<style scoped>
.quick-icon {
  @apply w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-lg;
}
</style>

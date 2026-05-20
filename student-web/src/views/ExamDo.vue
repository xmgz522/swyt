<template>
  <div>
    <div v-if="!paper" class="text-center py-20 text-gray-300">加载试卷中...</div>

    <div v-else>
      <!-- 顶部信息栏 -->
      <div class="sticky top-0 z-10 bg-white/90 backdrop-blur rounded-xl px-5 py-3 mb-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <el-button size="small" @click="pauseExam" class="!rounded-lg">
            暂停保存
          </el-button>
          <span class="text-sm font-bold text-primary-500">{{ answeredCount }}/{{ paper.questions.length }}</span>
          <el-progress :percentage="answeredCount / paper.questions.length * 100" :show-text="false" :stroke-width="6" color="#667eea" class="w-32" />
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500 font-mono">{{ formatTimer(elapsed) }}</span>
          <el-button size="small" @click="showCard = true" class="!rounded-lg">答题卡</el-button>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="space-y-4">
        <div v-for="(q, idx) in paper.questions" :key="q.id" :id="'q' + idx" class="bg-white rounded-xl p-6 shadow-sm border border-gray-50">
          <div class="flex items-center gap-3 mb-4">
            <span class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent text-white flex items-center justify-center text-xs font-bold">{{ idx + 1 }}</span>
            <span class="text-xs text-primary-500 bg-primary-50 px-2 py-0.5 rounded">{{ typeMap[q.type] }}</span>
            <span class="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded">{{ q.score }}分</span>
            <span v-if="answers[q.id]" class="w-2.5 h-2.5 rounded-full bg-green-500 ml-auto"></span>
          </div>

          <p class="text-gray-800 leading-relaxed mb-4">{{ q.content }}</p>

          <!-- 单选/判断 -->
          <div v-if="['single_choice', 'judge'].includes(q.type)" class="space-y-2">
            <div
              v-for="(opt, oi) in parseOptions(q.options)"
              :key="oi"
              :class="['flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all', answers[q.id] === opt ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200']"
              @click="answers[q.id] = opt"
            >
              <div :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0', answers[q.id] === opt ? 'border-primary-500 bg-primary-500' : 'border-gray-300']">
                <span v-if="answers[q.id] === opt" class="text-white text-xs">✓</span>
              </div>
              <span class="text-sm text-gray-700">{{ opt }}</span>
            </div>
          </div>

          <!-- 多选 -->
          <div v-if="q.type === 'multi_choice'" class="space-y-2">
            <div
              v-for="(opt, oi) in parseOptions(q.options)"
              :key="oi"
              :class="['flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all', isMulti(q.id, opt) ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200']"
              @click="toggleMulti(q.id, opt)"
            >
              <div :class="['w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0', isMulti(q.id, opt) ? 'border-primary-500 bg-primary-500' : 'border-gray-300']">
                <span v-if="isMulti(q.id, opt)" class="text-white text-xs">✓</span>
              </div>
              <span class="text-sm text-gray-700">{{ opt }}</span>
            </div>
          </div>

          <!-- 填空/简答 -->
          <div v-if="['fill', 'short_answer'].includes(q.type)">
            <el-input
              v-model="answers[q.id]"
              :type="q.type === 'short_answer' ? 'textarea' : 'text'"
              :rows="4"
              :placeholder="q.type === 'fill' ? '请填写答案' : '请输入你的回答'"
            />
            <!-- 拍照上传 -->
            <div v-if="q.type === 'short_answer'" class="flex gap-3 flex-wrap mt-3">
              <div v-for="(img, ii) in (imageMap[q.id] || [])" :key="ii" class="relative group">
                <img :src="getFullUrl(img)" class="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer" @click="previewImage(img)" />
                <button class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" @click="removeImg(q.id, ii)">X</button>
              </div>
              <label v-if="(imageMap[q.id] || []).length < 3" class="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
                <span class="text-2xl text-gray-400">📷</span>
                <span class="text-xs text-gray-400 mt-1">上传图片</span>
                <input type="file" accept="image/*" class="hidden" @change="(e: any) => uploadFile(q.id, e)" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 提交 -->
      <div class="mt-6">
        <el-button type="primary" size="large" class="w-full !rounded-xl !h-12" @click="confirmSubmit">提交答卷</el-button>
      </div>

      <!-- 答题卡抽屉 -->
      <el-drawer v-model="showCard" title="答题卡" direction="rtl" size="320px">
        <div class="grid grid-cols-5 gap-2 mb-4">
          <div
            v-for="(q, idx) in paper.questions"
            :key="q.id"
            :class="['w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer', answers[q.id] ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400']"
            @click="scrollTo(idx)"
          >
            {{ idx + 1 }}
          </div>
        </div>
        <div class="flex gap-4 text-xs text-gray-500 border-t pt-3">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-primary-500"></span>已答 {{ answeredCount }}</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-gray-100"></span>未答 {{ paper.questions.length - answeredCount }}</span>
        </div>
      </el-drawer>

      <!-- 确认弹窗 -->
      <el-dialog v-model="showConfirm" title="确认提交" width="400" align-center>
        <p class="text-gray-600">
          已答 <b class="text-primary-500">{{ answeredCount }}</b> 题，
          未答 <b class="text-orange-500">{{ paper.questions.length - answeredCount }}</b> 题。
        </p>
        <p class="text-gray-500 text-sm mt-2" v-if="paper.questions.length - answeredCount > 0">还有未完成的题目，确定提交吗？</p>
        <template #footer>
          <el-button @click="showConfirm = false">再想想</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">确认提交</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'

const route = useRoute()
const router = useRouter()
const store = useStudentStore()

const typeMap: any = { single_choice: '单选', multi_choice: '多选', judge: '判断', fill: '填空', short_answer: '简答' }
const paper = ref<any>(null)
const answers = reactive<Record<number, string>>({})
const imageMap = reactive<Record<number, string[]>>({})
const showCard = ref(false)
const showConfirm = ref(false)
const submitting = ref(false)
const elapsed = ref(0)
let timer: any = null

const answeredCount = computed(() => {
  if (!paper.value) return 0
  return paper.value.questions.filter((q: any) => !!answers[q.id]).length
})

const SAVE_KEY = computed(() => `exam_progress_${route.params.paperId}`)

function saveProgress() {
  if (!paper.value) return
  const data = {
    paperId: paper.value.id,
    answers: { ...answers },
    imageMap: { ...imageMap },
    elapsed: elapsed.value,
    savedAt: Date.now(),
  }
  localStorage.setItem(SAVE_KEY.value, JSON.stringify(data))
}

function restoreProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY.value)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data.answers) {
      Object.entries(data.answers).forEach(([k, v]) => { answers[+k] = v as string })
    }
    if (data.imageMap) {
      Object.entries(data.imageMap).forEach(([k, v]) => { imageMap[+k] = v as string[] })
    }
    if (data.elapsed) elapsed.value = data.elapsed
  } catch {}
}

function clearProgress() {
  localStorage.removeItem(SAVE_KEY.value)
}

function pauseExam() {
  saveProgress()
  ElMessage.success('答题进度已保存')
  router.back()
}

onMounted(async () => {
  const paperId = route.params.paperId
  if (paperId) {
    paper.value = await http.get(`/exam/papers/${paperId}`)
  }
  restoreProgress()
  timer = setInterval(() => elapsed.value++, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  saveProgress()
})

let autoSaveTimer: any = null
watch(() => ({ ...answers }), () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => saveProgress(), 2000)
}, { deep: true })

function parseOptions(s: string) {
  try { return JSON.parse(s) } catch { return [] }
}

function isMulti(qid: number, opt: string) {
  return (answers[qid] || '').split('||').includes(opt)
}
function toggleMulti(qid: number, opt: string) {
  const arr = (answers[qid] || '').split('||').filter(Boolean)
  const i = arr.indexOf(opt)
  if (i >= 0) arr.splice(i, 1); else arr.push(opt)
  answers[qid] = arr.join('||')
}

function formatTimer(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function scrollTo(idx: number) {
  showCard.value = false
  document.getElementById('q' + idx)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function confirmSubmit() { showConfirm.value = true }

function getFullUrl(url: string) {
  if (url.startsWith('http')) return url
  return `http://localhost:3000${url}`
}

async function uploadFile(qid: number, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('file', file)
  try {
    const res: any = await http.post('/exam/upload-image', fd)
    if (res.success) {
      if (!imageMap[qid]) imageMap[qid] = []
      imageMap[qid].push(res.url)
    }
  } catch { ElMessage.error('上传失败') }
  (e.target as HTMLInputElement).value = ''
}

function removeImg(qid: number, idx: number) {
  imageMap[qid]?.splice(idx, 1)
}

function previewImage(url: string) {
  window.open(getFullUrl(url), '_blank')
}

async function handleSubmit() {
  if (!store.isLoggedIn) { ElMessage.warning('请先填写个人信息'); return }
  submitting.value = true
  const answerList = Object.entries(answers).map(([qid, answer]) => ({ questionId: +qid, answer }))
  const allImages: string[] = []
  Object.values(imageMap).forEach(arr => allImages.push(...arr))
  try {
    const res: any = await http.post('/exam/submit', {
      studentId: store.studentId,
      paperId: paper.value.id,
      answers: answerList,
      images: allImages.length > 0 ? JSON.stringify(allImages) : undefined,
    })
    if (res.success) {
      ElMessage.success('提交成功')
      if (timer) clearInterval(timer)
      showConfirm.value = false
      clearProgress()
      router.replace(`/result/${res.data.id}`)
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.data?.message || '提交失败')
  }
  submitting.value = false
}
</script>

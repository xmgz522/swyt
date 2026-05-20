<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: bold; font-size: 16px;">试卷管理</span>
            <el-tag size="small" type="info">共 {{ papers.length }} 套</el-tag>
            <el-select v-model="bankFilter" size="small" style="width: 150px;" @change="loadPapers">
              <el-option label="全部试卷" value="" />
              <el-option label="三位一体试卷" value="triad" />
              <el-option label="学考试卷" value="xuekao" />
            </el-select>
          </div>
          <el-button type="primary" @click="openAdd">新建试卷</el-button>
        </div>
      </template>
      <el-empty v-if="papers.length === 0" description="暂无试卷" />
      <el-table v-else :data="papers" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="分类" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.bankType === 'xuekao' ? 'warning' : 'primary'" size="small">{{ bankTypeMap[row.bankType] || '三位一体' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="试卷名称">
          <template #default="{ row }">
            <span style="font-weight: 600;">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'real'" size="small" type="danger">真题</el-tag>
            <el-tag v-else size="small" type="primary">模拟卷</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="科目" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.subject" size="small">{{ row.subject }}</el-tag>
            <el-tag v-else size="small" type="warning">三位一体</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="总分" width="80" align="center" />
        <el-table-column prop="duration" label="时长" width="80" align="center">
          <template #default="{ row }">{{ row.duration }}分</template>
        </el-table-column>
        <el-table-column label="题目数" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ safeParseArr(row.questionIds).length }} 题</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.isPublished"
              active-text="已发布"
              inactive-text="未发布"
              size="small"
              @change="(val) => togglePublish(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button size="small" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAdd" :title="editingId ? '编辑试卷' : '新建试卷'" width="600px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="试卷名称" required><el-input v-model="form.title" placeholder="必填" /></el-form-item>
        <el-form-item label="试卷分类">
          <el-radio-group v-model="form.bankType" @change="handleBankChange">
            <el-radio value="triad">三位一体试卷</el-radio>
            <el-radio value="xuekao">学考试卷</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="试卷类型">
          <el-radio-group v-model="form.type">
            <el-radio value="mock">模拟卷</el-radio>
            <el-radio value="real">历年真题</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="科目">
          <el-select v-model="form.subject" :disabled="form.bankType === 'triad'" :placeholder="form.bankType === 'triad' ? '三位一体试卷无需选择科目' : '请选择学考科目'" clearable style="width: 100%;" @change="form.selectedQuestions = []">
            <el-option v-for="s in subjectOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="时长(分)"><el-input-number v-model="form.duration" :min="1" /></el-form-item>
        <el-form-item label="选择题目">
          <div style="max-height: 300px; overflow-y: auto; width: 100%;">
            <el-checkbox-group v-model="form.selectedQuestions">
              <div v-for="q in filteredQuestions" :key="q.id" style="margin-bottom: 8px;">
                <el-checkbox :label="q.id" :value="q.id">
                  <el-tag :type="typeColor[q.type]" size="small" style="margin-right: 4px;">{{ typeMap[q.type] }}</el-tag>
                  {{ q.content.substring(0, 40) }}
                  <el-tag size="small" type="info" style="margin-left: 4px;">{{ q.score }}分</el-tag>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </el-form-item>
        <el-form-item label="自动算分">
          <el-tag type="primary" size="large">总分: {{ autoTotalScore }} 分</el-tag>
          <span style="margin-left: 12px; color: #999; font-size: 12px;">已选 {{ form.selectedQuestions.length }} 题</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :disabled="!form.title || form.selectedQuestions.length === 0">{{ editingId ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const typeMap: any = { single_choice: '单选', multi_choice: '多选', judge: '判断', fill: '填空', short_answer: '简答' }
const typeColor: any = { single_choice: 'primary', multi_choice: 'success', judge: 'warning', fill: 'info', short_answer: 'danger' }
const bankTypeMap: any = { triad: '三位一体', xuekao: '学考' }
const papers = ref([])
const allQuestions = ref<any[]>([])
const showAdd = ref(false)
const editingId = ref<number | null>(null)
const bankFilter = ref('')
const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const form = ref<any>({ title: '', duration: 60, selectedQuestions: [], subject: '', type: 'mock', bankType: 'triad' })

function safeParseArr(s: string) {
  try { return JSON.parse(s) } catch { return [] }
}

const autoTotalScore = computed(() => {
  return filteredQuestions.value
    .filter(q => form.value.selectedQuestions.includes(q.id))
    .reduce((sum, q) => sum + (q.score || 0), 0)
})

const filteredQuestions = computed(() => {
  const targetBank = form.value.bankType || 'triad'
  return allQuestions.value.filter(q => (q.bankType || 'triad') === targetBank)
})

onMounted(async () => {
  await loadPapers()
  const { data } = await api.get('/exam/questions')
  allQuestions.value = data
})

const loading = ref(false)

async function loadPapers() {
  loading.value = true
  try {
    const { data } = await api.get('/exam/papers', { params: bankFilter.value ? { bankType: bankFilter.value } : {} })
    papers.value = data
  } catch {}
  loading.value = false
}

function openAdd() {
  editingId.value = null
  form.value = { title: '', duration: 60, selectedQuestions: [], subject: '', type: 'mock', bankType: bankFilter.value || 'triad' }
  showAdd.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  form.value = {
    title: row.title,
    duration: row.duration,
    selectedQuestions: safeParseArr(row.questionIds),
    subject: row.subject || '',
    type: row.type || 'mock',
    bankType: row.bankType || 'triad',
    isPublished: row.isPublished,
  }
  showAdd.value = true
}

function handleBankChange() {
  form.value.selectedQuestions = []
  if (form.value.bankType === 'triad') form.value.subject = ''
}

async function handleSave() {
  if (!form.value.title?.trim()) {
    ElMessage.warning('请填写试卷名称')
    return
  }
  if (form.value.selectedQuestions.length === 0) {
    ElMessage.warning('请至少选择一道题目')
    return
  }
  const payload: any = {
    title: form.value.title,
    totalScore: autoTotalScore.value,
    duration: form.value.duration,
    questionIds: JSON.stringify(form.value.selectedQuestions),
    isPublished: form.value.isPublished ?? true,
    bankType: form.value.bankType || 'triad',
  }
  payload.type = form.value.type || 'mock'
  payload.subject = form.value.bankType === 'xuekao' && form.value.subject ? form.value.subject : null
  if (editingId.value) {
    await api.put(`/exam/papers/${editingId.value}`, payload)
    ElMessage.success('试卷已修改')
  } else {
    await api.post('/exam/papers', payload)
    ElMessage.success('试卷已创建')
  }
  showAdd.value = false
  editingId.value = null
  loadPapers()
}

async function togglePublish(row: any, val: any) {
  await api.put(`/exam/papers/${row.id}`, { isPublished: val })
  ElMessage.success(val ? '已发布' : '已取消发布')
  loadPapers()
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除这套试卷吗？删除后不可恢复。', '删除确认', { type: 'warning' })
  await api.delete(`/exam/papers/${id}`)
  ElMessage.success('已删除')
  loadPapers()
}
</script>

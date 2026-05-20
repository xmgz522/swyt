<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: bold; font-size: 16px;">题库管理</span>
            <el-tag size="small" type="info">共 {{ questions.length }} 题</el-tag>
            <el-select v-model="bankFilter" size="small" style="width: 150px;" @change="loadQuestions">
              <el-option label="全部题库" value="" />
              <el-option label="三位一体题库" value="triad" />
              <el-option label="学考题库" value="xuekao" />
            </el-select>
          </div>
          <div style="display: flex; gap: 10px;">
            <el-upload action="" :before-upload="handleImport" accept=".xlsx,.xls" :show-file-list="false">
              <el-button>Excel导入</el-button>
            </el-upload>
            <el-button @click="downloadTemplate">下载模板</el-button>
            <el-button type="primary" @click="openAdd">新增题目</el-button>
          </div>
        </div>
      </template>
      <el-table :data="questions" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="题库" width="110">
          <template #default="{ row }">
            <el-tag :type="row.bankType === 'xuekao' ? 'warning' : 'primary'" size="small">{{ bankTypeMap[row.bankType] || '三位一体' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="题型" width="100">
          <template #default="{ row }">{{ typeMap[row.type] || row.type }}</template>
        </el-table-column>
        <el-table-column prop="content" label="题干" show-overflow-tooltip />
        <el-table-column prop="score" label="分值" width="70" />
        <el-table-column prop="difficulty" label="难度" width="80" />
        <el-table-column prop="subject" label="科目" width="80" />
        <el-table-column prop="knowledgePoint" label="知识点" width="120" />
        <el-table-column label="批改方式" width="100">
          <template #default="{ row }">
            <el-tag :type="row.needManualGrade ? 'warning' : 'success'" size="small">
              {{ row.needManualGrade ? '人工' : '自动' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button size="small" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAdd" :title="editingId ? '编辑题目' : '新增题目'" width="600px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="题库分类">
          <el-radio-group v-model="form.bankType">
            <el-radio value="triad">三位一体题库</el-radio>
            <el-radio value="xuekao">学考题库</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="form.type">
            <el-option value="single_choice" label="单选题" />
            <el-option value="multi_choice" label="多选题" />
            <el-option value="judge" label="判断题" />
            <el-option value="fill" label="填空题" />
            <el-option value="short_answer" label="简答题" />
          </el-select>
        </el-form-item>
        <el-form-item label="题干"><el-input v-model="form.content" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="选项" v-if="['single_choice','multi_choice','judge'].includes(form.type)">
          <el-input v-model="form.optionsText" type="textarea" :rows="4" placeholder="每行一个选项" />
        </el-form-item>
        <el-form-item label="答案"><el-input v-model="form.answer" /></el-form-item>
        <el-form-item label="解析"><el-input v-model="form.explanation" type="textarea" /></el-form-item>
        <el-form-item label="分值"><el-input-number v-model="form.score" :min="1" :max="100" /></el-form-item>
        <el-form-item label="难度">
          <el-select v-model="form.difficulty">
            <el-option value="easy" label="简单" />
            <el-option value="medium" label="中等" />
            <el-option value="hard" label="困难" />
          </el-select>
        </el-form-item>
        <el-form-item label="科目">
          <el-select v-model="form.subject" placeholder="选择科目" clearable style="width: 100%;">
            <el-option v-for="s in subjectOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="知识点/题型"><el-input v-model="form.knowledgePoint" placeholder="如：语法选择、七选五、实验题等" /></el-form-item>
        <el-form-item label="人工批改"><el-switch v-model="form.needManualGrade" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const typeMap: any = { single_choice: '单选题', multi_choice: '多选题', judge: '判断题', fill: '填空题', short_answer: '简答题' }
const bankTypeMap: any = { triad: '三位一体', xuekao: '学考' }
const loading = ref(false)
const questions = ref([])
const showAdd = ref(false)
const editingId = ref<number | null>(null)
const bankFilter = ref('')
const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const form = ref<any>({ bankType: 'triad', type: 'single_choice', score: 5, difficulty: 'medium', needManualGrade: false, optionsText: '', subject: '' })

onMounted(() => { loadQuestions() })

async function loadQuestions() {
  loading.value = true
  try {
    const { data } = await api.get('/exam/questions', { params: bankFilter.value ? { bankType: bankFilter.value } : {} })
    questions.value = data
  } catch {}
  loading.value = false
}

function openAdd() {
  editingId.value = null
  form.value = { bankType: bankFilter.value || 'triad', type: 'single_choice', score: 5, difficulty: 'medium', needManualGrade: false, optionsText: '', subject: '' }
  showAdd.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  let optionsText = ''
  if (row.options) {
    try {
      const parsed = JSON.parse(row.options)
      optionsText = Array.isArray(parsed) ? parsed.join('\n') : String(row.options)
    } catch {
      optionsText = String(row.options)
    }
  }
  form.value = { ...row, optionsText }
  showAdd.value = true
}

async function handleSave() {
  const payload = { ...form.value }
  if (payload.optionsText) {
    payload.options = JSON.stringify(payload.optionsText.split('\n').filter(Boolean))
  }
  if (!payload.optionsText) payload.options = ''
  delete payload.optionsText
  if (editingId.value) {
    await api.put(`/exam/questions/${editingId.value}`, payload)
    ElMessage.success('修改成功')
  } else {
    await api.post('/exam/questions', payload)
    ElMessage.success('添加成功')
  }
  showAdd.value = false
  editingId.value = null
  loadQuestions()
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除这道题目吗？删除后不可恢复。', '删除确认', { type: 'warning' })
  await api.delete(`/exam/questions/${id}`)
  ElMessage.success('已删除')
  loadQuestions()
}

async function handleImport(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await api.post('/exam/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    ElMessage.success(`成功导入 ${data.count} 道题目`)
    loadQuestions()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '导入失败')
  }
  return false
}

function downloadTemplate() {
  const header = '题型\t题干\t选项(用|分隔)\t答案\t解析\t分值\t知识点/题型\t科目\t题库类型'
  const example = '单选\t浙江省有多少个地级市？\tA. 9个|B. 10个|C. 11个|D. 12个\tC\t浙江有11个地级市\t5\t地理常识\t地理\t三位一体'
  const blob = new Blob([`${header}\n${example}`], { type: 'text/tab-separated-values' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '题目导入模板.tsv'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.info('模板已下载，请用 Excel 打开并按格式填写后保存为 .xlsx')
}
</script>

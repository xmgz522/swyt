<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px;">面试题库管理</span>
          <el-button type="primary" @click="openAdd">新增面试题</el-button>
        </div>
      </template>

      <!-- 筛选 -->
      <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
        <el-select v-model="filter.schoolId" placeholder="选择学校" clearable style="width: 200px;" @change="loadData">
          <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-select v-model="filter.category" placeholder="选择分类" clearable style="width: 150px;" @change="loadData">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-input v-model="filter.keyword" placeholder="搜索题目/答案" clearable style="width: 200px;" @clear="loadData" @keyup.enter="loadData" />
        <el-button @click="loadData">搜索</el-button>
      </div>

      <el-empty v-if="list.length === 0" description="暂无面试题" />
      <el-table v-else :data="list" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="schoolName" label="学校" width="140" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category || '未分类' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="面试问题" min-width="250">
          <template #default="{ row }">
            <div style="white-space: pre-wrap; line-height: 1.5;">{{ row.question }}</div>
          </template>
        </el-table-column>
        <el-table-column label="参考答案" min-width="300">
          <template #default="{ row }">
            <div style="white-space: pre-wrap; line-height: 1.5; color: #666; font-size: 13px;">{{ truncate(row.answer, 100) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="diffColor[row.difficulty]" size="small">{{ diffLabel[row.difficulty] || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="year" label="年份" width="70" />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button size="small" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="editingId ? '编辑面试题' : '新增面试题'" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="学校" required>
          <el-select v-model="form.schoolId" placeholder="选择学校" style="width: 100%;">
            <el-option v-for="s in schools" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="选择分类" allow-create filterable style="width: 100%;">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="面试问题" required>
          <el-input v-model="form.question" type="textarea" :rows="3" placeholder="输入面试问题" />
        </el-form-item>
        <el-form-item label="参考答案" required>
          <el-input v-model="form.answer" type="textarea" :rows="5" placeholder="输入参考答案" />
        </el-form-item>
        <el-form-item label="答题要点">
          <el-input v-model="form.tips" type="textarea" :rows="2" placeholder="答题提示/要点（可选）" />
        </el-form-item>
        <el-form-item label="难度">
          <el-radio-group v-model="form.difficulty">
            <el-radio value="easy">简单</el-radio>
            <el-radio value="medium">中等</el-radio>
            <el-radio value="hard">较难</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年份">
          <el-input v-model="form.year" placeholder="如 2024" style="width: 120px;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const diffLabel: Record<string, string> = { easy: '简单', medium: '中等', hard: '较难' }
const diffColor: Record<string, string> = { easy: 'success', medium: 'warning', hard: 'danger' }
const categories = ref<string[]>(['综合素质', '时事热点', '专业兴趣', '逻辑思辨', '个人规划', '英语口语'])

const schools = ref<any[]>([])
const list = ref<any[]>([])
const filter = ref({ schoolId: '' as any, category: '', keyword: '' })
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ schoolId: null as any, category: '', question: '', answer: '', tips: '', difficulty: 'medium', year: '2024' })

function truncate(s: string, max: number) {
  return s && s.length > max ? s.substring(0, max) + '...' : s
}

onMounted(async () => {
  const { data } = await api.get('/schools')
  schools.value = Array.isArray(data) ? data : data?.data || []
  await loadData()
})

async function loadData() {
  const params: any = {}
  if (filter.value.schoolId) params.schoolId = filter.value.schoolId
  if (filter.value.category) params.category = filter.value.category
  if (filter.value.keyword) params.keyword = filter.value.keyword
  const { data } = await api.get('/interview/questions', { params })
  list.value = data
}

function openAdd() {
  editingId.value = null
  form.value = { schoolId: null, category: '', question: '', answer: '', tips: '', difficulty: 'medium', year: '2024' }
  showDialog.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  form.value = { schoolId: row.schoolId, category: row.category || '', question: row.question, answer: row.answer, tips: row.tips || '', difficulty: row.difficulty || 'medium', year: row.year || '' }
  showDialog.value = true
}

async function handleSave() {
  if (!form.value.schoolId || !form.value.question || !form.value.answer) {
    ElMessage.warning('请填写学校、问题和答案')
    return
  }
  if (editingId.value) {
    await api.put(`/interview/questions/${editingId.value}`, form.value)
    ElMessage.success('已更新')
  } else {
    await api.post('/interview/questions', form.value)
    ElMessage.success('已添加')
  }
  showDialog.value = false
  loadData()
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确认删除面试题：${row.question.substring(0, 30)}...？`, '删除确认')
  await api.delete(`/interview/questions/${row.id}`)
  ElMessage.success('已删除')
  loadData()
}
</script>

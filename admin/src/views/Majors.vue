<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px;">专业管理</span>
          <div style="display: flex; gap: 10px;">
            <el-input v-model="keyword" placeholder="搜索专业名称" clearable style="width: 200px;" @clear="load" @keyup.enter="load" />
            <el-select v-model="filterCategory" placeholder="学科门类" clearable style="width: 140px;" @change="load">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
            <el-button @click="seedData">导入预置数据</el-button>
            <el-button type="primary" @click="openAdd">新增专业</el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="专业名称" width="160" />
        <el-table-column prop="code" label="代码" width="100" />
        <el-table-column prop="category" label="学科门类" width="100" />
        <el-table-column prop="duration" label="学制" width="60" />
        <el-table-column prop="degree" label="学位" width="100" />
        <el-table-column label="简介" min-width="200">
          <template #default="{ row }">
            <span style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '显示' : '隐藏' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button size="small" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="editingId ? '编辑专业' : '新增专业'" width="700px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="专业名称" required>
              <el-input v-model="form.name" placeholder="如：计算机科学与技术" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专业代码">
              <el-input v-model="form.code" placeholder="如：080901" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="学科门类">
              <el-input v-model="form.category" placeholder="如：工学" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学制">
              <el-input v-model="form.duration" placeholder="如：4年" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="授予学位">
              <el-input v-model="form.degree" placeholder="如：工学学士" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="专业简介">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="专业介绍..." />
        </el-form-item>
        <el-form-item label="核心课程">
          <el-input v-model="form.courses" type="textarea" :rows="2" placeholder="多门课程用逗号分隔，如：数据结构,操作系统,计算机网络" />
        </el-form-item>
        <el-form-item label="就业方向">
          <el-input v-model="form.employment" type="textarea" :rows="2" placeholder="毕业后可从事的工作方向..." />
        </el-form-item>
        <el-form-item label="适合人群">
          <el-input v-model="form.suitableFor" type="textarea" :rows="2" placeholder="适合什么特点的学生..." />
        </el-form-item>
        <el-form-item label="相关院校">
          <el-input v-model="form.relatedSchools" type="textarea" :rows="2" placeholder="开设该专业的院校，逗号分隔" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="排序权重">
              <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否显示">
              <el-switch v-model="form.isActive" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const list = ref<any[]>([])
const categories = ref<string[]>([])
const loading = ref(false)
const keyword = ref('')
const filterCategory = ref('')
const showDialog = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const defaultForm = () => ({
  name: '', code: '', category: '', description: '', courses: '',
  employment: '', suitableFor: '', relatedSchools: '', duration: '',
  degree: '', sortOrder: 0, isActive: true,
})
const form = ref<any>(defaultForm())

onMounted(() => { load(); loadCategories() })

async function load() {
  loading.value = true
  try {
    const params: string[] = []
    if (keyword.value) params.push(`keyword=${encodeURIComponent(keyword.value)}`)
    if (filterCategory.value) params.push(`category=${encodeURIComponent(filterCategory.value)}`)
    const res = await api.get(`/majors/admin/all${params.length ? '?' + params.join('&') : ''}`)
    list.value = Array.isArray(res.data) ? res.data : []
  } catch { list.value = [] }
  loading.value = false
}

async function loadCategories() {
  try {
    const { data } = await api.get('/majors/categories')
    categories.value = Array.isArray(data) ? data : []
  } catch {}
}

function openAdd() {
  editingId.value = null
  form.value = defaultForm()
  showDialog.value = true
}

function openEdit(row: any) {
  editingId.value = row.id
  form.value = {
    name: row.name || '',
    code: row.code || '',
    category: row.category || '',
    description: row.description || '',
    courses: row.courses || '',
    employment: row.employment || '',
    suitableFor: row.suitableFor || '',
    relatedSchools: row.relatedSchools || '',
    duration: row.duration || '',
    degree: row.degree || '',
    sortOrder: row.sortOrder || 0,
    isActive: row.isActive !== false,
  }
  showDialog.value = true
}

async function save() {
  if (!form.value.name) { ElMessage.warning('请填写专业名称'); return }
  saving.value = true
  try {
    if (editingId.value) {
      await api.put(`/majors/${editingId.value}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/majors', form.value)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    load()
    loadCategories()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  }
  saving.value = false
}

async function seedData() {
  try {
    const { data } = await api.post('/majors/seed')
    ElMessage.success(data.message || '导入完成')
    load()
    loadCategories()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '导入失败')
  }
}

async function remove(id: number) {
  await ElMessageBox.confirm('确定删除该专业？', '提示', { type: 'warning' })
  try {
    await api.delete(`/majors/${id}`)
    ElMessage.success('已删除')
    load()
  } catch {}
}
</script>

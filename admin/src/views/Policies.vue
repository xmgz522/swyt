<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>政策管理</span>
          <el-button type="primary" @click="openForm()">+ 新增政策</el-button>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="tag" label="分类" width="110">
          <template #default="{ row }">
            <el-tag :type="tagType(row.tag)" size="small">{{ row.tag }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="publishDate" label="发布日期" width="120" />
        <el-table-column prop="url" label="外链" width="80">
          <template #default="{ row }">
            <a v-if="row.url" :href="row.url" target="_blank" rel="noopener" style="color: #409eff;">打开</a>
            <span v-else style="color: #ccc;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'" size="small">{{ row.isActive ? '显示' : '隐藏' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button size="small" @click="openForm(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑政策' : '新增政策'" width="640px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="如：浙江省2025年三位一体招生通知" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.tag" style="width: 100%;">
            <el-option v-for="t in tagOptions" :key="t" :value="t" :label="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布日期">
          <el-date-picker v-model="form.publishDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="外链地址">
          <el-input v-model="form.url" placeholder="https://... 学生端点击可直接跳转" />
        </el-form-item>
        <el-form-item label="正文内容">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="政策正文或摘要" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
          <span style="margin-left: 8px; color: #999; font-size: 12px;">数字越大越靠前</span>
        </el-form-item>
        <el-form-item label="是否显示">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const list = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editId = ref<number | null>(null)

const tagOptions = ['招生政策', '报名条件', '学考政策', '校考说明', '志愿填报', '时间节点', '其他']

const emptyForm = () => ({
  title: '',
  tag: '招生政策',
  content: '',
  url: '',
  publishDate: '',
  sortOrder: 0,
  isActive: true,
})
const form = ref<any>(emptyForm())

function tagType(tag: string) {
  const map: Record<string, string> = {
    '招生政策': '',
    '报名条件': 'success',
    '学考政策': 'warning',
    '校考说明': 'danger',
    '志愿填报': 'info',
    '时间节点': 'info',
  }
  return map[tag] || ''
}

async function loadList() {
  loading.value = true
  try {
    const { data } = await api.get('/policies')
    list.value = Array.isArray(data) ? data : []
  } catch { list.value = [] }
  loading.value = false
}

function openForm(row?: any) {
  if (row) {
    isEdit.value = true
    editId.value = row.id
    form.value = { ...row }
  } else {
    isEdit.value = false
    editId.value = null
    form.value = emptyForm()
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.title) { ElMessage.warning('请填写标题'); return }
  saving.value = true
  try {
    if (isEdit.value && editId.value) {
      await api.put(`/policies/${editId.value}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/policies', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadList()
  } catch { ElMessage.error('保存失败') }
  saving.value = false
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确认删除该政策？', '提示', { type: 'warning' })
  try {
    await api.delete(`/policies/${id}`)
    ElMessage.success('已删除')
    await loadList()
  } catch { ElMessage.error('删除失败') }
}

onMounted(() => loadList())
</script>

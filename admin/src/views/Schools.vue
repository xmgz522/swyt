<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: bold; font-size: 16px;">院校管理</span>
            <el-tag size="small" type="info">共 {{ filteredSchools.length }} 所</el-tag>
          </div>
          <div style="display: flex; gap: 10px;">
            <el-input v-model="searchKey" placeholder="搜索学校名/地区" clearable style="width: 200px;" prefix-icon="Search" />
            <el-button @click="downloadSchoolTemplate">下载模板</el-button>
            <el-upload action="" :before-upload="handleImportSchools" accept=".xlsx,.xls" :show-file-list="false">
              <el-button :loading="importing">Excel导入</el-button>
            </el-upload>
            <el-button @click="exportSchools">导出院校</el-button>
            <el-button type="primary" @click="openAdd">新增院校</el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredSchools" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="学校名称" width="180">
          <template #default="{ row }">
            <span style="font-weight: 600;">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="地区" width="80" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === '综合类' ? 'primary' : row.type === '师范类' ? 'success' : 'info'">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gradeRequirements" label="学考要求" width="150" />
        <el-table-column prop="interviewType" label="面试形式" width="120" />
        <el-table-column prop="suitableFor" label="适合人群" show-overflow-tooltip />
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button size="small" text @click="openEdit(row)">编辑</el-button>
              <el-button size="small" text type="primary" @click="openRules(row)">规则</el-button>
              <el-button size="small" text type="success" @click="openEvents(row)">时间节点</el-button>
              <el-button size="small" text type="danger" @click="handleDeleteSchool(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEdit" :title="isEdit ? '编辑院校' : '新增院校'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="学校名称" required><el-input v-model="form.name" placeholder="必填" /></el-form-item>
        <el-form-item label="地区" required><el-input v-model="form.region" placeholder="如：杭州" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" placeholder="请选择" style="width: 100%;">
            <el-option label="综合类" value="综合类" />
            <el-option label="师范类" value="师范类" />
            <el-option label="理工类" value="理工类" />
            <el-option label="财经类" value="财经类" />
            <el-option label="医药类" value="医药类" />
            <el-option label="艺术类" value="艺术类" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="简介"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="招生要求"><el-input v-model="form.requirements" /></el-form-item>
        <el-form-item label="学考要求"><el-input v-model="form.gradeRequirements" /></el-form-item>
        <el-form-item label="面试形式"><el-input v-model="form.interviewType" /></el-form-item>
        <el-form-item label="适合人群"><el-input v-model="form.suitableFor" /></el-form-item>
        <el-form-item label="报考建议"><el-input v-model="form.advice" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="官网链接"><el-input v-model="form.website" placeholder="https://..." /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 推荐规则弹窗 -->
    <el-dialog v-model="showRules" title="推荐规则配置" width="650px">
      <p style="margin-bottom: 12px; color: #666;">当前院校: <strong>{{ currentSchool?.name }}</strong></p>
      <el-table :data="rules" stripe size="small">
        <el-table-column prop="minGradeA" label="最低A数" width="90" />
        <el-table-column prop="minGradeB" label="最低B数" width="90" />
        <el-table-column prop="maxGradeC" label="最大C数" width="90" />
        <el-table-column label="推荐等级" width="100">
          <template #default="{ row }">
            <el-tag :type="row.level === 'stable' ? '' : 'warning'" size="small">
              {{ row.level === 'stable' ? '稳妥' : row.level === 'reach' ? '冲刺' : '保底' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" text @click="deleteRule(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-divider />
      <el-form :model="ruleForm" inline size="small">
        <el-form-item label="最低A"><el-input-number v-model="ruleForm.minGradeA" :min="0" :max="10" /></el-form-item>
        <el-form-item label="最低B"><el-input-number v-model="ruleForm.minGradeB" :min="0" :max="10" /></el-form-item>
        <el-form-item label="最大C"><el-input-number v-model="ruleForm.maxGradeC" :min="0" :max="10" /></el-form-item>
        <el-form-item label="等级">
          <el-select v-model="ruleForm.level" style="width: 100px">
            <el-option value="reach" label="冲刺" />
            <el-option value="stable" label="稳妥" />
            <el-option value="safe" label="保底" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addRule">添加</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 时间节点管理弹窗 -->
    <el-dialog v-model="showEvents" title="时间节点管理" width="750px">
      <p style="margin-bottom: 12px; color: #666;">当前院校: <strong>{{ currentSchool?.name }}</strong></p>
      <el-table :data="events" stripe size="small">
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="eventTypeMap[row.type]?.tag || 'info'">{{ eventTypeMap[row.type]?.label || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="160" />
        <el-table-column prop="date" label="开始日期" width="120" />
        <el-table-column prop="endDate" label="截止日期" width="120">
          <template #default="{ row }">{{ row.endDate || '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" text @click="deleteEvent(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-divider />
      <el-form :model="eventForm" inline size="small">
        <el-form-item label="类型">
          <el-select v-model="eventForm.type" style="width: 120px">
            <el-option value="registration" label="报名" />
            <el-option value="written_exam" label="笔试" />
            <el-option value="interview" label="面试" />
            <el-option value="result" label="录取" />
            <el-option value="enrollment" label="入学" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题"><el-input v-model="eventForm.title" placeholder="如：网上报名" style="width: 140px" /></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="eventForm.date" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 150px" /></el-form-item>
        <el-form-item label="截止"><el-date-picker v-model="eventForm.endDate" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 150px" /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addEvent">添加</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const loading = ref(false)
const schools = ref([])
const searchKey = ref('')
const showEdit = ref(false)
const showRules = ref(false)
const isEdit = ref(false)
const currentSchool = ref<any>(null)
const rules = ref([])
const form = ref<any>({})
const ruleForm = ref({ minGradeA: 0, minGradeB: 0, maxGradeC: 5, level: 'stable' })
const importing = ref(false)
const showEvents = ref(false)
const events = ref<any[]>([])
const eventForm = ref<any>({ type: 'registration', title: '', date: '', endDate: '' })
const eventTypeMap: Record<string, { label: string; tag: string }> = {
  registration: { label: '报名', tag: '' },
  written_exam: { label: '笔试', tag: 'warning' },
  interview: { label: '面试', tag: 'success' },
  result: { label: '录取', tag: 'info' },
  enrollment: { label: '入学', tag: 'danger' },
}

const filteredSchools = computed(() => {
  if (!searchKey.value) return schools.value
  const key = searchKey.value.toLowerCase()
  return schools.value.filter((s: any) =>
    (s.name || '').toLowerCase().includes(key) ||
    (s.region || '').toLowerCase().includes(key)
  )
})

onMounted(() => { loadSchools() })

async function loadSchools() {
  loading.value = true
  try {
    const { data } = await api.get('/schools')
    schools.value = data
  } catch {}
  loading.value = false
}

function openAdd() {
  isEdit.value = false
  form.value = {}
  showEdit.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  form.value = { ...row }
  showEdit.value = true
}

async function handleSave() {
  if (!form.value.name?.trim()) {
    ElMessage.warning('请填写学校名称')
    return
  }
  if (!form.value.region?.trim()) {
    ElMessage.warning('请填写地区')
    return
  }
  try {
    if (isEdit.value) {
      await api.put(`/schools/${form.value.id}`, form.value)
    } else {
      await api.post('/schools', form.value)
    }
    ElMessage.success('保存成功')
    showEdit.value = false
    loadSchools()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  }
}

async function handleDeleteSchool(id: number) {
  await ElMessageBox.confirm('删除院校将同时删除相关推荐规则，确定？', '提示', { type: 'warning' })
  await api.delete(`/schools/${id}`)
  ElMessage.success('已删除')
  loadSchools()
}

async function openRules(row: any) {
  currentSchool.value = row
  const { data } = await api.get(`/schools/${row.id}/rules`)
  rules.value = data
  showRules.value = true
}

async function addRule() {
  await api.post(`/schools/${currentSchool.value.id}/rules`, ruleForm.value)
  ElMessage.success('规则已添加')
  const { data } = await api.get(`/schools/${currentSchool.value.id}/rules`)
  rules.value = data
}

async function deleteRule(id: number) {
  await api.delete(`/schools/rules/${id}`)
  const { data } = await api.get(`/schools/${currentSchool.value.id}/rules`)
  rules.value = data
}

async function openEvents(row: any) {
  currentSchool.value = row
  const { data } = await api.get(`/schools/${row.id}/events`)
  events.value = data
  showEvents.value = true
}

async function addEvent() {
  if (!eventForm.value.title || !eventForm.value.date) {
    ElMessage.warning('请填写标题和日期')
    return
  }
  await api.post('/schools/events', {
    ...eventForm.value,
    schoolId: currentSchool.value.id,
    schoolName: currentSchool.value.name,
  })
  ElMessage.success('已添加')
  eventForm.value = { type: 'registration', title: '', date: '', endDate: '' }
  const { data } = await api.get(`/schools/${currentSchool.value.id}/events`)
  events.value = data
}

async function deleteEvent(id: number) {
  await api.delete(`/schools/events/${id}`)
  const { data } = await api.get(`/schools/${currentSchool.value.id}/events`)
  events.value = data
}

async function handleImportSchools(file: File) {
  importing.value = true
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await api.post('/export/import/schools', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    ElMessage.success(`院校导入完成：共 ${data.total || 0} 行，成功导入 ${data.inserted || 0} 所`)
    await loadSchools()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '院校导入失败，请检查模板格式')
  }
  importing.value = false
  return false
}

function downloadExcel(url: string, name: string) {
  fetch(`/api${url}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } })
    .then(r => {
      if (!r.ok) throw new Error('download failed')
      return r.blob()
    })
    .then(blob => {
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${name}_${Date.now()}.xlsx`
      a.click()
      URL.revokeObjectURL(objectUrl)
      ElMessage.success(`${name}下载成功`)
    })
    .catch(() => ElMessage.error(`${name}下载失败`))
}

function downloadSchoolTemplate() {
  downloadExcel('/export/template/schools', '院校导入模板')
}

function exportSchools() {
  downloadExcel('/export/schools', '院校列表')
}
</script>

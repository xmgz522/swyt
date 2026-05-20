<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: bold; font-size: 16px;">学生管理</span>
            <el-tag size="small" type="info">共 {{ filteredStudents.length }} 人</el-tag>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <el-badge v-if="resetCount > 0" :value="resetCount" type="danger" style="margin-right: 4px;">
              <el-button size="small" @click="showResetDialog = true">密码重置申请</el-button>
            </el-badge>
            <el-input v-model="searchKey" placeholder="搜索姓名/手机/学校" clearable style="width: 220px;" prefix-icon="Search" />
            <el-button @click="exportStudents">导出Excel</el-button>
            <el-button v-if="isAdmin" type="warning" @click="autoAssign">自动分配老师</el-button>
            <el-button type="primary" @click="openForm(null)">新增学生</el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredStudents" stripe v-loading="loading" @row-click="openDetail" style="cursor: pointer;" highlight-current-row>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="姓名" width="100">
          <template #default="{ row }">
            <span style="font-weight: 600; color: #333;">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="schoolName" label="所在学校" width="150" />
        <el-table-column prop="grade" label="年级" width="80" />
        <el-table-column label="学考等级" width="190">
          <template #default="{ row }">
            <el-tag v-if="row.gradeA" size="small" type="danger" style="margin-right: 2px;">{{ row.gradeA }}A</el-tag>
            <el-tag v-if="row.gradeB" size="small" type="warning" style="margin-right: 2px;">{{ row.gradeB }}B</el-tag>
            <el-tag v-if="row.gradeC" size="small" style="margin-right: 2px;">{{ row.gradeC }}C</el-tag>
            <el-tag v-if="row.gradeD" size="small" type="info" style="margin-right: 2px;">{{ row.gradeD }}D</el-tag>
            <el-tag v-if="row.gradeE" size="small" type="info">{{ row.gradeE }}E</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="preferredRegion" label="意向地区" width="100" />
        <el-table-column prop="preferredMajor" label="意向专业" />
        <el-table-column label="管理老师" width="140">
          <template #default="{ row }">
            <el-select
              v-if="isAdmin"
              v-model="row.teacherId"
              placeholder="未分配"
              size="small"
              style="width: 110px;"
              @change="(val: number) => changeTeacher(row.id, val)"
              @click.stop
            >
              <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
            <span v-else>{{ teachers.find((t: any) => t.id === row.teacherId)?.name || '未分配' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'disabled'" type="danger" size="small">已停用</el-tag>
            <el-tag v-else-if="row.expireAt && new Date(row.expireAt) < new Date()" type="warning" size="small">已过期</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="380" @click.stop>
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button size="small" type="primary" text @click.stop="viewRecommend(row)">推荐</el-button>
              <el-button size="small" text @click.stop="openForm(row)">编辑</el-button>
              <el-button v-if="row.status !== 'disabled'" size="small" type="warning" text @click.stop="toggleStatus(row, 'disabled')">停用</el-button>
              <el-button v-else size="small" type="success" text @click.stop="toggleStatus(row, 'active')">启用</el-button>
              <el-button size="small" type="info" text @click.stop="resetPwd(row)">重置密码</el-button>
              <el-button size="small" type="danger" text @click.stop="handleDelete(row.id)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增学生弹窗 -->
    <el-dialog v-model="showAdd" :title="isEdit ? '编辑学生' : '新增学生'" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="姓名" required><el-input v-model="form.name" placeholder="必填" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" placeholder="11位手机号" maxlength="11" /></el-form-item>
        <el-form-item label="所在学校"><el-input v-model="form.schoolName" /></el-form-item>
        <el-form-item label="年级">
          <el-select v-model="form.grade" placeholder="请选择">
            <el-option label="高一" value="高一" />
            <el-option label="高二" value="高二" />
            <el-option label="高三" value="高三" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">学考等级（共10门，A+B+C+D+E=10）</el-divider>
        <el-form-item label="A等第数"><el-input-number v-model="form.gradeA" :min="0" :max="gradeMax('gradeA')" /></el-form-item>
        <el-form-item label="B等第数"><el-input-number v-model="form.gradeB" :min="0" :max="gradeMax('gradeB')" /></el-form-item>
        <el-form-item label="C等第数"><el-input-number v-model="form.gradeC" :min="0" :max="gradeMax('gradeC')" /></el-form-item>
        <el-form-item label="D等第数"><el-input-number v-model="form.gradeD" :min="0" :max="gradeMax('gradeD')" /></el-form-item>
        <el-form-item label="E等第数"><el-input-number v-model="form.gradeE" :min="0" :max="gradeMax('gradeE')" /></el-form-item>
        <el-form-item>
          <el-text :type="gradeTotal === 10 ? 'success' : gradeTotal > 10 ? 'danger' : 'warning'" size="small">
            已分配 {{ gradeTotal }} / 10 门
          </el-text>
        </el-form-item>
        <el-divider />
        <el-form-item v-if="isAdmin" label="管理老师">
          <el-select v-model="form.teacherId" placeholder="请选择" clearable style="width: 100%;">
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="意向地区"><el-input v-model="form.preferredRegion" /></el-form-item>
        <el-form-item label="意向专业"><el-input v-model="form.preferredMajor" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 推荐结果弹窗 -->
    <el-dialog v-model="showRecommend" :title="`院校推荐 - ${currentStudent?.name || ''}`" width="650px">
      <div v-if="recommendations.length === 0" style="text-align: center; padding: 40px; color: #999;">
        暂无匹配院校，请确认学考等级已填写
      </div>
      <div v-else>
        <div v-for="item in recommendations" :key="item.school.id" class="recommend-card" :class="item.level">
          <div class="rec-header">
            <span class="rec-school">{{ item.school.name }}</span>
            <el-tag :type="item.level === 'safe' ? 'success' : item.level === 'stable' ? '' : 'warning'" size="small">
              {{ item.levelText }}
            </el-tag>
          </div>
          <div class="rec-meta">
            <span>{{ item.school.region }}</span>
            <span>{{ item.school.type }}</span>
          </div>
          <div class="rec-reason">{{ item.reason }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- 学生详情抽屉 -->
    <el-drawer v-model="showDetail" :title="detailStudent?.name" size="420px">
      <template v-if="detailStudent">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="姓名">{{ detailStudent.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailStudent.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所在学校">{{ detailStudent.schoolName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ detailStudent.grade || '-' }}</el-descriptions-item>
          <el-descriptions-item label="学考等级">
            <el-tag v-if="detailStudent.gradeA" size="small" type="danger">{{ detailStudent.gradeA }}A</el-tag>
            <el-tag v-if="detailStudent.gradeB" size="small" type="warning">{{ detailStudent.gradeB }}B</el-tag>
            <el-tag v-if="detailStudent.gradeC" size="small">{{ detailStudent.gradeC }}C</el-tag>
            <el-tag v-if="detailStudent.gradeD" size="small" type="info">{{ detailStudent.gradeD }}D</el-tag>
            <el-tag v-if="detailStudent.gradeE" size="small" type="info">{{ detailStudent.gradeE }}E</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="意向地区">{{ detailStudent.preferredRegion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="意向专业">{{ detailStudent.preferredMajor || '-' }}</el-descriptions-item>
          <el-descriptions-item label="管理老师">{{ teachers.find((t: any) => t.id === detailStudent.teacherId)?.name || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ detailStudent.createdAt?.substring(0, 10) }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 20px;">
          <el-button type="primary" @click="viewRecommend(detailStudent)">查看推荐院校</el-button>
          <el-button @click="openForm(detailStudent)">编辑信息</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 密码重置申请弹窗 -->
    <el-dialog v-model="showResetDialog" title="密码重置申请" width="480px">
      <div v-if="resetRequests.length === 0" style="text-align:center;color:#999;padding:20px;">暂无重置申请</div>
      <div v-for="r in resetRequests" :key="r.id" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <div>
          <span style="font-weight:600;">{{ r.name }}</span>
          <span style="margin-left:8px;color:#999;">{{ r.phone }}</span>
          <span style="margin-left:8px;color:#bbb;font-size:12px;">{{ r.schoolName }} {{ r.grade }}</span>
        </div>
        <el-button size="small" type="primary" @click="handleResetRequest(r)">重置为123456</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const TOTAL = 10
const user = JSON.parse(localStorage.getItem('user') || '{}')
const isAdmin = ['superadmin', 'admin'].includes(user.role)
const loading = ref(false)
const students = ref([])
const teachers = ref<any[]>([])
const searchKey = ref('')
const showAdd = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const showRecommend = ref(false)
const showDetail = ref(false)
const showResetDialog = ref(false)
const resetRequests = ref<any[]>([])
const resetCount = ref(0)
const recommendations = ref([])
const currentStudent = ref<any>(null)
const detailStudent = ref<any>(null)

const emptyForm = () => ({
  name: '', phone: '', schoolName: '', grade: '',
  gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, gradeE: 0,
  teacherId: null as number | null,
  preferredRegion: '', preferredMajor: '',
})
const form = ref(emptyForm())

const filteredStudents = computed(() => {
  if (!searchKey.value) return students.value
  const key = searchKey.value.toLowerCase()
  return students.value.filter((s: any) =>
    (s.name || '').toLowerCase().includes(key) ||
    (s.phone || '').includes(key) ||
    (s.schoolName || '').toLowerCase().includes(key)
  )
})

const gradeTotal = computed(() => form.value.gradeA + form.value.gradeB + form.value.gradeC + form.value.gradeD + form.value.gradeE)

function gradeMax(field: string) {
  const others = ['gradeA', 'gradeB', 'gradeC', 'gradeD', 'gradeE']
    .filter(f => f !== field)
    .reduce((sum, f) => sum + (form.value[f] || 0), 0)
  return TOTAL - others
}

onMounted(() => { loadStudents(); loadTeachers(); loadResetRequests() })

async function loadStudents() {
  loading.value = true
  try {
    const { data } = await api.get('/students')
    students.value = data
  } catch {}
  loading.value = false
}

async function loadTeachers() {
  const { data } = await api.get('/auth/teachers')
  teachers.value = Array.isArray(data) ? data : []
}

async function changeTeacher(studentId: number, teacherId: number) {
  await api.put(`/students/${studentId}`, { teacherId })
  ElMessage.success('已更换管理老师')
}

async function autoAssign() {
  const { data } = await api.post('/students/auto-assign')
  if (data.success) {
    ElMessage.success(`已自动分配 ${data.count} 个学生`)
    loadStudents()
  } else {
    ElMessage.warning(data.message || '没有需要分配的学生')
  }
}

function openForm(student: any) {
  if (student) {
    isEdit.value = true
    editId.value = student.id
    form.value = {
      name: student.name, phone: student.phone || '', schoolName: student.schoolName || '',
      grade: student.grade || '',
      gradeA: student.gradeA || 0, gradeB: student.gradeB || 0, gradeC: student.gradeC || 0,
      gradeD: student.gradeD || 0, gradeE: student.gradeE || 0,
      teacherId: student.teacherId || null,
      preferredRegion: student.preferredRegion || '', preferredMajor: student.preferredMajor || '',
    }
  } else {
    isEdit.value = false
    editId.value = null
    form.value = emptyForm()
  }
  showAdd.value = true
}

function openDetail(row: any) {
  detailStudent.value = row
  showDetail.value = true
}

function validateForm() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请填写姓名')
    return false
  }
  if (form.value.phone && !/^1[3-9]\d{9}$/.test(form.value.phone)) {
    ElMessage.warning('手机号格式不正确')
    return false
  }
  if (gradeTotal.value > TOTAL) {
    ElMessage.warning(`学考一共${TOTAL}门，当前已分配${gradeTotal.value}门`)
    return false
  }
  return true
}

async function handleAdd() {
  if (!validateForm()) return
  try {
    if (isEdit.value && editId.value) {
      await api.put(`/students/${editId.value}`, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.post('/students', form.value)
      ElMessage.success('添加成功')
    }
    showAdd.value = false
    form.value = emptyForm()
    loadStudents()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  }
}

async function toggleStatus(row: any, status: string) {
  const action = status === 'disabled' ? '停用' : '启用'
  await ElMessageBox.confirm(`确定${action}学生「${row.name}」的账号？`, '提示', { type: 'warning' })
  await api.put(`/students/${row.id}/status`, { status })
  ElMessage.success(`已${action}`)
  loadStudents()
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该学生？', '提示', { type: 'warning' })
  await api.delete(`/students/${id}`)
  ElMessage.success('已删除')
  loadStudents()
}

async function viewRecommend(student: any) {
  currentStudent.value = student
  const { data } = await api.get(`/recommend/student/${student.id}`)
  if (data.success) {
    recommendations.value = data.data
    showRecommend.value = true
  } else {
    ElMessage.error(data.message)
  }
}

async function loadResetRequests() {
  try {
    const { data } = await api.get('/students/reset-requests')
    resetRequests.value = Array.isArray(data) ? data : []
    resetCount.value = resetRequests.value.length
  } catch {
    resetRequests.value = []
    resetCount.value = 0
  }
}

async function handleResetRequest(r: any) {
  await ElMessageBox.confirm(`确定将「${r.name}」的密码重置为 123456？`, '提示', { type: 'warning' })
  await api.post(`/students/${r.id}/handle-reset`, { newPassword: '123456' })
  ElMessage.success('已重置密码为 123456')
  loadResetRequests()
}

async function resetPwd(row: any) {
  await ElMessageBox.confirm(`确定将「${row.name}」的密码重置为 123456？`, '提示', { type: 'warning' })
  await api.post(`/students/${row.id}/reset-password`, { newPassword: '123456' })
  ElMessage.success('已重置密码为 123456')
}

function exportStudents() {
  const token = localStorage.getItem('token')
  window.open(`/api/export/students?token=${token}`, '_blank')
}
</script>

<style scoped>
.recommend-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 12px;
  border-left: 4px solid #ddd;
}
.recommend-card.safe { border-left-color: #52c41a; }
.recommend-card.stable { border-left-color: #1890ff; }
.recommend-card.reach { border-left-color: #fa8c16; }
.rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.rec-school { font-weight: bold; font-size: 15px; }
.rec-meta { display: flex; gap: 12px; font-size: 12px; color: #999; margin-bottom: 4px; }
.rec-reason { font-size: 13px; color: #666; }
</style>

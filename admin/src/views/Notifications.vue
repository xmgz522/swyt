<template>
  <div>
    <!-- 老师：个人通知 -->
    <el-card v-if="isTeacher">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: bold; font-size: 16px;">我的通知</span>
            <el-tag v-if="unreadCount > 0" type="danger" size="small">{{ unreadCount }} 条未读</el-tag>
          </div>
          <el-button size="small" @click="markAllTeacherRead">全部已读</el-button>
        </div>
      </template>
      <el-empty v-if="list.length === 0" description="暂无通知" />
      <div v-else class="notif-list">
        <div v-for="n in list" :key="n.id" class="notif-item" :class="{ unread: !n.isRead }" @click="markRead(n)">
          <div class="notif-header">
            <span class="notif-title">{{ n.title }}</span>
            <el-tag size="small" :type="typeColor[n.type]">{{ typeMap[n.type] || n.type }}</el-tag>
          </div>
          <div class="notif-content">{{ n.content }}</div>
          <div class="notif-time">{{ n.createdAt?.substring(0, 16).replace('T', ' ') }}</div>
        </div>
      </div>
    </el-card>

    <!-- 管理员：通知管理 -->
    <el-card v-else>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px;">消息通知管理</span>
          <div style="display: flex; gap: 10px;">
            <el-button type="warning" @click="triggerReminders" :loading="triggering">触发院校事件提醒</el-button>
            <el-button type="primary" @click="openAdd">发布通知</el-button>
          </div>
        </div>
      </template>
      <el-empty v-if="list.length === 0" description="暂无通知" />
      <el-table v-else :data="list" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="标题" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="typeColor[row.type]">{{ typeMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标" width="100">
          <template #default="{ row }">
            {{ row.teacherId ? `老师#${row.teacherId}` : row.targetStudentId === 0 ? '全体' : `学生#${row.targetStudentId}` }}
          </template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ row.createdAt?.substring(0, 16).replace('T', ' ') }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" link @click="remove(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" title="发布通知" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="通知标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="通知内容" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type">
            <el-option label="系统通知" value="system" />
            <el-option label="成绩通知" value="score" />
            <el-option label="政策更新" value="policy" />
            <el-option label="考试通知" value="exam" />
            <el-option label="报名提醒" value="reminder" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标">
          <el-radio-group v-model="targetType">
            <el-radio value="all">全体学生</el-radio>
            <el-radio value="one">指定学生ID</el-radio>
          </el-radio-group>
          <el-input-number v-if="targetType === 'one'" v-model="form.targetStudentId" :min="1" style="margin-left: 12px;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="send">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const typeMap: Record<string, string> = { system: '系统', score: '成绩', policy: '政策', exam: '考试', reminder: '提醒' }
const typeColor: Record<string, string> = { system: '', score: 'success', policy: 'warning', exam: 'primary', reminder: 'danger' }

const user = JSON.parse(localStorage.getItem('user') || '{}')
const isTeacher = user.role === 'teacher'
const userId = user.id

const list = ref<any[]>([])
const unreadCount = ref(0)
const showDialog = ref(false)
const targetType = ref('all')
const form = ref({ title: '', content: '', type: 'system', targetStudentId: 0 })
const triggering = ref(false)

onMounted(() => load())

async function load() {
  if (isTeacher) {
    const { data } = await api.get(`/notifications/teacher/${userId}`)
    list.value = Array.isArray(data) ? data : []
    const { data: cnt } = await api.get(`/notifications/teacher/${userId}/unread`)
    unreadCount.value = cnt?.count || 0
  } else {
    const { data } = await api.get('/notifications')
    list.value = Array.isArray(data) ? data : []
  }
}

async function markRead(n: any) {
  if (!n.isRead) {
    await api.put(`/notifications/${n.id}/read`)
    n.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

async function markAllTeacherRead() {
  await api.put(`/notifications/teacher/${userId}/read-all`)
  list.value.forEach((n: any) => { n.isRead = true })
  unreadCount.value = 0
  ElMessage.success('已全部标记为已读')
}

function openAdd() {
  form.value = { title: '', content: '', type: 'system', targetStudentId: 0 }
  targetType.value = 'all'
  showDialog.value = true
}

async function send() {
  if (!form.value.title) { ElMessage.warning('请输入标题'); return }
  const body = {
    ...form.value,
    targetStudentId: targetType.value === 'all' ? 0 : form.value.targetStudentId,
  }
  await api.post('/notifications', body)
  ElMessage.success('通知已发布')
  showDialog.value = false
  load()
}

async function remove(id: number) {
  await api.delete(`/notifications/${id}`)
  ElMessage.success('已删除')
  load()
}

async function triggerReminders() {
  triggering.value = true
  try {
    await api.post('/notifications/trigger-reminders')
    ElMessage.success('院校事件提醒已触发，相关学生将收到通知')
    load()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '触发失败')
  }
  triggering.value = false
}
</script>

<style scoped>
.notif-list { max-height: 600px; overflow-y: auto; }
.notif-item {
  padding: 14px 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background .2s;
}
.notif-item:hover { background: #f9f9fb; }
.notif-item.unread { background: #e6f4ff; }
.notif-item.unread:hover { background: #d6eaff; }
.notif-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.notif-title { font-weight: 600; font-size: 14px; color: #333; }
.notif-content { font-size: 13px; color: #666; line-height: 1.5; }
.notif-time { font-size: 12px; color: #aaa; margin-top: 4px; }
</style>

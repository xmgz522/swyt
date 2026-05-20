<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">注册码管理</h2>
      <el-button type="primary" @click="showGenerate = true">批量生成</el-button>
    </div>

    <!-- 筛选 -->
    <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
      <el-radio-group v-model="filter" @change="loadList">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="unused">未使用</el-radio-button>
        <el-radio-button label="used">已使用</el-radio-button>
      </el-radio-group>
      <span style="margin-left: auto; font-size: 14px; color: #999;">
        共 {{ list.length }} 条
      </span>
    </div>

    <!-- 列表 -->
    <el-table :data="list" border stripe style="width: 100%;" v-loading="loading">
      <el-table-column prop="code" label="注册码" width="160">
        <template #default="{ row }">
          <span style="font-family: monospace; font-weight: 600; letter-spacing: 1px;">{{ row.code }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'unused' ? 'success' : 'info'" size="small">
            {{ row.status === 'unused' ? '未使用' : '已使用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="usedByName" label="使用者" width="120">
        <template #default="{ row }">
          {{ row.usedByName || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="usedAt" label="使用时间" width="180">
        <template #default="{ row }">
          {{ row.usedAt ? formatTime(row.usedAt) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="expireAt" label="过期时间" width="180">
        <template #default="{ row }">
          <span :style="{ color: isExpired(row) ? '#f56c6c' : '' }">
            {{ row.expireAt ? formatTime(row.expireAt) : '永久有效' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注">
        <template #default="{ row }">
          {{ row.remark || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="生成时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'unused'" type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
          <span v-else style="color: #ccc; font-size: 12px;">-</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 生成弹窗 -->
    <el-dialog v-model="showGenerate" title="批量生成注册码" width="420px">
      <el-form label-width="90px">
        <el-form-item label="生成数量">
          <el-input-number v-model="genForm.count" :min="1" :max="500" />
        </el-form-item>
        <el-form-item label="有效天数">
          <el-input-number v-model="genForm.expireDays" :min="0" :max="365" />
          <span style="margin-left: 8px; font-size: 12px; color: #999;">0 表示永久有效</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="genForm.remark" placeholder="如：2024春季班" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGenerate = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="handleGenerate">生成</el-button>
      </template>
    </el-dialog>

    <!-- 生成结果弹窗 -->
    <el-dialog v-model="showResult" title="生成成功" width="500px">
      <p style="margin-bottom: 12px; color: #666;">已生成 {{ generatedCodes.length }} 个注册码，可复制发给学生：</p>
      <el-input
        type="textarea"
        :rows="8"
        :model-value="generatedCodes.join('\n')"
        readonly
        style="font-family: monospace;"
      />
      <template #footer>
        <el-button @click="copyAll">一键复制</el-button>
        <el-button type="primary" @click="showResult = false">关闭</el-button>
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
const filter = ref('')
const showGenerate = ref(false)
const showResult = ref(false)
const generating = ref(false)
const generatedCodes = ref<string[]>([])
const genForm = ref({ count: 20, expireDays: 0, remark: '' })

onMounted(() => loadList())

async function loadList() {
  loading.value = true
  try {
    const url = filter.value ? `/invite-codes?status=${filter.value}` : '/invite-codes'
    const { data: res } = await api.get(url)
    list.value = Array.isArray(res) ? res : []
  } catch {
    list.value = []
  }
  loading.value = false
}

async function handleGenerate() {
  generating.value = true
  try {
    const { data: res } = await api.post('/invite-codes/generate', {
      count: genForm.value.count,
      expireDays: genForm.value.expireDays || undefined,
      remark: genForm.value.remark || undefined,
    })
    if (res.success) {
      generatedCodes.value = res.data.map((c: any) => c.code)
      showGenerate.value = false
      showResult.value = true
      loadList()
      ElMessage.success(`成功生成 ${res.count} 个注册码`)
    }
  } catch {
    ElMessage.error('生成失败')
  }
  generating.value = false
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定删除注册码 ${row.code} ？`, '提示', { type: 'warning' })
  try {
    await api.delete(`/invite-codes/${row.id}`)
    ElMessage.success('已删除')
    loadList()
  } catch {
    ElMessage.error('删除失败')
  }
}

function copyAll() {
  navigator.clipboard.writeText(generatedCodes.value.join('\n'))
  ElMessage.success('已复制到剪贴板')
}

function formatTime(t: string) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function isExpired(row: any) {
  return row.expireAt && new Date(row.expireAt) < new Date()
}
</script>

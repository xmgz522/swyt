<template>
  <div>
    <!-- 导出区 -->
    <el-card style="margin-bottom: 20px;">
      <template #header>
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-icon><Download /></el-icon>
          <span>数据导出</span>
        </div>
      </template>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <el-button type="primary" @click="download('/api/export/schools', '院校列表')">
          导出院校
        </el-button>
        <el-button type="primary" @click="download('/api/export/students', '学生列表')">
          导出学生
        </el-button>
        <el-button type="primary" @click="download('/api/export/scores', '成绩列表')">
          导出成绩
        </el-button>
      </div>
    </el-card>

    <!-- 导入区 -->
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; gap: 8px;">
          <el-icon><Upload /></el-icon>
          <span>批量导入</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 院校导入 -->
        <el-tab-pane label="院校导入" name="schools">
          <div class="import-section">
            <div class="import-desc">
              <p>支持 <b>.xlsx</b> 格式，表头顺序：<code>学校名称*、地区、学校类型、学校简介、招生要求、学考要求、面试形式、适合人群、报考建议</code></p>
              <el-button link type="primary" @click="downloadTemplate('schools')">下载院校导入模板</el-button>
            </div>
            <el-upload
              :action="uploadUrl('schools')"
              :headers="headers"
              name="file"
              accept=".xlsx"
              :show-file-list="false"
              :on-success="(r: any) => onImportSuccess(r, '院校')"
              :on-error="onImportError"
              :before-upload="beforeUpload"
            >
              <el-button type="success" :loading="uploading">选择文件并导入</el-button>
            </el-upload>
          </div>
        </el-tab-pane>

        <!-- 题库导入 -->
        <el-tab-pane label="题库导入" name="questions">
          <div class="import-section">
            <div class="import-desc">
              <p>表头顺序：<code>题型*、题干*、科目、选项(分号分隔)、答案、解析、分值、难度、知识点</code></p>
              <p style="color: #999; font-size: 12px; margin-top: 4px;">
                题型可选：single_choice / multi_choice / judge / fill / short_answer
              </p>
              <el-button link type="primary" @click="downloadTemplate('questions')">下载题库导入模板</el-button>
            </div>
            <el-upload
              :action="uploadUrl('questions')"
              :headers="headers"
              name="file"
              accept=".xlsx"
              :show-file-list="false"
              :on-success="(r: any) => onImportSuccess(r, '题目')"
              :on-error="onImportError"
              :before-upload="beforeUpload"
            >
              <el-button type="success" :loading="uploading">选择文件并导入</el-button>
            </el-upload>
          </div>
        </el-tab-pane>

        <!-- 学生导入 -->
        <el-tab-pane label="学生导入" name="students">
          <div class="import-section">
            <div class="import-desc">
              <p>表头顺序：<code>姓名*、手机号、学校、年级、A等第数、B等第数、C等第数、D等第数、E等第数</code></p>
              <el-button link type="primary" @click="downloadTemplate('students')">下载学生导入模板</el-button>
            </div>
            <el-upload
              :action="uploadUrl('students')"
              :headers="headers"
              name="file"
              accept=".xlsx"
              :show-file-list="false"
              :on-success="(r: any) => onImportSuccess(r, '学生')"
              :on-error="onImportError"
              :before-upload="beforeUpload"
            >
              <el-button type="success" :loading="uploading">选择文件并导入</el-button>
            </el-upload>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 导入结果弹窗 -->
    <el-dialog v-model="resultVisible" title="导入结果" width="400px">
      <el-result :icon="resultData.inserted > 0 ? 'success' : 'warning'" :title="resultTitle">
        <template #sub-title>
          <p>读取总行数：{{ resultData.total }}</p>
          <p>成功导入：{{ resultData.inserted }} 条</p>
          <p v-if="resultData.total - resultData.inserted > 0" style="color: #e6a23c;">
            跳过：{{ resultData.total - resultData.inserted }} 条（缺少必填字段）
          </p>
        </template>
      </el-result>
      <template #footer>
        <el-button type="primary" @click="resultVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('schools')
const uploading = ref(false)
const resultVisible = ref(false)
const resultData = ref({ total: 0, inserted: 0 })
const resultType = ref('')

const headers = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
}))

const resultTitle = computed(() =>
  `${resultType.value}导入完成`
)

function uploadUrl(type: string) {
  return `/api/export/import/${type}`
}

function download(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  // need to add auth header for download
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } })
    .then(r => r.blob())
    .then(blob => {
      const u = URL.createObjectURL(blob)
      a.href = u
      a.download = `${name}_${Date.now()}.xlsx`
      a.click()
      URL.revokeObjectURL(u)
      ElMessage.success(`${name}导出成功`)
    })
    .catch(() => ElMessage.error('导出失败'))
}

function downloadTemplate(type: string) {
  const nameMap: Record<string, string> = {
    schools: '院校导入模板',
    questions: '题库导入模板',
    students: '学生导入模板',
  }
  download(`/api/export/template/${type}`, nameMap[type] || '模板')
}

function beforeUpload() {
  uploading.value = true
  return true
}

function onImportSuccess(response: any, type: string) {
  uploading.value = false
  resultType.value = type
  resultData.value = response || { total: 0, inserted: 0 }
  resultVisible.value = true
}

function onImportError() {
  uploading.value = false
  ElMessage.error('导入失败，请检查文件格式')
}
</script>

<style scoped>
.import-section {
  padding: 8px 0;
}
.import-desc {
  margin-bottom: 16px;
  line-height: 1.8;
}
.import-desc code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}
</style>

<template>
  <div>
    <el-card style="max-width: 500px; margin-bottom: 20px;">
      <template #header><span style="font-weight: bold;">AI 薄弱分析</span></template>
      <el-form :inline="true">
        <el-form-item label="选择学生">
          <el-select v-model="selectedStudentId" filterable placeholder="搜索学生" style="width: 240px;" @change="loadAnalysis">
            <el-option v-for="s in students" :key="s.id" :label="`${s.name} - ${s.schoolName || '未知'}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分析类型">
          <el-select v-model="bankType" style="width: 150px;" @change="loadAnalysis">
            <el-option label="三位一体报告" value="triad" />
            <el-option label="学考薄弱项" value="xuekao" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="loading" style="text-align: center; padding: 60px; color: #999;">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <p>正在加载分析数据...</p>
    </div>

    <template v-if="analysis && !loading">
      <!-- 总览 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-num blue">{{ analysis.totalExams }}</div>
            <div class="stat-label">参加考试</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-num">{{ analysis.totalQuestions }}</div>
            <div class="stat-label">答题总数</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-num green">{{ analysis.totalCorrect }}</div>
            <div class="stat-label">答对数量</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div :class="['stat-num', analysis.overallAccuracy >= 80 ? 'green' : analysis.overallAccuracy >= 60 ? 'orange' : 'red']">
              {{ analysis.overallAccuracy }}%
            </div>
            <div class="stat-label">总正确率</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- AI 总结 -->
      <el-card v-if="analysis.summary" style="margin-bottom: 20px;">
        <template #header>
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-tag type="danger" size="small">AI</el-tag>
            <span style="font-weight: bold;">智能分析总结</span>
          </div>
        </template>
        <p style="line-height: 1.8; color: #555;">{{ analysis.summary }}</p>
      </el-card>

      <!-- 知识点分析 -->
      <el-row :gutter="20">
        <el-col :span="14">
          <el-card>
            <template #header><span style="font-weight: bold;">知识点掌握情况</span></template>
            <div v-for="kp in analysis.knowledgePoints" :key="kp.name" style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 13px; font-weight: 600;">{{ kp.name }}</span>
                <span :style="{ color: kp.accuracy >= 80 ? '#52c41a' : kp.accuracy >= 60 ? '#fa8c16' : '#f5222d', fontWeight: 'bold', fontSize: '13px' }">
                  {{ kp.accuracy }}% ({{ kp.correct }}/{{ kp.total }})
                </span>
              </div>
              <el-progress
                :percentage="kp.accuracy"
                :color="kp.accuracy >= 80 ? '#52c41a' : kp.accuracy >= 60 ? '#fa8c16' : '#f5222d'"
                :stroke-width="10"
                :show-text="false"
              />
            </div>
            <el-empty v-if="!analysis.knowledgePoints?.length" description="暂无知识点数据" />
          </el-card>
        </el-col>
        <el-col :span="10">
          <!-- 建议 -->
          <el-card style="margin-bottom: 20px;">
            <template #header><span style="font-weight: bold;">改进建议</span></template>
            <div v-for="(s, idx) in analysis.suggestions" :key="idx" style="display: flex; gap: 8px; margin-bottom: 12px;">
              <el-tag :type="idx === 0 ? 'danger' : idx === 1 ? 'warning' : 'success'" size="small" round>{{ idx + 1 }}</el-tag>
              <span style="font-size: 13px; line-height: 1.6;">{{ s }}</span>
            </div>
            <el-empty v-if="!analysis.suggestions?.length" description="暂无建议" />
          </el-card>

          <!-- 薄弱知识点 -->
          <el-card v-if="analysis.weak?.length">
            <template #header>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: bold;">薄弱知识点</span>
                <el-tag type="danger" size="small">需重点关注</el-tag>
              </div>
            </template>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <el-tag v-for="w in analysis.weak" :key="w" type="danger" effect="light" round>{{ w }}</el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <el-empty v-if="!analysis && !loading && selectedStudentId" description="该学生暂无做题数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import api from '../api'

const students = ref<any[]>([])
const selectedStudentId = ref<number | null>(null)
const bankType = ref('triad')
const analysis = ref<any>(null)
const loading = ref(false)

async function loadAnalysis() {
  if (!selectedStudentId.value) return
  loading.value = true
  analysis.value = null
  try {
    const { data } = await api.get(`/exam/analysis/${selectedStudentId.value}?bankType=${bankType.value}`)
    if (data.success) {
      analysis.value = data.data
    } else {
      analysis.value = null
    }
  } catch {
    ElMessage.error('加载分析数据失败')
  }
  loading.value = false
}

onMounted(async () => {
  const { data } = await api.get('/students')
  students.value = Array.isArray(data) ? data : data?.data || []
})
</script>

<style scoped>
.stat-card { text-align: center; }
.stat-card :deep(.el-card__body) { padding: 24px; }
.stat-num { font-size: 36px; font-weight: bold; color: #333; }
.stat-num.blue { color: #667eea; }
.stat-num.green { color: #52c41a; }
.stat-num.orange { color: #fa8c16; }
.stat-num.red { color: #f5222d; }
.stat-label { font-size: 13px; color: #999; margin-top: 4px; }
</style>

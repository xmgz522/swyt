<template>
  <div class="report-page">
    <!-- 选择学生 -->
    <el-card v-if="!report" style="max-width: 500px; margin: 40px auto;">
      <template #header><span style="font-weight: bold;">生成测评报告</span></template>
      <el-form label-width="80px">
        <el-form-item label="选择学生">
          <el-select v-model="selectedStudentId" filterable placeholder="搜索学生姓名" style="width: 100%;">
            <el-option v-for="s in students" :key="s.id" :label="`${s.name} - ${s.schoolName || '未知学校'}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="!selectedStudentId" @click="generateReport">生成报告</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 报告内容 -->
    <div v-else class="report-container" ref="reportRef">
      <div class="report-actions no-print">
        <el-button @click="report = null">返回</el-button>
        <el-button type="primary" @click="printReport">打印报告</el-button>
      </div>

      <div class="report-content">
        <div class="report-header">
          <h1>浙江三位一体测评报告</h1>
          <p class="report-date">生成日期: {{ report.generatedAt?.substring(0, 10) }}</p>
        </div>

        <!-- 基本信息 -->
        <div class="section">
          <h2>一、学生基本信息</h2>
          <table class="info-table">
            <tr><td class="label">姓名</td><td>{{ report.student.name }}</td><td class="label">年级</td><td>{{ report.student.grade || '-' }}</td></tr>
            <tr><td class="label">学校</td><td>{{ report.student.schoolName || '-' }}</td><td class="label">手机号</td><td>{{ report.student.phone || '-' }}</td></tr>
            <tr><td class="label">意向地区</td><td>{{ report.student.preferredRegion || '-' }}</td><td class="label">意向专业</td><td>{{ report.student.preferredMajor || '-' }}</td></tr>
          </table>
          <div class="grade-bar">
            <span class="grade-item ga">{{ report.student.gradeA }}A</span>
            <span class="grade-item gb">{{ report.student.gradeB }}B</span>
            <span class="grade-item gc">{{ report.student.gradeC }}C</span>
            <span class="grade-item gd">{{ report.student.gradeD }}D</span>
            <span class="grade-item ge">{{ report.student.gradeE }}E</span>
          </div>
        </div>

        <!-- 院校推荐 -->
        <div class="section" v-if="report.recommendations.length > 0">
          <h2>二、院校推荐</h2>
          <table class="data-table">
            <thead><tr><th>学校</th><th>地区</th><th>类型</th><th>推荐等级</th></tr></thead>
            <tbody>
              <tr v-for="r in report.recommendations" :key="r.schoolName">
                <td style="font-weight: 600;">{{ r.schoolName }}</td>
                <td>{{ r.region }}</td>
                <td>{{ r.type }}</td>
                <td><span :class="'level-' + r.level">{{ r.levelText }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 考试成绩 -->
        <div class="section" v-if="report.examResults.length > 0">
          <h2>三、考试成绩</h2>
          <div v-for="(exam, idx) in report.examResults" :key="idx" class="exam-block">
            <h3>{{ exam.paperTitle }}</h3>
            <div class="score-summary">
              <span>客观题: <strong>{{ exam.objectiveScore }}</strong>分</span>
              <span>主观题: <strong>{{ exam.subjectiveScore ?? '待批' }}</strong>分</span>
              <span>总分: <strong class="total-score">{{ exam.totalScore }}</strong> / {{ exam.paperTotalScore }}分</span>
            </div>
            <div v-if="exam.comment" class="teacher-comment">
              <strong>老师评语：</strong>{{ exam.comment }}
            </div>
            <table class="data-table" style="font-size: 12px;">
              <thead><tr><th>#</th><th>题目</th><th>学生答案</th><th>正确答案</th><th>结果</th></tr></thead>
              <tbody>
                <tr v-for="(q, qi) in exam.detail" :key="qi">
                  <td>{{ qi + 1 }}</td>
                  <td style="max-width: 300px;">{{ q.content.substring(0, 50) }}{{ q.content.length > 50 ? '...' : '' }}</td>
                  <td>{{ q.studentAnswer || '-' }}</td>
                  <td>{{ q.correctAnswer || '(主观题)' }}</td>
                  <td>
                    <span v-if="q.isCorrect === true" style="color: #52c41a;">✓</span>
                    <span v-else-if="q.isCorrect === false" style="color: #f5222d;">✗</span>
                    <span v-else style="color: #fa8c16;">待批</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 薄弱点分析 -->
        <div class="section" v-if="report.weakAnalysis.length > 0">
          <h2>四、薄弱知识点分析</h2>
          <div class="weak-list">
            <div v-for="w in report.weakAnalysis" :key="w.point" class="weak-item">
              <span class="weak-name">{{ w.point }}</span>
              <div class="weak-bar">
                <div class="weak-fill" :style="{ width: (w.count / maxWeak * 100) + '%' }"></div>
              </div>
              <span class="weak-count">{{ w.count }}次</span>
            </div>
          </div>
          <div class="suggestion">
            <h3>改进建议</h3>
            <p v-for="w in report.weakAnalysis.slice(0, 3)" :key="w.point">
              ▸ <strong>{{ w.point }}</strong>：建议重点复习此知识点，出错{{ w.count }}次，需要加强练习。
            </p>
          </div>
        </div>

        <div class="report-footer">
          <p>—— 浙江三位一体测评系统 ——</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const students = ref<any[]>([])
const selectedStudentId = ref<number | null>(null)
const report = ref<any>(null)
const reportRef = ref<HTMLElement>()

const maxWeak = computed(() => {
  if (!report.value?.weakAnalysis?.length) return 1
  return Math.max(...report.value.weakAnalysis.map((w: any) => w.count), 1)
})

onMounted(async () => {
  const { data } = await api.get('/students')
  students.value = Array.isArray(data) ? data : data?.data || []
})

async function generateReport() {
  if (!selectedStudentId.value) return
  try {
    const { data } = await api.get(`/report/student/${selectedStudentId.value}`)
    if (!data) {
      ElMessage.error('学生不存在')
      return
    }
    report.value = data
  } catch (e: any) {
    ElMessage.error('生成报告失败')
  }
}

function printReport() {
  window.print()
}
</script>

<style scoped>
.report-page { min-height: 100%; }
.report-actions { margin-bottom: 16px; display: flex; gap: 10px; }
.report-container { max-width: 900px; margin: 0 auto; }
.report-content { background: white; padding: 40px 50px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
.report-header h1 { font-size: 24px; color: #1d1e3a; margin: 0 0 8px 0; }
.report-date { color: #999; font-size: 13px; }
.section { margin-bottom: 30px; }
.section h2 { font-size: 17px; color: #1d1e3a; border-left: 4px solid #667eea; padding-left: 12px; margin-bottom: 16px; }
.info-table { width: 100%; border-collapse: collapse; }
.info-table td { padding: 10px 14px; border: 1px solid #eee; }
.info-table .label { background: #f5f7fa; font-weight: 600; width: 90px; color: #666; }
.grade-bar { display: flex; gap: 8px; margin-top: 12px; }
.grade-item { padding: 6px 16px; border-radius: 4px; font-weight: bold; color: white; font-size: 14px; }
.ga { background: #f5222d; }
.gb { background: #fa8c16; }
.gc { background: #1890ff; }
.gd { background: #8c8c8c; }
.ge { background: #bfbfbf; }
.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.data-table th, .data-table td { padding: 8px 12px; border: 1px solid #eee; text-align: left; }
.data-table th { background: #f5f7fa; font-weight: 600; font-size: 13px; }
.level-safe { color: #52c41a; font-weight: bold; }
.level-stable { color: #1890ff; font-weight: bold; }
.level-reach { color: #fa8c16; font-weight: bold; }
.exam-block { margin-bottom: 24px; padding: 16px; background: #fafafa; border-radius: 8px; }
.exam-block h3 { margin: 0 0 8px 0; font-size: 15px; }
.score-summary { display: flex; gap: 20px; margin-bottom: 8px; font-size: 14px; }
.total-score { color: #667eea; font-size: 18px; }
.teacher-comment { background: #fffbe6; padding: 8px 14px; border-radius: 4px; margin-bottom: 8px; font-size: 13px; }
.weak-list { margin-bottom: 16px; }
.weak-item { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.weak-name { width: 100px; font-size: 13px; text-align: right; }
.weak-bar { flex: 1; height: 16px; background: #f0f0f0; border-radius: 8px; overflow: hidden; }
.weak-fill { height: 100%; background: linear-gradient(90deg, #f5222d, #fa8c16); border-radius: 8px; transition: width 0.5s; }
.weak-count { width: 50px; font-size: 13px; color: #999; }
.suggestion { background: #f6ffed; padding: 16px; border-radius: 8px; border: 1px solid #b7eb8f; }
.suggestion h3 { margin: 0 0 8px 0; font-size: 14px; color: #52c41a; }
.suggestion p { margin: 6px 0; font-size: 13px; line-height: 1.6; }
.report-footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 13px; }

@media print {
  .no-print { display: none !important; }
  .report-content { box-shadow: none; padding: 20px; }
  .el-card, .report-page { background: white !important; }
}
</style>

<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: bold; font-size: 16px;">错题管理</span>
            <el-radio-group v-model="activeBankType" size="small" @change="loadData">
              <el-radio-button value="triad">三位一体</el-radio-button>
              <el-radio-button value="xuekao">学考</el-radio-button>
            </el-radio-group>
            <el-tag size="small" type="danger">共 {{ total }} 条</el-tag>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <el-select v-model="filterStudent" placeholder="筛选学生" clearable filterable style="width: 200px;" @change="loadData">
              <el-option v-for="s in students" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
            <el-select v-if="activeBankType === 'xuekao'" v-model="filterSubject" placeholder="筛选科目" clearable style="width: 120px;" @change="loadData">
              <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
            </el-select>
            <el-select v-model="filterMastered" placeholder="掌握状态" clearable style="width: 120px;" @change="loadData">
              <el-option label="待攻克" value="false" />
              <el-option label="已掌握" value="true" />
            </el-select>
          </div>
        </div>
      </template>

      <el-empty v-if="wrongNotes.length === 0" description="暂无错题数据" />
      <el-table v-else :data="wrongNotes" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="学生" width="100">
          <template #default="{ row }">
            <span>{{ studentMap[row.studentId] || `#${row.studentId}` }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="activeBankType === 'xuekao'" label="科目" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.subject || row.question?.subject || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="知识点" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.question?.knowledgePoint" size="small" type="warning">{{ row.question.knowledgePoint }}</el-tag>
            <span v-else style="color: #ccc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="题目" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.question?.content || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="错误次数" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.wrongCount >= 3 ? 'danger' : row.wrongCount >= 2 ? 'warning' : 'info'" size="small">
              {{ row.wrongCount }}次
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.mastered ? 'success' : 'danger'" size="small">
              {{ row.mastered ? '已掌握' : '待攻克' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="正确答案" width="100">
          <template #default="{ row }">
            <span style="color: #52c41a; font-weight: 600;">{{ row.question?.answer || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; display: flex; justify-content: center;">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header><span style="font-weight: bold;">{{ activeBankType === 'xuekao' ? '科目错题分布' : '知识点错题分布' }}</span></template>
          <div v-for="s in subjectStats" :key="s.subject" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <span style="width: 60px; font-size: 13px; text-align: right;">{{ s.subject }}</span>
            <el-progress :percentage="getSubjectPct(s.count)" :color="'#f5222d'" :show-text="false" style="flex: 1;" />
            <span style="width: 40px; font-size: 12px; color: #999;">{{ s.count }}</span>
          </div>
          <div v-if="subjectStats.length === 0" style="text-align: center; color: #ccc; padding: 20px;">暂无数据</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header><span style="font-weight: bold;">错题频次 TOP 10</span></template>
          <div v-for="(item, idx) in topWrong" :key="idx" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <el-tag :type="idx < 3 ? 'danger' : 'info'" size="small" style="width: 24px; text-align: center;">{{ idx + 1 }}</el-tag>
            <span style="flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ item.question?.content || '-' }}</span>
            <el-tag size="small" type="danger">{{ item.wrongCount }}次</el-tag>
          </div>
          <div v-if="topWrong.length === 0" style="text-align: center; color: #ccc; padding: 20px;">暂无数据</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header><span style="font-weight: bold;">掌握概况</span></template>
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; font-weight: bold; color: #f5222d;">{{ overviewStats.unmastered }}</div>
            <div style="color: #999; margin-bottom: 16px;">待攻克</div>
            <div style="font-size: 48px; font-weight: bold; color: #52c41a;">{{ overviewStats.mastered }}</div>
            <div style="color: #999;">已掌握</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '../api'

const students = ref<any[]>([])
const studentMap = ref<Record<number, string>>({})
const wrongNotes = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const activeBankType = ref('triad')
const filterStudent = ref<number | null>(null)
const filterSubject = ref('')
const filterMastered = ref('')
const subjects = ['英语', '语文', '数学', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const subjectStats = ref<any[]>([])
const topWrong = ref<any[]>([])
const overviewStats = ref({ mastered: 0, unmastered: 0 })

function getSubjectPct(count: number) {
  const max = Math.max(...subjectStats.value.map(s => s.count), 1)
  return Math.round(count / max * 100)
}

async function loadData() {
  if (!filterStudent.value) {
    // 加载全部学生的统计
    wrongNotes.value = []
    total.value = 0
    await loadAllStats()
    return
  }
  const sid = filterStudent.value
  const bt = activeBankType.value
  if (bt !== 'xuekao') filterSubject.value = ''
  const params: any = { page: page.value, pageSize, bankType: bt }
  if (filterMastered.value) params.mastered = filterMastered.value
  if (filterSubject.value) params.subject = filterSubject.value
  try {
    const { data } = await api.get(`/exam/wrong-notes/${sid}`, { params })
    wrongNotes.value = data.data || []
    total.value = data.total || 0
  } catch {
    wrongNotes.value = []
    total.value = 0
  }
  try {
    const { data } = await api.get(`/exam/wrong-notes/${sid}/stats?bankType=${bt}`)
    subjectStats.value = data.bySubject || []
    overviewStats.value = { mastered: data.masteredCount || 0, unmastered: data.unmasteredCount || 0 }
  } catch {}
}

async function loadAllStats() {
  let allUnmastered = 0, allMastered = 0
  const subjectMap: Record<string, number> = {}
  const allNotes: any[] = []

  const bt = activeBankType.value
  for (const s of students.value) {
    try {
      const { data } = await api.get(`/exam/wrong-notes/${s.id}/stats?bankType=${bt}`)
      allUnmastered += data.unmasteredCount || 0
      allMastered += data.masteredCount || 0
      ;(data.bySubject || []).forEach((sub: any) => {
        const key = sub.subject || '未分类'
        subjectMap[key] = (subjectMap[key] || 0) + sub.count
      })
    } catch {}
    try {
      const { data } = await api.get(`/exam/wrong-notes/${s.id}?page=1&pageSize=5&mastered=false&bankType=${bt}`)
      ;(data.data || []).forEach((n: any) => allNotes.push(n))
    } catch {}
  }
  overviewStats.value = { mastered: allMastered, unmastered: allUnmastered }
  total.value = allUnmastered + allMastered
  subjectStats.value = Object.entries(subjectMap).map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count)
  topWrong.value = allNotes.sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 10)
}

onMounted(async () => {
  const { data } = await api.get('/students')
  const list = Array.isArray(data) ? data : data?.data || []
  students.value = list
  const map: Record<number, string> = {}
  list.forEach((s: any) => { map[s.id] = s.name })
  studentMap.value = map
  await loadAllStats()
})
</script>

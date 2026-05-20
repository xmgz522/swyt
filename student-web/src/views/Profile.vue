<template>
  <div>
    <h1 class="text-xl font-bold text-gray-800 mb-6">我的信息</h1>

    <!-- 账号有效期 + 完成度 -->
    <div class="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-50">
      <div v-if="remainDays !== null" class="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
        <span class="text-sm text-gray-500">账号有效期</span>
        <span class="text-sm font-bold" :class="remainDays <= 30 ? 'text-red-500' : 'text-green-500'">剩余 {{ remainDays }} 天</span>
      </div>
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm text-gray-500">资料完成度</span>
        <span class="text-sm font-bold text-primary-500">{{ completionPct }}%</span>
      </div>
      <el-progress :percentage="completionPct" :show-text="false" :stroke-width="8" color="#667eea" />
    </div>

    <el-form :model="form" label-width="100px" label-position="top" class="space-y-6">
      <!-- 基本信息 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50">
        <h3 class="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-primary-500"></span>基本信息
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="姓名">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="form.phone" placeholder="请输入手机号" />
          </el-form-item>
        </div>
        <el-form-item label="所在学校" class="mt-2">
          <div class="flex gap-2 w-full">
            <el-select v-model="selectedCity" placeholder="选择市" class="flex-1" filterable @change="onCityChange">
              <el-option v-for="c in schoolData.cities" :key="c.name" :label="c.name" :value="c.name" />
            </el-select>
            <el-select v-model="selectedDistrict" placeholder="选择区县" class="flex-1" filterable :disabled="!selectedCity" @change="onDistrictChange">
              <el-option v-for="d in currentDistricts" :key="d.name" :label="d.name" :value="d.name" />
            </el-select>
            <el-select v-model="form.schoolName" placeholder="选择学校" class="flex-1" filterable :disabled="!selectedDistrict">
              <el-option v-for="s in currentSchools" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4 mt-2">
          <el-form-item label="年级">
            <el-select v-model="form.grade" placeholder="请选择" class="w-full">
              <el-option label="高一" value="高一" />
              <el-option label="高二" value="高二" />
              <el-option label="高三" value="高三" />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 学考等级 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50">
        <h3 class="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-orange-500"></span>学考等级
          <span class="text-xs text-gray-400 font-normal ml-1">（每科选择等级，未考留空）</span>
        </h3>

        <!-- 统计概览 -->
        <div class="flex justify-around mb-5">
          <div v-for="g in gradeFields" :key="g.field" class="flex flex-col items-center gap-1">
            <div
              :class="['w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all', gradeCounts[g.name] > 0 ? g.activeBg + ' text-white' : 'bg-gray-100 text-gray-300']"
            >
              {{ gradeCounts[g.name] }}
            </div>
            <span class="text-xs text-gray-500">{{ g.name }}等</span>
          </div>
        </div>

        <!-- 每科选等级 -->
        <div class="space-y-2 mb-4">
          <div v-for="(item, idx) in sgList" :key="item.subject" class="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <span class="text-sm text-gray-700 font-medium w-12">{{ item.subject }}</span>
            <div class="flex gap-2 flex-1">
              <button
                type="button"
                v-for="opt in pcGradeOptions"
                :key="opt.value"
                :class="['px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer',
                  item.grade === opt.value
                    ? opt.activeCls
                    : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100']"
                @click="pickGrade(idx, opt.value)"
              >{{ opt.value }}</button>
              <button
                type="button"
                :class="['px-3 py-1 rounded-lg text-xs font-medium border-2 transition-all cursor-pointer',
                  !item.grade
                    ? 'bg-gray-100 border-gray-300 text-gray-600'
                    : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100']"
                @click="pickGrade(idx, '')"
              >未考</button>
            </div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="pt-4 border-t border-gray-100">
          <div class="flex h-3 rounded-full overflow-hidden bg-gray-100">
            <div class="bg-red-500 transition-all" :style="{ width: (gradeCounts.A / 10 * 100) + '%' }"></div>
            <div class="bg-orange-500 transition-all" :style="{ width: (gradeCounts.B / 10 * 100) + '%' }"></div>
            <div class="bg-blue-500 transition-all" :style="{ width: (gradeCounts.C / 10 * 100) + '%' }"></div>
            <div class="bg-gray-400 transition-all" :style="{ width: (gradeCounts.D / 10 * 100) + '%' }"></div>
            <div class="bg-gray-300 transition-all" :style="{ width: (gradeCounts.E / 10 * 100) + '%' }"></div>
          </div>
          <p :class="['text-xs mt-2 text-center', gradeTotal === 10 ? 'text-green-500' : 'text-orange-500']">
            已填 {{ gradeTotal }} / 10 门
            {{ gradeTotal < 10 ? `（还有${10 - gradeTotal}门未考）` : ' ✓ 全部完成' }}
          </p>
        </div>
      </div>

      <!-- 报考意向 -->
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-50">
        <h3 class="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>报考意向
          <span class="text-xs text-gray-400 font-normal ml-1">（选填）</span>
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="意向地区">
            <el-select v-model="form.preferredRegion" placeholder="请选择意向地区" class="w-full" filterable clearable>
              <el-option v-for="r in schoolData.regions" :key="r" :label="r" :value="r" />
            </el-select>
          </el-form-item>
          <el-form-item label="意向专业">
            <el-select v-model="form.preferredMajor" placeholder="请选择意向专业" class="w-full" filterable clearable>
              <el-option v-for="m in schoolData.majors" :key="m" :label="m" :value="m" />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <el-button type="primary" size="large" class="w-full !rounded-xl !h-12" :loading="saving" @click="handleSave">
        {{ store.isLoggedIn ? '更新信息' : '提交信息' }}
      </el-button>
    </el-form>

    <!-- 账号安全 -->
    <div v-if="store.isLoggedIn" class="bg-white rounded-xl p-6 shadow-sm border border-gray-50 mt-6">
      <h3 class="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>账号安全
      </h3>
      <div class="flex gap-3">
        <el-button @click="showPwdDialog = true">修改密码</el-button>
        <el-button @click="showPhoneDialog = true">换绑手机号 <span class="text-gray-400 ml-1 text-xs">{{ form.phone }}</span></el-button>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showPwdDialog" title="修改密码" width="400px">
      <el-form label-width="80px">
        <el-form-item label="原密码"><el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入原密码" /></el-form-item>
        <el-form-item label="新密码"><el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少6位" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPwdDialog = false">取消</el-button>
        <el-button type="primary" @click="submitChangePwd">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 换绑手机弹窗 -->
    <el-dialog v-model="showPhoneDialog" title="换绑手机号" width="400px">
      <el-form label-width="80px">
        <el-form-item label="新手机号"><el-input v-model="phoneForm.newPhone" placeholder="请输入新手机号" maxlength="11" /></el-form-item>
        <el-form-item label="密码验证"><el-input v-model="phoneForm.password" type="password" show-password placeholder="请输入当前密码" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPhoneDialog = false">取消</el-button>
        <el-button type="primary" @click="submitChangePhone">确认换绑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useStudentStore } from '@/stores/student'
import http from '@/utils/api'
import schoolData from '../../../shared/school-data.json'

const store = useStudentStore()
const saving = ref(false)

const gradeFields = [
  { field: 'gradeA', name: 'A', activeBg: 'bg-red-500', dotColor: 'bg-red-500' },
  { field: 'gradeB', name: 'B', activeBg: 'bg-orange-500', dotColor: 'bg-orange-500' },
  { field: 'gradeC', name: 'C', activeBg: 'bg-blue-500', dotColor: 'bg-blue-500' },
  { field: 'gradeD', name: 'D', activeBg: 'bg-gray-500', dotColor: 'bg-gray-400' },
  { field: 'gradeE', name: 'E', activeBg: 'bg-gray-400', dotColor: 'bg-gray-300' },
]

const allSubjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']
const pcGradeOptions = [
  { value: 'A', activeCls: 'bg-red-50 border-red-500 text-red-500' },
  { value: 'B', activeCls: 'bg-orange-50 border-orange-500 text-orange-500' },
  { value: 'C', activeCls: 'bg-blue-50 border-blue-500 text-blue-500' },
  { value: 'D', activeCls: 'bg-gray-100 border-gray-500 text-gray-500' },
  { value: 'E', activeCls: 'bg-gray-50 border-gray-400 text-gray-400' },
]

const form = reactive<any>({
  name: '', phone: '', schoolName: '', grade: '',
  gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, gradeE: 0,
  preferredRegion: '', preferredMajor: '',
  subjectGrades: '',
})

// 每科成绩（用 ref 数组）
const sgList = ref(allSubjects.map(s => ({ subject: s, grade: '' })))

const gradeCounts = computed(() => {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 }
  for (const item of sgList.value) {
    if (item.grade && item.grade in counts) counts[item.grade]++
  }
  return counts
})

const gradeTotal = computed(() => sgList.value.filter(item => item.grade).length)

function pickGrade(idx: number, val: string) {
  sgList.value[idx] = { ...sgList.value[idx], grade: val }
}

// 学校三级联动
const selectedCity = ref('')
const selectedDistrict = ref('')

const currentDistricts = computed(() => {
  const city = schoolData.cities.find(c => c.name === selectedCity.value)
  return city ? city.districts : []
})
const currentSchools = computed(() => {
  const dist = currentDistricts.value.find(d => d.name === selectedDistrict.value)
  return dist ? dist.schools : []
})

function onCityChange() {
  selectedDistrict.value = ''
  form.schoolName = ''
}
function onDistrictChange() {
  form.schoolName = ''
}

// 加载时反向查找已选学校所属城市和区县
function reverseSelectSchool(name: string) {
  if (!name) return
  for (const city of schoolData.cities) {
    for (const dist of city.districts) {
      if (dist.schools.includes(name)) {
        selectedCity.value = city.name
        selectedDistrict.value = dist.name
        return
      }
    }
  }
}

const remainDays = computed(() => {
  if (!form.expireAt) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(form.expireAt)
  const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

const completionPct = computed(() => {
  let done = 0, total = 6
  if (form.name) done++
  if (form.phone) done++
  if (form.schoolName) done++
  if (form.grade) done++
  if (gradeTotal.value > 0) done++
  if (form.preferredRegion || form.preferredMajor) done++
  return Math.round(done / total * 100)
})

onMounted(() => {
  if (store.profile) {
    Object.assign(form, store.profile)
    reverseSelectSchool(form.schoolName)
    // 恢复每科成绩
    if (store.profile.subjectGrades) {
      try {
        const sg = typeof store.profile.subjectGrades === 'string' ? JSON.parse(store.profile.subjectGrades) : store.profile.subjectGrades
        sgList.value = allSubjects.map(s => ({ subject: s, grade: sg[s] || '' }))
      } catch {}
    } else if ((store.profile.gradeA || 0) + (store.profile.gradeB || 0) + (store.profile.gradeC || 0) + (store.profile.gradeD || 0) + (store.profile.gradeE || 0) > 0) {
      // 兼容旧数据
      const arr = allSubjects.map(s => ({ subject: s, grade: '' }))
      let idx = 0
      const p = store.profile
      for (let i = 0; i < (p.gradeA || 0) && idx < arr.length; i++) arr[idx++].grade = 'A'
      for (let i = 0; i < (p.gradeB || 0) && idx < arr.length; i++) arr[idx++].grade = 'B'
      for (let i = 0; i < (p.gradeC || 0) && idx < arr.length; i++) arr[idx++].grade = 'C'
      for (let i = 0; i < (p.gradeD || 0) && idx < arr.length; i++) arr[idx++].grade = 'D'
      for (let i = 0; i < (p.gradeE || 0) && idx < arr.length; i++) arr[idx++].grade = 'E'
      sgList.value = arr
    }
  }
})

async function handleSave() {
  if (!form.name?.trim()) { ElMessage.warning('请填写姓名'); return }
  if (form.phone && !/^1[3-9]\d{9}$/.test(form.phone)) { ElMessage.warning('手机号格式不正确'); return }
  // 保存前同步 subjectGrades
  const sgObj: Record<string, string> = {}
  sgList.value.forEach(item => { sgObj[item.subject] = item.grade })
  form.subjectGrades = JSON.stringify(sgObj)
  form.gradeA = gradeCounts.value.A
  form.gradeB = gradeCounts.value.B
  form.gradeC = gradeCounts.value.C
  form.gradeD = gradeCounts.value.D
  form.gradeE = gradeCounts.value.E
  saving.value = true
  try {
    await store.saveProfile({ ...form })
    ElMessage.success('保存成功')
  } catch (e: any) {
    ElMessage.error(e?.data?.message || '保存失败')
  }
  saving.value = false
}

const showPwdDialog = ref(false)
const showPhoneDialog = ref(false)
const pwdForm = reactive({ oldPassword: '', newPassword: '' })
const phoneForm = reactive({ newPhone: '', password: '' })

async function submitChangePwd() {
  if (!pwdForm.newPassword || pwdForm.newPassword.length < 6) {
    ElMessage.warning('新密码至少6位'); return
  }
  try {
    await http.post(`/students/${store.studentId}/change-password`, pwdForm)
    ElMessage.success('密码修改成功')
    showPwdDialog.value = false
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
  } catch (e: any) {
    ElMessage.error(e?.data?.message || '修改失败')
  }
}

async function submitChangePhone() {
  if (!phoneForm.newPhone || !/^1[3-9]\d{9}$/.test(phoneForm.newPhone)) {
    ElMessage.warning('请输入正确的新手机号'); return
  }
  if (!phoneForm.password) {
    ElMessage.warning('请输入密码'); return
  }
  try {
    await http.post(`/students/${store.studentId}/change-phone`, phoneForm)
    ElMessage.success('换绑成功')
    showPhoneDialog.value = false
    form.phone = phoneForm.newPhone
    phoneForm.newPhone = ''
    phoneForm.password = ''
  } catch (e: any) {
    ElMessage.error(e?.data?.message || '换绑失败')
  }
}
</script>

<template>
  <view class="page">
    <!-- 未登录提示 -->
    <view v-if="!studentId" class="login-prompt">
      <view class="login-prompt-inner">
        <text class="lp-icon">👤</text>
        <text class="lp-title">还未登录</text>
        <text class="lp-desc">登录后可管理个人信息、查看学考成绩和推荐院校</text>
        <button class="lp-btn" @tap="goLogin">去登录 / 注册</button>
      </view>
    </view>

    <!-- 已登录内容 -->
    <template v-else>
    <!-- 头部用户区 -->
    <view class="profile-hero">
      <view class="avatar-wrap">
        <view class="avatar">
          <text class="avatar-text">{{ form.name ? form.name.substring(0, 1) : '?' }}</text>
        </view>
        <view class="profile-brief" v-if="studentId">
          <text class="profile-name">{{ form.name || '未设置姓名' }}</text>
          <text class="profile-school">{{ form.schoolName || '未设置学校' }} · {{ form.grade || '未选年级' }}</text>
        </view>
        <view class="profile-brief" v-else>
          <text class="profile-name">新同学</text>
          <text class="profile-school">请填写以下信息开始使用</text>
        </view>
      </view>
      <!-- 完成度进度条 -->
      <view class="progress-wrap">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: completionPct + '%' }"></view>
        </view>
        <text class="progress-text">资料完成度 {{ completionPct }}%</text>
      </view>
    </view>

    <!-- 账号有效期 -->
    <view v-if="remainDays !== null" class="expire-bar">
      <text class="expire-label">账号有效期</text>
      <text :class="['expire-value', remainDays <= 30 ? 'warn' : '']">剩余 {{ remainDays }} 天</text>
    </view>

    <!-- 基本信息 -->
    <view class="section-header">
      <view class="section-dot"></view>
      <text class="section-title">基本信息</text>
    </view>
    <view class="form-card">
      <view class="form-item">
        <text class="label">姓名</text>
        <input v-model="form.name" placeholder="请输入姓名" class="input" placeholder-class="placeholder" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="form.phone" type="number" placeholder="请输入手机号" class="input" placeholder-class="placeholder" />
      </view>
      <view class="form-item" @tap="showSchoolPicker = true">
        <text class="label">所在学校</text>
        <view class="picker-value">
          <text :style="{ color: form.schoolName ? '#333' : '#c0c4cc' }">{{ form.schoolName || '请选择学校（市→区县→学校）' }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </view>
      <view class="form-item no-border">
        <text class="label">年级</text>
        <picker :range="['高一','高二','高三']" @change="(e:any) => form.grade = ['高一','高二','高三'][e.detail.value]">
          <view class="picker-value">
            <text :style="{ color: form.grade ? '#333' : '#c0c4cc' }">{{ form.grade || '请选择年级' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 学考等级 -->
    <view class="section-header">
      <view class="section-dot" style="background: #fa8c16;"></view>
      <text class="section-title">学考等级</text>
      <text class="section-sub">（每科选择等级，未考留空）</text>
    </view>
    <view class="form-card">
      <!-- 统计概览 -->
      <view class="grade-visual">
        <view v-for="g in gradeFields" :key="g.field" class="grade-col">
          <view :class="['grade-circle', g.color, { active: gradeCounts[g.name] > 0 }]">
            <text class="grade-num">{{ gradeCounts[g.name] }}</text>
          </view>
          <text class="grade-label">{{ g.name }}等</text>
        </view>
      </view>

      <!-- 每科目选等级 -->
      <view class="subject-grade-list">
        <view v-for="(item, idx) in sgList" :key="item.subject" class="subject-grade-item">
          <text class="sg-name">{{ item.subject }}</text>
          <view class="sg-options">
            <view :class="['sg-opt opt-a', { active: item.grade === 'A' }]" @tap="pickGrade(idx, 'A')">
              <text>A</text>
            </view>
            <view :class="['sg-opt opt-b', { active: item.grade === 'B' }]" @tap="pickGrade(idx, 'B')">
              <text>B</text>
            </view>
            <view :class="['sg-opt opt-c', { active: item.grade === 'C' }]" @tap="pickGrade(idx, 'C')">
              <text>C</text>
            </view>
            <view :class="['sg-opt opt-d', { active: item.grade === 'D' }]" @tap="pickGrade(idx, 'D')">
              <text>D</text>
            </view>
            <view :class="['sg-opt opt-e', { active: item.grade === 'E' }]" @tap="pickGrade(idx, 'E')">
              <text>E</text>
            </view>
            <view :class="['sg-opt sg-none', { active: !item.grade }]" @tap="pickGrade(idx, '')">
              <text>未考</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 进度条 -->
      <view class="grade-bar-wrap">
        <view class="grade-bar-bg">
          <view class="grade-bar-seg seg-a" :style="{ width: (gradeCounts.A / TOTAL * 100) + '%' }"></view>
          <view class="grade-bar-seg seg-b" :style="{ width: (gradeCounts.B / TOTAL * 100) + '%' }"></view>
          <view class="grade-bar-seg seg-c" :style="{ width: (gradeCounts.C / TOTAL * 100) + '%' }"></view>
          <view class="grade-bar-seg seg-d" :style="{ width: (gradeCounts.D / TOTAL * 100) + '%' }"></view>
          <view class="grade-bar-seg seg-e" :style="{ width: (gradeCounts.E / TOTAL * 100) + '%' }"></view>
        </view>
        <text :class="['grade-bar-text', gradeTotal === TOTAL ? 'ok' : '']">
          已填 {{ gradeTotal }} / {{ TOTAL }} 门
          {{ gradeTotal < TOTAL ? `（还有${TOTAL - gradeTotal}门未考）` : '✓ 全部完成' }}
        </text>
      </view>
    </view>

    <!-- 报考意向 -->
    <view class="section-header">
      <view class="section-dot" style="background: #52c41a;"></view>
      <text class="section-title">报考意向</text>
      <text class="section-sub">（选填，提高推荐精准度）</text>
    </view>
    <view class="form-card">
      <view class="form-item">
        <text class="label">意向地区</text>
        <picker :range="regionOptions" @change="(e:any) => form.preferredRegion = regionOptions[e.detail.value]">
          <view class="picker-value">
            <text :style="{ color: form.preferredRegion ? '#333' : '#c0c4cc' }">{{ form.preferredRegion || '请选择意向地区' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="form-item no-border">
        <text class="label">意向专业</text>
        <picker :range="majorOptions" @change="(e:any) => form.preferredMajor = majorOptions[e.detail.value]">
          <view class="picker-value">
            <text :style="{ color: form.preferredMajor ? '#333' : '#c0c4cc' }">{{ form.preferredMajor || '请选择意向专业' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
    </view>

    <!-- 学校三级联动弹窗 -->
    <view class="picker-mask" v-if="showSchoolPicker" @tap="showSchoolPicker = false">
      <view class="picker-popup" @tap.stop>
        <view class="picker-popup-header">
          <text class="picker-cancel" @tap="showSchoolPicker = false">取消</text>
          <text class="picker-title">选择学校</text>
          <text class="picker-confirm" @tap="confirmSchool">确定</text>
        </view>
        <!-- 步骤指示 -->
        <view class="step-bar">
          <view :class="['step-item', schoolStep >= 0 ? 'active' : '']" @tap="schoolStep = 0">
            <text>{{ selectedCity || '选择市' }}</text>
          </view>
          <text class="step-sep">›</text>
          <view :class="['step-item', schoolStep >= 1 ? 'active' : '']" @tap="selectedCity && (schoolStep = 1)">
            <text>{{ selectedDistrict || '选择区县' }}</text>
          </view>
          <text class="step-sep">›</text>
          <view :class="['step-item', schoolStep >= 2 ? 'active' : '']">
            <text>{{ selectedSchool || '选择学校' }}</text>
          </view>
        </view>
        <!-- 列表 -->
        <scroll-view scroll-y class="picker-list">
          <view v-if="schoolStep === 0">
            <view v-for="c in schoolData.cities" :key="c.name" :class="['list-item', selectedCity === c.name ? 'selected' : '']" @tap="pickCity(c.name)">
              <text>{{ c.name }}</text>
              <text class="list-check" v-if="selectedCity === c.name">✓</text>
            </view>
          </view>
          <view v-else-if="schoolStep === 1">
            <view v-for="d in currentDistricts" :key="d.name" :class="['list-item', selectedDistrict === d.name ? 'selected' : '']" @tap="pickDistrict(d.name)">
              <text>{{ d.name }}</text>
              <text class="list-check" v-if="selectedDistrict === d.name">✓</text>
            </view>
          </view>
          <view v-else>
            <view v-for="s in currentSchools" :key="s" :class="['list-item', selectedSchool === s ? 'selected' : '']" @tap="selectedSchool = s">
              <text>{{ s }}</text>
              <text class="list-check" v-if="selectedSchool === s">✓</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 账号操作 -->
    <view v-if="studentId" class="section-header">
      <view class="section-dot"></view>
      <text class="section-title">账号安全</text>
    </view>
    <view v-if="studentId" class="form-card">
      <view class="form-item" @tap="showChangePwd = true">
        <text class="label">修改密码</text>
        <text class="picker-arrow">›</text>
      </view>
      <view class="form-item no-border" @tap="showChangePhone = true">
        <text class="label">换绑手机号</text>
        <view style="display: flex; align-items: center; gap: 8rpx;">
          <text style="color: #999; font-size: 26rpx;">{{ form.phone }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 修改密码弹窗 -->
    <uni-popup ref="pwdPopup" type="center" v-if="showChangePwd">
    </uni-popup>
    <view v-if="showChangePwd" class="modal-mask" @tap="showChangePwd = false">
      <view class="modal-box" @tap.stop>
        <text class="modal-title">修改密码</text>
        <view class="form-item" style="margin-top: 20rpx;">
          <text class="label" style="width: auto; margin-right: 16rpx;">原密码</text>
          <input v-model="pwdForm.oldPassword" type="safe-password" placeholder="请输入原密码" class="input" placeholder-class="ph" />
        </view>
        <view class="form-item">
          <text class="label" style="width: auto; margin-right: 16rpx;">新密码</text>
          <input v-model="pwdForm.newPassword" type="safe-password" placeholder="至少6位" class="input" placeholder-class="ph" />
        </view>
        <button class="save-btn" style="margin-top: 24rpx;" @tap="submitChangePwd">确认修改</button>
      </view>
    </view>

    <!-- 换绑手机弹窗 -->
    <view v-if="showChangePhone" class="modal-mask" @tap="showChangePhone = false">
      <view class="modal-box" @tap.stop>
        <text class="modal-title">换绑手机号</text>
        <view class="form-item" style="margin-top: 20rpx;">
          <text class="label" style="width: auto; margin-right: 16rpx;">新手机号</text>
          <input v-model="phoneForm.newPhone" type="number" placeholder="请输入新手机号" maxlength="11" class="input" placeholder-class="ph" />
        </view>
        <view class="form-item">
          <text class="label" style="width: auto; margin-right: 16rpx;">密码验证</text>
          <input v-model="phoneForm.password" type="safe-password" placeholder="请输入当前密码" class="input" placeholder-class="ph" />
        </view>
        <button class="save-btn" style="margin-top: 24rpx;" @tap="submitChangePhone">确认换绑</button>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="btn-area">
      <button class="save-btn" @tap="handleSave" :loading="saving">
        {{ studentId ? '更新信息' : '提交信息' }}
      </button>
      <button v-if="studentId" class="logout-btn" @tap="handleLogout">
        退出登录
      </button>
    </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { post, put, get } from '../../utils/api'
import schoolData from '../../../../shared/school-data.json'

const TOTAL = 10
const saving = ref(false)

const gradeFields = [
  { field: 'gradeA', name: 'A', color: 'c-a' },
  { field: 'gradeB', name: 'B', color: 'c-b' },
  { field: 'gradeC', name: 'C', color: 'c-c' },
  { field: 'gradeD', name: 'D', color: 'c-d' },
  { field: 'gradeE', name: 'E', color: 'c-e' },
]

const regionOptions = schoolData.regions
const majorOptions = schoolData.majors

const allSubjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理', '技术']

const form = ref<any>({
  name: '', phone: '', schoolName: '', grade: '',
  gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, gradeE: 0,
  preferredRegion: '', preferredMajor: '',
  subjectGrades: '',
})

// 每科成绩（用 ref 数组，uni-app 小程序兼容性最好）
const sgList = ref(allSubjects.map(s => ({ subject: s, grade: '' })))

const gradeCounts = computed(() => {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 }
  for (const item of sgList.value) {
    if (item.grade && item.grade in counts) counts[item.grade]++
  }
  return counts
})

const gradeTotal = computed(() => {
  return sgList.value.filter(item => item.grade).length
})

function pickGrade(idx: number, val: string) {
  sgList.value[idx] = { ...sgList.value[idx], grade: val }
}

// 学校三级联动
const showSchoolPicker = ref(false)
const schoolStep = ref(0)
const selectedCity = ref('')
const selectedDistrict = ref('')
const selectedSchool = ref('')

const currentDistricts = computed(() => {
  const city = schoolData.cities.find(c => c.name === selectedCity.value)
  return city ? city.districts : []
})
const currentSchools = computed(() => {
  const dist = currentDistricts.value.find(d => d.name === selectedDistrict.value)
  return dist ? dist.schools : []
})

function pickCity(name: string) {
  selectedCity.value = name
  selectedDistrict.value = ''
  selectedSchool.value = ''
  schoolStep.value = 1
}
function pickDistrict(name: string) {
  selectedDistrict.value = name
  selectedSchool.value = ''
  schoolStep.value = 2
}
function confirmSchool() {
  if (selectedSchool.value) {
    form.value.schoolName = selectedSchool.value
    showSchoolPicker.value = false
  } else {
    uni.showToast({ title: '请选择学校', icon: 'none' })
  }
}

const completionPct = computed(() => {
  let done = 0, total = 6
  if (form.value.name) done++
  if (form.value.phone) done++
  if (form.value.schoolName) done++
  if (form.value.grade) done++
  if (gradeTotal.value > 0) done++
  if (form.value.preferredRegion || form.value.preferredMajor) done++
  return Math.round(done / total * 100)
})

const remainDays = computed(() => {
  if (!form.value.expireAt) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(form.value.expireAt)
  const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

const studentId = ref<number | null>(null)

onMounted(() => {
  const saved = uni.getStorageSync('studentId')
  if (saved) {
    studentId.value = saved
    loadProfile()
  }
})

onShow(() => {
  const saved = uni.getStorageSync('studentId')
  if (saved && saved !== studentId.value) {
    studentId.value = saved
    loadProfile()
  } else if (!saved) {
    studentId.value = null
    form.value = { name: '', phone: '', schoolName: '', grade: '', gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, gradeE: 0, preferredRegion: '', preferredMajor: '', subjectGrades: '' }
    sgList.value = allSubjects.map(s => ({ subject: s, grade: '' }))
  }
})

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

async function loadProfile() {
  const data = await get(`/students/${studentId.value}`)
  if (data) {
    form.value = { ...form.value, ...data }
    // 恢复每科成绩
    if (data.subjectGrades) {
      try {
        const sg = typeof data.subjectGrades === 'string' ? JSON.parse(data.subjectGrades) : data.subjectGrades
        sgList.value = allSubjects.map(s => ({ subject: s, grade: sg[s] || '' }))
      } catch {}
    } else if ((data.gradeA || 0) + (data.gradeB || 0) + (data.gradeC || 0) + (data.gradeD || 0) + (data.gradeE || 0) > 0) {
      // 兼容旧数据：没有 subjectGrades 但有 gradeA/B/C 数字，自动分配到科目
      const arr = allSubjects.map(s => ({ subject: s, grade: '' }))
      let idx = 0
      for (let i = 0; i < (data.gradeA || 0) && idx < arr.length; i++) arr[idx++].grade = 'A'
      for (let i = 0; i < (data.gradeB || 0) && idx < arr.length; i++) arr[idx++].grade = 'B'
      for (let i = 0; i < (data.gradeC || 0) && idx < arr.length; i++) arr[idx++].grade = 'C'
      for (let i = 0; i < (data.gradeD || 0) && idx < arr.length; i++) arr[idx++].grade = 'D'
      for (let i = 0; i < (data.gradeE || 0) && idx < arr.length; i++) arr[idx++].grade = 'E'
      sgList.value = arr
    }
    // 反向查找学校所属城市/区县
    if (data.schoolName) {
      for (const city of schoolData.cities) {
        for (const dist of city.districts) {
          if (dist.schools.includes(data.schoolName)) {
            selectedCity.value = city.name
            selectedDistrict.value = dist.name
            selectedSchool.value = data.schoolName
          }
        }
      }
    }
  }
}

async function handleSave() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请填写姓名', icon: 'none' }); return
  }
  if (form.value.phone && !/^1[3-9]\d{9}$/.test(form.value.phone)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' }); return
  }
  // 保存前同步 subjectGrades 到 form
  const sgObj: Record<string, string> = {}
  sgList.value.forEach(item => { sgObj[item.subject] = item.grade })
  form.value.subjectGrades = JSON.stringify(sgObj)
  form.value.gradeA = gradeCounts.value.A
  form.value.gradeB = gradeCounts.value.B
  form.value.gradeC = gradeCounts.value.C
  form.value.gradeD = gradeCounts.value.D
  form.value.gradeE = gradeCounts.value.E
  saving.value = true
  try {
    let data
    if (studentId.value) {
      data = await put(`/students/${studentId.value}`, form.value)
    } else {
      data = await post('/students', form.value)
    }
    if (data?.id) {
      studentId.value = data.id
      uni.setStorageSync('studentId', data.id)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.data?.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const showChangePwd = ref(false)
const showChangePhone = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '' })
const phoneForm = ref({ newPhone: '', password: '' })

async function submitChangePwd() {
  if (!pwdForm.value.newPassword || pwdForm.value.newPassword.length < 6) {
    uni.showToast({ title: '新密码至少6位', icon: 'none' }); return
  }
  try {
    await post(`/students/${studentId.value}/change-password`, pwdForm.value)
    uni.showToast({ title: '密码修改成功', icon: 'success' })
    showChangePwd.value = false
    pwdForm.value = { oldPassword: '', newPassword: '' }
  } catch (e: any) {
    uni.showToast({ title: e?.data?.message || '修改失败', icon: 'none' })
  }
}

async function submitChangePhone() {
  if (!phoneForm.value.newPhone || !/^1[3-9]\d{9}$/.test(phoneForm.value.newPhone)) {
    uni.showToast({ title: '请输入正确的新手机号', icon: 'none' }); return
  }
  if (!phoneForm.value.password) {
    uni.showToast({ title: '请输入密码', icon: 'none' }); return
  }
  try {
    await post(`/students/${studentId.value}/change-phone`, phoneForm.value)
    uni.showToast({ title: '换绑成功', icon: 'success' })
    showChangePhone.value = false
    phoneForm.value = { newPhone: '', password: '' }
    loadProfile()
  } catch (e: any) {
    uni.showToast({ title: e?.data?.message || '换绑失败', icon: 'none' })
  }
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定退出登录吗？',
    success(res) {
      if (res.confirm) {
        uni.removeStorageSync('studentId')
        studentId.value = null
        form.value = { name: '', phone: '', schoolName: '', grade: '', gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, gradeE: 0, preferredRegion: '', preferredMajor: '', subjectGrades: '' }
        sgList.value = allSubjects.map(s => ({ subject: s, grade: '' }))
        uni.navigateTo({ url: '/pages/login/index' })
      }
    }
  })
}
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: 60rpx; background: #f5f6fa; }

.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); z-index: 999; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 20rpx; padding: 36rpx 32rpx; width: 80vw; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #333; display: block; text-align: center; }
.ph { color: #c0c4cc; }

.profile-hero { background: #2e4a78; padding: 48rpx 36rpx 40rpx; }
.avatar-wrap { display: flex; align-items: center; gap: 24rpx; margin-bottom: 28rpx; }
.avatar { width: 96rpx; height: 96rpx; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; border: 4rpx solid rgba(255,255,255,0.4); flex-shrink: 0; }
.avatar-text { color: #fff; font-size: 40rpx; font-weight: bold; }
.profile-brief {}
.profile-name { color: #fff; font-size: 34rpx; font-weight: 700; display: block; }
.profile-school { color: rgba(255,255,255,0.7); font-size: 24rpx; margin-top: 4rpx; display: block; }
.progress-wrap {}
.progress-bar { height: 12rpx; background: rgba(255,255,255,0.2); border-radius: 6rpx; overflow: hidden; }
.progress-fill { height: 100%; background: #43c480; border-radius: 6rpx; transition: width 0.3s; }
.progress-text { color: rgba(255,255,255,0.8); font-size: 22rpx; margin-top: 8rpx; display: block; }

.expire-bar { margin: 16rpx 24rpx 0; background: #fff; border-radius: 16rpx; padding: 20rpx 28rpx; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.expire-label { font-size: 26rpx; color: #666; }
.expire-value { font-size: 26rpx; color: #43c480; font-weight: 600; }
.expire-value.warn { color: #f56c6c; }

.section-header { display: flex; align-items: center; gap: 10rpx; padding: 28rpx 30rpx 12rpx; }
.section-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: #2e4a78; }
.section-title { font-size: 30rpx; font-weight: 600; color: #333; }
.section-sub { font-size: 22rpx; color: #bbb; }

.form-card { margin: 0 24rpx 8rpx; background: #fff; border-radius: 20rpx; padding: 8rpx 28rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.form-item { display: flex; align-items: center; justify-content: space-between; padding: 26rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.form-item.no-border { border-bottom: none; }
.label { font-size: 28rpx; color: #333; width: 160rpx; flex-shrink: 0; }
.input { flex: 1; font-size: 28rpx; text-align: right; color: #333; }
.placeholder { color: #c0c4cc; }
.picker-value { display: flex; align-items: center; justify-content: flex-end; gap: 8rpx; }
.picker-arrow { color: #ccc; font-size: 28rpx; }

.grade-visual { display: flex; justify-content: space-around; padding: 24rpx 0 20rpx; border-bottom: 1rpx solid #f5f5f5; margin-bottom: 8rpx; }
.grade-col { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.grade-circle { width: 80rpx; height: 80rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; transition: all 0.2s; }
.grade-circle.active.c-a { background: #e8453c; }
.grade-circle.active.c-b { background: #d97706; }
.grade-circle.active.c-c { background: #2e6bc6; }
.grade-circle.active.c-d { background: #8c8c8c; }
.grade-circle.active.c-e { background: #d4d4d4; }
.grade-num { font-size: 32rpx; font-weight: 700; color: #ccc; }
.grade-circle.active .grade-num { color: #fff; }
.grade-circle.active.c-e .grade-num { color: #8c8c8c; }
.grade-label { font-size: 22rpx; color: #999; }

.grade-control { display: flex; align-items: center; justify-content: space-between; padding: 18rpx 0; }
.grade-control-left { display: flex; align-items: center; gap: 12rpx; }
.grade-dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.grade-dot.c-a { background: #f5222d; }
.grade-dot.c-b { background: #fa8c16; }
.grade-dot.c-c { background: #1890ff; }
.grade-dot.c-d { background: #8c8c8c; }
.grade-dot.c-e { background: #d9d9d9; }
.grade-control-name { font-size: 28rpx; color: #333; }

.stepper { display: flex; align-items: center; gap: 4rpx; }
.step-btn { width: 60rpx; height: 60rpx; border-radius: 14rpx; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
.step-btn text { font-size: 32rpx; color: #666; font-weight: bold; }
.step-btn.plus { background: #2e4a78; }
.step-btn.plus text { color: #fff; }
.step-btn.disabled { opacity: 0.3; }
.step-num { width: 60rpx; text-align: center; font-size: 32rpx; font-weight: 700; color: #333; }

.grade-bar-wrap { padding: 20rpx 0 12rpx; border-top: 1rpx solid #f5f5f5; margin-top: 8rpx; }
.grade-bar-bg { height: 20rpx; background: #f0f0f0; border-radius: 10rpx; display: flex; overflow: hidden; }
.grade-bar-seg { height: 100%; transition: width 0.3s; }
.seg-a { background: #f5222d; }
.seg-b { background: #fa8c16; }
.seg-c { background: #1890ff; }
.seg-d { background: #8c8c8c; }
.seg-e { background: #d9d9d9; }
.grade-bar-text { font-size: 24rpx; color: #999; margin-top: 10rpx; display: block; text-align: center; }
.grade-bar-text.ok { color: #52c41a; }

/* 每科选等级 */
.subject-grade-list { border-top: 1rpx solid #f5f5f5; padding-top: 12rpx; }
.subject-grade-item { display: flex; align-items: center; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx solid #f8f8f8; }
.subject-grade-item:last-child { border-bottom: none; }
.sg-name { font-size: 28rpx; color: #333; font-weight: 500; width: 80rpx; }
.sg-options { display: flex; gap: 10rpx; }
.sg-opt { width: 56rpx; height: 56rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border: 2rpx solid transparent; transition: all 0.15s; }
.sg-opt text { font-size: 24rpx; color: #999; font-weight: 600; }
.sg-opt.active.opt-a { background: #fff1f0; border-color: #f5222d; }
.sg-opt.active.opt-a text { color: #f5222d; }
.sg-opt.active.opt-b { background: #fff7e6; border-color: #fa8c16; }
.sg-opt.active.opt-b text { color: #fa8c16; }
.sg-opt.active.opt-c { background: #e6f7ff; border-color: #1890ff; }
.sg-opt.active.opt-c text { color: #1890ff; }
.sg-opt.active.opt-d { background: #f5f5f5; border-color: #8c8c8c; }
.sg-opt.active.opt-d text { color: #8c8c8c; }
.sg-opt.active.opt-e { background: #fafafa; border-color: #bfbfbf; }
.sg-opt.active.opt-e text { color: #bfbfbf; }
.sg-none { width: auto; padding: 0 16rpx; }
.sg-opt.active.sg-none { background: #f0f0f0; border-color: #d9d9d9; }
.sg-opt.active.sg-none text { color: #666; }

.btn-area { padding: 30rpx 24rpx; }
.save-btn { background: #2e4a78; color: #fff; border: none; border-radius: 14rpx; font-size: 30rpx; height: 88rpx; line-height: 88rpx; font-weight: 600; }
.logout-btn { margin-top: 20rpx; background: #fff; color: #f5222d; border: 1rpx solid #ffa39e; border-radius: 50rpx; font-size: 28rpx; height: 80rpx; line-height: 80rpx; }

/* 未登录提示 */
.login-prompt { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f6fa; }
.login-prompt-inner { display: flex; flex-direction: column; align-items: center; padding: 60rpx 40rpx; }
.lp-icon { font-size: 120rpx; margin-bottom: 24rpx; }
.lp-title { font-size: 36rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.lp-desc { font-size: 26rpx; color: #999; text-align: center; margin-bottom: 40rpx; line-height: 1.6; }
.lp-btn { background: #2e4a78; color: #fff; border: none; border-radius: 50rpx; font-size: 30rpx; height: 88rpx; line-height: 88rpx; width: 400rpx; font-weight: 600; }

/* 学校三级联动弹窗 */
.picker-mask { position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); z-index: 999; display: flex; align-items: flex-end; }
.picker-popup { width: 100%; background: #fff; border-radius: 28rpx 28rpx 0 0; overflow: hidden; }
.picker-popup-header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 30rpx; border-bottom: 1rpx solid #f0f0f0; }
.picker-cancel { font-size: 28rpx; color: #999; }
.picker-title { font-size: 30rpx; font-weight: 600; color: #333; }
.picker-confirm { font-size: 28rpx; color: #2e4a78; font-weight: 600; }
.step-bar { display: flex; align-items: center; gap: 8rpx; padding: 20rpx 30rpx; background: #fafafa; }
.step-item { padding: 8rpx 18rpx; border-radius: 8rpx; background: #f0f0f0; }
.step-item.active { background: #2e4a78; }
.step-item.active text { color: #fff; }
.step-item text { font-size: 24rpx; color: #999; }
.step-sep { font-size: 24rpx; color: #ccc; }
.picker-list { height: 500rpx; }
.list-item { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 30rpx; border-bottom: 1rpx solid #f8f8f8; }
.list-item text { font-size: 28rpx; color: #333; }
.list-item.selected { background: #f0f3fa; }
.list-item.selected text { color: #2e4a78; font-weight: 600; }
.list-check { color: #2e4a78 !important; font-weight: 700; }
</style>

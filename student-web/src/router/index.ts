import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'

export const pageLoading = ref(false)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        { path: '', name: 'Home', component: () => import('@/views/Home.vue') },
        { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue') },
        { path: 'recommend', name: 'Recommend', component: () => import('@/views/Recommend.vue') },
        { path: 'sprint', name: 'Sprint', component: () => import('@/views/Sprint.vue') },
        { path: 'school/:id', name: 'SchoolDetail', component: () => import('@/views/SchoolDetail.vue') },
        { path: 'exams', name: 'ExamList', component: () => import('@/views/ExamList.vue') },
        { path: 'exam-real', name: 'ExamReal', component: () => import('@/views/ExamReal.vue') },
        { path: 'exam-records', name: 'ExamRecords', component: () => import('@/views/ExamRecords.vue') },
        { path: 'wrong-notes', name: 'WrongNotes', component: () => import('@/views/WrongNotes.vue') },
        { path: 'analysis', name: 'Analysis', component: () => import('@/views/Analysis.vue') },
        { path: 'exam/:paperId', name: 'ExamDo', component: () => import('@/views/ExamDo.vue') },
        { path: 'result/:sheetId', name: 'ExamResult', component: () => import('@/views/ExamResult.vue') },
        { path: 'practice', name: 'PracticeSelect', component: () => import('@/views/PracticeSelect.vue') },
        { path: 'practice/do', name: 'Practice', component: () => import('@/views/Practice.vue') },
        { path: 'policies', name: 'PolicyCenter', component: () => import('@/views/PolicyCenter.vue') },
        { path: 'search', name: 'Search', component: () => import('@/views/Search.vue') },
        { path: 'calendar', name: 'Calendar', component: () => import('@/views/Calendar.vue') },
        { path: 'interview', name: 'Interview', component: () => import('@/views/Interview.vue') },
        { path: 'mock-interview', name: 'MockInterview', component: () => import('@/views/MockInterview.vue') },
        { path: 'weekly-report', name: 'WeeklyReport', component: () => import('@/views/WeeklyReport.vue') },
        { path: 'notifications', name: 'Notifications', component: () => import('@/views/Notifications.vue') },
        { path: 'majors', name: 'Majors', component: () => import('@/views/Majors.vue') },
      ],
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  pageLoading.value = true
  const sid = localStorage.getItem('studentId')
  if (to.path === '/login') {
    next()
    return
  }
  if (!sid) {
    next('/login')
    return
  }
  // 每次进入页面检查账号状态
  try {
    const res = await fetch(`/api/students/check-status/${sid}`)
    const data = await res.json()
    if (!data.valid) {
      localStorage.removeItem('studentId')
      next('/login')
      return
    }
  } catch {
    // 网络异常时不阻断
  }
  next()
})

router.afterEach(() => {
  pageLoading.value = false
})

export default router

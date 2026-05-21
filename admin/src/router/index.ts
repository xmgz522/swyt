import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/',
      component: () => import('../views/Layout.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
        { path: 'students', name: 'Students', component: () => import('../views/Students.vue') },
        { path: 'schools', name: 'Schools', component: () => import('../views/Schools.vue') },
        { path: 'questions', name: 'Questions', component: () => import('../views/Questions.vue') },
        { path: 'papers', name: 'Papers', component: () => import('../views/Papers.vue') },
        { path: 'grading', name: 'Grading', component: () => import('../views/Grading.vue') },
        { path: 'answer-sheets', name: 'AnswerSheets', component: () => import('../views/AnswerSheets.vue') },
        { path: 'wrong-notes', name: 'WrongNotes', component: () => import('../views/WrongNotes.vue') },
        { path: 'analysis', name: 'Analysis', component: () => import('../views/AnalysisView.vue') },
        { path: 'report', name: 'Report', component: () => import('../views/Report.vue') },
        { path: 'policies', name: 'Policies', component: () => import('../views/Policies.vue') },
        { path: 'import-export', name: 'ImportExport', component: () => import('../views/ImportExport.vue') },
        { path: 'notifications', name: 'Notifications', component: () => import('../views/Notifications.vue') },
        { path: 'change-password', name: 'ChangePassword', component: () => import('../views/ChangePassword.vue') },
        { path: 'audit-logs', name: 'AuditLogs', component: () => import('../views/AuditLogs.vue') },
        { path: 'users', name: 'Users', component: () => import('../views/Users.vue') },
        { path: 'interview', name: 'Interview', component: () => import('../views/Interview.vue') },
        { path: 'mock-interview', name: 'MockInterview', component: () => import('../views/MockInterview.vue') },
        { path: 'weekly-report', name: 'WeeklyReport', component: () => import('../views/WeeklyReport.vue') },
        { path: 'majors', name: 'Majors', component: () => import('../views/Majors.vue') },
        { path: 'permissions', name: 'Permissions', component: () => import('../views/Permissions.vue') },
        { path: 'invite-codes', name: 'InviteCodes', component: () => import('../views/InviteCodes.vue') },
        { path: 'login-logs', name: 'LoginLogs', component: () => import('../views/LoginLogs.vue') },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
    return
  }
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  // 超管和管理员不受限
  if (user.role === 'superadmin' || user.role === 'admin') {
    next()
    return
  }
  // 教师：检查权限
  const freePages = ['/dashboard', '/change-password', '/login', '/']
  if (freePages.includes(to.path)) {
    next()
    return
  }
  // 超管专属页面
  const superOnly = ['/users', '/audit-logs', '/permissions']
  const adminOnly = ['/invite-codes', '/login-logs']
  if (adminOnly.includes(to.path) && user.role === 'teacher') {
    next('/dashboard')
    return
  }
  if (superOnly.includes(to.path)) {
    next('/dashboard')
    return
  }
  // 检查功能权限
  let perms: string[] = []
  try { perms = JSON.parse(user.permissions || '[]') } catch {}
  const permKey = to.path.replace(/^\//, '')
  if (perms.length > 0 && !perms.includes(permKey)) {
    next('/dashboard')
    return
  }
  next()
})

export default router

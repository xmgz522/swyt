<template>
  <el-container style="height: 100vh">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <div class="logo-icon">ZJ</div>
        <span class="logo-text">三位一体测评</span>
      </div>
      <el-menu
        :default-active="route.path"
        background-color="#1d1e3a"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#ffffff"
        router
        class="side-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据总览</span>
        </el-menu-item>
        <el-menu-item v-if="hasPerm('students')" index="/students">
          <el-icon><User /></el-icon>
          <span>学生管理</span>
        </el-menu-item>
        <el-menu-item v-if="hasPerm('schools')" index="/schools">
          <el-icon><School /></el-icon>
          <span>院校管理</span>
        </el-menu-item>
        <el-sub-menu index="exam-group">
          <template #title>
            <el-icon><Notebook /></el-icon>
            <span>考试中心</span>
          </template>
          <el-menu-item v-if="hasPerm('questions')" index="/questions">
            <el-icon><Document /></el-icon>
            <span>题库管理</span>
          </el-menu-item>
          <el-menu-item v-if="hasPerm('papers')" index="/papers">
            <el-icon><Notebook /></el-icon>
            <span>试卷管理</span>
          </el-menu-item>
          <el-menu-item v-if="hasPerm('grading')" index="/grading">
            <el-icon><Edit /></el-icon>
            <span>批卷管理</span>
          </el-menu-item>
          <el-menu-item v-if="hasPerm('answer-sheets')" index="/answer-sheets">
            <el-icon><List /></el-icon>
            <span>答卷记录</span>
          </el-menu-item>
          <el-menu-item v-if="hasPerm('interview')" index="/interview">
            <el-icon><ChatLineSquare /></el-icon>
            <span>面试题库</span>
          </el-menu-item>
          <el-menu-item v-if="hasPerm('mock-interview')" index="/mock-interview">
            <el-icon><Mic /></el-icon>
            <span>模拟面试</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="data-group">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>数据分析</span>
          </template>
          <el-menu-item v-if="hasPerm('wrong-notes')" index="/wrong-notes">
            <el-icon><Warning /></el-icon>
            <span>错题管理</span>
          </el-menu-item>
          <el-menu-item v-if="hasPerm('analysis')" index="/analysis">
            <el-icon><DataAnalysis /></el-icon>
            <span>AI 分析</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item v-if="hasPerm('report')" index="/report">
          <el-icon><Printer /></el-icon>
          <span>测评报告</span>
        </el-menu-item>
        <el-menu-item v-if="hasPerm('weekly-report')" index="/weekly-report">
          <el-icon><Calendar /></el-icon>
          <span>学情周报</span>
        </el-menu-item>
        <el-menu-item v-if="hasPerm('majors')" index="/majors">
          <el-icon><Collection /></el-icon>
          <span>专业管理</span>
        </el-menu-item>
        <el-menu-item v-if="hasPerm('policies')" index="/policies">
          <el-icon><Reading /></el-icon>
          <span>政策管理</span>
        </el-menu-item>
        <el-menu-item v-if="hasPerm('notifications')" index="/notifications">
          <el-icon><Bell /></el-icon>
          <span>消息通知</span>
        </el-menu-item>
        <el-menu-item v-if="hasPerm('import-export')" index="/import-export">
          <el-icon><FolderOpened /></el-icon>
          <span>导入导出</span>
        </el-menu-item>
        <el-sub-menu index="sys-group">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item v-if="isSuperAdmin" index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item v-if="isSuperAdmin" index="/audit-logs">
            <el-icon><Document /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
          <el-menu-item index="/change-password">
            <el-icon><Lock /></el-icon>
            <span>修改密码</span>
          </el-menu-item>
          <el-menu-item v-if="isSuperAdmin" index="/permissions">
            <el-icon><Key /></el-icon>
            <span>权限分配</span>
          </el-menu-item>
          <el-menu-item v-if="isAdmin" index="/invite-codes">
            <el-icon><Ticket /></el-icon>
            <span>注册码管理</span>
          </el-menu-item>
          <el-menu-item v-if="isAdmin" index="/login-logs">
            <el-icon><Clock /></el-icon>
            <span>登录日志</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="topbar">
        <div class="topbar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageName }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="topbar-right">
          <el-tag :type="isSuperAdmin ? 'danger' : ''" size="small" style="margin-right: 12px;">
            {{ isSuperAdmin ? '超管' : isAdmin ? '管理员' : '老师' }}
          </el-tag>
          <el-dropdown trigger="click">
            <span class="user-dropdown">
              <el-avatar :size="28" style="background: linear-gradient(135deg, #667eea, #764ba2); margin-right: 8px;">
                {{ userName.charAt(0) }}
              </el-avatar>
              {{ userName }}
              <el-icon style="margin-left: 4px;"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main style="background: #f0f2f5; padding: 20px;">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const user = JSON.parse(localStorage.getItem('user') || '{}')
const userName = computed(() => user.name || '未知')
const isSuperAdmin = computed(() => user.role === 'superadmin')
const isAdmin = computed(() => user.role === 'superadmin' || user.role === 'admin')

// 权限判断：超管全部可见，管理员默认全部可见，教师按 permissions 字段控制
const userPerms: string[] = (() => {
  try { return JSON.parse(user.permissions || '[]') } catch { return [] }
})()

function hasPerm(key: string): boolean {
  if (user.role === 'superadmin' || user.role === 'admin') return true
  return userPerms.includes(key)
}

const pageNameMap: Record<string, string> = {
  '/dashboard': '数据总览',
  '/students': '学生管理',
  '/schools': '院校管理',
  '/questions': '题库管理',
  '/papers': '试卷管理',
  '/grading': '批卷管理',
  '/answer-sheets': '答卷记录',
  '/wrong-notes': '错题管理',
  '/analysis': 'AI 分析',
  '/report': '测评报告',
  '/policies': '政策管理',
  '/import-export': '导入导出',
  '/notifications': '消息通知',
  '/users': '用户管理',
  '/audit-logs': '操作日志',
  '/change-password': '修改密码',
  '/interview': '面试题库',
  '/mock-interview': '模拟面试',
  '/weekly-report': '学情周报',
  '/majors': '专业管理',
  '/permissions': '权限分配',
  '/invite-codes': '注册码管理',
  '/login-logs': '登录日志',
}
const currentPageName = computed(() => pageNameMap[route.path] || '')

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  background: #1d1e3a;
  overflow-y: auto;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
}
.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 13px;
}
.logo-text {
  color: white;
  font-size: 15px;
  font-weight: 600;
}
.side-menu {
  border-right: none;
}
.side-menu .el-menu-item.is-active {
  background: rgba(102, 126, 234, 0.25) !important;
  border-right: 3px solid #667eea;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-bottom: 1px solid #ebeef5;
  padding: 0 20px;
  height: 56px;
}
.topbar-right {
  display: flex;
  align-items: center;
}
.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

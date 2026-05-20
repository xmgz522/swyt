<template>
  <div class="min-h-screen flex">
    <!-- 侧边导航 -->
    <aside class="w-60 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
      <div class="h-16 flex items-center px-6 border-b border-gray-100">
        <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span class="text-white text-sm font-bold">浙</span>
        </div>
        <span class="ml-3 font-semibold text-gray-900 text-base">提前批测评</span>
      </div>

      <nav class="flex-1 py-4 px-3 space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-link', isMenuActive(item.path) ? 'nav-link-active' : '']"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
          <span v-if="item.path === '/notifications' && unreadCount > 0" class="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-50">
        <div class="flex items-center gap-3" v-if="store.isLoggedIn && store.profile">
          <div class="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
            {{ store.profile.name?.substring(0, 1) || '?' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">{{ store.profile.name || '未设置' }}</p>
            <p class="text-xs text-gray-400 truncate">{{ store.profile.schoolName || '' }}</p>
          </div>
          <button @click="handleLogout" class="text-gray-400 hover:text-red-500 transition-colors" title="退出登录">
            <component :is="SwitchButton" class="w-5 h-5" />
          </button>
        </div>
        <div v-else class="text-center">
          <router-link to="/login" class="text-sm text-primary-500 hover:text-primary-600">登录 / 注册 →</router-link>
        </div>
      </div>
    </aside>

    <!-- 顶部加载进度条 -->
    <div v-if="pageLoading" class="page-progress-bar"></div>

    <!-- 主内容区 -->
    <main class="flex-1 ml-60 bg-gray-50/60 min-h-screen">
      <div class="max-w-[1400px] mx-auto px-8 py-6">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <router-view v-slot="{ Component }">
            <transition name="page-fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { House, User, School, Document, Aim, SwitchButton, Reading, DataAnalysis, Warning, EditPen, Bell, Calendar, ChatLineSquare, Mic, TrendCharts, Collection } from '@element-plus/icons-vue'
import { useStudentStore } from '@/stores/student'
import { pageLoading } from '@/router'
import http from '@/utils/api'

const router = useRouter()
const route = useRoute()
const store = useStudentStore()

function handleLogout() {
  ElMessageBox.confirm('确定退出登录吗？退出后可通过手机号重新登录。', '退出登录', {
    confirmButtonText: '确定退出',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    store.logout()
    router.push('/login')
  }).catch(() => {})
}

const menuItems = [
  { path: '/', label: '首页', icon: markRaw(House) },
  { path: '/recommend', label: '院校推荐', icon: markRaw(School) },
  { path: '/exams', label: '模拟测试', icon: markRaw(Document) },
  { path: '/exam-real', label: '历年真题', icon: markRaw(Reading) },
  { path: '/policies', label: '政策中心', icon: markRaw(Reading) },
  { path: '/sprint', label: '学考冲刺', icon: markRaw(Aim) },
  { path: '/practice', label: '考点练题', icon: markRaw(EditPen) },
  { path: '/analysis', label: '薄弱项分析', icon: markRaw(DataAnalysis) },
  { path: '/wrong-notes', label: '我的错题', icon: markRaw(Warning) },
  { path: '/interview', label: '面试题库', icon: markRaw(ChatLineSquare) },
  { path: '/mock-interview', label: '模拟面试', icon: markRaw(Mic) },
  { path: '/weekly-report', label: '学情周报', icon: markRaw(TrendCharts) },
  { path: '/majors', label: '专业解析', icon: markRaw(Collection) },
  { path: '/calendar', label: '学习日历', icon: markRaw(Calendar) },
  { path: '/notifications', label: '消息通知', icon: markRaw(Bell) },
  { path: '/profile', label: '我的信息', icon: markRaw(User) },
]

function isMenuActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

const unreadCount = ref(0)

async function loadUnread() {
  if (!store.studentId) return
  try {
    const data: any = await http.get(`/notifications/student/${store.studentId}`)
    if (Array.isArray(data)) {
      unreadCount.value = data.filter((n: any) => !n.isRead).length
    }
  } catch {}
}

onMounted(() => {
  if (store.isLoggedIn) {
    store.loadProfile()
    loadUnread()
  }
})

watch(() => route.path, () => {
  if (store.isLoggedIn) loadUnread()
})
</script>

<style scoped>
.nav-link {
  @apply flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors;
}
.nav-link-active {
  @apply bg-blue-50 text-blue-700 font-medium;
}
.page-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #3b82f6 100%);
  background-size: 200% 100%;
  animation: progress-slide 1.2s ease-in-out infinite;
  z-index: 9999;
}
@keyframes progress-slide {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.page-fade-enter-active, .page-fade-leave-active {
  transition: opacity 0.15s ease;
}
.page-fade-enter-from, .page-fade-leave-to {
  opacity: 0;
}
</style>

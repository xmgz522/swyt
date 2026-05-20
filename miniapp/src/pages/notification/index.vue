<template>
  <view class="page">
    <view class="top-bar">
      <text class="top-title">消息通知</text>
      <view class="top-actions">
        <text v-if="list.length > 0" class="mark-all" @tap="markAllRead">全部已读</text>
        <text v-if="list.length > 0" class="clear-all" @tap="clearAll">清空所有</text>
      </view>
    </view>

    <view v-if="loading" class="loading"><text>加载中...</text></view>

    <view v-else-if="list.length === 0" class="empty">
      <text class="empty-icon">🔔</text>
      <text class="empty-text">暂无通知</text>
    </view>

    <view v-else class="notif-list">
      <view
        v-for="n in list" :key="n.id"
        :class="['notif-item', { unread: !n.isRead }]"
        @tap="tapNotif(n)"
      >
        <view class="notif-dot" v-if="!n.isRead"></view>
        <view class="notif-body">
          <view class="notif-header">
            <text class="notif-type">{{ typeMap[n.type] || '系统' }}</text>
            <text class="notif-time">{{ formatTime(n.createdAt) }}</text>
          </view>
          <text class="notif-title">{{ n.title }}</text>
          <text v-if="n.content" class="notif-content">{{ n.content }}</text>
        </view>
        <text class="notif-del" @tap.stop="deleteNotif(n.id)">X</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, put, del } from '../../utils/api'

const typeMap: Record<string, string> = {
  system: '系统',
  score: '成绩',
  policy: '政策',
  exam: '考试',
  reminder: '提醒',
}

const list = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  const sid = uni.getStorageSync('studentId')
  if (!sid) { loading.value = false; return }
  try {
    const data = await get(`/notifications/student/${sid}`)
    list.value = Array.isArray(data) ? data : []
  } catch {}
  loading.value = false
})

function formatTime(t: string) {
  if (!t) return ''
  return t.substring(0, 16).replace('T', ' ')
}

async function tapNotif(n: any) {
  if (!n.isRead) {
    n.isRead = true
    try { await put(`/notifications/${n.id}/read`, {}) } catch {}
  }
}

async function markAllRead() {
  const sid = uni.getStorageSync('studentId')
  if (!sid) return
  try {
    await put(`/notifications/student/${sid}/read-all`, {})
    list.value.forEach(n => n.isRead = true)
    uni.showToast({ title: '全部已读', icon: 'success' })
  } catch {}
}

async function deleteNotif(id: number) {
  try {
    await del(`/notifications/${id}`)
    list.value = list.value.filter(n => n.id !== id)
  } catch { uni.showToast({ title: '删除失败', icon: 'none' }) }
}

async function clearAll() {
  const sid = uni.getStorageSync('studentId')
  if (!sid) return
  try {
    for (const n of list.value) {
      await del(`/notifications/${n.id}`)
    }
    list.value = []
    uni.showToast({ title: '已清空所有通知', icon: 'success' })
  } catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
}
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; }
.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 32rpx 16rpx; }
.top-title { font-size: 36rpx; font-weight: 600; color: #222; }
.top-actions { display: flex; gap: 20rpx; }
.mark-all { font-size: 24rpx; color: #2e4a78; }
.clear-all { font-size: 24rpx; color: #f5222d; }
.loading { display: flex; justify-content: center; padding: 100rpx 0; color: #999; font-size: 28rpx; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 160rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }
.notif-list { padding: 0 24rpx; }
.notif-item { display: flex; gap: 16rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; position: relative; }
.notif-item.unread { background: #f5f7fb; }
.notif-dot { width: 14rpx; height: 14rpx; border-radius: 50%; background: #f5222d; margin-top: 8rpx; flex-shrink: 0; }
.notif-body { flex: 1; }
.notif-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.notif-type { font-size: 22rpx; color: #5a7ab5; background: #edf2fa; padding: 2rpx 12rpx; border-radius: 6rpx; }
.notif-time { font-size: 22rpx; color: #bbb; }
.notif-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; margin-bottom: 6rpx; }
.notif-content { font-size: 24rpx; color: #999; display: block; line-height: 1.5; }
.notif-del { font-size: 24rpx; color: #f5222d; padding: 8rpx; flex-shrink: 0; align-self: flex-start; margin-top: 8rpx; }
</style>

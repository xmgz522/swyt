<template>
  <view class="page">
    <!-- 顶部简介 -->
    <view class="header">
      <text class="hd-title">三位一体 · 政策汇总</text>
      <text class="hd-desc">招生政策、报名条件、时间节点，一站了解</text>
    </view>

    <!-- 分类筛选 -->
    <scroll-view scroll-x class="tab-bar">
      <view
        v-for="t in tabs"
        :key="t.key"
        :class="['tab-item', activeTab === t.key ? 'active' : '']"
        @tap="activeTab = t.key"
      >
        <text>{{ t.label }}</text>
      </view>
    </scroll-view>

    <!-- 加载中 -->
    <view v-if="loading" class="empty-state">
      <text class="empty-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="filteredPolicies.length === 0" class="empty-state">
      <text class="empty-text">暂无该分类政策</text>
    </view>

    <!-- 政策列表 -->
    <view v-else class="list">
      <view
        v-for="(p, idx) in filteredPolicies"
        :key="idx"
        class="p-card"
        @tap="toggle(idx)"
      >
        <view class="p-head">
          <view class="p-tag" :style="{ background: p.tagBg, color: p.tagColor }">
            <text>{{ p.tag }}</text>
          </view>
          <text class="p-date" v-if="p.date">{{ p.date }}</text>
        </view>
        <text class="p-title">{{ p.title }}</text>
        <view v-if="expanded === idx" class="p-body">
          <text class="p-content">{{ p.content }}</text>
          <view v-if="p.url" class="p-link" @tap.stop="openUrl(p.url)">
            <text>查看原文 →</text>
          </view>
        </view>
        <view v-else class="p-preview">
          <text class="p-more">点击展开详情</text>
          <text class="p-arrow">▾</text>
        </view>
      </view>
    </view>

    <!-- 底部免责声明 -->
    <view class="footer">
      <text class="ft-text">* 政策信息仅供参考，以浙江省教育考试院官方公告为准</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { get } from '../../utils/api'

const activeTab = ref('all')
const expanded = ref<number | null>(null)
const policies = ref<any[]>([])
const loading = ref(true)

const tagColorMap: Record<string, { bg: string; color: string }> = {
  '招生政策': { bg: '#e0e7ff', color: '#2e4a78' },
  '报名条件': { bg: '#dcfce7', color: '#15803d' },
  '学考政策': { bg: '#ffedd5', color: '#c2410c' },
  '校考说明': { bg: '#ede9fe', color: '#6d28d9' },
  '志愿填报': { bg: '#fee2e2', color: '#b91c1c' },
  '时间节点': { bg: '#f3f4f6', color: '#374151' },
}

const tabs = [
  { key: 'all', label: '全部' },
  { key: '招生政策', label: '招生政策' },
  { key: '报名条件', label: '报名条件' },
  { key: '学考政策', label: '学考政策' },
  { key: '校考说明', label: '校考说明' },
  { key: '志愿填报', label: '志愿填报' },
  { key: '时间节点', label: '时间节点' },
]

const filteredPolicies = computed(() => {
  const list = policies.value.map(p => ({
    ...p,
    tagBg: tagColorMap[p.tag]?.bg || '#f3f4f6',
    tagColor: tagColorMap[p.tag]?.color || '#374151',
    date: p.publishDate || '',
  }))
  if (activeTab.value === 'all') return list
  return list.filter(p => p.tag === activeTab.value)
})

function toggle(idx: number) {
  expanded.value = expanded.value === idx ? null : idx
}

function openUrl(url: string) {
  uni.setClipboardData({
    data: url,
    success: () => {
      uni.showToast({ title: '链接已复制，可在浏览器打开', icon: 'none', duration: 2500 })
    },
  })
}

const fallbackPolicies = [
  { tag: '招生政策', publishDate: '2025-02-01', title: '浙江省高校综合评价招生工作实施办法', content: '综合评价招生是高校在普通高考基础上，结合学考成绩和学校综合素质测试成绩，按一定比例折算后择优录取的招生模式。\n\n· 录取总成绩 = 高考成绩×比例 + 学考成绩×比例 + 综合素质测试×比例\n· 各院校比例不同，通常高考占 50%~60%', url: 'https://www.zjzs.net' },
  { tag: '报名条件', publishDate: '2025-03-01', title: '三位一体报名资格与条件说明', content: '参加三位一体报名需满足以下基本条件：\n\n· 具有浙江省普通高中学籍，参加当年全国普通高考\n· 学考成绩满足目标院校最低等级要求\n· 部分院校要求综合素质评价达到一定等级\n· 报名时间通常在每年 3 月', url: 'https://www.zjzs.net' },
  { tag: '学考政策', publishDate: '2025-01-15', title: '浙江省普通高中学业水平考试政策', content: '浙江学考分为合格性考试和等级性考试。\n\n等级划分：A（前 5%）、B（前 20%）、C（前 50%）、D（前 80%）、E（其余）\n\n· 学考每年 1 月和 6 月各考一次\n· 考生可参加多次，取最高等级计入', url: 'https://www.zjzs.net' },
  { tag: '校考说明', publishDate: '2025-04-01', title: '三位一体综合素质测试内容与形式', content: '综合素质测试由各招生院校自行组织，通常包括：\n\n· 笔试：语数英综合或各校自命题\n· 面试：个人陈述、情景问答、小组讨论\n· 测试时间一般在 4月~5月', url: 'https://www.zjzs.net' },
  { tag: '志愿填报', publishDate: '2025-06-25', title: '三位一体志愿填报与录取规则', content: '· 三位一体志愿填报在高考出分后进行\n· 录取按综合成绩从高到低 1:1 投档\n· 被三位一体录取后不再参与普通批次投档', url: 'https://www.zjzs.net' },
  { tag: '时间节点', publishDate: '2025 全年', title: '2025 年三位一体重要时间节点汇总', content: '· 1月：学考（1月场）\n· 3月初：三位一体网上报名\n· 3月~4月：院校公布招生简章\n· 4月~5月：综合素质测试\n· 6月7-8日：全国统一高考\n· 6月：学考（6月场）\n· 7月：高考出分，志愿填报\n· 7月中下旬：录取公示', url: 'https://www.zjzs.net' },
]

onMounted(async () => {
  try {
    const res = await get('/policies/active')
    policies.value = Array.isArray(res) && res.length > 0 ? res : fallbackPolicies
  } catch {
    policies.value = fallbackPolicies
  }
  loading.value = false
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f5f6fa; padding-bottom: 40rpx; }

/* 顶部 */
.header { background: #2e4a78; padding: 40rpx 32rpx 36rpx; color: #fff; border-radius: 0 0 24rpx 24rpx; }
.hd-title { display: block; font-size: 34rpx; font-weight: 600; margin-bottom: 10rpx; }
.hd-desc { display: block; font-size: 24rpx; color: rgba(255,255,255,0.7); }

/* 分类 */
.tab-bar { white-space: nowrap; background: #fff; padding: 20rpx 20rpx; border-bottom: 1rpx solid #eee; }
.tab-item { display: inline-block; padding: 12rpx 28rpx; margin-right: 14rpx; background: #f4f5f7; border-radius: 30rpx; font-size: 24rpx; color: #666; }
.tab-item.active { background: #2e4a78; color: #fff; font-weight: 600; }

/* 空状态 */
.empty-state { display: flex; align-items: center; justify-content: center; height: 40vh; }
.empty-text { font-size: 28rpx; color: #bbb; }

/* 列表 */
.list { padding: 20rpx; }
.p-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.03); }
.p-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14rpx; }
.p-tag { padding: 6rpx 18rpx; border-radius: 20rpx; }
.p-tag text { font-size: 22rpx; font-weight: 600; }
.p-date { font-size: 22rpx; color: #999; }
.p-title { display: block; font-size: 30rpx; font-weight: 600; color: #333; line-height: 1.45; }
.p-preview { display: flex; align-items: center; justify-content: space-between; margin-top: 16rpx; }
.p-more { font-size: 22rpx; color: #aaa; }
.p-arrow { font-size: 22rpx; color: #bbb; }
.p-body { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx dashed #eee; }
.p-content { display: block; font-size: 26rpx; color: #555; line-height: 1.8; white-space: pre-wrap; }
.p-link { margin-top: 20rpx; display: inline-block; background: #eef2ff; padding: 10rpx 22rpx; border-radius: 20rpx; }
.p-link text { font-size: 24rpx; color: #2e4a78; font-weight: 500; }

.footer { padding: 20rpx 32rpx 40rpx; text-align: center; }
.ft-text { font-size: 22rpx; color: #aaa; }
</style>

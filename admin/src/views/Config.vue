<template>
  <div>
    <el-card>
      <template #header><span>系统配置（超管）</span></template>
      <el-form :model="config" label-width="120px" style="max-width: 600px;">
        <el-form-item label="系统名称">
          <el-input v-model="config.name" />
        </el-form-item>
        <el-form-item label="主题色">
          <el-color-picker v-model="config.primaryColor" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="config.phone" />
        </el-form-item>
        <el-form-item label="版权信息">
          <el-input v-model="config.copyright" />
        </el-form-item>
        <el-divider />
        <el-form-item label="功能开关">
          <div>
            <el-checkbox v-model="config.features.recommend">院校推荐</el-checkbox>
            <el-checkbox v-model="config.features.exam">模拟考试</el-checkbox>
            <el-checkbox v-model="config.features.report">报告生成</el-checkbox>
            <el-checkbox v-model="config.features.manualGrade">人工批改</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const config = ref<any>({
  name: '',
  primaryColor: '#1890ff',
  phone: '',
  copyright: '',
  features: { recommend: true, exam: true, report: true, manualGrade: true },
})

onMounted(async () => {
  const { data } = await api.get('/config/app')
  config.value = data
})

function handleSave() {
  // demo中配置保存暂为前端模拟
  ElMessage.success('配置已保存（Demo模式）')
}
</script>

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '@/utils/api'

export const useStudentStore = defineStore('student', () => {
  const studentId = ref<number | null>(Number(localStorage.getItem('studentId')) || null)
  const profile = ref<any>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!studentId.value)

  const gradeTotal = computed(() => {
    if (!profile.value) return 0
    return (profile.value.gradeA || 0) + (profile.value.gradeB || 0) + (profile.value.gradeC || 0) + (profile.value.gradeD || 0) + (profile.value.gradeE || 0)
  })

  async function loadProfile() {
    if (!studentId.value) return
    loading.value = true
    try {
      profile.value = await http.get(`/students/${studentId.value}`)
    } catch {}
    loading.value = false
  }

  async function saveProfile(data: any) {
    if (studentId.value) {
      const res: any = await http.put(`/students/${studentId.value}`, data)
      if (res?.id) {
        studentId.value = res.id
        localStorage.setItem('studentId', String(res.id))
        profile.value = res
      }
      return res
    } else {
      const res: any = await http.post('/students', data)
      if (res?.id) {
        studentId.value = res.id
        localStorage.setItem('studentId', String(res.id))
        profile.value = res
      }
      return res
    }
  }

  function logout() {
    studentId.value = null
    profile.value = null
    localStorage.removeItem('studentId')
  }

  return { studentId, profile, loading, isLoggedIn, gradeTotal, loadProfile, saveProfile, logout }
})

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserRole } from '@/lib/types'

interface AuthState {
  accessToken: string | null
  role: UserRole | null
  userId: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setAuth: (token: string, role: UserRole, userId: string) => void
  clearAuth: () => void
  setHasHydrated: (val: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      role: null,
      userId: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (val) => set({ _hasHydrated: val }),

      setAuth: (token, role, userId) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token)
        }
        set({ accessToken: token, role, userId, isAuthenticated: true })
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
        }
        set({
          accessToken: null,
          role: null,
          userId: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'healclaim-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : sessionStorage
      ),
      partialize: (state) => ({
        accessToken: state.accessToken,
        role: state.role,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
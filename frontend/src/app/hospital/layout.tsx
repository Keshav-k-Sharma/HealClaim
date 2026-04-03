'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Sidebar from '@/components/common/Sidebar'

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const { isAuthenticated, role, _hasHydrated } = useAuthStore()

    useEffect(() => {
        if (!_hasHydrated) return
        if (!isAuthenticated) { router.replace('/login'); return }
        if (role !== 'HOSPITAL') router.replace('/login')
    }, [isAuthenticated, role, _hasHydrated, router])

    if (!_hasHydrated) return null
    if (!isAuthenticated || role !== 'HOSPITAL') return null

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar role="HOSPITAL" />
            <main className="flex-1 md:p-8 p-4 pt-20 md:pt-8 max-w-5xl">
                {children}
            </main>
        </div>
    )
}
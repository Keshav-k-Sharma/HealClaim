'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Shield, LayoutDashboard, FileText, QrCode,
    FolderOpen, Settings, Building2, Briefcase,
    PlusCircle, ClipboardList, BookOpen, LogOut,
    ChevronRight, Menu, X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/lib/types'

// ─── Nav config per role ──────────────────────────────────────────────────────

const navItems: Record<UserRole, { href: string; label: string; icon: React.ReactNode }[]> = {
    PATIENT: [
        { href: '/patient/dashboard', label: 'Home', icon: <LayoutDashboard className="w-4 h-4" /> },
        { href: '/patient/claims', label: 'My Claims', icon: <FileText className="w-4 h-4" /> },
        { href: '/patient/qr', label: 'My QR', icon: <QrCode className="w-4 h-4" /> },
        { href: '/patient/documents', label: 'Documents', icon: <FolderOpen className="w-4 h-4" /> },
        { href: '/patient/policies', label: 'Policies', icon: <BookOpen className="w-4 h-4" /> },
        { href: '/patient/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ],
    HOSPITAL: [
        { href: '/hospital/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { href: '/hospital/claims/new', label: 'New Claim', icon: <PlusCircle className="w-4 h-4" /> },
        { href: '/hospital/claims', label: 'All Claims', icon: <ClipboardList className="w-4 h-4" /> },
        { href: '/hospital/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ],
    INSURER: [
        { href: '/insurer/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { href: '/insurer/claims', label: 'Claims Queue', icon: <ClipboardList className="w-4 h-4" /> },
        { href: '/insurer/policies', label: 'Policies', icon: <BookOpen className="w-4 h-4" /> },
        { href: '/insurer/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ],
}

const roleLabel: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
    PATIENT: { label: 'Patient', icon: <Shield className="w-4 h-4" />, color: 'text-primary bg-brand-50' },
    HOSPITAL: { label: 'Hospital', icon: <Building2 className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
    INSURER: { label: 'Insurer', icon: <Briefcase className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50' },
}

// ─── Active check ─────────────────────────────────────────────────────────────

function isActive(
    pathname: string,
    item: { href: string },
    items: { href: string }[],
    role: UserRole
): boolean {
    // Exact match always wins
    if (pathname === item.href) return true

    // Dashboard never matches sub-paths
    if (item.href === `/${role.toLowerCase()}/dashboard`) return false

    // Only match sub-paths if no other nav item is a more specific match
    if (pathname.startsWith(item.href + '/') || pathname.startsWith(item.href)) {
        const moreSpecificExists = items.some(
            (other) =>
                other.href !== item.href &&
                other.href.startsWith(item.href) &&
                pathname.startsWith(other.href)
        )
        return !moreSpecificExists
    }

    return false
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
    role: UserRole
    userName?: string
    userEmail?: string
}

export default function Sidebar({ role, userName, userEmail }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const clearAuth = useAuthStore((s) => s.clearAuth)
    const [open, setOpen] = useState(false)

    const items = navItems[role]
    const meta = roleLabel[role]

    const handleLogout = () => {
        clearAuth()
        router.push('/login')
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">HealClaim</span>
            </div>

            {/* Role badge */}
            <div className="px-4 py-3">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}>
                    {meta.icon}
                    {meta.label}
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {items.map((item) => {
                    const active = isActive(pathname, item, items, role)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                                ? 'bg-primary text-white'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                            {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                        </Link>
                    )
                })}
            </nav>

            {/* User + logout */}
            <div className="px-3 py-4 border-t border-gray-100 space-y-1">
                {userName && (
                    <div className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-900 truncate">{userName}</div>
                        {userEmail && (
                            <div className="text-xs text-gray-400 truncate">{userEmail}</div>
                        )}
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-gray-100 bg-white h-screen sticky top-0">
                <SidebarContent />
            </aside>

            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">HealClaim</span>
                </div>
                <button
                    onClick={() => setOpen(true)}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600"
                >
                    <Menu className="w-4 h-4" />
                </button>
            </div>

            {/* Mobile drawer */}
            {open && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative w-64 bg-white h-full shadow-xl flex flex-col">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    )
}
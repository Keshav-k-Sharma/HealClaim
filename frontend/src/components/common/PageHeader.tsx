'use client'

import { Bell } from 'lucide-react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {action}
                <button className="relative w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
            </div>
        </div>
    )
}
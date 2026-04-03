'use client'

import Link from 'next/link'
import { User, Building2, Briefcase, ChevronRight, Shield } from 'lucide-react'

const roles = [
    {
        id: 'patient',
        icon: <User className="w-6 h-6" />,
        label: 'Patient',
        description:
            'Upload your documents once, track claims in real time, and decide how to pay at discharge.',
        color: 'text-primary bg-brand-50 group-hover:bg-primary group-hover:text-white',
        href: '/auth/register/patient',
    },
    {
        id: 'hospital',
        icon: <Building2 className="w-6 h-6" />,
        label: 'Hospital',
        description:
            'Scan patient QR codes, upload treatment documents, and submit verified claim bundles instantly.',
        color: 'text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white',
        href: '/auth/register/hospital',
    },
    {
        id: 'insurer',
        icon: <Briefcase className="w-6 h-6" />,
        label: 'Insurer',
        description:
            'Publish your policy catalog, receive pre-verified claims, and settle faster with AI assistance.',
        color: 'text-orange-600 bg-orange-50 group-hover:bg-orange-600 group-hover:text-white',
        href: '/auth/register/insurer',
    },
]

export default function RegisterRolePicker() {
    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto w-full max-w-2xl px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                <span className="font-semibold text-gray-900">HealClaim</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create an account</h1>
            <p className="text-sm text-gray-500 mb-8">
                Select your role to get started.
            </p>

            <div className="space-y-3">
                {roles.map((role) => (
                    <Link
                        key={role.id}
                        href={role.href}
                        className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${role.color}`}>
                            {role.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm">{role.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                                {role.description}
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </Link>
                ))}
            </div>

            <p className="text-sm text-gray-500 text-center mt-6">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary font-medium hover:underline">
                    Sign in
                </Link>
            </p>
        </div>
    </div>
</main>
    )
}
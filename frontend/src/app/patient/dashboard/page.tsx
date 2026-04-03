'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    QrCode, FileText, Clock, CheckCircle,
    XCircle, Plus, ChevronRight, Download, AlertCircle
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { patientApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Claim, PatientProfile } from '@/lib/types'
import PageHeader from '@/components/common/PageHeader'
import StatCard from '@/components/common/StatCard'
import ClaimStatusBadge from '@/components/common/ClaimStatusBadge'
import SkeletonCard from '@/components/common/SkeletonCard'

export default function PatientDashboard() {
    const [profile, setProfile] = useState<PatientProfile | null>(null)
    const [claims, setClaims] = useState<Claim[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([patientApi.getProfile(), patientApi.getClaims()])
            .then(([p, c]) => { setProfile(p); setClaims(c) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const stats = {
        total: claims.length,
        pending: claims.filter((c) => c.status === 'PENDING_DECISION').length,
        approved: claims.filter((c) => c.status === 'APPROVED').length,
        rejected: claims.filter((c) => c.status === 'REJECTED').length,
    }

    const recent = claims.slice(0, 5)

    return (
        <>
            <PageHeader
                title={profile ? `Hello, ${profile.fullName.split(' ')[0]}` : 'Dashboard'}
                subtitle="Here's an overview of your claims."
            />

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} rows={2} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total claims" value={stats.total} icon={<FileText className="w-4 h-4" />} />
                    <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="amber" />
                    <StatCard label="Approved" value={stats.approved} icon={<CheckCircle className="w-4 h-4" />} color="green" />
                    <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="w-4 h-4" />} color="red" />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* QR Card */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Your QR code</div>
                            <div className="text-xs text-gray-400 mt-0.5">Show at hospital reception</div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-brand-50 text-primary flex items-center justify-center">
                            <QrCode className="w-4 h-4" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-4">
                            <div className="w-32 h-32 bg-gray-100 rounded-lg animate-pulse" />
                        </div>
                    ) : profile?.qrCodeToken ? (
                        <>
                            <div className="flex justify-center mb-4 p-3 bg-gray-50 rounded-xl">
                                <QRCodeCanvas value={profile.qrCodeToken} size={120} />
                            </div>
                            <p className="text-xs text-gray-400 text-center mb-3">{profile.fullName}</p>
                            <button
                                onClick={() => {
                                    const canvas = document.querySelector('canvas')
                                    if (canvas) {
                                        const link = document.createElement('a')
                                        link.download = 'healclaim-qr.png'
                                        link.href = canvas.toDataURL()
                                        link.click()
                                    }
                                }}
                                className="w-full h-9 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" /> Download QR
                            </button>
                        </>
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-6">QR code not available</p>
                    )}
                </div>

                {/* Recent claims */}
                <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-gray-900">Recent claims</div>
                        <Link
                            href="/patient/claims"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            View all <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : recent.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">No claims yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Claims filed by your hospital will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recent.map((claim) => (
                                <Link
                                    key={claim.id}
                                    href={`/patient/claims/${claim.id}`}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {claim.hospitalName}
                                        </div>
                                        <div className="text-xs text-gray-400">{formatDate(claim.createdAt)}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <ClaimStatusBadge status={claim.status} />
                                        <span className="text-xs text-gray-500">
                                            {formatCurrency(claim.claimedAmount)}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Policy info */}
            {!loading && (
                profile?.activePolicyName ? (
                    <div className="mt-6 bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900">Active policy</div>
                            <div className="text-xs text-gray-500 truncate">
                                {profile.activePolicyName} · {profile.insurerName}
                            </div>
                        </div>
                        <Link
                            href="/patient/policies"
                            className="text-xs text-primary hover:underline flex-shrink-0"
                        >
                            Change
                        </Link>
                    </div>
                ) : (
                    <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900">No policy linked</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                Link an insurance policy to use insurance for your claims.
                            </div>
                        </div>
                        <Link
                            href="/patient/policies"
                            className="flex-shrink-0 h-8 px-3 bg-primary text-white text-xs font-medium rounded-lg hover:bg-brand-800 transition-colors flex items-center"
                        >
                            Link policy
                        </Link>
                    </div>
                )
            )}
        </>
    )
}
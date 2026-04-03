'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Search, Filter, ChevronRight, FileText, Plus,
} from 'lucide-react'
import { hospitalApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Claim } from '@/lib/types'
import PageHeader from '@/components/common/PageHeader'
import ClaimStatusBadge from '@/components/common/ClaimStatusBadge'
import SkeletonCard from '@/components/common/SkeletonCard'

export default function HospitalAllClaims() {
    const [claims, setClaims] = useState<Claim[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('ALL')

    useEffect(() => {
        hospitalApi.getClaims()
            .then((data) => setClaims(data ?? []))
            .catch(() => setClaims([]))
            .finally(() => setLoading(false))
    }, [])

    const filtered = claims.filter((c) => {
        const matchSearch =
            c.patientName.toLowerCase().includes(search.toLowerCase()) ||
            c.id.toLowerCase().includes(search.toLowerCase())
        const matchFilter = filter === 'ALL' || c.status === filter
        return matchSearch && matchFilter
    })

    const StatusFilter = ({ value, label }: { value: string; label: string }) => (
        <button
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === value
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
        >
            {label}
        </button>
    )

    return (
        <>
            <PageHeader
                title="All Claims"
                subtitle={`${claims.length} total claim${claims.length !== 1 ? 's' : ''}`}
                action={
                    <Link
                        href="/hospital/claims/new"
                        className="flex items-center gap-2 h-9 px-4 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Claim
                    </Link>
                }
            />

            <div className="bg-white rounded-xl border border-gray-100">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            placeholder="Search by patient name or claim ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 pl-9 pr-4 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <StatusFilter value="ALL" label="All" />
                        <StatusFilter value="DRAFT" label="Draft" />
                        <StatusFilter value="PENDING_DECISION" label="Pending" />
                        <StatusFilter value="UNDER_REVIEW" label="In Review" />
                        <StatusFilter value="DOCUMENTS_REQUESTED" label="Docs Needed" />
                        <StatusFilter value="APPROVED" label="Approved" />
                        <StatusFilter value="REJECTED" label="Rejected" />
                        <StatusFilter value="CASH_PAID" label="Cash Paid" />
                    </div>
                </div>

                {loading ? (
                    <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No claims found</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">
                            {search || filter !== 'ALL'
                                ? 'Try adjusting your search or filter.'
                                : 'File your first claim to get started.'}
                        </p>
                        {!search && filter === 'ALL' && (
                            <Link
                                href="/hospital/claims/new"
                                className="flex items-center gap-2 h-9 px-4 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> New Claim
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {/* Header row */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                            <div className="col-span-3">Patient</div>
                            <div className="col-span-2">Claim ID</div>
                            <div className="col-span-2">Date</div>
                            <div className="col-span-2">Amount</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-1" />
                        </div>

                        {filtered.map((claim) => (
                            <Link
                                key={claim.id}
                                href={`/hospital/claims/${claim.id}`}
                                className="grid grid-cols-2 md:grid-cols-12 gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors items-center group"
                            >
                                <div className="col-span-1 md:col-span-3">
                                    <div className="text-sm font-medium text-gray-900">{claim.patientName}</div>
                                    <div className="text-xs text-gray-400 md:hidden">{formatDate(claim.createdAt)}</div>
                                </div>
                                <div className="col-span-2 text-xs text-gray-400 font-mono hidden md:block">
                                    #{claim.id.slice(0, 8)}
                                </div>
                                <div className="col-span-2 text-xs text-gray-500 hidden md:block">
                                    {formatDate(claim.createdAt)}
                                </div>
                                <div className="col-span-2 text-sm font-medium text-gray-900 hidden md:block">
                                    {formatCurrency(claim.claimedAmount)}
                                </div>
                                <div className="col-span-1 md:col-span-2 flex justify-end md:justify-start">
                                    <ClaimStatusBadge status={claim.status} />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
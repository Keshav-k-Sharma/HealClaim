'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Plus, BookOpen, FileText, ToggleLeft,
    ToggleRight, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { insurerApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Policy } from '@/lib/types'
import PageHeader from '@/components/common/PageHeader'
import SkeletonCard from '@/components/common/SkeletonCard'

export default function PoliciesPage() {
    const [policies, setPolicies] = useState<Policy[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        insurerApi.getPolicies()
            .then(setPolicies)
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const active = policies.filter((p) => p.isActive)
    const inactive = policies.filter((p) => !p.isActive)

    return (
        <>
            <PageHeader
                title="Policy Catalog"
                subtitle="Manage the insurance plans you offer on HealClaim."
                action={
                    <Link
                        href="/insurer/policies/new"
                        className="flex items-center gap-2 h-9 px-4 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add policy
                    </Link>
                }
            />

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} rows={3} />)}
                </div>
            ) : policies.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-6">
                    {active.length > 0 && (
                        <PolicyGroup
                            title="Active"
                            count={active.length}
                            policies={active}
                            onToggle={(id) => togglePolicy(id, policies, setPolicies)}
                        />
                    )}
                    {inactive.length > 0 && (
                        <PolicyGroup
                            title="Inactive"
                            count={inactive.length}
                            policies={inactive}
                            onToggle={(id) => togglePolicy(id, policies, setPolicies)}
                        />
                    )}
                </div>
            )}
        </>
    )
}

function togglePolicy(
    id: string,
    policies: Policy[],
    setPolicies: React.Dispatch<React.SetStateAction<Policy[]>>
) {
    setPolicies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    )
    // TODO: call insurerApi.updatePolicy when backend endpoint exists
    toast.success('Policy status updated.')
}

function PolicyGroup({
    title, count, policies, onToggle,
}: {
    title: string
    count: number
    policies: Policy[]
    onToggle: (id: string) => void
}) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{count}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map((policy) => (
                    <PolicyCard key={policy.id} policy={policy} onToggle={onToggle} />
                ))}
            </div>
        </div>
    )
}

function PolicyCard({
    policy, onToggle,
}: {
    policy: Policy
    onToggle: (id: string) => void
}) {
    return (
        <div className={`bg-white rounded-xl border transition-colors ${policy.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'
            }`}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">{policy.policyName}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{policy.coverageType}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => onToggle(policy.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors"
                        title={policy.isActive ? 'Deactivate' : 'Activate'}
                    >
                        {policy.isActive
                            ? <ToggleRight className="w-6 h-6 text-primary" />
                            : <ToggleLeft className="w-6 h-6" />}
                    </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Max coverage</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(policy.maxCoverage)}</span>
                </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                {policy.s3KeyDocument ? (
                    <a
                        href={`/api/documents/${policy.s3KeyDocument}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                        <FileText className="w-3.5 h-3.5" /> View policy doc
                    </a>
                ) : (
                    <span className="text-xs text-gray-400">No document uploaded</span>
                )}
            <Link
                href={`/insurer/policies/${policy.id}`}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
                Details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
        </div>
    </div >
  )
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-orange-400" />
            </div>
            <p className="text-base font-semibold text-gray-700 mb-1">No policies yet</p>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">
                Add your first policy so patients can link their accounts to your plans.
            </p>
            <Link
                href="/insurer/policies/new"
                className="flex items-center gap-2 h-10 px-5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
            >
                <Plus className="w-4 h-4" /> Add your first policy
            </Link>
        </div>
    )
}
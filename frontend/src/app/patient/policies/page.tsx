'use client'

import { useEffect, useState } from 'react'
import {
    BookOpen, CheckCircle, ChevronRight,
    Loader2, Shield, Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { patientApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Policy, PatientProfile } from '@/lib/types'
import PageHeader from '@/components/common/PageHeader'

export default function PatientPoliciesPage() {
    const [policies, setPolicies] = useState<Policy[]>([])
    const [profile, setProfile] = useState<PatientProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [linking, setLinking] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        Promise.all([
            patientApi.getAvailablePolicies(),
            patientApi.getProfile(),
        ])
            .then(([p, pr]) => { setPolicies(p ?? []); setProfile(pr) })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const handleLink = async (policyId: string) => {
        setLinking(policyId)
        try {
            const updated = await patientApi.linkPolicy(policyId)
            setProfile(updated)
            toast.success('Policy linked successfully!')
        } catch {
            toast.error('Failed to link policy. Please try again.')
        } finally {
            setLinking(null)
        }
    }

    const filtered = policies.filter((p) =>
        p.policyName.toLowerCase().includes(search.toLowerCase()) ||
        p.insurerName?.toLowerCase().includes(search.toLowerCase()) ||
        p.coverageType.toLowerCase().includes(search.toLowerCase())
    )

    const activePolicyId = profile?.activePolicyId

    return (
        <>
            <PageHeader
                title="Insurance Policies"
                subtitle="Browse and link a policy to your account."
            />

            {/* Active policy banner */}
            {profile?.activePolicyName && (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">Active policy</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                            {profile.activePolicyName} · {profile.insurerName}
                        </div>
                    </div>
                    <span className="text-xs text-primary font-medium">Linked</span>
                </div>
            )}

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    placeholder="Search by policy name, insurer, or coverage type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-40 bg-white rounded-xl border border-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No policies available</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {search ? 'Try a different search.' : 'Insurers have not published any policies yet.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((policy) => {
                        const isLinked = activePolicyId === policy.id
                        const isLinking = linking === policy.id

                        return (
                            <div
                                key={policy.id}
                                className={`bg-white rounded-xl border transition-all ${isLinked
                                        ? 'border-primary shadow-sm shadow-primary/10'
                                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                    }`}
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isLinked ? 'bg-primary text-white' : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                {isLinked
                                                    ? <CheckCircle className="w-4 h-4" />
                                                    : <BookOpen className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {policy.policyName}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    {policy.insurerName}
                                                </div>
                                            </div>
                                        </div>
                                        {isLinked && (
                                            <span className="text-xs bg-brand-50 text-primary px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Coverage type</span>
                                            <span className="text-gray-700 font-medium">{policy.coverageType}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Max coverage</span>
                                            <span className="text-gray-700 font-medium">
                                                {formatCurrency(policy.maxCoverage)}
                                            </span>
                                        </div>
                                        {policy.description && (
                                            <p className="text-xs text-gray-400 leading-relaxed pt-1">
                                                {policy.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isLinked ? (
                                            <div className="flex-1 h-9 bg-brand-50 text-primary text-xs font-medium rounded-lg flex items-center justify-center gap-1.5">
                                                <CheckCircle className="w-3.5 h-3.5" /> Currently linked
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleLink(policy.id)}
                                                disabled={!!linking}
                                                className="flex-1 h-9 bg-primary text-white text-xs font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                                            >
                                                {isLinking
                                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Linking...</>
                                                    : <>Link this policy <ChevronRight className="w-3.5 h-3.5" /></>}
                                            </button>
                                        )}
                                        {policy.s3KeyDocument && (
                                            <a
                                                href="#"
                                                className="h-9 px-3 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1"
                                            >
                                                View doc
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Info card */}
            <div className="mt-6 flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">
                    Your linked policy is shared with hospitals when they scan your QR code.
                    When you file a claim and choose insurance, it is automatically routed to your insurer.
                    You can change your linked policy at any time.
                </p>
            </div>
        </>
    )
}
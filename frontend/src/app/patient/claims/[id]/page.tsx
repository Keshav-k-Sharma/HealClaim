'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ChevronLeft, FileText, Download, Loader2,
    CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { claimsApi, patientApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Claim, ClaimDocument, ClaimStatusHistory, AIPredictions } from '@/lib/types'
import ClaimStatusBadge from '@/components/common/ClaimStatusBadge'
import ClaimTimeline from '@/components/common/ClaimTimeline'
import AIPredictionsCard from '@/components/common/AIPredictions'
import PageHeader from '@/components/common/PageHeader'

export default function PatientClaimDetail() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [claim, setClaim] = useState<Claim | null>(null)
    const [docs, setDocs] = useState<ClaimDocument[]>([])
    const [history, setHistory] = useState<ClaimStatusHistory[]>([])
    const [predictions, setPredictions] = useState<AIPredictions | null>(null)
    const [loading, setLoading] = useState(true)
    const [deciding, setDeciding] = useState<'CASH' | 'INSURANCE' | null>(null)

    useEffect(() => {
        Promise.all([
            claimsApi.getById(id),
            claimsApi.getDocuments(id),
            claimsApi.getStatusHistory(id),
            claimsApi.getPredictions(id).catch(() => null),
        ]).then(([c, d, h, p]) => {
            setClaim(c)
            setDocs(d)
            setHistory(h)
            setPredictions(p)
        }).catch(() => toast.error('Failed to load claim.'))
            .finally(() => setLoading(false))
    }, [id])

    const handleDecision = async (choice: 'CASH' | 'INSURANCE') => {
        setDeciding(choice)
        try {
            const updated = await patientApi.makeDecision(id, choice)
            setClaim(updated)
            toast.success(choice === 'CASH' ? 'Claim closed as cash payment.' : 'Claim sent to insurer.')
        } catch {
            toast.error('Failed to submit decision. Please try again.')
        } finally {
            setDeciding(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        )
    }

    if (!claim) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Claim not found.</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl">
            <PageHeader
                title="Claim details"
                action={
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                }
            />

            {/* Summary card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <div className="font-semibold text-gray-900">{claim.hospitalName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatDate(claim.createdAt)}</div>
                    </div>
                    <ClaimStatusBadge status={claim.status} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <SummaryItem label="Claimed amount" value={formatCurrency(claim.claimedAmount)} />
                    <SummaryItem label="Approved amount" value={claim.approvedAmount ? formatCurrency(claim.approvedAmount) : '—'} />
                    <SummaryItem label="Policy" value={claim.policyName ?? '—'} />
                    <SummaryItem label="Insurer" value={claim.insurerName ?? '—'} />
                </div>
            </div>

            {/* Decision banner */}
            {claim.status === 'PENDING_DECISION' && (
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 mb-4">
                    <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Action required</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                How would you like to settle this claim?
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleDecision('CASH')}
                            disabled={!!deciding}
                            className="h-11 border-2 border-gray-200 bg-white text-sm font-medium text-gray-700 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {deciding === 'CASH' && <Loader2 className="w-4 h-4 animate-spin" />}
                            Pay cash
                        </button>
                        <button
                            onClick={() => handleDecision('INSURANCE')}
                            disabled={!!deciding || !claim.policyId}
                            className="h-11 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {deciding === 'INSURANCE' && <Loader2 className="w-4 h-4 animate-spin" />}
                            Use insurance
                        </button>
                    </div>
                    {!claim.policyId && (
                        <p className="text-xs text-warning mt-2 text-center">
                            No active policy linked — insurance option unavailable.
                        </p>
                    )}
                </div>
            )}

            {/* AI predictions */}
            {predictions && (
                <div className="mb-4">
                    <AIPredictionsCard data={predictions} />
                </div>
            )}

            {/* Status timeline */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
                <div className="text-sm font-semibold text-gray-900 mb-4">Status timeline</div>
                <ClaimTimeline history={history} />
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-900 mb-4">
                    Documents ({docs.length})
                </div>
                {docs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No documents yet.</p>
                ) : (
                    <div className="space-y-2">
                        {docs.map((doc) => (
                            <DocRow key={doc.id} doc={doc} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-gray-400">{label}</div>
            <div className="text-sm font-medium text-gray-900 mt-0.5">{value}</div>
        </div>
    )
}

function DocRow({ doc }: { doc: ClaimDocument }) {
    const sourceBg = doc.source === 'PATIENT_PRE_UPLOAD'
        ? 'bg-brand-50 text-primary'
        : 'bg-purple-50 text-purple-600'
    const sourceLabel = doc.source === 'PATIENT_PRE_UPLOAD' ? 'Patient' : 'Hospital'

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${sourceBg}`}>
                        {sourceLabel}
                    </span>
                    <span className="text-xs text-gray-400">{doc.docType.replace(/_/g, ' ')}</span>
                </div>
            </div>
            <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                <Download className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}
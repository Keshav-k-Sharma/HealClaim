'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ChevronLeft, FileText, Upload, Loader2,
    AlertTriangle, CheckCircle, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { claimsApi, hospitalApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type {
    Claim, ClaimDocument, ClaimStatusHistory,
    AIPredictions, DocumentRequest,
} from '@/lib/types'
import ClaimStatusBadge from '@/components/common/ClaimStatusBadge'
import ClaimTimeline from '@/components/common/ClaimTimeline'
import AIPredictionsCard from '@/components/common/AIPredictions'
import PageHeader from '@/components/common/PageHeader'

export default function HospitalClaimDetail() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [claim, setClaim] = useState<Claim | null>(null)
    const [docs, setDocs] = useState<ClaimDocument[]>([])
    const [history, setHistory] = useState<ClaimStatusHistory[]>([])
    const [predictions, setPredictions] = useState<AIPredictions | null>(null)
    const [docRequests, setDocRequests] = useState<DocumentRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [uploadingReq, setUploadingReq] = useState<string | null>(null)

    const load = () =>
        Promise.all([
            claimsApi.getById(id),
            claimsApi.getDocuments(id),
            claimsApi.getStatusHistory(id),
            claimsApi.getPredictions(id).catch(() => null),
            claimsApi.getDocumentRequests(id),
        ]).then(([c, d, h, p, dr]) => {
            setClaim(c); setDocs(d); setHistory(h)
            setPredictions(p); setDocRequests(dr)
        }).catch(() => toast.error('Failed to load claim.'))
            .finally(() => setLoading(false))

    useEffect(() => { load() }, [id])

    const handleFulfill = async (reqId: string, file: File) => {
        setUploadingReq(reqId)
        try {
            await hospitalApi.fulfillDocumentRequest(id, reqId, file)
            toast.success('Document uploaded. Insurer has been notified.')
            load()
        } catch {
            toast.error('Upload failed. Please try again.')
        } finally {
            setUploadingReq(null)
        }
    }

    const pendingRequests = docRequests.filter((r) => r.status === 'PENDING')

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        )
    }

    if (!claim) return <div className="text-center py-20 text-gray-500">Claim not found.</div>

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

            {/* Doc request banner */}
            {pendingRequests.length > 0 && (
                <div className="bg-warning-light border border-amber-200 rounded-xl p-4 mb-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                        <span className="text-sm font-semibold text-warning-foreground">
                            Insurer requested {pendingRequests.length} document{pendingRequests.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    {pendingRequests.map((req) => (
                        <div key={req.id} className="bg-white rounded-lg p-3 border border-amber-100">
                            <p className="text-sm text-gray-700 mb-2">{req.description}</p>
                            <label className={`inline-flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg cursor-pointer transition-colors ${uploadingReq === req.id
                                    ? 'bg-gray-100 text-gray-400'
                                    : 'bg-primary text-white hover:bg-brand-800'
                                }`}>
                                {uploadingReq === req.id
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                    : <><Upload className="w-4 h-4" /> Upload document</>}
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    disabled={!!uploadingReq}
                                    onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) handleFulfill(req.id, f)
                                    }}
                                />
                            </label>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <div className="font-semibold text-gray-900">{claim.patientName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatDate(claim.createdAt)}</div>
                    </div>
                    <ClaimStatusBadge status={claim.status} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <SummaryItem label="Claimed amount" value={formatCurrency(claim.claimedAmount)} />
                    <SummaryItem label="Approved" value={claim.approvedAmount ? formatCurrency(claim.approvedAmount) : '—'} />
                    <SummaryItem label="Policy" value={claim.policyName ?? '—'} />
                    <SummaryItem label="Insurer" value={claim.insurerName ?? '—'} />
                </div>
            </div>

            {/* AI predictions */}
            {predictions && (
                <div className="mb-4">
                    <AIPredictionsCard data={predictions} />
                </div>
            )}

            {/* Timeline */}
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
                    <p className="text-sm text-gray-400 text-center py-4">No documents.</p>
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
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${doc.source === 'PATIENT_PRE_UPLOAD'
                            ? 'bg-brand-50 text-primary'
                            : 'bg-purple-50 text-purple-600'
                        }`}>
                        {doc.source === 'PATIENT_PRE_UPLOAD' ? 'Patient' : 'Hospital'}
                    </span>
                    <span className="text-xs text-gray-400">{doc.docType.replace(/_/g, ' ')}</span>
                </div>
            </div>
        </div>
    )
}
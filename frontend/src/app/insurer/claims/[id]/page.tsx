'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ChevronLeft, FileText, Loader2, CheckCircle,
    XCircle, MessageSquare, AlertTriangle, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { claimsApi, insurerApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type {
    Claim, ClaimDocument, ClaimStatusHistory, AIPredictions,
} from '@/lib/types'
import ClaimStatusBadge from '@/components/common/ClaimStatusBadge'
import ClaimTimeline from '@/components/common/ClaimTimeline'
import AIPredictionsCard from '@/components/common/AIPredictions'
import PageHeader from '@/components/common/PageHeader'

type ActionPanel = 'none' | 'approve' | 'reject' | 'request'

export default function InsurerClaimDetail() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [claim, setClaim] = useState<Claim | null>(null)
    const [docs, setDocs] = useState<ClaimDocument[]>([])
    const [history, setHistory] = useState<ClaimStatusHistory[]>([])
    const [predictions, setPredictions] = useState<AIPredictions | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeDoc, setActiveDoc] = useState<string | null>(null)
    const [panel, setPanel] = useState<ActionPanel>('none')
    const [actionNote, setActionNote] = useState('')
    const [approvedAmt, setApprovedAmt] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [reqDesc, setReqDesc] = useState('')

    useEffect(() => {
        Promise.all([
            claimsApi.getById(id),
            claimsApi.getDocuments(id),
            claimsApi.getStatusHistory(id),
            claimsApi.getPredictions(id).catch(() => null),
        ]).then(([c, d, h, p]) => {
            setClaim(c); setDocs(d); setHistory(h); setPredictions(p)
            if (d.length > 0) setActiveDoc(d[0].id)
        }).catch(() => toast.error('Failed to load claim.'))
            .finally(() => setLoading(false))
    }, [id])

    const handleStatusUpdate = async (
        status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW',
        extra?: { note?: string; approvedAmount?: number }
    ) => {
        setSubmitting(true)
        try {
            const updated = await insurerApi.updateClaimStatus(id, { status, ...extra })
            setClaim(updated)
            setPanel('none')
            setActionNote('')
            setApprovedAmt('')
            toast.success(`Claim ${status.toLowerCase().replace('_', ' ')}.`)
            const h = await claimsApi.getStatusHistory(id)
            setHistory(h)
        } catch {
            toast.error('Action failed. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRequestDocs = async () => {
        if (!reqDesc.trim()) return
        setSubmitting(true)
        try {
            await insurerApi.requestDocuments(id, reqDesc.trim())
            const updated = await claimsApi.getById(id)
            setClaim(updated)
            setPanel('none')
            setReqDesc('')
            toast.success('Document request sent to hospital.')
        } catch {
            toast.error('Request failed. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const isTerminal = claim?.status === 'APPROVED' || claim?.status === 'REJECTED' || claim?.status === 'CASH_PAID'

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        )
    }

    if (!claim) return <div className="text-center py-20 text-gray-500">Claim not found.</div>

    const activeDocObj = docs.find((d) => d.id === activeDoc)

    return (
        <div className="max-w-5xl">
            <PageHeader
                title="Review claim"
                action={
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Left: document viewer + timeline (3 cols) */}
                <div className="lg:col-span-3 space-y-4">

                    {/* Doc tabs */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className="flex overflow-x-auto border-b border-gray-100">
                            {docs.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setActiveDoc(doc.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeDoc === doc.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    {doc.fileName.length > 20
                                        ? doc.fileName.slice(0, 18) + '…'
                                        : doc.fileName}
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${doc.source === 'PATIENT_PRE_UPLOAD'
                                            ? 'bg-brand-50 text-primary'
                                            : 'bg-purple-50 text-purple-600'
                                        }`}>
                                        {doc.source === 'PATIENT_PRE_UPLOAD' ? 'P' : 'H'}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Viewer */}
                        <div className="h-96 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                            {activeDocObj ? (
                                <>
                                    <FileText className="w-10 h-10 mb-3 text-gray-300" />
                                    <p className="text-sm font-medium text-gray-600">{activeDocObj.fileName}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {activeDocObj.docType.replace(/_/g, ' ')} ·{' '}
                                        {activeDocObj.source === 'PATIENT_PRE_UPLOAD' ? 'Patient upload' : 'Hospital upload'}
                                    </p>
                                    <a
                                        href={`/api/documents/${activeDocObj.s3Key}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 text-xs text-primary hover:underline"
                                    >
                                        Open full document →
                                    </a>
                                </>
                            ) : (
                                <p className="text-sm">No documents attached.</p>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="text-sm font-semibold text-gray-900 mb-4">Status timeline</div>
                        <ClaimTimeline history={history} />
                    </div>
                </div>

                {/* Right: metadata + actions (2 cols) */}
                <div className="lg:col-span-2 space-y-4">

                    {/* AI predictions */}
                    {predictions && <AIPredictionsCard data={predictions} />}

                    {/* Claim metadata */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold text-gray-900">Claim info</div>
                            <ClaimStatusBadge status={claim.status} />
                        </div>
                        <div className="space-y-2.5">
                            <MetaRow label="Patient" value={claim.patientName} />
                            <MetaRow label="Hospital" value={claim.hospitalName} />
                            <MetaRow label="Policy" value={claim.policyName ?? '—'} />
                            <MetaRow label="Filed" value={formatDate(claim.createdAt)} />
                            <MetaRow label="Claimed" value={formatCurrency(claim.claimedAmount)} bold />
                            {claim.approvedAmount && (
                                <MetaRow label="Approved" value={formatCurrency(claim.approvedAmount)} bold />
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {!isTerminal && (
                        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
                            <div className="text-sm font-semibold text-gray-900 mb-1">Actions</div>

                            {/* Approve */}
                            <div>
                                <button
                                    onClick={() => setPanel(panel === 'approve' ? 'none' : 'approve')}
                                    className="w-full flex items-center justify-between h-10 px-4 bg-success-light text-success text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Approve claim
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${panel === 'approve' ? 'rotate-180' : ''}`} />
                                </button>
                                {panel === 'approve' && (
                                    <div className="mt-2 space-y-2">
                                        <input
                                            type="number"
                                            placeholder={`Approved amount (max ₹${claim.claimedAmount.toLocaleString('en-IN')})`}
                                            value={approvedAmt}
                                            onChange={(e) => setApprovedAmt(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <textarea
                                            rows={2}
                                            placeholder="Note (optional)"
                                            value={actionNote}
                                            onChange={(e) => setActionNote(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <button
                                            onClick={() => handleStatusUpdate('APPROVED', {
                                                note: actionNote || undefined,
                                                approvedAmount: approvedAmt ? Number(approvedAmt) : claim.claimedAmount,
                                            })}
                                            disabled={submitting}
                                            className="w-full h-9 bg-success text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Confirm approval
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Reject */}
                            <div>
                                <button
                                    onClick={() => setPanel(panel === 'reject' ? 'none' : 'reject')}
                                    className="w-full flex items-center justify-between h-10 px-4 bg-danger-light text-danger text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4" /> Reject claim
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${panel === 'reject' ? 'rotate-180' : ''}`} />
                                </button>
                                {panel === 'reject' && (
                                    <div className="mt-2 space-y-2">
                                        <textarea
                                            rows={2}
                                            placeholder="Reason for rejection (required)"
                                            value={actionNote}
                                            onChange={(e) => setActionNote(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <button
                                            onClick={() => handleStatusUpdate('REJECTED', { note: actionNote })}
                                            disabled={submitting || !actionNote.trim()}
                                            className="w-full h-9 bg-danger text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Confirm rejection
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Request docs */}
                            <div>
                                <button
                                    onClick={() => setPanel(panel === 'request' ? 'none' : 'request')}
                                    className="w-full flex items-center justify-between h-10 px-4 bg-warning-light text-warning-foreground text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Request documents
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${panel === 'request' ? 'rotate-180' : ''}`} />
                                </button>
                                {panel === 'request' && (
                                    <div className="mt-2 space-y-2">
                                        <textarea
                                            rows={2}
                                            placeholder="Describe what documents are needed..."
                                            value={reqDesc}
                                            onChange={(e) => setReqDesc(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <button
                                            onClick={handleRequestDocs}
                                            disabled={submitting || !reqDesc.trim()}
                                            className="w-full h-9 bg-warning text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Send request
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Terminal state message */}
                    {isTerminal && (
                        <div className={`rounded-xl p-4 flex items-center gap-3 ${claim.status === 'APPROVED'
                                ? 'bg-success-light border border-green-200'
                                : 'bg-danger-light border border-red-200'
                            }`}>
                            {claim.status === 'APPROVED'
                                ? <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                                : <XCircle className="w-5 h-5 text-danger flex-shrink-0" />}
                            <div>
                                <div className="text-sm font-semibold text-gray-900">
                                    Claim {claim.status === 'APPROVED' ? 'approved' : 'rejected'}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">No further action required.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function MetaRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm gap-4">
            <span className="text-gray-400 flex-shrink-0">{label}</span>
            <span className={`text-right truncate ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                {value}
            </span>
        </div>
    )
}
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, X, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { patientApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { PatientDocument } from '@/lib/types'
import PageHeader from '@/components/common/PageHeader'

const DOC_SLOTS = [
    { key: 'PAN_CARD', label: 'PAN Card', desc: 'Permanent Account Number card' },
    { key: 'AADHAAR', label: 'Aadhaar Card', desc: '12-digit government ID' },
    { key: 'POLICY_DOCUMENT', label: 'Insurance Policy', desc: 'Your active insurance policy doc' },
] as const

type DocKey = (typeof DOC_SLOTS)[number]['key']

export default function PatientDocumentsPage() {
    const [docs, setDocs] = useState<PatientDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState<DocKey | null>(null)

    const load = () =>
        patientApi.getDocuments()
            .then(setDocs)
            .catch(() => { })
            .finally(() => setLoading(false))

    useEffect(() => { load() }, [])

    const handleUpload = useCallback(async (key: DocKey, file: File) => {
        setUploading(key)
        try {
            await patientApi.uploadDocument(key, file)
            toast.success('Document uploaded successfully.')
            load()
        } catch {
            toast.error('Upload failed. Please try again.')
        } finally {
            setUploading(null)
        }
    }, [])

    const getDoc = (key: string) => docs.find((d) => d.docType === key)

    return (
        <>
            <PageHeader
                title="My Documents"
                subtitle="Pre-uploaded documents reused across all your claims."
                action={
                    <button
                        onClick={() => { setLoading(true); load() }}
                        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                }
            />

            <div className="max-w-xl space-y-4">
                {/* Required documents */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <div className="text-sm font-semibold text-gray-900">Identity & policy documents</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                            These are shared with hospitals when they scan your QR.
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {DOC_SLOTS.map((slot) => {
                            const existing = getDoc(slot.key)
                            const isUploading = uploading === slot.key
                            return (
                                <div key={slot.key} className="flex items-center gap-4 px-5 py-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${existing ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {existing
                                            ? <CheckCircle className="w-5 h-5" />
                                            : <FileText className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900">{slot.label}</div>
                                        {existing ? (
                                            <div className="text-xs text-gray-400 mt-0.5 truncate">
                                                {existing.fileName} · uploaded {formatDate(existing.uploadedAt)}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-400 mt-0.5">{slot.desc}</div>
                                        )}
                                    </div>
                                    <label className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors flex-shrink-0 ${isUploading
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : existing
                                                ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                : 'bg-primary text-white hover:bg-brand-800'
                                        }`}>
                                        {isUploading ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading</>
                                        ) : existing ? (
                                            <><RefreshCw className="w-3.5 h-3.5" /> Replace</>
                                        ) : (
                                            <><Upload className="w-3.5 h-3.5" /> Upload</>
                                        )}
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            disabled={!!uploading}
                                            onChange={(e) => {
                                                const f = e.target.files?.[0]
                                                if (f) handleUpload(slot.key, f)
                                            }}
                                        />
                                    </label>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* All uploaded docs */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">All uploaded files</div>
                            <div className="text-xs text-gray-400 mt-0.5">{docs.length} document{docs.length !== 1 ? 's' : ''}</div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">No documents uploaded yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Upload your PAN, Aadhaar, and policy document above.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {docs.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {doc.docType.replace(/_/g, ' ')} · {formatDate(doc.uploadedAt)}
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-primary font-medium flex-shrink-0">
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Security note */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Your documents are encrypted with AES-256 and stored on AWS S3.
                        They are only shared with hospital staff when you show your QR code.
                    </p>
                </div>
            </div>
        </>
    )
}
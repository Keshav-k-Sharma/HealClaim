'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    QrCode, ChevronLeft, ChevronRight, CheckCircle,
    Upload, X, Loader2, User, FileText,
    Search, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { hospitalApi } from '@/lib/api'
import type { PatientProfile, ApiError } from '@/lib/types'
import PageHeader from '@/components/common/PageHeader'

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = ['Find Patient', 'Claim Details', 'Documents', 'Review'] as const
type Step = 0 | 1 | 2 | 3 | 4  // 4 = success

// ─── Schemas ──────────────────────────────────────────────────────────────────

const claimSchema = z.object({
    treatmentDescription: z.string().min(10, 'Provide a brief treatment description'),
    admissionDate: z.string().min(1, 'Select admission date'),
    dischargeDate: z.string().min(1, 'Select discharge date'),
    claimedAmount: z.coerce.number().min(1, 'Enter the claimed amount'),
    diagnosisCode: z.string().optional(),
})

type ClaimForm = z.infer<typeof claimSchema>

// ─── Doc slots ────────────────────────────────────────────────────────────────

const DOC_SLOTS = [
    { key: 'HOSPITAL_BILL', label: 'Hospital Bill', required: true },
    { key: 'DISCHARGE_SUMMARY', label: 'Discharge Summary', required: true },
    { key: 'LAB_REPORT', label: 'Lab Reports', required: false },
    { key: 'PRESCRIPTION', label: 'Prescriptions', required: false },
    { key: 'DOCTOR_NOTES', label: 'Doctor Notes', required: false },
] as const

type DocKey = (typeof DOC_SLOTS)[number]['key']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewClaimPage() {
    const router = useRouter()

    const [step, setStep] = useState<Step>(0)
    const [qrInput, setQrInput] = useState('')
    const [lookingUp, setLookingUp] = useState(false)
    const [patient, setPatient] = useState<PatientProfile | null>(null)
    const [lookupError, setLookupError] = useState<string | null>(null)
    const [claimData, setClaimData] = useState<ClaimForm | null>(null)
    const [files, setFiles] = useState<Partial<Record<DocKey, File>>>({})
    const [submitting, setSubmitting] = useState(false)
    const [createdId, setCreatedId] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ClaimForm>({ resolver: zodResolver(claimSchema) as never })

    // ── Step 0: patient lookup ──
    const handleLookup = async () => {
        if (!qrInput.trim()) return
        setLookingUp(true)
        setLookupError(null)
        try {
            const p = await hospitalApi.lookupPatient(qrInput.trim())
            setPatient(p)
        } catch {
            setLookupError('Patient not found. Check the QR token and try again.')
        } finally {
            setLookingUp(false)
        }
    }

    // ── Step 1: claim details ──
    const onClaimSubmit = (data: ClaimForm) => {
        setClaimData(data)
        setStep(2)
    }

    // ── Step 2: files ──
    const handleFilePick = useCallback(
        (key: DocKey, file: File) => setFiles((p) => ({ ...p, [key]: file })),
        []
    )
    const handleFileRemove = useCallback(
        (key: DocKey) => setFiles((p) => { const n = { ...p }; delete n[key]; return n }),
        []
    )

    const requiredPicked = DOC_SLOTS.filter((s) => s.required).every((s) => files[s.key])

    // ── Step 3: submit everything ──
    const handleSubmit_ = async () => {
        if (!patient || !claimData) return
        setSubmitting(true)
        try {
            // 1. Create claim
            const claim = await hospitalApi.createClaim({
                patientQrToken: patient.qrCodeToken,
                treatmentDescription: claimData.treatmentDescription,
                admissionDate: claimData.admissionDate,
                dischargeDate: claimData.dischargeDate,
                claimedAmount: claimData.claimedAmount,
                diagnosisCode: claimData.diagnosisCode,
            })

            // 2. Upload documents
            for (const slot of DOC_SLOTS) {
                const file = files[slot.key]
                if (file) await hospitalApi.uploadClaimDocument(claim.id, slot.key, file)
            }

            // 3. Submit bundle to patient
            await hospitalApi.submitBundle(claim.id)

            setCreatedId(claim.id)
            setStep(4)
        } catch (err) {
            const apiErr = err as ApiError
            toast.error(apiErr.message ?? 'Submission failed. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl">
            <PageHeader
                title="New Claim"
                subtitle="File a claim on behalf of a patient."
            />

            {/* Stepper */}
            {step < 4 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
                        {STEPS.map((label, i) => (
                            <div key={label} className="flex items-center gap-2 flex-shrink-0">
                                <div className={`flex items-center gap-1.5`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i < step ? 'bg-primary text-white'
                                            : i === step ? 'bg-primary text-white'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                                    </div>
                                    <span className={`text-xs font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`w-8 h-px flex-shrink-0 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* ── Step 0: Find patient ── */}
            {step === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Find patient</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Enter the patient&apos;s QR token or scan their QR code.
                    </p>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">QR token</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        placeholder="Paste or type patient QR token..."
                                        value={qrInput}
                                        onChange={(e) => {
                                            setQrInput(e.target.value)
                                            setPatient(null)
                                            setLookupError(null)
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                        className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <button
                                    onClick={handleLookup}
                                    disabled={!qrInput.trim() || lookingUp}
                                    className="h-12 px-4 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center gap-2"
                                >
                                    {lookingUp
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Search className="w-4 h-4" />}
                                    {lookingUp ? 'Searching...' : 'Lookup'}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {lookupError && (
                            <div className="flex items-center gap-2 p-3 bg-danger-light rounded-lg text-sm text-danger">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {lookupError}
                            </div>
                        )}

                        {/* Patient card */}
                        {patient && (
                            <div className="border border-primary bg-brand-50 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900">{patient.fullName}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">ID: {patient.nationalId}</div>
                                        {patient.activePolicyName && (
                                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-brand-200 rounded-lg text-xs text-gray-700">
                                                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                                                {patient.activePolicyName} · {patient.insurerName}
                                            </div>
                                        )}
                                        {!patient.activePolicyName && (
                                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-warning-light border border-amber-200 rounded-lg text-xs text-warning-foreground">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                No active insurance policy
                                            </div>
                                        )}
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={() => setStep(1)}
                            disabled={!patient}
                            className="w-full h-12 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            Confirm & continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 1: Claim details ── */}
            {step === 1 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    {/* Patient pill */}
                    {patient && (
                        <div className="flex items-center gap-2 mb-5 p-3 bg-brand-50 rounded-lg">
                            <User className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-gray-900">{patient.fullName}</span>
                            <span className="text-xs text-gray-400">· {patient.nationalId}</span>
                        </div>
                    )}

                    <h2 className="text-base font-semibold text-gray-900 mb-1">Claim details</h2>
                    <p className="text-sm text-gray-500 mb-5">Enter treatment information.</p>

                    <form onSubmit={handleSubmit(onClaimSubmit as never)} className="space-y-4">
                        <Field label="Treatment description" error={errors.treatmentDescription?.message}>
                            <textarea
                                rows={3}
                                placeholder="Brief description of the treatment, procedure, or diagnosis..."
                                {...register('treatmentDescription')}
                                className={`${inputCls} h-auto py-3 resize-none`}
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Admission date" error={errors.admissionDate?.message}>
                                <input type="date" {...register('admissionDate')} className={inputCls} />
                            </Field>
                            <Field label="Discharge date" error={errors.dischargeDate?.message}>
                                <input type="date" {...register('dischargeDate')} className={inputCls} />
                            </Field>
                        </div>

                        <Field label="Claimed amount (₹)" error={errors.claimedAmount?.message}>
                            <input
                                type="number"
                                placeholder="85000"
                                {...register('claimedAmount')}
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Diagnosis code (ICD-10, optional)" error={errors.diagnosisCode?.message}>
                            <input placeholder="e.g. J18.9" {...register('diagnosisCode')} className={inputCls} />
                        </Field>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setStep(0)} className={ghostBtn}>
                                <ChevronLeft className="w-4 h-4" /> Back
                            </button>
                            <button type="submit" className={`${primaryBtn} flex-1`}>
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Step 2: Documents ── */}
            {step === 2 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Upload documents</h2>
                    <p className="text-sm text-gray-500 mb-5">
                        Upload treatment documents. Patient&apos;s identity docs are already on file.
                    </p>

                    <div className="space-y-2.5 mb-6">
                        {DOC_SLOTS.map((slot) => (
                            <DocUploadSlot
                                key={slot.key}
                                label={slot.label}
                                required={slot.required}
                                file={files[slot.key]}
                                onPick={(f) => handleFilePick(slot.key, f)}
                                onRemove={() => handleFileRemove(slot.key)}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className={ghostBtn}>
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            disabled={!requiredPicked}
                            className={`${primaryBtn} flex-1`}
                        >
                            Review claim <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && patient && claimData && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Review & submit</h2>
                    <p className="text-sm text-gray-500 mb-5">
                        Confirm everything before sending to the patient.
                    </p>

                    {/* Patient */}
                    <ReviewSection title="Patient">
                        <ReviewRow label="Name" value={patient.fullName} />
                        <ReviewRow label="ID" value={patient.nationalId} />
                        <ReviewRow label="Policy" value={patient.activePolicyName ?? 'None'} />
                        <ReviewRow label="Insurer" value={patient.insurerName ?? 'None'} />
                    </ReviewSection>

                    {/* Claim */}
                    <ReviewSection title="Claim details">
                        <ReviewRow label="Treatment" value={claimData.treatmentDescription} />
                        <ReviewRow label="Admission" value={claimData.admissionDate} />
                        <ReviewRow label="Discharge" value={claimData.dischargeDate} />
                        <ReviewRow label="Amount" value={`₹${claimData.claimedAmount.toLocaleString('en-IN')}`} />
                        {claimData.diagnosisCode && (
                            <ReviewRow label="ICD-10" value={claimData.diagnosisCode} />
                        )}
                    </ReviewSection>

                    {/* Documents */}
                    <ReviewSection title="Documents">
                        {DOC_SLOTS.map((slot) => (
                            files[slot.key] ? (
                                <div key={slot.key} className="flex items-center gap-2 text-sm py-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                    <span className="text-gray-600">{slot.label}</span>
                                    <span className="text-gray-400 text-xs truncate ml-auto">
                                        {files[slot.key]?.name}
                                    </span>
                                </div>
                            ) : null
                        ))}
                    </ReviewSection>

                    <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 mb-5 text-xs text-gray-600 flex items-start gap-2">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        The patient will be notified to review this bundle and choose how to proceed.
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setStep(2)} className={ghostBtn}>
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                            onClick={handleSubmit_}
                            disabled={submitting}
                            className={`${primaryBtn} flex-1`}
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {submitting ? 'Submitting...' : 'Submit claim bundle'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Step 4: Success ── */}
            {step === 4 && (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                    <div className="w-14 h-14 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-7 h-7 text-success" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Claim submitted!</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        The patient has been notified. They&apos;ll review the bundle and decide how to proceed.
                    </p>
                    <div className="flex flex-col gap-3">
                        {createdId && (
                            <button
                                onClick={() => router.push(`/hospital/claims/${createdId}`)}
                                className={primaryBtn}
                            >
                                View claim <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/hospital/claims/new')}
                            className={ghostBtn + ' w-full justify-center'}
                        >
                            File another claim
                        </button>
                        <button
                            onClick={() => router.push('/hospital/dashboard')}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Back to dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, error, children }: {
    label: string; error?: string; children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">{children}</div>
        </div>
    )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="text-gray-500 flex-shrink-0">{label}</span>
            <span className="font-medium text-gray-900 text-right">{value}</span>
        </div>
    )
}

function DocUploadSlot({ label, required, file, onPick, onRemove }: {
    label: string; required: boolean
    file?: File; onPick: (f: File) => void; onRemove: () => void
}) {
    return (
        <div className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${file ? 'border-primary bg-brand-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${file ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                {file ? <CheckCircle className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                    {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </div>
                <div className="text-xs text-gray-400 truncate">
                    {file ? file.name : 'PDF, JPG, or PNG'}
                </div>
            </div>
            {file ? (
                <button
                    onClick={onRemove}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            ) : (
                <label className="text-xs text-primary font-medium cursor-pointer hover:underline flex-shrink-0">
                    Browse
                    <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f) }}
                    />
                </label>
            )}
        </div>
    )
}

// ─── Style tokens ─────────────────────────────────────────────────────────────

const inputCls = 'w-full h-12 px-4 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition'
const primaryBtn = 'w-full h-12 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'
const ghostBtn = 'h-12 px-5 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2'
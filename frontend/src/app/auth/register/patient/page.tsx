'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Shield, ChevronLeft, ChevronRight,
    Upload, CheckCircle, Loader2, X, Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { authApi, patientApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { ApiError } from '@/lib/types'
import { QRCodeCanvas as QRCode } from 'qrcode.react'

// ─── Schema ───────────────────────────────────────────────────────────────────

const accountSchema = z.object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    nationalId: z.string().min(6, 'Enter a valid national ID'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

type AccountForm = z.infer<typeof accountSchema>

// ─── Doc slots ────────────────────────────────────────────────────────────────

const DOC_SLOTS = [
    { key: 'PAN_CARD', label: 'PAN Card', required: true },
    { key: 'AADHAAR', label: 'Aadhaar Card', required: true },
    { key: 'POLICY_DOCUMENT', label: 'Insurance Policy', required: true },
] as const

type DocKey = (typeof DOC_SLOTS)[number]['key']

const STEPS = ['Account', 'Documents', 'Review'] as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatientRegisterPage() {
    const router = useRouter()
    const setAuth = useAuthStore((s) => s.setAuth)

    const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
    const [accountData, setAccountData] = useState<AccountForm | null>(null)
    const [files, setFiles] = useState<Partial<Record<DocKey, File>>>({})
    const [submitting, setSubmitting] = useState(false)
    const [qrToken, setQrToken] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AccountForm>({ resolver: zodResolver(accountSchema) })

    // Step 0 → just save locally, no API call
    const onAccountSubmit = (data: AccountForm) => {
        setAccountData(data)
        setStep(1)
    }

    const handleFilePick = useCallback(
        (key: DocKey, file: File) => setFiles((p) => ({ ...p, [key]: file })),
        []
    )
    const handleFileRemove = useCallback(
        (key: DocKey) =>
            setFiles((p) => { const n = { ...p }; delete n[key]; return n }),
        []
    )

    const allRequiredPicked = DOC_SLOTS.filter((s) => s.required).every(
        (s) => files[s.key]
    )

    // Step 2 → register → auto-login → upload docs → fetch QR
    const handleFinish = async () => {
        if (!accountData) return
        setSubmitting(true)
        try {
            // 1. Register account
            await authApi.registerPatient({
                email: accountData.email,
                password: accountData.password,
                fullName: accountData.fullName,
                nationalId: accountData.nationalId,
            })

            // 2. Auto login to get JWT so document uploads are authenticated
            const loginRes = await authApi.login({
                email: accountData.email,
                password: accountData.password,
            })
            setAuth(
                loginRes.accessToken,
                loginRes.role,
                loginRes.userId.toString()
            )

            // 3. Upload documents (now authenticated)
            for (const slot of DOC_SLOTS) {
                const file = files[slot.key]
                if (file) await patientApi.uploadDocument(slot.key, file)
            }

            // 4. Fetch QR token
            const { qrCodeToken } = await patientApi.getQRToken()
            setQrToken(qrCodeToken)
            setStep(3)
        } catch (err) {
            const apiErr = err as ApiError
            toast.error(apiErr.message ?? 'Something went wrong. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">HealClaim</span>
            </div>

            {/* Stepper */}
            {step < 3 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        {STEPS.map((label, i) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${i < step
                                        ? 'bg-primary text-white'
                                        : i === step
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                                </div>
                                <span className={`text-xs font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {label}
                                </span>
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

            {/* ── Step 0: Account ── */}
            {step === 0 && (
                <>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
                    <p className="text-sm text-gray-500 mb-6">Patient registration</p>
                    <form onSubmit={handleSubmit(onAccountSubmit)} className="space-y-4">
                        <Field label="Full name" error={errors.fullName?.message}>
                            <input placeholder="Pranjal Sharma" {...register('fullName')} className={inputCls} />
                        </Field>
                        <Field label="Email address" error={errors.email?.message}>
                            <input type="email" placeholder="you@example.com" {...register('email')} className={inputCls} />
                        </Field>
                        <Field label="National ID (Aadhaar / PAN)" error={errors.nationalId?.message}>
                            <input placeholder="XXXX XXXX XXXX" {...register('nationalId')} className={inputCls} />
                        </Field>
                        <Field label="Password" error={errors.password?.message}>
                            <input type="password" placeholder="Min 8 characters" {...register('password')} className={inputCls} />
                        </Field>
                        <Field label="Confirm password" error={errors.confirmPassword?.message}>
                            <input type="password" placeholder="••••••••" {...register('confirmPassword')} className={inputCls} />
                        </Field>
                        <button type="submit" className={primaryBtn}>
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </form>
                </>
            )}

            {/* ── Step 1: Documents ── */}
            {step === 1 && (
                <>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Upload your documents</h1>
                    <p className="text-sm text-gray-500 mb-6">
                        These will be securely stored and reused across all your claims.
                    </p>
                    <div className="space-y-3 mb-6">
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
                        <button onClick={() => setStep(0)} className={ghostBtn}>
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            disabled={!allRequiredPicked}
                            className={`${primaryBtn} flex-1`}
                        >
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}

            {/* ── Step 2: Review ── */}
            {step === 2 && accountData && (
                <>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Review & confirm</h1>
                    <p className="text-sm text-gray-500 mb-6">
                        Everything looks good? We&apos;ll register your account and upload your documents.
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
                        <ReviewRow label="Full name" value={accountData.fullName} />
                        <ReviewRow label="Email" value={accountData.email} />
                        <ReviewRow label="National ID" value={accountData.nationalId} />
                        <div className="border-t border-gray-200 pt-3 space-y-1.5">
                            {DOC_SLOTS.map((slot) => (
                                <div key={slot.key} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                    <span className="text-gray-600">{slot.label}</span>
                                    <span className="text-gray-400 text-xs truncate ml-auto">
                                        {files[slot.key]?.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className={ghostBtn}>
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                            onClick={handleFinish}
                            disabled={submitting}
                            className={`${primaryBtn} flex-1`}
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {submitting ? 'Creating account...' : 'Complete registration'}
                        </button>
                    </div>
                </>
            )}

            {/* ── Step 3: Success + QR ── */}
            {step === 3 && qrToken && (
                <div className="text-center">
                    <div className="w-14 h-14 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-7 h-7 text-success" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-1">You&apos;re all set!</h1>
                    <p className="text-sm text-gray-500 mb-6">
                        Save your QR code — show it at any hospital to instantly pull your records.
                    </p>
                    <div className="bg-gray-50 rounded-xl p-6 flex justify-center mb-4">
                        <QRCode value={qrToken} size={160} />
                    </div>
                    <p className="text-xs text-gray-400 mb-6">
                        You are now logged in. Head to your dashboard to link a policy.
                    </p>
                    <div className="flex flex-col gap-3">
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
                            className={primaryBtn}
                        >
                            <Download className="w-4 h-4" /> Download QR code
                        </button>
                        <button
                            onClick={() => router.push('/patient/dashboard')}
                            className={ghostBtn}
                        >
                            Go to dashboard
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

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-900">{value}</span>
        </div>
    )
}

function DocUploadSlot({ label, required, file, onPick, onRemove }: {
    label: string
    required: boolean
    file?: File
    onPick: (f: File) => void
    onRemove: () => void
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
                    {file ? file.name : 'No file chosen'}
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
                <label className="text-xs text-primary font-medium cursor-pointer hover:underline">
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
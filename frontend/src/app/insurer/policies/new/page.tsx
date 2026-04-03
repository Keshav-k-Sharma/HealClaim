'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    ChevronLeft, CheckCircle, Upload,
    Loader2, X, FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { insurerApi } from '@/lib/api'
import type { ApiError } from '@/lib/types'
import PageHeader from '@/components/common/PageHeader'

const schema = z.object({
    policyName: z.string().min(3, 'Enter a policy name'),
    coverageType: z.string().min(1, 'Select a coverage type'),
    maxCoverage: z.coerce.number().min(1000, 'Enter a valid coverage amount'),
    description: z.string().optional(),
})

type PolicyForm = z.infer<typeof schema>

const COVERAGE_TYPES = [
    'Hospitalization',
    'Critical Illness',
    'OPD',
    'Maternity',
    'Dental',
    'Vision',
    'Comprehensive',
    'Top-up',
] as const

const inputCls = 'w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white'

export default function NewPolicyPage() {
    const router = useRouter()
    const [done, setDone] = useState(false)
    const [policyDoc, setPolicyDoc] = useState<File | null>(null)
    const [createdId, setCreatedId] = useState<string | null>(null)
    const [uploadingDoc, setUploadingDoc] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<PolicyForm>({ resolver: zodResolver(schema) as never })

    const onSubmit = async (data: PolicyForm) => {
        try {
            const policy = await insurerApi.createPolicy({
                policyName: data.policyName,
                coverageType: data.coverageType,
                maxCoverage: data.maxCoverage,
                isActive: true,
            })

            if (policyDoc) {
                setUploadingDoc(true)
                await insurerApi.uploadPolicyDocument(policy.id, policyDoc)
                setUploadingDoc(false)
            }

            setCreatedId(policy.id)
            setDone(true)
        } catch (err) {
            const apiErr = err as ApiError
            toast.error(apiErr.message ?? 'Failed to create policy.')
            setUploadingDoc(false)
        }
    }

    if (done) {
        return (
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <div className="w-14 h-14 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-7 h-7 text-success" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Policy published!</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Patients can now link their accounts to this policy.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/insurer/policies')}
                            className="w-full h-11 bg-primary text-white text-sm font-medium rounded-xl hover:bg-brand-800 transition-colors"
                        >
                            View all policies
                        </button>
                        <button
                            onClick={() => router.push('/insurer/policies/new')}
                            className="w-full h-11 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Add another policy
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-xl">
            <PageHeader
                title="Add policy"
                subtitle="Publish a new plan to your catalog."
                action={
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                }
            />

            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-5">
                    <Field label="Policy name" error={errors.policyName?.message}>
                        <input
                            placeholder="e.g. Star Health Comprehensive Plus"
                            {...register('policyName')}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Coverage type" error={errors.coverageType?.message}>
                        <select {...register('coverageType')} className={inputCls}>
                            <option value="">Select coverage type...</option>
                            {COVERAGE_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Maximum coverage amount (₹)" error={errors.maxCoverage?.message}>
                        <input
                            type="number"
                            placeholder="500000"
                            {...register('maxCoverage')}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Description (optional)" error={errors.description?.message}>
                        <textarea
                            rows={3}
                            placeholder="Brief description of what this policy covers..."
                            {...register('description')}
                            className={`${inputCls} h-auto py-3 resize-none`}
                        />
                    </Field>

                    {/* Policy document upload */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Policy document (PDF)
                        </label>
                        {policyDoc ? (
                            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-primary bg-brand-50">
                                <div className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{policyDoc.name}</div>
                                    <div className="text-xs text-gray-400">
                                        {(policyDoc.size / 1024).toFixed(0)} KB
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPolicyDoc(null)}
                                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-brand-50 transition-colors cursor-pointer group">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                <div className="text-sm text-gray-500 group-hover:text-gray-700 text-center">
                                    <span className="font-medium text-primary">Click to upload</span> or drag and drop
                                </div>
                                <div className="text-xs text-gray-400">PDF up to 10MB</div>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0]
                                        if (f) setPolicyDoc(f)
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || uploadingDoc}
                        className="w-full h-12 bg-primary text-white text-sm font-medium rounded-xl hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {(isSubmitting || uploadingDoc) && <Loader2 className="w-4 h-4 animate-spin" />}
                        {uploadingDoc ? 'Uploading document...' : isSubmitting ? 'Publishing...' : 'Publish policy'}
                    </button>
                </form>
            </div>
        </div>
    )
}

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
'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Loader2, CheckCircle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api'
import type { ApiError } from '@/lib/types'

const schema = z.object({
    hospitalName: z.string().min(2, 'Enter the hospital name'),
    registrationNo: z.string().min(3, 'Enter a valid registration number'),
    address: z.string().min(5, 'Enter the hospital address'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

type HospitalForm = z.infer<typeof schema>

export default function HospitalRegisterPage() {
    const router = useRouter()
    const [done, setDone] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<HospitalForm>({ resolver: zodResolver(schema) })

    const onSubmit = async (data: HospitalForm) => {
        try {
            await authApi.registerHospital({
                email: data.email,
                password: data.password,
                hospitalName: data.hospitalName,
                registrationNo: data.registrationNo,
                address: data.address,
            })
            setDone(true)
        } catch (err) {
            const apiErr = err as ApiError
            toast.error(apiErr.message ?? 'Registration failed.')
        }
    }

    if (done) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-14 h-14 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-success" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Registration submitted!</h1>
                <p className="text-sm text-gray-500 mb-6">
                    Check your email to verify your account. Once verified, you can start filing claims.
                </p>
                <button
                    onClick={() => router.push('/login')}
                    className="w-full h-12 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
                >
                    Go to sign in
                </button>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">HealClaim</span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-1">Hospital registration</h1>
            <p className="text-sm text-gray-500 mb-6">
                Create your hospital account to start filing digital claims.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field label="Hospital name" error={errors.hospitalName?.message}>
                    <input placeholder="City General Hospital" {...register('hospitalName')} className={inputCls} />
                </Field>
                <Field label="Registration number" error={errors.registrationNo?.message}>
                    <input placeholder="MH/HOSP/2024/XXXXX" {...register('registrationNo')} className={inputCls} />
                </Field>
                <Field label="Address" error={errors.address?.message}>
                    <textarea
                        placeholder="Full hospital address"
                        rows={2}
                        {...register('address')}
                        className={`${inputCls} h-auto py-3 resize-none`}
                    />
                </Field>
                <Field label="Email address" error={errors.email?.message}>
                    <input type="email" placeholder="admin@hospital.com" {...register('email')} className={inputCls} />
                </Field>
                <Field label="Password" error={errors.password?.message}>
                    <input type="password" placeholder="Min 8 characters" {...register('password')} className={inputCls} />
                </Field>
                <Field label="Confirm password" error={errors.confirmPassword?.message}>
                    <input type="password" placeholder="••••••••" {...register('confirmPassword')} className={inputCls} />
                </Field>
                <button type="submit" disabled={isSubmitting} className={primaryBtn}>
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create account
                    <ChevronRight className="w-4 h-4" />
                </button>
            </form>
        </div>
    )
}

// ─── Sub-components (same as patient page) ────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}

const inputCls = 'w-full h-12 px-4 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition'
const primaryBtn = 'w-full h-12 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'
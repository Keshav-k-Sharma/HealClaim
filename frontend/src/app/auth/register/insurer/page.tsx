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
    companyName: z.string().min(2, 'Enter the company name'),
    registrationNo: z.string().min(3, 'Enter a valid registration number'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Min 8 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

type InsurerForm = z.infer<typeof schema>

export default function InsurerRegisterPage() {
    const router = useRouter()
    const [done, setDone] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<InsurerForm>({ resolver: zodResolver(schema) })

    const onSubmit = async (data: InsurerForm) => {
        try {
            await authApi.registerInsurer({
                email: data.email,
                password: data.password,
                companyName: data.companyName,
                registrationNo: data.registrationNo,
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
                <h1 className="text-xl font-bold text-gray-900 mb-2">Account created!</h1>
                <p className="text-sm text-gray-500 mb-6">
                    Verify your email, then sign in to publish your first policy.
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

            <h1 className="text-xl font-bold text-gray-900 mb-1">Insurer registration</h1>
            <p className="text-sm text-gray-500 mb-6">
                Set up your insurer account to start receiving and reviewing claims.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Field label="Company name" error={errors.companyName?.message}>
                    <input placeholder="Star Health Insurance" {...register('companyName')} className={inputCls} />
                </Field>
                <Field label="IRDAI registration number" error={errors.registrationNo?.message}>
                    <input placeholder="IRDAI/HLT/XXXXX/2024" {...register('registrationNo')} className={inputCls} />
                </Field>
                <Field label="Email address" error={errors.email?.message}>
                    <input type="email" placeholder="claims@insurer.com" {...register('email')} className={inputCls} />
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
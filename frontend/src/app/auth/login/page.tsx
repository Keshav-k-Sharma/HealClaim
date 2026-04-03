'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { ApiError } from '@/lib/types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

// ─── Role redirect map ────────────────────────────────────────────────────────

const roleRedirect = {
    PATIENT: '/patient/dashboard',
    HOSPITAL: '/hospital/dashboard',
    INSURER: '/insurer/dashboard',
} as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
    const router = useRouter()
    const setAuth = useAuthStore((s) => s.setAuth)
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

    const onSubmit = async (data: LoginForm) => {
        try {
            const res = await authApi.login(data)
            setAuth(res.accessToken, res.role, res.userId)
            toast.success('Welcome back!')
            router.push(roleRedirect[res.role])
        } catch (err) {
            const apiErr = err as ApiError
            toast.error(apiErr.message ?? 'Login failed. Please try again.')
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">HealClaim</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500 mb-8">
                Sign in to continue to your dashboard.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700" htmlFor="email">
                        Email address
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...register('email')}
                        className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    />
                    {errors.email && (
                        <p className="text-xs text-red-500">{errors.email.message}</p>
                    )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700" htmlFor="password">
                            Password
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-primary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            {...register('password')}
                            className="w-full h-12 px-4 pr-12 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword
                                ? <EyeOff className="w-4 h-4" />
                                : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs text-red-500">{errors.password.message}</p>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <p className="text-sm text-gray-500 text-center mt-6">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary font-medium hover:underline">
                    Create one
                </Link>
            </p>
        </div>
    )
}
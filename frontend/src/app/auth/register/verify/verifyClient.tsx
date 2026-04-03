'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authApi } from '@/lib/api'

type State = 'loading' | 'success' | 'error'

export default function VerifyContent() {
    const params = useSearchParams()
    const router = useRouter()
    const [state, setState] = useState<State>('loading')

    useEffect(() => {
        const token = params.get('token')
        if (!token) {
            setTimeout(() => setState('error'))
            return
        }

        authApi.verify(token)
            .then(() => setState('success'))
            .catch(() => setState('error'))
    }, [params])

    return (
        <main className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto w-full max-w-md px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900">HealClaim</span>
                    </div>

                    {state === 'loading' && (
                        <>
                            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
                            <p className="text-sm text-gray-500">This will just take a moment.</p>
                        </>
                    )}

                    {state === 'success' && (
                        <>
                            <div className="w-14 h-14 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-7 h-7 text-success" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h1>
                            <p className="text-sm text-gray-500 mb-6">
                                Your account is now active. You can sign in.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full h-12 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
                            >
                                Go to sign in
                            </button>
                        </>
                    )}

                    {state === 'error' && (
                        <>
                            <div className="w-14 h-14 bg-danger-light rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-7 h-7 text-danger" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h1>
                            <p className="text-sm text-gray-500 mb-6">
                                This link may have expired or already been used.
                            </p>
                            <button
                                onClick={() => router.push('/login')}
                                className="w-full h-12 bg-primary text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
                            >
                                Back to sign in
                            </button>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}
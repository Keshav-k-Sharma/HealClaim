import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import VerifyContent from './verifyClient'

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gray-50 py-12">
                <div className="mx-auto w-full max-w-md px-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                    </div>
                </div>
            </main>
        }>
            <VerifyContent />
        </Suspense>
    )
}
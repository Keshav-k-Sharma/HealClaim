'use client'

import { useEffect, useState } from 'react'
import { Download, Shield, Loader2 } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { patientApi } from '@/lib/api'
import type { PatientProfile } from '@/lib/types'
import PageHeader from '@/components/common/PageHeader'

export default function PatientQRPage() {
    const [profile, setProfile] = useState<PatientProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [enlarged, setEnlarged] = useState(false)

    useEffect(() => {
        patientApi.getProfile()
            .then(setProfile)
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const handleDownload = () => {
        const canvas = document.querySelector('canvas')
        if (!canvas) return
        const link = document.createElement('a')
        link.download = 'healclaim-qr.png'
        link.href = canvas.toDataURL()
        link.click()
    }

    return (
        <>
            <PageHeader
                title="My QR Code"
                subtitle="Show this at hospital reception to pull your records instantly."
            />

            <div className="max-w-sm mx-auto">
                {/* QR card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-4">
                    {loading ? (
                        <div className="flex flex-col items-center py-8">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                            <p className="text-sm text-gray-400">Loading your QR code...</p>
                        </div>
                    ) : profile?.qrCodeToken ? (
                        <>
                            <div className="inline-block p-4 bg-gray-50 rounded-xl mb-4">
                                <QRCodeCanvas
                                    value={profile.qrCodeToken}
                                    size={enlarged ? 240 : 180}
                                    level="H"
                                    includeMargin
                                />
                            </div>
                            <div className="font-semibold text-gray-900 mb-0.5">{profile.fullName}</div>
                            <div className="text-xs text-gray-400 font-mono mb-6">
                                {profile.qrCodeToken.slice(0, 16)}...
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleDownload}
                                    className="w-full h-11 bg-primary text-white text-sm font-medium rounded-xl hover:bg-brand-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> Download QR code
                                </button>
                                <button
                                    onClick={() => setEnlarged((e) => !e)}
                                    className="w-full h-11 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    {enlarged ? 'Shrink' : 'Enlarge for scanning'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 py-8">QR code unavailable.</p>
                    )}
                </div>

                {/* Info card */}
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-gray-900">How this works</span>
                    </div>
                    <ul className="space-y-2">
                        {[
                            'Hospital staff scan this QR at reception',
                            'Your identity and policy docs load instantly',
                            'No physical documents needed at the hospital',
                            'Each QR is unique and tied to your account',
                        ].map((tip) => (
                            <li key={tip} className="flex items-start gap-2 text-xs text-gray-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Full screen overlay for enlarge mode */}
            {enlarged && (
                <div
                    className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8"
                    onClick={() => setEnlarged(false)}
                >
                    <p className="text-sm text-gray-400 mb-6">Tap anywhere to close</p>
                    {profile?.qrCodeToken && (
                        <div className="p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                            <QRCodeCanvas value={profile.qrCodeToken} size={280} level="H" includeMargin />
                        </div>
                    )}
                    {profile && (
                        <p className="text-base font-semibold text-gray-900 mt-6">{profile.fullName}</p>
                    )}
                </div>
            )}
        </>
    )
}
'use client'

import { useState } from 'react'
import { Download, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { documentApi } from '@/lib/api'

interface DocViewerButtonProps {
    s3Key: string
    fileName: string
    variant?: 'icon' | 'full'
}

export default function DocViewerButton({
    s3Key,
    fileName,
    variant = 'icon',
}: DocViewerButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleView = async () => {
        setLoading(true)
        try {
            const { url } = await documentApi.getViewUrl(s3Key)
            window.open(url, '_blank', 'noopener,noreferrer')
        } catch {
            toast.error('Failed to open document. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (variant === 'full') {
        return (
            <button
                onClick={handleView}
                disabled={loading}
                className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
                {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Eye className="w-4 h-4" />}
                {loading ? 'Opening...' : 'View document'}
            </button>
        )
    }

    return (
        <button
            onClick={handleView}
            disabled={loading}
            title={`View ${fileName}`}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors disabled:opacity-60"
        >
            {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Eye className="w-3.5 h-3.5" />}
        </button>
    )
}
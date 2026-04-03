import { formatDateTime } from '@/lib/utils'
import { claimStatusConfig } from '@/lib/utils'
import type { ClaimStatusHistory } from '@/lib/types'
import { CheckCircle, Circle } from 'lucide-react'

export default function ClaimTimeline({ history }: { history: ClaimStatusHistory[] }) {
    if (history.length === 0) {
        return (
            <div className="text-sm text-gray-400 text-center py-6">
                No status history yet.
            </div>
        )
    }

    return (
        <div className="space-y-0">
            {history.map((entry, i) => {
                const cfg = claimStatusConfig[entry.toStatus]
                const isLast = i === history.length - 1
                return (
                    <div key={entry.id} className="flex gap-3">
                        {/* Timeline spine */}
                        <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isLast ? 'bg-primary' : 'bg-gray-100'
                                }`}>
                                {isLast
                                    ? <CheckCircle className="w-4 h-4 text-white" />
                                    : <Circle className="w-3.5 h-3.5 text-gray-300" />}
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
                        </div>

                        {/* Content */}
                        <div className={`pb-5 flex-1 min-w-0 ${isLast ? '' : ''}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
                                    {cfg.label}
                                </span>
                                {entry.note && (
                                    <span className="text-xs text-gray-500 italic">&ldquo;{entry.note}&rdquo;</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                {entry.changedByName} · {formatDateTime(entry.changedAt)}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
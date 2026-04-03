import { claimStatusConfig } from '@/lib/utils'
import type { ClaimStatus } from '@/lib/types'

export default function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
    const cfg = claimStatusConfig[status]
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
            {cfg.label}
        </span>
    )
}
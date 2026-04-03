import { Cpu, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { AIPredictions } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

function CircleProgress({ value }: { value: number }) {
    const r = 20
    const circ = 2 * Math.PI * r
    const offset = circ - value * circ
    const color = value >= 0.7 ? '#3B6D11' : value >= 0.4 ? '#BA7517' : '#A32D2D'
    return (
        <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
            <circle
                cx="28" cy="28" r={r}
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
            />
            <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="600" fill={color}>
                {Math.round(value * 100)}%
            </text>
        </svg>
    )
}

function FraudBadge({ score }: { score: number }) {
    if (score < 0.3) return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-success-light text-success">Low risk</span>
    if (score < 0.65) return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-warning-light text-warning">Medium risk</span>
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-danger-light text-danger">High risk</span>
}

function BenchmarkBar({ claimed, benchmark }: { claimed: number; benchmark: number }) {
    const max = Math.max(claimed, benchmark) * 1.2
    const claimedPct = (claimed / max) * 100
    const benchmarkPct = (benchmark / max) * 100
    const delta = ((claimed - benchmark) / benchmark) * 100
    const over = delta > 0

    return (
        <div className="space-y-2">
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                    <span>This claim</span>
                    <span className="font-medium text-gray-900">{formatCurrency(claimed)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${claimedPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Avg benchmark</span>
                    <span className="font-medium text-gray-900">{formatCurrency(benchmark)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-300 rounded-full" style={{ width: `${benchmarkPct}%` }} />
                </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${over ? 'text-danger' : 'text-success'}`}>
                {over
                    ? <TrendingUp className="w-3.5 h-3.5" />
                    : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(delta).toFixed(1)}% {over ? 'above' : 'below'} benchmark
            </div>
        </div>
    )
}

export default function AIPredictionsCard({ data }: { data: AIPredictions }) {
    return (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-amber-700" />
                </div>
                <span className="text-sm font-semibold text-amber-900">AI Insights</span>
                <span className="ml-auto text-xs text-amber-600">Predictive only</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Approval likelihood */}
                <div className="bg-white rounded-xl p-4 flex flex-col items-center text-center">
                    <CircleProgress value={data.approvalLikelihood} />
                    <div className="text-xs font-semibold text-gray-700 mt-2">Approval likelihood</div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Info className="w-3 h-3" /> AI estimate
                    </div>
                </div>

                {/* Estimated payout */}
                <div className="bg-white rounded-xl p-4 flex flex-col items-center text-center">
                    <div className="text-xl font-bold text-gray-900 mt-1">
                        {formatCurrency(data.estimatedPayout)}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        {formatCurrency(data.estimatedPayoutMin)} – {formatCurrency(data.estimatedPayoutMax)}
                    </div>
                    <div className="text-xs font-semibold text-gray-700 mt-2">Estimated payout</div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Info className="w-3 h-3" /> ± range
                    </div>
                </div>

                {/* Fraud score */}
                <div className="bg-white rounded-xl p-4 flex flex-col items-center text-center">
                    <FraudBadge score={data.fraudScore} />
                    <div className="text-xs font-semibold text-gray-700 mt-3">Fraud score</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                        {data.fraudScore < 0.3
                            ? 'No anomalies detected'
                            : data.fraudScore < 0.65
                                ? 'Minor anomalies found'
                                : 'Review carefully'}
                    </div>
                </div>

                {/* Cost benchmark */}
                <div className="bg-white rounded-xl p-4">
                    <div className="text-xs font-semibold text-gray-700 mb-3">vs. Benchmark</div>
                    <BenchmarkBar
                        claimed={data.estimatedPayout}
                        benchmark={data.costBenchmark}
                    />
                </div>
            </div>
        </div>
    )
}
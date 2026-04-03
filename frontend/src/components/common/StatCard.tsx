interface StatCardProps {
    label: string
    value: string | number
    icon: React.ReactNode
    color?: 'default' | 'green' | 'blue' | 'amber' | 'red'
    sub?: string
}

const colorMap = {
    default: 'bg-gray-50 text-gray-500',
    green: 'bg-success-light text-success',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-warning-light text-warning',
    red: 'bg-danger-light text-danger',
}

export default function StatCard({ label, value, icon, color = 'default', sub }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
        </div>
    )
}
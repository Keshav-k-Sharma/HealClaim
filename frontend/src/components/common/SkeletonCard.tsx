export default function SkeletonCard({ rows = 3 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-3 bg-gray-100 rounded mb-2" style={{ width: `${70 + i * 10}%` }} />
            ))}
        </div>
    )
}
import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SummaryCardProps {
  label: string
  value: string
  icon: ReactNode
  trend?: string
  trendUp?: boolean
}

const SummaryCard = ({ label, value, icon, trend, trendUp }: SummaryCardProps) => {
  return (
    <div className="bg-surface border border-border rounded-[10px] p-5 flex items-center gap-4 hover:border-border-accent transition-colors">
      <div className="p-3 rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-2xl font-semibold text-text-primary mt-1 font-[family-name:var(--font-display)] truncate">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendUp ? 'text-success' : 'text-danger'}`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}

export default SummaryCard

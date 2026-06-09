import type { ReactNode } from 'react'

interface SummaryCardProps {
  label: string
  value: string
  icon: ReactNode
}

const SummaryCard = ({ label, value, icon }: SummaryCardProps) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
      <div className="p-3 rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-2xl font-semibold text-text-primary mt-1">{value}</p>
      </div>
    </div>
  )
}

export default SummaryCard

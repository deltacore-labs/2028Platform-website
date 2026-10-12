import type { EmergencyStatus } from '../types'

const config: Record<EmergencyStatus, { label: string; className: string }> = {
  open: { label: 'Offen', className: 'bg-red-50 text-[#dc2626]' },
  in_progress: { label: 'In Bearbeitung', className: 'bg-[#fdf6e8] text-[#8a5a00]' },
  resolved: { label: 'Erledigt', className: 'bg-[#f0faf4] text-[#16a34a]' },
}

export function StatusBadge({ status }: { status: EmergencyStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`px-2.5 py-0.5 rounded-pill text-[11px] font-semibold tracking-[0.8px] uppercase ${className}`}>
      {label}
    </span>
  )
}

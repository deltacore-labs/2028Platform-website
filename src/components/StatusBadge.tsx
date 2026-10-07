import type { EmergencyStatus } from '../types'

const config: Record<EmergencyStatus, { label: string; className: string }> = {
  open: { label: 'Offen', className: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In Bearbeitung', className: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: 'Erledigt', className: 'bg-green-100 text-green-700' },
}

export function StatusBadge({ status }: { status: EmergencyStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

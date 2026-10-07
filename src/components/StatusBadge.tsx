import type { EmergencyStatus } from '../types'

const config: Record<EmergencyStatus, { label: string; className: string }> = {
  open: { label: 'Offen', className: 'bg-red-900 text-red-300' },
  in_progress: { label: 'In Bearbeitung', className: 'bg-yellow-900 text-yellow-300' },
  resolved: { label: 'Erledigt', className: 'bg-green-900 text-green-300' },
}

export function StatusBadge({ status }: { status: EmergencyStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

import { apiClient } from '../lib/api'
import type { AuditLogPage } from '../types'

export function fetchAuditLog(options: { cursor?: string; entityType?: string } = {}) {
  return apiClient.get<AuditLogPage>('/v1/audit-log', {
    params: {
      limit: 100,
      cursor: options.cursor,
      entity_type: options.entityType || undefined,
    },
  }).then(response => response.data)
}

import { apiClient } from '../lib/api'
import type { Announcement, AnnouncementPriority, UserRole } from '../types'

export const fetchAnnouncements = (includeArchived = false) => {
  const url = includeArchived
    ? '/v1/announcements?include_archived=true'
    : '/v1/announcements'
  return apiClient.get<Announcement[]>(url).then(r => r.data)
}

export const createAnnouncement = (payload: {
  text: string
  priority: AnnouncementPriority
  targetGroupIds: string[]
  targetRoles: UserRole[]
}) =>
  apiClient
    .post<Announcement>('/v1/announcements', {
      text: payload.text,
      priority: payload.priority,
      target_group_ids: payload.targetGroupIds,
      target_roles: payload.targetRoles,
    })
    .then(r => r.data)

export const deleteAnnouncement = (id: string) =>
  apiClient.delete(`/v1/announcements/${id}`).then(r => r.data)

export const archiveAnnouncement = (id: string) =>
  apiClient.post(`/v1/announcements/${id}/archive`).then(r => r.data)

export const unarchiveAnnouncement = (id: string) =>
  apiClient.post(`/v1/announcements/${id}/unarchive`).then(r => r.data)

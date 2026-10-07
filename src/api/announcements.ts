import { apiClient } from '../lib/api'
import type { Announcement, AnnouncementPriority, UserRole } from '../types'

export const fetchAnnouncements = () =>
  apiClient.get<Announcement[]>('/v1/announcements').then(r => r.data)

export const createAnnouncement = (payload: {
  text: string
  priority: AnnouncementPriority
  targetGroupIds: string[]
  targetRoles: UserRole[]
}) => apiClient.post<Announcement>('/v1/announcements', payload).then(r => r.data)

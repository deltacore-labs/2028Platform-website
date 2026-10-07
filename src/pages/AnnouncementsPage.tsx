import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAnnouncements, createAnnouncement } from '../api/announcements'
import { fetchGroups } from '../api/groups'
import { useAuth } from '../context/AuthContext'
import type { AnnouncementPriority } from '../types'

const priorityStyle: Record<AnnouncementPriority, string> = {
  info: 'border-l-4 border-green-600',
  important: 'border-l-4 border-amber-500',
  critical: 'border-l-4 border-red-500',
}

const priorityLabel: Record<AnnouncementPriority, string> = {
  info: 'Info',
  important: 'Wichtig',
  critical: 'Kritisch',
}

export function AnnouncementsPage() {
  const { appUser } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<AnnouncementPriority>('info')
  const [targetGroupIds, setTargetGroupIds] = useState<string[]>([])

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: fetchAnnouncements,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    enabled: appUser?.role === 'miniteam',
  })

  const mutation = useMutation({
    mutationFn: () =>
      createAnnouncement({ text, priority, targetGroupIds, targetRoles: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setText('')
      setPriority('info')
      setTargetGroupIds([])
      setShowForm(false)
    },
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Ankündigungen</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Abbrechen' : '+ Neue Ankündigung'}
        </button>
      </div>

      {showForm && (
        <div className="bg-stone-900 rounded-xl p-5 mb-6 border border-stone-800">
          <h3 className="text-white font-semibold mb-4">Neue Ankündigung</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-stone-300 mb-1">Text</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                className="w-full bg-stone-800 text-white rounded-lg px-4 py-2.5 border border-stone-700 focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-stone-300 mb-1">Priorität</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as AnnouncementPriority)}
                className="bg-stone-800 text-white rounded-lg px-4 py-2.5 border border-stone-700 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="info">Info</option>
                <option value="important">Wichtig</option>
                <option value="critical">Kritisch</option>
              </select>
            </div>

            {appUser?.role === 'miniteam' && groups.length > 0 && (
              <div>
                <label className="block text-sm text-stone-300 mb-1">
                  Zielgruppen (leer = alle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {groups.map(g => (
                    <label key={g.id} className="flex items-center gap-1.5 text-sm text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetGroupIds.includes(g.id)}
                        onChange={e =>
                          setTargetGroupIds(prev =>
                            e.target.checked ? [...prev, g.id] : prev.filter(id => id !== g.id)
                          )
                        }
                        className="accent-green-600"
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => mutation.mutate()}
              disabled={!text.trim() || mutation.isPending}
              className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg transition-colors"
            >
              {mutation.isPending ? 'Senden…' : 'Ankündigung senden'}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-stone-400">Lade…</p>}

      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className={`bg-stone-900 rounded-xl p-4 ${priorityStyle[a.priority]}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                {priorityLabel[a.priority]}
              </span>
              <span className="text-stone-600 text-xs">
                {new Date(a.createdAt).toLocaleString('de-DE')}
              </span>
            </div>
            <p className="text-white">{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

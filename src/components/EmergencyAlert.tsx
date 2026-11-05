import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchEmergencyReports } from '../api/emergency'
import { useAuth } from '../context/AuthContext'

const POLL_INTERVAL_MS = 15_000

type BrowserWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

export function EmergencyAlert() {
  const { appUser } = useAuth()
  const canReceiveAlerts = appUser?.role === 'malteser' || appUser?.role === 'miniteam' || appUser?.role === 'admin'
  const knownReportIds = useRef(new Set<string>())
  const hasInitialSnapshot = useRef(false)
  const audioContext = useRef<AudioContext | null>(null)
  const [alertSequence, setAlertSequence] = useState(0)

  const { data: reports } = useQuery({
    queryKey: ['emergency'],
    queryFn: fetchEmergencyReports,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
    enabled: canReceiveAlerts,
  })

  const getAudioContext = useCallback(() => {
    if (audioContext.current) return audioContext.current

    const AudioContextClass = window.AudioContext || (window as BrowserWindow).webkitAudioContext
    if (!AudioContextClass) return null

    audioContext.current = new AudioContextClass()
    return audioContext.current
  }, [])

  const playAlarm = useCallback(() => {
    const context = getAudioContext()
    if (!context) return

    void context.resume().then(() => {
      const startAt = context.currentTime

      for (let pulse = 0; pulse < 3; pulse += 1) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const pulseStart = startAt + pulse * 0.48
        const pulseEnd = pulseStart + 0.22

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(pulse % 2 === 0 ? 880 : 740, pulseStart)
        gain.gain.setValueAtTime(0.0001, pulseStart)
        gain.gain.exponentialRampToValueAtTime(0.16, pulseStart + 0.025)
        gain.gain.exponentialRampToValueAtTime(0.0001, pulseEnd)

        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(pulseStart)
        oscillator.stop(pulseEnd)
      }
    }).catch(() => {
      // Browsers may block sound until the page has received a user gesture.
    })
  }, [getAudioContext])

  useEffect(() => {
    if (!canReceiveAlerts) return

    const unlockAudio = () => {
      const context = getAudioContext()
      if (context?.state === 'suspended') void context.resume()
      document.removeEventListener('pointerdown', unlockAudio)
      document.removeEventListener('keydown', unlockAudio)
    }

    document.addEventListener('pointerdown', unlockAudio, { once: true })
    document.addEventListener('keydown', unlockAudio, { once: true })

    return () => {
      document.removeEventListener('pointerdown', unlockAudio)
      document.removeEventListener('keydown', unlockAudio)
    }
  }, [canReceiveAlerts, getAudioContext])

  useEffect(() => {
    if (!reports || !canReceiveAlerts) return

    if (!hasInitialSnapshot.current) {
      reports.forEach(report => knownReportIds.current.add(report.id))
      hasInitialSnapshot.current = true
      return
    }

    const hasNewOpenReport = reports.some(
      report => report.status === 'open' && !knownReportIds.current.has(report.id),
    )

    reports.forEach(report => knownReportIds.current.add(report.id))

    if (hasNewOpenReport) {
      setAlertSequence(sequence => sequence + 1)
      playAlarm()
    }
  }, [canReceiveAlerts, playAlarm, reports])

  if (alertSequence === 0) return null

  return <div key={alertSequence} className="emergency-flash" aria-hidden="true" />
}

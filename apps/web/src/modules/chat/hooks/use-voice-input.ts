'use client'

import { useEffect, useRef, useState } from 'react'

const voiceMeterBarCount = 16

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative
  isFinal: boolean
  length: number
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResult>
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function trimBrowserTranscript(text: string) {
  return text.trim().replace(/\s+/g, ' ')
}

function createIdleVoiceLevels() {
  return Array.from({ length: voiceMeterBarCount }, () => 0.18)
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null
  }

  const speechRecognition = (
    window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
  ).SpeechRecognition

  const webkitSpeechRecognition = (
    window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
  ).webkitSpeechRecognition

  return speechRecognition ?? webkitSpeechRecognition ?? null
}

function detectSpeechLang(text: string) {
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ru'
  }

  if (/[äöüßÄÖÜ]/.test(text)) {
    return 'de'
  }

  return 'en'
}

interface UseVoiceInputOptions {
  disabled: boolean
  input: string
  onTranscript: (transcript: string) => void
  onClearError: () => void
}

export function useVoiceInput({
  disabled,
  input,
  onTranscript,
  onClearError,
}: UseVoiceInputOptions) {
  const [isRecording, setIsRecording] = useState(false)
  const [notice, setNotice] = useState('')
  const [voiceLevels, setVoiceLevels] = useState<number[]>(createIdleVoiceLevels)

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const speechRecognitionCtorRef = useRef<SpeechRecognitionConstructor | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  function stopVoiceMeter() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    analyserRef.current?.disconnect()
    analyserRef.current = null

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => null)
      audioContextRef.current = null
    }

    setVoiceLevels(createIdleVoiceLevels())
  }

  function stopActiveStream() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
  }

  function startVoiceMeter(stream: MediaStream) {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return
    }

    stopVoiceMeter()

    const audioContext = new window.AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.82
    source.connect(analyser)

    const frequencyData = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(frequencyData)

      const nextLevels = Array.from({ length: voiceMeterBarCount }, (_, index) => {
        const bucketSize = Math.max(1, Math.floor(frequencyData.length / voiceMeterBarCount))
        const start = index * bucketSize
        const end = Math.min(frequencyData.length, start + bucketSize)
        const slice = frequencyData.slice(start, end)
        const average =
          slice.length > 0 ? slice.reduce((sum, value) => sum + value, 0) / slice.length : 0

        return Math.max(0.14, Math.min(1, average / 160))
      })

      setVoiceLevels(nextLevels)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    audioContextRef.current = audioContext
    analyserRef.current = analyser
    animationFrameRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor()

    if (!SpeechRecognition) {
      setNotice('Voice input is not supported in this browser.')
      return
    }

    speechRecognitionCtorRef.current = SpeechRecognition

    return () => {
      stopActiveStream()
      speechRecognitionRef.current?.stop()
      stopVoiceMeter()
    }
  }, [])

  async function toggleRecording() {
    if (disabled) return

    if (isRecording) {
      speechRecognitionRef.current?.stop()
      setIsRecording(false)
      stopVoiceMeter()
      return
    }

    const SpeechRecognition = speechRecognitionCtorRef.current
    if (!SpeechRecognition) {
      setNotice('Voice input is unavailable in this browser. You can still type.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      startVoiceMeter(stream)

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = detectSpeechLang(input || navigator.language || 'en')
      recognition.onresult = (event) => {
        const transcript = trimBrowserTranscript(
          Array.from(event.results)
            .map((result) => result[0]?.transcript ?? '')
            .join(' '),
        )

        if (transcript) {
          onTranscript(transcript)
        }

        onClearError()
      }
      recognition.onerror = (event) => {
        const errorName =
          'error' in event ? String((event as Event & { error?: string }).error) : ''

        if (errorName === 'network' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
          setNotice('Voice input is unavailable offline. Please type.')
        } else {
          setNotice('Voice input is unavailable right now. You can still type.')
        }

        stopActiveStream()
        stopVoiceMeter()
        setIsRecording(false)
      }
      recognition.onend = () => {
        stopActiveStream()
        stopVoiceMeter()
        setIsRecording(false)
      }
      speechRecognitionRef.current = recognition

      onClearError()
      setNotice('')
      setIsRecording(true)
      recognition.start()
    } catch (caughtError) {
      stopActiveStream()
      stopVoiceMeter()
      const message =
        caughtError instanceof Error ? caughtError.message : 'Voice input could not start.'
      setNotice(message)
      setIsRecording(false)
    }
  }

  return {
    isRecording,
    notice,
    toggleRecording,
    voiceLevels,
  }
}

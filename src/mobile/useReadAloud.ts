import { useCallback, useEffect, useRef, useState } from 'react'
import { readingVoiceChanged, savedReadingVoice, selectedEnglishVoice } from './readingVoices'

export function spokenText(element: HTMLElement | null) {
  if (!element) return ''
  const copy = element.cloneNode(true) as HTMLElement
  copy.querySelectorAll('pre, code, table, img').forEach(node => node.remove())
  copy.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, br').forEach(node => { node.append(document.createTextNode('\n')) })
  return (copy.textContent || '').replace(/\s+/g, ' ').trim()
}
function chunks(text: string) {
  const result: string[] = []
  while (text.length > 220) {
    const fragment = text.slice(0, 220)
    const sentence = Math.max(fragment.lastIndexOf('. '), fragment.lastIndexOf('? '), fragment.lastIndexOf('! '))
    const space = fragment.lastIndexOf(' ')
    const split = sentence > 60 ? sentence + 1 : space > 60 ? space : 220
    result.push(text.slice(0, split)); text = text.slice(split).trimStart()
  }
  if (text) result.push(text)
  return result
}
export function useReadAloud() {
  const supported = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined'
  const [activeId, setActiveId] = useState<string | null>(null), [paused, setPaused] = useState(false), [error, setError] = useState('')
  const generation = useRef(0), utterance = useRef<SpeechSynthesisUtterance | null>(null)
  const stop = useCallback(() => {
    generation.current++; utterance.current = null
    if (supported) window.speechSynthesis.cancel()
    setActiveId(null); setPaused(false)
  }, [supported])
  useEffect(() => {
    if (!supported) return
    const synth = window.speechSynthesis, playbackGeneration = generation, currentUtterance = utterance
    window.addEventListener(readingVoiceChanged, stop)
    return () => { playbackGeneration.current++; currentUtterance.current = null; synth.cancel(); window.removeEventListener(readingVoiceChanged, stop) }
  }, [supported, stop])
  function read(id: string, text: string) {
    if (!supported) { setError('Read aloud is unavailable in this browser.'); return }
    stop(); setError('')
    if (!text.trim()) { setError('This reply has no text to read aloud.'); return }
    const synth = window.speechSynthesis, available = synth.getVoices()
    const voice = selectedEnglishVoice(available, savedReadingVoice())
    const queue = chunks(text), run = generation.current
    setActiveId(id)
    const next = () => {
      if (generation.current !== run) return
      const part = queue.shift()
      if (!part) { utterance.current = null; setActiveId(null); setPaused(false); return }
      const speech = new SpeechSynthesisUtterance(part); utterance.current = speech
      if (voice) { speech.voice = voice; speech.lang = voice.lang } else speech.lang = 'en-US'
      speech.onend = next
      speech.onerror = event => {
        if (generation.current !== run) return
        stop(); setError(event.error === 'not-allowed' ? 'Your browser blocked playback. Tap Read aloud again.' : 'Speech playback failed. Check your device voice settings and try again.')
      }
      try { synth.speak(speech) } catch { stop(); setError('Speech playback could not start. Check your device voice settings.') }
    }
    next()
  }
  function togglePause() {
    if (!supported || !activeId) return
    if (paused) window.speechSynthesis.resume(); else window.speechSynthesis.pause()
    setPaused(!paused)
  }
  return { supported, activeId, paused, error, read, stop, togglePause }
}

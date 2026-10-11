import { useEffect, useState } from 'react'
import { englishVoices, readingVoiceChanged, saveReadingVoice, savedReadingVoice, selectedEnglishVoice } from './readingVoices'

export default function ReadingVoiceSettings() {
  const supported = typeof window.speechSynthesis !== 'undefined'
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]), [saved, setSaved] = useState(savedReadingVoice)
  useEffect(() => {
    if (!supported) return
    const synth = window.speechSynthesis, load = () => setVoices(synth.getVoices())
    load(); synth.addEventListener('voiceschanged', load)
    return () => synth.removeEventListener('voiceschanged', load)
  }, [supported])
  const choices = englishVoices(voices), selected = selectedEnglishVoice(voices, saved)
  return <fieldset className="mobile-reading-settings"><legend>Read aloud</legend>{supported ? <><label>English voice<select aria-label="English reading voice" value={selected?.voiceURI || ''} disabled={!choices.length} onChange={event => { const value = event.target.value; setSaved(value); saveReadingVoice(value); window.dispatchEvent(new Event(readingVoiceChanged)) }}>{choices.length ? choices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>) : <option value="">English (device default)</option>}</select></label>{!choices.length && <p>To choose a voice, add an English voice in your phone’s speech settings.</p>}</> : <p>Read aloud is unavailable in this browser.</p>}</fieldset>
}

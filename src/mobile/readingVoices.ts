export function englishVoices(voices: SpeechSynthesisVoice[]) {
  const unique = new Map<string, SpeechSynthesisVoice>()
  for (const voice of voices) if (/^en(?:[-_]|$)/i.test(voice.lang) && !unique.has(voice.voiceURI)) unique.set(voice.voiceURI, voice)
  return [...unique.values()].sort((a, b) => Number(b.localService) - Number(a.localService) || Number(b.default) - Number(a.default) || Number(/^en-US$/i.test(b.lang)) - Number(/^en-US$/i.test(a.lang)) || Number(/^en-GB$/i.test(b.lang)) - Number(/^en-GB$/i.test(a.lang)) || a.name.localeCompare(b.name)).slice(0, 2)
}
export function selectedEnglishVoice(voices: SpeechSynthesisVoice[], saved: string) {
  const choices = englishVoices(voices)
  return choices.find(voice => voice.voiceURI === saved) || choices[0]
}
export const readingVoiceKey = 'mrmak.mobile.read-aloud.voice'
export const readingVoiceChanged = 'mrmak-reading-voice-changed'
let currentVoice = ''
export function savedReadingVoice() { try { return localStorage.getItem(readingVoiceKey) || currentVoice } catch { return currentVoice } }
export function saveReadingVoice(value: string) { currentVoice = value; try { localStorage.setItem(readingVoiceKey, value) } catch { /* Keep the choice for this visit when storage is unavailable. */ } }

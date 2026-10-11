import test from 'node:test';
import assert from 'node:assert/strict';
import { englishVoices, selectedEnglishVoice } from '../../../src/mobile/readingVoices.ts';
const voice = (voiceURI, lang, localService = true, isDefault = false) => ({ voiceURI, name: voiceURI, lang, localService, default: isDefault });
test('settings offer only two English voices, prefer local speech, and discard non-English saved choices', () => {
  const voices = [voice('Turkish', 'tr-TR', true, true), voice('US online', 'en-US', false), voice('Australian', 'en-AU'), voice('British', 'en-GB'), voice('US', 'en-US'), voice('US', 'en-US')];
  assert.deepEqual(englishVoices(voices).map(item => item.voiceURI), ['US', 'British']);
  assert.equal(selectedEnglishVoice(voices, 'British').voiceURI, 'British');
  assert.equal(selectedEnglishVoice(voices, 'Turkish').voiceURI, 'US');
  assert.equal(selectedEnglishVoice(voices, 'Australian').voiceURI, 'US');
  assert.deepEqual(englishVoices([voice('Turkish', 'tr-TR')]), []);
  assert.equal(selectedEnglishVoice([], ''), undefined);
});

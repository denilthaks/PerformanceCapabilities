import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/content/scenarios';
import { collectLines, speechText, voiceKey } from '../src/app/voice-lines';
import voicesConfig from '../tools/voices.config.json';

const config = voicesConfig as { voices: Record<string, { id: string } | undefined> };

describe('voice lines', () => {
  it('speaks the words, not the stage directions or quote marks', () => {
    expect(speechText('(A week later, by email) We found out.')).toBe('We found out.');
    expect(speechText('"Give me one week."')).toBe('Give me one week.');
  });

  it('gives each line a stable key that changes when the words do', () => {
    expect(voiceKey('kai', 'Hello there.')).toBe(voiceKey('kai', 'Hello there.'));
    expect(voiceKey('kai', 'Hello there.')).not.toBe(voiceKey('kai', 'Hello there!'));
    expect(voiceKey('kai', 'Hello there.')).not.toBe(voiceKey('dana', 'Hello there.'));
    expect(voiceKey('kai', 'Hello there.')).toMatch(/^kai-[0-9a-f]{8}$/);
  });

  it('collects dialogue, questions and reactions from every floor', () => {
    const lines = collectLines(SCENARIOS);
    const texts = lines.map((l) => l.text);
    expect(texts.some((t) => t.startsWith('Let me guess. Dana sent you'))).toBe(true); // explore dialogue
    expect(texts.some((t) => t.includes('What do you think is really going on'))).toBe(true); // decision prompt
    expect(texts.some((t) => t.includes('Nobody had ever actually shown me'))).toBe(true); // reaction
    expect(new Set(lines.map((l) => l.key)).size).toBe(lines.length);
  });

  it('has an ElevenLabs voice configured for every speaker', () => {
    const speakers = new Set(collectLines(SCENARIOS).map((l) => l.speaker));
    for (const s of speakers) expect(config.voices[s]?.id, s).toMatch(/^[A-Za-z0-9]{20}$/);
  });
});

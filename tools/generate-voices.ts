// Generates natural voice files for every spoken line with ElevenLabs.
//
//   ELEVENLABS_API_KEY=... npm run voices            # generate missing lines
//   ELEVENLABS_API_KEY=... npm run voices -- --dry   # count lines and characters only
//   ELEVENLABS_API_KEY=... npm run voices -- --prune # also delete files for lines that no longer exist
//
// The key is only ever used here, at build time. It is never shipped to the
// browser: the game plays the MP3s saved in public/voice/, and falls back to
// the device's voice for any line without one. Lines already generated are
// skipped, so re-running only pays for new or changed lines.

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SCENARIOS } from '../src/content/scenarios';
import { collectLines } from '../src/app/voice-lines';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'public', 'voice');
const MANIFEST = join(OUT, 'manifest.json');
const API = 'https://api.elevenlabs.io/v1';

interface Config {
  model_id: string;
  output_format: string;
  voice_settings: Record<string, number | boolean>;
  voices: Record<string, { name: string; id: string }>;
}

const config = JSON.parse(readFileSync(join(ROOT, 'tools', 'voices.config.json'), 'utf8')) as Config;
const dry = process.argv.includes('--dry');
const prune = process.argv.includes('--prune');
const key = process.env.ELEVENLABS_API_KEY;

const lines = collectLines(SCENARIOS);
const manifest: { files: Record<string, string> } = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { files: {} };
const todo = lines.filter((l) => !manifest.files[l.key] || !existsSync(join(OUT, manifest.files[l.key])));
const chars = todo.reduce((n, l) => n + l.text.length, 0);

console.log(`${lines.length} spoken lines; ${todo.length} need audio (${chars} characters).`);
const unmapped = [...new Set(lines.map((l) => l.speaker))].filter((s) => !config.voices[s]);
if (unmapped.length) {
  console.error(`No voice configured for: ${unmapped.join(', ')}. Add them to tools/voices.config.json.`);
  process.exit(1);
}
if (dry) process.exit(0);
if (!key) {
  console.error('Set ELEVENLABS_API_KEY to generate voices. (Use --dry to just count.)');
  process.exit(1);
}

async function api(path: string, init: RequestInit = {}, attempt = 0): Promise<Response> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { 'xi-api-key': key!, ...(init.headers ?? {}) } });
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    const wait = 1500 * 2 ** attempt;
    console.log(`  ${res.status}, retrying in ${wait / 1000}s…`);
    await new Promise((r) => setTimeout(r, wait));
    return api(path, init, attempt + 1);
  }
  return res;
}

async function main() {
  // Check every configured voice exists in this account before spending anything.
  const list = await api('/voices');
  if (!list.ok) throw new Error(`Couldn't list voices (${list.status}): ${await list.text()}`);
  const available = new Map(((await list.json()) as { voices: { voice_id: string; name: string }[] }).voices.map((v) => [v.voice_id, v.name]));
  const missing = Object.entries(config.voices).filter(([, v]) => !available.has(v.id));
  if (missing.length) {
    console.error(`These voice IDs aren't in your ElevenLabs account: ${missing.map(([s, v]) => `${s} (${v.name}, ${v.id})`).join('; ')}`);
    console.error(`Available: ${[...available].map(([id, name]) => `${name} ${id}`).join(', ')}`);
    process.exit(1);
  }

  mkdirSync(OUT, { recursive: true });
  let done = 0;
  for (const line of todo) {
    const voice = config.voices[line.speaker];
    const res = await api(`/text-to-speech/${voice.id}?output_format=${config.output_format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: line.text, model_id: config.model_id, voice_settings: config.voice_settings }),
    });
    if (!res.ok) throw new Error(`Failed on "${line.text.slice(0, 40)}…" (${res.status}): ${await res.text()}`);
    const file = `${line.key}.mp3`;
    writeFileSync(join(OUT, file), Buffer.from(await res.arrayBuffer()));
    manifest.files[line.key] = file;
    // Save as we go, so an interrupted run keeps what it paid for.
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    done++;
    console.log(`  [${done}/${todo.length}] ${line.speaker} (${voice.name}): ${line.text.slice(0, 60)}`);
  }

  if (prune) {
    const keep = new Set(lines.map((l) => l.key));
    for (const k of Object.keys(manifest.files)) if (!keep.has(k)) delete manifest.files[k];
    const files = new Set(Object.values(manifest.files));
    for (const f of readdirSync(OUT)) if (f.endsWith('.mp3') && !files.has(f)) { unlinkSync(join(OUT, f)); console.log(`  pruned ${f}`); }
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`Done. ${Object.keys(manifest.files).length} lines have recorded audio.`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });

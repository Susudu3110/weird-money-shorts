# Weird Money — Video 01: The $18,000,000 Maple Syrup Heist

Faceless YouTube Short built 100% in code with the [faceless-shorts](https://github.com/) skill (Tall Tale 3D style):
script → local Kokoro voice → word-synced captions → 25 animated 3D shots → rendered MP4.

- **Title:** Someone Stole $18,000,000 of Maple Syrup (Nobody Noticed for a Year)
- **Length:** 59.7 s · 9:16 · 24 fps
- **Style:** Tall Tale 3D — flat 2D cartoon people in a sunny 3D world
- **Channel:** Weird Money

## Structure

| Path | What it is |
|---|---|
| `script.json` | narration script, voice settings, sources |
| `src/shots.js` | all 25 shots (S01–S25): camera moves, acting, captions |
| `src/core/locals.js` | custom sets/props (warehouse, night yard, barrels, map board…) |
| `src/core/*` | the Tall Tale engine (toon people, world, props, captions, timing) |
| `tools/capture.mjs` | headless-Chrome frame-exact capture |
| `tools/mix.py` | sound mix (voice + music + cues) |
| `data/*.json` | narration timing (lines / whisper words / sound cues) |
| `review/all.jpg` | contact sheet preview (1 frame per second) |

Big files (`.wav`, `.mp4`) are gitignored — regenerate locally.

## Rebuild

```bash
node tools/capture.mjs check        # verify shots + captions load
node tools/capture.mjs cues         # regenerate sound cues
node tools/capture.mjs sheet review/all.jpg   # contact sheet
node tools/capture.mjs video renders/out.mp4  # render
```

## Facts

True story — the Great Canadian Maple Syrup Heist (2011–2012). Sources in `script.json`.

# The dragon hero

The homepage hero's art layer is a real-time 3D scene: the black dragon, the white dragon and the yin-yang, with smoke, embers and a gold energy swirl. Everything else on the homepage (heading, text, buttons, note, the opening logo splash) is unchanged, and no other page loads any of it.

## How it behaves

- **Loading:** the scene and models load in their own chunk while the opening splash plays. The hero text never waits for them. Until the scene is ready, or if WebGL is unavailable, the original lobby art shows. The lobby art stays in the page underneath as the fallback.
- **Timeline:** once the splash has gone, the `Entrance` plays (7 s), then `Idle` loops seamlessly (12 s). The entrance plays once per page load; coming back to Home from another page resumes the idle.
- **Reduced motion:** under the Settings motion option or the system preference, the scene is a single still frame with no animation and no sound control.
- **Sound** is off until the visitor presses **Dragon sound** in the hero's top-right corner. That respects browser autoplay rules, and nothing roars unasked. The control appears only when sound is on in Settings, and turning sound off in Settings silences the dragons too.
- **Pausing:** rendering and sound pause when the tab is hidden or the hero is scrolled out of view.

## Timing (scene seconds; the entrance starts at 0)

| Time | Picture | Sound |
|---|---|---|
| 0-0.8 | Darkness, smoke fading in | Rumble loop fades in (if sound is on) |
| 0.8-5.0 | The black dragon emerges, horns glowing | Whoosh at 1.7 |
| 2.8-7.0 | The white dragon rises on the right | Whoosh at 2.9 |
| 4.3-6.1 | Black dragon's jaw opens | Roar at 4.3 |
| 5.4-6.85 | White dragon's jaw opens | Call at 5.4 |
| 4.6-7.0 | The yin-yang swells into prominence | Impact at 6.1 |
| Each idle loop, +5.5 | Black dragon roars | Roar |
| Each idle loop, +9.0 | White dragon calls | Call |

## Files

| Path | Size |
|---|---|
| `public/dragons/black-dragon.glb` | 2.0 MB |
| `public/dragons/white-dragon.glb` | 7.9 MB |
| `public/dragons/yin-yang.glb` | 0.07 MB |
| `public/dragons/fx/*.png` | 2.0 MB: six smoke sprites rendered from Blender volumes, plus ember and glow sprites |
| `public/dragons/audio/*.mp3` | 0.57 MB: six sounds |
| `src/ui/hero/` | `DragonHero.tsx` (component), `dragonScene.ts` (three.js scene), `dragonAudio.ts` (sound), `timing.ts` |
| `src/styles/dragon-hero.css` | Styles |

The models come from the "Two Dragons" Blender project (`Two Dragons - cinematic.blend`, v2 export), made from the supplied dragon and yin-yang models. The source project, export scripts and test page live outside this repository, in `Documents\PerformanceCapability\dragon-anim`.

**Audio source and licence:** all six sounds were synthesised from scratch for this project by a script (`synth_audio.py` in the dragon-anim project). They use no samples or third-party recordings, so no licence restrictions apply. A recorded sound can replace any of them under the same filename.

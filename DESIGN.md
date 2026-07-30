---
name: LOCU
description: A single distorting wordmark, rendered like machine vision losing lock on its subject.
colors:
  void-black: "#060608"
  void-black-deep: "#0A0E14"
  signal-white: "#F2FCFF"
  signal-cyan: "#00F0FF"
  signal-magenta: "#FF1FE0"
  hud-steel: "#5F8891"
  hairline-cyan: "rgba(0, 240, 255, 0.16)"
  vignette-black: "rgba(0, 0, 0, 0.55)"
typography:
  display:
    fontFamily: "Chakra Petch, Arial, sans-serif"
    fontSize: "clamp(4rem, 22vw, 16rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
  label:
    fontFamily: "IBM Plex Mono, Consolas, monospace"
    fontSize: "clamp(0.6rem, 1.4vw, 0.72rem)"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  none: "0px"
spacing:
  hud-inset: "clamp(16px, 4vw, 40px)"
---

# Design System: LOCU

## Overview

**Creative North Star: "Machine Vision Losing Lock"**

LOCU is a single wordmark suspended in a void, rendered as if a machine's optical sensor is tracking it — solid and legible at rest, fracturing into RGB-split glitch slabs the instant a pointer or finger touches the frame, then re-acquiring lock when it leaves. Nothing surrounds the word except sparse instrumentation: corner-mounted HUD labels, a faint schematic grid, scanline grain. The page proves technical craft by being the demonstration, not by describing one.

Confirmed rejections: no neon-glow-text-shadow standing in for real distortion; no supporting marketing copy; no navigation or scroll.

**Key Characteristics:**
- Void-black stage, one wordmark, real-time GPU-driven distortion as the only "content"
- Chromatic aberration (cyan/magenta channel split) as the signature material, not a decoration
- Machine instrumentation (HUD labels, grid, scanlines) sells specificity without adding narrative

## Colors

Near-black stage with cyan and magenta as the only two hues in the system, both reserved for the distortion event and its supporting instrumentation — never used as flat decorative accents at rest.

### Primary
- **Signal Cyan** (`#00F0FF`): one of the two RGB-split channels during distortion; also the resting tint of HUD labels, grid hairlines, and the pointer reticle.
- **Signal Magenta** (`#FF1FE0`): the other RGB-split channel during distortion; appears only under interaction, never at rest.

### Neutral
- **Void Black** (`#060608`): the stage. Full-bleed background, no gradients at rest.
- **Void Black Deep** (`#0A0E14`): subtle radial falloff toward the viewport edges, keeps the center optically forward.
- **Signal White** (`#F2FCFF`): the wordmark's resting color — cool, not pure white, so it reads as lit rather than printed.
- **HUD Steel** (`#5F8891`): dim label text and inactive instrumentation, always under 60% opacity.
- **Vignette Black** (`rgba(0, 0, 0, 0.55)`): void-black deepened toward the viewport edges in the scanline/vignette overlay; never a flat fill on its own.

### Named Rules
**The Two-Hue Rule.** Cyan and magenta are the entire color vocabulary. No third hue is introduced anywhere, including favicon, cursor, or error states.
**The Earned Color Rule.** Magenta never appears at rest. It exists only as a consequence of pointer/touch input, so its appearance always reads as caused, not decorative.

## Typography

**Display Font:** Chakra Petch (with Arial, sans-serif fallback)
**Label/Mono Font:** IBM Plex Mono (with Consolas, monospace fallback)

**Character:** A confident geometric grotesk carries the wordmark at extreme scale; a small technical mono handles every piece of supporting instrumentation. The pairing reads as "signage designed by an engineer," not a sci-fi movie title.

### Hierarchy
- **Display** (700, `clamp(4rem, 22vw, 16rem)`, line-height 1): the word LOCU itself, rendered to a canvas texture and mapped onto the distorting 3D plane. The only content on the page.
- **Label** (400, `clamp(0.6rem, 1.4vw, 0.72rem)`, letter-spacing 0.18em, uppercase): corner HUD readouts (status text, coordinates, frame index). Always low-opacity, always monospace, never competes with the wordmark.

### Named Rules
**The One Word Rule.** No secondary headline, tagline, or body copy is ever added next to the wordmark. If something needs saying, it goes in a HUD label at label scale, not display scale.

## Layout

Single fixed viewport (`100dvh` / `100vw`), no scroll under any content length or breakpoint — enforced by fixed positioning and `overflow: hidden` on `html`/`body`, not by content discipline alone. The wordmark sits dead-center, scaling fluidly with the display clamp so it stays roughly 60-85% of viewport width across phone through ultrawide. HUD labels anchor to the four corners with a consistent inset (`spacing.hud-inset`) that scales down on narrow viewports; on very small screens (<420px) less-essential corner labels drop before the wordmark ever shrinks below legibility.

## Elevation & Depth

No shadow system. Depth is conveyed by light and displacement, not occlusion: the wordmark's 3D plane bulges toward the viewer near the pointer, and the chromatic-aberration channel split itself implies depth (like a lens failing to converge), standing in for any drop shadow.

## Shapes

Everything is hard-edged. No rounded corners anywhere in the system. Corner HUD labels are bracketed with 1px hairlines (`hairline-cyan`) forming thin open-corner frames, echoing camera-viewfinder reticles rather than UI cards.

## Components

### Wordmark Stage (signature component)
The entire page. A full-viewport WebGL canvas rendering LOCU as a textured, subdivided plane with a custom shader: idle state has slow ambient noise (a subtle "breathing" so the page never looks static before interaction); active state warps geometry toward the pointer/touch point and splits the texture sample into cyan/magenta-shifted channels plus glitch-block slicing, with strength falling off by distance from the input point and easing back to rest when input ends.

### HUD Corner Labels
Small mono, uppercase, `hud-steel` at ~50% opacity, static or slowly updating technical-feeling text (do not fabricate real telemetry claims — treat any numbers as decorative signal, not data). Sits inside a 1px open-corner bracket.

### Custom Pointer
A small cyan crosshair/reticle replaces the default cursor on desktop, reinforcing the "targeting" read; on touch devices it is skipped entirely since there is no persistent cursor.

## Do's and Don'ts

### Do:
- **Do** tie every visible distortion directly to real pointer/touch coordinates; the effect must read as caused, not as an ambient loop.
- **Do** keep mouse and touch interaction feeling equivalent in strength and responsiveness (`Parity across input`, per PRODUCT.md).
- **Do** give the idle state slow, subtle motion so the first frame doesn't read as a static image.
- **Do** ease distortion back to rest smoothly (150-400ms feel) when the pointer leaves or touch ends.

### Don't:
- **Don't** add a third hue anywhere in the system.
- **Don't** add navigation, scroll, secondary copy, or any content beyond the wordmark and its HUD instrumentation.
- **Don't** simulate the effect with a CSS text-shadow/gif trick — the distortion must be real shader/geometry-driven WebGL.
- **Don't** let magenta appear without pointer/touch input present.

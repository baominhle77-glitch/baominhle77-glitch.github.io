# B production method — first60s, review r13

Follow [AGENTS.md](../../AGENTS.md). Work stays on gpt/k1t3-B-remotion,
draft PR149. No merge and no full>=480s episode before Chairman approval.

Manim runs the shared [native optical renderer](../simulation/README.md),
with640 irregular brown/gray/black pepper flakes, soft shadows, a fast opening
impulse followed by deceleration, continuous water shading/refraction/reflection,
caustics, vessel rim and meniscus. Distinct cyan dye/microtracers show transport
and closed subsurface return cells. Pepper stays on the surface. The old flat
blue slabs, molecular lollipop diagrams, arrows and static flow-line overlays
are absent from this60s sample.

Both formats are rendered natively at30fps. A portrait scene composes two native
camera rasters of the same physical geometry; it does not deepen a vessel or
stretch a panel. Camera/source calibration is content data in optics.json,
portrait_views.json and gemini.json. Real footage remains at<=1.0x source pixels.
The lower macro camera matches the source's oblique mouth ratio and moves with
easing. Its field clock continues from the corresponding full beat, including
when a Gemini panel appears or disappears. H1 opens0–6s, c2 is9.5–12.5s, and p2
is18.5–22.5s in landscape /19–26s in portrait. All three are the original supplied
Gemini files, each labelled inside its own panel.

Six540p matrix jobs run independently, fail-fast:false, timeout40min. Only after
the540p gates are green do six native1080p matrix jobs and a separate composition
job run. All outputs remain60s samples. Pip, Node and beat-local media are cached;
fingerprints include the shared renderer and only the camera data for that beat.
The same G1–G11 and original C17 thresholds run on both resolutions/formats.
Chrome uses swangle/120000ms; concurrency is capped by the actual CPU capacity
and checked against onStart.resolvedConcurrency. A one-core runner reports
configured1/effective1, separately from desired2. Full FFmpeg is verified first.

Preflight: python ci/remotion_b/preflight.py. The r13 §8 scorecard and source
material snapshots are in evidence/. Full-MP4 measurement remains required.
CI extracts six simulation frames per beat/format, and a red-timecode contact
sheet from each final MP4 at0.5/5/11.5/17/22/30/40/50/59.4s. Reports include
all30 C17 windows, freeze intervals, source/aspect/colour/overlay checks and CPU/
wall timing. G10 uses CIE76 ΔE<3 and35%; G11 tracks measured overlay pixels, not
invented moving metadata. CSS/SVG overlays are inventoried by the shared DOM
inspector; the native simulation image contains only physical actors/materials.

The original Andrew voice is retained. The r11 phenomenon ending and word clocks
are documented in narration_overrides.json; at59.4s both speech and captions say
Flow drags water outward. G4/G7 preserve semantic captions and panel provenance.
A/B authoring time stays null when uninstrumented. Extrapolation to8min×2 formats
is arithmetic only and does not render a full episode.

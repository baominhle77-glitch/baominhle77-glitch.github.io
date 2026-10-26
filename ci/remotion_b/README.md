# B · first 60 seconds · Manim + Remotion

Branch starts at `aca6c94`; the A/round-2 branch is untouched. Do not merge.

Manim renders text-free, separately authored 960×540 and 540×960 beat clips.
Remotion handles word-timed 2–5-word bold white captions (30px), titles, dark
transitions, audio and optional labelled Gemini inserts. The model uses analytic
2.5D surfaces rather than faceted 3D meshes: a closed, 128-component Bezier plate,
flattened pepper, and isolated molecular magnification. No scene rotation or
landscape-to-portrait crop. The narration and cached TTS bytes match A.

Run `python ci/remotion_b/prepare.py --stills --jobs 4` for three images per beat.
Run `python ci/remotion_b/pipeline.py`, then `python ci/remotion_b/measure.py`.
Install JS with `npm ci --prefix ci/remotion_b`. Set `B_CHROME=/usr/bin/chromium`
when using a system browser. CI installs the Remotion browser normally.

`tools/do_chuyen_dong_vung.py` calls A's unchanged `extract` / `measure` functions.
It retains every six-beat motion/scene-difference and two-second threshold; the
remaining 29 episode beats are outside the explicitly requested first-60s scope.
A red gate stays red, and artifacts upload even on failure.

The original three Gemini clips are missing from the base commit and workspace.
`gemini.json` records this explicitly. It never fabricates replacement footage.
The original p2/c2 storyboard placements are 80s/172s, outside this scope; the
first-60s placement from A must also be supplied. C16 therefore remains red.
No face/PiP footage is uploaded.

A CI job timings are observed; A CPU/editorial timing was not instrumented and
is null. B measures child CPU seconds, render wall time, bytes and a warm h3-only
rebuild. An unchanged warm rebuild is not labelled a measured editorial repair.
The 8-minute, two-format estimate is explicitly a linear extrapolation.

## Round 2 — GĐ supplied inputs and requested revision

All three original Gemini clips now live in `assets/k1t3/broll_gemini/`.
The hook uses source h1 3.0–6.5s at timeline 0–3.5s so impact is visible early;
c2 appears in h2 at 9.5–13.5s; p2 in h3 at 18.5–22.5s. The portrait foreground
is contained in full, over a blurred copy of the same video. No replacement
footage or portrait centre crop is used. The earlier missing-input note describes
round 1 only. Source hashes/placements are stored in `ci/so_sanh_AB.json`.

Round 2 removes static orange arrows, gives the basin a visible exterior depth,
uses live velocity filaments and separate molecular/recirculation scales. Surface
adsorption has water-loving heads, water-repelling tails, water bonds and a
weaker-cohesion region. The numeric comparison is the exact narrated calculated
gap Δγ=35.54mN/m at 25°C for inferred 25mM SDS, not invented 72/25 values.
Remotion uses the downloaded headless shell, swangle, 120000ms timeout and
concurrency=1, with the Ubuntu browser runtime libraries installed explicitly.

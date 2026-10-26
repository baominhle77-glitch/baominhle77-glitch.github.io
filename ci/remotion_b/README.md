# B: the approved production method, first 60-second sample

Follow [AGENTS.md](../../AGENTS.md). Work remains on `gpt/k1t3-B-remotion`,
PR149; do not merge. The Chairman must approve this sample before any full
>=480-second episode is rendered. The previous A method is retired.

Manim renders six text-free simulations with separately authored960×540 and
540×960 layouts, at30fps. Six matrix jobs run independently (`fail-fast:false`,
40min each). AST fingerprints invalidate only affected beats. Pip, Node and
native media are cached; a validated media hit skips the native toolchain.
Remotion assembles the original TTS, semantic2–5-word captions aligned to word
clocks, titles, transitions and the three original GĐ-supplied Gemini clips.
Portrait Gemini uses a focal crop covering the frame, per the latest instruction.
The hook uses h1 source3–9s at timeline0–6s; c2 appears9.5–13.5s and p2
18.5–22.5s, all labelled `AI minh hoạ (Gemini)`. Hashes and sources are recorded.

Each beat has its own scale/view. Molecular soap adsorption, weakening bonds and
surface/return flow evolve throughout the shot; its eased optical camera changes
azimuth/elevation every3.6s. Closed surfaces have no cutaway wedges or mesh edges.
Actual3D sphere separation is asserted every frame; physical particles<=400.
The final cross-section shows the long orange arrow mentioned at59s.

Run `python ci/remotion_b/prepare.py --beat h4 --jobs 1` to rebuild one beat.
Use `--stills` for three native540p frames per beat/format. Run
`python ci/remotion_b/compose.py` for Remotion only; install Node packages using
`npm ci --prefix ci/remotion_b`, and use `B_CHROME=/usr/bin/chromium` locally.
CI runs `remotion browser ensure`, uses swangle and120000ms timeouts. It requests
concurrency2; a genuinely one-core runner is logged and retried at1 without
spoofing its CPU count. The actual value is included in render metrics.

Before measurement, `gate_ffmpeg.py` verifies the rawvideo muxer and original
fps/freezedetect/scale/format filters. It chooses a full system FFmpeg or pinned
imageio-ffmpeg0.6.0. `tools/do_chuyen_dong_vung.py` uses A's unchanged extract and
measure functions; every beat, scene-difference and2-second threshold is retained.
The log and `c17_windows.md` print all30 windows per format. FREEZE detection logs
exact intervals and requires none. No red gate is relabelled green. CI always
uploads the two MP4s, contact sheets, timing and gate reports, including failures.
Native1080p is a separate explicit opt-in sample job after all540p gates pass.

A CPU/editorial timing was not instrumented and stays null. B records child CPU,
wall time, bytes, current warm cost and historical cold-model cost separately.
The8-minute×2-format estimate is arithmetic only; it does not render the episode.

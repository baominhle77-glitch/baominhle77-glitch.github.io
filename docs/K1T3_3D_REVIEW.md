# K1 t3 — 3D review, round 1/20

Base: PR #148, branch `gpt/k1t3-c16-c17-01`, `259198a317568b283452c43d61f419b32903c1bf`.

The latest director instruction authorizes one best-effort source commit by
17:45 GMT+7 on 26 October 2026, including explicit failed/unrun checks. Do not
stack follow-up source pushes while waiting for that commit's CI.

## Implementation

- 35 named beat methods read the locked narration; no `_shot()`/scene-template map.
- Shared library creates curved ceramic/water, closed solid pepper grains,
  spheres/3D head-tail molecules, needles, prisms and volumetric force vectors.
- `ThreeDScene`, an eased bounded camera flight, physical lighting and a local
  cast shadow replace the flat scene. Labels and citations stay fixed in frame.
- The constant lens is fitted to physical 3D poses. C13 records projected visible
  subject bounds separately from the bench/stage; the bench cannot substitute for
  the landscape subject's 70% target. Portrait requires ≥55% subject height and
  ≥90% width. Intentional macro crops are disclosed.
- Floating seeds follow the same water-height function as the rendered surface.
  Finite-drop spreading, continuous injection/return flow, paired vortices,
  adsorption/desorption and molecular geometry are qualitative illustrations,
  not CFD results or new experimental measurements.
- One continuous integer-frame take replaces accumulated rounded play/wait spans.
  Native output must equal the original plan's frame count exactly; the plan
  remains locked to 16,601 frames. Preview quantization is reported separately.
- The repository vendors Noto Sans Regular under its included OFL license.
  SHA-256: `89c3c497f618fdaa0b2d1e98fef93582f28c71debd2c4a8cdf41f190ced2909d`.

## Previous h3 portrait preflight

The previous implementation constructed a caption at screen coordinates and
passed it to `trang.hop_man()` (world-to-screen projection), while the source
label had already been converted and pinned using `man_sang_the_gioi()`/`ghim()`.
That mixed coordinate spaces during the zoomed h3 preflight. It also requested
unvendored Segoe UI, allowing a Linux font fallback. The reported collision is
therefore not evidence of a font-only fault. This revision removes that camera
projection from fixed labels, reserves an independent portrait text strip with
≥3% gaps and uses the same vendored font bytes on both systems. No controlled
Segoe-versus-Noto A/B test is claimed.

## Validation scope and commands

Reuse the published environment; no installation was performed for this coding task.
Use the existing checkout, not a new worktree. The local Windows-path compatibility
runtime remains `/workspace/k1t3-env/studio`, with source linked to this checkout.

```bash
source /workspace/k1t3-env/activate.sh
cd /workspace/k1t3-env/studio
python -m unittest discover -s ci -p 'test_*.py' -v
# Fast layout/physics diagnostics, not a final 540p certificate:
python ci/review_k1t3.py --tier preview --beats h1,h2,h3,h4,c1,p1 --jobs 4
# Static middle poses for all beats (exit 2 means successful still-only checks):
python ci/review_k1t3.py --tier preview --stills-only --jobs 4
# Final first-minute workflow, matching CI:
python ci/chay_mau_k1t3.py
python ci/chuyen_dong_vung.py --root out/M1_MARANGONI_DUNG/_build
```

The renderer preserves a source-keyed cache by beat, format, quality and output
kind. Selective retries retain only matching reference images; a lone dispatched
beat cannot certify differences against prior beats without those references.
The pairwise gate compares each middle image against EVERY prior beat, not just
its neighbour or a selected template group.

CI renders the first six native 540p/30fps clips per format, assembles the 60s
samples with the original cached narration, retains the freeze gate and checks
35 native middle stills per format. It does not claim full-duration motion tests
for the remaining 29 beats. Failed checks retain render logs, images and numbers.

## CI viewing

The workflow has beat/format dispatch inputs and writes actual measurements to
Job Summary. GitHub cannot embed local JPGs or artifact ZIPs in Summary. The run
therefore appends its actual public JPGs to `k1t3-review-evidence` through the
scoped Actions token, then embeds immutable raw image URLs. This generated
image-only history is separate from the one source commit on the PR branch;
no force update or production deployment is used.

The repository's default branch is `main`. GitHub must register the dispatched
workflow on the default branch before the Run workflow button is available;
adding the declaration on this PR alone does not prove manual dispatch works.
PR-triggered sample validation is independent of that registration.

## Evidence / remaining work

The completed first diagnostic pass rendered 12 clips at 360p/15fps: both layouts
of h1, h2, h3, h4, c1 and p1. All passed their preview frame counts, C13, motion and
all-prior image differences. The smallest noninitial difference was 17.0158,
above 12. Those preview results are not substituted for final native results.

Native local submission measurements (540p/30fps):

| Layout | Native clips / exact counts | C13 + motion clips | Native middle stills C13 | Minimum all-prior Δ |
|---|---|---|---|---|
| 16x9 | 6/6; 6 exact | 6/6 | 35/35 | 14.2468 (threshold 12) |
| 9x16 | 6/6; 6 exact | 6/6 | 35/35 | 13.1595 (threshold 12) |

h1 encodes **211/211 frames in both formats**; no 214-frame surplus remains. Eight regression tests passed. The native h1 landscape take took 387.619s (6m28s) with the final geometry, concurrent with other jobs. Native wall times are in the evidence JSONs.

Full 60-second gate: **DAT**.

- 16x9: 30/30 two-second windows pass.
- 9x16: 30/30 two-second windows pass.

Freeze 16x9: `{   "format": "16x9",   "freeze_s": 0,   "longest_s": 0,   "pass_freeze": true }`.

Freeze 9x16: `{   "format": "9x16",   "freeze_s": 0,   "longest_s": 0,   "pass_freeze": true }`.

Actual native PNGs and machine measurements: [evidence](evidence/k1t3-round-1/README.md). Per-beat object descriptions, dimensions and visual weaknesses: [35-beat table](K1T3_BEAT_REVIEW.md). The final native contact sheet was opened and inspected locally.

Observed aesthetic weaknesses in the diagnostic board: portrait camera rolls
are strong, and some molecular close-ups crop tails at the upper edge. These
need explicit visual grading even where projected-box/motion checks pass.

Deferred: full 553-second native render and motion checks, final typography/art
polish of cropped close-ups, and default-branch dispatch registration. This report accompanies the single best-effort source commit. No production deployment is requested.

The first local sample mux failed because FFmpeg on Linux interpreted the cached `E:/...mp3` names as a protocol. Resolving audio paths with `Path.resolve()` fixed the command on the existing runtime; the complete sample wrapper and full-frame gate then both exited 0. All 12 native clip caches and 70 middle-still caches were reused; no final clip was rendered twice for this fix.

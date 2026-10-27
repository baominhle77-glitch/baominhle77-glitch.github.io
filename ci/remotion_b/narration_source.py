"""B sample narration revisions; original cached episode remains immutable."""
import json,hashlib
from pathlib import Path
H=Path(__file__).resolve().parent;R=H.parents[1]
def for_beat(bid):
 overrides=json.loads((H/'narration_overrides.json').read_text())
 if bid in overrides:
  q=overrides[bid];audio=R/q['audio_path'];assert hashlib.sha256(audio.read_bytes()).hexdigest()==q['audio_sha256'];return dict(narration=q['narration'],words=json.loads((R/q['words_path']).read_text()),offset=q['offset'],audio=audio)
 plan=json.loads((H/'ke_hoach_A.json').read_text())['beats'][bid];tts=json.loads((R/'out/M1_MARANGONI_DUNG/_build/tts.json').read_text())['beats'][bid]
 return dict(narration=plan['n'],words=json.loads((R/'out/_tts_cache'/Path(tts['words']).name).read_text()),offset=plan['t0']+plan['t_chuyen'],audio=R/'out/_tts_cache'/Path(tts['mp3']).name)

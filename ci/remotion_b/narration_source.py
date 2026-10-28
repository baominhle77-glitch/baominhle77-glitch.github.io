"""Resolution-independent full episode narration and measured word clocks."""
import json,hashlib
from pathlib import Path
H=Path(__file__).resolve().parent;R=H.parents[1]
def for_beat(bid):
 timeline=json.loads((H/'full_timeline.json').read_text());b=next(b for b in timeline['beats'] if b['id']==bid);audio=R/b['audio_path'];overrides=json.loads((H/'narration_overrides.json').read_text())
 if bid in overrides:assert hashlib.sha256(audio.read_bytes()).hexdigest()==overrides[bid]['audio_sha256']
 else:
  t=json.loads((R/'out/M1_MARANGONI_DUNG/_build/tts.json').read_text())['beats'][bid];assert hashlib.sha256(audio.read_bytes()).hexdigest()==t['mp3_sha256']
 return dict(narration=b['narration'],words=json.loads((R/b['words_path']).read_text()),offset=b['offset'],audio=audio)

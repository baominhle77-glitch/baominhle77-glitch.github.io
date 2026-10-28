"""Audit the requested immutable full narration before spending render time.

This calls the existing G4 language policy; it does not relax any gate or edit
the storyboard. A blocked source exits nonzero before a render job can start.
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(R))
from gate_chung.language import phrase_error
from gate_chung.policy import GRAPHIC_CAPTION_WORDS


def normalized(text):
    return re.findall(r"[a-z]+(?:'[a-z]+)?|\d+", text.lower())


def audit():
    source = R / 'out/M1_MARANGONI/storyboard.json'
    storyboard = json.loads(source.read_text())
    plan = json.loads((R / 'ci/remotion_b/ke_hoach_A.json').read_text())
    tts = json.loads((R / 'out/M1_MARANGONI_DUNG/_build/tts.json').read_text())
    from narration_source import for_beat
    timeline = json.loads((R / 'ci/remotion_b/full_timeline.json').read_text())
    overrides = json.loads((R / 'ci/remotion_b/narration_overrides.json').read_text())
    allowed = {'h4','c1','p1','p3','c2','v4','c3','w2','b1','r2','r3','s8'}
    assert set(overrides) <= allowed
    assert all(q['tempo'] == 1.0 for q in overrides.values())
    beats = storyboard['beats']
    order = [b['id'] for b in beats]
    assert order == plan['thu_tu'] and len(order) == 35
    assert hashlib.sha256(source.read_bytes()).hexdigest() == plan['storyboard_sha256']
    word_count = sum(len(b['n'].split()) for b in beats)
    assert word_count == 1441
    original_frames = sum(plan['beats'][bid]['so_khung'] for bid in order)
    assert original_frames == plan['tong_khung']
    frames = timeline['frames']
    assert frames / 30 >= 480
    assert tts['rate'] == '+0%' and tts['voice'] == 'en-US-AndrewNeural'
    rows, blockers, cursor = [], [], 0
    for beat in beats:
        bid = beat['id']
        original_narration = beat['n']
        effective = for_beat(bid)
        beat = dict(beat, n=effective['narration'])
        if bid not in allowed: assert beat['n'] == original_narration
        timing = next(b for b in timeline['beats'] if b['id'] == bid)
        voice = tts['beats'][bid]
        audio = effective['audio']
        words = effective['words']
        word_path = R / timing['words_path']
        expected_sha = overrides[bid]['audio_sha256'] if bid in overrides else voice['mp3_sha256']
        assert hashlib.sha256(audio.read_bytes()).hexdigest() == expected_sha
        # Edge can return multiword events (e.g. w4), so compare normalized
        # spoken text rather than pretending one event always equals one word.
        assert normalized(' '.join(w['w'] for w in words)) == normalized(beat['n']), bid
        start = cursor / 30
        end = (cursor + timing['frames']) / 30
        offset = effective['offset']
        row = dict(id=bid, start=start, end=end, frames=timing['frames'],
                   audio_offset=offset, narration=beat['n'],
                   words=len(beat['n'].split()), tts_events=len(words),
                   audio=str(audio.relative_to(R)), audio_sha256=expected_sha,
                   word_clock=str(word_path.relative_to(R)), voice=tts['voice'], rate=tts['rate'])
        rows.append(row)
        for index, word in enumerate(words):
            forbidden = sorted(set(normalized(word['w'])) & GRAPHIC_CAPTION_WORDS)
            if forbidden:
                first = min(index, max(0, len(words) - 4))
                example = ' '.join(w['w'] for w in words[first:first+4])
                blockers.append(dict(code='L6', gate='G4', beat=bid,
                                     start=offset + word['t0'], end=offset + word['t1'],
                                     spoken=word['w'], forbidden=forbidden,
                                     caption_example=example, rejection=phrase_error(example)))
        if re.search(r'\bepisodes?\b', beat['n'], re.I):
            blockers.append(dict(code='L6', gate='QUY_TRINH_CHUAN L6', beat=bid,
                                 start=start, end=end, spoken=beat['n'],
                                 rejection='Verbatim source refers to another episode; L6 forbids this.'))
        if 'thirty five point five four' in beat['n'].lower():
            blockers.append(dict(code='L6', gate='QUY_TRINH_CHUAN L6', beat=bid,
                                 start=start, end=end, spoken=beat['n'],
                                 rejection='Verbatim source retains35.54; L6 explicitly forbids35.54.'))
        cursor += timing['frames']
    adslots = [dict(beat=bid, time=next(b['start'] for b in rows if b['id'] == bid),
                    kind='mid-roll candidate', cut='before beat; never inside narration')
               for bid in ('c2', 'c3', 'b1')]
    return dict(source=str(source.relative_to(R)), source_sha256=plan['storyboard_sha256'],
                parent_sample='0c07c71c95234f20500dadf7d494931001a06dd2',
                words=sum(b['words'] for b in rows), original_words=word_count, authorized_override_beats=sorted(overrides), beat_count=len(rows), frames=frames, fps=30,
                duration_s=frames/30, voice=tts['voice'], rate=tts['rate'],
                slowed_audio=False, source_adslots=storyboard['meta']['adslots'],
                adslots=adslots, beats=rows, blockers=blockers,
                passed=not blockers, blocked_code='L6' if blockers else None)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    report = audit()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f"SOURCE35 / {report['words']} words / {report['duration_s']:.6f}s / native +0%")
    print('code | gate | beat | seconds | reason')
    for item in report['blockers']:
        print(f"{item['code']} | {item['gate']} | {item['beat']} | "
              f"{item['start']:.3f}–{item['end']:.3f} | {item['rejection']}")
    print('FULL_SOURCE ' + ('DAT' if report['passed'] else 'BLOCKED L6'))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())

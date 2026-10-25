# -*- coding: utf-8 -*-
"""Vá nhà máy K1 cho tập dựng theo C13 + màu v2 (Phiếu 122, K1 t3 chặng ii; SX 24/10/2026).

nha_may_kenh.py gọi ap(Lop, M, t) khi tệp tập có "va_nha_may": ["nha_may_k1_v2"]. Không sửa nha_may.py / nha_may_k1.py
(t2 giữ nguyên đường cũ). Ba vá:
  1. H10 viền tối mép K1 22 % (LUAT_BAN_SAC_KENH §2a): bước noi nhân bản trần với mặt nạ xám m = f(y)·g(x),
     f = 1 − A·clip((|v|−V0)/(1−V0)), g = 1 − B·clip((|u|−U0)/(1−U0)), u, v ∈ [−1, 1]. Dọc mạnh, ngang nhẹ: H1/H2 của KĐ
     lấy nền theo trung vị hàng nên phần dọc không thành "nội dung"; phần ngang B = 0,10 lệch nền tối đa ~17 < 24.
     Đo trên 6 khung bản cũ (h10_122 cách KĐ): tỉ số mép/giữa 0,778.
  2. H10 hộp phụ đề đặc (alpha 0): mực #1C232B trên #A7ADB3 = 7,0:1 ở MỌI khung (alpha 0x40 cũ xuống ~4,2:1 khi nền
     sau hộp tối).
  3. H7 cue 2–5 từ: quy hoạch động trên token lời (từ = mẩu có \\w, như kiem_hinh9.h7_srt), ưu tiên ngắt ở cuối câu rồi
     dấu phẩy, cấm cue 1 từ / > 5 từ / > 58 ký tự (một dòng nên không có dòng trơ).
Màu viền ô PiP (VIEN) theo v2 #3F6A9E.
"""
import os
import re

A_DOC, B_NGANG, V0, U0 = 0.24, 0.10, 0.30, 0.50
VIEN_V2_HEX, VIEN_V2_RGB = "#3F6A9E", (0x3F, 0x6A, 0x9E)
TU_MIN, TU_MAX = 2, 5
CHAN = {"the", "a", "an", "of", "to", "and", "in", "on", "at", "by", "for", "with", "from", "as", "is", "that", "or",
        "its", "their", "this"}


def mat_na(W, H):
    import numpy as np
    y = np.abs(2 * (np.arange(H) + 0.5) / H - 1)[:, None]
    x = np.abs(2 * (np.arange(W) + 0.5) / W - 1)[None, :]
    f = 1 - A_DOC * np.clip((y - V0) / (1 - V0), 0, 1)
    g = 1 - B_NGANG * np.clip((x - U0) / (1 - U0), 0, 1)
    return np.round(255 * f * g).astype(np.uint8)


def so_tu(s):
    return len([w for w in s.split() if re.search(r"\w", w)])


def ap(Lop, M, t):
    NM = M.NM if hasattr(M, "NM") else __import__("nha_may")
    R = NM.R

    # ---- 1. viền tối mép trong bước nối
    def mat_na_tep(self, bc):
        from PIL import Image
        W, H = NM.KICH[bc]
        p = "%s/vignette_k1_%s.png" % (R, bc)
        if not os.path.exists(p):
            Image.fromarray(mat_na(W, H), "L").save(p)
        return p.replace("\\", "/")

    def loc_vig(self, bc):
        return ("[0:v]format=gbrp[a];[2:v]format=gray,format=gbrp[b];"
                "[a][b]blend=all_mode=multiply:shortest=1,format=yuv420p[v]")

    Lop.mat_na_tep, Lop.loc_vig = mat_na_tep, loc_vig
    Lop.noi = M._thay_nguon(NM.NhaMay.noi,
                            ["raw, can = p.stdout, n * 1600 * 8",
                             '"-map", "0:v:0", "-map", "1:a:0",'],
                            ['raw, can = bytes(round(kh["beats"][bid]["t_chuyen"] * FPS) * 1600 * 8) + p.stdout, n * 1600 * 8',
                             '"-framerate", "30", "-loop", "1", "-i", self.mat_na_tep(bc), "-filter_complex", self.loc_vig(bc), '
                             '"-map", "[v]", "-map", "1:a:0",'],
                            "noi_v2")

    # ---- 2. hộp phụ đề đặc
    viet_goc = Lop.viet_ass

    def viet_ass(self, cues, bc):
        s = viet_goc(self, cues, bc)
        cu, moi = self.ass_col(self.NEN, 0x40), self.ass_col(self.NEN, 0x00)
        if s.count(cu) != 2:
            raise SystemExit("ASS_KHONG_THAY_HOP %s" % cu)
        return s.replace(cu, moi)
    Lop.viet_ass = viet_ass

    # ---- 3. cue 2–5 từ
    def cues_for(self, text, words, t_off, t_end):
        toks, miss = self.tokens_for(text, words)
        n = len(toks)
        w = [so_tu(x[0]) for x in toks]
        cuoi_cau = [x[0].rstrip("\"')”’")[-1:] in (".", "?", "!") for x in toks]
        phay = [x[0][-1:] in (",", ";", ":", "—") for x in toks]
        INF = float("inf")
        f, tr = [INF] * (n + 1), [-1] * (n + 1)
        f[0] = 0.0
        for i in range(1, n + 1):
            for j in range(i - 1, -1, -1):
                ww = sum(w[j:i])
                if ww > TU_MAX:
                    break
                if f[j] == INF or ww < TU_MIN and not (j == 0 and i == n):
                    continue
                s = " ".join(x[0] for x in toks[j:i])
                if len(s) > self.SUB_LINE:
                    continue
                c = 0.4 * (ww - 3.5) ** 2
                c += 6.0 * sum(cuoi_cau[j:i - 1])               # câu kết giữa cue
                if i < n:
                    c += 0.0 if cuoi_cau[i - 1] else (1.0 if phay[i - 1] else 3.0)
                    if toks[i - 1][0].lower().strip(",.") in CHAN:
                        c += 2.0
                if toks[i - 1][2] - toks[j][1] > self.SUB_MAX_SEC:
                    c += 5.0
                if f[j] + c < f[i]:
                    f[i], tr[i] = f[j] + c, j
        if f[n] == INF:
            raise SystemExit("PHU_DE_KHONG_CHIA_DUOC %r" % text[:60])
        cues, i = [], n
        while i > 0:
            cues.append(toks[tr[i]:i])
            i = tr[i]
        cues.reverse()
        out = []
        for j, c in enumerate(cues):
            a = t_off + c[0][1]
            nxt = t_off + cues[j + 1][0][1] if j + 1 < len(cues) else t_end
            e = min(max(t_off + c[-1][2], a + self.SUB_MIN_SEC), nxt - 0.02)
            out.append((a, e, " ".join(x[0] for x in c)))
        return out, miss
    Lop.cues_for = cues_for

    # ---- viền ô PiP v2
    Lop.VIEN_HEX, Lop.VIEN_RGB = VIEN_V2_HEX, VIEN_V2_RGB

    gia_tri_goc = Lop.gia_tri

    def gia_tri(self):
        g = gia_tri_goc(self)
        g["va_nha_may_k1_v2"] = {"vignette": {"A_doc": A_DOC, "B_ngang": B_NGANG, "V0": V0, "U0": U0},
                                 "hop_phu_de_alpha": 0, "cue_tu": [TU_MIN, TU_MAX], "vien_pip": VIEN_V2_HEX}
        return g
    Lop.gia_tri = gia_tri

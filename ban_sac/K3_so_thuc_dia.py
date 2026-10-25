# Module bản sắc K3 (san hô / lịch sử Trái Đất) — thế giới "trang sổ thực địa cùng lát cắt đá". Luật: E:\Studio\LUAT_BAN_SAC_KENH.md §2 cột K3.
# canh.py của K3 chỉ import module này. Cấu hình dưới đây được lint_bs4.py đọc bằng ast.literal_eval — giữ là literal thuần.
from manim import *
from ngon_ngu import VI, dich, nguyen

PALETTE = ["#EFE6D3", "#2E2A26", "#CB8C37", "#B3E1B6", "#67A599", "#34B2C9", "#7B3F98", "#C2187F"]  # giấy, mực, Devon, Silur, Carbon, Jura — mã ICS (C10 A1 đọc 02/10 22:08 stratigraphy.org/chart; Jura rgb 52,178,201 thêm 17/10 cho K3 t1 s3c/s6b); NHAN = chì tím sổ thực địa (phiếu 79 Lỗi 5, GĐ 12:1x 18/10: màu nhấn mới — DEVON chỉ còn là màu kỷ trong dải đá / bậc thang)
FONTS = ["Georgia", "EB Garamond"]  # giấy phép: GIẢ THUYẾT, NC kiểm. Chú thích "viết tay" hiện dùng Georgia nghiêng — chưa có phông viết tay được duyệt
CHO_PHEP_LUOI = False
VAT_THAT = []

GIAY, MUC, DEVON, SILUR, CARBON, JURA, NHAN, GAY = PALETTE
# GAY #C2187F = gáy vải đỏ tía của sổ (màu nhận diện K3, phiếu 89 Lỗi 3, GĐ 02:22 19/10 quyết định 1 (b)): sắc độ ≈ 324°,
# xa K1 (≈ 200–220°, ≈ 20°), K2 (0–40°, 140°), K4 (nền ≈ 250°, đỏ #E63946 ≈ 355°), K5 (≈ 180–195°, đỏ #FF8080 0°, nâu ≈ 30°).
# Quyết định bản sắc K3 (GĐ 19:3x 17/10): bìa + chữ cảnh EN = Georgia (FONTS[0]); bản VI = FONT_VI Palatino Linotype cho cả bìa lẫn cảnh,
# kiểm glyph bằng ban_sac/kiem_phong_vi.py (pala.ttf đủ 0 thiếu) trước khi nộp. Phụ đề (C5, do nha_may.py đốt ở bản dọc / .srt ở bản ngang):
# Consolas, chữ màu GIAY trên hộp MUC alpha 0x40 — màu lấy từ PALETTE, không mã mới. Thư viện cảnh: ban_sac/K3_canh/ (mỗi lớp bo_cuc_16x9/9x16 chung lõi).
FONT = FONTS[0]
FONT_VI = "Palatino Linotype"  # Georgia thiếu 92/96 glyph VI (cmap, 25/09)  # C11: phông bản VI (ban_sac/kiem_phong_vi.py)
if VI:
    FONT = FONT_VI


def nen(scene, so_trang=None, seed=3):
    """Giấy sáng ấm (trục 2: Y ≈ 230) + vân giấy + mép giấy + số trang (trục 4)."""
    import random
    r = random.Random(seed)
    scene.camera.background_color = GIAY
    W, H = config.frame_width, config.frame_height
    van = VGroup(*[Line([x, y, 0], [x + r.uniform(0.1, 0.5), y + r.uniform(-0.02, 0.02), 0])
                   for x, y in [(r.uniform(-W / 2, W / 2), r.uniform(-H / 2, H / 2)) for _ in range(260)]]).set_stroke(MUC, 1, 0.05)
    mep = Line([-W / 2 + 0.55, -H / 2, 0], [-W / 2 + 0.55, H / 2, 0]).set_stroke(NHAN, 1.2, 0.35)
    # gáy vải sổ ở mép trái (trục 4 mép giấy): rộng 0,40 (9:16, 54 px, cách ô PiP 20 px) / 0,50 (16:9, 67 px); trượt cùng trang khi lật
    wb = 0.40 if H > W else 0.50
    gay = Rectangle(width=2 * wb, height=H + 0.2).set_stroke(width=0).set_fill(GAY, 1).move_to([-W / 2, 0, 0])
    khau = DashedLine([-W / 2 + wb - 0.09, -H / 2, 0], [-W / 2 + wb - 0.09, H / 2, 0], dash_length=0.12).set_stroke(GIAY, 1.2, 0.55)
    gay.k3_gay = khau.k3_gay = True       # gáy đứng yên khi lật trang (loi._lat_trang), không quét qua ô PiP
    g = VGroup(van, mep, gay, khau)
    if so_trang is not None:
        so = chu(str(so_trang), 14, MUC, 0.6)
        if H > W:   # 9:16 (phiếu 79 Lỗi 4): góc DR nằm ngoài vùng an toàn dọc -> góc trên phải vùng an toàn (x <= 2,963, y <= 5,111)
            so.move_to([2.95 - so.width / 2, 5.09 - so.height / 2, 0])
        else:
            so.to_corner(DR, buff=0.25)
        g.add(so)
    g.set_z_index(-100)
    scene.add(g)
    return g


def chu(s, size=26, mau=MUC, op=1.0):
    """Serif cổ (trục 6). `chu_goc` = chuỗi đã qua dich() (để ngắt dòng lại mà không tra từ điển lần nữa)."""
    m = Text(dich(s), font=FONT, font_size=size * 4, color=mau).scale(0.25).set_opacity(op)
    m.chu_goc = dich(s)
    return m


def chu_nghieng(s, size=20, mau=MUC, op=0.9):
    """Chú thích in nghiêng (trục 6)."""
    m = Text(dich(s), font=FONT, font_size=size * 4, color=mau, slant=ITALIC).scale(0.25).set_opacity(op)
    m.chu_goc = dich(s)
    return m


def chu_doan(s, size=20, rong=6.0, mau=MUC, op=1.0, nghieng=False):
    """Chữ nhiều dòng vừa bề rộng `rong`: ngắt tại khoảng trắng theo bề rộng đo thật của phông (không cắt mã/DOI).
    Dùng cho bản dọc 9:16 (cột hẹp) và chú thích cuối trang dài."""
    f = chu_nghieng if nghieng else chu
    m = f(s, size, mau, op)
    if m.width <= rong:
        return m
    tu = m.chu_goc.split(" ")
    dong, hien_tai = [], ""
    for w in tu:
        thu = (hien_tai + " " + w).strip()
        if hien_tai and f(nguyen(thu), size, mau, op).width > rong:
            dong.append(hien_tai)
            hien_tai = w
        else:
            hien_tai = thu
    dong.append(hien_tai)
    return f(nguyen("\n".join(dong)), size, mau, op)


# Độ đậm lớp tô chì màu của dải kỷ (phiếu 79 Lỗi 5, BS-3 K3–K2): sắc ICS giữ nguyên, tô loãng như chì màu trong sổ,
# viền vẽ bằng mực (MUC) như cột địa tầng vẽ tay. Mực sắt #2E2A26 (thay #3B2A1E nâu đỏ): mép chữ pha giấy không còn bão hoà > 64/255. 0,18 trên nền GIAY cho độ bão hoà < 64/255 nên mảng màu kỷ không chiếm chữ ký màu kênh.
TO_KY = 0.18


def loang(c, to=None):
    """Sắc kỷ pha sẵn lên giấy ở độ đậm TO_KY (đục): lớp phủ kín màn vẫn là màu loãng như dải đá, không màu đặc (phiếu 79 Lỗi 5)."""
    to = TO_KY if to is None else to
    g = [int(GIAY[k:k + 2], 16) for k in (1, 3, 5)]; m = [int(c[k:k + 2], 16) for k in (1, 3, 5)]
    return "#%02X%02X%02X" % tuple(round(x * (1 - to) + y * to) for x, y in zip(g, m))


def lop_da(x0, x1, y0, y1, mau, nhan=None):
    """Dải đá tô chì màu loãng (trục 3), viền màu kỷ, mép trên hơi gợn như ranh giới trầm tích."""
    n = 24
    tren = [[x0 + (x1 - x0) * i / n, y1 + 0.03 * np.sin(i * 1.7), 0] for i in range(n + 1)]
    pts = [[x0, y0, 0]] + tren + [[x1, y0, 0]]
    d = Polygon(*pts).set_fill(mau, TO_KY).set_stroke(MUC, 2.5, 1)
    if nhan:
        return VGroup(d, chu_nghieng(nhan, 16).move_to(d.get_center()))
    return d


def vach_sinh_truong(tam, r0, r1, so_vach, goc=PI / 2):
    """Vạch sinh trưởng dạng cung đồng tâm (trục 3) — kết cấu của san hô, không phải lưới."""
    return VGroup(*[Arc(radius=r0 + (r1 - r0) * k / max(1, so_vach - 1), start_angle=PI / 2 - goc / 2, angle=goc, arc_center=tam)
                    for k in range(so_vach)]).set_stroke(MUC, 1, 0.55)


def so_mu(n, size=11, mau=MUC):
    """Số chú thích dạng chữ số nhỏ nâng lên — không dùng ký tự Unicode ⁴–⁹ (phông serif có thể thiếu glyph)."""
    return chu(str(n), size, mau, 0.9)


def gan_so(t, n):
    """Gắn số chú thích nâng lên sau mobject chữ `t`."""
    m = so_mu(n)
    return VGroup(t, m.next_to(t, RIGHT, buff=0.04).align_to(t, UP).shift(UP * 0.04))


def chu_thich_le(s, y, so=None):
    """Chú thích ở lề trái như sổ thực địa (trục 7); `so` là số chú thích cuối trang nếu có."""
    t = chu_nghieng(s, 18)
    if so is not None:
        t = gan_so(t, so)
    return t.move_to([-config.frame_width / 2 + 0.75 + t.width / 2, y, 0])


def bang_dinh(m, goc=0.12):
    """Băng dính giấy dán vật chứng lên trang (trục 7)."""
    b = Rectangle(width=0.9, height=0.28).set_stroke(width=0).set_fill(NHAN, 0.25).rotate(goc)
    return b.move_to(m.get_corner(UL) + [0.2, -0.05, 0])


def chu_thich_cuoi_trang(*dong, so=None, rong=None):
    """Nguồn trên màn (trục 8): chú thích cuối trang đánh số ¹ ² … — thiết bị riêng của K3 theo bảng §2.
    `so`: số chú thích của từng dòng (mặc định 1..n — số cố định theo nguồn của tập, LUAT §3); `rong`: bề rộng tối đa (ngắt dòng);
    phần tử `dong` là chuỗi hoặc Text đã dựng bằng chu() (tệp cảnh gọi chu() với hằng để cổng 7b4 đối chiếu được DOI)."""
    so = list(so or range(1, len(dong) + 1))
    hang = VGroup()
    for n, s in zip(so, dong):
        m = s if isinstance(s, Mobject) else chu(s, 13, MUC, 0.8)
        if rong is not None and m.width > rong - 0.25:
            m = chu_doan(nguyen(m.chu_goc), 13, rong - 0.25, MUC, 0.8)
        hang.add(VGroup(so_mu(n, 9), m).arrange(RIGHT, aligned_edge=UP, buff=0.05))
    ds = hang.arrange(DOWN, aligned_edge=LEFT, buff=0.06)
    ke = Line([0, 0, 0], [2.2, 0, 0]).set_stroke(MUC, 1, 0.6)
    g = VGroup(ke, ds).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
    return g.to_corner(DL, buff=0.3).shift(RIGHT * 0.5)


class _ThamMuc(DrawBorderThenFill):
    """Nét viền lúc thấm lấy đúng màu tô của từng nét (chữ Text không có nét viền nên bản gốc vẽ viền bằng màu
    mặc định trắng: NX81-5, NX89-6 phiếu 89)."""

    def get_stroke_color(self, vmobject):
        if self.stroke_color:
            return self.stroke_color
        if vmobject.get_stroke_width() > 0:
            return vmobject.get_stroke_color()
        return vmobject.get_fill_color()


def hien(m, t=1.0):
    """Hiện phần tử như mực thấm dần (thay Create/FadeIn trực tiếp); viền thấm cùng màu tô (_ThamMuc)."""
    return _ThamMuc(m, run_time=t)


def ve(m, t=1.0):
    return Create(m, run_time=t)


def doi(a, b, t=0.9):
    return Transform(a, b, run_time=t)


def lat_trang(scene, giu=(), t=1.1):
    """Chuyển cảnh chính (trục 9): trang mới trượt từ phải sang, mép có bóng, phủ trang cũ."""
    giu_id = {id(m) for m in giu}
    cu = [m for m in scene.mobjects if id(m) not in giu_id]
    W, H = config.frame_width, config.frame_height
    trang = Rectangle(width=W + 0.2, height=H + 0.2).set_stroke(width=0).set_fill(GIAY, 1)
    bong = Rectangle(width=0.35, height=H + 0.2).set_stroke(width=0).set_fill(MUC, 0.18).next_to(trang, LEFT, buff=0)
    to = VGroup(bong, trang).move_to([W + 0.4, 0, 0])
    scene.add(to)
    scene.play(to.animate.move_to([-0.175, 0, 0]), run_time=t, rate_func=smooth)
    scene.remove(*cu, to)


def phu_lop(scene, mau=(CARBON, NHAN, SILUR), giu=(), t=1.2):
    """Chuyển cảnh phụ (trục 9): trầm tích phủ lớp từ dưới lên đến kín màn, rồi sang cảnh mới."""
    giu_id = {id(m) for m in giu}
    cu = [m for m in scene.mobjects if id(m) not in giu_id]
    W, H = config.frame_width, config.frame_height
    h = (H + 0.2) / len(mau)
    lop = [Rectangle(width=W + 0.2, height=h).set_stroke(MUC, 2.5, 1).set_fill(loang(c), 1).move_to([0, -H / 2 - h / 2 - 0.1, 0]) for c in mau]
    scene.add(*lop)
    scene.play(*[l.animate.move_to([0, -H / 2 - 0.1 + h * (i + 0.5), 0]) for i, l in enumerate(lop)],
               run_time=t, rate_func=rate_functions.ease_out_cubic)
    scene.remove(*cu, *lop)

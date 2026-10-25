# Module bản sắc K1 (nước / vật lý) — thế giới "bàn quang học trong studio chụp ảnh". Luật: E:\Studio\LUAT_BAN_SAC_KENH.md §2 cột K1.
# canh.py của K1 chỉ import module này và phải là MovingCameraScene (chuyển cảnh = zoom qua thang độ lớn).
# Cấu hình dưới đây được lint_bs4.py đọc bằng ast.literal_eval — giữ là literal thuần.
from manim import *
from ngon_ngu import VI, dich

PALETTE = ["#8E969D", "#A7ADB3", "#1C232B", "#3F6A9E", "#D1834F"]  # nền dưới, nền trên, mực, xanh nước, cam — màu v2 C13(10) 24/10 (cũ #1F6FD1 / #E8772E)
FONTS = ["Segoe UI", "Source Sans 3"]  # giấy phép: GIẢ THUYẾT, NC kiểm (luật §2)
CHO_PHEP_LUOI = False
VAT_THAT = []

NEN_DUOI, NEN_TREN, MUC, NUOC, CANG = PALETTE
FONT = FONTS[0]
FONT_VI = "Segoe UI"  # C11: phông bản VI (ban_sac/kiem_phong_vi.py)
if VI:
    FONT = FONT_VI


def nen(scene):
    """Phông studio chuyển sắc (trục 2: Y 149 → 172, nằm trong dải 140–175)."""
    scene.camera.background_color = NEN_DUOI
    W, H = config.frame_width, config.frame_height
    p = Rectangle(width=W * 6, height=H * 6).set_stroke(width=0)
    p.set_fill(color=[NEN_DUOI, NEN_TREN], opacity=1).set_sheen_direction(UP)
    p.set_z_index(-100)
    scene.add(p)
    return p


def chu(s, size=26, mau=MUC, op=1.0):
    """Sans nhân văn, chữ thường (trục 6) — không ép in hoa."""
    return Text(dich(s), font=FONT, font_size=size * 4, color=mau).scale(0.25).set_opacity(op)


def khoi(m, bong=(0.12, -0.12)):
    """Khối có bóng đổ (trục 3): bóng là bản sao mực, lệch xuống phải, opacity thấp."""
    s = m.copy().set_fill(MUC, 0.22).set_stroke(width=0).shift([bong[0], bong[1], 0]).set_z_index(m.z_index - 1)
    return VGroup(s, m)


def nuoc(m, mau=NUOC):
    """Nước trong suốt (trục 3): tô mờ, viền sáng hơn."""
    return m.set_fill(mau, 0.35).set_stroke(mau, 2.2, 0.9)


def bong_ban(w=9.0, y=-2.6):
    """Bóng mờ mặt bàn (trục 4) — không lưới."""
    return Ellipse(width=w, height=0.5).set_stroke(width=0).set_fill(MUC, 0.10).move_to([0, y, 0])


def nhan(diem, s, huong=UR, dai=1.0, mau=MUC):
    """Nhãn (trục 7): đường dẫn mảnh + chữ trần, KHÔNG khung."""
    a = np.array(diem, dtype=float)
    b = a + np.array(huong, dtype=float) / np.linalg.norm(huong) * dai
    ln = Line(a, b).set_stroke(mau, 1.4, 0.9)
    t = chu(s, 20, mau).next_to(b, huong, buff=0.08)
    return VGroup(Dot(a, radius=0.03, color=mau), ln, t)


def thuoc_kep(x0, x1, y, so, mau=MUC):
    """Số đo hiện bằng thước kẹp vẽ (trục 7): thân thước, hai ngàm, số đọc."""
    than = Line([x0 - 0.3, y + 0.35, 0], [x1 + 0.6, y + 0.35, 0]).set_stroke(mau, 3)
    n0 = Line([x0, y + 0.35, 0], [x0, y - 0.05, 0]).set_stroke(mau, 3)
    n1 = Line([x1, y + 0.35, 0], [x1, y - 0.05, 0]).set_stroke(mau, 3)
    doc = chu(so, 22, mau).next_to(than, UP, buff=0.1)
    return VGroup(than, n0, n1, doc)


def chu_thich_nguon(scene, s, le_phai=0.2, le_tren=0.15):
    """Nguồn trên màn (trục 8): chú thích nhỏ ở góc TRÊN PHẢI, bám theo khung camera.
    `le_phai`, `le_tren`: lề tới mép phải / mép trên của khung camera, đơn vị khung manim ở zoom 1
    (1 đơn vị = 135 px trên 1920x1080; mặc định 0,2 / 0,15 ≈ 27 / 20 px = hành vi cũ ở zoom 1; M1-M5 hiện không gọi hàm này, phiếu 54 mục 4).
    Ở MỌI zoom của khung camera (fr.width ≠ frame_width) lề giữ đúng số px đó: chỉ lề nhân theo zoom, còn nửa bề rộng / bề cao
    của chữ (đã scale theo khung ở dòng trên) không nhân nữa — sửa lề theo zoom, GĐ 20:20 27/09/2026 + NX54-3 phiếu 54
    (bản b6e2e07a chỉ đúng ở zoom 1: khung dọc zoom 0,6 lề phải âm, chữ tràn mép). Khung dọc 9:16 truyền lề lớn hơn để ra khỏi
    dải app (thay cho .shift ngoài module). Việc 5, GĐ 05:31 + 10:09 + 10:14 26/09/2026."""
    t = chu(s, 14, MUC, 0.75)
    fr = scene.camera.frame
    t.scale(fr.width / config.frame_width)
    t.move_to(fr.get_corner(UR) + np.array([-t.width / 2, -t.height / 2, 0]) + np.array([-le_phai, -le_tren, 0]) * fr.width / config.frame_width)
    return t


def so_hook(gia_tri, don_vi, mau=CANG):
    """Hook K1 (trục 10): một con số đo được đi kèm hiện tượng."""
    return VGroup(chu(gia_tri, 64, mau), chu(don_vi, 26, MUC, 0.8)).arrange(RIGHT, aligned_edge=DOWN, buff=0.15)


def hien(m, t=0.9):
    """Hiện phần tử (thay Create/FadeIn trực tiếp): mọc từ tâm, hợp với vật thể trên bàn."""
    return GrowFromCenter(m, run_time=t)


def ve(m, t=1.0):
    return Create(m, run_time=t)


def doi(a, b, t=0.8):
    return Transform(a, b, run_time=t)


def zoom_thang(scene, dich, he_so, t=1.6, don=()):
    """Chuyển cảnh chính (trục 9): zoom liên tục sang thang độ lớn khác, không cắt.
    `dich`: điểm hoặc mobject để lao tới; `he_so` < 1 là phóng vào. `don`: phần tử bỏ đi SAU khi đã ra khỏi khung."""
    fr = scene.camera.frame
    c = dich.get_center() if hasattr(dich, "get_center") else np.array(dich, dtype=float)
    scene.play(fr.animate.move_to(c).scale(he_so), run_time=t, rate_func=smooth)
    if don:
        scene.remove(*don)

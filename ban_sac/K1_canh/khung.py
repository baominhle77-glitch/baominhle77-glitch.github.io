"""Đặt khung hình TRƯỚC khi nạp K1_canh.loi (loi đọc config.frame_width/height lúc import, như canh_ml_doc.py dòng 21..24).
dat_doc(): 1080x1920, khung 8,0 x 14,222 (bản dọc 9:16). dat_ngang(): 1920x1080, khung 14,222 x 8,0 (bản ngang 16:9, mặc
định của manim). Cả hai trả về (frame_width, frame_height)."""
from manim import config
import K1_ban_quang_hoc  # noqa: F401  bản sắc kênh Meniscus Lab (BS-4(a))


def dat_doc():
    config.pixel_width = 1080
    config.pixel_height = 1920
    config.frame_width = 8.0
    config.frame_height = 8.0 * 1920 / 1080
    return config.frame_width, config.frame_height


def dat_ngang():
    config.pixel_width = 1920
    config.pixel_height = 1080
    config.frame_height = 8.0
    config.frame_width = 8.0 * 1920 / 1080
    return config.frame_width, config.frame_height

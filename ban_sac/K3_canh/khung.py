# Đặt khung hình TRƯỚC khi import K3_canh.loi (loi đọc config lúc import để chọn bố cục).
from manim import config


def dat_ngang():
    """16:9 — 1920×1080, khung 14.222×8.0 (bản YouTube)."""
    config.pixel_width, config.pixel_height = 1920, 1080
    config.frame_height = 8.0
    config.frame_width = 8.0 * 1920 / 1080
    return config.frame_width, config.frame_height


def dat_doc():
    """9:16 — 1080×1920, khung 8.0×14.222 (bản Facebook dọc; bố cục out/M2_UART/_doc/BO_CUC_DOC_9x16.md)."""
    config.pixel_width, config.pixel_height = 1080, 1920
    config.frame_width = 8.0
    config.frame_height = 8.0 * 1920 / 1080
    return config.frame_width, config.frame_height


def dat_theo_moi_truong():
    """Bố cục theo biến môi trường K3_BO_CUC (16x9 mặc định, 9x16 cho bản dọc) — nha_may đặt biến trước mỗi lượt render."""
    import os
    return dat_doc() if os.environ.get("K3_BO_CUC", "16x9") == "9x16" else dat_ngang()

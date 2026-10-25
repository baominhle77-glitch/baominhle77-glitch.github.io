# Cổng BS-4 (E:\Studio\LUAT_BAN_SAC_KENH.md §3): kiểm canh.py bằng AST, không grep tên lớp.
# Dùng: python lint_bs4.py <K1..K5> <đường dẫn canh.py>   -> exit 0 = ĐẠT, 1 = TRƯỢT
# Cấu hình kênh đọc bằng ast.literal_eval từ ban_sac/K<n>_*.py (không import):
#   PALETTE = ["#RRGGBB", ...]   FONTS = ["..."]   CHO_PHEP_LUOI = bool   VAT_THAT = ["tên hàm vẽ vật thể thật"]
import ast, glob, os, re, sys

HOAT_CANH_CAM = {"Create", "Write", "Transform", "FadeIn", "ReplacementTransform", "TransformMatchingTex",
                 "TransformMatchingShapes", "TransformFromCopy", "DrawBorderThenFill", "Circumscribe"}
MAU_MANIM = re.compile(r"^(WHITE|BLACK|GR[AE]Y|RED|BLUE|GREEN|YELLOW|GOLD|TEAL|MAROON|PURPLE|PINK|ORANGE|"
                       r"(LIGHT|DARK|PURE)_\w+)(_[A-E])?$")
HEX = re.compile(r"#[0-9A-Fa-f]{6}\b")


def cau_hinh(kenh):
    ds = glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), kenh + "_*.py"))
    if len(ds) != 1:
        return None, ds
    cfg = {}
    for n in ast.parse(open(ds[0], encoding="utf-8").read()).body:
        if isinstance(n, ast.Assign) and len(n.targets) == 1 and isinstance(n.targets[0], ast.Name):
            if n.targets[0].id in ("PALETTE", "FONTS", "CHO_PHEP_LUOI", "VAT_THAT"):
                cfg[n.targets[0].id] = ast.literal_eval(n.value)
    return cfg, ds


def ten(f):
    return f.id if isinstance(f, ast.Name) else f.attr if isinstance(f, ast.Attribute) else None


def co_self_mobjects(node):
    return any(isinstance(x, ast.Attribute) and x.attr == "mobjects" for x in ast.walk(node))


def main(kenh, duong):
    src = open(duong, encoding="utf-8").read()
    tree = ast.parse(src)
    cfg, ds = cau_hinh(kenh)
    loi = []  # (mục, dòng, mô tả)
    # (a) import module kênh
    ban_sac_imports = []
    for n in ast.walk(tree):
        if isinstance(n, ast.ImportFrom) and n.module:
            ban_sac_imports.append((n.lineno, n.module))
        elif isinstance(n, ast.Import):
            ban_sac_imports += [(n.lineno, a.name) for a in n.names]
    # (a) theo GĐ 18:5x 18/10 (phiếu 83 NX83-8): TRƯỢT chỉ khi import module của kênh khác (ban_sac/K<m>_*.py hoặc
    # gói ban_sac/K<m>_canh, m != kênh đang kiểm, xét mọi đoạn của tên module); tệp không import module kênh nào vẫn đạt (a).
    for l, m in ban_sac_imports:
        kenh_m = [x[:2] for x in m.split(".") if re.match(r"^K\d_", x)]
        if any(k != kenh for k in kenh_m):
            loi.append(("a", l, f"import module kênh khác: {m}"))
    if cfg is None:
        loi.append(("a", 0, f"không tìm thấy đúng 1 file ban_sac/{kenh}_*.py (thấy {len(ds)}) -> không kiểm được (e) cho phép lưới và (f) bảng màu/phông"))
        cfg = {}
    vat_that = set(cfg.get("VAT_THAT", []))
    # hằng chuỗi cấp module (vd F = "Bahnschrift") để giải tên phông gián tiếp
    hang = {n.targets[0].id: n.value.value for n in tree.body if isinstance(n, ast.Assign) and len(n.targets) == 1
            and isinstance(n.targets[0], ast.Name) and isinstance(n.value, ast.Constant) and isinstance(n.value.value, str)}

    def gia_tri_phong(v):
        if isinstance(v, ast.Constant) and isinstance(v.value, str):
            return [v.value]
        if isinstance(v, ast.Name) and v.id in hang:
            return [hang[v.id]]
        if isinstance(v, ast.Dict):
            return [p for vv in v.values for p in gia_tri_phong(vv)]
        return []
    # đi theo từng hàm để biết ngữ cảnh
    for fn in [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))] + [tree]:
        body_nodes = fn.body if fn is not tree else [s for s in tree.body if not isinstance(s, (ast.FunctionDef, ast.ClassDef))]
        fname = getattr(fn, "name", "<module>")
        # (c) biến bị "nhiễm" self.mobjects trong hàm
        nhiem = set()
        for s in body_nodes:
            for x in ast.walk(s):
                if isinstance(x, ast.Assign) and co_self_mobjects(x.value):
                    nhiem |= {t.id for t in x.targets if isinstance(t, ast.Name)}
        for s in body_nodes:
            for x in ast.walk(s):
                if not isinstance(x, ast.Call):
                    continue
                t = ten(x.func)
                # (b) khung bo góc
                if fname not in vat_that:
                    bo_goc = t == "RoundedRectangle" or any(
                        k.arg == "corner_radius" and not (isinstance(k.value, ast.Constant) and k.value.value in (0, 0.0))
                        for k in x.keywords)
                    if bo_goc:
                        loi.append(("b", x.lineno, f"khung bo góc `{t}` trong hàm `{fname}` (không khai trong VAT_THAT)"))
                # (c) làm mờ toàn màn
                if t == "play" or t in ("FadeOut", "FadeIn", "AnimationGroup", "LaggedStart"):
                    for sub in ast.walk(x):
                        if isinstance(sub, (ast.ListComp, ast.GeneratorExp)) and ten(getattr(sub.elt, "func", None)) in ("FadeOut", "FadeIn"):
                            it = sub.generators[0].iter
                            if co_self_mobjects(it) or (isinstance(it, ast.Name) and it.id in nhiem):
                                loi.append(("c", x.lineno, f"làm mờ mọi phần tử (lặp trên self.mobjects) trong `{fname}`"))
                                break
                        if isinstance(sub, ast.Call) and ten(sub.func) in ("FadeOut", "FadeIn") and any(
                                co_self_mobjects(a) or (isinstance(a, ast.Starred) and isinstance(a.value, ast.Name) and a.value.id in nhiem)
                                for a in sub.args):
                            loi.append(("c", x.lineno, f"làm mờ toàn màn trong `{fname}`"))
                            break
                # (d) hoạt cảnh mặc định gọi trực tiếp
                if t in HOAT_CANH_CAM:
                    loi.append(("d", x.lineno, f"gọi trực tiếp `{t}`"))
                # (e) lưới
                if not cfg.get("CHO_PHEP_LUOI", False):
                    if t == "NumberPlane" or any(k.arg == "background_line_style" for k in x.keywords):
                        loi.append(("e", x.lineno, f"lưới `{t}`"))
                # (f) phông
                for k in x.keywords:
                    if k.arg in ("font", "t2f"):
                        for ph in gia_tri_phong(k.value):
                            if ph not in cfg.get("FONTS", []):
                                loi.append(("f", x.lineno, f"phông ngoài bảng kênh: {ph!r}"))
            # (e) đường song song sinh bằng vòng lặp
            if not cfg.get("CHO_PHEP_LUOI", False):
                for x in ast.walk(s):
                    if isinstance(x, (ast.ListComp, ast.GeneratorExp)) and ten(getattr(x.elt, "func", None)) in ("Line", "DashedLine") \
                            and ten(getattr(x.generators[0].iter, "func", None)) in ("range", "arange", "linspace"):
                        loi.append(("e", x.lineno, f"đường song song sinh bằng vòng lặp trong `{fname}` (lưới/vạch)"))
    # (f) mã màu và tên màu Manim
    pal = {c.upper() for c in cfg.get("PALETTE", [])}
    hex_ngoai = {}
    for x in ast.walk(tree):
        if isinstance(x, ast.Constant) and isinstance(x.value, str):
            for h in HEX.findall(x.value):
                if h.upper() not in pal:
                    hex_ngoai.setdefault(h.upper(), x.lineno)
        if isinstance(x, ast.Name) and isinstance(x.ctx, ast.Load) and MAU_MANIM.match(x.id):
            loi.append(("f", x.lineno, f"màu mặc định Manim `{x.id}`"))
    for h, l in sorted(hex_ngoai.items(), key=lambda kv: kv[1]):
        loi.append(("f", l, f"mã màu ngoài bảng kênh: {h}"))
    # gộp trùng (một lệnh có thể bị bắt ở cả hàm lẫn module)
    loi = sorted(set(loi), key=lambda r: (r[0], r[1]))
    dem = {}
    for m, l, d in loi:
        dem[m] = dem.get(m, 0) + 1
        print(f"({m}) dòng {l}: {d}")
    print(f"BS-4 {kenh} {duong}: {'ĐẠT' if not loi else 'TRƯỢT'}  " + " ".join(f"{k}={v}" for k, v in sorted(dem.items())))
    return 0 if not loi else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    # đường dẫn là thư mục (vd ban_sac/K4_canh) -> kiểm mọi tệp .py trong đó, kể cả khung.py (NX83-8); exit 1 nếu có tệp trượt
    if os.path.isdir(sys.argv[2]):
        tep = sorted(glob.glob(os.path.join(sys.argv[2], "*.py")))
        rc = max([main(sys.argv[1], t) for t in tep] or [1])
        print(f"BS-4 {sys.argv[1]} thư mục {sys.argv[2]}: {len(tep)} tệp, {'ĐẠT' if rc == 0 else 'TRƯỢT'}")
        sys.exit(rc)
    sys.exit(main(sys.argv[1], sys.argv[2]))

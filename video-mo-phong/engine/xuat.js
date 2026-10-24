// Xuất video từng khung, nhanh hơn thời gian thực khi máy đủ mạnh, không giới hạn độ dài:
// với i = 0..N-1: t = i/fps → vẽ → VideoFrame → VideoEncoder (WebCodecs) → mp4-muxer (MIT, vendor/).
// Âm thanh: tệp giọng đọc giải mã bằng Web Audio → AudioEncoder → cùng muxer. Không dùng MediaRecorder.

const UNG_VIEN_HINH = [
  { codec: "avc1.640028", muxer: "avc", ten: "H.264 High" },
  { codec: "avc1.4d0028", muxer: "avc", ten: "H.264 Main" },
  { codec: "vp09.00.40.08", muxer: "vp9", ten: "VP9" },
  { codec: "av01.0.08M.08", muxer: "av1", ten: "AV1" }
];
const UNG_VIEN_TIENG = [
  { codec: "mp4a.40.2", muxer: "aac", ten: "AAC" },
  { codec: "opus", muxer: "opus", ten: "Opus" }
];

export function hoTroXuat() {
  return typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined" && typeof window.Mp4Muxer !== "undefined";
}

export async function chonCodecHinh(W, H, fps, bitrate) {
  for (const c of UNG_VIEN_HINH) {
    const cfg = { codec: c.codec, width: W, height: H, bitrate, framerate: fps };
    if (c.muxer === "avc") cfg.avc = { format: "avc" };
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return { ...c, cfg }; } catch (_) { /* thử codec sau */ }
  }
  return null;
}

async function chonCodecTieng(sampleRate, kenh) {
  if (typeof AudioEncoder === "undefined") return null;
  for (const c of UNG_VIEN_TIENG) {
    const cfg = { codec: c.codec, sampleRate, numberOfChannels: kenh, bitrate: 128000 };
    try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) return { ...c, cfg }; } catch (_) { /* thử codec sau */ }
  }
  return null;
}

// Giải mã tệp giọng (mp3/wav/ogg/m4a) thành AudioBuffer 48 kHz
export async function giaiMaGiong(arrayBuffer) {
  const ac = new OfflineAudioContext(1, 48000, 48000);
  return ac.decodeAudioData(arrayBuffer.slice(0));
}

// Đọc mốc từ: words.json kiểu [{text|word, start|offset, end|duration}], hoặc phụ đề SRT/VTT
export function docMocTu(noiDung) {
  const s = String(noiDung).trim();
  if (s.startsWith("[") || s.startsWith("{")) {
    let j = JSON.parse(s);
    if (!Array.isArray(j)) j = j.words || j.tu || j.items || [];
    const toS = (v) => (v > 1e5 ? v / 1e7 : v > 600 ? v / 1000 : v); // ticks 100 ns (edge-tts) / ms / giây
    return j.map((w) => {
      const text = w.text ?? w.word ?? w.tu;
      const start = toS(Number(w.start ?? w.offset ?? w.bd));
      const end = w.end != null ? toS(Number(w.end)) : start + toS(Number(w.duration ?? 0.3));
      return w.beat ? { text: String(text), start, end, beat: String(w.beat) } : { text: String(text), start, end };
    }).filter((w) => w.text && Number.isFinite(w.start));
  }
  const ts = (x) => { const [h, m, r] = x.replace(",", ".").split(":"); return Number(h) * 3600 + Number(m) * 60 + Number(r); };
  const out = [];
  const re = /(\d+:\d+:\d+[.,]\d+)\s*-->\s*(\d+:\d+:\d+[.,]\d+)[^\n]*\n([\s\S]*?)(?:\n\s*\n|$)/g;
  let m;
  while ((m = re.exec(s + "\n\n"))) {
    const a = ts(m[1]); const b = ts(m[2]);
    const tu = m[3].replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean);
    tu.forEach((w, i) => out.push({ text: w, start: a + ((b - a) * i) / tu.length, end: a + ((b - a) * (i + 1)) / tu.length }));
  }
  return out;
}

// veKhung(ctx, t) vẽ một khung lên canvas đã cho. Trả về {buffer, codec, thongKe}
export async function xuatMp4({ W, H, fps, thoiLuong, veKhung, giong = null, bitrate, onTienTrinh, huy }) {
  if (!hoTroXuat()) throw new Error("Trình duyệt này chưa hỗ trợ WebCodecs. Hãy dùng Chrome hoặc Edge bản mới.");
  const br = bitrate || (W * H >= 1920 * 1080 ? 10e6 : 6e6);
  const hinh = await chonCodecHinh(W, H, fps, br);
  if (!hinh) throw new Error("Không có bộ mã hoá video phù hợp trong trình duyệt này.");
  const tieng = giong ? await chonCodecTieng(giong.sampleRate, 1) : null;

  const { Muxer, ArrayBufferTarget } = window.Mp4Muxer;
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: hinh.muxer, width: W, height: H, frameRate: fps },
    audio: tieng ? { codec: tieng.muxer, sampleRate: giong.sampleRate, numberOfChannels: 1 } : undefined,
    fastStart: "in-memory",
    firstTimestampBehavior: "offset"
  });

  let loi = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { loi = e; } });
  enc.configure(hinh.cfg);

  const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H });
  const ctx = canvas.getContext("2d", { alpha: false });
  const N = Math.round(thoiLuong * fps);
  const batDau = performance.now();
  for (let i = 0; i < N; i++) {
    if (huy && huy.aborted) { enc.close(); throw new DOMException("Đã huỷ xuất video", "AbortError"); }
    if (loi) throw loi;
    veKhung(ctx, i / fps);
    const f = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
    enc.encode(f, { keyFrame: i % (fps * 2) === 0 });
    f.close();
    while (enc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 1));
    if (onTienTrinh && (i % 10 === 0 || i === N - 1)) onTienTrinh((i + 1) / N, i + 1, N);
  }
  await enc.flush();
  enc.close();

  if (tieng) {
    const aenc = new AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: (e) => { loi = e; } });
    aenc.configure(tieng.cfg);
    const data = giong.getChannelData(0);
    const sr = giong.sampleRate;
    const het = Math.min(data.length, Math.round(thoiLuong * sr));
    const buoc = 1024;
    for (let s = 0; s < het; s += buoc) {
      const n = Math.min(buoc, het - s);
      const ad = new AudioData({ format: "f32-planar", sampleRate: sr, numberOfFrames: n, numberOfChannels: 1, timestamp: Math.round((s * 1e6) / sr), data: data.slice(s, s + n) });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush(); aenc.close();
  }
  if (loi) throw loi;
  muxer.finalize();
  const giay = (performance.now() - batDau) / 1000;
  return {
    buffer: target.buffer,
    codec: hinh.ten + (tieng ? " + " + tieng.ten : ""),
    thongKe: { fps_dat: fps, so_khung: N, thoi_gian_xuat_giay: +giay.toFixed(2), thoi_luong_video_giay: +(N / fps).toFixed(3), ti_le_nhanh_hon_thuc: +((N / fps) / giay).toFixed(3), codec_hinh: hinh.codec, codec_tieng: tieng ? tieng.codec : null }
  };
}

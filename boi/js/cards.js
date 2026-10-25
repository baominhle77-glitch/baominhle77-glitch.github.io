// Mặt lá vẽ bằng SVG, riêng từng lá: màu theo nguyên tố/chất, số La Mã, biểu tượng, bố cục chất theo số.
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pad = (n) => String(n).padStart(2, "0");

export const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

const EL = {
  fire: { bg: ["#43121a", "#8a2a1c"], ac: "#ffb15e", glow: "#ff7a3d" },
  water: { bg: ["#0b1c3c", "#1a4f86"], ac: "#9fd6ff", glow: "#58a8ff" },
  air: { bg: ["#1c1a40", "#4b4592"], ac: "#e3dcff", glow: "#b6a8ff" },
  earth: { bg: ["#122a1b", "#3a5b2c"], ac: "#ead27e", glow: "#c9b25a" },
};
const MAJOR_EL = ["air", "air", "water", "earth", "fire", "earth", "air", "water", "fire", "earth", "fire", "air", "water", "water", "fire", "earth", "fire", "air", "water", "fire", "fire", "earth"];
const SUIT_EL = { wands: "fire", cups: "water", swords: "air", pentacles: "earth" };

const SUIT = {
  wands: `<g transform="rotate(-18)"><rect x="-2.6" y="-13" width="5.2" height="26" rx="2.6" fill="#9a6431"/><circle cx="-4.5" cy="-7" r="2.8" fill="#79c25a"/><circle cx="4.5" cy="-1" r="2.8" fill="#79c25a"/><circle cx="-4.2" cy="6" r="2.4" fill="#79c25a"/></g>`,
  cups: `<path d="M-10-11h20q0 12-10 14q-10-2-10-14z" fill="#4c86d6" stroke="#cfe6ff" stroke-width=".8"/><rect x="-1.7" y="3" width="3.4" height="6.5" fill="#d8b154"/><rect x="-6.5" y="9.2" width="13" height="2.8" rx="1.3" fill="#d8b154"/>`,
  swords: `<path d="M0-14l3.2 5.4v15h-6.4v-15z" fill="#d7dee8" stroke="#8d9bb0" stroke-width=".6"/><rect x="-7.5" y="5.6" width="15" height="2.8" rx="1.3" fill="#d8b154"/><rect x="-1.5" y="8.2" width="3" height="6.4" fill="#7a5532"/>`,
  pentacles: `<circle r="11.5" fill="#e8c35a" stroke="#8d6c1c" stroke-width="1.2"/><path d="M0-8.6l2.5 7.7h8.1l-6.5 4.8 2.5 7.7L0 6.8l-6.6 4.8 2.5-7.7-6.5-4.8h8.1z" fill="none" stroke="#6e5212" stroke-width="1.2"/>`,
};
const PIPS = {
  2: [[60, 66], [60, 128]],
  3: [[60, 60], [60, 97], [60, 134]],
  4: [[40, 66], [80, 66], [40, 128], [80, 128]],
  5: [[40, 64], [80, 64], [60, 97], [40, 130], [80, 130]],
  6: [[40, 60], [80, 60], [40, 97], [80, 97], [40, 134], [80, 134]],
  7: [[40, 60], [80, 60], [60, 78], [40, 97], [80, 97], [40, 134], [80, 134]],
  8: [[40, 60], [80, 60], [60, 78], [40, 97], [80, 97], [60, 116], [40, 134], [80, 134]],
  9: [[40, 56], [80, 56], [40, 82], [80, 82], [60, 97], [40, 112], [80, 112], [40, 138], [80, 138]],
  10: [[40, 56], [80, 56], [60, 69], [40, 82], [80, 82], [40, 112], [80, 112], [60, 125], [40, 138], [80, 138]],
};
const COURT = {
  11: { label: "PAGE", glyph: `<path d="M0-9l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L0 5.3-5.9 9l1.7-6.7-5.3-4.4 6.9-.5z" fill="currentColor"/>` },
  12: { label: "KNIGHT", glyph: `<path d="M-8-9h16v7q0 9-8 13q-8-4-8-13z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M-4-3h8" stroke="currentColor" stroke-width="2"/>` },
  13: { label: "QUEEN", glyph: `<path d="M-10 6l-2-13 7 6 5-9 5 9 7-6-2 13z" fill="currentColor"/><circle cx="0" cy="-12" r="1.8" fill="currentColor"/>` },
  14: { label: "KING", glyph: `<path d="M-12 7l-1-15 6 6 3-9 4 8 4-8 3 9 6-6-1 15z" fill="currentColor"/><rect x="-12" y="7" width="24" height="3" fill="currentColor"/>` },
};

// Chất bài tây truyền thống in trên lá Lenormand
const LEN_PLAY = ["9♥", "6♦", "10♠", "K♥", "7♥", "K♣", "Q♣", "9♦", "Q♠", "J♦", "J♣", "7♦", "J♠", "9♣", "10♣", "6♥", "Q♥", "10♥", "6♠", "8♠", "8♣", "Q♦", "7♣", "J♥", "A♣", "10♦", "7♠", "A♥", "A♠", "K♠", "A♦", "8♥", "8♦", "K♦", "9♠", "6♣"];

function frame(id, bg, ac) {
  return `<defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[1]}"/><stop offset="1" stop-color="${bg[0]}"/></linearGradient>
  <radialGradient id="h${id}" cx=".5" cy=".46" r=".5"><stop offset="0" stop-color="${ac}" stop-opacity=".55"/><stop offset="1" stop-color="${ac}" stop-opacity="0"/></radialGradient></defs>
  <rect x="1" y="1" width="118" height="198" rx="9" fill="url(#g${id})" stroke="${ac}" stroke-width="1.6"/>
  <rect x="6" y="6" width="108" height="188" rx="6" fill="none" stroke="${ac}" stroke-opacity=".55" stroke-width=".8"/>`;
}
function stars(seed, ac) {
  let s = "", x = seed * 9301 + 49297;
  for (let i = 0; i < 7; i++) {
    x = (x * 9301 + 49297) % 233280;
    const cx = 14 + (x % 92), cy = 34 + ((x >> 3) % 110);
    s += `<circle cx="${cx}" cy="${cy}" r="${0.6 + (i % 3) * 0.35}" fill="${ac}" opacity=".7"/>`;
  }
  return s;
}
function nameBlock(en, vi, ac) {
  const small = en.length > 15 ? 9.5 : 11;
  return `<text x="60" y="171" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-weight="700" font-size="${small}" fill="${ac}">${esc(en)}</text>
  <text x="60" y="185" text-anchor="middle" font-family="Be Vietnam Pro, system-ui, sans-serif" font-size="8.4" fill="#f3ecff" opacity=".9">${esc(vi)}</text>`;
}

export function tarotSVG(card, { n = null, rev = false } = {}) {
  const el = card.nhom === "major" ? MAJOR_EL[card.so] : SUIT_EL[card.chat];
  const P = EL[el];
  const id = `t${card.id}${rev ? "r" : ""}`;
  let art = "", tag = "";
  if (card.nhom === "major") {
    tag = ROMAN[card.so];
    const rays = 8 + (card.so % 5) * 2;
    let r = "";
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      r += `<line x1="${60 + Math.cos(a) * 30}" y1="${97 + Math.sin(a) * 30}" x2="${60 + Math.cos(a) * (40 + (i % 2) * 6)}" y2="${97 + Math.sin(a) * (40 + (i % 2) * 6)}" stroke="${P.ac}" stroke-width="1" stroke-opacity=".55"/>`;
    }
    art = `<circle cx="60" cy="97" r="46" fill="url(#h${id})"/>${r}<circle cx="60" cy="97" r="28" fill="none" stroke="${P.ac}" stroke-width="1.2"/>
      <text x="60" y="110" text-anchor="middle" font-size="36">${card.bieu_tuong}</text>`;
  } else if (card.so === 1) {
    tag = "ACE";
    art = `<circle cx="60" cy="97" r="44" fill="url(#h${id})"/><g transform="translate(60 97) scale(2.6)">${SUIT[card.chat]}</g>`;
  } else if (card.so <= 10) {
    tag = String(card.so);
    const sc = card.so >= 9 ? 0.82 : card.so >= 7 ? 0.95 : 1.1;
    art = `<circle cx="60" cy="97" r="44" fill="url(#h${id})" opacity=".6"/>` + PIPS[card.so].map(([x, y]) => `<g transform="translate(${x} ${y}) scale(${sc})">${SUIT[card.chat]}</g>`).join("");
  } else {
    const ct = COURT[card.so];
    tag = ct.label;
    art = `<circle cx="60" cy="97" r="44" fill="url(#h${id})"/><g transform="translate(60 74) scale(1.5)" color="${P.ac}">${ct.glyph}</g><g transform="translate(60 112) scale(1.9)">${SUIT[card.chat]}</g>`;
  }
  return `<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(card.vi)}${rev ? " (ngược)" : ""}">
  ${frame(id, P.bg, P.ac)}${stars(card.id + 3, P.ac)}
  <text x="14" y="24" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="${P.ac}">${n != null ? pad(n) : ""}</text>
  <text x="106" y="24" text-anchor="end" font-family="Cormorant Garamond, Georgia, serif" font-size="12" font-weight="700" fill="${P.ac}">${tag}</text>
  <g${rev ? ' transform="rotate(180 60 97)"' : ""}>${art}</g>
  ${nameBlock(card.en, card.vi, P.ac)}
  ${rev ? `<text x="60" y="152" text-anchor="middle" font-size="8" font-weight="700" fill="#ff9a9a" letter-spacing="1">NGƯỢC</text>` : ""}
  </svg>`;
}

export function lenormandSVG(card, { n = null } = {}) {
  const play = LEN_PLAY[card.id - 1];
  const red = /[♥♦]/.test(play);
  const id = `l${card.id}`;
  const ac = "#f0d58a";
  return `<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(card.vi)}">
  ${frame(id, ["#1b2340", "#33467a"], ac)}${stars(card.id + 91, "#cfe0ff")}
  <text x="14" y="24" font-family="ui-monospace, monospace" font-size="10" font-weight="700" fill="${ac}">${n != null ? pad(n) : ""}</text>
  <rect x="84" y="12" width="26" height="17" rx="3" fill="#fbf6ea"/>
  <text x="97" y="25" text-anchor="middle" font-family="Georgia, serif" font-size="11" font-weight="700" fill="${red ? "#c0262d" : "#1d1d2b"}">${play}</text>
  <circle cx="60" cy="96" r="40" fill="url(#h${id})"/>
  <circle cx="60" cy="96" r="30" fill="none" stroke="${ac}" stroke-opacity=".6" stroke-dasharray="2 3"/>
  <text x="60" y="110" text-anchor="middle" font-size="38">${card.bieu_tuong}</text>
  <text x="60" y="146" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="13" font-weight="700" fill="${ac}">${card.id}</text>
  ${nameBlock(card.en, card.vi, ac)}
  </svg>`;
}

export function backSVG(label = "") {
  return `<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs><pattern id="bp" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="#1f1640"/><path d="M8 2l1.6 4.4L14 8l-4.4 1.6L8 14l-1.6-4.4L2 8l4.4-1.6z" fill="#3a2b6e"/></pattern></defs>
  <rect x="1" y="1" width="118" height="198" rx="9" fill="url(#bp)" stroke="#d9b866" stroke-width="1.6"/>
  <rect x="8" y="8" width="104" height="184" rx="6" fill="none" stroke="#d9b866" stroke-opacity=".5"/>
  <circle cx="60" cy="100" r="24" fill="#140e2c" stroke="#d9b866"/><path d="M66 88a14 14 0 1 0 0 24a11 11 0 1 1 0-24z" fill="#e9cf86"/>
  ${label ? `<text x="60" y="170" text-anchor="middle" font-family="ui-monospace, monospace" font-size="15" font-weight="700" fill="#e9cf86">${esc(label)}</text>` : ""}
  </svg>`;
}

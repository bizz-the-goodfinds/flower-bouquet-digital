// Hand-tuned SVG artwork for every flower, greenery sprig, wrapper and ribbon.
// Everything returns SVG markup strings so the same art renders in React,
// in the dynamic Open Graph image (Satori) and in client-side PNG export.

export const INK = "#2B2420";
const STEM = "#6E9C63";
const S = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const s = (w: number) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const f = (n: number) => Math.round(n * 10) / 10;

function ring(n: number, offset: number, draw: (i: number) => string) {
  let out = "";
  for (let i = 0; i < n; i++) out += `<g transform="rotate(${f(offset + (360 / n) * i)})">${draw(i)}</g>`;
  return out;
}

function phyllo(n: number, spread: number, draw: (x: number, y: number, i: number) => string) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const r = spread * Math.sqrt(i + 0.5);
    const a = i * 2.39996;
    out += draw(f(r * Math.cos(a)), f(r * Math.sin(a)), i);
  }
  return out;
}

// Petal shapes, drawn from the origin pointing up (-y).
const pointed = (len: number, w: number) =>
  `M0 0 C${f(w)} ${f(-len * 0.25)} ${f(w * 0.7)} ${f(-len * 0.85)} 0 ${f(-len)} C${f(-w * 0.7)} ${f(-len * 0.85)} ${f(-w)} ${f(-len * 0.25)} 0 0Z`;
const rounded = (len: number, w: number) =>
  `M0 0 C${f(w * 0.9)} ${f(-len * 0.15)} ${f(w * 1.05)} ${f(-len * 0.95)} 0 ${f(-len)} C${f(-w * 1.05)} ${f(-len * 0.95)} ${f(-w * 0.9)} ${f(-len * 0.15)} 0 0Z`;
const notched = (len: number, w: number) =>
  `M0 0 C${f(w)} ${f(-len * 0.3)} ${f(w)} ${f(-len * 0.9)} ${f(w * 0.5)} ${f(-len)} L0 ${f(-len * 0.86)} L${f(-w * 0.5)} ${f(-len)} C${f(-w)} ${f(-len * 0.9)} ${f(-w)} ${f(-len * 0.3)} 0 0Z`;

function scallop(r: number, n: number, amp: number) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 0.5) / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    if (i === 0) d += `M${f(r * Math.cos(a0))} ${f(r * Math.sin(a0))}`;
    d += ` Q${f((r + amp) * Math.cos(a1))} ${f((r + amp) * Math.sin(a1))} ${f(r * Math.cos(a2))} ${f(r * Math.sin(a2))}`;
  }
  return d + "Z";
}

type Tone = { base: string; dark: string; light: string };

// ---------- Flower heads (centered on the origin) ----------

export const heads = {
  rose: (c: Tone) =>
    ring(5, 36, () => `<path d="${rounded(58, 36)}" fill="${c.dark}" ${S}/>`) +
    ring(5, 0, () => `<path d="${rounded(62, 38)}" fill="${c.base}" ${S}/>`) +
    `<circle r="40" fill="${c.base}" ${S}/>` +
    `<path d="M-4 -2 C-12 -14 6 -22 14 -10 C22 2 8 18 -8 14 C-26 10 -26 -16 -8 -26 C10 -36 34 -24 32 0 C30 20 10 32 -12 30" fill="none" stroke="${c.dark}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M-30 -8 C-28 -24 -18 -32 -8 -34" fill="none" stroke="${c.light}" stroke-width="3" stroke-linecap="round"/>`,

  tulip: (c: Tone) =>
    `<path d="M-30 10 C-36 -40 -16 -70 0 -82 C16 -70 36 -40 30 10 C20 26 -20 26 -30 10Z" fill="${c.dark}" ${S}/>` +
    `<path d="M0 24 C-40 22 -46 -30 -30 -68 C-12 -44 4 -20 6 10Z" fill="${c.base}" ${S}/>` +
    `<path d="M0 24 C40 22 46 -30 30 -68 C12 -44 -4 -20 -6 10Z" fill="${c.base}" ${S}/>` +
    `<path d="M-18 22 C-26 -10 -10 -46 0 -60 C10 -46 26 -10 18 22 C8 30 -8 30 -18 22Z" fill="${c.light}" ${S}/>`,

  sunflower: () =>
    ring(18, 10, () => `<path d="${pointed(76, 15)}" fill="#E9A93A" ${S}/>`) +
    ring(18, 0, () => `<path d="${pointed(68, 15)}" fill="#F6C343" ${S}/>`) +
    `<circle r="30" fill="#6B3E26" ${S}/>` +
    phyllo(46, 3.9, (x, y) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#3E2416"/>`),

  daisy: (petal: string, center: string, dot: string) =>
    ring(16, 0, () => `<path d="${pointed(54, 10)}" fill="${petal}" ${S}/>`) +
    `<circle r="15" fill="${center}" ${S}/>` +
    phyllo(14, 3, (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${dot}"/>`),

  gerbera: (c: Tone) =>
    ring(20, 9, () => `<path d="${pointed(64, 11)}" fill="${c.dark}" ${S}/>`) +
    ring(20, 0, () => `<path d="${pointed(57, 11)}" fill="${c.base}" ${S}/>`) +
    `<circle r="19" fill="#5B3A1E" ${S}/>` +
    `<circle r="10" fill="#3A2414"/>`,

  peony: (c: Tone) =>
    ring(8, 0, () => `<path d="${rounded(72, 44)}" fill="${c.light}" ${S}/>`) +
    ring(7, 20, () => `<path d="${rounded(56, 36)}" fill="${c.base}" ${S}/>`) +
    ring(6, 45, () => `<path d="${rounded(38, 26)}" fill="${c.base}" ${S}/>`) +
    ring(5, 10, () => `<path d="${rounded(22, 16)}" fill="${c.dark}" ${S}/>`) +
    `<circle r="6" fill="${c.dark}"/>`,

  lavender: () => {
    let out = `<path d="M0 0 L0 -150" stroke="${STEM}" stroke-width="4" stroke-linecap="round"/>`;
    for (let k = 0; k < 12; k++) {
      const y = -14 - k * 11.5;
      const z = 1 - k / 18;
      const fill = k % 2 ? "#B59BE6" : "#9C7FD3";
      out +=
        `<ellipse cx="${f(-6 * z)}" cy="${f(y)}" rx="${f(7 * z)}" ry="${f(10 * z)}" transform="rotate(-18 ${f(-6 * z)} ${f(y)})" fill="${fill}" ${s(1.6)}/>` +
        `<ellipse cx="${f(6 * z)}" cy="${f(y - 5)}" rx="${f(7 * z)}" ry="${f(10 * z)}" transform="rotate(18 ${f(6 * z)} ${f(y - 5)})" fill="${fill}" ${s(1.6)}/>`;
    }
    return out;
  },

  babysBreath: () => {
    const pts: [number, number][] = [[-44, -52], [-16, -76], [20, -66], [48, -40], [2, -36], [-60, -18], [58, -12], [-28, -24], [30, -28]];
    let out = "";
    for (const [x, y] of pts)
      out += `<path d="M0 0 Q${f(x * 0.3)} ${f(y * 0.6)} ${x} ${y}" fill="none" stroke="#7E9C6E" stroke-width="2" stroke-linecap="round"/>`;
    for (const [x, y] of pts)
      out += [[0, 0], [7, -4], [-6, -5], [2, -10]]
        .map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="5.2" fill="#FFFFFF" ${s(1.4)}/>`)
        .join("");
    return out;
  },

  forgetMeNot: () => {
    const pts: [number, number][] = [[0, -20], [-30, -10], [28, -8], [-14, -46], [16, -44], [-40, -36], [40, -34]];
    let out = "";
    for (const [x, y] of pts)
      out += `<path d="M0 0 Q${f(x * 0.2)} ${f(y * 0.5)} ${x} ${y}" fill="none" stroke="#7E9C6E" stroke-width="2"/>`;
    for (const [x, y] of pts)
      out +=
        `<g transform="translate(${x} ${y})">` +
        ring(5, 0, () => `<path d="${rounded(11, 7)}" fill="#86ABE6" ${s(1.4)}/>`) +
        `<circle r="3" fill="#F4D35E" ${s(1)}/></g>`;
    return out;
  },

  cherryBlossom: () => {
    const blossoms: [number, number, number][] = [[-30, -40, 0.9], [18, -62, 1], [36, -18, 0.8]];
    let out = `<path d="M0 0 C-6 -20 -20 -30 -30 -40 M-8 -18 C4 -34 12 -48 18 -62 M-4 -10 C14 -12 26 -14 36 -18" fill="none" stroke="#6B4A3A" stroke-width="4" stroke-linecap="round"/>`;
    for (const [x, y, z] of blossoms)
      out +=
        `<g transform="translate(${x} ${y}) scale(${z})">` +
        ring(5, 0, () => `<path d="${notched(22, 13)}" fill="#F9C9D6" ${s(1.6)}/>`) +
        `<circle r="5" fill="#E57A9A" ${s(1.2)}/></g>`;
    return out;
  },

  hydrangea: (c: Tone) =>
    `<circle r="62" fill="${c.dark}" ${S}/>` +
    phyllo(30, 10.4, (x, y, i) =>
      `<g transform="translate(${x} ${y})">` +
      ring(4, i * 13, () => `<path d="${rounded(12, 10)}" fill="${i % 3 ? c.base : c.light}" ${s(1.3)}/>`) +
      `<circle r="2.2" fill="${c.dark}"/></g>`,
    ),

  lily: (petal: string, shade: string, spot: string) =>
    ring(3, 60, () => `<path d="${pointed(84, 24)}" fill="${shade}" ${S}/>`) +
    ring(3, 0, () =>
      `<path d="${pointed(86, 24)}" fill="${petal}" ${S}/>` +
      `<path d="M0 -10 L0 -62" stroke="${spot}" stroke-width="2" opacity=".6"/>` +
      [-22, -34, -46].map((y) => `<circle cx="-5" cy="${y}" r="1.8" fill="${spot}"/><circle cx="5" cy="${y - 4}" r="1.8" fill="${spot}"/>`).join(""),
    ) +
    ring(6, 15, () => `<path d="M0 0 L0 -40" stroke="#7E9C6E" stroke-width="2"/><ellipse cy="-43" rx="3" ry="6" fill="#8B4A2B"/>`),

  cosmos: (petal: string) =>
    ring(8, 0, () => `<path d="${notched(58, 24)}" fill="${petal}" ${S}/><path d="M0 -14 L0 -44" stroke="${INK}" stroke-width="1.2" opacity=".25"/>`) +
    `<circle r="12" fill="#F4C542" ${S}/>` +
    phyllo(10, 2.6, (x, y) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#B7832B"/>`),

  carnation: (c: Tone) =>
    `<path d="${scallop(56, 14, 11)}" fill="${c.dark}" ${S}/>` +
    `<path d="${scallop(45, 12, 10)}" transform="rotate(12)" fill="${c.base}" ${S}/>` +
    `<path d="${scallop(32, 10, 8)}" transform="rotate(4)" fill="${c.light}" ${S}/>` +
    `<path d="${scallop(18, 8, 6)}" transform="rotate(20)" fill="${c.base}" ${S}/>`,

  anemone: () =>
    ring(6, 0, () => `<path d="${rounded(56, 34)}" fill="#FFFDF7" ${S}/><path d="M0 -18 L0 -46" stroke="${INK}" stroke-width="1.2" opacity=".2"/>`) +
    ring(16, 0, () => `<circle cy="-23" r="2.4" fill="#3A3148"/>`) +
    `<circle r="15" fill="#1F1B24" ${S}/>`,

  ranunculus: (c: Tone) =>
    (
      [
        [54, 0, 4, c.dark],
        [44, 2, 0, c.base],
        [35, -2, -3, c.light],
        [27, 1, -5, c.base],
        [19, 0, -6, c.light],
        [11, 1, -6, c.dark],
      ] as [number, number, number, string][]
    )
      .map(([r, x, y, fill]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${S}/>`)
      .join(""),

  poppy: () =>
    ring(4, 45, () => `<path d="${rounded(62, 50)}" fill="#D9442F" ${S}/>`) +
    ring(4, 0, () => `<path d="${rounded(52, 42)}" fill="#F06A4E" ${S}/>`) +
    `<circle r="15" fill="${INK}"/>` +
    ring(12, 0, () => `<path d="M0 -15 L0 -24" stroke="${INK}" stroke-width="2"/><circle cy="-25" r="2" fill="${INK}"/>`) +
    `<circle r="6" fill="#7E9C6E"/>`,
};

// ---------- Greenery sprigs (origin at the tie point, growing up to -len) ----------

export const sprigs = {
  eucalyptus: (len: number) => {
    let out = `<path d="M0 0 L0 ${-len}" stroke="#6E8F6A" stroke-width="3.5" stroke-linecap="round"/>`;
    for (let t = 0.42, i = 0; t <= 1.001; t += 0.065, i++) {
      const r = 15 * (1 - (t - 0.42) * 0.55);
      const side = i % 2 ? 1 : -1;
      out += `<circle cx="${f(side * r * 0.9)}" cy="${f(-len * t)}" r="${f(r)}" fill="${i % 2 ? "#A7BFA4" : "#94B091"}" ${s(1.8)}/>`;
    }
    return out;
  },
  fern: (len: number) => {
    let out = `<path d="M0 0 L0 ${-len}" stroke="#5F8A52" stroke-width="3" stroke-linecap="round"/>`;
    for (let t = 0.4; t <= 0.98; t += 0.045) {
      const l = 46 * (1 - (t - 0.4) * 1.2);
      const y = f(-len * t);
      out +=
        `<path d="${pointed(l, 7)}" transform="translate(0 ${y}) rotate(-62)" fill="#7FA46E" ${s(1.4)}/>` +
        `<path d="${pointed(l, 7)}" transform="translate(0 ${y}) rotate(62)" fill="#7FA46E" ${s(1.4)}/>`;
    }
    return out;
  },
  ruscus: (len: number) => {
    let out = `<path d="M0 0 L0 ${-len}" stroke="#5F8A52" stroke-width="3" stroke-linecap="round"/>`;
    for (let t = 0.45, i = 0; t <= 1; t += 0.08, i++)
      out += `<path d="${pointed(38, 12)}" transform="translate(0 ${f(-len * t)}) rotate(${i % 2 ? 42 : -42})" fill="#86A878" ${s(1.8)}/>`;
    return out + `<path d="${pointed(36, 11)}" transform="translate(0 ${-len})" fill="#86A878" ${s(1.8)}/>`;
  },
  pampas: (len: number) => {
    let out = `<path d="M0 0 L0 ${-len}" stroke="#CDB48E" stroke-width="3" stroke-linecap="round"/>`;
    for (let k = 0; k < 30; k++) {
      const t = 0.55 + k * 0.015;
      const w = 30 * Math.sin((Math.PI * (t - 0.55)) / 0.46) + 4;
      const y = -len * t;
      const col = k % 2 ? "#F1E4CC" : "#E3CBA3";
      out +=
        `<path d="M0 ${f(y)} Q${f(-w * 0.6)} ${f(y - 4)} ${f(-w)} ${f(y - 14)}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M0 ${f(y)} Q${f(w * 0.6)} ${f(y - 4)} ${f(w)} ${f(y - 14)}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"/>`;
    }
    return out;
  },
};

// ---------- Wrapper paper ----------

export type Paper = { paper: string; shade: string; edge: string; print?: "news" | "dots" };

export function wrapperBack(p: Paper) {
  return (
    `<path d="M150 540 L262 388 L382 452 L500 356 L618 452 L738 388 L850 540 L566 1010 L434 1010Z" fill="${p.paper}" ${S}/>` +
    `<path d="M205 552 L500 430 L795 552 L556 990 L444 990Z" fill="${p.shade}" opacity=".45"/>`
  );
}

export function wrapperFront(p: Paper) {
  let print = "";
  if (p.print === "news") {
    for (let y = 790; y <= 1130; y += 22) {
      const t = (y - 690) / 490;
      const xl = 235 + t * 180 + 22;
      const xr = 765 - t * 180 - 22;
      const mid = (xl + xr) / 2 + ((y / 22) % 3) * 12 - 12;
      print += `<path d="M${f(xl)} ${y} L${f(mid - 8)} ${y} M${f(mid + 8)} ${y} L${f(xr)} ${y}" stroke="#8C857A" stroke-width="3" opacity=".45"/>`;
    }
    print += `<path d="M330 770 L672 770" stroke="#5C564E" stroke-width="7" opacity=".5"/>`;
  } else if (p.print === "dots") {
    for (let y = 780; y <= 1140; y += 38)
      for (let x = 250; x <= 750; x += 38) {
        const t = (y - 690) / 490;
        if (x > 235 + t * 180 + 16 && x < 765 - t * 180 - 16)
          print += `<circle cx="${x + ((y / 38) % 2) * 19}" cy="${y}" r="4.5" fill="${p.edge}" opacity=".55"/>`;
      }
  }
  return (
    `<path d="M235 690 C360 745 640 745 765 690 L585 1180 C530 1198 470 1198 415 1180Z" fill="${p.paper}" ${S}/>` +
    print +
    `<path d="M235 690 C330 735 430 750 520 752 L470 1192 C450 1190 430 1186 415 1180Z" fill="${p.shade}" opacity=".55" ${S}/>` +
    `<path d="M300 770 L440 1150 M700 770 L580 1150" stroke="${p.edge}" stroke-width="2" opacity=".5" fill="none"/>`
  );
}

export function ribbonMarkup(color: string, dark: string) {
  return (
    `<path d="M327 912 Q500 944 673 912 L664 950 Q500 982 336 950Z" fill="${color}" ${S}/>` +
    `<path d="M494 936 L452 1050 L476 1040 L488 1062 L506 940Z" fill="${dark}" ${S}/>` +
    `<path d="M506 936 L548 1046 L524 1038 L514 1060 L494 940Z" fill="${color}" ${S}/>` +
    `<path d="M500 930 C455 884 396 888 404 930 C410 968 470 958 500 930Z" fill="${color}" ${S}/>` +
    `<path d="M500 930 C545 884 604 888 596 930 C590 968 530 958 500 930Z" fill="${color}" ${S}/>` +
    `<path d="M432 918 C446 912 466 916 482 926 M568 918 C554 912 534 916 518 926" fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<ellipse cx="500" cy="932" rx="15" ry="13" fill="${dark}" ${S}/>`
  );
}

// "O Amanhecer" — motor do canvas do hero, portado do design hi-fi (drawHero).
// Recriado nativamente (sem o runtime do protótipo). Constantes verbatim do handoff.

export const HSET = 7.4; // o canvas congela o amanhecer aqui
export const HEND = 9.9; // fim da intro

export interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  p: number;
}
export interface Particle {
  x: number;
  r: number;
  sp: number;
  o: number;
}

// LCG determinístico (mesma seed do design) → estrelas/partículas estáveis.
export function makeDawnField(): { stars: Star[]; particles: Particle[] } {
  let seed = 987654321;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  // coords normalizadas (0..1 em x; 0..0.611 em y) → escalam p/ qualquer aspect ratio
  const stars: Star[] = [];
  for (let i = 0; i < 175; i++)
    stars.push({ x: rnd(), y: rnd() * 0.611, r: rnd() * 1.7 + 0.3, a: rnd() * 0.6 + 0.12, p: rnd() });
  const particles: Particle[] = [];
  for (let i = 0; i < 26; i++)
    particles.push({ x: rnd() - 0.5, r: rnd() * 1.6 + 0.6, sp: 0.05 + rnd() * 0.07, o: rnd() });
  return { stars, particles };
}

export function smooth(a: number, b: number, x: number): number {
  x = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

function heroCam(tc: number): number {
  const eo = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  return tc < 5 ? 1.85 - 0.85 * eo(tc / 5) : 1.0;
}

function rimGrad(ctx: CanvasRenderingContext2D, cx: number, R: number, bright: boolean): CanvasGradient {
  const g = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
  if (bright) {
    g.addColorStop(0, "#93B9E0");
    g.addColorStop(0.28, "#B49BE2");
    g.addColorStop(0.5, "#ECB4D2");
    g.addColorStop(0.74, "#F8C2A6");
    g.addColorStop(1, "#FBD79C");
  } else {
    g.addColorStop(0, "#79AEDB");
    g.addColorStop(0.28, "#9A8AD9");
    g.addColorStop(0.5, "#E0A6C8");
    g.addColorStop(0.74, "#F4B6A0");
    g.addColorStop(1, "#F8CC92");
  }
  return g;
}

function drawHorizonFlare(
  ctx: CanvasRenderingContext2D,
  fx: number,
  fy: number,
  W: number,
  H: number,
  bloom: number,
  portrait: boolean,
): void {
  const mobileSoftness = portrait ? 0.58 : 1;
  const shortAxis = Math.min(W, H);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = bloom * mobileSoftness;
  ctx.filter = `blur(${Math.max(18, shortAxis * 0.035)}px)`;
  ctx.translate(fx, fy + shortAxis * 0.008);
  ctx.scale(portrait ? 2.4 : 3.5, portrait ? 0.18 : 0.14);
  const mist = ctx.createRadialGradient(0, 0, 0, 0, 0, shortAxis * 0.24);
  mist.addColorStop(0, "rgba(255,248,236,0.34)");
  mist.addColorStop(0.38, "rgba(246,205,205,0.16)");
  mist.addColorStop(0.72, "rgba(180,155,226,0.08)");
  mist.addColorStop(1, "rgba(255,236,216,0)");
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(0, 0, shortAxis * 0.24, 0, 7);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = bloom * (portrait ? 0.16 : 0.24);
  ctx.filter = `blur(${Math.max(10, shortAxis * 0.018)}px)`;
  ctx.translate(fx, fy);
  ctx.scale(portrait ? 1.55 : 2.15, 0.05);
  const glint = ctx.createRadialGradient(0, 0, 0, 0, 0, shortAxis * 0.28);
  glint.addColorStop(0, "rgba(255,255,255,0.34)");
  glint.addColorStop(0.58, "rgba(255,230,214,0.08)");
  glint.addColorStop(1, "rgba(255,230,214,0)");
  ctx.fillStyle = glint;
  ctx.beginPath();
  ctx.arc(0, 0, shortAxis * 0.28, 0, 7);
  ctx.fill();
  ctx.restore();
}

export function drawHero(
  ctx: CanvasRenderingContext2D,
  t: number,
  stars: Star[],
  particles: Particle[],
  W = 1920,
  H = 1080,
): void {
  const tc = Math.min(t, HSET);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#150f2c");
  bg.addColorStop(0.5, "#0c0a1a");
  bg.addColorStop(1, "#08060f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const portrait = H > W * 1.25;
  const shortAxis = Math.min(W, H);
  const cx = W * 0.52,
    apexY = H * (portrait ? 0.682 : 0.66),
    R = W * 1.4,
    cy = apexY + R;
  const s = heroCam(tc);
  const rimO = portrait
    ? smooth(4.75, 6.45, tc) * (0.35 + 0.65 * smooth(5.3, 6.9, tc))
    : smooth(3.7, 5.7, tc);
  const starO = smooth(1.4, 4, tc);
  const fgrow = smooth(0.4, 5.4, tc);
  const dip = 1 - 0.16 * Math.max(0, 1 - Math.abs(tc - 4.0) / 0.7);
  const bloom = smooth(4.3, 5.1, tc) * (1 - smooth(5.2, 6.5, tc));

  ctx.save();
  ctx.translate(cx, apexY);
  ctx.scale(s, s);
  ctx.translate(-cx, -apexY);

  if (starO > 0) {
    ctx.save();
    for (const st of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + st.p * 6.28);
      ctx.globalAlpha = st.a * starO * tw;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(st.x * W, st.y * H, st.r, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  if (rimO > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = "blur(60px)";
    const atm = ctx.createRadialGradient(cx, apexY, 0, cx, apexY, W * 0.5);
    atm.addColorStop(0, "rgba(201,162,212," + 0.42 * rimO + ")");
    atm.addColorStop(0.4, "rgba(143,164,214," + 0.16 * rimO + ")");
    atm.addColorStop(1, "rgba(143,164,214,0)");
    ctx.fillStyle = atm;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (rimO > 0) {
    const rim = Math.min(12, Math.max(3.2, shortAxis * (portrait ? 0.006 : 0.0075)));
    const rimAlpha = rimO * (portrait ? 0.54 : 0.9);
    ctx.save();
    ctx.globalAlpha = rimAlpha;
    ctx.globalCompositeOperation = "screen";
    ctx.filter = `blur(${Math.max(12, shortAxis * 0.03)}px)`;
    ctx.strokeStyle = rimGrad(ctx, cx, R, false);
    ctx.lineWidth = rim * 3.8;
    ctx.beginPath();
    ctx.arc(cx, cy, R + rim * 0.28, 0, 7);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = rimAlpha * 0.72;
    ctx.globalCompositeOperation = "screen";
    ctx.filter = `blur(${portrait ? 3.6 : 2.4}px)`;
    ctx.strokeStyle = rimGrad(ctx, cx, R, true);
    ctx.lineWidth = Math.max(1.1, rim * (portrait ? 0.55 : 0.72));
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 7);
    ctx.stroke();
    ctx.restore();
  }

  {
    const rim = Math.min(12, Math.max(3.2, shortAxis * (portrait ? 0.006 : 0.0075)));
    ctx.save();
    const pg = ctx.createRadialGradient(cx, cy - R * 0.6, 0, cx, cy, R);
    pg.addColorStop(0, "#1b1633");
    pg.addColorStop(0.5, "#0e0a1e");
    pg.addColorStop(1, "#08060f");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(cx, cy + rim * (portrait ? 0.42 : 0.55), R, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  {
    const fx = cx + W * 0.02,
      fy = apexY;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = "blur(55px)";
    ctx.globalAlpha = 0.4 * fgrow;
    ctx.translate(fx, fy);
    ctx.scale(0.16, 1.5);
    const shg = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.5);
    shg.addColorStop(0, "rgba(255,236,212,0.55)");
    shg.addColorStop(1, "rgba(255,236,212,0)");
    ctx.fillStyle = shg;
    ctx.beginPath();
    ctx.arc(0, 0, W * 0.5, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  {
    const baseFR = Math.hypot(W, H) * 0.148;
    const fr = baseFR * (0.42 + 0.58 * fgrow) * (1 + 0.02 * Math.sin(t * 2.0)) * (1 + 0.55 * bloom);
    const fx = cx + W * 0.02,
      fy = apexY;
    const warm = smooth(2, 7, tc);
    const cg = Math.round(202 + 53 * warm),
      cb = Math.round(150 + 105 * warm);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = "blur(12px)";
    const fl = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
    fl.addColorStop(0, "rgba(255,255,255,0.98)");
    fl.addColorStop(0.22, "rgba(255," + cg + "," + cb + ",0.6)");
    fl.addColorStop(0.6, "rgba(255," + cg + "," + cb + ",0.12)");
    fl.addColorStop(1, "rgba(255," + cg + "," + cb + ",0)");
    ctx.fillStyle = fl;
    ctx.fillRect(0, 0, W, H);
    ctx.filter = "blur(4px)";
    const core = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 0.26);
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (tc > 4) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const pa = Math.min(1, (tc - 4) / 2);
    for (const pp of particles) {
      const life = (t * pp.sp + pp.o) % 1;
      const py = apexY - life * H * 0.5;
      const px = cx + pp.x * W * (0.6 + 0.4 * life);
      ctx.globalAlpha = Math.sin(life * Math.PI) * 0.45 * pa;
      ctx.fillStyle = "rgba(255,232,212,1)";
      ctx.beginPath();
      ctx.arc(px, py, pp.r, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();

  if (dip < 1) {
    ctx.save();
    ctx.fillStyle = "rgba(8,6,15," + (1 - dip).toFixed(3) + ")";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (bloom > 0.001) {
    const fx = cx + W * 0.02,
      fy = apexY;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const bb = ctx.createRadialGradient(fx, fy, 0, fx, fy, W * 0.66);
    bb.addColorStop(0, "rgba(255,251,244," + 0.9 * bloom + ")");
    bb.addColorStop(0.32, "rgba(255,226,206," + 0.46 * bloom + ")");
    bb.addColorStop(1, "rgba(255,210,180,0)");
    ctx.fillStyle = bb;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    drawHorizonFlare(ctx, fx, fy, W, H, bloom, portrait);
  }

  ctx.save();
  const vg = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.28, W / 2, H * 0.52, Math.max(W, H) * 0.62);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

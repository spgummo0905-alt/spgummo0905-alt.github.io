/* GUMMO — interactive digital business card intro
   particles: flow / data / ai / build formations, pointer repel, click shockwave
   card: pointer tilt, drag-to-spin with inertia, click-to-flip */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.querySelector('.intro');
  if (!stage) return;
  const cv = stage.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const card = stage.querySelector('.card3d');
  const inner = card.querySelector('.card-inner');
  const modeBtns = [...stage.querySelectorAll('[data-mode]')];
  const readout = stage.querySelector('.readout');

  const MODES = {
    flow:  { c1: [255, 92, 122], c2: [126, 224, 181], title: '흐름을 설계합니다', body: '끊긴 지점을 찾고, 무엇을 정했고 무엇을 미뤘는지 기록으로 남깁니다.', proof: 'EMPATHO · 결정 27건 + 보완 8건 문서화', href: 'cases/empatho.html' },
    data:  { c1: [255, 138, 92], c2: [255, 92, 122], title: '숫자로 판단합니다', body: '열지도, 구좌별 클릭, A/B 테스트로 화면과 소재를 고칩니다.', proof: '셰프애찬 자사몰 · 재직 중 회원 +53만', href: 'cases/chefechan.html' },
    ai:    { c1: [126, 224, 181], c2: [111, 168, 255], title: 'AI를 안전하게 씁니다', body: '확신이 없으면 멈추고, 조용히 틀리는 지점을 먼저 없앱니다.', proof: 'TILI · 판독문-수치 5.8% 불일치 해결', href: 'cases/tili.html' },
    build: { c1: [111, 168, 255], c2: [126, 224, 181], title: '직접 만들어 봅니다', body: '기획서에서 멈추지 않고 React · Django · Go로 프로토타입까지.', proof: 'EMPATHO 화면·서버 커밋 173개', href: 'https://github.com/spgummo0905-alt/empatho-showcase' },
  };
  const ORDER = ['flow', 'data', 'ai', 'build'];

  let W = 0, H = 0, DPR = 1, N = 0, P = [], mode = 'flow', t = 0;
  const ptr = { x: -9999, y: -9999, on: false };
  const waves = [];
  let aiNodes = [];

  function resize() {
    const r = stage.getBoundingClientRect();
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const want = W < 700 ? 650 : 1500;
    if (P.length !== want) {
      P = Array.from({ length: want }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, tx: 0, ty: 0, k: Math.random(), i }));
    }
    N = P.length;
    setTargets(mode, true);
  }

  // ----- formations -----
  function sampleText(txt) {
    const oc = document.createElement('canvas'), s = Math.min(W, H * 1.6);
    oc.width = Math.ceil(W); oc.height = Math.ceil(H);
    const o = oc.getContext('2d');
    o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.font = `800 ${Math.round(s * 0.42)}px ui-monospace, Menlo, monospace`;
    o.fillText(txt, W * 0.5, H * 0.5);
    const d = o.getImageData(0, 0, oc.width, oc.height).data, pts = [];
    const step = W < 700 ? 5 : 6;
    for (let y = 0; y < oc.height; y += step) for (let x = 0; x < oc.width; x += step) if (d[(y * oc.width + x) * 4 + 3] > 128) pts.push([x, y]);
    return pts;
  }
  function setTargets(m, snap) {
    const cx = W / 2, cy = H * 0.46;
    if (m === 'ai') {
      const layers = [3, 5, 5, 2], gapX = W * 0.86 / (layers.length - 1), x0 = cx - gapX * (layers.length - 1) / 2;
      aiNodes = [];
      layers.forEach((n, li) => { for (let j = 0; j < n; j++) aiNodes.push({ x: x0 + li * gapX, y: cy + (j - (n - 1) / 2) * H * 0.15, l: li }); });
    }
    const txt = m === 'build' ? sampleText('</>') : null;
    P.forEach((p, i) => {
      const u = i / N;
      if (m === 'flow') {
        // scattered on the left, converging into one stream on the right
        const x = u * W * 1.1 - W * 0.05, conv = Math.min(1, Math.max(0, (x / W - 0.15) / 0.6));
        const spread = (1 - conv) * H * 0.34 + 6;
        p.tx = x; p.ty = cy + Math.sin(x * 0.006 + 1.2) * H * 0.07 + (p.k - 0.5) * spread * 2;
      } else if (m === 'data') {
        const bars = W < 700 ? 9 : 16, b = i % bars, bw = W * 0.92 / bars, x0 = cx - bw * bars / 2;
        const hgt = (0.25 + 0.7 * Math.abs(Math.sin(b * 0.9 + 0.6)) * (0.4 + b / bars * 0.6)) * H * 0.7;
        p.tx = x0 + b * bw + bw * 0.15 + p.k * bw * 0.7; p.ty = H * 0.88 - Math.random() * hgt;
      } else if (m === 'ai') {
        const n = aiNodes[i % aiNodes.length], a = p.k * Math.PI * 2, r = 4 + Math.random() * 18;
        p.tx = n.x + Math.cos(a) * r; p.ty = n.y + Math.sin(a) * r;
      } else if (m === 'build') {
        const q = txt[Math.floor((i + p.k) * txt.length / N) % txt.length]; p.tx = q[0] + (Math.random() - .5) * 3; p.ty = q[1] + (Math.random() - .5) * 3;
      }
      if (snap) { p.x = p.tx; p.y = p.ty; }
    });
  }

  function setMode(m, user) {
    if (!MODES[m] || (m === mode && !user)) return;
    mode = m;
    setTargets(m, false);
    // kick particles for a "휙" transition
    P.forEach(p => { p.vx += (Math.random() - .5) * 14; p.vy += (Math.random() - .5) * 14; });
    modeBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
    stage.dataset.mode = m;
    const d = MODES[m];
    readout.classList.remove('swap'); void readout.offsetWidth; readout.classList.add('swap');
    readout.querySelector('.r-title').textContent = d.title;
    readout.querySelector('.r-body').textContent = d.body;
    const a = readout.querySelector('.r-proof'); a.textContent = d.proof + ' →'; a.href = d.href;
    if (user) stopAuto();
  }

  // ----- render loop -----
  function mix(a, b, u) { return a.map((v, i) => Math.round(v + (b[i] - v) * u)); }
  function frame() {
    t += 1;
    ctx.clearRect(0, 0, W, H);
    const d = MODES[mode];
    if (mode === 'ai') {
      ctx.lineWidth = 1;
      for (const a of aiNodes) for (const b of aiNodes) if (b.l === a.l + 1) {
        const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, `rgba(${d.c1},.22)`); g.addColorStop(1, `rgba(${d.c2},.22)`);
        ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // signal pulses along edges
      const k = (t % 90) / 90;
      for (const a of aiNodes) for (const b of aiNodes) if (b.l === a.l + 1 && (a.x * 7 + b.y) % 3 < 1) {
        const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
        ctx.fillStyle = `rgba(${d.c2},.9)`; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    }
    for (let w = waves.length - 1; w >= 0; w--) {
      const s = waves[w]; s.r += 16; s.a *= 0.94;
      ctx.strokeStyle = `rgba(${d.c1},${s.a})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke();
      if (s.a < 0.02) waves.splice(w, 1);
    }
    for (const p of P) {
      // flowing drift so formations feel alive
      let fx = (p.tx - p.x) * 0.018, fy = (p.ty - p.y) * 0.018;
      if (mode === 'flow') { fy += Math.sin(t * 0.02 + p.tx * 0.01) * 0.12; }
      const dx = p.x - ptr.x, dy = p.y - ptr.y, dd = dx * dx + dy * dy;
      if (ptr.on && dd < 16000) { const f = (16000 - dd) / 16000 * 2.4, l = Math.sqrt(dd) || 1; fx += dx / l * f; fy += dy / l * f; }
      for (const s of waves) {
        const ex = p.x - s.x, ey = p.y - s.y, e = Math.sqrt(ex * ex + ey * ey) || 1, band = Math.abs(e - s.r);
        if (band < 40) { const f = (40 - band) / 40 * 5 * s.a; fx += ex / e * f; fy += ey / e * f; }
      }
      p.vx = (p.vx + fx) * 0.86; p.vy = (p.vy + fy) * 0.86;
      p.x += p.vx; p.y += p.vy;
      const u = Math.min(1, Math.max(0, p.x / W)), c = mix(d.c1, d.c2, u);
      const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 6);
      ctx.fillStyle = `rgba(${c},${0.45 + p.k * 0.5 + sp * 0.3})`;
      const sz = 1.2 + p.k * 1.6 + sp;
      ctx.fillRect(p.x, p.y, sz, sz);
    }
    // constellation: the cursor "stitches" nearby particles together (연결하는 손)
    if (ptr.on) {
      const near = [];
      for (const p of P) { const dx = p.x - ptr.x, dy = p.y - ptr.y, dd = dx * dx + dy * dy; if (dd < 30000 && dd > 3000) near.push([dd, p]); if (near.length > 60) break; }
      near.sort((a, b) => a[0] - b[0]);
      const pick = near.slice(0, 14).map(n => n[1]);
      ctx.lineWidth = 0.8;
      pick.forEach((p, j) => {
        const q = pick[(j + 1) % pick.length];
        ctx.strokeStyle = `rgba(${d.c2},${0.5 - j * 0.03})`;
        ctx.beginPath(); ctx.moveTo(ptr.x, ptr.y); ctx.lineTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      });
      ctx.fillStyle = `rgba(${d.c2},.9)`; ctx.beginPath(); ctx.arc(ptr.x, ptr.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  // ----- card physics -----
  let rx = 0, ry = 0, vrx = 0, vry = 0, flip = 0, drag = null, moved = 0;
  const tiltTarget = { x: 0, y: 0 };
  function cardLoop() {
    if (!drag) {
      vry *= 0.94; vrx *= 0.9;
      ry += vry; rx += vrx;
      if (Math.abs(vry) < 0.4) { const snap = Math.round(ry / 180) * 180; ry += (snap + tiltTarget.y - ry) * 0.1; }
      rx += (tiltTarget.x - rx) * 0.1;
    }
    inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    const face = ((Math.round(ry / 180) % 2) + 2) % 2;
    card.classList.toggle('is-back', face === 1);
    card.style.setProperty('--sx', (50 + (ry % 180) * 0.4) + '%');
    card.style.setProperty('--sy', (50 - rx * 2) + '%');
    requestAnimationFrame(cardLoop);
  }
  card.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, ry, rx }; moved = 0; card.setPointerCapture(e.pointerId); card.classList.add('grab'); });
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    if (drag) {
      const nx = e.clientX - drag.x, ny = e.clientY - drag.y; moved = Math.max(moved, Math.abs(nx) + Math.abs(ny));
      const nry = drag.ry + nx * 0.6; vry = nry - ry; ry = nry;
      rx = Math.max(-35, Math.min(35, drag.rx - ny * 0.3)); vrx = 0;
    } else {
      tiltTarget.x = -((e.clientY - r.top) / r.height - 0.5) * 18;
      tiltTarget.y = ((e.clientX - r.left) / r.width - 0.5) * 22;
    }
  });
  const end = () => {
    if (!drag) return;
    card.classList.remove('grab');
    if (moved < 6) { vry = 0; ry = Math.round(ry / 180) * 180 + 180; } // click → flip
    drag = null;
  };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  card.addEventListener('pointerleave', () => { if (!drag) { tiltTarget.x = 0; tiltTarget.y = 0; } });
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ry = Math.round(ry / 180) * 180 + 180; } });

  // ----- stage input -----
  stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true; });
  stage.addEventListener('pointerleave', () => { ptr.on = false; });
  cv.addEventListener('pointerdown', e => {
    const r = stage.getBoundingClientRect();
    waves.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 4, a: 1 });
    stopAuto();
    clearTimeout(peekT); peekT = setTimeout(() => stage.classList.add('peek'), 260); // hold → 그림만 보기
  });
  let peekT = 0;
  const unpeek = () => { clearTimeout(peekT); stage.classList.remove('peek'); };
  addEventListener('pointerup', unpeek); addEventListener('pointercancel', unpeek);
  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode, true)));
  addEventListener('keydown', e => {
    if (e.target.closest('input,textarea')) return;
    const i = '1234'.indexOf(e.key); if (i >= 0 && stage.getBoundingClientRect().bottom > 0) setMode(ORDER[i], true);
  });

  // auto-cycle until the visitor takes over
  let auto = setInterval(() => setMode(ORDER[(ORDER.indexOf(mode) + 1) % 4], false), 5200);
  function stopAuto() { if (auto) { clearInterval(auto); auto = null; stage.classList.add('touched'); } }

  let raf = 0;
  resize();
  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
  if (reduce) { clearInterval(auto); auto = null; frame(); cancelAnimationFrame(raf); inner.style.transform = 'none'; return; }
  new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(frame); }).observe(stage);
  cardLoop();
})();

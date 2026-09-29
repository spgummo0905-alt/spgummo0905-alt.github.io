/* calm profile card: gentle tilt, click / drag to flip */
(() => {
  const card = document.querySelector('.card3d');
  if (!card) return;
  const inner = card.querySelector('.card-inner');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ry = 0, rx = 0, ty = 0, tx = 0, target = 0, drag = null, moved = 0;

  function loop() {
    const want = drag ? drag.cur : target + ty;
    ry += (want - ry) * (drag ? 0.35 : 0.12);
    rx += (tx - rx) * 0.12;
    inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    card.style.setProperty('--sx', (50 + ty * 2) + '%');
    card.style.setProperty('--sy', (50 - tx * 2) + '%');
    requestAnimationFrame(loop);
  }
  const flip = () => { target += 180; };

  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    if (drag) {
      const dx = e.clientX - drag.x; moved = Math.max(moved, Math.abs(dx));
      drag.cur = drag.start + dx * 0.5;
      return;
    }
    tx = -((e.clientY - r.top) / r.height - 0.5) * 10;
    ty = ((e.clientX - r.left) / r.width - 0.5) * 12;
  });
  card.addEventListener('pointerleave', () => { if (!drag) { tx = 0; ty = 0; } });
  card.addEventListener('pointerdown', e => { drag = { x: e.clientX, start: ry, cur: ry }; moved = 0; card.setPointerCapture(e.pointerId); });
  const end = () => {
    if (!drag) return;
    if (moved < 6) flip();
    else target = Math.round(drag.cur / 180) * 180; // settle on nearest face
    drag = null;
  };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });

  if (reduce) {
    card.addEventListener('click', () => { target += 180; inner.style.transform = `rotateY(${target}deg)`; });
    return;
  }
  loop();
})();

/* thread: draw the career line as the reader scrolls */
(() => {
  const story = document.querySelector('.thread');
  if (!story) return;
  const path = story.querySelector('.thread-line path');
  const nodes = [...story.querySelectorAll('.chapter')];
  const svg = story.querySelector('.thread-line');
  function layout() {
    const h = story.offsetHeight;
    svg.setAttribute('viewBox', `0 0 40 ${h}`); svg.style.height = h + 'px';
    // a gently wavering vertical line through every chapter dot
    let d = 'M20 0', y0 = 0;
    nodes.forEach((n, i) => {
      const y = n.offsetTop + 34;
      const mid = (y0 + y) / 2, sway = i % 2 ? 10 : -10;
      d += ` C ${20 + sway} ${mid}, ${20 - sway} ${mid}, 20 ${y}`; y0 = y;
    });
    d += ` L 20 ${h}`;
    path.setAttribute('d', d);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len; path.dataset.len = len;
    update();
  }
  function update() {
    const r = story.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
    path.style.strokeDashoffset = path.dataset.len * (1 - p);
    nodes.forEach(n => n.classList.toggle('lit', n.getBoundingClientRect().top < vh * 0.6));
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', layout);
  addEventListener('load', layout);
  layout();
})();

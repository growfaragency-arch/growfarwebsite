// mobile menu
  const burger = document.getElementById('burger'), menu = document.getElementById('menu');
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open'); burger.classList.remove('open');
  }));

  // brand slider
  const track = document.getElementById('track');
  document.getElementById('nextBrand')?.addEventListener('click', () => {
    const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    track.scrollTo({ left: end ? 0 : track.scrollLeft + 210, behavior: 'smooth' });
  });

  // process steps — mascot story
  const steps = [...document.querySelectorAll('.step')];
  const names = ['You film', 'We edit', 'We post', 'Repeat'];
  const story = [
    ['Hi, I’m Clip! 👋', 'You film once and send it. Share your style once — we lock your date upfront.'],
    ['Now we edit ✂️', 'Cuts, captions, b-roll and sound. A full month of content in 7 days.'],
    ['Time to post 🚀', 'Every video goes live on schedule, all month, on every platform.'],
    ['And repeat 🔁', 'Send next month’s footage. Same quality, same timing.']
  ];
  const stage = document.getElementById('stage'), bubble = document.getElementById('bubble');
  const chip = document.getElementById('artChip'), tag = document.getElementById('sceneTag');
  const dots = [...document.querySelectorAll('#dots button')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = -1, typer = 0, pausedUntil = 0, inView = false;

  const type = (el, text, speed, done) => {
    if (reduce) { el.textContent = text; done && done(); return; }
    let i = 0; el.textContent = '';
    const tick = () => { el.textContent = text.slice(0, ++i); if (i < text.length) typer = setTimeout(tick, speed); else if (done) typer = setTimeout(done, 350); };
    tick();
  };
  const setStep = i => {
    if (!stage || i === cur) return;
    cur = i; clearTimeout(typer);
    steps.forEach((s, n) => s.classList.toggle('on', n === i));
    dots.forEach((d, n) => d.classList.toggle('on', n === i));
    stage.dataset.s = i + 1;
    chip.innerHTML = 'Step <b>0' + (i + 1) + '</b> · ' + names[i];
    tag.textContent = 'Scene ' + (i + 1) + ' of 4 · ' + names[i];
    stage.classList.remove('flip'); void stage.offsetWidth; stage.classList.add('flip');
    const [h, p] = bubble.children; p.textContent = '';
    type(h, story[i][0], 26, () => type(p, story[i][1], 16));
  };
  const toStage = () => {
    if (innerWidth >= 960 || !stage) return;
    const y = stage.getBoundingClientRect().top + scrollY - 90;
    window.__lenis ? window.__lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: 'smooth' });
  };
  const userPick = (i, scroll) => { pausedUntil = Date.now() + 25000; if (i === cur) { cur = -1; } setStep(i); if (scroll) toStage(); };
  steps.forEach((s, i) => {
    s.addEventListener('click', () => userPick(i, true));
    s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); userPick(i, true); } });
  });
  dots.forEach((d, i) => d.addEventListener('click', () => userPick(i)));
  if (stage) {
    setStep(0);
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: .4 }).observe(stage);
    if (!reduce) setInterval(() => { if (inView && Date.now() > pausedUntil) setStep((cur + 1) % 4); }, 9500);
  }

  // reveal on scroll + count-up
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      setTimeout(() => { e.target.style.transitionDelay = ''; }, 1600);
      e.target.querySelectorAll('[data-count]').forEach(el => {
        const to = +el.dataset.count, suf = el.dataset.suffix || '', dec = +el.dataset.dec || 0;
        const t0 = performance.now();
        const tick = t => {
          const p = Math.min((t - t0) / 1200, 1);
          const v = to * (1 - Math.pow(1 - p, 3));
          el.textContent = (dec ? (v / 10 ** dec).toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suf;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      io.unobserve(e.target);
    });
  }, { threshold: .15 });
  // stagger siblings in grids
  document.querySelectorAll('.cards,.team-grid,.stats').forEach(g =>
    [...g.children].forEach((c, i) => { c.style.transitionDelay = (i * .12) + 's'; }));
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- hero title: word-by-word reveal ---------- */
  const title = document.getElementById('heroTitle');
  if (title) {
    let i = 0;
    title.innerHTML = title.innerHTML.split(/<br\s*\/?>/i).map(line => line.trim().split(/\s+/)
      .map(w => `<span class="w"><span style="--i:${i++}">${w}</span></span>`).join(' ')).join('<br>');
  }

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !RM) {
    lenis = new Lenis({ lerp: .085, wheelMultiplier: .95, smoothWheel: true });
    window.__lenis = lenis;
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const t = id === '#top' ? 0 : document.querySelector(id);
      if (t === null) return;
      e.preventDefault();
      const before = scrollY;
      lenis.scrollTo(t, { offset: id === '#top' ? 0 : -70, duration: 1.6, easing: x => 1 - Math.pow(1 - x, 4) });
      // safety net: if Lenis's animated scroll never actually moves the page (e.g. its
      // driving rAF loop got stalled by something elsewhere on the page), fall back to a
      // plain native scroll so the link still works instead of silently doing nothing
      setTimeout(() => {
        if (Math.abs(scrollY - before) < 2) (id === '#top' ? scrollTo({ top: 0, behavior: 'smooth' }) : t.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }, 450);
    }));
  }

  /* ---------- header: glass on scroll, hide on scroll down ---------- */
  const header = document.querySelector('header'), menu = document.getElementById('menu');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 30);
    header.classList.toggle('hide', y > lastY && y > 320 && !menu.classList.contains('open'));
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 3D tilt (cards) ---------- */
  if (fine && !RM) {
    const tilt = (el, max) => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((px - .5) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - py) * 2 * max).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (px * 100) + '%'); el.style.setProperty('--gy', (py * 100) + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    };
    document.querySelectorAll('.work-card').forEach(el => tilt(el, 9));
    document.querySelectorAll('.member .ph').forEach(el => tilt(el, 12));
    const ra = document.querySelector('.road-art');
    if (ra) tilt(ra, 10); // vars set on .road-art are inherited by .road-3d
    document.querySelectorAll('.t3').forEach(el => tilt(el, 8));
    document.querySelectorAll('.editor').forEach(el => tilt(el, 7));
    document.querySelectorAll('.vp').forEach(el => tilt(el, 4));

    /* magnetic buttons */
    document.querySelectorAll('.btn:not(.btn-sm)').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .22) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .32) + 'px');
      });
      b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    });
  }

  /* ---------- Three.js scenes ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  const scenes = [];
  function makeScene(canvas, build) {
    if (!canvas || !window.THREE) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch (err) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 720 ? 1.5 : 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    camera.position.set(0, 1.2, 12.5); camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfacb0, .55));
    const key = new THREE.DirectionalLight(0xffffff, .72); key.position.set(4, 7, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xeca8b8, .55); rim.position.set(-6, 2, -4); scene.add(rim);
    const update = build(scene, camera);
    const s = { vis: false, dead: false, canvas, render(t) {
      update(t / 1000);
      renderer.render(scene, camera);
    }};
    // a lost WebGL context (common with many GPU-heavy tabs open at once) must retire
    // this one scene, not take down the shared render/scroll loop with it
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); s.dead = true; s.vis = false; }, false);
    const fit = () => {
      const w = canvas.clientWidth || canvas.parentElement.clientWidth, h = canvas.clientHeight || canvas.parentElement.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    new ResizeObserver(fit).observe(canvas.parentElement); fit();
    new IntersectionObserver(([e]) => { if (!s.dead) s.vis = e.isIntersecting; }, { rootMargin: '80px' }).observe(canvas);
    canvas.parentElement.classList.add('gl');
    scenes.push(s);
    try { s.render(0); } catch (err) { s.dead = true; s.vis = false; }
  }

  const bevel = { bevelEnabled: true, bevelSegments: 8, curveSegments: 20 };
  const playGeo = () => {
    const sh = new THREE.Shape(); sh.moveTo(-.4, -.55); sh.lineTo(-.4, .55); sh.lineTo(.62, 0); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { ...bevel, depth: .3, bevelSize: .13, bevelThickness: .13 }); g.center(); return g;
  };
  const starGeo = () => {
    const sh = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? .17 : .42, a = i * Math.PI / 5 + Math.PI / 2; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { ...bevel, depth: .12, bevelSize: .06, bevelThickness: .06, bevelSegments: 4 }); g.center(); return g;
  };
  const soft = (color, r = .58) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: 0 });
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(121,94,100,.55)'); gr.addColorStop(1, 'rgba(121,94,100,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return window.THREE ? new THREE.CanvasTexture(c) : null;
  })();
  const blob = (w, h, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); return m;
  };

  /* ---------- ads scenes: helpers ---------- */
  const rrect = (w, h, r) => {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  };
  const slab = (w, h, r, d, b = .05) => {
    const g = new THREE.ExtrudeGeometry(rrect(w, h, r), { ...bevel, depth: d, bevelSize: b, bevelThickness: b, bevelSegments: 4 });
    g.center(); return g;
  };
  const heartGeo = () => {
    const s = new THREE.Shape(); s.moveTo(0, -.5); s.bezierCurveTo(-.9, .1, -.5, .7, 0, .35); s.bezierCurveTo(.5, .7, .9, .1, 0, -.5);
    const g = new THREE.ExtrudeGeometry(s, { ...bevel, depth: .2, bevelSize: .06, bevelThickness: .06, bevelSegments: 4 }); g.center(); return g;
  };
  const makeCoin = (x, y, z) => {
    const c = new THREE.Group(), gold = soft(0xf3c15a, .32);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .1, 40), gold); disc.rotation.x = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.24, .03, 10, 40), soft(0xffe08a, .3)); ring.position.z = .06;
    c.add(disc, ring); c.position.set(x, y, z); return c;
  };
  const smoothMouse = () => { mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05; };

  /* hero: 3D phone playing an edited Reel + clapperboard, film reel, headphones, timeline */
  makeScene(document.getElementById('heroGL'), (scene, camera) => {
    const g = new THREE.Group(); scene.add(g);
    const white = soft(0xf6f2f3), ink = soft(0x2a1f23, .55), acc = soft(0xff154e, .42), pinkS = soft(0xffc9d5, .55), grey = soft(0xdcd3d6);

    /* ---- phone with live canvas screen ---- */
    const phone = new THREE.Group(); g.add(phone);
    phone.add(new THREE.Mesh(slab(2.05, 3.95, .3, .24, .05), white));
    const bezel = new THREE.Mesh(slab(1.88, 3.78, .24, .02, .01), ink); bezel.position.z = .17; phone.add(bezel);

    const cv = document.createElement('canvas'); cv.width = 352; cv.height = 700;
    const cx = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.anisotropy = 4;
    const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    const caps = [['THIS ', 'HOOK', ' WINS'], ['DOUBLE YOUR ', 'LEADS', ''], ['LINK IN ', 'BIO', '']];
    const drawScreen = t => {
      cx.clearRect(0, 0, 352, 700); cx.save(); rr(cx, 0, 0, 352, 700, 30); cx.clip();
      const gr = cx.createLinearGradient(0, 0, 352, 700);
      gr.addColorStop(0, '#ffd0da'); gr.addColorStop(.55, '#ff4f7b'); gr.addColorStop(1, '#cf0b3c');
      cx.fillStyle = gr; cx.fillRect(0, 0, 352, 700);
      const idx = Math.floor(t / 2) % 3, zoom = 1 + (idx % 2) * .09;
      cx.save(); cx.translate(176, 640); cx.scale(zoom, zoom); cx.translate(-176, -640);
      cx.fillStyle = 'rgba(52,22,34,.88)';
      cx.beginPath(); cx.arc(176, 292, 50, 0, 7); cx.fill();
      cx.beginPath(); cx.moveTo(60, 700); cx.quadraticCurveTo(60, 380, 176, 380); cx.quadraticCurveTo(292, 380, 292, 700); cx.fill();
      cx.restore();
      // hook pill
      cx.fillStyle = '#fff'; rr(cx, 82, 62, 188, 46, 14); cx.fill();
      cx.fillStyle = '#2a1f23'; cx.font = '800 21px Inter, system-ui, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText('Stop scrolling.', 176, 86);
      // caption with highlighted keyword
      const [a, b, c] = caps[idx]; cx.font = '800 30px Inter, system-ui, sans-serif'; cx.textAlign = 'left';
      const wa = cx.measureText(a).width, wb = cx.measureText(b).width, wc = cx.measureText(c).width, x0 = 176 - (wa + wb + wc) / 2, y = 560;
      cx.fillStyle = '#fff'; cx.shadowColor = 'rgba(0,0,0,.35)'; cx.shadowBlur = 8; cx.fillText(a, x0, y); cx.fillText(c, x0 + wa + wb, y); cx.shadowBlur = 0;
      cx.fillStyle = '#ffd95e'; rr(cx, x0 + wa - 6, y - 24, wb + 12, 48, 9); cx.fill();
      cx.fillStyle = '#2a1f23'; cx.fillText(b, x0 + wa, y);
      // side icons
      [[318, 380, '♥'], [318, 442, '✉'], [318, 504, '➤']].forEach(([px, py, ch]) => {
        cx.fillStyle = 'rgba(255,255,255,.92)'; cx.beginPath(); cx.arc(px, py, 20, 0, 7); cx.fill();
        cx.fillStyle = '#ff154e'; cx.font = '700 20px system-ui, sans-serif'; cx.textAlign = 'center'; cx.fillText(ch, px, py + 1);
      });
      // progress bar
      cx.fillStyle = 'rgba(255,255,255,.4)'; rr(cx, 24, 650, 304, 7, 3.5); cx.fill();
      cx.fillStyle = '#fff'; rr(cx, 24, 650, Math.max(8, 304 * ((t % 6) / 6)), 7, 3.5); cx.fill();
      cx.restore(); tex.needsUpdate = true;
    };
    drawScreen(0);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.58), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    screen.position.z = .215; phone.add(screen);
    const notch = new THREE.Mesh(slab(.5, .1, .05, .02, .01), ink); notch.position.set(0, 1.72, .24); phone.add(notch);
    phone.position.set(.35, -.05, 0); phone.rotation.set(0, -.28, .05);
    const heart = new THREE.Mesh(heartGeo(), acc); heart.scale.setScalar(.5); heart.position.set(1.75, .9, 1.1); g.add(heart);

    /* ---- clapperboard ---- */
    const clap = new THREE.Group(); g.add(clap);
    clap.add(new THREE.Mesh(slab(1.9, 1.15, .1, .18), ink));
    [.22, -.02, -.26].forEach((yy, i) => { const l = new THREE.Mesh(slab(i === 1 ? 1.1 : 1.4, .07, .03, .02, .01), white); l.position.set(-.1, yy - .05, .16); clap.add(l); });
    const arm = new THREE.Group(); arm.position.set(-.95, .62, .0); clap.add(arm);
    const stick = new THREE.Mesh(slab(1.9, .38, .08, .18), ink); stick.position.set(.95, .2, 0); arm.add(stick);
    const par = new THREE.Shape(); par.moveTo(0, -.17); par.lineTo(.2, -.17); par.lineTo(.36, .17); par.lineTo(.16, .17); par.closePath();
    const parGeo = new THREE.ExtrudeGeometry(par, { depth: .02, bevelEnabled: false });
    for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(parGeo, i % 2 ? white : acc); p.position.set(.08 + i * .38, .2, .155); arm.add(p); }
    clap.position.set(-2.55, -1.55, .9); clap.rotation.set(-.05, .5, -.12); clap.scale.setScalar(.95);

    /* ---- film reel ---- */
    const reel = new THREE.Group(); g.add(reel);
    const rs = new THREE.Shape(); rs.absarc(0, 0, 1, 0, Math.PI * 2, false);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, h = new THREE.Path(); h.absarc(Math.cos(a) * .6, Math.sin(a) * .6, .21, 0, Math.PI * 2, true); rs.holes.push(h); }
    const hc = new THREE.Path(); hc.absarc(0, 0, .12, 0, Math.PI * 2, true); rs.holes.push(hc);
    const rg = new THREE.ExtrudeGeometry(rs, { depth: .1, bevelEnabled: false, curveSegments: 40 });
    const d1 = new THREE.Mesh(rg, white), d2 = new THREE.Mesh(rg, white); d1.position.z = -.3; d2.position.z = .2; reel.add(d1, d2);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .55, 32), acc); hub.rotation.x = Math.PI / 2; reel.add(hub);
    const film = new THREE.Mesh(new THREE.TorusGeometry(.86, .12, 12, 60), ink); film.position.z = -.05; reel.add(film);
    reel.position.set(3.05, 1.65, -.3); reel.rotation.set(-.1, -.45, 0); reel.scale.setScalar(.85);

    /* ---- headphones ---- */
    const hp = new THREE.Group(); g.add(hp);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.78, .09, 16, 48, Math.PI), ink); hp.add(band);
    [-.78, .78].forEach(x => { const cup = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .3, 32), acc); cup.rotation.z = Math.PI / 2; cup.position.set(x, -.05, 0); hp.add(cup); });
    hp.position.set(-2.75, 1.85, .2); hp.rotation.set(.1, .5, .3);

    /* ---- timeline clips + playhead ---- */
    const tl = new THREE.Group(); g.add(tl);
    const clipsDef = [[1.5, .3, 0, 0, 0xff154e], [.9, .3, 1.7, 0, 0xffffff], [1.2, .3, 0, -.42, 0xffc9d5], [1.7, .3, 1.4, -.42, 0xff7a99]];
    const clips = clipsDef.map(([w, h, x, y, c]) => { const m = new THREE.Mesh(slab(w, h, .09, .12, .03), soft(c, .5)); m.position.set(x + w / 2 - .8, y, 0); m.userData.x = m.position.x; tl.add(m); return m; });
    const ph = new THREE.Group(); const pl = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.2, .05), ink); const pt = new THREE.Mesh(new THREE.ConeGeometry(.12, .2, 16), ink); pt.rotation.z = Math.PI; pt.position.y = .68; ph.add(pl, pt); ph.position.y = -.2; tl.add(ph);
    tl.position.set(1.95, -2.05, 1.0); tl.rotation.set(-.15, -.35, 0);

    /* ---- sparkles ---- */
    const stars = [[-1.5, 2.7, .8, .5], [3.7, -.1, .6, .42], [-3.5, -.2, .5, .38]].map(([x, y, z, s]) => {
      const m = new THREE.Mesh(starGeo(), soft(0xf3c15a, .4)); m.position.set(x, y, z); m.scale.setScalar(s); g.add(m); return m;
    });
    g.add(blob(3.4, 3.4, .25, -2.15, 0), blob(2.6, 2.6, -2.4, -2.1, .8));
    let last = -1;

    return t => {
      const k = RM ? 0 : 1; smoothMouse();
      const sy = RM ? 0 : scrollY;
      g.rotation.y = mouse.x * .38 + sy * .0008; g.rotation.x = mouse.y * .12 - sy * .0002;
      g.scale.setScalar(Math.max(.5, Math.min(1, camera.aspect / 1.2) * .92)); g.position.x = -.1;
      phone.position.y = -.05 + Math.sin(t * .9) * .08 * k;
      if (t - last > .09) { last = t; drawScreen(RM ? 0 : t); }
      heart.position.y = .9 + Math.sin(t * 1.4) * .15 * k; heart.scale.setScalar(.5 + Math.sin(t * 3) * .05 * k);
      const f = (t % 3.4), open = f < 2.3 ? .55 + Math.sin(t * 2) * .03 : f < 2.6 ? .55 * (1 - (f - 2.3) / .3) : f < 2.9 ? 0 : .55 * ((f - 2.9) / .5);
      arm.rotation.z = k ? open : .4;
      clap.position.y = -1.55 + Math.sin(t * 1.1 + 1) * .1 * k;
      reel.rotation.z = t * .6 * k; reel.position.y = 1.65 + Math.sin(t * .8 + 2) * .12 * k;
      hp.position.y = 1.85 + Math.sin(t * 1.2 + 3) * .12 * k; hp.rotation.y = .5 + Math.sin(t * .7) * .25 * k;
      clips.forEach((c, i) => { c.position.x = c.userData.x + Math.sin(t * .8 + i) * .06 * k; });
      ph.position.x = -.9 + ((t * .35 * k) % 1) * 3.2;
      stars.forEach((s, i) => { s.rotation.y = t * (1 + i * .3) * k; s.rotation.z = Math.sin(t * 1.5 + i) * .3 * k; });
    };
  });

  /* why: cluster of soft spheres */
  makeScene(document.getElementById('whyGL'), (scene, camera) => {
    const g = new THREE.Group(); scene.add(g);
    const cols = [0xf6eaed, 0xddc4ca, 0xcba9b1, 0xe6d2d7, 0xbb8f99, 0xfbf6f7];
    const defs = [[-.4, -1.3, 0, 1.15], [1.1, -1.5, .4, .95], [-1.5, -.3, .3, .8], [.1, -.1, .7, .95],
                  [1.5, -.2, 0, .6], [-.3, 1.15, .2, .55], [.9, 1.2, .4, .38], [-1.4, 1.3, 0, .3]];
    const meshes = defs.map((d, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(d[3], 48, 48), soft(cols[i % cols.length], .5));
      m.position.set(d[0], d[1], d[2]); m.userData = { y: d[1], p: i * 1.3 }; g.add(m); return m;
    });
    const mint = new THREE.Mesh(new THREE.SphereGeometry(.2, 32, 32), soft(0xff154e, .4)); mint.position.set(1.9, 1.5, 1); g.add(mint);
    g.position.y = .1; g.add(blob(5.5, 5.5, 0, -2.6, .2));
    return t => {
      const k = RM ? 0 : 1;
      g.rotation.y = t * .25 * k + mouse.x * .3; g.rotation.x = mouse.y * .1;
      meshes.forEach(m => { m.position.y = m.userData.y + Math.sin(t * .9 + m.userData.p) * .1 * k; });
      mint.position.y = 1.5 + Math.sin(t * 1.5) * .2 * k;
      g.scale.setScalar(Math.max(.6, Math.min(1, camera.aspect / .9)));
    };
  });

  /* testimonials hero: big play button, orbit ring, stars */
  makeScene(document.getElementById('testiGL'), (scene, camera) => {
    const g = new THREE.Group(); scene.add(g);
    const white = soft(0xf6f3f4), mint = soft(0xff154e, .42), peach = soft(0xf1cdb9, .5), gold = soft(0xf3c15a, .4), grey = soft(0xe2d9db);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, .5, 72), white); disc.rotation.x = Math.PI / 2; g.add(disc);
    const rimm = new THREE.Mesh(new THREE.TorusGeometry(1.9, .14, 24, 90), grey); g.add(rimm);
    const play = new THREE.Mesh(playGeo(), mint); play.scale.setScalar(1.6); play.position.z = .45; g.add(play);
    const orbit = new THREE.Group(); g.add(orbit);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, .035, 12, 140), peach); ring.rotation.x = 1.15; orbit.add(ring);
    const bodies = [];
    [[0, gold, 'star'], [2.1, gold, 'star'], [4.2, gold, 'star'], [1.0, white, 'ball'], [3.1, mint, 'ball'], [5.2, peach, 'ball']].forEach(([a, m, type]) => {
      const mesh = new THREE.Mesh(type === 'star' ? starGeo() : new THREE.SphereGeometry(.24, 32, 32), m);
      mesh.userData.a = a; orbit.add(mesh); bodies.push(mesh);
    });
    g.add(blob(5, 5, 0, -2.5, 0));
    g.rotation.x = -.08;
    return t => {
      const k = RM ? 0 : 1;
      mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
      g.rotation.y = -.35 + mouse.x * .45 + Math.sin(t * .5) * .12 * k;
      g.rotation.x = -.08 + mouse.y * .16;
      g.position.y = Math.sin(t * .9) * .12 * k;
      play.scale.setScalar(1.6 + Math.sin(t * 2) * .03 * k);
      bodies.forEach(b => {
        const a = b.userData.a + t * .45 * k;
        b.position.set(Math.cos(a) * 2.9, 0, Math.sin(a) * 2.9);
        b.position.applyEuler(new THREE.Euler(1.15, 0, 0));
        b.rotation.set(t * .8 * k, t * 1.1 * k, 0);
      });
      g.scale.setScalar(Math.max(.55, Math.min(.85, camera.aspect / 1.4)));
    };
  });

  /* add-ons: megaphone + video ad cards */
  makeScene(document.getElementById('megaGL'), (scene, camera) => {
    const g = new THREE.Group(); scene.add(g);
    const acc = soft(0xff154e, .4), white = soft(0xf6f2f3), ink = soft(0x2a1f23, .6), dark = soft(0x3b2a31, .8), pinkS = soft(0xffc9d5, .6);

    const mega = new THREE.Group(); g.add(mega);
    const body = new THREE.Group(); body.rotation.z = -Math.PI / 2; mega.add(body);
    body.add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, .5, 2.1, 56), acc));
    const inner = new THREE.Mesh(new THREE.CircleGeometry(1.18, 56), dark); inner.rotation.x = -Math.PI / 2; inner.position.y = 1.03; body.add(inner);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, .1, 20, 64), white); rim.rotation.x = Math.PI / 2; rim.position.y = 1.05; body.add(rim);
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.03, .07, 16, 56), white); stripe.rotation.x = Math.PI / 2; stripe.position.y = .25; body.add(stripe);
    const back = new THREE.Mesh(new THREE.SphereGeometry(.56, 40, 40), white); back.position.y = -1.05; body.add(back);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .5, 24), ink); neck.position.y = -1.42; body.add(neck);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1.05, 28), ink); handle.position.set(-.1, -1.05, 0); handle.rotation.z = .14; mega.add(handle);
    const grip = new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 24), acc); grip.position.set(-.2, -1.6, 0); mega.add(grip);
    mega.position.set(-1.2, -.1, 0); mega.rotation.set(0, -.55, .12);

    const waves = [0, 1, 2].map(() => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xff154e, transparent: true });
      const t = new THREE.Mesh(new THREE.TorusGeometry(1, .06, 10, 48, Math.PI * .75), mat); t.rotation.z = -Math.PI * .375;
      const w = new THREE.Group(); w.add(t); w.position.x = 1.25; mega.add(w); return w;
    });

    const card = (x, y, z, ry) => {
      const c = new THREE.Group();
      const b = new THREE.Mesh(slab(1.9, 1.2, .16, .14), white);
      const scr = new THREE.Mesh(slab(1.6, .72, .1, .02, .02), pinkS); scr.position.set(0, .1, .12);
      const pl = new THREE.Mesh(playGeo(), acc); pl.scale.setScalar(.3); pl.position.set(0, .1, .2);
      const bar = new THREE.Mesh(slab(1.0, .09, .04, .02, .015), soft(0xd9cdd1)); bar.position.set(-.3, -.4, .1);
      c.add(b, scr, pl, bar); c.position.set(x, y, z); c.rotation.y = ry; c.userData.y = y; g.add(c); return c;
    };
    const c1 = card(-2.1, 2.2, -.6, .4), c2 = card(2.5, -1.7, .4, -.4);
    const heart = new THREE.Mesh(heartGeo(), acc); heart.position.set(2.8, 1.8, .3); heart.scale.setScalar(.85); g.add(heart);
    const coins = [makeCoin(-3.0, -.7, .6), makeCoin(.8, 2.5, -.2), makeCoin(3.3, .2, -.3)]; coins.forEach(c => g.add(c));
    g.add(blob(6, 6, 0, -2.5, 0));

    return t => {
      const k = RM ? 0 : 1; smoothMouse();
      g.rotation.y = mouse.x * .35; g.rotation.x = mouse.y * .12; g.position.y = Math.sin(t * .8) * .1 * k;
      mega.scale.setScalar(1 + Math.sin(t * 4) * .015 * k);
      waves.forEach((w, i) => { const p = (t * .7 * k + i / 3) % 1; w.scale.setScalar(.55 + p * .9); w.children[0].material.opacity = 1 - p; });
      c1.position.y = c1.userData.y + Math.sin(t * .9) * .15 * k; c1.rotation.y = .4 + Math.sin(t * .6) * .12 * k;
      c2.position.y = c2.userData.y + Math.sin(t * .9 + 2) * .15 * k; c2.rotation.y = -.4 + Math.sin(t * .6 + 1) * .12 * k;
      heart.scale.setScalar(.85 + Math.sin(t * 3) * .06 * k); heart.rotation.y = Math.sin(t * .9) * .5 * k;
      coins.forEach((c, i) => { c.rotation.y = t * 1.3 * k + i; c.position.y += Math.sin(t * 1.2 + i) * .002 * k; });
      g.scale.setScalar(Math.max(.55, Math.min(.95, camera.aspect / 1.5)));
    };
  });

  /* paid ads: growth chart + target + arrow */
  makeScene(document.getElementById('chartGL'), (scene, camera) => {
    const g = new THREE.Group(); scene.add(g);
    const acc = soft(0xff154e, .4), white = soft(0xf6f2f3), ink = soft(0x2a1f23, .6);

    const heights = [.9, 1.5, 2.1, 2.8, 3.5], cols = [0xffd6de, 0xffc0cd, 0xffa3b6, 0xff6f8d, 0xff154e];
    const bars = heights.map((h, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(.58, 1, .58), soft(cols[i], .45));
      m.position.set(-2.3 + i * .78, -1.9 + h / 2, -.3); m.scale.y = h; m.userData = { h, i }; g.add(m); return m;
    });

    const V = THREE.Vector3;
    const curve = new THREE.CatmullRomCurve3([new V(-2.6, -.9, .9), new V(-1.3, -.1, .9), new V(0, .35, .9), new V(1.1, 1.4, .9), new V(2.0, 2.5, .9)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, .09, 12), acc));
    const tan = curve.getTangentAt(1).normalize();
    const head = new THREE.Mesh(new THREE.ConeGeometry(.26, .6, 28), acc);
    head.position.copy(curve.getPoint(1)).addScaledVector(tan, .18); head.quaternion.setFromUnitVectors(new V(0, 1, 0), tan); g.add(head);

    const tOuter = new THREE.Group(), tInner = new THREE.Group(); tInner.rotation.x = Math.PI / 2; tOuter.add(tInner);
    [[1.3, white], [1.05, acc], [.78, white], [.5, acc], [.24, white]].forEach(([r, m], i) => {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .12, 56), m); d.position.y = i * .04; tInner.add(d);
    });
    const dart = new THREE.Group(); dart.position.y = .2; dart.rotation.z = .35;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1.3, 16), ink); shaft.position.y = .75;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.08, .28, 16), ink); tip.rotation.x = Math.PI; tip.position.y = .0;
    const fin1 = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .02), acc), fin2 = fin1.clone(); fin1.position.y = fin2.position.y = 1.35; fin2.rotation.y = Math.PI / 2;
    dart.add(shaft, tip, fin1, fin2); tInner.add(dart);
    tOuter.position.set(2.6, -.5, .2); tOuter.rotation.set(-.2, -.5, 0); g.add(tOuter);

    const coins = [makeCoin(-3.0, 2.3, .4), makeCoin(.5, 2.9, -.3), makeCoin(3.3, 1.7, .2)]; coins.forEach(c => g.add(c));
    g.add(blob(6.5, 4, .2, -1.95, 0));
    g.position.y = -.55;

    return t => {
      const k = RM ? 0 : 1; smoothMouse();
      g.rotation.y = mouse.x * .35 - .12; g.rotation.x = mouse.y * .1;
      bars.forEach(b => { const f = .9 + .1 * Math.sin(t * 1.1 - b.userData.i * .6) * k; b.scale.y = b.userData.h * f; b.position.y = -1.9 + b.scale.y / 2; });
      tOuter.rotation.y = -.5 + Math.sin(t * .7) * .12 * k;
      dart.rotation.z = .35 + Math.sin(t * 2.4) * .03 * k;
      head.position.y += Math.sin(t * 2.5) * .003 * k;
      coins.forEach((c, i) => { c.rotation.y = t * 1.3 * k + i; });
      g.scale.setScalar(Math.max(.55, Math.min(.95, camera.aspect / 1.55)));
    };
  });

  /* ---------- parallax via individual `translate` (no clash with transforms) ---------- */
  const par = [...document.querySelectorAll('[data-speed]')];
  const parallax = () => {
    if (RM || innerWidth < 960) return;
    const vh = innerHeight;
    par.forEach(el => {
      const r = el.getBoundingClientRect(), c = r.top + r.height / 2 - vh / 2;
      el.style.translate = `0 ${(c * parseFloat(el.dataset.speed)).toFixed(1)}px`;
    });
  };

  /* ---------- one shared loop ----------
     Guarded per-piece: one bad frame (e.g. a lost WebGL context) must never stop
     requestAnimationFrame(loop) from being re-scheduled, or the whole page — including
     Lenis's smooth-scroll, which is driven from here — silently stops responding. */
  const loop = t => {
    try { if (lenis) lenis.raf(t); } catch (err) {}
    try { parallax(); } catch (err) {}
    for (const s of scenes) {
      if (!s.vis || s.dead) continue;
      try { s.render(t); } catch (err) { s.dead = true; s.vis = false; }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

/* ---------- page extras: wave bars, marquee, tabs, modal, before/after ---------- */
(() => {
  document.querySelectorAll('.wave').forEach(w => {
    for (let i = 0; i < 64; i++) { const b = document.createElement('i'); b.style.height = (20 + Math.abs(Math.sin(i * .7) * Math.cos(i * .21)) * 70 + Math.random() * 10) + '%'; w.appendChild(b); }
  });
  document.querySelectorAll('.marq-track').forEach(t => { t.innerHTML = t.innerHTML.repeat(4); });   // 4 copies so the loop never shows a gap

  // before / after sliders
  document.querySelectorAll('.ba').forEach(ba => {
    const input = ba.querySelector('input');
    input.addEventListener('input', () => ba.style.setProperty('--pos', input.value));
  });

})();

/* ---------- edit example players (raw vs edited) ---------- */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const ICON = { play: '<svg viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z"/></svg>', pause: '<svg viewBox="0 0 14 14"><path d="M2.5 1.5h3v11h-3zM8.5 1.5h3v11h-3z"/></svg>' };
  const hi = s => s.replace(/\*(.+?)\*/g, '<mark>$1</mark>');

  document.querySelectorAll('.vp').forEach(vp => {
    const $ = q => vp.querySelector(q);
    const btn = $('.vp-btn'), track = $('.vp-track'), tl = $('.vp-time');
    const hook = $('.edit .hook'), cap = $('.edit .cap2'), sticker = $('.edit .sticker'), tc = $('.raw .tc');
    const caps = JSON.parse(vp.dataset.caps || '[]'), stk = JSON.parse(vp.dataset.sticker || 'null');
    const logs = [...(vp.closest('.ex')?.querySelectorAll('.log li') || [])];
    const videos = [];
    let dur = +vp.dataset.dur, t = 0, playing = false, userPaused = false, last = -2, prev = 0, real = false;

    // markers from the edit log
    logs.forEach(l => { const m = document.createElement('i'); m.className = 'mk'; m.dataset.t = l.dataset.t; m.style.setProperty('--l', (l.dataset.t / dur * 100) + '%'); track.appendChild(m); });

    // real videos, if provided (data-raw / data-edited)
    if (vp.dataset.raw && vp.dataset.edited) {
      real = true;
      [['.raw', vp.dataset.raw], ['.edit', vp.dataset.edited]].forEach(([sel, src]) => {
        const v = document.createElement('video');
        v.src = src; v.muted = true; v.playsInline = true; v.preload = 'metadata';
        $(sel + ' .sc').replaceWith(v); videos.push(v);
      });
      videos[1].addEventListener('loadedmetadata', () => { dur = videos[1].duration; });
    }

    const pop = el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };
    const render = () => {
      vp.style.setProperty('--p', Math.min(t / dur, 1));
      tl.textContent = fmt(t) + ' / ' + fmt(dur);
      track.querySelectorAll('.mk').forEach(m => m.classList.toggle('past', +m.dataset.t <= t));
      let on = -1; logs.forEach((l, i) => { if (+l.dataset.t <= t) on = i; });
      logs.forEach((l, i) => l.classList.toggle('on', i === on));
      if (real) return;
      tc.textContent = '00:14:' + String(22 + Math.floor(t)).padStart(2, '0');
      let idx = -1; caps.forEach((c, i) => { if (t >= c[0]) idx = i; });
      if (idx !== last) {
        const first = last < 0;
        last = idx;
        hook.innerHTML = idx >= 0 ? hi(caps[0][1]) : '';
        cap.innerHTML = idx >= 1 ? hi(caps[idx][1]) : '';
        if (idx === 0 && first) pop(hook); else if (idx >= 1) pop(cap);
        vp.style.setProperty('--z', idx % 2 ? 1.14 : 1);
        vp.style.setProperty('--hr', (Math.max(idx, 0) * 10) + 'deg');
      }
      if (sticker) { const show = stk && t >= stk[0]; if (show && sticker.hidden) pop(sticker); sticker.hidden = !show; if (stk) sticker.textContent = stk[1]; }
    };

    const seek = x => {
      t = Math.max(0, Math.min(x, dur)); last = -2;
      if (real) videos.forEach(v => { v.currentTime = t; });
      render();
    };
    const tick = now => {
      if (!playing) return;
      const dt = Math.min((now - prev) / 1000, .1); prev = now;
      if (real) t = videos[1].currentTime; else t += dt;
      if (t >= dur - .05) seek(0);
      render();
      requestAnimationFrame(tick);
    };
    const play = () => {
      if (playing) return;
      playing = true; vp.classList.add('playing'); btn.innerHTML = ICON.pause; btn.setAttribute('aria-label', 'Pause');
      if (real) videos.forEach(v => v.play().catch(() => {}));
      prev = performance.now(); requestAnimationFrame(tick);
    };
    const pause = () => {
      playing = false; vp.classList.remove('playing'); btn.innerHTML = ICON.play; btn.setAttribute('aria-label', 'Play');
      if (real) videos.forEach(v => v.pause());
    };

    btn.addEventListener('click', () => {
      if (playing) { userPaused = true; pause(); }
      else { userPaused = false; if (real) videos[1].muted = false; play(); }
    });
    track.addEventListener('click', e => { const r = track.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * dur); });
    logs.forEach(l => l.addEventListener('click', () => {
      seek(+l.dataset.t + .05); userPaused = false; play();
      if (innerWidth < 960) {                       // phones: bring the player into view
        const y = vp.getBoundingClientRect().top + scrollY - 90;
        window.__lenis ? window.__lenis.scrollTo(y, { duration: 1 }) : scrollTo({ top: y, behavior: 'smooth' });
      }
    }));

    btn.innerHTML = ICON.play; render();
    if (!RM) new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused) play(); else if (!e.isIntersecting) pause();
    }, { threshold: .55 }).observe(vp);
  });
})();

/* email button: on desktop open Gmail's compose window (mailto often does nothing without a mail app);
   on phones keep the normal mailto so the Gmail / Mail app opens */
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-mail]');
  if (!a || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  e.preventDefault();
  const to = a.getAttribute('href').replace(/^mailto:/i, '');
  window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(to) + '&su=' + encodeURIComponent('Enquiry from the Growfar website'), '_blank', 'noopener');
});

/* ---------- live reels: autoplaying phone screens ----------
   Each .reel is one of:
     - a demo animation (default)
     - a real file:      data-src="videos/x.mp4"  (+ optional data-poster)
     - a YouTube Short:  data-yt="VIDEO_ID"
   Only reels that are on screen play; the rest are paused. */
(() => {
  const reels = [...document.querySelectorAll('.reel')];
  if (!reels.length) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hi = s => s.replace(/\*(.+?)\*/g, '<mark>$1</mark>');
  const pop = el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };
  const active = new Set(), states = [];

  const setIcon = (s, on) => {
    const b = s.r.querySelector('.reel-snd'); if (!b) return;
    b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  };
  const muteAll = except => states.forEach(o => {
    if (o === except) return;
    if (o.video) o.video.muted = true;
    if (o.yt) o.ytCmd('mute');
    o.soundOn = false; setIcon(o, false);
  });

  reels.forEach((r, n) => {
    const sc = r.querySelector('.sc'), snd = r.querySelector('.reel-snd');
    const s = {
      r, sc, dur: +r.dataset.dur || 12, t: n * 1.7 % 6, last: -2, video: null, yt: null, soundOn: false,
      caps: JSON.parse(r.dataset.caps || '[]'), stk: JSON.parse(r.dataset.sticker || 'null'),
      hook: sc.querySelector('.hook'), cap: sc.querySelector('.cap2'), sticker: sc.querySelector('.sticker'), bar: sc.querySelector('.bar')
    };

    if (r.dataset.src) {                                         // ----- real video file
      const v = document.createElement('video');
      v.src = r.dataset.src; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
      if (r.dataset.poster) v.poster = r.dataset.poster;
      v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      const demo = sc.innerHTML;
      v.addEventListener('error', () => {                        // file missing -> back to the demo
        v.remove(); sc.innerHTML = demo; r.classList.remove('has-video'); snd.hidden = true; s.video = null;
        Object.assign(s, { hook: sc.querySelector('.hook'), cap: sc.querySelector('.cap2'), sticker: sc.querySelector('.sticker'), bar: sc.querySelector('.bar') });
      });
      sc.innerHTML = ''; sc.appendChild(v); s.video = v; r.classList.add('has-video'); snd.hidden = false;
      snd.addEventListener('click', () => {
        const on = v.muted; muteAll(s); v.muted = !on; s.soundOn = on; setIcon(s, on);
      });
    } else if (r.dataset.yt) {                                   // ----- YouTube Short (embedded)
      const id = r.dataset.yt;
      s.yt = { id, frame: null };
      s.ytCmd = (func, args = []) => { try { s.yt.frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch (e) {} };
      s.ytLoad = () => {
        if (s.yt.frame) return;
        if (location.protocol === 'file:') {                    // YouTube refuses embeds from local files
          sc.innerHTML = `<a class="yt-fb" href="https://www.youtube.com/shorts/${id}" target="_blank" rel="noopener" style="background-image:url(https://i.ytimg.com/vi/${id}/hq2.jpg)"><span>▶ Watch on YouTube</span></a>`;
          s.yt.frame = sc; r.classList.add('has-video'); return;
        }
        const q = new URLSearchParams({ autoplay: 1, mute: 1, loop: 1, playlist: id, controls: 0, modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3, fs: 0, enablejsapi: 1 });
        if (/^https?:$/.test(location.protocol)) q.set('origin', location.origin);
        const f = document.createElement('iframe');
        f.src = `https://www.youtube.com/embed/${id}?${q}`;
        f.title = 'YouTube Short'; f.allow = 'autoplay; encrypted-media; picture-in-picture; web-share'; f.referrerPolicy = 'strict-origin-when-cross-origin';
        sc.innerHTML = ''; sc.appendChild(f); s.yt.frame = f; r.classList.add('has-video', 'has-yt'); snd.hidden = false;
      };
      snd.addEventListener('click', () => {
        const on = !s.soundOn; muteAll(s);
        s.soundOn = on; setIcon(s, on);
        if (on) { s.ytCmd('unMute'); s.ytCmd('setVolume', [100]); s.ytCmd('playVideo'); } else s.ytCmd('mute');
      });
    }
    states.push(s);
  });

  const render = s => {
    if (s.video || s.yt || !s.bar) return;
    s.bar.style.width = (s.t / s.dur * 100) + '%';
    let idx = -1; s.caps.forEach((c, i) => { if (s.t >= c[0]) idx = i; });
    if (idx !== s.last) {
      const first = s.last < 0; s.last = idx;
      s.hook.innerHTML = idx >= 0 ? hi(s.caps[0][1]) : '';
      s.cap.innerHTML = idx >= 1 ? hi(s.caps[idx][1]) : '';
      if (idx === 0 && first) pop(s.hook); else if (idx >= 1) pop(s.cap);
      s.r.style.setProperty('--z', idx % 2 ? 1.14 : 1);
      s.r.style.setProperty('--hr', (Math.max(idx, 0) * 8) + 'deg');
    }
    if (s.stk) { const show = s.t >= s.stk[0]; if (show && s.sticker.hidden) pop(s.sticker); s.sticker.hidden = !show; s.sticker.textContent = s.stk[1]; }
  };

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    const s = states.find(x => x.r === e.target); if (!s) return;
    if (e.isIntersecting) {
      active.add(s); s.video?.play().catch(() => {});
      if (s.yt) { if (!s.yt.frame) s.ytLoad(); else s.ytCmd('playVideo'); }
    } else {
      active.delete(s); s.video?.pause();
      if (s.yt) s.ytCmd('pauseVideo');
    }
  }), { threshold: .35 });
  states.forEach(s => { io.observe(s.r); if (RM && !s.video && !s.yt) { s.t = s.dur * .62; render(s); } });

  let prev = performance.now();
  const loop = now => {
    const dt = Math.min((now - prev) / 1000, .1); prev = now;
    if (!RM) active.forEach(s => { if (s.video || s.yt) return; s.t += dt; if (s.t >= s.dur) { s.t = 0; s.last = -2; } render(s); });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

/* ---------- pricing: Clip the mascot talks about the hovered plan ---------- */
(() => {
  const bubble = document.getElementById('pmBubble'), text = document.getElementById('pmText');
  const mascot = document.querySelector('.pm-mascot');
  if (!bubble || !text) return;
  const say = msg => {
    if (text.textContent === msg) return;
    text.textContent = msg;
    bubble.classList.remove('say'); mascot.classList.remove('talk');
    void bubble.offsetWidth;
    bubble.classList.add('say'); mascot.classList.add('talk');
  };
  document.querySelectorAll('.pm-card').forEach(c => {
    c.addEventListener('mouseenter', () => say(c.dataset.say));
    c.addEventListener('focus', () => say(c.dataset.say));
    c.addEventListener('mouseleave', () => say(text.dataset.default));
    c.addEventListener('blur', () => say(text.dataset.default));
  });
})();

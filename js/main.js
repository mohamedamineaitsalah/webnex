/* =========================================================
   WEBNEX — interactions
   Vanilla JS, no dependencies.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body = document.body;

  /* ---------- Preloader ---------- */
  const start = performance.now();
  const ready = () => {
    const wait = reduceMotion ? 0 : Math.max(0, 1300 - (performance.now() - start));
    setTimeout(() => {
      body.classList.remove('is-loading');
      requestAnimationFrame(() => body.classList.add('is-ready'));
    }, wait);
  };
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready, { once: true });
  // Safety net in case some asset hangs
  setTimeout(() => { if (body.classList.contains('is-loading')) ready(); }, 1500);

  /* ---------- Smooth-scroll for all anchor links ---------- */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    }
  });

  /* ---------- Year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state, hide on scroll down, progress ---------- */
  const nav = $('#site-nav');
  const progress = $('.scroll-progress span');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    nav.classList.toggle('is-scrolled', y > 30);
    const menuOpen = toggle.getAttribute('aria-expanded') === 'true';
    nav.classList.toggle('is-hidden', !menuOpen && y > 600 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
    updateManifesto();
    updateSteps();
    if (y < 100 && links.length) {
      links.forEach(a => a.classList.remove('is-active'));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- Active nav link ---------- */
  const links = $$('.nav__links a');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach(s => navIO.observe(s));

  /* ---------- Mobile menu ---------- */
  const toggle = $('#nav-toggle');
  const menu = $('#mobile-menu');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      nav.classList.remove('is-hidden');
      setTimeout(() => $('a', menu)?.focus(), 200);
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 400);
    }
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', () => { if (innerWidth > 1060 && toggle.getAttribute('aria-expanded') === 'true') setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  $$('.reveal').forEach(el => revealIO.observe(el));

  /* ---------- Hero: flowing light waves (canvas) ---------- */
  const waves = $('.hero__waves');
  if (waves) {
    const ctx = waves.getContext('2d');
    let w, h, dpr, t = 0, running = true, raf;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = waves.clientWidth; h = waves.clientHeight;
      waves.width = w * dpr; waves.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const bundles = [
        { y: h * 0.82, amp: h * 0.10, len: w * 0.9, hue: 'rgba(43,184,255,', count: 14, speed: 0.6, tilt: -0.28 },
        { y: h * 0.16, amp: h * 0.07, len: w * 1.1, hue: 'rgba(31,107,255,', count: 10, speed: 0.4, tilt: 0.18 },
      ];
      bundles.forEach((b, bi) => {
        for (let i = 0; i < b.count; i++) {
          ctx.beginPath();
          const off = i * 7;
          for (let x = -40; x <= w + 40; x += 16) {
            const y = b.y + (x - w / 2) * b.tilt
              + Math.sin(x * 0.0042 + t * b.speed + i * 0.16 + bi) * (b.amp + i * 1.4)
              + Math.cos(x * 0.0017 - t * 0.3 + i * 0.1) * 18 + off;
            x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          const a = (0.05 + (i / b.count) * 0.22) * (bi ? 0.7 : 1);
          ctx.strokeStyle = b.hue + a + ')';
          ctx.lineWidth = i === b.count - 1 ? 1.6 : 1;
          ctx.stroke();
        }
      });
      t += 0.008;
      if (running && !reduceMotion) raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener('resize', () => { resize(); if (reduceMotion || !running) draw(); });
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (running && !reduceMotion) draw();
    }).observe(waves);
  }

  /* ---------- Hero: pointer parallax + spotlight ---------- */
  const hero = $('.hero');
  const stage = $('[data-parallax-root]');
  if (hero && stage && finePointer && !reduceMotion) {
    const layers = $$('[data-depth]', stage);
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty('--mx', e.clientX - r.left + 'px');
      hero.style.setProperty('--my', e.clientY - r.top + 'px');
      stage.style.setProperty('--ry', (nx * 10).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (-ny * 8).toFixed(2) + 'deg');
      layers.forEach(l => {
        const d = parseFloat(l.dataset.depth);
        l.style.setProperty('--tx', (nx * d * -26).toFixed(1) + 'px');
        l.style.setProperty('--ty', (ny * d * -22).toFixed(1) + 'px');
      });
    });
    hero.addEventListener('pointerleave', () => {
      stage.style.setProperty('--ry', '0deg'); stage.style.setProperty('--rx', '0deg');
      layers.forEach(l => { l.style.setProperty('--tx', '0px'); l.style.setProperty('--ty', '0px'); });
    });
  }

  /* ---------- Hero: word rotator ---------- */
  const words = $$('.rotator__word');
  if (words.length > 1 && !reduceMotion) {
    let i = 0;
    setInterval(() => {
      const cur = words[i];
      cur.classList.remove('is-active'); cur.classList.add('is-leaving');
      setTimeout(() => cur.classList.remove('is-leaving'), 700);
      i = (i + 1) % words.length;
      words[i].classList.add('is-active');
    }, 2400);
  }

  /* ---------- Hero: typing code card ---------- */
  const codeEl = $('#hero-code');
  if (codeEl) {
    const tokens = [
      ['c', '// turning ideas into websites\n'],
      ['k', 'const '], ['', 'site = '], ['f', 'webnex'], ['', '.build({\n'],
      ['', '  design: '], ['s', "'modern'"], ['', ',\n'],
      ['', '  speed: '], ['s', "'fast'"], ['', ',\n'],
      ['', '  devices: '], ['s', "'all'"], ['', ',\n'],
      ['', '});\n'],
      ['f', 'site'], ['', '.launch();'],
    ];
    const full = tokens.map(([c, t]) => c ? `<span class="${c}">${t}</span>` : t).join('');
    if (reduceMotion) { codeEl.innerHTML = full; }
    else {
      let ti = 0, ci = 0, html = '';
      const step = () => {
        if (ti >= tokens.length) {
          codeEl.innerHTML = html + '<span class="caret"></span>';
          setTimeout(() => { ti = 0; ci = 0; html = ''; step(); }, 4200);
          return;
        }
        const [cls, text] = tokens[ti];
        ci++;
        const part = text.slice(0, ci);
        codeEl.innerHTML = html + (cls ? `<span class="${cls}">${part}</span>` : part) + '<span class="caret"></span>';
        if (ci >= text.length) {
          html += cls ? `<span class="${cls}">${text}</span>` : text;
          ti++; ci = 0;
        }
        setTimeout(step, text[ci - 1] === '\n' ? 160 : 28 + Math.random() * 40);
      };
      setTimeout(step, 1800);
    }
  }

  /* ---------- Manifesto: words light up with scroll ---------- */
  const manifesto = $('[data-manifesto]');
  let mWords = [];
  if (manifesto) {
    const accent = new Set(['template.', 'passion', 'experiences', 'grow']);
    const text = manifesto.textContent.trim().replace(/\s+/g, ' ');
    manifesto.setAttribute('aria-label', text);
    manifesto.innerHTML = text.split(' ').map(w => {
      const key = w.replace(/[,—]/g, '');
      return `<span class="w${accent.has(key) ? ' is-accent' : ''}" aria-hidden="true">${w}</span>`;
    }).join(' ');
    mWords = $$('.w', manifesto);
  }
  function updateManifesto() {
    if (!manifesto || reduceMotion) return;
    const r = manifesto.getBoundingClientRect();
    const startY = innerHeight * 0.85, endY = innerHeight * 0.35;
    const p = Math.min(1, Math.max(0, (startY - r.top) / (r.height + startY - endY)));
    const lit = Math.round(p * mWords.length * 1.15);
    mWords.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
  }

  /* ---------- Services tabs ---------- */
  const tabs = $$('.svc');
  const panels = $$('.viz');
  const slug = $('[data-svc-slug]');
  const caption = $('[data-svc-caption]');
  const slugs = ['development', 'ui-ux-design', 'business', 'landing-page', 'store', 'web-app'];
  const activateSvc = (idx, focus = false) => {
    tabs.forEach((t, i) => {
      const on = i === idx;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, i) => {
      const on = i === idx;
      if (on && !p.classList.contains('is-active')) {
        // restart CSS animations inside the panel
        p.classList.remove('is-active'); void p.offsetWidth;
      }
      p.classList.toggle('is-active', on);
    });
    if (slug) slug.textContent = slugs[idx];
    if (caption) caption.textContent = $('.svc__name', tabs[idx]).textContent;
    if (focus) tabs[idx].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activateSvc(i));
    if (finePointer) t.addEventListener('mouseenter', () => activateSvc(i));
    t.addEventListener('keydown', e => {
      const map = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      if (e.key in map) { e.preventDefault(); activateSvc((i + map[e.key] + tabs.length) % tabs.length, true); }
      if (e.key === 'Home') { e.preventDefault(); activateSvc(0, true); }
      if (e.key === 'End') { e.preventDefault(); activateSvc(tabs.length - 1, true); }
    });
  });

  /* ---------- Project tilt ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--try', (nx * 7).toFixed(2) + 'deg');
        el.style.setProperty('--trx', (-ny * 6).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--try', '0deg'); el.style.setProperty('--trx', '0deg'); });
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('#lightbox-img');
  const lbCap = $('#lightbox-caption');
  const lbUrl = $('#lightbox-url');
  let lbTrigger = null;
  $$('[data-lightbox]').forEach(btn => btn.addEventListener('click', () => {
    lbTrigger = btn;
    lbImg.src = btn.dataset.lightbox;
    lbImg.alt = btn.dataset.lightboxAlt || '';
    lbCap.textContent = btn.dataset.lightboxCaption || '';
    lbUrl.textContent = (btn.dataset.lightboxCaption || 'preview').split(' — ')[0].toLowerCase().replace(/\s+/g, '') + '.concept';
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
  }));
  const closeLb = () => { lb.close ? lb.close() : lb.removeAttribute('open'); };
  $('#lightbox-close').addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  lb.addEventListener('close', () => lbTrigger && lbTrigger.focus());

  /* ---------- Process: scroll-driven steps ---------- */
  const steps = $$('.step');
  const stepsList = $('#process-steps');
  const pStage = $('#process-stage');
  const psUrl = $('[data-ps-url]');
  const psStep = $('[data-ps-step]');
  const psBar = $('.ps-progress');
  const urls = ['brief.webnex', 'design.webnex', 'localhost:3000', 'staging.webnex', 'yourbrand.com'];
  let activeStep = 1;
  let manualUntil = 0;
  const setStep = n => {
    if (n === activeStep && pStage.dataset.active == n) return;
    activeStep = n;
    pStage.dataset.active = n;
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i + 1 === n);
      s.classList.toggle('is-done', i + 1 < n);
    });
    psUrl.textContent = urls[n - 1];
    psStep.textContent = `0${n} / 05`;
    psBar.style.setProperty('--pp', n / 5);
  };
  function updateSteps() {
    if (!stepsList) return;
    const r = stepsList.getBoundingClientRect();
    const focusLine = innerHeight * 0.5;
    const p = Math.min(1, Math.max(0, (focusLine - r.top) / r.height));
    stepsList.style.setProperty('--sp', p.toFixed(3));
    if (Date.now() < manualUntil) return;
    let current = 1;
    steps.forEach((s, i) => {
      const sr = s.getBoundingClientRect();
      if (sr.top < innerHeight * (innerWidth <= 1060 ? 0.72 : 0.55)) current = i + 1;
    });
    setStep(current);
  }
  steps.forEach((s, i) => $('.step__btn', s).addEventListener('click', () => {
    manualUntil = Date.now() + 1200;
    setStep(i + 1);
  }));

  /* ---------- Why: compare slider ---------- */
  const compare = $('#compare');
  const cmpRange = $('#compare-range');
  if (compare && cmpRange) {
    const upd = () => compare.style.setProperty('--pos', cmpRange.value + '%');
    cmpRange.addEventListener('input', upd);
    // gentle hint animation once visible
    if (!reduceMotion) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let t0 = null;
        const anim = ts => {
          if (!t0) t0 = ts;
          const k = (ts - t0) / 1600;
          if (k >= 1 || cmpRange.dataset.touched) { if (!cmpRange.dataset.touched) { cmpRange.value = 50; upd(); } return; }
          cmpRange.value = 50 + Math.sin(k * Math.PI * 2) * 22; upd();
          requestAnimationFrame(anim);
        };
        setTimeout(() => requestAnimationFrame(anim), 500);
      }, { threshold: 0.6 });
      io.observe(compare);
    }
    cmpRange.addEventListener('pointerdown', () => { cmpRange.dataset.touched = '1'; });
    cmpRange.addEventListener('keydown', () => { cmpRange.dataset.touched = '1'; });
  }

  /* ---------- Why: responsive demo ---------- */
  const respRange = $('#resp-range');
  const respVp = $('#resp-viewport');
  const respOut = $('#resp-out');
  if (respRange && respVp) {
    const upd = () => {
      const v = +respRange.value;
      respVp.style.setProperty('--rw', v + '%');
      respRange.style.setProperty('--fill', ((v - 34) / 66 * 100) + '%');
      respOut.textContent = v > 80 ? 'Desktop' : v > 55 ? 'Tablet' : 'Mobile';
    };
    respRange.addEventListener('input', upd); upd();
  }

  /* ---------- Contact: stars canvas ---------- */
  const stars = $('.contact__stars');
  if (stars) {
    const c = stars.getContext('2d');
    let pts = [], sw, sh, raf2, on = false;
    const init = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      sw = stars.clientWidth; sh = stars.clientHeight;
      stars.width = sw * dpr; stars.height = sh * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: Math.round(sw * sh / 9000) }, () => ({
        x: Math.random() * sw, y: Math.random() * sh, r: Math.random() * 1.2 + 0.2, p: Math.random() * 6.28, s: 0.005 + Math.random() * 0.02,
      }));
    };
    const loop = () => {
      c.clearRect(0, 0, sw, sh);
      pts.forEach(p => {
        p.p += p.s;
        c.globalAlpha = 0.25 + Math.sin(p.p) * 0.25 + 0.25;
        c.fillStyle = p.r > 1 ? '#3ee8ff' : '#c5d0ea';
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.28); c.fill();
      });
      if (on && !reduceMotion) raf2 = requestAnimationFrame(loop);
    };
    init(); loop();
    window.addEventListener('resize', () => { init(); loop(); });
    new IntersectionObserver(([e]) => { on = e.isIntersecting; cancelAnimationFrame(raf2); if (on) loop(); }).observe(stars);
  }

  /* ---------- Toast ---------- */
  const toast = $('#toast');
  let toastT;
  const showToast = msg => {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };

  /* ---------- Copy email ---------- */
  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    showToast('Email copied — ' + text);
  }));

  /* ---------- Contact form (mailto / WhatsApp) ---------- */
  const form = $('#contact-form');
  const err = $('#form-error');
  const EMAIL = 'webnextagency1@gmail.com';
  const WA = '212697936897';
  const collect = () => {
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const type = (form.querySelector('input[name="type"]:checked') || {}).value || 'Website';
    const problems = [];
    [form.name, form.email, form.message].forEach(f => f.classList.remove('is-invalid'));
    if (!name) { problems.push('your name'); form.name.classList.add('is-invalid'); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { problems.push('a valid email'); form.email.classList.add('is-invalid'); }
    if (message.length < 5) { problems.push('a short project description'); form.message.classList.add('is-invalid'); }
    if (problems.length) {
      err.textContent = 'Please add ' + problems.join(', ') + '.';
      form.querySelector('.is-invalid').focus();
      return null;
    }
    err.textContent = '';
    return { name, email, message, type };
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = collect();
    if (!d) return;

    const submitBtn = $('#form-send');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Sending...</span>';
    submitBtn.style.pointerEvents = 'none';
    submitBtn.style.opacity = '0.7';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        showToast('Message sent successfully!');
        form.reset();
      } else {
        showToast('Oops! Something went wrong.');
      }
    } catch (error) {
      showToast('Oops! Network error.');
    } finally {
      submitBtn.innerHTML = originalContent;
      submitBtn.style.pointerEvents = 'auto';
      submitBtn.style.opacity = '1';
    }
  });
  [form.name, form.email, form.message].forEach(f => f.addEventListener('input', () => f.classList.remove('is-invalid')));

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Marquee optimization ---------- */
  const marquee = $('.marquee');
  if (marquee) {
    const track = $('.marquee__track', marquee);
    new IntersectionObserver(([e]) => {
      if (track) track.style.animationPlayState = e.isIntersecting ? '' : 'paused';
    }).observe(marquee);
  }

  /* ---------- Initial run ---------- */
  onScroll();

  /* ---------- Hello, developer ---------- */
  console.log('%cWEBNEX%c  We build digital experiences.\nLike what you see under the hood? → webnextagency1@gmail.com',
    'font:800 22px Montserrat,sans-serif;color:#3ee8ff', 'font:13px sans-serif;color:#8d9bbd');
})();

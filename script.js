(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Scroll progress bar + nav shadow */
  const bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 2. Typewriter effect on the page heading */
  const title = document.querySelector('.page-title');
  if (title && !reduce) {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    title.textContent = '';
    title.classList.add('typing');
    let i = 0;
    const type = () => {
      title.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(type, 35);
      else setTimeout(() => title.classList.remove('typing'), 1500);
    };
    setTimeout(type, 300);
  }

  /* 3. Reveal on scroll, staggered */
  const targets = document.querySelectorAll(
    'main h2, main .card, main .pic, main blockquote, main .table-wrap, main .timeline li, main .tags'
  );
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('in');
        io.unobserve(el);
        // remove reveal classes afterwards so normal hover effects are untouched
        setTimeout(() => {
          el.classList.remove('reveal', 'in');
          el.style.removeProperty('--d');
        }, 1200);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.matches(targets.length ? 'main .card, main .pic, main .timeline li' : '*'));
      const idx = siblings.indexOf(el);
      el.style.setProperty('--d', (idx > 0 ? Math.min(idx, 5) * 0.09 : 0) + 's');
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* 4. Cursor spotlight on cards and picture frames */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.card, .pic').forEach((el) => {
      el.addEventListener('pointermove', (ev) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ev.clientX - r.left + 'px');
        el.style.setProperty('--my', ev.clientY - r.top + 'px');
      });
    });
  }

  /* 5. Dark / light mode toggle */
  const root = document.documentElement;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  const setLabel = () => {
    const light = root.getAttribute('data-theme') === 'light';
    btn.textContent = light ? '\u263E Dark' : '\u2600 Light';
    btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  };
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    if (!reduce) {
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 400);
    }
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    setLabel();
  });
  setLabel();
  if (nav) nav.appendChild(btn);

  /* 6. Keep content below the fixed nav (fixes overlap on phones) */
  if (nav) {
    const setNavH = () => root.style.setProperty('--nav-h', nav.offsetHeight + 'px');
    setNavH();
    window.addEventListener('resize', setNavH);
    if ('ResizeObserver' in window) new ResizeObserver(setNavH).observe(nav);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setNavH);
  }
})();

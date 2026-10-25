/* THE APPLICATION.exe V0.4 — The Story Experience.
   Progressive one-page CV. Native scrolling, five chapter dots, original Hook.
   No external requests, no frameworks, no telemetry. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ids = ['who', 'marketing', 'proof', 'plan', 'decision'];
  const sections = ids.map($);
  const shell = $('appShell');
  const dots = $('storyDots');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touch = window.matchMedia('(hover: none)');
  const STORAGE_KEY = 'the_application_exe_stage2_progress_v1'; // Preserve V0.2-V0.3.1 progress.
  let started = false;
  let currentChapter = null;
  let activeSubView = 'hub';
  let raf = null;
  let audioEnabled = false;
  let audioContext = null;
  let mobileArmed = false;
  let previousFocus = null;

  function getProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return data && typeof data === 'object' ? data : {};
    } catch (_) { return {}; }
  }
  function rememberChapter(id) {
    if (!ids.includes(id)) return;
    try {
      const p = getProgress();
      const visited = Array.isArray(p.visited) ? p.visited.filter(key => ids.includes(key)) : [];
      if (!visited.includes(id)) visited.push(id);
      p.visited = visited;
      p.lastChapter = id;
      // Keep earned achievements and any unknown keys intact; no noisy toasts.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (_) { /* Browser may block storage; the page still works. */ }
  }
  function announce(text) { $('liveRegion').textContent = text; }
  function playClick() {
    if (!audioEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audioContext) audioContext = new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(510, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.065);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.025, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.11);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(); osc.stop(audioContext.currentTime + 0.12);
    } catch (_) { /* Audio is always optional. */ }
  }
  $('soundButton').addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    $('soundButton').setAttribute('aria-pressed', String(audioEnabled));
    $('soundButton').setAttribute('aria-label', audioEnabled ? 'Dezactivează sunetul' : 'Activează sunetul');
    $('soundButton').title = audioEnabled ? 'Sunet activat' : 'Sunet dezactivat';
    $('soundLabel').textContent = audioEnabled ? 'SOUND ON' : 'SOUND OFF';
    announce(audioEnabled ? 'Sunet activat' : 'Sunet dezactivat');
    playClick();
  });

  // Original playful Hook: the same button changes on hover; touch needs two taps.
  function tease(on) {
    $('noButton').classList.toggle('is-teasing', on);
    $('noButtonText').textContent = on ? 'Da, normal, abia aștept!' : 'Nu mă interesează';
  }
  function resetTease() { mobileArmed = false; tease(false); }
  $('noButton').addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') tease(true);
  });
  $('noButton').addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') resetTease();
  });
  $('noButton').addEventListener('focus', () => { if (!touch.matches) tease(true); });
  $('noButton').addEventListener('blur', () => { if (!touch.matches) resetTease(); });
  $('noButton').addEventListener('click', () => {
    if (touch.matches && !mobileArmed) {
      mobileArmed = true;
      tease(true);
      announce('Surpriză! Apasă încă o dată pentru a continua.');
      return;
    }
    openStory('who');
  });
  $('startButton').addEventListener('click', () => openStory('who'));

  // Accessible optional exit. Never forces an interview decision.
  function toggleExit(visible) {
    const panel = $('exitOverlay');
    if (visible) {
      previousFocus = document.activeElement;
      panel.hidden = false;
      // Keep keyboard and assistive-technology focus inside the modal.
      [...Array.from(shell.children).filter(node => node !== panel.parentElement), ...Array.from(panel.parentElement.children).filter(node => node !== panel)].forEach(node => { node.inert = true; });
      document.body.classList.add('story-exit-open');
      panel.querySelector('[data-action="close-exit"]')?.focus({ preventScroll:true });
    } else {
      panel.hidden = true;
      [...Array.from(shell.children).filter(node => node !== panel.parentElement), ...Array.from(panel.parentElement.children).filter(node => node !== panel)].forEach(node => { node.inert = false; });
      document.body.classList.remove('story-exit-open');
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll:true });
    }
  }
  $('introExitButton').addEventListener('click', () => toggleExit(true));
  document.querySelectorAll('[data-action="close-exit"]').forEach(b => b.addEventListener('click', () => toggleExit(false)));
  $('exitOverlay').addEventListener('click', e => { if (e.target === $('exitOverlay')) toggleExit(false); });
  document.addEventListener('keydown', e => {
    if ($('exitOverlay').hidden) return;
    if (e.key === 'Escape') { toggleExit(false); return; }
    if (e.key !== 'Tab') return;
    const controls = Array.from($('exitOverlay').querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el => !el.hidden);
    if (!controls.length) {e.preventDefault();return;}
    if (controls.length === 1) {e.preventDefault();controls[0].focus();return;}
    if (e.shiftKey && document.activeElement === controls[0]) {e.preventDefault();controls.at(-1).focus();}
    else if (!e.shiftKey && document.activeElement === controls.at(-1)) {e.preventDefault();controls[0].focus();}
  });

  function activateDot(id) {
    if (currentChapter === id) return;
    currentChapter = id;
    for (const button of dots.querySelectorAll('[data-target]')) {
      const selected = button.dataset.target === id;
      button.classList.toggle('is-active', selected);
      if (selected) button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
    }
    dots.hidden = !id;
    if (id) rememberChapter(id);
  }
  function findChapterAtViewport() {
    if (!started) return null;
    const line = window.innerHeight * 0.44;
    const first = sections[0].getBoundingClientRect();
    if (first.top > line) return null;
    let active = 'who';
    for (const node of sections) {
      if (node.getBoundingClientRect().top <= line) active = node.dataset.chapter;
    }
    return active;
  }
  function onScroll() {
    if (raf !== null) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      activateDot(findChapterAtViewport());
    });
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll, { passive:true });

  function goto(id, { smooth=true, focus=false, updateHistory=true }={}) {
    if (!started) return;
    const chapter = ids.includes(id) ? id : id.startsWith('marketing/') ? 'marketing' : null;
    if (!chapter) return;
    const subview = id.startsWith('marketing/') ? id : 'marketing';
    if (chapter === 'marketing') {
      if (activeSubView === 'arcade' && subview !== 'marketing/arcade') window.MarketingLab?.leave();
      window.MarketingLab?.enter(subview, {earn:()=>{}, go:goLabRoute});
      activeSubView = subview === 'marketing' ? 'hub' : subview.slice('marketing/'.length);
    } else if (activeSubView === 'arcade') {
      window.MarketingLab?.leave();
      activeSubView = 'hub';
    }
    if (updateHistory) {
      const fragment = '#' + encodeURIComponent(id);
      if (location.hash !== fragment) history.pushState({route:id}, '', fragment);
    }
    playClick();
    activateDot(chapter);
    // For lab subroutes, keep the visitor in the corresponding story act.
    // No jump back to the chapter headline every time a demo is opened.
    const destination = chapter === 'marketing' && subview !== 'marketing'
      ? document.getElementById('lab-' + subview.slice('marketing/'.length)) : $(chapter);
    destination?.scrollIntoView({behavior: smooth && !motion.matches ? 'smooth' : 'instant', block:'start'});
    if (focus) {
      const node = chapter === 'marketing' ? $(chapter).querySelector('.lab-view:not([hidden]) h2') : $(chapter).querySelector('h2');
      if (node) {
        node.setAttribute('tabindex','-1');
        node.focus({preventScroll:true});
      }
    }
    announce(`${ids.indexOf(chapter)+1} din ${ids.length}: ${dots.querySelector(`[data-target="${chapter}"]`).getAttribute('aria-label').replace(/^\d+ — /,'')}`);
  }
  function openStory(id) {
    if (!started) {
      started = true;
      shell.classList.remove('before-story');
      shell.classList.add('journey-started');
    }
    resetTease();
    goto(id, {smooth:false, focus:true});
  }
  function goLabRoute(route) { goto(route, {smooth:false}); }
  // A single delegated handler covers the original Marketing Lab buttons as well.
  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-scroll-to],[data-target],[data-go]');
    if (!nav) return;
    const target = nav.dataset.scrollTo || nav.dataset.target || nav.dataset.go;
    if (target === 'missions' || target === 'overview' || target === 'chapter') return;
    if (ids.includes(target) || target.startsWith('marketing/')) {
      e.preventDefault();
      if (!started) openStory(target);
      else if(target==='marketing' && nav.hasAttribute('data-go')) {
        const last = window.MarketingLab?.getView();
        const act = last==='secret'?'act-awareness':(['play','arcade','quiz'].includes(last)?'act-acquisition':last==='circle'?'act-retention':null);
        if(last==='arcade') window.MarketingLab?.leave();
        window.MarketingLab?.enter('marketing', {earn:()=>{},go:goLabRoute});
        activeSubView='hub';
        if(location.hash!=='#marketing')history.pushState({route:'marketing'},'', '#marketing');
        activateDot('marketing');
        (act?document.getElementById(act):document.getElementById('marketing'))?.scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});
        announce('Înapoi la povestea de marketing.');
      }
      else goto(target, {focus:nav.classList.contains('story-dot')});
    }
  });
  window.addEventListener('popstate', () => {
    if (!started) return;
    let target = 'who';
    try { target = decodeURIComponent(location.hash.slice(1)) || 'who'; } catch(_) {}
    if (ids.includes(target) || target.startsWith('marketing/')) goto(target,{smooth:false,updateHistory:false});
    else if (!location.hash) document.getElementById('intro').scrollIntoView({behavior:'instant'});
  });
  if (motion.matches) shell.classList.add('skip-intro');
  // Preserve the exact reading position ONLY when returning from the optional deep dive.
  // Ordinary first visits continue to start at the Hook (original behavior).
  const detailReturnKey = 'the_application_detail_return_v055';
  let detailReturn = null;
  try {
    const raw = sessionStorage.getItem(detailReturnKey);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Date.now() - data.savedAt < 30 * 60 * 1000) detailReturn = data;
      sessionStorage.removeItem(detailReturnKey);
    }
  } catch (_) { /* Keep navigating when storage is unavailable. */ }
  const queryReturn = new URLSearchParams(location.search).get('from') === 'analysis';
  if (detailReturn || queryReturn) {
    started = true;
    shell.classList.remove('before-story');
    shell.classList.add('journey-started');
    dots.hidden = false;
    const savedHash = detailReturn && typeof detailReturn.hash === 'string' ? detailReturn.hash : '#plan';
    const safeHash = savedHash.startsWith('#') ? savedHash : '#plan';
    history.replaceState({route:'plan'}, '', location.pathname + safeHash);
    const returnY = detailReturn && Number.isFinite(detailReturn.scrollY) ? Math.max(0, detailReturn.scrollY) : null;
    const restore = () => {
      if (returnY !== null) window.scrollTo({top:returnY,behavior:'instant'});
      else $('plan').scrollIntoView({block:'start',behavior:'instant'});
      activateDot(findChapterAtViewport() || 'plan');
      $('openDetailedPlan')?.focus({preventScroll:true});
    };
    requestAnimationFrame(() => requestAnimationFrame(restore));
  } else {
    // First visit: original personalized Hook, no surprise deep-link jumps.
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo({top:0,behavior:'instant'});
    dots.hidden = true;
  }
  $('openDetailedPlan')?.addEventListener('click', () => {
    try {
      sessionStorage.setItem(detailReturnKey, JSON.stringify({
        scrollY:window.scrollY, hash:location.hash || '#plan', savedAt:Date.now()
      }));
    } catch (_) { /* Native browser back continues to work without storage. */ }
  });
  // The browser may restore the original page from bfcache without re-executing this script.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try { sessionStorage.removeItem(detailReturnKey); } catch (_) {}
    onScroll();
  });
})();

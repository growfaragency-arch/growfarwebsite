/* =====================================================================
   Book-a-call flow  (popup wizard)
   ---------------------------------------------------------------------
   HOW TO ADD QUESTIONS
   Add an object to QUESTIONS below. Fields:
     id        unique key, e.g. 'budget'
     type      'choice' (pick one, auto-advances) | 'multi' (pick many) | 'text'
     title     the question shown to the visitor
     hint      small helper line under the title (optional)
     options   [{ value, label, desc, icon }]   (choice / multi only)
     required  true/false (default true)
     showIf    optional function to show the question only for some answers,
               e.g.  showIf: a => a.service === 'Paid ads'
   The "your details" step is always added at the end automatically.

   CALENDLY (default)
   - After the questions, the popup shows your Calendly calendar. Calendly then
     emails both of you the invite + meeting link + reminders.
   - CONFIG.calendlyPrefill controls how the client's answers reach Calendly:
       'summary'  all answers go into the FIRST Calendly question ("Please share
                  anything that will help prepare…") as one tidy block. Works
                  with the event as it is. (default)
       'separate' answer 1 -> a1, answer 2 -> a2 … so the Calendly event must
                  have matching custom questions in the same order.
   - Clear CONFIG.calendlyUrl ('') to use the built-in date/time form instead.

   HOW LEADS ARE SENT (only for the built-in form)
   - Set CONFIG.endpoint to a form URL (Formspree, Google Apps Script, Zapier,
     your own API). The answers are POSTed there as JSON.
   - If endpoint is empty, the visitor's email app opens with everything
     pre-filled to CONFIG.email.

   PEOPLE WHO ANSWER BUT DON'T BOOK (Calendly flow only)
   - The 5 answers already go to Calendly as prefill (see calendlyPrefill above) —
     every booking that completes shows them in the Calendly event.
   - But someone who answers all 5 questions and then closes the tab without
     finishing the Calendly step leaves no record anywhere. Set CONFIG.sheetEndpoint
     to a Google Apps Script Web App URL to also log those answers to a Google
     Sheet at that exact moment (see the setup steps given alongside this change).
     Leave it '' to skip this.
   ===================================================================== */
(() => {
  const CONFIG = {
    calendlyUrl: 'https://calendly.com/growfaragency/new-meeting',
    calendlyPrefill: 'summary',
    email: 'growfaragency@gmail.com',
    endpoint: '',            // e.g. 'https://formspree.io/f/xxxxxxx'
    sheetEndpoint: ''        // Google Apps Script /exec URL — logs the 5 answers even if they don't book
  };

  const ICON = {
    video: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5l5 2.5-5 2.5z"/></svg>',
    ads: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
    social: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    bundle: '<svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg>'
  };

  const QUESTIONS = [
    {
      id: 'service', type: 'multi',
      title: 'What service are you currently looking for?',
      hint: 'Select all that apply. Video editing is our main service; social media and ads are optional add-ons.',
      options: [
        { value: 'Short-form video editing', label: 'Short-form video editing', icon: 'video', tag: 'Main service' },
        { value: 'Social media management', label: 'Post Scheduling', icon: 'social', tag: 'Add-on' },
        { value: 'Paid advertising', label: 'Paid advertising', icon: 'ads', tag: 'Add-on' }
      ]
    },
    {
      id: 'challenge', type: 'multi',
      title: 'What\u2019s your biggest challenge with your content right now?',
      hint: 'Select all that apply to your situation.',
      options: [
        { value: 'Not enough time to edit', label: 'I don\u2019t have enough time to edit' },
        { value: 'Struggle to post consistently', label: 'I struggle to post consistently' },
        { value: 'No reliable editor', label: 'I don\u2019t have a reliable editor' },
        { value: 'Not satisfied with current editing', label: 'I\u2019m not satisfied with my current editing' }
      ]
    },
    {
      id: 'volume', type: 'choice',
      title: 'Approximately how many short-form videos do you need each month?',
      options: [
        { value: '10\u201320', label: '10\u201320' },
        { value: '20\u201340', label: '20\u201340' },
        { value: '40\u201360', label: '40\u201360' },
        { value: '60+', label: '60+' }
      ]
    },
    {
      id: 'budget', type: 'choice',
      title: 'What monthly budget have you allocated for content?',
      hint: 'All amounts are in US dollars (USD).',
      options: [
        { value: '$500\u2013$1,000 USD', label: '$500\u2013$1,000' },
        { value: '$1,000\u2013$2,000 USD', label: '$1,000\u2013$2,000' },
        { value: '$2,000\u2013$3,000 USD', label: '$2,000\u2013$3,000' },
        { value: '$3,000+ USD', label: '$3,000+' }
      ]
    }
  ];

  // Call slots are in Australian business hours; the visitor picks their Australian time zone.
  const SLOTS = [
    { label: 'Morning', time: '9 AM \u2013 12 PM' },
    { label: 'Afternoon', time: '12 PM \u2013 3 PM' },
    { label: 'Late afternoon', time: '3 PM \u2013 6 PM' }
  ];
  const ZONES = [
    { id: 'Australia/Sydney', label: 'Sydney \u00B7 Melbourne \u00B7 Canberra \u00B7 Hobart' },
    { id: 'Australia/Brisbane', label: 'Brisbane \u00B7 Gold Coast \u00B7 Cairns' },
    { id: 'Australia/Adelaide', label: 'Adelaide' },
    { id: 'Australia/Darwin', label: 'Darwin' },
    { id: 'Australia/Perth', label: 'Perth' }
  ];
  const SAME = { 'Australia/Melbourne': 'Australia/Sydney', 'Australia/Canberra': 'Australia/Sydney', 'Australia/Hobart': 'Australia/Sydney', 'Australia/ACT': 'Australia/Sydney', 'Australia/NSW': 'Australia/Sydney', 'Australia/Victoria': 'Australia/Sydney', 'Australia/Tasmania': 'Australia/Sydney', 'Australia/Lindeman': 'Australia/Brisbane', 'Australia/Queensland': 'Australia/Brisbane', 'Australia/Broken_Hill': 'Australia/Adelaide', 'Australia/South': 'Australia/Adelaide', 'Australia/North': 'Australia/Darwin', 'Australia/West': 'Australia/Perth' };
  const guessZone = () => { try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone; return ZONES.some(x => x.id === z) ? z : (SAME[z] || 'Australia/Sydney'); } catch (e) { return 'Australia/Sydney'; } };
  const tzAbbr = (zone, dateStr) => {
    try {
      const d = dateStr ? new Date(dateStr + 'T12:00:00Z') : new Date();
      const n = new Intl.DateTimeFormat('en-AU', { timeZone: zone, timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value || '';
      return n.startsWith('GMT') ? n.replace('GMT', 'UTC') : n;
    } catch (e) { return ''; }
  };

  /* ------------------------------------------------------------------ */
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = el('div', 'bk');
  root.setAttribute('data-lenis-prevent', ''); root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Book a call');
  root.innerHTML = `
    <div class="bk-box">
      <button class="bk-x" type="button" aria-label="Close">✕</button>
      <div class="bk-top">
        <div class="bk-brand"><img src="assets/logo.svg" alt="Growfar" width="44" height="44"></div>
        <div class="bk-count"></div>
      </div>
      <div class="bk-bar"><span></span></div>
      <div class="bk-body" aria-live="polite"></div>
      <div class="bk-foot">
        <button class="bk-back" type="button">← Back</button>
        <button class="btn btn-fill bk-next" type="button">Continue</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  const $ = q => root.querySelector(q);
  const box = $('.bk-box'), body = $('.bk-body'), count = $('.bk-count'), bar = $('.bk-bar span'), back = $('.bk-back'), next = $('.bk-next'), foot = $('.bk-foot');

  let answers = {}, step = 0, booked = false, lastTrigger = null, done = false, timer = 0, leadSent = false, sheetSent = false;
  const visible = () => QUESTIONS.filter(q => !q.showIf || q.showIf(answers));
  const total = () => visible().length + 1;      // + details step
  const isDetails = () => step >= visible().length;

  const anim = dir => { if (RM) return; body.classList.remove('in-next', 'in-prev'); void body.offsetWidth; body.classList.add(dir < 0 ? 'in-prev' : 'in-next'); };

  const has = q => {
    const v = answers[q.id];
    if (q.required === false) return true;
    return q.type === 'multi' ? Array.isArray(v) && v.length > 0 : !!(v && String(v).trim());
  };

  function render(dir = 1) {
    clearTimeout(timer);
    const qs = visible();
    count.textContent = done ? 'All done' : `Step ${step + 1} of ${total()}`;
    bar.style.width = (done ? 100 : ((step + 1) / total()) * 100) + '%';
    back.style.visibility = step === 0 || done ? 'hidden' : 'visible';
    foot.hidden = done;
    box.classList.toggle('wide', !!CONFIG.calendlyUrl && isDetails() && !done);
    anim(dir);

    if (done) return renderDone();
    if (isDetails()) return renderDetails();

    const q = qs[step];
    body.innerHTML = `<h2 class="bk-q">${esc(q.title)}</h2>${q.hint ? `<p class="bk-hint">${esc(q.hint)}</p>` : ''}<div class="bk-opts"></div>`;
    const wrap = body.querySelector('.bk-opts'); if (q.type === 'multi') wrap.classList.add('multi');

    if (q.type === 'text') {
      const ta = el('textarea', 'bk-text'); ta.rows = 4; ta.placeholder = q.placeholder || 'Type your answer…'; ta.value = answers[q.id] || '';
      ta.addEventListener('input', () => { answers[q.id] = ta.value; sync(q); });
      wrap.replaceWith(ta); setTimeout(() => ta.focus(), 60);
    } else {
      q.options.forEach(o => {
        const on = q.type === 'multi' ? (answers[q.id] || []).includes(o.value) : answers[q.id] === o.value;
        const b = el('button', 'bk-opt' + (on ? ' on' : ''),
          `<span class="bk-ico${o.icon ? '' : ' bk-let'}">${o.icon ? ICON[o.icon] : String.fromCharCode(65 + q.options.indexOf(o))}</span><span class="bk-txt"><b>${esc(o.label)}</b>${o.desc ? `<span>${esc(o.desc)}</span>` : ''}</span>${o.tag ? `<em>${esc(o.tag)}</em>` : ''}<i class="bk-tick"></i>`);
        b.type = 'button'; b.setAttribute('role', q.type === 'multi' ? 'checkbox' : 'radio'); b.setAttribute('aria-checked', on);
        b.addEventListener('click', () => pick(q, o.value, b, wrap));
        wrap.appendChild(b);
      });
      setTimeout(() => (wrap.querySelector('.on') || wrap.firstElementChild)?.focus({ preventScroll: true }), 60);
    }
    sync(q);
  }

  function sync(q) {
    next.disabled = !has(q);
    next.textContent = 'Continue';
    next.hidden = q.type === 'choice';           // single-choice auto-advances
  }

  function pick(q, value, btn, wrap) {
    if (q.type === 'multi') {
      const cur = new Set(answers[q.id] || []); cur.has(value) ? cur.delete(value) : cur.add(value);
      answers[q.id] = [...cur]; btn.classList.toggle('on'); btn.setAttribute('aria-checked', cur.has(value)); sync(q);
    } else {
      answers[q.id] = value;
      wrap.querySelectorAll('.bk-opt').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
      btn.classList.add('on'); btn.setAttribute('aria-checked', 'true');
      // later answers may no longer apply once this one changes
      Object.keys(answers).forEach(k => { const qq = QUESTIONS.find(z => z.id === k); if (qq && qq.showIf && !qq.showIf(answers)) delete answers[k]; });
      timer = setTimeout(() => go(1), RM ? 0 : 320);
    }
  }

  function summary() {
    return visible().map(q => ({ q: q.title, a: Array.isArray(answers[q.id]) ? answers[q.id].join(', ') : (answers[q.id] || '—') }));
  }

  function renderCalendly() {
    // Meta Pixel — Lead: all 5 questions are answered and the Calendly embed is
    // about to be shown. `leadSent` makes this fire once per popup session — it's
    // reset only in open() when a finished/closed session is reopened, so re-renders
    // of this same step (e.g. going back into details) never fire it again.
    if (!leadSent && typeof fbq === 'function') { fbq('track', 'Lead'); leadSent = true; console.log('Lead fired'); }
    // Google Sheet log — same moment as the Lead pixel: the 5 answers are final and
    // about to be handed to Calendly, so this is the one place that catches everyone
    // who answered, including people who never finish the Calendly step below.
    // Fire-and-forget: mode 'no-cors' + a text/plain body avoid a CORS preflight,
    // which Apps Script web apps don't answer, so this never blocks or breaks the UI.
    if (!sheetSent && CONFIG.sheetEndpoint) {
      sheetSent = true;
      const rows = Object.fromEntries(summary().map(s => [s.q, s.a]));
      fetch(CONFIG.sheetEndpoint, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...rows, page: location.href, submittedAt: new Date().toISOString() })
      }).catch(() => {});
    }
    const chips = visible().flatMap(q => [].concat(answers[q.id] || [])).map(v => `<span class="bk-chip">${esc(v)}</span>`).join('');
    const u = new URL(CONFIG.calendlyUrl);
    const P = { embed_domain: location.hostname || 'localhost', embed_type: 'Inline', hide_gdpr_banner: '1', hide_event_type_details: '1', primary_color: 'ff154e', text_color: '201c1d', background_color: 'ffffff' };
    const plain = new URL(CONFIG.calendlyUrl);
    Object.entries(P).forEach(([k, v]) => u.searchParams.set(k, v));
    if (CONFIG.calendlyPrefill === 'separate') {
      visible().slice(0, 10).forEach((q, i) => { const v = [].concat(answers[q.id] || []).join(', '); if (v) { u.searchParams.set('a' + (i + 1), v); plain.searchParams.set('a' + (i + 1), v); } });
    } else {
      const block = visible().map(q => `${q.title}\n\u2192 ${[].concat(answers[q.id] || []).join(', ') || '\u2014'}`).join('\n\n');
      u.searchParams.set('a1', 'Booked via growfar website\n\n' + block); plain.searchParams.set('a1', 'Booked via growfar website\n\n' + block);
    }
    body.innerHTML = `
      <h2 class="bk-q">Ready to get started?</h2>
      <p class="bk-hint">Choose a convenient time for a quick call. We’ll learn about your current workflow, understand your needs, and discuss the best way we can help.</p>
      <div class="bk-chips">${chips}</div>
      <div class="bk-embed"><span class="bk-load">Loading calendar…</span><iframe title="Book a call with Growfar" src="${esc(u.toString())}" allow="payment"></iframe></div>
      <p class="bk-alt">Calendar not showing? <a href="${esc(plain.toString())}" target="_blank" rel="noopener">Open it in a new tab</a></p>`;
    const wrap = body.querySelector('.bk-embed');
    // Show the calendar when the iframe reports it loaded, but never depend on that event:
    // some mobile browsers don't fire it, which would leave the calendar hidden forever.
    const show = () => wrap.classList.add('ready');
    wrap.querySelector('iframe').addEventListener('load', show);
    timer = setTimeout(show, 2500);
    next.hidden = true;
  }

  function renderDetails() {
    if (CONFIG.calendlyUrl) return renderCalendly();
    const chips = visible().flatMap(q => [].concat(answers[q.id] || [])).map(v => `<span class="bk-chip">${esc(v)}</span>`).join('');
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const slots = SLOTS.map((o, i) => `<label class="bk-slot"><input type="radio" name="slot" value="${i}"><span><b>${esc(o.label)}</b><small>${esc(o.time)}</small></span></label>`).join('');
    const zones = ZONES.map(z => `<option value="${z.id}"${z.id === guessZone() ? ' selected' : ''}>${esc(z.label)}</option>`).join('');
    body.innerHTML = `
      <h2 class="bk-q">Ready to get started?</h2>
      <p class="bk-hint">Choose a convenient time for a quick call. We\u2019ll learn about your current workflow, understand your needs, and discuss the best way we can help.</p>
      <div class="bk-chips">${chips}</div>
      <form class="bk-form" novalidate>
        <label>Preferred date<input name="date" type="date" min="${today}" required></label>
        <label>Your time zone<select name="tz">${zones}</select></label>
        <div class="bk-lbl">Preferred time <small class="bk-tzn"></small></div>
        <div class="bk-slots" role="radiogroup" aria-label="Preferred time">${slots}</div>
        <label>Your name<input name="name" autocomplete="name" placeholder="e.g. Aarav Kapoor" required></label>
        <label>Email<input name="email" type="email" autocomplete="email" placeholder="you@company.com" required></label>
        <label>Phone / WhatsApp <small>(optional)</small><input name="phone" type="tel" autocomplete="tel" placeholder="+61 4XX XXX XXX"></label>
        <p class="bk-err" hidden></p>
      </form>`;
    const f = body.querySelector('.bk-form'), note = f.querySelector('.bk-tzn');
    const updTz = () => { note.textContent = `(Australian time \u00B7 ${tzAbbr(f.tz.value, f.date.value)})`; };
    f.tz.addEventListener('change', updTz); f.date.addEventListener('change', updTz); updTz();
    next.hidden = false; next.disabled = false; next.textContent = 'Book Your Call \u2192';
    setTimeout(() => body.querySelector('input[name=date]')?.focus({ preventScroll: true }), 60);
  }

  function renderDone(sent = true) {
    const rows = summary().concat(answers._when ? [{ q: 'Preferred call time', a: answers._when }] : []).map(s => `<li><span>${esc(s.q)}</span><b>${esc(s.a)}</b></li>`).join('');
    body.innerHTML = `
      <div class="bk-done">
        <div class="bk-check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h2 class="bk-q">${booked ? 'You’re booked!' : 'You’re all set!'}</h2>
        <p class="bk-hint">${booked ? 'A calendar invite with your meeting link is on its way to your inbox. See you on the call!' : `Thanks, ${esc(answers._name || 'friend')}. We’ll get back to you shortly to schedule your call.`}</p>
        <ul class="bk-sum">${rows}</ul>
        <button class="btn btn-fill" type="button" data-close>Done</button>
      </div>`;
    body.querySelector('[data-close]').addEventListener('click', close);
  }

  async function submit() {
    const f = body.querySelector('.bk-form'), err = f.querySelector('.bk-err');
    const v = Object.fromEntries(new FormData(f).entries());
    v.name = (v.name || '').trim(); v.email = (v.email || '').trim(); v.phone = (v.phone || '').trim();
    const bad = !v.date ? 'Please choose a preferred date.' : v.slot == null ? 'Please choose a preferred time.'
      : !v.name ? 'Please tell us your name.' : !/^\S+@\S+\.\S+$/.test(v.email) ? 'Please enter a valid email.' : '';
    err.hidden = !bad; err.textContent = bad; if (bad) return;

    const slot = SLOTS[+v.slot], abbr = tzAbbr(v.tz, v.date), zoneLabel = ZONES.find(z => z.id === v.tz)?.label || v.tz;
    const slotText = `${slot.label} (${slot.time} ${abbr})`;
    const when = `${new Date(v.date + 'T00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} \u00B7 ${slotText}`;
    const payload = {
      answers: Object.fromEntries(visible().map(q => [q.title, answers[q.id]])),
      preferredDate: v.date, preferredTime: slotText, timeZone: v.tz, timeZoneLabel: zoneLabel,
      name: v.name, email: v.email, phone: v.phone,
      page: location.href, submittedAt: new Date().toISOString()
    };
    answers._name = v.name.split(' ')[0]; answers._when = when;
    next.disabled = true; next.textContent = 'Sending…';

    const lines = summary().map(s => `${s.q}\n  → ${s.a}`).join('\n');
    const text = `New call request\n\n${lines}\n\nPreferred call time: ${when}\nTime zone: ${zoneLabel} (${v.tz})\nName: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone || '-'}\nPage: ${payload.page}`;
    let ok = false;
    if (CONFIG.endpoint) {
      try { const r = await fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) }); ok = r.ok; } catch (e) { ok = false; }
    }
    if (!ok) location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Book a call — ' + payload.name + ' (' + ([].concat(answers.service || []).join(' + ') || 'new lead') + ')')}&body=${encodeURIComponent(text)}`;
    // Meta Pixel — Lead: only reachable when CONFIG.calendlyUrl is cleared, since that's
    // the only time this built-in form (rather than Calendly) is what actually gets
    // submitted. Fires once, after the POST/mailto above, never on validation failure
    // (the `if (bad) return;` earlier exits before reaching here).
    if (typeof fbq === 'function') fbq('track', 'Lead');
    done = true; render(1);
  }

  function go(dir) {
    if (dir > 0) {
      if (isDetails()) return submit();
      if (!has(visible()[step])) return;
    }
    step = Math.max(0, Math.min(step + dir, total() - 1));
    render(dir);
  }

  function open(trigger) {
    lastTrigger = trigger || document.activeElement;
    if (done) { answers = {}; done = false; booked = false; step = 0; leadSent = false; sheetSent = false; }
    root.classList.add('open'); document.body.style.overflow = 'hidden'; window.__lenis?.stop();
    render(1);
  }
  function close() {
    root.classList.remove('open'); document.body.style.overflow = ''; window.__lenis?.start();
    clearTimeout(timer); lastTrigger?.focus?.({ preventScroll: true });
  }

  addEventListener('message', e => {
    if (e.origin !== 'https://calendly.com' || !e.data || e.data.event !== 'calendly.event_scheduled') return;
    if (!root.classList.contains('open')) return;
    // Meta Pixel — Schedule: this is the actual "booked" moment for the live flow
    // (CONFIG.calendlyUrl is set, so every real booking goes through Calendly's embed,
    // not the built-in form above). The origin + event-name check means this can only
    // come from Calendly confirming a real booking, never from clicking Next/Back.
    // `!booked` stops a duplicate postMessage from firing it twice.
    if (!booked && typeof fbq === 'function') fbq('track', 'Schedule');
    done = true; booked = true; render(1);
  });

  next.addEventListener('click', () => go(1));
  back.addEventListener('click', () => go(-1));
  root.addEventListener('click', e => { if (e.target === root || e.target.closest('.bk-x')) close(); });
  addEventListener('keydown', e => {
    if (!root.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON' && isDetails() && !done) { e.preventDefault(); go(1); }
    if (e.key === 'Tab') {                       // keep focus inside the popup
      const f = [...root.querySelectorAll('button:not([disabled]):not([hidden]),input,textarea')].filter(x => x.offsetParent);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-book]'); if (!t) return;
    e.preventDefault(); open(t);
  });
  window.GFBooking = { open, close };
})();

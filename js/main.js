    /* ---- Intro Loader ---- */
    const siteLoader = document.getElementById('site-loader');

    if (siteLoader) {
      const LOADER_MIN_DURATION = 1400;
      const LOADER_FADE_DURATION = 700;
      const LOADER_MAX_DURATION = 4500;
      const loaderStart = performance.now();
      let loaderDismissed = false;

      const hideSiteLoader = () => {
        if (loaderDismissed) return;
        loaderDismissed = true;

        const elapsed = performance.now() - loaderStart;
        const waitTime = Math.max(0, LOADER_MIN_DURATION - elapsed);

        window.setTimeout(() => {
          siteLoader.classList.add('is-hidden');
          document.body.classList.remove('is-loading');

          window.setTimeout(() => {
            if (siteLoader.parentNode) siteLoader.parentNode.removeChild(siteLoader);
          }, LOADER_FADE_DURATION);
        }, waitTime);
      };

      if (document.readyState === 'complete') {
        hideSiteLoader();
      } else {
        window.addEventListener('load', hideSiteLoader, { once: true });
      }

      window.setTimeout(hideSiteLoader, LOADER_MAX_DURATION);
    }

    /* ---- Custom Cursor ---- */
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    function animCursor() {
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      if (dot) { dot.style.left = mx + 'px'; dot.style.top = my + 'px'; }
      if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
      requestAnimationFrame(animCursor);
    }
    animCursor();
    document.querySelectorAll('a, button, .proj-summary, .skill-cat, .ach-card, .blog-card, .contact-link, .btn-primary, .btn-outline, .btn-resume, .nav-resume').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    /* ---- Sticky Nav ---- */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
      const bt = document.getElementById('back-top');
      if (bt) bt.classList.toggle('back-to-top-visible', window.scrollY > 600);
    });

    /* ---- Scroll Sound (lightweight, WebAudio) ---- */
    const soundToggleBtn = document.getElementById('sound-toggle');
    let scrollSoundEnabled = true;
    let clickSoundEnabled = true;
    try {
      const pref = localStorage.getItem('scrollSound');
      if (pref === 'off') scrollSoundEnabled = false;
      const clickPref = localStorage.getItem('clickSound');
      if (clickPref === 'off') clickSoundEnabled = false;
    } catch (e) { /* ignore */ }

    // Respect reduced motion preference by default
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scrollSoundEnabled = false;
      clickSoundEnabled = false;
    }

    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        scrollSoundEnabled = !scrollSoundEnabled;
        clickSoundEnabled = !clickSoundEnabled;
        try { 
          localStorage.setItem('scrollSound', scrollSoundEnabled ? 'on' : 'off');
          localStorage.setItem('clickSound', clickSoundEnabled ? 'on' : 'off');
        } catch (e) {}
        soundToggleBtn.textContent = scrollSoundEnabled ? '🔊' : '🔇';
        soundToggleBtn.setAttribute('aria-pressed', String(scrollSoundEnabled));
      });
      soundToggleBtn.textContent = scrollSoundEnabled ? '🔊' : '🔇';
      soundToggleBtn.setAttribute('aria-pressed', String(scrollSoundEnabled));
    }

    let _audioCtx = null;
    function ensureAudioContext() {
      if (_audioCtx) return _audioCtx;
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        _audioCtx = null;
      }
      return _audioCtx;
    }

    function playScrollSound() {
      if (!scrollSoundEnabled) return;
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.0001, now);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    function playClickSound() {
      if (!clickSoundEnabled) return;
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    let lastScrollSoundAt = 0;
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
      const now = Date.now();
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      if (dy < 8) return; // ignore tiny jitter
      if (now - lastScrollSoundAt > 120) {
        // Resume audio context on first interaction if needed
        const ctx = ensureAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        playScrollSound();
        lastScrollSoundAt = now;
      }
    }, { passive: true });

    // Attach click sound to interactive elements
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button, .proj-card, .skill-cat, .hero-stat, .profile-card, .info-block, .hack-summary, .btn-primary, .btn-outline, [role="button"]');
      if (target) {
        const ctx = ensureAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        playClickSound();
      }
    }, true);

    /* ---- Mobile Menu ---- */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const setMobileMenuState = (isOpen) => {
      if (!hamburger || !mobileMenu) return;
      mobileMenu.classList.toggle('open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    };

    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        setMobileMenuState(!mobileMenu.classList.contains('open'));
      });

      document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => setMobileMenuState(false));
      });

      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setMobileMenuState(false);
      });

      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) setMobileMenuState(false);
      });
    }

    /* ---- Hero Voice Intro ---- */
    const heroVoiceButton = document.getElementById('hero-voice-btn');

    if (heroVoiceButton) {
      const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
      const welcomeMessage = "Hello, I'm Harish Motamarri. Welcome to my portfolio. I'm a full stack developer focused on building practical products at the intersection of AI, IoT, and modern web. Thank you for visiting.";
      const strongMaleVoiceHints = [
        /google uk english male/i,
        /microsoft (?:david|guy|mark|ryan|ravi|james|andrew|connor|eric|christopher)/i,
        /\bmale\b/i,
        /\bravi\b/i,
        /\bdavid\b/i,
        /\bdaniel\b/i,
        /\balex\b/i,
        /\barthur\b/i,
        /\bfred\b/i,
        /\bguy\b/i,
        /\blee\b/i,
        /\boliver\b/i,
        /\bthomas\b/i,
        /\bmatt(?:hew)?\b/i,
        /\bmichael\b/i,
        /\bjames\b/i,
        /\bjohn\b/i,
        /\bgeorge\b/i,
        /\bryan\b/i
      ];
      const femaleVoiceHints = [
        /\bfemale\b/i,
        /\bheera\b/i,
        /\bhazel\b/i,
        /\bzira\b/i,
        /\bsusan\b/i,
        /\bsamantha\b/i,
        /\bvictoria\b/i,
        /\bkaren\b/i,
        /\bserena\b/i,
        /\bmoira\b/i
      ];

      const setHeroVoiceState = (isSpeaking) => {
        heroVoiceButton.classList.toggle('is-speaking', isSpeaking);
        heroVoiceButton.setAttribute('aria-pressed', String(isSpeaking));
        heroVoiceButton.setAttribute('title', isSpeaking ? 'Stop welcome message' : 'Play welcome message');
      };

      let availableEnglishVoices = [];

      const updateAvailableVoices = () => {
        availableEnglishVoices = window.speechSynthesis
          .getVoices()
          .filter((voice) => /^en/i.test(voice.lang));

        return availableEnglishVoices;
      };

      const waitForVoices = (timeoutMs = 1500) => new Promise((resolve) => {
        const initialVoices = updateAvailableVoices();

        if (initialVoices.length) {
          resolve(initialVoices);
          return;
        }

        let settled = false;
        let timeoutId = null;

        const finish = () => {
          if (settled) return;
          settled = true;
          if (timeoutId) window.clearTimeout(timeoutId);
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve(updateAvailableVoices());
        };

        const handleVoicesChanged = () => {
          if (updateAvailableVoices().length) finish();
        };

        timeoutId = window.setTimeout(finish, timeoutMs);
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        window.speechSynthesis.getVoices();
      });

      const getPreferredVoice = async () => {
        const voices = availableEnglishVoices.length
          ? availableEnglishVoices
          : await waitForVoices();

        const scoreVoice = (voice) => {
          let score = 0;
          const voiceLabel = `${voice.name} ${voice.lang}`;

          if (/^en-IN$/i.test(voice.lang)) score += 30;
          else if (/^en-(GB|US)$/i.test(voice.lang)) score += 20;
          else if (/^en/i.test(voice.lang)) score += 10;

          if (strongMaleVoiceHints.some((pattern) => pattern.test(voiceLabel))) score += 60;
          if (femaleVoiceHints.some((pattern) => pattern.test(voiceLabel))) score -= 40;
          if (voice.localService) score += 5;
          if (voice.default) score += 2;

          return score;
        };

        return voices
          .sort((left, right) => scoreVoice(right) - scoreVoice(left))[0]
          || null;
      };

      if (!speechSupported) {
        heroVoiceButton.classList.add('is-disabled');
        heroVoiceButton.setAttribute('aria-disabled', 'true');
        heroVoiceButton.setAttribute('title', 'Speech playback is not supported in this browser');
      } else {
        updateAvailableVoices();
        window.speechSynthesis.addEventListener('voiceschanged', updateAvailableVoices);

        heroVoiceButton.addEventListener('click', async () => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setHeroVoiceState(false);
            return;
          }

          const utterance = new SpeechSynthesisUtterance(welcomeMessage);
          const preferredVoice = await getPreferredVoice();

          if (preferredVoice) {
            utterance.voice = preferredVoice;
            utterance.lang = preferredVoice.lang;
          } else {
            utterance.lang = 'en-IN';
          }

          utterance.rate = 0.97;
          utterance.pitch = 0.88;
          utterance.volume = 1;
          utterance.onend = () => setHeroVoiceState(false);
          utterance.onerror = () => setHeroVoiceState(false);

          window.speechSynthesis.cancel();
          setHeroVoiceState(true);
          window.speechSynthesis.speak(utterance);
        });

        window.addEventListener('beforeunload', () => {
          window.speechSynthesis.cancel();
        });
      }
    }

    /* ---- Reveal on Scroll ---- */
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    /* ---- Skill Bars ---- */
    const barObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.skill-bar-row').forEach(row => {
            const pct = row.getAttribute('data-pct');
            row.querySelector('.skill-bar-fill').style.width = pct + '%';
          });
          barObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    const barSection = document.querySelector('.skill-bars');
    if (barSection) barObs.observe(barSection);

    /* ---- Project Action Placement ---- */
    document.querySelectorAll('.proj-card').forEach((card) => {
      const meta = card.querySelector('.proj-meta');
      const detailLinks = card.querySelector('.proj-detail .proj-links');

      if (!meta || !detailLinks) return;

      meta.appendChild(detailLinks);

      detailLinks.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      detailLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', (event) => {
          event.stopPropagation();
        });
      });
    });

    function openProjectCard(card) {
      const detail = card.querySelector('.proj-detail');
      if (!detail) return;

      card.classList.add('open');
      detail.style.height = '0px';
      detail.offsetHeight;
      detail.style.height = `${detail.scrollHeight}px`;
    }

    function closeProjectCard(card) {
      const detail = card.querySelector('.proj-detail');
      if (!detail) return;

      detail.style.height = `${detail.scrollHeight}px`;
      detail.offsetHeight;
      card.classList.remove('open');
      detail.style.height = '0px';
    }

    document.querySelectorAll('.proj-detail').forEach((detail) => {
      const card = detail.closest('.proj-card');
      if (!card) return;

      detail.addEventListener('transitionend', (event) => {
        if (event.propertyName !== 'height') return;
        if (card.classList.contains('open')) {
          detail.style.height = 'auto';
        }
      });
    });

    /* ---- Project Accordion ---- */
    document.querySelectorAll('.proj-summary').forEach(summary => {
      const card = summary.closest('.proj-card');
      const detail = card ? card.querySelector('.proj-detail') : null;
      const isPrivate = card?.dataset.private === 'true';

      if (!card || !detail || isPrivate) return;

      summary.addEventListener('click', () => {
        const isOpen = card.classList.contains('open');
        document.querySelectorAll('.proj-card.open').forEach(closeProjectCard);
        if (!isOpen) openProjectCard(card);
      });
    });

    /* ---- Close project when clicking description ---- */
    document.querySelectorAll('.proj-detail').forEach(detail => {
      detail.addEventListener('click', (e) => {
        // Don't close when clicking action links or buttons inside the detail
        if (e.target.closest('.proj-links') || e.target.closest('a') || e.target.closest('button')) return;
        const card = detail.closest('.proj-card');
        if (card) closeProjectCard(card);
      });
    });

    /* ---- Hackathon certificates: open inline modal instead of new tab ---- */
    // Create modal markup once
    (function createCertModal() {
      if (document.getElementById('cert-backdrop')) return;
      const bd = document.createElement('div');
      bd.id = 'cert-backdrop';
      bd.className = 'cert-backdrop';
      bd.innerHTML = `
        <div class="cert-panel" role="dialog" aria-modal="true" aria-labelledby="cert-title">
          <button class="cert-close" aria-label="Close certificate">✕</button>
          <div class="cert-body"><img alt="Certificate" id="cert-img" src="" /></div>
        </div>
      `;
      document.body.appendChild(bd);

      const closeBtn = bd.querySelector('.cert-close');
      const img = bd.querySelector('#cert-img');

      function close() {
        bd.classList.remove('open');
        bd.setAttribute('aria-hidden', 'true');
        img.src = '';
      }

      closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
      bd.addEventListener('click', (e) => {
        if (e.target === bd) close();
      });
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    })();

    // Intercept hackathon certificate links
    document.querySelectorAll('#hackathon-list .proj-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (!href) return;
        const bd = document.getElementById('cert-backdrop');
        const img = bd.querySelector('#cert-img');
        img.src = href;
        bd.classList.add('open');
        bd.setAttribute('aria-hidden', 'false');
      });
    });

    /* ---- Hackathons Toggle ---- */
    document.querySelectorAll('.hack-summary').forEach(summary => {
      const hackContainer = summary.closest('.tl-body');
      const hackList = hackContainer ? hackContainer.querySelector('.hack-list') : null;

      if (!hackList) return;

      // Fast open/close toggle - let CSS animations handle everything
      const syncHackSummaryState = (isExpanded) => {
        summary.setAttribute('aria-expanded', String(isExpanded));

        if (isExpanded) {
          hackList.classList.add('open');
          hackList.setAttribute('aria-hidden', 'false');
        } else {
          hackList.classList.remove('open');
          hackList.setAttribute('aria-hidden', 'true');
        }
      };

      syncHackSummaryState(hackList.classList.contains('open'));

      const toggleHackSummary = () => {
        const isExpanded = summary.getAttribute('aria-expanded') === 'true';
        syncHackSummaryState(!isExpanded);
      };

      summary.addEventListener('click', () => {
        toggleHackSummary();
      });

      summary.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleHackSummary();
        }
      });
    });

    /* ---- Close hackathon list when clicking description ---- */
    (function closeHackOnDescriptionClick() {
      const hackSummaryEl = document.getElementById('hackathons-summary');
      const hackListEl = document.getElementById('hackathon-list');
      if (!hackSummaryEl || !hackListEl) return;

      hackListEl.addEventListener('click', (e) => {
        // Ignore clicks on links or buttons (e.g., Show Certificate)
        if (e.target.closest('a') || e.target.closest('button')) return;

        if (hackListEl.classList.contains('open')) {
          hackListEl.classList.remove('open');
          hackSummaryEl.setAttribute('aria-expanded', 'false');
        }
      });
    })();

    /* ---- Typewriter ---- */
    const phrases = [
      '"Production-Grade Web Apps"',
      '"AI-Powered Tools"',
      '"IoT Integrated Systems"',
      '"Scalable React Components"',
      '"Real Solutions to Real Problems"'
    ];
    let pi = 0, ci = 0, deleting = false;
    const tw = document.getElementById('typewriter');
    function typeStep() {
      const phrase = phrases[pi];
      if (!deleting) {
        tw.textContent = phrase.slice(0, ++ci);
        if (ci === phrase.length) { deleting = true; setTimeout(typeStep, 1800); return; }
      } else {
        tw.textContent = phrase.slice(0, --ci);
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
      }
      setTimeout(typeStep, deleting ? 38 : 68);
    }
    setTimeout(typeStep, 1200);

    /* ---- Smooth anchor for nav links ---- */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
      });
    });

    /* ---- Contact Form: mailto with user inputs ---- */
    const contactMailForm = document.getElementById('contact-mail-form');
    if (contactMailForm) {
      contactMailForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const nameField = document.getElementById('contact-name');
        const aboutField = document.getElementById('contact-about');
        const senderName = nameField ? nameField.value.trim() : '';
        const aboutMessage = aboutField ? aboutField.value.trim() : '';
        const displayName = senderName || 'Portfolio Visitor';

        const mailSubject = 'Collaboration Opportunity from Portfolio';
        const mailBody = [
          'Hi Harish,',
          '',
          'I came across your portfolio and would love to connect regarding a potential collaboration.',
          '',
          `Name: ${displayName}`,
          '',
          'Message:',
          aboutMessage || '[Your message]',
          '',
          'Looking forward to hearing from you.',
          '',
          'Best regards,',
          displayName
        ].join('\n');

        const encodedSubject = encodeURIComponent(mailSubject);
        const encodedBody = encodeURIComponent(mailBody);
        const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=motamarriharish@gmail.com&su=${encodedSubject}&body=${encodedBody}`;
        const mailtoUrl = `mailto:motamarriharish@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;

        const openedWindow = window.open(gmailComposeUrl, '_blank', 'noopener');
        if (!openedWindow) {
          window.location.href = mailtoUrl;
        }
      });
    }

    /* ---- Theme Toggle ---- */
    const themeBtn = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'light') { root.setAttribute('data-theme', 'light'); themeBtn.textContent = '☀️'; }
    themeBtn.addEventListener('click', () => {
      const isLight = root.getAttribute('data-theme') === 'light';
      if (isLight) {
        root.removeAttribute('data-theme');
        themeBtn.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
      } else {
        root.setAttribute('data-theme', 'light');
        themeBtn.textContent = '☀️';
        localStorage.setItem('theme', 'light');
      }
    });

    /* ---- Show All / Show Less Projects ---- */
    const allCards = document.querySelectorAll('.proj-card');
    const showAllBtn = document.getElementById('show-all-btn');
    const showAllTitle = showAllBtn ? showAllBtn.querySelector('.project-cta-title') : null;
    const INITIAL_SHOW = 3;
    let allShown = false;

    const updateProjectArchiveLabel = () => {
      if (!showAllTitle) return;
      showAllTitle.textContent = allShown
        ? 'Show Less'
        : 'Show All Projects';
    };

    // Hide cards beyond the first 3 on load
    allCards.forEach((card, i) => {
      if (i >= INITIAL_SHOW) card.classList.add('proj-hidden');
    });

    updateProjectArchiveLabel();

    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => {
        allShown = !allShown;
        showAllBtn.setAttribute('aria-expanded', String(allShown));
        allCards.forEach((card, i) => {
          if (i >= INITIAL_SHOW) {
            if (allShown) {
              card.classList.remove('proj-hidden');
              // Trigger reveal animation for newly shown cards
              setTimeout(() => revealObs.observe(card), 10);
            } else {
              card.classList.add('proj-hidden');
              card.classList.remove('open'); // close any open accordion
            }
          }
        });
        updateProjectArchiveLabel();
      });
    }

    /* ---- Visitor Counter ---- */
    const visitorBadge = document.getElementById('visitor-badge');
    const badgeCount = document.getElementById('badge-count');
    const visitorCounterBase = 'https://api.counterapi.dev/v1/harishmotamarri-portfolio/visitors';
    const visitorCacheKey = 'portfolio-visitor-count';
    const visitorLastCountedKey = 'portfolio-visitor-last-counted-at';
    const visitorCountWindowMs = 24 * 60 * 60 * 1000;

    const formatVisitorCount = (count) => count.toLocaleString('en-IN');

    const readVisitorCount = async (shouldIncrement) => {
      const endpoint = shouldIncrement ? `${visitorCounterBase}/up` : `${visitorCounterBase}/`;
      const response = await fetch(`${endpoint}?ts=${Date.now()}`, {
        cache: 'no-store',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Visitor counter request failed with ${response.status}`);
      }

      const data = await response.json();
      const nextCount = Number(data.count ?? data.value);

      if (!Number.isFinite(nextCount)) {
        throw new Error('Visitor counter response did not include a numeric count');
      }

      return nextCount;
    };

    const updateVisitorCounter = async () => {
      if (!visitorBadge || !badgeCount) return;

      visitorBadge.classList.add('visible');

      const cachedCount = localStorage.getItem(visitorCacheKey);
      if (cachedCount) badgeCount.textContent = cachedCount;

      try {
        const lastCountedAt = Number(localStorage.getItem(visitorLastCountedKey) || 0);
        const shouldIncrement = !Number.isFinite(lastCountedAt)
          || (Date.now() - lastCountedAt) > visitorCountWindowMs;
        const nextCount = await readVisitorCount(shouldIncrement);
        const formattedCount = formatVisitorCount(nextCount);

        badgeCount.textContent = formattedCount;
        visitorBadge.dataset.state = 'live';
        localStorage.setItem(visitorCacheKey, formattedCount);

        if (shouldIncrement) {
          localStorage.setItem(visitorLastCountedKey, String(Date.now()));
        }
      } catch (error) {
        visitorBadge.dataset.state = 'offline';
        if (!cachedCount) badgeCount.textContent = '--';
      }
    };

    updateVisitorCounter();

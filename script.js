(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const navLinks = [...document.querySelectorAll('.desktop-nav .nav-link, .desktop-nav .nav-contact')];
  const mobileLinks = [...document.querySelectorAll('.mobile-menu a')];
  const allNavLinks = [...navLinks, ...mobileLinks];
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const skillRows = [...document.querySelectorAll('.expertise .skill-row')];
  const setSkillPanel = (button, open) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', (open ? 'Collapse ' : 'Expand ') + button.querySelector('.skill-name').textContent + ' details');
    button.querySelector('.skill-plus').textContent = open ? '\u2212' : '+';
    panel.setAttribute('aria-hidden', String(!open));
    panel.inert = !open;
    panel.classList.toggle('is-open', open);
  };
  skillRows.forEach(button => button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    if (open) skillRows.filter(other => other !== button).forEach(other => setSkillPanel(other, false));
    setSkillPanel(button, open);
  }));

  const setMenu = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    header.classList.toggle('menu-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    mobileMenu.inert = !open;
    mobileMenu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    if (!open) menuButton.focus({ preventScroll: true });
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false); });

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 18);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
    revealItems.forEach(item => observer.observe(item));
    document.documentElement.classList.add('has-reveal-motion');
  } else {
    revealItems.forEach(item => item.classList.add('in-view'));
  }

  if ('IntersectionObserver' in window) {
    const sections = [...document.querySelectorAll('main section[id]')];
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        const href = id === 'home' ? '#top' : '#' + id;
        allNavLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === href));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(section => sectionObserver.observe(section));
  }

  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      const href = link.getAttribute('href');
      allNavLinks.forEach(item => item.classList.toggle('active', item.getAttribute('href') === href));
    });
  });
})();

(() => {
  const header = document.querySelector('.site-header');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeFrame = 0;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const currentScrollY = () => window.scrollY || document.documentElement.scrollTop || 0;
  const cancelScroll = () => {
    if (!activeFrame) return;
    cancelAnimationFrame(activeFrame);
    activeFrame = 0;
  };

  const scrollToTarget = target => {
    cancelScroll();
    const startY = currentScrollY();
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const top = target.id === 'top' ? 0 : target.getBoundingClientRect().top + startY;
    const headerGap = header.getBoundingClientRect().height + Math.min(18, Math.max(12, header.getBoundingClientRect().height * .16));
    const destination = Math.max(0, Math.min(maxY, target.id === 'top' ? 0 : top - headerGap));

    if (reducedMotion.matches || Math.abs(destination - startY) < 2) {
      window.scrollTo(0, destination);
      return;
    }

    const distance = destination - startY;
    const duration = Math.min(1100, Math.max(320, 380 + Math.abs(distance) * .3));
    let startedAt = 0;
    const easeInOutCubic = progress => progress < .5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const step = timestamp => {
      if (!startedAt) startedAt = timestamp;
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (progress < 1) activeFrame = requestAnimationFrame(step);
      else {
        activeFrame = 0;
        window.scrollTo(0, destination);
      }
    };
    activeFrame = requestAnimationFrame(step);
  };

  const scrollToHash = hash => {
    const value = hash && hash !== '#' ? hash : '#top';
    let id;
    try { id = decodeURIComponent(value.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target) scrollToTarget(target);
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const rawHash = link.getAttribute('href');
    const hash = rawHash === '#' ? '#top' : rawHash;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (window.location.hash !== hash) {
      try { history.pushState({ portfolioScroll: true }, '', hash); } catch {}
    }
    scrollToTarget(target);
  });

  window.addEventListener('popstate', () => scrollToHash(window.location.hash));
  const interruptForManualScroll = () => cancelScroll();
  window.addEventListener('wheel', interruptForManualScroll, { passive: true });
  window.addEventListener('touchstart', interruptForManualScroll, { passive: true });
  window.addEventListener('pointerdown', interruptForManualScroll, { passive: true });
  document.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    cancelScroll();
  });
})();

(() => {
  const dialog = document.querySelector('.work .project-dialog');
  if (!dialog) return;
  const details = {
    lume: { title: 'Lume Studio', category: 'Creative Agency Website Concept', description: 'A fictional creative studio website concept exploring the relationship between visual storytelling, typography, and digital brand identity. The design focuses on presenting creative work beautifully, communicating studio identity, and creating an intuitive journey from the first impression to the portfolio.', focus: ['Frontend UI design', 'Layout composition', 'Responsive design', 'Typography', 'Interaction design'] },
    bloom: { title: 'Bloom & Co.', category: 'Botanical E-commerce Website Concept', description: 'A fictional online storefront concept designed around botanical products and contemporary lifestyle aesthetics. The interface explores how thoughtful product imagery, clear product categorization, and intuitive navigation can create a visually appealing and easy-to-explore shopping experience. Product information and prices are fictional samples.', focus: ['E-commerce interface design', 'Product cards', 'Navigation', 'Responsive layouts', 'Interactive UI components'] },
    focusflow: { title: 'FocusFlow', category: 'Student Productivity Dashboard Concept', description: 'A fictional productivity dashboard designed to explore how study tasks, weekly schedules, and progress information can be organized in one intuitive interface. The concept focuses on clear information architecture, readable data visualization, and a structured dashboard that makes planning easier to understand. All names and statistics are fictional samples.', focus: ['Dashboard UI', 'Information architecture', 'Data visualization', 'Reusable interface components', 'Responsive design'] }
  };
  const title = dialog.querySelector('#project-dialog-title');
  document.querySelectorAll('[data-open-project]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.openProject, data = details[key], card = document.querySelector('[data-project="' + key + '"]');
    title.textContent = data.title;
    dialog.querySelector('.dialog-category').textContent = data.category;
    dialog.querySelector('.dialog-description').textContent = data.description;
    dialog.querySelector('.dialog-preview').replaceChildren(card.querySelector('.project-visual').cloneNode(true));
    const list = dialog.querySelector('.dialog-focus ul'); list.replaceChildren(...data.focus.map(item => { const li = document.createElement('li'); li.textContent = item; return li; }));
    dialog.showModal();
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.addEventListener('click', event => {
    const category = event.target.closest('.bloom-cats button');
    if (category) { category.parentElement.querySelectorAll('button').forEach(button => { const selected = button === category; button.classList.toggle('active', selected); button.setAttribute('aria-pressed', String(selected)); }); const filter = category.textContent.toLowerCase().includes('indoor') ? 'plants' : category.textContent.toLowerCase().includes('planter') ? 'planters' : ''; category.closest('.mini-site').querySelectorAll('.bloom-products > div').forEach(product => { product.hidden = Boolean(filter) && product.dataset.category !== filter; }); }
  });
})();



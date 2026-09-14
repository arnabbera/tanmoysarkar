// assets/js/main.js - Portfolio Navigation & Dynamic Section Renderer (Public View)
// Loads content from localStorage if available locally, falling back to SITE_DATA (data.js)

document.addEventListener('DOMContentLoaded', () => {

  // DOM Elements
  const mobileToggle = document.getElementById('mobileToggle');
  const navTabs = document.getElementById('navTabs');
  const navLinks = document.querySelectorAll('.nav-tabs .tab');
  const sections = document.querySelectorAll('.content-section, .hero');

  // Grids
  const workGrid = document.getElementById('workGrid');
  const memoriesGrid = document.getElementById('memoriesGrid');
  const creationsGrid = document.getElementById('creationsGrid');

  /* =========================================================
     1. Navigation & Mobile Drawer
     ========================================================= */
  if (mobileToggle && navTabs) {
    mobileToggle.addEventListener('click', () => {
      navTabs.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      icon.className = navTabs.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navTabs && navTabs.classList.contains('open')) {
        navTabs.classList.remove('open');
        if (mobileToggle) mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
      }
    });
  });

  window.addEventListener('scroll', () => {
    let currentSectionId = '';
    const scrollPosition = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  });

  /* =========================================================
     2. Content Data Resolution (Local Storage -> SITE_DATA fallback)
     ========================================================= */
  function getEffectiveSiteData() {
    let base = (typeof SITE_DATA !== 'undefined') ? JSON.parse(JSON.stringify(SITE_DATA)) : { work: [], memories: [], creations: [] };

    try {
      // Check unified key
      const stored = localStorage.getItem('ts_site_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.work) && parsed.work.length) base.work = parsed.work;
          if (Array.isArray(parsed.memories) && parsed.memories.length) base.memories = parsed.memories;
          if (Array.isArray(parsed.creations) && parsed.creations.length) base.creations = parsed.creations;
          return base;
        }
      }

      // Check legacy keys
      const lsWork = localStorage.getItem('ts_work_items_v2');
      if (lsWork) {
        const pWork = JSON.parse(lsWork);
        if (Array.isArray(pWork) && pWork.length) base.work = pWork;
      }
      const lsMem = localStorage.getItem('ts_memories_items_v2');
      if (lsMem) {
        const pMem = JSON.parse(lsMem);
        if (Array.isArray(pMem) && pMem.length) base.memories = pMem;
      }
      const lsCre = localStorage.getItem('ts_creations_items_v2');
      if (lsCre) {
        const pCre = JSON.parse(lsCre);
        if (Array.isArray(pCre) && pCre.length) base.creations = pCre;
      }
    } catch (e) {
      console.warn('Error reading local content cache:', e);
    }

    return base;
  }

  /* =========================================================
     3. Render Sections
     ========================================================= */
  function renderAllSections() {
    const data = getEffectiveSiteData();
    renderWorkSection(data.work || []);
    renderMemoriesSection(data.memories || []);
    renderCreationsSection(data.creations || []);
  }

  function renderWorkSection(items) {
    if (!workGrid) return;
    workGrid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'work-card glass-card';

      const videoHtml = item.embedUrl
        ? `<div class="video-container">
             <iframe src="${item.embedUrl}" title="${item.title}" frameborder="0"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowfullscreen></iframe>
           </div>`
        : `<div class="video-placeholder">
             <i class="fa-brands fa-youtube"></i>
             <span>Video coming soon</span>
           </div>`;

      card.innerHTML = `
        ${videoHtml}
        <div class="card-body">
          <span class="category-badge">${item.category || 'Assignment'}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      `;
      workGrid.appendChild(card);
    });
  }

  function renderMemoriesSection(items) {
    if (!memoriesGrid) return;
    memoriesGrid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'memory-card glass-card';

      let mediaContent = '';
      if (item.isVideo && item.mediaUrl) {
        mediaContent = `
          <div class="video-container">
            <iframe src="${item.mediaUrl}" title="${item.title}" frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
          </div>
        `;
      } else {
        mediaContent = `
          <div class="memory-image" style="background-image: url('${item.mediaUrl || 'assets/images/hero_banner.png'}');">
            <div class="memory-tag"><i class="fa-solid fa-star"></i> ${item.tag || 'Memory'}</div>
          </div>
        `;
      }

      card.innerHTML = `
        ${mediaContent}
        <div class="card-body">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      `;
      memoriesGrid.appendChild(card);
    });
  }

  function renderCreationsSection(items) {
    if (!creationsGrid) return;
    creationsGrid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'creation-card glass-card';

      let iconClass = 'fa-brands fa-youtube icon-youtube';
      let btnIcon = 'fa-brands fa-youtube';
      let btnLabel = 'Visit Channel';

      if (item.iconStyle === 'food') {
        iconClass = 'fa-solid fa-bowl-food icon-food';
        btnIcon = 'fa-brands fa-youtube';
      } else if (item.iconStyle === 'blog') {
        iconClass = 'fa-solid fa-blog icon-blog';
        btnIcon = 'fa-solid fa-arrow-up-right-from-square';
        btnLabel = 'Read Blog';
      } else if (item.iconStyle === 'web') {
        iconClass = 'fa-solid fa-globe icon-web';
        btnIcon = 'fa-solid fa-globe';
        btnLabel = 'Open Webpage';
      }

      card.innerHTML = `
        <div class="channel-icon"><i class="${iconClass}"></i></div>
        <div class="card-body">
          <h3>${item.title}</h3>
          <p class="channel-handle">${item.handle}</p>
          <p>${item.description}</p>
          <a href="${item.url}" target="_blank" rel="noopener" class="btn btn-outline">
            <i class="${btnIcon}"></i> ${btnLabel}
          </a>
        </div>
      `;
      creationsGrid.appendChild(card);
    });
  }

  // Boot
  renderAllSections();
});

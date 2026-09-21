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
     2. Content Data Resolution
     The public site always uses the repository-backed data.js file.
     Browser-local admin drafts must never override published content.
     ========================================================= */
  function getEffectiveSiteData() {
    return (typeof SITE_DATA !== 'undefined' && SITE_DATA)
      ? JSON.parse(JSON.stringify(SITE_DATA))
      : { work: [], memories: [], creations: [] };
  }

  /* =========================================================
     3. Render Sections
     ========================================================= */
  function renderAllSections(data = getEffectiveSiteData()) {
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

  // Boot with repository fallback immediately, then subscribe to Firestore.
  renderAllSections();

  if (window.TS_FIREBASE && window.TS_FIREBASE.contentRef) {
    window.TS_FIREBASE.contentRef.onSnapshot({ includeMetadataChanges: true }, snapshot => {
      if (!snapshot.exists) return;
      const liveData = snapshot.data();
      renderAllSections({
        work: Array.isArray(liveData.work) ? liveData.work : [],
        memories: Array.isArray(liveData.memories) ? liveData.memories : [],
        creations: Array.isArray(liveData.creations) ? liveData.creations : []
      });
    }, error => {
      console.warn('Firestore unavailable; showing repository content.', error);
    });
  }
});

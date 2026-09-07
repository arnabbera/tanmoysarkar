// assets/js/main.js - Portfolio Navigation & Dynamic Section Renderer (Public View)

document.addEventListener('DOMContentLoaded', () => {
  const WORK_KEY = "ts_work_items_v2";
  const MEMORIES_KEY = "ts_memories_items_v2";
  const CREATIONS_KEY = "ts_creations_items_v2";

  // Default Items (shown if admin hasn't set any content yet)
  const DEFAULT_WORK = [
    { id: 'w1', section: 'work', title: 'Handloom Saree & Textile Heritage', category: 'Product Marketing', description: 'A promotional documentary capturing the delicate weaving process of authentic Indian handlooms and traditional weaves.', embedUrl: 'https://www.youtube.com/embed/videoseries?list=UU' },
    { id: 'w2', section: 'work', title: 'Durga Puja: The Heartbeat of Bengal', category: 'Cultural Documentary', description: 'Immersive short film showcasing the energy, devotion, artistic pandals, and rhythmic dhak beats during Durga Puja.', embedUrl: 'https://www.youtube.com/embed/videoseries?list=UU' },
    { id: 'w3', section: 'work', title: 'Handcrafted Jewelry & Royal Artisans', category: 'Commercial Film', description: 'High-definition product marketing reel highlighting intricate gold and silver craftsmanship for heritage jewelers.', embedUrl: 'https://www.youtube.com/embed/videoseries?list=UU' }
  ];

  const DEFAULT_MEMORIES = [
    { id: 'm1', section: 'memories', title: 'Monuments to Mandirs', tag: 'Temple Heritage', description: 'Documenting ancient architectural marvels, sacred rituals, and the timeless spiritual essence of India.', mediaUrl: 'assets/images/hero_banner.png' },
    { id: 'm2', section: 'memories', title: 'Flavors of Our Streets', tag: 'Street Flavors', description: 'Exploring local culinary gems, street food masters, and secret recipes from Kolkata to Mumbai.', mediaUrl: 'assets/images/hero_banner.png' }
  ];

  const DEFAULT_CREATIONS = [
    { id: 'c1', section: 'creations', title: 'Fashion & Handloom Channel', handle: '@tanmoysarkarsarees', description: 'Dedicated to Indian fashion, saree draping arts, handloom weaving techniques, and boutique showcases.', url: 'https://youtube.com/@tanmoysarkarsarees', iconStyle: 'youtube' },
    { id: 'c2', section: 'creations', title: 'Foods & Flavors', handle: '@foodisgod', description: 'A delicious tribute to Indian gastronomy, street food explorations, and authentic regional delicacies.', url: 'https://youtube.com/@foodisgod', iconStyle: 'food' },
    { id: 'c3', section: 'creations', title: 'Official Travel & Photo Blog', handle: 'tanmoysarkarproductions.blogspot.com', description: 'Behind-the-scenes stories, shoot diaries, photography blogs, and video journalism insights.', url: 'https://tanmoysarkarproductions.blogspot.com', iconStyle: 'blog' }
  ];

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
     2. Data Storage Helper Functions
     ========================================================= */
  function getItems(key, defaultVal) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  /* =========================================================
     3. Render Main Page Sections (Viewer Only)
     ========================================================= */
  function renderAllSections() {
    renderWorkSection();
    renderMemoriesSection();
    renderCreationsSection();
  }

  function renderWorkSection() {
    if (!workGrid) return;
    const items = getItems(WORK_KEY, DEFAULT_WORK);
    workGrid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'work-card glass-card';
      card.innerHTML = `
        <div class="video-container">
          <iframe src="${item.embedUrl}" title="${item.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        <div class="card-body">
          <span class="category-badge">${item.category || 'Assignment'}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      `;
      workGrid.appendChild(card);
    });
  }

  function renderMemoriesSection() {
    if (!memoriesGrid) return;
    const items = getItems(MEMORIES_KEY, DEFAULT_MEMORIES);
    memoriesGrid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'memory-card glass-card';

      let mediaContent = '';
      if (item.isVideo) {
        mediaContent = `
          <div class="video-container">
            <iframe src="${item.mediaUrl}" title="${item.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      } else {
        mediaContent = `
          <div class="memory-image" style="background-image: url('${item.mediaUrl}');">
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

  function renderCreationsSection() {
    if (!creationsGrid) return;
    const items = getItems(CREATIONS_KEY, DEFAULT_CREATIONS);
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

  // Initial Boot
  renderAllSections();
});

// admin/admin-portal.js
// Handles admin login gate, session, CRUD, and full site rendering with edit controls

document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_EMAILS = ["beraarnab@gmail.com", "tanmoysarkarvlogs@gmail.com"];
  const SESSION_KEY = "ts_admin_session";
  const WORK_KEY = "ts_work_items_v2";
  const MEMORIES_KEY = "ts_memories_items_v2";
  const CREATIONS_KEY = "ts_creations_items_v2";

  // Default Items
  const DEFAULT_WORK = [
    { id: 'w1', section: 'work', title: 'Handloom Saree & Textile Heritage', category: 'Product Marketing', description: 'A promotional documentary capturing the delicate weaving process of authentic Indian handlooms and traditional weaves.', embedUrl: 'https://www.youtube.com/embed/videoseries?list=UU' },
    { id: 'w2', section: 'work', title: 'Durga Puja: The Heartbeat of Bengal', category: 'Cultural Documentary', description: 'Immersive short film showcasing the energy, devotion, artistic pandals, and rhythmic dhak beats during Durga Puja.', embedUrl: 'https://www.youtube.com/embed/videoseries?list=UU' },
    { id: 'w3', section: 'work', title: 'Handcrafted Jewelry & Royal Artisans', category: 'Commercial Film', description: 'High-definition product marketing reel highlighting intricate gold and silver craftsmanship for heritage jewelers.', embedUrl: 'https://www.youtube.com/embed/videoseries?list=UU' }
  ];

  const DEFAULT_MEMORIES = [
    { id: 'm1', section: 'memories', title: 'Monuments to Mandirs', tag: 'Temple Heritage', description: 'Documenting ancient architectural marvels, sacred rituals, and the timeless spiritual essence of India.', mediaUrl: '../assets/images/hero_banner.png' },
    { id: 'm2', section: 'memories', title: 'Flavors of Our Streets', tag: 'Street Flavors', description: 'Exploring local culinary gems, street food masters, and secret recipes from Kolkata to Mumbai.', mediaUrl: '../assets/images/hero_banner.png' }
  ];

  const DEFAULT_CREATIONS = [
    { id: 'c1', section: 'creations', title: 'Fashion & Handloom Channel', handle: '@tanmoysarkarsarees', description: 'Dedicated to Indian fashion, saree draping arts, handloom weaving techniques, and boutique showcases.', url: 'https://youtube.com/@tanmoysarkarsarees', iconStyle: 'youtube' },
    { id: 'c2', section: 'creations', title: 'Foods & Flavors', handle: '@foodisgod', description: 'A delicious tribute to Indian gastronomy, street food explorations, and authentic regional delicacies.', url: 'https://youtube.com/@foodisgod', iconStyle: 'food' },
    { id: 'c3', section: 'creations', title: 'Official Travel & Photo Blog', handle: 'tanmoysarkarproductions.blogspot.com', description: 'Behind-the-scenes stories, shoot diaries, photography blogs, and video journalism insights.', url: 'https://tanmoysarkarproductions.blogspot.com', iconStyle: 'blog' }
  ];

  // ---------- DOM References ----------
  const loginGate       = document.getElementById('loginGate');
  const adminPortal     = document.getElementById('adminPortal');
  const loginForm       = document.getElementById('loginForm');
  const loginEmail      = document.getElementById('loginEmail');
  const loginMsg        = document.getElementById('loginMsg');
  const adminBarEmail   = document.getElementById('adminBarEmail');
  const adminBarLogoutBtn = document.getElementById('adminBarLogoutBtn');
  const adminBarAddBtn  = document.getElementById('adminBarAddBtn');
  const activeAdminEmail = document.getElementById('activeAdminEmail');

  const adminModal      = document.getElementById('adminModal');
  const closeAdminModal = document.getElementById('closeAdminModal');
  const postEditorForm  = document.getElementById('postEditorForm');
  const targetSection   = document.getElementById('targetSection');
  const workFieldsGroup = document.getElementById('workFieldsGroup');
  const memoriesFieldsGroup = document.getElementById('memoriesFieldsGroup');
  const creationsFieldsGroup = document.getElementById('creationsFieldsGroup');
  const adminPostsList  = document.getElementById('adminPostsList');

  const workGrid        = document.getElementById('workGrid');
  const memoriesGrid    = document.getElementById('memoriesGrid');
  const creationsGrid   = document.getElementById('creationsGrid');
  const inlineAddBtns   = document.querySelectorAll('.admin-inline-add-btn');

  const mobileToggle    = document.getElementById('mobileToggle');
  const navTabs         = document.getElementById('navTabs');
  const navLinks        = document.querySelectorAll('.nav-tabs .tab');
  const sections        = document.querySelectorAll('.content-section, .hero');

  /* =========================================================
     Utility
     ========================================================= */
  function getItems(key, defaultVal) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch (e) { return defaultVal; }
  }

  function saveItems(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
    renderAllSections();
  }

  function toEmbedUrl(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  }

  /* =========================================================
     Session helpers
     ========================================================= */
  function isLoggedIn() {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s && ADMIN_EMAILS.includes(s);
  }

  function getSessionEmail() {
    return sessionStorage.getItem(SESSION_KEY) || '';
  }

  /* =========================================================
     Boot: Check session → show gate OR portal
     ========================================================= */
  function boot() {
    if (isLoggedIn()) {
      showPortal(getSessionEmail());
    } else {
      showGate();
    }
  }

  function showGate() {
    loginGate.style.display = 'flex';
    adminPortal.classList.add('hidden');
  }

  function showPortal(email) {
    loginGate.style.display = 'none';
    adminPortal.classList.remove('hidden');
    if (adminBarEmail) adminBarEmail.textContent = email;
    if (activeAdminEmail) activeAdminEmail.textContent = email;
    renderAllSections();
    initNavigation();
  }

  /* =========================================================
     Login
     ========================================================= */
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginEmail.value.trim().toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        sessionStorage.setItem(SESSION_KEY, email);
        loginMsg.textContent = '';
        showPortal(email);
      } else {
        loginMsg.textContent = 'Unauthorized email. Please use a registered admin account.';
      }
    });
  }

  /* =========================================================
     Logout
     ========================================================= */
  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    showGate();
    if (adminModal) adminModal.classList.remove('active');
  }

  if (adminBarLogoutBtn) adminBarLogoutBtn.addEventListener('click', handleLogout);

  /* =========================================================
     Navigation (same as main.js)
     ========================================================= */
  function initNavigation() {
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
  }

  /* =========================================================
     Admin Modal Controls
     ========================================================= */
  if (adminBarAddBtn) {
    adminBarAddBtn.addEventListener('click', () => openAdminModal('work'));
  }

  if (closeAdminModal) {
    closeAdminModal.addEventListener('click', () => adminModal.classList.remove('active'));
  }

  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) adminModal.classList.remove('active');
    });
  }

  inlineAddBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const section = e.currentTarget.getAttribute('data-section');
      openAdminModal(section);
    });
  });

  if (targetSection) {
    targetSection.addEventListener('change', (e) => switchSectionFields(e.target.value));
  }

  function openAdminModal(preselectSection = 'work', editItemId = null) {
    adminModal.classList.add('active');
    if (targetSection) {
      targetSection.value = preselectSection;
      switchSectionFields(preselectSection);
    }
    if (editItemId) {
      populateEditForm(preselectSection, editItemId);
    } else {
      resetForm();
    }
    renderAdminPostsList();
  }

  function switchSectionFields(sec) {
    workFieldsGroup.classList.add('hidden');
    memoriesFieldsGroup.classList.add('hidden');
    creationsFieldsGroup.classList.add('hidden');
    if (sec === 'work') workFieldsGroup.classList.remove('hidden');
    else if (sec === 'memories') memoriesFieldsGroup.classList.remove('hidden');
    else if (sec === 'creations') creationsFieldsGroup.classList.remove('hidden');
  }

  function resetForm() {
    postEditorForm.reset();
    document.getElementById('postId').value = '';
    document.getElementById('savePostBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Save Item';
  }

  /* =========================================================
     Editor Form Submit (Create / Edit)
     ========================================================= */
  if (postEditorForm) {
    postEditorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('postId').value;
      const sec = targetSection.value;
      const title = document.getElementById('postTitle').value.trim();
      const description = document.getElementById('postDescription').value.trim();

      if (sec === 'work') {
        let items = getItems(WORK_KEY, DEFAULT_WORK);
        const category = document.getElementById('workCategory').value.trim() || 'Video Reel';
        const ytUrl = document.getElementById('workYtUrl').value.trim();
        const embedUrl = toEmbedUrl(ytUrl) || 'https://www.youtube.com/embed/videoseries?list=UU';
        if (id) {
          const idx = items.findIndex(item => item.id === id);
          if (idx !== -1) items[idx] = { id, section: 'work', title, category, description, embedUrl, rawYtUrl: ytUrl };
        } else {
          items.unshift({ id: 'work_' + Date.now(), section: 'work', title, category, description, embedUrl, rawYtUrl: ytUrl });
        }
        saveItems(WORK_KEY, items);

      } else if (sec === 'memories') {
        let items = getItems(MEMORIES_KEY, DEFAULT_MEMORIES);
        const tag = document.getElementById('memoryTag').value.trim() || 'Moment';
        const rawMediaUrl = document.getElementById('memoryMediaUrl').value.trim() || '../assets/images/hero_banner.png';
        const isVideo = rawMediaUrl.includes('youtube.com') || rawMediaUrl.includes('youtu.be');
        const mediaUrl = isVideo ? toEmbedUrl(rawMediaUrl) : rawMediaUrl;
        if (id) {
          const idx = items.findIndex(item => item.id === id);
          if (idx !== -1) items[idx] = { id, section: 'memories', title, tag, description, mediaUrl, isVideo };
        } else {
          items.unshift({ id: 'mem_' + Date.now(), section: 'memories', title, tag, description, mediaUrl, isVideo });
        }
        saveItems(MEMORIES_KEY, items);

      } else if (sec === 'creations') {
        let items = getItems(CREATIONS_KEY, DEFAULT_CREATIONS);
        const handle = document.getElementById('creationHandle').value.trim() || '@channel';
        const url = document.getElementById('creationUrl').value.trim() || '#';
        const iconStyle = document.getElementById('creationIconStyle').value;
        if (id) {
          const idx = items.findIndex(item => item.id === id);
          if (idx !== -1) items[idx] = { id, section: 'creations', title, handle, description, url, iconStyle };
        } else {
          items.unshift({ id: 'creation_' + Date.now(), section: 'creations', title, handle, description, url, iconStyle });
        }
        saveItems(CREATIONS_KEY, items);
      }

      resetForm();
      renderAdminPostsList();
    });
  }

  function populateEditForm(sec, id) {
    let item = null;
    if (sec === 'work') {
      item = getItems(WORK_KEY, DEFAULT_WORK).find(i => i.id === id);
      if (item) {
        document.getElementById('workCategory').value = item.category || '';
        document.getElementById('workYtUrl').value = item.rawYtUrl || item.embedUrl || '';
      }
    } else if (sec === 'memories') {
      item = getItems(MEMORIES_KEY, DEFAULT_MEMORIES).find(i => i.id === id);
      if (item) {
        document.getElementById('memoryTag').value = item.tag || '';
        document.getElementById('memoryMediaUrl').value = item.mediaUrl || '';
      }
    } else if (sec === 'creations') {
      item = getItems(CREATIONS_KEY, DEFAULT_CREATIONS).find(i => i.id === id);
      if (item) {
        document.getElementById('creationHandle').value = item.handle || '';
        document.getElementById('creationUrl').value = item.url || '';
        document.getElementById('creationIconStyle').value = item.iconStyle || 'youtube';
      }
    }
    if (item) {
      document.getElementById('postId').value = item.id;
      document.getElementById('postTitle').value = item.title;
      document.getElementById('postDescription').value = item.description;
      document.getElementById('savePostBtn').innerHTML = '<i class="fa-solid fa-check"></i> Update Item';
    }
  }

  function deleteItem(sec, id) {
    if (!confirm('Delete this item permanently?')) return;
    if (sec === 'work') {
      saveItems(WORK_KEY, getItems(WORK_KEY, DEFAULT_WORK).filter(i => i.id !== id));
    } else if (sec === 'memories') {
      saveItems(MEMORIES_KEY, getItems(MEMORIES_KEY, DEFAULT_MEMORIES).filter(i => i.id !== id));
    } else if (sec === 'creations') {
      saveItems(CREATIONS_KEY, getItems(CREATIONS_KEY, DEFAULT_CREATIONS).filter(i => i.id !== id));
    }
    renderAdminPostsList();
  }

  /* =========================================================
     Render Admin Posts List (inside modal)
     ========================================================= */
  function renderAdminPostsList() {
    if (!adminPostsList) return;
    const allItems = [
      ...getItems(WORK_KEY, DEFAULT_WORK),
      ...getItems(MEMORIES_KEY, DEFAULT_MEMORIES),
      ...getItems(CREATIONS_KEY, DEFAULT_CREATIONS)
    ];

    adminPostsList.innerHTML = '';
    if (allItems.length === 0) {
      adminPostsList.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No items available.</p>';
      return;
    }

    allItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'admin-post-item';
      div.innerHTML = `
        <div>
          <span style="font-size:0.7rem;text-transform:uppercase;color:var(--cyan-accent);font-weight:700;">[${item.section}]</span>
          <strong style="margin-left:0.3rem;">${item.title}</strong>
        </div>
        <div class="post-action-btns">
          <button class="btn btn-small btn-secondary edit-item-btn" data-sec="${item.section}" data-id="${item.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-small btn-secondary delete-item-btn" data-sec="${item.section}" data-id="${item.id}" style="color:#ff6b6b;"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      adminPostsList.appendChild(div);
    });

    adminPostsList.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sec = e.currentTarget.getAttribute('data-sec');
        const id = e.currentTarget.getAttribute('data-id');
        targetSection.value = sec;
        switchSectionFields(sec);
        populateEditForm(sec, id);
      });
    });

    adminPostsList.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sec = e.currentTarget.getAttribute('data-sec');
        const id = e.currentTarget.getAttribute('data-id');
        deleteItem(sec, id);
      });
    });
  }

  /* =========================================================
     Render All Sections (with admin edit overlays)
     ========================================================= */
  function renderAllSections() {
    renderWorkSection();
    renderMemoriesSection();
    renderCreationsSection();
    attachCardAdminListeners();
  }

  function renderWorkSection() {
    if (!workGrid) return;
    const items = getItems(WORK_KEY, DEFAULT_WORK);
    workGrid.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'work-card glass-card';
      card.innerHTML = `
        <div class="card-admin-toolbar">
          <button class="card-admin-btn edit-btn" data-sec="work" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="card-admin-btn delete-btn" data-sec="work" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
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
        mediaContent = `<div class="video-container"><iframe src="${item.mediaUrl}" title="${item.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      } else {
        mediaContent = `<div class="memory-image" style="background-image: url('${item.mediaUrl}');"><div class="memory-tag"><i class="fa-solid fa-star"></i> ${item.tag || 'Memory'}</div></div>`;
      }
      card.innerHTML = `
        <div class="card-admin-toolbar">
          <button class="card-admin-btn edit-btn" data-sec="memories" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="card-admin-btn delete-btn" data-sec="memories" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
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
        <div class="card-admin-toolbar">
          <button class="card-admin-btn edit-btn" data-sec="creations" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="card-admin-btn delete-btn" data-sec="creations" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
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

  function attachCardAdminListeners() {
    document.querySelectorAll('.card-admin-btn.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sec = e.currentTarget.getAttribute('data-sec');
        const id = e.currentTarget.getAttribute('data-id');
        openAdminModal(sec, id);
      });
    });
    document.querySelectorAll('.card-admin-btn.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sec = e.currentTarget.getAttribute('data-sec');
        const id = e.currentTarget.getAttribute('data-id');
        deleteItem(sec, id);
      });
    });
  }

  // Boot
  boot();
});

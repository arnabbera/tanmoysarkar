// assets/js/main.js - High-Fi Portfolio Navigation & Dynamic Multi-Section Admin System

document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_EMAILS = ["beraarnab@gmail.com", "tanmoysarkarvlogs@gmail.com"];
  const SESSION_KEY = "ts_admin_session";
  const WORK_KEY = "ts_work_items_v4";
  const MEMORIES_KEY = "ts_memories_items_v4";
  const CREATIONS_KEY = "ts_creations_items_v4";

  // Default Items with Active, Fully-Playable YouTube Video Embeds
  const DEFAULT_WORK = [
    { id: 'w1', section: 'work', title: 'Handloom Saree & Textile Heritage', category: 'Product Marketing', description: 'A promotional documentary capturing the delicate weaving process of authentic Indian handlooms and traditional weaves.', embedUrl: 'https://www.youtube.com/embed/2g811Eo7K8U', rawYtUrl: 'https://www.youtube.com/watch?v=2g811Eo7K8U' },
    { id: 'w2', section: 'work', title: 'Durga Puja: The Heartbeat of Bengal', category: 'Cultural Documentary', description: 'Immersive short film showcasing the energy, devotion, artistic pandals, and rhythmic dhak beats during Durga Puja.', embedUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4', rawYtUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4' },
    { id: 'w3', section: 'work', title: 'Handcrafted Jewelry & Royal Artisans', category: 'Commercial Film', description: 'High-definition product marketing reel highlighting intricate gold and silver craftsmanship for heritage jewelers.', embedUrl: 'https://www.youtube.com/embed/5qap5aO4i9A', rawYtUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A' }
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

  // Admin Top Bar
  const adminBar = document.getElementById('adminBar');
  const adminBarEmail = document.getElementById('adminBarEmail');
  const adminBarAddBtn = document.getElementById('adminBarAddBtn');
  const adminBarLogoutBtn = document.getElementById('adminBarLogoutBtn');

  // Admin Modal Elements
  const adminModalBtn = document.getElementById('adminModalBtn');
  const adminModal = document.getElementById('adminModal');
  const closeAdminModal = document.getElementById('closeAdminModal');
  const adminLoginView = document.getElementById('adminLoginView');
  const adminDashboardView = document.getElementById('adminDashboardView');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginMsg = document.getElementById('loginMsg');
  const activeAdminEmail = document.getElementById('activeAdminEmail');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Editor Form & Section Groups
  const postEditorForm = document.getElementById('postEditorForm');
  const targetSection = document.getElementById('targetSection');
  const workFieldsGroup = document.getElementById('workFieldsGroup');
  const memoriesFieldsGroup = document.getElementById('memoriesFieldsGroup');
  const creationsFieldsGroup = document.getElementById('creationsFieldsGroup');
  const adminPostsList = document.getElementById('adminPostsList');

  // Grids
  const workGrid = document.getElementById('workGrid');
  const memoriesGrid = document.getElementById('memoriesGrid');
  const creationsGrid = document.getElementById('creationsGrid');
  const inlineAddBtns = document.querySelectorAll('.admin-inline-add-btn');

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

  function saveItems(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
    renderAllSections();
  }

  function toEmbedUrl(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  }

  /* =========================================================
     3. Admin Session & Mode Manager
     ========================================================= */
  function isAdminLoggedIn() {
    const session = sessionStorage.getItem(SESSION_KEY);
    return session && ADMIN_EMAILS.includes(session);
  }

  function updateAdminUI() {
    const loggedIn = isAdminLoggedIn();
    const sessionEmail = sessionStorage.getItem(SESSION_KEY);

    if (loggedIn) {
      document.body.classList.add('admin-mode');
      if (adminBar) adminBar.classList.remove('hidden');
      if (adminBarEmail) adminBarEmail.textContent = sessionEmail;
      inlineAddBtns.forEach(btn => btn.classList.remove('hidden'));
    } else {
      document.body.classList.remove('admin-mode');
      if (adminBar) adminBar.classList.add('hidden');
      inlineAddBtns.forEach(btn => btn.classList.add('hidden'));
    }
    renderAllSections();
  }

  /* =========================================================
     4. Admin Modal Controls
     ========================================================= */
  if (adminModalBtn && adminModal && closeAdminModal) {
    adminModalBtn.addEventListener('click', () => {
      openAdminModal();
    });

    closeAdminModal.addEventListener('click', () => {
      adminModal.classList.remove('active');
    });

    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) adminModal.classList.remove('active');
    });
  }

  function openAdminModal(preselectSection = 'work', editItemId = null) {
    adminModal.classList.add('active');
    if (isAdminLoggedIn()) {
      showDashboard(sessionStorage.getItem(SESSION_KEY));
      if (targetSection) {
        targetSection.value = preselectSection;
        switchSectionFields(preselectSection);
      }
      if (editItemId) {
        populateEditForm(preselectSection, editItemId);
      } else {
        resetForm();
      }
    } else {
      showLoginView();
    }
  }

  function showLoginView() {
    adminLoginView.classList.remove('hidden');
    adminDashboardView.classList.add('hidden');
    if (loginMsg) loginMsg.textContent = '';
    if (loginEmail) loginEmail.value = '';
  }

  function showDashboard(email) {
    adminLoginView.classList.add('hidden');
    adminDashboardView.classList.remove('hidden');
    if (activeAdminEmail) activeAdminEmail.textContent = email;
    renderAdminPostsList();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginEmail.value.trim().toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        sessionStorage.setItem(SESSION_KEY, email);
        updateAdminUI();
        showDashboard(email);
      } else {
        loginMsg.textContent = "Unauthorized email. Please use an official admin account.";
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  if (adminBarLogoutBtn) {
    adminBarLogoutBtn.addEventListener('click', handleLogout);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    updateAdminUI();
    if (adminModal.classList.contains('active')) {
      showLoginView();
    }
  }

  if (adminBarAddBtn) {
    adminBarAddBtn.addEventListener('click', () => {
      openAdminModal('work');
    });
  }

  inlineAddBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const section = e.currentTarget.getAttribute('data-section');
      openAdminModal(section);
    });
  });

  /* =========================================================
     5. Dynamic Section Fields Switcher
     ========================================================= */
  if (targetSection) {
    targetSection.addEventListener('change', (e) => {
      switchSectionFields(e.target.value);
    });
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
     6. Editor Form Submit (Create / Edit)
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
        const rawMediaUrl = document.getElementById('memoryMediaUrl').value.trim() || 'assets/images/hero_banner.png';
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
      const items = getItems(WORK_KEY, DEFAULT_WORK);
      item = items.find(i => i.id === id);
      if (item) {
        document.getElementById('workCategory').value = item.category || '';
        document.getElementById('workYtUrl').value = item.rawYtUrl || item.embedUrl || '';
      }
    } else if (sec === 'memories') {
      const items = getItems(MEMORIES_KEY, DEFAULT_MEMORIES);
      item = items.find(i => i.id === id);
      if (item) {
        document.getElementById('memoryTag').value = item.tag || '';
        document.getElementById('memoryMediaUrl').value = item.mediaUrl || '';
      }
    } else if (sec === 'creations') {
      const items = getItems(CREATIONS_KEY, DEFAULT_CREATIONS);
      item = items.find(i => i.id === id);
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
    if (confirm("Delete this item permanently?")) {
      if (sec === 'work') {
        let items = getItems(WORK_KEY, DEFAULT_WORK).filter(i => i.id !== id);
        saveItems(WORK_KEY, items);
      } else if (sec === 'memories') {
        let items = getItems(MEMORIES_KEY, DEFAULT_MEMORIES).filter(i => i.id !== id);
        saveItems(MEMORIES_KEY, items);
      } else if (sec === 'creations') {
        let items = getItems(CREATIONS_KEY, DEFAULT_CREATIONS).filter(i => i.id !== id);
        saveItems(CREATIONS_KEY, items);
      }
      renderAdminPostsList();
    }
  }

  /* =========================================================
     7. Render Admin Dashboard Items List
     ========================================================= */
  function renderAdminPostsList() {
    if (!adminPostsList) return;
    const workItems = getItems(WORK_KEY, DEFAULT_WORK);
    const memItems = getItems(MEMORIES_KEY, DEFAULT_MEMORIES);
    const creationItems = getItems(CREATIONS_KEY, DEFAULT_CREATIONS);
    const allItems = [...workItems, ...memItems, ...creationItems];

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
     8. Render Main Page Sections (Viewer & Admin Overlay)
     ========================================================= */
  function renderAllSections() {
    const adminActive = isAdminLoggedIn();
    renderWorkSection(adminActive);
    renderMemoriesSection(adminActive);
    renderCreationsSection(adminActive);
    attachCardAdminListeners();
  }

  function renderWorkSection(adminActive) {
    if (!workGrid) return;
    const items = getItems(WORK_KEY, DEFAULT_WORK);
    workGrid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'work-card glass-card';
      card.innerHTML = `
        ${adminActive ? `
          <div class="card-admin-toolbar">
            <button class="card-admin-btn edit-btn" data-sec="work" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="card-admin-btn delete-btn" data-sec="work" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        ` : ''}
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

  function renderMemoriesSection(adminActive) {
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
        ${adminActive ? `
          <div class="card-admin-toolbar">
            <button class="card-admin-btn edit-btn" data-sec="memories" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="card-admin-btn delete-btn" data-sec="memories" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        ` : ''}
        ${mediaContent}
        <div class="card-body">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
      `;
      memoriesGrid.appendChild(card);
    });
  }

  function renderCreationsSection(adminActive) {
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
        ${adminActive ? `
          <div class="card-admin-toolbar">
            <button class="card-admin-btn edit-btn" data-sec="creations" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="card-admin-btn delete-btn" data-sec="creations" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        ` : ''}
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

  // Initial Boot
  updateAdminUI();
});

// admin/admin-portal.js
// Handles admin login, in-browser persistent CRUD, and 1-click GitHub sync for mobile devices

document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_EMAILS  = ["beraarnab@gmail.com", "tanmoysarkarvlogs@gmail.com"];
  const SESSION_KEY   = "ts_admin_session";
  const STORAGE_KEY   = "ts_site_data";
  const GH_REPO       = "arnabbera/tanmoysarkar";
  const GH_FILE_PATH  = "assets/js/data.js";
  const GH_BRANCH     = "main";

  // Legacy keys for backwards compatibility and recovery
  const OLD_WORK_KEY      = "ts_work_items_v2";
  const OLD_MEMORIES_KEY  = "ts_memories_items_v2";
  const OLD_CREATIONS_KEY = "ts_creations_items_v2";
  const OLD_POSTS_KEY     = "adminPosts";

  // ----------------------------------------------------------------
  // In-memory content state
  // ----------------------------------------------------------------
  let siteData = {
    work: [],
    memories: [],
    creations: []
  };

  // ----------------------------------------------------------------
  // Content Loading & Persistence (Guarantees data is NEVER lost)
  // ----------------------------------------------------------------
  function loadSiteData() {
    // 1. Start with repo defaults
    if (typeof SITE_DATA !== 'undefined' && SITE_DATA) {
      siteData = JSON.parse(JSON.stringify(SITE_DATA));
    }

    // 2. Check unified localStorage key first
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.work)) siteData.work = parsed.work;
          if (Array.isArray(parsed.memories)) siteData.memories = parsed.memories;
          if (Array.isArray(parsed.creations)) siteData.creations = parsed.creations;
          return;
        }
      }
    } catch (e) {
      console.warn('Error reading STORAGE_KEY:', e);
    }

    // 3. Fallback to legacy keys if unified key not set
    try {
      const lsWork = localStorage.getItem(OLD_WORK_KEY);
      if (lsWork) {
        const parsedWork = JSON.parse(lsWork);
        if (Array.isArray(parsedWork) && parsedWork.length) siteData.work = parsedWork;
      }
      const lsMemories = localStorage.getItem(OLD_MEMORIES_KEY);
      if (lsMemories) {
        const parsedMem = JSON.parse(lsMemories);
        if (Array.isArray(parsedMem) && parsedMem.length) siteData.memories = parsedMem;
      }
      const lsCreations = localStorage.getItem(OLD_CREATIONS_KEY);
      if (lsCreations) {
        const parsedCre = JSON.parse(lsCreations);
        if (Array.isArray(parsedCre) && parsedCre.length) siteData.creations = parsedCre;
      }

      // Check very old adminPosts key
      const oldPosts = localStorage.getItem(OLD_POSTS_KEY);
      if (oldPosts && (!siteData.work || !siteData.work.length)) {
        const parsedPosts = JSON.parse(oldPosts);
        if (Array.isArray(parsedPosts) && parsedPosts.length) {
          siteData.work = parsedPosts.map(p => ({
            id: p.id || ('w_' + Date.now()),
            section: 'work',
            title: p.title || '',
            category: p.keywords || 'Video Work',
            description: p.description || '',
            embedUrl: p.embedUrl || '',
            rawYtUrl: p.embedUrl || ''
          }));
        }
      }

      // Save merged data into the unified key
      saveSiteDataLocally();
    } catch (e) {
      console.warn('Error recovering legacy data:', e);
    }
  }

  function saveSiteDataLocally() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
      // Also keep legacy keys in sync
      localStorage.setItem(OLD_WORK_KEY, JSON.stringify(siteData.work || []));
      localStorage.setItem(OLD_MEMORIES_KEY, JSON.stringify(siteData.memories || []));
      localStorage.setItem(OLD_CREATIONS_KEY, JSON.stringify(siteData.creations || []));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // ----------------------------------------------------------------
  // DOM References
  // ----------------------------------------------------------------
  const loginGate          = document.getElementById('loginGate');
  const adminPortal        = document.getElementById('adminPortal');
  const loginForm          = document.getElementById('loginForm');
  const loginEmailEl       = document.getElementById('loginEmail');
  const loginMsg           = document.getElementById('loginMsg');
  const adminBarEmail      = document.getElementById('adminBarEmail');
  const adminBarLogoutBtn  = document.getElementById('adminBarLogoutBtn');
  const adminBarAddBtn     = document.getElementById('adminBarAddBtn');
  const adminBarSyncBtn    = document.getElementById('adminBarSyncBtn');
  const activeAdminEmail   = document.getElementById('activeAdminEmail');

  // Edit Modal
  const adminModal         = document.getElementById('adminModal');
  const closeAdminModal    = document.getElementById('closeAdminModal');
  const postEditorForm     = document.getElementById('postEditorForm');
  const targetSection      = document.getElementById('targetSection');
  const workFieldsGroup    = document.getElementById('workFieldsGroup');
  const memoriesFieldsGroup= document.getElementById('memoriesFieldsGroup');
  const creationsFieldsGroup=document.getElementById('creationsFieldsGroup');
  const adminPostsList     = document.getElementById('adminPostsList');
  const savePostBtn        = document.getElementById('savePostBtn');
  const modalSaveFeedback  = document.getElementById('modalSaveFeedback');

  // Sync Modal
  const syncModal          = document.getElementById('syncModal');
  const closeSyncModal     = document.getElementById('closeSyncModal');
  const ghTokenInput       = document.getElementById('ghTokenInput');
  const publishBtn         = document.getElementById('publishBtn');
  const publishStatus      = document.getElementById('publishStatus');
  const copyDataBtn        = document.getElementById('copyDataBtn');
  const copyStatus         = document.getElementById('copyStatus');

  // Grids
  const workGrid           = document.getElementById('workGrid');
  const memoriesGrid       = document.getElementById('memoriesGrid');
  const creationsGrid      = document.getElementById('creationsGrid');
  const inlineAddBtns      = document.querySelectorAll('.admin-inline-add-btn');

  // Navigation
  const mobileToggle       = document.getElementById('mobileToggle');
  const navTabs            = document.getElementById('navTabs');
  const navLinks           = document.querySelectorAll('.nav-tabs .tab');
  const sections           = document.querySelectorAll('.content-section, .hero');

  // ----------------------------------------------------------------
  // YouTube URL to Embed URL Converter
  // ----------------------------------------------------------------
  function toEmbedUrl(url) {
    if (!url) return '';
    const cleanUrl = url.trim();
    // Matches youtube.com/watch?v=..., youtu.be/..., shorts/..., live/..., embed/...
    const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/|(?:.*?[?&]v=)))([\w-]{11})/i);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return cleanUrl;
  }

  // ----------------------------------------------------------------
  // Session & Authentication
  // ----------------------------------------------------------------
  function isLoggedIn() {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s && ADMIN_EMAILS.includes(s.toLowerCase());
  }

  function getSessionEmail() {
    return sessionStorage.getItem(SESSION_KEY) || '';
  }

  function getStoredToken() {
    // Keep the GitHub token only for this browser tab. Never persist it in localStorage.
    return sessionStorage.getItem('ts_gh_token') || '';
  }

  function boot() {
    loadSiteData();
    if (isLoggedIn()) {
      showPortal(getSessionEmail());
    } else {
      showGate();
    }
  }

  function showGate() {
    if (loginGate) loginGate.style.display = 'flex';
    if (adminPortal) adminPortal.classList.add('hidden');
  }

  function showPortal(email) {
    if (loginGate) loginGate.style.display = 'none';
    if (adminPortal) adminPortal.classList.remove('hidden');
    if (adminBarEmail) adminBarEmail.textContent = email;
    if (activeAdminEmail) activeAdminEmail.textContent = email;
    if (ghTokenInput) ghTokenInput.value = getStoredToken();

    renderAllSections();
    initNavigation();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginEmailEl.value.trim().toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        sessionStorage.setItem(SESSION_KEY, email);
        if (loginMsg) loginMsg.textContent = '';
        showPortal(email);
      } else {
        if (loginMsg) loginMsg.textContent = 'Unauthorized email. Please use a registered admin account.';
      }
    });
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    showGate();
    if (adminModal) adminModal.classList.remove('active');
    if (syncModal) syncModal.classList.remove('active');
  }
  if (adminBarLogoutBtn) adminBarLogoutBtn.addEventListener('click', handleLogout);

  // ----------------------------------------------------------------
  // Navigation & Scroll Tracking
  // ----------------------------------------------------------------
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
      let cur = '';
      const sp = window.scrollY + 200;
      sections.forEach(sec => {
        if (sp >= sec.offsetTop && sp < sec.offsetTop + sec.offsetHeight) cur = sec.id;
      });
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${cur}`);
      });
    });
  }

  // ----------------------------------------------------------------
  // Modal Handling
  // ----------------------------------------------------------------
  if (adminBarAddBtn) adminBarAddBtn.addEventListener('click', () => openAdminModal('work'));
  if (closeAdminModal) closeAdminModal.addEventListener('click', () => adminModal.classList.remove('active'));
  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) adminModal.classList.remove('active');
    });
  }

  // Sync Modal Triggers
  if (adminBarSyncBtn) adminBarSyncBtn.addEventListener('click', openSyncModal);
  if (closeSyncModal) closeSyncModal.addEventListener('click', () => syncModal.classList.remove('active'));
  if (syncModal) {
    syncModal.addEventListener('click', (e) => {
      if (e.target === syncModal) syncModal.classList.remove('active');
    });
  }

  function openSyncModal() {
    if (!syncModal) return;
    syncModal.classList.add('active');
    if (ghTokenInput && !ghTokenInput.value) {
      ghTokenInput.value = getStoredToken();
    }
  }

  inlineAddBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      openAdminModal(e.currentTarget.getAttribute('data-section'));
    });
  });

  if (targetSection) {
    targetSection.addEventListener('change', (e) => switchSectionFields(e.target.value));
  }

  function openAdminModal(preselectSection = 'work', editItemId = null) {
    if (!adminModal) return;
    adminModal.classList.add('active');
    if (modalSaveFeedback) modalSaveFeedback.textContent = '';

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
    if (workFieldsGroup) workFieldsGroup.classList.add('hidden');
    if (memoriesFieldsGroup) memoriesFieldsGroup.classList.add('hidden');
    if (creationsFieldsGroup) creationsFieldsGroup.classList.add('hidden');

    if (sec === 'work' && workFieldsGroup) workFieldsGroup.classList.remove('hidden');
    else if (sec === 'memories' && memoriesFieldsGroup) memoriesFieldsGroup.classList.remove('hidden');
    else if (sec === 'creations' && creationsFieldsGroup) creationsFieldsGroup.classList.remove('hidden');
  }

  function resetForm() {
    if (postEditorForm) postEditorForm.reset();
    const idEl = document.getElementById('postId');
    if (idEl) idEl.value = '';
    if (savePostBtn) savePostBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Save Item';
  }

  // ----------------------------------------------------------------
  // Form Save / Edit / Delete (Always persists to localStorage)
  // ----------------------------------------------------------------
  if (postEditorForm) {
    postEditorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id          = document.getElementById('postId').value;
      const sec         = targetSection.value;
      const title       = document.getElementById('postTitle').value.trim();
      const description = document.getElementById('postDescription').value.trim();

      if (sec === 'work') {
        const category = document.getElementById('workCategory').value.trim() || 'Video Reel';
        const rawYtUrl = document.getElementById('workYtUrl').value.trim();
        const embedUrl = toEmbedUrl(rawYtUrl);
        const item     = { id: id || ('work_' + Date.now()), section: 'work', title, category, description, embedUrl, rawYtUrl };
        upsert('work', item, id);

      } else if (sec === 'memories') {
        const tag         = document.getElementById('memoryTag').value.trim() || 'Memory';
        const rawMediaUrl = document.getElementById('memoryMediaUrl').value.trim() || 'assets/images/hero_banner.png';
        const isVideo     = rawMediaUrl.includes('youtube.com') || rawMediaUrl.includes('youtu.be');
        const mediaUrl    = isVideo ? toEmbedUrl(rawMediaUrl) : rawMediaUrl;
        const item        = { id: id || ('mem_' + Date.now()), section: 'memories', title, tag, description, mediaUrl, isVideo };
        upsert('memories', item, id);

      } else if (sec === 'creations') {
        const handle    = document.getElementById('creationHandle').value.trim() || '@channel';
        const url       = document.getElementById('creationUrl').value.trim() || '#';
        const iconStyle = document.getElementById('creationIconStyle').value;
        const item      = { id: id || ('creation_' + Date.now()), section: 'creations', title, handle, description, url, iconStyle };
        upsert('creations', item, id);
      }

      // CRITICAL: Save to localStorage immediately so data is NEVER lost
      saveSiteDataLocally();

      resetForm();
      renderAllSections();
      renderAdminPostsList();

      // Publish automatically after the token has been supplied once in this tab.
      if (getStoredToken()) publishSiteData(true);

      // Show save confirmation
      if (modalSaveFeedback) {
        modalSaveFeedback.textContent = getStoredToken()
          ? '✅ Saved locally. Publishing to GitHub now…'
          : '✅ Saved on this device. Click "Sync to Mobile" to publish it everywhere.';
        modalSaveFeedback.className = 'publish-status publish-success';
        setTimeout(() => {
          if (modalSaveFeedback) modalSaveFeedback.textContent = '';
        }, 5000);
      }
    });
  }

  function upsert(sec, newItem, existingId) {
    if (!siteData[sec]) siteData[sec] = [];
    if (existingId) {
      const idx = siteData[sec].findIndex(i => i.id === existingId);
      if (idx !== -1) {
        siteData[sec][idx] = newItem;
      } else {
        siteData[sec].unshift(newItem);
      }
    } else {
      siteData[sec].unshift(newItem);
    }
  }

  function deleteItem(sec, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    if (siteData[sec]) {
      siteData[sec] = siteData[sec].filter(i => i.id !== id);
    }
    saveSiteDataLocally();
    renderAllSections();
    renderAdminPostsList();
    if (getStoredToken()) publishSiteData(true);
  }

  function populateEditForm(sec, id) {
    const item = siteData[sec] && siteData[sec].find(i => i.id === id);
    if (!item) return;

    document.getElementById('postId').value          = item.id;
    document.getElementById('postTitle').value       = item.title || '';
    document.getElementById('postDescription').value = item.description || '';
    if (savePostBtn) savePostBtn.innerHTML = '<i class="fa-solid fa-check"></i> Update Item';

    if (sec === 'work') {
      document.getElementById('workCategory').value = item.category || '';
      document.getElementById('workYtUrl').value    = item.rawYtUrl || item.embedUrl || '';
    } else if (sec === 'memories') {
      document.getElementById('memoryTag').value      = item.tag || '';
      document.getElementById('memoryMediaUrl').value = item.mediaUrl || '';
    } else if (sec === 'creations') {
      document.getElementById('creationHandle').value    = item.handle || '';
      document.getElementById('creationUrl').value       = item.url || '';
      document.getElementById('creationIconStyle').value = item.iconStyle || 'youtube';
    }
  }

  // ----------------------------------------------------------------
  // Render Admin Managed Posts List
  // ----------------------------------------------------------------
  function renderAdminPostsList() {
    if (!adminPostsList) return;
    const allItems = [
      ...(siteData.work || []),
      ...(siteData.memories || []),
      ...(siteData.creations || [])
    ];
    adminPostsList.innerHTML = '';
    if (!allItems.length) {
      adminPostsList.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No items yet.</p>';
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
          <button class="btn btn-small btn-secondary edit-item-btn" data-sec="${item.section}" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-small btn-secondary delete-item-btn" data-sec="${item.section}" data-id="${item.id}" style="color:#ff6b6b;" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>`;
      adminPostsList.appendChild(div);
    });

    adminPostsList.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sec = e.currentTarget.dataset.sec;
        const id  = e.currentTarget.dataset.id;
        targetSection.value = sec;
        switchSectionFields(sec);
        populateEditForm(sec, id);
      });
    });

    adminPostsList.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        deleteItem(e.currentTarget.dataset.sec, e.currentTarget.dataset.id);
      });
    });
  }

  // ----------------------------------------------------------------
  // Section Renderers (Live Preview with Edit Overlays)
  // ----------------------------------------------------------------
  function renderAllSections() {
    renderWorkSection();
    renderMemoriesSection();
    renderCreationsSection();
    attachCardAdminListeners();
  }

  function renderWorkSection() {
    if (!workGrid) return;
    workGrid.innerHTML = '';
    (siteData.work || []).forEach(item => {
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
        <div class="card-admin-toolbar">
          <button class="card-admin-btn edit-btn" data-sec="work" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="card-admin-btn delete-btn" data-sec="work" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
        ${videoHtml}
        <div class="card-body">
          <span class="category-badge">${item.category || 'Assignment'}</span>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>`;
      workGrid.appendChild(card);
    });
  }

  function renderMemoriesSection() {
    if (!memoriesGrid) return;
    memoriesGrid.innerHTML = '';
    (siteData.memories || []).forEach(item => {
      const card = document.createElement('div');
      card.className = 'memory-card glass-card';
      const mediaContent = item.isVideo && item.mediaUrl
        ? `<div class="video-container">
             <iframe src="${item.mediaUrl}" title="${item.title}" frameborder="0"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowfullscreen></iframe>
           </div>`
        : `<div class="memory-image" style="background-image:url('${item.mediaUrl || '../assets/images/hero_banner.png'}');">
             <div class="memory-tag"><i class="fa-solid fa-star"></i> ${item.tag || 'Memory'}</div>
           </div>`;

      card.innerHTML = `
        <div class="card-admin-toolbar">
          <button class="card-admin-btn edit-btn" data-sec="memories" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="card-admin-btn delete-btn" data-sec="memories" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
        ${mediaContent}
        <div class="card-body">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>`;
      memoriesGrid.appendChild(card);
    });
  }

  function renderCreationsSection() {
    if (!creationsGrid) return;
    creationsGrid.innerHTML = '';
    (siteData.creations || []).forEach(item => {
      const card = document.createElement('div');
      card.className = 'creation-card glass-card';
      let iconClass = 'fa-brands fa-youtube icon-youtube', btnIcon = 'fa-brands fa-youtube', btnLabel = 'Visit Channel';
      if (item.iconStyle === 'food') { iconClass = 'fa-solid fa-bowl-food icon-food'; }
      if (item.iconStyle === 'blog') { iconClass = 'fa-solid fa-blog icon-blog'; btnIcon = 'fa-solid fa-arrow-up-right-from-square'; btnLabel = 'Read Blog'; }
      if (item.iconStyle === 'web')  { iconClass = 'fa-solid fa-globe icon-web'; btnIcon = 'fa-solid fa-globe'; btnLabel = 'Open Webpage'; }

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
          <a href="${item.url}" target="_blank" rel="noopener" class="btn btn-outline"><i class="${btnIcon}"></i> ${btnLabel}</a>
        </div>`;
      creationsGrid.appendChild(card);
    });
  }

  function attachCardAdminListeners() {
    document.querySelectorAll('.card-admin-btn.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sec = e.currentTarget.dataset.sec;
        const id  = e.currentTarget.dataset.id;
        openAdminModal(sec, id);
      });
    });
    document.querySelectorAll('.card-admin-btn.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        deleteItem(e.currentTarget.dataset.sec, e.currentTarget.dataset.id);
      });
    });
  }

  // ----------------------------------------------------------------
  // GitHub API Sync & Code Export
  // ----------------------------------------------------------------
  function buildDataJs() {
    return `// assets/js/data.js
// Central content store — edit via Admin Portal at /admin
// Changes here are reflected on ALL devices immediately after GitHub Pages rebuilds (~1 min)

const SITE_DATA = ${JSON.stringify(siteData, null, 2)};
`;
  }

  function setPublishStatus(msg, type) {
    if (!publishStatus) return;
    publishStatus.textContent = msg;
    publishStatus.className = 'publish-status publish-' + type;
  }

  let publishInFlight = false;
  let publishQueued = false;

  function encodeBase64Utf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  async function publishSiteData(isAutomatic = false) {
    const token = (ghTokenInput && ghTokenInput.value.trim()) || getStoredToken();
    if (!token) {
      setPublishStatus('Enter a GitHub fine-grained token with Contents read/write access.', 'error');
      if (ghTokenInput) ghTokenInput.focus();
      return;
    }

    // The token remains only in this tab and disappears when the tab is closed.
    sessionStorage.setItem('ts_gh_token', token);

    if (publishInFlight) {
      publishQueued = true;
      return;
    }

    publishInFlight = true;
    if (publishBtn) publishBtn.disabled = true;
    setPublishStatus(isAutomatic ? 'Saving latest change to GitHub…' : 'Publishing to GitHub…', 'pending');

    try {
      const apiUrl = `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE_PATH}`;
      const headers = {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      };

      const currentResponse = await fetch(`${apiUrl}?ref=${encodeURIComponent(GH_BRANCH)}&t=${Date.now()}`, {
        method: 'GET',
        headers,
        cache: 'no-store'
      });
      if (!currentResponse.ok) {
        throw new Error(currentResponse.status === 401 || currentResponse.status === 403
          ? 'GitHub rejected the token. Check repository access and Contents read/write permission.'
          : `Could not read the current GitHub file (HTTP ${currentResponse.status}).`);
      }

      const currentFile = await currentResponse.json();
      const updateResponse = await fetch(apiUrl, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'content: publish admin updates',
          content: encodeBase64Utf8(buildDataJs()),
          sha: currentFile.sha,
          branch: GH_BRANCH
        })
      });

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.json().catch(() => ({}));
        throw new Error(errorBody.message || `GitHub update failed (HTTP ${updateResponse.status}).`);
      }

      // The GitHub copy is now authoritative. Remove stale browser caches so
      // deleted items cannot reappear after a later visit.
      [STORAGE_KEY, OLD_WORK_KEY, OLD_MEMORIES_KEY, OLD_CREATIONS_KEY, OLD_POSTS_KEY]
        .forEach(key => localStorage.removeItem(key));

      setPublishStatus('✅ Published to GitHub. Mobile and other devices will update after GitHub Pages deploys.', 'success');
      if (modalSaveFeedback) {
        modalSaveFeedback.textContent = '✅ Published successfully. The live site is updating.';
        modalSaveFeedback.className = 'publish-status publish-success';
      }
    } catch (error) {
      console.error('GitHub publish failed:', error);
      setPublishStatus(`❌ ${error.message}`, 'error');
    } finally {
      publishInFlight = false;
      if (publishBtn) publishBtn.disabled = false;
      if (publishQueued) {
        publishQueued = false;
        publishSiteData(true);
      }
    }
  }

  if (publishBtn) {
    publishBtn.addEventListener('click', () => publishSiteData(false));
  }

  // ----------------------------------------------------------------
  // Manual backup export (Copy to Clipboard & Download data.js)
  // ----------------------------------------------------------------
  const downloadDataBtn = document.getElementById('downloadDataBtn');

  // 1. Copy Data to Clipboard
  if (copyDataBtn) {
    copyDataBtn.addEventListener('click', () => {
      const dataCode = buildDataJs();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(dataCode).then(() => {
          showCopySuccess();
        }).catch(() => fallbackCopy(dataCode));
      } else {
        fallbackCopy(dataCode);
      }
    });
  }

  function showCopySuccess() {
    if (copyStatus) {
      copyStatus.style.display = 'block';
      copyStatus.textContent = '✅ Copied to clipboard! Just paste it in the chat with your assistant to publish!';
      setTimeout(() => { if (copyStatus) copyStatus.style.display = 'none'; }, 6000);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCopySuccess();
    } catch (e) {
      alert('Could not copy automatically. Please open browser console.');
    }
    document.body.removeChild(ta);
  }

  // 2. Download data.js directly
  if (downloadDataBtn) {
    downloadDataBtn.addEventListener('click', () => {
      const dataCode = buildDataJs();
      const blob = new Blob([dataCode], { type: 'application/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.js';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Boot
  boot();
});

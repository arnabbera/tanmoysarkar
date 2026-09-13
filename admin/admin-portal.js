// admin/admin-portal.js
// Admin portal: login gate + GitHub API push to data.js so ALL devices stay in sync

document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_EMAILS  = ["beraarnab@gmail.com", "tanmoysarkarvlogs@gmail.com"];
  const SESSION_KEY   = "ts_admin_session";
  const GH_REPO       = "arnabbera/tanmoysarkar";          // GitHub repo
  const GH_FILE_PATH  = "assets/js/data.js";               // file to update
  const GH_BRANCH     = "main";

  // ----------------------------------------------------------------
  // In-memory content state
  // ----------------------------------------------------------------
  let siteData = { work: [], memories: [], creations: [] };
  let migratedFromLocalStorage = false;

  // Old localStorage keys from the previous system
  const OLD_WORK_KEY      = "ts_work_items_v2";
  const OLD_MEMORIES_KEY  = "ts_memories_items_v2";
  const OLD_CREATIONS_KEY = "ts_creations_items_v2";

  function loadSiteData() {
    // Step 1: Start with repo data.js as the base
    if (typeof SITE_DATA !== 'undefined') {
      siteData = JSON.parse(JSON.stringify(SITE_DATA));
    }

    // Step 2: Check if the OLD localStorage has user-edited data
    // If it does, prefer it — this recovers links that were saved before
    // the new system was deployed
    try {
      const lsWork      = localStorage.getItem(OLD_WORK_KEY);
      const lsMemories  = localStorage.getItem(OLD_MEMORIES_KEY);
      const lsCreations = localStorage.getItem(OLD_CREATIONS_KEY);

      const hasOldData = lsWork || lsMemories || lsCreations;

      if (hasOldData) {
        // Merge localStorage data — it takes priority over data.js defaults
        if (lsWork)      siteData.work      = JSON.parse(lsWork);
        if (lsMemories)  siteData.memories  = JSON.parse(lsMemories);
        if (lsCreations) siteData.creations = JSON.parse(lsCreations);
        migratedFromLocalStorage = true;
      }
    } catch (e) {
      console.warn('Could not read old localStorage data:', e);
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
  const activeAdminEmail   = document.getElementById('activeAdminEmail');

  const adminModal         = document.getElementById('adminModal');
  const closeAdminModal    = document.getElementById('closeAdminModal');
  const postEditorForm     = document.getElementById('postEditorForm');
  const targetSection      = document.getElementById('targetSection');
  const workFieldsGroup    = document.getElementById('workFieldsGroup');
  const memoriesFieldsGroup= document.getElementById('memoriesFieldsGroup');
  const creationsFieldsGroup=document.getElementById('creationsFieldsGroup');
  const adminPostsList     = document.getElementById('adminPostsList');
  const savePostBtn        = document.getElementById('savePostBtn');

  const workGrid           = document.getElementById('workGrid');
  const memoriesGrid       = document.getElementById('memoriesGrid');
  const creationsGrid      = document.getElementById('creationsGrid');
  const inlineAddBtns      = document.querySelectorAll('.admin-inline-add-btn');

  const mobileToggle       = document.getElementById('mobileToggle');
  const navTabs            = document.getElementById('navTabs');
  const navLinks           = document.querySelectorAll('.nav-tabs .tab');
  const sections           = document.querySelectorAll('.content-section, .hero');

  // GitHub token input (shown in modal footer)
  const ghTokenInput       = document.getElementById('ghTokenInput');
  const publishBtn         = document.getElementById('publishBtn');
  const publishStatus      = document.getElementById('publishStatus');

  // ----------------------------------------------------------------
  // Utility
  // ----------------------------------------------------------------
  function toEmbedUrl(url) {
    if (!url) return '';
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
  }

  // ----------------------------------------------------------------
  // Session
  // ----------------------------------------------------------------
  function isLoggedIn() {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s && ADMIN_EMAILS.includes(s);
  }
  function getSessionEmail() {
    return sessionStorage.getItem(SESSION_KEY) || '';
  }
  function getStoredToken() {
    return sessionStorage.getItem('ts_gh_token') || '';
  }

  // ----------------------------------------------------------------
  // Boot
  // ----------------------------------------------------------------
  function boot() {
    loadSiteData();
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
    if (ghTokenInput && getStoredToken()) ghTokenInput.value = getStoredToken();
    renderAllSections();
    initNavigation();

    // If we found old localStorage data, alert the admin to publish it now
    if (migratedFromLocalStorage) {
      // Open the editor modal straight to the publish panel
      if (adminModal) adminModal.classList.add('active');
      setPublishStatus(
        '🔴 Your previously saved links have been recovered from this browser! ' +
        'Click "Publish to All Devices" below to save them permanently to GitHub ' +
        'so they appear on all devices (mobile, laptop, etc.).',
        'warn'
      );
      // Scroll publish panel into view after a short delay
      setTimeout(() => {
        const panel = document.querySelector('.publish-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  }

  // ----------------------------------------------------------------
  // Login
  // ----------------------------------------------------------------
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginEmailEl.value.trim().toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        sessionStorage.setItem(SESSION_KEY, email);
        loginMsg.textContent = '';
        showPortal(email);
      } else {
        loginMsg.textContent = 'Unauthorized email. Please use a registered admin account.';
      }
    });
  }

  // ----------------------------------------------------------------
  // Logout
  // ----------------------------------------------------------------
  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    showGate();
    if (adminModal) adminModal.classList.remove('active');
  }
  if (adminBarLogoutBtn) adminBarLogoutBtn.addEventListener('click', handleLogout);

  // ----------------------------------------------------------------
  // Navigation (same behaviour as main site)
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
  // GitHub API — push updated data.js to repo
  // ----------------------------------------------------------------
  async function pushDataToGitHub(token) {
    const dataJsContent = buildDataJs();
    const encoded = btoa(unescape(encodeURIComponent(dataJsContent)));

    setPublishStatus('⏳ Connecting to GitHub…', 'info');

    // Step 1: Get current file SHA (needed for update)
    const getUrl = `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE_PATH}?ref=${GH_BRANCH}`;
    let sha = '';
    try {
      const getRes = await fetch(getUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      } else if (getRes.status === 401) {
        setPublishStatus('❌ Invalid GitHub token. Please check and try again.', 'error');
        return false;
      }
    } catch (err) {
      setPublishStatus('❌ Network error. Check your connection.', 'error');
      return false;
    }

    // Step 2: PUT updated content
    setPublishStatus('⏳ Publishing changes…', 'info');
    const putUrl = `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE_PATH}`;
    const body = {
      message: `content: update site data via admin portal`,
      content: encoded,
      branch: GH_BRANCH,
      ...(sha ? { sha } : {})
    };

    try {
      const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (putRes.ok) {
        setPublishStatus('✅ Published! All devices will show the update in ~1 minute.', 'success');
        // Save token for this session
        sessionStorage.setItem('ts_gh_token', token);
        // Clear old localStorage now that data is safely in GitHub
        localStorage.removeItem(OLD_WORK_KEY);
        localStorage.removeItem(OLD_MEMORIES_KEY);
        localStorage.removeItem(OLD_CREATIONS_KEY);
        migratedFromLocalStorage = false;
        return true;
      } else {
        const err = await putRes.json();
        setPublishStatus(`❌ GitHub error: ${err.message}`, 'error');
        return false;
      }
    } catch (err) {
      setPublishStatus('❌ Network error during publish.', 'error');
      return false;
    }
  }

  function buildDataJs() {
    const escape = (s) => String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
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

  // Publish button handler
  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      const token = ghTokenInput ? ghTokenInput.value.trim() : '';
      if (!token) {
        setPublishStatus('⚠️ Please enter your GitHub Personal Access Token first.', 'warn');
        return;
      }
      publishBtn.disabled = true;
      publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing…';
      await pushDataToGitHub(token);
      publishBtn.disabled = false;
      publishBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publish to All Devices';
    });
  }

  // ----------------------------------------------------------------
  // Admin Modal Controls
  // ----------------------------------------------------------------
  if (adminBarAddBtn) adminBarAddBtn.addEventListener('click', () => openAdminModal('work'));
  if (closeAdminModal) closeAdminModal.addEventListener('click', () => adminModal.classList.remove('active'));
  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) adminModal.classList.remove('active');
    });
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
    if (savePostBtn) savePostBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Save Item';
  }

  // ----------------------------------------------------------------
  // Save / Edit / Delete  (updates in-memory siteData — publish to sync)
  // ----------------------------------------------------------------
  if (postEditorForm) {
    postEditorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id  = document.getElementById('postId').value;
      const sec = targetSection.value;
      const title       = document.getElementById('postTitle').value.trim();
      const description = document.getElementById('postDescription').value.trim();

      if (sec === 'work') {
        const category = document.getElementById('workCategory').value.trim() || 'Video Reel';
        const rawYtUrl  = document.getElementById('workYtUrl').value.trim();
        const embedUrl  = toEmbedUrl(rawYtUrl);
        const item      = { id: id || ('work_' + Date.now()), section: 'work', title, category, description, embedUrl, rawYtUrl };
        upsert('work', item, id);

      } else if (sec === 'memories') {
        const tag         = document.getElementById('memoryTag').value.trim() || 'Moment';
        const rawMediaUrl = document.getElementById('memoryMediaUrl').value.trim() || '../assets/images/hero_banner.png';
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

      resetForm();
      renderAllSections();
      renderAdminPostsList();
      // Prompt admin to publish
      setPublishStatus('⚠️ Changes saved locally. Click "Publish to All Devices" to push to GitHub.', 'warn');
    });
  }

  function upsert(sec, newItem, existingId) {
    if (existingId) {
      const idx = siteData[sec].findIndex(i => i.id === existingId);
      if (idx !== -1) siteData[sec][idx] = newItem;
      else siteData[sec].unshift(newItem);
    } else {
      siteData[sec].unshift(newItem);
    }
  }

  function deleteItem(sec, id) {
    if (!confirm('Delete this item permanently?')) return;
    siteData[sec] = siteData[sec].filter(i => i.id !== id);
    renderAllSections();
    renderAdminPostsList();
    setPublishStatus('⚠️ Item deleted locally. Click "Publish to All Devices" to push to GitHub.', 'warn');
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
  // Render Admin Posts List (inside modal)
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
          <button class="btn btn-small btn-secondary edit-item-btn" data-sec="${item.section}" data-id="${item.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-small btn-secondary delete-item-btn" data-sec="${item.section}" data-id="${item.id}" style="color:#ff6b6b;"><i class="fa-solid fa-trash"></i></button>
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
  // Render all sections with admin edit overlays
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
        ? `<div class="video-container"><iframe src="${item.embedUrl}" title="${item.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        : `<div class="video-placeholder"><i class="fa-brands fa-youtube"></i><span>Video coming soon</span></div>`;
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
        ? `<div class="video-container"><iframe src="${item.mediaUrl}" title="${item.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        : `<div class="memory-image" style="background-image:url('${item.mediaUrl || '../assets/images/hero_banner.png'}');"><div class="memory-tag"><i class="fa-solid fa-star"></i> ${item.tag || 'Memory'}</div></div>`;
      card.innerHTML = `
        <div class="card-admin-toolbar">
          <button class="card-admin-btn edit-btn" data-sec="memories" data-id="${item.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="card-admin-btn delete-btn" data-sec="memories" data-id="${item.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
        ${mediaContent}
        <div class="card-body"><h3>${item.title}</h3><p>${item.description}</p></div>`;
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
      if (item.iconStyle === 'food')  { iconClass = 'fa-solid fa-bowl-food icon-food'; }
      if (item.iconStyle === 'blog')  { iconClass = 'fa-solid fa-blog icon-blog'; btnIcon = 'fa-solid fa-arrow-up-right-from-square'; btnLabel = 'Read Blog'; }
      if (item.iconStyle === 'web')   { iconClass = 'fa-solid fa-globe icon-web'; btnIcon = 'fa-solid fa-globe'; btnLabel = 'Open Webpage'; }
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

  // Boot
  boot();
});

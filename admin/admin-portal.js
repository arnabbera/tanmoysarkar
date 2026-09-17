// Firebase-backed admin portal for the Tanmoy Sarkar portfolio.
document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_EMAIL = 'beraarnab@gmail.com';
  const STORAGE_KEY = 'ts_site_data';
  const { auth, contentRef } = window.TS_FIREBASE;

  let siteData = (typeof SITE_DATA !== 'undefined' && SITE_DATA)
    ? JSON.parse(JSON.stringify(SITE_DATA))
    : { work: [], memories: [], creations: [] };

  const $ = id => document.getElementById(id);
  const loginGate = $('loginGate');
  const adminPortal = $('adminPortal');
  const loginForm = $('loginForm');
  const loginMsg = $('loginMsg');
  const adminModal = $('adminModal');
  const postEditorForm = $('postEditorForm');
  const targetSection = $('targetSection');
  const modalSaveFeedback = $('modalSaveFeedback');
  const adminPostsList = $('adminPostsList');
  const workGrid = $('workGrid');
  const memoriesGrid = $('memoriesGrid');
  const creationsGrid = $('creationsGrid');

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  const safeUrl = value => {
    try {
      const url = new URL(String(value || ''), window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
    } catch {
      return '#';
    }
  };

  function toEmbedUrl(url) {
    const clean = String(url || '').trim();
    const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/|(?:.*?[?&]v=)))([\w-]{11})/i);
    return match ? `https://www.youtube.com/embed/${match[1]}` : clean;
  }

  function normalizeData(data) {
    return {
      work: Array.isArray(data?.work) ? data.work : [],
      memories: Array.isArray(data?.memories) ? data.memories : [],
      creations: Array.isArray(data?.creations) ? data.creations : []
    };
  }

  async function loadSiteData() {
    try {
      const snapshot = await contentRef.get();
      if (snapshot.exists) {
        siteData = normalizeData(snapshot.data());
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
    } catch (error) {
      console.warn('Could not load Firestore content:', error);
    }

    try {
      const draft = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (draft) siteData = normalizeData(draft);
    } catch (error) {
      console.warn('Could not load local draft:', error);
    }
  }

  async function persistSiteData(message = 'Saved automatically') {
    const user = auth.currentUser;
    if (!user || String(user.email).toLowerCase() !== ADMIN_EMAIL) {
      throw new Error('Only beraarnab@gmail.com can update this website.');
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
    await contentRef.set({
      ...normalizeData(siteData),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: user.email
    });
    localStorage.removeItem(STORAGE_KEY);

    if (modalSaveFeedback) {
      modalSaveFeedback.textContent = `✅ ${message}. Mobile and desktop are updated automatically.`;
      modalSaveFeedback.className = 'publish-status publish-success';
    }
  }

  function showGate(message = '') {
    loginGate.style.display = 'flex';
    adminPortal.classList.add('hidden');
    if (loginMsg) loginMsg.textContent = message;
  }

  async function showPortal(user) {
    loginGate.style.display = 'none';
    adminPortal.classList.remove('hidden');
    $('adminBarEmail').textContent = user.email;
    $('activeAdminEmail').textContent = user.email;
    await loadSiteData();
    renderAllSections();
    initNavigation();
  }

  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    loginMsg.textContent = 'Opening Google sign-in…';
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: ADMIN_EMAIL });
      const result = await auth.signInWithPopup(provider);
      if (String(result.user?.email).toLowerCase() !== ADMIN_EMAIL) {
        await auth.signOut();
        throw new Error('Please sign in only with beraarnab@gmail.com.');
      }
    } catch (error) {
      loginMsg.textContent = error.message || 'Google sign-in failed.';
    }
  });

  $('adminBarLogoutBtn')?.addEventListener('click', () => auth.signOut());

  auth.onAuthStateChanged(user => {
    if (user && String(user.email).toLowerCase() === ADMIN_EMAIL && user.emailVerified) {
      showPortal(user);
    } else {
      if (user) auth.signOut();
      showGate(user ? 'This Google account is not authorized.' : '');
    }
  });

  function initNavigation() {
    const mobileToggle = $('mobileToggle');
    const navTabs = $('navTabs');
    if (mobileToggle && !mobileToggle.dataset.bound) {
      mobileToggle.dataset.bound = 'true';
      mobileToggle.addEventListener('click', () => navTabs?.classList.toggle('open'));
    }
  }

  function switchSectionFields(section) {
    $('workFieldsGroup')?.classList.toggle('hidden', section !== 'work');
    $('memoriesFieldsGroup')?.classList.toggle('hidden', section !== 'memories');
    $('creationsFieldsGroup')?.classList.toggle('hidden', section !== 'creations');
  }

  function resetForm() {
    postEditorForm?.reset();
    $('postId').value = '';
    $('savePostBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Save Item';
    targetSection.value = 'work';
    switchSectionFields('work');
  }

  function openEditor(section = 'work', id = '') {
    adminModal.classList.add('active');
    targetSection.value = section;
    switchSectionFields(section);
    if (id) populateEditForm(section, id);
    else resetForm();
    renderAdminPostsList();
  }

  $('adminBarAddBtn')?.addEventListener('click', () => openEditor('work'));
  $('closeAdminModal')?.addEventListener('click', () => adminModal.classList.remove('active'));
  targetSection?.addEventListener('change', event => switchSectionFields(event.target.value));
  document.querySelectorAll('.admin-inline-add-btn').forEach(button => {
    button.addEventListener('click', () => openEditor(button.dataset.section));
  });

  postEditorForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const section = targetSection.value;
    const existingId = $('postId').value;
    const title = $('postTitle').value.trim();
    const description = $('postDescription').value.trim();
    let item;

    if (section === 'work') {
      const rawYtUrl = $('workYtUrl').value.trim();
      item = {
        id: existingId || `work_${Date.now()}`, section, title, description,
        category: $('workCategory').value.trim() || 'Video Reel',
        rawYtUrl, embedUrl: toEmbedUrl(rawYtUrl)
      };
    } else if (section === 'memories') {
      const rawMediaUrl = $('memoryMediaUrl').value.trim() || 'assets/images/hero_banner.png';
      const isVideo = /youtube\.com|youtu\.be/.test(rawMediaUrl);
      item = {
        id: existingId || `mem_${Date.now()}`, section, title, description,
        tag: $('memoryTag').value.trim() || 'Memory',
        mediaUrl: isVideo ? toEmbedUrl(rawMediaUrl) : rawMediaUrl,
        isVideo
      };
    } else {
      item = {
        id: existingId || `creation_${Date.now()}`, section, title, description,
        handle: $('creationHandle').value.trim() || '@channel',
        url: $('creationUrl').value.trim() || '#',
        iconStyle: $('creationIconStyle').value
      };
    }

    const list = siteData[section] || [];
    const index = list.findIndex(entry => entry.id === existingId);
    if (index >= 0) list[index] = item;
    else list.unshift(item);
    siteData[section] = list;

    $('savePostBtn').disabled = true;
    try {
      await persistSiteData(existingId ? 'Item updated' : 'Item added');
      resetForm();
      renderAllSections();
      renderAdminPostsList();
    } catch (error) {
      modalSaveFeedback.textContent = `❌ ${error.message}`;
      modalSaveFeedback.className = 'publish-status publish-error';
    } finally {
      $('savePostBtn').disabled = false;
    }
  });

  async function deleteItem(section, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const previous = [...(siteData[section] || [])];
    siteData[section] = previous.filter(item => item.id !== id);
    renderAllSections();
    renderAdminPostsList();
    try {
      await persistSiteData('Item deleted');
    } catch (error) {
      siteData[section] = previous;
      renderAllSections();
      renderAdminPostsList();
      alert(error.message);
    }
  }

  function populateEditForm(section, id) {
    const item = (siteData[section] || []).find(entry => entry.id === id);
    if (!item) return;
    $('postId').value = item.id;
    $('postTitle').value = item.title || '';
    $('postDescription').value = item.description || '';
    $('savePostBtn').innerHTML = '<i class="fa-solid fa-check"></i> Update Item';
    if (section === 'work') {
      $('workCategory').value = item.category || '';
      $('workYtUrl').value = item.rawYtUrl || item.embedUrl || '';
    } else if (section === 'memories') {
      $('memoryTag').value = item.tag || '';
      $('memoryMediaUrl').value = item.mediaUrl || '';
    } else {
      $('creationHandle').value = item.handle || '';
      $('creationUrl').value = item.url || '';
      $('creationIconStyle').value = item.iconStyle || 'youtube';
    }
  }

  function actionButtons(section, id) {
    return `<div class="card-admin-toolbar">
      <button class="card-admin-btn edit-btn" data-sec="${escapeHtml(section)}" data-id="${escapeHtml(id)}" title="Edit"><i class="fa-solid fa-pen"></i></button>
      <button class="card-admin-btn delete-btn" data-sec="${escapeHtml(section)}" data-id="${escapeHtml(id)}" title="Delete"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  }

  function renderWorkSection() {
    workGrid.innerHTML = '';
    siteData.work.forEach(item => {
      const card = document.createElement('div');
      card.className = 'work-card glass-card';
      const video = item.embedUrl
        ? `<div class="video-container"><iframe src="${safeUrl(item.embedUrl)}" title="${escapeHtml(item.title)}" frameborder="0" allowfullscreen></iframe></div>`
        : '<div class="video-placeholder"><i class="fa-brands fa-youtube"></i><span>Video coming soon</span></div>';
      card.innerHTML = `${actionButtons('work', item.id)}${video}<div class="card-body">
        <span class="category-badge">${escapeHtml(item.category || 'Assignment')}</span>
        <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div>`;
      workGrid.appendChild(card);
    });
  }

  function renderMemoriesSection() {
    memoriesGrid.innerHTML = '';
    siteData.memories.forEach(item => {
      const card = document.createElement('div');
      card.className = 'memory-card glass-card';
      const media = item.isVideo
        ? `<div class="video-container"><iframe src="${safeUrl(item.mediaUrl)}" title="${escapeHtml(item.title)}" frameborder="0" allowfullscreen></iframe></div>`
        : `<div class="memory-image" style="background-image:url('${safeUrl(item.mediaUrl || '../assets/images/hero_banner.png')}')"><div class="memory-tag">${escapeHtml(item.tag || 'Memory')}</div></div>`;
      card.innerHTML = `${actionButtons('memories', item.id)}${media}<div class="card-body"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div>`;
      memoriesGrid.appendChild(card);
    });
  }

  function renderCreationsSection() {
    creationsGrid.innerHTML = '';
    siteData.creations.forEach(item => {
      const card = document.createElement('div');
      card.className = 'creation-card glass-card';
      const icons = {
        youtube: ['fa-brands fa-youtube icon-youtube', 'Visit Channel'],
        food: ['fa-solid fa-bowl-food icon-food', 'Visit Channel'],
        blog: ['fa-solid fa-blog icon-blog', 'Read Blog'],
        web: ['fa-solid fa-globe icon-web', 'Open Webpage']
      };
      const [icon, label] = icons[item.iconStyle] || icons.youtube;
      card.innerHTML = `${actionButtons('creations', item.id)}<div class="channel-icon"><i class="${icon}"></i></div>
        <div class="card-body"><h3>${escapeHtml(item.title)}</h3><p class="channel-handle">${escapeHtml(item.handle)}</p>
        <p>${escapeHtml(item.description)}</p><a href="${safeUrl(item.url)}" target="_blank" rel="noopener" class="btn btn-outline">${label}</a></div>`;
      creationsGrid.appendChild(card);
    });
  }

  function bindCardActions() {
    document.querySelectorAll('.card-admin-btn.edit-btn').forEach(button => {
      button.addEventListener('click', () => openEditor(button.dataset.sec, button.dataset.id));
    });
    document.querySelectorAll('.card-admin-btn.delete-btn').forEach(button => {
      button.addEventListener('click', () => deleteItem(button.dataset.sec, button.dataset.id));
    });
  }

  function renderAdminPostsList() {
    const all = [...siteData.work, ...siteData.memories, ...siteData.creations];
    adminPostsList.innerHTML = all.length ? '' : '<p>No items yet.</p>';
    all.forEach(item => {
      const row = document.createElement('div');
      row.className = 'admin-post-item';
      row.innerHTML = `<div><small>[${escapeHtml(item.section)}]</small> <strong>${escapeHtml(item.title)}</strong></div>
        <div class="post-action-btns"><button class="btn btn-small btn-secondary edit-item-btn" data-sec="${escapeHtml(item.section)}" data-id="${escapeHtml(item.id)}">Edit</button>
        <button class="btn btn-small btn-secondary delete-item-btn" data-sec="${escapeHtml(item.section)}" data-id="${escapeHtml(item.id)}">Delete</button></div>`;
      adminPostsList.appendChild(row);
    });
    adminPostsList.querySelectorAll('.edit-item-btn').forEach(button => button.addEventListener('click', () => {
      targetSection.value = button.dataset.sec;
      switchSectionFields(button.dataset.sec);
      populateEditForm(button.dataset.sec, button.dataset.id);
    }));
    adminPostsList.querySelectorAll('.delete-item-btn').forEach(button => button.addEventListener('click', () => deleteItem(button.dataset.sec, button.dataset.id)));
  }

  function renderAllSections() {
    renderWorkSection();
    renderMemoriesSection();
    renderCreationsSection();
    bindCardActions();
  }
});

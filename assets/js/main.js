// assets/js/main.js - Interactive Navigation & Admin Post Portal

document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_EMAILS = ["berarnab@gmail.com", "tanmoysarkarvlogs@gmail.com"];
  const SESSION_KEY = "ts_admin_session";
  const POSTS_KEY = "ts_admin_posts";

  // Elements
  const mobileToggle = document.getElementById('mobileToggle');
  const navTabs = document.getElementById('navTabs');
  const navLinks = document.querySelectorAll('.nav-tabs .tab');
  const sections = document.querySelectorAll('.content-section, .hero');

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
  const postEditorForm = document.getElementById('postEditorForm');
  const adminPostsList = document.getElementById('adminPostsList');
  const adminPostsContainer = document.getElementById('adminPostsContainer');

  /* =========================================================
     1. Mobile Navigation Toggle & Smooth Scroll Active Tabs
     ========================================================= */
  if (mobileToggle && navTabs) {
    mobileToggle.addEventListener('click', () => {
      navTabs.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      if (navTabs.classList.contains('open')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });
  }

  // Close mobile drawer when clicking a nav link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navTabs.classList.contains('open')) {
        navTabs.classList.remove('open');
        if (mobileToggle) mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
      }
    });
  });

  // Active Tab Highlight on Scroll
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
     2. Admin Modal Toggle & Authentication Logic
     ========================================================= */
  if (adminModalBtn && adminModal && closeAdminModal) {
    adminModalBtn.addEventListener('click', () => {
      adminModal.classList.add('active');
      checkAdminSession();
    });

    closeAdminModal.addEventListener('click', () => {
      adminModal.classList.remove('active');
    });

    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) {
        adminModal.classList.remove('active');
      }
    });
  }

  function checkAdminSession() {
    const savedSession = sessionStorage.getItem(SESSION_KEY);
    if (savedSession && ADMIN_EMAILS.includes(savedSession)) {
      showDashboard(savedSession);
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
    if (activeAdminEmail) activeAdminEmail.textContent = `Logged in: ${email}`;
    renderAdminPosts();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginEmail.value.trim().toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        sessionStorage.setItem(SESSION_KEY, email);
        showDashboard(email);
      } else {
        loginMsg.textContent = "Unauthorized email. Only specified admin accounts can log in.";
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      showLoginView();
    });
  }

  /* =========================================================
     3. Admin Post CRUD Operations (LocalStorage)
     ========================================================= */
  function getPosts() {
    try {
      const data = localStorage.getItem(POSTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function savePosts(posts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    renderMainPagePosts();
    renderAdminPosts();
  }

  function toEmbedUrl(url) {
    if (!url) return '';
    // Extract video ID from youtube.com/watch?v=ID, youtu.be/ID, or youtube.com/embed/ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  }

  if (postEditorForm) {
    postEditorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const postId = document.getElementById('postId').value;
      const title = document.getElementById('postTitle').value.trim();
      const description = document.getElementById('postDescription').value.trim();
      const keywords = document.getElementById('postKeywords').value.trim();
      const ytUrl = document.getElementById('postYtUrl').value.trim();
      const embedUrl = toEmbedUrl(ytUrl);

      let posts = getPosts();

      if (postId) {
        // Edit existing post
        const index = posts.findIndex(p => p.id === postId);
        if (index !== -1) {
          posts[index] = { id: postId, title, description, keywords, embedUrl, rawYtUrl: ytUrl, updatedAt: new Date().toLocaleDateString() };
        }
      } else {
        // Create new post
        const newPost = {
          id: 'post_' + Date.now(),
          title,
          description,
          keywords,
          embedUrl,
          rawYtUrl: ytUrl,
          createdAt: new Date().toLocaleDateString()
        };
        posts.unshift(newPost);
      }

      savePosts(posts);
      postEditorForm.reset();
      document.getElementById('postId').value = '';
      document.getElementById('savePostBtn').innerHTML = '<i class="fa-solid fa-plus"></i> Publish Post';
    });
  }

  function renderAdminPosts() {
    if (!adminPostsList) return;
    const posts = getPosts();
    adminPostsList.innerHTML = '';

    if (posts.length === 0) {
      adminPostsList.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No custom posts published yet.</p>';
      return;
    }

    posts.forEach(post => {
      const item = document.createElement('div');
      item.className = 'admin-post-item';
      item.innerHTML = `
        <div>
          <strong>${post.title}</strong>
          <div style="font-size:0.75rem;color:var(--text-muted);">${post.createdAt || ''}</div>
        </div>
        <div class="post-action-btns">
          <button class="btn btn-small btn-secondary edit-post-btn" data-id="${post.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-small btn-secondary delete-post-btn" data-id="${post.id}" style="color:#ff6b6b;"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      adminPostsList.appendChild(item);
    });

    // Attach Edit & Delete Listeners
    adminPostsList.querySelectorAll('.edit-post-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        editPost(id);
      });
    });

    adminPostsList.querySelectorAll('.delete-post-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deletePost(id);
      });
    });
  }

  function editPost(id) {
    const posts = getPosts();
    const post = posts.find(p => p.id === id);
    if (!post) return;

    document.getElementById('postId').value = post.id;
    document.getElementById('postTitle').value = post.title;
    document.getElementById('postDescription').value = post.description;
    document.getElementById('postKeywords').value = post.keywords || '';
    document.getElementById('postYtUrl').value = post.rawYtUrl || post.embedUrl;
    document.getElementById('savePostBtn').innerHTML = '<i class="fa-solid fa-check"></i> Update Post';
  }

  function deletePost(id) {
    if (confirm("Are you sure you want to delete this post?")) {
      let posts = getPosts();
      posts = posts.filter(p => p.id !== id);
      savePosts(posts);
    }
  }

  /* =========================================================
     4. Render Admin Posts on Main Page (My Work Section)
     ========================================================= */
  function renderMainPagePosts() {
    if (!adminPostsContainer) return;
    const posts = getPosts();
    adminPostsContainer.innerHTML = '';

    if (posts.length === 0) return;

    posts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'work-card glass-card';
      card.innerHTML = `
        <div class="video-container">
          <iframe src="${post.embedUrl}" title="${post.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        <div class="card-body">
          <span class="category-badge">${post.keywords ? post.keywords.split(',')[0] : 'Featured Assignment'}</span>
          <h3>${post.title}</h3>
          <p>${post.description}</p>
        </div>
      `;
      adminPostsContainer.appendChild(card);
    });
  }

  // Initial Call to Render Admin Posts on Page Load
  renderMainPagePosts();
});

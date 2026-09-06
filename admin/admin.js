// assets/js/admin.js
// Handles admin login, session, and post CRUD using localStorage

(function () {
  const ADMIN_EMAILS = ["berarnab@gmail.com", "tanmoysarkarvlogs@gmail.com"];
  const SESSION_KEY = "adminSession"; // stores logged‑in email
  const POSTS_KEY = "adminPosts"; // JSON array of post objects

  // Utility: get posts array from localStorage
  function getPosts() {
    const json = localStorage.getItem(POSTS_KEY);
    return json ? JSON.parse(json) : [];
  }

  function savePosts(posts) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }

  // ---------- Login Page Logic ----------
  if (document.getElementById("loginBtn")) {
    const emailInput = document.getElementById("adminEmail");
    const msg = document.getElementById("msg");
    document.getElementById("loginBtn").addEventListener("click", () => {
      const email = emailInput.value.trim().toLowerCase();
      if (ADMIN_EMAILS.includes(email)) {
        sessionStorage.setItem(SESSION_KEY, email);
        // redirect to dashboard (same folder)
        window.location.href = "dashboard.html";
      } else {
        msg.textContent = "Invalid admin email.";
      }
    });
    return; // stop further execution on login page
  }

  // ---------- Dashboard Page Logic ----------
  // Verify session
  const sessionEmail = sessionStorage.getItem(SESSION_KEY);
  if (!sessionEmail) {
    // No session – redirect to login
    window.location.href = "login.html";
    return;
  }

  // Elements
  const postForm = document.getElementById("postForm");
  const postsList = document.getElementById("postsList");

  // Render existing posts
  function renderPosts() {
    const posts = getPosts();
    postsList.innerHTML = "";
    if (posts.length === 0) {
      postsList.innerHTML = "<p>No posts yet.</p>";
      return;
    }
    posts.forEach(post => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <iframe data-src="${post.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        <div class="card-content">
          <h3>${post.title}</h3>
          <p>${post.description}</p>
          <p style="font-size:0.8rem;color:#a0a4b8;">Keywords: ${post.keywords}</p>
          <button data-id="${post.id}" class="editBtn" style="margin-right:0.5rem;">Edit</button>
          <button data-id="${post.id}" class="delBtn" style="background:#ff6b6b;color:#fff;">Delete</button>
        </div>
      `;
      postsList.appendChild(card);
    });
    // Attach handlers
    document.querySelectorAll(".editBtn").forEach(btn => {
      btn.addEventListener("click", e => editPost(e.target.dataset.id));
    });
    document.querySelectorAll(".delBtn").forEach(btn => {
      btn.addEventListener("click", e => deletePost(e.target.dataset.id));
    });
  }

  // Convert YouTube URL to embed URL
  function toEmbedUrl(url) {
    const reg = /(?:youtube\.com\/watch\?v=|youtu.be\/)([\w-]{11})/;
    const match = url.match(reg);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  // Form submit – create or update
  let editingId = null;
  postForm.addEventListener("submit", e => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const keywords = document.getElementById("keywords").value.trim();
    const ytUrl = document.getElementById("ytUrl").value.trim();
    const embedUrl = toEmbedUrl(ytUrl);

    const posts = getPosts();
    if (editingId) {
      // update existing
      const idx = posts.findIndex(p => p.id === editingId);
      if (idx !== -1) {
        posts[idx] = { id: editingId, title, description, keywords, embedUrl };
      }
      editingId = null;
    } else {
      // create new
      const id = Date.now().toString();
      posts.push({ id, title, description, keywords, embedUrl });
    }
    savePosts(posts);
    postForm.reset();
    renderPosts();
  });

  function editPost(id) {
    const posts = getPosts();
    const post = posts.find(p => p.id === id);
    if (!post) return;
    editingId = id;
    document.getElementById("title").value = post.title;
    document.getElementById("description").value = post.description;
    document.getElementById("keywords").value = post.keywords;
    // Convert embed back to regular YouTube URL for editing convenience
    const ytId = post.embedUrl.split('/embed/')[1];
    document.getElementById("ytUrl").value = `https://www.youtube.com/watch?v=${ytId}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deletePost(id) {
    let posts = getPosts();
    posts = posts.filter(p => p.id !== id);
    savePosts(posts);
    renderPosts();
  }

  // Initial render
  renderPosts();
})();

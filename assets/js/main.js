// assets/js/main.js
// Simple SPA navigation for the portfolio site

document.addEventListener('DOMContentLoaded', () => {
  const contentDiv = document.getElementById('content');
  const tabs = document.querySelectorAll('.nav-tabs .tab');

  // Load default section (About) on first load
  loadSection('about.html');

  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const target = tab.getAttribute('href').substring(1); // e.g., "about"
      // Update active class
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Load corresponding HTML file
      loadSection(`${target}.html`);
    });
  });
});

function loadSection(file) {
  fetch(file)
    .then(res => {
      if (!res.ok) throw new Error('Failed to load');
      return res.text();
    })
    .then(html => {
      const contentDiv = document.getElementById('content');
      contentDiv.innerHTML = html;
      // After injecting, run any initializers (e.g., lazy YouTube embeds)
      initLazyYouTube();
    })
    .catch(err => {
      document.getElementById('content').innerHTML = `<p style='color:#ff6b6b;'>Error loading section.</p>`;
    });
}

// Lazy‑load YouTube iframes when they become visible
function initLazyYouTube() {
  const iframes = document.querySelectorAll('iframe[data-src]');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        iframe.src = iframe.dataset.src;
        obs.unobserve(iframe);
      }
    });
  }, {threshold: 0.25});
  iframes.forEach(i => observer.observe(i));
}

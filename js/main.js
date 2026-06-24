function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
  updateToggleIcon();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const isDark = current === 'dark' ||
    (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateToggleIcon();
}

function updateToggleIcon() {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  const theme = document.documentElement.getAttribute('data-theme');
  const isDark = theme === 'dark' ||
    (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  btn.textContent = isDark ? '☀️' : '🌙';
}

async function loadPostList() {
  const container = document.getElementById('posts');
  if (!container) return;

  try {
    const res = await fetch('posts/posts.json');
    const posts = await res.json();

    posts.sort((a, b) => b.date.localeCompare(a.date));

    container.innerHTML = posts.map(post => `
      <li class="post-item">
        <a href="post.html#${encodeURIComponent(post.file)}">
          <div class="post-title">${escapeHtml(post.title)}</div>
          <div class="post-date">${post.date}</div>
          <div class="post-summary">${escapeHtml(post.summary)}</div>
        </a>
      </li>
    `).join('');
  } catch {
    container.innerHTML = '<p class="loading">글을 불러올 수 없습니다.</p>';
  }
}

async function loadPost() {
  const container = document.getElementById('content');
  if (!container) return;

  const file = decodeURIComponent(window.location.hash.slice(1));

  if (!file) {
    container.innerHTML = '<p class="loading">글을 찾을 수 없습니다.</p>';
    return;
  }

  try {
    const [mdRes, metaRes] = await Promise.all([
      fetch(`posts/${file}`),
      fetch('posts/posts.json')
    ]);

    if (!mdRes.ok) throw new Error('Not found');

    const md = await mdRes.text();
    const posts = await metaRes.json();
    const meta = posts.find(p => p.file === file);

    const html = marked.parse(md);
    const titleMatch = md.match(/^#\s+(.+)$/m);
    const title = meta?.title || (titleMatch ? titleMatch[1] : file);

    document.title = `${title} — My Blog`;

    const dateHtml = meta?.date
      ? `<div class="article-date">${meta.date}</div>`
      : '';

    container.innerHTML = `
      ${dateHtml}
      <div class="markdown-body">${html}</div>
    `;
  } catch {
    container.innerHTML = '<p class="loading">글을 불러올 수 없습니다.</p>';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.querySelector('.theme-toggle')?.addEventListener('click', toggleTheme);
  loadPostList();
  loadPost();
});

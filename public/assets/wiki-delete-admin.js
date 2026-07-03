(() => {
  const root = document.querySelector('#wiki-delete-admin');
  if (!root) return;

  const API_BASE = 'https://tonys-alienware-1.tail85fe36.ts.net/wiki-admin-api';
  const status = root.querySelector('[data-status]');
  const list = root.querySelector('[data-list]');
  const filter = root.querySelector('[data-filter]');
  const locked = root.querySelector('[data-locked]');
  const tailnetOnly = root.querySelector('[data-tailnet-only]');
  let articles = [];

  function setStatus(text, bad = false) {
    status.textContent = text;
    status.style.color = bad ? '#ff6b6b' : '#16794c';
  }

  function setTailnetVisible(visible) {
    if (tailnetOnly) tailnetOnly.hidden = !visible;
    if (locked) locked.hidden = visible;
    document.documentElement.dataset.tailnet = visible ? 'true' : 'false';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function render() {
    const q = (filter?.value || '').toLowerCase().trim();
    const rows = articles.filter(a => !q || a.path.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q));
    list.innerHTML = rows.map(a => `
      <article class="admin-delete-row" style="border:1px solid var(--color-border, rgba(0,0,0,.18)); border-radius:16px; padding:1rem; margin:.75rem 0; background:var(--color-surface, rgba(255,255,255,.75));">
        <div style="display:flex; gap:1rem; justify-content:space-between; align-items:flex-start; flex-wrap:wrap;">
          <div style="min-width: 16rem; flex: 1;">
            <strong>${escapeHtml(a.title)}</strong><br>
            <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.url)}</a><br>
            <code>${escapeHtml(a.fullPath || a.path)}</code><br>
            <small>${escapeHtml(a.size)} bytes · ${escapeHtml(a.modified)}</small>
          </div>
          <button data-delete="${escapeHtml(a.path)}" style="background:#b42318;color:white;border:0;border-radius:999px;padding:.65rem 1rem;cursor:pointer;">Delete</button>
        </div>
      </article>`).join('') || '<p>No matching articles.</p>';
  }

  async function fetchWithTimeout(url, options = {}, ms = 3500) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function load() {
    setTailnetVisible(false);
    try {
      const health = await fetchWithTimeout(`${API_BASE}/health`, { cache: 'no-store' });
      if (!health.ok) throw new Error(`health returned ${health.status}`);
      const res = await fetchWithTimeout(`${API_BASE}/articles`, { cache: 'no-store' }, 5000);
      if (!res.ok) throw new Error(`article list returned ${res.status}`);
      const data = await res.json();
      articles = data.articles || [];
      setTailnetVisible(true);
      setStatus(`Tailnet verified. ${articles.length} articles found.`);
      render();
    } catch (err) {
      setTailnetVisible(false);
      setStatus(`Delete controls hidden. Connect this device to Tailscale and confirm weekly-wiki-admin.service + Tailscale Serve are running. ${err.message}`, true);
      if (list) list.innerHTML = '';
    }
  }

  filter?.addEventListener('input', render);
  list?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-delete]');
    if (!button) return;
    const path = button.getAttribute('data-delete');
    const phrase = `delete ${path}`;
    const typed = prompt(`Type exactly this to soft-delete and publish-delete the article:\n\n${phrase}`);
    if (typed !== phrase) return;
    button.disabled = true;
    button.textContent = 'Deleting + publishing…';
    try {
      const res = await fetchWithTimeout(`${API_BASE}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      }, 120000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.detail || data.message || `delete returned ${res.status}`);
      articles = articles.filter(a => a.path !== path);
      setStatus(`Deleted ${path}; pushed commit ${data.publish?.commit || 'unknown'}. Vercel will remove the page after redeploy.`);
      render();
    } catch (err) {
      setStatus(`Delete failed for ${path}: ${err.message}`, true);
      button.disabled = false;
      button.textContent = 'Delete';
    }
  });

  load();
})();

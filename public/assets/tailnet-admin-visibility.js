(() => {
  const apiBase = 'https://tonys-alienware-1.tail85fe36.ts.net/wiki-admin-api';

  async function isInsideTailnet() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${apiBase}/health`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  function addAdminLink() {
    const nav = document.querySelector('.site-nav');
    if (!nav || nav.querySelector('[data-tailnet-admin-link]')) return;
    const li = document.createElement('li');
    li.setAttribute('data-tailnet-admin-link', 'true');
    const a = document.createElement('a');
    a.href = '/admin/delete-articles/';
    a.textContent = 'Admin';
    a.className = 'no-print';
    li.appendChild(a);
    nav.appendChild(li);
  }

  isInsideTailnet().then((inside) => {
    document.documentElement.dataset.tailnet = inside ? 'true' : 'false';
    if (inside) addAdminLink();
  });
})();

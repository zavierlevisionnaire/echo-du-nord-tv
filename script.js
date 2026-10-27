const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('main-nav');
if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    menuToggle.textContent = isOpen ? '×' : '☰';
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
  }));
}
document.getElementById('year').textContent = new Date().getFullYear();

// Liens à personnaliser avant mise en ligne officielle.
const socialLinks = {
  facebook: 'https://www.facebook.com/',
  youtube: 'https://www.youtube.com/',
  whatsapp: 'https://wa.me/'
};
document.querySelectorAll('[data-social]').forEach(link => {
  const key = link.dataset.social;
  link.href = socialLinks[key] || '#';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
});

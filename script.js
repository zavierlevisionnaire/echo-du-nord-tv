(() => {
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
      menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
      menuToggle.textContent = '☰';
    }));
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Renseigner ici les véritables adresses officielles du média.
  const socialLinks = { facebook: '', youtube: '', whatsapp: '' };
  document.querySelectorAll('[data-social]').forEach(link => {
    const url = socialLinks[link.dataset.social];
    if (url) {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.href = '#contact';
      link.setAttribute('aria-label', 'Lien social à configurer');
      link.addEventListener('click', event => event.preventDefault());
    }
  });

  async function loadCmsArticles() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    try {
      const apiUrl = 'https://api.github.com/repos/zavierlevisionnaire/echo-du-nord-tv/contents/content/articles?ref=main';
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Articles indisponibles');
      const files = await response.json();
      const markdownFiles = files.filter(file => file.type === 'file' && file.name.toLowerCase().endsWith('.md'));

      const articles = await Promise.all(markdownFiles.map(async file => {
        const result = await fetch(file.download_url);
        if (!result.ok) return null;
        const markdown = await result.text();
        const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
        if (!match) return null;

        const fields = {};
        match[1].split(/\r?\n/).forEach(line => {
          const field = line.match(/^([^:]+):\s*(.*)$/);
          if (field) fields[field[1].trim().toLowerCase()] = field[2].trim().replace(/^["']|["']$/g, '');
        });

        const title = fields.title || fields.titre;
        if (!title) return null;
        const bodyText = markdown.slice(match[0].length).replace(/[#*_>]/g, '').replace(/\s+/g, ' ').trim();
        return {
          title,
          date: fields.date || '',
          category: fields.category || fields.categorie || fields['catégorie'] || 'Actualité',
          image: fields.image || '',
          summary: fields.excerpt || fields.extrait || fields.resume || bodyText.slice(0, 180) || 'Retrouvez cette actualité sur Écho du Nord TV.'
        };
      }));

      const validArticles = articles.filter(Boolean).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (!validArticles.length) return;
      grid.replaceChildren();

      validArticles.slice(0, 6).forEach((article, index) => {
        const card = document.createElement('article');
        card.className = 'news-card' + (index === 0 ? ' featured' : '');
        const picture = document.createElement('div');
        picture.className = 'news-image image-green';

        if (article.image) {
          const img = document.createElement('img');
          img.src = article.image;
          img.alt = article.title;
          img.loading = 'lazy';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          picture.appendChild(img);
        }

        const label = document.createElement('span');
        label.className = 'category';
        label.textContent = article.category.toUpperCase();
        picture.appendChild(label);
        const caption = document.createElement('span');
        caption.className = 'image-caption';
        caption.textContent = 'ÉCHO DU NORD TV';
        picture.appendChild(caption);

        const body = document.createElement('div');
        body.className = 'news-body';
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = [article.category, article.date].filter(Boolean).join(' • ');
        const heading = document.createElement('h3');
        heading.textContent = article.title;
        const excerpt = document.createElement('p');
        excerpt.textContent = article.summary;
        body.append(meta, heading, excerpt);
        card.append(picture, body);
        grid.appendChild(card);
      });

      const note = document.querySelector('.demo-note');
      if (note) note.hidden = true;
    } catch (error) {
      console.error('Écho du Nord TV — chargement des articles :', error);
    }
  }
  loadCmsArticles();
})();
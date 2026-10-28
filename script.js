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

  const socialLinks = {
    facebook: 'https://www.facebook.com/share/1C2ddVXJ9V/',
    youtube: '',
    whatsapp: 'https://wa.me/24174619127'
  };

  document.querySelectorAll('[data-social]').forEach(link => {
    const url = socialLinks[link.dataset.social];
    if (url) {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.href = '#contact';
      link.setAttribute('aria-label', 'Lien YouTube à configurer');
      link.addEventListener('click', event => event.preventDefault());
    }
  });

  function parseFrontMatter(markdown) {
    const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) return null;
    const fields = {};
    match[1].split(/\r?\n/).forEach(line => {
      const field = line.match(/^([\wÀ-ÿ-]+):\s*(.*)$/);
      if (!field) return;
      let value = field[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      fields[field[1].toLowerCase()] = value;
    });
    const body = markdown.slice(match[0].length).trim();
    const plainBody = body
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[>*_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return {
      title: fields.title || fields.titre || '',
      date: fields.date || '',
      category: fields.category || fields.categorie || fields['catégorie'] || 'Actualité',
      image: fields.image || '',
      active: fields.active || 'false',
      position: fields.position || 'accueil',
      url: fields.url || '',
      summary: fields.excerpt || fields.extrait || fields.resume || plainBody.slice(0, 220) || 'Retrouvez cette actualité sur Écho du Nord TV.',
      body: plainBody
    };
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  async function loadCmsArticles() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    try {
      const apiUrl = 'https://api.github.com/repos/zavierlevisionnaire/echo-du-nord-tv/contents/content/articles?ref=main';
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (!response.ok) throw new Error('GitHub API : ' + response.status);

      const files = await response.json();
      const markdownFiles = files.filter(file =>
        file.type === 'file' && file.name.toLowerCase().endsWith('.md')
      );

      const articles = (await Promise.all(markdownFiles.map(async file => {
        try {
          const result = await fetch(file.download_url, { cache: 'no-store' });
          if (!result.ok) return null;
          const parsed = parseFrontMatter(await result.text());
          return parsed && parsed.title ? parsed : null;
        } catch (error) {
          console.warn('Article non chargé :', file.name, error);
          return null;
        }
      }))).filter(Boolean);

      articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (!articles.length) {
        console.warn('Aucun article avec un front matter valide dans content/articles.');
        return;
      }

      grid.replaceChildren();
      const renderedCards = [];
      articles.slice(0, 30).forEach((article, index) => {
        const card = document.createElement('article');
        card.className = 'news-card' + (index === 0 ? ' featured' : '');

        const picture = document.createElement('div');
        picture.className = 'news-image image-green';

        if (article.image) {
          const img = document.createElement('img');
          const relativeImage = article.image.replace(/^\/+/, '');
          img.src = new URL(relativeImage, document.baseURI).href;
          img.alt = article.title;
          img.loading = 'lazy';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.onerror = () => { img.remove(); };
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
        meta.textContent = [article.category, formatDate(article.date)].filter(Boolean).join(' • ');

        const heading = document.createElement('h3');
        heading.textContent = article.title;

        const excerpt = document.createElement('p');
        excerpt.textContent = article.summary;

        body.append(meta, heading, excerpt);

        if (article.body) {
          const details = document.createElement('details');
          details.className = 'article-details';
          const summary = document.createElement('summary');
          summary.textContent = 'Lire l’article';
          const content = document.createElement('p');
          content.textContent = article.body;
          details.append(summary, content);
          body.appendChild(details);
        }

        card.append(picture, body);
        grid.appendChild(card);
        renderedCards.push({card, article});
      });

      const filters = document.getElementById('category-filters');
      const search = document.getElementById('article-search');
      const categories = [...new Set(articles.map(article => article.category).filter(Boolean))];
      let activeCategory = 'all';
      if (filters) {
        categories.forEach(category => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'filter-chip';
          button.dataset.filter = category;
          button.textContent = category;
          filters.appendChild(button);
        });
        filters.addEventListener('click', event => {
          const button = event.target.closest('button[data-filter]');
          if (!button) return;
          activeCategory = button.dataset.filter;
          filters.querySelectorAll('.filter-chip').forEach(item => item.classList.toggle('active', item === button));
          applyArticleFilters();
        });
      }
      function applyArticleFilters() {
        const term = (search?.value || '').trim().toLocaleLowerCase('fr');
        renderedCards.forEach(({card, article}) => {
          const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
          const searchable = [article.title, article.category, article.summary, article.body].join(' ').toLocaleLowerCase('fr');
          card.hidden = !matchesCategory || (term && !searchable.includes(term));
        });
      }
      if (search) search.addEventListener('input', applyArticleFilters);

      const note = document.querySelector('.demo-note');
      if (note) note.hidden = true;
    } catch (error) {
      console.error('Écho du Nord TV — chargement des articles :', error);
      const note = document.querySelector('.demo-note');
      if (note) {
        note.hidden = false;
        note.textContent = 'Les dernières actualités ne sont pas accessibles pour le moment. Consultez nos publications sur les réseaux sociaux.';
      }
    }
  }


  async function loadCmsAds() {
    const container = document.getElementById('ad-slots');
    if (!container) return;
    try {
      const response = await fetch('https://api.github.com/repos/zavierlevisionnaire/echo-du-nord-tv/contents/content/ads?ref=main', {cache:'no-store', headers:{Accept:'application/vnd.github+json'}});
      if (!response.ok) throw new Error('GitHub API : ' + response.status);
      const files = await response.json();
      const ads = (await Promise.all(files.filter(file => file.type === 'file' && file.name.toLowerCase().endsWith('.md')).map(async file => {
        try {
          const result = await fetch(file.download_url, {cache:'no-store'});
          if (!result.ok) return null;
          return parseFrontMatter(await result.text());
        } catch (error) { console.warn('Publicité non chargée :', file.name, error); return null; }
      }))).filter(ad => ad && ad.title && ['true','yes','oui'].includes(String(ad.active).toLowerCase()));
      if (!ads.length) return;
      container.replaceChildren();
      ads.forEach(ad => {
        const card = document.createElement(ad.url ? 'a' : 'div');
        card.className = 'ad-slot ad-live';
        if (ad.url) { card.href = ad.url; card.target = '_blank'; card.rel = 'noopener noreferrer'; }
        if (ad.image) {
          const img = document.createElement('img');
          img.src = new URL(ad.image.replace(/^\\/+/, ''), document.baseURI).href;
          img.alt = ad.title;
          img.loading = 'lazy';
          img.onerror = () => img.remove();
          card.appendChild(img);
        }
        const label = document.createElement('span');
        label.textContent = ({accueil:'BANNIÈRE PARTENAIRE',article:'PUBLICITÉ • PUBLIREPORTAGE',partenaire:'PARTENAIRE ÉCHO DU NORD'})[ad.position] || 'PARTENAIRE • CONTENU COMMERCIAL';
        const title = document.createElement('strong');
        title.textContent = ad.title;
        const description = document.createElement('small');
        description.textContent = ad.summary || 'Découvrez ce partenaire d’Écho du Nord TV.';
        card.append(label, title, description);
        container.appendChild(card);
      });
    } catch (error) { console.warn('Publicités CMS non chargées :', error); }
  }

  async function loadUrgentAlert() {
    try {
      const response = await fetch('https://api.github.com/repos/zavierlevisionnaire/echo-du-nord-tv/contents/content/urgent.json?ref=main', {cache:'no-store', headers:{Accept:'application/vnd.github+json'}});
      if (!response.ok) return;
      const file = await response.json();
      const config = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g, '')), character => character.charCodeAt(0))));
      if (!config.active || !config.message) return;
      const banner = document.getElementById('urgent-banner');
      const message = document.getElementById('urgent-message');
      const link = document.getElementById('urgent-link');
      if (!banner || !message) return;
      message.textContent = config.message;
      if (config.url) { link.href = config.url; link.hidden = false; }
      banner.hidden = false;
    } catch (error) { console.warn('Alerte urgente non chargée :', error); }
  }

  loadCmsArticles();
  loadUrgentAlert();
  loadCmsAds();
})();
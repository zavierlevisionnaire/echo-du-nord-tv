// Chargement public des contenus éditoriaux Écho du Nord TV depuis Supabase.
(() => {
  if (!window.supabase || !window.ECHO_SUPABASE_URL || !window.ECHO_SUPABASE_ANON_KEY) return;
  const client = window.supabase.createClient(window.ECHO_SUPABASE_URL, window.ECHO_SUPABASE_ANON_KEY);
  const dateLabel = value => value ? new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value)) : '';
  const node = (tag, cls, text) => { const el=document.createElement(tag); if(cls)el.className=cls; if(text!==undefined)el.textContent=text; return el; };
  async function articles(){
    const grid=document.getElementById('news-grid'); if(!grid)return;
    const {data,error}=await client.from('echo_articles').select('id,title,category,excerpt,body,cover_image,published_at,created_at').eq('status','published').order('published_at',{ascending:false}).limit(6);
    if(error){console.warn('Articles Écho Supabase:',error.message);return;}
    if(!data || !data.length)return; // Preserve legacy sample cards only until the first real publication.
    grid.replaceChildren();
    const categories=new Set();
    data.forEach((a,i)=>{
      categories.add(a.category);
      const card=node('article','news-card'+(i===0?' featured':''));
      const picture=node('div','news-image image-green');
      if(a.cover_image){const img=node('img');img.src=a.cover_image;img.alt=a.title;img.loading='lazy';img.onerror=()=>img.remove();picture.appendChild(img);}
      const tag=node('span','category',String(a.category||'Actualité').toUpperCase());picture.appendChild(tag);
      picture.appendChild(node('span','image-caption','ÉCHO DU NORD TV'));
      const body=node('div','news-body');body.appendChild(node('div','meta',[a.category,dateLabel(a.published_at||a.created_at)].filter(Boolean).join(' • ')));
      body.appendChild(node('h3','',a.title));if(a.excerpt)body.appendChild(node('p','',a.excerpt));
      const read=node('a','article-read',"Lire l’article →");read.href='article.html?id='+encodeURIComponent(a.id);read.style.cssText='display:inline-block;margin-top:10px;color:#087b38;font-size:12px;font-weight:800;text-decoration:none';body.appendChild(read);
      card.append(picture,body);grid.appendChild(card);
    });
    const filters=document.getElementById('category-filters');
    if(filters){filters.replaceChildren();const all=node('button','filter-chip active','Tout');all.type='button';all.dataset.filter='all';filters.appendChild(all);
      [...categories].forEach(c=>{const b=node('button','filter-chip',c);b.type='button';b.dataset.filter=c;filters.appendChild(b);});
      let selected='all';const search=document.getElementById('article-search');
      const apply=()=>{const term=(search?.value||'').toLocaleLowerCase('fr');grid.querySelectorAll('.news-card').forEach(card=>{const txt=card.textContent.toLocaleLowerCase('fr');card.hidden=(selected!=='all'&&!card.querySelector('.category')?.textContent.toLocaleLowerCase('fr').includes(selected.toLocaleLowerCase('fr')))||(term&&!txt.includes(term));});};
      filters.onclick=e=>{const b=e.target.closest('button[data-filter]');if(!b)return;selected=b.dataset.filter;filters.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));apply();};if(search)search.addEventListener('input',apply);
    }
    const note=document.querySelector('.demo-note');if(note)note.hidden=true;
  }
  async function urgent(){
    const {data,error}=await client.from('echo_settings').select('value').eq('key','urgent').maybeSingle();if(error||!data)return;
    const v=data.value||{};const banner=document.getElementById('urgent-banner');const message=document.getElementById('urgent-message');const link=document.getElementById('urgent-link');
    if(!banner||!message)return;if(!v.active||!v.message){banner.hidden=true;return;}
    message.textContent=v.message;if(v.url&&link){link.href=v.url;link.hidden=false;}else if(link)link.hidden=true;banner.hidden=false;
  }
  async function ads(){
    const container=document.getElementById('ad-slots');if(!container)return;
    const {data,error}=await client.from('echo_ads').select('title,description,image_url,target_url,position').eq('active',true).order('created_at',{ascending:false});
    if(error||!data?.length)return;container.replaceChildren();
    data.forEach(ad=>{const card=node(ad.target_url?'a':'div','ad-slot ad-live');if(ad.target_url){card.href=ad.target_url;card.target='_blank';card.rel='noopener noreferrer';}
      if(ad.image_url){const img=node('img');img.src=ad.image_url;img.alt=ad.title;img.loading='lazy';img.onerror=()=>img.remove();card.appendChild(img);}
      card.append(node('span','',({accueil:'BANNIÈRE PARTENAIRE',article:'PUBLICITÉ • PUBLIREPORTAGE',partenaire:'PARTENAIRE ÉCHO DU NORD'})[ad.position]||'PARTENAIRE • CONTENU COMMERCIAL'),node('strong','',ad.title),node('small','',ad.description||'Découvrez ce partenaire d’Écho du Nord TV.'));container.appendChild(card);
    });
  }
  articles();urgent();ads();
})();

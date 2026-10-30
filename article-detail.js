(() => {
  const title=document.getElementById('article-title'),meta=document.getElementById('article-meta'),main=document.getElementById('article-main');
  if(!window.supabase||!window.ECHO_SUPABASE_URL||!window.ECHO_SUPABASE_ANON_KEY){main.textContent='Le service des articles est momentanément indisponible.';return;}
  const id=new URLSearchParams(location.search).get('id');if(!id){title.textContent='Article introuvable';main.textContent='Aucun article n’a été sélectionné.';return;}
  const db=window.supabase.createClient(window.ECHO_SUPABASE_URL,window.ECHO_SUPABASE_ANON_KEY);
  const fmt=v=>v?new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(v)):'';
  async function load(){const {data,error}=await db.from('echo_articles').select('id,title,category,excerpt,body,cover_image,published_at,created_at').eq('id',id).eq('status','published').maybeSingle();if(error||!data){title.textContent='Article introuvable';main.textContent='Cet article n’est pas disponible ou n’est plus publié.';return;}
    title.textContent=data.title;document.title=data.title+' — Écho du Nord TV';meta.textContent=[data.category,fmt(data.published_at||data.created_at),'ÉCHO DU NORD TV'].filter(Boolean).join(' · ');main.replaceChildren();
    if(data.cover_image){const img=document.createElement('img');img.className='article-cover';img.src=data.cover_image;img.alt=data.title;main.append(img);}
    if(data.excerpt){const ex=document.createElement('p');ex.className='article-excerpt';ex.textContent=data.excerpt;main.append(ex);}
    const body=document.createElement('div');body.className='article-content';(data.body||data.excerpt||'').split(/\n{2,}/).forEach(part=>{if(part.trim()){const p=document.createElement('p');p.textContent=part.trim();body.append(p);}});main.append(body);
    const share=document.createElement('div');share.className='article-share';const back=document.createElement('a');back.href='actualites.html';back.textContent='← Toutes les actualités';const fb=document.createElement('a');fb.href='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(location.href);fb.target='_blank';fb.rel='noopener noreferrer';fb.textContent='Partager sur Facebook ↗';share.append(back,fb);main.append(share);
  }load();
})();
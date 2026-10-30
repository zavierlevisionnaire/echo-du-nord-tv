(() => {
  const $ = id => document.getElementById(id);
  if (!window.supabase || !window.ECHO_SUPABASE_URL || !window.ECHO_SUPABASE_ANON_KEY) { $('login-error').textContent='Le service de connexion n’est pas configuré.'; $('login-error').classList.add('show'); return; }
  const db=window.supabase.createClient(window.ECHO_SUPABASE_URL,window.ECHO_SUPABASE_ANON_KEY);
  let currentUser=null, articlesCache=[], adsCache=[];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slugify=s=>String(s||'article').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'article';
  const notify=(id,msg)=>{const el=$(id);el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3500);};
  function show(view){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('crumb').textContent=({dashboard:'Tableau de bord',articles:'Articles',editor:'Rédaction',ads:'Publicités',urgent:'Alerte urgente'})[view]||view;}
  async function checkAdmin(user){
    const {data,error}=await db.from('echo_admins').select('user_id,email').eq('user_id',user.id).maybeSingle();
    if(error||!data)throw new Error('Ce compte est connecté, mais il ne dispose pas des droits administrateur Écho du Nord TV.');
  }
  async function enter(user){
    await checkAdmin(user);currentUser=user;$('auth-screen').style.display='none';$('app').style.display='block';$('user-email').textContent=user.email||'Administrateur';await refreshAll();show('dashboard');
  }
  $('login-form').addEventListener('submit',async e=>{
    e.preventDefault();const btn=e.submitter;btn.disabled=true;btn.textContent='Connexion…';$('login-error').classList.remove('show');
    const {data,error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
    try{if(error)throw error;await enter(data.user);}catch(err){$('login-error').textContent=err.message||'Connexion impossible. Vérifiez vos identifiants.';$('login-error').classList.add('show');if(data?.user)await db.auth.signOut();}
    btn.disabled=false;btn.textContent='Se connecter';
  });
  $('logout').onclick=async()=>{await db.auth.signOut();location.reload();};
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
  document.querySelectorAll('[data-open-editor]').forEach(b=>b.addEventListener('click',()=>{resetArticle();show('editor');}));
  async function refreshAll(){await Promise.all([loadArticles(),loadAds(),loadUrgent()]);}
  async function loadArticles(){
    const {data,error}=await db.from('echo_articles').select('*').order('updated_at',{ascending:false});if(error)throw error;articlesCache=data||[];
    $('metric-total').textContent=articlesCache.length;$('metric-published').textContent=articlesCache.filter(a=>a.status==='published').length;
    const recent=articlesCache.slice(0,5);$('recent-articles').innerHTML=recent.length?recent.map(a=>'<tr><td><span class="article-title">'+esc(a.title)+'</span></td><td>'+esc(a.category)+'</td><td><span class="pill '+(a.status==='draft'?'draft':'')+'">'+(a.status==='draft'?'Brouillon':'Publié')+'</span></td><td>'+new Date(a.updated_at).toLocaleDateString('fr-FR')+'</td></tr>').join(''):'<tr><td colspan="4" class="empty">Aucun article pour le moment. Créez votre première publication.</td></tr>';
    renderArticles();
  }
  function renderArticles(){
    const q=$('article-search').value.toLocaleLowerCase('fr'),filter=$('article-filter').value;
    const list=articlesCache.filter(a=>(!filter||a.status===filter)&&(!q||(a.title+' '+a.category).toLocaleLowerCase('fr').includes(q)));
    $('article-rows').innerHTML=list.length?list.map(a=>'<tr><td><span class="article-title">'+esc(a.title)+'</span><span class="sub">'+esc(a.slug)+'</span></td><td>'+esc(a.category)+'</td><td><span class="pill '+(a.status==='draft'?'draft':'')+'">'+(a.status==='draft'?'Brouillon':'Publié')+'</span></td><td>'+new Date(a.updated_at).toLocaleDateString('fr-FR')+'</td><td><div class="actions"><button class="action" data-edit="'+a.id+'">Modifier</button><button class="action delete" data-delete="'+a.id+'">Supprimer</button></div></td></tr>').join(''):'<tr><td colspan="5" class="empty">Aucun article trouvé.</td></tr>';
    $('article-rows').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editArticle(b.dataset.edit));
    $('article-rows').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteArticle(b.dataset.delete));
  }
  $('article-search').oninput=renderArticles;$('article-filter').onchange=renderArticles;
  function resetArticle(){ $('article-form').reset();$('article-id').value='';$('cover-url').value='';$('cover-preview').textContent='Aucune image sélectionnée';$('upload-status').textContent='JPEG, PNG ou WebP · 10 Mo maximum';$('editor-heading').textContent='Rédiger un article';$('article-status').value='draft'; }
  $('reset-article').onclick=resetArticle;
  async function upload(file,folder,statusId){
    if(!file)return null;if(!/^image\/(jpeg|png|webp|gif)$/.test(file.type))throw new Error('Format d’image non accepté.');if(file.size>10*1024*1024)throw new Error('Image trop volumineuse : 10 Mo maximum.');
    $(statusId).textContent='Envoi de l’image…';const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');const path=folder+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
    const {data,error}=await db.storage.from('echo-media').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(error)throw error;
    return db.storage.from('echo-media').getPublicUrl(data.path).data.publicUrl;
  }
  $('cover-file').onchange=()=>{const f=$('cover-file').files[0];if(!f)return;const url=URL.createObjectURL(f);$('cover-preview').innerHTML='<img alt="Aperçu de la couverture" src="'+url+'">';};
  $('article-form').onsubmit=async e=>{
    e.preventDefault();const btn=$('save-article');btn.disabled=true;btn.textContent='Enregistrement…';
    try{
      let image=$('cover-url').value;const file=$('cover-file').files[0];if(file)image=await upload(file,'articles','upload-status');
      const title=$('article-title').value.trim(),status=$('article-status').value;
      const payload={title,slug:slugify(title),category:$('article-category').value,excerpt:$('article-excerpt').value.trim(),body:$('article-body').value.trim(),cover_image:image||null,status,published_at:status==='published'?new Date().toISOString():null,author_id:currentUser.id,updated_at:new Date().toISOString()};
      const id=$('article-id').value;const result=id?await db.from('echo_articles').update(payload).eq('id',id):await db.from('echo_articles').insert(payload);
      if(result.error)throw result.error;notify('article-toast',status==='published'?'Article publié avec succès.':'Brouillon enregistré.');resetArticle();await loadArticles();show('articles');
    }catch(err){notify('article-toast','Erreur : '+err.message);}finally{btn.disabled=false;btn.textContent='Enregistrer l’article';}
  };
  function editArticle(id){const a=articlesCache.find(x=>x.id===id);if(!a)return;$('article-id').value=a.id;$('article-title').value=a.title;$('article-excerpt').value=a.excerpt;$('article-body').value=a.body;$('article-category').value=a.category;$('article-status').value=a.status;$('cover-url').value=a.cover_image||'';$('cover-preview').innerHTML=a.cover_image?'<img alt="Couverture actuelle" src="'+esc(a.cover_image)+'">':'Aucune image sélectionnée';$('editor-heading').textContent='Modifier l’article';show('editor');}
  async function deleteArticle(id){const a=articlesCache.find(x=>x.id===id);if(!a||!confirm('Supprimer définitivement « '+a.title+' » ?'))return;const {error}=await db.from('echo_articles').delete().eq('id',id);if(error){alert(error.message);return;}await loadArticles();}
  async function loadAds(){const {data,error}=await db.from('echo_ads').select('*').order('created_at',{ascending:false});if(error)throw error;adsCache=data||[];$('metric-ads').textContent=adsCache.filter(a=>a.active).length;$('ad-list').innerHTML=adsCache.length?adsCache.map(a=>'<div style="border-bottom:1px solid #e8eee8;padding:11px 0"><b style="font-size:12px">'+esc(a.title)+'</b><p style="font-size:10px;color:#6b776f;margin:4px 0">'+esc(a.position)+' · '+(a.active?'Active':'Désactivée')+'</p><button class="action" data-ad-edit="'+a.id+'">Modifier</button> <button class="action delete" data-ad-delete="'+a.id+'">Supprimer</button></div>').join(''):'Aucune publicité enregistrée.';
    $('ad-list').querySelectorAll('[data-ad-edit]').forEach(b=>b.onclick=()=>{const a=adsCache.find(x=>x.id===b.dataset.adEdit);$('ad-id').value=a.id;$('ad-title').value=a.title;$('ad-description').value=a.description;$('ad-position').value=a.position;$('ad-url').value=a.target_url||'';$('ad-image-url').value=a.image_url||'';$('ad-active').checked=a.active;});
    $('ad-list').querySelectorAll('[data-ad-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Supprimer cette publicité ?'))return;const {error}=await db.from('echo_ads').delete().eq('id',b.dataset.adDelete);if(error)alert(error.message);else await loadAds();});
  }
  $('ad-form').onsubmit=async e=>{e.preventDefault();try{let image=$('ad-image-url').value;const f=$('ad-image-file').files[0];if(f)image=await upload(f,'ads','ad-upload-status');const payload={title:$('ad-title').value.trim(),description:$('ad-description').value.trim(),position:$('ad-position').value,target_url:$('ad-url').value.trim()||null,image_url:image||null,active:$('ad-active').checked,updated_at:new Date().toISOString()};const id=$('ad-id').value;const r=id?await db.from('echo_ads').update(payload).eq('id',id):await db.from('echo_ads').insert(payload);if(r.error)throw r.error;$('ad-form').reset();$('ad-id').value='';$('ad-image-url').value='';notify('ad-toast','Publicité enregistrée.');await loadAds();}catch(err){notify('ad-toast','Erreur : '+err.message);}};
  $('reset-ad').onclick=()=>{$('ad-form').reset();$('ad-id').value='';$('ad-image-url').value='';};
  async function loadUrgent(){const {data,error}=await db.from('echo_settings').select('value').eq('key','urgent').maybeSingle();if(error)throw error;const v=data?.value||{};$('urgent-active').checked=!!v.active;$('urgent-message').value=v.message||'';$('urgent-url').value=v.url||'';previewUrgent();}
  function previewUrgent(){const msg=$('urgent-message').value.trim();$('urgent-preview').textContent=$('urgent-active').checked&&msg?'URGENT : '+msg:'Aperçu du bandeau urgent : votre message apparaîtra ici.';}
  $('urgent-message').oninput=previewUrgent;$('urgent-active').onchange=previewUrgent;
  $('urgent-form').onsubmit=async e=>{e.preventDefault();const value={active:$('urgent-active').checked,message:$('urgent-message').value.trim(),url:$('urgent-url').value.trim()};if(value.active&&!value.message){notify('urgent-toast','Saisissez un message avant d’activer l’alerte.');return;}const {error}=await db.from('echo_settings').upsert({key:'urgent',value,updated_at:new Date().toISOString()});if(error)notify('urgent-toast','Erreur : '+error.message);else notify('urgent-toast','Alerte enregistrée.');};
  $('urgent-disable').onclick=async()=>{$('urgent-active').checked=false;previewUrgent();const {error}=await db.from('echo_settings').upsert({key:'urgent',value:{active:false,message:'',url:''},updated_at:new Date().toISOString()});if(error)notify('urgent-toast','Erreur : '+error.message);else notify('urgent-toast','Alerte désactivée.');};
  db.auth.getSession().then(async({data})=>{if(data.session){try{await enter(data.session.user);}catch(e){await db.auth.signOut();}}});
  db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){currentUser=null;$('app').style.display='none';$('auth-screen').style.display='grid';}});
})();

// Privacy-conscious analytics: anonymous random browser ID, page path only, no query strings.
(function(){
  try{
    if(!window.supabase||!window.ECHO_SUPABASE_URL||!window.ECHO_SUPABASE_ANON_KEY)return;
    let key=localStorage.getItem('echo_visitor_id');
    if(!key){key=crypto.randomUUID?crypto.randomUUID():(Date.now().toString(36)+Math.random().toString(36).slice(2));localStorage.setItem('echo_visitor_id',key);}
    const page=(location.pathname||'/').slice(0,300);
    let domain=null;try{if(document.referrer){const u=new URL(document.referrer);if(u.origin!==location.origin)domain=u.hostname.slice(0,200);}}catch(e){}
    const client=window.supabase.createClient(window.ECHO_SUPABASE_URL,window.ECHO_SUPABASE_ANON_KEY);
    client.from('echo_visits').insert({visitor_key:key,page_path:page,referrer_domain:domain}).then(()=>{}).catch(()=>{});
  }catch(e){/* visitor measurement is non-blocking */}
})();
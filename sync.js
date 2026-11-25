/* LabSync: optional two-way sync of StudyLab progress with a Google Sheet.
   Talks only to a Google Apps Script web app the owner deploys from their own Sheet
   (integrations/sheets-sync/Code.gs). The web app URL and token are kept in this
   browser's localStorage and are never part of the site's code.
   Push: finished runs (append-only log), per-item levels, concept heat.
   Pull: levels/due dates from other devices, XP, practice days, retakes, and the
   "Your priority" column the owner edits in Lab_Concepts. */
(function(){
  const C=window.BenchCore;if(!C)return;
  const KEY='az104.sync.v1';
  const URL_RE=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
  const DOM={identity:'Identity & governance',storage:'Storage',compute:'Compute',networking:'Networking',monitor:'Monitor & maintain'};
  const LANG={azcli:'Azure CLI',pwsh:'PowerShell',bicep:'Bicep',json:'ARM JSON',kql:'KQL'};
  const PRIO_BONUS={High:3,Medium:1.5,Normal:0,Low:-1.5};
  const CODE_URL='https://github.com/cyberdude88/az-104-studylab/blob/main/integrations/sheets-sync/Code.gs';
  const HELP_URL='https://github.com/cyberdude88/az-104-studylab/blob/main/integrations/sheets-sync/README.md';
  const listeners=new Set();
  let busy=null;

  function cfg(){try{const c=JSON.parse(localStorage.getItem(KEY))||{};c.pending=Array.isArray(c.pending)?c.pending:[];return c}catch{return {pending:[]}}}
  function put(c){try{localStorage.setItem(KEY,JSON.stringify(c))}catch{}}
  const enabled=()=>{const c=cfg();return !!(c.url&&c.token)};
  const rid=()=>(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)).replace(/-/g,'').slice(0,32);

  /* ───────── what the pages tell us ───────── */
  function benches(){
    const out={};
    if(window.CTS_DECK)out.cts=window.CTS_DECK;
    const B=window.BENCHMARKS||{};if(B.nov25)out.nov25=B.nov25;
    return out;
  }
  function priority(tag){const s=C.load('cts');return (s.prio||{})[tag]||'Normal'}
  function prioBonus(tag){return PRIO_BONUS[priority(tag)]||0}
  const ignored=tag=>priority(tag)==='Ignore';

  /* A finished run. Queued locally first so nothing is lost offline. */
  function logRun(r){
    const c=cfg();if(!(c.url&&c.token))return;
    c.pending.push(Object.assign({ts:new Date().toISOString(),date:C.today(),runId:rid()},r));
    if(c.pending.length>200)c.pending=c.pending.slice(-200);
    put(c);sync().catch(()=>{});
  }

  function statusRows(){
    const rows=[],bs=benches();
    Object.entries(bs).forEach(([g,b])=>{
      const s=C.load(g);
      b.missions.forEach(mi=>{
        const m=C.missionState(s,mi.id);if(!m.runs)return;
        const d=mi.domains?mi.domains[0]:mi.domain;
        rows.push({gameId:g,id:mi.id,title:mi.title,domain:DOM[d]||d||'',mode:mi.mode||'drag',lang:LANG[mi.lang]||'',
          level:m.box,status:({new:'New',due:'Due',learning:'Learning',mastered:'Mastered'})[C.status(s,mi.id)],
          runs:m.runs,clean:m.clean,misses:m.wrong,last:m.last,due:m.due});
      });
    });
    return rows;
  }
  function conceptRows(){
    const D=window.CTS_DECK;if(!D)return [];
    const s=C.load('cts'),lc=s.concepts||{};
    return Object.entries(D.concepts).map(([id,c])=>{
      const l=lc[id]||{miss:0,hit:0};
      return {id,label:c.label,src:c.src||'',w:c.w,misses:l.miss,hits:l.hit,heat:window.CTS_HEAT?window.CTS_HEAT(id):c.w+l.miss*1.5-l.hit*.4};
    });
  }

  /* ───────── merge what the Sheet returns ───────── */
  function merge(res){
    const known=benches(),changed=new Set();
    const games=new Set([...Object.keys(known),...(res.status||[]).map(x=>x.game)]);
    games.forEach(g=>{
      const s=C.load(g);let dirty=false;
      (res.status||[]).filter(x=>x.game===g).forEach(x=>{
        const m=C.missionState(s,x.id);
        const newer=x.last&&(!m.last||x.last>m.last);
        const n={...m,log:m.log||[]};
        if(newer){n.box=x.level;n.last=x.last;n.due=x.due||x.last}
        n.runs=Math.max(m.runs,x.runs);n.clean=Math.max(m.clean,x.clean);n.wrong=Math.max(m.wrong,x.misses);
        if(newer||n.runs!==m.runs||n.clean!==m.clean||n.wrong!==m.wrong){s.missions[x.id]=n;dirty=true}
      });
      const t=(res.totals||{})[g];
      if(t){
        if(t.xp>s.xp){s.xp=t.xp;dirty=true}
        const days=new Set(s.days);(t.days||[]).forEach(d=>{if(!days.has(d)){days.add(d);dirty=true}});
        s.days=[...days].sort().slice(-400);
      }
      if(g==='nov25'){
        const seen=new Set(s.retakes.map(r=>r.d+'|'+r.score));
        (res.retakes||[]).filter(r=>r.game===g).forEach(r=>{if(!seen.has(r.d+'|'+r.score)){s.retakes.push({d:r.d,score:r.score});seen.add(r.d+'|'+r.score);dirty=true}});
        s.retakes.sort((a,b)=>a.d<b.d?-1:1);
      }
      if(g==='cts'){
        s.concepts=s.concepts||{};s.prio=s.prio||{};
        (res.concepts||[]).forEach(x=>{
          const l=s.concepts[x.id]||{miss:0,hit:0};
          if(x.misses>l.miss||x.hits>l.hit){s.concepts[x.id]={miss:Math.max(l.miss,x.misses),hit:Math.max(l.hit,x.hits)};dirty=true}
          if((s.prio[x.id]||'Normal')!==x.priority){if(x.priority==='Normal')delete s.prio[x.id];else s.prio[x.id]=x.priority;dirty=true}
        });
      }
      if(dirty){C.save(g,s);changed.add(g)}
    });
    return changed;
  }

  /* ───────── transport ───────── */
  async function post(c,body){
    const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),30000);
    try{
      const r=await fetch(c.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({token:c.token},body)),redirect:'follow',signal:ctl.signal,credentials:'omit'});
      const j=await r.json();
      if(!j.ok)throw new Error(j.error==='unauthorized'?'Token rejected by the Sheet':j.error||'Sync failed');
      return j;
    }catch(e){throw new Error(e.name==='AbortError'?'Timed out':e.message==='Failed to fetch'?'Could not reach the web app (check the URL and that access is “Anyone”)':e.message)}
    finally{clearTimeout(to)}
  }

  function sync(){
    if(busy)return busy;
    const c=cfg();if(!(c.url&&c.token))return Promise.resolve(null);
    emit({state:'busy'});
    busy=(async()=>{
      try{
        const sent=c.pending.slice(0,150);
        const res=await post(c,{action:'sync',runs:sent,status:statusRows(),concepts:conceptRows()});
        const now=cfg();const ids=new Set(sent.map(r=>r.runId));now.pending=now.pending.filter(r=>!ids.has(r.runId));
        const changed=merge(res);
        /* first contact: carry XP earned before syncing as one baseline row per game */
        now.baselined=now.baselined||{};
        let again=false;
        Object.keys(benches()).forEach(g=>{
          if(now.baselined[g])return;
          const local=C.load(g).xp,sheet=((res.totals||{})[g]||{}).xp||0,queued=now.pending.filter(r=>r.gameId===g).reduce((a,r)=>a+(r.xp||0),0);
          if(local>sheet+queued){now.pending.push({ts:new Date().toISOString(),date:C.today(),runId:rid(),gameId:g,id:'baseline',title:'Progress before Sheet sync',mode:'baseline',xp:local-sheet-queued});again=true}
          now.baselined[g]=true;
        });
        now.last={at:new Date().toISOString(),ok:true,msg:`Synced · ${res.added||0} run${res.added===1?'':'s'} sent`};
        put(now);
        emit({state:'ok',changed});
        if(again){busy=null;return sync()}
        return res;
      }catch(e){
        const now=cfg();now.last={at:new Date().toISOString(),ok:false,msg:e.message};put(now);
        emit({state:'error',msg:e.message});throw e;
      }finally{busy=null}
    })();
    return busy;
  }

  function emit(ev){listeners.forEach(f=>{try{f(ev)}catch{}})}
  function on(f){listeners.add(f);return ()=>listeners.delete(f)}

  async function connect(url,token){
    url=String(url||'').trim();token=String(token||'').trim();
    if(!URL_RE.test(url))throw new Error('Paste the Web app URL ending in /exec from Deploy → Manage deployments');
    if(!/^[A-Za-z0-9]{24,128}$/.test(token))throw new Error('Paste the sync token from the Sheet menu StudyLab sync → Show sync token');
    await post({url,token},{action:'ping'});
    const c=cfg();c.url=url;c.token=token;c.auto=c.auto!==false;put(c);
    return sync();
  }
  function disconnect(){const c=cfg();delete c.url;delete c.token;delete c.baselined;c.pending=[];c.last=null;put(c);emit({state:'off'})}

  function ago(iso){const s=Math.round((Date.now()-new Date(iso))/1000);return s<60?'just now':s<3600?`${Math.round(s/60)} min ago`:s<86400?`${Math.round(s/3600)} h ago`:new Date(iso).toLocaleDateString()}
  function line(){
    const c=cfg();
    if(!(c.url&&c.token))return {cls:'off',text:'Google Sheet: not connected. Progress is saved in this browser only.'};
    const p=c.pending.length?` · ${c.pending.length} waiting`:'';
    if(!c.last)return {cls:'off',text:'Google Sheet: connected'+p};
    return c.last.ok?{cls:'ok',text:`Google Sheet: synced ${ago(c.last.at)}${p}`}:{cls:'err',text:`Google Sheet: ${c.last.msg}${p}`};
  }

  /* ───────── panel ───────── */
  const CSS=`.ls{margin-top:1rem;padding:.9rem 1rem;border:1px solid var(--ls-line,rgba(127,127,127,.35));border-radius:.6rem;font-size:.88rem}
.ls summary{cursor:pointer;display:flex;gap:.6rem;align-items:center;list-style:none;font-weight:600}.ls summary::-webkit-details-marker{display:none}
.ls .dot{width:.6rem;height:.6rem;border-radius:50%;background:#8a8f98;flex:none}.ls .dot.ok{background:#16a34a}.ls .dot.err{background:#dc2626}.ls .dot.busy{background:#f59e0b;animation:lsp 1s infinite}
@keyframes lsp{50%{opacity:.35}}@media(prefers-reduced-motion:reduce){.ls .dot.busy{animation:none}}
.ls .st{font-weight:400;opacity:.85}.ls .body{margin-top:.8rem;display:grid;gap:.6rem}.ls p{margin:0;line-height:1.5;opacity:.9}
.ls label{display:grid;gap:.25rem;font-size:.8rem;opacity:.9}.ls input[type=text],.ls input[type=password]{font:inherit;font-size:.85rem;padding:.5rem .6rem;border-radius:.45rem;border:1px solid var(--ls-line,rgba(127,127,127,.45));background:transparent;color:inherit;width:100%;box-sizing:border-box}
.ls .row{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}.ls button{font:inherit;font-size:.85rem;cursor:pointer;padding:.45rem .8rem;border-radius:.45rem;border:1px solid var(--ls-line,rgba(127,127,127,.45));background:transparent;color:inherit}
.ls button.pri{background:var(--ls-accent,#0f6cbd);border-color:var(--ls-accent,#0f6cbd);color:#fff}.ls button:disabled{opacity:.5;cursor:default}.ls .msg{font-size:.8rem}.ls .msg.err{color:#dc2626}.ls a{color:inherit}
.ls ol{margin:0;padding-left:1.2rem;line-height:1.55;opacity:.9}`;
  function mount(host,opts){
    if(!host)return;opts=opts||{};
    if(!document.getElementById('ls-css')){const st=document.createElement('style');st.id='ls-css';st.textContent=CSS;document.head.append(st)}
    const el=document.createElement('details');el.className='ls';host.append(el);
    let state=null;
    const draw=()=>{
      const c=cfg(),on=!!(c.url&&c.token),l=line(),open=el.open;
      el.innerHTML=`<summary><span class="dot ${state==='busy'?'busy':l.cls}"></span><span>Save progress to Google Sheet</span><span class="st">· ${esc(state==='busy'?'syncing…':l.text.replace(/^Google Sheet: /,''))}</span></summary>
      <div class="body">${on?`<p>Every finished run is logged to <b>Lab_Runs</b>; levels go to <b>Lab_Status</b>; concept heat goes to <b>Lab_Concepts</b>. Set <b>Your priority</b> there (High / Medium / Low / Ignore) and the next sync re-ranks today’s run. Other devices pull the same progress.</p>
        <div class="row"><button class="pri" data-a="sync">Sync now</button><button data-a="off">Disconnect this browser</button></div>`
      :`<ol><li>In your readiness Sheet: <b>Extensions → Apps Script</b>, paste <a href="${CODE_URL}" target="_blank" rel="noopener noreferrer">Code.gs</a>, save, run <b>setup</b> once.</li><li><b>Deploy → New deployment → Web app</b>, Execute as <b>Me</b>, access <b>Anyone</b>. Copy the URL.</li><li>Reload the Sheet: menu <b>StudyLab sync → Show sync token</b>.</li></ol>
        <label>Web app URL<input type="text" data-f="url" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off" spellcheck="false"></label>
        <label>Sync token<input type="password" data-f="token" autocomplete="off" spellcheck="false"></label>
        <div class="row"><button class="pri" data-a="connect">Connect and sync</button><a href="${HELP_URL}" target="_blank" rel="noopener noreferrer">Setup guide</a></div>
        <p class="msg" aria-live="polite"></p><p style="font-size:.78rem">The URL and token stay in this browser’s storage. Nothing is sent anywhere until you connect.</p>`}</div>`;
      el.open=open;
      el.querySelectorAll('[data-a]').forEach(b=>b.onclick=async e=>{
        e.preventDefault();const a=b.dataset.a,msg=el.querySelector('.msg');
        if(a==='off'){if(b.dataset.armed){disconnect();draw();return}b.dataset.armed=1;b.textContent='Click again to disconnect';setTimeout(()=>{b.textContent='Disconnect this browser';delete b.dataset.armed},3000);return}
        b.disabled=true;
        try{
          if(a==='connect'){msg.className='msg';msg.textContent='Connecting…';await connect(el.querySelector('[data-f=url]').value,el.querySelector('[data-f=token]').value)}
          else await sync();
        }catch(err){if(msg){msg.className='msg err';msg.textContent=err.message}}
        finally{b.disabled=false}
      });
    };
    on(ev=>{state=ev.state==='busy'?'busy':null;if(!(ev.state==='error'&&el.querySelector('[data-f=url]')))draw();if(ev.changed&&ev.changed.size&&opts.onPull)opts.onPull(ev.changed)});
    if(opts.open&&!enabled())el.open=true;
    draw();
    setInterval(()=>{if(state!=='busy'&&enabled())draw()},60000);
  }
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* pull on load (and when the tab regains focus, at most every 2 min) */
  let lastAuto=0;
  function auto(){if(!enabled()||Date.now()-lastAuto<120000)return;lastAuto=Date.now();sync().catch(()=>{})}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')auto()});

  window.LabSync={enabled,cfg,logRun,sync,connect,disconnect,on,mount,auto,line,priority,prioBonus,ignored};
})();

/* Complete the Script: dropdown fill-in / bug-hunt game over scripts/deck.js.
   Scheduling reuses BenchCore (bench id 'cts'); concept heat blends NOV25 misses, tracker flags and live misses. */
(function(){
const C=window.BenchCore,D=window.CTS_DECK,NOV=(window.BENCHMARKS||{}).nov25;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DOM={identity:'Identity & governance',storage:'Storage',compute:'Compute',networking:'Networking',monitor:'Monitor & maintain'};
const DOM_SHORT={identity:'Identity',storage:'Storage',compute:'Compute',networking:'Networking',monitor:'Monitor'};
const LANG={azcli:'Azure CLI',pwsh:'PowerShell',bicep:'Bicep',json:'ARM JSON',kql:'KQL'};
const STATUS={new:'New',due:'Due',learning:'Learning',mastered:'Mastered'};
const RUN_KEY='cts.run';

/* normalise deck: PowerShell continuation, flags used by BenchCore.queue */
D.missions.forEach(m=>{
  if(m.lang==='pwsh')m.code=m.code.replace(/ ~$/gm,' `');
  m.recurring=m.tags.some(t=>(D.concepts[t]||{}).w>=3);
  m.regressed=m.tags.some(t=>/slipped/i.test((D.concepts[t]||{}).src||''));
});
const byId=Object.fromEntries(D.missions.map(m=>[m.id,m]));

let st=load();
function load(){const s=C.load(D.id);s.concepts=s.concepts||{};s.blanks=s.blanks||{};return s}
function save(){C.save(D.id,st)}

/* ───────── adaptive ranking ───────── */
let novState=null;
function novOpen(tag){const c=D.concepts[tag];if(!c||!c.nov||!NOV)return false;novState=novState||C.load('nov25');return c.nov.some(id=>C.missionState(novState,id).box<C.MASTER_BOX)}
const LS=window.LabSync;
function heat(tag){const c=D.concepts[tag]||{w:1};const l=st.concepts[tag]||{miss:0,hit:0};if(LS&&LS.ignored(tag))return .3;return Math.max(.3,c.w+l.miss*1.5-l.hit*.4+(novOpen(tag)?1:0)+(LS?LS.prioBonus(tag):0))}
window.CTS_HEAT=heat;
function blankMisses(m){return m.b.reduce((a,_,i)=>a+(st.blanks[m.id+':'+(i+1)]||0),0)}
function rank(){
  novState=null;
  return C.queue(D,st).map(e=>{
    const hs=e.mission.tags.map(heat).sort((a,b)=>b-a);
    const h=hs[0]*4+hs.slice(1).reduce((a,b)=>a+b,0);
    return {...e,heat:hs[0],priority:e.priority+Math.min(h,30)+Math.min(blankMisses(e.mission),5)*3};
  }).sort((a,b)=>b.priority-a.priority);
}
function todayRun(){
  const r=rank(),act=r.filter(e=>e.status==='new'||e.status==='due');
  const pool=act.length>=5?act:[...act,...r.filter(e=>!act.includes(e))];
  const pick=[],per={};
  for(const e of pool){const d=e.mission.domains[0];if((per[d]||0)>=2)continue;pick.push(e);per[d]=(per[d]||0)+1;if(pick.length===5)break}
  if(!pick.some(e=>e.mission.mode==='fix')){const f=pool.find(e=>e.mission.mode==='fix'&&!pick.includes(e));if(f)pick[pick.length-1]=f}
  return pick.map(e=>e.mission.id);
}
/* ───────── study drill: every script once, in a fixed priority order ─────────
   Numbers never move (#50 is always the same script). It adapts by what it serves next:
   unplayed numbers first (from where you are), then the ones you missed, until every number is clean. */
const ORDER=[...(D.drill||[]).filter(id=>byId[id]),...D.missions.map(m=>m.id).filter(id=>!(D.drill||[]).includes(id))];
const N=ORDER.length;
function drill(){const d=st.drill||(st.drill={pos:0,res:{}});d.res=d.res||{};d.pos=Math.min(Math.max(d.pos|0,0),N-1);return d}
function dres(i){return drill().res[ORDER[i]]}
function dTarget(from){ // next number to serve, scanning forward from index `from` and wrapping
  for(const want of [undefined,'miss'])for(let k=0;k<N;k++){const i=(from+k)%N;if(dres(i)===want)return i}
  return -1;
}
function dCounts(){const r=drill().res;let clean=0,fixed=0,miss=0;ORDER.forEach(id=>{const v=r[id];if(v==='clean')clean++;else if(v==='fixed')fixed++;else if(v==='miss')miss++});return {clean,fixed,miss,left:N-clean-fixed-miss}}
function numBtn(i,cur){const id=ORDER[i],m=byId[id],v=dres(i)||'new';const hot=m.tags.some(t=>(D.concepts[t]||{}).w>=3);
  return `<button class="dn d-${v}${i===cur?' cur':''}${hot?' hotn':''}" data-n="${i+1}" title="${i+1}. ${esc(m.title)} (${v==='new'?'not played':v==='miss'?'missed':v==='fixed'?'clean on retry':'clean'})"${i===cur?' aria-current="step"':''}>${i+1}</button>`}
function goDrill(n){if(location.hash==='#d='+n)route();else location.hash='d='+n}
let drillArmed=null;
function renderDrill(){
  const d=drill(),c=dCounts(),t=dTarget(d.pos),started=c.left<N;
  const m=t>=0?byId[ORDER[t]]:null;
  const head=!started?{h:`Study drill: all ${N} scripts, most important first`,s:`Starts with your repeat misses (peering, UDRs, service vs private endpoints, DNS delegation) and works down to new ground. Jump to any number below.`,b:'Start at #1'}
    :c.left?{h:`Study drill: #${t+1} of ${N} is next`,s:`${m.title}. Numbers you skip stay open; misses come back after the unplayed ones.`,b:`Resume at #${t+1}`}
    :c.miss?{h:`Pass complete: retry ${c.miss} missed`,s:`Next miss: #${t+1} ${m.title}. A clean retry turns it green.`,b:`Retry #${t+1}`}
    :{h:'Drill cleared: every script clean ✓',s:'Start over for a fresh pass, or let Today’s run handle spaced review.',b:'Start a new pass'};
  $('#drill').innerHTML=`<div class="top"><div><b>${esc(head.h)}</b><small>${esc(head.s)}</small></div>
    <div class="acts">${started?`<button class="btn sec" id="drillReset" title="Clears drill marks only. Levels, XP and spaced review are kept.">Start over</button>`:''}<button class="btn big" id="drillGo">${esc(head.b)} →</button></div></div>
    <div class="stats"><span><b>${c.clean+c.fixed}</b> clean</span><span><b>${c.miss}</b> missed</span><span><b>${c.left}</b> not played</span></div>
    <div class="nums" role="list">${ORDER.map((_,i)=>numBtn(i,started&&t===i?i:-1)).join('')}</div>
    <div class="legend"><span><i></i>not played</span><span><i class="c"></i>clean</span><span><i class="f"></i>clean on retry</span><span><i class="m"></i>missed</span><span><i class="h"></i> repeat-miss concept</span></div>`;
  $('#drill').querySelectorAll('.nums .dn').forEach(b=>b.onclick=()=>goDrill(b.dataset.n));
  $('#drillGo').onclick=()=>{if(started&&!c.left&&!c.miss){st.drill={pos:0,res:{}};save();goDrill(1);return}goDrill((t<0?0:t)+1)};
  const rb=$('#drillReset');if(rb)rb.onclick=()=>{if(drillArmed){clearTimeout(drillArmed);drillArmed=null;st.drill={pos:0,res:{}};save();renderDrill();return}rb.textContent='Click again to clear';drillArmed=setTimeout(()=>{drillArmed=null;rb.textContent='Start over'},3000)};
}
function renderRail(cur){
  const c=dCounts();
  $('#pRail').innerHTML=`<span class="rh">Drill</span><span class="rc">${cur+1}/${N}</span>${ORDER.map((_,i)=>numBtn(i,cur)).join('')}<span class="rc" title="clean · missed">✓${c.clean+c.fixed} ✗${c.miss}</span>`;
  $('#pRail').querySelectorAll('.dn').forEach(b=>b.onclick=()=>goDrill(b.dataset.n));
  const el=$('#pRail .dn.cur');if(el)el.scrollIntoView({block:'nearest',inline:'nearest'});
}

function getRun(){try{const r=JSON.parse(sessionStorage.getItem(RUN_KEY));return r&&r.day===C.today()?r:null}catch{return null}}
function setRun(r){try{r?sessionStorage.setItem(RUN_KEY,JSON.stringify(r)):sessionStorage.removeItem(RUN_KEY)}catch{}}

/* ───────── board ───────── */
let filter={kind:'all',val:null};
function pips(box){return `<span class="pips" aria-label="Level ${Math.min(box,C.MASTER_BOX)} of ${C.MASTER_BOX}">${Array.from({length:C.MASTER_BOX},(_,i)=>`<i class="${i<box?'on':''}"></i>`).join('')}</span>`}
function heatColor(h){return h>=4?'#c50f1f':h>=3?'#d4570e':h>=2?'#b08800':'#107c10'}
function topBar(){const s=C.summary(D,st);$('#topXp').innerHTML=`<span><b>${s.xp}</b> XP</span><span><b>${s.streak}</b>🔥<span class="hide-s"> day streak</span></span><span class="hide-s"><b>${s.mastered}/${s.total}</b> mastered</span>`}

function renderBoard(){
  st=load();const s=C.summary(D,st),r=rank();
  document.title='Complete the Script · AZ-104 StudyLab';
  $('#crumbScript').classList.add('hidden');$('#crumbTitle').textContent='';
  topBar();
  renderDrill();
  $('#chips').innerHTML=`<div class="chip g"><strong>${s.readiness}%</strong><span>Script fluency</span></div><div class="chip"><strong>${s.mastered}/${s.total}</strong><span>Mastered</span></div><div class="chip a"><strong>${s.due+s.new}</strong><span>To do</span></div><div class="chip b"><strong>${s.xp}</strong><span>XP</span></div>`;
  /* today's run */
  let run=getRun();const ids=run?run.ids:todayRun();
  const doneIds=run?run.ids.slice(0,run.i):[];
  const mins=ids.reduce((a,id)=>a+Math.max(2,Math.round(byId[id].b.length*.8)),0);
  const head=run?(run.i>=run.ids.length?{h:'Today’s run complete ✓',s:'Practise anything below, or come back tomorrow for a fresh mix.',b:'New mix',act:'new'}:{h:`Today’s run: ${run.i}/${run.ids.length} done`,s:`Next: ${byId[run.ids[run.i]].title}`,b:'Resume run',act:'resume'})
    :!s.started?{h:'Today’s run: 5 scripts, about '+mins+' min',s:'Picked from the concepts you’ve missed most, mixing languages and domains, plus one broken script to fix.',b:'Start run',act:'start'}
    :s.actionable?{h:`Today’s run: ${s.due} due · ${s.new} new`,s:'Re-ranked from your latest misses. Scripts you nailed come back on a spaced schedule.',b:'Start run',act:'start'}
    :{h:'All caught up: practise ahead',s:`Nothing is due today. These 5 are your hottest concepts; ${s.learning} scripts are scheduled for spaced review.`,b:'Practise ahead',act:'start'};
  $('#run').innerHTML=`<div><b>${esc(head.h)}</b><small>${esc(head.s)}</small></div><button class="btn big" id="runGo">${esc(head.b)} →</button>
    <ol>${ids.map(id=>{const m=byId[id];return `<li class="${doneIds.includes(id)?'done':''}${run&&run.ids[run.i]===id?' cur':''}"><span class="tag l-${m.lang}">${LANG[m.lang]}</span>${m.mode==='fix'?'<span class="tag m-fix">Fix</span>':''}${esc(m.title)}</li>`}).join('')}</ol>`;
  $('#runGo').onclick=()=>{
    if(head.act==='resume'){go(run.ids[run.i]);return}
    const nr={day:C.today(),ids:head.act==='new'?todayRun():ids,i:0};setRun(nr);go(nr.ids[0]);
  };
  /* heat */
  const used=new Set(D.missions.flatMap(m=>m.tags));
  const hl=[...used].filter(t=>!(LS&&LS.ignored(t))).map(t=>({t,h:heat(t),c:D.concepts[t],l:st.concepts[t]||{miss:0,hit:0}})).sort((a,b)=>b.h-a.h).slice(0,9);
  const maxH=Math.max(...hl.map(x=>x.h),1);
  $('#heat').innerHTML=hl.map(x=>`<li><button data-tag="${esc(x.t)}" title="Show scripts for this concept">${esc(x.c.label)}<span class="src">${esc(x.c.src)}${x.l.miss?` · ${x.l.miss} miss${x.l.miss>1?'es':''} here`:''}${x.l.hit?` · ${x.l.hit} right`:''}</span></button><span class="bar"><i style="width:${Math.round(x.h/maxH*100)}%;background:${heatColor(x.h)}"></i></span><b>${x.h.toFixed(1)}</b></li>`).join('');
  $('#heat').querySelectorAll('button').forEach(b=>b.onclick=()=>{filter={kind:'tag',val:b.dataset.tag};renderGrid(r);$('#filters').scrollIntoView({behavior:'smooth',block:'start'})});
  /* domains */
  $('#domains').innerHTML=Object.keys(DOM).map(d=>{const l=D.missions.filter(m=>m.domains[0]===d);const ms=l.filter(m=>C.missionState(st,m.id).box>=C.MASTER_BOX).length;return `<div class="dom"><span>${DOM[d]}</span><span class="bar"><i style="width:${l.length?ms/l.length*100:0}%"></i></span><b>${ms}/${l.length}</b></div>`}).join('');
  renderGrid(r);
}

function renderGrid(r){
  r=r||rank();
  const F=[['all','All'],...Object.keys(DOM).map(d=>['dom:'+d,DOM_SHORT[d]]),['cross','Cross-domain'],['fix','Fix the script'],['complete','Fill the blanks'],['due','Due + new']];
  const key=filter.kind==='tag'?'tag':filter.kind==='dom'?'dom:'+filter.val:filter.kind;
  $('#filters').innerHTML=F.map(([k,l])=>`<button data-f="${k}" aria-pressed="${k===key}">${l}</button>`).join('')+(filter.kind==='tag'?`<button aria-pressed="true" data-f="all" title="Clear">${esc(D.concepts[filter.val].label)} ✕</button>`:'')+`<span class="count" id="fCount"></span>`;
  $('#filters').querySelectorAll('button').forEach(b=>b.onclick=()=>{const f=b.dataset.f;filter=f.startsWith('dom:')?{kind:'dom',val:f.slice(4)}:{kind:f,val:null};renderGrid()});
  const list=r.filter(e=>{const m=e.mission;switch(filter.kind){case 'dom':return m.domains[0]===filter.val;case 'cross':return m.domains.length>1;case 'fix':return m.mode==='fix';case 'complete':return m.mode==='complete';case 'due':return e.status==='due'||e.status==='new';case 'tag':return m.tags.includes(filter.val)||m.b.some(b=>b.t===filter.val);default:return true}});
  $('#fCount').textContent=`${list.length} script${list.length===1?'':'s'} · ranked for you`;
  $('#grid').innerHTML=list.map(e=>{const m=e.mission;return `<button class="sc st-${e.status}" data-id="${esc(m.id)}">
    <span class="row"><span class="tag l-${m.lang}">${LANG[m.lang]}</span><span class="tag m-${m.mode}">${m.mode==='fix'?'Fix the script':'Fill the blanks'}</span>${e.heat>=3?'<span class="tag hot">🔥 Repeat miss</span>':''}</span>
    <b>${esc(m.title)}</b>
    <span class="dchips">${m.domains.map(d=>`<span>${DOM_SHORT[d]}</span>`).join('')}</span>
    <span class="foot"><span><span class="tag s-${e.status}">${STATUS[e.status]}</span> ${m.b.length} blanks</span>${pips(e.state.box)}</span></button>`}).join('')||'<p class="help">Nothing matches this filter.</p>';
  $('#grid').querySelectorAll('.sc').forEach(b=>b.onclick=()=>go(b.dataset.id));
}

/* ───────── syntax highlight ───────── */
const RX={
  pwsh:/(?<c>#.*$)|(?<s>"(?:[^"\\]|\\.)*"|'[^']*')|(?<v>\$[A-Za-z_][\w.]*)|(?<p>(?<=^|\s)-[A-Za-z][\w]*(?::\$\w+)?)|(?<m>\b[A-Z][a-z]+-[A-Z][A-Za-z]+\b)|(?<n>\b\d+(?:\.\d+)*\b)/gm,
  azcli:/(?<c>(?<=^|\s)#.*$)|(?<k>"(?:[^"\\]|\\.)*"(?=\s*:))|(?<s>"(?:[^"\\]|\\.)*"|'[^']*')|(?<v>\$[A-Za-z_]\w*)|(?<p>(?<=^|\s)--?[A-Za-z][\w-]*)|(?<m>\b(?:az|azcopy)\b(?: [a-z][a-z0-9-]*)*)|(?<w>\b(?:for|in|do|done|cat|EOF)\b)|(?<n>\b\d+(?:\.\d+)*\b)/gm,
  bicep:/(?<c>\/\/.*$)|(?<s>'(?:[^'\\]|\\.)*')|(?<w>\b(?:targetScope|param|var|resource|module|output|existing|true|false)\b)|(?<m>\b(?:resourceGroup|subscription)\(\))|(?<n>\b\d+\b)/gm,
  json:/(?<k>"(?:[^"\\]|\\.)*"(?=\s*:))|(?<s>"(?:[^"\\]|\\.)*")|(?<n>\b\d+\b)/gm,
  kql:/(?<c>\/\/.*$)|(?<s>"(?:[^"\\]|\\.)*")|(?<w>\b(?:where|summarize|project|order|by|extend|asc|desc|and|or)\b)|(?<m>\b(?:ago|max|min|count|avg|bin|now)\b)|(?<n>\b\d+[dhm]?\b)/gm
};
const CLS={c:'t-c',s:'t-s',k:'t-k',v:'t-v',p:'t-p',m:'t-m',n:'t-n',w:'t-w'};
function hl(text,lang){
  const re=RX[lang];if(!re)return esc(text);re.lastIndex=0;let out='',last=0,mm;
  while((mm=re.exec(text))){if(mm[0]===''){re.lastIndex++;continue}out+=esc(text.slice(last,mm.index));const g=Object.keys(mm.groups).find(k=>mm.groups[k]!==undefined);out+=`<span class="${CLS[g]}">${esc(mm[0])}</span>`;last=mm.index+mm[0].length}
  return out+esc(text.slice(last));
}

/* ───────── play ───────── */
let P=null; // current play state
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const answersOf=b=>Array.isArray(b.a)?b.a:[b.a];
const tagOf=(m,b)=>b.t||m.tags[0];

function startPlay(m,dn){
  st=load();
  P={m,dn:dn||0,fix:m.mode==='fix',xp:0,combo:0,best:0,misses:0,missed:[],finished:false,
     toks:m.b.map(b=>{const ans=answersOf(b);const opts=[...new Set([...ans,...(b.bug?[b.bug]:[]),...b.o])];return {val:m.mode==='fix'?(b.bug||ans[0]):null,done:false,verified:false,miss:0,opts:shuffle(opts),struck:new Set()}})};
  const run=getRun();
  document.title=`${m.title} · Complete the Script`;
  $('#crumbScript').classList.remove('hidden');$('#crumbTitle').textContent=m.title;
  $('#pEyebrow').textContent=(m.mode==='fix'?'Fix the script':'Complete the script')+' · '+m.domains.map(d=>DOM_SHORT[d]).join(' + ');
  $('#pTitle').textContent=m.title;
  const ms=C.missionState(st,m.id),status=C.status(st,m.id);
  $('#pTags').innerHTML=`<span class="tag l-${m.lang}">${LANG[m.lang]}</span><span class="tag m-${m.mode}">${m.mode==='fix'?'Fix the script':'Fill the blanks'}</span><span class="tag s-${status}">${STATUS[status]}</span>${pips(ms.box)}${m.recurring?'<span class="tag hot">🔥 Repeat-miss concept</span>':''}`;
  const bugs=m.b.filter(b=>b.bug).length;
  const noun={azcli:'Azure CLI script',pwsh:'PowerShell script',bicep:'Bicep file',json:'ARM template',kql:'KQL query'}[m.lang]||'script';
  const q=P.fix?`The ${noun} doesn’t meet the requirements. Which ${bugs===1?'token':bugs+' tokens'} should you change?`:`How should you complete the ${noun} to meet the requirements?`;
  $('#pBrief').innerHTML=`<p class="scen">${m.scenario}</p><p class="ask">${m.ask||'You need to ensure that the solution meets the following requirements:'}</p>${(m.req||[]).length?`<ul class="req">${m.req.map(r=>`<li>${r}</li>`).join('')}</ul>`:''}<p class="q">${q}</p><p class="instr">${P.fix?`Select any dotted token to change it. Changing a token that was already right counts as a miss.`:`Select the correct option in each blank. Each blank is scored on its own.`}</p>`;
  $('#pSymptom').innerHTML=P.fix&&m.symptom?`<div class="symptom"><header>✗ What happened when it ran</header><pre>${esc(m.symptom)}</pre></div>`:'';
  $('#pFile').textContent=m.file;$('#pLang').textContent=LANG[m.lang];
  $('#pConcepts').innerHTML=m.tags.map(t=>`<span class="${heat(t)>=3?'h':''}" title="${esc(D.concepts[t].src)}">${esc(D.concepts[t].label)}</span>`).join('');
  $('#pLearn').innerHTML=m.learn.map(([l,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(l)}</a></li>`).join('');
  $('#pHint').disabled=false;
  feedback('',P.fix?'Read the symptom, then find the tokens that cause it.':'Pick a blank to start. Every choice is checked instantly.');
  $('#pTerm').classList.add('hidden');$('#pOut').textContent='';$('#pDone').innerHTML='';
  if(run&&run.ids.includes(m.id)){$('#pRunCard').classList.remove('hidden');$('#pRun').innerHTML=`<ol style="margin:0;padding-left:1.1rem;font-size:.85rem">${run.ids.map((id,i)=>`<li style="${id===m.id?'font-weight:700':i<run.i?'color:var(--muted);text-decoration:line-through':''}">${esc(byId[id].title)}</li>`).join('')}</ol>`}else $('#pRunCard').classList.add('hidden');
  const di=P.dn?P.dn-1:-1;$('#pLayout').classList.toggle('with-rail',di>=0);$('#pRail').classList.toggle('hidden',di<0);
  if(di>=0){$('#pEyebrow').textContent=`Study drill #${P.dn} of ${N} · `+$('#pEyebrow').textContent;$('#pRunCard').classList.add('hidden');renderRail(di)}
  renderCode();updateStats();topBar();
  window.scrollTo({top:0});
}

function tokenHTML(i){
  const t=P.toks[i],b=P.m.b[i];
  const longest=Math.max(...t.opts.map(o=>o.length));
  if(t.done)return `<button class="tok ${t.verified?'verified':'ok'}" data-i="${i}" aria-label="Blank ${i+1}: ${esc(t.val)} (locked)" disabled>${esc(t.val)}</button>`;
  if(P.fix)return `<button class="tok fixme" data-i="${i}" aria-haspopup="listbox" aria-label="Token ${i+1}: ${esc(t.val)}. Select to change">${esc(t.val)}<span class="car" aria-hidden="true">▾</span></button>`;
  return `<button class="tok empty" data-i="${i}" style="--w:${Math.min(Math.max(longest,6),34)}ch" aria-haspopup="listbox" aria-label="Blank ${i+1} of ${P.m.b.length}, empty. Select to choose">${i+1}<span class="car" aria-hidden="true">▾</span></button>`;
}
function renderCode(){
  const m=P.m;
  $('#pCode').innerHTML=m.code.split('\n').map(line=>{
    const parts=line.split(/(\{\{\d+\}\})/);
    return `<div class="ln">${parts.map(p=>{const k=p.match(/^\{\{(\d+)\}\}$/);return k?tokenHTML(+k[1]-1):hl(p,m.lang)}).join('')||' '}</div>`;
  }).join('');
  $('#pCode').querySelectorAll('.tok:not([disabled])').forEach(el=>el.onclick=e=>{e.stopPropagation();openMenu(+el.dataset.i,el)});
}
function updateStats(){
  const m=P.m,left=P.fix?m.b.filter((b,i)=>b.bug&&!P.toks[i].done).length:P.toks.filter(t=>!t.done).length;
  const total=P.fix?m.b.filter(b=>b.bug).length:m.b.length;
  $('#sLeft').textContent=left;$('#sLeftL').textContent=P.fix?'Bugs left':'Blanks left';$('#sXp').textContent=P.xp;$('#sCombo').textContent=P.combo?`×${P.combo}`:'0';
  $('#sProg').max=total;$('#sProg').value=total-left;
  $('#sMiss').textContent=P.misses?`${P.misses} miss${P.misses>1?'es':''} this run: no clean-run bonus, and the level resets to 0.`:'No misses yet: a clean run earns +25 XP and moves the script up a level.';
}
function feedback(kind,html){const f=$('#pFeedback');f.className='feedback'+(kind?' '+kind:'');f.innerHTML=html}

/* menu */
let menuFor=null;
function openMenu(i,el){
  const t=P.toks[i],menu=$('#menu');menuFor=i;
  menu.innerHTML=`<div class="mh">${P.fix?`Token ${i+1}: change to…`:`Blank ${i+1}: choose`}</div>`+t.opts.map(o=>`<button role="option" data-v="${esc(o)}" class="${o===t.val?'cur':''}${t.struck.has(o)?' struck':''}">${esc(o)}</button>`).join('');
  menu.classList.remove('hidden');
  const r=el.getBoundingClientRect(),mw=Math.min(menu.offsetWidth,window.innerWidth-16);
  menu.style.left=Math.max(8,Math.min(r.left+window.scrollX,window.scrollX+window.innerWidth-mw-8))+'px';
  menu.style.top=(r.bottom+window.scrollY+6)+'px';
  const btns=[...menu.querySelectorAll('button')];
  btns.forEach((b,k)=>{b.onclick=e=>{e.stopPropagation();closeMenu();pick(i,b.dataset.v)};b.onkeydown=e=>{
    if(e.key==='ArrowDown'){e.preventDefault();btns[(k+1)%btns.length].focus()}
    else if(e.key==='ArrowUp'){e.preventDefault();btns[(k-1+btns.length)%btns.length].focus()}
    else if(e.key==='Escape'){e.preventDefault();closeMenu(true)}
    else if(e.key==='Tab'){closeMenu()}}});
  (btns.find(b=>!b.classList.contains('struck'))||btns[0]).focus();
}
function closeMenu(refocus){const menu=$('#menu');if(menu.classList.contains('hidden'))return;menu.classList.add('hidden');if(refocus&&menuFor!=null){const el=$(`#pCode .tok[data-i="${menuFor}"]`);el&&el.focus()}menuFor=null}
document.addEventListener('click',e=>{if(!e.target.closest('#menu'))closeMenu()});
window.addEventListener('resize',()=>closeMenu());

function concept(tag,hit){const c=st.concepts[tag]||(st.concepts[tag]={miss:0,hit:0});hit?c.hit++:c.miss++}
function miss(i,v,msg){
  const m=P.m,b=m.b[i],t=P.toks[i];
  t.miss++;P.misses++;P.combo=0;concept(tagOf(m,b),false);P.missed.push(`#${i+1} ${v}`);
  const k=m.id+':'+(i+1);st.blanks[k]=(st.blanks[k]||0)+1;save();
  const reason=(b.w&&b.w[v])||'That doesn’t do what the brief asks.';
  feedback('bad',`<span class="lbl">✗ <code>${esc(v)}</code></span>${msg?esc(msg)+' ':''}${reason} <a href="${esc(m.learn[0][1])}" target="_blank" rel="noopener noreferrer">Learn ↗</a>`);
}
function flash(i){const el=$(`#pCode .tok[data-i="${i}"]`);if(!el)return;el.classList.remove('bad');void el.offsetWidth;el.classList.add('bad');setTimeout(()=>{el.classList.remove('bad');el.focus()},700)}
function award(i,base){
  P.combo++;P.best=Math.max(P.best,P.combo);let gain=base;if(P.combo%3===0)gain+=5;P.xp+=gain;
  if(!P.toks[i].miss)concept(tagOf(P.m,P.m.b[i]),true);save();return gain;
}
function pick(i,v){
  if(P.finished)return;
  const m=P.m,b=m.b[i],t=P.toks[i],ans=answersOf(b);
  if(t.done)return;
  if(P.fix&&v===t.val)return;
  let ok=ans.includes(v),dupe=false;
  if(ok&&b.grp){dupe=P.toks.some((o,j)=>j!==i&&m.b[j].grp===b.grp&&o.done&&o.val===v);if(dupe)ok=false}
  if(P.fix&&!b.bug){ /* decoy: it was already right */
    miss(i,v,'This token was already right.');t.done=true;t.verified=true;t.val=ans[0];
    renderCode();flash(i);updateStats();return;
  }
  if(ok){
    t.val=v;t.done=true;const gain=award(i,P.fix?15:10);
    feedback('good',`<span class="lbl">✓ <code>${esc(v)}</code></span>${b.why} <span style="color:var(--muted)">+${gain} XP${P.combo>=3?` · combo ×${P.combo}`:''}</span>`);
    renderCode();updateStats();
    const next=P.fix?null:P.toks.findIndex(o=>!o.done);
    if(isComplete())finish();else if(next!=null&&next>=0){const el=$(`#pCode .tok[data-i="${next}"]`);el&&el.focus()}
  }else{
    if(dupe){t.miss++;P.misses++;P.combo=0;P.missed.push(`#${i+1} ${v} (dupe)`);feedback('bad',`<span class="lbl">✗ <code>${esc(v)}</code></span>Already used in the other blank. Pick its partner.`);save()}
    else miss(i,v);
    renderCode();flash(i);updateStats();
  }
}
function isComplete(){return P.m.b.every((b,i)=>P.fix?(!b.bug||P.toks[i].done):P.toks[i].done)}

$('#pHint').onclick=()=>{
  if(!P||P.finished)return;const m=P.m;
  const i=P.toks.findIndex((t,k)=>!t.done&&(!P.fix||m.b[k].bug));if(i<0)return;
  const t=P.toks[i],b=m.b[i];t.miss++;P.misses++;P.combo=0;P.missed.push(`#${i+1} hint`);concept(tagOf(m,b),false);save();
  if(P.fix){renderCode();const el=$(`#pCode .tok[data-i="${i}"]`);el.classList.add('suspect');el.closest('.ln').classList.add('hl');el.focus();feedback('bad',`<span class="lbl">💡 Hint</span>Token ${i+1} is one of the bugs. Think about: ${esc((D.concepts[tagOf(m,b)]||{}).label||'')}.`)}
  else{const ans=answersOf(b);const wrong=t.opts.filter(o=>!ans.includes(o)&&!t.struck.has(o));shuffle(wrong).slice(0,Math.max(1,Math.floor(wrong.length/2))).forEach(o=>t.struck.add(o));renderCode();const el=$(`#pCode .tok[data-i="${i}"]`);el.focus();feedback('bad',`<span class="lbl">💡 Hint</span>Some wrong options are crossed out in blank ${i+1}.`)}
  updateStats();
};

function finish(){
  P.finished=true;const m=P.m,clean=P.misses===0;
  if(clean)P.xp+=25;
  st=load();
  const before=C.missionState(st,m.id).box;
  const rec=C.recordRun(st,m.id,P.misses,P.xp);
  if(P.dn){const d=drill(),prev=d.res[m.id];d.res[m.id]=clean?(prev==='miss'||prev==='fixed'?'fixed':'clean'):'miss';d.pos=P.dn%N}
  save();if(P.dn)renderRail(P.dn-1);topBar();updateStats();
  if(LS){const scored=P.toks.filter((t,k)=>!P.fix||m.b[k].bug);LS.logRun({gameId:'cts',id:m.id,title:m.title,mode:m.mode,lang:LANG[m.lang],domain:DOM[m.domains[0]],domains:m.domains.map(d=>DOM[d]).join(', '),concepts:m.tags.join(', '),blanks:m.b.length,misses:P.misses,clean,xp:P.xp,level:rec.box,due:rec.due,missed:P.missed.join('; '),score:Math.round(scored.filter(t=>!t.miss).length/Math.max(scored.length,1)*100)})}
  $('#pHint').disabled=true;
  feedback('good',`<span class="lbl">▶ Running ${esc(m.file)}…</span>`);
  const term=$('#pTerm'),out=$('#pOut');term.classList.remove('hidden');out.innerHTML='';
  const prompt=m.lang==='pwsh'?'PS /home/lab> ':m.lang==='kql'?'Logs ▸ Run query':m.lang==='bicep'||m.lang==='json'?'$ az deployment group create …':'$ bash '+m.file;
  const lines=[`<span class="pr">${esc(prompt)}</span>${m.lang==='pwsh'?'./'+esc(m.file):''}`,...m.out.map(esc)];
  let k=0;const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick=()=>{out.innerHTML+=(k?'\n':'')+lines[k];k++;if(k<lines.length)setTimeout(tick,reduce?0:160);else done()};
  tick();
  function done(){
    out.innerHTML+=`\n<span class="ok">✓ exit 0</span>`;
    const run=getRun();let nextId=null,nextDn=0;
    if(P.dn){const t=dTarget(P.dn%N);if(t>=0)nextDn=t+1}
    else if(run&&run.ids[run.i]===m.id){run.i++;setRun(run);nextId=run.ids[run.i]||null}
    else{const r=rank().find(e=>e.mission.id!==m.id&&(e.status==='new'||e.status==='due'));nextId=r?r.mission.id:null}
    const due=rec.due,lvl=Math.min(rec.box,C.MASTER_BOX);
    const sched=clean?(lvl>=C.MASTER_BOX?`Mastered 🎉 Next spaced review on ${due}.`:rec.box>before?`Level ${lvl}/${C.MASTER_BOX}. Back for review on ${due}.`:`Already promoted today; review on ${due}.`):`Level reset to 0. This script and its concepts move up your queue.`;
    $('#pDone').innerHTML=`<div class="done-panel ${clean?'':'miss'}"><h2 style="margin:0">${clean?'Clean run ✓':'Script complete'}: +${P.xp} XP</h2>
      <p style="margin:.3rem 0 0;color:var(--muted)">${P.misses} miss${P.misses===1?'':'es'} · best combo ×${P.best} · ${esc(sched)}</p>
      <ul class="recap">${m.b.map((b,i)=>{const t=P.toks[i];return `<li class="${t.miss?'missed':''}"><b>${i+1}.</b> <code>${esc(t.val)}</code> ${b.why}${t.miss?` <span style="color:var(--red)">(${t.miss} miss${t.miss>1?'es':''})</span>`:''}</li>`}).join('')}</ul>
      <div class="actions">${nextDn?`<button class="btn" id="dNext">${dres(nextDn-1)==='miss'?'Retry':'Next:'} #${nextDn} ${esc(byId[ORDER[nextDn-1]].title)} →</button>`:P.dn?`<span class="tag s-mastered" style="align-self:center">Drill cleared ✓</span>`:nextId?`<button class="btn" id="dNext">${run&&run.ids.includes(nextId)?'Next in run':'Next script'} →</button>`:''}<button class="btn sec" id="dAgain">Replay</button><button class="btn sec" id="dBoard">All scripts</button></div></div>`;
    if(nextDn)$('#dNext').onclick=()=>goDrill(nextDn);else if(nextId)$('#dNext').onclick=()=>go(nextId);
    $('#dAgain').onclick=()=>startPlay(m,P.dn);$('#dBoard').onclick=()=>go(null);
    ($('#dNext')||$('#dBoard')).focus({preventScroll:true});
    $('#pDone').scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});
  }
}

/* ───────── routing ───────── */
function go(id){location.hash=id?'s='+encodeURIComponent(id):''}
function route(){
  closeMenu();
  const h=location.hash.slice(1),id=h.startsWith('s=')?decodeURIComponent(h.slice(2)):null;
  if(h.startsWith('d=')){const n=Math.min(Math.max(parseInt(h.slice(2),10)||1,1),N);st=load();drill().pos=n-1;save();$('#board').classList.add('hidden');$('#play').classList.remove('hidden');startPlay(byId[ORDER[n-1]],n);return}
  if(h==='run'){let r=getRun();if(!r||r.i>=r.ids.length){r={day:C.today(),ids:todayRun(),i:0};setRun(r)}go(r.ids[r.i]);return}
  if(id&&byId[id]){$('#board').classList.add('hidden');$('#play').classList.remove('hidden');startPlay(byId[id])}
  else{$('#play').classList.add('hidden');$('#board').classList.remove('hidden');P=null;renderBoard()}
}
window.addEventListener('hashchange',route);
$('#pBack').onclick=()=>go(null);
$('#crumbBoard').onclick=e=>{e.preventDefault();go(null)};

/* tools */
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({kind:'az104-cts',version:1,exported:new Date().toISOString(),state:load()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`complete-the-script-${C.today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('#importBtn').onclick=()=>$('#importFile').click();
$('#importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(j.kind!=='az104-cts'||!j.state||typeof j.state!=='object')throw 0;C.save(D.id,j.state);renderBoard()}catch{alert('That file is not a Complete the Script export.')}e.target.value=''};
let armed=null;$('#resetAll').onclick=()=>{const b=$('#resetAll');if(armed){clearTimeout(armed);armed=null;const all=C.loadAll();delete all[D.id];C.saveAll(all);setRun(null);b.textContent='Reset';renderBoard();return}b.textContent='Click again to erase';armed=setTimeout(()=>{armed=null;b.textContent='Reset'},3000)};

if(LS){LS.mount($('#syncHost'),{onPull:g=>{if(!g.has('cts')&&!g.has('nov25'))return;st=load();if(!P)renderBoard();else topBar()}});LS.auto()}
route();
})();

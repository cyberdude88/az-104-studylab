/* Practice Test: exam-style items, adaptive selection, live competency HUD.
   Bank: practice/core.js + practice/bank-*.js · model: practice/model.js · spec: docs/PRACTICE_TEST_DESIGN.md */
(function(){
const C=window.BenchCore,PT=window.PT,M=window.PTModel,D=window.CTS_DECK||{concepts:{}},LS=window.LabSync;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const strip=s=>String(s).replace(/<[^>]+>/g,'');
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const DOMS=Object.keys(PT.domains);
const MODES={adaptive:'Adaptive',ongoing:'Ongoing',exam:'Exam simulation',case:'Case study'};
const TYPES={single:'Choose one',multi:'Choose several',yesno:'Yes / No',order:'Put in order',code:'Finish the script',dropdown:'Complete the settings',case:'Case study parts'};
const LANG={azcli:'Azure CLI',pwsh:'PowerShell',bicep:'Bicep',json:'ARM JSON',kql:'KQL'};
const FILE={azcli:'deploy.azcli',pwsh:'deploy.ps1',bicep:'main.bicep',json:'azuredeploy.json',kql:'query.kql'};
const ATT='pt.attempt',LAST='pt.last';

/* ───────── bank ───────── */
const units=[],byId={};
PT.items.forEach(it=>{
  if(it.type==='case'){
    const parts=it.parts.map((p,i)=>({...p,id:`${it.id}-p${i+1}`,caseId:it.id,learn:p.learn||it.learn||[]}));
    parts.forEach(p=>byId[p.id]=p);units.push({id:it.id,kind:'case',item:it,parts});byId[it.id]=it;
  }else{units.push({id:it.id,kind:'item',item:it});byId[it.id]=it}
});
const unitById=Object.fromEntries(units.map(u=>[u.id,u]));
const scored=units.reduce((a,u)=>a+(u.kind==='case'?3:1),0);
const domOf=it=>(PT.objectives[it.obj]||{}).d;

let s=M.load();
const save=()=>M.save(s);

/* ───────── heat (shared with Complete the Script + Sheet priorities) ───────── */
function heat(tag){
  if(LS&&LS.ignored(tag))return -1;
  const c=D.concepts[tag]||{w:1},l=((C.load('cts').concepts)||{})[tag]||{miss:0,hit:0};
  return Math.max(.3,(c.w||1)+l.miss*1.5-l.hit*.4+(LS?LS.prioBonus(tag):0));
}
function heatF(it){const hs=it.tags.map(heat);if(hs.every(h=>h<0))return .3;return 1+.12*Math.max(...hs)}
function concept(tags,score){const cs=C.load('cts');cs.concepts=cs.concepts||{};tags.forEach(t=>{const c=cs.concepts[t]||(cs.concepts[t]={miss:0,hit:0});score>=1?c.hit++:c.miss++});C.save('cts',cs)}

/* ───────── selection ───────── */
const daysSince=d=>d?Math.round((Date.now()-new Date(d+'T12:00:00'))/86400000):999;
function fresh(id){
  const r=s.items[id];if(!r)return 1.25;
  const d=daysSince(r.last);
  if(r.s>=1)return d<3?.12:1;
  return d<1?.3:1.4;
}
function itemWeight(it,prevType){
  const o=s.obj[it.obj];if(!o)return 0;
  const P=M.prob(o.th,it.diff),inf=P*(1-P);
  const weak=Math.max(0,700-M.scaled(o.th))/200;
  const a=M.fmtAcc(s,it.type),fmtF=1+(1-(a==null?.5:a))*.8;
  return inf*(1+weak)*heatF(it)*fmtF*fresh(it.id)*(it.type===prevType?.55:1);
}
function ongoingWeight(it,prevType,A){
  const d=domOf(it),done=A.seq.filter(p=>domOf(byId[p.iid])===d).length,tot=A.seq.length||1;
  const deficit=Math.max(0,PT.domains[d].w-done/tot);
  return (.6+heatF(it)*.2)*fresh(it.id)*(1+deficit*4)*(it.type===prevType?.4:1);
}
function pickUnit(A){
  const used=new Set(A.seq.map(p=>p.unit));
  const prev=A.seq.length?byId[A.seq[A.seq.length-1].iid].type:null;
  const caseDue=A.seq.length>=5&&!A.seq.slice(-8).some(p=>p.caseId);
  const cand=units.filter(u=>!used.has(u.id)&&(u.kind==='item'||caseDue)).map(u=>{
    const its=u.kind==='case'?u.parts:[u.item];
    let w=its.reduce((a,it)=>a+(A.mode==='ongoing'?ongoingWeight(it,prev,A):itemWeight(it,prev)),0)/its.length;
    if(u.kind==='case')w*=.9;
    return {u,w};
  }).filter(x=>x.w>0).sort((a,b)=>b.w-a.w);
  if(!cand.length){A.seq.forEach(p=>used.delete(p.unit));return units.length?rnd(units):null}
  const top=cand.slice(0,4),sum=top.reduce((a,x)=>a+x.w,0);let r=Math.random()*sum;
  for(const x of top){r-=x.w;if(r<=0)return x.u}
  return top[0].u;
}
function examUnits(){
  const cases=units.filter(u=>u.kind==='case');
  const cs=cases.length?cases.sort((a,b)=>(s.items[a.parts[0].id]?1:0)-(s.items[b.parts[0].id]?1:0)||Math.random()-.5)[0]:null;
  const want=50-(cs?3:0),W=DOMS.reduce((a,d)=>a+PT.domains[d].w,0);
  const per=Object.fromEntries(DOMS.map(d=>[d,Math.round(want*PT.domains[d].w/W)]));
  const out=[];
  DOMS.forEach(d=>{
    const pool=shuffle(units.filter(u=>u.kind==='item'&&domOf(u.item)===d)).sort((a,b)=>(fresh(b.id)>=1?1:0)-(fresh(a.id)>=1?1:0));
    out.push(...pool.slice(0,per[d]));
  });
  const rest=shuffle(units.filter(u=>u.kind==='item'&&!out.includes(u)));
  while(out.length<want&&rest.length)out.push(rest.pop());
  const list=shuffle(out);if(cs)list.push(cs);
  return list;
}

/* ───────── presentation (rewording + shuffles) ───────── */
function makeVars(...its){
  const [org,dns]=rnd(PT.pools.org),pp=shuffle(PT.pools.person),[region,region2]=rnd(PT.pools.region);
  const v={org,dns,person:pp[0],person2:pp[1],region,region2};
  its.forEach(it=>Object.entries((it&&it.vars)||{}).forEach(([k,xs])=>{if(!(k in v))v[k]=rnd(xs)}));
  return v;
}
const sub=(t,v)=>String(t).replace(/%([a-z0-9]+)%/g,(m,k)=>k in v?v[k]:m);
function present(u){
  const its=u.kind==='case'?u.parts:[u.item];
  const v=makeVars(u.kind==='case'?u.item:null,...its);
  return its.map((it,pi)=>{
    const p={iid:it.id,unit:u.id,vars:v};
    if(u.kind==='case'){p.caseId=u.id;p.part=pi+1}
    if(it.type==='single'||it.type==='multi')p.perm=shuffle(it.opts.map((_,i)=>i));
    if(it.type==='order')p.perm=shuffle(it.cards.map((_,i)=>i));
    if(it.type==='code'||it.type==='dropdown')p.bperm=it.b.map(b=>shuffle(b.o.map((_,i)=>i)));
    return p;
  });
}

/* ───────── scoring ───────── */
function blankResp(it){return it.type==='multi'||it.type==='order'?[]:it.type==='yesno'?[null,null,null]:it.type==='code'||it.type==='dropdown'?it.b.map(()=>null):null}
function complete(it,v){
  if(v==null)return false;
  if(it.type==='single')return Number.isInteger(v);
  if(it.type==='multi')return v.length===it.a.length;
  if(it.type==='order')return v.length===it.seq.length;
  return v.every(x=>x!=null);
}
function started(it,v){if(v==null)return false;if(Array.isArray(v))return v.some(x=>x!=null);return true}
function score(it,v){
  if(!started(it,v))return 0;
  switch(it.type){
    case 'single':return v===it.a?1:0;
    case 'multi':{const h=v.filter(x=>it.a.includes(x)).length,w=v.length-h;return Math.max(0,(h-w)/it.a.length)}
    case 'yesno':return it.stmts.filter((st,i)=>v[i]===st[1]).length/3;
    case 'order':{
      if(it.any){const h=v.filter(x=>it.seq.includes(x)).length,w=v.length-h;return Math.max(0,(h-w)/it.seq.length)}
      return it.seq.filter((x,i)=>v[i]===x).length/it.seq.length;
    }
    default:return it.b.filter((b,i)=>v[i]===b.a).length/it.b.length;
  }
}

/* ───────── syntax highlight (same palette as Complete the Script) ───────── */
const RX={
  pwsh:/(?<c>#.*$)|(?<s>"(?:[^"\\]|\\.)*"|'[^']*')|(?<v>\$[A-Za-z_][\w.]*)|(?<p>(?<=^|\s)-[A-Za-z][\w]*(?::\$\w+)?)|(?<m>\b[A-Z][a-z]+-[A-Z][A-Za-z]+\b)|(?<n>\b\d+(?:\.\d+)*\b)/gm,
  azcli:/(?<c>(?<=^|\s)#.*$)|(?<s>"(?:[^"\\]|\\.)*"|'[^']*')|(?<p>(?<=^|\s)--?[A-Za-z][\w-]*)|(?<m>\b(?:az|azcopy)\b(?: [a-z][a-z0-9-]*)*)|(?<n>\b\d+(?:\.\d+)*\b)/gm,
  bicep:/(?<c>\/\/.*$)|(?<s>'(?:[^'\\]|\\.)*')|(?<w>\b(?:targetScope|param|var|resource|module|output|existing|for|in|if|true|false|null)\b)|(?<m>\b(?:resourceGroup|subscription|managementGroup|tenant|guid|uniqueString|concat|format|resourceId|extensionResourceId|subscriptionResourceId)\()|(?<n>\b\d+\b)/gm,
  json:/(?<k>"(?:[^"\\]|\\.)*"(?=\s*:))|(?<s>"(?:[^"\\]|\\.)*")|(?<w>\b(?:true|false|null)\b)|(?<n>-?\b\d+\b)/gm,
  kql:/(?<c>\/\/.*$)|(?<s>"(?:[^"\\]|\\.)*"|'[^']*')|(?<w>\b(?:where|summarize|project|project-away|order|sort|by|extend|take|top|join|kind|on|render|let|asc|desc|and|or|has|contains|in|between|distinct|count)\b)|(?<m>\b(?:ago|max|min|count|countif|avg|sum|bin|now|arg_max|arg_min|dcount|make_set|startofday|datetime|timespan)\b)|(?<n>\b\d+[dhms]?\b)/gm
};
const CLS={c:'t-c',s:'t-s',k:'t-k',v:'t-v',p:'t-p',m:'t-m',n:'t-n',w:'t-w'};
function hl(text,lang){
  const re=RX[lang];if(!re)return esc(text);re.lastIndex=0;let out='',last=0,mm;
  while((mm=re.exec(text))){if(mm[0]===''){re.lastIndex++;continue}out+=esc(text.slice(last,mm.index));const g=Object.keys(mm.groups).find(k=>mm.groups[k]!==undefined);out+=`<span class="${CLS[g]}">${esc(mm[0])}</span>`;last=mm.index+mm[0].length}
  return out+esc(text.slice(last));
}

/* ───────── render one question ───────── */
function blankSel(it,p,i,v,reveal,prose){
  const b=it.b[i],cur=v[i];
  const cls=reveal?(cur===b.a?'right':'wrong'):'';
  const opts=p.bperm[i].map(k=>`<option value="${k}"${cur===k?' selected':''}>${esc(sub(b.o[k],p.vars))}</option>`).join('');
  return `<select class="blank ${cls}" data-b="${i}" aria-label="Blank ${i+1}"${reveal?' disabled':''}><option value=""${cur==null?' selected':''}>${prose?'Select…':'▾ '+(i+1)}</option>${opts}</select>${reveal&&cur!==b.a?`<span class="fix">→ ${esc(sub(b.o[b.a],p.vars))}</span>`:''}`;
}
function answerHTML(it,p,v,reveal){
  const V=x=>sub(x,p.vars);
  if(it.type==='single'||it.type==='multi'){
    const multi=it.type==='multi',full=multi&&v.length>=it.a.length;
    return `<div class="opts" role="${multi?'group':'radiogroup'}">${p.perm.map(k=>{
      const on=multi?v.includes(k):v===k,ok=multi?it.a.includes(k):it.a===k;
      const cls=reveal?(on&&ok?'right':on&&!ok?'wrong':ok?'missed':''):on?'sel':'';
      return `<label class="opt ${cls}"><input type="${multi?'checkbox':'radio'}" name="opt" value="${k}"${on?' checked':''}${reveal||(multi&&full&&!on)?' disabled':''}><span>${V(it.opts[k])}</span></label>`}).join('')}</div>`;
  }
  if(it.type==='yesno'){
    return `<table class="yn"><thead><tr><th>Statement</th><th class="c">Yes</th><th class="c">No</th></tr></thead><tbody>${it.stmts.map((st,i)=>{
      const cls=reveal?(v[i]===st[1]?'right':'wrong'):'';
      return `<tr class="${cls}"><td>${V(st[0])}${reveal?`<span class="why"><b>${st[1]?'Yes':'No'}.</b> ${V(st[2])}</span>`:''}</td>${[true,false].map(x=>`<td class="c"><input type="radio" name="yn${i}" data-i="${i}" value="${x}" aria-label="${x?'Yes':'No'}: statement ${i+1}"${v[i]===x?' checked':''}${reveal?' disabled':''}></td>`).join('')}</tr>`}).join('')}</tbody></table>`;
  }
  if(it.type==='order'){
    const avail=p.perm.filter(k=>!v.includes(k));
    const card=(k,inArea,pos)=>{
      const cls=reveal&&inArea?((it.any?it.seq.includes(k):it.seq[pos]===k)?'right':'wrong'):'';
      const ctl=reveal?'':inArea?`<span class="ctl"><button data-up="${k}" aria-label="Move up">↑</button><button data-dn="${k}" aria-label="Move down">↓</button><button data-rm="${k}" aria-label="Remove">✕</button></span>`:`<span class="ctl"><button data-add="${k}" aria-label="Add to answer area">→</button></span>`;
      return `<li class="ocard ${cls}" draggable="${!reveal}" data-k="${k}"><span>${V(it.cards[k])}</span>${ctl}</li>`;
    };
    return `<div class="order"><div><h3>Actions</h3><ul class="olist src" data-list="src">${avail.map(k=>card(k,false)).join('')}</ul></div><div><h3>Answer area${it.any?' (any order)':''}</h3><ol class="olist area" data-list="area">${v.map((k,i)=>card(k,true,i)).join('')}</ol></div></div>
      ${reveal?`<div class="fb-seq"><b>Correct ${it.any?'set':'order'}:</b><ol class="seq">${it.seq.map(k=>`<li>${V(it.cards[k])}</li>`).join('')}</ol></div>`:''}`;
  }
  if(it.type==='code'){
    const src=V(it.code);
    const lines=src.split('\n').map(line=>line.split(/(\{\{\d+\}\})/).map(seg=>{const m=seg.match(/^\{\{(\d+)\}\}$/);return m?blankSel(it,p,+m[1]-1,v,reveal):hl(seg,it.lang)}).join(''));
    return `<div class="editor"><div class="ed-bar"><b>${esc(V(it.file||FILE[it.lang]))}</b><span>${LANG[it.lang]}</span></div><pre class="code">${lines.map(l=>`<span class="ln">${l||' '}</span>`).join('')}</pre></div>`;
  }
  if(it.type==='dropdown'){
    const src=Array.isArray(it.text)?it.text:[it.text];
    return `<div class="prose">${src.map(line=>`<div>${V(line).replace(/\{\{(\d+)\}\}/g,(m,n)=>blankSel(it,p,+n-1,v,reveal,true))}</div>`).join('')}</div>`;
  }
  return '';
}
function askHint(it){
  if(it.type==='multi')return `Select ${it.a.length}.`;
  if(it.type==='order')return it.any?`Move ${it.seq.length} actions to the answer area. Order does not matter.`:`Move ${it.seq.length} actions to the answer area and arrange them in the correct order.`;
  if(it.type==='yesno')return 'For each statement, select Yes if it is true. Otherwise, select No.';
  if(it.type==='code'||it.type==='dropdown')return 'Select the appropriate option in each blank.';
  return '';
}
function questionHTML(it,p,v,reveal){
  const V=x=>sub(x,p.vars),h=askHint(it);
  return `<div class="stem">${it.stem.map(x=>{const t=V(x);return /^\s*<(ul|ol|table|div)/.test(t)?t:`<p>${t}</p>`}).join('')}</div><p class="ask">${V(it.ask)}</p>${h?`<p class="hint">${h}</p>`:''}${answerHTML(it,p,v,reveal)}`;
}
function caseHTML(cs,p,active){
  const V=x=>sub(x,p.vars),tabs=cs.tabs;
  return `<div class="ctabs"><div class="ctitle">Case study · ${esc(V(cs.title))}</div><div role="tablist" aria-label="Case study">${tabs.map(([n],i)=>`<button role="tab" id="ct${i}" aria-controls="cp" aria-selected="${i===active}" data-tab="${i}">${esc(n)}</button>`).join('')}</div>
    <div class="pane" id="cp" role="tabpanel">${tabs[active][1].map(x=>{const t=V(x);return /^\s*<(ul|ol|table|div)/.test(t)?t:`<p>${t}</p>`}).join('')}</div></div>`;
}
function feedbackHTML(it,p,sc,upd){
  const V=x=>sub(x,p.vars),cls=sc>=1?'good':sc>0?'part':'bad';
  const head=sc>=1?'✓ Correct':sc>0?`◐ Partly correct (${Math.round(sc*100)}%)`:'✗ Incorrect';
  const o=PT.objectives[it.obj];
  const mv=upd?`<p class="mv">${esc(PT.domains[o.d].name)} › ${esc(o.name)}: estimate ${upd.before} → <b>${upd.after}</b> (${upd.after-upd.before>=0?'+':''}${upd.after-upd.before})</p>`:'';
  return `<div class="fb ${cls}"><h3>${head}</h3><p>${V(it.why)}</p><p>${(it.learn||[]).map(([l,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(l)} ↗</a>`).join(' · ')}</p>${mv}</div>`;
}

/* ───────── attempt state ───────── */
let A=null,tick=null,caseTab=0;
const getA=()=>{try{return JSON.parse(sessionStorage.getItem(ATT))}catch{return null}};
const putA=()=>{try{A?sessionStorage.setItem(ATT,JSON.stringify(A)):sessionStorage.removeItem(ATT)}catch{}};
const instant=()=>A&&A.mode!=='exam';

function start(mode){
  s=M.load();
  A={id:Date.now().toString(36),mode,start:Date.now(),seq:[],resp:{},sub:{},upd:{},marks:{},i:0,before:M.snapshot(s),notes:(getA()||{}).notes||''};
  if(mode==='exam'){A.deadline=Date.now()+100*60000;examUnits().forEach(u=>A.seq.push(...present(u)))}
  else if(mode==='case'){
    const cases=units.filter(u=>u.kind==='case');if(!cases.length){alertNo();return}
    const u=cases.map(u=>({u,w:u.parts.reduce((a,it)=>a+itemWeight(it,null),0)*(.7+Math.random()*.6)})).sort((a,b)=>b.w-a.w)[0].u;
    A.seq.push(...present(u));
  }else{const u=pickUnit(A);if(!u){alertNo();return}A.seq.push(...present(u))}
  putA();location.hash='test';
}
function alertNo(){$('#bankNote').textContent='No questions available for that mode yet.'}

function cur(){return A.seq[A.i]}
function resp(i){const p=A.seq[i],it=byId[p.iid];if(!(i in A.resp))A.resp[i]=blankResp(it);return A.resp[i]}

function renderTest(){
  if(!endArmed)$('#endBtn').textContent='End';
  const p=cur(),it=byId[p.iid],v=resp(A.i),done=!!A.sub[A.i],reveal=instant()&&done;
  $('#crumbMode').textContent=MODES[A.mode];$('#crumbModeSep').classList.remove('hidden');
  $('#qNum').textContent=`Question ${A.i+1}`;
  $('#qOf').textContent=A.mode==='exam'?`of ${A.seq.length}`:(p.caseId?`· case study part ${p.part} of 3`:'');
  $('#markWrap').classList.toggle('hidden',A.mode!=='exam');$('#mark').checked=!!A.marks[A.i];
  const cs=p.caseId?byId[p.caseId]:null;
  $('#caseBox').innerHTML=cs?caseHTML(cs,p,Math.min(caseTab,cs.tabs.length-1)):'';
  $('#caseBox').querySelectorAll('[role=tab]').forEach(b=>b.onclick=()=>{caseTab=+b.dataset.tab;$('#caseBox').innerHTML=caseHTML(cs,p,caseTab);renderTest()});
  $('#q').innerHTML=questionHTML(it,p,v,reveal);
  $('#fb').innerHTML=reveal?feedbackHTML(it,p,A.sub[A.i].s,A.upd[A.i]):'';
  if(!reveal)wire(it,p);
  renderActions();renderHud();renderNav();
}
function wire(it,p){
  const q=$('#q'),v=resp(A.i),upd=()=>{putA();renderActions();renderNav()};
  if(it.type==='single')q.querySelectorAll('input[name=opt]').forEach(x=>x.onchange=()=>{A.resp[A.i]=+x.value;q.querySelectorAll('.opt').forEach(l=>l.classList.toggle('sel',l.querySelector('input').checked));upd()});
  if(it.type==='multi')q.querySelectorAll('input[name=opt]').forEach(x=>x.onchange=()=>{const k=+x.value,arr=A.resp[A.i];x.checked?arr.includes(k)||arr.push(k):arr.splice(arr.indexOf(k),1);q.innerHTML=questionHTML(it,p,arr,false);wire(it,p);upd();const el=q.querySelector(`input[value="${k}"]`);el&&el.focus()});
  if(it.type==='yesno')q.querySelectorAll('input[type=radio]').forEach(x=>x.onchange=()=>{A.resp[A.i][+x.dataset.i]=x.value==='true';upd()});
  if(it.type==='code'||it.type==='dropdown')q.querySelectorAll('select.blank').forEach(x=>x.onchange=()=>{A.resp[A.i][+x.dataset.b]=x.value===''?null:+x.value;upd()});
  if(it.type==='order'){
    const set=(arr,focus)=>{A.resp[A.i]=arr;q.innerHTML=questionHTML(it,p,arr,false);wire(it,p);upd();if(focus){const el=q.querySelector(focus);el&&el.focus()}};
    q.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const k=+b.dataset.add;if(v.length>=it.seq.length)return;set([...v,k],`[data-rm="${k}"]`)});
    q.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{const k=+b.dataset.rm;set(v.filter(x=>x!==k),`[data-add="${k}"]`)});
    q.querySelectorAll('[data-up],[data-dn]').forEach(b=>b.onclick=()=>{const k=+(b.dataset.up||b.dataset.dn),i=v.indexOf(k),j=i+(b.dataset.up?-1:1);if(j<0||j>=v.length)return;const a=v.slice();[a[i],a[j]]=[a[j],a[i]];set(a,`[data-${b.dataset.up?'up':'dn'}="${k}"]`)});
    q.querySelectorAll('.src .ocard > span:first-child').forEach(el=>el.onclick=()=>{const k=+el.parentElement.dataset.k;if(v.length<it.seq.length)set([...v,k])});
    let drag=null;
    q.querySelectorAll('.ocard').forEach(el=>{el.ondragstart=e=>{drag=+el.dataset.k;el.classList.add('dragging');e.dataTransfer.setData('text/plain',el.dataset.k)};el.ondragend=()=>el.classList.remove('dragging')});
    q.querySelectorAll('.olist').forEach(list=>{
      list.ondragover=e=>{e.preventDefault();list.classList.add('over')};list.ondragleave=()=>list.classList.remove('over');
      list.ondrop=e=>{e.preventDefault();list.classList.remove('over');if(drag==null)return;const k=drag;drag=null;
        if(list.dataset.list==='src'){set(v.filter(x=>x!==k));return}
        const tgt=e.target.closest('.ocard'),a=v.filter(x=>x!==k);if(!v.includes(k)&&v.length>=it.seq.length)return;
        const at=tgt&&+tgt.dataset.k!==k?a.indexOf(+tgt.dataset.k):a.length;a.splice(at<0?a.length:at,0,k);set(a)};
    });
  }
}
function renderActions(){
  const p=cur(),it=byId[p.iid],v=resp(A.i),done=!!A.sub[A.i],el=$('#actions');
  if(A.mode==='exam'){
    el.innerHTML=`<button class="btn sec" id="prevBtn"${A.i===0?' disabled':''}>← Previous</button><span class="sp"></span><button class="btn" id="nextBtn">${A.i===A.seq.length-1?'Review and finish':'Next →'}</button>`;
    $('#prevBtn').onclick=()=>go(A.i-1);$('#nextBtn').onclick=()=>{A.i===A.seq.length-1?confirmEnd(true):go(A.i+1)};
  }else if(!done){
    el.innerHTML=`<button class="btn" id="submitBtn"${complete(it,v)?'':' disabled'}>Submit answer</button><span class="sp"></span><span class="hint" style="margin:0">${complete(it,v)?'':'Answer every part to submit.'}</span>`;
    $('#submitBtn').onclick=submit;
  }else{
    const last=A.mode==='case'&&A.i===A.seq.length-1;
    el.innerHTML=`<button class="btn" id="nextBtn">${last?'See results':'Next question →'}</button>`;
    $('#nextBtn').onclick=()=>last?finish():next();$('#nextBtn').focus({preventScroll:true});
  }
}
function go(i){if(i<0||i>=A.seq.length)return;A.i=i;caseTab=0;putA();renderTest();window.scrollTo({top:0})}

function apply(i){
  const p=A.seq[i],it=byId[p.iid],v=resp(i),sc=score(it,v);
  const u=M.update(s,it.obj,it.diff,sc);
  M.fmtRecord(s,it.type,sc);if(p.caseId)M.fmtRecord(s,'case',sc);
  const r=s.items[it.id]||(s.items[it.id]={n:0,right:0,last:null,s:0});r.n++;if(sc>=1)r.right++;r.last=C.today();r.s=sc;
  concept(it.tags,sc);
  A.sub[i]={s:sc};A.upd[i]=u;
  return u;
}
function submit(){
  const it=byId[cur().iid];if(!complete(it,resp(A.i)))return;
  apply(A.i);save();putA();renderTest();
  const f=$('#fb .fb');f&&f.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function next(){
  if(A.i<A.seq.length-1){go(A.i+1);return}
  const u=pickUnit(A);if(!u){finish();return}
  A.seq.push(...present(u));go(A.seq.length-1);
}

/* ───────── HUD ───────── */
function scaleHTML(score,band){
  const pct=x=>Math.max(0,Math.min(100,(x-100)/9));
  return `<div class="track"></div><div class="bandr" style="left:${pct(score-band)}%;width:${pct(score+band)-pct(score-band)}%"></div><div class="pass"></div><div class="dot" style="left:${pct(score)}%"></div>`;
}
function drowHTML(d,x,short){
  const pct=v=>Math.max(0,Math.min(100,(v-100)/9));
  return `<div class="drow"><span class="nm"><span class="sw" style="background:var(--c-${d})"></span>${esc(short?PT.domains[d].name.split(' ')[0]:PT.domains[d].name)}</span><span class="mbar"><span class="bandr" style="left:${pct(x.score-x.band)}%;width:${pct(x.score+x.band)-pct(x.score-x.band)}%"></span><span class="fill" style="width:${pct(x.score)}%;background:var(--c-${d})"></span><span class="pass"></span></span><span class="v">${x.score}${short?'':`<small>±${x.band}</small>`}</span></div>`;
}
function deltaHTML(a,b){const d=a-b;return `<span class="delta ${d>0?'up':d<0?'down':'flat'}">${d>0?'▲ +':d<0?'▼ ':''}${d}</span>`}
function renderHud(){
  const o=M.overall(s),frozen=A.mode==='exam';
  const shown=frozen?{score:A.before.overall,band:A.before.band}:o;
  const prev=$('#hudScore').textContent;
  $('#hudMode').textContent=MODES[A.mode];
  $('#hudScore').textContent=shown.score;
  if(prev!==String(shown.score)){const el=$('#hudScore').parentElement;el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash')}
  $('#hudDelta').innerHTML=frozen?'':deltaHTML(o.score,A.before.overall);
  $('#hudScale').innerHTML=scaleHTML(shown.score,shown.band);
  $('#hudNote').textContent=frozen?'Estimate updates when you finish, like the real exam.':`±${o.band} band · 700 is the pass line · change this session shown`;
  $('#hudDomains').innerHTML=DOMS.map(d=>drowHTML(d,frozen?{score:A.before.domains[d],band:0}:M.domainScore(s,d),true)).join('');
  const subs=Object.values(A.sub),n=frozen?Object.keys(A.resp).filter(i=>started(byId[A.seq[i].iid],A.resp[i])).length:subs.length;
  const right=subs.filter(x=>x.s>=1).length,sum=subs.reduce((a,x)=>a+x.s,0);
  $('#hudN').textContent=n;$('#hudRight').textContent=frozen?'-':right;$('#hudPct').textContent=frozen||!subs.length?'-':Math.round(sum/subs.length*100)+'%';
  $('#topEst').innerHTML=`Estimated <b>${shown.score}</b> / 1000`;
}
function renderNav(){
  const el=$('#hudNav');
  if(A.mode!=='exam'){el.innerHTML='';return}
  el.innerHTML=A.seq.map((p,i)=>`<button class="${started(byId[p.iid],A.resp[i])?'ans':''} ${A.marks[i]?'mk':''} ${i===A.i?'cur':''}" data-go="${i}" aria-label="Question ${i+1}${A.marks[i]?', marked':''}">${i+1}</button>`).join('');
  el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(+b.dataset.go));
}
function startTimer(){
  clearInterval(tick);
  const f=()=>{
    if(!A){clearInterval(tick);return}
    const t=$('#hudTimer');
    if(A.deadline){const ms=A.deadline-Date.now();if(ms<=0){clearInterval(tick);finish();return}const m=Math.floor(ms/60000),sec=Math.floor(ms/1000)%60;t.textContent=`${m}:${String(sec).padStart(2,'0')} left`;t.classList.toggle('low',ms<10*60000)}
    else{const ms=Date.now()-A.start,m=Math.floor(ms/60000),sec=Math.floor(ms/1000)%60;t.textContent=`${m}:${String(sec).padStart(2,'0')}`}
  };f();tick=setInterval(f,1000);
}

/* ───────── end ───────── */
let endArmed=null;
function confirmEnd(fromNext){
  if(A.mode!=='exam'){finish();return}
  const unans=A.seq.filter((p,i)=>!started(byId[p.iid],A.resp[i])).length,marked=Object.values(A.marks).filter(Boolean).length;
  const b=fromNext?$('#nextBtn'):$('#endBtn');
  if(endArmed){clearTimeout(endArmed);endArmed=null;finish();return}
  b.textContent=`Finish? ${unans} unanswered · ${marked} marked`;endArmed=setTimeout(()=>{endArmed=null;renderActions();$('#endBtn').textContent='End'},4000);
}
function finish(){
  clearInterval(tick);if(endArmed){clearTimeout(endArmed);endArmed=null}$('#endBtn').textContent='End';if(!A)return;
  if(A.mode==='exam')A.seq.forEach((p,i)=>{if(started(byId[p.iid],A.resp[i]))apply(i);else A.sub[i]={s:0,skipped:true}});
  const idx=Object.keys(A.sub).map(Number).sort((a,b)=>a-b);
  const total=A.mode==='exam'?A.seq.length:idx.length;
  const sum=idx.reduce((a,i)=>a+A.sub[i].s,0),right=idx.filter(i=>A.sub[i].s>=1).length;
  const after=M.snapshot(s),pct=total?Math.round(sum/total*100):0;
  if(total){
    s.hist.push({t:new Date().toISOString(),label:MODES[A.mode],...after});if(s.hist.length>200)s.hist=s.hist.slice(-200);
    s.attempts.push({id:A.id,mode:A.mode,start:new Date(A.start).toISOString(),dur:Math.round((Date.now()-A.start)/1000),n:total,right,pct,before:A.before.overall,after:after.overall});
    if(s.attempts.length>100)s.attempts=s.attempts.slice(-100);
    if(!s.days.includes(C.today()))s.days.push(C.today());
  }
  save();
  const res={...A,end:Date.now(),after,total,right,pct};
  try{sessionStorage.setItem(LAST,JSON.stringify(res))}catch{}
  if(total&&LS){
    const missed=idx.filter(i=>A.sub[i].s<1).map(i=>A.seq[i].iid);
    const doms=[...new Set(idx.map(i=>PT.domains[domOf(byId[A.seq[i].iid])].name))];
    LS.logRun({gameId:'pt',id:A.mode,title:`Practice test · ${MODES[A.mode]}`,mode:A.mode,lang:'',domain:doms.length===1?doms[0]:'Mixed',domains:doms.join(', '),
      concepts:[...new Set(missed.flatMap(id=>byId[id].tags))].join(', '),blanks:total,misses:total-right,clean:total>0&&right===total,xp:0,level:0,due:'',missed:missed.join('; '),score:pct,est:after.overall});
  }
  A=null;putA();location.hash='results';
}

/* ───────── results ───────── */
function renderResults(){
  let R;try{R=JSON.parse(sessionStorage.getItem(LAST))}catch{}
  if(!R){location.hash='';return}
  $('#crumbMode').textContent='Results';$('#crumbModeSep').classList.remove('hidden');
  const mins=Math.round((R.end-R.start)/60000);
  const per={};R.seq.forEach((p,i)=>{if(!R.sub[i])return;const d=domOf(byId[p.iid]);const x=per[d]||(per[d]={n:0,sum:0});x.n++;x.sum+=R.sub[i].s});
  const rows=R.seq.map((p,i)=>({p,i,it:byId[p.iid],r:R.sub[i]})).filter(x=>x.r);
  $('#results').innerHTML=`<p class="eyebrow">${esc(MODES[R.mode])} · ${new Date(R.start).toLocaleDateString()} · ${mins} min</p>
    <h1>${R.total?`${R.pct}% · ${R.right}/${R.total} fully correct`:'No questions answered'}</h1>
    <p class="lead">Estimated score <b>${R.before.overall}</b> → <b>${R.after.overall}</b> ${deltaHTML(R.after.overall,R.before.overall)}. ${R.after.overall>=700?'You are at or above the 700 line on this estimate.':`${700-R.after.overall} points below the 700 line.`}</p>
    <div class="board"><div class="card"><h2>Domains this session</h2><table class="att"><thead><tr><th>Domain</th><th>Answered</th><th>Score</th><th>Estimate</th></tr></thead><tbody>${DOMS.map(d=>{const x=per[d];return `<tr><td>${esc(PT.domains[d].name)}</td><td>${x?x.n:0}</td><td>${x?Math.round(x.sum/x.n*100)+'%':'-'}</td><td>${R.before.domains[d]} → <b>${R.after.domains[d]}</b> ${deltaHTML(R.after.domains[d],R.before.domains[d])}</td></tr>`}).join('')}</tbody></table></div>
    <div class="card"><h2>Next</h2><p class="help">The next adaptive session starts from these results. Questions you missed come back after a day, with new names.</p><div class="actions"><a class="btn" href="#" id="rDash">Back to dashboard</a><button class="btn sec" id="rAgain">Start another ${esc(MODES[R.mode].toLowerCase())}</button></div>${R.notes?`<h2 style="margin-top:1rem">Scratch pad</h2><pre style="white-space:pre-wrap;font:13px/1.6 var(--mono);background:var(--soft);padding:.7rem;border-radius:.4rem;margin:0">${esc(R.notes)}</pre>`:''}</div></div>
    <h2>Questions</h2><ul class="rlist">${rows.map(({p,i,it,r})=>`<li><span class="mk ${r.s>=1?'g':r.s>0?'p':'b'}">${r.s>=1?'✓':r.s>0?'◐':'✗'}</span><span><b>Q${i+1}</b> · ${esc(TYPES[it.type])} · ${esc(PT.objectives[it.obj].name)}${r.skipped?' · <i>not answered</i>':''}<br><span class="help" style="margin:0">${esc(strip(sub(it.stem[0],p.vars)).slice(0,150))}…</span></span><span>${Math.round(r.s*100)}%</span><details data-i="${i}"><summary>Review</summary><div class="rv"></div></details></li>`).join('')}</ul>`;
  $('#rDash').onclick=e=>{e.preventDefault();location.hash=''};
  $('#rAgain').onclick=()=>start(R.mode);
  $('#results').querySelectorAll('details').forEach(d=>d.ontoggle=()=>{if(!d.open||d.dataset.done)return;d.dataset.done=1;const i=+d.dataset.i,p=R.seq[i],it=byId[p.iid];const v=R.resp[i]!=null?R.resp[i]:blankResp(it);
    d.querySelector('.rv').innerHTML=(p.caseId?`<p class="help">Part ${p.part} of case study: ${esc(sub(byId[p.caseId].title,p.vars))}</p>`:'')+questionHTML(it,p,v,true)+feedbackHTML(it,p,R.sub[i].s,null)});
  window.scrollTo(0,0);
}

/* ───────── dashboard ───────── */
function renderDash(){
  s=M.load();
  $('#crumbMode').textContent='';$('#crumbModeSep').classList.add('hidden');
  const o=M.overall(s),h=s.hist,prev=h.length>1?h[h.length-2].overall:null;
  const weakest=Object.keys(PT.objectives).map(k=>({k,...M.objScore(s,k)})).sort((a,b)=>a.score-b.score)[0];
  const answered=Object.values(s.obj).reduce((a,x)=>a+x.n,0);
  $('#overallCard').innerHTML=`<h2>Estimated score</h2><div class="big"><b>${o.score}</b><span>/ 1000 · ±${o.band}</span>${prev!=null?deltaHTML(o.score,prev):''}</div>
    <p class="verdict">${o.score>=700?'At or above the 700 pass line on this estimate. Keep it there with spaced sessions.':`${700-o.score} points below the pass line. Biggest lift available: <b>${esc(PT.objectives[weakest.k].name)}</b> (${weakest.score}).`}</p>
    <div class="scale">${scaleHTML(o.score,o.band)}</div><div class="ticks"><span>100</span><span>400</span><span>700</span><span>1000</span></div>
    <p class="help" style="margin:.8rem 0 0">${answered?`${answered} questions answered in ${s.attempts.length} session${s.attempts.length===1?'':'s'}.`:'This starting point comes from your 25 Nov practice exam, by objective. Every answer refines it.'} This is an estimate from this site’s model, not Microsoft’s scoring.</p>`;
  $('#domainRows').innerHTML=DOMS.map(d=>drowHTML(d,M.domainScore(s,d))).join('');
  $('#objs').innerHTML=Object.entries(PT.objectives).map(([k,ob])=>{const x=M.objScore(s,k);return `<div class="obj ${x.score<600?'lo':x.score<700?'mid':'hi'}" title="${esc(ob.name)}"><b>${x.score}</b>${esc(ob.name)}<br><span>${esc(PT.domains[ob.d].name)} · ${x.n} answered</span></div>`}).join('');
  $('#fmts').innerHTML=Object.keys(TYPES).map(t=>{const a=M.fmtAcc(s,t),n=(s.fmt[t]||{}).n||0;return `<div class="fmt"><span>${esc(TYPES[t])}</span><span class="mbar"><span class="fill" style="width:${a==null?0:a*100}%"></span></span><em>${a==null?'not yet':Math.round(a*100)+'% · '+n}</em></div>`}).join('');
  const at=s.attempts.slice(-6).reverse();
  $('#recent').innerHTML=at.length?`<table class="att"><thead><tr><th>When</th><th>Mode</th><th>Qs</th><th>Score</th><th>Estimate</th></tr></thead><tbody>${at.map(a=>`<tr><td>${new Date(a.start).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</td><td>${esc(MODES[a.mode])}</td><td>${a.n}</td><td>${a.pct}%</td><td>${a.after} ${deltaHTML(a.after,a.before)}</td></tr>`).join('')}</tbody></table>`:'<p class="help">No sessions yet. Start with <b>Adaptive</b>: it begins with your weakest objectives.</p>';
  $('#trend').innerHTML=trendSVG(h);
  const nc=units.filter(u=>u.kind==='case').length;
  $('#bankNote').textContent=`${scored} questions in a targeted bank: ${units.length-nc} standalone + ${nc} three-part case studies. Names and order change every time.`;
  $('#examMeta').textContent=`${Math.min(50,scored)} questions · 100 min`;
  $('#topEst').innerHTML=`Estimated <b>${o.score}</b> / 1000`;
}
function trendSVG(h){
  const W=640,H=230,L=36,R=56,T=14,B=26;
  const pts=h.slice(-12);if(pts.length<2)return `<svg viewBox="0 0 ${W} 90" role="img" aria-label="Trend appears after your first session"><text x="${W/2}" y="48" text-anchor="middle" fill="#5b6672" font-size="13">The trend line appears after your first session. Starting estimate: ${pts[0]?pts[0].overall:'-'}</text></svg>`;
  const vals=pts.flatMap(p=>[p.overall,...DOMS.map(d=>p.domains[d])]);
  const lo=Math.max(100,Math.floor((Math.min(...vals,650)-40)/50)*50),hi=Math.min(1000,Math.ceil((Math.max(...vals,750)+40)/50)*50);
  const x=i=>L+(W-L-R)*i/(pts.length-1),y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
  const line=(get,col,w,dash)=>`<polyline fill="none" stroke="${col}" stroke-width="${w}" ${dash?'stroke-dasharray="4 4"':''} stroke-linejoin="round" stroke-linecap="round" points="${pts.map((p,i)=>`${x(i).toFixed(1)},${y(get(p)).toFixed(1)}`).join(' ')}"/>`;
  const css=d=>getComputedStyle(document.documentElement).getPropertyValue('--c-'+d).trim();
  let g='';for(let v=lo;v<=hi;v+=100)g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f6"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="10" fill="#5b6672">${v}</text>`;
  const pass=700>=lo&&700<=hi?`<line x1="${L}" x2="${W-R}" y1="${y(700)}" y2="${y(700)}" stroke="#1b1f24" stroke-dasharray="5 4" stroke-width="1.2"/><text x="${W-R+4}" y="${y(700)+4}" font-size="10" font-weight="700" fill="#1b1f24">700</text>`:'';
  const labels=pts.map((p,i)=>(i===0||i===pts.length-1||pts.length<=7)?`<text x="${x(i)}" y="${H-8}" text-anchor="middle" font-size="10" fill="#5b6672">${p.t==='prior'?'25 Nov':new Date(p.t).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</text>`:'').join('');
  const last=pts[pts.length-1];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Estimated score trend: ${pts.map(p=>p.overall).join(', ')}">${g}${pass}${DOMS.map(d=>line(p=>p.domains[d],css(d),1.6)).join('')}${line(p=>p.overall,'#1b1f24',3)}
    ${pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.overall)}" r="3.4" fill="#1b1f24"/>`).join('')}<text x="${x(pts.length-1)+7}" y="${y(last.overall)-6}" font-size="12" font-weight="700" fill="#1b1f24">${last.overall}</text>${labels}</svg>
    <div class="legend"><span><i style="background:#1b1f24;height:3px"></i>Overall</span>${DOMS.map(d=>`<span><i style="background:var(--c-${d})"></i>${esc(PT.domains[d].name)}</span>`).join('')}</div>`;
}

/* ───────── scratch pad ───────── */
(function(){
  const pad=$('#pad'),ta=$('#padText'),btn=$('#padBtn');
  const toggle=on=>{pad.classList.toggle('hidden',!on);btn.setAttribute('aria-expanded',on);if(on){ta.value=A?A.notes||'':ta.value;ta.focus()}};
  btn.onclick=()=>toggle(pad.classList.contains('hidden'));$('#padClose').onclick=()=>{toggle(false);btn.focus()};
  $('#padClear').onclick=()=>{ta.value='';if(A){A.notes='';putA()}ta.focus()};
  ta.oninput=()=>{if(A){A.notes=ta.value;putA()}};
  let dx=0,dy=0,drag=false;const head=$('#padHead');
  head.onpointerdown=e=>{if(e.target.tagName==='BUTTON')return;drag=true;const r=pad.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top;head.setPointerCapture(e.pointerId)};
  head.onpointermove=e=>{if(!drag)return;pad.style.left=Math.max(0,Math.min(innerWidth-80,e.clientX-dx))+'px';pad.style.top=Math.max(0,Math.min(innerHeight-40,e.clientY-dy))+'px';pad.style.bottom='auto'};
  head.onpointerup=()=>drag=false;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pad.classList.contains('hidden')){toggle(false);btn.focus()}});
})();

/* ───────── routing ───────── */
function show(id){['dash','test','results'].forEach(x=>$('#'+x).classList.toggle('hidden',x!==id))}
function route(){
  const h=location.hash.slice(1);
  if(h==='test'){A=getA();if(!A){location.hash='';return}s=M.load();show('test');renderTest();startTimer();return}
  clearInterval(tick);$('#pad').classList.add('hidden');
  if(h==='results'){show('results');renderResults();return}
  A=null;show('dash');renderDash();
}
window.addEventListener('hashchange',route);
$('#modes').querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>start(b.dataset.mode));
$('#crumbDash').onclick=e=>{e.preventDefault();if(location.hash==='#test'&&A&&Object.keys(A.sub).length&&A.mode!=='exam'){finish();return}location.hash=''};
$('#endBtn').onclick=()=>confirmEnd(false);
$('#mark').onchange=e=>{A.marks[A.i]=e.target.checked;putA();renderNav()};

/* tools */
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({kind:'az104-pt',version:1,exported:new Date().toISOString(),state:M.load()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`practice-test-${C.today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('#importBtn').onclick=()=>$('#importFile').click();
$('#importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(j.kind!=='az104-pt'||!j.state||typeof j.state!=='object')throw 0;C.save(M.ID,j.state);renderDash();$('#bankNote').textContent='Progress imported.'}catch{$('#bankNote').textContent='That file is not a Practice Test export.'}e.target.value=''};
let armed=null;$('#resetAll').onclick=()=>{const b=$('#resetAll');if(armed){clearTimeout(armed);armed=null;const all=C.loadAll();delete all[M.ID];C.saveAll(all);b.textContent='Reset';renderDash();return}b.textContent='Click again to erase';armed=setTimeout(()=>{armed=null;b.textContent='Reset'},3000)};

if(LS){LS.mount($('#syncHost'),{onPull:g=>{if(g.has('pt')&&!location.hash.slice(1))renderDash()}});LS.auto()}
route();
})();

(function(){
const C=window.BenchCore;
const params=new URLSearchParams(location.search);
const benchId=params.get('b')||'nov25';
const bench=window.BENCHMARKS[benchId]||window.BENCHMARKS.nov25;
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DOMAIN_NAMES=Object.fromEntries(bench.domains.map(d=>[d.id,d.name]));
const STATUS_LABEL={new:'New',due:'Due',learning:'Learning',mastered:'Mastered'};
let state=C.load(bench.id);

/* ───────── board ───────── */
function pips(box){return `<span class="pips" aria-label="Level ${Math.min(box,C.MASTER_BOX)} of ${C.MASTER_BOX}">${Array.from({length:C.MASTER_BOX},(_,i)=>`<i class="${i<box?'on':''}"></i>`).join('')}</span>`}
function badges(mi,st){return `<span class="pill ${st}">${STATUS_LABEL[st]}</span>${mi.recurring?'<span class="pill recur">Recurring</span>':''}${mi.regressed?'<span class="pill regress">Slipped</span>':''}${mi.disputed?'<span class="pill disputed">Key disputed</span>':''}`}
function barColor(p){return p>=70?'#27d99b':p>=50?'#ffcb5b':'#ff7181'}

function renderBoard(){
  state=C.load(bench.id);
  const sum=C.summary(bench,state),q=C.queue(bench,state);
  document.title=`${bench.title} · AZ-104 StudyLab`;
  $('#title').textContent=bench.title;
  $('#lead').innerHTML=`${esc(bench.source)}, ${esc(bench.date)}: <b>${bench.score.pct}%</b> (${bench.score.correct}/${bench.score.total}). Each of the ${bench.score.total-bench.score.correct} misses maps to a drag-and-drop mission below.`;
  $('#chips').innerHTML=`<div class="chip g"><strong>${sum.readiness}%</strong><span>Recovery</span></div><div class="chip"><strong>${sum.mastered}/${sum.total}</strong><span>Mastered</span></div><div class="chip y"><strong>${sum.due+sum.new}</strong><span>To do</span></div><div class="chip v"><strong>${sum.xp}</strong><span>XP</span></div><div class="chip r"><strong>${sum.streak}🔥</strong><span>Day streak</span></div>`;
  const next=q[0];
  const goText=!sum.started?{h:'Start with the recurring misses',s:`${bench.missions.filter(m=>m.recurring).length} concepts you missed before ${bench.date} and missed again on the benchmark. Start there.`,b:'Start first mission'}
    :sum.actionable?{h:`${sum.due} due · ${sum.new} not started`,s:`Next: ${next.mission.title} (${STATUS_LABEL[next.status].toLowerCase()}).`,b:'Continue'}
    :sum.mastered===sum.total?{h:'Benchmark cleared 🎉',s:'All missions mastered. Retake MeasureUp in certification mode and log the score below.',b:'Review a mission'}
    :{h:'All caught up for today',s:`Nothing due. ${sum.learning} missions are scheduled for spaced review. Come back tomorrow, or practice ahead.`,b:'Practice ahead'};
  $('#go').innerHTML=`<div><b>${esc(goText.h)}</b><small>${esc(goText.s)}</small></div><a class="action big" href="#m=${encodeURIComponent(next.mission.id)}">${esc(goText.b)} →</a>`;
  $('#queue').innerHTML=q.slice(0,6).map(e=>`<li><button data-m="${esc(e.mission.id)}">${esc(e.mission.title)}</button>${badges(e.mission,e.status)}${pips(e.state.box)}</li>`).join('');
  $('#queue').querySelectorAll('button[data-m]').forEach(b=>b.onclick=()=>go(b.dataset.m));
  renderScore();renderInsights();renderMissions();
}

function renderScore(){
  const trend=[...bench.trend.map(([d,l,p],i)=>({d,l,p,cls:i===bench.trend.length-1?'now':''})),...state.retakes.map(r=>({d:r.d.slice(5),l:'Retake (logged)',p:r.score,cls:'retake'}))].slice(-7);
  $('#scorePanel').innerHTML=`<h2>Benchmark breakdown</h2>
  <div class="scoreline"><div class="big-score">${bench.score.pct}%</div><span>${bench.score.correct}/${bench.score.total} correct · ${esc(bench.score.duration)} · Failed (practice)</span></div>
  ${bench.domains.map(d=>`<div class="dbar"><span>${esc(d.name)}</span><div class="track"><div class="fill" style="width:${d.pct}%;background:${barColor(d.pct)}"></div><div class="prior" style="left:${d.prior}%" title="${esc(bench.priorLabel)}: ${d.prior}%"></div></div><b>${d.pct}%</b></div>`).join('')}
  <p class="legend"><i></i>marker = ${esc(bench.priorLabel)}. Different vendor and format, so read it as a direction, not a score delta.</p>
  <h3 style="margin-top:.8rem">Score trend</h3><div class="trend">${trend.map(t=>`<div><strong>${Math.round(t.p)}%</strong><span class="bar ${t.cls}" style="height:${Math.max(t.p,4)*.6}%"></span><span>${esc(t.d)}</span></div>`).join('')}</div>`;
}

function renderInsights(){
  const rec=bench.missions.filter(m=>m.recurring||m.regressed);
  $('#insights').innerHTML=`
  <section class="panel ins-recur"><h2>What recurs (${rec.length})</h2><p class="help">Concepts that show up in the study tracker before ${esc(bench.date)} and were missed again on the benchmark.</p><ul>${rec.map(m=>`<li><a href="#m=${esc(m.id)}"><b>${esc(m.title)}</b></a> <span class="muted">${esc(m.history||'')}</span></li>`).join('')}</ul></section>
  <section class="panel ins-up"><h2>What improved (${bench.improved.length})</h2><p class="help">Concepts missed or flagged weak in October and answered correctly on the benchmark.</p><ul>${bench.improved.map(([t,d])=>`<li><b>${esc(t)}</b> <span class="muted">${esc(d)}</span></li>`).join('')}</ul></section>
  <section class="panel ins-pat"><h2>Patterns</h2><p class="help">Why the score fell further than the concept gaps alone explain.</p><ul>${bench.patterns.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></section>`;
}

function renderMissions(){
  const host=$('#missions');host.innerHTML='';
  bench.domains.forEach(d=>{
    const list=bench.missions.filter(m=>m.domain===d.id);if(!list.length)return;
    const mastered=list.filter(m=>C.status(state,m.id)==='mastered').length;
    const block=document.createElement('section');block.className='domain-block';
    block.innerHTML=`<div class="domain-head"><h2>${esc(d.name)} · ${d.pct}%</h2><span>${mastered}/${list.length} mastered · ${d.objectives.map(([n,p])=>`${esc(n)} ${p}%`).join(' · ')}</span></div><div class="mgrid"></div>`;
    const grid=block.querySelector('.mgrid');
    list.forEach(m=>{
      const st=C.status(state,m.id),ms=C.missionState(state,m.id);
      const b=document.createElement('button');b.className=`mcard st-${st}`;
      b.innerHTML=`<div>${badges(m,st)}</div><b>${esc(m.title)}</b><div class="meta"><span>${m.src.join(', ')} · ${m.cards.length} cards${ms.runs?` · ${ms.runs} run${ms.runs>1?'s':''}`:''}</span>${pips(ms.box)}</div>`;
      b.onclick=()=>go(m.id);grid.append(b);
    });
    host.append(block);
  });
}

/* ───────── play ───────── */
let mission=null,order=[],placed=new Map(),selected=null,wrong=0,streak=0,best=0,xp=0,done=false;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

function openMission(id){
  mission=bench.missions.find(m=>m.id===id);if(!mission){go(null);return}
  order=shuffle(mission.cards.map(([cid,text,row,why,url])=>({cid,text,row,why,url:url||mission.learn})));
  placed=new Map();selected=null;wrong=0;streak=0;best=0;xp=0;done=false;
  $('#board').classList.add('hidden');$('#play').classList.remove('hidden');
  $('#mTitle').textContent=mission.title;
  const ms=C.missionState(state,mission.id);
  $('#mSrc').innerHTML=`${esc(DOMAIN_NAMES[mission.domain])} · MeasureUp ${mission.src.join(', ')} · ${badges(mission,C.status(state,mission.id))} ${pips(ms.box)}`;
  const h=$('#mHistory');if(mission.history){h.className='history'+(mission.regressed?' regress':'');h.innerHTML=`<b>${mission.regressed?'Slipped':'Recurring'}:</b> ${esc(mission.history)}`}else h.className='history hidden';
  $('#mBrief').innerHTML=mission.brief;
  $('#feedback').className='feedback';$('#feedback').innerHTML=`Place every card. A wrong placement ends the clean run and the card bounces back with the reason. <a href="${esc(mission.learn)}" target="_blank" rel="noopener noreferrer">Microsoft Learn</a>`;
  $('#complete').className='complete hidden';
  render();window.scrollTo(0,0);
}

function render(){
  const cards=$('#cards');cards.innerHTML='';
  const avail=order.filter(c=>!placed.has(c.cid));
  if(!avail.length)cards.innerHTML='<div class="empty">All cards placed.</div>';
  avail.forEach(c=>{
    const b=document.createElement('button');b.className='card'+(selected===c.cid?' selected':'');b.textContent=c.text;b.draggable=true;
    b.setAttribute('aria-pressed',selected===c.cid?'true':'false');
    b.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',c.cid);b.classList.add('dragging')});
    b.addEventListener('dragend',()=>b.classList.remove('dragging'));
    b.onclick=()=>{selected=selected===c.cid?null:c.cid;render();if(selected)document.querySelector('.dropzone')?.focus({preventScroll:true})};
    cards.append(b);
  });
  const rows=$('#rows');rows.innerHTML='';
  mission.rows.forEach(([rid,label,hint])=>{
    const tr=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');
    th.scope='row';th.className='step';th.innerHTML=`${esc(label).replace(/___/g,'<code>___</code>')}<small>${esc(hint)}</small>`;
    const z=document.createElement('button');z.type='button';z.className='dropzone';z.dataset.zone=rid;
    const here=order.filter(c=>placed.get(c.cid)===rid);
    if(here.length){z.classList.add('has');here.forEach(c=>{const p=document.createElement('div');p.className='placed';p.textContent='✓ '+c.text;z.append(p)})}
    const left=order.filter(c=>c.row===rid&&!placed.has(c.cid)).length;
    const hintEl=document.createElement('div');hintEl.className='hint';hintEl.textContent=here.length?(left?`${left} more belong here`:''):(selected?'Place the selected card here':'Drop a card here');
    if(hintEl.textContent)z.append(hintEl);
    z.setAttribute('aria-label',`${label}. ${here.length?`Placed: ${here.map(c=>c.text).join('; ')}.`:'Empty.'}${selected?' Press Enter to place the selected card.':''}`);
    z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('over')});
    z.addEventListener('dragleave',()=>z.classList.remove('over'));
    z.addEventListener('drop',e=>{e.preventDefault();z.classList.remove('over');place(e.dataTransfer.getData('text/plain'),rid)});
    z.onclick=()=>{if(selected)place(selected,rid)};
    td.append(z);tr.append(th,td);rows.append(tr);
  });
  const pct=Math.round(placed.size/order.length*100);
  $('#status').innerHTML=`<div class="s"><strong>${xp}</strong><span>run XP</span></div><div class="s"><strong>${streak}</strong><span>streak · best ${best}</span></div><div class="s"><strong style="color:${wrong?'#ff7181':'#27d99b'}">${wrong}</strong><span>wrong</span></div><progress max="${order.length}" value="${placed.size}" aria-label="${pct}% placed"></progress><span class="src">${placed.size}/${order.length}</span>`;
}

function place(cid,rid){
  if(done)return;
  const c=order.find(x=>x.cid===cid);if(!c||placed.has(cid))return;
  const fb=$('#feedback'),link=`<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Microsoft Learn</a>`;
  if(c.row===rid){
    placed.set(cid,rid);selected=null;streak++;best=Math.max(best,streak);xp+=10;
    const bonus=streak%3===0?5:0;xp+=bonus;
    fb.className='feedback good';fb.innerHTML=`✓ <b>${esc(c.text)}</b>: ${esc(c.why)} ${link}${bonus?` <span class="src">+${bonus} streak bonus</span>`:''}`;
  }else{
    selected=null;wrong++;streak=0;
    const z=document.querySelector(`[data-zone="${CSS.escape(rid)}"]`);if(z){z.classList.remove('wrong');void z.offsetWidth;z.classList.add('wrong')}
    const label=mission.rows.find(r=>r[0]===rid)?.[1]||'';
    fb.className='feedback bad';fb.innerHTML=`✗ <b>${esc(c.text)}</b> doesn’t go in “${esc(label).replace(/___/g,'<code>___</code>')}”. ${esc(c.why)} ${link}`;
  }
  render();
  if(placed.size===order.length)finish();
}

function finish(){
  done=true;
  const clean=wrong===0,runXp=xp+(clean?25:0);
  const m=C.recordRun(state,mission.id,wrong,runXp);C.save(bench.id,state);
  const st=C.status(state,mission.id);
  const nextUp=C.queue(bench,state).find(e=>e.mission.id!==mission.id);
  const dueTxt=m.due<=C.today()?'again today':`on ${m.due}`;
  const el=$('#complete');el.className='complete'+(clean?'':' miss');
  el.innerHTML=`${clean?`<strong>Clean run! +25 bonus · ${runXp} XP.</strong> Level ${Math.min(m.box,C.MASTER_BOX)}/${C.MASTER_BOX}${st==='mastered'?' · <b>Mastered</b> 🏅':''}.`:`<strong>Completed with ${wrong} wrong placement${wrong>1?'s':''} · ${runXp} XP.</strong> Level reset to 0, so this mission comes back ${dueTxt}. Replay it now for a clean run while the reasons are fresh.`}
  <br><span class="src">Next review: ${m.due}. Learn: <a href="${esc(mission.learn)}" target="_blank" rel="noopener noreferrer">${esc(mission.learn.replace('https://learn.microsoft.com/en-us/',''))}</a></span>
  <div class="actions">${nextUp?`<a class="action" href="#m=${esc(nextUp.mission.id)}">Next: ${esc(nextUp.mission.title)} →</a>`:''}<button class="action alt" id="replay">Replay</button><a class="action ghost" href="#">Mission board</a></div>`;
  $('#replay').onclick=()=>openMission(mission.id);
  $('#mSrc').innerHTML=`${esc(DOMAIN_NAMES[mission.domain])} · MeasureUp ${mission.src.join(', ')} · ${badges(mission,st)} ${pips(m.box)}`;
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

/* ───────── routing ───────── */
function go(id){location.hash=id?`m=${encodeURIComponent(id)}`:''}
function route(){
  const h=decodeURIComponent(location.hash.slice(1));
  if(h==='next'){const q=C.queue(bench,C.load(bench.id));go(q[0].mission.id);return}
  if(h.startsWith('m=')){state=C.load(bench.id);openMission(h.slice(2));return}
  $('#play').classList.add('hidden');$('#board').classList.remove('hidden');renderBoard();
}
window.addEventListener('hashchange',route);
$('#backBtn').onclick=()=>go(null);

/* ───────── tools ───────── */
$('#logRetake').onclick=()=>{const v=Number($('#retake').value);if(!(v>=0&&v<=100)||$('#retake').value==='')return;state=C.load(bench.id);state.retakes.push({d:C.today(),score:v});C.save(bench.id,state);$('#retake').value='';renderBoard()};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({exported:new Date().toISOString(),data:C.loadAll()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`az104-benchmark-progress-${C.today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('#importBtn').onclick=()=>$('#importFile').click();
$('#importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());const data=j.data||j;if(typeof data!=='object'||Array.isArray(data))throw 0;C.saveAll(data);renderBoard();$('#lead').insertAdjacentHTML('beforeend',' <b style="color:#9ff0d0">Progress imported.</b>')}catch{$('#lead').insertAdjacentHTML('beforeend',' <b style="color:#ffb3bd">That file isn’t a progress export.</b>')}e.target.value=''};
let resetArmed=false;
$('#resetAll').onclick=()=>{if(!resetArmed){resetArmed=true;$('#resetAll').textContent='Click again to erase';setTimeout(()=>{resetArmed=false;$('#resetAll').textContent='Reset'},3000);return}const all=C.loadAll();delete all[bench.id];C.saveAll(all);resetArmed=false;$('#resetAll').textContent='Reset';renderBoard()};

route();
})();

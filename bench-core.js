/* Shared benchmark progress + spaced-repetition scheduling.
   Used by index.html (adaptive home button) and benchmark.html (missions).
   Everything is stored locally in this browser (localStorage); nothing is sent anywhere. */
(function(){
  const KEY='az104.benchmarks.v1';
  const INTERVALS=[0,1,2,4,7,14]; // days until a mission is due again, by box
  const MASTER_BOX=3;            // three clean runs in a row (on separate days) = mastered
  const DAY=86400000;

  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const addDays=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const daysBetween=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/DAY);

  function loadAll(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}}
  function saveAll(all){try{localStorage.setItem(KEY,JSON.stringify(all))}catch{}}
  function load(benchId){const all=loadAll();const s=all[benchId]||{};s.missions=s.missions||{};s.xp=s.xp||0;s.days=s.days||[];s.retakes=s.retakes||[];return s}
  function save(benchId,state){const all=loadAll();all[benchId]=state;saveAll(all)}

  function missionState(state,id){return state.missions[id]||{box:0,runs:0,clean:0,wrong:0,last:null,due:null,log:[]}}

  function status(state,id){
    const m=missionState(state,id);
    if(!m.runs)return 'new';
    if(m.box>=MASTER_BOX&&m.due>today())return 'mastered';
    if(!m.due||m.due<=today())return 'due';
    return 'learning';
  }

  /* Record a finished run. A clean run (0 wrong placements) promotes the mission one box,
     but only once per calendar day so mastery needs spaced recall. Any miss resets it to box 0. */
  function recordRun(state,id,wrong,xp){
    const m=missionState(state,id),t=today();
    const cleanToday=m.log.some(r=>r.d===t&&r.wrong===0);
    if(wrong===0){if(!cleanToday)m.box=Math.min(m.box+1,INTERVALS.length-1);m.clean++}
    else m.box=0;
    m.runs++;m.wrong+=wrong;m.last=t;m.due=addDays(t,wrong===0?INTERVALS[m.box]:0);
    m.log.push({d:t,wrong,xp});if(m.log.length>40)m.log=m.log.slice(-40);
    state.missions[id]=m;state.xp+=xp;
    if(!state.days.includes(t))state.days.push(t);
    return m;
  }

  function dayStreak(state){
    const set=new Set(state.days);let n=0,d=today();
    if(!set.has(d))d=addDays(d,-1);
    while(set.has(d)){n++;d=addDays(d,-1)}
    return n;
  }

  /* Priority: recurring misses first, then due/new, lower boxes first, older last-played first. */
  function queue(bench,state){
    const t=today();
    return bench.missions.map(mi=>{
      const m=missionState(state,mi.id),st=status(state,mi.id);
      let p=0;
      if(st==='due')p+=40; if(st==='new')p+=30; if(st==='learning')p+=5; if(st==='mastered')p-=50;
      if(mi.recurring)p+=25; if(mi.regressed)p+=15;
      p+=(MASTER_BOX-Math.min(m.box,MASTER_BOX))*4;
      if(m.last)p+=Math.min(daysBetween(m.last,t),14);
      if(m.runs&&m.wrong/m.runs>1)p+=6;
      return {mission:mi,state:m,status:st,priority:p};
    }).sort((a,b)=>b.priority-a.priority);
  }

  function summary(bench,state){
    const counts={new:0,due:0,learning:0,mastered:0};
    bench.missions.forEach(mi=>counts[status(state,mi.id)]++);
    /* a mastered mission that comes due for review still counts as mastered */
    const masteredByBox=bench.missions.filter(mi=>missionState(state,mi.id).box>=MASTER_BOX).length;
    const total=bench.missions.length;
    const actionable=counts.new+counts.due;
    return {...counts,mastered:masteredByBox,total,actionable,xp:state.xp,streak:dayStreak(state),started:total-counts.new>0,
      readiness:Math.round(bench.missions.reduce((a,mi)=>a+Math.min(missionState(state,mi.id).box,MASTER_BOX),0)/(total*MASTER_BOX)*100)};
  }

  window.BenchCore={KEY,MASTER_BOX,INTERVALS,today,addDays,load,save,loadAll,saveAll,missionState,status,recordRun,queue,summary,dayStreak};
  window.BENCHMARKS=window.BENCHMARKS||{};
})();

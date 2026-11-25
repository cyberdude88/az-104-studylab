/* Practice Test competency model (Rasch / 1PL with a running information total).
   State lives in BenchCore storage under bench id 'pt'. See docs/PRACTICE_TEST_DESIGN.md §3. */
(function(){
  const C=window.BenchCore,PT=window.PT;if(!C||!PT)return;
  const ID='pt',I0=1.2,ICAP=12,DECAY=.97,PASS_TH=Math.log(.7/.3);
  const logit=p=>Math.log(p/(1-p)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const DAY=86400000;

  function priorTheta(key){
    const o=PT.objectives[key],dp=PT.domainPrior[o.d];
    const p=o.prior==null?dp:(o.prior+dp)/2;
    return logit(clamp(p,10,90)/100);
  }
  function load(){
    const s=C.load(ID);
    s.obj=s.obj||{};s.items=s.items||{};s.attempts=s.attempts||[];s.fmt=s.fmt||{};s.hist=s.hist||[];
    Object.keys(PT.objectives).forEach(k=>{if(!s.obj[k])s.obj[k]={th:priorTheta(k),I:I0,n:0,last:null,at:null}});
    if(!s.hist.length)s.hist.push({t:'prior',label:'25 Nov practice exam',...snapshot(s)});
    return s;
  }
  const save=s=>C.save(ID,s);

  /* information fades 3% per idle day so the estimate keeps tracking learning */
  function info(o){
    if(!o.last)return o.I;
    const days=Math.max(0,Math.round((Date.now()-new Date(o.last+'T12:00:00'))/DAY));
    return Math.max(I0,o.I*Math.pow(DECAY,days));
  }
  const prob=(th,b)=>1/(1+Math.exp(-(th-b)));
  const scaled=th=>Math.round(clamp(700+200*(th-PASS_TH),100,1000));
  const band=I=>Math.round(200/Math.sqrt(I));

  function update(s,objKey,diff,score){
    const o=s.obj[objKey];if(!o)return null;
    const before=scaled(o.th),P=prob(o.th,diff);
    let I=info(o)+P*(1-P);I=Math.min(I,ICAP);
    o.th=clamp(o.th+(score-P)/I,-4,4);o.I=I;o.n++;o.last=C.today();o.at=new Date().toISOString();
    return {before,after:scaled(o.th),P};
  }
  function objScore(s,k){const o=s.obj[k];return {score:scaled(o.th),band:band(info(o)),n:o.n}}
  function domainScore(s,d){
    const ks=Object.keys(PT.objectives).filter(k=>PT.objectives[k].d===d);
    const xs=ks.map(k=>objScore(s,k));
    return {score:Math.round(xs.reduce((a,x)=>a+x.score,0)/xs.length),band:Math.round(Math.sqrt(xs.reduce((a,x)=>a+x.band*x.band,0)/xs.length/xs.length)),n:xs.reduce((a,x)=>a+x.n,0)};
  }
  function overall(s){
    const ds=Object.keys(PT.domains),W=ds.reduce((a,d)=>a+PT.domains[d].w,0);
    let sc=0,bd=0;ds.forEach(d=>{const x=domainScore(s,d),w=PT.domains[d].w/W;sc+=w*x.score;bd+=w*w*x.band*x.band});
    return {score:Math.round(sc),band:Math.round(Math.sqrt(bd))};
  }
  function snapshot(s){
    const o=overall(s),domains={};Object.keys(PT.domains).forEach(d=>domains[d]=domainScore(s,d).score);
    return {overall:o.score,band:o.band,domains};
  }
  function fmtRecord(s,type,score){const f=s.fmt[type]||(s.fmt[type]={n:0,sum:0});f.n++;f.sum+=score}
  function fmtAcc(s,type){const f=s.fmt[type];return f&&f.n?f.sum/f.n:null}

  window.PTModel={ID,load,save,prob,scaled,band,info,update,objScore,domainScore,overall,snapshot,fmtRecord,fmtAcc,PASS:700};
})();

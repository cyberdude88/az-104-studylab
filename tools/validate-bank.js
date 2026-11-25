#!/usr/bin/env node
/* Validates practice/bank-*.js against the item spec in docs/PRACTICE_TEST_DESIGN.md.
   Usage: node tools/validate-bank.js [bank-file ...]   (default: all practice/bank-*.js) */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const ctx={window:{}};vm.createContext(ctx);
const run=f=>vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
run(path.join(root,'scripts/deck.js'));run(path.join(root,'practice/core.js'));
const files=process.argv.slice(2).length?process.argv.slice(2):fs.readdirSync(path.join(root,'practice')).filter(f=>/^bank-.*\.js$/.test(f)).map(f=>path.join(root,'practice',f));
const errs=[],warn=[];const ids=new Set();
const PT=ctx.window.PT,TAGS=ctx.window.CTS_DECK.concepts;
const GLOBAL=['org','dns','person','person2','region','region2'];
const BANNED=/contoso|fabrikam|adatum|litware|northwind|tailspin|woodgrove|wingtip|wide world importers/i;
const words=s=>String(s).replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
const typeCount={},domCount={},langCount={};
files.forEach(f=>{
  const before=PT.items.length;
  try{run(f)}catch(e){errs.push(`${path.basename(f)}: does not load: ${e.message}`);return}
  PT.items.slice(before).forEach(it=>check(it,path.basename(f),false));
});
function texts(it){const t=[];const add=v=>{if(v==null)return;if(Array.isArray(v))v.forEach(add);else if(typeof v==='object')Object.values(v).forEach(add);else t.push(String(v))};add(it);return t}
function check(it,file,isPart){
  const id=it.id||'(no id)',E=m=>errs.push(`${file} ${id}: ${m}`),W=m=>warn.push(`${file} ${id}: ${m}`);
  if(!isPart){if(!/^[a-z0-9-]{3,48}$/.test(id))E('bad id');if(ids.has(id))E('duplicate id');ids.add(id)}
  if(it.type==='case'){
    if(!it.title)E('case needs title');
    if(!Array.isArray(it.tabs)||it.tabs.length<3)E('case needs 3+ tabs');
    else it.tabs.forEach(([n,ps])=>{if(!n||!Array.isArray(ps)||!ps.length)E('bad tab')});
    const tw=it.tabs?it.tabs.reduce((a,[,ps])=>a+ps.reduce((b,p)=>b+words(p),0),0):0;if(tw<250)E(`case text only ${tw} words (min 250)`);
    if(!Array.isArray(it.parts)||it.parts.length!==3)E('case needs exactly 3 parts');
    else it.parts.forEach((p,i)=>check({...p,id:id+'-p'+(i+1),vars:{...(it.vars||{}),...(p.vars||{})}},file,true));
    typeCount.case=(typeCount.case||0)+1;
    return;
  }
  const o=PT.objectives[it.obj];if(!o)E(`unknown obj ${it.obj}`);else domCount[o.d]=(domCount[o.d]||0)+1;
  if(!Array.isArray(it.tags)||!it.tags.length)E('tags required');else it.tags.forEach(t=>{if(!TAGS[t])E(`unknown tag ${t}`)});
  if(typeof it.diff!=='number'||it.diff<-1||it.diff>2)E('diff must be -1..2');
  if(!Array.isArray(it.stem)||!it.stem.length)E('stem must be array of paragraphs');
  else{const w=it.stem.reduce((a,p)=>a+words(p),0),min=isPart?25:60;if(w<min)E(`stem only ${w} words (min ${min})`);if(w>260)W(`stem ${w} words`)}
  if(!it.ask||!/\?(\s|$)/.test(it.ask))E('ask must contain the question (with ?)');
  if(!it.why||words(it.why)<20)E('why needs 20+ words');
  if(!isPart||it.learn){if(!Array.isArray(it.learn)||!it.learn.length)E('learn links required');else it.learn.forEach(l=>{if(!Array.isArray(l)||!/^https:\/\/learn\.microsoft\.com\//.test(l[1]||''))E(`bad learn link ${JSON.stringify(l)}`)})}
  const t=it.type;typeCount[t]=(typeCount[t]||0)+1;
  const okIdx=(a,n)=>Number.isInteger(a)&&a>=0&&a<n;
  if(t==='single'){if(!Array.isArray(it.opts)||it.opts.length<3||it.opts.length>6)E('single needs 3-6 opts');else if(!okIdx(it.a,it.opts.length))E('bad answer index')}
  else if(t==='multi'){if(!Array.isArray(it.opts)||it.opts.length<4||it.opts.length>7)E('multi needs 4-7 opts');else if(!Array.isArray(it.a)||it.a.length<2||it.a.length>=it.opts.length||!it.a.every(x=>okIdx(x,it.opts.length))||new Set(it.a).size!==it.a.length)E('bad multi answers');if(!['complete','part'].includes(it.sol))E('sol must be complete|part')}
  else if(t==='yesno'){if(!Array.isArray(it.stmts)||it.stmts.length!==3)E('yesno needs 3 stmts');else it.stmts.forEach(s=>{if(!Array.isArray(s)||typeof s[1]!=='boolean'||!s[2])E('stmt = [text, bool, reason]')})}
  else if(t==='order'){if(!Array.isArray(it.cards)||it.cards.length<4||it.cards.length>8)E('order needs 4-8 cards');else if(!Array.isArray(it.seq)||it.seq.length<2||it.seq.length>=it.cards.length||!it.seq.every(x=>okIdx(x,it.cards.length))||new Set(it.seq).size!==it.seq.length)E('bad seq (must leave at least one trap card)')}
  else if(t==='dropdown'||t==='code'){
    const src=t==='code'?it.code:(Array.isArray(it.text)?it.text.join('\n'):it.text);
    if(!src)E(t==='code'?'code required':'text required');
    if(t==='code'){if(!['bicep','azcli','pwsh','json','kql'].includes(it.lang))E('bad lang');langCount[it.lang]=(langCount[it.lang]||0)+1;
      if(it.lang==='azcli'&&/\$\(|^\s*(for|if|export|while)\b|#!\/bin|\becho\b|\|\s*(grep|xargs|jq)/m.test(src||''))E('azcli must be plain az commands, no bash scripting')}
    const marks=[...String(src||'').matchAll(/\{\{(\d+)\}\}/g)].map(m=>+m[1]);
    if(!Array.isArray(it.b)||marks.length!==it.b.length||!marks.every((m,i)=>m===i+1))E(`blanks ${marks} vs b ${it.b&&it.b.length}`);
    else it.b.forEach((b,i)=>{if(!Array.isArray(b.o)||b.o.length<3||b.o.length>6)E(`blank ${i+1} needs 3-6 options`);else if(!okIdx(b.a,b.o.length))E(`blank ${i+1} bad answer`);if(new Set(b.o).size!==b.o.length)E(`blank ${i+1} duplicate options`)});
  }
  else E(`unknown type ${t}`);
  const local=Object.keys(it.vars||{});
  Object.entries(it.vars||{}).forEach(([k,v])=>{if(!/^[a-z0-9]+$/.test(k)||!Array.isArray(v)||v.length<2)E(`var ${k} needs 2+ values`)});
  texts({...it,vars:undefined}).forEach(s=>{
    [...s.matchAll(/%([a-z0-9]+)%/g)].forEach(m=>{if(!GLOBAL.includes(m[1])&&!local.includes(m[1]))E(`unknown var %${m[1]}%`)});
    if(BANNED.test(s))E(`banned name in "${s.slice(0,60)}"`);
  });
}
console.log(`items ${ids.size} · types ${JSON.stringify(typeCount)} · domains ${JSON.stringify(domCount)} · code langs ${JSON.stringify(langCount)}`);
warn.forEach(w=>console.log('warn',w));
if(errs.length){errs.forEach(e=>console.log('ERR',e));process.exit(1)}
console.log('bank OK');

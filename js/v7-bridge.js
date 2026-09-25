/* DADASHMODE V7.1 · bridge: the classic run order IS the V7 episode now.
   - cueing a run-order segment moves the V7 state machine to that segment's state (seg.v7)
   - the classic «بازی و بانک زمان» deck shows the V7 controls of the current state (no more v5 game decks)
   - V7 program graphics cover the stage only on live-game segments; intro/rules segments keep their cinematic v5 renderer */
(function(){'use strict';
const D=window.DM5||{};const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\./g,'٫');const en=s=>String(s||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
const V7G=['cup','distance','sandwich','glue','shop','risk','vault','case'];
const ok=()=>window.V7&&V7.S&&typeof P!=='undefined'&&P&&P.segments;
const N=k=>V7.plain(k);const R=()=>V7.R;
const B=(a,l,p,cls='',dis)=>`<button class="btn sm ${cls}" ${dis?'disabled':''} data-v7a="${a}" data-v7p='${esc(JSON.stringify(p||{}))}'>${l}</button>`;
const row=x=>`<div class="row" style="flex-wrap:wrap;gap:6px">${x}</div>`;
function body(s){const E=N('E'),M=N('M'),b=V7.banks();const pk=k=>k==='E'?E:M;let h='';
 switch(s.state){
 case 'READY':h+=`<p class="muted" style="margin:0">هر نفر ۴۵ ثانیه · سقف فاصله ۳۰ و کف ۲۰ فقط روی کارت اپ (گفته نمی‌شود). قبل از REC: رمز کیف را در «آماده‌سازی فینال» مهر کنید.</p>`+row(B('state.go','شروع راند ۱',{state:'R1',reason:'ترتیب اجرا'},'pri'));break;
 case 'R1':h+=row(B('r1.start','شروع ۳۰ ثانیه','','pri',s.r1.t0))+row(['E','M'].map(k=>B('r1.valid',pk(k)+' · معتبر؟ (۲ ثانیه)',{p:k},'ok')+B('r1.fall',pk(k)+' ریخت',{p:k})+B('r1.foul',pk(k)+' دست دوم',{p:k})).join(''))
  +row(`<span class="muted">هیچ‌کس تمام نکرد؟ طبقهٔ کامل:</span>${['E','M'].map(k=>`<label class="row muted">${esc(pk(k))} <input type="number" min="0" max="10" data-v7l="${k}" value="${s.r1.layers[k]||0}" style="width:64px"></label>`).join('')}${B('r1.end','پایان راند')}`);break;
 case 'R2':if(!s.r2.locked){h+=['E','M'].map(k=>row(`<b style="color:${V7.color(k)}">${esc(pk(k))}</b>`+R().CFG.r2.lines.map(l=>B('r2.pick',`${l.fa} +${fa(l.sec)}`,{p:k,line:l.id},s.r2.choice[k]===l.id?'pri':'')).join(''))).join('');
   const tie=!R().leaderOf(b);h+=row((tie?`<span class="muted">بانک‌ها مساوی است؛ نوبت اول:</span>${B('r2.order','اول '+E,{first:'E'})}${B('r2.order','اول '+M,{first:'M'})}`:`<span class="muted">نوبت: نفر عقب اول</span>`)+B('r2.lock','قفل انتخاب‌ها','','pri'))}
  else{const t=V7.r2Turn();h+=`<p class="muted" style="margin:0">${['E','M'].map(k=>`${esc(pk(k))}: ${esc(s.r2.choice[k])} · ${fa(s.r2.throws[k].length)}/۳${s.r2.scored[k]?' ✔ گل':''}`).join(' · ')}</p>`+row(t?`<b>نوبت ${esc(pk(t))}</b>${B('r2.throw','گل',{p:t,res:'hit'},'ok')}${B('r2.throw','نخورد',{p:t,res:'miss'})}${B('r2.throw','پا روی خط',{p:t,res:'foot'})}`:'<span class="muted">پرتاب‌ها تمام شد.</span>')}break;
 case 'R3_SANDWICH':{const r=s.r3;h+=row(B('r3.start','شروع دوئل (بوق)','','pri',r.run)+B('r3.safety','«قرمز» توقف ایمنی','','pri'))
  +['E','M'].map(k=>row(`<b style="color:${V7.color(k)}">${esc(pk(k))}</b>${B('r3.mouthfull','دهان‌پر',{p:k},'')}${B('r3.empty','دهان خالی ✔',{p:k},'ok')}${B('r3.pen','+۳ جریمه',{p:k})}${B('r3.dq','رد صلاحیت',{p:k})}`)).join('');
  if(r.result&&r.result.need)h+=row(`<span class="muted">هیچ‌کس تمام نکرد · کمتر باقی گذاشت:</span>${B('r3.pick',E,{pick:'E'})}${B('r3.pick',M,{pick:'M'})}${B('r3.pick','برابر',{pick:'equal'})}`);
  if(r.result&&!r.result.need&&!r.applied)h+=row(`<b>${Object.entries(r.result.awards).map(([k,v])=>esc(pk(k))+' +'+fa(v)).join(' · ')||'بدون امتیاز'}${r.result.delta!=null?' (Δ'+fa(r.result.delta)+')':''}</b>${B('r3.confirm','تأیید و اعمال','','pri')}`);
  h+=`<p class="muted" style="margin:0">قانون سکوت جمنای تا اولین «دهان خالی» · کلیدها: ۹/۷ دهان‌پر · ۳/۱ خالی · ۶/۴ جریمه · Enter تأیید</p>`;break}
 case 'R4_GLUE':h+=row(B('r4.start','شروع ۱۸۰ ثانیه','','pri',s.r4.t0))+row(['E','M'].map(k=>B('r4.finish',pk(k)+' تمام',{p:k},'ok')).join('')+B('r4.valid','معتبر ✔','','pri')+B('r4.wrong','غلط (لغو + قفل ۵)')+B('gc.open','چالش چسب (نفر دوم)'))
  +row(`<span class="muted">هیچ‌کس معتبر نشد؟ تکهٔ درست:</span><input id="v7nE" type="number" min="0" max="6" style="width:56px" placeholder="${esc(E)}"><input id="v7nM" type="number" min="0" max="6" style="width:56px" placeholder="${esc(M)}"><button class="btn sm" data-v7x="none">ثبت (+۵)</button>`);break;
 case 'GLUE_CHALLENGE':h+=row(B('gc.check','تکان: هر دو سالم',{k:'shake',v:'BOTH_OK'})+B('gc.check','تکان: برگهٔ نفر اول ریخت',{k:'shake',v:'FIRST_FAIL'}))+row(B('gc.result','چالش موفق (۱۰/۵)',{res:'win'},'ok')+B('gc.result','ناموفق (−۵)',{res:'lose'})+B('gc.result','نامشخص (۰)',{res:'unclear'}));break;
 case 'TWIST_BANKOPEN':h+=`<p class="muted" style="margin:0">گلیچ طلایی · صدای قفل · ۵ کارت قفل با قیمت (۶ ثانیه) · زوم روی دستکش · هیچ عددی عوض نمی‌شود.</p>`;break;
 case 'REVEAL':h+=s.reveal.done?`<p class="muted" style="margin:0">فاصله ${fa(s.reveal.cap.gap)} · ${s.reveal.cap.apply?'سقف اعمال شد':'سقف اعمال نشد'}</p>`:row(B('reveal.show','رونمایی + سقف ۳۰','','pri'));break;
 case 'SHOP':{const t=V7.shopTurn();h+=['E','M'].map(k=>{if(s.shop.sub[k])return row(`<b style="color:${V7.color(k)}">${esc(pk(k))}</b> <span class="muted">ثبت شد ●</span>`);if(k!==t)return row(`<b style="color:${V7.color(k)}">${esc(pk(k))}</b> <span class="muted">منتظر نوبت (نفر عقب اول)</span>`);
   const av=V7.shopAvail(k);return row(`<b style="color:${V7.color(k)}">${esc(pk(k))}</b>`+R().CARDS.map(c=>{const a=av[c.id]||{};const on=s.shop.picks[k].includes(c.id);return B('shop.pick',`${c.icon} ${c.fa} ${fa(a.price||c.price)}${a.tax?' (مالیات)':''}`,{p:k,card:c.id},on?'pri':'',!on&&!a.ok)}).join('')+B('shop.none','هیچ',{p:k})+B('shop.submit','ثبت مخفی',{p:k},'ok'))}).join('');
  if(s.shop.sub.E&&s.shop.sub.M)h+=row(B('shop.reveal','رونمایی هم‌زمان','','pri'));break}
 case 'SHOP_REVEAL':h+=`<p class="muted" style="margin:0">${(s.shop.res&&s.shop.res.labels||[]).map(l=>`${esc(R().card(l.card).fa)} → ${esc(pk(l.target))}: ${l.res}`).join(' · ')||'هیچ کارتی خریده نشد'}</p>`;break;
 case 'RISK':h+=['E','M'].map(k=>{const o=R().riskOptions(k,b,V7.cfg());const lk=s.risk.lock[k];return row(`<b style="color:${V7.color(k)}">${esc(pk(k))}${s.risk.order&&s.risk.order[0]===k?' · اول':''}</b>`+[0,10,20,30].map(v=>B('risk.stake',v===30?'همه‌چی ۳۰':fa(v),{p:k,stake:v},s.risk.stake[k]===v?'pri':'',lk||!(o[v]&&o[v].ok))).join('')+B('risk.lock','قفل',{p:k},'',lk)+B('risk.result','خورد',{p:k,hit:true},'ok',!lk||s.risk.res[k])+B('risk.result','نخورد',{p:k,hit:false},'',!lk||s.risk.res[k]))}).join('');break;
 case 'VAULT_ARMED':h+=row(s.lock.set?`<span class="muted">رمز مهر شده · کد مهر ${esc(s.lock.seal)}</span>`:`<input id="v7lk" inputmode="numeric" placeholder="رمز ۳ رقمی قفل واقعی" style="width:170px"><button class="btn sm pri" data-v7x="lock">مهر و موم</button>`)+row(B('vault.arm','مسلح کردن گاوصندوق (هدف، الگو، معما)','','ok',s.vault.armed))+`<p class="muted" style="margin:0">نفر دوم ایزوله (۱۵+ متر) · داور نزدیک‌تر میاد.</p>`;break;
 case 'RUN1':case 'RUN2':{const run=V7.curRun();if(!run){h+=row(B('vault.arm','اول گاوصندوق را مسلح کنید','','pri'));break}const v=s.vault;const e=s.effects[run.k]||{};
  h+=`<p class="muted" style="margin:0">دونده: <b style="color:${V7.color(run.k)}">${esc(pk(run.k))}</b> · ایستگاه ${fa(run.station)} · کدها ${run.c.map((x,i)=>x?fa(V7.digit(i)):'؟').join(' ')}${e.gloves?' · 🥊':''}${e.spicy?' · 🌶':''}${e.hint&&!e.hintUsed?' · 🔍':''}${run.station===1?' · هدف: '+esc(v.target):''}</p>`;
  h+=row(B('run.start','شروع ساعت','pri','',run.started)+B('run.pause','توقف/ادامهٔ داور')+B('run.pen','جریمه ۱۰',{sec:10})+B('s2.hint','ذره‌بین'));
  if(run.station===1)h+=row(B('s1.pass','نقاشی درست ✔ (C1)','','ok')+B('s1.fail','برگهٔ نو'));
  if(run.station===2)h+=row(B('s2.start','نمایش ۵ ثانیه','','',run.s2.phase!=='ready')+run.s2.input.map((x,i)=>B('s2.toggle',x?'▲':'▼',{i},x?'pri':'',run.s2.phase!=='input')).join('')+B('s2.check','CHECK','','ok',run.s2.phase!=='input'));
  if(run.station===3)h+=row('<span class="muted">جواب معما:</span>'+[0,1,2,3,4,5,6,7,8,9].map(d=>B('s3.answer',fa(d),{d})).join(''));
  if(run.station===4)h+=row(`<input id="v7c" inputmode="numeric" placeholder="رمز" style="width:110px"><button class="btn sm pri" data-v7x="code">باز کردن</button>`);
  if(run.done)h+=`<p class="muted" style="margin:0">${run.opened?'گاوصندوق باز شد · باقی‌مانده '+fa(run.left):'وقت تمام شد · کد '+fa(run.codes)}</p>`;break}
 case 'CASE':h+=`<p class="muted" style="margin:0">برنده: ${s.cse.winner?esc(pk(s.cse.winner)):'—'} ${esc(s.cse.why||'')}</p>`+(s.cse.winner?'':row('<span class="muted">مرگ ناگهانی:</span>'+B('case.winner',E,{p:'E'})+B('case.winner',M,{p:'M'})));break;
 case 'CASE_L2':h+=row(R().ENVELOPES.map((x,i)=>B('case.env',fa(i+1)+' · '+esc(x.title),{n:i+1},s.cse.env===i+1?'pri':'')).join(''))+row(`<input id="v7env" placeholder="یا متن پاکت را تایپ کنید" style="flex:1"><button class="btn sm" data-v7x="env">ثبت متن</button>`);break;
 case 'CASE_L3':h+=row(R().BITES.map(x=>B('case.bite','جعبه '+fa(x.n),{n:x.n},s.cse.bites.includes(x.n)?'pri':'',s.cse.bites.includes(x.n)||s.cse.bites.length>=2)).join(''))+`<p class="muted" style="margin:0">بازنده ۲ جعبه از ۶ · بعد همهٔ جعبه‌ها رو می‌شوند.</p>`;break;
 default:h+=`<p class="muted" style="margin:0">با «مرحلهٔ بعد» جلو بروید.</p>`}return h}
function deck(seg){const s=V7.S(),b=V7.banks();let h=`<div class="game-box"><h4>${esc(R().STATE_FA[s.state]||s.state)} <span class="muted">· موتور V7 ${s.on?'روشن':'خاموش'}</span></h4>`;
 h+=row(`<b style="color:${V7.color('E')}">${esc(N('E'))} ${fa(b.E)}</b><span class="muted">|</span><b style="color:${V7.color('M')}">${esc(N('M'))} ${fa(b.M)}</b><b id="v7dt" style="font-variant-numeric:tabular-nums"></b>`);
 if(seg&&seg.v7&&seg.v7!==s.state&&!(seg.v7==='R4_GLUE'&&s.state==='GLUE_CHALLENGE'))h+=row(B('state.go','فعال کردن همین مرحله در موتور: '+esc(R().STATE_FA[seg.v7]),{state:seg.v7,reason:'ترتیب اجرا'},'pri'));
 h+=body(s);if(s.gem&&s.gem.say)h+=`<p class="muted" style="margin:0">جملهٔ بعدی جمنای: «${esc(s.gem.say)}» ${B('gem.say','پخش پشتیبان')}</p>`;
 h+=row(B('state.next','مرحلهٔ بعد ↵','','ok')+B('undo','برگرداندن آخرین رویداد')+B('pause',s.paused?'ادامه':'مکث'))+'</div>';return h}
function hook(){if(typeof renderGameDeck!=='function'||!ok()){return setTimeout(hook,200)}
 const _r=renderGameDeck;renderGameDeck=function(){try{const seg=P.segments[curSegIndex()];if(seg&&(seg.v7||V7G.includes(seg.game))){const el=document.getElementById('gameDeck');if(!el)return;try{renderVarBtn()}catch(e){}el.innerHTML=deck(seg);try{renderQuickLines()}catch(e){}return}}catch(e){console.warn('[V7 bridge]',e)}return _r.apply(this,arguments)};
 try{renderGameDeck()}catch(e){}}
hook();
const rer=()=>{try{const a=document.activeElement;if(a&&a.closest&&a.closest('#gameDeck')&&a.matches('input'))return;renderGameDeck()}catch(e){}};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#gameDeck [data-v7a],#gameDeck [data-v7x]');if(!b||!ok())return;e.preventDefault();e.stopPropagation();try{AE.resume()}catch(_){}
 const val=id=>{const x=document.getElementById(id);return x?x.value:''};
 if(b.dataset.v7x){const x=b.dataset.v7x;if(x==='code')V7.cmd('code.enter',{code:en(val('v7c'))},{src:'deck'});else if(x==='env')V7.cmd('case.env',{text:val('v7env')},{src:'deck'});else if(x==='none')V7.cmd('r4.none',{E:+en(val('v7nE'))||0,M:+en(val('v7nM'))||0},{src:'deck'});
  else if(x==='lock'){V7.setLock(en(val('v7lk'))).then(sl=>{D.toast&&D.toast('رمز مهر شد · '+sl);rer()}).catch(er=>D.toast&&D.toast(er.message));return}rer();return}
 V7.cmd(b.dataset.v7a,b.dataset.v7p?JSON.parse(b.dataset.v7p):{},{src:'deck'});rer()},true);
document.addEventListener('change',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.v7l&&ok()){V7.cmd('r1.layers',{p:t.dataset.v7l,n:+en(t.value)||0},{src:'deck'})}},true);
let lastSeg=null,userProg=null;
setInterval(()=>{if(!ok())return;try{
 const live=typeof st!=='undefined'&&st.live>=0?P.segments[st.live]:null;
 if(live&&live.v7&&live!==lastSeg){lastSeg=live;const s=V7.S();if(!s.on)V7.cmd('v7.on',{on:true},{src:'ros'});if(V7.S().state!==live.v7&&!(live.v7==='R4_GLUE'&&V7.S().state==='GLUE_CHALLENGE'))V7.cmd('state.go',{state:live.v7,reason:'ترتیب اجرا'},{src:'ros'})}
 if(!live)lastSeg=null;
 if(window.V7FX&&V7FX.SET){if(userProg===null)userProg=V7FX.SET.program;const present=live&&live.v7&&live.type!=='play';V7FX.SET.program=present?false:userProg}
 const el=document.getElementById('v7dt');if(el){const s=V7.S();let t='';if(s.state==='R3_SANDWICH'){t=['E','M'].map(k=>{const x=V7.r3Live(k);return `${N(k)} ${x.T!=null?fa((+x.T).toFixed(1)):'—'}${x.st==='mouthfull'?' (قورت '+fa(Math.ceil(x.swallow))+')':x.st==='final'?' ✔':x.st==='dq'?' رد':''}`}).join(' · ')}
  else{const tm=V7.timer();if(tm)t=`${tm.label} ${fa((tm.remain!=null?tm.remain:tm.elapsed||0).toFixed(1))}`}el.textContent=t?' · '+t:''}}catch(e){}},250);
if(window.V7&&V7.on)V7.on('change',rer);else setTimeout(()=>{if(window.V7&&V7.on)V7.on('change',rer)},1000);
})();

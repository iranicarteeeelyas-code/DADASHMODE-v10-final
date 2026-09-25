/* DADASHMODE v7 · show engine: state machine (§9.5), all V7 game modules (§9.4), commands from keyboard/console/phones,
   append-only log in the v5 journal (same CSV), UNDO of the last command, idempotent command ids, pause, Gemini "next line".
   Additive: nothing from v5 is removed. The computer is the single source of truth; phones only send commands. */
(function(){
'use strict';
const R=window.V7R,D=window.DM5;
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]).replace(/\./g,'٫');
const V7=window.V7={R,fa,ver:'7.0.0'};
const bus={};V7.on=(e,f)=>{(bus[e]=bus[e]||[]).push(f)};V7.emit=(e,d)=>{(bus[e]||[]).forEach(f=>{try{f(d)}catch(err){console.warn('[V7]',e,err)}})};
const P_=()=>D.P();const toast=(m,ms)=>D.toast(m,ms);
const AEx=(fn,...a)=>{try{if(window.AE&&AE.ctx&&AE[fn])AE[fn](...a)}catch(e){}};
V7.sfx=(n,...a)=>{if(window.V7FX&&V7FX.sfx&&V7FX.sfx[n]){try{AE.resume().then(()=>V7FX.sfx[n](...a))}catch(e){}}else AEx(n,...a)};

/* ---------- players: E = players[0] (الیاس), M = players[1] (عماد) ---------- */
const PL=()=>{const p=P_();return p&&p.players||[]};
V7.pid=k=>{const ps=PL();const p=k==='E'?ps[0]:ps[1];return p&&p.id};
V7.key=pid=>{const ps=PL();return ps[0]&&ps[0].id===pid?'E':'M'};
V7.player=k=>{const ps=PL();return (k==='E'?ps[0]:ps[1])||{name:k,color:k==='E'?'#ff2738':'#00c98d',symbol:''}};
V7.name=k=>String(V7.player(k).name||k);
V7.plain=k=>V7.name(k).replace(/[\u064B-\u0652]/g,'');
V7.color=k=>V7.player(k).color||(k==='E'?'#ff2738':'#00c98d');
V7.opp=k=>k==='E'?'M':'E';
V7.bank=k=>{try{return bankOf(V7.pid(k))}catch(e){return 0}};
V7.banks=()=>({E:V7.bank('E'),M:V7.bank('M')});

/* ---------- config (episode JSON "v7" block overrides the book defaults) ---------- */
const deep=(a,b)=>{const o=Array.isArray(a)?a.slice():Object.assign({},a);if(b)for(const k in b){o[k]=(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a&&typeof a[k]==='object')?deep(a[k],b[k]):b[k]}return o};
V7.cfg=()=>{const p=P_();const c=deep(R.CFG,p&&p.v7cfg||{});return c};

/* ---------- run state (stored inside the episode → covered by v5 IndexedDB persistence, snapshots and backups) ---------- */
const pp=()=>({T:null,status:'eating',pen:0,mfAt:0,mfV:0});
const fresh=()=>({on:false,state:'READY',t0:0,paused:false,pauseAt:0,pauseAcc:0,seq:0,
 r1:{t0:0,run:false,hold:{},winner:null,layers:{E:0,M:0},done:false},
 r2:{choice:{},locked:false,throws:{E:[],M:[]},scored:{},order:null,done:false},
 r3:{t0:0,run:false,E:pp(),M:pp(),result:null,applied:false,safety:false,pick:null},
 twist:{shown:0},
 r4:{t0:0,run:false,fin:{},finV:{},lock:{},valid:{},first:null,ch:null,chUsed:false,final:false,secondAt:0,correct:{E:0,M:0}},
 reveal:{done:false,cap:null,at:0,from:null},
 shop:{picks:{E:[],M:[]},pickT:{E:[],M:[]},src:{E:'',M:''},sub:{E:false,M:false},res:null,at:0,banksAt:null},
 effects:{E:{gloves:false,spicy:false,hint:0,hintUsed:false},M:{gloves:false,spicy:false,hint:0,hintUsed:false}},
 risk:{stake:{},lock:{},res:{},order:null},
 lock:{set:false,enc:'',salt:'',seal:'',at:0},
 vault:{armed:false,target:null,pattern:null,riddle:null,order:null,runs:{},rerolls:0,cb:false},
 cse:{winner:null,why:'',at:0,env:null,envText:'',bites:[],revealAll:false},
 gem:{cmd:'',say:''},fxq:[],cmdIds:[],undo:[]});
V7.S=()=>{const p=P_();if(!p)return fresh();if(!p.v7run||typeof p.v7run!=='object')p.v7run=fresh();const f=fresh();for(const k in f)if(p.v7run[k]===undefined)p.v7run[k]=f[k];return p.v7run};
V7.reset=()=>{const p=P_();if(!p)return;p.v7run=fresh();D.save();V7.emit('change')};

/* ---------- virtual clock (PAUSE freezes every V7 timer) ---------- */
V7.vnow=()=>{const s=V7.S();return Date.now()-(s.pauseAcc||0)-(s.paused?Date.now()-s.pauseAt:0)};
const since=t0=>t0?(V7.vnow()-t0)/1000:0;
const r1d=x=>Math.round(x*10)/10;
V7.clk=()=>{const s=V7.S();const t=s.t0?Math.max(0,(Date.now()-s.t0)/1000):0;const m=Math.floor(t/60),sec=t-m*60;return `${String(m).padStart(2,'0')}:${sec.toFixed(1).padStart(4,'0')}`};
V7.mmss=t=>{t=Math.max(0,t);const m=Math.floor(t/60),s=t-m*60;return `${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`};

/* ---------- Persian number words (colloquial, like the book: «پونزده», «یک دقیقه و پنج ثانیه») ---------- */
const ONES=['صفر','یک','دو','سه','چهار','پنج','شیش','هفت','هشت','نه','ده','یازده','دوازده','سیزده','چهارده','پونزده','شونزده','هفده','هجده','نوزده'];
const TENS=['','','بیست','سی','چهل','پنجاه','شصت','هفتاد','هشتاد','نود'];
V7.words=n=>{n=Math.round(Math.abs(n));if(n<20)return ONES[n];if(n<100){const t=Math.floor(n/10),o=n%10;return TENS[t]+(o?' و '+ONES[o]:'')}if(n<1000){const h=Math.floor(n/100),r=n%100;const H=['','صد','دویست','سیصد','چهارصد','پونصد','ششصد','هفتصد','هشتصد','نهصد'][h];return H+(r?' و '+V7.words(r):'')}return String(n)};
V7.wordsDec=x=>{const i=Math.floor(x),d=Math.round((x-i)*10);return V7.words(i)+(d?` و ${V7.words(d)} دهم`:'')};
V7.wordsMin=s=>{s=Math.round(s);const m=Math.floor(s/60),r=s%60;if(!m)return V7.words(r)+' ثانیه';return `${V7.words(m)} دقیقه${r?' و '+V7.words(r)+' ثانیه':''}`};

/* ---------- log (inside the v5 append-only journal → same list, same CSV) ---------- */
let CUR=null;
V7.log=(text,src)=>{const s=V7.S();const line=`${V7.clk()} ${text}${src&&src!=='host'?` (${src})`:''}`;try{G().journal.push({id:uid(),t:Date.now(),kind:'v7',player:null,delta:0,reason:line,seg:typeof curSegIndex==='function'?curSegIndex():-1,v7:1});renderJournal()}catch(e){console.log('[V7 log]',line)}V7.emit('log',line);return line};
function give(k,delta,reason){if(!delta)return null;const ev=award(V7.pid(k),delta,reason,{force:true});if(ev&&CUR)CUR.aw.push(ev.id);return ev}
V7.gem=(cmd,say)=>{const s=V7.S();s.gem={cmd:cmd||'',say:say||''};V7.emit('gem',s.gem)};
const announce=(k,sec)=>{const n=V7.plain(k),w=V7.words(sec);V7.gem(`جمنای، اعلام کن: ${n}، ${w} ثانیه.`,`${n}، ${w} ثانیه.`)};
V7.fx=(kind,data={})=>{const s=V7.S();s.fxq.push({kind,data,t:Date.now()});if(s.fxq.length>40)s.fxq.splice(0,s.fxq.length-40);V7.emit('fx',{kind,data})};

/* ---------- roles & permissions (§9.2): players can never send director commands ---------- */
const ROLE={DIRECTOR:'*',JUDGE:['r3.mouthfull','r3.empty','r3.pen','r4.wrong','r4.valid','gc.check','gc.result','r1.valid','r1.fall','r2.throw','s1.pass','s1.fail','s2.check','s3.answer','risk.result'],
 PLAYER_E:['r4.finish','shop.pick','shop.submit','risk.stake','risk.lock'],PLAYER_M:['r4.finish','shop.pick','shop.submit','risk.stake','risk.lock'],MONITOR:[]};
V7.allowed=(role,action,payload)=>{const r=ROLE[role||'DIRECTOR'];if(r==='*')return true;if(!r||!r.includes(action))return false;
 if(role==='PLAYER_E'||role==='PLAYER_M'){const me=role.slice(-1);if(payload&&payload.p&&payload.p!==me)return false}return true};

/* ---------- command dispatcher (single entry: keyboard, console, phones) ---------- */
const H={};V7.H=H;
V7.cmd=(action,payload={},meta={})=>{const s=V7.S();const src=meta.src||'host',role=meta.role||'DIRECTOR';
 if(meta.id){if(s.cmdIds.includes(meta.id))return {ok:true,dup:true};s.cmdIds.push(meta.id);if(s.cmdIds.length>600)s.cmdIds.splice(0,200)}
 if(!V7.allowed(role,action,payload)){V7.log(`DENY ${action} role=${role}`,src);return {ok:false,err:'اجازه ندارید'}}
 if((role==='PLAYER_E'||role==='PLAYER_M')&&!payload.p)payload=Object.assign({},payload,{p:role.slice(-1)});
 const h=H[action];if(!h){return {ok:false,err:'فرمان ناشناخته: '+action}}
 const snap=action==='undo'||action.startsWith('ui.')?null:JSON.stringify(Object.assign({},s,{undo:[],cmdIds:[],fxq:[]}));
 CUR={action,aw:[]};let res;
 try{res=h(payload,{src,role})||{ok:true}}catch(e){console.error(e);res={ok:false,err:e.message}}
 if(snap&&res.ok!==false&&!res.noUndo){s.undo.push({a:action,snap,aw:CUR.aw.slice(),t:Date.now()});if(s.undo.length>40)s.undo.shift()}
 CUR=null;s.seq++;D.save();V7.emit('change',{action,res});if(res.err&&src==='host')toast(res.err);return res};

/* ---------- state machine ---------- */
const NEXT={READY:'R1',R1:'R2',R2:'R3_SANDWICH',R3_SANDWICH:'TWIST_BANKOPEN',TWIST_BANKOPEN:'R4_GLUE',R4_GLUE:'REVEAL',GLUE_CHALLENGE:'R4_GLUE',REVEAL:'SHOP',SHOP:'SHOP_REVEAL',SHOP_REVEAL:'RISK',RISK:'VAULT_ARMED',VAULT_ARMED:'RUN1',RUN1:'RUN2',RUN2:'CASE',CASE:'CASE_L1',CASE_L1:'CASE_L2',CASE_L2:'CASE_L3',CASE_L3:'END',END:'END'};
V7.NEXT=NEXT;
const INTRO={R1:['جمنای','راند یک. ده لیوان، فقط با یک دست. برج باید دو ثانیه سالم بمونه.'],R2:['جمنای','راند دو. خطت رو انتخاب کن. بعد از قفل، عوض نمیشه.'],R3_SANDWICH:['جمنای','دوئل ساندویچ. اوّلی که قورت بده، وقت می‌بره. آخرین لقمه رفت تو دهن، دستا بالا. بعد سی ثانیه وقت دارید قورت بدید و دهن خالی نشون بدید.'],
 TWIST_BANKOPEN:['جمنای','آبی برای خودت. قرمز برای حریف. طلایی… برای شجاع‌ها.'],R4_GLUE:['جمنای','راند چهار. دستکش‌ها رو بپوشید. پازل لوگو، شیش تیکه. چیدن با دستکش، چسب بی دستکش. اوّلی که دکمه‌ی تمام رو بزنه، پونزده ثانیه.'],
 SHOP:['جمنای','فروشگاه کارت باز شد. هر نفر حداکثر دو کارت. فقط یکی قرمز. مخفی.'],RISK:['جمنای','شوت ریسک. اوّل نفر عقب اعلام می‌کنه.'],VAULT_ARMED:['جمنای','داور نزدیک‌تر میاد.'],CASE_L3:['جمنای','و حالا… پاکت مجازات. دو تا از شیش تا.'],END:['عماد','قسمت بعد، تاج رو پس می‌گیرم.']};
V7.INTRO=INTRO;
function enter(st,meta){const s=V7.S();const prev=s.state;s.state=st;V7.log(`STATE ${prev}→${st}`,meta&&meta.src);
 const i=INTRO[st];if(i)V7.gem('',i[1]);if(window.V7SUB)V7SUB.push(i?i[0]:'اپ',i?i[1]:R.STATE_FA[st],{kind:'intro'});
 if(st==='TWIST_BANKOPEN'){s.twist.shown=Date.now();V7.log('TWIST BANKOPEN SHOWN');V7.fx('bankopen');V7.sfx('glitchGold');V7.gem('','نه. بانک باز شد.')}
 if(st==='SHOP'){s.shop.banksAt=V7.banks();s.shop.at=Date.now()}
 if(st==='RISK'){s.risk.order=R.riskOrder(V7.banks())}
 if(st==='RUN1'||st==='RUN2'){const v=s.vault;if(!v.armed)armVault(meta);const k=v.order[st==='RUN1'?0:1];if(!v.runs[k])v.runs[k]=newRun(k);V7.gem('',`${V7.plain(k)}. ${V7.wordsMin(V7.bank(k))}. گاوصندوق منتظره.`)}
 if(st==='CASE'){openCase()}
 if(st==='CASE_L1'){const w=s.cse.winner;if(w){bumpBadge(w);V7.gem('','نشان ساندویچ طلایی. اوّلین نشان روی تاج.')}}
 if(st==='CASE_L2')V7.gem('','پاکت‌ها رو هیچ‌کس ندیده. حتی من. و من همه چی رو می‌بینم.');
 V7.fx('state',{st});V7.sfx(st==='TWIST_BANKOPEN'?'none':'whooshBig')}
H['v7.on']=(p,m)=>{const s=V7.S();s.on=p.on!==false;if(s.on&&!s.t0)s.t0=Date.now();V7.log(s.on?'V7 ENGINE ON':'V7 ENGINE OFF',m.src);return {ok:true,noUndo:true}};
H['state.next']=(p,m)=>{const s=V7.S();if(!s.on){s.on=true;s.t0=s.t0||Date.now()}const cur=s.state;
 if(cur==='GLUE_CHALLENGE')return {ok:false,err:'اول نتیجهٔ چالش چسب را بزنید'};
 if(cur==='SHOP'&&!s.shop.res){return H['shop.reveal']({},m)}
 if(cur==='RUN1'&&!(s.vault.runs[s.vault.order[0]]||{}).done)return {ok:false,err:'دویدن اول هنوز تمام نشده'};
 if(cur==='RUN2'&&!(s.vault.runs[s.vault.order[1]]||{}).done)return {ok:false,err:'دویدن دوم هنوز تمام نشده'};
 if(cur==='R4_GLUE'&&!s.r4.final)finalizeR4('NEXT');
 enter(NEXT[cur]||'END',m);return {ok:true}};
H['state.go']=(p,m)=>{if(!R.STATES.includes(p.state))return {ok:false,err:'حالت نامعتبر'};const s=V7.S();if(!s.on){s.on=true;s.t0=s.t0||Date.now()}V7.log(`EDIT JUMP ${s.state}→${p.state} reason=${p.reason||'کارگردان'}`,m.src);enter(p.state,m);return {ok:true}};
H['undo']=(p,m)=>{const s=V7.S();const u=s.undo.pop();if(!u)return {ok:false,err:'چیزی برای برگرداندن نیست',noUndo:true};
 const keep={undo:s.undo,cmdIds:s.cmdIds,fxq:s.fxq};const old=JSON.parse(u.snap);Object.assign(s,old,keep);
 try{for(const id of u.aw){G().journal.push({id:uid(),t:Date.now(),kind:'undo',ref:id,player:(G().journal.find(e=>e.id===id)||{}).player,delta:0,reason:'UNDO V7: '+u.a,seg:curSegIndex()})}renderScores();renderJournal()}catch(e){}
 V7.log(`UNDO ${u.a}`,m.src);return {ok:true,noUndo:true}};
H['pause']=(p,m)=>{const s=V7.S();if(s.paused){s.pauseAcc+=Date.now()-s.pauseAt;s.paused=false;V7.log('RESUME',m.src)}else{s.paused=true;s.pauseAt=Date.now();V7.log('PAUSE',m.src)}return {ok:true,noUndo:true}};
H['gem.say']=(p,m)=>{V7.tts(V7.S().gem.say);return {ok:true,noUndo:true}};
H['ui.fx']=(p)=>{V7.fx(p.kind,p.data||{});return {ok:true}};

/* ---------- R1 · one-hand cup tower ---------- */
H['r1.start']=(p,m)=>{const s=V7.S();s.r1.t0=V7.vnow();s.r1.run=true;V7.log('R1 START',m.src);V7.sfx('startHorn');return {ok:true}};
H['r1.valid']=(p,m)=>{const s=V7.S();if(s.r1.winner)return {ok:false,err:'برندهٔ راند ۱ ثبت شده'};s.r1.hold[p.p]=V7.vnow();V7.log(`R1 ${p.p} HOLD 2s`,m.src);V7.fx('hold',{k:p.p});return {ok:true}};
H['r1.fall']=(p,m)=>{const s=V7.S();delete s.r1.hold[p.p];V7.log(`R1 ${p.p} FALL (clock continues)`,m.src);V7.sfx('fail');V7.fx('stamp',{k:p.p,ok:false,text:'ریخت!'});return {ok:true}};
H['r1.foul']=(p,m)=>{const s=V7.S();delete s.r1.hold[p.p];V7.log(`R1 ${p.p} FOUL SECOND HAND → restart`,m.src);V7.gem('',`${V7.plain(p.p)}، دست دوم!`);V7.sfx('buzz');return {ok:true}};
H['r1.layers']=(p,m)=>{const s=V7.S();s.r1.layers[p.p]=Math.max(0,Math.min(10,+p.n||0));return {ok:true}};
H['r1.end']=(p,m)=>{const s=V7.S();if(s.r1.done)return {ok:false,err:'راند ۱ بسته شده'};s.r1.run=false;s.r1.done=true;const aw=R.r1Score({winner:s.r1.winner,layers:s.r1.layers},V7.cfg());
 for(const k in aw){give(k,aw[k],'راند ۱ · برج بیشتر');announce(k,aw[k])}V7.log(`R1 END ${Object.keys(aw).length?Object.entries(aw).map(([k,v])=>k+' +'+v).join(' '):'NO AWARD'}`,m.src);return {ok:true}};
function r1Tick(s){for(const k in s.r1.hold){if(since(s.r1.hold[k])>=V7.cfg().r1.hold&&!s.r1.winner){s.r1.winner=k;delete s.r1.hold[k];s.r1.run=false;s.r1.done=true;CUR={action:'r1.valid',aw:[]};const sec=V7.cfg().r1.win;give(k,sec,'راند ۱ · اولین برج معتبر');V7.log(`R1 ${k} VALID +${sec} BANK=${V7.bank(k)}`);announce(k,sec);V7.fx('win',{k,sec});V7.sfx('ding');CUR=null;return true}}
 if(s.r1.run&&since(s.r1.t0)>=V7.cfg().r1.limit){s.r1.run=false;V7.log('R1 TIME UP');V7.sfx('buzz');return true}return false}

/* ---------- R2 · choose your distance (farther = more seconds) ---------- */
H['r2.pick']=(p,m)=>{const s=V7.S();if(s.r2.locked)return {ok:false,err:'انتخاب قفل شده'};s.r2.choice[p.p]=p.line;return {ok:true}};
H['r2.lock']=(p,m)=>{const s=V7.S();const c=s.r2.choice;if(!c.E||!c.M)return {ok:false,err:'هر دو باید خط انتخاب کنند'};s.r2.locked=true;
 s.r2.order=R.r2Order(c,V7.banks())||s.r2.order||(p.first?[p.first,V7.opp(p.first)]:null);if(!s.r2.order){s.r2.locked=false;return {ok:false,err:'بانک‌ها مساوی است؛ اول نوبت را تعیین کنید'}}
 ['E','M'].forEach(k=>V7.log(`R2 ${k} LINE=${c[k]} (+${R.r2Value(c[k])}) LOCK`,m.src));V7.fx('chain',{});V7.sfx('lockClank');V7.gem('','انتخاب قفل شد.');return {ok:true}};
H['r2.order']=(p,m)=>{const s=V7.S();s.r2.order=[p.first,V7.opp(p.first)];V7.log(`R2 ORDER FIRST=${p.first} (same line, director)`,m.src);return {ok:true}};
V7.r2Turn=()=>{const s=V7.S();if(!s.r2.order)return null;const max=V7.cfg().r2.throws;const n=k=>s.r2.throws[k].length;const live=k=>!s.r2.scored[k]&&n(k)<max;
 const [a,b]=s.r2.order;if(!live(a)&&!live(b))return null;if(!live(a))return b;if(!live(b))return a;return n(a)<=n(b)?a:b};
H['r2.throw']=(p,m)=>{const s=V7.S();if(!s.r2.locked)return {ok:false,err:'اول خط‌ها را قفل کنید'};const k=p.p||V7.r2Turn();if(!k)return {ok:false,err:'پرتاب‌ها تمام شده'};
 const max=V7.cfg().r2.throws;if(s.r2.scored[k]||s.r2.throws[k].length>=max)return {ok:false,err:'پرتاب‌های این بازیکن تمام شده'};
 const res=p.res||'miss';s.r2.throws[k].push(res);const i=s.r2.throws[k].length;
 if(res==='hit'){s.r2.scored[k]=true;const sec=R.r2Value(s.r2.choice[k]);give(k,sec,`راند ۲ · خط ${s.r2.choice[k]}`);V7.log(`R2 ${k} HIT +${sec} (${i}/${max}) BANK=${V7.bank(k)}`,m.src);announce(k,sec);V7.fx('goal',{k,sec,line:s.r2.choice[k]});V7.sfx('goal')}
 else{V7.log(`R2 ${k} ${res==='foot'?'FOOT-FOUL':'MISS'} ${i}/${max}`,m.src);V7.fx('miss',{k});V7.sfx(res==='foot'?'buzz':'miss');V7.gem('',res==='foot'?'پا روی خط. پرتاب باطل.':'نخورد.')}
 if(!V7.r2Turn()){s.r2.done=true;V7.log('R2 END')}return {ok:true}};

/* ---------- R3 · speed sandwich duel ---------- */
H['r3.start']=(p,m)=>{const s=V7.S();s.r3=Object.assign(s.r3,{t0:V7.vnow(),run:true,E:pp(),M:pp(),result:null,applied:false,safety:false,pick:null});V7.log('R3 START',m.src);V7.sfx('beep');if(window.V7SUB)V7SUB.silence(true);return {ok:true}};
H['r3.mouthfull']=(p,m)=>{const s=V7.S(),x=s.r3[p.p];if(!s.r3.run)return {ok:false,err:'اول شروع را بزنید'};if(x.status!=='eating')return {ok:false,err:'قبلاً ثبت شده'};
 x.T=r1d(since(s.r3.t0));x.status='mouthfull';x.mfV=V7.vnow();V7.log(`R3 ${p.p} MOUTHFULL T=${x.T.toFixed(1)}`,m.src);V7.sfx('ding');V7.fx('mouthfull',{k:p.p,T:x.T});r3Maybe(s);return {ok:true}};
H['r3.empty']=(p,m)=>{const s=V7.S(),x=s.r3[p.p];if(x.status!=='mouthfull')return {ok:false,err:'اول «دهان‌پر» ثبت شود'};x.status='final';V7.log(`R3 ${p.p} EMPTY OK`,m.src);V7.sfx('pop');V7.fx('stamp',{k:p.p,ok:true,text:'خالی ✔'});r3Maybe(s);return {ok:true}};
H['r3.pen']=(p,m)=>{const s=V7.S(),x=s.r3[p.p];x.pen=(x.pen||0)+V7.cfg().r3.debrisPenalty;V7.log(`R3 ${p.p} PENALTY +${V7.cfg().r3.debrisPenalty}s (T total pen ${x.pen})`,m.src);V7.sfx('buzz');r3Maybe(s,true);return {ok:true}};
H['r3.dq']=(p,m)=>{const s=V7.S();s.r3[p.p].status='dq';V7.log(`R3 ${p.p} DQ`,m.src);V7.gem('','طبق قانون… رد. ساندویچ حقّ اعتراض نداره.');r3Maybe(s);return {ok:true}};
H['r3.safety']=(p,m)=>{const s=V7.S();s.r3.safety=true;s.r3.run=false;V7.log('R3 SAFETY STOP «قرمز» → round cancelled',m.src);V7.sfx('alarm');r3Maybe(s,true);return {ok:true}};
H['r3.pick']=(p,m)=>{const s=V7.S();s.r3.pick=p.pick;V7.log(`R3 NOBODY FINISHED · less left = ${p.pick}`,m.src);r3Maybe(s,true);return {ok:true}};
H['r3.edit']=(p,m)=>{const s=V7.S(),x=s.r3[p.p];const old=x.T;x.T=r1d(+p.T);if(x.status==='eating'||x.status==='dnf')x.status='final';V7.log(`EDIT R3 ${p.p} T ${old}→${x.T} reason=${p.reason||'تروث‌کم'}`,m.src);r3Maybe(s,true);return {ok:true}};
function r3Maybe(s,force){const r=s.r3;const done=k=>['final','dnf','dq'].includes(r[k].status);if(!r.safety&&!(done('E')&&done('M')))return;
 const res=R.r3Score({E:r.E,M:r.M},{safety:r.safety,pick:r.pick},V7.cfg());r.result=res;r.run=false;if(window.V7SUB)V7SUB.silence(false);
 if(res.need){V7.gem('','وقت تموم.');return}const w=Object.keys(res.awards);
 if(w.length===1)announce(w[0],res.awards[w[0]]);else if(w.length===2)V7.gem(`جمنای، اعلام کن: هر دو، پنج ثانیه.`,'هر دو، پنج ثانیه. تساوی نفس‌گیر.')}
H['r3.confirm']=(p,m)=>{const s=V7.S(),r=s.r3;if(!r.result||r.result.need)return {ok:false,err:'نتیجه هنوز کامل نیست'};if(r.applied)return {ok:false,err:'قبلاً اعمال شده'};r.applied=true;
 const aw=r.result.awards;for(const k in aw)give(k,aw[k],'راند ۳ · دوئل ساندویچ');const d=r.result.delta!=null?` (Δ${r.result.delta})`:'';
 V7.log(`R3 RESULT ${Object.entries(aw).map(([k,v])=>`${k} +${v}`).join(' ')||'NONE'}${d} ${r.result.note} BANK=${V7.bank('E')}|${V7.bank('M')}`,m.src);V7.fx('win',{k:Object.keys(aw)[0],sec:Object.values(aw)[0]});V7.sfx('cash');return {ok:true}};
function r3Tick(s){const r=s.r3;if(!r.run)return false;let ch=false;const c=V7.cfg().r3;
 for(const k of ['E','M']){const x=r[k];if(x.status==='mouthfull'&&since(x.mfV)>=c.swallow){x.status='dnf';x.T=c.limit;V7.log(`R3 ${k} NO EMPTY IN ${c.swallow}s → T=${c.limit}`);ch=true}
  if(x.status==='eating'&&since(r.t0)>=c.limit){x.status='dnf';x.T=c.limit;V7.log(`R3 ${k} LIMIT → T=${c.limit}`);ch=true}}
 if(ch){V7.sfx('buzz');r3Maybe(s)}return ch}
V7.r3Live=k=>{const s=V7.S(),r=s.r3,x=r[k];const c=V7.cfg().r3;if(x.status==='eating')return {T:r.run?since(r.t0):0,st:'eating'};
 if(x.status==='mouthfull')return {T:x.T,st:'mouthfull',swallow:Math.max(0,c.swallow-since(x.mfV))};return {T:x.T,st:x.status}};

/* ---------- R4 · gloves, puzzle, glue + glue challenge ---------- */
H['r4.start']=(p,m)=>{const s=V7.S();s.r4=Object.assign(s.r4,{t0:V7.vnow(),run:true,fin:{},finV:{},lock:{},valid:{},first:null,ch:null,chUsed:false,final:false,secondAt:0});V7.log('R4 START',m.src);V7.sfx('startHorn');return {ok:true}};
H['r4.finish']=(p,m)=>{const s=V7.S(),r=s.r4;const k=p.p;if(!r.run&&!r.t0)return {ok:false,err:'راند ۴ شروع نشده'};if((r.lock[k]||0)>Date.now())return {ok:false,err:'دکمه ۵ ثانیه قفل است'};if(r.fin[k]!=null)return {ok:false,err:'«تمام» قبلاً ثبت شده'};
 r.fin[k]=r1d(since(r.t0));r.finV[k]=Date.now();V7.log(`R4 ${k} FINISH ${V7.mmss(r.fin[k])}`,m.src);V7.sfx('ding');V7.fx('finish',{k});if(r.fin.E!=null&&r.fin.M!=null)r.secondAt=Date.now();return {ok:true}};
H['r4.wrong']=(p,m)=>{const s=V7.S(),r=s.r4;let k=p.p;if(!k){const c=['E','M'].filter(x=>r.fin[x]!=null&&!r.valid[x]).sort((a,b)=>r.finV[b]-r.finV[a]);k=c[0]}if(!k||r.fin[k]==null)return {ok:false,err:'«تمام»ی برای لغو نیست'};
 r.fin[k]=null;r.lock[k]=Date.now()+V7.cfg().r4.wrongLock*1000;r.secondAt=0;V7.log(`R4 ${k} WRONG → FINISH CANCELLED, LOCK ${V7.cfg().r4.wrongLock}s`,m.src);V7.sfx('buzz');V7.gem('','سر گرگ برعکسه. ادامه بدید.');return {ok:true}};
H['r4.valid']=(p,m)=>{const s=V7.S(),r=s.r4;let k=p.p;if(!k){const c=['E','M'].filter(x=>r.fin[x]!=null&&!r.valid[x]).sort((a,b)=>r.finV[a]-r.finV[b]);k=c[0]}if(!k||r.fin[k]==null)return {ok:false,err:'«تمام»ی برای تأیید نیست'};
 r.valid[k]=true;if(!r.first){r.first=k;const sec=V7.cfg().r4.reward;give(k,sec,'راند ۴ · اولین «تمام» معتبر');V7.log(`R4 ${k} VALID +${sec}`,m.src);announce(k,sec);V7.fx('win',{k,sec});V7.sfx('cash')}else V7.log(`R4 ${k} VALID (second)`,m.src);return {ok:true}};
H['r4.none']=(p,m)=>{const s=V7.S(),r=s.r4;if(r.first)return {ok:false,err:'برندهٔ راند ۴ ثبت شده'};r.correct={E:+p.E||0,M:+p.M||0};const aw=R.r4Score({first:null,correct:r.correct},V7.cfg());for(const k in aw){give(k,aw[k],'راند ۴ · پازل درست‌تر');announce(k,aw[k])}r.final=true;r.run=false;V7.log(`R4 NOBODY VALID · correct E${r.correct.E} M${r.correct.M} ${Object.entries(aw).map(([k,v])=>k+' +'+v).join(' ')||'NO AWARD'}`,m.src);return {ok:true}};
H['gc.open']=(p,m)=>{const s=V7.S(),r=s.r4;const k=p.p||(r.first?V7.opp(r.first):null);if(!r.first)return {ok:false,err:'چالش فقط بعد از «تمام» معتبر نفر اول'};if(r.chUsed)return {ok:false,err:'چالش فقط یک بار'};if(k===r.first)return {ok:false,err:'فقط نفر دوم می‌تواند چالش کند'};if(r.fin[k]==null)return {ok:false,err:'نفر دوم باید اول «تمام» خودش را ثبت کند'};
 r.chUsed=true;r.ch={by:k,at:Date.now(),checks:{shake:null,frame:null,clean:null},result:null,touched:false};V7.log(`R4 ${k} CHALLENGE`,m.src);enter('GLUE_CHALLENGE',m);V7.gem('','تست تکان.');return {ok:true}};
H['gc.check']=(p,m)=>{const s=V7.S(),c=s.r4.ch;if(!c)return {ok:false,err:'چالشی باز نیست'};c.checks[p.k]=p.v;if(p.k==='shake')V7.log(`R4 ${c.by} CHALLENGE SHAKE=${p.v}`,m.src);return {ok:true}};
H['gc.result']=(p,m)=>{const s=V7.S(),r=s.r4,c=r.ch;if(!c||c.result)return {ok:false,err:'چالشی باز نیست'};c.result=p.res;c.touched=!!p.touched;const f=r.first,by=c.by;const cfg=V7.cfg().r4;
 if(p.res==='win'||p.touched){give(by,cfg.chWin[0],'چالش چسب · موفق');give(f,cfg.chWin[1]-cfg.reward,'چالش چسب · سهم نفر اول');V7.log(`R4 CHALLENGE WIN ${by} ${by}+${cfg.chWin[0]} ${f}+${cfg.chWin[1]}(${cfg.chWin[1]-cfg.reward})`,m.src);V7.gem(`جمنای، اعلام کن: ${V7.plain(by)} ده ثانیه، ${V7.plain(f)} پنج ثانیه.`,`${V7.plain(by)}، ده ثانیه. ${V7.plain(f)}، پنج ثانیه. چسب، حرف آخر رو زد.`);V7.fx('win',{k:by,sec:cfg.chWin[0]})}
 else if(p.res==='lose'){give(by,cfg.chLose,'چالش چسب · ناموفق');V7.log(`R4 CHALLENGE LOSE ${by} ${cfg.chLose}`,m.src);V7.gem('',`برنده‌ی چسب: ${V7.plain(f)}. ${V7.plain(by)}، منفی پنج.`);V7.fx('stamp',{k:by,ok:false,text:'−۵'})}
 else{V7.log(`R4 CHALLENGE UNCLEAR → no change`,m.src);V7.gem('','تشخیص نمیدم.')}
 finalizeR4('CHALLENGE');s.state='R4_GLUE';return {ok:true}};
function finalizeR4(why){const s=V7.S(),r=s.r4;if(r.final)return;r.final=true;r.run=false;V7.log(`R4 FINAL (${why}) BANK=${V7.bank('E')}|${V7.bank('M')}`)}
function r4Tick(s){const r=s.r4;if(r.final)return false;const c=V7.cfg().r4;if(r.secondAt&&!r.ch&&Date.now()-r.secondAt>c.finalizeAfter*1000&&r.first){finalizeR4('20s AFTER 2nd FINISH');return true}
 if(r.run&&since(r.t0)>=c.limit){r.run=false;V7.log('R4 TIME UP 180s');V7.sfx('buzz');return true}return false}

/* ---------- REVEAL · distance cap 30 (once, only here) ---------- */
H['reveal.show']=(p,m)=>{const s=V7.S();if(s.reveal.done)return {ok:false,err:'رونمایی قبلاً انجام شده'};const b=V7.banks();s.reveal.from=b;const g=R.gapCap(b,V7.cfg());s.reveal.done=true;s.reveal.at=Date.now();s.reveal.cap=g;
 if(g.apply){give(g.trail,g.delta,'سقف فاصله ۳۰');V7.log(`REVEAL GAP=${g.gap} CAP=YES ${g.trail}+${g.delta}`,m.src);V7.gem('','فاصله بیشتر از سی. طبق قانون، بانک نفر عقب میرسه به سی ثانیه پشت نفر جلو.')}
 else{V7.log(`REVEAL GAP=${g.gap} CAP=NO`,m.src);const nb=V7.banks();V7.gem(`جمنای، اعلام کن: ${V7.plain('E')} ${V7.wordsMin(nb.E)}. ${V7.plain('M')} ${V7.wordsMin(nb.M)}.`,`${V7.plain('E')}، ${V7.wordsMin(nb.E)}. ${V7.plain('M')}، ${V7.wordsMin(nb.M)}.${g.gap===30?' سی. دقیقاً روی مرز. قانون اعمال نمیشه.':''}`)}
 V7.fx('reveal',{});V7.sfx('riser');return {ok:true}};

/* ---------- SHOP · 5 cards, max 2, max 1 red, leader tax 5, floor 20, mirror→shield→apply ---------- */
V7.shopTurn=()=>{const s=V7.S();const b=s.shop.banksAt||V7.banks();const ord=R.riskOrder(b);return ord.find(k=>!s.shop.sub[k])||null};
V7.shopAvail=k=>{const s=V7.S();return R.shopAvail(k,s.shop.picks[k],s.shop.banksAt||V7.banks(),V7.cfg())};
H['shop.pick']=(p,m)=>{const s=V7.S();if(s.state!=='SHOP')return {ok:false,err:'فروشگاه باز نیست'};const k=p.p,sh=s.shop;if(sh.sub[k])return {ok:false,err:'انتخاب ثبت شده'};
 const i=sh.picks[k].indexOf(p.card);if(i>=0){sh.picks[k].splice(i,1);sh.pickT[k].splice(i,1);return {ok:true}}
 const av=V7.shopAvail(k)[p.card];if(!av||!av.ok)return {ok:false,err:av?av.reason:'کارت نامعتبر'};sh.picks[k].push(p.card);sh.pickT[k].push(V7.clk());sh.src[k]=m.src;return {ok:true}};
H['shop.none']=(p,m)=>{const s=V7.S();s.shop.picks[p.p]=[];s.shop.pickT[p.p]=[];return {ok:true}};
H['shop.submit']=(p,m)=>{const s=V7.S();if(s.state!=='SHOP')return {ok:false,err:'فروشگاه باز نیست'};s.shop.sub[p.p]=true;V7.log(`SHOP ${p.p} SUBMIT ● (sealed)`,m.src);V7.fx('sealed',{k:p.p});V7.sfx('click');return {ok:true}};
H['shop.reveal']=(p,m)=>{const s=V7.S(),sh=s.shop;if(s.state!=='SHOP')return {ok:false,err:'فروشگاه باز نیست'};if(!(sh.sub.E&&sh.sub.M)&&!p.force)return {ok:false,err:'هر دو باید «ثبت» کنند'};
 const b=sh.banksAt||V7.banks();const res=R.shopResolve(sh.picks,b,V7.cfg());sh.res=res;
 ['E','M'].forEach(k=>{sh.picks[k].forEach((id,i)=>{const pr=R.price(id,k,b,V7.cfg());const tax=pr-R.card(id).price;G().journal.push({id:uid(),t:Date.now(),kind:'v7',player:null,delta:0,reason:`${sh.pickT[k][i]||V7.clk()} SHOP ${k} PICK=${id}${tax?` TAX=${tax}`:''}${sh.src[k]&&sh.src[k]!=='host'?` (${sh.src[k]})`:''}`,seg:curSegIndex(),v7:1})});if(res.costs[k])give(k,-res.costs[k],'فروشگاه کارت')});
 res.labels.forEach(l=>{if(R.card(l.card).color!=='blue'||l.res==='BURNED')V7.log(`SHOP REVEAL ${l.card}->${l.target} ${l.res}`,m.src)});
 ['E','M'].forEach(k=>{s.effects[k]=Object.assign({hintUsed:false},res.effects[k])});
 const nb=V7.banks();const act=res.labels.filter(l=>R.card(l.card).color!=='blue'||l.res==='BURNED');
 if(res.none)V7.gem('','هیچ‌کس ریسک نکرد.');else V7.gem(`جمنای، اعلام کن: ${['E','M'].map(k=>`${V7.plain(k)}، ${sh.picks[k].map(id=>R.card(id).fa).join(' و ')||'هیچی'}`).join('. ')}.`,`بانک جدید: ${V7.plain('E')}، ${V7.words(nb.E)}. ${V7.plain('M')}، ${V7.words(nb.M)}.${act.some(l=>l.res==='BLOCKED')?' کارت قرمز سوخت. سپر فعال شد.':''}${act.some(l=>l.res==='BOUNCED')?' آینه! کارت برگشت به صاحبش.':''}`);
 enter('SHOP_REVEAL',m);V7.fx('cards',{labels:res.labels});return {ok:true}};

/* ---------- RISK SHOT · 0/10/20 public, all-in 30 only trailing by ≥15, floor 20 ---------- */
H['risk.stake']=(p,m)=>{const s=V7.S();if(s.state!=='RISK')return {ok:false,err:'شوت ریسک باز نیست'};if(s.risk.lock[p.p])return {ok:false,err:'شرط قفل شده'};const o=R.riskOptions(p.p,V7.banks(),V7.cfg())[p.stake];if(!o||!o.ok)return {ok:false,err:o?o.reason:'شرط نامعتبر'};s.risk.stake[p.p]=+p.stake;return {ok:true}};
H['risk.lock']=(p,m)=>{const s=V7.S();const k=p.p;if(s.risk.stake[k]==null)return {ok:false,err:'اول شرط را انتخاب کنید'};const ord=s.risk.order||R.riskOrder(V7.banks());if(k===ord[1]&&!s.risk.lock[ord[0]])return {ok:false,err:'اول نفر عقب اعلام می‌کند'};
 s.risk.lock[k]=true;const st=s.risk.stake[k];V7.log(`RISK ${k} STAKE=${st===30?'ALLIN30':st} LOCK`,m.src);V7.fx('chain',{k});V7.sfx('lockClank');return {ok:true}};
H['risk.result']=(p,m)=>{const s=V7.S();const k=p.p;if(!s.risk.lock[k])return {ok:false,err:'شرط قفل نشده'};if(s.risk.res[k]!=null)return {ok:false,err:'نتیجه ثبت شده'};const st=s.risk.stake[k]||0;s.risk.res[k]=p.hit?'hit':'miss';
 if(st)give(k,p.hit?st:-st,`شوت ریسک · ${p.hit?'خورد':'نخورد'}`);V7.log(`RISK ${k} ${p.hit?'HIT':'MISS'} ${p.hit?'+':'-'}${st} BANK=${V7.bank(k)}`,m.src);
 V7.fx(p.hit?'riskhit':'riskmiss',{k,st});V7.sfx(p.hit?'cash':'glassCrack');const nb=V7.banks();
 if(s.risk.res.E&&s.risk.res.M)V7.gem(`جمنای، اعلام کن: ${V7.plain('E')} ${V7.words(nb.E)}. ${V7.plain('M')} ${V7.words(nb.M)}.`,`${V7.plain('E')}، ${V7.words(nb.E)}. ${V7.plain('M')}، ${V7.words(nb.M)}.`);else V7.gem('',p.hit?'خورد.':'نخورد. دو سانت. دو سانت دردناک.');return {ok:true}};

/* ---------- LOCK CODE + seal (pre-show) ---------- */
const obf=(t,salt)=>btoa(String(t).split('').map((c,i)=>String.fromCharCode(c.charCodeAt(0)^salt.charCodeAt(i%salt.length))).join(''));
const deobf=(t,salt)=>{try{return atob(t).split('').map((c,i)=>String.fromCharCode(c.charCodeAt(0)^salt.charCodeAt(i%salt.length))).join('')}catch(e){return ''}};
V7.setLock=async(code)=>{code=String(code).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));if(!/^\d{3}$/.test(code))throw new Error('رمز باید سه رقم باشد');const s=V7.S();const salt=Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b=>b.toString(36)).join('');
 const seal=await R.sealHash(code,salt);s.lock={set:true,enc:obf(code,salt),salt,seal,at:Date.now()};V7.log(`LOCK SEALED SEAL=${seal}`);D.save();V7.emit('change');return seal};
const code=()=>{const s=V7.S();return s.lock.set?deobf(s.lock.enc,s.lock.salt):''};
V7.digit=i=>{const c=code();return c?+c[i]:null};
V7.verifySeal=async()=>{const s=V7.S();if(!s.lock.set)return false;return (await R.sealHash(code(),s.lock.salt))===s.lock.seal};

/* ---------- VAULT · stations, memory room, riddle, code ---------- */
function usedRiddles(){try{return JSON.parse(localStorage.getItem('v7-riddles-used')||'[]')}catch(e){return []}}
function armVault(meta){const s=V7.S(),v=s.vault;if(!s.lock.set){V7.log('WARN VAULT ARMED WITHOUT SEALED CODE (demo 472)');V7.setLock('472')}
 const pool=R.TARGETS.filter(t=>v.cb||!t.callback);v.target=pool[crypto.getRandomValues(new Uint32Array(1))[0]%pool.length].name;
 v.pattern=R.memPattern(crypto.getRandomValues(new Uint32Array(1))[0]);const used=usedRiddles();const d3=V7.digit(2);
 const bank=R.RIDDLES.map(r=>Object.assign({},r,{used:used.includes(r.id)}));const pr=(P_().v7riddles||[]).map(r=>Object.assign({},r,{used:used.includes(r.id)}));
 let rd=R.riddlePick(d3,pr.concat(bank));if(!rd){rd=R.RIDDLES.find(r=>r.answer===d3);V7.log('WARN RIDDLE BUCKET EMPTY → reuse')}v.riddle=rd;
 const b=V7.banks();const l=R.leaderOf(b);v.order=l?[V7.opp(l),l]:['M','E'];v.armed=true;V7.log(`VAULT ARMED ORDER=${v.order.join('→')} TARGET=#${R.TARGETS.findIndex(t=>t.name===v.target)+1} RIDDLE#${rd.id} SEAL=${s.lock.seal}`,meta&&meta.src);V7.fx('armed',{});V7.sfx('vaultArm')}
H['vault.arm']=(p,m)=>{const s=V7.S();s.vault.cb=!!p.callbacks;armVault(m);if(s.state!=='VAULT_ARMED')enter('VAULT_ARMED',m);return {ok:true}};
function newRun(k){return {k,bank0:V7.bank(k),clock:V7.bank(k),runAt:0,station:0,c:[false,false,false],s1:{phase:'idle',at:0,tries:0},s2:{phase:'idle',at:0,input:[0,0,0,0,0,0,0,0],checks:0,n:null,hintAt:0},s3:{lockUntil:0,tries:0},code:{lockUntil:0,reflashAt:0},show:{i:-1,at:0},opened:false,left:null,codes:0,done:false,pens:0,started:false}}
V7.curRun=()=>{const s=V7.S(),v=s.vault;if(!v.order)return null;const k=s.state==='RUN1'?v.order[0]:s.state==='RUN2'?v.order[1]:null;return k?v.runs[k]:null};
V7.clockOf=run=>!run?0:Math.max(0,run.runAt?run.clock-(V7.vnow()-run.runAt)/1000:run.clock);
const runTag=()=>V7.S().state;
function burn(run,sec,why,src){const c=V7.clockOf(run);run.clock=Math.max(0,c-sec);if(run.runAt)run.runAt=V7.vnow();run.pens+=sec;V7.log(`${runTag()} ${run.k} ${why} -${sec}`,src);V7.fx('penalty',{k:run.k,sec})}
function showCode(run,i){run.show={i,at:Date.now()};run.c[i]=true;run.codes=run.c.filter(Boolean).length;V7.fx('code',{k:run.k,i,d:V7.digit(i)});V7.sfx('codeReveal')}
H['run.start']=(p,m)=>{const run=V7.curRun();if(!run)return {ok:false,err:'در حالت دویدن نیستید'};if(run.started)return {ok:false,err:'این دویدن شروع شده'};run.started=true;run.bank0=V7.bank(run.k);run.clock=run.bank0;run.runAt=V7.vnow();run.station=1;run.s1={phase:'show',at:Date.now(),tries:0};
 V7.log(`${runTag()} ${run.k} START CLOCK=${run.clock.toFixed(1)}`,m.src);V7.sfx('startHorn');return {ok:true}};
H['run.pause']=(p,m)=>{const run=V7.curRun();if(!run||!run.started||run.done)return {ok:false,err:'دونده‌ای در حال دویدن نیست'};if(run.runAt){run.clock=V7.clockOf(run);run.runAt=0;V7.log(`${runTag()} ${run.k} JUDGE PAUSE`,m.src)}else{run.runAt=V7.vnow();V7.log(`${runTag()} ${run.k} RESUME`,m.src)}return {ok:true}};
H['run.pen']=(p,m)=>{const run=V7.curRun();if(!run)return {ok:false,err:'دونده‌ای نیست'};burn(run,+p.sec||10,`PENALTY ${p.reason||''}`,m.src);return {ok:true}};
H['run.reroll']=(p,m)=>{const s=V7.S(),v=s.vault;const pool=R.TARGETS.filter(t=>v.cb||!t.callback);v.target=pool[crypto.getRandomValues(new Uint32Array(1))[0]%pool.length].name;v.pattern=R.memPattern(crypto.getRandomValues(new Uint32Array(1))[0]);v.rerolls++;V7.log(`RE-ROLL target+pattern (isolation breach) #${v.rerolls}`,m.src);return {ok:true}};
H['s1.show']=(p,m)=>{const run=V7.curRun();if(!run)return {ok:false};run.s1={phase:'show',at:Date.now(),tries:run.s1.tries};return {ok:true}};
H['s1.judge']=(p,m)=>{const v=V7.S().vault;const j=R.judgeWord(v.target,p.word||'');V7.log(`${runTag()} S1 GEMINI SAID «${p.word||''}» → ${j.word} ${j.ok?'OK':'NO'}`,m.src);return j.ok?H['s1.pass'](p,m):H['s1.fail'](p,m)};
H['s1.pass']=(p,m)=>{const run=V7.curRun();if(!run||run.station!==1)return {ok:false,err:'ایستگاه ۱ فعال نیست'};run.s1.phase='pass';showCode(run,0);V7.log(`${runTag()} ${run.k} S1 PASS C1 SHOWN`,m.src);run.station=2;run.s2={phase:'ready',at:0,input:[0,0,0,0,0,0,0,0],checks:0,n:null,hintAt:0};return {ok:true}};
H['s1.fail']=(p,m)=>{const run=V7.curRun();if(!run||run.station!==1)return {ok:false,err:'ایستگاه ۱ فعال نیست'};run.s1.tries++;run.s1.phase='draw';V7.log(`${runTag()} ${run.k} S1 FAIL → new sheet (clock runs)`,m.src);V7.sfx('scratch');V7.fx('stamp',{k:run.k,ok:false,text:'دوباره!'});return {ok:true}};
H['s2.start']=(p,m)=>{const run=V7.curRun();if(!run||run.station!==2)return {ok:false,err:'ایستگاه ۲ فعال نیست'};run.s2.phase='show';run.s2.at=Date.now();V7.log(`${runTag()} ${run.k} S2 SHOW 5s`,m.src);V7.sfx('cascade');return {ok:true}};
H['s2.toggle']=(p,m)=>{const run=V7.curRun();if(!run||run.s2.phase!=='input')return {ok:false,err:'ورود هنوز باز نیست'};run.s2.input[p.i]=run.s2.input[p.i]?0:1;V7.sfx('click');return {ok:true,noUndo:true}};
H['s2.check']=(p,m)=>{const run=V7.curRun();if(!run||run.s2.phase!=='input')return {ok:false,err:'ورود باز نیست'};const v=V7.S().vault;const n=R.memCheck(v.pattern,run.s2.input);run.s2.checks++;run.s2.n=n;
 if(n<8){burn(run,V7.cfg().vault.checkPenalty,`S2 CHECK ${n}/8`,m.src);V7.sfx('buzz');V7.fx('memwrong',{n});V7.gem('',`${V7.words(n)} از هشت. حافظه‌ت رفته مرخصی.`)}else{run.s2.phase='done';showCode(run,1);V7.log(`${runTag()} ${run.k} S2 PASS C2 SHOWN`,m.src);V7.fx('memok',{});run.station=3;run.s3={lockUntil:0,tries:0}}return {ok:true}};
H['s2.hint']=(p,m)=>{const s=V7.S(),run=V7.curRun();if(!run)return {ok:false};const e=s.effects[run.k];if(!e.hint||e.hintUsed)return {ok:false,err:'ذره‌بین ندارد یا مصرف شده'};e.hintUsed=true;if(run.station===2){run.s2.hintAt=Date.now();V7.log(`${runTag()} ${run.k} HINT MEMORY 3s`,m.src)}else{run.s3.hint=true;V7.log(`${runTag()} ${run.k} HINT RIDDLE`,m.src)}V7.sfx('shimmer');return {ok:true}};
H['s3.answer']=(p,m)=>{const s=V7.S(),run=V7.curRun();if(!run||run.station!==3)return {ok:false,err:'ایستگاه ۳ فعال نیست'};if(run.s3.lockUntil>Date.now())return {ok:false,err:'۵ ثانیه قفل'};const r=s.vault.riddle;run.s3.tries++;
 if(+p.d===r.answer){showCode(run,2);V7.log(`${runTag()} ${run.k} S3 RIDDLE#${r.id} OK`,m.src);V7.gem('','مغزت روشن شد.');run.station=4;run.code={lockUntil:0,reflashAt:0}}
 else{run.s3.lockUntil=Date.now()+V7.cfg().vault.riddleLock*1000;V7.log(`${runTag()} ${run.k} S3 WRONG ${p.d} LOCK 5s`,m.src);V7.sfx('buzz');V7.gem('','نه. پنج ثانیه فکر کن.')}return {ok:true}};
H['code.enter']=(p,m)=>{const s=V7.S(),run=V7.curRun();if(!run||run.station!==4)return {ok:false,err:'هنوز به گاوصندوق نرسیده'};if(run.code.lockUntil>Date.now())return {ok:false,err:'۵ ثانیه قفل'};const c=String(p.code||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
 if(c===code()){run.left=r1d(V7.clockOf(run));run.clock=run.left;run.runAt=0;run.opened=true;run.done=true;V7.log(`${runTag()} ${run.k} VAULT OPEN LEFT=${run.left.toFixed(1)}`,m.src);V7.fx('vaultopen',{k:run.k,left:run.left});V7.sfx('vaultOpen');
  V7.gem('',`گاوصندوق باز شد. ${V7.wordsDec(run.left)} ثانیه باقی مونده.`)}
 else{run.code.lockUntil=Date.now()+V7.cfg().vault.codeLock*1000;run.code.reflashAt=Date.now()+V7.cfg().vault.codeLock*1000;V7.log(`${runTag()} ${run.k} CODE WRONG LOCK 5s + REFLASH`,m.src);V7.sfx('buzz');V7.fx('stamp',{k:run.k,ok:false,text:'رمز غلط'})}return {ok:true}};
function vaultTick(s){const run=V7.curRun();if(!run||!run.started||run.done)return false;const c=V7.cfg().vault;let ch=false;
 if(run.s1.phase==='show'&&Date.now()-run.s1.at>=c.showTarget*1000){run.s1.phase='draw';ch=true}
 if(run.s2.phase==='show'&&Date.now()-run.s2.at>=c.memShow*1000){run.s2.phase='lock';run.s2.at=Date.now();V7.sfx('lockPulse');ch=true}
 if(run.s2.phase==='lock'&&Date.now()-run.s2.at>=c.memLock*1000){run.s2.phase='input';run.s2.at=Date.now();ch=true}
 if(run.runAt&&V7.clockOf(run)<=0){run.clock=0;run.runAt=0;run.done=true;run.left=0;run.codes=run.c.filter(Boolean).length;V7.log(`${runTag()} ${run.k} TIME OUT codes=${run.codes}`);V7.fx('timeout',{k:run.k});V7.sfx('vaultClose');ch=true}
 return ch}

/* ---------- CASE · three layers ---------- */
function openCase(){const s=V7.S(),v=s.vault;const runs={};['E','M'].forEach(k=>{const r=v.runs[k];if(r)runs[k]={opened:r.opened,left:r.left||0,codes:r.codes||0}});
 const fr=R.finalRank(runs);s.cse.at=Date.now();if(fr&&fr.winner){s.cse.winner=fr.winner;s.cse.why=fr.why}else s.cse.why=fr?fr.why:'';
 V7.verifySeal().then(ok=>{V7.log(`CASE WINNER=${s.cse.winner||'?'} (${s.cse.why}) SEAL=${s.lock.seal} ${ok?'OK':'MISMATCH'}`);D.save();V7.emit('change')});
 const w=s.cse.winner;const L=k=>runs[k]&&runs[k].opened?V7.wordsDec(runs[k].left):'صفر';
 V7.gem(`جمنای، اعلام کن: ${V7.plain(v.order[0])} ${L(v.order[0])}. ${V7.plain(v.order[1])} ${L(v.order[1])}.`,`${V7.plain(v.order[0])}، ${L(v.order[0])}. ${V7.plain(v.order[1])}، ${L(v.order[1])}. برنده‌ی کیف… ${w?V7.plain(w):''}.`);V7.fx('case',{k:w});V7.sfx('caseOpen')}
H['case.winner']=(p,m)=>{const s=V7.S();s.cse.winner=p.p;s.cse.why='SUDDEN_DEATH';V7.log(`CASE SUDDEN DEATH (token) WINNER=${p.p}`,m.src);return {ok:true}};
H['case.env']=(p,m)=>{const s=V7.S();s.cse.env=p.n||null;s.cse.envText=p.text||(p.n?R.ENVELOPES[p.n-1].title:'');V7.log(`CASE L2 ENVELOPE ${p.n?'#'+p.n:''} ${s.cse.envText}`,m.src);V7.fx('envelope',{});return {ok:true}};
H['case.bite']=(p,m)=>{const s=V7.S();if(s.cse.bites.includes(p.n)||s.cse.bites.length>=2)return {ok:false,err:'دو جعبه انتخاب شده'};s.cse.bites.push(p.n);V7.log(`CASE L3 BITE #${p.n} ${R.BITES[p.n-1].title}`,m.src);V7.sfx(p.n===2?'sadTrombone':'pop');if(s.cse.bites.length===2){s.cse.revealAll=true;V7.gem('','چون من داورم. و داور عاشق عدالته.')}return {ok:true}};
function bumpBadge(k){try{const b=JSON.parse(localStorage.getItem('v7-badges')||'{}');const n=V7.plain(k);b[n]=(b[n]||0)+1;localStorage.setItem('v7-badges',JSON.stringify(b));D.kvPut('v7-badges',b)}catch(e){}V7.log(`BADGE +1 ${k}`)}
V7.badges=()=>{try{return JSON.parse(localStorage.getItem('v7-badges')||'{}')}catch(e){return {}}};
H['case.retire']=(p,m)=>{const s=V7.S();const r=s.vault.riddle;if(!r)return {ok:false};const u=usedRiddles();if(!u.includes(r.id)){u.push(r.id);localStorage.setItem('v7-riddles-used',JSON.stringify(u))}V7.log(`RIDDLE ${r.id} RETIRED`,m.src);return {ok:true}};

/* ---------- ticking ---------- */
let lastSec=-1;
setInterval(()=>{const p=P_();if(!p||!p.v7run||!p.v7run.on)return;const s=V7.S();let ch=false;
 try{ch=r1Tick(s)||ch;ch=r3Tick(s)||ch;ch=r4Tick(s)||ch;ch=vaultTick(s)||ch}catch(e){console.warn('[V7 tick]',e)}
 const t=V7.timer();if(t&&t.remain!=null&&t.remain<=10&&t.remain>0&&!s.paused){const sec=Math.ceil(t.remain);if(sec!==lastSec){lastSec=sec;V7.sfx('tickHard')}}
 if(ch){s.seq++;D.save();V7.emit('change',{tick:true})}else V7.emit('tick')},100);

/* ---------- the one "main timer" per state (for HUD, phones, subtitles collision) ---------- */
V7.timer=()=>{const s=V7.S();const c=V7.cfg();switch(s.state){
 case 'R1':return s.r1.t0?{label:'راند ۱',remain:s.r1.run?Math.max(0,c.r1.limit-since(s.r1.t0)):s.r1.winner?null:0,total:c.r1.limit}:{label:'راند ۱',remain:c.r1.limit,total:c.r1.limit,idle:true};
 case 'R3_SANDWICH':return {label:'دوئل ساندویچ',elapsed:s.r3.run?since(s.r3.t0):0,total:c.r3.limit,remain:s.r3.run?Math.max(0,c.r3.limit-since(s.r3.t0)):null};
 case 'R4_GLUE':case 'GLUE_CHALLENGE':return {label:'راند ۴',remain:s.r4.t0&&!s.r4.final?Math.max(0,c.r4.limit-since(s.r4.t0)):null,total:c.r4.limit,elapsed:s.r4.t0?since(s.r4.t0):0};
 case 'RUN1':case 'RUN2':{const r=V7.curRun();return r?{label:V7.plain(r.k),remain:V7.clockOf(r),total:r.bank0,run:true}:null}
 default:return null}};

/* ---------- snapshot for phones (secrets only in the owner's private part) ---------- */
V7.snapshot=()=>{const s=V7.S(),b=V7.banks(),t=V7.timer();const run=V7.curRun();
 const pub={seq:s.seq,on:s.on,state:s.state,stateFa:R.STATE_FA[s.state],clk:V7.clk(),paused:s.paused,banks:b,names:{E:V7.plain('E'),M:V7.plain('M')},colors:{E:V7.color('E'),M:V7.color('M')},
  timer:t?{label:t.label,remain:t.remain!=null?+t.remain.toFixed(1):null,elapsed:t.elapsed!=null?+t.elapsed.toFixed(1):null,total:t.total}:null,
  r1:{hold:Object.keys(s.r1.hold),winner:s.r1.winner,run:s.r1.run},r2:{choice:s.r2.locked?s.r2.choice:{},locked:s.r2.locked,throws:s.r2.throws,turn:V7.r2Turn(),scored:s.r2.scored},
  r3:{run:s.r3.run,E:V7.r3Live('E'),M:V7.r3Live('M'),result:s.r3.result,applied:s.r3.applied},
  r4:{run:s.r4.run,fin:s.r4.fin,lock:{E:Math.max(0,((s.r4.lock.E||0)-Date.now())/1000),M:Math.max(0,((s.r4.lock.M||0)-Date.now())/1000)},valid:s.r4.valid,first:s.r4.first,chUsed:s.r4.chUsed,ch:s.r4.ch&&{by:s.r4.ch.by,checks:s.r4.ch.checks,result:s.r4.ch.result},final:s.r4.final},
  shop:{sub:s.shop.sub,turn:V7.shopTurn(),revealed:!!s.shop.res,labels:s.shop.res?s.shop.res.labels:null,counts:{E:s.shop.sub.E?s.shop.picks.E.length:null,M:s.shop.sub.M?s.shop.picks.M.length:null}},
  effects:s.shop.res?s.effects:null,risk:{order:s.risk.order,lock:s.risk.lock,stake:Object.fromEntries(Object.entries(s.risk.stake).filter(([k])=>s.risk.lock[k])),res:s.risk.res},
  run:run?{k:run.k,station:run.station,c:run.c,started:run.started,done:run.done,opened:run.opened,left:run.left,s2:{phase:run.s2.phase,input:run.s2.input,n:run.s2.n},lock3:Math.max(0,(run.s3.lockUntil-Date.now())/1000),lockCode:Math.max(0,(run.code.lockUntil-Date.now())/1000),paused:!run.runAt}:null,
  lock:{set:s.lock.set,seal:s.lock.seal},cse:{winner:s.cse.winner,bites:s.cse.bites},gem:s.gem,undo:s.undo.length?s.undo[s.undo.length-1].a:'',subs:window.V7SUB?V7SUB.publicState():null};
 const priv={};['E','M'].forEach(k=>{priv['PLAYER_'+k]={me:k,shop:{picks:s.shop.picks[k],avail:s.state==='SHOP'?V7.shopAvail(k):null,sub:s.shop.sub[k]},risk:{options:s.state==='RISK'?R.riskOptions(k,b,V7.cfg()):null,stake:s.risk.stake[k]}}});
 return {pub,priv}};

/* ---------- Gemini backup TTS (Edge neural on the local server, else the browser voice) ---------- */
V7.tts=async text=>{if(!text)return;try{const r=await fetch('api/tts/edge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice:'fa-IR-DilaraNeural',emotion:'referee'})});if(!r.ok)throw new Error(r.status);const ab=await r.arrayBuffer();await AE.resume();const buf=await AE.ctx.decodeAudioData(ab);AE.play(buf,AE.voice);if(window.V7SUB)V7SUB.push('جمنای',text,{kind:'tts'});return}catch(e){}
 try{const u=new SpeechSynthesisUtterance(text);u.lang='fa-IR';u.rate=1.02;speechSynthesis.speak(u);if(window.V7SUB)V7SUB.push('جمنای',text,{kind:'tts'})}catch(e){toast('صدای پشتیبان در دسترس نیست')}};

/* ---------- keyboard (numeric keypad; only inside V7 states, so every v5 key keeps working elsewhere) ---------- */
V7.KEYMAP={
 R1:{Numpad2:['r1.valid',{p:'E'}],Numpad1:['r1.valid',{p:'M'}],Numpad3:['r1.fall',{p:'E'}],Numpad4:['r1.fall',{p:'M'}],Numpad0:['r1.end',{}]},
 R2:{Numpad2:['r2.throw',{p:'E',res:'hit'}],Numpad1:['r2.throw',{p:'M',res:'hit'}],Numpad5:['r2.throw',{res:'miss'}],Numpad8:['r2.throw',{res:'foot'}]},
 R3_SANDWICH:{Numpad9:['r3.mouthfull',{p:'E'}],Numpad7:['r3.mouthfull',{p:'M'}],Numpad3:['r3.empty',{p:'E'}],Numpad1:['r3.empty',{p:'M'}],Numpad6:['r3.pen',{p:'E'}],Numpad4:['r3.pen',{p:'M'}]},
 R4_GLUE:{Numpad2:['r4.finish',{p:'E'}],Numpad1:['r4.finish',{p:'M'}],Numpad0:['r4.wrong',{}],NumpadMultiply:['gc.open',{}]},
 RISK:{Numpad9:['risk.result',{p:'E',hit:true}],Numpad6:['risk.result',{p:'E',hit:false}],Numpad7:['risk.result',{p:'M',hit:true}],Numpad4:['risk.result',{p:'M',hit:false}]}};
V7.enterAction=()=>{const s=V7.S();switch(s.state){case 'R3_SANDWICH':return s.r3.result&&!s.r3.applied?['r3.confirm',{}]:!s.r3.run&&!s.r3.result?['r3.start',{}]:null;
 case 'R1':return !s.r1.t0?['r1.start',{}]:null;case 'R2':return !s.r2.locked?['r2.lock',{}]:null;
 case 'R4_GLUE':{if(!s.r4.t0)return ['r4.start',{}];const pend=['E','M'].some(k=>s.r4.fin[k]!=null&&!s.r4.valid[k]);return pend?['r4.valid',{}]:null}
 case 'REVEAL':return !s.reveal.done?['reveal.show',{}]:null;case 'SHOP':{const t=V7.shopTurn();return t?['shop.submit',{p:t}]:['shop.reveal',{}]}
 case 'VAULT_ARMED':return !s.vault.armed?['vault.arm',{}]:null;case 'RUN1':case 'RUN2':{const r=V7.curRun();if(r&&!r.started)return ['run.start',{}];if(r&&r.station===2&&r.s2.phase==='ready')return ['s2.start',{}];if(r&&r.station===2&&r.s2.phase==='input')return ['s2.check',{}];return null}
 default:return null}};
V7.spaceAction=()=>{const s=V7.S();switch(s.state){case 'R1':return !s.r1.t0?['r1.start',{}]:['pause',{}];case 'R3_SANDWICH':return !s.r3.t0||s.r3.result?['r3.start',{}]:['pause',{}];case 'R4_GLUE':return !s.r4.t0?['r4.start',{}]:['pause',{}];case 'RUN1':case 'RUN2':{const r=V7.curRun();return r&&!r.started?['run.start',{}]:['run.pause',{}]}default:return ['pause',{}]}};
addEventListener('keydown',e=>{const s=V7.S();if(!s.on)return;if(e.target.matches&&e.target.matches('input,textarea,select'))return;if(e.ctrlKey||e.metaKey||e.altKey)return;
 const ctl=document.getElementById('view-control');const consoleOpen=document.body.classList.contains('v7-console-on');if(!consoleOpen&&ctl&&ctl.classList.contains('hidden'))return;
 let a=null;const km=V7.KEYMAP[s.state==='GLUE_CHALLENGE'?'R4_GLUE':s.state];if(km&&km[e.code])a=km[e.code];
 if(!a&&s.state==='SHOP'){const m=e.code.match(/^Numpad([4-8])$/);if(m){const t=V7.shopTurn();if(t)a=['shop.pick',{p:t,card:R.CARDS[+m[1]-4].id}]}}
 if(!a&&(e.code==='NumpadEnter'||e.key==='Enter'))a=V7.enterAction()||['state.next',{}];
 if(!a&&e.code==='Space')a=V7.spaceAction();
 if(!a){const k=e.key.toLowerCase();if(k==='p')a=['pause',{}];else if(k==='u')a=['undo',{}];else if(k==='t')a=['gem.say',{}];else if(k==='s'){V7.emit('ui','sync');e.preventDefault();e.stopImmediatePropagation();return}else if(k==='g'){V7.emit('ui','chroma');e.preventDefault();e.stopImmediatePropagation();return}}
 if(e.code==='F2'){V7.emit('ui','pair');e.preventDefault();e.stopImmediatePropagation();return}
 if(!a)return;e.preventDefault();e.stopImmediatePropagation();try{AE.resume()}catch(err){}V7.cmd(a[0],Object.assign({},a[1]),{src:'kbd'})},true);
addEventListener('keydown',e=>{if(e.code==='F2'){V7.emit('ui','pair');e.preventDefault()}});
})();

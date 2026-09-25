/* DADASHMODE v3 · deterministic game logic: time bank journal, VAR, round mechanics.
   Invariants kept from v1: one currency, banks never < 0, append-only journal, AI never mutates score,
   random outcomes are local (crypto.getRandomValues) and never sent to AI. */
'use strict';
function freshGame(){return {journal:[],var:false,distance:{},vault:{codes:[],stage:{}}}}
const G=()=>P.game||(P.game=freshGame());
const pl=id=>P.players.find(p=>p.id===id);
function undoneSet(){const s=new Set();G().journal.forEach(e=>{if(e.kind==='undo')s.add(e.ref)});return s}
function bankOf(pid){const u=undoneSet();let b=P.startBank;for(const e of G().journal){if(e.player!==pid||e.kind==='undo'||u.has(e.id))continue;b+=e.delta}return Math.max(0,b)}
function opponentOf(pid){const others=P.players.filter(p=>p.id!==pid);if(!others.length)return null;return others.sort((a,b)=>bankOf(b.id)-bankOf(a.id))[0].id}
function leader(){if(!P.players.length)return null;const s=[...P.players].sort((a,b)=>bankOf(b.id)-bankOf(a.id));return {p:s[0],tie:s.length>1&&bankOf(s[0].id)===bankOf(s[1].id)}}
function curSegIndex(){return st.live>=0?st.live:st.sel}
function fxPush(kind,data){st.fx.push({kind,data,t0:performance.now()/1000})}
/* the ONLY writer of the bank */
function award(pid,delta,reason,opt={}){const p=pl(pid);if(!p||!delta)return false;
  if(G().var&&!opt.force){toast('VAR فعال است؛ تا پایان بازبینی امتیاز قفل است');AE.ctx&&AE.buzzer();return false}
  const before=bankOf(pid);const applied=Math.max(-before,Math.round(delta));
  const ev={id:uid(),t:Date.now(),kind:opt.kind||'score',player:pid,delta:applied,reason:reason||'',seg:curSegIndex()};G().journal.push(ev);
  if(!opt.silentFx){fxPush(applied>=0?'gain':'loss',{pid,delta:applied,reason});st.pops.push({pid,n:applied,t:performance.now()/1000})}
  if(AE.ctx&&!opt.noSfx){applied>=0?(AE.coin(),setTimeout(()=>AE.ding(),120)):AE.lose()}
  save();renderScores();renderJournal();return ev}
function undoLast(){const u=undoneSet();const ev=[...G().journal].reverse().find(e=>e.kind!=='undo'&&!u.has(e.id)&&e.delta);if(!ev){toast('چیزی برای برگرداندن نیست');return}
  G().journal.push({id:uid(),t:Date.now(),kind:'undo',ref:ev.id,player:ev.player,delta:0,reason:'برگرداندن: '+(ev.reason||''),seg:curSegIndex()});save();renderScores();renderJournal();toast(`برگشت: ${pl(ev.player)?.name||''} ${ev.delta>0?'+':''}${fa(ev.delta)}`)}
function setVar(on){G().var=on;G().journal.push({id:uid(),t:Date.now(),kind:on?'var-on':'var-off',player:null,delta:0,reason:on?'شروع بازبینی VAR':'پایان بازبینی VAR',seg:curSegIndex()});
  if(AE.ctx){on?AE.siren():AE.whistle()}fxPush(on?'var':'var-off',{});save();renderGameDeck();renderJournal()}
function resetGame(){P.game=freshGame();st.disp={};save();renderScores();renderGameDeck();renderJournal()}
/* round: generic win */
function roundWin(pid){const s=P.segments[curSegIndex()];award(pid,s&&s.reward||10,`برد ${s?s.title:''}`)}
/* distance */
function distLock(pid,c){const d=G().distance[pid]||(G().distance[pid]={choice:null,att:[]});if(d.choice&&d.att.length){toast('انتخاب بعد از پرتاب اول قفل است');return}d.choice=c;AE.ctx&&AE.lock();fxPush('lock',{pid,text:`${pl(pid).name}: خط ${DIST[c].fa}`,col:DIST[c].col});save();renderGameDeck()}
function distMax(pid){return 3}
function distAttempt(pid,hit){const d=G().distance[pid];if(!d||!d.choice){toast('اول خط را قفل کنید');return}if(d.att.length>=distMax(pid)){toast('تلاش‌ها تمام شده');return}
  d.att.push(hit?1:0);if(hit)award(pid,DIST[d.choice].sec,`پرتاب موفق خط ${DIST[d.choice].fa}`);else{AE.ctx&&AE.buzzer();fxPush('miss',{pid})}save();renderGameDeck()}
/* V7: round 3 is the speed-sandwich duel (js/v7-core.js); the card shop and the risk shot live in the V7 engine too. */
/* vault */
function vaultNew(){G().vault={codes:[0,1,2].map(()=>secureRandInt(10)),stage:{}};save();renderGameDeck();toast('سه رمز جدید ساخته شد؛ روی کاغذ هم بنویسید')}
function vaultIssue(pid){const v=G().vault;if(!v.codes.length)vaultNew();const n=v.stage[pid]||0;if(n>=3){toast('هر سه رمز گرفته شده');return}v.stage[pid]=n+1;fxPush('code',{pid,stage:n+1,digit:v.codes[n]});AE.ctx&&(AE.lock(),setTimeout(()=>AE.ding(),200));save();renderGameDeck()}
function vaultResetStage(pid){toast(`ترتیب اشتباه: فقط مرحلهٔ ${fa((G().vault.stage[pid]||0)+1)} از اول`);AE.ctx&&AE.buzzer();fxPush('miss',{pid})}
function vaultUnlock(pid){const v=G().vault;if((v.stage[pid]||0)<3){toast('هنوز سه رمز کامل نیست');return}fxPush('vault',{pid,codes:v.codes});AE.ctx&&AE.vault();G().journal.push({id:uid(),t:Date.now(),kind:'vault',player:pid,delta:0,reason:'کیف طلایی باز شد',seg:curSegIndex()});G().champion=pid;save();renderJournal()}

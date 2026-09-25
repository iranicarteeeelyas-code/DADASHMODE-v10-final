/**
 * DADASHMODE V7 Broadcast Motion Graphics System
 * Professional real-time broadcast animation engine
 * Supports both Classic and Broadcast animation styles
 */

class MotionDesignTokens {
  constructor(){
    this.durations={
      quick:200,short:350,medium:600,long:1000,xlong:1500
    };
    this.easing={
      easeOut:'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      easeIn:'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      easeInOut:'cubic-bezier(0.645, 0.045, 0.355, 1)',
      expo:'cubic-bezier(0.16, 1, 0.3, 1)',
      smooth:'cubic-bezier(0.4, 0, 0.2, 1)'
    };
    this.stagger={
      tight:40,medium:80,loose:120
    }
  }
}

class AnimationTimeline {
  constructor(){
    this.animations=[];
    this.playing=false;
    this.startTime=0;
    this.pauseTime=0
  }

  add(elem,props,duration,delay=0,easing='easeOut'){
    this.animations.push({elem,props,duration,delay,easing,startTime:null});
    return this
  }

  stagger(elems,props,duration,staggerDelay,easing='easeOut'){
    elems.forEach((e,i)=>{
      this.add(e,props,duration,i*staggerDelay,easing)
    });
    return this
  }

  play(){
    this.playing=true;
    this.startTime=Date.now();
    this.animate()
  }

  animate=()=>{
    if(!this.playing)return;
    const now=Date.now()-this.startTime;
    let anyRunning=false;
    this.animations.forEach(anim=>{
      const elapsed=now-anim.delay;
      if(elapsed<0)return;
      if(!anim.startTime)anim.startTime=Date.now();
      const progress=Math.min(elapsed/anim.duration,1);
      this.applyFrame(anim.elem,anim.props,progress);
      if(progress<1)anyRunning=true
    });
    if(anyRunning)requestAnimationFrame(this.animate);
    else this.playing=false
  }

  applyFrame(elem,props,progress){
    for(const[key,target] of Object.entries(props)){
      const current=parseFloat(elem.style[key]||0);
      const delta=target-current;
      elem.style[key]=current+delta*progress
    }
  }

  pause(){
    this.playing=false;
    this.pauseTime=Date.now()
  }

  resume(){
    if(this.pauseTime){
      this.startTime+=Date.now()-this.pauseTime;
      this.pauseTime=0
    }
    this.playing=true;
    this.animate()
  }
}

class BroadcastGraphicTemplate {
  constructor(id,type='lower-third'){
    this.id=id;
    this.type=type;
    this.data={};
    this.state='idle';
    this.timeline=new AnimationTimeline();
    this.style='broadcast' // 'classic' or 'broadcast'
  }

  setState(newState){
    this.state=newState;
    this.triggerStateTransition()
  }

  triggerStateTransition(){
    switch(this.state){
      case 'entering':this.playEnter();break;
      case 'visible':this.playIdle();break;
      case 'exiting':this.playExit();break;
      case 'updating':this.playUpdate();break
    }
  }

  playEnter(){
    const elem=document.getElementById(this.id);
    if(!elem)return;
    if(this.style==='broadcast'){
      // Professional broadcast entrance with stagger
      elem.style.opacity='0';
      elem.style.transform='translateY(20px)';
      const tl=new AnimationTimeline();
      tl.add(elem,{opacity:1,transform:'translateY(0)'},600,0,'expo');
      tl.play()
    }else{
      // Classic simple fade
      elem.style.opacity='0';
      const tl=new AnimationTimeline();
      tl.add(elem,{opacity:1},300,0,'easeOut');
      tl.play()
    }
  }

  playExit(){
    const elem=document.getElementById(this.id);
    if(!elem)return;
    if(this.style==='broadcast'){
      const tl=new AnimationTimeline();
      tl.add(elem,{opacity:0,transform:'translateY(-20px)'},600,0,'expo');
      tl.play()
    }else{
      const tl=new AnimationTimeline();
      tl.add(elem,{opacity:0},300,0,'easeOut');
      tl.play()
    }
  }

  playIdle(){}

  playUpdate(){
    // Update only changed data, not whole animation
  }

  setStyle(style){
    this.style=style;
    // Don't replay entrance, just note style for future transitions
  }
}

class ScoreCard extends BroadcastGraphicTemplate {
  constructor(){
    super('scoreboard','score-card');
    this.data={E:0,M:0}
  }

  updateScore(pid,newScore){
    const oldScore=this.data[pid]||0;
    if(newScore===oldScore)return;
    this.data[pid]=newScore;
    this.playScoreIncrement(pid,newScore-oldScore)
  }

  playScoreIncrement(pid,delta){
    const elem=document.getElementById(`score-${pid}`);
    if(!elem)return;
    const tl=new AnimationTimeline();
    if(this.style==='broadcast'){
      // Pop + scale effect
      tl.add(elem,{transform:'scale(1.1)'},150,0);
      tl.add(elem,{transform:'scale(1)'},150,150)
    }else{
      // Just fade the number
      tl.add(elem,{opacity:0.8},100,0);
      tl.add(elem,{opacity:1},100,100)
    }
    tl.play()
  }
}

class RoundIndicator extends BroadcastGraphicTemplate {
  constructor(){
    super('round-indicator','round-badge');
    this.current=1
  }

  setRound(num){
    this.current=num;
    const elem=document.getElementById(this.id);
    if(!elem)return;
    const tl=new AnimationTimeline();
    if(this.style==='broadcast'){
      // Rotate + scale reveal
      tl.add(elem,{transform:'rotateY(180deg) scale(1.2)'},400,0,'expo');
      tl.add(elem,{transform:'rotateY(0deg) scale(1)'},200,200)
    }else{
      tl.add(elem,{opacity:0.7},200,0);
      tl.add(elem,{opacity:1},200,200)
    }
    tl.play()
  }
}

class VaultStationDisplay extends BroadcastGraphicTemplate {
  constructor(){
    super('vault-station','vault-display');
    this.state='idle'
  }

  showCode(code){
    const elem=document.getElementById(this.id);
    if(!elem)return;
    elem.textContent=code;
    if(this.style==='broadcast'){
      // Number reveal with scale
      elem.style.opacity='0';
      elem.style.transform='scale(0.8)';
      const tl=new AnimationTimeline();
      tl.add(elem,{opacity:1,transform:'scale(1)'},400,0,'expo');
      tl.play()
    }
  }

  wrongCodeFeedback(){
    const elem=document.getElementById(this.id);
    if(!elem)return;
    const tl=new AnimationTimeline();
    // Shake animation
    const offsets=[0,-5,5,-5,5,0];
    offsets.forEach((offset,i)=>{
      tl.add(elem,{transform:`translateX(${offset}px)`},50,i*50)
    });
    tl.play()
  }
}

class ContestantCard extends BroadcastGraphicTemplate {
  constructor(pid){
    super(`contestant-${pid}`,'contestant-card');
    this.pid=pid;
    this.data={name:'',status:''}
  }

  reveal(data){
    this.data=data;
    const elem=document.getElementById(this.id);
    if(!elem)return;
    elem.innerHTML=`<div class="card-name">${data.name}</div>`;
    if(this.style==='broadcast'){
      // Slide in + scale
      elem.style.opacity='0';
      elem.style.transform='translateX(-30px) scale(0.95)';
      const tl=new AnimationTimeline();
      tl.add(elem,{opacity:1,transform:'translateX(0) scale(1)'},600,0,'expo');
      tl.play()
    }else{
      elem.style.opacity='0';
      const tl=new AnimationTimeline();
      tl.add(elem,{opacity:1},300,0);
      tl.play()
    }
  }
}

class WinnerReveal extends BroadcastGraphicTemplate {
  constructor(){
    super('winner-reveal','fullscreen-winner');
    this.celebration=null
  }

  reveal(pid,name){
    const elem=document.getElementById(this.id);
    if(!elem)return;
    elem.innerHTML=`<div class="winner-name">${name}</div><div class="winner-badge">برنده</div>`;
    if(this.style==='broadcast'){
      // Dramatic entrance with confetti
      elem.style.opacity='0';
      elem.style.transform='scale(0.5) rotateZ(5deg)';
      const tl=new AnimationTimeline();
      tl.add(elem,{opacity:1,transform:'scale(1) rotateZ(0deg)'},1000,0,'expo');
      tl.play();
      this.triggerConfetti()
    }else{
      elem.style.opacity='0';
      const tl=new AnimationTimeline();
      tl.add(elem,{opacity:1},500,0);
      tl.play()
    }
  }

  triggerConfetti(){
    // Placeholder for confetti system
    console.log('Confetti triggered')
  }
}

class BroadcastGraphicSystem {
  constructor(){
    this.graphics={};
    this.motionTokens=new MotionDesignTokens();
    this.globalStyle='broadcast' // 'classic' or 'broadcast'
  }

  register(graphic){
    this.graphics[graphic.id]=graphic
  }

  createScoreCard(){
    const card=new ScoreCard();
    this.register(card);
    return card
  }

  createRoundIndicator(){
    const round=new RoundIndicator();
    this.register(round);
    return round
  }

  createVaultDisplay(){
    const vault=new VaultStationDisplay();
    this.register(vault);
    return vault
  }

  createContestantCard(pid){
    const card=new ContestantCard(pid);
    this.register(card);
    return card
  }

  createWinnerReveal(){
    const winner=new WinnerReveal();
    this.register(winner);
    return winner
  }

  setGlobalStyle(style){
    this.globalStyle=style;
    Object.values(this.graphics).forEach(g=>g.setStyle(style))
  }

  showGraphic(id){
    const g=this.graphics[id];
    if(g)g.setState('entering')
  }

  hideGraphic(id){
    const g=this.graphics[id];
    if(g)g.setState('exiting')
  }

  updateGraphic(id,data){
    const g=this.graphics[id];
    if(g){
      g.data=data;
      g.setState('updating')
    }
  }
}

// Global instance
window.broadcastGFX=new BroadcastGraphicSystem();
window.MotionDesignTokens=MotionDesignTokens;
window.AnimationTimeline=AnimationTimeline;
window.BroadcastGraphicTemplate=BroadcastGraphicTemplate;


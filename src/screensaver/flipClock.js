import './flipClock.css';

/** Home-only idle screen. Its wake event is consumed so OK cannot open an app. */
export function createFlipScreensaver(stage, options) {
  var idleMs=options.idleMs===undefined?30000:options.idleMs;
  var idleTimer=0,tickTimer=0,active=false,allowed=false,destroyed=false,lastActivity=Date.now();
  var root=null,period=null,date=null,digits=[],wakeKey=null,suppressClickUntil=0,lastPointer=null;
  var reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  var dateFormat=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long'});
  var lastDate='';
  function eligible(){return !destroyed&&!document.hidden&&options.canStart();}
  function consume(event){if(event.cancelable)event.preventDefault();event.stopImmediatePropagation();}
  function token(event){return event.code||event.key||String(event.keyCode);}
  function half(className){var el=document.createElement('div');el.className='nd-flip__half '+className;el.appendChild(document.createElement('span'));return el;}
  function digit(parent){
    var el=document.createElement('div');el.className='nd-flip__digit';
    var top=half('nd-flip__top'),bottom=half('nd-flip__bottom'),front=half('nd-flip__top nd-flip__front'),back=half('nd-flip__bottom nd-flip__back');
    [top,bottom,front,back].forEach(function(node){el.appendChild(node);});
    var seam=document.createElement('div');seam.className='nd-flip__seam';el.appendChild(seam);parent.appendChild(el);
    digits.push({el:el,top:top.firstChild,bottom:bottom.firstChild,front:front.firstChild,back:back.firstChild,value:null,timer:0});
  }
  function build(){
    if(root)return;
    root=document.createElement('section');root.id='flipScreensaver';root.className='nd-flip';root.hidden=true;root.tabIndex=-1;root.setAttribute('role','img');
    root.innerHTML='<div class="nd-flip__surface"></div><div class="nd-flip__assembly"><div class="nd-flip__clock" aria-hidden="true"></div></div><p class="nd-flip__date"></p><p class="nd-flip__hint">Press any button to return</p>';
    var clock=root.querySelector('.nd-flip__clock');
    ['HOURS','MINUTES','SECONDS'].forEach(function(label,i){
      if(i){var separator=document.createElement('div');separator.className='nd-flip__separator';separator.innerHTML='<i></i><i></i>';clock.appendChild(separator);}
      var group=document.createElement('div');group.className='nd-flip__group'+(i===2?' nd-flip__seconds':'');
      if(i===0){period=document.createElement('span');period.className='nd-flip__period';group.appendChild(period);}
      var name=document.createElement('span');name.className='nd-flip__label';name.textContent=label;group.appendChild(name);digit(group);digit(group);clock.appendChild(group);
    });
    date=root.querySelector('.nd-flip__date');stage.appendChild(root);
  }
  function settle(d){
    clearTimeout(d.timer);d.timer=0;d.el.classList.remove('is-flipping');
    [d.top,d.bottom,d.front,d.back].forEach(function(el){el.textContent=d.value;});
  }
  function display(d,value,animate){
    if(d.value===value)return;
    var old=d.value;settle(d);d.value=value;
    if(!animate||old===null||reducedMotion.matches){settle(d);return;}
    d.top.textContent=value;d.bottom.textContent=old;d.front.textContent=old;d.back.textContent=value;d.el.classList.add('is-flipping');
    d.timer=setTimeout(function(){settle(d);},580);
  }
  function tick(animate){
    clearTimeout(tickTimer);tickTimer=0;if(!active||document.hidden)return;
    var now=new Date(),hours=now.getHours(),use24=options.getTimeFormat()==='24h';
    var text=String(use24?hours:hours%12||12).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0')+String(now.getSeconds()).padStart(2,'0');
    digits.forEach(function(d,i){display(d,text[i],animate!==false);});
    var ampm=hours<12?'AM':'PM';if(period.textContent!==ampm)period.textContent=ampm;period.hidden=use24;
    var dateText=dateFormat.format(now);if(dateText!==lastDate){date.textContent=dateText;lastDate=dateText;}
    root.setAttribute('aria-label','Flip-clock screensaver, '+text.slice(0,2)+':'+text.slice(2,4)+':'+text.slice(4)+(use24?'':' '+ampm));
    tickTimer=setTimeout(tick,1000-Date.now()%1000+8);
  }
  function stopClock(){clearTimeout(tickTimer);tickTimer=0;digits.forEach(settle);}
  function hide(){
    if(!active)return;
    active=false;stopClock();root.hidden=true;stage.classList.remove('has-screensaver');
    if(options.onHide)options.onHide();
  }
  function show(){
    if(!eligible())return;
    build();active=true;root.hidden=false;stage.classList.add('has-screensaver');
    if(options.onShow)options.onShow();
    var system=window.webOSSystem||window.PalmSystem;
    try{if(system&&system.setCursorHidden)system.setCursorHidden(true);}catch(_){}
    root.focus({preventScroll:true});tick(false);
  }
  function arm(){
    if(idleTimer||active||!allowed)return;
    idleTimer=setTimeout(function(){
      idleTimer=0;if(!eligible()){sync();return;}
      if(Date.now()-lastActivity>=idleMs)show();else arm();
    },Math.max(0,idleMs-(Date.now()-lastActivity)));
  }
  function sync(){
    var next=eligible(),becameEligible=next&&!allowed;allowed=next;
    if(!allowed){clearTimeout(idleTimer);idleTimer=0;hide();return;}
    if(becameEligible)lastActivity=Date.now();arm();
  }
  function activity(event){
    if(event.type==='keyup'){
      if(wakeKey===token(event)){wakeKey=null;lastActivity=Date.now();consume(event);sync();}return;
    }
    if(event.type==='pointermove'){
      var point=[event.clientX,event.clientY];
      if(lastPointer&&lastPointer[0]===point[0]&&lastPointer[1]===point[1]&&!event.movementX&&!event.movementY)return;
      lastPointer=point;
    }
    lastActivity=Date.now();
    if(event.type==='keydown'&&wakeKey===token(event)){consume(event);sync();return;}
    if(event.type==='click'&&Date.now()<suppressClickUntil){consume(event);sync();return;}
    if(active){
      if(event.type==='keydown')wakeKey=token(event);
      else suppressClickUntil=Date.now()+500;
      hide();consume(event);
    }
    sync();
  }
  function reset(){
    wakeKey=null;suppressClickUntil=0;lastActivity=Date.now();
    clearTimeout(idleTimer);idleTimer=0;allowed=false;hide();sync();
  }
  var events=['keydown','keyup','pointermove','pointerdown','click','wheel'];
  events.forEach(function(name){document.addEventListener(name,activity,true);});
  document.addEventListener('visibilitychange',reset);document.addEventListener('webOSRelaunch',reset);
  sync();
  return {sync:sync,isActive:function(){return active;},destroy:function(){
    destroyed=true;clearTimeout(idleTimer);idleTimer=0;allowed=false;hide();
    events.forEach(function(name){document.removeEventListener(name,activity,true);});
    document.removeEventListener('visibilitychange',reset);document.removeEventListener('webOSRelaunch',reset);
    if(root)root.remove();
  }};
}

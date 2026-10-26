import template from '../src/nightdock.html?raw';
import '../src/nightdock.css';
import {startNightDock} from '../src/nightdock.js';
const passed=[];
const assert=(value,name)=>{if(!value)throw Error(name);passed.push(name);};
const native={Date:window.Date,set:window.setTimeout,clear:window.clearTimeout,media:window.matchMedia};
let now=new native.Date(2026,9,26,20,59,28).getTime(),seq=0,hidden=false,reduce=false,launches=0;
const timers=new Map(),hiddenDescriptor=Object.getOwnPropertyDescriptor(document,'hidden');
const key=(key,repeat=false)=>{document.dispatchEvent(new KeyboardEvent('keydown',{key,repeat,bubbles:true,cancelable:true}));if(!repeat)document.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true,cancelable:true}));};
const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
function advance(ms){
 const target=now+ms;let count=0;
 while(true){const next=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;if(++count>1000)throw Error('Timer loop');now=next[1].at;timers.delete(next[0]);next[1].callback(...next[1].args);}
 now=target;
}
try{
 window.Date=class extends native.Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
 window.setTimeout=(callback,delay=0,...args)=>{const id=++seq;timers.set(id,{at:now+delay,callback,args});return id;};
 window.clearTimeout=id=>timers.delete(id);
 window.matchMedia=query=>query==='(prefers-reduced-motion: reduce)'?{get matches(){return reduce;}}:native.media.call(window,query);
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
 document.body.innerHTML=template;
 const apps=['youtube.leanback.v4','netflix','com.apple.appletv','com.wbd.stream'].map(id=>({id,name:id,art:'/icon.png'}));
 const config={appIds:apps.map(a=>a.id),sourceIds:[],useHomebrew:false};const original=JSON.stringify(config);
 const dock=startNightDock({apps,inputs:[{id:'com.webos.app.hdmi1',name:'HDMI 1',art:'/icon.png'}],config,appsReady:true,isTV:true,timeFormat:'12h',save(){throw Error('Screensaver must not write preferences');},launch(){launches++;return Promise.resolve();}});
 const active=()=>document.getElementById('stage').classList.contains('has-screensaver');
 advance(29999);assert(!active(),'Home does not show the screensaver before 30 seconds');
 advance(1);assert(active(),'Home shows the screensaver after exactly 30 seconds idle');
 const root=document.getElementById('flipScreensaver');
 assert(root.querySelectorAll('.nd-flip__digit').length===6,'Screensaver has six flip cards including seconds');
 assert(!root.textContent.includes('Night Dock'),'Screensaver has no Night Dock label');
 assert(root.getAttribute('aria-label').includes('08:59:58 PM'),'Screensaver uses the current TV clock format');
 const read=()=>[...root.querySelectorAll('.nd-flip__digit > .nd-flip__top:not(.nd-flip__front) span')].map(x=>x.textContent).join('');
 advance(2008);assert(read()==='090000','Hours, minutes and seconds update together at rollover');
 assert(root.querySelector('.is-flipping'),'Changed cards animate their page flip');
 advance(600);assert(!root.querySelector('.is-flipping'),'Completed flips clear their animation state');
 key('Enter');await Promise.resolve();assert(!active()&&launches===0,'OK wakes Home without launching the selected app');
 assert(document.activeElement.dataset.id===apps[0].id,'Waking restores the previous Home focus');
 advance(29000);key('ArrowRight');await paint();advance(1000);
 assert(!active(),'Remote input extends the idle deadline');
 advance(28999);assert(!active(),'Reset idle deadline does not fire early');advance(1);assert(active(),'Screensaver returns after 30 seconds from the latest input');
 key('ArrowLeft',true);key('ArrowLeft',true);document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowLeft',bubbles:true,cancelable:true}));await paint();
 assert(document.activeElement.dataset.id===apps[1].id,'Wake key and its held repeats do not move Home selection');
 advance(30000);root.dispatchEvent(new PointerEvent('pointerdown',{clientX:400,clientY:300,bubbles:true,cancelable:true}));document.querySelector('.app-chip').click();await Promise.resolve();
 assert(!active()&&launches===0,'Pointer wake consumes the same gesture click without launching');
 advance(501);document.querySelector('[data-utility="1"]').click();advance(60000);
 assert(!active()&&!document.getElementById('settingsPanel').hidden,'Settings remains open without an idle screensaver');
 document.getElementById('settingsClose').click();document.getElementById('sourcesButton').click();advance(60000);
 assert(!active()&&!document.getElementById('sourcesMenu').hidden,'Sources remains open without an idle screensaver');
 key('Backspace');advance(29999);assert(!active(),'Returning Home starts a fresh idle period');advance(1);assert(active(),'Screensaver starts after the fresh Home idle period');
 hidden=true;document.dispatchEvent(new Event('visibilitychange'));
 assert(!active()&&timers.size===0,'Backgrounding dismisses the saver and cancels all clock, flip and idle timers');
 advance(60000);assert(!active(),'Backgrounded launcher cannot show the screensaver');
 hidden=false;document.dispatchEvent(new Event('visibilitychange'));advance(29999);assert(!active(),'Foregrounding does not immediately show a stale idle screen');advance(1);assert(active(),'Foregrounding starts a new 30-second idle period');
 key('Backspace');reduce=true;advance(30000);advance(1008);
 assert(!root.querySelector('.is-flipping'),'Reduced motion keeps live seconds without page-flip animations');
 dock.refreshTimeFormat('24h');advance(1000);assert(root.querySelector('.nd-flip__period').hidden,'Screensaver follows a refreshed 24-hour preference');
 document.dispatchEvent(new Event('webOSRelaunch'));assert(!active(),'Pressing Home/relaunch dismisses the screensaver');
 assert(original===JSON.stringify(config),'Screensaver leaves saved app/source choices unchanged');
 window.__screensaverTests={passed};
}catch(error){window.__screensaverTests={passed,error:error.stack};throw error;}
finally{window.Date=native.Date;window.setTimeout=native.set;window.clearTimeout=native.clear;window.matchMedia=native.media;if(hiddenDescriptor)Object.defineProperty(document,'hidden',hiddenDescriptor);else delete document.hidden;}

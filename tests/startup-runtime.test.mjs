import {createAppDiscovery} from '../src/lib/apps';
import {LUNA, STORAGE_KEY} from '../src/config/constants';
const passed=[];
const assert=(value,name)=>{if(!value)throw new Error(name);passed.push(name);};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await wait(10);}throw new Error('Condition not reached');};
let calls=[],reply;
window.PalmServiceBridge=class {
 call(uri,raw){const params=JSON.parse(raw);calls.push({uri,params});reply(uri,params,data=>this.onservicecallback(JSON.stringify(data)));}
 cancel(){}
};
const points=[{id:'netflix',title:'Netflix',icon:'/apps/netflix.png'},{id:'custom.player',title:'Custom Player',icon:'/apps/custom.png'}];
try{
 localStorage.clear();
 reply=(uri,params,respond)=>queueMicrotask(()=>{
  if(params.command?.includes('listLaunchPoints'))respond({stdoutString:JSON.stringify({launchPoints:points})});
  else respond({stdoutString:'0 aWNvbg==\n'});
 });
 const discovery=createAppDiscovery(true,['netflix']);
 const home=await discovery.home;
 assert(home.apps.length===1&&home.apps[0].id==='netflix','Homebrew Home contains selected apps only');
 const firstIcon=calls.find(call=>call.params.command?.includes('base64'));
 assert(firstIcon.params.command.includes('/apps/netflix.png')&&!firstIcon.params.command.includes('/apps/custom.png'),'Homebrew first frame does not wait for unselected icons');
 const full=discovery.complete();assert(full===discovery.complete(),'Full discovery is shared across callers');
 const all=await full;
 assert(all.apps.length===2&&all.apps[1].id==='custom.player','Full Homebrew discovery retains apps outside the catalogue');
 assert(calls.filter(call=>call.params.command?.includes('listLaunchPoints')).length===1,'Homebrew metadata is requested once');
 const iconCalls=calls.filter(call=>call.params.command?.includes('base64'));
 assert(iconCalls.length===2&&!iconCalls[1].params.command.includes('/apps/netflix.png'),'Full discovery reuses already loaded selected icons');
 calls=[];
 reply=(uri,params,respond)=>queueMicrotask(()=>respond(uri===LUNA.homebrewExec?{returnValue:false,errorText:'Unavailable'}:{exist:params.appId==='netflix'}));
 const fallback=createAppDiscovery(true,['netflix']);
 assert((await fallback.home).source==='catalog','Missing Homebrew falls back to selected catalogue apps');
 await fallback.complete();
 assert(calls.filter(call=>call.params.appId==='netflix').length===1,'Catalogue fallback does not recheck selected apps');

 // Boot the real entry point with input and time services deliberately stalled.
 localStorage.clear();localStorage.setItem(STORAGE_KEY,JSON.stringify({appIds:['netflix'],sourceIds:null,useHomebrew:false}));
 let releaseInputs,releaseTime;
 reply=(uri,params,respond)=>{
  if(uri===LUNA.inputStatus){releaseInputs=()=>respond(location.search.includes('fail-input')?{returnValue:false,errorText:'Input service unavailable'}:{devices:[{id:'HDMI_1',appId:'com.webos.app.hdmi1',label:'Console',port:1,connected:true,icon:'HDMI_1.png'}]});return;}
  if(uri===LUNA.preferences){releaseTime=()=>respond({timeFormat:'HH12'});return;}
  queueMicrotask(()=>respond({exist:params.appId==='netflix'}));
 };
 await import('../src/main.tsx');
 await until(()=>document.getElementById('bootStatus')?.hidden&&releaseInputs&&releaseTime);
 assert(document.querySelector('.app-chip[data-id="netflix"]'),'Home is usable before HDMI and clock-format services answer');
 document.getElementById('sourcesButton').click();
 releaseInputs();releaseTime();
 if(location.search.includes('fail-input')){
  await wait(30);
  assert(document.getElementById('bootStatus').hidden,'Failed HDMI discovery does not replace Home with a boot error');
 }else{
  await until(()=>document.querySelector('.input-item[data-id="com.webos.app.hdmi1"]'));
  assert(document.activeElement.dataset.id==='com.webos.app.hdmi1','Late input discovery focuses the open Sources menu');
 }
 await until(()=>document.getElementById('clockTime').textContent.includes('AM')||document.getElementById('clockTime').textContent.includes('PM'));
 assert(true,'Late 12-hour preference updates the clock without reloading');
 document.dispatchEvent(new KeyboardEvent('keydown',{key:'Backspace',bubbles:true,cancelable:true}));
 assert(document.getElementById('sourcesMenu').hidden,'Home remains reachable after delayed or failed input discovery');
 window.__startupTests={passed};
}catch(error){window.__startupTests={passed,error:error.stack};throw error;}

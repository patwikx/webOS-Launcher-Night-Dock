import template from './nightdock.html?raw';
import './nightdock.css';
import {startNightDock} from './nightdock.js';
import {createAppDiscovery, type AppEntry} from './lib/apps';
import {listInputs, type InputSource} from './lib/inputs';
import {isWebOS} from './lib/luna';
import {launchApp} from './lib/launch';
import {loadConfig, saveConfig} from './lib/storage';
import {getTimeFormat, DEFAULT_TIME_FORMAT} from './lib/timeFormat';
import {hidePointerOnForeground} from './lib/pointer';
import {appTile} from './lib/tiles';
import {scheduleIdleDiscovery} from './lib/idleDiscovery';

document.body.innerHTML = template;
hidePointerOnForeground();
const config = loadConfig();
const styles: Record<string, string> = {'youtube.leanback.v4':'youtube',netflix:'netflix',amazon:'prime','com.disney.disneyplus-prod':'disney','com.apple.appletv':'appletv','com.wbd.stream':'max','com.webos.app.mediadiscovery':'media','com.webos.app.browser':'browser','com.webos.app.homeconnect':'home'};
function appModel(app: AppEntry) {
 const tile = appTile(app), styleId = styles[app.id];
 return {id:app.id, styleId, name:app.title, plate:tile.color || '#171a21', art:tile.imageUrl || 'icon.png', cover:app.id === 'com.disney.disneyplus-prod'};
}
function inputModel(input: InputSource) {
 return {id:input.appId, name:input.label, art:'icons/inputs/'+input.icon, connected:input.connected, live:input.port===0};
}
const previewInputs: InputSource[] = [
 {id:'LIVE_TV',appId:'com.webos.app.livetv',label:'Live TV',port:0,connected:true,icon:'tv.png'},
 ...[1,2,3].map(n=>({id:'HDMI_'+n,appId:'com.webos.app.hdmi'+n,label:'HDMI '+n,port:n,connected:false,icon:'HDMI_'+n+'.png'}))
];
async function boot() {
 const discovery = createAppDiscovery(config.useHomebrew, config.appIds);
 // Inputs and clock preferences must not hold the first usable Home frame hostage.
 let result = await discovery.home;
 let completeDiscovery: Promise<void>;
 let finishDiscovery: () => Promise<void>;
 let cancelDeferredDiscovery = () => {};
 const runtime = {
  appsReady:!isWebOS(), ensureApps:() => finishDiscovery(),
  apps:result.apps.map(appModel), inputs:isWebOS()?[]:previewInputs.map(inputModel), config, timeFormat:DEFAULT_TIME_FORMAT, isTV:isWebOS(), launch:launchApp,
  save(appIds: string[], sourceIds: string[]) {
   // Keep saved IDs for temporarily unavailable apps, so an update doesn't erase choices.
   const unavailable = config.appIds.filter(id=>!result.apps.some(a=>a.id===id));
   config.appIds=appIds.concat(unavailable); config.sourceIds=sourceIds; saveConfig(config);
  },
  toggleHomebrew() { config.useHomebrew=!config.useHomebrew; saveConfig(config); window.location.reload(); }
 };
 const dock = startNightDock(runtime);
 finishDiscovery = () => {
  cancelDeferredDiscovery();
  return completeDiscovery || (completeDiscovery = discovery.complete().then((full) => {
   result = full;
   runtime.appsReady = true;
   dock.refreshApps(full.apps.map(appModel));
  }));
 };
 // Inputs and time follow the first Home frame; the remaining catalogue waits
 // for quiet input and idle time, or an explicit Settings request.
 requestAnimationFrame(() => window.setTimeout(() => {
  if(!completeDiscovery) cancelDeferredDiscovery = scheduleIdleDiscovery(() => { void finishDiscovery().catch(() => {}); });
  refresh();
  void getTimeFormat().then(format=>dock.refreshTimeFormat(format));
 }, 0));
 let refreshing = false;
 const refresh = () => {
  if(document.hidden || !isWebOS() || refreshing) return;
  refreshing=true;
  listInputs().then(inputs=>dock.refreshInputs(inputs.map(inputModel))).catch(()=>{}).finally(()=>{refreshing=false;});
 };
 document.addEventListener('visibilitychange',refresh);
 document.addEventListener('webOSRelaunch',refresh);
}
boot().catch(() => {
 const status=document.getElementById('bootStatus')!;
 status.textContent="Couldn't load your apps. Press OK to try again.";
 document.addEventListener('keydown',event=>{if(event.key==='Enter')window.location.reload();});
 status.onclick=()=>window.location.reload();
});

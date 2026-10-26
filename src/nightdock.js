export function startNightDock(runtime) {
  'use strict';
  var apps = runtime.apps, inputs = runtime.inputs;
  var order = runtime.config.appIds.map(findApp).filter(Boolean);
  apps.forEach(function(app) { if (order.indexOf(app)<0) order.push(app); });
  var shown = {};
  apps.forEach(function(app) { shown[app.id] = runtime.config.appIds.indexOf(app.id)>=0; });
  var mode='home', zone='apps', index=0, utility=0, inputIndex=0, pointerTarget=null;
  var tab=0, settingsZone='tabs', gridIndex=0, reordering=false, held=null;
  var settingsReturn=null, launchRequest=0, pendingLaunch=null, enterTimer=0, longPressed=false;
  var elements=Object.create(null);
  var $=function(id){return elements[id]||(elements[id]=document.getElementById(id));};
  var panel=$('settingsPanel'), menu=$('sourcesMenu'), viewport=$('settingsViewport');
  var utilityEls=Array.from($('utilitiesNav').querySelectorAll('.utility'));
  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
  function findApp(id){return apps.find(function(app){return app.id===id;});}
  var visibleCache=null, choicesVersion=0, dockDirty=true, appEls=[], sourceEls=[], homeBounds=null, homeScrollDestination=null, settingsBounds=null;
  var homeFocus=null, sourceFocus=null, settingsFocus=null, settingsHeld=null, settingsTabs=[], settingsTiles=[], settingsTileKind=null;
  var lastMode=null, settingsBuildKey=null, sourcesSignature=null, inputsVersion=0, settingsRequest=0;
  var navigationFrame=0;
  function cancelNavigationFrame(){if(navigationFrame){cancelAnimationFrame(navigationFrame);navigationFrame=0;}}
  function paintNavigation(){
    navigationFrame=0;
    if(document.hidden)return;
    if(mode==='home')renderHome(true);
    else if(mode==='settings'){buildSettings(true);renderSettings(true);}
  }
  function queueNavigation(){if(!document.hidden&&!navigationFrame)navigationFrame=requestAnimationFrame(paintNavigation);}
  function flushNavigation(){if(navigationFrame){cancelNavigationFrame();paintNavigation();}}

  function visible(){return visibleCache||(visibleCache=order.filter(function(app){return shown[app.id];}));}
  function invalidateApps(){visibleCache=null;choicesVersion++;dockDirty=true;}
  function focusElement(previous,next){
    if(previous!==next){
      if(previous){previous.classList.remove('is-focused');previous.tabIndex=-1;}
      if(next){next.classList.add('is-focused');next.tabIndex=0;}
    }
    return next;
  }
  function setText(el,value){if(el.textContent!==value)el.textContent=value;}

  function save(){runtime.save(visible().map(function(app){return app.id;}),runtime.config.sourceIds);}
  function text(tag,className,value){var el=document.createElement(tag);el.className=className;el.textContent=value;return el;}
  function art(item,className){
    var el=document.createElement('span');el.className=className+' plate--'+(item.styleId||item.id);
    if(item.plate)el.style.background=item.plate;
    var img=new Image();img.decoding='async';img.src=item.art;img.alt='';img.draggable=false;if(item.cover)img.className='is-cover';el.appendChild(img);return el;
  }
  function button(className,label){var el=document.createElement('button');el.type='button';el.className=className;el.tabIndex=-1;el.setAttribute('aria-label',label);return el;}
  function bindPointer(el,select){el.addEventListener('pointermove',function(){if(pointerTarget===el)return;pointerTarget=el;select();});}
  function buildDock(){
    if(mode==='settings'||!dockDirty)return;
    var rows=$('dockRows'),fragment=document.createDocumentFragment();appEls=[];
    visible().forEach(function(app,i){
      if(i%5===0)fragment.appendChild(text('div','app-row',''));
      var el=button('app-chip',app.name);el.dataset.id=app.id;el.dataset.index=String(i);
      el.appendChild(art(app,'app-chip__plate'));el.appendChild(text('span','app-chip__label',app.name));
      bindPointer(el,function(){if(mode==='home'){zone='apps';index=i;renderHome(false);}});
      el.onclick=function(){if(mode==='home'){zone='apps';index=i;launch(app,'app');}};
      fragment.lastChild.appendChild(el);appEls.push(el);
    });
    rows.innerHTML='';rows.appendChild(fragment);dockDirty=false;homeFocus=null;homeBounds=null;homeScrollDestination=null;
    index=clamp(index,0,Math.max(0,visible().length-1));renderHome(false);
  }
  function renderHome(focus){
    cancelNavigationFrame();
    var target=mode!=='home'?null:zone==='apps'?appEls[index]:utilityEls[utility];
    var rows=null,destination=null;
    // Read geometry before changing focus styles. Keep an in-flight scroll aimed at its latest row.
    if(focus&&target&&zone==='apps'&&appEls.length>10){
      rows=$('dockRows');
      if(!homeBounds){var origin=rows.offsetTop;homeBounds=Array.from(rows.children).map(function(row){return {top:row.offsetTop-origin,height:row.offsetHeight};});}
      var row=homeBounds[Math.floor(index/5)],top=row.top,current=rows.scrollTop,height=rows.clientHeight;
      if(homeScrollDestination!==null&&Math.abs(current-homeScrollDestination)<1)homeScrollDestination=null;
      if(top<current+16)destination=Math.max(0,top-16);
      else if(top+row.height>current+height-16)destination=top+row.height-height+16;
    }
    if(lastMode!==mode){lastMode=mode;pointerTarget=null;}
    homeFocus=focusElement(homeFocus,target);
    if(focus&&target&&document.activeElement!==target)target.focus({preventScroll:true});
    if(destination!==null&&destination!==homeScrollDestination){
      homeScrollDestination=destination;
      rows.scrollTo({top:destination,behavior:'auto'});
    }
  }
  function moveHome(key){
    var count=visible().length,previousZone=zone,previousIndex=index,previousUtility=utility;
    if(zone==='utilities'){
      if(key==='ArrowLeft')utility=Math.max(0,utility-1);
      if(key==='ArrowRight')utility=Math.min(2,utility+1);
      if(key==='ArrowDown'&&count)zone='apps';
    }else{
      if(key==='ArrowLeft'&&index%5>0)index--;
      if(key==='ArrowRight'&&index%5<4&&index+1<count)index++;
      if(key==='ArrowUp'){if(index>=5)index-=5;else{zone='utilities';utility=1;}}
      if(key==='ArrowDown'&&Math.floor(index/5)<Math.floor((count-1)/5))index=Math.min(index+5,count-1);
    }
    if(zone!==previousZone||index!==previousIndex||utility!==previousUtility)queueNavigation();
  }
  function buildSources(){
    var signature=JSON.stringify(inputs);
    if(signature===sourcesSignature){renderSources(false);return;}
    sourcesSignature=signature;inputsVersion++;
    $('sourceList').innerHTML='';sourceEls=[];sourceFocus=null;$('sourceEmpty').hidden=inputs.length>0;
    inputs.forEach(function(input,i){
      var el=button('input-item',input.name);el.setAttribute('role','menuitem');el.dataset.id=input.id;
      el.appendChild(art(input,'input-item__icon'));
      var copy=text('span','input-item__copy','');copy.appendChild(text('span','input-item__name',input.name));
      copy.appendChild(text('span','input-item__status',input.live?'TV tuner':input.connected?'Connected':'Not connected'));
      el.appendChild(copy);
      bindPointer(el,function(){if(mode==='sources'){inputIndex=i;renderSources(false);}});
      el.onclick=function(){if(mode==='sources'){closeSources();launch(input,'input');}};
      $('sourceList').appendChild(el);sourceEls.push(el);
    });
    inputIndex=clamp(inputIndex,0,Math.max(0,inputs.length-1));renderSources(false);
  }
  function renderSources(focus){
    var target=mode==='sources'?sourceEls[inputIndex]:null;
    sourceFocus=focusElement(sourceFocus,target);
    if(focus&&target){target.focus({preventScroll:true});target.scrollIntoView({block:'nearest'});}
  }
  function openSources(){
    clearLaunchNotice();
    mode='sources';zone='utilities';utility=2;menu.hidden=false;$('sourcesButton').setAttribute('aria-expanded','true');
    buildSources();renderHome(false);renderSources(true);
  }
  function closeSources(){mode='home';menu.hidden=true;$('sourcesButton').setAttribute('aria-expanded','false');renderHome(true);}
  function settingsItems(){return tab===0?(reordering?visible():order):tab===1?inputs:[];}
  function settingsHint(){
    return tab===1?'Choose an input to switch sources. All TV inputs are available.':tab===2?'OK changes an option. Back returns home.':held?'Arrows move the app. OK puts it down. Back cancels.':reordering?'OK picks up an app. Choose Done to finish.':'OK shows or hides an app. Hold OK or choose Re-order apps to change order.';
  }
  function buildSettings(deferRender){
    var key=tab+':'+reordering+':'+(tab===0?choicesVersion:inputsVersion)+':'+runtime.config.useHomebrew;
    if(key===settingsBuildKey){if(!deferRender)renderSettings(false);return;}
    settingsBuildKey=key;
    if(!settingsTabs.length){
      ['Apps','Sources','Options'].forEach(function(label,i){
        var el=button('nd-tab',label);el.textContent=label;el.setAttribute('role','tab');el.id='settingsTab'+i;
        el.setAttribute('aria-controls','settingsGrid');
        bindPointer(el,function(){if(!reordering&&mode==='settings'){settingsZone='tabs';if(tab!==i){tab=i;gridIndex=0;buildSettings();}else renderSettings(false);}});
        el.onclick=function(){if(!reordering){tab=i;gridIndex=0;settingsZone='tabs';buildSettings();}};
        $('settingsTabs').appendChild(el);settingsTabs.push(el);
      });
    }
    settingsTabs.forEach(function(el,i){
      var active=i===tab;
      if(el.getAttribute('aria-selected')!==String(active))el.setAttribute('aria-selected',String(active));
      if(el.classList.contains('is-active')!==active)el.classList.toggle('is-active',active);
      el.disabled=reordering&&i!==tab;
    });
    setText($('settingsHint'),settingsHint());
    $('reorderButton').hidden=tab!==0;setText($('reorderButton'),reordering?'Done':'Re-order apps');
    var grid=$('settingsGrid');
    if(settingsTileKind!==tab){grid.innerHTML='';settingsTileKind=tab;}
    grid.classList.toggle('nd-grid--options',tab===2);grid.setAttribute('aria-labelledby','settingsTab'+tab);
    if(tab===2){
      if(!grid.firstChild){
        var option=button('nd-option','Live app list via Homebrew');option.setAttribute('role','switch');
        var copy=text('span','nd-option__copy','');copy.appendChild(text('span','nd-option__title','Live app list via Homebrew'));
        copy.appendChild(text('span','nd-option__description','Discover installed apps through Homebrew Channel. Requires root access.'));
        option.appendChild(copy);option.appendChild(text('span','nd-switch',''));
        option.onclick=runtime.toggleHomebrew;bindPointer(option,function(){settingsZone='grid';gridIndex=0;renderSettings(false);});grid.appendChild(option);
      }
      grid.firstChild.setAttribute('aria-checked',String(runtime.config.useHomebrew));
      setText(grid.querySelector('.nd-switch'),runtime.config.useHomebrew?'On':'Off');
    }else{
      var existing=Object.create(null);
      Array.from(grid.children).forEach(function(el){existing[el.dataset.id]=el;});
      settingsItems().forEach(function(item,i){
        var el=existing[item.id];
        if(!el){
          el=button('nd-tile'+(tab===1?' nd-tile--source':''),item.name);el.dataset.id=item.id;
          el.appendChild(art(item,'nd-tile__art'));el.appendChild(text('span','nd-tile__name',item.name));
          el._artSignature=JSON.stringify([item.art,item.plate,item.styleId,item.cover]);
          if(tab===1)el.appendChild(text('span','nd-tile__status',''));
          bindPointer(el,function(){if(mode==='settings'&&!held){settingsZone='grid';gridIndex=Number(el.dataset.index);renderSettings(false);}});
          el.onclick=function(){if(mode==='settings'){var position=Number(el.dataset.index);settingsZone='grid';if(held&&gridIndex!==position)moveHeld(position);gridIndex=position;settingsActivate();}};
        }
        delete existing[item.id];
        if(el.dataset.index!==String(i))el.dataset.index=String(i);
        if(el.getAttribute('aria-label')!==item.name)el.setAttribute('aria-label',item.name);
        setText(el.querySelector('.nd-tile__name'),item.name);
        var signature=JSON.stringify([item.art,item.plate,item.styleId,item.cover]);
        if(el._artSignature!==signature){el.replaceChild(art(item,'nd-tile__art'),el.firstChild);el._artSignature=signature;}
        if(tab===0){
          var selected=!!shown[item.id],check=el.querySelector('.nd-tile__check');
          if(!reordering){
            if(el.getAttribute('aria-pressed')!==String(selected))el.setAttribute('aria-pressed',String(selected));
          }else if(el.hasAttribute('aria-pressed'))el.removeAttribute('aria-pressed');
          var hidden=!reordering&&!selected;
          if(el.classList.contains('is-hidden-app')!==hidden)el.classList.toggle('is-hidden-app',hidden);
          if(!reordering&&selected&&!check){var badge=text('span','nd-tile__check','');badge.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>';el.appendChild(badge);}
          else if((reordering||!selected)&&check)check.remove();
        }else setText(el.querySelector('.nd-tile__status'),item.live?'TV tuner':item.connected?'Connected':'Not connected');
        // Move existing nodes rather than recreating their images and event handlers.
        if(grid.children[i]!==el)grid.insertBefore(el,grid.children[i]||null);
      });
      Object.keys(existing).forEach(function(id){existing[id].remove();});
    }
    settingsTiles=Array.from(grid.children);settingsBounds=null;
    setText($('settingsCount'),tab===0?visible().length+' apps on Home':tab===1?inputs.length+' available sources':'Launcher options');
    if(!deferRender)renderSettings(false);
  }
  function renderSettings(focus){
    if(mode!=='settings')return;
    cancelNavigationFrame();
    var target=null;
    gridIndex=clamp(gridIndex,0,Math.max(0,settingsTiles.length-1));
    if(settingsZone==='tabs')target=settingsTabs[tab];
    else if(settingsZone==='grid')target=settingsTiles[gridIndex];
    else target=$(settingsZone==='reorder'?'reorderButton':'settingsClose');
    var destination=null;
    if(target&&focus&&settingsZone==='grid'){
      if(!settingsBounds){var origin=$('settingsGrid').offsetTop;settingsBounds=settingsTiles.map(function(tile){return {top:tile.offsetTop-origin,height:tile.offsetHeight};});}
      var bounds=settingsBounds[gridIndex],current=viewport.scrollTop,height=viewport.clientHeight;
      if(bounds.top<current+16)destination=Math.max(0,bounds.top-16);
      else if(bounds.top+bounds.height>current+height-16)destination=bounds.top+bounds.height-height+16;
    }
    settingsFocus=focusElement(settingsFocus,target);
    var heldTarget=held?settingsTiles[gridIndex]:null;
    if(settingsHeld!==heldTarget){
      if(settingsHeld)settingsHeld.classList.remove('is-held');
      if(heldTarget)heldTarget.classList.add('is-held');
      settingsHeld=heldTarget;
    }
    setText($('settingsHint'),settingsHint());
    if(target&&focus&&document.activeElement!==target)target.focus({preventScroll:true});
    if(destination!==null)viewport.scrollTop=destination;
  }
  function openSettings(){
    clearLaunchNotice();
    if(!runtime.appsReady){
      var request=++settingsRequest;
      runtime.ensureApps().then(function(){if(mode==='home'&&request===settingsRequest)openSettings();}).catch(function(){if(mode==='home'&&request===settingsRequest){runtime.appsReady=true;openSettings();}});
      return;
    }
    settingsReturn={zone:zone,index:index,utility:utility};mode='settings';tab=0;settingsZone='tabs';gridIndex=0;reordering=false;held=null;
    panel.hidden=false;$('stage').classList.add('has-settings');viewport.scrollTop=0;$('settingsNotice').textContent='';buildSettings();renderHome(false);renderSettings(true);
  }
  function closeSettings(){
    if(held)cancelHeld();mode='home';panel.hidden=true;$('stage').classList.remove('has-settings');reordering=false;held=null;
    if(settingsReturn){zone=settingsReturn.zone;index=settingsReturn.index;utility=settingsReturn.utility;}
    index=clamp(index,0,Math.max(0,visible().length-1));if(!visible().length)zone='utilities';buildDock();renderHome(true);
  }
  function setReorder(){
    if(tab!==0)return;
    if(held)commitHeld();
    reordering=!reordering;gridIndex=0;settingsZone='reorder';viewport.scrollTop=0;buildSettings();renderSettings(true);
  }
  function moveHeld(to){
    var list=visible();to=clamp(to,0,list.length-1);var item=list[gridIndex];if(!item||to===gridIndex)return;
    order.splice(order.indexOf(item),1);var target=order.indexOf(list[to]);order.splice(to>gridIndex?target+1:target,0,item);
    gridIndex=to;invalidateApps();buildSettings();renderSettings(true);
  }
  function commitHeld(){
    var changed=JSON.stringify(order.map(function(app){return app.id;}))!==JSON.stringify(held.original);
    held=null;if(changed)save();
  }
  function cancelHeld(){order=held.original.map(findApp).filter(Boolean);gridIndex=held.index;held=null;invalidateApps();buildSettings();renderSettings(true);}
  function settingsActivate(){
    if(settingsZone==='close'){closeSettings();return;}
    if(settingsZone==='tabs'){if(settingsItems().length||tab===2)settingsZone='grid';renderSettings(true);return;}
    if(settingsZone==='reorder'){setReorder();return;}
    if(tab===2){runtime.toggleHomebrew();return;}
    var item=settingsItems()[gridIndex];if(!item)return;
    if(tab===1){closeSettings();launch(item,'input');return;}
    if(reordering){if(held)commitHeld();else held={original:order.map(function(app){return app.id;}),index:gridIndex};buildSettings();renderSettings(true);return;}
    shown[item.id]=!shown[item.id];invalidateApps();save();buildDock();buildSettings();renderSettings(true);
  }
  function settingsKey(key){
    if(key==='Backspace'||key==='Escape'){if(held)cancelHeld();else if(reordering){setReorder();}else closeSettings();return;}
    var count=tab===2?1:settingsItems().length,previousTab=tab,previousZone=settingsZone,previousIndex=gridIndex;
    if(held){var next=gridIndex;if(key==='ArrowLeft'&&gridIndex%6>0)next--;if(key==='ArrowRight'&&gridIndex%6<5)next++;if(key==='ArrowUp')next-=6;if(key==='ArrowDown')next+=6;moveHeld(next);return;}
    if(settingsZone==='tabs'){
      if(key==='ArrowLeft'&&!reordering){tab=Math.max(0,tab-1);gridIndex=0;}
      if(key==='ArrowRight'){if(tab<2&&!reordering){tab++;gridIndex=0;}else settingsZone='close';}
      if(key==='ArrowUp')settingsZone='close';if(key==='ArrowDown'&&count)settingsZone='grid';
    }else if(settingsZone==='close'){
      if(key==='ArrowDown')settingsZone=tab===0?'reorder':'tabs';if(key==='ArrowLeft')settingsZone='tabs';
    }else if(settingsZone==='reorder'){
      if(key==='ArrowDown'&&count)settingsZone='grid';if(key==='ArrowUp')settingsZone='close';if(key==='ArrowLeft'&&!reordering)settingsZone='tabs';
    }else{
      if(key==='ArrowLeft'&&gridIndex%6>0)gridIndex--;
      if(key==='ArrowRight'&&gridIndex%6<5&&gridIndex+1<count)gridIndex++;
      if(key==='ArrowUp'){if(gridIndex>=6)gridIndex-=6;else settingsZone=tab===0&&gridIndex%6>=3?'reorder':'tabs';}
      if(key==='ArrowDown'&&Math.floor(gridIndex/6)<Math.floor((count-1)/6))gridIndex=Math.min(gridIndex+6,count-1);
    }
    if(tab!==previousTab)viewport.scrollTop=0;
    if(tab!==previousTab||settingsZone!==previousZone||gridIndex!==previousIndex)queueNavigation();
  }
  function clearLaunchNotice(){ $('launchNotice').hidden=true;$('launchNotice').textContent=''; }
  function showLaunchNotice(message){ $('launchNotice').textContent=message;$('launchNotice').hidden=false; }
  function launch(item,kind){
    if(!item||pendingLaunch===item.id)return;
    clearLaunchNotice();renderHome(true);
    var request=++launchRequest;
    if(!runtime.isTV){
      showLaunchNotice(item.name+': '+(kind==='input'?'Input switching':'App launching')+' is available on your TV.');
      return;
    }
    pendingLaunch=item.id;
    // Keep Home usable during the service call. Ignore callbacks from an older handoff.
    Promise.resolve().then(function(){return runtime.launch(item.id);}).then(function(){
      if(request===launchRequest)pendingLaunch=null;
    }).catch(function(){
      if(request!==launchRequest)return;
      pendingLaunch=null;
      showLaunchNotice("Couldn't open "+item.name+'. Try again or choose another app or source.');
    });
  }
  function activate(){if(zone==='apps')launch(visible()[index],'app');else if(utility===1)openSettings();else if(utility===2)openSources();else launch({id:'com.webos.app.home',name:'LG Home',art:'icon.png'},'app');}
  function handle(key){
    settingsRequest++;
    if(mode==='sources'){
      if(key==='Backspace'||key==='Escape'||key==='ArrowLeft'){closeSources();return;}
      if(key==='ArrowUp'){if(inputIndex===0){closeSources();return;}inputIndex--;}
      if(key==='ArrowDown')inputIndex=Math.min(inputs.length-1,inputIndex+1);
      if(key==='Enter'||key===' '){var input=inputs[inputIndex];if(input){closeSources();launch(input,'input');}return;}renderSources(true);return;
    }
    if(mode==='settings'){if(key==='Enter'||key===' ')settingsActivate();else settingsKey(key);return;}
    if(key==='Enter'||key===' ')activate();else if(key==='Backspace'||key==='Escape'){clearLaunchNotice();zone=visible().length?'apps':'utilities';index=0;renderHome(true);}else moveHome(key);
  }
  function normalized(event){return event.keyCode===461?'Backspace':event.key;}
  document.addEventListener('keydown',function(event){
    var key=normalized(event);if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' ','Backspace','Escape'].indexOf(key)<0)return;
    event.preventDefault();pointerTarget=null;
    if(event.repeat&&(key==='Enter'||key===' '))return;
    if(key.indexOf('Arrow')!==0)flushNavigation();
    if(mode==='settings'&&(key==='Enter'||key===' ')){
      if(enterTimer)return;longPressed=false;
      enterTimer=setTimeout(function(){enterTimer=0;if(mode==='settings'&&tab===0){longPressed=true;setReorder();}},600);return;
    }
    handle(key);
  });
  document.addEventListener('keyup',function(event){
    var key=normalized(event);if(key!=='Enter'&&key!==' ')return;
    if(enterTimer){clearTimeout(enterTimer);enterTimer=0;settingsActivate();}else if(longPressed)longPressed=false;
  });
  utilityEls.forEach(function(el,i){bindPointer(el,function(){if(mode==='home'){zone='utilities';utility=i;renderHome(false);}});el.onclick=function(){if(mode==='sources'&&i===2){closeSources();return;}if(mode==='home'){zone='utilities';utility=i;activate();}};});
  $('settingsClose').onclick=closeSettings;bindPointer($('settingsClose'),function(){settingsZone='close';renderSettings(false);});
  $('reorderButton').onclick=setReorder;bindPointer($('reorderButton'),function(){settingsZone='reorder';renderSettings(false);});
  document.addEventListener('pointerdown',function(event){if(mode==='sources'&&!menu.contains(event.target)&&!$('sourcesButton').contains(event.target))closeSources();});
  var clockTimer=0,clockMinute=-1;
  var dateFormatter=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long'});
  function updateClock(){
    clearTimeout(clockTimer);clockTimer=0;
    if(document.hidden)return;
    var now=new Date(),minute=Math.floor(now.getTime()/60000);
    if(minute!==clockMinute){
      clockMinute=minute;
      var hh=String(now.getHours()).padStart(2,'0'),mm=String(now.getMinutes()).padStart(2,'0');
      $('clockTime').textContent=runtime.timeFormat==='12h'?String(now.getHours()%12||12)+':'+mm:hh+':'+mm;
      if(runtime.timeFormat==='12h')$('clockTime').appendChild(text('span','clock__period',now.getHours()<12?'AM':'PM'));
      setText($('clockDate'),dateFormatter.format(now));
    }
    clockTimer=setTimeout(updateClock,60000-(Date.now()%60000)+20);
  }
  $('dockRows').addEventListener('wheel',function(){homeScrollDestination=null;},{passive:true});
  function fit(){homeBounds=null;homeScrollDestination=null;settingsBounds=null;var scale=Math.min(innerWidth/1920,innerHeight/1080);$('stageScaler').style.width=1920*scale+'px';$('stageScaler').style.height=1080*scale+'px';$('stage').style.transform='scale('+scale+')';}
  window.addEventListener('resize',fit);
  function onForeground(){cancelNavigationFrame();pointerTarget=null;clearTimeout(enterTimer);enterTimer=0;launchRequest++;pendingLaunch=null;clearLaunchNotice();if(!document.hidden){if(mode==='home')renderHome(true);else if(mode==='settings'){buildSettings(true);renderSettings(true);}}updateClock();}
  document.addEventListener('visibilitychange',onForeground);document.addEventListener('webOSRelaunch',onForeground);
  buildDock();buildSources();if(!visible().length){zone='utilities';utility=1;}renderHome(true);updateClock();fit();$('bootStatus').hidden=true;
  return {
    refreshTimeFormat:function(format){runtime.timeFormat=format;clockMinute=-1;updateClock();},
    refreshInputs:function(next){inputs=next;buildSources();if(mode==='sources')renderSources(true);if(mode==='settings'&&tab===1){buildSettings();renderSettings(true);}},
    refreshApps:function(next){
      if(held)cancelHeld();
      var previous=JSON.stringify(visible());
      apps=next;
      order=runtime.config.appIds.map(findApp).filter(Boolean);
      apps.forEach(function(app){if(order.indexOf(app)<0)order.push(app);shown[app.id]=runtime.config.appIds.indexOf(app.id)>=0;});
      invalidateApps();
      if(previous===JSON.stringify(visible()))dockDirty=false;
      buildDock();
      if(mode==='settings')buildSettings();
    }
  };
}

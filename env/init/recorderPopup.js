KellyPopupPage = new Object();
KellyPopupPage.className = 'popup-page';
KellyPopupPage.wrap = false;
KellyPopupPage.recordingState = 'loading'; // loading (init), stopping (stopRecord), starting (startRecord), disabled (record is not runing), enabled (record is runing)
KellyPopupPage.recordingNum = false;
KellyPopupPage.recordingNumEl = false;

KellyPopupPage.buttons = {
   'download_current_tab' : {loc : 'download_current_tab', event : function() {
        
        KellyTools.getBrowser().tabs.query({ active: true, currentWindow: true }, function(tab){
            
             KellyPopupPage.sendTabMessage(tab[0].id, {method : 'parseImages'}, function(response) {
                    
                 KellyTools.log('parseImages [Get images from active tab without record - ' + (response ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
                 if (response && response.images) {
                     
                     KellyTools.getBrowser().runtime.sendMessage({method: "addRecord", clean : true, images : response.images, cats : response.cats, url : response.url, host : response.host}, function(request) {                         
                           KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html'}, function(tab){});                           
                     });
                     
                 } else KellyPopupPage.updateNotice('Вкладка недоступна');              
            });
             
         });
        
    }},   
    'download_recorded' : {loc : 'download_recorded', hidden : true, event : function() {
        KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html'}, function(tab){});        
    }},  
    'download_record' : {loc_disabled : 'download_record', loc_enabled : 'download_record_stop', loc_stopping : 'download_record_stopping', event : function() {
          
          if (['loading', 'stopping', 'starting'].indexOf(KellyPopupPage.recordingState) != -1) return false;
          
          if (KellyPopupPage.recordingState == 'enabled') {   
          
             KellyPopupPage.recordingState = 'stopping';             
             KellyTools.getBrowser().runtime.sendMessage({method: "stopRecord"}, function(recorderResponse) {
                    
                    KellyTools.log('stopRecord [Notify background - ' + (recorderResponse ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
                    if (!recorderResponse) return;
                    
                    var tabsAffected = 0, tabsAnswered = 0;
                    KellyTools.getBrowser().tabs.query({ }, function(tabs){
                        
                        for (var i = 0; i < tabs.length; i++) {
                            
                            KellyPopupPage.sendTabMessage(tabs[i].id, {method: "stopRecord"}, function(tabResponse) {
                                
                                tabsAnswered++;
                                KellyTools.log('stopRecord [' + tabsAnswered + '/' + tabs.length + '][Disabled tab recording - ' + (tabResponse && tabResponse.isStopped ? 'STOPPED' : 'IGNORED') + ']', 'KellyPopupPage');
                                if (tabResponse && tabResponse.isStopped) tabsAffected++;
                                
                                if (tabsAnswered >= tabs.length) {
                                   
                                    KellyPopupPage.recordingState = 'disabled';
                                    KellyPopupPage.recordingNum = recorderResponse.imagesNum;
                                    KellyPopupPage.updateRecordButton(); 
                                }
                            });   
                        }                            
                    });
             });
            
          } else {
              
              KellyPopupPage.recordingState = 'starting';
              KellyTools.getBrowser().runtime.sendMessage({method: "startRecord"}, function(response) {
                    
                    KellyTools.log('startRecord [Notify background - ' + (response ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
                    if (!response || !response.isRecorded) {
                        KellyPopupPage.recordingState = 'disabled';
                        return;
                    }
                    
                    KellyTools.getBrowser().tabs.query({ active: true, currentWindow: true }, function(tab){
                        
                        KellyPopupPage.sendTabMessage(tab[0].id, {method: "startRecord"}, function(response) {
                            
                            KellyTools.log('startRecord [Enable active tab recording module - ' + (response ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
                            if (!response || !response.isRecorded) {                                
                                
                                KellyTools.getBrowser().runtime.sendMessage({method: "stopRecord", clean : true}, function(response) {
                                    KellyTools.log('startRecord - [Reset background by stopRecord - ' + (response ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
                                    KellyPopupPage.recordingState = 'disabled';
                                    KellyPopupPage.updateNotice('Вкладка недоступна');
                                });
                                
                                return;
                            }
                            
                            KellyPopupPage.recordingState = 'enabled'; 
                            KellyPopupPage.updateRecordButton();
                        });    
                    });
             });
             
          }  
    }},
    'options' : {loc : 'saved', event : function() {
         
         KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html?tab=profiles'}, function(tab){});
        
    }}, 
};

KellyPopupPage.updateNotice = function(str) {
    if (!str) {
        KellyPopupPage.recordingNumEl.style.display = 'none';
        return;
    }
    
    KellyPopupPage.recordingNumEl.style.display = '';
    KellyPopupPage.recordingNumEl.innerText = str;    
}

KellyPopupPage.updateRecordButton = function() {
    
      var notice = ''; // KellyLoc.s('No recording', 'download_recorded_empty')
      if (KellyPopupPage.recordingNum) notice = KellyLoc.s('Recorded images', 'download_recorded_images') + ': ' + KellyPopupPage.recordingNum;
      
      KellyTools.setHTMLData(KellyPopupPage.buttons['download_record'].btn, '<span>' + KellyLoc.s('', KellyPopupPage.buttons['download_record']['loc_' + KellyPopupPage.recordingState]) + '</span>');
      
      KellyPopupPage.buttons['download_recorded'].btn.style.display = KellyPopupPage.recordingNum && KellyPopupPage.recordingState == 'disabled' ? '' : 'none'; 
      KellyPopupPage.updateNotice(notice);
}

// todo add frames support - browser.webNavigation.getAllFrames({tabId})
    
KellyPopupPage.sendTabMessage = function(tabId, data, onResponse) {
        
    KellyTools.getBrowser().tabs.sendMessage(tabId, data, {frameId : 0}, function(response) {
        
        if ( KellyTools.getBrowser().runtime.lastError) {    
             KellyTools.log('sendTabMessage | Tab not available : ' + KellyTools.getBrowser().runtime.lastError.message + ']', 'KellyPopupPage');
        }
        
        if (onResponse) onResponse(response ? response : false);               
    });
}

KellyPopupPage.updateRecorded = function() {
    
        KellyTools.getBrowser().runtime.sendMessage({method: "isRecorded"}, function(response) {
            
            KellyPopupPage.recordingNum = response.imagesNum;
            KellyPopupPage.recordingState = 'disabled';
            
            if (response.isRecorded) KellyPopupPage.recordingState = 'enabled';                
                
            KellyPopupPage.updateRecordButton();
        });
}

KellyPopupPage.showRecorder = function() {
            
    document.title = KellyTools.getProgName();
    KellyPopupPage.wrap = document.getElementById('popup');
    
    KellyTools.setHTMLData(KellyPopupPage.wrap, '<div class="' + KellyPopupPage.className + '-recorded-num"></div>'); KellyTools.setCopyright('copyright-software'); 
    KellyPopupPage.recordingNumEl = KellyTools.getElementByClass(KellyPopupPage.wrap, KellyPopupPage.className + '-recorded-num');
        
    for (var buttonKey in KellyPopupPage.buttons) { 
    
         KellyPopupPage.buttons[buttonKey].btn = document.createElement('button');
         KellyPopupPage.buttons[buttonKey].btn.onclick = KellyPopupPage.buttons[buttonKey].event;
         KellyPopupPage.buttons[buttonKey].btn.className = KellyPopupPage.className + '-button-' + buttonKey;
         KellyPopupPage.buttons[buttonKey].btn.innerText = KellyPopupPage.buttons[buttonKey].loc ? KellyLoc.s('', KellyPopupPage.buttons[buttonKey].loc) : buttonKey;
         if (KellyPopupPage.buttons[buttonKey].hidden) KellyPopupPage.buttons[buttonKey].btn.style.display = 'none'; 
         KellyPopupPage.wrap.appendChild(KellyPopupPage.buttons[buttonKey].btn);
    }
    
    KellyPopupPage.updateRecorded();
}

KellyPopupPage.init = function() {
    
    KellyTools.getBrowser().runtime.sendMessage({method: "getResources", items : ['recorderPopup']}, function(request) {
        if (!request || !request.data.css) return false; 
        
        KellyTools.addCss(KellyPopupPage.className, KellyTools.replaceAll(request.data.css, '__BASECLASS__', KellyPopupPage.className));
        KellyPopupPage.showRecorder();
    });            
    
    return true;
}

KellyPopupPage.init();
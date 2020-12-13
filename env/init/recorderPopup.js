var K_FAV = false;

KellyPopupPage = new Object();
KellyPopupPage.className = 'popup-page';
KellyPopupPage.wrap = false;
KellyPopupPage.recordingState = 'loading';
KellyPopupPage.recordingNum = false;
KellyPopupPage.recordingNumEl = false;

KellyPopupPage.buttons = {
   'download_current_tab' : {loc : 'download_current_tab', event : function() {
        
        KellyTools.getBrowser().tabs.query({ active: true, currentWindow: true }, function(tab){
            
             KellyPopupPage.parseImages(tab[0].id, function(response) { 
                 if (response && response.images) {
                     KellyTools.getBrowser().runtime.sendMessage({method: "addRecord", clean : true, images : response.images, cats : response.cats, url : response.url, host : response.host}, function(request) {
                           KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html'}, function(tab){});
                     });
                 }
             });
             
         });
        
    }},   
    'download_recorded' : {loc : 'download_recorded', hidden : true, event : function() {
        KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html'}, function(tab){});        
    }},  
    'download_record' : {loc_disabled : 'download_record', loc_enabled : 'download_record_stop', loc_stopping : 'download_record_stopping', event : function() {
          
          if (['loading', 'stopping'].indexOf(KellyPopupPage.recordingState) != -1) return false;
          
          if (KellyPopupPage.recordingState == 'enabled') {   
          
             KellyPopupPage.recordingState = 'stopping';             
             KellyTools.getBrowser().runtime.sendMessage({method: "stopRecord"}, function(request) {
                 
                    KellyPopupPage.recordingState = 'disabled';
                    KellyPopupPage.recordingNum = request.imagesNum;
                    
                    KellyTools.getBrowser().tabs.query({ }, function(tabs){
                        for (var i = 0; i < tabs.length; i++) KellyPopupPage.sendTabMessage(tabs[i].id, {method: "stopRecord"});                 
                    });
                    
                    KellyPopupPage.updateRecordButton(); 
             });
            
          } else {
              
              
              KellyTools.getBrowser().runtime.sendMessage({method: "startRecord"}, function(response) {
                  
                    if (!response || !response.isRecorded) {
                        KellyPopupPage.recordingNumEl.innerText = 'reset BG error';
                        return;
                    }
                    
                    KellyPopupPage.recordingState = 'enabled'; 
                    KellyPopupPage.updateRecordButton(); 
                    
                    KellyTools.getBrowser().tabs.query({ active: true, currentWindow: true }, function(tab){
                        
                        KellyPopupPage.sendTabMessage(tab[0].id, {method: "startRecord"}, function(response) {
                            
                            if (!response || !response.isRecorded) {
                                KellyPopupPage.recordingNumEl.innerText = 'Вкладка недоступна';
                                return;
                            }
                            
                        });    
                    });
             });
             
          }  
    }},
    'options' : {loc : 'options', event : function() {
         
         KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html?tab=options'}, function(tab){});
        
    }}, 
};

KellyPopupPage.updateRecordButton = function() {
    
      KellyPopupPage.recordingNumEl.innerText = KellyPopupPage.recordingNum ? KellyLoc.s('Recorded images', 'download_recorded_images') + ': ' + KellyPopupPage.recordingNum :  KellyLoc.s('No recording', 'download_recorded_empty');
      KellyTools.setHTMLData(KellyPopupPage.buttons['download_record'].btn, '<span>' + KellyLoc.s('', KellyPopupPage.buttons['download_record']['loc_' + KellyPopupPage.recordingState]) + '</span>');
      KellyPopupPage.buttons['download_recorded'].btn.style.display = KellyPopupPage.recordingNum && KellyPopupPage.recordingState == 'disabled' ? '' : 'none'; 
}

// todo add frames support - browser.webNavigation.getAllFrames({tabId})
    
KellyPopupPage.sendTabMessage = function(tabId, data, onResponse) {
        
    KellyTools.getBrowser().tabs.sendMessage(tabId, data, {frameId : 0}, function(response) {
        
        if ( KellyTools.getBrowser().runtime.lastError) {    
             console.log(  KellyTools.getBrowser().runtime.lastError ); // can be error for system tabs
        }
        
        if (onResponse) onResponse(response ? response : false);               
    });
}
    
KellyPopupPage.parseImages = function(tabId, onParse) {

    KellyPopupPage.sendTabMessage(tabId, {method : 'parseImages'}, function(response) {       
                    
            if (onParse) onParse(response);                
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
    
    KellyTools.setHTMLData(KellyPopupPage.wrap, '<div class="' + KellyPopupPage.className + '-recorded-num"></div>');
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
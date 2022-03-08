KellyPopupPage = new Object();
KellyPopupPage.className = 'popup-page';
KellyPopupPage.css = ['recorderPopup'];
KellyPopupPage.wrap = false;
KellyPopupPage.recordingState = 'loading'; // loading (init), stopping (stopRecord), starting (startRecord), disabled (record is not runing), enabled (record is runing)
KellyPopupPage.recordingNum = false;
KellyPopupPage.recordingInfoEls = false;

KellyPopupPage.buttons = {
   'download_current_tab' : {loc : 'download_current_tab', event : function() {
        
        if (KellyPopupPage.recordingState == 'enabled') {
            KellyPopupPage.buttons['download_record'].event();
            return;
        } else if (KellyPopupPage.recordingState != 'disabled') return;
        
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
    'support_project' : {loc : 'link_support', icon : 'cup', event : function() {
         KellyTools.getBrowser().tabs.create({url: 'https://kellydownloader.com/donate/'}, function(tab){});  
    }},
};

KellyPopupPage.updateNotice = function(str) {
    
    if (!str) {
        KellyPopupPage.recordingInfoEls.block.style.display = 'none';
        return;
    }
    
    KellyPopupPage.recordingInfoEls.block.style.display = '';
    KellyPopupPage.recordingInfoEls.clear.style.display = KellyPopupPage.recordingNum ? '' : 'none';
    KellyPopupPage.recordingInfoEls.notice.innerText = str;     
}

KellyPopupPage.updateRecordButton = function() {
    
    KellyTools.setHTMLData(KellyPopupPage.buttons['download_record'].btn, '<span>' + KellyLoc.s('', KellyPopupPage.buttons['download_record']['loc_' + KellyPopupPage.recordingState]) + '</span>');

    if (KellyPopupPage.recordingState == 'disabled') {
        
        KellyPopupPage.buttons['download_recorded'].hidden = KellyPopupPage.recordingNum && KellyPopupPage.recordingState == 'disabled' ? false : true;
        KellyPopupPage.buttons['download_recorded'].btn.style.display = KellyPopupPage.buttons['download_recorded'].hidden ? 'none' : ''; 
        
        // buttons that shown when "Download record" button is hidden
        
        KellyPopupPage.buttons['download_current_tab'].btn.style.display = KellyPopupPage.buttons['download_recorded'].hidden ? '' : 'none';
        KellyPopupPage.buttons['options'].btn.style.display = KellyPopupPage.buttons['download_current_tab'].btn.style.display;
        KellyPopupPage.buttons['download_record'].btn.style.display = KellyPopupPage.buttons['download_current_tab'].btn.style.display;        
        KellyPopupPage.buttons['support_project'].btn.style.display = KellyPopupPage.buttons['download_current_tab'].btn.style.display;
        
        // support button also can be disabled manualy by user 
        
        if (KellyPopupPage.buttons['support_project'].hidden) KellyPopupPage.buttons['support_project'].btn.style.display = 'none';
        
        KellyPopupPage.updateNotice(KellyPopupPage.recordingNum ? KellyLoc.s('Recorded images', 'download_recorded_images') + ': ' + KellyPopupPage.recordingNum : false);
        
    } else KellyPopupPage.updateNotice(false);
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
    
    KellyTools.setCopyright('copyright-software', 'popup');
    
    var recorderInfoHtml = '\
        <div class="' + KellyPopupPage.className + '-recorded-block">\
            <span class="' + KellyPopupPage.className + '-recorded-notice"></span>\
            <a href="#" class="' + KellyPopupPage.className + '-recorded-clear">' + KellyLoc.s('', 'cancel') + '</a>\
        </div>'; 
    
    KellyTools.setHTMLData(KellyPopupPage.wrap, recorderInfoHtml);
    
    KellyPopupPage.recordingInfoEls = {
        notice : KellyTools.getElementByClass(KellyPopupPage.wrap, KellyPopupPage.className + '-recorded-notice'),
        block : KellyTools.getElementByClass(KellyPopupPage.wrap, KellyPopupPage.className + '-recorded-block'),
        clear : KellyTools.getElementByClass(KellyPopupPage.wrap, KellyPopupPage.className + '-recorded-clear'),
    };
    
    KellyPopupPage.recordingInfoEls.clear.onclick = function() {
        KellyPopupPage.recordingNum = false;
        KellyPopupPage.updateRecordButton();
        return false;
    }
        
    for (var buttonKey in KellyPopupPage.buttons) { 
    
         KellyPopupPage.buttons[buttonKey].btn = document.createElement('button');
         KellyPopupPage.buttons[buttonKey].btn.onclick = KellyPopupPage.buttons[buttonKey].event;
         KellyPopupPage.buttons[buttonKey].btn.className = KellyPopupPage.className + '-button-' + buttonKey;
         
         var locText = KellyPopupPage.buttons[buttonKey].loc ? KellyLoc.s('', KellyPopupPage.buttons[buttonKey].loc) : buttonKey;
         
         if (KellyPopupPage.buttons[buttonKey].icon) {
             var html = '<span class="' + KellyPopupPage.className + '-icon ' + KellyPopupPage.className + '-icon-' + KellyPopupPage.buttons[buttonKey].icon + '"></span><span class="' + KellyPopupPage.className + '-text">' + locText + '</span>';
             KellyTools.setHTMLData(KellyPopupPage.buttons[buttonKey].btn, html);
         } else {   
            KellyPopupPage.buttons[buttonKey].btn.innerText = locText;
         }
         
         if (KellyPopupPage.buttons[buttonKey].hidden) KellyPopupPage.buttons[buttonKey].btn.style.display = 'none'; 
         KellyPopupPage.wrap.appendChild(KellyPopupPage.buttons[buttonKey].btn);
    }
    
    KellyPopupPage.updateRecorded();
}

KellyPopupPage.init = function() {
    
    var favEnv = new KellyFavItems({env : KellyProfileRecorder.getInstance()});
        favEnv.load('cfg', function(fav) { 
            
            if (fav.coptions.toolbar && fav.coptions.toolbar.heartHidden) {
                KellyPopupPage.buttons['support_project'].hidden = true; 
            }
            
            console.log(fav.coptions);
            
            if (fav.coptions.darkTheme) KellyPopupPage.css.push('darkRecorderPopup');
            
            KellyTools.getBrowser().runtime.sendMessage({method: "getResources", items : KellyPopupPage.css}, function(request) {
                if (!request || !request.data.loadedData) return false; 
                
                KellyTools.addCss(KellyPopupPage.className, KellyTools.replaceAll(request.data.loadedData, '__BASECLASS__', KellyPopupPage.className));
                KellyPopupPage.showRecorder();
            });   
        });
    
    return true;
}


KellyTools.loadFrontJs(KellyPopupPage.init);

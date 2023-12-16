KellyPopupPage = new Object();
KellyPopupPage.className = 'popup-page';
KellyPopupPage.css = ['recorderPopup'];
KellyPopupPage.wrap = false;
KellyPopupPage.recordingState = 'loading'; // loading (init), stopping (stopRecord), starting (startRecord), disabled (record is not runing), enabled (record is runing)
KellyPopupPage.recordingNum = false;
KellyPopupPage.recordingInfoEls = false;

KellyTools.DEBUG = false;

KellyPopupPage.getTabs = function(direction, onLoad) {
    
     var resultTabs = {left : [], right : [], all : [], active : false};
     var validateTabsPool = function(tabsPool) {
         
         var ids = [], valid = [];
         
         for (var i = 0; i < tabsPool.length; i++) {
             
            if (ids.indexOf(tabsPool[i].id) != -1) {
                continue;
            }
            
            // exclude all excepts https \ http ( check chrome:// edge:// extension:// etc. )
                
            if (tabsPool[i].url.indexOf('http') !== 0) {
                console.log('skip ext tab ' + tabsPool[i].url);
                continue;
            }
            
            valid.push(tabsPool[i]);
            ids.push(tabsPool[i].id);
         }        
        
         return valid;
     }
     
     KellyTools.getBrowser().tabs.query({}, function(tabs){
            
            for (var i = 0; i < tabs.length; i++) {
                
                resultTabs.all.push(tabs[i]);
                
                if (!resultTabs.active && tabs[i].active) {
                    resultTabs.active = tabs[i];
                    resultTabs[direction].push(resultTabs.active);                    
                } else if (!resultTabs.active) {
                    resultTabs.left.push(tabs[i]);
                } else {
                    resultTabs.right.push(tabs[i]);
                }
            }
            
            onLoad(validateTabsPool(resultTabs[direction]));
     });
}

// todo - add ui feedback - check by startTabRecordPacketMode imagesnum \ settimeout for long answer

KellyPopupPage.recordTabList = function(tabs, onReady) {

    if (KellyPopupPage.recordingState != 'disabled') return;
    
    var tabData = {};
    var total = 0, imagesNum = 0; // todo - add timeout to skip problem tabs - skip ext tabs by url ?
    
    KellyTools.log('recordTabList : tabs total : ' + tabs.length + '', 'KellyPopupPage');
    var onTabReady = function(response, tabId, textDesc) {
         
        total++;
        
        clearTimeout(tabData[tabId]);
        
        KellyTools.log('TabRecordPacketMode READY [TABID [' + tabId + '] recording module - ' + (response ? 'OK' : 'FAIL') + (textDesc ? ' ' + textDesc : '') +']', 'KellyPopupPage');
        if (!response || !response.isRecorded) {  
            // tab init fail
        } else {
            imagesNum += response.imagesNum;
        }
            
        if (total >= tabs.length && KellyPopupPage.recordingState == 'enabled') {
            
            KellyPopupPage.showButtons(KellyPopupPage.buttons);
            KellyPopupPage.buttons['download_record'].event(false, function() {
                
                if (imagesNum <= 0) {
                    KellyPopupPage.updateNotice("На текущих вкладках нет изображений");
                }
                
                if (onReady) onReady();
            });
        }        
    }
    
    var initFailTimer = function(tabId) {
        
        tabData[tabId] = setTimeout(function() {
            onTabReady(false, tabId, 'FAIL BY TIMER');
        }, 1000);
    }
    
    if (tabs.length <= 0) {
        KellyPopupPage.updateNotice("Нет вкладок доступных расширению");
        return;
    } 
    
    KellyPopupPage.recordingState = 'enabled';
        
    KellyTools.getBrowser().runtime.sendMessage({method: "startRecord"}, function(response) {
        
        KellyTools.log('[PACKET MODE] startRecord [Notify background - ' + (response ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
        if (!response || !response.isRecorded) {            
            KellyPopupPage.recordingState = 'disabled';
            return;
        }
        
        for (var i = 0; i < tabs.length; i++) {
            // console.log('send startTabRecordPacketMode to tab ' + tabs[i].url);
            initFailTimer(tabs[i].id);
            KellyPopupPage.sendTabMessage(tabs[i].id, {method: "startTabRecordPacketMode"}, onTabReady);
        }
        
    });
    
}

KellyPopupPage.buttonsExtra = {
    
    'back' : {text : '<<', event : function() {
        
        KellyPopupPage.showButtons(KellyPopupPage.buttons);
        KellyPopupPage.updateRecordButton();
    }},
    
    // left | right ◀ ▶
    
    'download_left' : {loc : 'recorder_popup_left', event : function() {
        
        KellyPopupPage.getTabs('left', KellyPopupPage.recordTabList);
    }},
    
    'download_right' : {loc : 'recorder_popup_right', event : function() {
       
        KellyPopupPage.getTabs('right', KellyPopupPage.recordTabList);
    }},
    
    'download_all' : {loc : 'recorder_popup_all', event : function() {
       
        KellyPopupPage.getTabs('all', KellyPopupPage.recordTabList);
    }},
    
}

KellyPopupPage.buttons = {
    'download_current_tab' : {loc : 'download_current_tab', event : function() {
        
        if (KellyPopupPage.recordingState != 'disabled') return;
        
        KellyTools.getBrowser().tabs.query({ active: true, currentWindow: true }, function(tab){
            
             KellyPopupPage.sendTabMessage(tab[0].id, {method : 'parseImages'}, function(response) {
                    
                 KellyTools.log('parseImages [Get images from active tab without record - ' + (response ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
                 if (response && response.images) {
                     
                     response.method = 'addRecord';
                     response.clean = true;
                     
                     KellyTools.getBrowser().runtime.sendMessage(response, function(request) {                         
                           KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html'}, function(tab){});
                           window.close();
                     });
                     
                 } else KellyPopupPage.updateNotice('Вкладка недоступна');              
            });
             
         });
        
    }},   
     'download_tab_extra' : {text : '+', event : function() {
        
        if (KellyPopupPage.recordingState != 'disabled') return;
        KellyPopupPage.showButtons(KellyPopupPage.buttonsExtra);
        
    }},
    'download_recorded' : {loc : 'download_recorded', hidden : true, event : function() {
        
        KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html'}, function(tab){});  
        window.close();
        
    }},  
    'download_record' : {loc_disabled : 'download_record', loc_enabled : 'download_record_stop', loc_stopping : 'download_record_stopping', event : function(e, onReady) {
          
          if (['loading', 'stopping', 'starting'].indexOf(KellyPopupPage.recordingState) != -1) return false;
          
          if (KellyPopupPage.recordingState == 'enabled') {
          
             KellyPopupPage.recordingState = 'stopping';             
             KellyTools.getBrowser().runtime.sendMessage({method: "stopRecord"}, function(recorderResponse) {
                    
                    KellyTools.log('stopRecord [Notify background - ' + (recorderResponse ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
                    if (!recorderResponse) return;
                    
                    var tabsAffected = 0, tabsAnswered = 0;
                    KellyTools.getBrowser().tabs.query({ }, function(tabs){
                        
                        for (var i = 0; i < tabs.length; i++) {
                            
                            KellyPopupPage.sendTabMessage(tabs[i].id, {method: "stopTabRecord"}, function(tabResponse) {
                                
                                tabsAnswered++;
                                
                                KellyTools.log('stopTabRecord [' + tabsAnswered + '/' + tabs.length + '][Disabled tab recording - ' + (tabResponse && tabResponse.isStopped ? 'STOPPED' : 'IGNORED') + ']', 'KellyPopupPage');
                                console.log(recorderResponse); 
                                console.log(tabResponse);
                                
                                if (tabResponse && tabResponse.isStopped) tabsAffected++;
                                
                                if (tabsAnswered >= tabs.length) {
                                   
                                    KellyPopupPage.recordingState = 'disabled';
                                    KellyPopupPage.recordingNum = recorderResponse.imagesNum;
                                    KellyPopupPage.updateRecordButton();
                                    
                                    if (onReady) onReady('STOP_OK');
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
                        
                        KellyPopupPage.sendTabMessage(tab[0].id, {method: "startTabRecord"}, function(response) {
                            
                            KellyTools.log('startRecord [Enable active tab recording module - ' + (response ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
                            
                            // fail init recording state for tab watchdog, canceling
                            if (!response || !response.isRecorded) {
                                
                                KellyTools.getBrowser().runtime.sendMessage({method: "stopRecord", clean : true}, function(response) {
                                    
                                    KellyTools.log('startRecord - [Reset background by stopRecord - ' + (response ? 'OK' : 'FAIL') + ']', 'KellyPopupPage');
                                    KellyPopupPage.recordingState = 'disabled';
                                    KellyPopupPage.updateNotice('Вкладка недоступна');
                                                                        
                                    if (onReady) onReady('START_FAIL');
                                    
                                });
                                
                                return;
                            }
                            
                            KellyPopupPage.recordingState = 'enabled'; 
                            KellyPopupPage.updateRecordButton();
                            
                            if (onReady) onReady('START_OK');
                        });    
                    });
             });
             
          }  
    }},
    'options' : {loc : 'saved', event : function() {
         
         KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html?tab=profiles'}, function(tab){});
         window.close();
    }}, 
    'support_project' : {loc : 'link_support', icon : 'cup', event : function() {
        
         KellyTools.getBrowser().tabs.create({url: '/env/html/update.html?mode=about'}, function(tab){}); 
         window.close();
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
        
        KellyPopupPage.wrap.classList.remove(KellyPopupPage.className + '-recording');
        KellyPopupPage.buttons['download_recorded'].hidden = KellyPopupPage.recordingNum && KellyPopupPage.recordingState == 'disabled' ? false : true;
        KellyPopupPage.buttons['download_recorded'].btn.style.display = KellyPopupPage.buttons['download_recorded'].hidden ? 'none' : ''; 
        
        for (var buttonKey in KellyPopupPage.buttons) {
            
            if (buttonKey == 'download_recorded') continue;
            
            KellyPopupPage.buttons[buttonKey].btn.style.display = !KellyPopupPage.buttons[buttonKey].hidden && KellyPopupPage.buttons['download_recorded'].hidden ? '' : 'none';
        }
        
        KellyPopupPage.updateNotice(KellyPopupPage.recordingNum ? KellyLoc.s('Recorded images', 'download_recorded_images') + ': ' + KellyPopupPage.recordingNum : false);
        
    } else {
        
        KellyPopupPage.updateNotice(false);        
        KellyPopupPage.wrap.classList.add(KellyPopupPage.className + '-recording');
    }
}

// todo add frames support - browser.webNavigation.getAllFrames({tabId})
    
KellyPopupPage.sendTabMessage = function(tabId, data, onResponse) {
        
    KellyTools.getBrowser().tabs.sendMessage(tabId, data, {frameId : 0}, function(response) {
        
        if ( KellyTools.getBrowser().runtime.lastError) {    
             KellyTools.log('sendTabMessage | Tab not available : ' + KellyTools.getBrowser().runtime.lastError.message + ']', 'KellyPopupPage');
        }
        
        if (onResponse) onResponse(response ? response : false, tabId);               
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

KellyPopupPage.showButtons = function(buttons) {
    
    KellyPopupPage.recordingInfoEls.buttonsBlock.innerHTML = '';
    
    var initButton = function(buttonData, buttonKey) {
        
         buttonData.btn = document.createElement('button');
         buttonData.btn.onclick = function(e) {
             buttonData.event(e);
         }
         
         buttonData.btn.className = KellyPopupPage.className + '-button-' + buttonKey;
         
         var locText = buttonData.text ? buttonData.text : ( buttonData.loc ? KellyLoc.s('', buttonData.loc) : buttonKey );
         
         if (buttonData.icon) {
             var html = '<span class="' + KellyPopupPage.className + '-icon ' + KellyPopupPage.className + '-icon-' + buttonData.icon + '"></span><span class="' + KellyPopupPage.className + '-text">' + locText + '</span>';
             KellyTools.setHTMLData(buttonData.btn, html);
         } else {   
            buttonData.btn.innerText = locText;
         }
         
         if (buttonData.hidden) buttonData.btn.style.display = 'none'; 
         KellyPopupPage.recordingInfoEls.buttonsBlock.appendChild(buttonData.btn);
    }
    
    for (var buttonKey in buttons) { 
        initButton(buttons[buttonKey], buttonKey);
    }
}

KellyPopupPage.showRecorder = function() {
            
    document.title = KellyTools.getProgName();
    KellyPopupPage.wrap = document.getElementById('popup');    
    
    KellyTools.setCopyright('copyright-software', 'popup');
    
    var recorderInfoHtml = '\
        <div class="' + KellyPopupPage.className + '-recorded-block">\
            <span class="' + KellyPopupPage.className + '-recorded-notice"></span>\
            <a href="#" class="' + KellyPopupPage.className + '-recorded-clear">' + KellyLoc.s('', 'cancel') + '</a>\
        </div>\
        <div class="' + KellyPopupPage.className + '-buttons"></div>'; 
    
    KellyTools.setHTMLData(KellyPopupPage.wrap, recorderInfoHtml);
    
    KellyPopupPage.recordingInfoEls = {
        notice : KellyTools.getElementByClass(KellyPopupPage.wrap, KellyPopupPage.className + '-recorded-notice'),
        block : KellyTools.getElementByClass(KellyPopupPage.wrap, KellyPopupPage.className + '-recorded-block'),
        clear : KellyTools.getElementByClass(KellyPopupPage.wrap, KellyPopupPage.className + '-recorded-clear'),
        buttonsBlock : KellyTools.getElementByClass(KellyPopupPage.wrap, KellyPopupPage.className + '-buttons'),
    };
    
    KellyPopupPage.recordingInfoEls.clear.onclick = function() {
        KellyPopupPage.recordingNum = false;
        KellyPopupPage.updateRecordButton();
        return false;
    }
       
    if (KellyPopupPage.buttons['download_tab_extra'] && !KellyPopupPage.buttons['download_tab_extra'].hidden) {
         KellyPopupPage.wrap.classList.add(KellyPopupPage.className + '-with-extra');
    }
    
    if (KellyPopupPage.css.indexOf('darkRecorderPopup') != -1) {
        KellyPopupPage.wrap.classList.add(KellyPopupPage.className + '-dark');
    }
    
    KellyPopupPage.showButtons(KellyPopupPage.buttons);
    KellyPopupPage.updateRecorded();
}

KellyPopupPage.init = function() {
    
    var sm = new KellyFavStorageManager();
        sm.prefix += 'recorder_';      
        sm.prefixCfg += 'recorder_';
        sm.loadDB('config', function(fav) { 
            
            if (fav) {
                
                if (fav.coptions.toolbar && fav.coptions.toolbar.heartHidden) {
                    KellyPopupPage.buttons['support_project'].hidden = true; 
                }
                
                if (fav.coptions.darkTheme) KellyPopupPage.css.push('darkRecorderPopup');
                
            } else {
                 KellyPopupPage.css.push('darkRecorderPopup');
            }
            
            KellyTools.getBrowser().runtime.sendMessage({method: "getResources", items : KellyPopupPage.css}, function(request) {
                if (!request || !request.data.loadedData) return false; 
                
                KellyTools.addCss(KellyPopupPage.className, KellyTools.replaceAll(request.data.loadedData, '__BASECLASS__', KellyPopupPage.className));
                KellyPopupPage.showRecorder();
            });   
            
        }, true);
        
    return true;
}

KellyPopupPage.init();
// KellyTools.loadFrontJs(KellyPopupPage.init);

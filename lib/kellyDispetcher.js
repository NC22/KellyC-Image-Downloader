// part of KellyFavItems extension
// only background extensions has access to download API, so we create one

var KellyEDispetcher = new Object;
    KellyEDispetcher.eventsAccepted = false;
    KellyEDispetcher.envDir = 'env/';
    KellyEDispetcher.api = KellyTools.getBrowser();
    KellyEDispetcher.threads = [];
    KellyEDispetcher.downloaderTabs = []; 

    KellyEDispetcher.addRequestListeners = function(tabData) {
        
        var isValidRequest = function(e) {
            var type = KellyTools.getMimeType(KellyTools.getUrlExt(e.url));
            if (type.indexOf('image') != -1 || type.indexOf('video') != -1) return true;
        }
        
        var modifyHeader = function(source, name, value) {
            var index = false, data = { name : name, value : value };
            for (var i = 0; i < source.length; ++i) {
                
                if (source[i].name.toLowerCase() == name.toLowerCase()) {                    
                    source[i] = data; index = i;                    
                    break;
                }
            }
           
           if (index == false) source.push(data);
           return source;
        }
        
        var filter = {urls: ["<all_urls>"], tabId: tabData.id};
        if (!tabData.optionsTab) filter.types = ['xmlhttprequest']; // possible image \ media
        
        if (tabData.referrer) {
            
            tabData.onBeforeRequest = function(e) {
                if (!isValidRequest(e)) return;
                
                modifyHeader(e.requestHeaders, 'cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
                modifyHeader(e.requestHeaders, 'cache-control', 'max-age=0');
                modifyHeader(e.requestHeaders, 'expires', '0');
                modifyHeader(e.requestHeaders, 'expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
                modifyHeader(e.requestHeaders, 'pragma', 'no-cache');
                modifyHeader(e.requestHeaders, "Referer", tabData.referrer);
                
                return {requestHeaders: e.requestHeaders};
            }
            
            KellyTools.getBrowser().webRequest.onBeforeSendHeaders.addListener(
                  tabData.onBeforeRequest,
                  filter,
                  ['requestHeaders', 'blocking', 'extraHeaders'],
            );
        }
        
        if (tabData.cors) {    

            tabData.onHeadersReceived = function(e) {                
                    if (!isValidRequest(e)) return;
                
                   modifyHeader(e.responseHeaders, "Access-Control-Allow-Origin",  "*" );                       
                   return {responseHeaders: e.responseHeaders};
                }
                
            KellyTools.getBrowser().webRequest.onHeadersReceived.addListener(
                  tabData.onHeadersReceived,
                  filter,
                  ['responseHeaders', 'blocking', 'extraHeaders'],
            );
             
        }       
    }
    
    // bg subscriptions to API
    KellyEDispetcher.initEvents = {
        onChanged :  function(downloadDelta) {
            
            // Clean up 
                                 
            if (downloadDelta && downloadDelta.state) {
                
                if (downloadDelta.state.current == "interrupted" || downloadDelta.state.current == "complete") {
                    
                    
                    if (KellyEDispetcher.blobData[downloadDelta.id]) {
                        
                        URL.revokeObjectURL(KellyEDispetcher.blobData[downloadDelta.id]);
                        delete KellyEDispetcher.blobData[downloadDelta.id];
                    }                   
                }
            }
            
            // Notify tabs
            
            KellyEDispetcher.sendNotification({method: "onChanged", downloadDelta : downloadDelta});
        },
    }
    
    // todo - check any way to keep temporary alive connection with tab in [persistent = false] mode
    // currently background process die after ~15sec of wait
    // если потребуется оповещать страницу настроек - добавить отдельное совпадение в matches
    
    KellyEDispetcher.sendNotification = function(data, excludeTabIds) {
        
        if (!data || !data.method) return;
        
        var onLoadTabsMap = function(tabs, local){   
        
            if (KellyEDispetcher.api.runtime.lastError) {                
                KellyTools.log('cant get tab list. Error : ' + KellyEDispetcher.api.runtime.lastError.message, 'KellyEDispetcher');
                return;    
            }
            
            var tabList = '';
            for (var i=0; i <= tabs.length-1; i++) {
                var tab = local ? tabs[i].tab : tabs[i];                
                if (excludeTabIds && excludeTabIds.indexOf(tab.id) !== -1) {
                    continue;
                }
                
                tabList += ' ' + tab.url.replace('http://', '').replace('https://', '').substring(0, 30);
                KellyEDispetcher.api.tabs.sendMessage(tab.id, data, function(response) {
                    
                    if (KellyEDispetcher.api.runtime.lastError) {  
                        KellyTools.log('tab is unsubbed or offline, skip. Notice : ' + KellyEDispetcher.api.runtime.lastError.message, 'KellyEDispetcher');
                        return;
                    }
                });
            }
            
            KellyTools.log('send message to tabs [' + tabList + ' ] method : ' + data.method, 'KellyEDispetcher');                
        }
        
        if (data.method == 'onChanged') {
            onLoadTabsMap(KellyEDispetcher.downloaderTabs, true);
        } else {
            var query = {};

            if (KellyEDispetcher.api && KellyEDispetcher.api.runtime.getManifest) {
                var query = {url : KellyEDispetcher.api.runtime.getManifest().content_scripts[0].matches};
            }
            KellyTools.getBrowser().tabs.query(query, onLoadTabsMap);
        }
    }
    
    KellyEDispetcher.blobData = [];
    
    KellyEDispetcher.isDownloadSupported = function() {
    
        if (!KellyEDispetcher.api || typeof KellyEDispetcher.api.downloads == 'undefined') {
            return false;
        }
        
        return true;
    }
    
    KellyEDispetcher.init = function() {
    
        if (this.eventsAccepted) return true;
        
        this.api.runtime.onMessage.addListener(this.onMessage);        
        this.api.downloads.onChanged.addListener( this.initEvents.onChanged );
                
        this.eventsAccepted = true;
        
        return true;
    }
    
    // custom connections posible only by setting up port connection (onConnectExternal \ onMessageExternal)
    
    KellyEDispetcher.onMessage = function(request, sender, callback) {
            
        KellyTools.log(request, 'KellyEDispetcher');    
        KellyTools.log(sender.tab ? " request from content script : " + sender.tab.url : "from the extension", 'KellyEDispetcher');    
    
        var response = {
            
            senderId : 'dispetcher',
            error : '',
            method : request.method,
            
        }
            
        if (request.method == 'downloads.cancel') {        
            
            if (request.downloadId) {
                
                KellyTools.getBrowser().downloads.cancel(request.downloadId, function () {
                
                    if (KellyEDispetcher.api.runtime.lastError) {    
                    
                        // KellyEDispetcher.api.runtime.lastError.message;
                        // no callback currently, add if needed         
                    }
                    
                });
                
            } else {                
                KellyTools.log('Method : ' + request.method + ' : bad request', 'KellyEDispetcher');
                KellyTools.log(request, 'KellyEDispetcher');
            }
                    
        } else if (request.method == 'downloads.download') {
            
            // request.download - download options - where url can be base64 binary data \ blob url or direct url string

            response.downloadId = -1;
                 
            var saveDownloadedBlobData = function() {
                KellyTools.getBrowser().downloads.download(request.download, function (downloadId) {
                    
                    // download job created
                    
                    if (KellyEDispetcher.api.runtime.lastError) {    
                    
                        response.error = KellyEDispetcher.api.runtime.lastError.message;
                        response.downloadId = -1;
                        
                    } else {
                    
                        response.downloadId = downloadId;
                        
                        if (!downloadId || downloadId < 0) {
                            response.downloadId = -1;
                        }
                    }
                                      
                    KellyEDispetcher.blobData[downloadId] = request.download.url;
                    
                    if (callback) callback(response);                    
                });
            }
               
            if (typeof request.download.url == 'object') { // binary data
                
                var mimeType = request.download.url.type;                
                var blob = KellyTools.base64toBlob(request.download.url.base64, mimeType);
                
                delete request.download.url.base64;
                
                request.blob = true;
                request.download.url = URL.createObjectURL(blob);
                
                KellyTools.log('array of data recieved | data type ' + mimeType , 'KellyEDispetcher');        
            }
               
            if (request.blob) saveDownloadedBlobData();
            else {
                
                // todo feedback and cancel, by emulate downloadDelta object
                
                var downloadThread = KellyTools.fetchRequest( request.download.url,
                    { method: request.download.method },
                    function(urlOrig, blob, errorCode, errorText, self) {
                        
                        var threadIndex = KellyEDispetcher.threads.indexOf(self);
                        if (threadIndex == -1) return;
                        
                        KellyEDispetcher.threads.splice(threadIndex, 1);
                        
                        if (self.canceled) return;
                        if (blob === false) {
                            response.error = '[status code] : ' + errorCode + ' | ' + errorText;
                            response.downloadId = -1;
                            callback(response);
                        } else {
                            request.download.url = URL.createObjectURL(blob);
                            saveDownloadedBlobData();
                        }
                    });
                    
                KellyEDispetcher.threads.push(downloadThread);
                
            }
            
            return true;
            
        } else if (request.method == "isDownloadSupported") {
            
            response.isDownloadSupported =  KellyEDispetcher.isDownloadSupported();
            
        } else if (request.method == "isFilesDownloaded") {
            
            if (!request.filenames || !request.filenames.length) {
                
                response.matchResults = {};
                
            } else {
                
                response.matchResults = [];
                
                var requsetSearch = function(filename) {
                
                    var regExp = KellyTools.folderPatchToRegularExpression(filename);
                    
                    var onSearchResult = function(result) {
                       
                        if (KellyEDispetcher.api.runtime.lastError) {
                        
                            response.error = KellyEDispetcher.api.runtime.lastError.message;
                            
                        } else {
                            
                            if (!result || !result.length) {
                                response.matchResults[response.matchResults.length] = {filename : filename};
                            } else {
                                response.matchResults[response.matchResults.length] = {filename : filename, match : result[0]};
                            }
                        }
                        
                        if (response.matchResults.length == request.filenames.length && callback) {
                            callback(response);
                        }
                    }
                    
                    chrome.downloads.search({filenameRegex: regExp}, onSearchResult);
                }
                
                // multiple callbacks untested
                
                for (var i = 0; i < request.filenames.length; i++) {
                                        
                    var badExpression = false;
                    
                    try {
                        
                        requsetSearch(request.filenames[i]);
                       
                    } catch (E) {
                        badExpression = true;
                    }
                    
                    if (badExpression) {
                        response.matchResults[response.matchResults.length] = {filename : request.filenames[i]};
                    }               
                }
                
                if (response.matchResults.length == request.filenames.length) {
                
                } else {                
                    return true; // async
                }
            }
               
        } else if (request.method == "getLocalStorageList") {
            
            var prefix = request.prefix;
            var keepPrefix = request.keepPrefix;
            var slist = [];
            
            if (typeof localStorage == 'undefined' || !localStorage.length) {
        
            } else {
            
                for (var i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i).indexOf(prefix) !== -1) {
                        if (keepPrefix) slist.push(localStorage.key(i));
                        else slist.push(localStorage.key(i).replace(prefix, '')); 
                    }
                }
            }
            
            response.slist = slist;
        
        } else if (request.method == "getLocalStorageItem") {
            
            if (request.dbName) {
                response.item = localStorage.getItem(request.dbName);
            } else response.item = false;
        
        } else if (request.method == "removeLocalStorageItem") {
            
            if (request.dbName) {
                localStorage.removeItem(request.dbName);
            }
        
        } else if (request.method == "setLocalStorageItem") {
            
            if (request.dbName && request.data) {
                
                try {
                    
                    localStorage.setItem(request.dbName, JSON.stringify(request.data));
                    
                } catch (E) {
                    
                    response.error = E;
                    
                }
                
                if (response.error) {
                    
                } else {                   
                
                    response.error = false;
                    
                    KellyEDispetcher.sendNotification({
                        
                        method: "onUpdateStorage", 
                        updateMethod : 'setApiStorageItem', 
                        dbOrigName : request.dbOrigName, 
                        dbName :  request.dbName,
                        isCfg : request.isCfg,
                        tabId : sender.tab ? sender.tab.id : -1,
                        
                    }, sender.tab ? [sender.tab.id] : false);
                }
            }
        
        } else if (request.method == "setApiStorageItem") {
            
            if (!request.data) {
            
                response.error = 'setApiStorageItem : Data is empty';
                if (callback) callback(response);
                
            } else {
            
                KellyEDispetcher.api.storage.local.set(request.data, function() {
                
                    if (KellyEDispetcher.api.runtime.lastError) {
                        
                        response.error = KellyEDispetcher.api.runtime.lastError.message;
                        
                    } else {
                        
                        response.error = false;
                        
                        KellyEDispetcher.sendNotification({
                            
                            method: "onUpdateStorage", 
                            updateMethod : 'setApiStorageItem', 
                            dbOrigName : request.dbOrigName, 
                            dbName :  request.dbName,
                            isCfg : request.isCfg,
                            tabId : sender.tab ? sender.tab.id : -1,
                            
                        }, sender.tab ? [sender.tab.id] : false);
                    }
                    
                    if (callback) callback(response);
                });
                
                return true; // async mode
            }
            
        } else if (request.method == "removeApiStorageItem") {
            
            if (!request.dbName) {
            
                response.error = 'removeApiStorageItem : dbName is empty';
                if (callback) callback(response);
                
            } else {
            
                KellyEDispetcher.api.storage.local.remove(request.dbName, function() {
                
                    response.error = false;
                    
                    if (KellyEDispetcher.api.runtime.lastError) {
                        
                        response.error = KellyEDispetcher.api.runtime.lastError.message;
                    }
                    
                    if (callback) callback(response);
                });
                
                return true; // async mode
            
            }
            
        } else if (request.method == "getApiStorageItem") {
        
            if (!request.dbName) {
            
                response.error = 'loadApiStorageItem : dbName is empty';
                if (callback) callback(response);
                
            } else {
            
                KellyEDispetcher.api.storage.local.get(request.dbName, function(item) {
                    
                    response.item = item;
                    
                    if (callback) callback(response);
                });	
                
                return true; // async mode
            
            }
            
        } else if (request.method == "getApiStorageItemBytesInUse") {
            
            response.bytes = 0;
            if (!request.dbName) {
            
                response.error = 'getApiStorageItemBytesInUse : dbName is empty';
                if (callback) callback(response);
                
            } else {
            
                KellyEDispetcher.api.storage.local.getBytesInUse(request.dbName, function(bytes){
                    
                    response.bytes = bytes;
                    if (callback) callback(response);
                    
                });
                
                return true; // async mode
            }
                        
        } else if (request.method == "getApiStorageList") {
            
            KellyEDispetcher.api.storage.local.get(null, function(dbs) {
                
                response.slist = [];
                if (dbs) {
                    var names = Object.keys(dbs);

                    for (var i = 0; i < names.length; i++) {
                        if (names[i].indexOf(request.prefix) !== -1) {
                            if (request.keepPrefix) response.slist.push(names[i]);
                            else response.slist.push(names[i].replace(request.prefix, '')); 
                        }
                    }
                }
                
                if (callback) callback(response);
            });
            
            return true; // async mode
         
        // loads selected css items and send an init dispetcher env data
        
        } else if (request.method == 'getCss') {
            
            var loaded = 0;
            
            var answerData = {
                css : '',
                notice : '',
                url : '',
            };
            
            if (request.debug) {
                KellyTools.DEBUG = true;
                KellyTools.log('Tab loaded in debug mode, switch background process debug mode to TRUE', 'KellyEDispetcher')
            }
            
            var onGetResource = function(url, data, notice) {
                
                loaded++;
                
                answerData.url += ',' + url;
                if (notice) {
                    answerData.notice += ',' + notice;
                }
                
                if (data && data !== false) {
                        
                    answerData.css += "\n\r\n\r\n\r" + '/* ' +  url + ' */' + "\n\r\n\r\n\r" + data;
                    answerData.css += "\n\r\n\r\n\r" + '/* ' +  url + ' end */' + "\n\r\n\r\n\r";
                    
                } else {
                    answerData.notice += ', ' + url + ' load failed';
                }
                
                if (loaded == request.items.length) {
                
                    if (callback) {
                
                        callback({
                            error : answerData.notice,
                            data : answerData,
                            isDownloadSupported : KellyEDispetcher.isDownloadSupported(),
                        });
                    }
                }
            }
             
            var	onFail = function(url, errorCode, errorText) {
                onGetResource(url, false, 'code : ' + errorCode + ' | ' +errorText); // perhaps bad idea combine different types \ need to check errorCode typeof
            }
            
            var onSuccess = function(data, url) {
                onGetResource(url, data, false);
            }
            
            for (var i = 0; i < request.items.length; i++) {
                
                KellyTools.log(request.items[i], 'KellyEDispetcher');
                
                var css = KellyTools.getBrowser().runtime.getURL(KellyEDispetcher.envDir + 'css/' + request.items[i] + '.css');
       
                if (!css) {
                    onFail('unknown_' + request.items[i], false, 'unexist css file ' + request.items[i]);
                } else {
                
                    KellyTools.readUrl(css, onSuccess, onFail, 'GET', true, "text/css"); 
                }
            }  
            
            return true; // async mode
            
        } else if (request.method == 'register.Downloader') {
                
                // todo add clean up closed \ suddenly removed tabs
                
                var tabData = false, tabDataIndex = false;
                for (var i = 0; i < KellyEDispetcher.downloaderTabs.length; i++) {
                    if (KellyEDispetcher.downloaderTabs[i].id == sender.tab.id) {
                        tabData = KellyEDispetcher.downloaderTabs[i];
                        tabDataIndex = i;
                        break;
                    }
                }
                
                if (tabDataIndex === false) {
                    tabData = {tab : sender.tab, id : sender.tab.id, referrer : request.referrer, cors : request.cors, optionsTab : request.optionsTab};
                    tabDataIndex = KellyEDispetcher.downloaderTabs.length;
                    KellyEDispetcher.downloaderTabs[tabDataIndex] = tabData;
                } else {
                    tabData.cors = request.cors;
                    tabData.optionsTab = request.optionsTab;
                    tabData.referrer = request.referrer
                }
                              
                if (tabData.onBeforeRequest) {
                    KellyTools.getBrowser().webRequest.onBeforeRequest.removeListener(tabData.onBeforeRequest);
                    tabData.onBeforeRequest = false;
                }
                
                if (tabData.onHeadersReceived) {
                    KellyTools.getBrowser().webRequest.onHeadersReceived.removeListener(tabData.onHeadersReceived);
                    tabData.onHeadersReceived = false;
                }   
                
                if (request.state == 'wait') {                   
                    KellyEDispetcher.downloaderTabs.splice(tabDataIndex, 1);                    
                } else {
                    KellyEDispetcher.addRequestListeners(tabData);
                }
                  
                KellyTools.log('update register.Downloader modifiers state : ' + request.state, 'KellyEDispetcher');
                KellyTools.log(KellyEDispetcher.downloaderTabs, 'KellyEDispetcher'); 
        }
        
        if (callback) callback(response);        
    }
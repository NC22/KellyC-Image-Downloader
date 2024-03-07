// part of KellyFavItems extension
// only background extensions has access to download API, so we create one

var KellyEDispetcher = new Object;

    KellyEDispetcher.updatePageRevision = ['1.2.8.5', '1.2.8.6']; // versions, that related to update.html page text, if already notified on one of listed versions - skip | '1.2.5.0', '1.2.5.1', '1.2.5.2', '1.2.5.3', '1.2.5.4'

    KellyEDispetcher.eventsAccepted = false;
    KellyEDispetcher.envDir = 'env/';
    KellyEDispetcher.api = KellyTools.getBrowser();
    KellyEDispetcher.downloaderTabs = []; 
    KellyEDispetcher.events = []; // [... , {onMessage : callback(KellyEDispetcher, response, request, sender, callback), onTabConnect : callback(KellyEDispetcher, port), onTabMessage : callback(KellyEDispetcher, tabData)}]
        
    KellyEDispetcher.blobData = {};
    KellyEDispetcher.openTabData = false;
    
    KellyEDispetcher.isDownloadSupported = function() {
    
        if (!KellyEDispetcher.api || typeof KellyEDispetcher.api.downloads == 'undefined') {
            return false;
        }
        
        return true;
    }
    
    KellyEDispetcher.init = function() {
    
        if (this.eventsAccepted) return true;
               
        this.api.runtime.onMessage.addListener(this.onMessage);    
        this.api.runtime.onConnect.addListener(this.onTabConnect);

        this.api.downloads.onChanged.addListener( this.initEvents.onChanged );
        this.api.runtime.onInstalled.addListener( this.initEvents.onInstalled );
                        
        this.eventsAccepted = true;
        
        return true;
    }
    
    // BG Dispetcher subscriptions to API
    
    KellyEDispetcher.initEvents = {
        onChanged :  function(downloadDelta) { // this.api.downloads.onChanged
            
            // Clean up for localy (from bg) created blob urls
                                 
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
        onInstalled :  function(details) { // this.api.runtime.onInstalled
                
                // console.log(details);
                
                if (details.reason == "install") {
                    
                 //  console.log('[install]');  
                 //  KellyEDispetcher.api.tabs.create({url: '/env/html/update.html?mode=install'}, function(tab){});
                   
                } else if (details.reason == "update") {
                   
                   console.log('[update] ' + details.previousVersion + ' - ' + KellyEDispetcher.api.runtime.getManifest().version);
                   if ( details.previousVersion.indexOf(KellyEDispetcher.api.runtime.getManifest().version) === 0 ) {
                        console.log('[update] skip update info - same version');
                        return;
                   }
                   
                   if ( KellyEDispetcher.updatePageRevision.indexOf(KellyEDispetcher.api.runtime.getManifest().version) == -1 ) {
                        console.log('[update] skip update info - mismatch version ' + KellyEDispetcher.api.runtime.getManifest().version);
                        return;
                   }
                   
                   KellyEDispetcher.api.storage.local.get('kelly-extension-update-inform', function(item) {
         
                        if (KellyEDispetcher.api.runtime.lastError) {                        
                            console.log(KellyEDispetcher.api.runtime.lastError);                            
                        } else {
                            
                            var revisionInfo = item['kelly-extension-update-inform'];                        
                            if (!revisionInfo || KellyEDispetcher.updatePageRevision.indexOf(revisionInfo.revision) == -1) {
                                
                                console.log('[update] needs to notify');                                
                                KellyEDispetcher.api.tabs.create({url: '/env/html/update.html?mode=update'}, function(tab){});
                                KellyEDispetcher.api.storage.local.set({'kelly-extension-update-inform' : {revision : KellyEDispetcher.api.runtime.getManifest().version}}, function() {
                                
                                    if (KellyEDispetcher.api.runtime.lastError) {                            
                                        console.log(KellyEDispetcher.api.runtime.lastError);                       
                                    }
                                });
                            } else {
                                console.log('[update] already notified in ' + revisionInfo.revision);
                            }
                        }
                    });	
                }
        },
    }
    
    /*
        tabData request rules
        
        .hostlist - array of hostnames - [example.com, test.com] - matches - [*://*.example.com/*, *://example.com/*, *://*.test.com/*, *://test.com/*]
        .referrer - [optional] default referrer, applyed for .hostlist generated matches urls with MIME type image/*, video/*
        .urlMap   - [optional] array of urls in format [[url, referrer, additionRequestHeaders, additionResponseHeaders], [...], ...]
        .types    - [optional] filter by request type - xmlhttprequest
        
        [always additionaly filters by tab id]
        
        Priority [STRICT math by url in urlMap array] -> [ALL media data urls by match with - hostlist + media MIME type]
         
    */
    
    KellyEDispetcher.addRequestListeners = function(tabData) {
          
         var getRulesDataForUrl = function(url) {
        
            if (!tabData.urlMap) return false;
            
            for (var i = 0; i < tabData.urlMap.length; i++) {
                if (tabData.urlMap[i][0] == url) return tabData.urlMap[i];
            }
                
            return false;
        }
        
        // check is url headers needed to modify. if urlmap is not setted - by default accept only media urls (with ext jpg, png, etc)
        
        var isValidRequest = function(e) {
             
            if (!tabData.eventsEnabled) return 'Events disabled';

            var requestTabId = !e.tabId || e.tabId == -1 ? false : e.tabId; // unknown tabid - bug in content-script
            if (requestTabId && requestTabId != tabData.id) return 'Tab id mismatched : ' + ' request id : ' + requestTabId + ' | tab id : ' + tabData.id;

            if (getRulesDataForUrl(e.url) === false) {
                
                if (!tabData.referrer) return 'Referer for tab ' + tabData.id + ' is undefined';
                var type = KellyTools.getMimeType(KellyTools.getUrlExt(e.url));
                if (type.indexOf('image') != -1 || type.indexOf('video') != -1) return true;
                
            } else return true;
            
            return 'No matched rules';
        }
        
        if (!tabData.hostList || !tabData.hostList.length) {
            KellyTools.log('cant init webrequest events - hostlist is empty for tab [' + tabData.id + ']', 'KellyEDispetcher');
            return;
        }
        
        var filter = {urls : KellyTools.getHostlistMatches(tabData.hostList)}; 
        if (tabData.types) { 
            filter.types = tabData.types; // xmlhttprequest always, except options tab
        }
        
        if (tabData.browser != 'firefox') { // webRequests frome extension returns tabId = -1 for firefox for content-script events
            filter.tabId = tabData.id;
        } else {
            if (filter.types) filter.types.push('other'); // firefox <56.x return other for xmlhttprequest
        }
        
        if (tabData.referrer || tabData.urlMap) {
            
            tabData.onBeforeSendHeaders = function(e) {
                               
                var validatorResult = isValidRequest(e);
                if (validatorResult !== true) {
                    KellyTools.log('[SKIP REQUEST] ' + validatorResult + ' | ' + e.url);
                    return;
                }
                
                var urlData = getRulesDataForUrl(e.url);
                var additionRequestHeaders = urlData !== false && typeof urlData[2] != 'undefined' ? urlData[2] : false;
                var referrer = urlData !== false ? urlData[1] : tabData.referrer;
                
                if (!additionRequestHeaders && referrer) {
                    
                    KellyTools.wRequestSetHeader(e.requestHeaders, 'cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
                    
                    if (KellyTools.wRequestGetHeader(e.requestHeaders, 'If-Modified-Since')) {
                        KellyTools.wRequestSetHeader('If-Modified-Since', 'Tue, 01 Jan 1980 1:00:00 GMT');
                    }
                    
                    KellyTools.wRequestSetHeader(e.requestHeaders, 'pragma', 'no-cache');
                    KellyTools.wRequestSetHeader(e.requestHeaders, "Referer", referrer);
                } else if (additionRequestHeaders) {
                    for (var key in additionRequestHeaders) KellyTools.wRequestSetHeader(e.requestHeaders, key, additionRequestHeaders[key]);
                }
                
                KellyTools.log(e.url + ' | ' + referrer + ' [Modify REQUEST HEADERS]');                
                return {requestHeaders: e.requestHeaders};
            }
          
            KellyTools.wRequestAddListener('onBeforeSendHeaders', tabData.onBeforeSendHeaders, filter, ['requestHeaders', 'blocking'], true);   
   
            tabData.onHeadersReceived = function(e) {  
                
                   var validatorResult = isValidRequest(e);
                   if (validatorResult !== true) {
                       KellyTools.log('[SKIP RESPONSE] ' + validatorResult  + ' | ' + e.url);
                       return;
                   }
                   
                   var urlData = getRulesDataForUrl(e.url); // addition headers from url map
                   var additionResponseHeaders = urlData !== false && typeof urlData[3] != 'undefined' ? urlData[3] : false;
                   
                   if (e.statusCode == 200) KellyTools.wRequestSetHeader(e.responseHeaders, 'expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
                       
                   if (tabData.urlMap && (e.statusCode == 301 || e.statusCode == 302)) { // extend url map list with redirect links for use in (onBeforeSendHeaders | onHeadersReceived) on new request
                       var referrer = getRulesDataForUrl(e.url);
                       if (referrer !== false) tabData.urlMap.push([KellyTools.wRequestGetHeader(e.responseHeaders, 'location'), referrer[1]]);
                   }
                   
                   // Mixed Content - fetch [https] request get response with [http] redirect - force attempt to load throw https
                   
                   if (tabData.referrer && e.type == "xmlhttprequest" && (e.statusCode == 301 || e.statusCode == 302) && tabData.referrer.indexOf('https') != -1) {
                       var responseRedirect = KellyTools.wRequestGetHeader(e.responseHeaders, 'location');
                       if (responseRedirect !== false && responseRedirect.indexOf('http://') != -1) {
                           responseRedirect = responseRedirect.replace('http://', 'https://');
                           if (responseRedirect != e.url) KellyTools.wRequestSetHeader(e.responseHeaders, "location",  responseRedirect);
                       }
                   }
                   
                   // prevent CORS limitations 
                   
                   if (!additionResponseHeaders) {
                        KellyTools.wRequestSetHeader(e.responseHeaders, "Access-Control-Allow-Origin",  "*" );  
                   } else {
                        for (var key in additionResponseHeaders) KellyTools.wRequestSetHeader(e.responseHeaders, key, additionResponseHeaders[key]);  
                   }
                   
                   KellyTools.log(e.url + ' [Modify RECEIVED HEADERS][Allow access][Status code : ' + e.statusCode + ']');    
                   return {responseHeaders: e.responseHeaders};
            }
            
            KellyTools.wRequestAddListener('onHeadersReceived', tabData.onHeadersReceived, filter, ['responseHeaders', 'blocking'], true);              
        }
        
        KellyTools.log("[WEBREQUEST EVENT REGISTERED] :");
        KellyTools.log(filter);
    }
    
    KellyEDispetcher.sendNotification = function(data, excludeTabIds) {
        
        if (!data || !data.method) return;
        
        var onLoadTabsMap = function(tabs){   
        
            if (KellyEDispetcher.api.runtime.lastError) {                
                KellyTools.log('cant get tab list. Error : ' + KellyEDispetcher.api.runtime.lastError.message, 'KellyEDispetcher');
                return;    
            }
            
            var tabList = '';
            for (var i = 0; i <= tabs.length-1; i++) {
                var tab = tabs[i].tab;                
                if (excludeTabIds && excludeTabIds.indexOf(tab.id) !== -1) continue;
                
                tabList += ' ' + tab.url.replace('http://', '').replace('https://', '').substring(0, 30);                
                tabs[i].port.postMessage(data);
            }
            
            KellyTools.log('send message to tabs [' + tabList + ' ] method : ' + data.method, 'KellyEDispetcher');                
        }
        
        onLoadTabsMap(KellyEDispetcher.downloaderTabs, true);        
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
        } else if (request.method == 'tabs.buffer'){ // to send some data on tab create
            
            if (request.action == 'set') {
                    KellyEDispetcher.tabsBuffer = request.data;
            } else response.data = KellyEDispetcher.tabsBuffer;
            
        } else if (request.method == 'downloads.download') {
            
            // request.download - download options - where url can be base64 binary data \ blob url or direct url string

            response.downloadId = -1;
                 
            var saveDownloadedBlobData = function(localBlob) {
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
                                      
                    if (localBlob) KellyEDispetcher.blobData[downloadId] = request.download.url;
                    
                    if (callback) callback(response);                    
                });
            }
            
            /* deprecated - manifest v3 not supported */
            
            if (typeof request.download.url == 'object') { // base64 \ blob
                
                KellyTools.log('Data recieved | data type ' + request.download.url.type , 'KellyEDispetcher'); 
                if (request.download.url.base64) {
                    
                    var blob = KellyTools.base64toBlob(request.download.url.base64, request.download.url.type);                    
                    delete request.download.url.base64;
                    
                    request.download.url = URL.createObjectURL(blob);                    
                    saveDownloadedBlobData(true);
                
                } else {
                    request.download.url = request.download.url.blob;
                    saveDownloadedBlobData();
                }
                
            } else {
                
                // download process without preloaded data, curently removed from options - usless because of CORS limitations (see grabberDriver_requestMethod, REQUEST_FETCHBG in kellyGrabber)
                
                KellyTools.log('Url String recieved, download without preloaded data', 'KellyEDispetcher'); 
                saveDownloadedBlobData();
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
        
        /* deprecated - use browser storage API instead */
        
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
            
        /* deprecated */
        
        } else if (request.method == "getLocalStorageItem") {
            
            if (typeof localStorage != 'undefined' && request.dbName) {
                response.item = localStorage.getItem(request.dbName);
            } else response.item = false;
        
        /* deprecated */
        
        } else if (request.method == "removeLocalStorageItem") {
            
            if (typeof localStorage != 'undefined' && request.dbName) {
                localStorage.removeItem(request.dbName);
            }
            
        /* deprecated */
        
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
                    
                    if (KellyEDispetcher.api.runtime.lastError) {
                       
                        response.error = KellyEDispetcher.api.runtime.lastError.message;
                    }
                    
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
                
                 // can be undefined in firefox --- https://bugzilla.mozilla.org/show_bug.cgi?id=1385832                    
                if (typeof KellyEDispetcher.api.storage.local.getBytesInUse == 'undefined') {
                                       
                    KellyEDispetcher.api.storage.local.get(request.dbName, function(dbs) {
                           
                        if (typeof dbs[request.dbName] != 'undefined') response.bytes = JSON.stringify(dbs[request.dbName]).length;
                        if (callback) callback(response);
                    });
                    
                } else {
                    
                    KellyEDispetcher.api.storage.local.getBytesInUse(request.dbName, function(bytes){
                        
                        response.bytes = bytes;
                        if (callback) callback(response);                        
                    });
                }
                
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
            
        } else if (request.method == "getResources") {
            
                // request [method, items - names, type - css \ html \ js folder in env, asObject]
                
                var loaded = 0, answerData = {notice : '',  url : '' }, loadedData = {}, defaultItemData = {type : 'css', module : ''};
                if (!request.itemsRoute) request.itemsRoute = defaultItemData;
                // if (request.icon) answerData.icon = KellyTools.getBrowser().runtime.getURL(KellyEDispetcher.envDir + 'img/icon32x32.png');
                
                var onGetResource = function(url, data, notice) {
                                       
                    KellyTools.log('Load resource ' + (data === false ? '[FAIL]' : '[OK]') + ' ' + url + (data === false ? ' | Notice : ' + notice : ''), 'KellyEDispetcher');
                                         
                    for (var key in loadedData) {
                        if (url == loadedData[key].url) {
                            loadedData[key].data = data;
                            break;
                        }
                    }  
                    
                    loaded++; 
                    answerData.url += ',' + url;
                    answerData.notice += (data === false) ? ', ' + url + ' load failed [' + notice + ']' : '';
                    
                    if (callback && loaded == request.items.length) {
                        
                        if (!request.asObject) {
                            
                            answerData.loadedData = '';
                            
                            for (var i = 0; i < request.items.length; i++) {
                                answerData.loadedData += "\n\r\n\r\n\r" + '/* ' +  request.items[i] + ' */' + "\n\r\n\r\n\r" + loadedData[request.items[i]].data + "\n\r\n\r\n\r" + '/* ' +  request.items[i] + ' end */' + "\n\r\n\r\n\r";
                            }
                            
                        } else answerData.loadedData = loadedData;
                        
                        callback({method : 'getResources', error : answerData.notice, data : answerData});
                    }
                }
                 
                var	onFail = function(url, errorCode, errorText) {
                    onGetResource(url, false, 'code : ' + errorCode + ' | ' + errorText); // perhaps bad idea combine different types \ need to check errorCode typeof
                }
                
                var onSuccess = function(data, url) { 
                    if (!data) data = false;
                    onGetResource(url, data, data === false ? 'empty data file' : 'ok'); 
                }
                
                for (var i = 0; i < request.items.length; i++) {
                    
                    /* 
                        items : ['core', 'single', 'recorderDownloader', 'recorder-filters', 'coreMobile', 'singleMobile'], 
                        itemData : {
                            'recorder-filters' : {module : 'recorder', type : 'html'},
                        }
                        
                        by default anything is css source 
                    */
                    
                    var itemRoute = request.itemsRoute.type ? request.itemsRoute : request.itemData[request.items[i]];
                    if (!itemRoute) itemRoute = defaultItemData;
                    
                    itemRoute.resultPath = itemRoute.module ? itemRoute.module + '/' : '';
                    itemRoute.resultPath += itemRoute.name ? itemRoute.name : request.items[i];
                    itemRoute.resultPath = KellyTools.validateFolderPath(KellyEDispetcher.envDir + itemRoute.type + '/' + itemRoute.resultPath + '.' + itemRoute.type);
                
                    loadedData[request.items[i]] = {url : KellyTools.getBrowser().runtime.getURL(itemRoute.resultPath), data : false};
                    
                    if (!loadedData[request.items[i]].url) {
                        onFail('unknown_' + request.items[i], false, 'unexist [' + request.type + '] file. Check manifest permissions for type and filename ' + request.items[i]);
                    } else {
                        
                        KellyTools.fetchRequest(loadedData[request.items[i]].url, { responseType : 'text' }, function(url, responseData, responseStatusCode, error, fetchRequest) {
                            if (responseData && !error) onSuccess(responseData, url); // "text/css"
                            else onFail(url, responseStatusCode, error);
                        }); 
                    }
                }
                
                return true; // async mode
                
        } else if (request.method == 'alarm') {
            
            if (request.ms && request.name) {
                
                response.name = request.name;
                setTimeout(function() { callback(response); }, request.ms);
            }
            
        } else if (request.method == "getOpenTabData") {
            
            response.tabData = KellyEDispetcher.openTabData;
        
        } else if (request.method == 'openTab') {
            
            if (request.url) {
                
                if (request.tabData) KellyEDispetcher.openTabData = request.tabData;
                
                KellyTools.getBrowser().tabs.create({url: request.url}, function(tab){
                    response.opened = true;
                    if (callback) callback(response);
                });
                
                
                return true; // async mode
            }
            
        } else {
            
            // addition events - can be implemented in separate files
            
            if (KellyEDispetcher.callEvent('onMessage', {response : response, request : request, sender : sender, callback : callback})) return;
        }
        
        if (callback) callback(response);        
    }
    
    KellyEDispetcher.callEvent = function(name, data) {
        
        var preventDefault = false;
        for (var i = 0; i < KellyEDispetcher.events.length; i++) {
            if (KellyEDispetcher.events[i][name] && KellyEDispetcher.events[i][name](KellyEDispetcher, data)) preventDefault = true;
        }
        
        return preventDefault;
    } 
    
    KellyEDispetcher.onTabConnect = function(port) {
        
        var tabData = false, reconect = false;
        
        // addition events - can be implemented in separate files
        
        if (KellyEDispetcher.callEvent('onTabConnect', {port : port})) return;
        
        KellyTools.log('[Downloader] CONNECTED | Tab : ' + port.sender.tab.id, 'KellyEDispetcher');
        
        // Check is extension from front was already connected before, happen in some cases in manifest v2 too (ex. after basic auth dialog shows + tab reload)
        
        for (var i = 0; i < KellyEDispetcher.downloaderTabs.length; i++) { 
            if (KellyEDispetcher.downloaderTabs[i].id == port.sender.tab.id) {
                KellyTools.log('[Downloader] CONNECTED | Notice : Tab was already connected : reset connection', 'KellyEDispetcher');
                reconect = true;
                tabData = KellyEDispetcher.downloaderTabs[i]; 
                tabData.closePort();
                tabData.port = port;
                break;
            }
        }
        
        var onTabMessage = function(request) {
            
            if (KellyEDispetcher.callEvent('onTabMessage', {tabData : tabData})) return;
        
            if (request.method == 'registerDownloader') {
                
                tabData.resetEvents(); 

                if (!request.disable) {
                    
                    tabData.eventsEnabled = true;
                    tabData.referrer = request.referrer;
                    tabData.types = request.types;
                    tabData.hostList = request.hostList;
                    tabData.browser = request.browser;
                    
                    if (request.urlMap) tabData.urlMap = request.urlMap;
                                        
                    KellyEDispetcher.addRequestListeners(tabData);
                }
                
                KellyTools.log('[registerDownloader][EVENTS-REGISTERED-OK]', 'KellyEDispetcher [PORT]');
                tabData.port.postMessage({method : 'registerDownloader', message: request.disable ? "disabled" : "registered"});
                
            } else if (request.method == 'setDebugMode') {
            
                KellyTools.DEBUG = request.state;
                KellyTools.log('[DEBUG MODE] ' + (KellyTools.DEBUG ? 'TRUE' : 'FALSE'), 'KellyEDispetcher [PORT]');
                tabData.port.postMessage({method : 'setDebugMode', message: "ok"});
                
            } else if (request.method == 'updateUrlMap') {
            
                if (request.urlMap) {
                    tabData.urlMap = request.urlMap;
                }
                
                tabData.port.postMessage({method : 'updateUrlMap', message: "ok"});
                
            }
        }
        
        if (tabData === false) {
            
            var tabData = {port : port, tab : port.sender.tab, id : port.sender.tab.id, eventsEnabled : false};
                tabData.resetEvents = function() {
                    
                    KellyTools.log('[registerDownloader][EVENTS-REGISTERED-RESET]', 'KellyEDispetcher [PORT]');
                    
                    tabData.eventsEnabled = false;
                    
                    try {
                        if (tabData.onBeforeSendHeaders) {
                            KellyTools.getBrowser().webRequest.onBeforeSendHeaders.removeListener(tabData.onBeforeSendHeaders);
                            tabData.onBeforeSendHeaders = false;
                        }
                        
                        if (tabData.onHeadersReceived) {
                            KellyTools.getBrowser().webRequest.onHeadersReceived.removeListener(tabData.onHeadersReceived);
                            tabData.onHeadersReceived = false;
                        } 
                    } catch (e) { 
                        KellyTools.log('FAIL to reset webRequest events', KellyTools.E_ERROR);
                    }
                    
                }    

                tabData.closePort = function() {
                    tabData.port.onMessage.removeListener(onTabMessage);
                    tabData.port.disconnect();
                }
        
            KellyEDispetcher.downloaderTabs.push(tabData);
            
        }
                
        port.postMessage({method : 'onPortCreate', message : "connected", isDownloadSupported : KellyEDispetcher.isDownloadSupported()});
        port.onMessage.addListener(onTabMessage);
        port.onDisconnect.addListener(function(p){
            
            KellyTools.log('DISCONECTED | Reason : ' + (p.error ? p.error : 'Close tab'), 'KellyEDispetcher [PORT]');
            tabData.resetEvents();
            
            if (KellyEDispetcher.downloaderTabs.indexOf(tabData) != -1) KellyEDispetcher.downloaderTabs.splice(KellyEDispetcher.downloaderTabs.indexOf(tabData), 1);
        });
    }
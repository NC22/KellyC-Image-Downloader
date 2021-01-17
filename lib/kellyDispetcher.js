// part of KellyFavItems extension
// only background extensions has access to download API, so we create one

var KellyEDispetcher = new Object;
    KellyEDispetcher.eventsAccepted = false;
    KellyEDispetcher.envDir = 'env/';
    KellyEDispetcher.api = KellyTools.getBrowser();
    KellyEDispetcher.threads = [];
    KellyEDispetcher.downloaderTabs = []; 
    KellyEDispetcher.events = [];

    KellyEDispetcher.addRequestListeners = function(tabData) {
         
         // when sets referer priority to .urlMap 
         // 
         // 1. search matches in urlMap array - return reffer 
         // 2. if urlMap is unset - check common referrer + mimeType
         
         var getRulesDataForUrl = function(url) {
        
            if (!tabData.urlMap) return false;
            
            for (var i = 0; i < tabData.urlMap.length; i++) {
                if (tabData.urlMap[i][0].indexOf(url) != -1) return tabData.urlMap[i];
            }
                
            return false;
        }
        
        // if urlmap is not setted - accept only media data
        var isValidRequest = function(e) {
             
            if (!tabData.eventsEnabled) return false;
            
            var requestTabId = !e.tabId || e.tabId == -1 ? false : e.tabId; // unknown tabid - bug in content-script
            if (requestTabId && requestTabId != tabData.id) return false;
           
            if (getRulesDataForUrl(e.url) === false) {
                
                if (!tabData.referrer) return false;
                var type = KellyTools.getMimeType(KellyTools.getUrlExt(e.url));
                if (type.indexOf('image') != -1 || type.indexOf('video') != -1) return true;
                
            } else return true;
            
            return false;
        }
        
        var modifyHeader = function(source, name, value) {
            var index = false, data = { name : name, value : value }, compareName = name.toLowerCase();
            for (var i = 0; i < source.length; ++i) {
                
                if (source[i].name.toLowerCase() == compareName) {                    
                    source[i] = data; index = i;                    
                    break;
                }
            }
           
           if (index == false) source.push(data);
           return source;
        }
        
        var getHeader = function(source, name) {
            name = name.toLowerCase();
            for (var i = 0; i < source.length; ++i) {
                if (source[i].name.toLowerCase() == name) {                    
                    return source[i].value;                    
                    break;
                }
            }
            
           return false;
        }
        
        if (!tabData.hostList || !tabData.hostList.length) {
            KellyTools.log('cant init webrequest events - hostlist is empty for tab [' + tabData.id + ']', 'KellyEDispetcher');
            return;
        }
        
        var matches = [];
        for (var i = 0; i < tabData.hostList.length; i++) {
            matches.push('*://' + tabData.hostList[i] + '/*');
            matches.push('*://*.' + tabData.hostList[i] + '/*');
        }
        
        var filter = {urls : matches}; 
        if (tabData.types) { 
            filter.types = tabData.types; // xmlhttprequest always, except options tab
        }
        
        if (tabData.browser != 'firefox') { // webRequests frome extension returns tabId = -1 for firefox for content-script events
            // todo : pay attention (limit by download items if not options page) \ send bug report
            filter.tabId = tabData.id;
        }
        
        // filter = {urls: ['<all_urls>']};
        
        var tryAddListener = function(name, callback, filter, permissions, extraHeaders) {
             try {
                var tmpPermissions = [];
                for (var i = 0; i < permissions.length; i++) if (KellyTools.val(permissions[i])) tmpPermissions.push(KellyTools.val(permissions[i]));
                if (extraHeaders) tmpPermissions.push('extraHeaders'); // some browsers not support this enum value
                KellyTools.getBrowser().webRequest[name].addListener(callback, filter, tmpPermissions);
            } catch (e) {                
                KellyTools.log(tmpPermissions, 'KellyEDispetcher');
                KellyTools.log('cant init event listener. Error : ' + e + (extraHeaders ? ' RE-ATTEMPT with extraHeaders OFF' : ''), 'KellyEDispetcher');
                if (extraHeaders) tryAddListener(name, callback, filter, permissions, false);
                return false;
            }
        }        
        
        if (tabData.referrer || tabData.urlMap) {
            
            tabData.onBeforeRequest = function(e) {
                               
                if (!isValidRequest(e)) return;
                
                var referrer = getRulesDataForUrl(e.url);
                    referrer = referrer !== false ? referrer[1] : tabData.referrer;  

                // KellyTools.log(e.url + ' | ' + referrer);
                
                if (referrer) {
                    
                    modifyHeader(e.requestHeaders, 'cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
                    modifyHeader(e.requestHeaders, 'cache-control', 'max-age=0');
                    modifyHeader(e.requestHeaders, 'expires', '0');
                    modifyHeader(e.requestHeaders, 'expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
                    modifyHeader(e.requestHeaders, 'pragma', 'no-cache');
                    modifyHeader(e.requestHeaders, "Referer", referrer);
                    
                    var origin = getHeader(e.requestHeaders, 'Origin');
                    if (origin && origin.indexOf('http') == -1) {
                        modifyHeader(e.requestHeaders, "Origin", referrer);
                    }
                    
                }
                
                return {requestHeaders: e.requestHeaders};
            }
          
            tryAddListener('onBeforeSendHeaders', tabData.onBeforeRequest, filter, ['requestHeaders', 'blocking'], true);            
        }
        
        if (tabData.cors) {    

            tabData.onHeadersReceived = function(e) {  
                
                   if (!isValidRequest(e)) return; // check by statusCode ? 
                   
                   if (tabData.urlMap && e.statusCode == 301) { // extend url map list with redirect links for use in (onBeforeRequest | onHeadersReceived) on new request
                       var referrer = getRulesDataForUrl(e.url);
                       if (referrer !== false) tabData.urlMap.push([getHeader(e.responseHeaders, 'location'), referrer[1]]);
                   }
                   
                   // Mixed Content - fetch [https] request get response with [http] redirect - force attempt to load throw https
                   
                   if (tabData.referrer && e.type == "xmlhttprequest" && e.statusCode == 301 && tabData.referrer.indexOf('https') != -1) {
                       var responseRedirect = getHeader(e.responseHeaders, 'location');
                       if (responseRedirect !== false && responseRedirect.indexOf('http://') != -1) {
                           responseRedirect = responseRedirect.replace('http://', 'https://');
                           if (responseRedirect != e.url) modifyHeader(e.responseHeaders, "location",  responseRedirect);
                       }
                   }
                   
                   // prevent CORS limitations 
                   
                   modifyHeader(e.responseHeaders, "Access-Control-Allow-Origin",  "*" );  
                   
                   return {responseHeaders: e.responseHeaders};
                }
            
            tryAddListener('onHeadersReceived', tabData.onHeadersReceived, filter, ['responseHeaders', 'blocking'], true);               
        }
        
        tabData.eventsEnabled = true;
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
    
    KellyEDispetcher.blobData = {};
    
    KellyEDispetcher.isDownloadSupported = function() {
    
        if (!KellyEDispetcher.api || typeof KellyEDispetcher.api.downloads == 'undefined') {
            return false;
        }
        
        return true;
    }
    
    KellyEDispetcher.init = function() {
    
        if (this.eventsAccepted) return true;
        
        this.api.runtime.onMessage.addListener(this.onMessage);    
        this.api.runtime.onConnect.addListener(this.onDownloaderConnect);

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
               
            if (typeof request.download.url == 'object') { // base64 \ blob
                
                KellyTools.log('Data recieved | data type ' + request.download.url.type , 'KellyEDispetcher'); 
                if (request.download.url.base64) {
                    
                    var blob = KellyTools.base64toBlob(request.download.url.base64, request.download.url.type);                    
                    delete request.download.url.base64;
                    
                    request.download.url = URL.createObjectURL(blob);
                } else request.download.url = request.download.url.blob;
                
                saveDownloadedBlobData();
                
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
            
            if (typeof localStorage != 'undefined' && !localStorage.length && request.dbName) {
                response.item = localStorage.getItem(request.dbName);
            } else response.item = false;
        
        /* deprecated */
        
        } else if (request.method == "removeLocalStorageItem") {
            
            if (typeof localStorage != 'undefined' && !localStorage.length && request.dbName) {
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
            
                var loaded = 0, answerData = {css : '', notice : '',  url : '' }, loadedCss = {};
                // if (request.icon) answerData.icon = KellyTools.getBrowser().runtime.getURL(KellyEDispetcher.envDir + 'img/icon32x32.png');
                
                var onGetResource = function(url, data, notice) {
                                       
                    KellyTools.log('Load resource ' + (data === false ? '[FAIL]' : '[OK]') + ' ' + url + (data === false ? ' | Notice : ' + notice : ''), 'KellyEDispetcher');
                                         
                    for (var key in loadedCss) {
                        if (url == loadedCss[key].url) {
                            loadedCss[key].data = data;
                            break;
                        }
                    }  
                    
                    loaded++; 
                    answerData.url += ',' + url;
                    answerData.notice += (data === false) ? ', ' + url + ' load failed [' + notice + ']' : '';
                    
                    if (callback && loaded == request.items.length) {
                        
                        for (var i = 0; i < request.items.length; i++) {
                            answerData.css += "\n\r\n\r\n\r" + '/* ' +  request.items[i] + ' */' + "\n\r\n\r\n\r" + loadedCss[request.items[i]].data + "\n\r\n\r\n\r" + '/* ' +  request.items[i] + ' end */' + "\n\r\n\r\n\r";
                        }
                        
                        callback({method : 'getResources', error : answerData.notice, data : answerData});
                    }
                }
                 
                var	onFail = function(url, errorCode, errorText) {
                    onGetResource(url, false, 'code : ' + errorCode + ' | ' +errorText); // perhaps bad idea combine different types \ need to check errorCode typeof
                }
                
                var onSuccess = function(data, url) { 
                    if (!data) data = false;
                    onGetResource(url, data, data === false ? 'empty data file' : 'ok'); 
                }
                
                for (var i = 0; i < request.items.length; i++) {
                    
                    loadedCss[request.items[i]] = {url : KellyTools.getBrowser().runtime.getURL(KellyEDispetcher.envDir + 'css/' + request.items[i] + '.css'), data : false};
                    
                    if (!loadedCss[request.items[i]].url) {
                        onFail('unknown_' + request.items[i], false, 'unexist css file ' + request.items[i]);
                    } else {
                        
                        KellyTools.fetchRequest(loadedCss[request.items[i]].url, { responseType : 'text' }, function(url, responseData, responseStatusCode, error, fetchRequest) {
                            if (responseData && !error) onSuccess(responseData, url); // "text/css"
                            else onFail(url, responseStatusCode, error);
                        }); 
                    }
                }
                
                return true;
                
        } else if (request.method == 'alarm') {
            
            if (request.ms && request.name) {
                
                response.name = request.name;
                setTimeout(function() { callback(response); }, request.ms);
            }            
        } else {
            for (var i = 0; i < KellyEDispetcher.events.length; i++) {
                if (KellyEDispetcher.events[i].onMessage && KellyEDispetcher.events[i].onMessage(KellyEDispetcher, response, request, sender, callback)) return;
            }
        }
        
        if (callback) callback(response);        
    }
    
    KellyEDispetcher.onDownloaderConnect = function(port) {
        
        KellyTools.log('[Downloader] CONNECTED | Tab : ' + port.sender.tab.id, 'KellyEDispetcher');
        for (var i = 0; i < KellyEDispetcher.downloaderTabs.length; i++) {
            if (KellyEDispetcher.downloaderTabs[i].id == port.sender.tab.id) {
                KellyTools.log('[Downloader] CONNECTED | Error : already connected', 'KellyEDispetcher');
                return;
            }
        }
        
        var tabData = {port : port, tab : port.sender.tab, id : port.sender.tab.id};
        KellyEDispetcher.downloaderTabs.push(tabData);
    
        var resetEvents = function() {
            tabData.eventsEnabled = false;
            
            try {
                if (tabData.onBeforeRequest) {
                    KellyTools.getBrowser().webRequest.onBeforeRequest.removeListener(tabData.onBeforeRequest);
                    tabData.onBeforeRequest = false;
                }
                
                if (tabData.onHeadersReceived) {
                    KellyTools.getBrowser().webRequest.onHeadersReceived.removeListener(tabData.onHeadersReceived);
                    tabData.onHeadersReceived = false;
                } 
            } catch (e) { 
                KellyTools.log('FAIL to reset webRequest events', KellyTools.E_ERROR);
            }
            
        }
        
        var onDownloaderMessage = function(request) {
            
            if (request.method == 'registerDownloader') {
                
                resetEvents(); 

                if (!request.disable) {
                    tabData.cors = request.cors;
                    tabData.referrer = request.referrer;
                    tabData.types = request.types;
                    tabData.hostList = request.hostList;
                    if (request.urlMap) tabData.urlMap = request.urlMap;
                    
                    KellyEDispetcher.addRequestListeners(tabData);
                }
                
                KellyTools.log('Update registerDownloader request modifiers', 'KellyEDispetcher [PORT]');
                port.postMessage({method : 'registerDownloader', message: request.disable ? "disabled" : "registered"});
                
            } else if (request.method == 'setDebugMode') {
            
                KellyTools.DEBUG = request.state;
                KellyTools.log('Tab loaded in debug mode, switch background process debug mode to ' + (KellyTools.DEBUG ? 'TRUE' : 'FALSE'), 'KellyEDispetcher [PORT]');
                port.postMessage({method : 'setDebugMode', message: "ok"});
                
            } else if (request.method == 'updateUrlMap') {
            
                if (request.urlMap) {
                    tabData.urlMap = request.urlMap;
                }
                
                port.postMessage({method : 'updateUrlMap', message: "ok"});
                
            }
        }
        
        port.postMessage({method : 'onPortCreate', message : "connected", isDownloadSupported : KellyEDispetcher.isDownloadSupported()});
        port.onMessage.addListener(onDownloaderMessage);
        port.onDisconnect.addListener(function(p){
            
            KellyTools.log('DISCONECTED | Reason : ' + (p.error ? p.error : 'Close tab'), 'KellyEDispetcher [PORT]');
            resetEvents();
            
            if (KellyEDispetcher.downloaderTabs.indexOf(tabData) != -1) KellyEDispetcher.downloaderTabs.splice(KellyEDispetcher.downloaderTabs.indexOf(tabData), 1);
        });
    }
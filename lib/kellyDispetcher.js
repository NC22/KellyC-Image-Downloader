// only background extensions has access to download API, so we create one
// todo рассылать onChanged при обновлении данных если открыто несколько вкладок

// KellyTools.getBrowser().downloads - не поддерживается Edge

var KellyEDispetcher = new Object;
    KellyEDispetcher.tabEvents = {};
    KellyEDispetcher.tabList = []; // all active tabs that request resources at list once
    
    KellyEDispetcher.eventsAccepted = false;
    KellyEDispetcher.debug = false;
    KellyEDispetcher.envDir = 'env/';
    KellyEDispetcher.api = KellyTools.getBrowser();
    
    // bg subscriptions to API
    KellyEDispetcher.initEvents = {
        onChanged : false,
    }
    
    KellyEDispetcher.isDownloadSupported = function() {
    
        if (!KellyEDispetcher.api || typeof KellyEDispetcher.api.downloads == 'undefined') {
            return false;
        }
        
        return true;
    }
    
    KellyEDispetcher.subscribeTab = function (tabId, event) {

        if (typeof this.tabEvents[event] == 'undefined') this.tabEvents[event] = [];

        if (this.tabEvents[event].indexOf(tabId) == -1) this.tabEvents[event].push(tabId);
        
        return tabId;
    }
    
    KellyEDispetcher.init = function() {
    
        if (this.eventsAccepted) return true;
        
        KellyTools.getBrowser().runtime.onMessage.addListener(this.onMessage);
        this.eventsAccepted = true;
        
        return true;
    }
    
    KellyEDispetcher.onMessage = function(request, sender, callback) {
            
        if (KellyEDispetcher.debug) {
            console.log(request);    
            console.log(sender.tab ?
                        "from a content script:" + sender.tab.url :
                        "from the extension");
        }
        
        var response = {
            
            senderId : 'dispetcher',
            error : '',
            method : request.method,
            
        }
            
        if (request.method == 'downloads.cancel') {        
                    
            KellyTools.getBrowser().downloads.cancel(request.downloadId);
                    
        } else if (request.method == 'downloads.download') {
            
            response.downloadId = -1;
        
            KellyTools.getBrowser().downloads.download(request.download, function (downloadId) {
                
                response.downloadId = downloadId;
                
                if (!downloadId || downloadId < 0) {
                    response.downloadId = -1;
                }
                
                if (KellyEDispetcher.api.runtime.lastError) {                    
                    response.error = KellyEDispetcher.api.runtime.lastError.message;
                }
                
                if (callback) callback(response);
                
            });
            
            // unload url blob data data
            
            if (request.blob) {
                URL.revokeObjectURL(request.download.url);
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
                       
                        if (!result || !result.length) {
                            response.matchResults[response.matchResults.length] = {filename : filename};
                        } else {
                            response.matchResults[response.matchResults.length] = {filename : filename, match : result[0]};
                        }
                        
                        if (KellyEDispetcher.api.runtime.lastError) {						
                            response.error = KellyEDispetcher.api.runtime.lastError.message;
                        }
                        
                        if (response.matchResults.length == request.filenames.length && callback) {
                            callback(response);
                        }
                    }
                    
                    chrome.downloads.search({filenameRegex: regExp}, onSearchResult);
                }

                for (var i = 0; i < request.filenames.length; i++) {
                                        
                    var badExpression = false;
                    
                    // really can naebnutsya here
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
               
        } else if (request.method == "onChanged.keepAliveListener") {
        
            KellyEDispetcher.subscribeTab(sender.tab.id, 'onChanged');
            
            // alternative way if this will be bad
            // chrome.downloads.search({id : downloadId}, function(array of DownloadItem results) {...})
            
            if (!KellyEDispetcher.initEvents.onChanged) {
            
                KellyEDispetcher.initEvents.onChanged = function(downloadDelta) {
                                      
                        // send onChange message to all subscribed tabs 
                        
                        for (var i=0; i <= KellyEDispetcher.tabEvents['onChanged'].length-1; ++i) {
                            
                            KellyEDispetcher.api.tabs.sendMessage(KellyEDispetcher.tabEvents['onChanged'][i], {method: "onChanged", downloadDelta : downloadDelta}, function(response) {});
                        }
                    };
                
                KellyEDispetcher.api.downloads.onChanged.addListener(KellyEDispetcher.initEvents.onChanged );
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
            }
        
        } else if (request.method == "setApiStorageItem") {
            
            if (!request.data) {
            
                response.error = 'setApiStorageItem : Data is empty';
                if (callback) callback(response);
                
            } else {
            
                KellyEDispetcher.api.storage.local.set(request.data, function() {
                
                    if (KellyEDispetcher.api.runtime.lastError) {
                        response.error = KellyEDispetcher.api.runtime.lastError.message;
                    } else response.error = false;
                    
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
            
            var onGetResource = function(url, data, notice) {
                
                loaded++;
                
                answerData.url += ',' + url;
                if (notice) {
                    answerData.notice += ',' + notice;
                }
                
                if (data && data !== false) {
                        
                    answerData.css += "\n\r\n\r\n\r" + '/* ' +  url + ' */' + "\n\r\n\r\n\r";
                    answerData.css += data;
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
                
                if (KellyEDispetcher.debug) {
                    console.log(request.items[i]);
                }
                
                var css = KellyTools.getBrowser().runtime.getURL(KellyEDispetcher.envDir + 'css/' + request.items[i] + '.css');
       
                if (!css) {
                    onFail('unknown_' + request.items[i], false, 'unexist css file ' + request.items[i]);
                } else {
                
                    KellyTools.readUrl(css, onSuccess, onFail); 
                }
            }
            
           
            // identify requester, save for future notifications
            if (KellyEDispetcher.tabList.indexOf(sender.tab.id) == -1) {
                KellyEDispetcher.tabList.push(sender.tab.id);
            }
            
            return true; // async mode
            
        } else if (request.method == 'getProfile') {
            
            var	onFail = function(url, errorCode, errorText) {
            
                if (callback) {
                    
                    callback({
                        envText : false, 
                        profile : request.profile, 
                        error : 'load error',
                    });
                }
            }
            
            var onSuccess = function(data, url) {
                
                var environment = false;
                var error = '';
                
                if (callback) { 
                

                    callback({
                        envText : data, 
                        profile : request.profile, 
                        error : error,
                    });
                }
            }
            
            var profile = KellyTools.getBrowser().runtime.getURL(KellyEDispetcher.envDir + 'profiles/' + request.profile + '.js');
            KellyTools.readUrl(profile, onSuccess, onFail); 
            
            return true; // async mode
         
        /* deprecated */
        } else if (request.method == 'getLanguage') {
                        
            var	onFail = function(url, errorCode, errorText) {
                if (callback) {
                    
                    callback({
                        languageData : false, 
                        language : request.language, 
                        error : 'load error',
                    });
                }
            }
            
            var onSuccess = function(data, url) {
                var error = '';
                
                if (callback) { 
                
                    callback({
                        languageData : data, 
                        language : request.language, 
                        error : error,
                    });
                }
            }
            
            var language = KellyTools.getBrowser().runtime.getURL(KellyEDispetcher.envDir + 'loc/' + request.language + '.js');
            
            KellyTools.readUrl(language, onSuccess, onFail); 
            
            return true; // async mode
        }
        
        if (callback) callback(response);
        
    }
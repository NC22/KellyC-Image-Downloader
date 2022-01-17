// compatibility \ testing for manifest v3

// createObjectURL - dosnt work from background (window - is undefined), so base64 transport method is impossible to implement
// downloader.download - api - crashs browser if you try to download blob - tested on 88.0.4324.96 chrome

// check rules acception - some passed only after page reload. check difference between dinamic rules and session rules
// CONNECTED  Error  already connected - check tab disconnect
// todo - keep alive

var KellyEDispetcherDR = {
    declaredRulesId : 1000,
};

KellyEDispetcherDR.init = function() {
    
    if (KellyTools.getManifestVersion() > 2) {
        
        KellyEDispetcher.api.declarativeNetRequest.getSessionRules(function(rules) {
            
              if (KellyTools.getBrowser().runtime.lastError) {                
                    KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest'); 
                    return;
              }
                
              if (rules.length > 0) {
                    for (var i = 0; i < rules.length; i++) {
                         if (KellyEDispetcherDR.declaredRulesId < rules[i].id) {
                             KellyEDispetcherDR.declaredRulesId = rules[i].id + 1;
                         }
                    }
              }
        });
        
        KellyEDispetcher.events.push({onTabConnect : KellyEDispetcherDR.onTabConnect});
    }
}

KellyEDispetcherDR.cleanupSessionRulesForTab = function(tabId) {
            
     KellyEDispetcher.api.declarativeNetRequest.getSessionRules(function(rules) {
          
          if (KellyTools.getBrowser().runtime.lastError) {                
                KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest'); 
                return;
          }
            
          if (rules.length > 0) {
                var ids = [];
                for (var i = 0; i < rules.length; i++) {                    
                    if (rules[i].condition.tabIds && rules[i].condition.tabIds.indexOf(tabId) !== -1) {
                        ids.push(rules[i].id);
                    }
                }
                
                KellyEDispetcher.api.declarativeNetRequest.updateSessionRules({addRules : [], removeRuleIds : ids}, function() {
                    
                    KellyTools.log('[TabId : ' + tabId + '] Cleanup session rules : ' + ids.length,  'KellyEDispetcher | declarativeNetRequest'); 
                    
                    if (KellyTools.getBrowser().runtime.lastError) {                
                        KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest'); 
                        return;
                    }
               });
          }
    });
}

/*
    tabData request rules described in kellyDispetcher
*/
    
KellyEDispetcherDR.addRequestListeners = function(tabData, onRegistered) {
    
    tabData.declaredRules = [];
     
    var addRule = function(params) {
       
       var responseHeaders = [
            { "header" : "Access-Control-Allow-Origin", "operation" : "set", "value": "*" },  
            
            { "header" : "Pragma-directive", "operation" : "set", "value": "no-cache" },             
            { "header" : "Cache-directive", "operation" : "set", "value": "no-cache" }, 
            { "header" : "Cache-control", "operation" : "set", "value": "no-cache" }, 
            { "header" : "Pragma", "operation" : "set", "value": "no-cache" },
            { "header" : "Expires", "operation" : "set", "value": "0" }, 
        ];
        
        if (typeof params.additionResponseHeaders != 'undefined') {
            for (var key in params.additionResponseHeaders) {
                responseHeaders.push({"header" : key, "operation" : "set", "value" : params.additionResponseHeaders[key]});
            }
        }
        
        var requestHeaders = [
            { "header" : "cache-control", "operation" : "set", "value" : "no-cache, must-revalidate, post-check=0, pre-check=0" },
            { "header" : "pragma", "operation" : "set",  "value" : 'no-cache' },
            { "header" : "Referer", "operation" : "set", "value" : params.referrer },    
        ];

        if (typeof params.additionRequestHeaders != 'undefined') {
            for (var key in params.additionRequestHeaders) {
                requestHeaders.push({"header" : key, "operation" : "set", "value" : params.additionRequestHeaders[key]});
            }
        }
        
        if (typeof params.matches == "string") {
            params.matches = [params.matches];
        }
        
        for (var i = 0; i < params.matches.length; i++) {
            
           KellyEDispetcherDR.declaredRulesId++;
           
           tabData.declaredRules.push({
                "id" : KellyEDispetcherDR.declaredRulesId, // tabData.declaredRules.length + 1,
                "action": {
                    "type" : "modifyHeaders",
                    "requestHeaders" : requestHeaders,
                    "responseHeaders" : responseHeaders,
                },
                "condition": { 
                    "urlFilter" : params.matches[i], 
                    "resourceTypes" : tabData.types ? tabData.types : ['main_frame', 'image', 'xmlhttprequest', 'media'],
                    "tabIds" : [tabData.id],
                },
                "priority" : 1,
           }); 
       }
    }
     
    if (tabData.referrer) {
        addRule({matches : KellyTools.getHostlistMatches(tabData.hostList, true), referrer : tabData.referrer});
    } 
    
    if (tabData.urlMap) {
        for (var i = 0; i < tabData.urlMap.length; i++) {
            addRule({
                matches : tabData.urlMap[i][0], 
                referrer : tabData.urlMap[i][1], 
                additionRequestHeaders : tabData.urlMap[i][2], 
                additionResponseHeaders : tabData.urlMap[i][3],
            });
        }  
    }
        
    KellyTools.getBrowser().declarativeNetRequest.updateSessionRules({addRules : tabData.declaredRules, removeRuleIds : []}, function() {
        
        if (KellyTools.getBrowser().runtime.lastError) {                
            KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest');         
        }
        
        onRegistered();
    });
    
    tabData.eventsEnabled = true;
}

KellyEDispetcherDR.onTabConnect = function(self, data) {
    
    var port = data.port;
    var tabData = false;
    
    KellyTools.log('[Downloader] CONNECTED  Tab  ' + port.sender.tab.id, 'KellyEDispetcher | declarativeNetRequest');
    for (var i = 0; i < KellyEDispetcher.downloaderTabs.length; i++) {
        if (KellyEDispetcher.downloaderTabs[i].id == port.sender.tab.id) {
            KellyTools.log('[Downloader] already connected : reset connection, change port', 'KellyEDispetcher | declarativeNetRequest');
            KellyEDispetcher.downloaderTabs[i].resetEvents();
            tabData = KellyEDispetcher.downloaderTabs[i];
            tabData.port = port;
            break;
        }
    } 
    
    if (tabData === false) {
        
        tabData = {port : port, tab : port.sender.tab, id : port.sender.tab.id, declaredRules : []};
        tabData.resetEvents = function() {
            tabData.eventsEnabled = false;
            
            KellyEDispetcherDR.cleanupSessionRulesForTab(tabData.id);
            tabData.declaredRules = [];
        }
    
        KellyEDispetcher.downloaderTabs.push(tabData);
    }
    
    var onDownloaderMessage = function(request) {
        
       var response = {
           notice : false,
           message : 'ok',
           method : request.method,
           ready : function() {
                if (response.notice) KellyTools.log(response.notice, 'KellyEDispetcher [PORT]');
                port.postMessage({method : response.method, message : response.message});        
           }
       }
       
       if (request.method == 'registerDownloader') {
            
            tabData.resetEvents(); 
            response.notice = 'Update registerDownloader request modifiers';
            response.message = request.disable ? "disabled" : "registered";
            
            if (!request.disable) {
                tabData.referrer = request.referrer;
                tabData.types = request.types;
                tabData.hostList = request.hostList;
                if (request.urlMap) tabData.urlMap = request.urlMap;
                
                KellyEDispetcherDR.addRequestListeners(tabData, response.ready);
            } else response.ready();
            
       } else if (request.method == 'setDebugMode') {
        
            KellyTools.DEBUG = request.state;
            response.notice = 'Tab loaded in debug mode, switch background process debug mode to ' + (KellyTools.DEBUG ? 'TRUE' : 'FALSE');
            response.ready();
            
        } else if (request.method == 'updateUrlMap') {
            
            if (!tabData.eventsEnabled) {
                response.message = "tab not registered";
                response.ready();
                return;
            }
            
            if (request.urlMap) {
                tabData.urlMap = request.urlMap;
            }
                        
            tabData.resetEvents(); 
            KellyEDispetcherDR.addRequestListeners(tabData, response.ready);
        }
    }
    
    port.postMessage({method : 'onPortCreate', message : 'connected', isDownloadSupported : KellyEDispetcher.isDownloadSupported()});
    port.onMessage.addListener(onDownloaderMessage);
    port.onDisconnect.addListener(function(p){
        
        KellyTools.log('DISCONECTED  Reason  ' + (p.error ? p.error : 'Close tab'), 'KellyEDispetcher [PORT]');
        tabData.resetEvents();
        
        if (KellyEDispetcher.downloaderTabs.indexOf(tabData) != -1) KellyEDispetcher.downloaderTabs.splice(KellyEDispetcher.downloaderTabs.indexOf(tabData), 1);
    });
    
    return true;
}

KellyEDispetcherDR.init();
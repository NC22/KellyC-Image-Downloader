// compatibility \ testing for manifest v3

// createObjectURL - dosnt work from background (window - is undefined), so base64 transport method is impossible to implement
// downloader.download - api - crashs browser if you try to download blob - tested on 88.0.4324.96 chrome

KellyEDispetcher.declaredRulesId = 1000;

/*

    tabData request rules described in kellyDispetcher
    
*/
    
KellyEDispetcher.addRequestListenersDR = function(tabData) {
    
    tabData.declaredRules = [];
     
    var addRule = function(params) {
       
       KellyEDispetcher.declaredRulesId++;
       
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

       tabData.declaredRules.push({
            "id" : KellyEDispetcher.declaredRulesId, // tabData.declaredRules.length + 1,
            "action": {
                "type" : "modifyHeaders",
                "requestHeaders" : requestHeaders,
                "responseHeaders" : responseHeaders,
            },
            "condition": { 
                "urlFilter" : params.matches, 
                "resourceTypes" : tabData.types ? tabData.types : ['main_frame', 'image', 'xmlhttprequest', 'media'],
                "tabId" : tabData.id,
            },
            "priority" : 1,
       }); 
    }
     
    if (tabData.referrer) {
        // untested
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
        
    KellyTools.getBrowser().declarativeNetRequest.updateDynamicRules({addRules : tabData.declaredRules, removeRuleIds : []}, function() {
        
        // todo - add callback - on registered
        
        if (KellyTools.getBrowser().runtime.lastError) {                
            KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest');
            return;    
        }
    });
    
    tabData.eventsEnabled = true;
}

KellyEDispetcher.onDownloaderConnectDR = function(port) {
    
    KellyTools.log('[Downloader] CONNECTED  Tab  ' + port.sender.tab.id, 'KellyEDispetcher | declarativeNetRequest');
    for (var i = 0; i < KellyEDispetcher.downloaderTabs.length; i++) {
        if (KellyEDispetcher.downloaderTabs[i].id == port.sender.tab.id) {
            KellyTools.log('[Downloader] CONNECTED  Error  already connected', 'KellyEDispetcher | declarativeNetRequest');
            return;
        }
    }
    
    var tabData = {port : port, tab : port.sender.tab, id : port.sender.tab.id, declaredRules : []};
    KellyEDispetcher.downloaderTabs.push(tabData);
    
    var resetEvents = function() {
        tabData.eventsEnabled = false;
        
        var ruleIds = [];
        tabData.declaredRules.forEach(function(rule) {
            ruleIds.push(rule.id);
        });
        
        KellyTools.getBrowser().declarativeNetRequest.updateDynamicRules({addRules : [], removeRuleIds : ruleIds});
    }
    
    var onDownloaderMessage = function(request) {
        
       if (request.method == 'registerDownloader') {
            
            resetEvents(); 

            if (!request.disable) {
                tabData.referrer = request.referrer;
                tabData.types = request.types;
                tabData.hostList = request.hostList;
                if (request.urlMap) tabData.urlMap = request.urlMap;
                
                KellyEDispetcher.addRequestListenersDR(tabData);
            }
            
            KellyTools.log('Update registerDownloader request modifiers', 'KellyEDispetcher [PORT]');
            port.postMessage({method : 'registerDownloader', message : request.disable ? "disabled" : "registered"});
            
       } else if (request.method == 'setDebugMode') {
        
            KellyTools.DEBUG = request.state;
            KellyTools.log('Tab loaded in debug mode, switch background process debug mode to ' + (KellyTools.DEBUG ? 'TRUE' : 'FALSE'), 'KellyEDispetcher [PORT]');
            port.postMessage({method : 'setDebugMode', message : "ok"});
            
        } else if (request.method == 'updateUrlMap') {
            if (!tabData.eventsEnabled) {               
                port.postMessage({method : 'updateUrlMap', message : "tab not registered"});
                return;
            }
            
            if (request.urlMap) {
                tabData.urlMap = request.urlMap;
            }
                        
            resetEvents(); 
            KellyEDispetcher.addRequestListenersDR(tabData);
            
            // todo - redeclare rules
            port.postMessage({method : 'updateUrlMap', message : "ok"});
            
        }
    }
    
    port.postMessage({method : 'onPortCreate', message : 'connected', isDownloadSupported : KellyEDispetcher.isDownloadSupported()});
    port.onMessage.addListener(onDownloaderMessage);
    port.onDisconnect.addListener(function(p){
        
        KellyTools.log('DISCONECTED  Reason  ' + (p.error ? p.error : 'Close tab'), 'KellyEDispetcher [PORT]');
        resetEvents();
        
        if (KellyEDispetcher.downloaderTabs.indexOf(tabData) != -1) KellyEDispetcher.downloaderTabs.splice(KellyEDispetcher.downloaderTabs.indexOf(tabData), 1);
    });
}
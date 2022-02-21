// m.reactor.cc
// mobile version, for other subdomains enough urlMap keeped in joyreactor.js profile (dont needed to set dynamic allow origin there)
        
var KellyEDJRUnlocker = {
    
     defaultCfg : {
         webRequest : true,
         unlock : {censored : true},
     },
     
     cfgName : 'kelly_cfg_joyreactor_config',
     
     cfg : false,
};

KellyEDJRUnlocker.getInitiatorUrl = function(e) {
     
         if (typeof e.initiator != 'undefined') return e.initiator;
    else if (typeof e.documentUrl != 'undefined') return KellyTools.getLocationFromUrl(e.documentUrl).origin;
    else if (typeof e.originUrl != 'undefined') return KellyTools.getLocationFromUrl(e.originUrl).origin;
    else if (e.tabId == -1) return 'unknown-extension://unknown';
    else return 'default';
} 

KellyEDJRUnlocker.initDRequest = function() {
    
     // todo - make static list with constant ids below 1000, passed only once on init - check current rules by getSessionRules if not tye to host
     // currently apply rules only for port.sender.tab.url = m.reactor
     return; // need to fix origin before tests
    
     KellyEDJRUnlocker.declaredRules = [];
     KellyEDispetcher.events.push({onTabConnect : function(self, data) {
                    
            if (KellyEDJRUnlocker.enabled) return; 
            
            
            KellyEDJRUnlocker.enabled = true;
            KellyTools.log('Unlock active', 'KellyEDispetcher'); 
            
            var urlFilter = ['*://api.joyreactor.cc/graphql', '*://api.joyreactor.cc/graphql?unlocker=1'];
            var port = data.port;
            var getDefaultRule = function(url) {
                
                 KellyEDispetcherDR.declaredRulesId++;
                 
                 return {
                     
                    "id" : KellyEDispetcherDR.declaredRulesId,
                    
                    "action": {
                        "type" : "modifyHeaders",
                        "requestHeaders" : [
                            { "header": "Origin", "operation": "set", "value": 'https://api.joyreactor.cc' },                    
                        ],
                        "responseHeaders" : [
                             { "header": "Access-Control-Allow-Origin", "operation": "set", "value": KellyTools.getLocationFromUrl(port.sender.tab.url).origin}, 
                             { "header": "Access-Control-Allow-Credentials", "operation": "set", "value": "true" },
                             { "header": "Access-Control-Allow-Headers", "operation": "set", "value": "Content-Type" },
                        ],
                    },
                    
                    "condition": { 
                        "urlFilter" : url, 
                        "resourceTypes" : ['xmlhttprequest', 'other'],
                        "tabIds" : [port.sender.tab.id],
                    },
                    
                    "priority" : 1,
                    
                };                
            }
            
            for (var i = 0; i < urlFilter.length; i++) {
                KellyEDJRUnlocker.declaredRules.push(getDefaultRule(urlFilter[i]));
            }
                      
            KellyTools.getBrowser().declarativeNetRequest.updateSessionRules({addRules : KellyEDJRUnlocker.declaredRules, removeRuleIds : []}, function() {
                
                if (KellyTools.getBrowser().runtime.lastError) {                
                    KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest');
                    return;    
                }
            });
     }});
}

KellyEDJRUnlocker.initWebRequest = function() {
    
    if (KellyEDJRUnlocker.cfg.webRequest && KellyEDJRUnlocker.cfg.unlock && KellyEDJRUnlocker.cfg.unlock.censored) {                    
        
        KellyTools.log('Unlock active', 'KellyEDispetcher'); 
        
        var filter = {urls : ['*://api.joyreactor.cc/graphql', '*://api.joyreactor.cc/graphql?unlocker=1'], types : ['xmlhttprequest', 'other']}; // other - filter for old FFs
                        
        KellyTools.wRequestAddListener('onBeforeSendHeaders', function(e) {
            
            var url = KellyEDJRUnlocker.getInitiatorUrl(e);
            if (url.indexOf('://m.') == -1 && url.indexOf('-extension://') == -1) return;
            
            KellyTools.wRequestSetHeader(e.requestHeaders, "Origin", 'https://api.joyreactor.cc');
            
            KellyTools.log(e.url + ' [JOYREACTOR UNLOCKER] [Modify REQUEST HEADERS]');                    
            return {requestHeaders: e.requestHeaders};
            
        }, filter, ['requestHeaders', 'blocking'], true);         
        
        KellyTools.wRequestAddListener('onHeadersReceived', function(e) {
           
           var url = KellyEDJRUnlocker.getInitiatorUrl(e);
           if (url.indexOf('://m.') == -1 && url.indexOf('-extension://') == -1) return;
                     
           KellyTools.wRequestSetHeader(e.responseHeaders, "Access-Control-Allow-Origin", url);
           KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Credentials', "true");
           KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Headers', "Content-Type"); 
                           
           // console.log(e.responseHeaders)
           KellyTools.log(e.url + ' [JOYREACTOR UNLOCKER] [Modify RECEIVED HEADERS]');
           return {responseHeaders: e.responseHeaders};
            
        }, filter, ['responseHeaders', 'blocking'], true); 
    }
}

KellyEDJRUnlocker.init = function() {
    
    if (KellyEDJRUnlocker.enabled) return;
    var cfgName = KellyEDJRUnlocker.cfgName;
    KellyEDispetcher.api.storage.local.get(cfgName, function(item) {
    
        KellyEDJRUnlocker.cfg = item && item[cfgName] && item[cfgName]['coptions'] ? item[cfgName]['coptions'] : KellyEDJRUnlocker.defaultCfg;
        
        if (KellyTools.getManifestVersion() > 2) {
            KellyEDJRUnlocker.initDRequest();
        } else {
            KellyEDJRUnlocker.initWebRequest();
            KellyEDJRUnlocker.enabled = true;
        }
        
    });
};

KellyEDJRUnlocker.init();
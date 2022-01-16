// m.reactor.cc
  
KellyEDispetcher.initJRApiUnlocker = function() {
         
     var defaultCfg = {webRequest : true, unlock : {censored : true}}, cfgName = 'kelly_cfg_joyreactor_config';
     
     var getInitiatorUrl = function(e) {
         
              if (typeof e.initiator != 'undefined') return e.initiator;
         else if (typeof e.documentUrl != 'undefined') return KellyTools.getLocationFromUrl(e.documentUrl).origin;
         else if (typeof e.originUrl != 'undefined') return KellyTools.getLocationFromUrl(e.originUrl).origin;
         else if (e.tabId == -1) return 'unknown-extension://unknown';
         else return 'default';
     } 
     
    if (KellyEDispetcher.dRules) {
         
         KellyEDispetcher.declaredRules = [];
         KellyEDispetcher.events.push({onTabConnect : function(port) {
                         
            KellyEDispetcher.declaredRulesId++;
            var dRule = {
                "id" : KellyEDispetcher.declaredRulesId,
                "action": {
                    "type" : "modifyHeaders",
                    "requestHeaders" : [
                        { "header": "Origin", "operation": "set", "value": 'https://api.joyreactor.cc' },                    
                    ],
                    "responseHeaders" : [
                         { "header": "Access-Control-Allow-Origin", "operation": "set", "value": port.sender.tab.url }, 
                         { "header": "Access-Control-Allow-Credentials", "operation": "set", "value": "true" },
                         { "header": "Access-Control-Allow-Headers", "operation": "set", "value": "Content-Type" },
                    ],
                },
                "condition": { 
                    "urlFilter" : ['*://api.joyreactor.cc/graphql', '*://api.joyreactor.cc/graphql?unlocker=1'], 
                    "resourceTypes" : ['xmlhttprequest', 'other'],
                    "tabIds" : [port.sender.tab.id],
                },
                "priority" : 1,
            };
            
            KellyEDispetcher.declaredRules.push(dRule);            
            KellyTools.getBrowser().declarativeNetRequest.updateDynamicRules({addRules : [newRule], removeRuleIds : []}, function() {
                
                if (KellyTools.getBrowser().runtime.lastError) {                
                    KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest');
                    return;    
                }
            });
             
            
         }});
     
    } else {    
        
         // mobile version, urlMap keeped in joyreactor.js profile (dont needed to set dynamic allow origin there)
         
         KellyEDispetcher.api.storage.local.get(cfgName, function(item) {
            
            var cfg = item && item[cfgName] && item[cfgName]['coptions'] ? item[cfgName]['coptions'] : defaultCfg;
            if (cfg.webRequest && cfg.unlock && cfg.unlock.censored) {                    
                
                KellyTools.log('Unlock active', 'KellyEDispetcher'); 
                
                var filter = {urls : ['*://api.joyreactor.cc/graphql', '*://api.joyreactor.cc/graphql?unlocker=1'], types : ['xmlhttprequest', 'other']}; // other - filter for old FFs
                                
                KellyTools.wRequestAddListener('onBeforeSendHeaders', function(e) {
                    
                    var url = getInitiatorUrl(e);
                    if (url.indexOf('://m.') == -1 && url.indexOf('-extension://') == -1) return;
                    
                    KellyTools.wRequestSetHeader(e.requestHeaders, "Origin", 'https://api.joyreactor.cc');
                    
                    KellyTools.log(e.url + ' [JOYREACTOR UNLOCKER] [Modify REQUEST HEADERS]');                    
                    return {requestHeaders: e.requestHeaders};
                    
                }, filter, ['requestHeaders', 'blocking'], true);         
                
                KellyTools.wRequestAddListener('onHeadersReceived', function(e) {
                   
                   var url = getInitiatorUrl(e);
                   if (url.indexOf('://m.') == -1 && url.indexOf('-extension://') == -1) return;
                             
                   KellyTools.wRequestSetHeader(e.responseHeaders, "Access-Control-Allow-Origin", url);
                   KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Credentials', "true");
                   KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Headers', "Content-Type"); 
                                   
                   // console.log(e.responseHeaders)
                   KellyTools.log(e.url + ' [JOYREACTOR UNLOCKER] [Modify RECEIVED HEADERS]');
                   return {responseHeaders: e.responseHeaders};
                    
                }, filter, ['responseHeaders', 'blocking'], true); 
            }
            
        });   
    }
};

KellyEDispetcher.initJRApiUnlocker();
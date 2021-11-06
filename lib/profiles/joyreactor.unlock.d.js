// m.reactor.cc
  
KellyEDispetcher.initJRApiUnlocker = function() {
         
     var defaultCfg = {webRequest : true, unlock : {censored : true}}, cfgName = 'kelly_cfg_joyreactor_config';
     var getInitiatorUrl = function(e) {
         return typeof e.initiator != 'undefined' ? e.initiator : (typeof e.documentUrl != 'undefined' ? KellyTools.getLocationFromUrl(e.documentUrl).origin : 'default');
     } 
     
     KellyEDispetcher.api.storage.local.get(cfgName, function(item) {
        
        var cfg = item && item[cfgName] && item[cfgName]['coptions'] ? item[cfgName]['coptions'] : defaultCfg;
        if (cfg.webRequest && cfg.unlock && cfg.unlock.censored) {                    
            
            KellyTools.log('Unlock active', 'KellyEDispetcher'); 
            
            var filter = {urls : ['*://api.joyreactor.cc/graphql'], types : ['xmlhttprequest']}; 
                            
            KellyTools.wRequestAddListener('onBeforeSendHeaders', function(e) {
                
                var url = getInitiatorUrl(e);
                if (url.indexOf('://m.') == -1 && url.indexOf('-extension://') == -1) return;
                
                KellyTools.wRequestSetHeader(e.requestHeaders, "Origin", 'https://api.joyreactor.cc');
                
                return {requestHeaders: e.requestHeaders};
                
            }, filter, ['requestHeaders', 'blocking'], true);         
            
            KellyTools.wRequestAddListener('onHeadersReceived', function(e) {
               
               var url = getInitiatorUrl(e);
               if (url.indexOf('://m.') == -1 && url.indexOf('-extension://') == -1) return;
                         
               KellyTools.wRequestSetHeader(e.responseHeaders, "Access-Control-Allow-Origin", url);
               KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Credentials', "true");
               KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Headers', "Content-Type"); 
                               
               // console.log(e.responseHeaders)
               return {responseHeaders: e.responseHeaders};
                
            }, filter, ['responseHeaders', 'blocking'], true); 
        }
        
    });          
};

KellyEDispetcher.initJRApiUnlocker();
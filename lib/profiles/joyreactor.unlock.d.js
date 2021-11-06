// m.reactor.cc
  
KellyEDispetcher.initJRApiUnlocker = function() {
    
    var filter = {urls : ['*://api.joyreactor.cc/graphql'], types : ['xmlhttprequest']}; 
                    
    KellyTools.wRequestAddListener('onBeforeSendHeaders', function(e) {
        
        if (e.initiator.indexOf('://m.') == -1) return;
        
        KellyTools.wRequestSetHeader(e.requestHeaders, "Origin", 'https://api.joyreactor.cc');
        
        return {requestHeaders: e.requestHeaders};
        
    }, filter, ['requestHeaders', 'blocking'], true);         
    
    KellyTools.wRequestAddListener('onHeadersReceived', function(e) {
       
       if (e.initiator.indexOf('://m.') == -1) return;
                 
       KellyTools.wRequestSetHeader(e.responseHeaders, "Access-Control-Allow-Origin", e.initiator);
       KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Credentials', "true");
       KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Headers', "Content-Type"); 
                       
       // console.log(e.responseHeaders)
       return {responseHeaders: e.responseHeaders};
        
    }, filter, ['responseHeaders', 'blocking'], true);   
};

KellyEDispetcher.initJRApiUnlocker();
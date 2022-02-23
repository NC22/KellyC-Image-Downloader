// part of KellyFavItems extension
// hook for fetch requests. Used only in joyreactor profile

(function() {    
    
    var originalFetch = window.fetch;
    var requests = {}, requestIds = 1000;
    var waitFront = function(requestId, eventName, data) {
        
        window.postMessage({method : 'kelly_fetch_hook_event', eventName : eventName, requestId : requestId, eventDataIn : data}, "*"); 
                                  
        return new Promise(function(resolve) {
            requests[requestId]['wait' + eventName] = resolve;
        });
    }
    
    window.fetch = function(input, init){
                   
        requestIds++;                                                 
        requests[requestIds] = {}; 
        
        return waitFront(requestIds, 'onBeforeRequestReady', {}).then(function() {
            
            if (requests[requestIds]['onBeforeRequestReady'].requestInit) {
                input = requests[requestIds]['onBeforeRequestReady'].requestInput;
                init = requests[requestIds]['onBeforeRequestReady'].requestInit;
            }
            
            return originalFetch(input, init).then(function(response){
                
                return new Promise(function(resolve){ // reject for json parser?
                    
                    if (response.headers.get("Content-Type").indexOf('json') != -1) {
                        
                        response.clone().json().then(function(json){                        
                                     
                            return waitFront(requestIds, 'onRequestReady', {requestCfg : {body : init ? init.body : ''}, requestInput : input, responseJson : json, responseHeaders : Object.fromEntries(response.headers.entries())}).then(function() {
                                
                                if (requests[requestIds]['onRequestReady'].responseBody) {                                                                        
                                    if (requests[requestIds]['onRequestReady'].responseOptions) requests[requestIds]['onRequestReady'].responseOptions.headers = new Headers(requests[requestIds]['onRequestReady'].responseOptions.headers);
                                    resolve(new Response(requests[requestIds]['onRequestReady'].responseBody, requests[requestIds]['onRequestReady'].responseOptions));
                                } else resolve(response);
                
                            });
                                                
                        });
                        
                    } else resolve(response); 
                                      
                });
            });
        });
        
    };
    
    window.addEventListener('message', function(e) {
            if (!e.data || !e.data.method) return false;
            if (e.data.method == 'kelly_fetch_hook_event_complite') {
                
                console.log(e.data);
                
                requests[e.data.requestId][e.data.eventName] = e.data.eventDataOut ? e.data.eventDataOut : {};
                requests[e.data.requestId]['wait' + e.data.eventName]();
            }
    });            
}()); 
             
                    
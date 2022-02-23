
if (typeof K_FAV == 'undefined' || K_FAV === null) {
    
    // wait body element rendered 
    
    var onDOMRendered = function() {
        if (window.location.host.indexOf('top.joyreactor.cc') != -1 || window.location.host.indexOf('m.reactor.cc') != -1 || window.location.host.indexOf('m.joyreactor.cc') != -1 ) {
            
            K_FAV = new KellyFavItems({env : KellyProfileTopJoyreactor.getInstance(), location : window.location, allowMobile : true});
            KellyProfileTopJoyreactor.getInstance().initOnLoad(K_FAV.initFormatPage); // init hooks before joyreactor page, wait until joyreator page will load post list
            
        } else {
        
            K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : window.location});          
            K_FAV.load('cfg', function(fav) {
                
                if (fav.coptions.disabled) return;
                
                K_FAV.load('items', function() {
                    K_FAV.initFormatPage();
                    KellyTools.addEventPListener(window, "load", function() {
                        if (K_FAV.getGlobal('env').getMainContainers()) handler.formatPostContainers(); 
                    }, 'init_');                            
                }); 
            });
        }
        
        if (typeof bodyObserver != 'undefined') bodyObserver.disconnect(); 
    }
    
    if (document.body) { // "run_at": "document_idle"
        
        onDOMRendered();
        
    } else { // "run_at": "document_start"
  
        if (window.location.host.indexOf('top.joyreactor.cc') != -1 || window.location.host.indexOf('m.reactor.cc') != -1 || window.location.host.indexOf('m.joyreactor.cc') != -1 ) {
            
            var bodyObserver = new MutationObserver(function(mutations) {    
                 for (var i = 0; i < mutations.length; i++) {
                    if (KellyTools.searchNode(mutations[i].addedNodes, 'body')) return onDOMRendered();
                }                
            });   
        
            bodyObserver.observe(document.documentElement, {childList: true, subtree: true});  
        } else {
            document.addEventListener("DOMContentLoaded", onDOMRendered);
        }
    }
}

// keep empty space to prevent syntax errors if some symbols will added at end
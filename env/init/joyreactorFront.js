
if (typeof K_FAV == 'undefined' || K_FAV === null) {
    
    if (window.location.host.indexOf('top.joyreactor.cc') != -1 || window.location.host.indexOf('m.reactor.cc') != -1 || window.location.host.indexOf('m.joyreactor.cc') != -1 ) {
        
        KellyProfileTopJoyreactor.getInstance().initOnLoad(function() {
            K_FAV = new KellyFavItems({env : KellyProfileTopJoyreactor.getInstance(), location : window.location, allowMobile : true});
            if (!K_FAV.exec()) K_FAV = null;
        });
        
    } else {
        
        K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : window.location});
        if (!K_FAV.exec()) K_FAV = null;
    }
}

// keep empty space to prevent syntax errors if some symbols will added at end
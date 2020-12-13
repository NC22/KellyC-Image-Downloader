
if (typeof K_FAV == 'undefined') {
    
    if (window.location.host.indexOf('top.joyreactor.cc') != -1 ) {
        
        KellyProfileTopJoyreactor.getInstance().initOnLoad(function() {
            K_FAV = new KellyFavItems({env : KellyProfileTopJoyreactor.getInstance(), location : window.location});
            K_FAV.exec();
        });
        
    } else {
        
        K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : window.location});
        K_FAV.exec();
    }
}

// keep empty space to prevent syntax errors if some symbols will added at end
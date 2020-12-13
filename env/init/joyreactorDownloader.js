KellyOptionsPage = new Object();
KellyOptionsPage.env = false;
KellyOptionsPage.init = function() {
    
    window.K_FAV = false;
    document.title = KellyTools.getProgName();
    
    KellyTools.DEBUG = true;    
    K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : { href : 'http:' + '//' + 'joyreactor.cc' + '/', protocol : 'http:', host : 'joyreactor.cc'}});
    
    KellyOptionsPage.env = K_FAV.getGlobal('env');
    KellyOptionsPage.env.hostClass = 'options_page';    
    KellyOptionsPage.env.webRequestsRules.types = false;    

    var nativeOnExtensionReady = KellyOptionsPage.env.events.onExtensionReady;            
    KellyOptionsPage.env.events.onExtensionReady = function() {
        
        if (nativeOnExtensionReady) nativeOnExtensionReady();
        
        // K_FAV.getGlobal('image_events').saveImageProportions = function() { return; }            
        // K_FAV.aspectRatioAccurCheck = false; // копирайт портит проверку соотношения сторон, отключаем
        document.getElementById('sandbox-env').removeAttribute('style');
        K_FAV.showOptionsDialog(); 
    }
    
    K_FAV.load('cfg', function(fav) {
        var resources = ['options', 'main'];
        
        if (fav.coptions.mobileOptimization) document.body.classList.add(KellyOptionsPage.env.className + '-mobile');       
        if (fav.coptions.darkTheme) {
            document.body.classList.add(KellyOptionsPage.env.className + '-dark');
            resources.push('dark');
        }
        
        K_FAV.load('items', function() { K_FAV.initFormatPage(resources); });        
    });   
    
    KellyTools.setHTMLData(document.getElementById('submenu'), '<div class="' + KellyOptionsPage.env.className + '-copyright-info">' + KellyTools.getProgName(KellyOptionsPage.env.location) + '</div>');    
}

KellyOptionsPage.init();
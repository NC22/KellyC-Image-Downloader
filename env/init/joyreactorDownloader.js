KellyJoyreactorDPage = new Object();
KellyJoyreactorDPage.env = false;
KellyJoyreactorDPage.init = function() {
    
    window.K_FAV = false;
    document.title = KellyTools.getProgName();
    K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : { href : 'http:' + '//' + 'joyreactor.cc' + '/', protocol : 'http:', host : 'joyreactor.cc'}, allowMobile : true});
    
    KellyJoyreactorDPage.env = K_FAV.getGlobal('env');
    KellyJoyreactorDPage.env.hostClass = 'options_page';    
    KellyJoyreactorDPage.env.webRequestsRules.types = false;    

    var nativeOnExtensionReady = KellyJoyreactorDPage.env.events.onExtensionReady;            
    KellyJoyreactorDPage.env.events.onExtensionReady = function() {
        
        if (nativeOnExtensionReady) nativeOnExtensionReady();
        
        // K_FAV.getGlobal('image_events').saveImageProportions = function() { return; }            
        // K_FAV.aspectRatioAccurCheck = false; // копирайт портит проверку соотношения сторон, отключаем
        document.getElementById('sandbox-env').removeAttribute('style');
        K_FAV.showOptionsDialog(); 
    }
    
    K_FAV.load('cfg', function(fav) {
        var resources = ['core', 'single'];
              
        if (fav.coptions.darkTheme) {
            document.body.classList.add(KellyJoyreactorDPage.env.className + '-dark');
            resources.push('dark');
        }
        
        K_FAV.load('items', function() { K_FAV.initFormatPage(resources); });   
    });   
    
    KellyTools.setHTMLData(document.getElementById('submenu'), '<div class="' + KellyJoyreactorDPage.env.className + '-copyright-info">' + KellyTools.getProgName() + '<span id="copyright-software"></span></div>');     
    KellyTools.setCopyright('copyright-software');
}

KellyJoyreactorDPage.init();
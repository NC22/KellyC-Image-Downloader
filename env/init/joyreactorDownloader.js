KellyJoyreactorDPage = new Object();
KellyJoyreactorDPage.env = false;
KellyJoyreactorDPage.init = function() {
    
    window.K_FAV = false;
    document.title = KellyTools.getProgName();
    K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : { href : 'http:' + '//' + 'joyreactor.cc' + '/', protocol : 'http:', host : 'joyreactor.cc'}, allowMobile : true});
    
    KellyJoyreactorDPage.env = K_FAV.getGlobal('env');
    KellyJoyreactorDPage.env.hostClass = 'options_page';  
    KellyJoyreactorDPage.env.webRequestsRules.types = false;              
    KellyJoyreactorDPage.env.events.onExtensionReady = function() {
        
        // K_FAV.getGlobal('image_events').saveImageProportions = function() { return; }            
        // K_FAV.aspectRatioAccurCheck = false; // копирайт портит проверку соотношения сторон, отключаем
        document.getElementById('sandbox-env').removeAttribute('style');
        
        if (window.location.href.indexOf('tab=parser') != -1) {
                    
            KellyTools.getBrowser().runtime.sendMessage({method: "tabs.buffer"}, function(request) {
                handler.getBookmarksParser().pageInfo = request.data;
                K_FAV.showOptionsDialog(KellyJoyreactorDPage.env.className + '-Parser');
            });
            
        } else K_FAV.showOptionsDialog(); 
        
    }
    
    /*
    
    todo - move bookmark parser to options page, change to api mode
    
    KellyJoyreactorDPage.env.events.onCreateOptionsManager = function(optionsManager) {

        optionsManager.tabData['Parser'] = {loc : 'download_form_open', onSelect : function(handler) {
            K_FAV.showNativeFavoritePageInfo(KellyTools.getElementByClass(handler.wrap, handler.tabActive));
        }};  
    } 
    */
    
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

KellyTools.loadFrontJs(KellyJoyreactorDPage.init);

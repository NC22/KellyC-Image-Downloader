var K_FAV = false;

KellyOptionsPage = new Object();
KellyOptionsPage.env = false;
KellyOptionsPage.sandBox = false;
KellyOptionsPage.getContainer = function() {   
 
    if (this.sandBox) return this.sandBox;    
    this.sandBox = document.getElementById('page-sandbox');
    return this.sandBox;    
}

KellyOptionsPage.init = function() {
    
    KellyTools.DEBUG = true;    
    K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : { href : 'http:' + '//' + 'joyreactor.cc' + '/', protocol : 'http:', host : 'joyreactor.cc'}});
    
    KellyOptionsPage.env = K_FAV.getGlobal('env');
    KellyOptionsPage.env.hostClass = 'options_page';    
    KellyOptionsPage.env.webRequestsRules.types = false;
    KellyOptionsPage.showProfileSandbox();
    
    var nativeOnExtensionReady = KellyOptionsPage.env.events.onExtensionReady;            
    KellyOptionsPage.env.events.onExtensionReady = function() {
        
        if (nativeOnExtensionReady) nativeOnExtensionReady();
        
        // K_FAV.getGlobal('image_events').saveImageProportions = function() { return; }            
        // K_FAV.aspectRatioAccurCheck = false; // копирайт портит проверку соотношения сторон, отключаем
        document.getElementById('sandbox-env').removeAttribute('style');
        K_FAV.showOptionsDialog(); 
    }
    
    K_FAV.load('cfg', function(fav) {
        var resources = ['options', 'main', KellyOptionsPage.env.profile];
        
        if (fav.coptions.mobileOptimization) document.body.classList.add(KellyOptionsPage.env.className + '-mobile');       
        if (fav.coptions.darkTheme) {
            document.body.classList.add(KellyOptionsPage.env.className + '-dark');
            resources.push('dark');
        }
        
        K_FAV.load('items', function() { K_FAV.initFormatPage(resources); });        
    });
}

KellyOptionsPage.showProfileSandbox = function() {
    
    document.title = KellyTools.getProgName();
    
    // show simplified joyreactor environment in sandbox 
    
    var sandboxHtml = '\
        <div id="sandbox-env" style="opacity : 0;">\
            <div id="container">\
            \
                <div id="submenu">' + '<div class="' + KellyOptionsPage.env.className + '-copyright-info">' + KellyTools.getProgName(KellyOptionsPage.env.location) + '</div>' + '</div>\
                \
                <div class="page-content">\
                    \
                    <div class="content">\
                        <div id="contentinner"></div>\
                    </div>\
                    \
                    <div id="sidebar"></div>\
                    \
                    <div class="clear"></div>\
                </div>\
                \
            </div>\
        </div>\
    ';
    
    if (!this.getContainer()) {
        
        KellyTools.log('KellyOptionsPage : cant get container');
        return false;
    }
    
    KellyTools.setHTMLData(this.getContainer(), sandboxHtml);
    return true;
}
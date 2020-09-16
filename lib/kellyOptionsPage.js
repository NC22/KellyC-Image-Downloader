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
     
    var onLoadOptionsCss = function(response) {
    
        // console.log(response.url);
        
        if (!response || response.data === false) {    
            KellyTools.log('onLoadCssResource : bad init data');
            return false;
        }
        
        if (!response.data.css) {            
            KellyTools.log('onLoadCssResource : css empty');
            KellyTools.log('onLoadCssResource : Browser API response : ' + response.data.notice);            
            return false; 
        }
        
        K_FAV.addCss(KellyTools.replaceAll(response.data.css, '__BASECLASS__', KellyOptionsPage.env.className));
        K_FAV.load(false, K_FAV.initFormatPage);
    };  
    
    KellyOptionsPage.showProfileSandbox();
    
    K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : {
        href : 'http:' + '//' + 'joyreactor.cc' + '/',
        protocol : 'http:',
        host : 'joyreactor.cc',
    }});
    
    KellyTools.DEBUG = true;    
    KellyOptionsPage.env = K_FAV.getGlobal('env');
    KellyOptionsPage.env.hostClass = 'options_page';
   
    document.title = KellyTools.getProgName();        
    
    var nativeOnExtensionReady = KellyOptionsPage.env.events.onExtensionReady;            
    KellyOptionsPage.env.events.onExtensionReady = function() {
        
        if (nativeOnExtensionReady) nativeOnExtensionReady();
        
        K_FAV.getGlobal('image_events').saveImageProportions = function() { return; }            
        K_FAV.aspectRatioAccurCheck = false; // копирайт портит проверку соотношения сторон, отключаем
        K_FAV.isDownloadSupported = false; // Обратная связь при скачивании файла до таба настроек не дойдет т.к. не настроен селектор matches, см. KellyEDispetcher.sendNotification
        K_FAV.showOptionsDialog(); 
        
        KellyTools.setHTMLData(KellyOptionsPage.env.getMainContainers().siteContent, '<div class="' + KellyOptionsPage.env.className + '-copyright-info">' + KellyTools.getProgName(KellyOptionsPage.env.location) + '</div>');

    }
            
    KellyTools.getBrowser().runtime.sendMessage({method: "getCss", items : [KellyOptionsPage.env.profile + '_options']}, onLoadOptionsCss);
}

KellyOptionsPage.showProfileSandbox = function() {
    
    // show simplified joyreactor environment in sandbox 
    
    var sandboxHtml = '\
        <div class="joyreactor-env">\
            <div id="container">\
            \
                <div id="submenu"></div>\
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
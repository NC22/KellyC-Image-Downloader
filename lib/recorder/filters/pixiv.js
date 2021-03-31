KellyRecorderFilterPixiv = new Object();
KellyRecorderFilterPixiv.manifest = {host : 'pixiv.net', detectionLvl : ['imagePreview', 'imageByDocument']};
KellyRecorderFilterPixiv.artworkReg = {id : new RegExp('[0-9]+'), url : new RegExp('/artworks/[0-9]+')};

KellyRecorderFilterPixiv.addItemByDriver = function(handler, el, item) {
    
    if (handler.url.indexOf('pixiv.net') != -1 && el.tagName == 'A' && el.href.match(KellyRecorderFilterPixiv.artworkReg.url) !== null) { 
           
        var image = el.getElementsByTagName('IMG');
        if (image.length <= 0) return handler.addDriverAction.SKIP; 
        
        handler.addSingleSrc(item, image[0].src, 'addSrcFromAttributes-src', image[0], 'imagePreview'); 
        if (item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
        
        var artworkId = KellyRecorderFilterPixiv.artworkReg.id.exec(el.href)[0];
        item.relatedDoc = 'https://www.pixiv.net/ajax/illust/' + artworkId + '/pages' + '##FETCH_RULES##method=GET&responseType=json';

        return handler.addDriverAction.ADD;
    } 
}

KellyRecorderFilterPixiv.parseImagesDocByDriver = function(handler, thread) {
    
    if (handler.url.indexOf('pixiv.net') != -1) {
        if (typeof thread.response == 'object' && !thread.response.error && typeof thread.response.body == 'object') {
            
            for (var i = 0; i < thread.response.body.length; i++) {
                // todo - take width \ height and put this data to relatedBounds pool - implement kellyLoadDocControll to accept this data
                var urls = thread.response.body[i].urls;
                if (urls && (urls.regular || urls.original)) handler.imagesPool.push({relatedSrc : [urls.original ? urls.original : urls.regular]});                      
            }
            
        } else console.log('bad response - cant recognize object - check KellyDPage.aDProgress.docLoader.parser.lastThreadReport');
        
        thread.response = '';  
        return true;
            
    }
}

KellyPageWatchdog.filters.push(KellyRecorderFilterPixiv);
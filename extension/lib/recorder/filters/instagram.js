KellyRecorderFilterInstagram = new Object();
KellyRecorderFilterInstagram.manifest = {host : 'instagram.com', detectionLvl : ['imageAny', 'imageByDocument']};
KellyRecorderFilterInstagram.addItemByDriver = function(handler, data) {
    
    if (handler.url.indexOf('instagram') != -1 && data.el.tagName == 'IMG' && data.el.src.indexOf('instagram.com') != -1) { 
            
        var link = KellyTools.getParentByTag(data.el, 'A'); // match pattern https://www.instagram.com/p/CJdsKX4DEDK/
        if (link && link.getAttribute('href').length > 4) data.item.relatedDoc = link.href;
        
        if (data.item.relatedDoc && KellyTools.getParentByTag(data.el, 'ARTICLE')) {
            var cat = 'inst_post';
        } else {         
            var cat = 'inst_story';
            if (link || !KellyTools.getParentByTag(data.el, 'SECTION')) return handler.addDriverAction.SKIP;
        }
        
        handler.addSingleSrc(data.item, data.el.getAttribute('src'), 'addSrcFromAttributes-src', data.el, cat); 
        
        if ( data.item.relatedSrc.length > 0 ) {
            return handler.addDriverAction.ADD;
        } else {
            return handler.addDriverAction.SKIP;
        }
    }
}

KellyRecorderFilterInstagram.getBestQuality = function(instImageItem, imagesPool) {
    
    var mediaQuality = false;
    instImageItem.image_versions2.candidates.forEach(function(srcData) {
        if (!mediaQuality || srcData.width > mediaQuality.width) mediaQuality = srcData;
    });

    if (mediaQuality) imagesPool.push({relatedSrc : [mediaQuality.url]});
}

KellyRecorderFilterInstagram.parseImagesDocByDriver = function(handler, data) {
    
    if (handler.url.indexOf('instagram') != -1){ 
    
        try {
            var pageDataRegExp = /__additionalDataLoaded\([\'\"]?[-A/-Za-z0-9_]+[\'\"],\{([\s\S]*)\}\);/g, pageData = pageDataRegExp.exec(data.thread.response);
            if (pageData === null) return;
            
            handler.lastThreadJson = JSON.parse('{' + pageData[1] + '}');
            // console.log(handler.lastThreadJson);
             
            var item = handler.lastThreadJson.items[0];
            if (item.carousel_media) {
                item.carousel_media.forEach(function(instImageItem) {
                    KellyRecorderFilterInstagram.getBestQuality(instImageItem, handler.imagesPool);
                });
            } else {
                KellyRecorderFilterInstagram.getBestQuality(handler.lastThreadJson.items[0], handler.imagesPool);
            }
            
        } catch (e) {
            console.log(e);
        }
        
        return true;
    }
}

KellyRecorderFilterInstagram.onStartRecord = function(handler, data) {
     if (handler.url.indexOf('instagram') == -1) return;
     
     handler.additionCats = {
        inst_story : {name : 'Stories & Misc', selected : 80, color : '#b7dd99'},
        inst_post : {name : 'Publication Preview', selected : 90, color : '#b7dd99'},
     };
}

KellyPageWatchdog.validators.push({url : 'instagram', patterns : [['cdninstagram', 'imageAny']]}); // may be use regexp pattern for previews - [any symbol]instagram[any symbol]640x640[any]
KellyPageWatchdog.filters.push(KellyRecorderFilterInstagram);
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

KellyRecorderFilterInstagram.onBeforeParseImagesDocByDriver = function(handler, data) {
    
    if (data.thread.instagramRequest) return;
    
    if (handler.url.indexOf('instagram') != -1){ 
        
        var appIdRegExp = /\"appId\"\:\"([0-9]+)?\"/;
        var mediaIdRegExp = /\"media_id\"\:\"([0-9]+)?\"/;
        
        var pageData = {
            appId : appIdRegExp.exec(data.thread.response),
            mediaId : mediaIdRegExp.exec(data.thread.response),
        };
        
        if (pageData.appId) pageData.appId = pageData.appId[1].trim();
        if (pageData.mediaId) pageData.mediaId = pageData.mediaId[1].trim();

        if (!pageData.appId  || !pageData.mediaId) {
            
            console.log('[Instagram] : bad media info');
            console.log(pageData);
            return;
        } else {
            
            console.log(pageData);
        }

        var requestUrl = 'https://i.instagram.com/api/v1/media/' + pageData.mediaId + '/info/';
        
        data.thread.instagramRequest = 'mediaRequest';
        
        return {requestUrl : requestUrl, cfg : {method : 'GET', xHeaders : {'x-ig-app-id' : pageData.appId}, responseType : 'json'}};
    }
}

// debug throw KellyDPage.aDProgress.docLoader.parser

KellyRecorderFilterInstagram.parseImagesDocByDriver = function(handler, data) {
    
    if (data.thread.instagramRequest == 'mediaRequest' && handler.url.indexOf('instagram') != -1){ 
    
        try {
            handler.lastThreadJson = data.thread.response;
            if (!handler.lastThreadJson) {
                
                handler.lastThreadJson = {error : 'empty page data. check regexp'};
                return;
            }
            
            var item = handler.lastThreadJson.items[0];
            if (item.carousel_media) {
                item.carousel_media.forEach(function(instImageItem) {
                    KellyRecorderFilterInstagram.getBestQuality(instImageItem, handler.imagesPool);
                });
            } else {
                KellyRecorderFilterInstagram.getBestQuality(handler.lastThreadJson.items[0], handler.imagesPool);
            }
            
        } catch (e) {
            
            handler.lastThreadJson = {error : 'parse fail'};
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
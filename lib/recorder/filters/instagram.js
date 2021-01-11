KellyRecorderFilterInstagram = new Object();
KellyRecorderFilterInstagram.manifest = {host : 'instagram.com', detectionLvl : ['imageAny', 'imageByDocument']};
KellyRecorderFilterInstagram.addItemByDriver = function(handler, el, item) {
    
    if (handler.url.indexOf('instagram') != -1 && el.tagName == 'IMG' && el.src.indexOf('instagram.com') != -1 && el.getAttribute('srcset')) { 
            
        handler.addSingleSrc(item, el.getAttribute('src'), 'addSrcFromAttributes-src', el, 'imagePreview'); 
        var link = KellyTools.getParentByTag(el, 'A'); // match pattern https://www.instagram.com/p/CJdsKX4DEDK/
        if (link && link.getAttribute('href').length > 4) item.relatedDoc = link.href;
        
        return item.relatedDoc && item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;            
    }
}

KellyRecorderFilterInstagram.parseImagesDocByDriver = function(handler, thread) {
    
    if (handler.url.indexOf('instagram') != -1){ 
    
        try {
            var pageDataRegExp = /__additionalDataLoaded\([\'\"]?[-A/-Za-z0-9_]+[\'\"],\{([\s\S]*)\}\);/g, pageData = pageDataRegExp.exec(thread.response), mediaQuality = false;
            if (pageData === null) return;
            
            handler.lastThreadJson = JSON.parse('{' + pageData[1] + '}');
            handler.lastThreadJson.graphql.shortcode_media.display_resources.forEach(function(srcData) {
                if (!mediaQuality || srcData.config_height > mediaQuality.config_height) mediaQuality = srcData;
            });

            if (mediaQuality) handler.imagesPool.push({relatedSrc : [mediaQuality.src]});
            
        } catch (e) {
            console.log(e);
        }
        
        return true;
    }
}

KellyPageWatchdog.validators.push({url : 'instagram', patterns : [['cdninstagram', 'imageAny']]}); // may be use regexp pattern for previews - [any symbol]instagram[any symbol]640x640[any]
KellyPageWatchdog.filters.push(KellyRecorderFilterInstagram);
KellyRecorderFilterInstagram = new Object();
KellyRecorderFilterInstagram.manifest = {host : 'instagram.com', detectionLvl : ['imageAny', 'imageByDocument']};
KellyRecorderFilterInstagram.addItemByDriver = function(handler, data) {
    
    if (handler.url.indexOf('instagram') != -1 && data.el.tagName == 'IMG' && data.el.src.indexOf('instagram.com') != -1 && data.el.getAttribute('srcset')) { 
            
        handler.addSingleSrc(data.item, data.el.getAttribute('src'), 'addSrcFromAttributes-src', data.el, 'imagePreview'); 
        var link = KellyTools.getParentByTag(data.el, 'A'); // match pattern https://www.instagram.com/p/CJdsKX4DEDK/
        if (link && link.getAttribute('href').length > 4) data.item.relatedDoc = link.href;
        
        return data.item.relatedDoc && data.item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;            
    }
}

KellyRecorderFilterInstagram.parseImagesDocByDriver = function(handler, data) {
    
    if (handler.url.indexOf('instagram') != -1){ 
    
        try {
            var pageDataRegExp = /__additionalDataLoaded\([\'\"]?[-A/-Za-z0-9_]+[\'\"],\{([\s\S]*)\}\);/g, pageData = pageDataRegExp.exec(data.thread.response), mediaQuality = false;
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
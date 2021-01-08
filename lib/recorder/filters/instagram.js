KellyRecorderFilterInstagram = new Object();
KellyRecorderFilterInstagram.manifest = {host : 'instagram.com', detectionLvl : ['imageAny', 'imageByDocument']};
KellyRecorderFilterInstagram.parseImagesDocByDriver = function(handler, thread) {
    
    if (handler.url.indexOf('instagram') != -1){ 
          try {
                var begin = '{"graphql":', end = '});</script>', mediaQuality = false;
                
                handler.lastThreadJson = JSON.parse(thread.response.substring( thread.response.indexOf(begin) + begin.length, thread.response.indexOf(end)));
                handler.lastThreadJson.shortcode_media.display_resources.forEach(function(srcData) {
                    if (!mediaQuality || srcData.config_height > mediaQuality.config_height) mediaQuality = srcData;
                });
                
                if (mediaQuality) handler.imagesPool.push({relatedSrc : [mediaQuality.src]});
                
                return true;
                
           } catch (e) {
                console.log(e);
           }
    }
}

KellyPageWatchdog.validators.push({url : 'instagram', patterns : [['cdninstagram', 'imageAny']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterInstagram);
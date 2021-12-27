KellyRecorderFilterYandex = new Object();
KellyRecorderFilterYandex.manifest = {host : 'yandex.ru', detectionLvl : ['imageOriginal', 'imagePreview']};
KellyRecorderFilterYandex.addItemByDriver = function(handler, data) {
    
        if (handler.url.indexOf('yandex.ru') != -1) {
            
            if (data.el.classList.contains('serp-item__thumb') && data.el.tagName == 'IMG' && data.el.src) {
                
                var orig = KellyTools.getParentByClass(data.el, 'serp-item');
                if (!orig || !orig.getAttribute('data-bem')) return;
                
                var origImage = false;
                try {
                   var origData = JSON.parse(orig.getAttribute('data-bem'));
                   origImage = origData['serp-item']['img_href'];
                } catch(e) {                    
                    return;
                }
                
                if (!origImage) return;
                
                data.item.referrer = KellyTools.getLocationFromUrl(origImage).host;
                
                handler.addSingleSrc(data.item, data.el.src, 'addSrcFromAttributes-src', data.el, 'imagePreview'); 
                handler.addSingleSrc(data.item, origImage, 'addSrcFromAttributes-src', data.el, 'imageOriginal'); 
                
                return data.item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;
            }
        }
}

KellyPageWatchdog.filters.push(KellyRecorderFilterYandex);
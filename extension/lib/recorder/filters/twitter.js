KellyRecorderFilterTwitter = new Object();
KellyRecorderFilterTwitter.manifest = {host : 'twitter.com', detectionLvl : ['imageAny', 'imagePreview', 'imageOriginal']};
KellyRecorderFilterTwitter.addItemByDriver = function(handler, data) {
    if (handler.url.indexOf('twitter') != -1 && data.el.tagName == 'IMG' && data.el.src.indexOf('name=') != -1 && data.el.src.indexOf('pbs.twimg.com/media') != -1) {
        
       handler.addSingleSrc(data.item, data.el.src, 'addSrcFromAttributes-src', data.el, 'imagePreview');
       handler.addSingleSrc(data.item, data.el.src.split('&name=')[0] + '&name=orig', 'addSrcFromAttributes-src', data.el, 'imageOriginal');
       
       return data.item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;            
    } 
}

KellyPageWatchdog.validators.push({url : 'twitter', patterns : [['twimg.com/media', 'imageAny']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterTwitter);
KellyRecorderFilterTwitter = new Object();
KellyRecorderFilterTwitter.manifest = {host : 'twitter.com', detectionLvl : ['imageAny', 'imagePreview', 'imageOriginal']};
KellyRecorderFilterTwitter.addItemByDriver = function(handler, el, item) {
    if (handler.url.indexOf('twitter') != -1 && el.tagName == 'IMG' && el.src.indexOf('name=') != -1 && el.src.indexOf('pbs.twimg.com/media') != -1) {
        
       handler.addSingleSrc(item, el.src, 'addSrcFromAttributes-src', el, 'imagePreview');
       handler.addSingleSrc(item, el.src.split('&name=')[0], 'addSrcFromAttributes-src', el, 'imageOriginal');
       
       return item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;            
    } 
}

KellyPageWatchdog.validators.push({url : 'twitter', patterns : [['twimg.com/media', 'imageAny']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterTwitter);
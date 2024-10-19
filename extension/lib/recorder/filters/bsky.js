KellyRecorderFilterBsky = new Object();
KellyRecorderFilterBsky.manifest = {host : 'bsky.app', detectionLvl : ['imageAny', 'imagePreview', 'imageOriginal']};

KellyRecorderFilterBsky.addItemByDriver = function(handler, data) {
    if (handler.url.indexOf('bsky.app') != -1 && data.el.tagName == 'IMG' && data.el.src.indexOf('img/feed_') != -1) {
       console.log(' KellyRecorderFilterBsky tst');
       handler.addSingleSrc(data.item, data.el.src, 'addSrcFromAttributes-src', data.el, 'imagePreview');
       handler.addSingleSrc(data.item, data.el.src.replace('feed_thumbnail', 'feed_fullsize'), 'addSrcFromAttributes-src', data.el, 'imageOriginal');
       
       return data.item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;            
    } 
}

KellyPageWatchdog.validators.push({url : 'bsky.app', patterns : [['cdn.bsky.app', 'imageAny']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterBsky);
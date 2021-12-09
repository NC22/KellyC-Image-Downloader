KellyRecorderFilterKemono = new Object();
KellyRecorderFilterKemono.manifest = {host : 'kemono.party', detectionLvl : ['imagePreview', 'imageOriginal']};
KellyRecorderFilterKemono.addItemByDriver = function(handler, el, item) {
    if (handler.url.indexOf('kemono.party') != -1 && el.tagName == 'IMG' && el.src.indexOf('/thumbnail/files/') != -1) {
        
       handler.addSingleSrc(item, el.src, 'addSrcFromAttributes-src', el, 'imagePreview');
       handler.addSingleSrc(item, el.src.replace('/thumbnail', ''), 'addSrcFromAttributes-src', el, 'imageOriginal');
       
       return item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;            
    } 
}

KellyPageWatchdog.filters.push(KellyRecorderFilterKemono);

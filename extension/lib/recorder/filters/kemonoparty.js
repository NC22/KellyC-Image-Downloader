KellyRecorderFilterKemono = new Object();
KellyRecorderFilterKemono.manifest = {host : 'kemono.party', detectionLvl : ['imagePreview', 'imageOriginal']};
KellyRecorderFilterKemono.addItemByDriver = function(handler, data) {
    if (handler.url.indexOf('kemono.party') != -1 && data.el.tagName == 'IMG' && data.el.src.indexOf('/thumbnail/files/') != -1) {
        
       handler.addSingleSrc(item, data.el.src, 'addSrcFromAttributes-src', data.el, 'imagePreview');
       handler.addSingleSrc(item, data.el.src.replace('/thumbnail', ''), 'addSrcFromAttributes-src', data.el, 'imageOriginal');
       
       return item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;            
    } 
}

KellyPageWatchdog.filters.push(KellyRecorderFilterKemono);

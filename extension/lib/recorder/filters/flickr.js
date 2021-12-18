KellyRecorderFilterFlickr = new Object();
KellyRecorderFilterFlickr.manifest = {host : 'flickr.com', detectionLvl : ['imagePreview', 'imageOriginal', 'imageByDocument']};
KellyRecorderFilterFlickr.addItemByDriver = function(handler, el, item) {

    if (handler.url.indexOf('flickr.com') == -1) return;
   
    if (el.className && el.classList.contains('photo-list-photo-view')) {
        
        handler.addSrcFromStyle(el, item, 'imagePreview'); 
        var relatedDoc = el.getElementsByTagName('A');
        if (relatedDoc.length > 0) item.relatedDoc = relatedDoc[0].href;
        
        return (item.relatedSrc.length > 0 && item.relatedDoc) ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;
    }
}

KellyRecorderFilterVK.parseImagesDocByDriver = function(handler, thread) {
    
    if (handler.url.indexOf('flickr.com') == -1 && thread.response) return;
    
    var parser = new DOMParser();
    var doc = parser.parseFromString(thread.response, 'text/html');
    var src = doc.querySelector('[property="og:image"]').getAttribute('content');
    if (src) handler.imagesPool.push({relatedSrc : [src]});
    
    return true;
}

KellyPageWatchdog.filters.push(KellyRecorderFilterFlickr);
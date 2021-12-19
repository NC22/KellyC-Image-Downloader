KellyRecorderFilterFlickr = new Object();
KellyRecorderFilterFlickr.manifest = {host : 'flickr.com', detectionLvl : ['imagePreview', 'imageOriginal', 'imageByDocument']};
KellyRecorderFilterFlickr.addItemByDriver = function(handler, data) {

    if (handler.url.indexOf('flickr.com') == -1) return;
   
    if (data.el.className && data.el.classList.contains('photo-list-photo-view')) {
        
        handler.addSrcFromStyle(data.el, data.item, 'imagePreview'); 
        var relatedDoc = data.el.getElementsByTagName('A');
        if (relatedDoc.length > 0) data.item.relatedDoc = relatedDoc[0].href;
        
        return (data.item.relatedSrc.length > 0 && data.item.relatedDoc) ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;
    }
}

KellyRecorderFilterFlickr.parseImagesDocByDriver = function(handler, data) {
    
    if (handler.url.indexOf('flickr.com') == -1 && data.thread.response) return;
    
    var parser = new DOMParser();
    var doc = parser.parseFromString(data.thread.response, 'text/html');
    var src = doc.querySelector('[property="og:image"]').getAttribute('content');
    if (src) handler.imagesPool.push({relatedSrc : [src]});
    
    return true;
}

KellyPageWatchdog.filters.push(KellyRecorderFilterFlickr);
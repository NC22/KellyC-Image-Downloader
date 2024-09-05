KellyRecorderFilterEHentai = new Object();
KellyRecorderFilterEHentai.manifest = {host : ['e-hentai.org', 'exhentai.org'], detectionLvl : ['imagePreview', 'imageByDocument']};
KellyRecorderFilterEHentai.previewTileMap = false;
KellyRecorderFilterEHentai.canvas = document.createElement('canvas');
KellyRecorderFilterEHentai.previewImagesPool = [];

KellyRecorderFilterEHentai.getPreviewTileBounds = function(el) {
    return { x : Math.abs(parseInt(el.style.backgroundPositionX)), y : parseInt(el.style.backgroundPositionY), width : parseInt(el.style.width), height : parseInt(el.style.height) }
}

KellyRecorderFilterEHentai.addItemByDriver = function(handler, data) {
    
    if (handler.url.indexOf('e-hentai.org') == -1 && handler.url.indexOf('exhentai.org') == -1) return;
    
    if (data.el.tagName != 'DIV') return;    
    
    var previewUrl = handler.getSrcFromStyle(data.el);
    if (previewUrl && data.el.style.backgroundPosition) {
        
        var relatedDoc = KellyTools.getElementByTag(data.el, 'A'), bounds = KellyRecorderFilterEHentai.getPreviewTileBounds(data.el);        
        if (!relatedDoc) return handler.addDriverAction.SKIP; 
        
        handler.addSingleSrc(data.item, 'data:image-tilemap;' + previewUrl + ',' + bounds.x + ',' + bounds.y + ',' + bounds.width + ',' + bounds.height, 'addSrcFromStyle', data.el, 'imagePreview');        
        data.item.relatedDoc = relatedDoc.href;
        
        console.log(data.item);
        
        return handler.addDriverAction.ADD;
    } 
    
}

KellyRecorderFilterEHentai.parseImagesDocByDriver = function(handler, data) {
 
    if (handler.url.indexOf('e-hentai.org') != -1 && typeof data.thread.response == 'string') {
        
        var parser = new DOMParser(); 
        data.thread.loadDoc = parser.parseFromString(data.thread.response, 'text/html');
        
        var image = data.thread.loadDoc.querySelector('#i3 img');
        if (image){ 
            handler.imagesPool.push({relatedSrc : [image.getAttribute('src')], relatedGroups : []});
            return true;
        }
        
        data.thread.response = '';
        return; 
    }    
 
}

KellyPageWatchdog.filters.push(KellyRecorderFilterEHentai);
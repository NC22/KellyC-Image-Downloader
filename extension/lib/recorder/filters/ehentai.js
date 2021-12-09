KellyRecorderFilterEHentai = new Object();
KellyRecorderFilterEHentai.manifest = {host : ['e-hentai.org', 'exhentai.org'], detectionLvl : ['imagePreview', 'imageByDocument']};
KellyRecorderFilterEHentai.previewMatch = new RegExp('http[:\/0-9a-zA-Z\.]+/m/[0-9]+/[0-9]+\-[0-9]+\\.[a-zA-Z]+');
KellyRecorderFilterEHentai.previewTileMap = false;
KellyRecorderFilterEHentai.canvas = document.createElement('canvas');
KellyRecorderFilterEHentai.previewImagesPool = [];

KellyRecorderFilterEHentai.getPreviewTileBounds = function(el) {
    return { x : Math.abs(parseInt(el.style.backgroundPositionX)), y : parseInt(el.style.backgroundPositionY), width : parseInt(el.style.width), height : parseInt(el.style.height) }
}

KellyRecorderFilterEHentai.addItemByDriver = function(handler, el, item) {
    
    if (handler.url.indexOf('e-hentai.org') == -1 && handler.url.indexOf('exhentai.org') == -1) return;
    
    if (el.tagName != 'DIV') return;    
    
    var previewUrl = el.style.backgroundImage.match(KellyRecorderFilterEHentai.previewMatch);    
    if (previewUrl !== null) {
        
        var relatedDoc = KellyTools.getElementByTag(el, 'A'), bounds = KellyRecorderFilterEHentai.getPreviewTileBounds(el);        
        if (!relatedDoc) return handler.addDriverAction.SKIP; 
        
        handler.addSingleSrc(item, 'data:image-tilemap;' + previewUrl[0] + ',' + bounds.x + ',' + bounds.y + ',' + bounds.width + ',' + bounds.height, 'addSrcFromStyle', el, 'imagePreview');        
        item.relatedDoc = relatedDoc.href;
        
        console.log(item);
        
        return handler.addDriverAction.ADD;
    } 
    
}

KellyRecorderFilterEHentai.parseImagesDocByDriver = function(handler, thread) {
 
    if (handler.url.indexOf('e-hentai.org') != -1 && typeof thread.response == 'string') {
        
        var parser = new DOMParser(); 
        thread.loadDoc = parser.parseFromString(thread.response, 'text/html');
        
        var image = thread.loadDoc.querySelector('#i3 img');
        if (image){ 
            handler.imagesPool.push({relatedSrc : [image.getAttribute('src')], relatedGroups : []});
            return true;
        }
        
        thread.response = '';
        return; 
    }    
 
}

KellyPageWatchdog.filters.push(KellyRecorderFilterEHentai);
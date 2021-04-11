KellyRecorderFilterEHentai = new Object();
KellyRecorderFilterEHentai.manifest = {host : ['e-hentai.org', 'exhentai.org'], detectionLvl : ['imagePreview', 'imageByDocument']};
KellyRecorderFilterEHentai.previewMatch = new RegExp('http[:\/0-9a-zA-Z\.]+/m/[0-9]+/[0-9]+\-00\\.[a-zA-Z]+');
KellyRecorderFilterEHentai.previewTileMap = false;
KellyRecorderFilterEHentai.canvas = document.createElement('canvas');
KellyRecorderFilterEHentai.previewImagesPool = [];

KellyRecorderFilterEHentai.getPreviewTileBounds = function(el) {
    return { x : Math.abs(parseInt(el.style.backgroundPositionX)), y : parseInt(el.style.backgroundPositionY), width : parseInt(el.style.width), height : parseInt(el.style.height) }
}

KellyRecorderFilterEHentai.onInitLocation = function(handler, data) {
    
    if (KellyRecorderFilterEHentai.previewTileMap) return;
    
    var anyPreviewImage = document.querySelector('.gdtm div');
    if (anyPreviewImage) {        
        KellyRecorderFilterEHentai.previewTileMap = new Image();
        KellyRecorderFilterEHentai.previewTileMap.src = anyPreviewImage.style.backgroundImage.match(KellyRecorderFilterEHentai.previewMatch)[0];
                
        KellyRecorderFilterEHentai.previewTileMap.onerror = function() {
            console.log('fail to load tilemap');
            KellyRecorderFilterEHentai.previewTileMap = false;
        }        
        
        if (KellyRecorderFilterEHentai.previewTileMap.src.indexOf(handler.host) == -1) {
            console.log('domain missmatch'); // todo - check possible ways to ignore this security issue without minor changes - may be add support of tiles to bg page
            KellyRecorderFilterEHentai.previewTileMap = false;
        }
    }
}

KellyRecorderFilterEHentai.addItemByDriver = function(handler, el, item) {
    
    if (handler.url.indexOf('e-hentai.org') == -1 && handler.url.indexOf('exhentai.org') == -1) return;
    
    if (!KellyRecorderFilterEHentai.previewTileMap || el.tagName != 'DIV') return;
    
    var previewUrl = el.style.backgroundImage.match(KellyRecorderFilterEHentai.previewMatch);
    
    if (previewUrl !== null) {
        
        var relatedDoc = KellyTools.getElementByTag(el, 'A');        
        var bounds = KellyRecorderFilterEHentai.getPreviewTileBounds(el);
        
        if (!relatedDoc) return handler.addDriverAction.SKIP; 
       
        KellyRecorderFilterEHentai.canvas.width = bounds.width;				
        KellyRecorderFilterEHentai.canvas.height = bounds.height;
        KellyRecorderFilterEHentai.canvas.getContext('2d').drawImage(KellyRecorderFilterEHentai.previewTileMap, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);

        handler.addSingleSrc(item, KellyRecorderFilterEHentai.canvas.toDataURL(), 'addSrcFromAttributes-src', el, 'imagePreview'); 
        
        item.relatedDoc = relatedDoc.href;
        
        return handler.addDriverAction.ADD;
    } 
    
}

KellyRecorderFilterEHentai.parseImagesDocByDriver = function(handler, thread) {
    
 
}

KellyPageWatchdog.filters.push(KellyRecorderFilterEHentai);
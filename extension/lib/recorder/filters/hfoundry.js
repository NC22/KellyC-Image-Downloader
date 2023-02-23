KellyRecorderFilterHFoundry = new Object();
KellyRecorderFilterHFoundry.manifest = {host : 'hentai-foundry.com', detectionLvl : ['imagePreview', 'imageByDocument']};
KellyRecorderFilterHFoundry.parseImagesDocByDriver = function(handler, data) {
    
    if (handler.url.indexOf('hentai-foundry.com') == -1) return;
    if (!data.thread.response) return;
    
    var parser = new DOMParser();
    var doc = parser.parseFromString(data.thread.response, 'text/html');
    var image = doc.querySelector('#picBox img');
    
    if (image) {
        
        var imageSrc = false;
        
        if (image.getAttribute('onclick') && image.getAttribute('onclick').indexOf('resize_message') != -1) {
            
            imageSrc = image.getAttribute('onclick').split("'")[1];
            
            if (!imageSrc) imageSrc = image.getAttribute('src');
            else imageSrc = 'https:' + imageSrc; 
        
        } else {
        
            imageSrc = image.getAttribute('src');
        }
        
        var item = {relatedSrc : []};
        handler.addSingleSrc(item, imageSrc, 'addSrcFromAttributes-src', image, []);
        
        console.log(item);
        if (item.relatedSrc.length > 0) handler.imagesPool.push(item);
            
    } else {
        handler.docLoader.lastError = 'Original image not found in document : <br> <b>' + handler.url + '</b>';
    }
    
    data.thread.response = ''; 
    return true;
}    

KellyPageWatchdog.validators.push({url : 'hentai-foundry.', host : 'hentai-foundry.com', patterns : [['thumb.php', 'imagePreview'], [new RegExp('pictures.hentai-foundry.com/[0-9a-zA-Z]+\/'), 'imageByDocument']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterHFoundry);
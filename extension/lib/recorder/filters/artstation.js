KellyRecorderFilterArtstation = new Object();
KellyRecorderFilterArtstation.manifest = {host : 'artstation.com', detectionLvl : ['imageAny', 'imageByDocument']};
KellyRecorderFilterArtstation.parseImagesDocByDriver = function(handler, thread) {
    
    if (handler.url.indexOf('artstation') != -1) {
        
        var meta = thread.response.match(/<\meta name="twitter:image"([\s\S]*?)>/g); // todo - parse graphql data to detect multiple images for one publication
        if (meta) {                
            var image = KellyTools.val('<div>' + meta[0] + '</div>', 'html').querySelector('meta[name="twitter:image"]');
            if (image) image = image.getAttribute('content');
            if (image) handler.imagesPool.push({relatedSrc : [image]});
        }
        
        thread.response = ''; 
    } 
}

KellyPageWatchdog.validators.push({url : 'artstation', patterns : [['assets/images', 'imageAny']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterArtstation);
       
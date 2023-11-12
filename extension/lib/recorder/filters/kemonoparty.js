KellyRecorderFilterKemono = new Object();
KellyRecorderFilterKemono.manifest = {host : ['kemono.su', 'kemono.party', 'coomer.party'], detectionLvl : ['imagePreview', 'imageOriginal', 'imageByDocument']};

KellyRecorderFilterKemono.parseImagesDocByDriver = function(handler, data) {
    
    if (handler.url.indexOf('kemono.su') == -1 && handler.url.indexOf('kemono.party') == -1 && handler.url.indexOf('coomer.party') == -1 && data.thread.response) return;
    
    var parser = new DOMParser();
    var doc = parser.parseFromString(data.thread.response, 'text/html');
    
    var images = doc.querySelectorAll('.fileThumb');
    for (var i = 0; i < images.length; i++) {
        var href = KellyTools.getLocationFromUrl(images[i].href).pathname;
        if (href && href.indexOf('/data/') === 0) handler.imagesPool.push({relatedSrc : ['https://' + handler.hostname + href]});
    }

    data.thread.response = ''; 
    return true;
}    
 
KellyRecorderFilterKemono.onStartRecord = function(handler, data) {
     if (handler.url.indexOf('kemono.su') == -1 && handler.url.indexOf('kemono.party') == -1) return;
     handler.allowDuplicates = true;
}

KellyPageWatchdog.validators.push({
    url : 'kemono.party', 
    host : 'kemono.party', 
    patterns : [['/thumbnail/', 'imagePreview']]
});

KellyPageWatchdog.validators.push({
    url : 'kemono.su', 
    host : 'kemono.su', 
    patterns : [['/thumbnail/', 'imagePreview']]
});

KellyPageWatchdog.validators.push({
    url : 'coomer.party', 
    host : 'coomer.party', 
    patterns : [['/thumbnail/', 'imagePreview']]
});

KellyPageWatchdog.filters.push(KellyRecorderFilterKemono);

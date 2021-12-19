KellyRecorderFilterKemono = new Object();
KellyRecorderFilterKemono.manifest = {host : 'kemono.party', detectionLvl : ['imagePreview', 'imageOriginal', 'imageByDocument']};

KellyRecorderFilterKemono.parseImagesDocByDriver = function(handler, data) {
    
    if (handler.url.indexOf('kemono.party') == -1 && data.thread.response) return;
    
    var parser = new DOMParser();
    var doc = parser.parseFromString(data.thread.response, 'text/html');
    
    var images = doc.querySelectorAll('.fileThumb');
    for (var i = 0; i < images.length; i++) {
        var href = KellyTools.getLocationFromUrl(images[i].href).pathname;
        if (href && href.indexOf('/data/') === 0) handler.imagesPool.push({relatedSrc : ['https://kemono.party' + href]});
    }

    data.thread.response = ''; 
    return true;
}

KellyPageWatchdog.validators.push({
    url : 'kemono.party', 
    host : 'kemono.party', 
    patterns : [['/thumbnail/', 'imagePreview']]
});

KellyPageWatchdog.filters.push(KellyRecorderFilterKemono);

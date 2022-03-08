KellyRecorderFilter9Gag = new Object();
KellyRecorderFilter9Gag.manifest = {host : '9gag.com', detectionLvl : ['imagePreview', 'imageOriginal', 'imageByDocument']};

KellyRecorderFilter9Gag.parseImagesDocByDriver = function(handler, data) {    
     
    if (handler.url.indexOf('9gag.com') == -1) return;
        
    var pageDataRegExp = /window\._config[\s]*=[\s]*JSON\.parse\(\"\{([\s\S]*)\}\}\"\)\;[\s]*\<\/script/g
    var pageData = pageDataRegExp.exec(data.thread.response);
    
    if (pageData) {
        
        try {
            
            var gagData = KellyTools.parseJSON('{' + pageData[1] + '}}', true, true); // parse escaped json
            var bigImage = false;     
            console.log(gagData);
            
            for (var imageId in gagData.data.post.images) {
                if (!bigImage || bigImage.width < gagData.data.post.images[imageId].width) {
                    bigImage = gagData.data.post.images[imageId];
                }
            }
            
            if (bigImage) {
                handler.imagesPool.push({
                    relatedSrc : [ bigImage.url ], 
                    relatedGroups : [['imageOriginal']] 
                });
            }
            
        } catch (e) {
            console.log(e);
        }
    }
    
    return true;
}

KellyPageWatchdog.validators.push({
    url : '9gag.com', 
    host : '9gag.com', 
    patterns : [
        ['img-9gag-fun', 'imagePreview'],
    ]
});

KellyPageWatchdog.filters.push(KellyRecorderFilter9Gag);
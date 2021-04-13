KellyRecorderFilterPixiv = new Object();
KellyRecorderFilterPixiv.manifest = {host : 'pixiv.net', detectionLvl : ['imagePreview', 'imageByDocument']};
KellyRecorderFilterPixiv.artworkReg = {id : new RegExp('[0-9]+'), url : new RegExp('/artworks/[0-9]+')};

KellyRecorderFilterPixiv.validateByDriver = function(handler, item) {
    
    if (handler.url.indexOf('pixiv.net') == -1 || item.relatedSrc.length != 1 || !item.relatedDoc) return;    
    if (item.relatedDoc.match(KellyRecorderFilterPixiv.artworkReg.url) === null) return;
    
    var artworkId = KellyRecorderFilterPixiv.artworkReg.id.exec(item.relatedDoc)[0];
    item.relatedDoc = 'https://www.pixiv.net/ajax/illust/' + artworkId + '/pages' + '##FETCH_RULES##method=GET&responseType=json';
    item.relatedGroups = [['imagePreview']];
    
    // animations on pixiv has different design and require zip archivator libraries to work with
}

KellyRecorderFilterPixiv.parseImagesDocByDriver = function(handler, thread) {
    
    if (handler.url.indexOf('pixiv.net') != -1) {
        if (typeof thread.response == 'object' && !thread.response.error && typeof thread.response.body == 'object') {
            
            for (var i = 0; i < thread.response.body.length; i++) {
                // todo - take width \ height and put this data to relatedBounds pool - implement kellyLoadDocControll to accept this data
                var urls = thread.response.body[i].urls;
                if (urls && (urls.regular || urls.original)) handler.imagesPool.push({relatedSrc : [urls.original ? urls.original : urls.regular]});                      
            }
            
        } else console.log('bad response - cant recognize object - check KellyDPage.aDProgress.docLoader.parser.lastThreadReport');
        
        thread.response = '';  
        return true;
            
    }
}

KellyPageWatchdog.filters.push(KellyRecorderFilterPixiv);
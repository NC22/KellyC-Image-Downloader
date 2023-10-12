KellyRecorderFilterPixiv = new Object();
KellyRecorderFilterPixiv.manifest = {host : 'pixiv.net', detectionLvl : ['imagePreview', 'imageByDocument']};
KellyRecorderFilterPixiv.artworkReg = {id : new RegExp('[0-9]+'), url : new RegExp('/artworks/[0-9]+')};

KellyRecorderFilterPixiv.validateByDriver = function(handler, data) {
    
    if (handler.url.indexOf('pixiv.net') == -1 || data.item.relatedSrc.length != 1 || !data.item.relatedDoc) return;    
    if (data.item.relatedDoc.match(KellyRecorderFilterPixiv.artworkReg.url) === null) return;
    
    var artworkId = KellyRecorderFilterPixiv.artworkReg.id.exec(data.item.relatedDoc)[0];
    data.item.relatedDoc = 'https://www.pixiv.net/ajax/illust/' + artworkId + '/pages' + '##FETCH_RULES##method=GET&responseType=json';
    data.item.relatedGroups = [['imagePreview']];
    
    // https://www.pixiv.net/ajax/illust/112344306/ugoira_meta
    // https://github.com/Stuk/jszip/tree/main
    // https://github.com/thenickdude/webm-writer-js
    
    // animations on pixiv has different design and require zip archivator libraries to work with
}

KellyRecorderFilterPixiv.parseImagesDocByDriver = function(handler, data) {
    
    if (handler.url.indexOf('pixiv.net') != -1) {
        if (typeof data.thread.response == 'object' && !data.thread.response.error && typeof data.thread.response.body == 'object') {
            
            for (var i = 0; i < data.thread.response.body.length; i++) {
                // todo - take width \ height and put this data to relatedBounds pool - implement kellyLoadDocControll to accept this data
                var urls = data.thread.response.body[i].urls;
                if (urls && (urls.regular || urls.original)) handler.imagesPool.push({relatedSrc : [urls.original ? urls.original : urls.regular]});                      
            }
            
        } else console.log('bad response - cant recognize object - check KellyDPage.aDProgress.docLoader.parser.lastThreadReport');
        
        data.thread.response = '';  
        return true;
            
    }
}

KellyPageWatchdog.filters.push(KellyRecorderFilterPixiv);
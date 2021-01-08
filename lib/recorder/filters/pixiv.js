KellyRecorderFilterPixiv = new Object();
KellyRecorderFilterPixiv.manifest = {host : 'pixiv.net', detectionLvl : ['imageAny', 'imageByDocument']};
KellyRecorderFilterPixiv.urlRegExp = new RegExp(
    "(^|['\"\b\t\r\n])((http|https):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
    ,"g"
);

KellyRecorderFilterPixiv.parseImagesDocByDriver = function(handler, thread) {
    if (handler.url.indexOf('pixiv') != -1 ) {
            
        var urls = thread.response.match(KellyRecorderFilterPixiv.urlRegExp);
        if (urls) urls.forEach(function(url) {
            if (url.indexOf('img') != -1 && url.indexOf('p0.') != -1) handler.imagesPool.push({relatedSrc : [url.replace('"', '').replace('\'', '').trim()]});
        });
        
        thread.response = '';
        return true;
    } 
}

KellyPageWatchdog.validators.push({url : 'pixiv', patterns : [[new RegExp("img-master|img-original", "g"), 'imageAny']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterPixiv);
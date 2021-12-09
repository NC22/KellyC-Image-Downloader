KellyRecorderFilterDA = new Object();
KellyRecorderFilterDA.manifest = {host : 'deviantart.com', detectionLvl : ['imageAny', 'imageByDocument']};
KellyRecorderFilterDA.parseImagesDocByDriver = function(handler, thread) {
    
    if (handler.url.indexOf('deviantart') != -1) {
        
        try {
                
            var begin = 'window.__INITIAL_STATE__ = JSON.parse("', end = '")';
            var da = JSON.parse(JSON.parse('"' + thread.response.substring( thread.response.lastIndexOf(begin) + begin.length, thread.response.lastIndexOf(end)) + '"')); 
            
            for (var daName in da['@@entities']['deviation'])  {
                var deviation =  da['@@entities']['deviation'][daName], mediaQuality = false;                   
                if (thread.job.url.indexOf(deviation.url) == -1) continue;
                
                deviation['media']['types'].forEach(function(type) {
                    if ((!mediaQuality || type.h > mediaQuality.h) && (type.c || type.t == 'gif')) mediaQuality = type;
                });
                
                var url = '';
                
                     if (mediaQuality && mediaQuality.c) url = deviation['media']['baseUri'] + '/' + mediaQuality.c.replace('<prettyName>', deviation['media']['prettyName'] ? deviation['media']['prettyName'] : '');
                else if (mediaQuality && mediaQuality.t == 'gif') url = mediaQuality.b;
                
                if (url) handler.imagesPool.push({relatedSrc : [url + '?token=' + deviation['media']['token'][0]]});
            }
            
       } catch (e) {
            console.log(e);
       }
           
       thread.response = ''; 
       return true;
    }
}

KellyPageWatchdog.validators.push({url : 'deviantart', patterns : [['images-wixmp', 'imageAny']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterDA);
KellyRecorderFilterJoyreactor = new Object();
KellyRecorderFilterJoyreactor.manifest = {host : ['joyreactor.cc', 'reactor.cc'], detectionLvl : ['imagePreview', 'imageOriginal']};
KellyRecorderFilterJoyreactor.addItemByDriver = function(handler, el, item) {
    
        if (handler.url.indexOf('reactor.cc') != -1) {
            
            if (el.tagName == 'IMG' && el.src && (el.src.indexOf('pics/post') != -1 || el.src.indexOf('pics/comment') != -1)) {
                var src = el.src.indexOf('full') == -1 ? el.src : el.src.replace('full/', '');
                if (src.indexOf('static') != -1) {
                    src = src.replace('static/', '');
                    src = src.substr(0, src.lastIndexOf('.') + 1) + 'gif';
                }
                
                var groups = ['imageOriginal'];
                     if (src.indexOf('comment/') != -1) groups.push('Comment');
                else if (src.indexOf('post/') != -1) groups.push('Post');
                
                handler.addSingleSrc(item, src, 'addSrcFromAttributes-src', el, 'imagePreview'); 
                handler.addSingleSrc(item, src.replace('comment/', 'comment/full/').replace('post/', 'post/full/'), 'addSrcFromAttributes-src', el, groups); 
                
                return item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;
            } else if (el.tagName == 'A' && el.href && el.href.indexOf('/full/') != -1) {
                
                return handler.addDriverAction.SKIP;
            }
            
        }
}

KellyPageWatchdog.filters.push(KellyRecorderFilterJoyreactor);
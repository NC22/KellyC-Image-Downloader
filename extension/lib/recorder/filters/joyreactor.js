KellyRecorderFilterJoyreactor = new Object();
KellyRecorderFilterJoyreactor.manifest = {host : ['joyreactor.cc', 'reactor.cc'], detectionLvl : ['imagePreview', 'imageOriginal']};
KellyRecorderFilterJoyreactor.addItemByDriver = function(handler, data) {
    
        if (handler.url.indexOf('reactor.cc') != -1) {
            
            if (data.el.tagName == 'IMG' && data.el.src && (data.el.src.indexOf('pics/post') != -1 || data.el.src.indexOf('pics/comment') != -1)) {
                var src = data.el.src.indexOf('full') == -1 ? data.el.src : data.el.src.replace('full/', '');
                if (src.indexOf('static') != -1) {
                    src = src.replace('static/', '');
                    src = src.substr(0, src.lastIndexOf('.') + 1) + 'gif';
                }
                
                var groups = ['imageOriginal'];
                     if (src.indexOf('comment/') != -1) groups.push('Comment');
                else if (src.indexOf('post/') != -1) groups.push('Post');
                
                handler.addSingleSrc(data.item, src, 'addSrcFromAttributes-src', data.el, 'imagePreview'); 
                handler.addSingleSrc(data.item, src.replace('comment/', 'comment/full/').replace('post/', 'post/full/'), 'addSrcFromAttributes-src', data.el, groups); 
                
                return data.item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;
            } else if (data.el.tagName == 'A' && data.el.href && data.el.href.indexOf('/full/') != -1) {
                
                return handler.addDriverAction.SKIP;
            }
            
        }
}

KellyPageWatchdog.filters.push(KellyRecorderFilterJoyreactor);
KellyRecorderFilterDiscord = new Object();
KellyRecorderFilterDiscord.manifest = {host : 'discord.com', detectionLvl : ['imageOriginal', 'imagePreview']};

KellyRecorderFilterDiscord.addItemByDriver = function(handler, data) {

    if (handler.url.indexOf('discord.com') == -1) return;
    
    if (data.el.tagName == 'DIV' && data.el.className.indexOf('imageWrapper') != -1) {
        
        var video = data.el.getElementsByTagName('VIDEO');
        if (video.length > 0) {
            
            handler.addSingleSrc(data.item, video[0].src, 'addSrcFromAttributes-src', video[0], ['imageOriginal']);
            handler.addSingleSrc(data.item, video[0].getAttribute('poster'), 'addSrcFromAttributes-src', data.el, ['imagePreview']);
            
        } else {
            
            var full = data.el.getElementsByTagName('A');
            var preview = data.el.getElementsByTagName('IMG');
            
            if (preview.length > 0) {
                handler.addSingleSrc(data.item, preview[0].src, 'addSrcFromAttributes-src', preview[0], ['imagePreview']);
            } else return handler.addDriverAction.SKIP;
            
            if (full.length > 0 && full[0].getAttribute('data-safe-src')) {
            
                var url = new URL(full[0].getAttribute('data-safe-src'));
                    url.searchParams.delete('height');
                    url.searchParams.delete('width');
                    
                handler.addSingleSrc(data.item, url.href, 'addSrcFromAttributes-src', full[0], ['imageOriginal']);
                console.log('erro ' + handler.lastError); 
                
                console.log(data.item);
            }
            
        }
        
        if (data.item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
        return handler.addDriverAction.ADD;
    } 
}

// KellyPageWatchdog.validators.push({url : 'discord.', host : 'discord.com', patterns : [['cdn.discordapp.com/attachments', 'imageOriginal'], ['&height=', 'imagePreview']]});

KellyPageWatchdog.filters.push(KellyRecorderFilterDiscord);
KellyRecorderFilterDiscord = new Object();
KellyRecorderFilterDiscord.manifest = {host : 'discord.com', detectionLvl : ['imageOriginal', 'imagePreview']};

KellyRecorderFilterDiscord.addItemByDriver = function(handler, data) {

    if (handler.url.indexOf('discord.com') == -1) return;
    
    if (data.el.tagName == 'IMG' && data.el.src.indexOf('&height=') != -1) {
        
        handler.addSingleSrc(data.item, data.el.src, 'addSrcFromAttributes-src', data.el, ['imagePreview']);
        handler.addSingleSrc(data.item, data.el.src.split('?')[0], 'addSrcFromAttributes-src', data.el, ['imageOriginal']);
        
        if (data.item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
        return handler.addDriverAction.ADD;
    }
}

// KellyPageWatchdog.validators.push({url : 'discord.', host : 'discord.com', patterns : [['cdn.discordapp.com/attachments', 'imageOriginal'], ['&height=', 'imagePreview']]});

KellyPageWatchdog.filters.push(KellyRecorderFilterDiscord);
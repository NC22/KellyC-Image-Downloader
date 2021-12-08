KellyRecorderFilterPikabu = {manifest : {host : 'pikabu.ru', detectionLvl : []}, defaultCat : false};
KellyRecorderFilterPikabu.validateByDriver = function(handler, item) {
    if (KellyRecorderFilterPikabu.defaultCat === false) {
        KellyRecorderFilterPikabu.defaultCat = KellyTools.getCamelWord(KellyTools.getElementText(document.querySelector('.saved-stories__category.button_success span')).toLowerCase());
    }
    
    if (handler.url.indexOf('pikabu.ru') == -1 || item.relatedSrc.length <= 0 || !item.relatedDoc || !item.relatedGroups) return;
    
    for (var i = 0; i < item.relatedSrc.length; i++) {
        if (item.relatedGroups[i] && item.relatedGroups[i].indexOf('imageOriginal') != -1) item.relatedGroups[i].push(KellyRecorderFilterPikabu.defaultCat);
    }
}

KellyPageWatchdog.validators.push({
    url : 'pikabu.ru', 
    host : 'pikabu.ru', 
    patterns : [
        ['images/previews_comm', 'imageAny'], 
        ['/post_img/', 'imageAny'], 
        ['post_img/big', 'imageOriginal'], 
        ['images/big_size_comm', 'imageOriginal']]
});

KellyPageWatchdog.filters.push(KellyRecorderFilterPikabu);

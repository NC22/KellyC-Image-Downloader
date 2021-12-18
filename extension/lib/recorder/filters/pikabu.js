KellyRecorderFilterPikabu = {manifest : {host : 'pikabu.ru', detectionLvl : []}};
KellyRecorderFilterPikabu.validateByDriver = function(handler, item) {
    if (handler.url.indexOf('pikabu.ru') == -1 || item.relatedSrc.length <= 0 || !item.relatedDoc || !item.relatedGroups) return;
    
    for (var i = 0; i < item.relatedSrc.length; i++) {
        if (!item.relatedGroups[i]) continue;
        
        // mark gifs as originals
        if (item.relatedSrc[i].indexOf('.gif') != -1 && item.relatedGroups[i].indexOf('imageAny') != -1) item.relatedGroups[i].push('imageOriginal');
        
        // detected bookmarks page, add curent selected folder
        if (handler.additionCats['pikabu_save'] && item.relatedGroups[i].indexOf('imageOriginal') != -1) item.relatedGroups[i].push('pikabu_save');
    }
}

KellyRecorderFilterPikabu.onStartRecord = function(handler, context) {
     if (handler.url.indexOf('pikabu.ru') == -1) return;
     handler.additionCats = {
        pikabu_comment : {name : 'Comment', color : '#b7dd99'},
        pikabu_post : {name : 'Post', color : '#b7dd99'},
     };
     
     var saveFolder = KellyTools.getCamelWord(KellyTools.getElementText(document.querySelector('.saved-stories__category.button_success span')).toLowerCase());
     if (saveFolder) handler.additionCats['pikabu_save'] = {name : saveFolder, color : '#8ac858', selected : 120, nameTpl : true};
}

KellyPageWatchdog.validators.push({
    url : 'pikabu.ru', 
    host : 'pikabu.ru', 
    patterns : [
        ['images/previews_comm', 'imageAny'], 
        ['/post_img/', 'imageAny'], 
        ['post_img/big', 'imageOriginal'], ['post_img', 'pikabu_post'], 
        ['images/big_size_comm', 'imageOriginal'], ['_comm', 'pikabu_comment'], ]
});

KellyPageWatchdog.filters.push(KellyRecorderFilterPikabu);

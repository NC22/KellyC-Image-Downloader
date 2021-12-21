KellyRecorderFilterPikabu = new Object();
KellyRecorderFilterPikabu.manifest = {host : 'pikabu.ru', detectionLvl : ['imageOriginal', 'imagePreview']}};

KellyRecorderFilterPikabu.validateByDriver = function(handler, data) {
    if (handler.url.indexOf('pikabu.ru') == -1 || data.item.relatedSrc.length <= 0 || !data.item.relatedDoc || !data.item.relatedGroups) return;
    
    for (var i = 0; i < data.item.relatedSrc.length; i++) {
        if (!data.item.relatedGroups[i]) continue;
        
        // mark gifs as originals
        if (data.item.relatedSrc[i].indexOf('.gif') != -1 && data.item.relatedGroups[i].indexOf('imageAny') != -1) data.item.relatedGroups[i].push('imageOriginal');
        
        // detected bookmarks page, add curent selected folder
        if (KellyRecorderFilterPikabu.dirName && data.item.relatedGroups[i].indexOf('imageOriginal') != -1) {
            
            data.item.relatedGroups[i].push('pikabu_' + KellyRecorderFilterPikabu.dirName);
        }
    }
}

KellyRecorderFilterPikabu.addCategory = function(self, recorder, el) {
    if (el) {
        var title = KellyTools.getCamelWord(KellyTools.getElementText(el.querySelector('span')).toLowerCase());
        if (title) {
            self.dirName = KellyTools.generateIdWord(title);
            recorder.additionCats['pikabu_' + self.dirName] = {name : title, color : '#8ac858', selected : 90, nameTpl : true};
        }
    }
};
     
KellyRecorderFilterPikabu.onStartRecord = function(handler, data) {
     if (handler.url.indexOf('pikabu.ru') == -1) return;
     handler.additionCats = {
        pikabu_comment : {name : 'Comment', color : '#b7dd99'},
        pikabu_post : {name : 'Post', color : '#b7dd99'},
     };
     KellyRecorderFilterPikabu.dirName = false; 
     KellyRecorderFilterPikabu.addCategory(KellyRecorderFilterPikabu, handler, document.querySelector('.saved-stories__category.button_success'));         
     if (!KellyRecorderFilterPikabu.onChangeFolder) {
         KellyRecorderFilterPikabu.onChangeFolder = function (e) {
             var folderBtn = KellyTools.getParentByClass(e.target, 'saved-stories__category');
             if (folderBtn) KellyRecorderFilterPikabu.addCategory(KellyRecorderFilterPikabu, handler, folderBtn);
         }
      
         document.addEventListener('click', KellyRecorderFilterPikabu.onChangeFolder);
     }
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
KellyRecorderFilterPikabu = new Object();
KellyRecorderFilterPikabu.manifest = {host : 'pikabu.ru', detectionLvl : ['imageOriginal', 'imagePreview']};

KellyRecorderFilterPikabu.onBeforeDownloadValidate = function(handler, data) {
    
    if (handler.url.indexOf('pikabu.ru') == -1) return;
    
    if (data.url.indexOf('#nsfw') != -1) {
        
        var byteArray = new Uint8Array( data.arrayBuffer );
        
        var result = KellyRecorderFilterPikabu.deNSFW.descramble(byteArray, parseInt(data.url.split('#nsfw')[1]));
        if (result.base64) {
            data.onReady(KellyTools.base64toBlob(result.base64, result.contentType), result.contentType);   
        } else {
            data.onReady(false, false, "Способ расшифровки NSFW не сработал - " + data.url);   
        } 
        
        byteArray = null;
        return true;
    }
    
}

KellyRecorderFilterPikabu.previewLoader = {
    work : [],
    all : [],
    images : [],
    done : 0,
    aborted : false,
    abort : function() {
        
        console.log('[KellyRecorderFilterPikabu] Decoder cleanup');
        
        KellyRecorderFilterPikabu.previewLoader.aborted = true;
        var works = KellyRecorderFilterPikabu.previewLoader.work;
        for (var i = 0; i < works.length; i++) {
            if (works[i].request) {
                console.log('[KellyRecorderFilterPikabu] stopped  [' + works[i].src + ']');
                works[i].request.abort();
            }
        }
        
        KellyRecorderFilterPikabu.previewLoader.done = 0;
        KellyRecorderFilterPikabu.previewLoader.work = [];
    },
    refresher : function(limit) {
        
        var info = document.getElementById('pikabu-decode-counter');
        info.innerText = 'Осталось расшифровать : ' + (KellyRecorderFilterPikabu.previewLoader.images.length + KellyRecorderFilterPikabu.previewLoader.work.length);
        
        if (KellyRecorderFilterPikabu.previewLoader.done >= limit) {
            K_FAV.updateImagesBlock();                
            K_FAV.updateImageGrid();
            KellyRecorderFilterPikabu.previewLoader.done = 0;
        }
    },
    run : function() {
        
        if (KellyRecorderFilterPikabu.previewLoader.aborted) return;
        
        var works = KellyRecorderFilterPikabu.previewLoader.work;
        if (works.length >= 3) return;
        
        var job = KellyRecorderFilterPikabu.previewLoader.images.pop();
        if (!job) {
            KellyRecorderFilterPikabu.previewLoader.refresher(1);
            if (KellyRecorderFilterPikabu.tooltip) KellyRecorderFilterPikabu.tooltip.show(false);
            return;
        }
        
        works.push(job);
        console.log('[KellyRecorderFilterPikabu] init work [' + job.src + ']');
        job.request = KellyTools.fetchRequest(job.src, {responseType : 'arrayBuffer'}, function(urlOrig, arrayBuffer, errorCode, errorText, controller) {
                
            job.request = false;
            var jobKey = works.indexOf(job);
            if (jobKey != -1) {
                works.splice(jobKey, 1);
            }
            
            if (arrayBuffer !== false) { 
            
                var byteArray = new Uint8Array( arrayBuffer );            
                var result = KellyRecorderFilterPikabu.deNSFW.descramble(byteArray, parseInt(job.src.split('#nsfw')[1]));
                if (result.base64) {
                    job.item.pImage = URL.createObjectURL(KellyTools.base64toBlob(result.base64, result.contentType));
                    console.log('[KellyRecorderFilterPikabu] Done ...  [' + job.src + ']');
                    KellyRecorderFilterPikabu.previewLoader.done++;
                    KellyRecorderFilterPikabu.previewLoader.refresher(10);
                    
                } else {
                    //data.self.aDProgress.addErrorItem(false, 'Decode ... Err base64 [' + job.imgEl.src + ']');
                    console.log('[KellyRecorderFilterPikabu] Decode ... Err base64  [' + job.src + ']');
                }
                
                byteArray = null;
            } else {
                //data.self.aDProgress.addErrorItem(false, 'Decode ... Err arrayBuffer [' + job.imgEl.src + ']');
                console.log('[KellyRecorderFilterPikabu] Decode ... Err arrayBuffer  [' + job.src + ']');
                
            }
            
            setTimeout(KellyRecorderFilterPikabu.previewLoader.run, 500);
        });
        
    },
    add : function(item) {
        
        if (KellyRecorderFilterPikabu.previewLoader.all.indexOf(item.id) != -1) return;
        
        KellyRecorderFilterPikabu.previewLoader.all.push(item.id);
        console.log('[KellyRecorderFilterPikabu] Decode ... [' + item.id + ']');
        //data.self.aDProgress.addErrorItem(false, 'Decode ... [' + imgEl.src + ']');
        
        KellyRecorderFilterPikabu.previewLoader.images.push({src : item.pImage, item : item});
        KellyRecorderFilterPikabu.previewLoader.run();
    },
    decodeCurrentPage : function() {
        
         KellyRecorderFilterPikabu.previewLoader.aborted = false;
         var dList = K_FAV.getGlobal('filtered');
         var items = K_FAV.getGlobal('fav').items;
         
         for (var i = KellyRecorderFilterPikabu.previewLoader.initData.startItem; i <= KellyRecorderFilterPikabu.previewLoader.initData.end; i++) {
             
             if (items[dList[i]].pImage.indexOf('#nsfw') != -1) {
                KellyRecorderFilterPikabu.previewLoader.add(items[dList[i]]);
            }
         }
         
         
        if (KellyRecorderFilterPikabu.tooltip) KellyRecorderFilterPikabu.tooltip.show(KellyRecorderFilterPikabu.previewLoader.images.length > 0);  
    }
    
}

KellyRecorderFilterPikabu.onUpdateImagesBlock = function(handler, data) {
       
    
    if (handler.url.indexOf('pikabu.ru') == -1) return;
    
     KellyRecorderFilterPikabu.previewLoader.initData = data;
     KellyRecorderFilterPikabu.previewLoader.decodeCurrentPage();
      
    
}

KellyRecorderFilterPikabu.onRecorderImagesShow = function(handler, data) {
    
    if (handler.url.indexOf('pikabu.ru') == -1) return;

    if (KellyDPage.cats['pikabu_nsfw'] && KellyDPage.cats['pikabu_nsfw'].id) {
        
            KellyRecorderFilterPikabu.tooltip = KellyTools.getNoticeTooltip(KellyDPage.env.hostClass, KellyDPage.env.className); 
            KellyRecorderFilterPikabu.tooltip.updateCfg({removeOnClose : false, closeByBody : false});
            
            KellyTools.setHTMLData(KellyRecorderFilterPikabu.tooltip.getContent(), '<div><b>Расшифровка превью контента : </b> [<a href="#" id="pikabu-decode-stop">Остановить</a>]</div><div id="pikabu-decode-counter">Инициализация...</div><div>На странице обнаружены <b>NSFW</b> картинки которые сайт отдает в зашифрованном виде, необязательно дожидатся расшифровки превью, данные будут дешифрованы при скачивании</div>'); 
            
            document.getElementById('pikabu-decode-stop').onclick = function() {
                
                if (this.getAttribute('data-stoped') == '1') {
                    
                    this.setAttribute('data-stoped', '0');
                    this.innerText = 'Остановить';
                    KellyRecorderFilterPikabu.previewLoader.all = [];
                    KellyRecorderFilterPikabu.previewLoader.decodeCurrentPage();
                   
                } else {
                    this.setAttribute('data-stoped', '1');
                    this.innerText = 'Начать';
                    KellyRecorderFilterPikabu.previewLoader.abort();
                }
                
            }
            
            // KellyRecorderFilterPikabu.tooltip.show(true);            
    }
}

KellyRecorderFilterPikabu.addItemByDriver = function(handler, data) {

    if (handler.url.indexOf('pikabu.ru') == -1) return;
    
    // protected image
    
    if (data.el.tagName == 'SOURCE' && data.el.getAttribute('type') == 'video/mp4' && data.el.src.indexOf('.mp4') != -1) {
                
        handler.addSingleSrc(data.item, data.el.src, 'srcVideo', data.el, ['pikabu_post_video']);
        if (data.item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
        return handler.addDriverAction.ADD;

    // catch decompiled item, order is important (must be upper common "article" detector)
    
    } else if (data.el.tagName == 'IMG' && data.el.getAttribute('data-src') && data.el.getAttribute('data-viewable')) {
        
        var dGroup = false;
        if (KellyTools.getParentByTag(data.el, 'ARTICLE')) {
            dGroup = 'pikabu_post_preview';
        } else if (KellyTools.getParentByClass(data.el, 'comment')) {
            dGroup = 'pikabu_comment';
        }
        
        if (dGroup !== false) {
        
            var pdata = data.el.getAttribute('data-src');
            var fdata = data.el.getAttribute('data-large-image');
            var fGroups = KellyRecorderFilterPikabu.getPostGroups(false);
            var pGroups = [];
                pGroups.push(dGroup);
            
            var marker = '';        
            if (data.el.getAttribute('data-scrambler-offset') !== null) {
                marker = '#nsfw' + data.el.getAttribute('data-scrambler-offset');
                fGroups.push('pikabu_nsfw');
                pGroups.push('pikabu_nsfw');
            }
            
            if (fdata && pdata && pdata.indexOf(fdata) == -1) { // large version exist (preview src != full src) -> add preview image to list
                handler.addSingleSrc(data.item, data.el.getAttribute('data-src') + marker, 'addSrcFromAttributes-src', data.el, pGroups);
            } else {
                fGroups.push(dGroup);
            }
            
            handler.addSingleSrc(data.item, data.el.getAttribute('data-large-image') + marker, 'addSrcFromAttributes-src', data.el, fGroups);  
            
            if (data.item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
            return handler.addDriverAction.ADD;
        }
        
    }
}

KellyRecorderFilterPikabu.getPostGroups = function(nsfw){
    
    var postGroups = ['pikabu_post', 'imageOriginal'];
    if (KellyRecorderFilterPikabu.dirName) {            
        postGroups.push('pikabu_' + KellyRecorderFilterPikabu.dirName);
    }
    
    return postGroups;
}

KellyRecorderFilterPikabu.validateByDriver = function(handler, data) {
    if (handler.url.indexOf('pikabu.ru') == -1 || data.item.relatedSrc.length <= 0 || !data.item.relatedDoc || !data.item.relatedGroups) return;

    for (var i = 0; i < data.item.relatedSrc.length; i++) {
        
        if (!data.item.relatedGroups[i]) continue;
        
        // mark gifs \ vids as originals
        if (data.item.relatedSrc[i].indexOf('.gif') != -1 && data.item.relatedGroups[i].indexOf('imageAny') != -1) data.item.relatedGroups[i].push('imageOriginal');   
        if (data.item.relatedGroups[i].indexOf('srcVideo') != -1) data.item.relatedGroups[i].push('imageOriginal');   

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
            recorder.additionCats['pikabu_' + self.dirName] = {name : title, color : '#8ac858', selected : 120, nameTpl : true};
        }
    }
};
     
KellyRecorderFilterPikabu.onStartRecord = function(handler, data) {
     if (handler.url.indexOf('pikabu.ru') == -1) return;
     
     handler.additionCats = {
         
        pikabu_comment : {name : 'Comment', color : '#b7dd99', selected : 110},
        pikabu_post : {name : 'Post', color : '#b7dd99', selected : 111},
        pikabu_post_preview : {name : 'Post preview', color : '#b7dd99', selected : 100},
        pikabu_nsfw : {name : 'Encoded NSFW', color : '#ff0983'},
        pikabu_post_video : {name : 'Post Video', color : '#218bea'},
        
     };
     
     KellyRecorderFilterPikabu.wd = handler;
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
   
KellyRecorderFilterPikabu.deNSFW = {
    
    IMAGE_DATA_SEPARATOR : "\0\0\0\0scramble:",
    MIME_LENGTH : 20,
    SUBSTITUTE_MIN_LENGTH : 1e4, // minimal offset from file start
    
    descramble : function(byteArray, charCodeOffset) {

        var offset = KellyRecorderFilterPikabu.deNSFW.findEncodedImageBytesOffset(byteArray);
        
        if (0 === offset) {
            console.log('cant find offset entry for nsfw Pikabu item');
            return false; 
            
        }
        
        return KellyRecorderFilterPikabu.deNSFW.decodeImageBytes(byteArray, offset, charCodeOffset);
    },
    
    decodeImageBytes : function(byteArray, offset, charCodeOffset) {

        var mimeType = String.fromCharCode(...[...byteArray.slice(offset, offset + KellyRecorderFilterPikabu.deNSFW.MIME_LENGTH)].filter((t => t > 0)));
        var n = byteArray[offset + KellyRecorderFilterPikabu.deNSFW.MIME_LENGTH];
          
        byteArray = byteArray.slice(offset + KellyRecorderFilterPikabu.deNSFW.MIME_LENGTH + 1);
        
        if (1 === n) {
        
            const e = (t,e)=>(t % e + e) % e;
            
            for (var i = 0; i < byteArray.length; i++) {
                byteArray[i] = e(byteArray[i] - charCodeOffset, 256);
            }
        }
        
        const r = [];
        for (var o = 0; o < byteArray.length; o += 5e3) {
            r.push(String.fromCharCode.apply(null, Array.from(byteArray.slice(o, o + 5e3))));
        }
        
        return { contentType : mimeType, base64 : btoa(r.join("")) };
    },
    
    findEncodedImageBytesOffset : function(byteArray) {

        var charcodeMap = KellyRecorderFilterPikabu.deNSFW.IMAGE_DATA_SEPARATOR.split("").map((value => value.charCodeAt(0)));
        var startFrom = charcodeMap[0];
        
        byteArrayLoop: for (var i = KellyRecorderFilterPikabu.deNSFW.SUBSTITUTE_MIN_LENGTH; i < byteArray.length; i++) {
        
            if (byteArray[i] === startFrom) {
                
                
                // looks similar to indexOf(IMAGE_DATA_SEPARATOR) but for byteArray
                
                for (var separatorCharN = 1; separatorCharN < charcodeMap.length; separatorCharN++) {
                
                    if (byteArray[i + separatorCharN] !== charcodeMap[separatorCharN]) {
                        continue byteArrayLoop;
                    }
                }        
                
                return i + charcodeMap.length;
            }
            
        }
        
        return 0;
    }
}

KellyPageWatchdog.validators.push({
    url : 'pikabu.ru', 
    host : 'pikabu.ru', 
    patterns : [
        ['images/previews_comm', 'imageAny'], 
        ['/post_img/', 'imageAny']
   ]
});

KellyPageWatchdog.filters.push(KellyRecorderFilterPikabu);
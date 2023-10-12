KellyRecorderFilterPikabu = new Object();
KellyRecorderFilterPikabu.manifest = {host : 'pikabu.ru', detectionLvl : ['imageOriginal', 'imagePreview']};

KellyRecorderFilterDA.addItemByDriver = function(handler, data) {

    if (handler.url.indexOf('pikabu.ru') == -1) return;
    
    // protected image
    
    if (data.el.tagName == 'IMG' && data.el.getAttribute('data-scrambler-offset') !== null) {     
        
        if (!data.el.getAttribute('src')) return handler.addDriverAction.SKIP;
        
        handler.addSingleSrc(data.item, data.el.src, 'addSrcFromAttributes-src', data.el, ['pikabu_post_preview']);
        
        if (data.item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
        
        KellyTools.fetchRequest(data.el.getAttribute('data-large-image'), {responseType : 'arrayBuffer'}, function(urlOrig, arrayBuffer, errorCode, errorText, controller) {
            
            // console.log('fetch Pikabu nsfw item ' + data.el.getAttribute('data-large-image'));
                
            if (arrayBuffer === false) {          
            
                console.log('Fail to get arraybuffer for Pikabu nsfw item ' + data.el.getAttribute('data-large-image'));
                
            } else {
                   
                var byteArray = new Uint8Array( arrayBuffer );
                var base64 = KellyRecorderFilterPikabu.deNSFW.descramble(byteArray, parseInt(data.el.getAttribute('data-scrambler-offset')));
                
                if (base64 !== false && base64.length > 256) {
                    
                    var parentEl = data.el.parentElement;                    
                    var img = document.createElement('IMG');                    
                        img.setAttribute('kelly-nsfw-decompiled', 1);
                        img.src = base64;
                        img.style.display = 'none';
                        
                        parentEl.appendChild(img);
                }                
            }
            
        });
        
        return handler.addDriverAction.ADD;
        
    } else if (data.el.tagName == 'SOURCE' && data.el.getAttribute('type') == 'video/mp4' && data.el.src.indexOf('.mp4') != -1) {
                
        handler.addSingleSrc(data.item, data.el.src, 'srcVideo', data.el, ['pikabu_post_video']);
        if (data.item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
        return handler.addDriverAction.ADD;

    // catch decompiled item, oreder is important (must be upper common "article" detector)
    
    } else if (data.el.tagName == 'IMG' && data.el.getAttribute('kelly-nsfw-decompiled') == '1') {
        
        handler.addSingleSrc(data.item, data.el.src, 'addSrcFromAttributes-src', data.el, KellyRecorderFilterPikabu.getPostGroups(true));
        if (data.item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
        return handler.addDriverAction.ADD;
        
    } else if (data.el.tagName == 'IMG' && data.el.getAttribute('data-src') && data.el.getAttribute('data-viewable') && KellyTools.getParentByTag(data.el, 'ARTICLE')) {
        
        handler.addSingleSrc(data.item, data.el.getAttribute('data-src'), 'addSrcFromAttributes-src', data.el, ['pikabu_post_preview']);
        handler.addSingleSrc(data.item, data.el.getAttribute('data-large-image'), 'addSrcFromAttributes-src', data.el, KellyRecorderFilterPikabu.getPostGroups(false));  
        
        if (data.item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
        return handler.addDriverAction.ADD;
        
    }
}

KellyRecorderFilterPikabu.getPostGroups = function(nsfw){
    
    var postGroups = ['pikabu_post', 'imageOriginal'];
    if (KellyRecorderFilterPikabu.dirName) {            
        postGroups.push('pikabu_' + KellyRecorderFilterPikabu.dirName);
    }
    if (nsfw) {            
        postGroups.push('pikabu_nsfw');
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
        pikabu_post : {name : 'Post', color : '#b7dd99', selected : 110},
        pikabu_post_preview : {name : 'Post preview', color : '#b7dd99', selected : 100},
        pikabu_nsfw : {name : 'NSFW', color : '#ff0983'},
        pikabu_post_video : {name : 'Post Video', color : '#218bea'},
        
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
        
        return 'data:' + mimeType + ';base64,' + btoa(r.join(""));
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
        ['/post_img/', 'imageAny'], 
        ['images/big_size_comm', 'imageOriginal'], ['_comm', 'pikabu_comment'], ]
});

KellyPageWatchdog.filters.push(KellyRecorderFilterPikabu);
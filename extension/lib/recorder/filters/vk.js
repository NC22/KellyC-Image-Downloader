KellyRecorderFilterVK = new Object();
KellyRecorderFilterVK.manifest = {host : 'vk.com', detectionLvl : ['imagePreview', 'imageByDocument']};

KellyRecorderFilterVK.addHelperGroups = function(data) {
    if (data.item.relatedSrc.length <= 0) return;
    if (KellyTools.getParentByClass(data.el, 'reply_content')) {
        data.item.relatedGroups[0].push('vk_comment');
    } else {
        data.item.relatedGroups[0].push('vk_post');
    }
}

KellyRecorderFilterVK.addItemByDriver = function(handler, data) {
        
        // Document file separate page \ GIFS on page
        
        if (handler.url.indexOf('vk.com') != -1 && (data.el.classList.contains('page_doc_photo_href') || data.el.classList.contains('page_post_thumb_unsized'))) { 
               
            data.item.relatedDoc = data.el.href;      
            if (KellyTools.getParentByClass(data.el, 'reply_content')) {
                data.item.relatedDoc += '##FETCH_RULES##mark_comment=1';
            }
            
            if (data.el.getAttribute('data-thumb')) handler.addSingleSrc(data.item, data.el.getAttribute('data-thumb'), 'addSrcFromAttributes-src', data.el, 'imagePreview'); 
            else handler.addSrcFromStyle(data.el, data.item, 'imagePreview');
            
            KellyRecorderFilterVK.addHelperGroups(data);
            
            return data.item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;
        
        // Album items \ feed
        
        } else if (handler.url.indexOf('vk.com') != -1 && (data.el.getAttribute('data-id') || data.el.getAttribute('data-photo-id'))) {
            
            if (data.el.children[0] && data.el.children[0].tagName == 'IMG') {
                handler.addSingleSrc(data.item, data.el.children[0].src, 'addSrcFromAttributes-src', data.el.children[0], 'imagePreview'); 
            } else {
                handler.addSrcFromStyle(data.el, data.item, 'imagePreview'); 
            }
            
            if (data.item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
            
            // Mobile
            
            if (data.el.getAttribute('data-src_big')) {
                handler.addSingleSrc(data.item, data.el.getAttribute('data-src_big'), 'addSrcFromAttributes-src', data.el, 'imageOriginal');
                return handler.addDriverAction.ADD;
            }
                         
            // Desktop - OLD \ NEW design
            
            var query = '&module=feed', params = [], marks = '', relatedDoc = data.el.tagName == 'A' ? data.el : KellyTools.getElementByTag(data.el, 'A');

            if (data.el.getAttribute('data-list-id')) {
                
                params = [data.el.getAttribute('data-photo-id'), data.el.getAttribute('data-list-id')];
                
            } else {
                
                if (!relatedDoc || !relatedDoc.getAttribute('onclick') || relatedDoc.getAttribute('onclick').indexOf('showPhoto') == -1) return handler.addDriverAction.SKIP; 
                    
                var paramList = relatedDoc.getAttribute('onclick').split('{')[0], regexpParam = /[\'\"]([-A-Za-z0-9_]+)[\'\"]/g, match = null;
            
                while((match = regexpParam.exec(paramList)) !== null) { params.push(match[1]); }                  
                  
            }
            
            if (params.length > 1) {
                     if (params[1].indexOf('wall-') != -1) query = '&module=public&list=' + params[1];
                else if (params[1].indexOf('mail') != -1) query = '&module=im&list=' + params[1];
                else if (params[1]) query = '&module=feed&list=' + params[1];
            } else if (params.length <= 0) return handler.addDriverAction.SKIP;  
            
            if (KellyTools.getParentByClass(data.el, 'reply_content')) {
                marks += '&mark_comment=1';
            }
            
            KellyRecorderFilterVK.addHelperGroups(data); 
            
            data.item.relatedDoc = 'https://vk.com/al_photos.php?act=show&al=1&al_ad=0&dmcah=' + query + '&photo=' + params[0];
            data.item.relatedDoc += '##FETCH_RULES##method=POST&responseType=json&contentType=application/x-www-form-urlencoded&xRequestedWith=XMLHttpRequest' + marks;
            
            return handler.addDriverAction.ADD;
        } 
}

KellyRecorderFilterVK.onStartRecord = function(handler, data) {
     if (handler.url.indexOf('vk.com') == -1) return;
     
     handler.additionCats = {
        vk_comment : {name : 'Comment', color : '#b7dd99'},
        vk_post : {name : 'Post', color : '#b7dd99'},
     };
}

KellyRecorderFilterVK.parseImagesDocByDriver = function(handler, data) {
    if (handler.url.indexOf('vk.com') != -1 && typeof data.thread.response == 'object' && handler.url.indexOf('photo=') != -1) {
        
        var photoId = handler.url.split('photo=');                
            photoId = photoId.length == 2 ? photoId[1] : false;
            
        var findSrc = function(response) { 
            if (!response) return;
            
            if (typeof response['id'] != 'undefined' && response['id'] == photoId) {
                     if (typeof response['w_src'] != 'undefined') return response['w_src']; 
                else if (typeof response['y_src'] != 'undefined') return response['y_src'];
                else if (typeof response['z_src'] != 'undefined') return response['z_src'];                         
                else if (typeof response['x_src'] != 'undefined') return response['x_src'];
                else return;
            }

            for (var name in response) {
                if (typeof response[name] == 'object') {
                   var result = findSrc(response[name]);
                   if (result) return result;
                }
             }
        }
        
        var image = findSrc(data.thread.response);                
        if (image) handler.imagesPool.push({relatedSrc : [image], relatedGroups : data.thread.rules.indexOf('mark_comment=1') != -1 ? [['vk_comment']] : []});
        
        data.thread.response = ''; 
        return true;
        
    } else if (handler.url.indexOf('vk.com/doc') != -1 && typeof data.thread.response == 'string' && handler.url.indexOf('hash=') != -1) {
        
        data.thread.loadDoc = KellyTools.val(KellyTools.validateHtmlDoc(data.thread.response), 'html');
        var image = data.thread.loadDoc.querySelector('center img');
        if (image) handler.imagesPool.push({relatedSrc : [image.getAttribute('src')], relatedGroups : data.thread.rules.indexOf('mark_comment=1') != -1 ? [['vk_comment']] : []});
        
        data.thread.response = '';  
        return true;           
    } 
}

KellyPageWatchdog.filters.push(KellyRecorderFilterVK);
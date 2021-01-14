KellyRecorderFilterVK = new Object();
KellyRecorderFilterVK.manifest = {host : 'vk.com', detectionLvl : ['imagePreview', 'imageByDocument']};
KellyRecorderFilterVK.addItemByDriver = function(handler, el, item) {
    
        if (handler.url.indexOf('vk.com') != -1 && (el.classList.contains('page_doc_photo_href') || el.classList.contains('page_post_thumb_unsized'))) { 
               
            item.relatedDoc = el.href;      
            if (KellyTools.getParentByClass(el, 'reply_content')) item.relatedDoc += '##FETCH_RULES##mark_comment=1';
            if (el.getAttribute('data-thumb')) handler.addSingleSrc(item, el.getAttribute('data-thumb'), 'addSrcFromAttributes-src', el, 'imagePreview'); 
            else handler.addSrcFromStyle(el, item, 'imagePreview');
            
            return item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;
            
        } else if (handler.url.indexOf('vk.com') != -1 && (el.getAttribute('data-id') || el.getAttribute('data-photo-id'))) {
            
            handler.addSrcFromStyle(el, item, 'imagePreview'); 
            if (item.relatedSrc.length <= 0) return handler.addDriverAction.SKIP;
            
            var query = '', marks = '';
            
            if (el.getAttribute('onclick') && el.getAttribute('onclick').indexOf('showPhoto') != -1) {
                
                var paramList = el.getAttribute('onclick').split('{')[0], params = [], regexpParam = /[\'\"]([-A-Za-z0-9_]+)[\'\"]/g, match = null;
            
                while((match = regexpParam.exec(paramList)) !== null) { params.push(match[1]); }
                                
                if (params.length > 1) {
                         if (params[1].indexOf('wall-') != -1) query = '&module=public&list=' + params[1];
                    else if (params[1].indexOf('mail') != -1) query = '&module=im&list=' + params[1];
                }
            }
            
            if (!query) query = '&module=feed'; 
            query += '&photo=' + (el.getAttribute('data-photo-id') ? el.getAttribute('data-photo-id') : el.getAttribute('data-id'));
            query = 'act=show&al=1&al_ad=0&dmcah=' + query;

            if (KellyTools.getParentByClass(el, 'reply_content')) marks += '&mark_comment=1';
                    
            item.relatedDoc = 'https://vk.com/al_photos.php?' + query;
            item.relatedDoc += '##FETCH_RULES##method=POST&responseType=json&contentType=application/x-www-form-urlencoded&xRequestedWith=XMLHttpRequest' + marks;

            return handler.addDriverAction.ADD;
        } 
}

KellyRecorderFilterVK.parseImagesDocByDriver = function(handler, thread) {
    
        if (handler.url.indexOf('vk.com') != -1 && typeof thread.response == 'object' && handler.url.indexOf('photo=') != -1) {
            
            var photoId = handler.url.split('photo=');                
                photoId = photoId.length == 2 ? photoId[1] : false;
                
            var findSrc = function(data) { 
                if (!data) return;
                
                if (typeof data['id'] != 'undefined' && data['id'] == photoId) {
                         if (typeof data['w_src'] != 'undefined') return data['w_src']; 
                    else if (typeof data['y_src'] != 'undefined') return data['y_src'];
                    else if (typeof data['z_src'] != 'undefined') return data['z_src'];                         
                    else if (typeof data['x_src'] != 'undefined') return data['x_src'];
                    else return;
                }

                for (var name in data) {
                    if (typeof data[name] == 'object') {
                       var result = findSrc(data[name]);
                       if (result) return result;
                    }
                 }
            }
            
            var image = findSrc(thread.response);                
            if (image) handler.imagesPool.push({relatedSrc : [image], relatedGroups : thread.rules.indexOf('mark_comment=1') != -1 ? [['vkComment']] : []});
            
            thread.response = ''; 
            return true;
            
        } else if (handler.url.indexOf('vk.com/doc') != -1 && typeof thread.response == 'string' && handler.url.indexOf('hash=') != -1) {
            
            thread.loadDoc = KellyTools.val(KellyTools.validateHtmlDoc(thread.response), 'html');
            var image = thread.loadDoc.querySelector('center img');
            if (image) handler.imagesPool.push({relatedSrc : [image.getAttribute('src')], relatedGroups : thread.rules.indexOf('mark_comment=1') != -1 ? [['vkComment']] : []});
            
            thread.response = '';  
            return true;           
        } 
}

KellyPageWatchdog.filters.push(KellyRecorderFilterVK);
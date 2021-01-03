function KellyPageWatchdog(cfg) 
{
    var handler = this;
    var lng = KellyLoc;
    var updateAF = true;
    var addDriverAction = {SKIP : 1, ADD : 2, CONTINUE : 3};
    
    // video items partly supported (SOURCE tag only, viewer functional is limited)
    this.videoDetect = true;
    
    this.recorder = false;
    this.recorderTick = false;
    
    /* 
        array of founded images on page before they sended to background global pool 
        
        object 
            {
              relatedSrc : [array of strings (links)], 
              relatedGroups : [array of [srcIndex => [array of group names] ...]],
              referrer : string - current host
           }
     */
     
    this.imagesPool = []; 
    this.srcs = []; // list of all added relatedSrc strings during record process, to prevent dublicates
    
    // todo implement srcset attribute parsing
    /*
        skip 1x1 els, check before send to bg to prevent lazyload image data   
        if (tagName == 'img' && el.naturalHeight !== 0) 
        
    */
    // context for parser functions
    
    this.url = window.location.href;
    this.host = window.location.origin;
    
    this.catsAdded = false;
    
    this.debug = true;
   
    // todo - перенести правила отдельных сайтов в твики
    //  string.match(/\bhttp?::\/\/\S+/gi);
    
    var urlRegExp = new RegExp(
        "(^|['\"\b\t\r\n])((http|https):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
        ,"g"
    );
    
    this.bannedUrls = ['counter.yadro.ru'];
   
    // possible addition groups for context urls
    
    this.requestCatsByDriver = function() { 
    
    }
        
    // parse or pre-validate requested related document
    //
    // thread - thread.job.url - requested url - same as handler.url
    //          thread.response - response data string | object - depends on responseType - need to be setted as string with image elements, according to driver pattern to proper image detection
    //
    // thread.loadDoc - document that will be parsed on conteined images - can be setted instead thread.response 
    //
    
    this.parseImagesDocByDriver = function(thread) {
        
        // KellyDPage.aDProgress.docLoader.parser.lastThreadReport.response
        if (handler.debug) handler.lastThreadReport = thread;
        for (var i = 0; i < KellyPageWatchdog.tweaks.length; i++) if (KellyPageWatchdog.tweaks[i].parseImagesDocByDriver(thread)) return;
        
        if (handler.url.indexOf('pixiv') != -1 ) {
            
            var urls = thread.response.match(urlRegExp);
            if (urls) urls.forEach(function(url) {
                if (url.indexOf('img') != -1 && url.indexOf('p0.') != -1) handler.imagesPool.push({relatedSrc : [url.replace('"', '').replace('\'', '').trim()]});
            });
            
            thread.response = '';
            
        } else if (handler.url.indexOf('patreon') != -1) {
                
            // todo
            // var begin = '"post": {', end = '"links": {';
            // var da = JSON.parse(JSON.parse('"' +  + '"')); 
            // "included": [
            // console.log(thread.response.substring( thread.response.lastIndexOf(begin) + begin.length, thread.response.lastIndexOf(end)));
            
            thread.response = '';
        } else if (handler.url.indexOf('instagram') != -1){ 
                    
            try {
                var begin = '{"graphql":', end = '});</script>', mediaQuality = false;
                
                handler.lastThreadJson = JSON.parse(thread.response.substring( thread.response.indexOf(begin) + begin.length, thread.response.indexOf(end)));
                handler.lastThreadJson.shortcode_media.display_resources.forEach(function(srcData) {
                    if (!mediaQuality || srcData.config_height > mediaQuality.config_height) mediaQuality = srcData;
                });
                
                if (mediaQuality) handler.imagesPool.push({relatedSrc : [mediaQuality.src]});
                
           } catch (e) {
                console.log(e);
           }
           
        } else if (handler.url.indexOf('deviantart') != -1) {
            
            try {
                
                var begin = 'window.__INITIAL_STATE__ = JSON.parse("', end = '")';
                var da = JSON.parse(JSON.parse('"' + thread.response.substring( thread.response.lastIndexOf(begin) + begin.length, thread.response.lastIndexOf(end)) + '"')); 
                
                for (var daName in da['@@entities']['deviation'])  {
                    var deviation =  da['@@entities']['deviation'][daName], mediaQuality = false;                   
                    if (thread.job.url.indexOf(deviation.url) == -1) continue;
                    
                    deviation['media']['types'].forEach(function(type) {
                        if ((!mediaQuality || type.h > mediaQuality.h) && (type.c || type.t == 'gif')) mediaQuality = type;
                    });
                    
                    var url = '';
                    
                         if (mediaQuality && mediaQuality.c) url = deviation['media']['baseUri'] + '/' + mediaQuality.c.replace('<prettyName>', deviation['media']['prettyName'] ? deviation['media']['prettyName'] : '');
                    else if (mediaQuality && mediaQuality.t == 'gif') url = mediaQuality.b;
                    
                    if (url) handler.imagesPool.push({relatedSrc : [url + '?token=' + deviation['media']['token'][0]]});
                }                
                
           } catch (e) {
                console.log(e);
           }
           
           thread.response = ''; 
           
        } else if (handler.url.indexOf('vk.com') != -1 && typeof thread.response == 'object' && handler.url.indexOf('photo=') != -1) {
            
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
            
        } else if (handler.url.indexOf('vk.com/doc') != -1 && typeof thread.response == 'string' && handler.url.indexOf('hash=') != -1) {
            
            thread.loadDoc = KellyTools.val(KellyTools.validateHtmlDoc(thread.response), 'html');
            var image = thread.loadDoc.querySelector('center img');
            if (image) handler.imagesPool.push({relatedSrc : [image.getAttribute('src')], relatedGroups : thread.rules.indexOf('mark_comment=1') != -1 ? [['vkComment']] : []});
            
            thread.response = ''; 
            
        } else if (handler.url.indexOf('artstation') != -1) {
            
            var meta = thread.response.match(/<\meta name="twitter:image"([\s\S]*?)>/g);
            if (meta) {                
                var image = KellyTools.val('<div>' + meta[0] + '</div>', 'html').querySelector('meta[name="twitter:image"]');
                if (image) image = image.getAttribute('content');
                if (image) handler.imagesPool.push({relatedSrc : [image]});
            }
            
            thread.response = ''; 
        }
        
    }
    
    // passes throw all elements on document - el current scanned element
    // return [true] if element data was setted by driver (src + related document)
    
    this.addItemByDriver = function(el, item) {
        
        for (var i = 0; i < KellyPageWatchdog.tweaks.length; i++) if (KellyPageWatchdog.tweaks[i].addItemByDriver(el, item)) return;
        
        if (handler.url.indexOf('vk.com') != -1 && (el.classList.contains('page_doc_photo_href') || el.classList.contains('page_post_thumb_unsized'))) { 
               
            item.relatedDoc = el.href;      
            if (KellyTools.getParentByClass(el, 'reply_content')) item.relatedDoc += '##FETCH_RULES##mark_comment=1';
            if (el.getAttribute('data-thumb')) validateItemSrc(item, el.getAttribute('data-thumb'), 'addSrcFromAttributes-src', el, 'imagePreview'); else addSrcFromStyle(el, item, 'imagePreview');
            
            return item.relatedSrc.length > 0 ? addDriverAction.ADD : addDriverAction.SKIP;
            
        } else if (handler.url.indexOf('vk.com') != -1 && (el.getAttribute('data-id') || el.getAttribute('data-photo-id'))) {
            
            addSrcFromStyle(el, item, 'imagePreview'); 
            if (item.relatedSrc.length <= 0) return addDriverAction.SKIP;
            
            var query = '', marks = '';
            
            if (el.getAttribute('onclick') && el.getAttribute('onclick').indexOf('showPhoto') != -1) {
                
                var paramList = el.getAttribute('onclick').split('{')[0], params = [], regexpParam = /[\'\"](?<param>[-A-Za-z0-9_]+)[\'\"]/g, match = null;
            
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

            return addDriverAction.ADD;
            
        } else if (handler.url.indexOf('reddit.com') != -1 && el.getAttribute('src') && (el.getAttribute('src').indexOf('award_images') != -1 || el.getAttribute('src').indexOf('communityIcon') != -1)) {
            return addDriverAction.SKIP;
        }
        
        return addDriverAction.CONTINUE;
    }
    
    this.validateItemByDriver = function(item) { // thumb.php - hentai foundry
        
        var matches = [
            {url : 'pixiv', patterns : [[new RegExp("img-master|img-original", "g"), 'imageAny']]},
            {url : 'deviantart', patterns : [['images-wixmp', 'imageAny']]},
            {url : 'twitter', patterns : [['twimg.com/media', 'imageAny']]},
            {url : 'artstation', patterns : [['assets/images', 'imageAny']]},
            {url : 'hentai-foundry', patterns : [['thumb.php', 'imagePreview'], ['pictures.hentai-foundry.com/v', 'imageOriginal']]},
            {url : 'catface.ru', patterns : [['catface.ru/get', 'imageOriginal']]},
            {url : 'instagram', patterns : [['cdninstagram', 'imageAny']]},
            {url : 'reactor.cc', patterns : [['pics/post', 'imageAny'], ['pics/comment', 'imageAny'], ['pics/post/full', 'imageOriginal'], ['pics/comment/full', 'imageOriginal']]}, 
            {url : 'patreon.com', patterns : [['patreon-media/p/post/', 'imageAny']]},
            {url : 'pinterest', patterns : [['/originals/', 'imageOriginal']]},
            {url : 'reddit.com', patterns : [['preview.redd.it', 'imagePreview'], ['i.redd.it', 'imageOriginal']]},
            {url : 'pikabu.ru', patterns : [['images/previews_comm', 'imageAny'], ['/post_img/', 'imageAny'], ['post_img/big', 'imageOriginal'], ['images/big_size_comm', 'imageOriginal']] }, 
            {url : 'fanbox.cc', patterns : [['fanbox/public/images', 'imagePreview']]},
        ];
        
        var matchPatterns = function(src, patterns) {
            var groups = [];
            if (patterns) for (var i = 0; i < patterns.length; i++) {
                if ((typeof patterns[i][0] == 'string' && src.indexOf(patterns[i][0]) != -1) || (typeof patterns[i][0] == 'object' && src.match(patterns[i][0]) !== null)) {
                    groups.push(patterns[i][1]);
                }
            }
            
            return groups;
        }
        
        for (var i = 0; i < matches.length; i++) {
            if (handler.url.indexOf(matches[i].url) != -1) {  
                
                var group = [];
                if (item.relatedDoc) group = matchPatterns(item.relatedDoc, matches[i].patternsDoc);
                
                item.relatedSrc.forEach(function(src, index) {
                    if (group.length > 0) addItemSrcGroup(item, index, group); // group by relatedDoc
                    else { // check source by source
                        group = matchPatterns(src, matches[i].patterns);
                        if (group.length > 0) addItemSrcGroup(item, index, group);
                        
                        group = false;
                    }
                });
                
                               
                break;
            }
        }
        
        return item;
    }
        
    var getUrl = function(url) {
        
        url = url.trim();
        if (typeof url != 'string' && url.length < 4) return false;
        
        // data url detect | currently only binary images filtered
        if (url.indexOf('data:image') === 0) return url;
        
        // common url validator - todo add protect from bad chars
        if (url.indexOf('/') == -1) return false;
        
        return url;
    } 
    
    var addItemSrc = function(item, src, groups) {
        
        handler.srcs.push(src);
        
        var key = item.relatedSrc.length;
        item.relatedSrc.push(src);
        
        if (groups) addItemSrcGroup(item, key, groups);
        
        return key;
    }
    
    var addItemSrcGroup = function(item, srcIndex, groups) {
        
        if (!groups || !item) return false;
        
        if (!item.relatedGroups) item.relatedGroups = [];
        if (!item.relatedGroups[srcIndex]) item.relatedGroups[srcIndex] = [];
        
        groups = typeof groups == 'string' ? [groups] : groups;
        groups.forEach(function(group) {
            group = group.trim();
            if (group) item.relatedGroups[srcIndex].push(group);
        });
        
        return true;
    }
    
    /* 
        Validate source [src] url (link or dataurl) and adds it to an [item] object (validation based on related el tag name \ attribute from where string is taken (context))
        
        Maximum trusted element with minimum validation - [el] = an <img> element, context = "addSrcFromAttributes-src"
        
        Return true - on succesfull add src data to [item] object, and false on fail
    */
    
    var validateItemSrc = function(item, src, context, el, groups) {
        
        if (!src || typeof src != 'string') return false;

        src = getUrl(src);
        if (!src) return false;
        
        var ext = KellyTools.getUrlExt(src), sourceType = 'unknown', tagName = el.tagName.toLowerCase();
        
             if (tagName == 'source') sourceType = 'video';
        else if (tagName == 'img' || context == 'addSrcFromStyle') sourceType = 'image';
        
        if (sourceType == 'unknown') {
                                
            if (!ext) return false;
            
            var type = KellyTools.getMimeType(ext == 'dataUrl' ? src : ext);
            
                 if (type.indexOf('image') != -1) sourceType = 'untrust-image';
            else if (type.indexOf('media') != -1) sourceType = 'untrust-video';
        } 
        
        if (sourceType == 'video') {            
            if (!handler.videoDetect) return false;            
        } else if (sourceType == 'unknown') return false;
        
        
        // todo optional allow spaces in url for all contexts ? (usually spaces uses for explode srcset in lazyload \ gallery sets and could require additional logic)
        if (src.indexOf(' ') != -1) {            
            if (sourceType == 'untrust-image' || sourceType == 'untrust-video' || context != 'addSrcFromAttributes-src') return false;
        }
        
        if (ext != 'dataUrl') {
            for (var i = 0; i < handler.bannedUrls.length; i++) {
                if (src.indexOf(handler.bannedUrls[i]) != -1) return false;
            }
        }
        
        // garbage fix [random-simbols-https://test.ru/]
        
        if (ext != 'dataUrl' && (src.indexOf('http:') > 0 || src.indexOf('https:') > 0)) {
            
            if (src.indexOf('http://') != -1) {
                src = src.substring(src.indexOf('http://'));
            }
                   
            if (src.indexOf('https://') != -1) {
                src = src.substring(src.indexOf('https://'));
            }
        }
        
        // create absolute url for for relative links [ttt/test/te/st/t/t]
        
        if (ext != 'dataUrl' && src.indexOf('//') !== 0 && src.indexOf('http') !== 0) {
            src = handler.host + (src[0] == '/' ? '' : '/') + src;
        }
        
        // specify protocol for url with relative protocol [://test.ru/test/]
        
        if (ext != 'dataUrl' && src.indexOf('://') == -1) {
            
            if (src.indexOf('//') == 0) src = src.replace('//', '');
            
            src = (handler.url.indexOf('http://') === 0 ? 'http' : 'https') + '://' + src;
        }
        
        if (handler.srcs.indexOf(src) != -1) return false;
        addItemSrc(item, src, groups);     
        
        if (handler.debug) {
            if (!item.debugInfo) item.debugInfo = [];
            item.debugInfo.push(context);
        }

        return true;
    }  
    
    var addSrcFromAttributes = function(el, item) {
        
       if (!el.hasAttributes()) return;      
       
       // todo - exclude some common lazy-load dummy images for img elements
       
       for (var i = el.attributes.length - 1; i >= 0; i--) {
            
            if (['name', 'class', 'style', 'id', 'type', 'alt', 'title'].indexOf(el.attributes[i].name) != -1) continue;
            
            if (el.attributes[i].name == 'srcset') {
                
                var srcs = el.attributes[i].value.split(',');             
                for (var b = 0; b < srcs.length; b++) validateItemSrc(item, srcs[b].trim().split(' ')[0], 'addSrcFromAttributes-src', el);
                
            } else {
            
                var posibleLink = el.attributes[i].value; 
                if (item.relatedSrc.indexOf(posibleLink) == -1) validateItemSrc(item, posibleLink, 'addSrcFromAttributes-' + el.attributes[i].name, el);
            }
       }              
    }
            
    var addSrcFromStyle = function(el, item, bgGroup) {
        if (el.getAttribute('style') && el.getAttribute('style').indexOf('url(') != -1) {
            
            var link = el.getAttribute('style').match(/(?<=url\()(.*)(?=\))/g);
            if (link && typeof link[0] == 'string') link = link[0].replace(/['"]+/g, '').trim();
            
            validateItemSrc(item, link, 'addSrcFromStyle', el, bgGroup ? bgGroup : 'imageBg');
        }
    }
    
    var isValidLink = function(link) {
        return (link && link.href && link.href.indexOf('http') != -1) ? true : false;
    }
    
    var parsedItemAdd = function(item) {
        
        var item = handler.validateItemByDriver(item);
        if (!item) return false;
        
        handler.imagesPool.push(item);
        return item;
    }
    
    var parseItem = function(el) {
        
        var itemType = el.tagName.toLowerCase();
        if (['script', 'iframe', 'frame', 'include-fragment'].indexOf(itemType) != -1) return false;
        
        var item = {relatedDoc : false, relatedSrc : [], referrer : handler.host};
       
        var driverResult = handler.addItemByDriver(el, item);
        
             if (driverResult == addDriverAction.ADD) return parsedItemAdd(item);
        else if (driverResult == addDriverAction.SKIP) return false;  
        
        // exception for autodected common types els
        
        if (el.tagName == 'SOURCE' && el.parentElement && el.parentElement.tagName == 'VIDEO') {
            if (validateItemSrc(item, el.getAttribute('src'), 'srcVideo', el, 'srcVideo')) return parsedItemAdd(item);
            
            return false;  
        }
        
        if (el.tagName == 'LINK' && el.getAttribute('rel') && el.getAttribute('rel').indexOf('icon') != -1) {
            
            if (validateItemSrc(item, el.href ? el.href : el.src, 'srcIcon', el, 'srcIcon')) return parsedItemAdd(item);
            
            return false;  
        }
                 
        // common add src items process
                      
        addSrcFromStyle(el, item);                
        addSrcFromAttributes(el, item); 

        if (item.relatedSrc.length <= 0) return false;
    
        // detect related document
        
        var link = KellyTools.getParentByTag(el, 'A');
        if (link) addSrcFromAttributes(link, item);
        
        if (isValidLink(link)) {
            
            item.relatedDoc = link.href;
            
        } else {
            
            var parent = el, depth = 0, relatedDoc = parent ? parent.getElementsByTagName('A') : false;
            
            while (relatedDoc && relatedDoc.length <= 0 && depth < 15) {
                
                parent = parent.parentElement;
                relatedDoc = parent ? parent.getElementsByTagName('A') : false;
                depth++;
            }
            
            if (relatedDoc) {
                for (var i = 0; i < relatedDoc.length; i++) {
                    if (isValidLink(relatedDoc[i])) {
                        item.relatedDoc = relatedDoc[i].href;
                        addSrcFromAttributes(relatedDoc[i], item);
                        break;
                    }
                }
            }
        }
        
        return parsedItemAdd(item);
    }
    
    function resetPool() {
        handler.imagesPool = [];
        handler.srcs = [];
    }
    
    function constructor(cfg) {}
    
    // todo add parse frame childrens
    
    this.parseImages = function(dc) { // todo collect w\h info also if already loaded
        
        if (!dc) dc = document;
        
        var itemsNum = handler.imagesPool.length;
        if (dc != document) parseItem(dc);
        dc.querySelectorAll('*').forEach(parseItem);
        
        return handler.imagesPool.length - itemsNum;
    }        
        
    function getApiMessage(request, sender, callback) {

        var response = {
            method : request.method,
        }
        
        console.log(request);
        
        if (request.method == "parseImages") {       
            
            resetPool();
            handler.parseImages(); 
            response.url = handler.url;
            response.host = handler.host;
            response.images = handler.imagesPool;
            response.cats = handler.requestCatsByDriver();
            
            if (callback) callback(response); 

            resetPool();		
            
        } else if (request.method == "startRecord") {       
            
            resetPool();
            delayAddImages();
            initObserver();
            
            response.isRecorded = true;
            if (callback) callback(response); 			
            
        } else if (request.method == "stopRecord") {
            
            if (handler.observer) handler.observer.disconnect();
            if (handler.recorder) handler.recorder.parentElement.removeChild(handler.recorder);
            
            handler.observer = false;
            handler.recorder = false;
        }
    }
    
    function showRecorder(imagesNum) {
        
        if (handler.recorder) {
            
            KellyTools.getElementByTag(handler.recorder, 'div').innerText = imagesNum;
            
        } else {
            
            KellyTools.getBrowser().runtime.sendMessage({method: "getResources", items : ['recorder']}, function(request) {
                if (!request || !request.data.css) return false; 
                
                handler.recorder = document.createElement('div');
                handler.recorder.id = KellyTools.generateUniqId('kelly-recorder');
                
                KellyTools.addCss(KellyTools.generateUniqId('kelly-recorder-css'), KellyTools.replaceAll(request.data.css, '__UNIQID__', handler.recorder.id)); 

                KellyTools.setHTMLData(handler.recorder, 'REC<div>' + imagesNum + '</div>');
                document.body.appendChild(handler.recorder);
            });
        }
    }
    
    function delayAddImages(dc) {
        
        var newItems = handler.parseImages(dc);
        console.log('parsed - added ' + newItems);
        
        if (!updateAF) return false;        
        updateAF = false;
        handler.recorderTick = handler.recorderTick === false ? 0 : 500;
        
        setTimeout(function(){            
            updateAF = true;
            
            var cats = false;
            if (!handler.catsAdded) {
                cats = handler.requestCatsByDriver();
                handler.catsAdded = true;
            }
            
            KellyTools.getBrowser().runtime.sendMessage({method: "addRecord", images : handler.imagesPool, cats : cats, url : handler.url, host : handler.host}, function(response) {
                showRecorder(response.imagesNum);
            });   
            
            handler.imagesPool = [];
            
        }, handler.recorderTick);      
    }
    
    function addImgAttrObservers(list) {
        
        var onChange = function(mutations) {
             
            for (var i = 0; i < mutations.length; i++) {
               
                if (mutations[i].type === 'attributes' && mutations[i].attributeName.indexOf('src') != -1) {
                       parseItem(mutations[i].target); // mutations[i].target.getAttribute(mutations[i].attributeName)
                }
            }
        }

        for (var i = 0; i < list.length; i++) {
            handler.imgList.push([list[i], new MutationObserver(onChange)]);
            handler.imgList[handler.imgList.length-1][1].observe(list[i], {attributes: true});
        }
    }
    
    function initObserver() {
        
        if (!handler.observer) {
            handler.observer = new MutationObserver(function(mutations) {

                for (var i = 0; i < mutations.length; i++) {
                    
                    if (mutations[i].addedNodes.length > 0) {
                        
                        for (var b = 0; b < mutations[i].addedNodes.length; b++) {
                            
                            if (mutations[i].addedNodes[b] != handler.recorder &&
                                mutations[i].addedNodes[b].nodeType == Node.ELEMENT_NODE) {
                                    
                                    delayAddImages(mutations[i].addedNodes[b]);
                                    addImgAttrObservers(mutations[i].addedNodes[b].tagName == 'IMG' ? mutations[i].addedNodes[b] : mutations[i].addedNodes[b].getElementsByTagName('IMG'));
                            }                            
                        }
                        
                    } 
                }
            });
            
            handler.observer.observe(document.body, {childList: true, subtree: true});           
            handler.imgList = [];
            addImgAttrObservers(document.body.getElementsByTagName('IMG'));
        }
    }
    
    this.exec = function() {
        
        if (window.location !== window.parent.location) return;
            
        KellyTools.getBrowser().runtime.onMessage.addListener(getApiMessage);    
        KellyTools.getBrowser().runtime.sendMessage({method: "isRecorded"}, function(response) {
            
            if (response.isRecorded) {
                
                imagesNum = response.imagesNum;
                
                delayAddImages();  
                initObserver();
            }
        });
    }
    
    constructor(cfg);
}

// transport static methods 

KellyPageWatchdog.tweaks = [];
KellyPageWatchdog.validators = []; // add to validateItemByDriver
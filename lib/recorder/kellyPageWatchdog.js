function KellyPageWatchdog(cfg) 
{
    var handler = this;
    var lng = KellyLoc;
    var updateAF = true;
    
    this.addDriverAction = {SKIP : 1, ADD : 2, CONTINUE : 3};
    
    // video items partly supported (SOURCE tag OR when url extension is specified (mp4 \ webm), viewer functional is limited)
    this.videoDetect = true;
    
    this.recorder = false;
    this.recorderTick = false;
    
    /* 
        array of founded images on page before they sended to background global pool 
        
        object 
            {
              relatedSrc : [array of strings (links)], 
              relatedGroups : [array of [srcIndex => [array of group names] ...]],
              referrer : string - current loaction host | todo - add dinamic host related to url host
           }
     */
     
    this.imagesPool = []; 
    this.additionCats = []; // unused, maybe changed in future - if needed - must be setted from addition filter only once
    this.srcs = []; // list of all added relatedSrc strings during record process, to prevent dublicates
    
    // context for parser functions
    
    this.url = window.location.href;
    this.host = window.location.origin; 
          
    function constructor(cfg) {}
    
    // parse or pre-validate requested related document
    //
    // thread - thread.job.url - requested url - same as handler.url
    //          thread.response - response data string | object - depends on responseType - need to be setted as string with image elements, according to driver pattern to proper image detection
    //
    // thread.loadDoc - document that will be parsed on conteined images - can be setted instead thread.response 
    //
    // For debug see - KellyDPage.aDProgress.docLoader.parser.lastThreadReport = thread
    //
    
    this.parseImagesDocByDriver = function(thread) {
                
        if (KellyTools.DEBUG) handler.lastThreadReport = thread;
        for (var i = 0; i < KellyPageWatchdog.filters.length; i++) if (KellyPageWatchdog.filters[i].parseImagesDocByDriver && KellyPageWatchdog.filters[i].parseImagesDocByDriver(handler, thread)) return;               
    }
    
    // passes throw all elements on document - el current scanned element
    // return [true] if element data was setted by driver (src + related document)
    
    this.addItemByDriver = function(el, item) {
        
        var result = false;
        for (var i = 0; i < KellyPageWatchdog.filters.length; i++) {
            if (KellyPageWatchdog.filters[i].addItemByDriver) {
                result = KellyPageWatchdog.filters[i].addItemByDriver(handler, el, item);
                if (result) return result;
            }
        }
        
        return handler.addDriverAction.CONTINUE;
    }
    
    this.validateItemByDriver = function(item) {
        
        var matches = KellyPageWatchdog.validators;
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
        Validate source [src] url (link or dataurl) and add it to an [item] object (validation based on related el tag name \ attribute from where string is taken (context))        
        Maximum trusted element with minimum validation - [el] = an <img> element, context = "addSrcFromAttributes-src"
        
        Return true - on succesfull add src data to [item] object, and false on fail
    */
    
    this.addSingleSrc = function(item, src, context, el, groups) {
        
        if (!src || typeof src != 'string') return false;

        src = getUrl(src);
        if (!src) return false;
        
        var ext = KellyTools.getUrlExt(src), sourceType = 'unknown', tagName = el.tagName.toLowerCase();
        
             if (tagName == 'source') sourceType = 'video';
        else if (tagName == 'img' || context == 'addSrcFromStyle') sourceType = 'image'; // todo - optional reduse trust for img data attributes where context != 'addSrcFromAttributes-src'
          
        if (sourceType == 'unknown') {
                                
            if (!ext) return false;
            
            var type = KellyTools.getMimeType(ext == 'dataUrl' ? src : ext);
      
                 if (type.indexOf('image') != -1) sourceType = 'untrust-image';
            else if (type.indexOf('video') != -1) sourceType = 'untrust-video';
        } 
                  
      
        if (sourceType == 'video') {            
            if (!handler.videoDetect) return false;            
        } else if (sourceType == 'unknown') return false;
                
        // todo optional allow spaces in url for all contexts ? (usually spaces uses for gallery sets and could require additional logic)
        if (src.indexOf(' ') != -1) {            
            if (sourceType == 'untrust-image' || sourceType == 'untrust-video' || context != 'addSrcFromAttributes-src') return false;
        }
                        
        if (ext != 'dataUrl') {
            for (var i = 0; i < KellyPageWatchdog.bannedUrls.length; i++) {
                if (src.indexOf(KellyPageWatchdog.bannedUrls[i]) != -1) return false;
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
        var newIndex = addItemSrc(item, src, groups);     
        
        if (handler.debug) {
            if (!item.debugInfo) item.debugInfo = [];
            item.debugInfo.push(context);
        }        
        
        if (sourceType == 'untrust-video' || sourceType == 'video') addItemSrcGroup(item, newIndex, 'srcVideo');
        
        return true;
    }  
    
    this.addSrcFromAttributes = function(el, item, excludeAttributes) {
        
       if (!el.hasAttributes()) return;      
       
       excludeAttributes = excludeAttributes ? excludeAttributes : ['name', 'class', 'style', 'id', 'type', 'alt', 'title'];

       for (var i = el.attributes.length - 1; i >= 0; i--) {
            
            if (excludeAttributes.indexOf(el.attributes[i].name) != -1) continue;
            
            if (el.attributes[i].name == 'srcset') {
                
                var srcs = el.attributes[i].value.split(',');             
                for (var b = 0; b < srcs.length; b++) handler.addSingleSrc(item, srcs[b].trim().split(' ')[0], 'addSrcFromAttributes-src', el);
                
            } else {
            
                var posibleLink = el.attributes[i].value; 
                if (item.relatedSrc.indexOf(posibleLink) == -1) handler.addSingleSrc(item, posibleLink, 'addSrcFromAttributes-' + el.attributes[i].name, el);
            }
       }              
    }
            
    this.addSrcFromStyle = function(el, item, bgGroup) {
        if (el.getAttribute('style') && el.getAttribute('style').indexOf('url(') != -1) {
            
            var link = el.getAttribute('style').match(/(?<=url\()(.*)(?=\))/g);
            if (link && typeof link[0] == 'string') link = link[0].replace(/['"]+/g, '').trim();
            
            handler.addSingleSrc(item, link, 'addSrcFromStyle', el, bgGroup ? bgGroup : 'imageBg');
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
        
             if (driverResult == handler.addDriverAction.ADD) return parsedItemAdd(item);
        else if (driverResult == handler.addDriverAction.SKIP) return false;  
        
        // exception for autodected common types els
        
        if (el.tagName == 'SOURCE' && el.parentElement && el.parentElement.tagName == 'VIDEO') {
            if (handler.addSingleSrc(item, el.getAttribute('src'), 'srcVideo', el)) return parsedItemAdd(item);
            
            return false;  
        }
        
        if (el.tagName == 'LINK' && el.getAttribute('rel') && el.getAttribute('rel').indexOf('icon') != -1) {
            
            if (handler.addSingleSrc(item, el.href ? el.href : el.src, 'srcIcon', el, 'srcIcon')) return parsedItemAdd(item);
            
            return false;  
        }
                 
        // common add src items process
                      
        handler.addSrcFromStyle(el, item);                
        handler.addSrcFromAttributes(el, item); 

        if (item.relatedSrc.length <= 0) return false;
    
        // detect related document
        
        var link = KellyTools.getParentByTag(el, 'A');
        if (link) handler.addSrcFromAttributes(link, item);
        
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
                        handler.addSrcFromAttributes(relatedDoc[i], item);
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
        
        handler.log('[Message] - Method : ' + request.method);
        
        if (request.method == "parseImages") {       
            
            resetPool();
            handler.parseImages(); 
            response.url = handler.url;
            response.host = handler.host;
            response.images = handler.imagesPool;
            response.cats = handler.additionCats;
            
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
            
            response.isStopped = true;
            if (callback) callback(response); 
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
        handler.log('[DelayAddImages] Added items : ' + newItems);
        
        if (!updateAF) return false;        
        updateAF = false;
        handler.recorderTick = handler.recorderTick === false ? 0 : 500;
        
        setTimeout(function(){            
            updateAF = true;
            KellyTools.getBrowser().runtime.sendMessage({method: "addRecord", images : handler.imagesPool, cats : handler.additionCats, url : handler.url, host : handler.host}, function(response) {
                showRecorder(response.imagesNum);
            });   
            
            handler.imagesPool = [];
            handler.additionCats = [];
            
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
    
    this.log = function(text) {
        KellyTools.log(text);
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

/*
    addition filters to support sites. Can be added in [extension]\lib\recorder\filters folder
    
    available methods : 
    
    addItemByDriver(handler, el, item)
    parseImagesDocByDriver(handler, thread)
    
    
    todo - onBeforeStartParse - to optionaly preset some behaive in future - reduse img data params trust | support videos
*/

KellyPageWatchdog.filters = []; 
KellyPageWatchdog.validators = [];
KellyPageWatchdog.bannedUrls = [];
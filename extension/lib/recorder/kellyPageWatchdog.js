function KellyPageWatchdog(cfg) 
{
    var handler = this;
    var lng = KellyLoc;
    var updateAF = true;
    
    var directAccessEls = {'A' : ['href'], 'IMG' : ['src']};  // to get absolute link from img \ a elements 
    
    this.noticeTxt = '';
    this.directAccess = true; // MUST be disabled for extension tab and load related doc feature - because tab protocol will be chrome-extension://
    this.docLoader = false; // setted if parser used in context of doc loader from chrome-extension page
    
    this.addDriverAction = {SKIP : 1, ADD : 2, CONTINUE : 3};
    
    // todo - currently .origin used as referer - maybe more correct use full url of tab - handler.url
    // todo - exclude on____ events from attribute parse
    // todo - add left | right record icon position, "collect video" setting in Options
    // todo - rename handler.host to origin
    
    // video items partly supported (SOURCE tag OR when url extension is specified (mp4 \ webm), viewer functional is limited)
    this.videoDetect = true;
    
    this.observer = false; // if recorder tracking changes enabled by .exec method (DOM observer object)
    this.observerLocation = true; // update handler.url, host if observer enabled
    
    this.recorder = false;
    this.recorderTick = false;
    
    /* 
        array of founded images on page before they sended to background global pool 
        
        object 
            {
              relatedDoc : string (link) - related link taken from parent [A] element,
              relatedSrc : [array of strings (links)], 
              relatedGroups : [array of [srcIndex => [array of group names] ...]],
              relatedBounds : [array of [srcIndex => [width, height] ...]], -- todo - currently not used
              referrer : string - current loaction host | todo - add dinamic host related to url host
           }
     */
     
    this.imagesPool = []; 
    this.additionCats = {}; // unused, maybe changed in future - if needed - must be setted from addition filter only once
    this.srcs = []; // list of all added relatedSrc strings during record process, to prevent dublicates
    
    this.allowDuplicates = false; // ignore list of already added srcs and add anyway
    
    // imgList - img el attribute observers
    
    // context for parser functions    
          
    function constructor(cfg) {
        if (!cfg || !cfg.url) setDefaultLocation(); 
        else handler.setLocation(cfg);
    }
        
    function resetConfig() {
        
        // some changable by filters options | more will be added here
        
        handler.additionCats = {};
        handler.videoDetect = true; 
        handler.allowDuplicates = false;
    }
    
    function setDefaultLocation() {
        handler.setLocation({url : window.location.href, host : window.location.origin});   
        handler.log('Set location by window ' + handler.url);
    }
    
    this.setLocation = function(data) {
        
        // location used only for
        this.url = data.url;
        this.host = data.host; // host = origin - used as referer - referrer : handler.host
        this.hostname = false;
        
        if (this.host) {
            this.hostname = KellyTools.getLocationFromUrl(handler.host).hostname;
            
            if (typeof handler.hostname == 'undefined') {
                handler.hostname = false;
            } else {            
                if (handler.hostname.indexOf('www.') === 0) handler.hostname = handler.hostname.replace('www.', '');
            }
        }
        
        handler.filterCallback('onInitLocation', data);
    }
    
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

        return handler.filterCallback('parseImagesDocByDriver', {thread : thread}, true);
    }
    
    // passes throw all elements on document - el current scanned element
    // return [true] if element data was setted by driver (src + related document)
    
    this.addItemByDriver = function(el, item) {
        
        var result = handler.filterCallback('addItemByDriver', {el : el, item : item}, true);
        
        return (typeof result != 'undefined') ? result : handler.addDriverAction.CONTINUE;
    }
    
    this.validateItemByDriver = function(item) {
        
        var matches = handler.customValidators ? handler.customValidators : KellyPageWatchdog.validators;
        
        // check match src with patterns array [pattern = [Pattern string or RegExp object, Resul group name], pattern, pattern ... ]

        var matchPatterns = function(src, patterns) {
            
            var groups = [];
            
            if (patterns) {
                
                for (var i = 0; i < patterns.length; i++) {
                    if ((typeof patterns[i][0] == 'string' && src.indexOf(patterns[i][0]) != -1) || 
                        (typeof patterns[i][0] == 'object' && src.match(patterns[i][0]) !== null)) {
                        groups.push(patterns[i][1]);
                    }
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
                        
                        group = [];
                    }
                });                
                               
                break;
            }
        }
        
        if (handler.filterCallback('validateByDriver', {item : item}, true) === false) return false;
        return item;
    }
    
    var getBlobConverter = function(w, h) {
        
        if (!handler.blobConverter) handler.blobConverter = document.createElement('canvas');
        
            handler.blobConverter.width = w;				
            handler.blobConverter.height = h;
            handler.blobConverter.getContext('2d').clearRect(0, 0, w, h);
            
        return handler.blobConverter;
    }
    
    var getUrl = function(url) {
        
        url = url.trim();
        if (typeof url != 'string' && url.length < 4) return false;
        
        // data url detect | currently only binary images filtered
        
             if (url.indexOf('data:image') === 0) return url;
        else if (url.indexOf('blob:') === 0) return url;
            
        
        // common url validator - todo add protect from bad chars
        if (url.indexOf('/') == -1) return false;
        
        return url;
    } 
     
    var addItemSrc = function(item, src, groups) {
        
        if (src.indexOf('data:') === 0 && src.length > 280) {
           handler.srcs.push(src.substr(src.length-258, 258));
        } else {
           handler.srcs.push(src); 
        }
         
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
    
    var lastError = function(error) {
            
        handler.lastError = error;
        return false;
    }
    
    /* 
        Validate source [src] url (link or dataurl) and add it to an [item] object (validation based on related el tag name \ attribute from where string is taken (context))        
        Maximum trusted element with minimum validation - [el] = an <img> element, context = "addSrcFromAttributes-src"
        
        Return true - on succesfull add src data to [item] object, and false on fail
    */
    
    this.addSingleSrc = function(item, src, context, el, groups) {
        
        handler.lastError = false;
        if (!src || typeof src != 'string') return lastError('empty string');

        var tmpSrc = getUrl(src);
        if (!tmpSrc) return lastError('fail to get url from string ' + src);
        
        src = tmpSrc;
        var ext = KellyTools.getUrlExt(src), sourceType = 'unknown', tagName = el.tagName.toLowerCase();        
        
        if (src.indexOf('blob:') === 0) { // todo - optional disable blob detection
            
            if (tagName == 'img') {
                
                // if (handler.srcs.indexOf(src) !== -1) return false;                
                // handler.srcs.push(src);
                
                var converter = getBlobConverter(el.naturalWidth, el.naturalHeight);
                    converter.getContext('2d').drawImage(el, 0, 0, el.naturalWidth, el.naturalHeight, 0, 0, el.naturalWidth, el.naturalHeight);
                
                src = converter.toDataURL();
                ext = 'dataUrl';
                
            } else return lastError('unknown blob el tag');
        }
        
             if (tagName == 'source') sourceType = 'video';
        else if (tagName == 'img' || context == 'addSrcFromStyle') sourceType = 'image'; // todo - optional reduse trust for img data attributes where context != 'addSrcFromAttributes-src'
          
        if (sourceType == 'unknown') {
                                
            if (!ext) return lastError('extension not specified for unknown source type');
            
            var type = KellyTools.getMimeType(ext == 'dataUrl' ? src : ext);
      
                 if (type.indexOf('image') != -1) sourceType = 'untrust-image';
            else if (type.indexOf('video') != -1) sourceType = 'untrust-video';
        }      
      
        if (sourceType == 'video') {            
            if (!handler.videoDetect) return lastError('video detection not supported');            
        } else if (sourceType == 'unknown') return lastError('element type is untrusted and no media extension is specified');
                
        // todo optional allow spaces in url for all contexts ? (usually spaces uses for gallery sets and could require additional logic)
        if (src.indexOf(' ') != -1) {            
            if (sourceType == 'untrust-image' || sourceType == 'untrust-video' || context != 'addSrcFromAttributes-src') return lastError('found spaces in parsed url but its not image or src-set');
        }
                        
        if (ext != 'dataUrl') {
            for (var i = 0; i < KellyPageWatchdog.bannedUrls.length; i++) {
                if (src.indexOf(KellyPageWatchdog.bannedUrls[i]) != -1) return lastError('image url is blacklisted');
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
        
        if (!handler.allowDuplicates) {
                 if (ext == 'dataUrl' && handler.srcs.indexOf(src.substr(0, 258)) != -1) return lastError('dataUrl already added');
            else if (handler.srcs.indexOf(src) != -1) return lastError('src already added ' + src);
        }
        
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
       
       excludeAttributes = excludeAttributes ? excludeAttributes : ['name', 'class', 'style', 'id', 'type', 'alt', 'title', 'data-md5'];

       for (var i = el.attributes.length - 1; i >= 0; i--) {
            
            if (excludeAttributes.indexOf(el.attributes[i].name) != -1) continue;
            
            if (el.attributes[i].name == 'srcset') {
                
                var regexp = /([^ ]+)[ ]+([0-9]+)/g, matches = null;
                while ((matches = regexp.exec(el.attributes[i].value)) !== null) {
                    handler.addSingleSrc(item, matches[1].trim(), 'addSrcFromAttributes-src', el, 'imageSrcSet');
                }
                
            } else {
            
                var posibleLink = el.attributes[i].value;
                               
                if (handler.directAccess && directAccessEls[el.tagName] && directAccessEls[el.tagName].indexOf(el.attributes[i].name) != -1) {
                    posibleLink = el[el.attributes[i].name];
                }
                
                if (item.relatedSrc.indexOf(posibleLink) == -1) handler.addSingleSrc(item, posibleLink, 'addSrcFromAttributes-' + el.attributes[i].name, el);
            }
       }              
    }
            
    this.addSrcFromStyle = function(el, item, bgGroup) {
        if (el.getAttribute('style') && el.getAttribute('style').indexOf('url(') != -1) {
            var styleRegExp = /url\((.*?)\)/g, styleUrlData = styleRegExp.exec(el.getAttribute('style')), src = '';
            if (styleUrlData !== null && typeof styleUrlData[1] == 'string') src = styleUrlData[1].replace(/['"]+/g, '').trim();
            
            handler.addSingleSrc(item, src, 'addSrcFromStyle', el, bgGroup ? bgGroup : 'imageBg');
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
        if (['script', 'iframe', 'frame', 'include-fragment', 'svg'].indexOf(itemType) != -1) return false;
        
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
        
        /*
        if (el.tagName == 'IMG') {
            console.log('test ' + el.getAttribute('src'));
            
            handler.addSingleSrc(item, el.getAttribute('src'), 'addSrcFromAttributes-src', el);
            console.log(handler.lastError);
            console.log(el);
            console.log(item);
        }
        */
        
        if (item.relatedSrc.length <= 0) return false;
    
        // detect related document - common case - <a href="RELATED DOC"> ... <> ... <img> ... </> ... </a>
        
        var link = KellyTools.getParentByTag(el, 'A');
        if (link) handler.addSrcFromAttributes(link, item);
        
        if (isValidLink(link)) {
            
            item.relatedDoc = link.href;
            
        } else {
            
            // search first related link for [Image Item] in parents and in [Image Item] itself [  (max. 15)  pra-pra-parent ... pra-parent ... parent ...  [ [Image Item] ]   ]
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

    this.notice = function(txt) { 
        var notice = document.getElementById(handler.recorder.id + '-notice');
        handler.noticeTxt = (typeof txt == 'string' && txt.length > 0) ? txt : '';

        if (!notice) return;        
        if (handler.noticeTxt.length > 0) {            
            notice.innerText = handler.noticeTxt;
            notice.style.display = 'block';            
        } else {
            notice.style.display = 'none';
        }
    }
        
    function getApiMessage(request, sender, callback) {

        var response = {
            method : request.method,
        }
        
        handler.log('[Message] - Method : ' + request.method);
        
        if (request.method == "parseImages") {       
            
            resetPool();
            if (handler.observerLocation) setDefaultLocation();
            handler.filterCallback('onStartRecord', {context : 'parseImages'});
            
            handler.parseImages(); 
            
            response.url = handler.url;
            response.host = handler.host;
            response.images = handler.imagesPool;
            response.cats = handler.additionCats;
            response.allowDuplicates = handler.allowDuplicates;
            
            handler.filterCallback('onStopRecord', {context : 'parseImages'});
            handler.log('[parseImages][Current tab images] Added items : ' + handler.imagesPool.length + ' | custom groups : ' + Object.keys(handler.additionCats).length);
        
            if (callback) callback(response); 

            resetPool();	
            resetConfig();
            
        } else if (request.method == "startTabRecord") {       
            
            resetPool();  
            resetConfig();          
            handler.filterCallback('onStartRecord', 'startRecord');
            
            initObserver();
            delayAddImages();
            
            response.isRecorded = true;
            
            if (callback) callback(response); 			
            
        } else if (request.method == "startTabRecordPacketMode") {       
            
            resetPool();  
            resetConfig();          
            handler.filterCallback('onStartRecord', 'startRecord');
            
            handler.parseImages(); 
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "addRecord", 
                images : handler.imagesPool,
                cats : handler.additionCats, 
                url : handler.url, 
                allowDuplicates : handler.allowDuplicates,
                host : handler.host,
            }, function(bgResponse) {
            
                response.isRecorded = true;
                response.imagesNum = bgResponse ? bgResponse.imagesNum : 0;
                
                if (callback) {
                    callback(response); 
                }
            });   
            
            resetPool();  
            
            return true;
            
        } else if (request.method == "stopTabRecord") {
            
            if (handler.observer) handler.observer.disconnect();
            if (handler.recorder) handler.recorder.parentElement.removeChild(handler.recorder);
            
            handler.observer = false;
            handler.recorder = false;
            
            response.isStopped = true;
            handler.filterCallback('onStopRecord');
            
            if (callback) callback(response); 
        }
    }
    
    function showRecorder(imagesNum) {
        
        if (handler.recorder) {
            
            document.getElementById(handler.recorder.id + '-num').innerText = imagesNum;
            
        } else {
            
            if (handler.observer === false) return;
            
            KellyTools.getBrowser().runtime.sendMessage({method: "getResources", items : ['recorder']}, function(request) {
                if (!request || !request.data.loadedData) return false; 
                
                handler.recorder = document.createElement('div');
                handler.recorder.id = KellyTools.generateUniqId('kelly-recorder');
                
                KellyTools.addCss(KellyTools.generateUniqId('kelly-recorder-css'), KellyTools.replaceAll(request.data.loadedData, '__UNIQID__', handler.recorder.id)); 

                KellyTools.setHTMLData(handler.recorder, 'REC<div id="' + handler.recorder.id + '-num">' + imagesNum + '</div><div id="' + handler.recorder.id + '-notice">' + handler.noticeTxt +'</div>');
                
                handler.recorder.onclick = function() { delayAddImages();}
                document.body.appendChild(handler.recorder);
            });
        }
    }
    
    function delayAddImages(dc) {
        
        var newItems = handler.parseImages(dc);
        handler.log('[DelayAddImages] Added items : ' + newItems + ' | custom groups : ' + Object.keys(handler.additionCats).length);

        if (!updateAF) return false;        
        updateAF = false;
        handler.recorderTick = handler.recorderTick === false ? 0 : 500;
        
        setTimeout(function(){            
            updateAF = true;
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "addRecord", 
                images : handler.imagesPool,
                cats : handler.additionCats, 
                url : handler.url, 
                allowDuplicates : handler.allowDuplicates,
                host : handler.host,
            }, function(response) {

                showRecorder(response.imagesNum);
            });   
            
            handler.imagesPool = [];
            
        }, handler.recorderTick);      
    }
    
    // continue watch for possible lazyload items changes
    
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
            
            // common observer for any ADD new node to DOM events
            
            handler.observer = new MutationObserver(function(mutations) {
                
                if (handler.observerLocation && handler.url != window.location.href) {
                    setDefaultLocation();
                }
                
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
    
    function isValidHost(filterHosts, inputHost) {
        
        var fHostlist = typeof filterHosts == 'string' ? [filterHosts] : filterHosts;
        
        for(var b = 0; b < fHostlist.length; b++) {
            if (fHostlist[b] == inputHost) return true;
        }
        
        return false;
    }
    
    this.getCompatibleFilter = function() {
        
        if (!handler.hostname) return false;
        
        for(var i = 0; i < KellyPageWatchdog.filters.length; i++) {
            var filter = KellyPageWatchdog.filters[i];
            if (!filter.manifest || !filter.manifest.host) continue;
            if (isValidHost(filter.manifest.host, handler.hostname)) return filter;
        }
        
        for (var i = 0; i < KellyPageWatchdog.validators.length; i++) {
            var validator = KellyPageWatchdog.validators[i];
            if (!validator.host || !isValidHost(validator.host, handler.hostname)) continue;
                        
            var filter = {manifest : {host : validator.host, validator : true, detectionLvl : []}};
            
            if (validator.patterns) {
                for (var b = 0; b < validator.patterns.length; b++) {
                    filter.manifest.detectionLvl.push(validator.patterns[b][1]);
                }
            }
            
            if (validator.patternsDoc) {
                for (var b = 0; b < validator.patternsDoc.length; b++) {
                    filter.manifest.detectionLvl.push(validator.patternsDoc[b][1]);
                } 
            }     
            
            return filter;
        }
        
        return false;
    }

    //by default for non blocking calbacks

    this.filterCallback = function(name, data, blocking) {
        
        for (var i = 0; i < KellyPageWatchdog.filters.length; i++) {
            if (!blocking) {
                if (KellyPageWatchdog.filters[i][name]) KellyPageWatchdog.filters[i][name](handler, data);
            } else {
                if (KellyPageWatchdog.filters[i][name]) {
                    var result = KellyPageWatchdog.filters[i][name](handler, data);
                    if (typeof result != 'undefined') return result;
                }
            }
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
                
                handler.filterCallback('onStartRecord', 'isRecorded');
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

KellyPageWatchdog.filtersHelp = [];
KellyPageWatchdog.filters = [];
KellyPageWatchdog.validators = [];
KellyPageWatchdog.bannedUrls = [];
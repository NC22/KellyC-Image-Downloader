
    
// part of KellyFavItems extension

KellyTools = new Object();

KellyTools.PROGNAME = '';
KellyTools.DEBUG = false;

KellyTools.E_NOTICE = 1;
KellyTools.E_ERROR = 2;

KellyTools.events = [];
KellyTools.tId = 1000;

// Get screen width \ height

KellyTools.loadFrontJs = function(callback) {
    var js = KellyTools.getBrowser().runtime.getManifest().content_scripts[0].js, loaded = 0, loadPool = [];

    for (var i = js.length-1; i >= 0; i--) {
        if (js[i].indexOf('kellyTools') != -1 || js[i].indexOf('init/') != -1) continue;
        var url = KellyTools.getBrowser().runtime.getURL(js[i]);
        if (url) loadPool.push(url);
        else KellyTools.log('cant init path ' + url, KellyTools.E_ERROR);
    }
    
    var load = function() {
        
        if (loadPool.length <= 0) {
            if (callback) callback();
        } else {
        
            var script = document.createElement('SCRIPT');
                script.src = loadPool.pop();
                script.onload = load;
                
               if (document.head) document.head.appendChild(script);
             else document.documentElement.appendChild(script);
        }
    }

    load();
}

KellyTools.searchNode = function(nodes, tagName, className, id) {
    
    if (!nodes || nodes.length <= 0) return false;
    
    if (tagName) tagName = tagName.toLowerCase();
    for (var i = 0; i < nodes.length; i++) {
                
       if (nodes[i].nodeType == Node.ELEMENT_NODE && nodes[i].tagName) {
            if (tagName && nodes[i].tagName.toLowerCase() != tagName) continue;
            if (className && !nodes[i].classList.contains(className)) continue;
            if (id && nodes[i].id != id) continue;
            
            return nodes[i];
       }
       
    }
    
    return false;
}
    

KellyTools.getViewport = function() {

    var elem = (document.compatMode === "CSS1Compat") ? document.documentElement : document.body;    
    return { screenHeight: elem.clientHeight, screenWidth: elem.clientWidth };
}

KellyTools.wRequestSetHeader = function(source, name, value) {
    var index = false, data = { name : name, value : value }, compareName = name.toLowerCase();
    for (var i = 0; i < source.length; ++i) {
        
        if (source[i].name.toLowerCase() == compareName) {                    
            source[i] = data; index = i;                    
            break;
        }
    }
   
   if (index == false) source.push(data);
   return source;
}
        
KellyTools.wRequestGetHeader = function(source, name) {
    name = name.toLowerCase();
    for (var i = 0; i < source.length; ++i) {
        if (source[i].name.toLowerCase() == name) {                    
            return source[i].value;                    
            break;
        }
    }
    
   return false;
}

// filter = {urls: ['<all_urls>']};

KellyTools.wRequestAddListener = function(name, callback, filter, permissions, extraHeaders) {
    try {
        var tmpPermissions = [];
        for (var i = 0; i < permissions.length; i++) if (KellyTools.val(permissions[i])) tmpPermissions.push(KellyTools.val(permissions[i]));
        if (extraHeaders) tmpPermissions.push('extraHeaders'); // some browsers (firefox) not support this enum value
        KellyTools.getBrowser().webRequest[name].addListener(callback, filter, tmpPermissions);
    } catch (e) {                
        KellyTools.log(tmpPermissions, 'wRequestAddListener');
        KellyTools.log('cant init event listener. Error : ' + e + (extraHeaders ? ' RE-ATTEMPT with extraHeaders OFF' : ''), 'wRequestAddListener');
        if (extraHeaders) KellyTools.wRequestAddListener(name, callback, filter, permissions, false);
        return false;
    }
}        

KellyTools.getNoticeTooltip = function(wrapClassName, groupClassName) {
    return new KellyTooltip({
        target : 'screen', 
        offset : {left : 40, top : -40}, 
        positionY : 'bottom', positionX : 'left',				
        ptypeX : 'inside', ptypeY : 'inside',
        closeButton : true, removeOnClose : true, closeByBody : true,
        selfClass : wrapClassName + ' ' + groupClassName + '-tooltipster-help',
        classGroup : groupClassName + '-tooltipster',
    });
} 
    
// html templates, currently used only in addition modules, for future purposes

KellyTools.getTpl = function(tplPool, tplName, data, noLoc) {
    
    if (typeof tplPool[tplName] == 'undefined') {
        KellyTools.log('[Warning] Cant load template with name [' + tplName + ']', 'KellyTools', KellyTools.E_ERROR);
        return 'tpl not found ' + tplName;
    }
    
    var html = tplPool[tplName].data, blocks = {}, blocksNum = 0, parsed, varLimit = 100, varCur = 0;
    if (!data) return html;
    
    if (KellyTools.tplClass && !data['CLASSNAME']) data['CLASSNAME'] = KellyTools.tplClass;
    
    for (var k in data) {
        if (typeof data[k] == 'boolean') {
            blocks[k] = data[k];
            blocksNum++;
        } else html = KellyTools.replaceAll(html, '__' + k + '__', data[k]);
    }
    
    var applyReplace = function(str1, str2) {
        if (html.indexOf(str1) == -1) return;
        
        reg.lastIndex = reg.lastIndex - str1.length + str2.length;
        html = html.replace(str1, str2);
    }
  
    if (blocksNum > 0) {
        
        var reg = /\[__([A-Z0-9_]+)__([^\]\[]*?)\]/gm;
        
        while ((parsed = reg.exec(html)) !== null && varCur < varLimit) {
            varCur++;
            if (parsed.index === reg.lastIndex) reg.lastIndex++;
            if (typeof blocks[parsed[1]] == 'undefined') continue;
            
            if (blocks[parsed[1]]) applyReplace(parsed[0], parsed[2]);
            else applyReplace(parsed[0], '');
        }
    }
    
    if (!noLoc && typeof KellyLoc != 'undefined' && html.indexOf('@') != -1) {
        var reg = /\@([a-zA-Z_0-9]+)\@/gm;       
        
        while ((parsed = reg.exec(html)) !== null && varCur < varLimit) {
            varCur++;
            if (parsed.index === reg.lastIndex) reg.lastIndex++;
            applyReplace(parsed[0], KellyLoc.s(parsed[1], parsed[1]));
        }
    }
    
    if (varCur > 60) console.log('WARNING : please optimize TPL : ' + tplName);
    
    return html;
}

// added formData support at cfg.formData for POST requests
// var formData = new FormData();
//     formData.append("test-post", 'test');
// KellyTools.xmlRequest(postForm.action, {method : 'POST', responseType : 'json', formData : new FormData(postForm)}, function(url, response, errorStatus, errorText) {})

KellyTools.xmlRequest = function(urlOrig, cfg, callback) {
    
    var controller = new Object();
        controller.canceled = false;
        controller.abort = function() {
            if (controller.canceled) return;
            controller.canceled = true;            
            controller.abortController.abort();
        }
        
    var xhr = new XMLHttpRequest();
        xhr.onload = function(e) {
            
            if (this.status == 200) {
                controller.contentType = xhr.getResponseHeader('content-type');
                callback(urlOrig, this.response, false, false, controller);
            } else {
                callback(urlOrig, false, this.status, this.statusText, controller);
            }
            
            controller.canceled = true;            
        };

        xhr.onerror = function(e) {            
            callback(urlOrig, false, -1, 'check connection or domain mismatch (Access-Control-Allow-Origin header) | input url ' + urlOrig, controller); 
            controller.canceled = true;              
            xhr = null;
        };

        xhr.open(cfg.method ? cfg.method : 'GET', urlOrig, true);        
        xhr.responseType = cfg.responseType ? cfg.responseType : 'blob';
        
        // todo dynamic list of x-headers
        if (cfg.xRequestedWith) xhr.setRequestHeader('x-requested-with', cfg.xRequestedWith);
        if (cfg.xHeaders) {
            for (var k in cfg.xHeaders){
                xhr.setRequestHeader(k, cfg.xHeaders[k]);         
            }
        }
        
        if (cfg.contentType) xhr.setRequestHeader('Content-Type', cfg.contentType);
        
        if (cfg.formData) xhr.send(cfg.formData) 
        else xhr.send();  
        
        controller.abortController = xhr;
        return controller;
}            

KellyTools.fetchRequest = function(urlOrig, cfg, callback) {
      
    var fetchRequest = new Object();
        fetchRequest.canceled = false;
        fetchRequest.responseStatus = false;
        
        fetchRequest.defaultAbortController = new Object();
        fetchRequest.defaultAbortController.abort = function() {
            KellyTools.log('[Warning] AbortController is undefined. Default statement used', 'KellyTools', KellyTools.E_NOTICE);
        }
                    
        fetchRequest.abortController = typeof AbortController == 'undefined' ? fetchRequest.defaultAbortController : new AbortController();
        
        fetchRequest.abort = function() {
            if (fetchRequest.canceled) return;
            fetchRequest.canceled = true;
            fetchRequest.aborted = true;
            fetchRequest.abortController.abort();
        }
        
        fetchRequest.cfg =  {
            method: 'GET',
            cache: 'no-store', // 'no-cache' - creates If-Modified-Since addition request header that can us cache
            mode: 'cors',
            redirect: 'follow',
            referrerPolicy : 'origin',
            responseType : 'blob',
        };
        
        if (cfg) {
            for (var k in cfg) {
                
                if (k == 'formData') {
                    fetchRequest.cfg['body'] = cfg[k];
                } else {
                    fetchRequest.cfg[k] = cfg[k];
                }
            }
        }
        
        fetchRequest.cfg.signal = fetchRequest.abortController.signal;      
        fetchRequest.id = 'fetch_' + KellyTools.tId;

    fetch(urlOrig, fetchRequest.cfg)
    .then(function(response) {
        
        if (fetchRequest.canceled) return;
        
        fetchRequest.responseStatus = response.status;
        // check response.type could be helpfull to detect cors issues
        
        if (response.status == 200) {
            
            var getResponseFormated = function(responseFormated) {
                fetchRequest.contentType = response.headers.get("Content-Type");
                callback(urlOrig, responseFormated, false, false, fetchRequest);
            }
            
                 if (fetchRequest.cfg.responseType == 'blob') return response.blob().then(getResponseFormated);
            else if (fetchRequest.cfg.responseType == 'json') return response.json().then(getResponseFormated);
            else if (fetchRequest.cfg.responseType == 'text') return response.text().then(getResponseFormated);
            
        } else {
            callback(urlOrig, false, response.status, 'fetchRequest [error] : ' + response.statusText, fetchRequest);
        }  
             
        fetchRequest.canceled = true;    
    })
    .then(function(text) {})
    .catch(function(error) {
        if (fetchRequest.aborted) return;
        
        // fixes recursion of callback - if some error happend during successfull response callback itself, todo - still looks possible recursion on error callback?
        if (fetchRequest.responseStatus !== false) {
            console.error(error);            
            return;
        }
        
        callback(urlOrig, false, -1, 'fetch error : ' + error, fetchRequest);
        fetchRequest.canceled = true;
    }); 
    
    KellyTools.tId++;
    return fetchRequest;
} 

KellyTools.getExtByMimeType = function(mimetype) {
    
    if (!mimetype || typeof mimetype.split != 'function' || mimetype.indexOf('/') == -1) return false;
    
    var mimetype = mimetype.split('/');    
    
    if (mimetype.length == 2) {
        if (mimetype[1] == 'plain') return 'txt';
        if (mimetype[1].length < 10) return mimetype[1];
    }
    
    return false;
}

KellyTools.getHostlistMatches = function(hostList, media, array) {
    
    array = array ? array : [], mediaTypes = ['jpg', 'jpeg', 'gif', 'web', 'bmp', 'tiff', 'tif', 'png', 'mp4', 'webm'];
    
    for (var i = 0; i < hostList.length; i++) {
        
        if (!media) {
            
            array.push('*://' + hostList[i] + '/*');
            array.push('*://*.' + hostList[i] + '/*');
            
        } else {        
        
            for (var b = 0; b < mediaTypes.length; b++) {             
                array.push('*://' + hostList[i] + '/*.' + mediaTypes[b]);
                array.push('*://*.' + hostList[i] + '/*.' + mediaTypes[b]);                
            }
        }
    }
    
    return array;
}

KellyTools.getMimeType = function(ext) {
    
    if (!ext || typeof ext.split != 'function') return 'application/x-undefined';
    
    if (ext.indexOf('data:') === 0) {
        var mimeType = ext.split(';');
            mimeType = mimeType[0].replace('data:', '');
            mimeType = mimeType.split('/', 2);
        if (mimeType.length != 2) return 'application/x-undefined';
        
        mimeType = mimeType[0] + '/' + (mimeType[1].length > 10 ? mimeType[1].substr(0, 3) : mimeType[1]);            
        return mimeType;
    }     
    
    var mimetype = 'application/x-' + (ext.length > 10 ? ext.substr(0, 3) : ext);
    
    // MIME type list http://webdesign.about.com/od/multimedia/a/mime-types-by-content-type.htm
    
         if (ext == 'jpg' || ext == 'jpeg') mimetype = 'image/jpeg';
    else if (ext == 'png' ) mimetype = 'image/png';
    else if (ext == 'gif' ) mimetype = 'image/gif';
    else if (ext == 'webp' ) mimetype = 'image/webp';
    else if (ext == 'tiff' || ext == 'tif') mimetype = 'image/tiff';
    else if (ext == 'bmp' ) mimetype = 'image/bmp';
    else if (ext == 'zip' ) mimetype = 'application/zip';
    else if (ext == 'mp4' ) mimetype = 'video/mp4';
    else if (ext == 'webm' ) mimetype = 'video/webm';
    else if (ext == 'txt' ) mimetype = 'text/plain';
    else if (ext == 'json' ) mimetype = 'application/json';
    
    return mimetype;
}
    
KellyTools.addEventPListener = function(object, event, callback, prefix) {

    this.removeEventPListener(object, event, prefix);
    
    if (typeof object !== 'object') {
        object = document.getElementById(object);
    }

    if (!object)
        return false;
    if (!prefix)
        prefix = '';

    this.events[prefix + event] = callback;

    if (!object.addEventListener) {
        object.attachEvent('on' + event, this.events[prefix + event]);
    } else {
        object.addEventListener(event, this.events[prefix + event]);
    }

    return true;
}

KellyTools.removeEventPListener = function(object, event, prefix) {
    if (typeof object !== 'object') {
        object = document.getElementById(object);
    }

    // console.log('remove :  : ' + Object.keys(events).length);
    if (!object)
        return false;
    if (!prefix)
        prefix = '';

    if (!this.events[prefix + event])
        return false;

    if (!object.removeEventListener) {
        object.detachEvent('on' + event, this.events[prefix + event]);
    } else {
        object.removeEventListener(event, this.events[prefix + event]);
    }

    this.events[prefix + event] = null;
    return true;
}
    
KellyTools.getScrollTop = function() {

    var scrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
    return scrollTop;
}

KellyTools.getScrollLeft = function() {

    var scrollLeft = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0);
    return scrollLeft;
}

// prevent loading images and media
        
KellyTools.stopMediaLoad = function(loadDoc, keepData) {
    
    if (!loadDoc) return 0;
    
    var cleared = 0, clearPool = function(loadImages) {
        for (var i = 0; i < loadImages.length; i++) {            
            if (keepData) loadImages[i].setAttribute('data-src', loadImages[i].src); 
            loadImages[i].src = '';
            loadImages[i].onload = function() {};
            loadImages[i].onerror = function() {};
            cleared++;
        }  
    };
    
    clearPool(loadDoc.getElementsByTagName('img'));      
    clearPool(loadDoc.getElementsByTagName('source'));    
    return cleared;
}

// trim and basic validation of input string

KellyTools.val = function(value, type) {
    
    if (!value) value = '';    
    
    if (typeof value != 'string' && typeof String != 'undefined') {
        value = String(value);
    }
    
    value = value.trim();
    
    if (!type) type = 'string';
    
    if (type == 'string') {
        
        if (!value) return '';
        return value.substring(0, 255);
        
    } else if (type == 'int') {
        
        if (!value) return 0;
        
        value = parseInt(value);
        if (!value) value = 0;
        
        return value;
        
    } else if (type == 'float') {
        
        return KellyTools.validateFloatString(value);
        
    } else if (type == 'bool') {
        
        return value ? true : false;
        
    } else if (type == 'html') {
        
        var parser = new DOMParser();
        var dom = parser.parseFromString(value, 'text/html');
            
        return dom.getElementsByTagName('body')[0];
        
    } else if (type == 'longtext') {
        
        if (!value) return '';
        return value.substring(0, 65400);
    } else if (type == 'filename') {
        
        if (!value) return '';
        return value.replace(/[^а-яА-Яa-z0-9 ._-]/gim, "_");
    } 
}

KellyTools.getElementText = function(el) {
    
    if (el) {
         return el.innerText || el.textContent || '';
    }
    
    return '';
}

KellyTools.nlToBr = function(text) {
    return text.replace(/(?:\r\n|\r|\n)/g, '<br>');
}

// also some interesting design can be found here
// https://stackoverflow.com/questions/7370943/retrieving-binary-file-content-using-javascript-base64-encode-it-and-reverse-de

KellyTools.blobToBase64 = function(blob, cb) {
    
    var reader = new FileReader();
        reader.onload = function() {
        
        var dataUrl = reader.result;
        var base64 = dataUrl.split(',')[1];
            cb(base64);
    };

    reader.readAsDataURL(blob);
};

KellyTools.base64toBlob = function(base64Data, contentType) {
    
    contentType = contentType || '';
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);

    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    
    return new Blob(byteArrays, { type: contentType });
};

// html must be completed and valid. For example - input : <table><tr><td></td></tr></table> - ok,  input : <td></td><td></td> - will add nothing 

KellyTools.setHTMLData = function(el, val) {
    
    if (!el) {
        console.log('setHTMLData el item is undefined');
        return;
    }
    
    el.innerHTML = '';
    
    if (val) {
        var valBody = KellyTools.val(val, 'html');
       
        if (valBody && valBody.childNodes) { 
            while (valBody.childNodes.length > 0) {
                el.appendChild(valBody.childNodes[0]);
            }
        }
    }
    
    return el;
}

KellyTools.classList = function(action, el, val) {
    if (!el) return false;
    
         if (action == 'add') el.classList.add(val);
    else if (action == 'remove') el.classList.remove(val);
    else if (action == 'contains') return el.classList.contains(val);
    
    return true;
}

KellyTools.toogleActive = function(el, cl) {
    cl = cl ? cl + '-' : '';
    if (el.className.indexOf(cl + 'hidden') != -1) {
        el.className = el.className.replace(cl + 'hidden', cl + 'active');
    } else {
        el.className = el.className.replace(cl + 'active', cl + 'hidden');
    }
}

KellyTools.inputVal = function(el, type, parent) {
    
    var value = ''; 
    
    if (typeof el == 'string') {
        if (!parent) parent = document;
        el = KellyTools.getElementByClass(parent, el);
    }
    
    if (el) value = el.value;    
    return KellyTools.val(value, type);
}

KellyTools.fitText = function(parent, textEl, noExtHeight, offsetWidth) {
    
    var bounds = textEl.getBoundingClientRect();
    var parentBounds = parent.getBoundingClientRect();
    if (offsetWidth) parentBounds.width += offsetWidth;
    
    if (parentBounds.width >= bounds.width && parentBounds.height >= bounds.height) {
        return;
    }    
      
    var textStyle = window.getComputedStyle(textEl);
    var defaultFontSize = parseInt(textStyle.fontSize);
    var fontSize = defaultFontSize;
    
    if (!fontSize) return;
    
    while (fontSize > 10 && (parentBounds.width < bounds.width || parentBounds.height < bounds.height)) {
        fontSize--;        
        textEl.style.fontSize = fontSize + 'px'; 
        bounds = textEl.getBoundingClientRect();        
    }   
    
    if (!noExtHeight && parentBounds.height < bounds.height) {
        
        var defaultLineHeight = parseInt(textStyle.lineHeight);
        var redusedLineHeight = Math.round((defaultLineHeight / 100) * 66);
        
        parent.style.height = Math.round(bounds.height) + 'px';
        parent.style.lineHeight = redusedLineHeight + 'px';
    }
}

KellyTools.getChildByTag = function(el, tag) {
    if (!el) return false;
    
    var childNodes = el.getElementsByTagName(tag);
    
    if (!childNodes || !childNodes.length) return false;
    
    return childNodes[0];
}

KellyTools.getElementByTag = function (el, tag) {
    return KellyTools.getChildByTag(el, tag);
}

KellyTools.getParentByTag = function(el, tagName) {
    var parent = el;
    if (!tagName) return false;
    
    tagName = tagName.toLowerCase();
    
    while (parent && parent.tagName.toLowerCase() != tagName) {
        parent = parent.parentElement;
    }  
    
    return parent;
}

// validate url depends on location

KellyTools.validateUrlForLocation = function(url, location) {
    
    // relative url 
        
    if (url.indexOf('.') == -1) {
        
        if (url.charAt(0) != '/') url = '/' + url;
        url = location.href.split('#')[0] + url;
    }
    
    // url without protocol
    
    if (url.indexOf('http') == -1) {
        
        if (url.charAt(0) != '/' && url.charAt(1) != '/') {
            url = '//' + url;
        } 
        
        url = location.protocol + url;
    }
    
    return url;
}

KellyTools.getUrlFileName = function(url, excludeExt, noDecode) {
    if (!url || typeof url.split != 'function') return '';
     
    if (url.indexOf('data:') === 0) {
        return 'dataUrl__' + KellyTools.getMimeType(url).replace('\\', '_').replace('-', '_');
    }

    var ext = false;
    if (url.lastIndexOf('.') != -1) {
        ext = url.substr(url.lastIndexOf('.'));
    }
    
    url = url.split("?");
    url = url[0];
    
    if (!url) return '';
    
    url = url.substring(url.lastIndexOf('/')+1);    
    
    if (!noDecode && url.indexOf('%') != -1) {
        url = decodeURIComponent(url);
        url = url.replace(/[^а-яА-Яa-z0-9áéíóúñü ._-]/gim, "");
    } 
    
    if (url.indexOf('.') != -1) {       
        url = url.substr(0, url.lastIndexOf('.'));
    }
    
    // url = KellyTools.replaceAll(url, '\\.', '_');
    
    if (!excludeExt && ext !== false) {
        url += ext;
    }
    
    return url;
}

KellyTools.getUrlExt = function(url) {

    if (!url || typeof url.split != 'function') return false;
    
    url = url.trim();
    
    if (url.indexOf('data:') === 0 || url.indexOf('blob:') === 0) {
        return 'dataUrl';
    } 
    
    url = url.split("?");
    url = url[0];
    
    return this.getExt(url);        
}

KellyTools.addCss = function(id, css, clean) {
      
    var style = document.getElementById(id), head = document.head || document.getElementsByTagName('head')[0];
    if (!style) {
        style = document.createElement('style');
        style.type = 'text/css';
        style.id = id;       
        head.appendChild(style);
    }    
    
    if (style.styleSheet){
        if (clean) style.styleSheet.cssText = '';
        style.styleSheet.cssText += css;
    } else {
        if (clean) style.innerHTML = '';
        style.appendChild(document.createTextNode(css));
    }
}
    
KellyTools.getUrlParam = function(param, url) {
    if (!url) url = location.search;
    
    var paramIndex = url.indexOf(param + "=");
    var paramValue = '';
    if (paramIndex != -1) {
        paramValue = url.substr(paramIndex).split('=');
        if (paramValue.length >= 2) {
            paramValue = paramValue[1].split('&')[0];
        }
    }
    
    return paramValue.trim();
}

// turn this - '2, 4, 66-99, 44, 78, 8-9, 29-77' to an array of all values [2, 4, 66, 67, 68 ... etc] in range

KellyTools.getPrintValues = function(print, reverse, limitFrom, limitTo, input) {

    var itemsToSelect = [];
    var options = print.split(',');
    
    if (typeof limitTo == 'undefined') {
        limitTo = false;
    } 
    
    if (typeof limitFrom == 'undefined') {
        limitFrom = false;
    }
    
    var validOptions = '';

    for (var i = 0; i < options.length; i++) {

        var option = options[i].trim().split('-');
        if (!option.length || !option[0]) continue;
        if (option.length <= 1) option[1] = -1;
        
        option[0] = parseInt(option[0]);
        if (!option[0]) option[0] = 0;
        
        if (option[1]) {
            option[1] = parseInt(option[1]);
            if (!option[1]) option[1] = option[0];
        }

        if (option[0] == option[1]) option[1] = -1;

        if (option[1] !== -1) {

            if (option[1] < option[0]) {
                var switchOp = option[0];
                option[0] = option[1];
                option[1] = switchOp;
            }
            
            if (limitFrom !== false && option[0] < limitFrom) option[0] = limitFrom;
            if (limitTo !== false && option[1] > limitTo) option[1] = limitTo;
            
            if (option[0] < option[1] && option[1] - option[0] > 0) {

                for (var b = option[0]; b <= option[1]; b++) {
                    if (itemsToSelect.indexOf(b) == -1) itemsToSelect[itemsToSelect.length] = b;
                }

                validOptions += (validOptions ? ',' : '') + option[0] + '-' + option[1];
            }

        } else {
            
            if (limitTo !== false && option[0] > limitTo) continue;
            if (limitFrom !== false && option[0] < limitFrom) continue;

            validOptions += (validOptions ? ',' : '') + option[0];
            
            if (itemsToSelect.indexOf(option[0]) == -1) itemsToSelect[itemsToSelect.length] = option[0];
        }
        
        
    }
    
    itemsToSelect.sort(function(a, b) {          
          return reverse ? b - a : a - b;
    });

    if (input) input.value = validOptions;

    return itemsToSelect;
}

KellyTools.getVarList = function(str, type, glue) {
        
    if (!str) return [];
    
    str = str.trim();
    if (!str) return [];
      
    if (!glue) glue = ',';
    str = str.split(glue);    
    
    for (var i=0; i <= str.length-1; i++) {
        
        var tmp = KellyTools.val(str[i], type);
        if (tmp) str[i] = tmp;
    }
    
    return str;
}
    
KellyTools.varListToStr = function(varlist, type, glue) {
        
    if (!varlist || !varlist.length) return '';
    
    var str = '';            
    if (!glue) glue = ',';
    
    for (var i=0; i <= varlist.length-1; i++) {
        
        var tmp = KellyTools.val(varlist[i], type);
        if (!tmp) continue;
    
        if (str) str += glue + tmp;
        else str = tmp;
    }
    
    return str;
}
    
KellyTools.parseTagsList = function(text) {
    
    var text = text.split(','); 
    
    var tagList = {
        exclude : [],
        include : [],
    }
        
    for (var i = 0; i < text.length; i++) {
        var tagName = text[i].trim();        
        
        var exclude = false;
        if (tagName.charAt(0) == '-') {
            exclude = true;
        }
        
        if (tagName.charAt(0) == '-' || tagName.charAt(0) == '+') {
            tagName = tagName.substr(1);
        } 
        
        if (!tagName) {
            continue;
        }

		if (tagList.exclude.indexOf(tagName) != -1 || tagList.include.indexOf(tagName) != -1) {
			continue;
		}     

        if (exclude) {
            tagList.exclude[tagList.exclude.length] = tagName;
        } else {
            tagList.include[tagList.include.length] = tagName;
        }
    }
    
    if (!tagList.exclude.length && !tagList.include.length) return false;
    
    return tagList;
}

KellyTools.validateHtmlDoc = function(response) {

    if (response.indexOf('body') != -1) {
        response = response.replace(/(\r\n\t|\n|\r\t)/gm,"");
        response = response.match(/<body[^>]*>((.|[\n\r])*)<\/body>/img); // (.*?)
        if (response && response.length >= 1) {
            response = response[0].replace(/<\/?body>/g,'');
            response = response.replace(/<body[^>]+>/g,'')
        } else return 0;
        
    } else return 0;
    
    return response;
}

KellyTools.validateFloatString = function(val) {

    if (!val) return 0.0;
    
    val = val.trim();
    val = val.replace(',', '.');
    val = parseFloat(val);
    
    if (!val) return 0.0;
    
    return val;    
}

// escape regExp characters. Bring string to regular expression match template like /sdfsdf/sf/sd/fs/f/test.ttt 

KellyTools.folderPatchToRegularExpression = function(folder) {
    
    if (!folder) return '';
    folder = folder.trim();
    
    if (!folder) return '';

	var folderEsc = '';
    for (var i = 0; i < folder.length; i++) {
        
        if (['?', '[', ']', ',', '*', '(', ')', '\\', '/'].indexOf(folder.charAt(i)) != -1) {
			if (folder.charAt(i) == '(') {
				folderEsc += '[\(]';
            } else if (folder.charAt(i) == ')') {
				folderEsc += '[\)]';
            } else if (folder.charAt(i) == '/' || folder.charAt(i) == '\\') {
				folderEsc += "(\\\\|/)";
            } else {
            	folderEsc += '\\' + folder.charAt(i);
			}
        } else {
			folderEsc += folder.charAt(i);
		}
    }    

    return folderEsc;
}

// input - any string that suppose to be file path or directory -> output - dir/dir2/dir3/file.ext, dir/dir2, dir/dir2/dir3 ...

KellyTools.validateFolderPath = function(folder) {

    if (!folder) return '';
    folder = folder.trim();
    
    if (!folder) return '';
    folder = KellyTools.replaceAll(folder, '\\\\', '/');
    
    var tmpFolder = '';
    for (var i=0; i <= folder.length-1; ++i) {
        if (i == 0 && folder[i] == '/') {
             continue;
        }
        
        if (i == folder.length-1 && folder[i] == '/') {
            continue;
        }
        
        if (folder[i] == '/' && tmpFolder[tmpFolder.length-1] == '/') {
            continue;
        }
        
        if (folder[i] == '/' && tmpFolder.length == 0) continue;
        

        tmpFolder += folder[i];
        
    }
    
    if (tmpFolder[tmpFolder.length-1] == '/') {
        tmpFolder = tmpFolder.slice(0, -1); 
    }

    return tmpFolder;
}

KellyTools.getBrowser = function() {
    
    // chrome - Opera \ Chrome, browser - Firefox
    
    if (typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined') {
        return browser;
    }  else if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') { // Edge has this object, but runtime is undefined
        return chrome;
    }  else {
        console.log('browser not suppot runtime API method');
        return false;
    }
}

// str - full filename string
// limit - optional, check extension name on max length, return false if extension length more then limit

KellyTools.getExt = function(str, limit) {
    
    if (!str) return '';   
    str = str.trim();
    
    var dot = str.lastIndexOf('.');
    if (dot === -1) return false;
    
    var ext =  str.substr(dot).split(".");
    if (ext.length < 2) return false;
    
    ext = ext[1];
    
    if (!limit) limit = 5;
    if (ext.length > limit) return false;
    if (ext.indexOf('/') !== -1) return false;
    
    return ext.toLocaleLowerCase();
}

KellyTools.getBrowserName = function() {
    
    if (typeof navigator == 'undefined') return 'unknown';
    
    var userAgent = navigator.userAgent;
    
    var test = ['opera', 'firefox', 'ie', 'edge', 'chrome'];
    
    for (var i = 0; i < test.length; i++) {
        var bTest = test[i];
        
        if (bTest == 'opera') {
            if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) return 'opera';
        } else if ( bTest == 'firefox' ) {
            if (typeof InstallTrigger !== 'undefined') return 'firefox';
        } else if ( bTest == 'ie' ) {
            if (/*@cc_on!@*/false || !!document.documentMode) return 'ie';
        } else if ( bTest == 'edge' ) {
            if (!!window.StyleMedia) return 'edge';
        } else if ( bTest == 'chrome' ) {
            if (!!window.chrome) return 'chrome'; // all chromium based that not match to prev tests. Possible chrome. [window.chrome.webstore] - undefined in chrome since an version, need more accurate test, but not important currently
        } 
    }
    
    return 'unknown';
}

/*
    errorLevel 
    
    1 - notice, notrace
    2 - error, trace, default
*/

KellyTools.log = function(info, module, errorLevel) {
    
    if (typeof module == 'number') {        
        errorLevel = module;
        module = false;
    }
    
    if (!module) module = 'Kelly';
  
    if (!errorLevel) {
        errorLevel = KellyTools.E_NOTICE;
    }    
     
    if (!this.DEBUG && errorLevel < KellyTools.E_ERROR) return;
    
    if (typeof info == 'object' || typeof info == 'function') {
        console.log('[' + KellyTools.getTime() + '] ' + module + ' :  var output :');
        console.log(info);
    } else {
        console.log('[' + KellyTools.getTime() + '] ' + module + ' : '+ info);
    }
    
    if (errorLevel >= KellyTools.E_ERROR && console.trace) {        
        console.trace();
    }
}

// 01:12

KellyTools.getTime = function(date) {
    var date = date ? date : new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    
    if (minutes < 10){
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes;
}

// 2018_09_09__085827

KellyTools.getTimeStamp = function(date) {
    date = date ? date : new Date();
    date = date.getUTCFullYear() + '_' +
        ('00' + (date.getUTCMonth()+1)).slice(-2) + '_' +
        ('00' + date.getUTCDate()).slice(-2) + '__' + 
        ('00' + date.getUTCHours()).slice(-2) + '' + 
        ('00' + date.getUTCMinutes()).slice(-2) + '' + 
        ('00' + date.getUTCSeconds()).slice(-2);
    
    return date;
}

// 2018-09-09 08:58:27

KellyTools.getGMTDate = function() {
    return new Date().toJSON().slice(0, 19).replace('T', ' ');
}

KellyTools.getParentByAttribute = function(el, attributeName, attributeValue) {
    
    var parent = el; 
    while (parent && !parent.getAttribute(attributeName) && parent.getAttribute(attributeName) != attributeValue) {
        parent = parent.parentElement;
    }
    
    return parent;
}

// isChild
KellyTools.getParentByClass = function(el, className) {
    
    var parent = el; 
    while (parent && !parent.classList.contains(className)) {
        parent = parent.parentElement;
    }
    
    return parent;
}

// read local file
// untested in dataurl mode - suppose get binary data - such as png image
// todo try - btoa(unescape(encodeURIComponent(rawData))) to store local as base64:image

KellyTools.readInputFile = function(input, onRead, readAs) {
    
    if (!input) return false;
    
    var file = input.files[0]; 
    if (file) {
    
      var fileReader = new FileReader();
          fileReader.onloadend = function (e) {
                if (onRead) onRead(input, e.target.result);
          };
          
        if (readAs == 'dataurl') {
            
            fileReader.readAsDataURL(file);
        } else {
            fileReader.readAsText(file)
        }
        return true;
    } else return false;
}	

KellyTools.getLocationFromUrl = function(str) {

    if (typeof URL != 'undefined') {

        try {
            var l = new URL(str); // bg scripts not support document object, priority to URL ent
        } catch (e) {
            
            console.log('Fail to parse url string ' + str);
            // console.log(e);
            
            return new URL('https://default.default/');
        }
        
        
    } else {
    
        var l = document.createElement("a");
            l.href = str;
    }
    
    return l;
};

KellyTools.getRelativeUrl = function(str) {
    
    if ( typeof str !== 'string') return '/';

    str = str.trim();
    
    if (!str.length) return '/';
    
    str = str.replace(/^(?:\/\/|[^\/]+)*\//, "");
   
    if (!str.length) str = '/';

    if (str[0] != '/') {
        str = '/' + str;
    }
    
    return str;
}
    
KellyTools.getElementByClass = function(parent, className) {
        
    if (parent === false) parent = document.body;
    
    if (typeof parent !== 'object') {     
        console.log('unexpected type - ' + typeof parent);
        console.log(parent);
        console.log(className);
        return false;
    }
    
    if (!parent) return false;
    
    var childNodes = parent.getElementsByClassName(className);    
    if (!childNodes || !childNodes.length) return false;
    
    return childNodes[0];
}

KellyTools.parseJSON = function(json, escaped, log) {
    
    var data = false;
    
    if (json) {
        try {
            if (escaped) json = JSON.parse('"' + json + '"');
            data = JSON.parse(json);
        } catch (e) {
            data = false;
            if (log) console.log(e);
        }
    }
    
    return data;
}

// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript

KellyTools.replaceAll = function(text, search, replace) {
    return text.replace(new RegExp(search, 'g'), replace);
}

KellyTools.dispatchEvent = function(target, name) {
    
    if (!target) return;
    if (!name) name = 'click';
    if(typeof(Event) === 'function') {
        
        var event = false;
        
        try {
            
            event = new Event(name, {bubbles: true, cancelable: true});
          
        } catch(e){

            event = document.createEvent('Event');
            event.initEvent(name, true, false);
        }
                
    } else {
        
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
    }

    var bn = target.getBoundingClientRect();

    event.clientX = Math.round(bn.left + KellyTools.getScrollLeft() + bn.width / 2);
    event.clientY = Math.round(bn.top + KellyTools.getScrollTop() + bn.height / 2);

    target.dispatchEvent(event);
}

KellyTools.injectAddition = function(addition, onLoad, duplicateIgnore) {
    
    // remove old node on duplicate ?
    
    if (!duplicateIgnore && this['injection_' + addition]) {
                
        if (onLoad) {
            onLoad();
        }
        return;
    }
    
    var script = document.createElement('script'); 
        
        script.type = 'text/javascript'; 
        script.src = KellyTools.getBrowser().runtime.getURL('env/dynamic/' + addition + '.js'); 
        
        if (onLoad) {
            script.onload = onLoad;
        }
    
    this['injection_' + addition] = script;
    
    document.body.appendChild(script); 
}

KellyTools.generateUniqId = function(prefix) {
    var id = 1;
    while(document.getElementById(prefix + '-' + id)) id++;
    return prefix + '-' + id;
}

KellyTools.generateIdWord = function(text) {
	
	if (typeof text != 'string') return '';
	text = text.trim().toLowerCase();	
	
	if (!text) return '';

    var replaceFrom = ['а','б','в','г','д','е','ё','ж','з','и','й','к','л','м','н','о','п','р','с','т','у','ф','х','ц','ч', 'ш', 'щ', 'ъ','ы','ь','э', 'ю', 'я',' ', '-'];
    var replaceBy = ['a','b','v','g','d','e','e','g','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','c','ch','sh','sh','', 'y','y', 'e','yu','ya','_', '_'];

	for (var i = 0; i < replaceFrom.length; i++) {
		text = text.replace(new RegExp(replaceFrom[i], 'g'), replaceBy[i]);
	}
	
    return text.replace(new RegExp(/\W/, 'g'), '');
}

KellyTools.getProgName = function() {
    
    if (!this.PROGNAME && this.getBrowser()) {
        this.PROGNAME = (this.getBrowser().runtime.getManifest ? this.getBrowser().runtime.getManifest().name + ' v' + this.getBrowser().runtime.getManifest().version : KellyLoc.s('', 'ext_name'));
    }
    
    return this.PROGNAME;
}

KellyTools.getCamelWord = function(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

KellyTools.setCopyright = function(id, context) {
    
    var container = document.getElementById(id);
    if (!container) return;
    
    if (context == 'popup') html = '<a target="_blank" href="/env/html/recorderDownloader.html?tab=help">' + KellyLoc.s('', 'help') + '</a>© <a target="_blank" href="http://kelly.catface.ru/">' + KellyLoc.s('', 'nradiowave_person') + '</a>';
    else html = 'created by <a target="_blank" href="http://kelly.catface.ru/">' + KellyLoc.s('', 'nradiowave_person')  + '</a>';
    
    KellyTools.setHTMLData(container, html); 
    
    container.getElementsByTagName('A')[0].onclick = function() {
        KellyTools.getBrowser().tabs.create({url: this.href}, function(tab){}); 
        return false;
    }
}

KellyTools.getManifestVersion = function() {
    
    var manifestData = KellyTools.getBrowser().runtime.getManifest();
    var version = parseInt(manifestData['manifest_version']);
    if (isNaN(version) || version < 2) {
        version = 2;        
        console.error('Fail to detect manifest version. Default version [2] is used');
    }
    
    return manifestData['manifest_version'];
}

// params - paginationContainer, curPage, onGoTo, classPrefix, pageItemsNum, itemsNum, perPage

KellyTools.showPagination = function(params) {
    
    if (!params) {
        return false;	
    }
        
    if (!params.container) return false;
    if (!params.classPrefix) {
        params.classPrefix = 'KellyTools';
    }
    
    if (!params.itemsNum) params.itemsNum = 0;
    if (!params.perPage) params.perPage = 50;
    
    params.container.innerHTML = '';
    
    if (!params.itemsNum) return;
    
    var totalPages = Math.ceil(params.itemsNum / params.perPage);

    if (totalPages <= 1) return;
    
    var page = params.curPage ? params.curPage : 1;
    var pageListItemsNum = params.pageItemsNum ? params.pageItemsNum : 4; // maximum number of page buttons
    var pageStart = 1; // page number, rendered button start

    pageStart = page - Math.ceil(pageListItemsNum / 2);       
    if (pageStart < 1) pageStart = 1; 
    
    var pageEnd = pageStart + pageListItemsNum - 1; // page number, rendered button end
    if (pageListItemsNum > totalPages) pageEnd = totalPages;
    
    if (pageEnd <= 1) pageEnd = totalPages;
    if (pageEnd > totalPages) pageEnd = totalPages;
    
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    
    var goToFunction = function() {
        if (params.onGoTo) params.onGoTo(this.getAttribute('pageNum'));
        return false;
    }
    
    var goToPreviuse = document.createElement('a');
        goToPreviuse.href = '#';
        goToPreviuse.setAttribute('pageNum', 'previuse');
        goToPreviuse.innerText = '<';
        goToPreviuse.className = params.classPrefix + '-item';
        goToPreviuse.onclick = goToFunction;
             
    if (pageStart > 1) {
        
        var goToBegin = goToPreviuse.cloneNode(true);
            goToBegin.setAttribute('pageNum', '1');
            goToBegin.onclick = goToFunction;
            goToBegin.innerText = '<<';
        
        // if (totalPages > 2) 
        params.container.appendChild(goToBegin);
        params.container.appendChild(goToPreviuse);
    }
        
    for (var pageNum = pageStart; pageNum <= pageEnd; pageNum++) {
        
        var pageEl = document.createElement('a');
            pageEl.href = '#';
            pageEl.innerText = pageNum;
            pageEl.className = params.classPrefix + '-item';
            
            if (pageNum >= 100) pageEl.className += ' ' + params.classPrefix + '-item-100';

            pageEl.setAttribute('pageNum', pageNum);
             
        if (page == pageNum) {
            pageEl.className += ' active';
        }
        
        pageEl.onclick = goToFunction;                
        params.container.appendChild(pageEl);
    }

    if (pageEnd < totalPages) {
        
        var goToNext = document.createElement('a');
            goToNext.href = '#';
            goToNext.setAttribute('pageNum', 'next');
            goToNext.className = params.classPrefix + '-item';
            goToNext.onclick = goToFunction;            
            goToNext.innerText = '>';
            
        params.container.appendChild(goToNext);
        
        var goToEnd = goToPreviuse.cloneNode(true);
            goToEnd.setAttribute('pageNum', totalPages);            
            goToEnd.onclick = goToFunction;
            goToEnd.innerText = '>>';
        
        // if (totalPages > 2) 
        params.container.appendChild(goToEnd); 
    }
    
    return params.container;
}
    
    
// part of KellyFavItems extension
// only background extensions has access to download API, so we create one

var KellyEDispetcher = new Object;

    KellyEDispetcher.updatePageRevision = []; // versions, that related to update.html page text, if already notified on one of listed versions - skip

    KellyEDispetcher.eventsAccepted = false;
    KellyEDispetcher.envDir = 'env/';
    KellyEDispetcher.api = KellyTools.getBrowser();
    KellyEDispetcher.downloaderTabs = []; 
    KellyEDispetcher.events = []; // [... , {onMessage : callback(KellyEDispetcher, response, request, sender, callback), onTabConnect : callback(KellyEDispetcher, port), onTabMessage : callback(KellyEDispetcher, tabData)}]
        
    KellyEDispetcher.blobData = {};
    KellyEDispetcher.openTabData = false;
    
    KellyEDispetcher.isDownloadSupported = function() {
    
        if (!KellyEDispetcher.api || typeof KellyEDispetcher.api.downloads == 'undefined') {
            return false;
        }
        
        return true;
    }
    
    KellyEDispetcher.init = function() {
    
        if (this.eventsAccepted) return true;
               
        this.api.runtime.onMessage.addListener(this.onMessage);    
        this.api.runtime.onConnect.addListener(this.onTabConnect);

        this.api.downloads.onChanged.addListener( this.initEvents.onChanged );
        this.api.runtime.onInstalled.addListener( this.initEvents.onInstalled );
                        
        this.eventsAccepted = true;
        
        return true;
    }
    
    // BG Dispetcher subscriptions to API
    
    KellyEDispetcher.initEvents = {
        onChanged :  function(downloadDelta) { // this.api.downloads.onChanged
            
            // Clean up for localy (from bg) created blob urls
                                 
            if (downloadDelta && downloadDelta.state) {
                
                if (downloadDelta.state.current == "interrupted" || downloadDelta.state.current == "complete") {
                                        
                    if (KellyEDispetcher.blobData[downloadDelta.id]) {
                        
                        URL.revokeObjectURL(KellyEDispetcher.blobData[downloadDelta.id]);
                        delete KellyEDispetcher.blobData[downloadDelta.id];
                    }                   
                }
            }
            
            // Notify tabs
            
            KellyEDispetcher.sendNotification({method: "onChanged", downloadDelta : downloadDelta});
        },
        onInstalled :  function(details) { // this.api.runtime.onInstalled
            
                if (details.reason == "install") {
                    
                   console.log('[install]');  
                   KellyEDispetcher.api.tabs.create({url: '/env/html/update.html?mode=install'}, function(tab){});
                   
                } else if (details.reason == "update") {
                   
                   console.log('[update] ' + details.previousVersion + ' - ' + KellyEDispetcher.api.runtime.getManifest().version);
                   if ( details.previousVersion.indexOf(KellyEDispetcher.api.runtime.getManifest().version) === 0 ) {
                        console.log('[update] skip update info - same version');
                        return;
                   }
                   
                   if ( KellyEDispetcher.updatePageRevision.indexOf(KellyEDispetcher.api.runtime.getManifest().version) == -1 ) {
                        console.log('[update] skip update info - mismatch version');
                        return;
                   }
                   
                   KellyEDispetcher.api.storage.local.get('kelly-extension-update-inform', function(item) {
         
                        if (KellyEDispetcher.api.runtime.lastError) {                        
                            console.log(KellyEDispetcher.api.runtime.lastError);                            
                        } else {
                            
                            var revisionInfo = item['kelly-extension-update-inform'];                        
                            if (!revisionInfo || KellyEDispetcher.updatePageRevision.indexOf(revisionInfo.revision) == -1) {
                                
                                console.log('[update] needs to notify');                                
                                KellyEDispetcher.api.tabs.create({url: '/env/html/update.html?mode=update'}, function(tab){});
                                KellyEDispetcher.api.storage.local.set({'kelly-extension-update-inform' : {revision : KellyEDispetcher.api.runtime.getManifest().version}}, function() {
                                
                                    if (KellyEDispetcher.api.runtime.lastError) {                            
                                        console.log(KellyEDispetcher.api.runtime.lastError);                       
                                    }
                                });
                            } else {
                                console.log('[update] already notified in ' + revisionInfo.revision);
                            }
                        }
                    });	
                }
        },
    }
    
    /*
        tabData request rules
        
        .hostlist - array of hostnames - [example.com, test.com] - matches - [*://*.example.com/*, *://example.com/*, *://*.test.com/*, *://test.com/*]
        .referrer - [optional] default referrer, applyed for .hostlist generated matches urls with MIME type image/*, video/*
        .urlMap   - [optional] array of urls in format [[url, referrer, additionRequestHeaders, additionResponseHeaders], [...], ...]
        .types    - [optional] filter by request type - xmlhttprequest
        
        [always additionaly filters by tab id]
        
        Priority [STRICT math by url in urlMap array] -> [ALL media data urls by match with - hostlist + media MIME type]
         
    */
    
    KellyEDispetcher.addRequestListeners = function(tabData) {
          
         var getRulesDataForUrl = function(url) {
        
            if (!tabData.urlMap) return false;
            
            for (var i = 0; i < tabData.urlMap.length; i++) {
                if (tabData.urlMap[i][0] == url) return tabData.urlMap[i];
            }
                
            return false;
        }
        
        // check is url headers needed to modify. if urlmap is not setted - by default accept only media urls (with ext jpg, png, etc)
        
        var isValidRequest = function(e) {
             
            if (!tabData.eventsEnabled) return 'Events disabled';

            var requestTabId = !e.tabId || e.tabId == -1 ? false : e.tabId; // unknown tabid - bug in content-script
            if (requestTabId && requestTabId != tabData.id) return 'Tab id mismatched : ' + ' request id : ' + requestTabId + ' | tab id : ' + tabData.id;

            if (getRulesDataForUrl(e.url) === false) {
                
                if (!tabData.referrer) return 'Referer for tab ' + tabData.id + ' is undefined';
                var type = KellyTools.getMimeType(KellyTools.getUrlExt(e.url));
                if (type.indexOf('image') != -1 || type.indexOf('video') != -1) return true;
                
            } else return true;
            
            return 'No matched rules';
        }
        
        if (!tabData.hostList || !tabData.hostList.length) {
            KellyTools.log('cant init webrequest events - hostlist is empty for tab [' + tabData.id + ']', 'KellyEDispetcher');
            return;
        }
        
        var filter = {urls : KellyTools.getHostlistMatches(tabData.hostList)}; 
        if (tabData.types) { 
            filter.types = tabData.types; // xmlhttprequest always, except options tab
        }
        
        if (tabData.browser != 'firefox') { // webRequests frome extension returns tabId = -1 for firefox for content-script events
            // todo : pay attention (limit by download items if not options page) \ send bug report
            filter.tabId = tabData.id;
        }
        
        if (tabData.referrer || tabData.urlMap) {
            
            tabData.onBeforeSendHeaders = function(e) {
                               
                var validatorResult = isValidRequest(e);
                if (validatorResult !== true) {
                    KellyTools.log('[SKIP REQUEST] ' + validatorResult + ' | ' + e.url);
                    return;
                }
                
                var urlData = getRulesDataForUrl(e.url);
                var referrer = urlData !== false ? urlData[1] : tabData.referrer;
                
                if (referrer) {
                    
                    KellyTools.wRequestSetHeader(e.requestHeaders, 'cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
                    
                    if (KellyTools.wRequestGetHeader(e.requestHeaders, 'If-Modified-Since')) {
                        KellyTools.wRequestSetHeader('If-Modified-Since', 'Tue, 01 Jan 1980 1:00:00 GMT');
                    }
                    
                    KellyTools.wRequestSetHeader(e.requestHeaders, 'pragma', 'no-cache');
                    KellyTools.wRequestSetHeader(e.requestHeaders, "Referer", referrer);
                    
                    if (urlData !== false && typeof urlData[2] != 'undefined') {
                        for (var key in urlData[2]) KellyTools.wRequestSetHeader(e.requestHeaders, key, urlData[2][key]);
                    }
                    
                    // validate origin, set origin = referer if incorrect
                    var origin = KellyTools.wRequestGetHeader(e.requestHeaders, 'Origin');
                    if (origin && origin.indexOf('http') == -1) {
                        KellyTools.wRequestSetHeader(e.requestHeaders, "Origin", referrer);
                    }
                    
                }
                
                KellyTools.log(e.url + ' | ' + referrer + ' [Modify REQUEST HEADERS]');                
                return {requestHeaders: e.requestHeaders};
            }
          
            KellyTools.wRequestAddListener('onBeforeSendHeaders', tabData.onBeforeSendHeaders, filter, ['requestHeaders', 'blocking'], true);   
   
            tabData.onHeadersReceived = function(e) {  
                
                   var validatorResult = isValidRequest(e);
                   if (validatorResult !== true) {
                       KellyTools.log('[SKIP RESPONSE] ' + validatorResult  + ' | ' + e.url);
                       return;
                   }
                   
                   if (e.statusCode == 200) KellyTools.wRequestSetHeader(e.responseHeaders, 'expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
                       
                   if (tabData.urlMap && (e.statusCode == 301 || e.statusCode == 302)) { // extend url map list with redirect links for use in (onBeforeSendHeaders | onHeadersReceived) on new request
                       var referrer = getRulesDataForUrl(e.url);
                       if (referrer !== false) tabData.urlMap.push([KellyTools.wRequestGetHeader(e.responseHeaders, 'location'), referrer[1]]);
                   }
                   
                   // Mixed Content - fetch [https] request get response with [http] redirect - force attempt to load throw https
                   
                   if (tabData.referrer && e.type == "xmlhttprequest" && (e.statusCode == 301 || e.statusCode == 302) && tabData.referrer.indexOf('https') != -1) {
                       var responseRedirect = KellyTools.wRequestGetHeader(e.responseHeaders, 'location');
                       if (responseRedirect !== false && responseRedirect.indexOf('http://') != -1) {
                           responseRedirect = responseRedirect.replace('http://', 'https://');
                           if (responseRedirect != e.url) KellyTools.wRequestSetHeader(e.responseHeaders, "location",  responseRedirect);
                       }
                   }
                   
                   // prevent CORS limitations 
                   
                   KellyTools.wRequestSetHeader(e.responseHeaders, "Access-Control-Allow-Origin",  "*" );  
                   
                   var urlData = getRulesDataForUrl(e.url); // addition headers from url map
                   if (urlData !== false && typeof urlData[3] != 'undefined') {
                        for (var key in urlData[3]) KellyTools.wRequestSetHeader(e.responseHeaders, key, urlData[3][key]);  
                   }
                   
                   KellyTools.log(e.url + ' [Modify RECEIVED HEADERS][Allow access][Status code : ' + e.statusCode + ']');    
                   return {responseHeaders: e.responseHeaders};
            }
            
            KellyTools.wRequestAddListener('onHeadersReceived', tabData.onHeadersReceived, filter, ['responseHeaders', 'blocking'], true);              
        }
        
        KellyTools.log(filter);
    }
    
    KellyEDispetcher.sendNotification = function(data, excludeTabIds) {
        
        if (!data || !data.method) return;
        
        var onLoadTabsMap = function(tabs){   
        
            if (KellyEDispetcher.api.runtime.lastError) {                
                KellyTools.log('cant get tab list. Error : ' + KellyEDispetcher.api.runtime.lastError.message, 'KellyEDispetcher');
                return;    
            }
            
            var tabList = '';
            for (var i = 0; i <= tabs.length-1; i++) {
                var tab = tabs[i].tab;                
                if (excludeTabIds && excludeTabIds.indexOf(tab.id) !== -1) continue;
                
                tabList += ' ' + tab.url.replace('http://', '').replace('https://', '').substring(0, 30);                
                tabs[i].port.postMessage(data);
            }
            
            KellyTools.log('send message to tabs [' + tabList + ' ] method : ' + data.method, 'KellyEDispetcher');                
        }
        
        onLoadTabsMap(KellyEDispetcher.downloaderTabs, true);        
    }
    
    // custom connections posible only by setting up port connection (onConnectExternal \ onMessageExternal)
    
    KellyEDispetcher.onMessage = function(request, sender, callback) {
            
        KellyTools.log(request, 'KellyEDispetcher');    
        KellyTools.log(sender.tab ? " request from content script : " + sender.tab.url : "from the extension", 'KellyEDispetcher');    
    
        var response = {
            
            senderId : 'dispetcher',
            error : '',
            method : request.method,
            
        }
            
        if (request.method == 'downloads.cancel') {        
            
            if (request.downloadId) {
                
                KellyTools.getBrowser().downloads.cancel(request.downloadId, function () {
                
                    if (KellyEDispetcher.api.runtime.lastError) {    
                    
                        // KellyEDispetcher.api.runtime.lastError.message;
                        // no callback currently, add if needed         
                    }
                    
                });
                
            } else {                
                KellyTools.log('Method : ' + request.method + ' : bad request', 'KellyEDispetcher');
                KellyTools.log(request, 'KellyEDispetcher');
            }
        } else if (request.method == 'tabs.buffer'){ // to send some data on tab create
            
            if (request.action == 'set') {
                    KellyEDispetcher.tabsBuffer = request.data;
            } else response.data = KellyEDispetcher.tabsBuffer;
            
        } else if (request.method == 'downloads.download') {
            
            // request.download - download options - where url can be base64 binary data \ blob url or direct url string

            response.downloadId = -1;
                 
            var saveDownloadedBlobData = function(localBlob) {
                KellyTools.getBrowser().downloads.download(request.download, function (downloadId) {
                    
                    // download job created
                    
                    if (KellyEDispetcher.api.runtime.lastError) {    
                    
                        response.error = KellyEDispetcher.api.runtime.lastError.message;
                        response.downloadId = -1;
                        
                    } else {
                    
                        response.downloadId = downloadId;
                        
                        if (!downloadId || downloadId < 0) {
                            response.downloadId = -1;
                        }
                    }
                                      
                    if (localBlob) KellyEDispetcher.blobData[downloadId] = request.download.url;
                    
                    if (callback) callback(response);                    
                });
            }
            
            /* deprecated - manifest v3 not supported */
            
            if (typeof request.download.url == 'object') { // base64 \ blob
                
                KellyTools.log('Data recieved | data type ' + request.download.url.type , 'KellyEDispetcher'); 
                if (request.download.url.base64) {
                    
                    var blob = KellyTools.base64toBlob(request.download.url.base64, request.download.url.type);                    
                    delete request.download.url.base64;
                    
                    request.download.url = URL.createObjectURL(blob);                    
                    saveDownloadedBlobData(true);
                
                } else {
                    request.download.url = request.download.url.blob;
                    saveDownloadedBlobData();
                }
                
            } else {
                
                // download process without preloaded data, curently removed from options - usless because of CORS limitations (see grabberDriver_requestMethod, REQUEST_FETCHBG in kellyGrabber)
                
                KellyTools.log('Url String recieved, download without preloaded data', 'KellyEDispetcher'); 
                saveDownloadedBlobData();
            }
            
            return true;
            
        } else if (request.method == "isDownloadSupported") {
            
            response.isDownloadSupported =  KellyEDispetcher.isDownloadSupported();
            
        } else if (request.method == "isFilesDownloaded") {
            
            if (!request.filenames || !request.filenames.length) {
                
                response.matchResults = {};
                
            } else {
                
                response.matchResults = [];
                
                var requsetSearch = function(filename) {
                
                    var regExp = KellyTools.folderPatchToRegularExpression(filename);
                    
                    var onSearchResult = function(result) {
                       
                        if (KellyEDispetcher.api.runtime.lastError) {
                        
                            response.error = KellyEDispetcher.api.runtime.lastError.message;
                            
                        } else {
                            
                            if (!result || !result.length) {
                                response.matchResults[response.matchResults.length] = {filename : filename};
                            } else {
                                response.matchResults[response.matchResults.length] = {filename : filename, match : result[0]};
                            }
                        }
                        
                        if (response.matchResults.length == request.filenames.length && callback) {
                            callback(response);
                        }
                    }
                    
                    chrome.downloads.search({filenameRegex: regExp}, onSearchResult);
                }
                
                // multiple callbacks untested
                
                for (var i = 0; i < request.filenames.length; i++) {
                                        
                    var badExpression = false;
                    
                    try {
                        
                        requsetSearch(request.filenames[i]);
                       
                    } catch (E) {
                        badExpression = true;
                    }
                    
                    if (badExpression) {
                        response.matchResults[response.matchResults.length] = {filename : request.filenames[i]};
                    }               
                }
                
                if (response.matchResults.length == request.filenames.length) {
                
                } else {                
                    return true; // async
                }
            }
        
        /* deprecated - use browser storage API instead */
        
        } else if (request.method == "getLocalStorageList") {
            
            var prefix = request.prefix;
            var keepPrefix = request.keepPrefix;
            var slist = [];
            
            if (typeof localStorage == 'undefined' || !localStorage.length) {
        
            } else {
            
                for (var i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i).indexOf(prefix) !== -1) {
                        if (keepPrefix) slist.push(localStorage.key(i));
                        else slist.push(localStorage.key(i).replace(prefix, '')); 
                    }
                }
            }
            
            response.slist = slist;
            
        /* deprecated */
        
        } else if (request.method == "getLocalStorageItem") {
            
            if (typeof localStorage != 'undefined' && request.dbName) {
                response.item = localStorage.getItem(request.dbName);
            } else response.item = false;
        
        /* deprecated */
        
        } else if (request.method == "removeLocalStorageItem") {
            
            if (typeof localStorage != 'undefined' && request.dbName) {
                localStorage.removeItem(request.dbName);
            }
            
        /* deprecated */
        
        } else if (request.method == "setLocalStorageItem") {
            
            if (request.dbName && request.data) {
                
                try {
                    
                    localStorage.setItem(request.dbName, JSON.stringify(request.data));
                    
                } catch (E) {
                    
                    response.error = E;
                    
                }
                
                if (response.error) {
                    
                } else {                   
                
                    response.error = false;
                    
                    KellyEDispetcher.sendNotification({
                        
                        method: "onUpdateStorage", 
                        updateMethod : 'setApiStorageItem', 
                        dbOrigName : request.dbOrigName, 
                        dbName :  request.dbName,
                        isCfg : request.isCfg,
                        tabId : sender.tab ? sender.tab.id : -1,
                        
                    }, sender.tab ? [sender.tab.id] : false);
                }
            }
        
        } else if (request.method == "setApiStorageItem") {
            
            if (!request.data) {
            
                response.error = 'setApiStorageItem : Data is empty';
                if (callback) callback(response);
                
            } else {
            
                KellyEDispetcher.api.storage.local.set(request.data, function() {
                
                    if (KellyEDispetcher.api.runtime.lastError) {
                        
                        response.error = KellyEDispetcher.api.runtime.lastError.message;
                        
                    } else {
                        
                        response.error = false;
                        
                        KellyEDispetcher.sendNotification({
                            
                            method: "onUpdateStorage", 
                            updateMethod : 'setApiStorageItem', 
                            dbOrigName : request.dbOrigName, 
                            dbName :  request.dbName,
                            isCfg : request.isCfg,
                            tabId : sender.tab ? sender.tab.id : -1,
                            
                        }, sender.tab ? [sender.tab.id] : false);
                    }
                    
                    if (callback) callback(response);
                });
                
                return true; // async mode
            }
            
        } else if (request.method == "removeApiStorageItem") {
            
            if (!request.dbName) {
            
                response.error = 'removeApiStorageItem : dbName is empty';
                if (callback) callback(response);
                
            } else {
            
                KellyEDispetcher.api.storage.local.remove(request.dbName, function() {
                
                    response.error = false;
                    
                    if (KellyEDispetcher.api.runtime.lastError) {
                        
                        response.error = KellyEDispetcher.api.runtime.lastError.message;
                    }
                    
                    if (callback) callback(response);
                });
                
                return true; // async mode
            
            }
            
        } else if (request.method == "getApiStorageItem") {
        
            if (!request.dbName) {
            
                response.error = 'loadApiStorageItem : dbName is empty';
                if (callback) callback(response);
                
            } else {
            
                KellyEDispetcher.api.storage.local.get(request.dbName, function(item) {
                    
                    response.item = item;
                    
                    if (KellyEDispetcher.api.runtime.lastError) {
                       
                        response.error = KellyEDispetcher.api.runtime.lastError.message;
                    }
                    
                    if (callback) callback(response);
                });	
                
                return true; // async mode
            
            }
            
        } else if (request.method == "getApiStorageItemBytesInUse") {
            
            response.bytes = 0;
            if (!request.dbName) {
            
                response.error = 'getApiStorageItemBytesInUse : dbName is empty';
                if (callback) callback(response);
                
            } else {
                
                 // can be undefined in firefox --- https://bugzilla.mozilla.org/show_bug.cgi?id=1385832                    
                if (typeof KellyEDispetcher.api.storage.local.getBytesInUse == 'undefined') {
                                       
                    KellyEDispetcher.api.storage.local.get(request.dbName, function(dbs) {
                           
                        if (typeof dbs[request.dbName] != 'undefined') response.bytes = JSON.stringify(dbs[request.dbName]).length;
                        if (callback) callback(response);
                    });
                    
                } else {
                    
                    KellyEDispetcher.api.storage.local.getBytesInUse(request.dbName, function(bytes){
                        
                        response.bytes = bytes;
                        if (callback) callback(response);                        
                    });
                }
                
                return true; // async mode
            }
                        
        } else if (request.method == "getApiStorageList") {
            
            KellyEDispetcher.api.storage.local.get(null, function(dbs) {
                
                response.slist = [];
                if (dbs) {
                    var names = Object.keys(dbs);

                    for (var i = 0; i < names.length; i++) {
                        if (names[i].indexOf(request.prefix) !== -1) {
                            if (request.keepPrefix) response.slist.push(names[i]);
                            else response.slist.push(names[i].replace(request.prefix, '')); 
                        }
                    }
                }
                
                if (callback) callback(response);
            });
            
            return true; // async mode
            
        } else if (request.method == "getResources") {
            
                // request [method, items - names, type - css \ html \ js folder in env, asObject]
                
                var loaded = 0, answerData = {notice : '',  url : '' }, loadedData = {}, defaultItemData = {type : 'css', module : ''};
                if (!request.itemsRoute) request.itemsRoute = defaultItemData;
                // if (request.icon) answerData.icon = KellyTools.getBrowser().runtime.getURL(KellyEDispetcher.envDir + 'img/icon32x32.png');
                
                var onGetResource = function(url, data, notice) {
                                       
                    KellyTools.log('Load resource ' + (data === false ? '[FAIL]' : '[OK]') + ' ' + url + (data === false ? ' | Notice : ' + notice : ''), 'KellyEDispetcher');
                                         
                    for (var key in loadedData) {
                        if (url == loadedData[key].url) {
                            loadedData[key].data = data;
                            break;
                        }
                    }  
                    
                    loaded++; 
                    answerData.url += ',' + url;
                    answerData.notice += (data === false) ? ', ' + url + ' load failed [' + notice + ']' : '';
                    
                    if (callback && loaded == request.items.length) {
                        
                        if (!request.asObject) {
                            
                            answerData.loadedData = '';
                            
                            for (var i = 0; i < request.items.length; i++) {
                                answerData.loadedData += "\n\r\n\r\n\r" + '/* ' +  request.items[i] + ' */' + "\n\r\n\r\n\r" + loadedData[request.items[i]].data + "\n\r\n\r\n\r" + '/* ' +  request.items[i] + ' end */' + "\n\r\n\r\n\r";
                            }
                            
                        } else answerData.loadedData = loadedData;
                        
                        callback({method : 'getResources', error : answerData.notice, data : answerData});
                    }
                }
                 
                var	onFail = function(url, errorCode, errorText) {
                    onGetResource(url, false, 'code : ' + errorCode + ' | ' + errorText); // perhaps bad idea combine different types \ need to check errorCode typeof
                }
                
                var onSuccess = function(data, url) { 
                    if (!data) data = false;
                    onGetResource(url, data, data === false ? 'empty data file' : 'ok'); 
                }
                
                for (var i = 0; i < request.items.length; i++) {
                    
                    /* 
                        items : ['core', 'single', 'recorderDownloader', 'recorder-filters', 'coreMobile', 'singleMobile'], 
                        itemData : {
                            'recorder-filters' : {module : 'recorder', type : 'html'},
                        }
                        
                        by default anything is css source 
                    */
                    
                    var itemRoute = request.itemsRoute.type ? request.itemsRoute : request.itemData[request.items[i]];
                    if (!itemRoute) itemRoute = defaultItemData;
                    
                    itemRoute.resultPath = itemRoute.module ? itemRoute.module + '/' : '';
                    itemRoute.resultPath += itemRoute.name ? itemRoute.name : request.items[i];
                    itemRoute.resultPath = KellyTools.validateFolderPath(KellyEDispetcher.envDir + itemRoute.type + '/' + itemRoute.resultPath + '.' + itemRoute.type);
                
                    loadedData[request.items[i]] = {url : KellyTools.getBrowser().runtime.getURL(itemRoute.resultPath), data : false};
                    
                    if (!loadedData[request.items[i]].url) {
                        onFail('unknown_' + request.items[i], false, 'unexist [' + request.type + '] file. Check manifest permissions for type and filename ' + request.items[i]);
                    } else {
                        
                        KellyTools.fetchRequest(loadedData[request.items[i]].url, { responseType : 'text' }, function(url, responseData, responseStatusCode, error, fetchRequest) {
                            if (responseData && !error) onSuccess(responseData, url); // "text/css"
                            else onFail(url, responseStatusCode, error);
                        }); 
                    }
                }
                
                return true; // async mode
                
        } else if (request.method == 'alarm') {
            
            if (request.ms && request.name) {
                
                response.name = request.name;
                setTimeout(function() { callback(response); }, request.ms);
            }
            
        } else if (request.method == "getOpenTabData") {
            
            response.tabData = KellyEDispetcher.openTabData;
        
        } else if (request.method == 'openTab') {
            
            if (request.url) {
                
                if (request.tabData) KellyEDispetcher.openTabData = request.tabData;
                
                KellyTools.getBrowser().tabs.create({url: request.url}, function(tab){
                    response.opened = true;
                    if (callback) callback(response);
                });
                
                
                return true; // async mode
            }
            
        } else {
            
            // addition events - can be implemented in separate files
            
            if (KellyEDispetcher.callEvent('onMessage', {response : response, request : request, sender : sender, callback : callback})) return;
        }
        
        if (callback) callback(response);        
    }
    
    KellyEDispetcher.callEvent = function(name, data) {
        
        var preventDefault = false;
        for (var i = 0; i < KellyEDispetcher.events.length; i++) {
            if (KellyEDispetcher.events[i][name] && KellyEDispetcher.events[i][name](KellyEDispetcher, data)) preventDefault = true;
        }
        
        return preventDefault;
    } 
    
    KellyEDispetcher.onTabConnect = function(port) {
        
        var tabData = false, reconect = false;
        
        // addition events - can be implemented in separate files
        
        if (KellyEDispetcher.callEvent('onTabConnect', {port : port})) return;
        
        KellyTools.log('[Downloader] CONNECTED | Tab : ' + port.sender.tab.id, 'KellyEDispetcher');
        
        // Check is extension from front was already connected before, happen in some cases in manifest v2 too (ex. after basic auth dialog shows + tab reload)
        
        for (var i = 0; i < KellyEDispetcher.downloaderTabs.length; i++) { 
            if (KellyEDispetcher.downloaderTabs[i].id == port.sender.tab.id) {
                KellyTools.log('[Downloader] CONNECTED | Notice : Tab was already connected : reset connection', 'KellyEDispetcher');
                reconect = true;
                tabData = KellyEDispetcher.downloaderTabs[i]; 
                tabData.closePort();
                tabData.port = port;
                break;
            }
        }
        
        var onTabMessage = function(request) {
            
            if (KellyEDispetcher.callEvent('onTabMessage', {tabData : tabData})) return;
        
            if (request.method == 'registerDownloader') {
                
                tabData.resetEvents(); 

                if (!request.disable) {
                    
                    tabData.eventsEnabled = true;
                    tabData.referrer = request.referrer;
                    tabData.types = request.types;
                    tabData.hostList = request.hostList;
                    tabData.browser = request.browser;
                    
                    if (request.urlMap) tabData.urlMap = request.urlMap;
                                        
                    KellyEDispetcher.addRequestListeners(tabData);
                }
                
                KellyTools.log('[registerDownloader][EVENTS-REGISTERED-OK]', 'KellyEDispetcher [PORT]');
                tabData.port.postMessage({method : 'registerDownloader', message: request.disable ? "disabled" : "registered"});
                
            } else if (request.method == 'setDebugMode') {
            
                KellyTools.DEBUG = request.state;
                KellyTools.log('[DEBUG MODE] ' + (KellyTools.DEBUG ? 'TRUE' : 'FALSE'), 'KellyEDispetcher [PORT]');
                tabData.port.postMessage({method : 'setDebugMode', message: "ok"});
                
            } else if (request.method == 'updateUrlMap') {
            
                if (request.urlMap) {
                    tabData.urlMap = request.urlMap;
                }
                
                tabData.port.postMessage({method : 'updateUrlMap', message: "ok"});
                
            }
        }
        
        if (tabData === false) {
            
            var tabData = {port : port, tab : port.sender.tab, id : port.sender.tab.id, eventsEnabled : false};
                tabData.resetEvents = function() {
                    
                    KellyTools.log('[registerDownloader][EVENTS-REGISTERED-RESET]', 'KellyEDispetcher [PORT]');
                    
                    tabData.eventsEnabled = false;
                    
                    try {
                        if (tabData.onBeforeSendHeaders) {
                            KellyTools.getBrowser().webRequest.onBeforeSendHeaders.removeListener(tabData.onBeforeSendHeaders);
                            tabData.onBeforeSendHeaders = false;
                        }
                        
                        if (tabData.onHeadersReceived) {
                            KellyTools.getBrowser().webRequest.onHeadersReceived.removeListener(tabData.onHeadersReceived);
                            tabData.onHeadersReceived = false;
                        } 
                    } catch (e) { 
                        KellyTools.log('FAIL to reset webRequest events', KellyTools.E_ERROR);
                    }
                    
                }    

                tabData.closePort = function() {
                    tabData.port.onMessage.removeListener(onTabMessage);
                    tabData.port.disconnect();
                }
        
            KellyEDispetcher.downloaderTabs.push(tabData);
            
        }
                
        port.postMessage({method : 'onPortCreate', message : "connected", isDownloadSupported : KellyEDispetcher.isDownloadSupported()});
        port.onMessage.addListener(onTabMessage);
        port.onDisconnect.addListener(function(p){
            
            KellyTools.log('DISCONECTED | Reason : ' + (p.error ? p.error : 'Close tab'), 'KellyEDispetcher [PORT]');
            tabData.resetEvents();
            
            if (KellyEDispetcher.downloaderTabs.indexOf(tabData) != -1) KellyEDispetcher.downloaderTabs.splice(KellyEDispetcher.downloaderTabs.indexOf(tabData), 1);
        });
    }
    
// compatibility \ testing for manifest v3

// createObjectURL - dosnt work from background (window - is undefined), so base64 transport method is impossible to implement
// downloader.download - api - crashs browser if you try to download blob - tested on 88.0.4324.96 chrome

// check rules acception - some passed only after page reload. check difference between dinamic rules and session rules
// CONNECTED  Error  already connected - check tab disconnect
// todo - keep alive

// todo - предусмотреть инструменты для фикса 301 редиректов которые легко учесть в webRequestах но нельзя в declarativeNetRequest - возможно подстановка referer так же сработает
// например добавлять в редирект контрольный get параметр или cookie и по ней отсеивать для простановки referer (+2 правила на каждую картинку)

var KellyEDispetcherDR = {
    declaredRulesId : 1000,
};

KellyEDispetcherDR.init = function() {
    
    if (KellyTools.getManifestVersion() > 2) {
        
        KellyEDispetcher.api.declarativeNetRequest.getSessionRules(function(rules) {
            
              if (KellyTools.getBrowser().runtime.lastError) {                
                    KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest'); 
                    return;
              }
                
              if (rules.length > 0) {
                    for (var i = 0; i < rules.length; i++) {
                         if (KellyEDispetcherDR.declaredRulesId < rules[i].id) {
                             KellyEDispetcherDR.declaredRulesId = rules[i].id + 1;
                         }
                    }
              }
        });
        
        KellyEDispetcher.events.push({onTabConnect : KellyEDispetcherDR.onTabConnect});
    }
}

KellyEDispetcherDR.cleanupSessionRulesForTab = function(tabId, onReady) {
            
     KellyEDispetcher.api.declarativeNetRequest.getSessionRules(function(rules) {
          
          if (KellyTools.getBrowser().runtime.lastError) {                
                KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest'); 
                if (onReady) onReady(false);
                return;
          }
            
          if (rules.length > 0) {
                var ids = [];
                for (var i = 0; i < rules.length; i++) {                    
                    if (rules[i].condition.tabIds && rules[i].condition.tabIds.indexOf(tabId) !== -1) {
                        ids.push(rules[i].id);
                    }
                }
                
                KellyEDispetcher.api.declarativeNetRequest.updateSessionRules({addRules : [], removeRuleIds : ids}, function() {
                    
                    KellyTools.log('[Cleanup] session Rules | Num : ' + ids.length + ' [TabId : ' + tabId + '] ',  'KellyEDispetcher | declarativeNetRequest'); 
                    
                    if (KellyTools.getBrowser().runtime.lastError) {                
                        KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest'); 
                        if (onReady) onReady(false);
                        return;
                    } else {
                        if (onReady) onReady(true);
                    }
                    
               });
          } else {
              
              KellyTools.log('[Cleanup] session Rules | Num : [nothing to cleanup] [TabId : ' + tabId + '] ',  'KellyEDispetcher | declarativeNetRequest'); 
                    
              if (onReady) onReady(true);
          }
    });
}

/*
    tabData request rules described in kellyDispetcher
*/
    
KellyEDispetcherDR.addRequestListeners = function(tabData, onRegistered) {
    
    tabData.declaredRules = [];
     
    var addRule = function(params) {
       
       var priority = 2;
       
       if (typeof params.matches == "string" && params.matches == 'ANY') {
           priority = 1;
           params.matches = '|http*';
       }
       
       var responseHeaders = [
            { "header" : "Access-Control-Allow-Origin", "operation" : "set", "value": "*" },  
            
            { "header" : "Pragma-directive", "operation" : "set", "value": "no-cache" },             
            { "header" : "Cache-directive", "operation" : "set", "value": "no-cache" }, 
            { "header" : "Cache-control", "operation" : "set", "value": "no-cache" }, 
            { "header" : "Pragma", "operation" : "set", "value": "no-cache" },
            { "header" : "Expires", "operation" : "set", "value": "0" }, 
        ];
        
        if (typeof params.additionResponseHeaders != 'undefined') {
            for (var key in params.additionResponseHeaders) {
                responseHeaders.push({"header" : key, "operation" : "set", "value" : params.additionResponseHeaders[key]});
            }
        }
        
        var requestHeaders = [
            { "header" : "cache-control", "operation" : "set", "value" : "no-cache, must-revalidate, post-check=0, pre-check=0" },
            { "header" : "pragma", "operation" : "set",  "value" : 'no-cache' },
            { "header" : "Referer", "operation" : "set", "value" : params.referrer },    
        ];

        if (typeof params.additionRequestHeaders != 'undefined') {
            for (var key in params.additionRequestHeaders) {
                requestHeaders.push({"header" : key, "operation" : "set", "value" : params.additionRequestHeaders[key]});
            }
        }
        
        if (typeof params.matches == "string") {
            params.matches = [params.matches];
        }
        
        for (var i = 0; i < params.matches.length; i++) {
            
           KellyEDispetcherDR.declaredRulesId++;
           
           tabData.declaredRules.push({
                "id" : KellyEDispetcherDR.declaredRulesId, // tabData.declaredRules.length + 1,
                "action": {
                    "type" : "modifyHeaders",
                    "requestHeaders" : requestHeaders,
                    "responseHeaders" : responseHeaders,
                },
                "condition": { 
                    "urlFilter" : params.matches[i], 
                    "resourceTypes" : tabData.types ? tabData.types : ['main_frame', 'image', 'xmlhttprequest', 'media'],
                    "tabIds" : [tabData.id],
                },
                "priority" : priority,
           }); 
       }
    }
     
    if (tabData.referrer) {
        addRule({matches : KellyTools.getHostlistMatches(tabData.hostList, true), referrer : tabData.referrer});
    } 
    
    if (tabData.urlMap) {
        for (var i = 0; i < tabData.urlMap.length; i++) {
                        
            addRule({
                matches : tabData.urlMap[i][0], 
                referrer : tabData.urlMap[i][1], 
                additionRequestHeaders : tabData.urlMap[i][2], 
                additionResponseHeaders : tabData.urlMap[i][3],
            });
        }  
    }
                      
    KellyEDispetcher.callEvent('onBeforeUpdateNetRequestRules', tabData);
                    
    KellyTools.getBrowser().declarativeNetRequest.updateSessionRules({addRules : tabData.declaredRules, removeRuleIds : []}, function() {
        
        if (KellyTools.getBrowser().runtime.lastError) {                
            KellyTools.log('Error : ' + KellyTools.getBrowser().runtime.lastError.message, 'KellyEDispetcher | declarativeNetRequest');         
        } else {
               
            KellyTools.log('[ADD] session Rules | Num : ' + tabData.declaredRules.length + ' [TabId : ' + tabData.id + ']', 'KellyEDispetcher | declarativeNetRequest');
        }
        
        onRegistered();
    });
    
}

KellyEDispetcherDR.onTabConnect = function(self, data) {
    
    var port = data.port, reconect = false;
    var tabData = false;
    
    KellyTools.log('[Downloader] CONNECTED  Tab  ' + port.sender.tab.id, 'KellyEDispetcher | declarativeNetRequest');
        
    // Check is extension from front was already connected before
    // This can happen IN case worker was killed, or some other unpredicted event happend (port closed, page reloaded without callback, etc.)
    
    for (var i = 0; i < KellyEDispetcher.downloaderTabs.length; i++) {
        if (KellyEDispetcher.downloaderTabs[i].id == port.sender.tab.id) {
            KellyTools.log('[Downloader] Tab was already connected : reset connection, change port', 'KellyEDispetcher | declarativeNetRequest');
            reconect = true;
            
            tabData = KellyEDispetcher.downloaderTabs[i];      
            tabData.closePort();
            
            tabData.port = port;
            break;
        }
    } 
         
    var onDownloaderMessage = function(request) {

       var response = {
           notice : false,
           message : 'ok',
           method : request.method,
           ready : function() {
               
                if (response.notice) KellyTools.log(response.notice, 'KellyEDispetcher [PORT]');
                
                tabData.port.postMessage({method : response.method, message : response.message});        
           }
       }
       
       if (request.method == 'registerDownloader') {
            
            tabData.resetEvents('Init new tab', function() {
                
                response.notice = 'Update registerDownloader request modifiers';
                response.message = request.disable ? "disabled" : "registered";

                if (!request.disable) {
                    
                    tabData.referrer = request.referrer;
                    tabData.types = request.types;
                    tabData.hostList = request.hostList;
                    
                    if (request.urlMap) tabData.urlMap = request.urlMap;
                    if (tabData.urlMap && request.unlistedReferer) tabData.urlMap.push(['ANY', request.unlistedReferer]);
                    
                    KellyEDispetcherDR.addRequestListeners(tabData, response.ready);  
       
                    tabData.eventsEnabled = true;
                    
                } else {
                    
                    tabData.eventsEnabled = false;
                    response.ready();
                    
                }
                
            });            
            
       } else if (request.method == 'setDebugMode') {
        
            KellyTools.DEBUG = request.state;
            response.notice = 'Tab loaded in debug mode, switch background process debug mode to ' + (KellyTools.DEBUG ? 'TRUE' : 'FALSE');
            response.ready();
            
        } else if (request.method == 'updateUrlMap') {
                                 
            tabData.resetEvents('Update url map', function() {
                   
                if (!tabData.eventsEnabled) {
                    
                    response.message = "tab not initialized. use registerDownloader method first";                    
                    KellyTools.log('[updateUrlMap] ' + response.message);
                    
                    response.ready();
                    return;
                }
                
                if (request.urlMap) {
                    tabData.urlMap = request.urlMap;
                }
                
                if (tabData.urlMap && request.unlistedReferer) tabData.urlMap.push(['ANY', request.unlistedReferer]);
                                    
                KellyEDispetcherDR.addRequestListeners(tabData, response.ready);
                
            }); 
            
        } else {
            
            KellyTools.log('Unknown request', 'KellyEDispetcher [PORT]');
            KellyTools.log(request);
        }
    }
    
    if (tabData === false) {
        
        tabData = {port : port, tab : port.sender.tab, id : port.sender.tab.id, declaredRules : [], eventsEnabled : false};
        tabData.resetEvents = function(reason, onReady) {

            KellyEDispetcherDR.cleanupSessionRulesForTab(tabData.id, function() {
                
                KellyTools.log('resetEvents [READY] | Reason : ' + (reason ? reason : 'no reason'), 'KellyEDispetcher [PORT]');                
                tabData.declaredRules = [];
                if (onReady) onReady();
            });
        }
        
        tabData.closePort = function() {
            tabData.port.onMessage.removeListener(onDownloaderMessage);
            tabData.port.disconnect();
        }
    
        KellyEDispetcher.downloaderTabs.push(tabData);
    }
    
    tabData.port.postMessage({method : 'onPortCreate', message : 'connected', isDownloadSupported : KellyEDispetcher.isDownloadSupported()});
    tabData.port.onMessage.addListener(onDownloaderMessage);
        
    tabData.port.onDisconnect.addListener(function(p){
        
        KellyTools.log('[DISCONECTED] | Reason : ' + (p.error ? p.error : 'Close tab'), 'KellyEDispetcher [PORT]');
        tabData.resetEvents('Disconect tab');
        tabData.closePort();
        
        if (KellyEDispetcher.downloaderTabs.indexOf(tabData) != -1) KellyEDispetcher.downloaderTabs.splice(KellyEDispetcher.downloaderTabs.indexOf(tabData), 1);
    });
    
    return true;
}

KellyEDispetcherDR.init();
    
// m.reactor.cc
// mobile version, for other subdomains enough urlMap keeped in joyreactor.js profile (dont needed to set dynamic allow origin there)
        
var KellyEDJRUnlocker = {
    
     defaultCfg : {
         webRequest : true,
         unlock : {censored : true},
     },
     
     cfgName : 'kelly_cfg_joyreactor_config',
     
     cfg : false,
};

KellyEDJRUnlocker.getInitiatorUrl = function(e) {
     
         if (typeof e.initiator != 'undefined') return e.initiator;
    else if (typeof e.documentUrl != 'undefined') return KellyTools.getLocationFromUrl(e.documentUrl).origin;
    else if (typeof e.originUrl != 'undefined') return KellyTools.getLocationFromUrl(e.originUrl).origin;
    else if (e.tabId == -1) return 'unknown-extension://unknown';
    else return 'default';
} 

KellyEDJRUnlocker.initDRequest = function() {
    
     if (KellyEDJRUnlocker.cfg.webRequest && KellyEDJRUnlocker.cfg.unlock && KellyEDJRUnlocker.cfg.unlock.censored) {                    
        
         KellyEDispetcher.events.push({onBeforeUpdateNetRequestRules : function(self, tabData) {
                 
                var urlFilter = ['https://api.joyreactor.cc/graphql', 'http://api.joyreactor.cc/graphql', 'http://api.joyreactor.cc/graphql?unlocker=1', 'https://api.joyreactor.cc/graphql?unlocker=1'], newRules = [];
                var getDefaultRule = function(url) {
                    
                     KellyEDispetcherDR.declaredRulesId++;
                     
                     return {
                         
                        "id" : KellyEDispetcherDR.declaredRulesId,
                        
                        "action": {
                            "type" : "modifyHeaders",
                            "requestHeaders" : [
                                { "header": "Origin", "operation": "set", "value": 'https://api.joyreactor.cc' },                    
                            ],
                            "responseHeaders" : [
                                 { "header": "Access-Control-Allow-Origin", "operation": "set", "value": KellyTools.getLocationFromUrl(tabData.port.sender.tab.url).origin}, 
                                 { "header": "Access-Control-Allow-Credentials", "operation": "set", "value": "true" },
                                 { "header": "Access-Control-Allow-Headers", "operation": "set", "value": "Origin, X-Requested-With, Content-Type, Accept" },
                            ],
                        },
                        
                        "condition": { 
                            "urlFilter" : url, 
                            "resourceTypes" : ['xmlhttprequest', 'other'],
                            "tabIds" : [tabData.port.sender.tab.id],
                        },
                        
                        "priority" : 1,
                        
                    };                
                }
                
                for (var i = 0; i < urlFilter.length; i++) {
                     tabData.declaredRules.push(getDefaultRule(urlFilter[i]));
                }
                
                KellyTools.log('Unlock active', 'KellyEDispetcher | declarativeNetRequest | [JoyReactor Unlocker]');             
               
         }});
     }
     
}

KellyEDJRUnlocker.initWebRequest = function() {
    
    if (KellyEDJRUnlocker.cfg.webRequest && KellyEDJRUnlocker.cfg.unlock && KellyEDJRUnlocker.cfg.unlock.censored) {                    
        
        KellyTools.log('Unlock active', 'KellyEDispetcher'); 
        
        var filter = {urls : ['*://api.joyreactor.cc/graphql', '*://api.joyreactor.cc/graphql?unlocker=1'], types : ['xmlhttprequest', 'other']}; // other - filter for old FFs
                        
        KellyTools.wRequestAddListener('onBeforeSendHeaders', function(e) {
            
            var url = KellyEDJRUnlocker.getInitiatorUrl(e);
            if (url.indexOf('://m.') == -1 && url.indexOf('-extension://') == -1) return;
            
            KellyTools.wRequestSetHeader(e.requestHeaders, "Origin", 'https://api.joyreactor.cc');
            
            KellyTools.log(e.url + ' [JOYREACTOR UNLOCKER] [Modify REQUEST HEADERS]');                    
            return {requestHeaders: e.requestHeaders};
            
        }, filter, ['requestHeaders', 'blocking'], true);         
        
        KellyTools.wRequestAddListener('onHeadersReceived', function(e) {
           
           var url = KellyEDJRUnlocker.getInitiatorUrl(e);
           if (url.indexOf('://m.') == -1 && url.indexOf('-extension://') == -1) return; // needed only on new new version (graphQL API based) of reactor and on ext separate page
           // if (url.indexOf('m.reactor.cc') != -1) return; // if domain use old mobile template - you need use default behaiv from kellyDispetcher
           
           KellyTools.wRequestSetHeader(e.responseHeaders, "Access-Control-Allow-Origin", url);
           KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Credentials', "true");
           KellyTools.wRequestSetHeader(e.responseHeaders, 'Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept"); 
                           
           // console.log(e.responseHeaders)
           KellyTools.log(e.url + ' [JOYREACTOR UNLOCKER] [Modify RECEIVED HEADERS]');
           return {responseHeaders: e.responseHeaders};
            
        }, filter, ['responseHeaders', 'blocking'], true); 
    }
}

KellyEDJRUnlocker.init = function() {
    
    if (KellyEDJRUnlocker.enabled) return;
    var cfgName = KellyEDJRUnlocker.cfgName;
    KellyEDispetcher.api.storage.local.get(cfgName, function(item) {
    
        KellyEDJRUnlocker.cfg = item && item[cfgName] && item[cfgName]['coptions'] ? item[cfgName]['coptions'] : KellyEDJRUnlocker.defaultCfg;
        
        if (KellyEDJRUnlocker.cfg.unlock && !KellyEDJRUnlocker.cfg.unlock.mreact) {
            KellyTools.log('[JOYREACTOR UNLOCKER] [Globaly disabled]');
            KellyEDJRUnlocker.enabled = true;
            return;
        }
        
        if (KellyTools.getManifestVersion() > 2) {
            KellyEDJRUnlocker.initDRequest();
        } else {
            KellyEDJRUnlocker.initWebRequest();
        }
                
        KellyEDJRUnlocker.enabled = true;
        
    });
};

KellyEDJRUnlocker.init();
    
var KellyEDRecorder = new Object;
    KellyEDRecorder.cacheEnabled = false;
    KellyEDRecorder.recorder = {};
    
    // todo - save recorder state cache for manifest v3
    
    KellyEDRecorder.getDefaultRecorder = function() {
        return {
            images : [],     // array of founded images, could be collected from various tabs - see kellyPageWatchdog (imagesPool = []) for object description
            record : false,  // is recording enabled
            cats : {},       // array of category objects that extends KellyDPage.cats
            host : false,    // used as profile name only, images[] could be taken from various hosts and contain different [referrer]
            url : false,     // used as profile name only
            srcs : [],       // list of all added relatedSrc strings during record process, to prevent dublicates
        };
    }
    
    KellyEDRecorder.loadState = function() {
        KellyEDispetcher.api.storage.local.get('kelly_cache_recorder', function(response) {
            
            var result = 'OK';
            if (KellyEDispetcher.api.runtime.lastError) {
                result = KellyEDispetcher.api.runtime.lastError.message;
            }
            
            if (!response || response === null || !response['kelly_cache_recorder'] || typeof response['kelly_cache_recorder'].srcs == 'undefined') {
                result = 'Bad storage item - Reset';
                response['kelly_cache_recorder'] = KellyEDRecorder.getDefaultRecorder();
            } 
            
            KellyEDRecorder.recorder = response['kelly_cache_recorder'];
            KellyTools.log('[loadState] [' + result + ']', 'KellyEDRecorder');  
        });
    }
    
    // base64 items can be very heavy, calc max size ?
    
    KellyEDRecorder.saveState = function() {
        
        KellyEDispetcher.api.storage.local.set({'kelly_cache_recorder' : KellyEDRecorder.recorder}, function() {
            
            var result = 'OK';
            if (KellyEDispetcher.api.runtime.lastError) {
                result = KellyEDispetcher.api.runtime.lastError.message;
            }
            
            KellyTools.log('[saveState] [' + result + ']', 'KellyEDRecorder');
        });
    }
    
    KellyEDRecorder.init = function() {
        
        KellyEDRecorder.cacheEnabled = KellyTools.getManifestVersion() > 2 ? true : false;
        if (KellyEDRecorder.cacheEnabled) KellyEDRecorder.loadState();
        
        KellyEDispetcher.events.push({onMessage : KellyEDRecorder.onMessage});
    }
    
    KellyEDRecorder.onMessage = function(dispetcher, data) {
        
        var response = data.response; // default response array {senderId : 'dispetcher', error : '', method : request.method,}
        var request = data.request;
        var callback = function () {
           
           if (KellyEDRecorder.cacheEnabled) KellyEDRecorder.saveState(); 
           if (data.callback) data.callback(response);
           
           return true;
        }
        
        if (request.method == 'addRecord') {
            
            response.imagesNum = 0;
            
            if (request.clean) { // start record and skip check recording state
                       
                 KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
                     
            } else if (!KellyEDRecorder.recorder.record) { // add if recording
                
                response.error = 'Record is not enabled';
                return callback();
            }
            
            if (request.host && !KellyEDRecorder.recorder.host) {
                
                KellyEDRecorder.recorder.host = request.host;
                KellyEDRecorder.recorder.url = request.url;
            }
            
            KellyTools.log('[addRecord] : images : ' + request.images.length + ' | cats : ' + (request.cats ? Object.keys(request.cats).length : 'not setted'));
            
            // addition categories information (color \ name etc.)
            
            if (request.cats) {
                
                for (var k in request.cats) {
                    
                    if (typeof KellyEDRecorder.recorder.cats[k] == 'undefined') {
                        
                        KellyEDRecorder.recorder.cats[k] = request.cats[k];
                    }
                }
            }
    
            if (request.images) {
                                
                for (var i = 0; i < request.images.length; i++) {
                    
                    var validatedSrc = [], validatedGroups = [];
                    
                    for (var srcIndex = 0; srcIndex < request.images[i].relatedSrc.length; srcIndex++) {
                        
                        if (KellyEDRecorder.recorder.srcs.indexOf(request.images[i].relatedSrc[srcIndex]) != -1) {
                            
                            if (!request.allowDuplicates) continue;
                            // console.log('skip ' + request.images[i].relatedSrc[srcIndex]);                
                            
                        } else {
                            
                            KellyEDRecorder.recorder.srcs.push(request.images[i].relatedSrc[srcIndex]);
                        }
                        
                        validatedSrc.push(request.images[i].relatedSrc[srcIndex]);
                        if (request.images[i].relatedGroups && request.images[i].relatedSrc[srcIndex]) validatedGroups[srcIndex] = request.images[i].relatedGroups[srcIndex];
                    }
                    
                    if (validatedSrc.length > 0) {
                        
                        request.images[i].relatedSrc = validatedSrc;
                        
                        if (validatedGroups.length > 0) request.images[i].relatedGroups = validatedGroups;
                        else delete request.images[i].relatedGroups;
                        
                        KellyEDRecorder.recorder.images.push(request.images[i]);
                    } else {
                        // console.log('skip, no new images');
                        // console.log(KellyEDRecorder.recorder.images[i]);
                    }
                }  
            }
            
            response.imagesNum = KellyEDRecorder.recorder.images.length;
            return callback();
            
        } else if (request.method == 'getRecord') {
            
            if (!KellyEDRecorder.recorder || !KellyEDRecorder.recorder.images) {
                KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
            }
            
            response.images = KellyEDRecorder.recorder.images;
            response.cats = KellyEDRecorder.recorder.cats;
            response.url = KellyEDRecorder.recorder.url;
            response.host = KellyEDRecorder.recorder.host;
            
            return callback();
            
        } else if (request.method == 'startRecord') {
            
            response.isRecorded = true; 
            
            KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();            
            KellyEDRecorder.recorder.record = true;
            
            return callback();
            
        }  else if (request.method == 'stopRecord') {
            
            if (request.clean) KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
            
            response.isRecorded = false;
            response.imagesNum = KellyEDRecorder.recorder.images.length;
            KellyEDRecorder.recorder.record = false;
            
            return callback();
            
        } else if (request.method == 'isRecorded') {
            
            response.isRecorded = KellyEDRecorder.recorder.record ? true : false; 
            response.imagesNum = 0;
            
            if (response.isRecorded) response.imagesNum = KellyEDRecorder.recorder.images.length;
            
            return callback();
        }
        
        return false;
    }
    
    KellyEDRecorder.init();
    
KellyEDispetcher.init();

// keep empty space to prevent syntax errors if some symbols will added at end
       

 

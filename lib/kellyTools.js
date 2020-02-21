// part of KellyFavItems extension

KellyTools = new Object();

KellyTools.DEBUG = false;
KellyTools.E_NOTICE = 1;
KellyTools.E_ERROR = 2;

KellyTools.PROGNAME = '';


// Get screen width \ height

KellyTools.getViewport = function() {

    var elem = (document.compatMode === "CSS1Compat") ? 
        document.documentElement :
        document.body;

    var height = elem.clientHeight;
    var width = elem.clientWidth;	
    
    return {
        screenHeight: height,
        screenWidth: width,
    };
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
        
KellyTools.stopMediaLoad = function(loadDoc) {

    var cleared = 0;
    var loadImages = loadDoc.getElementsByTagName('img');
    for (var i = 0; i < loadImages.length; i++) {            
        loadImages[i].src = '';            
        cleared++;
    }
    
    loadImages = loadDoc.getElementsByTagName('source');
    for (var i = 0; i < loadImages.length; i++) {            
        loadImages[i].src = '';
        cleared++;
    }
    
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

// html must be completed and valid. For example - input : <table><tr><td></td></tr></table> - ok,  input : <td></td><td></td> - will add nothing 

KellyTools.setHTMLData = function(el, val) {
    
    if (!el) return;
    el.innerHTML = '';
    
    if (val) {
        var valBody = KellyTools.val(val, 'html');
       
        if (valBody && valBody.childNodes) { 
            while (valBody.childNodes.length > 0) {
                el.appendChild(valBody.childNodes[0]);
            }
        }
    }
}

KellyTools.classList = function(action, el, val) {
    
    if (action == 'add') {
        el.classList.add(val);
    } else if (action == 'remove') {
        el.classList.remove(val);
    }
}

KellyTools.toogleActive = function(el) {
    
    if (el.className.indexOf('hidden') != -1) {
        el.className = el.className.replace('hidden', 'active');
    } else {
        el.className = el.className.replace('active', 'hidden');
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

KellyTools.fitText = function(parent, textEl, noExtHeight) {
    
    var bounds = textEl.getBoundingClientRect();
    var parentBounds = parent.getBoundingClientRect();

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
    
    if (url.indexOf('http') == -1 && (url.charAt(0) != '/' && url.charAt(1) != '/')) {
        url = '//' + url;
    }
    
    return url;
}

KellyTools.getUrlFileName = function(url, excludeExt, noDecode) {
    if (!url) return '';
    
    url = url.split("?");
    url = url[0];
    
    if (!url) return '';
    
    url = url.substring(url.lastIndexOf('/')+1);    
    
    if (!noDecode && url.indexOf('%') != -1) {
        url = decodeURIComponent(url);
        url = url.replace(/[^а-яА-Яa-z0-9áéíóúñü ._-]/gim, "");
    } 
    
    if (excludeExt && url.indexOf('.') != -1) {       
        url = url.substr(0, url.indexOf('.'));
    }
    
    return url;
}

KellyTools.getUrlExt = function(url) {
             
    url = url.split("?");
    url = url[0];
    
    return this.getExt(url);        
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

KellyTools.getPrintValues = function(print, reverse, limitFrom, limitTo) {

    var itemsToSelect = [];
    var options = print.split(',');
    
    if (typeof limitTo == 'undefined') {
        limitTo = false;
    } 
    
    if (typeof limitFrom == 'undefined') {
        limitFrom = false;
    }
    
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

            for (var b = option[0]; b <= option[1]; b++) {
                if (limitTo !== false && b > limitTo) continue;
                if (limitFrom !== false && b < limitFrom) continue;
                if (itemsToSelect.indexOf(b) == -1) itemsToSelect[itemsToSelect.length] = b;
            }

        } else {
            if (limitTo !== false && option[0] > limitTo) continue; 
            if (limitFrom !== false && option[0] < limitFrom) continue;            
            if (itemsToSelect.indexOf(option[0]) == -1) itemsToSelect[itemsToSelect.length] = option[0];
        }

    }
    
    if (!reverse) {
        itemsToSelect.sort(function(a, b) {
          return a - b;
        });
    } else {
        itemsToSelect.sort(function(a, b) {
          return b - a;
        });
    }
    
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
    
    if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') { // Edge has this object, but runtime is undefined
        return chrome;
    } else if (typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined') {
        return browser;
    } else {
        console.log('browser not suppot runtime API method');
        return false;
    }
}

KellyTools.getExt = function(str, limit) {
    
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
            if (!!window.chrome && !!window.chrome.webstore) return 'chrome';
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
    
    if (!module) module = 'Kelly';
  
    if (!errorLevel) {
        errorLevel = KellyTools.E_NOTICE;
    }    
     
    if (!this.DEBUG && errorLevel < KellyTools.E_ERROR) {
        return;
    }
    
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

KellyTools.getTime = function() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    
    if (minutes < 10){
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes;
}

// 2018_09_09__085827

KellyTools.getTimeStamp = function() {
    date = new Date();
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

KellyTools.getParentByClass = function(el, className, strict) {
    var parent = el;
 
    while (parent && ((strict && !parent.classList.contains(className)) || (!strict && parent.className.indexOf(className) != -1))) {
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

// simple read by XMLHttpRequest method any local "Access-Control-Allow-Origin" url
// callback onLoad - executed only on succesful load data (response status = 200)
// callback onFail - executed in any other case - any problems during load, or bad response status

KellyTools.readUrl = function(url, onLoad, onFail, method, async, mimeType) {

    if (!method) method = 'GET';
    if (typeof async == 'undefined') async = true;

    var request = new XMLHttpRequest();
        request.open(method, url, async);
        
        if (mimeType) {
            
           request.overrideMimeType(mimeType);
        }        

        request.onload = function() {
            if (this.status == 200) {
                onLoad(this.response, url);
            } else {
                onFail(url, this.status, this.statusText);
            }
        };

        request.onerror = function() {
           onFail(url, -1);
        };

        request.send();
}

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
        return false;
    }
    
    if (!parent) return false;
    
    var childNodes = parent.getElementsByClassName(className);
    
    if (!childNodes || !childNodes.length) return false;
    
    return childNodes[0];
}

KellyTools.parseJSON = function(json) {
    
    var data = false;
    
    if (json) {
        try {
            data = JSON.parse(json);
        } catch (e) {
            data = false;
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
        script.src = chrome.extension.getURL('env/dynamic/' + addition + '.js'); 
        
        if (onLoad) {
            script.onload = onLoad;
        }
    
    this['injection_' + addition] = script;
    
    document.body.appendChild(script); 
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
    if (this.PROGNAME) return this.PROGNAME;
    this.PROGNAME = KellyLoc.s('', 'ext_name') + ' v' + (this.getBrowser() && this.getBrowser().runtime.getManifest ? this.getBrowser().runtime.getManifest().version : '');
    return this.PROGNAME ;
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
    
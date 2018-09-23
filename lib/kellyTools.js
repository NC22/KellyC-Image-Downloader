// todo move helpfullcommon functions from main class FavItemsHelper to here

KellyTools = new Object();

// turn this - '2, 4, 66-99, 44, 78, 8-9, 29-77' to an array of all values [2, 4, 66, 67, 68 ... etc] in range

KellyTools.getPrintValues = function(print, reverse) {

	var itemsToSelect = [];
	var options = print.split(',');
	
	for (var i = 0; i < options.length; i++) {

		var option = options[i].trim().split('-');
		if (!option.length || !option[0]) continue;
		if (option.length <= 1) option[1] = -1;
		

		option[0] = parseInt(option[0]);
		if (option[1]) option[1] = parseInt(option[1]);

		if (option[0] == option[1]) option[1] = -1;

		if (option[1] !== -1) {

			if (option[1] < option[0]) continue;

			for (var b = option[0]; b <= option[1]; b++) {
				if (itemsToSelect.indexOf(b) == -1) itemsToSelect[itemsToSelect.length] =b;
			}

		} else {

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

KellyTools.getBrowser = function() {
    
    // chrome - Opera \ Chrome, browser - Firefox
    
    if (typeof chrome !== 'undefined') {
        return chrome;
    } else if (typeof browser !== 'undefined') {
        return browser;
    } else {
        console.log('browser not support download API');
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
    
    return ext;
}

KellyTools.log = function(info, module) {
	
	if (!module) module = 'Kelly';
	
	if (typeof info == 'object' || typeof info == 'function') {
		console.log(module + ' : [' + KellyTools.getTime() + '] var output :');
		console.log(info);
	} else {
		console.log(module + ' : [' + KellyTools.getTime() + '] '+ info);
	}
}

KellyTools.getTime = function() {
	var currentTime = new Date();
	var hours = currentTime.getHours();
	var minutes = currentTime.getMinutes();
	
	if (minutes < 10){
		minutes = "0" + minutes;
	}
	return hours + ":" + minutes;
}

KellyTools.createAndDownloadFile = function(data, filename, mimetype) {

	if (!data) return false;
	if (!KellyTools.getBrowser()) return false;
	
	var ext = KellyTools.getExt(filename);
	if (!ext) ext = 'txt';
	
	if (!mimetype) {
		mimetype = 'application/x-' + ext;
		
		// MIME type list http://webdesign.about.com/od/multimedia/a/mime-types-by-content-type.htm
		
			 if (ext == 'jpg' || ext == 'jpeg') mimetype = 'image/jpeg';
		else if (ext == 'png' ) mimetype = 'image/png';
		else if (ext == 'gif' ) mimetype = 'image/gif';
		else if (ext == 'zip' ) mimetype = 'application/zip';
		else if (ext == 'txt' ) mimetype = 'text/plain';
		else if (ext == 'json' ) mimetype = 'application/json';
	}
	
	if (filename.indexOf('.') == -1) filename += '.' + ext;
	

	var blobData = new Blob([data], {type : mimetype});
	
	var downloadOptions = {
		filename : filename, 
		conflictAction : 'uniquify',
		method : 'GET',
	}

	downloadOptions.url = URL.createObjectURL(blobData);  
	
	KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", blob : true, operationId : -1, download : downloadOptions}, function(response){});             

	return true;
}

KellyTools.getParentByClass = function(el, className) {
	var parent = el;
 
	while (parent && parent.className != className) {
		parent = parent.parentElement;
	}  
	
	return parent;
}

KellyTools.readFile = function(input, onRead) {
	
	if (!input) return false;
	
 	var file = input.files[0];
 
	if (file) {
	
      var fileReader = new FileReader();
          fileReader.onloadend = function (e) {
				if (onRead) onRead(input, e.target.result);
          };
          
		  fileReader.readAsText(file)
		
		return true;
    } else return false;
}	

KellyTools.readUrl = function(url, onLoad, onFail, method, async) {

	if (!method) method = 'GET';
	if (typeof async == 'undefined') async = true;

	var request = new XMLHttpRequest();
		request.open(method, url, async);

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
	
	if (str[str.length-1] != '/') str += '/';
	
	if (str.indexOf('http') == -1) {
	
	} else {        
		str = str.replace(/^(?:\/\/|[^\/]+)*\//, "");
	}

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
			data = window.JSON && window.JSON.parse ? JSON.parse(json) : eval('(' + json + ')');
		} catch (E) {
			log('fail to load json data : ' + json);            
		}
	} else {
		log('empty json');
	} 

	return data;
}

// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript

KellyTools.replaceAll = function(text, search, replace) {
    return text.replace(new RegExp(search, 'g'), replace);
}
    

// важно создавать объект KellyGrabber в рамках процесса-вкладки с которой будут сохраняться картинки \ данные.
// т.к. при скачивании из фона хром не создает заголовки referer, что повликает проблемы вроде наличи дополнительных вотермарок \ блокировки \ ограничения загрузки со стороны сервера на котором
// расположена картинка. Любой сервер потенциально может принять скачивание без должных заголовков за атаку \ бота

// todo сортировать в списке названия папок по алфавиту

// сохранять послежний выбор

/*

в режиме менеджера загрузки заменять основной список элементов тайловой сетке таблицей того что выгрузкить
построничная навигация идентична 200-300 элеметов на страницу

там помечать элементы которые добавляем к загрузке

// пронумеровать элементы в списке. выбор какие скачивать как при выводе на печать, чтобы не прокликивать чекбоксы

набросок

*/

function KellyGrabber(cfg) {
    
    var handler = this;   
    var downloadingIds = [];
    var downloads = [];
    var events = { onDownloadAllEnd : false, onDownloadFile : false }
    
    var container = false;
    var style = false;
    var className = 'kellyGrabber-';
    
    var buttons = {};
    var baseFolderInput = false;
    var btnsSection = false;
    
    var baseFolder = 'kellyGrabber';
    var operationId = 0;
    var maxDownloadsAtTime = 10;
    
    var mode = 'wait';
    var eventsEnabled = false;
    
    function constructor(cfg) { 
        
        if (cfg) {
            if (cfg.container) handler.setContainer(cfg.container); 
            if (cfg.events) events = cfg.events;
            if (cfg.baseFolder) handler.setBaseFolder(cfg.baseFolder);
        }
           
        // assign events with first download start
           
        handler.initCss();
    }
    
    function assignEvents() {
    
        if (eventsEnabled) return;
        
        // sometimes runtime may be undefined after debug breakpoints
        // https://stackoverflow.com/questions/44234623/why-is-chrome-runtime-undefined-in-the-content-script
        
        KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.addListener"}, function(response) {});
                
        KellyTools.getBrowser().runtime.onMessage.addListener(
          function(request, sender, sendResponse) {

            if (request.method == "onChanged") {       
                
                handler.onDownloadProcessChanged(request.downloadDelta);
                
            }
            
            if (request.method == "setDownloadIdByOperationId") {       
                
                handler.setDownloadIdByOperationId(request.operationId, request.downloadId);
                
            }
        });  
        
        eventsEnabled = true;
    
    }
    
    this.initCss = function() {
        
        if (style) return true;
        
        var css = '';
        css += "\
            ." + className + "item { margin-bottom : 12px; display : block; line-height : 1; height : 16px; font-size : 12px; }\
            ." + className + "item-state-holder { display : inline-block; }\
            ." + className + "item-state { display : inline-block; margin-left : 12px; margin-right : 12px; width : 16px; height : 16px; background : #2bff4f; border-radius: 8px; border : 1px solid 1px solid rgba(0,0,0,0.3); }\
            ." + className + "item-state-err { width : 16px; height : 16px; background : #ff2b2b; border : 1px solid 1px solid rgba(0,0,0,0.3); }\
            ." + className + "item-state-loading { width : 16px; height : 16px; background : #ff972b; border : 1px solid 1px solid rgba(0,0,0,0.3); }\
            ." + className + "controll { height : 58px; }\
            ";      

        var head = document.head || document.getElementsByTagName('head')[0],
		style = document.createElement('style');
		style.type = 'text/css';
		
		if (style.styleSheet){
		  style.styleSheet.cssText = css;
		} else {
		  style.appendChild(document.createTextNode(css));
		}
		head.appendChild(style);
        
        return true;
    }
    
    this.onDownloadProcessChanged = function(downloadDelta) {
    
        // its not our item, exit
        if (downloadingIds.indexOf(downloadDelta.id) === -1) return false;
        
        if (downloadDelta.state != undefined) {
        
            if (downloadDelta.state.current != "in_progress") {
                
                console.log(downloadDelta);
                downloadingIds.splice(downloadingIds.indexOf(downloadDelta.id), 1);
                
                var downloadItem = handler.getDownloadById(downloadDelta.id);
                if (!downloadItem) {
                    console.log('item by download id not found in common stack');
                    console.log(downloadDelta);
                    
                    return false;
                }
                
                downloadItem.downloadDelta = downloadDelta;
                downloadItem.ready = true;
                
                if (events.onDownloadFile) {
                    // downloadDelta.id, filename, totalBytes
                    events.onDownloadFile(handler, downloadItem);                    
                }
                
                // if no one stop current work, check if need to add some new work
                if (mode == 'download') {
                    handler.addDownloadWork();
                }
                
                // check if that was last current active work, bring back start button
                if (!handler.isDownloading()) {
                                    
                    if (events.onDownloadAllEnd) {
                        events.onDownloadAllEnd(handler);
                    }
                                        
                    handler.setButtonInitState('start');
                }
            } else {
                
                
                console.log(downloadDelta);
                console.log(downloadDelta.url + 'download process ' + downloadDelta.fileSize);
                
            }
        }
        
        handler.updateItemsState();
    }
    
    this.setContainer = function(el) {
        if (!el) return false;
        
        if (typeof el !== 'string') container = el;
        else container = document.getElementById(el);
    }
    
    function addControllButton(id, name, event, container) {
        
        var btn =  document.createElement('A');        
            btn.className = className + 'button';
            btn.href = "#";
            btn.innerHTML = name;
            if (event) btn.onclick = event;
            
        if (container) container.appendChild(btn);
        
        buttons[id] = btn;
        return btn;
    }
    
    this.updateItemsState = function() {
    
        var iconErr = '<div class="' + className + 'item-state ' + className + 'item-state-err"></div>';
        var iconLoading = '<div class="' + className + 'item-state ' + className + 'item-state-loading"></div>';
        var iconOk = '<div class="' + className + 'item-state"></div>';
    
        for (var i = 0; i <= downloads.length-1; i++) {
        
            if (!downloads[i].item) continue;
            
            var holder = downloads[i].item.getElementsByClassName(className + 'item-state-holder');
            if (!holder.length) {
                console.log('holder not found');
                
                continue;
            }
            
            holder = holder[0];
        
            html = '';
        
            if (downloads[i].downloadId) {
                    
                if (!downloads[i].downloadDelta) {
                    html +=  iconLoading + 'Загружаю...';
                } else if (downloads[i].downloadDelta) {
                    
                    var delta = downloads[i].downloadDelta;
                    
                    if (delta.state ) {
                    
                        if (delta.state && delta.state.current == "complete") {
                             html += iconOk + 'Файл загружен';
                        } else if (delta.state.current == "in_progress") {
                             html += iconLoading + 'Загружаю...';
                        } else html += iconErr + delta.state.current;
                    
                    } else {
                        html += 'Состояние не определено';
                    }
                }
            
            } else if (mode == 'download') {
               
               if (!downloads[i].stoped) {
               
                    html += 'Файл в очереди';
               } else {
                    // remove - this state available in wait
                    html += 'Загрузка остановлена';
               }               
                
            } else {
                // загрузка еще не начата
            } 
            
            holder.innerHTML = html;
        }
    }
    
    this.closeGrabManager = function() {
 
        if (!container) return false;
    
        handler.clearDownloads();
    
        buttons = {};
        container.innerHTML = '';          
    }
    
    this.showGrabManager = function() {
    
        if (!container) return false;
        
        buttons = {};
        container.innerHTML = '';
                
            btnsSection =  document.createElement('DIV');        
            btnsSection.className = className + 'controll';
            
            baseFolderInput = document.createElement('INPUT');
            baseFolderInput.type = 'text';
            baseFolderInput.value = baseFolder;
            baseFolderInput.className = className + 'baseFolder';
            
            baseFolderInput.onchange = function() {
                handler.setBaseFolder(this.value);
                return;
            }
                     
            btnsSection.appendChild(baseFolderInput);
        
            handler.setButtonInitState('start');
            
        var itemsContainer = document.createElement('DIV');
            itemsContainer.className = className + 'container';
            
        for (var i = 0; i <= downloads.length-1; i++) {
            
            var item = document.createElement('DIV');
                item.className = className + 'item';
                
                var url = downloads[i].url;
                if (url.length > 30) {
                    url = '...' + url.substr(url.length - 30);
                }
                                
                var html  = '' + downloads[i].filename + ' (<a href="' + downloads[i].url + '">' + url + '</a>) <div class="' + className + 'item-state-holder"></div>';            
                
                item.innerHTML = html;
                itemsContainer.appendChild(item);
                
                downloads[i].item = item;
        }
        
        handler.updateItemsState();
        
        container.appendChild(btnsSection);
        container.appendChild(itemsContainer);
    }
    
    this.setEvent = function(name, f) {
        
        events[name] = f;    
    }
    
    this.setBaseFolder = function(folder) {
    
        var tmpFolder = handler.getFolder(folder);
        if (tmpFolder) {
            baseFolder = tmpFolder;
            
            if (baseFolderInput) {
                baseFolderInput.value = baseFolder;
            }
        }
        
    }
    
    this.getFolder = function(folder) {
        if (!folder) return '';
        folder = folder.trim();
        
        if (!folder) return '';
        folder = folder.replace('\\', '/');
        
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
    
    this.getDownloads = function() {
    
        return downloads;
    }
    
    this.clearDownloads = function() {
        handler.cancelDownloads();
        downloads = [];
    }
    
    this.setButtonInitState = function(state) {

        if (!buttons['init']){
            
                addControllButton('init', 'Начать выгрузку', function() {
               
                    handler.download();
                    return false;
                    
                }, btnsSection);
                
                if (state == 'start') return;
        }
        
        if (state == 'start') {
        
            buttons['init'].innerHTML = 'Начать выгрузку';
            buttons['init'].onclick = function() {                    
                handler.download();                
                return false;
            }
        
        } else {
        
            buttons['init'].innerHTML = 'Остановить загрузку';
            buttons['init'].onclick = function() {
                handler.cancelDownloads();
                return false;
            }       
        }

      
    }
    
    this.cancelDownloads = function() {    
        
        if (mode != 'download') return;
        mode = 'wait';
        
        // that shold call from event OnStateChanged
        // handler.setButtonInitState('start');
    
        for (var i=0; i <= downloads.length-1; ++i) {
            if (!downloads[i].ready && downloads[i].downloadId && downloads[i].downloadId != -1) {
               
                KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : downloads[i].downloadId}, function(response) {
                
                });
                
                downloads[i].downloadId = false;
                downloads[i].stoped = true;
                // canceling.then(onCanceled, onError);
            }
        }
        
    }
    
    this.addFile = function(filename, url) {
        
        if (!filename) return false;
        if (!url) return false;
        
        if (url.length < 6) return false;
                
        var ext = KellyTools.getExt(url);
        if (!ext) return false;
        
        filename = filename.trim();   
        if (filename.indexOf('.') == -1) {
            filename += '.' + ext;
        }
        
        operationId++;
        
        downloads.push({operationId : operationId, filename : filename, url : url, conflictAction : 'overwrite', ext : ext});    
    }
    
    this.getDownloadById = function(id) {
                
        for (var i=0; i <= downloads.length-1; ++i) {
            if (downloads[i].downloadId === id) {
                return downloads[i];
            }
        }
        
        return false;
    }
    
    this.setDownloadIdByOperationId = function(operationId, downloadId) {
        
        if (mode == 'wait') { // perhapse promise was sended after cancel ?
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : downloadId}, function(response) {
            
            });
            return false;
        }
        
        if (!downloadId) {
            // todo set error status
            console.log('Download id is empty for ' + operationId);
            return false;
            
        }
        
        downloadingIds.push(downloadId);
        
        console.log('new downloading process ' + downloadId + ' for file ' + operationId);
        
        // mostly this happens already after browser actually download file
        
        for (var i=0; i <= downloads.length-1; ++i) {
            if (downloads[i].operationId == operationId) {
                downloads[i].downloadId = downloadId;
                console.log('downloading process initiated for ' + downloads[i].filename);
                break;
            } else {
                console.log('operation ' +  downloads[i].operationId);
            }
        }
                
        handler.updateItemsState();
    }
    
	// data - binary data or text that will be downloaded as file
	
    this.createAndDownloadFile = function(data, filename, mimetype) {
    
        if (!data) return false;
    
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
    
    function downloadByXMLHTTPRequest(download) {
    
        // design from https://stackoverflow.com/questions/20579112/send-referrer-header-with-chrome-downloads-api
    
    
        var baseFileFolder = baseFolder;
        
        if (baseFileFolder) baseFileFolder += '/';
    
        var urlOrig = download.url;
        var operationId = download.operationId;
        
        var downloadOptions = {
            filename : baseFileFolder + download.filename, 
            conflictAction : download.conflictAction,
            method : 'GET',
        }
        
        var onSuccessBlob = function(requestObj, blobData) {
            
            console.log('load content by blob object ' + urlOrig );
            
            downloadOptions.url = URL.createObjectURL(blobData);               
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", blob : true, operationId : operationId, download : downloadOptions}, function(response){});             
        }
        
        // try again but by usual method
        var onFailBlob = function(requestObj) {
        
            console.log('fail load by blob ' + urlOrig + ', attempt to download by download api without blob ')
        
            downloadOptions.url = urlOrig;
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", blob : false, operationId : operationId, download : downloadOptions}, function(response){});   
        
        }
        
    
        var xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';

            xhr.addEventListener('load', function(e) { 
            
                onSuccessBlob(xhr, xhr.response);
            
            });
            
            // URL.createObjectURL(xhr.response)
            
            xhr.addEventListener('error', function(e) {
                
                onFailBlob(xhr);
                
            });

            xhr.open('get', urlOrig, true);
            xhr.send();
            
    }
    
    this.countCurrentDownloads = function() {
    
        var count = 0;
        for (var i=0; i <= downloads.length-1; ++i) {
               
            if (downloads[i].downloadId && !downloads[i].ready) count++;
            
        }
        
        return count;
    }
    
    this.isDownloading = function() {
    
        for (var i=0; i <= downloads.length-1; ++i) {
               
            if (downloads[i].downloadId && !downloads[i].ready) return true;
            
        }
        
        return false;
    }
    
    this.addDownloadWork = function() {
    
        var currentWork = handler.countCurrentDownloads();
        
        if (currentWork >= maxDownloadsAtTime) return false;
        
        var newWorkNum = maxDownloadsAtTime - currentWork;
          
        for (var i=0; i <= downloads.length-1; ++i) {
            
            if (downloads[i].downloadId) continue;
            
            downloads[i].downloadId = -1;
            downloads[i].ready = false;
            newWorkNum--;
            
            downloadByXMLHTTPRequest(downloads[i]);
            
            /*
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", download : {
            
                filename : baseFileFolder + downloads[i].filename, 
                url : downloads[i].url, 
                conflictAction : downloads[i].conflictAction,
                method : 'GET',
                //// 
                
                we are basted :(
                 - > Unchecked runtime.lastError while running downloads.download Unsafe request header name
                 
                headers : [
                    {name : 'referer', value : 'http://joyreactor.cc/'},
                ],
                /////
            }}, function(response) {});
            */
            
            if (newWorkNum <= 0) break;
        }
               
    }
    
    this.download = function(){
        if (handler.isDownloading()) return false;        
        if (!downloads.length) return false;

        assignEvents();
        
        handler.setButtonInitState('stop');
        
        handler.addDownloadWork();
        
        if (handler.isDownloading()) {
            mode = 'download';
        }
    }
    
 
    constructor(cfg);
}

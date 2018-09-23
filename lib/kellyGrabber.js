
// важно создавать объект KellyGrabber в рамках процесса-вкладки с которой будут сохраняться картинки \ данные.
// т.к. при скачивании из фона хром не создает заголовки referer, что повликает проблемы вроде наличи дополнительных вотермарок \ блокировки \ ограничения загрузки со стороны сервера на котором
// расположена картинка. Любой сервер потенциально может принять скачивание без должных заголовков за атаку \ бота

// todo сортировать в списке названия папок по алфавиту

// сохранять послежний выбор

function KellyGrabber(cfg) {
    
    var handler = this;   
	
    var downloadingIds = []; // ids from chrome API that returned for each download process
	
	// operationId - id of an KellyGrabber.addFile item, that store in downloads[]
	
    downloads = []; 
	
    var operationIdCounter = 0; // 
	
    var acceptItems = false;
    
    var events = { 
        onDownloadAllEnd : false, 
        onDownloadFile : false,
        onUpdateState : false,
    };
    
    var nameTemplate = false;
    
    var style = false;
    var className = 'kellyGrabber-';
    
    var buttons = {};
    
	var options = {	
		baseFolder : '',
		maxDownloadsAtTime : 2,
		interval : 1,
		cancelTimer : 3 * 60, // not added currently
    }
	
    var mode = 'wait';
    var eventsEnabled = false;
	
	var extendedOptionsShown = false;
    
	// dom elements
	
	// assigned
      
    this.container = false;
	
	// generated on showGrabManager
	
    this.btnsSection = false;
	var logSection = false;
    
    var fav;
    var log = '';
	
	var availableItemsIndexes = [];
    
    function constructor(cfg) { 
        handler.updateCfg(cfg);
    }
    
    this.getState = function() {    
        return mode;
    }
    
    this.updateCfg = function(cfg) {
    
        if (cfg) {
            if (cfg.container) handler.container = cfg.container;
		
            if (cfg.events) {
            
                for (var k in events){
                    if (typeof cfg.events[k] == 'function') {
                         events[k] = cfg.events[k];
                    }
                }
            }
            
			for (var k in options) {
				if (typeof cfg[k] != 'undefined') {
					
					if (k == 'baseFolder') {
						handler.setBaseFolder(cfg.baseFolder);
					} else {
						options[k] = cfg[k];
					}
				}
			}
			
            if (cfg.className) {
                className = cfg.className;
            }
            
            
            if (cfg.fav) {
                fav = cfg.fav;
            }
            
            if (cfg.availableItemsIndexes) {
                availableItemsIndexes = cfg.availableItemsIndexes;
            }
			
			if (cfg.shownItems) {
				
				shownItems = cfg.shownItems;
			}
			
			if (cfg.imageClassName) {
				imageClassName = cfg.imageClassName;
			}
        }
    }
	
    this.showGrabManager = function() {
    
        if (!handler.container) return false;
		
		var extendedClass = className + '-controll-extended ' + (extendedOptionsShown ? 'active' : 'hidden'); 
		var extendedShowTitle = {
			show : 'Показать расширенные настройки',
			hide : 'Скрыть расширенные настройки',
		};
       
        if (!options.baseFolder) {
            handler.setBaseFolder(fav.getGlobal('env').profile + '/Downloads');
        }
       
        handler.container.innerHTML = '\
			<div class="' + className + '-controll">\
                <table>\
                    <tr><td>\
                        <label>Основная директория</label>\
                    </td><td>\
                        <input type="text" placeholder="Директория" class="' + className + '-controll-baseFolder" value="' + options.baseFolder + '">\
                    </td></tr>\
                    <tr><td>\
                        <label>Элементы</label>\
                    </td><td>\
                        <input type="text" placeholder="1-2, 44-823, 1-999..." class="' + className + '-itemsList" value="">\
                    </td></tr>\
                    <tr><td colspan="2">\
                        <label><input type="radio" name="' + className + '_image_size[]" value="hd" checked>Оригинал</label>\ <label><input type="radio" name="' + className + '_image_size[]" value="preview">Превью</label>\
                    </td></tr>\
					<tr><td colspan="2">\
                        <label><a href="#" class="' + className + '-extended-show">' + extendedShowTitle[extendedOptionsShown ? 'hide' : 'show'] + '</a></label>\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>Количество потоков</label>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-threads" value="' + options.maxDownloadsAtTime + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>Интервал загрузки (сек)</label>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-interval" value="' + options.interval + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>Таймаут при долгом выполнении запроса (сек)</label>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-timeout" value="' + options.cancelTimer + '">\
                    </td></tr>\
					<tr><td colspan="2">\
                        <label>Исключать изображения с низким разрешением</label><label><input type="checkbox" class="' + className + '-exclude-low-res" value="1"></label>\
                    </td></tr>\
                    <tr><td colspan="2"><div class="' + className + '-controll-buttons"></div></td></tr>\
                    <tr><td colspan="2">\
						<div class="' + className + '-controll-progress">\
							<div class="'  + className + '-bar"><span>0/1233</span></div>\
						</div>\
					</td></tr>\
                    <tr><td colspan="2"><div class="' + className + '-controll-log" style="display : none;"></div></td></tr>\
                </table>\
			</div>\
		';
            
		var baseFolderInput = KellyTools.getElementByClass(handler.container, className + '-controll-baseFolder');
            baseFolderInput.onchange = function() {
                handler.setBaseFolder(this.value);
                
                this.value = options.baseFolder;
                return;
            }     

		var showExtend = KellyTools.getElementByClass(handler.container, className + '-extended-show');
			showExtend.onclick = function() {
				
				extendedOptionsShown = !extendedOptionsShown;
				
				var extOptions = document.getElementsByClassName(className + '-controll-extended');
				if (extOptions) {
					for (var i=0; i < extOptions.length; i++) {						
						if (!extendedOptionsShown) {
							extOptions[i].className = extOptions[i].className.replace('active', 'hidden');
						} else {
                            extOptions[i].className = extOptions[i].className.replace('hidden', 'active');
                        }
					}
				}
				
				this.innerHTML = extendedShowTitle[extendedOptionsShown ? 'hide' : 'show'];
				return false;
			}
		
        var threadsInput = KellyTools.getElementByClass(handler.container, className + '-threads');
            threadsInput.onchange = function() {
                                
                options.maxDownloadsAtTime = parseInt(this.value);
                if (!options.maxDownloadsAtTime || options.maxDownloadsAtTime < 0) options.maxDownloadsAtTime = 1;
                
                this.value = options.maxDownloadsAtTime;
                
                console.log(options.maxDownloadsAtTime);
            }
   
        var intervalInput = KellyTools.getElementByClass(handler.container, className + '-interval');
            intervalInput.onchange = function() {
                                
                options.interval = KellyTools.validateFloatSting(this.value)
                
                options.interval = options.interval;
                if (!options.interval || options.interval < 0.1) options.interval = 0.1;
               
                this.value = options.interval;
                 
                console.log(options.interval);
            }
            
        var cancelInput = KellyTools.getElementByClass(handler.container, className + '-timeout');
            cancelInput.onchange = function() {
                                
                options.cancelTimer = KellyTools.validateFloatSting(this.value)
                
                options.cancelTimer = options.cancelTimer;
                if (!options.cancelTimer || options.cancelTimer < 2) options.cancelTimer = 5 * 60;
                
                
                this.value = options.cancelTimer;
                
                console.log(options.cancelTimer);
            } 
            
		logSection = KellyTools.getElementByClass(handler.container, className + '-controll-log');
    
		handler.btnsSection = KellyTools.getElementByClass(handler.container, className + '-controll-buttons');
		
		// add controll buttons
		
		buttons = {};
        handler.addControllEl('init', ''); 
        handler.addControllEl('save_as_json', 'Скачать файл данных', function() {
        
            fav.downloadFilteredData();            
            return false;
        });  
        var logBtn = handler.addControllEl('save_log', 'Скачать лог', function() {
        
            downloadLog();            
            return false;
        });   

        logBtn.style.display = 'none';
        
        handler.updateStartButtonState('start');     
    }
    
    function downloadLog() {
        var time = new Date().getTime();        
        KellyTools.createAndDownloadFile(log, 'log_' + time + '.log');
    }
    
	function showState(state) {
		
		if (!state) state = 'undefined';
		
		var html = '';
		
		if (state == "complete") {
			html += '<div class="' + className + '-item-state ' + className + '-item-state-ok" data-notice="Загрузка завершена"></div>';
		} else if (state == "in_progress") {
			html += '<div class="' + className + '-item-state ' + className + '-item-state-loading" data-notice="Загрузка..." ></div>';
		} else if (state == 'wait') {
			html += '<div class="' + className + '-item-state ' + className + '-item-state-wait" data-notice="Ожидает в очереди"></div>';
		}  else if (state == 'in_list') {
			html += '<div class="' + className + '-item-state ' + className + '-item-state-wait" data-notice="В списке"></div>';
		} else if (state != 'undefined') {
			html += '<div class="' + className + '-item-state ' + className + '-item-state-err" data-notice="Ошибка загрузки"></div>'; // todo вывод деталей ошибки, сохраняется в lastError?
		}  else {
			html += '<div class="' + className + '-item-state ' + className + '-item-state-undefined" data-notice=""></div>';
		}
         
		return html;
	}
    
	function showDownloadItemInfoTooltip(downloadIndex, target) {
	
		if (!downloads[downloadIndex]) return;
		
        var item = downloads[downloadIndex].item;
		var tooltipEl = fav.getTooltip();
			tooltipEl.updateCfg({
				target : target, 
				offset : {left : 0, top : 0}, 
				positionY : 'top',
				positionX : 'right',				
				ptypeX : 'outside',
                ptypeY : 'inside',
			});
			
		var baseClass = fav.getGlobal('env').className + '-tooltipster-ItemInfo';
		
		var itemInfo = document.createElement('div');
			itemInfo.className = baseClass;
			itemInfo.id = baseClass + '-' + downloadIndex;
			itemInfo.innerHTML = 'Сохранить как : <br>' + downloads[downloadIndex].filename + '<br><br>' + fav.showItemInfo(item); 		
	
		var tcontainer = tooltipEl.getContent();
			tcontainer.innerHTML = '';
            tcontainer.appendChild(itemInfo);
			
		tooltipEl.show(true);
	}
	    
    this.updateStateForImageGrid = function() {
        
		if (events.onUpdateState && events.onUpdateState(handler)) return;
        
        var subItemsReady = {};
        
        for (var i = 0; i <= downloads.length-1; i++) {
                
            //    console.log(handler.isItemShown(downloads[i].item));
            if (!downloads[i].item) continue;
            
            var downloadItemId = imageClassName + '-' + downloads[i].item.id;
            var N = i+1;
            
            if (downloads[i].subItem !== false) {
                
                if (!subItemsReady[downloads[i].item.id]) subItemsReady[downloads[i].item.id] = 0;
                subItemsReady[downloads[i].item.id] += downloads[i].ready ? 1 : 0; // todo show somewhere
                
            }
            
          	var itemContainer = document.getElementById(downloadItemId);			
			if (!itemContainer) {
				continue;
			}       
            
            // console.log(imageClassName + '-' + downloads[i].item.id);
		
            var holder = KellyTools.getElementByClass(itemContainer, imageClassName + '-download-state-holder');
            
            if (!holder) {
				
				holder = document.createElement('DIV');
				holder.className = imageClassName + '-download-state-holder';
                holder.setAttribute('downloadIndex', i);
                
                var title = '#' + N;
                if (downloads[i].subItem !== false) {
                    title += '-#' + (N + downloads[i].item.pImage.length);
                }
                
				holder.innerHTML = '\
                    <div class="' + imageClassName + '-download-number" data-start="' + N + '">' + title + '</div>\
                    <div class="' + imageClassName + '-download-status"></div>\
               ';
                
                itemContainer.appendChild(holder);
                
                /* не проработаны исключения
                var envVars = fav.getGlobal('env');
                
                var tooltipOptions = {
                    offset : {left : 0, top : 0}, 
                    positionY : 'top',
                    positionX : 'right',				
                    ptypeX : 'outside',
                    ptypeY : 'inside',
                    closeButton : false,

                    selfClass : envVars.hostClass + ' ' + envVars.className + '-ItemTip-tooltipster',
                    classGroup : envVars.className + '-tooltipster',
                    removeOnClose : true,
                };
                
                kellyTooltip.addTipToEl(holder, function(el, e){
                
                    return showDownloadItemInfoTooltip(el.getAttribute('downloadIndex'));
                
                }, tooltipOptions, 100);       
                */
                holder.onmouseover = function(e) {                
                    
                    var itemIndex = this.getAttribute('downloadIndex');
                    showDownloadItemInfoTooltip(this.getAttribute('downloadIndex'), this);
                }  
                    
                holder.onmouseout = function(e) {    
                    
                    var related = e.toElement || e.relatedTarget;
                    if (fav.getTooltip().isChild(related)) return;
                        
                    fav.getTooltip().show(false);
                }  
                                
            } 
            
            var statusPlaceholder = KellyTools.getElementByClass(holder, imageClassName + '-download-status');
            
            if (downloads[i].subItem === false || downloads[i].subItem == downloads[i].item.pImage.length-1) {
                
                html = '';
                
                // mode == 'download'
                if (downloads[i].downloadId) {
                        
                    if (!downloads[i].downloadDelta) {
                       
                        html = showState('in_progress');
                       //countCurrentWaiting
                    } else if (
                        (downloads[i].subItem === false && downloads[i].ready) || 
                        (downloads[i].subItem !== false && subItemsReady[downloads[i].item.id] == downloads[i].item.pImage.length)) { // downloads[i].ready

                        html = showState('complete');
                        
                    } else if (downloads[i].downloadDelta) {
                        
                        var delta = downloads[i].downloadDelta;					
                        html = showState(delta.state);					
                    }
                
                } else {
                    
                    html = showState('wait'); // inlist \ wait 
                    
                }   
            
                statusPlaceholder.innerHTML = html;
            }
        }
    }  
    
    function assignEvents() {
    
        if (eventsEnabled) return;
        
        // sometimes runtime may be undefined after debug breakpoints
        // https://stackoverflow.com/questions/44234623/why-is-chrome-runtime-undefined-in-the-content-script
        
        KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.addListener"}, function(response) {
        
        });
                
        KellyTools.getBrowser().runtime.onMessage.addListener(
          function(request, sender, sendResponse) {

            if (request.method == "onChanged") {       
                
                handler.onDownloadProcessChanged(request.downloadDelta);                
            }
        });  
        
        eventsEnabled = true;
    
    }
    
    this.onDownloadProcessChanged = function(downloadDelta) {
    
        // its not our item, exit
        if (downloadingIds.indexOf(downloadDelta.id) === -1) return false;
        
        if (downloadDelta.state) {
        
            if (downloadDelta.state.current != "in_progress") {
                
                console.log(downloadDelta);
                downloadingIds.splice(downloadingIds.indexOf(downloadDelta.id), 1);
            
                var downloadIndex = handler.getDownloadById(downloadDelta.id);
                if (downloadIndex === false) {
                
                    console.log('item by download id not found in common stack');
                    console.log(downloadDelta);
                    
                    return false;
                }
                
                var downloadItem = downloads[downloadIndex];
                   
                if (downloadItem.cancelTimer) {
                    clearTimeout(downloadItem.cancelTimer);
                    downloadItem.cancelTimer = false;
                }
                 
                downloadItem.downloadDelta = downloadDelta;
                downloadItem.ready = true;
                
                if (events.onDownloadFile) {
                    // downloadDelta.id, filename, totalBytes
                    events.onDownloadFile(handler, downloadItem);                    
                }
                
                // if no one stop current work, check if need to add some new work
                if (mode == 'download') {
                
                    if (!options.interval) options.interval = 0.1;
                    
                    if (handler.countCurrentWaiting()) {
                    
                        setTimeout(function() {                        
                            handler.addDownloadWork();
                        }, options.interval * 1000);
                    }
                }
                
               
            } else {
                
                
                console.log(downloadDelta);
                console.log(downloadDelta.url + 'download process ' + downloadDelta.fileSize);
                
            } 
            
            // check if that was last current active work, bring back start button
            if (!handler.countCurrentWaiting()) {
                                
                if (events.onDownloadAllEnd) {
                    events.onDownloadAllEnd(handler);
                }
                                    
                handler.updateStartButtonState('start');
            }
        }
        
        console.log('current in progress ' + handler.countCurrentInProgress() + ' | wait ' + handler.countCurrentWaiting())
        
        handler.updateStateForImageGrid();
    }
    
    this.getControllEl = function(key) {
        return buttons[key] ? buttons[key] : false;
    }
    
    this.addControllEl = function(key, name, onClick, type) {
        
        if (buttons[key]) return false;
        
        if (!handler.btnsSection) return false;
        
        var btn =  document.createElement(type ? type : 'A');        
            btn.className = className + '-button ' + className + '-button-' + key;
            btn.href = "#";
            btn.innerHTML = name;
            
        if (onClick) btn.onclick = onClick;
            
        handler.btnsSection.appendChild(btn);
        
        buttons[key] = btn;
        return btn;
    }
    
    this.closeGrabManager = function() {
 
        if (!handler.container) return false;
    
        handler.clearDownloads();
    
        buttons = {};
        handler.container.innerHTML = '';          
    }
    
    function itemGenerateFileName(index) {
        
        // todo take fav.items[index].link - postId as name, to get unique index always constant
   
        if (!nameTemplate) {
            nameTemplate = '#category_1#/#id#_#category_1#_#category_2#_#category_3#';
            // #name# #category_1# #category_2# #n# filter_1
        }
        
        var fileName = nameTemplate;
       
        if (fav.getGlobal('fav').items[index].categoryId) {
            
            var favItems = fav.getGlobal('fav');
            var sm = fav.getStorageManager();
                sm.sortCategories(favItems.categories);
               
                var itemCatN = 0;
              
            for (var i = 0; i < favItems.categories.length; i++) {
            
                if (fav.getGlobal('fav').items[index].categoryId.indexOf(favItems.categories[i].id) != -1) {
                    itemCatN++;
                    // console.log('#category_' + itemCatN + '#' + ' - replace - ' + favItems.categories[i].name);
                    fileName = KellyTools.replaceAll(fileName, '#category_' + itemCatN + '#', favItems.categories[i].name);
                }
                
            }
            
        }
        
        
        if (fav.getGlobal('fav').items[index].name) {
            fileName = KellyTools.replaceAll(fileName, '#name#', fav.getGlobal('fav').items[index].name);
        }
        
        if (fav.getGlobal('fav').items[index].id) {
            fileName = KellyTools.replaceAll(fileName, '#id#', fav.getGlobal('fav').items[index].id);
        }
        
        return fileName.replace(/#.*#/, '');
    }
    
    // переинициализировать список задач
    
    this.setDownloadTasks = function(indexes) {
      
		handler.clearDownloads();
        
		availableItemsIndexes = indexes;
		
        var fullSize = false;
       
        for (var i = 0; i <= availableItemsIndexes.length-1; i++) {
        
            var item = fav.getGlobal('fav').items[availableItemsIndexes[i]];
            if (!item.pImage) continue;   
                
            var fname = itemGenerateFileName(availableItemsIndexes[i]);            
            
            if (typeof item.pImage !== 'string') {
            
                for (var b = 0; b <= item.pImage.length-1; b++) {
                    
                    
                    
                    handler.addFile(fname + '_' + b, fav.getGlobal('env').getImageDownloadLink(item.pImage[b], fullSize), item, b);
                }
                
            } else {
            
                handler.addFile(fname,  fav.getGlobal('env').getImageDownloadLink(item.pImage, fullSize), item);
            }
        }            
        
        //KellyTools.createAndDownloadFile('test', 'test.txt');
    }
	
    this.setBaseFolder = function(folder) {
    
        var tmpFolder = handler.getFolder(folder);
        if (tmpFolder) {
            options.baseFolder = tmpFolder;
        }
        
        return options.baseFolder;
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
    
    this.updateStartButtonState = function(state) {

        if (state == 'start') {
            
            mode = 'wait';
            buttons['init'].innerHTML = 'Начать выгрузку';
            buttons['init'].onclick = function() {                    
                handler.download();                
                return false;
            }
        
        } else {
            
            mode = 'download';
            buttons['init'].innerHTML = 'Остановить загрузку';
            buttons['init'].onclick = function() {
                handler.cancelDownloads();
                return false;
            }       
        }
      
    }
    
    this.cancelDownloads = function() {    
        
        buttons['init'].innerHTML = 'Остановка...';        
        mode = 'cancel';
        
        // that shold call from event OnStateChanged
    
        var untilStop = 0;
        
        var cancelDownloadItem = function(downloadItem) {
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : downloadItem.downloadId}, function(response) {
                
                untilStop--;
                downloadItem.downloadId = false;
                
                if (!untilStop) {
                    handler.updateStartButtonState('start');
                }
            });    
        }
        
        for (var i=0; i < downloads.length; i++) {
            if (downloads[i] && !downloads[i].ready && downloads[i].downloadId && downloads[i].downloadId != -1) {
            
                untilStop++;
                cancelDownloadItem(downloads[i]);         
               
                // canceling.then(onCanceled, onError);
            }
        }
        
        if (!untilStop) {
            handler.updateStartButtonState('start');
            if (log &&  buttons['save_log']) {
                 buttons['save_log'].style.display = 'block';
            }
        }
    }
    
    
    this.addFile = function(filename, url, item, subItem) {
        
        if (!filename) return false;
        if (!url) return false;
        
        if (url.length < 6) return false;
                
        var ext = KellyTools.getExt(url);
        if (!ext) return false;
        
        filename = filename.trim();   
        if (filename.indexOf('.') == -1) {
            filename += '.' + ext;
        }
        
        operationIdCounter++;

		if (item && typeof item.pImage !== 'string') {
			subItem = subItem <= item.pImage.length-1 ? subItem : 0;
		} else subItem = false;
            
        
        downloads.push({
            
            operationId : operationIdCounter, 
            filename : filename, 
            url : url, 
            conflictAction : 'overwrite', 
            ext : ext,
            
			item : item,
			subItem : subItem, 
        });    
    }
    
    this.getDownloadById = function(id) {
                
        for (var i=0; i <= downloads.length-1; ++i) {
            if (downloads[i].downloadId === id) {
                return i;
            }
        }
        
        return false;
    }
	
	// download process started for some operation from dispatcher
    
    this.downloadStarted = function(operationId, downloadId) {
        
        if (mode == 'wait') { // perhapse promise was sended after cancel ?
		
			// download not needed
			
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
                // console.log('operation ' +  downloads[i].operationId);
            }
        }
                
        handler.updateStateForImageGrid();
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
    
    function toTxtLog(str) {
    
        log += '[' + KellyTools.getTime() + '] ' + str + "\r\n";
    }
    
    function downloadByXMLHTTPRequest(download) {
    
        // design from https://stackoverflow.com/questions/20579112/send-referrer-header-with-chrome-downloads-api
    
    
        var baseFileFolder = options.baseFolder;
        
		if (!baseFileFolder) baseFileFolder = '';
        
		baseFileFolder += '/';
    
        var urlOrig = download.url;
        var operationId = download.operationId;
        
        var downloadOptions = {
            filename : baseFileFolder + download.filename, 
            conflictAction : download.conflictAction,
            method : 'GET',
        }
		
        toTxtLog('download : ' + downloadOptions.filename);
        
		var onDownloadStart = function(response){
				
			if (!response.operationId || !response.downloadId) {
				
                toTxtLog('download REJECTED by browser API : ' + downloadOptions.filename);
                toTxtLog('error : ' + response.error + "\n\r");
                
			} else {            
                
                toTxtLog('download ACCEPTED by browser API : ' + downloadOptions.filename);
				handler.downloadStarted(response.operationId, response.downloadId)
			}
			
		}
        
        var onSuccessBlob = function(requestObj, blobData) {
            
            toTxtLog('file LOADED as BLOB ' + urlOrig + ', send to browser API for save to folder : ' + downloadOptions.filename);
            
            downloadOptions.url = URL.createObjectURL(blobData);               
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", blob : true, operationId : operationId, download : downloadOptions}, onDownloadStart);             
        }
        
        // try again but by usual method
        var onFailBlob = function(requestObj) {
        
            toTxtLog('file NOT LOADED as BLOB ' + urlOrig + ', attempt to download by download api without blob - BAD HEADERS : ' + downloadOptions.filename);
            
            downloadOptions.url = urlOrig;
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", blob : false, operationId : operationId, download : downloadOptions}, onDownloadStart);   
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
    
    // get current runnig threads num
    
    this.countCurrentInProgress = function() {
    
        var count = 0;
        for (var i=0; i <= downloads.length-1; ++i) {
               
            if (downloads[i].downloadId && !downloads[i].ready) count++;
            
        }
        
        return count;
    }
    
    this.countCurrentWaiting = function() {
    
        var count = 0;
        for (var i=0; i <= downloads.length-1; ++i) {
               
            if (!downloads[i].ready) count++;
            
        }
        
        return count;
    }
    
    this.addDownloadWork = function() {
        
        if (mode != 'download') return false;
        
        var currentWork = handler.countCurrentInProgress();        
        if (currentWork >= options.maxDownloadsAtTime) return false;
        
        var newWorkNum = options.maxDownloadsAtTime - currentWork;
        
        var addCancelTimer = function(downloadItem) {
            
            downloadItem.cancelTimer = setTimeout(function() {
            
                KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : downloadItem.downloadId}, function(response) {                    
                    downloadItem.downloadId = false;
                    downloadItem.ready = false;
                });
                
                toTxtLog('CANCELED BY TIMEOUT ' + downloadItem.url + ', ' + downloadItem.filename);
                
            }, options.cancelTimer * 1000);
        }
        
        for (var i=0; i <= downloads.length-1; ++i) {
            
            if (downloads[i].downloadId) continue;
            if (acceptItems && acceptItems.indexOf(i+1) == -1) continue;
            
            var downloadItem = downloads[i];
            
            downloadItem.downloadId = -1;
            downloadItem.ready = false;
            
            if (options.cancelTimer) {
                addCancelTimer(downloadItem);
            }
           
            newWorkNum--;
            
            downloadByXMLHTTPRequest(downloads[i]);
            
            /*
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", download : {
            
                filename : baseFileFolder + downloads[i].filename, 
                url : downloads[i].url, 
                conflictAction : downloads[i].conflictAction,
                method : 'GET',
                //// 
                
                wasted :(
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
    
    this.download = function() {
    
        if (handler.countCurrentInProgress()) return false;        
        if (!downloads.length) return false;
        
        acceptItems = false;
        var itemsListInput = KellyTools.getElementByClass(handler.container, className + '-itemsList');
        
        if (itemsListInput && itemsListInput.value) {
           acceptItems = KellyTools.getPrintValues(itemsListInput.value, false);
           if (!acceptItems.length) {
                acceptItems = false;
           }
           
           console.log(acceptItems);
        }
       
        assignEvents();
        
        handler.updateStartButtonState('stop');
        
        handler.addDownloadWork();
        
        if (!handler.countCurrentInProgress()) {
            handler.updateStartButtonState('start');
        }
        
        log = 'Start download process...' + "\n\r";
        console.log(options);
    }
    
 
    constructor(cfg);
}

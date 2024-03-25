// part of KellyFavItems extension
// config saved onChangeState

// todo 

// check dublicates during one task ( +\- currently dublicates checked during one iteration to prevent write error)

// KellyTools.getBrowser().runtime.sendMessage({method: "isFilesDownloaded", filenames : [KellyTools.getUrlFileName(env.getImageDownloadLink(postMedia[0]))]}, onSearch);
// for proper use need call - handler.getDownloadManager().onDownloadProcessChanged by chrome.api.downloads.onChanged

// todo - add K_FAV.getGlobal('fav').dbName \ K_FAV.getGlobal('fav').coptions.storage as #DBNAME# and #STORAGE# variables for baseFolder option

function KellyGrabber(cfg) {
    
    var handler = this;  
    
    // ids from chrome API that returned for each download process [only in progress items]
    
    var downloadingIds = []; 
  
    // array of current added throw method addDownloadItem download items (all sub items if fav item contain more than one image are separate)
    // 
    // Download item object params :
    //     
    // .downloadId > 0     - accepted by API, downloading 
    // .downloadId = KellyGrabber.DOWNLOADID_GET_PROCESS    - request to API sended, waiting 
    // .downloadId = KellyGrabber.DOWNLOADID_INACTIVE - inactive 
    //
    // .workedout          - true if element already processed (check .error \ .downloadDelta for result)
    // 
    // .item               - reference to fav.item[n] object
    // .subItem            - index of fav.item.pImage if object has more then one image
    //
    // other tech params : 
    //
    // .cancelTimer
    // .canceling
    // .dataRequest
    //
    // .downloadDelta
    // .error
    //
    // .url 
    // .filename
    //
    // dont need to access vars directly. if you need to check current state use handler.getDownloadItemState(downloads[i]); method
    
    var downloads = []; 
        
    // .downloadId values constants
  
    var downloadsOffset = 0; // skip N elements from begin of downloads[], inverted numeration of items not affect on offset. Download always starts from zero to last element
    var ids = 0; // counter for downloads    
    var acceptItems = false; // select items by numeration
    var manualExcludeItems = [];
    
    var blobData = []; // temp threads download blob urls, cleanup in onDownloadProcessChanged and downloadUrl
    
    var events = { 
    
        /*
            onDownloadAllEnd(handler, result)
            
            calls when download process ended successfull or canceled by client (method handler.cancelDownloads)
            
            you can check list of all current downloads (see methods handler.getDownloads and handler.getDownloadItemState)            
            addition returned result data
            
            result = {
                total     - num af items in download process
                complete  - successfull downloaded
                failed    - fails num
                failItems - fail items as downloadItem ojects
                canceled  - is process was canceled by client
            }
        */
        
        onDownloadAllEnd : false, 
                   
        /*
            onBeforeDownloadValidate(handler, responseArrayBuffer, responseContentType, requestUrl, onReady) 
            
            Calls before onDownloadEnd & before return downloaded binary data from server. 
            If return true - you need to call onReady(blob, type, error) callback with new blob and result state
            
        */
             
        onBeforeDownloadValidate : false,
        
        /*
            onDownloadEnd(downloadItem) - download of downloadItem ended
            
            if setted downloadItem.error - last error message for item, empty if complete without errors 
            if setted downloadItem.downloadDelta and downloadItem.downloadDelta.state.current == "complete" - item sucessfull downloaded
            
        */
        
        onDownloadEnd : false,
        
        /*
            onDownloadStart(downloadItem) - download of downloadItem started (item successfull initialized and request according current requestMethod for file started)
        */
        
        onDownloadStart : false,
        
        /*
            onUpdateView - on redraw view, if return true, disable default redraw function
        */
        
        onUpdateView : false,        
        onChangeState : false, // enter in new mode - cancel, download, wait        
        onOptionsUpdate : false,
        onSideBarBoundsUpdate : false,
    };
    
    this.nameTemplate = false;
    
    var style = false;
    var className = 'kellyGrabber-';
    var imageClassName = className + '-FavItem';
    
    /*
        TRANSPORT_BLOBBASE64
    
        for bad designed browsers that cant catch blob url from front sended to background (currently 02.10.18 problem in firefox)
        so instead URL.createObjectURL(blob) string, full blob data encoded to base64 will be sended to background process for every file
        
        TRANSPORT_BLOB
        
        better performance
    */
    
    var transportMethod = KellyGrabber.TRANSPORT_BLOB; // TRANSPORT_BLOBBASE64;
    
    /*
    
        REQUEST_XML 

        request url data by XML http request
    */
    
    var requestMethod = KellyGrabber.REQUEST_XML;
    
    var buttons = {};
    
    // configurable options. restored from kellyStorageManager (fav.coptions.grabber)
    
    var options = false;
    
    var mode = 'wait';
    var eventsEnabled = false;    
    var extendedOptionsShown = false;
    
    // DOM elements
    
    // assigned
      
    this.container = false; // container for display controlls (method showGrabManager)
    
    // generated on showGrabManager
    
    this.btnsSection = false; // main buttons container
    
    var downloadProgress = false;
    var errorProgress = false;
        
    // last download process logged data
    var log = '';
    
    var failItems = [];
    
    var fav; // kellyFavItems obj
    var lng = KellyLoc;
    
    var availableItemsIndexes = [];
    var updateOptionsTimer = false;
    
    function constructor(cfg) {        
        handler.resetOptions();
        handler.updateCfg(cfg);
    }
        
    this.allowedAnimationFormats = ['gif', 'mp4', 'webm'];
	
    this.getState = function() {    
        return mode;
    }
    
    this.getOptions = function() {
        return options;
    }
    
    this.getDriver = function() {
        
        return {
            requestMethod : requestMethod,
            transportMethod : transportMethod,
        }
    }
    
    // addDownloadItem - conflict action always - overwrite
    
    this.resetOptions = function() {
        options = {	
            nameTemplate : '#category_1#/#number#_#filename#', 
            baseFolder : 'grabber',
            maxDownloadsAtTime : 4,
            interval : 1,
            cancelTimer : 3 * 60,  // request timeout timer
            quality : 'hd',
            itemsList : '',
            invertNumeration : true,
            skipDownloaded : false,
            animationFormat : 'gif',
            titleUpdate : true,
            keepAliveTimer : true,
            webpToPng : true,
            manualExclude : false,
        }        
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
            
            if (cfg.events === false) {
                for (var k in events){
                     events[k] = false;
                }               
            }
            
            if (cfg.options) {
                for (var k in options) {
                    if (typeof cfg.options[k] != 'undefined') {
                        
                        if (k == 'baseFolder') {
                            
                            handler.setBaseFolder(cfg.options.baseFolder);
                            
                        } else if (k == 'animationFormat') {

                            var selectIndex = handler.allowedAnimationFormats.indexOf(cfg.options[k]);
                            if (selectIndex != -1) {
                                options[k] = handler.allowedAnimationFormats[selectIndex];
                            }                          
                          
                        } else {
                            options[k] = cfg.options[k];
                        }
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
            
            if (cfg.driver) {
                cfg.driver = KellyGrabber.validateDriver(cfg.driver);
                
                requestMethod = cfg.driver.requestMethod;
                transportMethod = cfg.driver.transportMethod;
                
                KellyTools.log('init driver ' + requestMethod + ' | ' + transportMethod, 'KellyGrabber');
            }
        }
    }
    
    this.getLog = function() {
        return log;
    }
    
    function updateAcceptItems() {        
        acceptItems = false;
        if (options.itemsList) {
            
            acceptItems = KellyTools.getPrintValues(options.itemsList, false, 1, downloads.length);           
            if (!acceptItems.length) {
                acceptItems = false;
            }
        }
    }
    
    function delayUpdateOptionsEvent() {
        if (!events.onOptionsUpdate) return;

        if (updateOptionsTimer) {            
            clearTimeout(updateOptionsTimer); 
        }
    
        updateOptionsTimer = setTimeout(function() {
            updateOptionsTimer = false;
            events.onOptionsUpdate(handler);    
        }, 600);       
    }
    
    function onSideBarBoundsUpdate(source) {
        if (events.onSideBarBoundsUpdate && events.onSideBarBoundsUpdate(source)) return;
        
        fav.getImageGrid();
    }
        
    this.showGrabManager = function() {
    
        if (!handler.container) return false;
        
        var extendedClass = className + '-controll-extended'
            extShown =  (extendedOptionsShown ? ' active' : ' hidden');
            
        var extendedShowTitle = {
            show : lng.s('Показать расширенные настройки', 'grabber_show_extended'),
            hide : lng.s('Скрыть расширенные настройки', 'grabber_hide_extended'),
        };
       
        if (!options.baseFolder) {
            handler.setBaseFolder(fav.getGlobal('env').profile + '/Downloads');
        }
        
        var htmlAnimSelect = '';
        for (var i = 0; i < handler.allowedAnimationFormats.length; i++) {            
            var format = handler.allowedAnimationFormats[i];            
            htmlAnimSelect += '<option value="' + format + '" ' + (options.animationFormat == format ? 'selected' : '') +'>' + format + '</option>';
        }
        
        if (handler.allowedAnimationFormats.length > 1) htmlAnimSelect = '<select class="' + className + '-animationFormat">' + htmlAnimSelect + '</select>';
       
        var html = '\
            <div class="' + className + '-controll">\
                <table>\
                    <tr><td>\
                        <span>' + lng.s('Основная директория', 'grabber_common_folder') + '</span>\
                    </td><td>\
                        <input type="text" placeholder="' + lng.s('Директория', 'folder') + '" class="' + className + '-controll-baseFolder" value="' + options.baseFolder + '">\
                    </td></tr>\
                    <tr><td>\
                        <span class="' + className + '-controll-range">\
                            <button class="' + className + '-controll-rangeSwitch ' + className + '-controll-itemsListBtn active" data-pointer="itemsList">' + lng.s('Элементы', 'grabber_selected_items') + '</button>\
                            <button class="' + className + '-controll-rangeSwitch ' + className + '-controll-startFromBtn" data-pointer="startFrom">' + lng.s('Продолжить с', 'grabber_start_from') + '</button>\
                        </span>\
                    </td><td>\
                        <input type="text" placeholder="1-2, 44-823, 1-999..." class="' + className + '-controll-rangeInput ' + className + '-itemsList active" value="' + options.itemsList + '">\
                        <input type="text" placeholder="' + lng.s('Продолжить с N элемента', 'grabber_start_from_input') + '" class="' + className + '-controll-rangeInput ' + className + '-startFrom" value="' + options.itemsList + '">\
                    </td></tr>\
                    <!--tr class="' + className + '-range-tr"><td>\
                        <span>' + lng.s('Диапазон', 'grabber_range') + '</span>\
                    </td><td>\
                        <input type="text" placeholder="С" class="' + className + '-from" value="">\
                        <input type="text" placeholder="По" class="' + className + '-to" value="">\
                    </td></tr-->\
                    <tr class="' + className + '-quality-tr"><td colspan="2">\
                        <label><input type="radio" name="' + className + '_image_size[]" value="hd" class="' + className + '-quality" ' + (options.quality == 'hd' ? 'checked' : '') + '>' + lng.s('Оригинал', 'grabber_source') + '</label>\
                        <label><input type="radio" name="' + className + '_image_size[]" value="preview" class="' + className + '-quality" ' + (options.quality != 'hd' ? 'checked' : '') + '>' + lng.s('Превью', 'grabber_preview') + '</label>\
                    </td></tr>\
                    <tr class="' + className + '-extended-show-row"><td colspan="2">\
                        <span><button class="' + className + '-extended-show">' + extendedShowTitle[extendedOptionsShown ? 'hide' : 'show'] + '</button></span>\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-grabber_name_template' + extShown + '"><td>\
                        <span>' + lng.s('Шаблон названия', 'grabber_name_template') + ' (<a href="#" class="' + className + '-nameTemplate-help">' + lng.s('Подсказка', 'tip') + '</a>)</span>\
                    </td><td>\
                        <input type="text" placeholder="" class="' + className + '-nameTemplate" value="' + options.nameTemplate + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-grabber_anim_format' + extShown + '"><td colspan="2">\
                        <span>' + lng.s('Формат для больших гифок', 'grabber_anim_format') + ' ' + htmlAnimSelect + '</span>\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-webpToPng' + extShown + '"><td colspan="2">\
                        <label><input type="checkbox" class="' + className + '-webpToPng" data-option="webpToPng" ' + (options.webpToPng ? 'checked' : '') + '>\
                            Convert WEBP to PNG\
                        </label>\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-keepAliveTimer' + extShown + '"><td colspan="2">\
                        <label><input type="checkbox" class="' + className + '-keepAliveTimer" data-option="keepAliveTimer" ' + (options.keepAliveTimer ? 'checked' : '') + '>\
                            ' + lng.s('Не замедлять процесс загрузки в фоне', 'grabber_keep_alive_timer') + '\
                        </label>\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-titleUpdate' + extShown + '"><td colspan="2">\
                        <label><input type="checkbox" class="' + className + '-titleUpdate" data-option="titleUpdate" ' + (options.titleUpdate ? 'checked' : '') + '>\
                            ' + lng.s('Заменять заголовок окна', 'grabber_title_update') + '\
                        </label>\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-invertNumeration' + extShown + '"><td colspan="2">\
                        <label><input type="checkbox" class="' + className + '-invertNumeration" ' + (options.invertNumeration ? 'checked' : '') + '>\
                            ' + lng.s('Инвертировать нумерацию', 'grabber_flip_numbers') + '\
                        </label>\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-skipDownloaded' + extShown + '"><td colspan="2">\
                        <label><input type="checkbox" class="' + className + '-skipDownloaded" data-option="skipDownloaded" ' + (options.skipDownloaded ? 'checked' : '') + '>\
                            ' + lng.s('Пропускать уже скачанные в директорию (по истории загрузок)', 'grabber_skip_downloaded') + '\
                        </label>\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-grabber_threads_num' + extShown + '"><td>\
                        <span>' + lng.s('Количество потоков', 'grabber_threads_num') + '</span>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-threads" value="' + options.maxDownloadsAtTime + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-grabber_interval' + extShown + '"><td>\
                        <span>' + lng.s('Интервал загрузки (сек)', 'grabber_interval') + '</span>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-interval" value="' + options.interval + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-grabber_timeout' + extShown + '"><td>\
                        <span>' + lng.s('Таймаут при долгом выполнении запроса (сек)', 'grabber_timeout') + '</span>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-timeout" value="' + options.cancelTimer + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + ' ' + extendedClass + '-last' + extShown + '"><td colspan="2">&nbsp;</td></tr>\
                    <tr><td colspan="2"><div class="' + className + '-controll-buttons"></div></td></tr>\
                    <tr><td colspan="2">\
                        <div class="' + className + '-progressbar-wrap">\
                            <div class="' + className + '-progressbar">\
                                <div class="' + className + '-progressbar-line ' + className + '-progressbar-line-ok"></div>\
                                <div class="' + className + '-progressbar-line ' + className + '-progressbar-line-err"></div>\
                                <div class="' + className + '-progressbar-state"></div>\
                            </div>\
                        </div>\
                    </td></tr>\
                    <tr class="' + className + '-error-wrap hidden"><td colspan="2">\
                        <a class="' + className + '-error-counter" href="#"></a>\
                    </td></tr>\
                </table>\
            </div>\
        ';
        
        KellyTools.setHTMLData(handler.container, html);        
        
        errorProgress = {
            block : KellyTools.getElementByClass(handler.container, className + '-error-wrap'),
            counter : KellyTools.getElementByClass(handler.container, className + '-error-counter'),
            tooltip : false,
            rendered : false,
            maxErrorsShow : 1000,
            updateTooltip : function() {
               
                if (!this.tooltip) {
                    return;
                }
                
                if (this.rendered !== false && this.rendered == failItems.length) {
                    return;
                }                 
                 
                var failedList = '';
                 
                var html = '';
                for (var i=0; i < failItems.length; i++) {
                    
                    failedList += (failedList ? ',' : '') + failItems[i].num;
                    
                    if (i+1 <= this.maxErrorsShow) {
                        html+= '#' + failItems[i].num + ' - [DownloadId ' + failItems[i].id + '] - ' + failItems[i].reason + '\n\n';
                    }
                }
                
                html = '<div class="' + className + '-error-list-errorsLine">\
                            <p>' + lng.s('', 'grabber_fail_errors_list_notice') + '</p>\
                            <p><textarea>' + html + '</textarea></p>\
                       </div>';
                
                if (failedList) {
                    
                    html = '<div class="'  + className + '-error-list-itemsline">\
                                <p>' + lng.s('', 'grabber_fail_items_list_notice') + '</p>\
                                <p><textarea>' + failedList + '</textarea></p>\
                            </div>' + html;
                }

                var tcontainer = this.tooltip.getContent();
                KellyTools.setHTMLData(tcontainer, '<div class="'  + className + '-error-list">' + html + '</div>');            
                
                this.rendered = failItems.length;
            }
        };
         
        errorProgress.counter.onclick = function() {
            
            // todo move to public method
            
            var envVars = fav.getGlobal('env');
            
            if (!errorProgress.tooltip) {
                errorProgress.tooltip = new KellyTooltip({
                    target : 'screen', 
                    offset : {left : 20, top : -20}, 
                    positionY : 'bottom',
                    positionX : 'left',				
                    ptypeX : 'inside',
                    ptypeY : 'inside',
                    closeByBody : false,
                    closeButton : true,
                    removeOnClose : true,                    
                    selfClass : envVars.hostClass + ' ' + envVars.className + '-tooltipster-error',
                    classGroup : envVars.className + '-tooltipster',
                    events : {
                        onClose : function() {
                            errorProgress.tooltip = false;
                        }
                    }
                });
            }
            
            errorProgress.rendered = false;
            errorProgress.updateTooltip();
            
            setTimeout(function() {
                
                errorProgress.tooltip.show(true);                    
                errorProgress.tooltip.updatePosition();
                
            }, 100);
            
            return false;
        }        
                     
        var animationFormat = KellyTools.getElementByClass(handler.container, className + '-animationFormat');
        if (animationFormat) animationFormat.onchange = function() {
                
                handler.updateCfg({ options : {animationFormat : this.options[this.selectedIndex].value} });
                delayUpdateOptionsEvent();
                
                return;
            };
            
        var baseFolderInput = KellyTools.getElementByClass(handler.container, className + '-controll-baseFolder');
            baseFolderInput.onchange = function() {
                
                handler.updateCfg({ options : {baseFolder : this.value} });              
                this.value = options.baseFolder;
                
                delayUpdateOptionsEvent();  
                
                return;
            };
        
        var rangeSwitches = handler.container.getElementsByClassName(className + '-controll-rangeSwitch');
        for (var i = 0; i < rangeSwitches.length; i++) {
            
            rangeSwitches[i].onclick = function() {
            
                var pointer = this.getAttribute('data-pointer');
                var rangeInputs = handler.container.getElementsByClassName(className + '-controll-rangeInput');
                var rangeSwitches = handler.container.getElementsByClassName(className + '-controll-rangeSwitch');
                
                for (var i = 0; i < rangeSwitches.length; i++) {
                    KellyTools.classList(rangeSwitches[i] == this ? 'add' : 'remove', rangeSwitches[i], 'active');                
                }
                
                for (var i = 0; i < rangeInputs.length; i++) {
                    KellyTools.classList(rangeInputs[i].className.indexOf(pointer) == -1 ? 'remove' : 'add', rangeInputs[i], 'active');                
                }
                
                return false;
            };                
        }  
                    
        var itemsList = KellyTools.getElementByClass(handler.container, className + '-itemsList');
            itemsList.onchange = function() {
                                          
                if (mode != 'wait') return false;
                
                var inputValue = this.value.trim();                
                var count = KellyTools.getPrintValues(inputValue, false, 1, downloads.length, this).length;
                
                if (!this.value && inputValue && !count) {                    
                    showNotice('grabber_selected_items_not_found', 1);
                }

                options.itemsList = this.value;
                updateContinue(true);
                
                failItems = [];
                count ? updateProgressBar(0, 0, count) : updateProgressBar(0, 0);

                return;
            }

        var startFrom = KellyTools.getElementByClass(handler.container, className + '-startFrom');
            startFrom.onkeyup = function() {
                
                var itemN = this.value.trim();
                    itemN = parseInt(itemN);
                
                var offsetKey = (options.invertNumeration ? (downloads.length - 1) - (itemN - 1) : itemN - 1);
                   
                if (!downloads.length || !offsetKey || offsetKey <= 0) {
                    offsetKey = 0;
                } else if (offsetKey > downloads.length - 1) {
                    offsetKey = downloads.length-1;            
                } 
           
                if (offsetKey) {
                    
                    buttons['continue'].setAttribute('data-start-from', offsetKey);   
                    buttons['continue'].style.display = 'block';
                    
                    this.value = options.invertNumeration ? downloads.length - offsetKey : offsetKey + 1;   

                } else {
                    buttons['continue'].style.display = 'none';
                    this.value = '';
                }
            }
            
            startFrom.onchange = function() {
              
                var offsetKey = parseInt(buttons['continue'].getAttribute('data-start-from'));                                
                if (offsetKey && downloads.length) {
                    
                    handler.resetDownloadItems(false);
                    
                    for (var i=0; i < offsetKey; ++i) {
                        
                        downloads[i].downloadDelta = {id : -1, state : {current : 'complete'} };                                       
                    } 
                    
                    handler.clearStateForImageGrid();
                    handler.updateStateForImageGrid();
                }
                
                return;
            }
            

        var invertNumeration = KellyTools.getElementByClass(handler.container, className + '-invertNumeration');
            invertNumeration.onchange = function() {
                
                options.invertNumeration = this.checked ? true : false;
                
                handler.clearStateForImageGrid();
                handler.updateStateForImageGrid();
                delayUpdateOptionsEvent();
                return;
            }  
            
        var commonCheckbox = ['keepAliveTimer', 'titleUpdate', 'skipDownloaded', 'webpToPng'];
        for (var i = 0; i < commonCheckbox.length; i++) {
             var cbox = KellyTools.getElementByClass(handler.container, className + '-' + commonCheckbox[i]);
             if (cbox) cbox.onchange = function() {
                options[this.getAttribute('data-option')] = this.checked ? true : false;
                delayUpdateOptionsEvent();
                return;
            }   
        }             
            
        var nameTemplateHelp = KellyTools.getElementByClass(handler.container, className + '-nameTemplate-help');
            nameTemplateHelp.onclick = function() {
                
                showNotice('grabber_name_template_help', 5);
                return false;
            }
        
        var nameTemplate = KellyTools.getElementByClass(handler.container, className + '-nameTemplate');
            nameTemplate.onchange = function() {
                
                options.nameTemplate = KellyTools.validateFolderPath(this.value);                
                this.value = options.nameTemplate;
                
                handler.setDownloadTasks();
                delayUpdateOptionsEvent();
                return;
            }       
            
            
        var quality = handler.container.getElementsByClassName(className + '-quality');
        if (quality) {
            for (var i=0; i < quality.length; i++) {		
                quality[i].onclick = function() {
                    options.quality = this.value == 'hd' ? 'hd' : 'preview';
                    
                    handler.setDownloadTasks();
                    delayUpdateOptionsEvent();
                }
            }
        }
            
        var showExtend = KellyTools.getElementByClass(handler.container, className + '-extended-show');
            showExtend.onclick = function() {
                
                extendedOptionsShown = !extendedOptionsShown;
                
                var extOptions = handler.container.getElementsByClassName(className + '-controll-extended');
                if (extOptions) {
                    for (var i=0; i < extOptions.length; i++) {						
                        if (!extendedOptionsShown) {
                            extOptions[i].className = extOptions[i].className.replace('active', 'hidden');
                        } else {
                            extOptions[i].className = extOptions[i].className.replace('hidden', 'active');
                        }
                    }
                }
                
                this.innerText = extendedShowTitle[extendedOptionsShown ? 'hide' : 'show'];
                
                onSideBarBoundsUpdate('showExtend');
                return false;
            }
        
        var threadsInput = KellyTools.getElementByClass(handler.container, className + '-threads');
            threadsInput.onchange = function() {
                                
                options.maxDownloadsAtTime = parseInt(this.value);
                if (!options.maxDownloadsAtTime || options.maxDownloadsAtTime < 0) options.maxDownloadsAtTime = 1;
                
                this.value = options.maxDownloadsAtTime;
                delayUpdateOptionsEvent();
            }
   
        var intervalInput = KellyTools.getElementByClass(handler.container, className + '-interval');
            intervalInput.onchange = function() {
                                
                options.interval = KellyTools.val(this.value, 'float');               
                if (!options.interval || options.interval < 0.1) options.interval = 0.1;
               
                this.value = options.interval;
                delayUpdateOptionsEvent();
            }
            
        var cancelInput = KellyTools.getElementByClass(handler.container, className + '-timeout');
            cancelInput.onchange = function() {
                                
                options.cancelTimer = KellyTools.val(this.value, 'float');                
                if (!options.cancelTimer || options.cancelTimer < 2) options.cancelTimer = 5 * 60;                
                
                this.value = options.cancelTimer;
                delayUpdateOptionsEvent();
            } 
            
        downloadProgress = {
            line : KellyTools.getElementByClass(handler.container, className + '-progressbar-line-ok'),
            lineErr : KellyTools.getElementByClass(handler.container, className + '-progressbar-line-err'),
            state : KellyTools.getElementByClass(handler.container, className + '-progressbar-state'),
        }
    
        handler.btnsSection = KellyTools.getElementByClass(handler.container, className + '-controll-buttons');
        
        // add controll buttons
        
        buttons = {};
        handler.addControllEl('init', ''); 
        
        var continueBtn = handler.addControllEl('continue', lng.s('Продолжить', 'grabber_continue'), function() {
            
            if (mode != 'wait') return false;
            
            downloadsOffset = parseInt(this.getAttribute('data-start-from'));
            
            handler.download(true);  
            updateContinue(true); 
            return false;
        });  
        
        continueBtn.style.display = 'none';        
        
        handler.addControllEl('save_as_json', lng.s('Скачать как профиль', 'grabber_save_as_json'), function() {
        
            handler.downloadFilteredData();            
            return false;
        }); 
        
        handler.addControllEl('save_as_txt', lng.s('Скачать как список ссылок', 'grabber_save_as_txt'), function() {
    
            handler.downloadFilteredData('txt');            
            return false;
        });

        var logBtn = handler.addControllEl('save_log', lng.s('Скачать лог', 'grabber_save_log'), function() {
        
            downloadLog();            
            return false;
        });   

        logBtn.style.display = 'none';
        
        handler.updateStartButtonState('start');
        updateProgressBar();     
        onSideBarBoundsUpdate('showGrabManager');
    }
    
    function updateTitle(current, fail, total) {
        if (!options.titleUpdate) return false;
        
        if (!handler.originalTitle) handler.originalTitle = document.title;
        var title = handler.originalTitle;
        
        if (mode != 'wait') {
            var title = '[' + current + ' / ' + total + '] - ' + KellyTools.getProgName();
        } 
        
        document.title = title;
    }
    
    function updateProgressBar(current, fail, total) {
        
        if (downloadProgress && downloadProgress.line) { 
            
            if (typeof total == 'undefined' || total === null) {
                
                total = downloads.length - manualExcludeItems.length;
                
                if (acceptItems) {
                    total = acceptItems.length;
                }
            }
            
            if (typeof current == 'undefined' || current === null) {
                
                current = handler.countCurrent('complete');
                
                if (current > total) {
                    toTxtLog('COUNTER more that total items. CHECK COUNTER ' + current + ' / ' + total);
                    current = total;
                }
            }
            
            if (typeof fail == 'undefined' || fail === null) {
                fail = failItems.length;
            } 
            
            var complete = Math.round(current / (total / 100));
            var bad = fail ? Math.round(fail / (total / 100)) : 0;
            
            if (bad > 100) bad = 100;
            
            downloadProgress.state.innerText = current + ' / ' + total;        
            downloadProgress.line.style.width = complete + '%';
            
            if (bad > 0) {
                downloadProgress.lineErr.style.width = bad + '%';
            } else {
                downloadProgress.lineErr.style.width = '0px';
            }
            
            updateTitle(current, fail, total);
        }
        
        if (errorProgress && errorProgress.block) {
            if (failItems.length) {
                
                if (errorProgress.block.className.indexOf('active') == -1) {
                    errorProgress.block.className = errorProgress.block.className.replace('hidden', 'active');
                }
                
                errorProgress.counter.innerText = lng.s('Ошибки загрузки : __ERRORSNUM__', 'grabber_errors_counter', {ERRORSNUM : failItems.length});                
                errorProgress.updateTooltip();
                
            } else {
                
                if (errorProgress.block.className.indexOf('hidden') == -1) {
                    errorProgress.block.className = errorProgress.block.className.replace('active', 'hidden');
                }
            }
        }
    }
    
    function downloadLog() {
    
        var fname = fav.getGlobal('options').baseFolder + '/' + fav.getStorageManager().dir.logs;
            fname += 'download_log_' + KellyTools.getTimeStamp() + '.log';
            fname = KellyTools.validateFolderPath(fname);
            
        fav.getDownloadManager().createAndDownloadFile(log, fname);
        
    }
    
    function optionsFormDisable(disable) {
        
        if (!handler.container) return;
        
        var inputs = handler.container.getElementsByTagName('input');
        
        if (!inputs || !inputs.length) return;
        
        for (var i = 0; i < inputs.length; i++) {
            
            inputs[i].disabled = disable;
        }
    }
    
    function showState(state) {
        
        if (!state) state = 'undefined';
        
        var html = '';
        
        if (state == "complete") {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-ok" data-notice="' + lng.s('Загрузка завершена', 'grabber_state_ready') + '"></div>';
        } else if (state == "in_progress") {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-loading" data-notice="' + lng.s('Загрузка...', 'grabber_state_loading') + '" ></div>';
        } else if (state == 'wait') {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-wait" data-notice="' + lng.s('Ожидает в очереди', 'grabber_state_wait') + '"></div>';
        } else if (state == 'error') {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-err" data-notice="' + lng.s('Ошибка загрузки', 'grabber_state_error') + '"></div>'; // todo вывод деталей ошибки, сохраняется в lastError?
        } else if (state == 'skip') {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-skip" data-notice=""></div>'; 
        }  else {
            html += '<div class="' + className + '-item-state ' + className + '-item-state-undefined" data-notice=""></div>';
        }
         
        return html;
    }
    
    function showNotice(localizationKey, num) {
        
        if (!num) num = 1;
                                       
        var env = fav.getGlobal('env'), tooltip = KellyTools.getNoticeTooltip(env.hostClass, env.className);
        var html = lng.s('', localizationKey);
        
        if (num > 1) {
            for (var i = 1; i <= num; i++) html += lng.s('', localizationKey + '_' + i);
        }
           
        var tcontainer = tooltip.getContent();
        KellyTools.setHTMLData(tcontainer, '<div>' + html + '</div>');
        
        tooltip.show(true);   
        tooltip.updatePosition();   
                    
        return true;
    }
    
    function showDownloadItemInfoTooltip(downloadIndex, target) {
    
       // if (KellyTools.getElementByClass(document, fav.getGlobal('env').className + '-tooltipster-help')) {
       //     KellyTools.log('tooltip is not exist', 'KellyGrabber');
       //     return;
       // }
        
        if (!downloads[downloadIndex]) {
            KellyTools.log('cant display item info by downloadIndex : ' + downloadIndex, 'KellyGrabber');
            return;
        }
        
        if (!handler.initDownloadItemFile(downloads[downloadIndex])) {
            KellyTools.log('cant init download params for item : ' + downloadIndex, 'KellyGrabber');
            return;
        }
        
        var item = downloads[downloadIndex].item;
        var tooltipEl = fav.getTooltip();
            tooltipEl.updateCfg({
                target : target, 
                offset : {left : 0, top : 0}, 
                positionY : 'bottom',
                positionX : 'left',				
                ptypeX : 'inside',
                ptypeY : 'outside',
                avoidOutOfBounds : false,
                closeButton : true,
            });
            
        var baseClass = fav.getGlobal('env').className + '-tooltipster-ItemInfo ' + fav.getGlobal('env').className + '-tooltipster-DownloaderItemInfo';
        
        var itemInfo = document.createElement('div');
            itemInfo.className = baseClass;
            itemInfo.id = baseClass + '-' + downloadIndex;
            
        var html = lng.s('Сохранить как', 'grabber_save_as') + ' : <br>' + downloads[downloadIndex].filename;
        if (downloads[downloadIndex].ext) html += '.' + downloads[downloadIndex].ext;
            html += '<br><br>' + fav.showItemInfo(item);
            
            if (downloads[downloadIndex].error) {
                html += 'error : ' + downloads[downloadIndex].error + '<br><br>';
                console.log(downloads[downloadIndex]);
            }
            
            KellyTools.setHTMLData(itemInfo, html);
    
        var tcontainer = tooltipEl.getContent();
            tcontainer.innerHTML = '';
            tcontainer.appendChild(itemInfo);
            
        tooltipEl.show(true);
        fav.tooltipBeasy = true;
    }
       
    this.clearStateForImageGrid = function() {
            
        for (var i = 0; i <= downloads.length-1; i++) {
                
            if (!downloads[i].item) continue;
            
            var downloadItemId = imageClassName + '-' + downloads[i].item.id;
           
            var itemContainer = document.getElementById(downloadItemId);
            if (!itemContainer) {
                continue;
            }       
            
            var holder = KellyTools.getElementByClass(itemContainer, imageClassName + '-download-state-holder');
            
            if (holder) {
                holder.parentElement.removeChild(holder);
            }
        }            
    }
    
    this.updateStateForImageGrid = function() {
        
        if (events.onUpdateView && events.onUpdateView(handler)) return;
        
        var subItems = {};
        // var gridItems = this.imageGrid.getTiles();
        
        for (var i = 0; i <= downloads.length-1; i++) {
                
            // KellyTools.log(handler.isItemShown(downloads[i].item));
            if (!downloads[i].item) continue;
            
            var downloadItemId = imageClassName + '-' + downloads[i].item.id;
            var itemN = options.invertNumeration ? downloads.length - i : i + 1;
         
            if (downloads[i].subItem !== false) {                
                if (!subItems[downloads[i].item.id]) subItems[downloads[i].item.id] = [];
                subItems[downloads[i].item.id].push(i);                
            }
            
            // check if element is visible on current list page
            var itemContainer = document.getElementById(downloadItemId);
            if (!itemContainer) {
                continue;
            }       
            
            // KellyTools.log(imageClassName + '-' + downloads[i].item.id);
        
            var holder = KellyTools.getElementByClass(itemContainer, imageClassName + '-download-state-holder');  

            var title = '#' + itemN;
            if (downloads[i].subItem !== false) {
                
                var itemNto = options.invertNumeration ? itemN + downloads[i].item.pImage.length-1 : itemN - downloads[i].item.pImage.length+1 ;
                title = options.invertNumeration ? '#' + itemN + '-#' + itemNto : '#' + itemNto + '-#' + itemN;
            }
                
            if (!holder) {
                
                holder = document.createElement('DIV');
                holder.className = imageClassName + '-download-state-holder' + (options.manualExclude ? ' ' + imageClassName + '-manualExclude-mode' : '');

                var html = '';
                if (options.manualExclude) {
                    html += '\
                     <input type="checkbox" class="' + imageClassName + '-download-enabled" data-no-tip="1" id="' + downloadItemId + '-download-enabled" name="' + downloadItemId + '-download-enabled" ' + (manualExcludeItems.indexOf(i) != -1 ? '' : 'checked') + (mode == 'download' ? ' disabled' : '') + '>\
                    <label title="Включить картинку в список выгрузки" class="' + imageClassName + '-download-enabled-label" data-no-tip="1" for="' + downloadItemId + '-download-enabled"></label>\
                    ';
                }
                  
                html += '\
                    <div class="' + imageClassName + '-download-number" data-enabler="1"><span class="' + imageClassName + '-download-number-title" data-enabler="1">' + title + '</span></div>\
                    <div class="' + imageClassName + '-download-status"></div>\
               ';
               
                KellyTools.setHTMLData(holder, html);
                itemContainer.appendChild(holder);
                                                
                if (options.manualExclude) {
                    
                    var downloadEnabled = KellyTools.getElementByClass(itemContainer, imageClassName + '-download-enabled'); 
                        downloadEnabled.onchange = function() {  
                            
                            var holder = KellyTools.getParentByClass(this, imageClassName + '-download-state-holder');
                            var itemIndex = parseInt(holder.getAttribute('downloadindex'));
                            
                            // get all download items indexes that related to item index if it contains sub items
                            var indexList = downloads[itemIndex].subItem !== false ? subItems[downloads[itemIndex].item.id] : [itemIndex];
                            
                            // exclude / add all to list
                            for (var b = 0; b < indexList.length; b++) {  
                               
                                var index = manualExcludeItems.indexOf(indexList[b]);
                                if (index == -1 && !this.checked) manualExcludeItems.push(indexList[b]);
                                if (index != -1 && this.checked) manualExcludeItems.splice(index, 1);
                            }
                            
                            updateProgressBar();
                        }
                        
                }
                    
                holder.onclick = function(e) {                
                    
                    // if (fav.getTooltip().isShown()) return false;
                    if (options.manualExclude && e.target.getAttribute('data-enabler')) {
                        KellyTools.getElementByClass(this, imageClassName + '-download-enabled').click();
                        return;
                    }
                    
                    if (e.target.getAttribute('data-no-tip')) {
                        return;
                    }
                    
                    var itemIndex = this.getAttribute('downloadIndex');
                    showDownloadItemInfoTooltip(this.getAttribute('downloadIndex'), this);
                    
                    return false;
                }  
                
                /*
                holder.onmouseover = function(e) {                
                    
                    var itemIndex = this.getAttribute('downloadIndex');
                    showDownloadItemInfoTooltip(this.getAttribute('downloadIndex'), this);
                }  
                    
                holder.onmouseout = function(e) {    
                    
                    var related = e.toElement || e.relatedTarget;
                    if (fav.getTooltip().isChild(related)) return;
                        
                    fav.getTooltip().show(false);
                }  
                */              
            }
            
            var statusPlaceholder = KellyTools.getElementByClass(holder, imageClassName + '-download-status');
            
            // update state by last item in collection

            if (downloads[i].subItem === false || downloads[i].subItem == downloads[i].item.pImage.length-1) {
                
                holder.setAttribute('downloadIndex', i);
                
                var numberTitle = KellyTools.getElementByClass(itemContainer, imageClassName + '-download-number-title');            
                if (numberTitle) {
                    numberTitle.innerText = title;
                }
                
                var downloadEnabled = KellyTools.getElementByClass(itemContainer, imageClassName + '-download-enabled');
                if (downloadEnabled) {
                    downloadEnabled.disabled = (mode == 'download' ? true : false);
                    downloadEnabled.checked = manualExcludeItems.indexOf(i) == -1;
                }  
                
                var html = '';
                
                if (downloads[i].subItem === false) {
                    
                    html = showState(handler.getDownloadItemState(downloads[i]));
                } else {
                    
                    // KellyTools.log(subItems[downloads[i].item.id]);
                    var subItemsStat = {
                        wait : 0,
                        complete : 0,
                        in_progress : 0,
                        error : 0,
                        skip : 0,
                    }
                    
                    for (var b = 0; b < subItems[downloads[i].item.id].length; b++) {    
                        var subItemState = handler.getDownloadItemState(downloads[subItems[downloads[i].item.id][b]]);
                        subItemsStat[subItemState]++;                        
                        
                        if ( subItemsStat[subItemState] == subItems[downloads[i].item.id].length ) {
                             html = showState(subItemState);
                        }
                    }
                    
                    if (!html) html = showState('in_progress');
                }
            
                KellyTools.setHTMLData(statusPlaceholder, html);
            }
        }
        
        setTimeout(function() {
            
            var offsetWidth = options.manualExclude ? -40 : 0;
            var textNodes = document.getElementsByClassName(imageClassName + '-download-number');
            for (var i = 0; i < textNodes.length; i++) {
                var textNode = KellyTools.getElementByTag(textNodes[i], 'span');                
                KellyTools.fitText(textNodes[i], textNode, false, offsetWidth);
            }
            
        }, 100);
    }  
    
    this.getDownloadItemState = function(ditem) {
        
        if (!ditem.item) return 'skip';
        
        var itemIndex = downloads.indexOf(ditem);        
        if (itemIndex == -1) return 'skip';
        
        if (acceptItems.length > 0) {
            var acceptIndex = options.invertNumeration ? downloads.length - itemIndex : itemIndex+1;        
            if (acceptItems && acceptItems.indexOf(acceptIndex) == -1) return 'skip';
        }
        
        // currently count any. Possible states - downloadDelta.state.current == "interrupted" / "complete"
        
        if (manualExcludeItems.indexOf(itemIndex) != -1) {
        
            return 'skip';
        
        } else if (ditem.downloadDelta) { 
            
            return 'complete';
            
        } else if (ditem.error) {
                             
            return 'error';
            
        } else if (ditem.canceling) {
            
            return 'canceling';
            
        } else if ((ditem.dataRequest) || (ditem.downloadId && ditem.downloadId > 0) || (ditem.downloadId && ditem.downloadId === KellyGrabber.DOWNLOADID_GET_PROCESS)) {
            
           return 'in_progress';
            
        } else {
            
           return 'wait'; // inlist \ wait 
        }
    }
    
    this.onDownloadProcessChanged = function(downloadDelta) {
        
        if (mode != 'download') return;
        
        // KellyTools.log('incoming ' + downloadDelta.id);
        
        // if its not our item then exit
        
        if (downloadingIds.indexOf(downloadDelta.id) === -1) {
            KellyTools.log('download id not found, skip ' + downloadDelta.id, 'KellyGrabber');
            return false;
        }
        
        if (downloadDelta.state) {
            
            if (downloadDelta.state.current == "interrupted" || downloadDelta.state.current == "complete") {
                if (blobData[downloadDelta.id]) {
                    
                    URL.revokeObjectURL(blobData[downloadDelta.id]);
                    blobData[downloadDelta.id] = null;
                    delete blobData[downloadDelta.id];
                } 
            }
            
            if (downloadDelta.state.current != "in_progress") {                
                
                downloadingIds.splice(downloadingIds.indexOf(downloadDelta.id), 1);
            
                var downloadIndex = handler.getDownloadById(downloadDelta.id);
                if (downloadIndex === false) {
                
                    KellyTools.log('item by download id not found in common stack', 'KellyGrabber');
                    KellyTools.log(downloadDelta, 'KellyGrabber');
                    
                    return false;
                }
                
                var downloadItem = downloads[downloadIndex];
                var error = downloadDelta.error && downloadDelta.error.current ? downloadDelta.error.current : false;
                
                toTxtLog('DOWNLOADID ' + downloadItem.id + ' | download STATE update by browser API : ' + downloadDelta.state.current + (error ? ' Error : ' + error : ''));
                
                if (downloadItem.cancelTimer) {
                    clearTimeout(downloadItem.cancelTimer);
                    downloadItem.cancelTimer = false;
                }
                 
                downloadItem.downloadDelta = downloadDelta;
                downloadItem.workedout = true;
                      
                if (error) {
                    
                    var errorText = 'Системная ошибка : ' + error;
                    
                    if (error == 'USER_CANCELED') {
                        errorText = 'Загрузка прервана (проверьте настройку "Всегда указывать место для скачивания")';
                    }
                    
                    addFailItem(downloadItem, errorText); 
                    resetItem(downloadItem);
                    
                    downloadItem.error = errorText;
                    downloadItem.workedout = true;
                }
                
                updateProgressBar();
                
                handler.onDownloadEnd(downloadItem);
               
            } else {
                
                // KellyTools.log(downloadDelta);
                // KellyTools.log(downloadDelta.url + 'download process ' + downloadDelta.fileSize);
            } 
            
            
        }
        
        handler.updateStateForImageGrid();
    }
    
    function updateProcessState(canceled) {
            
        var inProgress = handler.countCurrent('in_progress');
        var waitingNum = handler.countCurrent('wait');
        
        if ((!waitingNum && !inProgress) || canceled) {
            
            if (events.onDownloadAllEnd) {
                
                var response = {
                    
                    total : acceptItems ? acceptItems.length : downloads.length,
                    complete : handler.countCurrent('complete'),
                    failed : failItems.length,
                    failItems : failItems,
                    canceled : canceled ? true : false,
                }
                
                events.onDownloadAllEnd(handler, response);
            }
            
            handler.updateStartButtonState('start');

            var hideContinue = canceled ? false : true;

            updateContinue(hideContinue);
            updateProgressBar();    
        } 
        
        return {inProgress : inProgress, waitingNum : waitingNum};
    }
    
    this.onDownloadEnd = function(ditem) {
        
        var curState = updateProcessState();                
        if (curState.waitingNum) {
            
            if (options.keepAliveTimer) {
                
                 KellyTools.getBrowser().runtime.sendMessage({
                    method: "alarm", 
                    name : "addDownloadWork",
                    ms : options.interval * 1000,
                }, function(response) {
                    handler.addDownloadWork();                
                });
                
            } else {   
            
                setTimeout(function() {                        
                    handler.addDownloadWork();
                }, options.interval * 1000);
            }
            
        }
               
        if (events.onDownloadEnd) {
            // downloadDelta.id, filename, totalBytes
            events.onDownloadEnd(handler, ditem, handler.getDownloadItemState(ditem));                    
        }

        KellyTools.log('current in progress ' + curState.inProgress + ' | wait ' + curState.waitingNum, 'KellyGrabber');                
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
            btn.innerText = name;
            
        if (onClick) btn.onclick = onClick;
            
        handler.btnsSection.appendChild(btn);
        
        buttons[key] = btn;
        return btn;
    }
    
    this.closeGrabManager = function() {
 
        if (!handler.container) return false;
        
        handler.cancelDownloads(function() {               
            buttons = {};
            handler.container.innerHTML = '';
            manualExcludeItems = [];
            downloads = [];
        });
                 
    }
    
    function getNameTemplate() {
        
        if (!options.nameTemplate) {
            options.nameTemplate = '#category_1#/#id#_#category_1#_#category_2#_#category_3#';
        }
        
        return options.nameTemplate;
    }
    
    this.initDownloadItemFile = function(ditem) {
        
        // already initialized
        
        if (ditem.filename !== false) {
            return ditem;
        }
        
        var item = ditem.item;
        
        ditem.url = typeof item.pImage !== 'string' ? item.pImage[ditem.subItem] : item.pImage;
        ditem.ext = KellyTools.getUrlExt(ditem.url);
        
        var videoFormat = false; 
        if (ditem.ext == 'gif' && options.animationFormat != 'gif') {
            ditem.ext = options.animationFormat;
            videoFormat = ditem.ext; 
        }
        
        ditem.url = fav.getGlobal('env').getImageDownloadLink(ditem.url, options.quality == 'hd', videoFormat);
               
        if (!ditem.url || ditem.url.length < 6) {
                        
            addFailItem(ditem, 'Некорректный Url скачиваемого файла ' + ditem.url);
            return false;
            
        } 
            
        // if (!ditem.ext) {
        //    addFailItem(ditem, 'Неопределено расширение для загружаемого файла ' + ditem.url);
        //    return false;
        // }
            
        var fileName = getNameTemplate();       
        if (item.categoryId) {            
        
            var categories = fav.getGlobal('fav').categories;
            var sm = fav.getStorageManager();
                sm.sortCategories(categories);
               
            var itemCatN = 0;
            for (var i = categories.length-1; i >= 0; i--) {
                if (item.categoryId.indexOf(categories[i].id) != -1 && categories[i].nameTpl) {
                    itemCatN++;
                    fileName = KellyTools.replaceAll(fileName, '#category_' + itemCatN + '#', categories[i].name);
                }                
            }            
        }        
        
        if (item.name) {
            fileName = KellyTools.replaceAll(fileName, '#name#', item.name);
        } else {
            fileName = KellyTools.replaceAll(fileName, '#name#', '');
        }
        
        if (item.id) {
            fileName = KellyTools.replaceAll(fileName, '#id#', item.id);
        } else {
            fileName = KellyTools.replaceAll(fileName, '#id#', '');
        }    
        
        var originalName = false;
        
        if (fileName.indexOf('#filename#') != -1) {
            
            var fullSize = options.quality == 'hd';     
            originalName = true;
            
            var fileUrlName = KellyTools.getUrlFileName(ditem.url, true);
                fileUrlName = KellyTools.val(fileUrlName, 'filename');
                
            if (!fileUrlName) {
                fileUrlName = 'default' + item.id; 
            }
            
            fileUrlName = fileUrlName.substring(0, 128);
            
            fileName = KellyTools.replaceAll(fileName, '#filename#', fileUrlName);
        }
        
        if (fileName.indexOf('#number#') != -1) {
                        
            fileName = KellyTools.replaceAll(fileName, '#number#', handler.getDownloadItemN(ditem)); 
        }
        
        fileName = KellyTools.replaceAll(fileName, /#category_[1-9]+#/, '');        
        fileName = KellyTools.validateFolderPath(fileName);
        
        if (!fileName){
            addFailItem(ditem, 'Ошибка валидации шаблона пути для загружаемого файла ' + ditem.url);
            return false;
        }    
        
        if (!originalName && ditem.subItem > 0) {
            fileName += '_' + ditem.subItem;
        }
        
        ditem.filename = fileName;
        
        return ditem;
    }
        
    // переинициализировать список задач, при изменении конфигурации \ обновлении фильтров в основном расширении    
    
    this.setDownloadTasks = function(indexes) {

        if (handler.getState() == 'download') {
            return;            
        }
        
        handler.clearDownloads();
        
        if (indexes) {
            availableItemsIndexes = indexes;
        }
        
        var items = fav.getGlobal('fav').items;
            
        for (var i = 0; i < availableItemsIndexes.length; i++) {
        
            var item = items[availableItemsIndexes[i]]
            if (!item.pImage) continue; 
            
            if (typeof item.pImage !== 'string') {
            
                for (var b = 0; b <= item.pImage.length-1; b++) {
                    handler.addDownloadItem(item, b);
                }
                
            } else {
            
                handler.addDownloadItem(item);
            }
        }  
        
        updateContinue(true);                
        updateProgressBar(); 
        //KellyTools.createAndDownloadFile('test', 'test.txt');
    }
    
    this.setBaseFolder = function(folder) {
    
        var tmpFolder = KellyTools.validateFolderPath(folder);
        if (tmpFolder) {
            options.baseFolder = tmpFolder;
        } else {
            
            options.baseFolder = '';
            
        }
        
        return options.baseFolder;
    }
    
   
    this.getDownloads = function() {
        // todo deselect inaccepted 
        return downloads;
    }
        
    this.setManualExcluded = function(input) {
        
        if (input == 'select_all') {
            
            manualExcludeItems = [];            
            
        } else if (input == 'deselect_all') {
            
            manualExcludeItems = [];
            for (var i = 0; i <= downloads.length-1; i++) {
                manualExcludeItems.push(i);
            }
            
        } else {
            
            manualExcludeItems = input;
        }
        
        handler.updateStateForImageGrid();
        updateProgressBar();
    }
    
    // full reset
    
    this.clearDownloads = function() {
        downloads = [];
        manualExcludeItems = [];
        downloadingIds = [];
        acceptItems = false;
        failItems = [];
        log = '';
    }
    
    function changeState(state) {
        
        if (state == mode) return;
        
        mode = state;
        
        if (events.onChangeState) {
            events.onChangeState(handler, state);
        }        
    }
    
    this.updateStartButtonState = function(state) {
                
        if (state == 'start') {
            
            optionsFormDisable(false);
            changeState('wait');
            
            if (buttons['init']) {
                
                if (!fav.isDownloadSupported) {
                    KellyTools.classList('add', buttons['init'], 'disabled');
                }
                
                buttons['init'].innerText = lng.s('Начать выгрузку', 'grabber_start');               
                buttons['init'].onclick = function() { 
                    
                    if (!fav.isDownloadSupported) {
                        return false;
                    }
                    
                    downloadsOffset = 0;
                    handler.resetDownloadItems(false);
                     
                    handler.download();
                    updateContinue(true);                
                    return false;
                }
            }
            
        } else {            
            
            optionsFormDisable(true);
            changeState('download');
            
            if (buttons['init']) {
                buttons['init'].innerText = lng.s('Остановить загрузку', 'grabber_stop');
                buttons['init'].onclick = function() {
                    handler.cancelDownloads();
                    handler.updateStateForImageGrid();
                    return false;
                }       
            }
        }
        
        handler.updateStateForImageGrid();
      
        if (log && buttons['save_log']) {
             buttons['save_log'].style.display = 'block';
        }       
    }
    
    // show \ hide continue button, update continue button cursor if current process wasn't fully finished
    
    function updateContinue(hide, lastReadyIndex) {
        
        if (!buttons['continue']) return;
        
        var offsetInput = KellyTools.getElementByClass(handler.container, className + '-startFrom');
        
        if (hide) {
            buttons['continue'].style.display = 'none';
            offsetInput.value = '';
            return;
        }
        
        if (!lastReadyIndex) {
            
            lastReadyIndex = 0;
            
            for (var i = downloadsOffset; i <= downloads.length-1; i++) {
                
                var state = handler.getDownloadItemState(downloads[i]);            
                if (state != 'complete' && state != 'skip') {
                    break;
                } else {               
                   lastReadyIndex = i + 1;
                }
            }
            
        }
  
        if (offsetInput) offsetInput.value = lastReadyIndex ? (options.invertNumeration ? downloads.length - lastReadyIndex : lastReadyIndex + 1): '';

        if (lastReadyIndex) {
            
            buttons['continue'].setAttribute('data-start-from', lastReadyIndex);   
            buttons['continue'].style.display = 'block';  
          
        } else {
            
            buttons['continue'].style.display = 'none';
        }
        
        onSideBarBoundsUpdate('updateContinue');
    }
    
    this.cancelDownloads = function(onCancel) {    
      
        if (mode != 'download' || !downloads.length) return;
        
        if ( buttons['init'] ) {
             buttons['init'].innerText = lng.s('Остановка...', 'grabber_canceling');        
        }
        
        changeState('cancel');
             
        var untilStop = 0;      
 
        var checkAllCanceled = function() {            
            
            if (untilStop <= 0) {
                
                updateProcessState(true); 
                handler.resetDownloadItems(true);
                
                if (onCancel) onCancel();
            }
        }
        
        var cancelDownloadItem = function(downloadItem) {
            
            downloadItem.canceling = true;
            
            KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : downloadItem.downloadId}, function(response) {
                
                untilStop--;
                
                resetItem(downloadItem);                
                checkAllCanceled();
            });    
        }
        
        for (var i=0; i < downloads.length; i++) {
            
            if (handler.getDownloadItemState(downloads[i]) == 'in_progress') {
                                
                if (downloads[i].dataRequest) {                
                    downloads[i].dataRequest.abort();  
                    downloads[i].dataRequest = null;
                }
            
                if (downloads[i].cancelTimer) {
                    clearTimeout(downloads[i].cancelTimer);
                    downloads[i].cancelTimer = false;
                }
                
                if (downloads[i].downloadId && downloads[i].downloadId > 0) {
                    untilStop++;
                    cancelDownloadItem(downloads[i]);         
                }
            } 
        }
                      
        checkAllCanceled();    
    }
    
    // conflict action for batch download is overwrite, Chrome may show saveAs dialog when cant owerwrite file if file protected frome write - collisionCheck var prevent that 
    // also this option can produse save dialog if setted - https://github.com/NC22/KellyCFavorites/wiki/%D0%9F%D1%80%D0%BE%D0%B1%D0%BB%D0%B5%D0%BC%D1%8B-%D0%B8-%D0%B7%D0%B0%D0%BC%D0%B5%D1%87%D0%B0%D0%BD%D0%B8%D1%8F
    // todo - make conflictAction uniquify as an extend option 
    
    this.addDownloadItem = function(item, subItem, conflictAction) {
        
        if (!item) return false;
        
        ids++;

        if (item && typeof item.pImage !== 'string') {
            subItem = subItem <= item.pImage.length-1 ? subItem : 0;
        } else subItem = false;
            
        var dIndex = downloads.push({
            
            id : ids, 
            filename : false, 
            url : false, 
            conflictAction : !conflictAction ? 'overwrite' : conflictAction, 
            ext : false,
            
            downloadId : false,
            
            item : item,
            subItem : subItem, 
        }) - 1;

        return downloads[dIndex];
    }
    
    this.getDownloadById = function(id) {
                
        for (var i=0; i <= downloads.length-1; ++i) {
            if (downloads[i].downloadId === id) {
                return i;
            }
        }
        
        return false;
    }
    
    // downloadOptions.url - {base64 : [base64 blob data], type} or {blob : blob data, type} or "string" url
    
    this.downloadUrl = function(downloadOptions, onDownload) {
        
        if (!downloadOptions) return false;
        if (!downloadOptions.url) return false;
        if (!downloadOptions.filename) return false;
                
        var blob = false;
        var mimeType = false;
        if (typeof downloadOptions.url == 'object' && downloadOptions.url.blob) {
            
            downloadOptions.url.blob = URL.createObjectURL(downloadOptions.url.blob);
            blob = downloadOptions.url.blob;
        }
        
        if (typeof downloadOptions.url == 'object' && downloadOptions.url.type) {            
            mimeType = downloadOptions.url.type;
        }
        
        var download = {}, validKeys = ['filename', 'conflictAction', 'method', 'url', 'saveAs'];
        for (var i = 0; i < validKeys.length; i++) {
            if (typeof downloadOptions[validKeys[i]] != 'undefined') {
                
                var keyValue = downloadOptions[validKeys[i]];
                
                if (validKeys[i] == 'filename') {
                   
                    if (downloadOptions.ext) {
                        
                        // extension based on mime type that came from validated binary array (getDataFromUrl partly validates blob data returned from server side), not just by file name
                        // so overwrite ext if available
                        
                        if (mimeType) {
                            
                            if (mimeType == 'image/jpeg' && ['jpeg', 'jpg'].indexOf(downloadOptions.ext) != -1) {
                                
                                // allow varouse names for jpeg mime type
                                
                            } else {
                            
                                var trueExt = KellyTools.getExtByMimeType(mimeType);
                                if (trueExt !== false) downloadOptions.ext = trueExt;
                            }
                        }
                        
                        keyValue += '.' + downloadOptions.ext;
                        
                        // KellyTools.log('download url :  ' + keyValue, 'KellyGrabber', KellyTools.E_ERROR);
                        
                    } else {
                        
                        // fallback if no any extension was detected in file name
                        
                        if (mimeType && KellyTools.getExtByMimeType(mimeType)) {
                            
                            keyValue += '.' + KellyTools.getExtByMimeType(mimeType);
                            
                        } else {
                            KellyTools.log('download url : no ext key specifed for file ' + keyValue, 'KellyGrabber', KellyTools.E_ERROR);
                        }
                    }
                }
                
                download[validKeys[i]] = keyValue;
            }
        }
        
        KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", referrer : downloadOptions.referrer, download : download}, function(downloadDelta){
            
                 if (blob && downloadDelta.id == -1) URL.revokeObjectURL(blob); // download init fail - revoke url 
            else if (blob && downloadDelta.id > 0) blobData[downloadDelta.id] = blob; // ok, revoke will be in onDownloadProcessChanged
            
            if (onDownload) onDownload(downloadDelta);
        });             
        
        return true;
    }
    
    
    function toTxtLog(str) {
        log += '[' + KellyTools.getTime() + '] ' + str + "\r\n";
    }
    
    // data recieved from image server
    // currently checks only binary data for webp image format and turn it to png optionaly. Can be used for check bad image data lenght \ fake content type
    
    function validateImageBuffer(arrayBuffer, contentTypeHeader, urlOrig, onReady) {
             
        if (events.onBeforeDownloadValidate) {
            
             var result = events.onBeforeDownloadValidate(handler, arrayBuffer, contentTypeHeader, urlOrig, onReady);
             if (result === true) {
                 
                 KellyTools.log('Download ready, enviroment event handler taked controll, before return blob, wait external onReady call', 'KellyGrabber');
                 return;
             }  
        }
        
        var view = false;
        
        if (!contentTypeHeader) {
            
            // todo add all media extensions headers checks, and trust only this info
            
            if (!view) view = new Uint8Array( arrayBuffer );
            
            var ext = KellyTools.getExt(urlOrig);
            if (KellyTools.isWebp(view)) ext = 'webp';
            if (!ext) ext = 'jpg';
            
            contentTypeHeader = KellyTools.getMimeType(ext);   
            toTxtLog('DOWNLOAD URL ' + urlOrig + " | warning : server not returned any content-type header, will manualy check extension - " + ext + " " + contentTypeHeader + "\n\r");
                  
        }
        
        var getDefaultBlob = function() {
            return new Blob([arrayBuffer], { type: contentTypeHeader});
        }
        
        if (options.webpToPng) {
            
            if (!view) view = new Uint8Array( arrayBuffer );
            
            if ( KellyTools.isWebp(view) ) {
                
                toTxtLog('DOWNLOAD URL ' + urlOrig + " | conversion to PNG\n\r");
             
                var canvas = document.createElement('CANVAS');
                var ctx = canvas.getContext('2d');
                var img = document.createElement('IMG');
                
                img.onload = function(event) {
                    
                    canvas.width = this.naturalWidth;				
                    canvas.height = this.naturalHeight;
                    
                    URL.revokeObjectURL(this.src);                    
                    ctx.drawImage(this, 0, 0);
                    
                    onReady(KellyTools.base64toBlob(canvas.toDataURL('image/png').split(',')[1], 'image/png'), 'image/png');
                }
                
                img.src = URL.createObjectURL(getDefaultBlob());
                
            } else {          
                onReady(getDefaultBlob(), contentTypeHeader);
            }
            
            
        } else {
            
            onReady(getDefaultBlob(), contentTypeHeader);
        }
        
        if (view) {
            view = null;
        }
    }
    
    // download file by request as blob data. GET | ASYNC
    // callback(url, data (false on fail), errorCode, errorNotice);
    // todo - maybe return download item related to, for more universal use
    
    this.getDataFromUrl = function(urlOrig, callback) {
        
        var defaultCallback = function(urlOrig, arrayBuffer, errorCode, errorText, controller) {
            if (controller.canceled) return;
            
            if (arrayBuffer === false) {          
            
                callback(urlOrig, false, errorCode, errorText);
                
            } else {
                           
                validateImageBuffer(arrayBuffer, controller.contentType, urlOrig, function(blob, type, error) {
                    
                    if (blob === false) {
                        
                        callback(urlOrig, false, -1, 'validateImageBuffer : ' + error);
                        
                    } else if (transportMethod == KellyGrabber.TRANSPORT_BLOBBASE64) {
                
                        KellyTools.blobToBase64(blob, function(base64) {                                
                            callback(urlOrig, {base64 : base64, type : type});                              
                        });
                    
                    } else {    
                    
                        callback(urlOrig, {blob : blob, type : type});
                    }  
                    
                });               
                                  
            }
        }
                    
        if (requestMethod == KellyGrabber.REQUEST_FETCHBG) {
            
            callback(urlOrig, false, -1, 'backgroundRequest');
            return null;
            
        } else if (requestMethod == KellyGrabber.REQUEST_XML) {
            
            return KellyTools.xmlRequest(urlOrig, {responseType : 'arrayBuffer'}, defaultCallback);
                
        } else if (requestMethod == KellyGrabber.REQUEST_FETCH) {
            
            return KellyTools.fetchRequest(urlOrig, {responseType : 'arrayBuffer'}, defaultCallback);
            
        }
    }
    
    // fileData - arrayBuffer or plain text
    
    this.createAndDownloadFile = function(fileData, filename, mimetype) {

        if (!fileData) return false;
        if (!KellyTools.getBrowser()) return false;
        
        var ext = KellyTools.getExt(filename);
        if (!ext) ext = 'txt';
        
        if (!mimetype) {
             mimetype = KellyTools.getMimeType(ext);
        }
        
        if (filename.indexOf('.') != -1) {       
            filename = filename.substr(0, filename.lastIndexOf('.'));
        }
    
        var downloadOptions = {
            filename : filename, 
            conflictAction : 'uniquify',
            method : 'GET',
            ext : ext,
        }
        
            downloadOptions.url = {blob : new Blob([fileData], {type : mimetype}), type : mimetype};
        
        if (fav.isDownloadSupported) {
            
            var startDownload = function() {
                
                handler.downloadUrl(downloadOptions, function(response) {
                    if (!response) {
                        
                        KellyTools.log('download fail : empty response. Check background process log for more details', 'KellyGrabber', KellyTools.E_ERROR);
                        return;
                    }
                    if (response.error) {
                        
                        KellyTools.log('download fail ' + response.error, 'KellyGrabber', KellyTools.E_ERROR);
                    }
                    
                });
                
            }
            
        } else {
            
            // fallback single file download method
            
            var startDownload = function() {
                
                var link = document.createElement("A");                
                    link.style.display = 'none';
                    link.onclick = function() {
                        
                        var url = window.URL.createObjectURL(downloadOptions.url.blob);
                        
                        this.href = url;
                        this.download = KellyTools.getUrlFileName(filename);
                        
                        setTimeout(function() {
                           window.URL.revokeObjectURL(url);
                           link.parentElement.removeChild(link);
                        }, 4000);
                    }
                    
                document.body.appendChild(link);    
                link.click();
            }
        }
        
        if (fav.isDownloadSupported && transportMethod == KellyGrabber.TRANSPORT_BLOBBASE64) {
                
            KellyTools.blobToBase64(downloadOptions.url.blob, function(base64) {              
                downloadOptions.url = {base64 : base64, type : mimetype};
                startDownload();
            });
            
        } else {
            
            startDownload();
        }     
        
        return true;
    }
    
    function addFailItem(item, reason) {
        
        failItems[failItems.length] = {
            num : handler.getDownloadItemN(item),
            id : item.id,
            reason : reason,
        }
    }
    
    this.getDownloadItemN = function(ditem) {        
    
        var itemIndex = downloads.indexOf(ditem);        
        var N = options.invertNumeration ? downloads.length - itemIndex : itemIndex+1;
        
        // save right order inside collections
        
        if (options.invertNumeration && typeof ditem.item.pImage !== 'string') {
            
            N -= (ditem.item.pImage.length - ditem.subItem - 1) - ditem.subItem;
        }
        
        return N;
    }
    
    // start download of item, return false if fail to initialize, used only in addDownloadWork that marks failed to init items
    
    function downloadItemStart(download) {
            
        if (!handler.initDownloadItemFile(download)) {                              
            handler.updateStateForImageGrid();
            return false;
        }
           
        var baseFileFolder = options.baseFolder;        
        if (!baseFileFolder) baseFileFolder = '';
        
        if (baseFileFolder) {
            baseFileFolder += '/';
        }     
        
        var downloadOptions = {
            ext : download.ext, // file extension to save to
            filename : baseFileFolder + download.filename, // patch to save file to without extension (extension addes at last moment at downloadUrl)
            conflictAction : download.conflictAction, // todo - check some times dialog save as shown (may be if file with same name already exists?)
            saveAs : false,
            method : 'GET',
        }
        
        toTxtLog('DOWNLOADID ' + download.id + ' | download : ' + downloadOptions.filename + (downloadOptions.ext ? '.' + downloadOptions.ext : ' | Extension not detected'));
        
        // download of Blob data throw browser download API started, next catch changes throw onDownloadProcessChanged method until comlete state
                
        var onDownloadApiStart = function(response){
                
            if (!response.downloadId || response.downloadId < 0) {
                               
                toTxtLog('DOWNLOADID ' + download.id + ' | download REJECTED by browser API : ' + downloadOptions.filename);
                toTxtLog('DOWNLOADID ' + download.id + ' | error : ' + response.error + "\n\r");
                                
                if (mode != 'download') { 
                    toTxtLog('DOWNLOADID ' + download.id + ' | downloading failed, ALSO user CANCEL downloading process.');
                    return;
                }
                
                addFailItem(download, 'Ошибка загрузки ' + (response.error ? ' : ' + response.error : ''));
                
                resetItem(download);
                
                download.workedout = true;
                download.error = response.error;
                
                handler.onDownloadEnd(download);  
                
                updateProgressBar();
                handler.updateStateForImageGrid();
                
            } else {            

                toTxtLog('DOWNLOADID ' + download.id + ' | download ACCEPTED by browser API : ' + downloadOptions.filename);
                
                if (mode != 'download') { // perhaps promise was sended after cancel ?
                
                    // download not needed
                    toTxtLog('DOWNLOADID ' + download.id + ' | downloading start, but user CANCEL downloading process. SEND REJECT TO API for file : ' + downloadOptions.filename);
                     
                    KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : response.downloadId}, function(response) {});
                    
                    return;
                }
                    
                downloadingIds.push(response.downloadId);                
                KellyTools.log('DOWNLOADID ' + download.id + ' | new downloading process ' + response.downloadId, 'KellyGrabber');
                
                download.downloadId = response.downloadId;                    
                handler.updateStateForImageGrid();
            }			
        }

        // fileData - validated file data blob
        
        var onLoadFile = function(url, fileData, errorCode, errorNotice) {
            
            if (mode != 'download') return false;
            
            download.dataRequest = null;
            
            if (!fileData) {
                
                if (errorNotice == 'backgroundRequest') { // unused
                    
                    downloadOptions.url = download.url;
                    handler.downloadUrl(downloadOptions, onDownloadApiStart);
                    
                    toTxtLog('DOWNLOADID ' + download.id + ' | REQUEST DATA THROW BACKGROUND');                    
                    
                } else if (download.ext == options.animationFormat && download.ext != 'gif' && errorCode == 404) { // check is attempt to download gif as video 
                

                    download.url = fav.getGlobal('env').getImageDownloadLink(download.url, options.quality == 'hd', 'gif');
                    download.dataRequest = handler.getDataFromUrl(download.url, onLoadFile); 
                    download.ext = 'gif';
                    
                    toTxtLog('DOWNLOADID ' + download.id + ' | Video format ' + options.animationFormat + ' not found. Attempt to get file as gif ' + download.url);
                    
                } else {                    
                    
                    // if (options.attemptCount > 1) {
                    //    
                    // todo - add optional retry's until timeout   
                    //    
                    // }
                    
                    // get DATA ARRAY OR BLOB fail, download as url - bad way, due to copyright marks, so call onDownloadApi event with error
                                   
                    toTxtLog('DOWNLOADID ' + download.id + ' | file NOT LOADED as DATA ARRAY OR BLOB ' + download.url + ' : ' + downloadOptions.filename);
                    toTxtLog('DOWNLOADID ' + download.id + ' | LOAD FAIL NOTICE error code ' + errorCode + ', message : ' + errorNotice);

                    onDownloadApiStart({downloadId : false, error : 'DATA ARRAY get fail. Error code : ' + errorCode + ' |  error message : ' + errorNotice});                
                }
                
            } else {
                                
                if (!downloadOptions.ext) downloadOptions.ext = KellyTools.getExtByMimeType(fileData.type);
                
                toTxtLog('DOWNLOADID ' + download.id + ' | file LOADED as DATA ARRAY OR BLOB ' + download.url + ', send to browser API for save to folder : ' + downloadOptions.filename + ' | ' + downloadOptions.ext + ' | ' + fileData.type);
                
                downloadOptions.url = fileData;     

                handler.downloadUrl(downloadOptions, onDownloadApiStart);
            }
        }
        
        if (options.skipDownloaded) {
            
            // search by file name. todo may be some other search methods
            
            var searchRequest = new Object;
                searchRequest.canceled = false;
                searchRequest.onSearch = function(response) {
                   
                    // process stoped \ canceled by timeout
                    if (this.canceled || mode != 'download') {
                        
                        return false;
                    }
                                   
                    download.dataRequest = null;
                
                    if (response && response.matchResults && response.matchResults[0].match && response.matchResults[0].match.state == 'complete') {
                                            
                        download.downloadDelta = response.matchResults[0].match;
                        download.downloadDelta.found = true;
                        download.downloadDelta.state = {current : download.downloadDelta.state};
                               
                        if (download.cancelTimer) {
                            clearTimeout(download.cancelTimer);
                            download.cancelTimer = false;
                        }
                         
                        download.workedout = true;
                        
                        updateProgressBar();
                        handler.onDownloadEnd(download);
                        
                        toTxtLog('DOWNLOADID ' + download.id + ' | SKIPPED - ALREADY Downloaded');
                                            
                        handler.updateStateForImageGrid();

                    } else {                        
                        download.dataRequest = handler.getDataFromUrl(download.url, onLoadFile);
                    }
                };
                
                searchRequest.abort = function() {
                    this.canceled = true; // is terminate method for search action exist ?
                    this.onSearch = null;
                    this.abort = null;
                };
             
            KellyTools.getBrowser().runtime.sendMessage({
                method: "isFilesDownloaded", 
                filenames : [downloadOptions.filename] // download.filename - filename, downloadOptions.filename - full path with sub folders 
            }, searchRequest.onSearch);            
            
            download.dataRequest = searchRequest;        
            
        } else {
                        
            download.dataRequest = handler.getDataFromUrl(download.url, onLoadFile);    
        }
                
        if (events.onDownloadStart) events.onDownloadStart(download);
        return true;
    }
       
    // count elements
    // type = 'complete' - count ready downloaded items
    // type = 'wait'  - count in order to download items (elements at work not included)
    
    this.countCurrent = function(type) {
        
        if (!type) {
            type = 'wait';
        } 
        
        var count = 0;
        
        for (var i = 0; i <= downloads.length-1; ++i) { 
        
            if (handler.getDownloadItemState(downloads[i]) != type) continue;
            count++;            
        }
        
        return count;
    }
    
    this.downloadFilteredData = function(format, options) {
             
        if (mode != 'wait' || !downloads || !downloads.length) return false;        
        if (format != 'txt') format = false; // default save as json profile
        
        updateAcceptItems();
        
        var storage = fav.getStorageManager().getDefaultData(), storageTxt = '', sm = fav.getStorageManager();              
            storage.ids = fav.ids;
            storage.categories = [];
        var fname = fav.getGlobal('options').baseFolder + '/' + sm.dir.exportFiltered;
            fname += fav.getGlobal('options').storage + '_filtered_' + KellyTools.getTimeStamp() + '.' + (format ? format : sm.format);
            fname = KellyTools.validateFolderPath(fname); 
            
        for (var i = 0; i <= downloads.length - 1; i++) {
            
            if ((downloads[i].subItem !== false && downloads[i].subItem > 0) || handler.getDownloadItemState(downloads[i]) == 'skip') continue;
            
            var item = downloads[i].item, itemCats = item.categoryId;
            if (format == 'txt') {
                if (typeof item.pImage !== 'string') {
                    
                    for (var b = 0; b <= item.pImage.length-1; b++) storageTxt += fav.getGlobal('env').getImageDownloadLink(item.pImage[b], options && options.quality == 'hd') + "\r\n";
                    
                } else storageTxt += fav.getGlobal('env').getImageDownloadLink(item.pImage, options && options.quality == 'hd') + "\r\n";
                
            } else { 
                if (itemCats) {
                    for (var c = 0; c < itemCats.length; c++) {
                        if (sm.getCategoryById(storage, itemCats[c]).id == -1) {
                            storage.categories[storage.categories.length] = sm.getCategoryById(fav.getGlobal('fav'), itemCats[c]);
                        }
                    }
                }

                storage.items[storage.items.length] = item;   
            }
        }
        
        acceptItems = false;
        fav.getDownloadManager().createAndDownloadFile(format == 'txt' ? storageTxt : JSON.stringify(storage), fname);        
    }
    
    this.addDownloadWork = function() {
        
        if (mode != 'download') return false;
                
        var addCancelTimer = function(downloadItem) {
            
            downloadItem.cancelTimer = setTimeout(function() {
                
                if (!downloadItem) return;
                
                var endSync = true;
                if (handler.getDownloadItemState(downloads[i]) == 'in_progress') {
                     
                    toTxtLog('DOWNLOADID ' + downloadItem.id + ' | CANCELED BY TIMEOUT ' + downloadItem.url + ', ' + downloadItem.filename);
                            
                    if (downloads[i].dataRequest) {                
                        downloads[i].dataRequest.abort();  
                        downloads[i].dataRequest = null;
                    }
                    
                    if (downloadItem.downloadId > 0) {                    
                        KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : downloadItem.downloadId}, function(response) {   
                        
                            downloadItem.canceling = false;	
                            downloadItem.workedout = true; 

                            handler.onDownloadEnd(downloadItem);                            
                            handler.updateStateForImageGrid();
                        });  

                        endSync = false;
                    }
                }
                
                resetItem(downloadItem);
                           
                downloadItem.error = 'Canceled by timeout';	
                downloadItem.canceling = true;                
                
                addFailItem(downloadItem, 'Завершена по таймауту');
                
                if (endSync) handler.onDownloadEnd(downloadItem);
                       
                handler.updateStateForImageGrid();
                 
                
            }, options.cancelTimer * 1000);
        }
        
        var searchWorkErrorsLimit = 20;
        var currentWork = handler.countCurrent('in_progress'); 
        var newWorkNum = options.maxDownloadsAtTime - currentWork; 
        
        if (currentWork >= options.maxDownloadsAtTime) {
            return;
        } 
        
        var progressItems = [];
        
        for (var i = downloadsOffset; i <= downloads.length - 1; i++) {
            
            var dItemState = handler.getDownloadItemState(downloads[i]);
            
            if (dItemState == 'in_progress') progressItems.push(i);
            
            if (dItemState != 'wait') continue;
                        
            var downloadItem = downloads[i];
            
            downloadItem.downloadId = KellyGrabber.DOWNLOADID_GET_PROCESS;
            downloadItem.workedout = false;
                        
            // check name collisions in curent WIPs before run request (prevent from saveAs dialog in some cases)
            // saveAs can shows when server return mismatched with extension mimetype and file with same name and extension already downloaded in current stream set
            
            var collisionCheck = true;
            
            if (handler.initDownloadItemFile(downloadItem)) {
            
                for (var b = 0; b < progressItems.length; b++) {
                    
                    if (downloadItem.url == downloads[progressItems[b]].url) { 
                        
                        var collisionCheckNotice = 'Дубликат Url или имя файла для ' + downloadItem.url + ' ';
                            collisionCheckNotice += 'элемент #' + handler.getDownloadItemN(downloads[progressItems[b]]) + ' имеет идентичный Url';
                            
                        addFailItem(downloadItem, collisionCheckNotice);
                        collisionCheck = false;
                        
                        break;
                    }
                }
            }    
            
            if (collisionCheck && downloadItemStart(downloadItem)) {
                
                if (!downloadItem.workedout && options.cancelTimer) {
                    
                    progressItems.push(i);
                    addCancelTimer(downloadItem);
                }
                
                newWorkNum--;
                
            } else {
                
                // bad name template \ url \ extension - common for corrupted data
                toTxtLog('CAND INIT Download item FILENAME for N ' +  i);
                
                try {
                    
                     toTxtLog('CANT INIT Download item dump ' + JSON.stringify(downloads[i].item));
                    
                } catch (E) { }
                
                resetItem(downloadItem);
                
                downloadItem.workedout = true;
                downloadItem.error = 'Initialize download data error';
                                    
                searchWorkErrorsLimit--;
            }
              
            if (newWorkNum <= 0 || searchWorkErrorsLimit <= 0) {
                 break;
            }           
        }
               
        handler.updateStateForImageGrid();
        updateProcessState(); 
    }
    
    function resetItem(downloadItem) {
        
        downloadItem.workedout = false;
        downloadItem.canceling = false;
        
        if (downloadItem.cancelTimer) {
            clearTimeout(downloadItem.cancelTimer);
            downloadItem.cancelTimer = false;
        }
        
        if (downloadItem.error) downloadItem.error = false;			
        if (downloadItem.downloadDelta) downloadItem.downloadDelta = false;
        
        downloadItem.downloadId = KellyGrabber.DOWNLOADID_INACTIVE; 
        downloadItem.url = false;
        downloadItem.filename = false;
    }
    
    this.resetDownloadItems = function(keepReady) {
        
        if (!downloads.length) return false;
        
        for (var i=0; i <= downloads.length-1; ++i) {
            
            if (keepReady && handler.getDownloadItemState(downloads[i]) == 'complete') {
                continue;
            } 
            
            resetItem(downloads[i]);
        }        
    }
    
    this.download = function(keepLog) {
               
        if (mode != 'wait') return false;
               
        if (!downloads.length) {
            KellyTools.log('work empty', 'KellyGrabber');
            return false;
        }
        
        if (!keepLog) {  
            log = ''; failItems = [];
        }
              
        updateAcceptItems();
        
        if (downloadsOffset <= 0) {
            downloadsOffset = 0;   
        } else if (downloadsOffset > downloads.length-1) {
            downloadsOffset = downloads.length-1;            
        }       
                
        if (!options.interval) options.interval = 0.1;
                     
        handler.resetDownloadItems(true);
        handler.updateStartButtonState('stop'); 
 
        handler.addDownloadWork(); 
        updateProgressBar();
        
        KellyTools.log(options, 'KellyGrabber');
                 
        return true;
    }
     
    constructor(cfg);
}

/* Static methods and constants */

KellyGrabber.TRANSPORT_BLOB = 1001;
KellyGrabber.TRANSPORT_BLOBBASE64 = 1002;

KellyGrabber.REQUEST_IFRAME = 2001;
KellyGrabber.REQUEST_XML = 2002;
KellyGrabber.REQUEST_FETCH = 2003;
KellyGrabber.REQUEST_FETCHBG = 2004;

KellyGrabber.DOWNLOADID_GET_PROCESS = -1;
KellyGrabber.DOWNLOADID_INACTIVE = false;

KellyGrabber.validateDriver = function(driver) {
            
    var availableTransport = [KellyGrabber.TRANSPORT_BLOB, KellyGrabber.TRANSPORT_BLOBBASE64];          
    var availableRequest = [KellyGrabber.REQUEST_FETCH, KellyGrabber.REQUEST_XML, KellyGrabber.REQUEST_FETCHBG];
    
    var defaultDriver = {
           requestMethod : availableRequest[0], 
           transportMethod : availableTransport[0],
        }
        
    if (!driver) return defaultDriver;
    
    driver.requestMethod = parseInt(driver.requestMethod);
    driver.transportMethod = parseInt(driver.transportMethod);
        
    if (availableRequest.indexOf(driver.requestMethod) == -1) {
     
        driver.requestMethod = defaultDriver.requestMethod;
    }
    
    if (availableTransport.indexOf(driver.transportMethod) == -1) {
 
        driver.transportMethod = defaultDriver.transportMethod;
    }
    
    return driver;
}
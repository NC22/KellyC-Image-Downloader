// part of KellyFavItems extension

function KellyFavItems(cfg) 
{
    var handler = this;       
    var env = false;
    
    // выбранная для добавления в закладки публикация, из этих данных формируется элемент в getFavItemFromSelected
    
    var selectedPost = false, selectedImages = false, selectedComment = false;
    
    // какие-либо мета данные сохраняемые для определенной публикации в обработчике itemAdd (добавлять методом setSelectionInfo) 
    
    var selectedInfo = false; 
    
    // последние выбранные категории для selectedPost хранятся в fav.selected_cats_ids
    
    var extendCats = []; // выделеные категории для последующего добавления к определенной публикации в режиме просмотра избранного    
    var init = false; // маркер инициализации расширения (вызов метода initExtension)
    
    // события    
    // onPageReady - вызов выполняется сразу при запуске плагина если есть хотябы одна публикация, иначе window.onload, доступны все переменные конфига \ сохраненные публикации в fav.
    // onExtensionReady - вызывается после загрузки всех необходимых css ресурсов расширения  
    
    // dynamically created DOM elements
    
    var sideBarWrap = false;
    
    var modalBox = false, modalBoxContent = false, modalBoxMessage = false;
    var downloaderBox = false;    
    var favCounter = false;     
    
    var siteContent = false; // main page container - setted by env
    var favContent = false; // main extension container
    var imagesBlock = false;
    
    var submenuItems = false;
    var menuButtons = [];
    
    var mode = 'main'; // current extension page, main - not in extension, fav - show favourites page
    
    // Фильтры в режиме просмотра избранного    
    // исключать из выборки публикации по типу
    
    var excludeFavPosts = false;
    var excludeFavComments = false;
    
    var logic = 'and';
    var catFilters = [];
    var catFilterNot = false; // режим добавления категорий в список исключения при выборке 
    var catIgnoreFilters = [];
    
    var readOnly = true;
    var imagesAsDownloadItems = false;
    
    // addition classes
    var imgViewer = false;    
    var favNativeParser = false; // may be renamed to BookmarksParser in future 
    var downloadManager = false;
    var storageManager = false;    
    var optionsManager = false;
    var fastSave = false;
    var tooltip = false;
               
    var page = 1;
        
    var displayedItems = [];  // все ключи элементов попавших в выборку отсортированные в нужном порядке
    var galleryImages = [];
    var galleryImagesData = [];
    
    var lng = KellyLoc;
    
    /*  fav - current loaded throw this.load method profile data object
    
        Stores information about config, items, categories
        
        categories - array of objects [.name, .id] (see getStorageManager().categoryCreate method)
        items      - array of objects [.categoryId (array), .link (string), .pImage (string|array of strings), .commentLink (undefined|text) (see getFavItemFromSelected method for list of current available structured data vars)
        coptions   - structured data (see this.load method for list of current available options)
    */  
    
    var fav = {};
    
    this.isDownloadSupported = false;  
    
    this.aspectRatioAccurCheck = 0.05;
    
    this.sideBarLock = false;
    this.tooltipBeasy = false; // set true if shown something important throw handler.getTooltip() with close button, prevent create another tooltips onmouseover and hide onmouseout, until close section
    
    // buffer for page loaded as media resource
    var selfData = false;
    var selfUrl = window.location.href;
   
    var imageGrid = false; // see getImageGrid method
    var imageGridProportions = []; // ids of updated fav items (if some of ratio data deprecated)
    var imageEvents = { // image grid custom events
        
        saveImageProportions : function() {
             
            if (imageGridProportions.length) {
                
                log('save new proportions for items');                  
                imageGridProportions = [];
                handler.save('items');
            }
        },
                 
        // fires when fav element preview dimensions loaded
        // also dimensions can be catched by setSelectionInfo method in showAddToFavDialog
        
        // return false - initiate tilegrid UpdateTileGrid method - new or changed proportions
        
        onLoadFavGalleryImage : function(imgElement, error) {
            
            if (error) {
                
                KellyTools.classList('add', imageGrid.getTileByBoundElement(imgElement), env.className + '-FavItem-error');
                return false;
            }
            
            var favItemIndex = parseInt(imgElement.getAttribute('itemIndex'));
            if (!fav.items[favItemIndex] || !fav.items[favItemIndex].pImage) {
                
                log('fav item not found or pImage empty for index ' + favItemIndex);
                imgElement.style.display = 'none';
                return false;
            } 
            
            var item = fav.items[favItemIndex];
            var src = imgElement.getAttribute('src');
            if (!src) return false;
                
            var imageWH = { 
                width : parseInt(imgElement.naturalWidth), 
                height : parseInt(imgElement.naturalHeight),
            };
            
            if (!imageWH.width || !imageWH.height) {
                log('unable to detect bounds for element. item index ' + favItemIndex);
                log(imgElement);
                return false;
            }
            
            var aspectRatio = imageWH.width / imageWH.height;
            var aspectRatioCached = false;
            
            if (item.pw && item.ph) {
                aspectRatioCached = item.pw / item.ph;
            }
            
            // item proportions never was cached or missmatched with actual loaded image proportions (cache needed to build grid without waiting load images)
            
            if (!aspectRatioCached || (handler.aspectRatioAccurCheck && Math.abs(aspectRatioCached - aspectRatio) > handler.aspectRatioAccurCheck)) {
                
                imageGridProportions[imageGridProportions.length] = fav.items[favItemIndex].id; // added to list of fav elements that was updated
                
                item.pw = imageWH.width;
                item.ph = imageWH.height;
                if (item.ps) delete item.ps;
                
                imgElement.setAttribute('data-width', imageWH.width);
                imgElement.setAttribute('data-height', imageWH.height);
                
                return false;
            } 
            
            if (!imgElement.getAttribute('data-width')) {
                return false;            
            }
            
            return true;
        }
    }
    
    function constructor(cfg) {
     
        if (!cfg || !cfg.env) {          
            log('Unknown servise or site, cant find profile for ' + window.location.host, KellyTools.E_ERROR);
            return;
        } 
        
        env = cfg.env;
        env.setLocation(cfg.location);          
        env.setFav(handler);
    }
    
    this.exec = function() {
    
        if (!env) {
            log('empty environment attribute or profile name', KellyTools.E_ERROR);
            return;
        }
            
        var action = env.getInitAction ? env.getInitAction() : 'main';            
        if (action == 'ignore') return;
        
        if (isMediaResource() || window.location !== window.parent.location) { // iframe or media
            
            log(KellyTools.getProgName() + ' load as media item helper | profile ' + env.profile);
            
        } else {
            
            if (action == 'main') {
         
                handler.load(false, function() {                    
                    if (env.getPosts()) {
                        handler.initFormatPage();
                    } else {
                        KellyTools.addEventPListener(window, "load", handler.initFormatPage, 'init_');
                    }
                }); 
                
            } 
            
            log(KellyTools.getProgName() + ' init | loaded in ' + action + ' mode | profile ' + env.profile + ' | DEBUG ' + (KellyTools.DEBUG ? 'enabled' : 'disabled'));           
        }
        
        KellyTools.addEventPListener(window, "message", getDocumentMessage, 'input_message_');             
    }
    
    function setPreventClose(active) {
          
        KellyTools.injectAddition('dispetcher', function() {  
        
            window.postMessage({kelly_dynaminc : true, method : 'kelly_dynaminc.' + (active ? 'bind' : 'unbind') + '.beforeunload'}, "*"); 
            
        });
    }
    
    function isMediaResource() {
        
        var ext = KellyTools.getUrlExt(selfUrl);        
        var media = ['jpg', 'jpeg', 'png', 'gif', 'webm', 'mp4', 'webp'];
        
        if (media.indexOf(ext) == -1) return false;
        
        window.parent.postMessage({filename : KellyTools.getUrlFileName(selfUrl, false, true), method : 'mediaReady'}, "*");
        return true;
    }
    
    function getApiMessage(request, sender, callback) {

        var response = {
            method : request.method,
        }
        
        if (request.method == "onUpdateStorage") {       
                
            if (callback) callback(response); 			
            
            // todo - пока только на обновление списка изображений - 
            // обновление конфига тригирится в некоторых случаях без изменения - если реализовывать - нужно добавлять проверку
            if (!request.isCfg && fav.coptions.storage == request.dbOrigName) { 
                handler.showUpdateStorageDialog(request);
            }
            
        }            
    }
        
    this.showUpdateStorageDialog = function(data, onCancel, onReload) {
        
        handler.showSidebarMessage(false);
        clearSidebarLoadEvents();
        
        // + data.isCfg ? '_cfg' : '' - обновляем сразу и только элементы, без настроек
        
        var html = '<p>' + lng.s('Данные избранного были обновлены с другой вкладки. Перезагрузить список избранных элементов для текущей страницы? ', 'storage_deprecated') + '</p>';
            html += '<p class="' + env.className + '-ModalBox-controll-buttons"><a href="#" class="' + env.className + 'Reload">' + lng.s('Перезагрузить', 'reload')  +  '</a>';
            html += '<a href="#" class="' + env.className + 'Cancel">' + lng.s('Отменить', 'cancel')  +  '</a></p>';   
            
        KellyTools.setHTMLData(modalBoxContent, '<div class="' +  env.className + '-updateStorageDialog">' + html + '</div>');
        
        var updateReloadButton = KellyTools.getElementByClass(modalBoxContent, env.className + 'Reload');
        var updateDialog = KellyTools.getElementByClass(modalBoxContent, env.className + '-updateStorageDialog');
     
        updateReloadButton.onclick = function() {
            
            handler.load('items', function(){
                
                handler.updateFavCounter();
                
                if (mode == 'fav') {
                    handler.hideFavoritesBlock();
                }                     
                
                handler.formatPostContainers();
                
                //  handler.showFavouriteImages();               
                
            }); 
            
            if (onReload) {
                onReload();
            } else {
                handler.closeSidebar();  
            } 
            
            return false; 
        }
         
        var onCancelCommon = function() {

            if (onCancel) {
                onCancel();
            } else {
                handler.closeSidebar();  
            } 
            
            return false; 
        }
        
        KellyTools.getElementByClass(modalBoxContent, env.className + 'Cancel').onclick = onCancelCommon;
        
        
        handler.showSidebar(false, onCancelCommon);
        onSideBarUpdate();
        return false;
    }
    
    function getDocumentMessage(e) {
        
        if (!e.data || !e.data.method) return false;

        // get self as blob
        
        if (e.data.method.indexOf('getMedia') != -1) {

            var xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';
                xhr.onload = function(e) {
                    
                    if (this.status == 200) {  

                        KellyTools.blobToBase64(this.response, function(base64) {
                            var output = { filename : KellyTools.getUrlFileName(selfUrl, false, true),  method : 'sendResourceMedia', error : false, base64 : base64 };
                            window.parent.postMessage(output, "*");     
                        });
                                       
                    } else {
                             
                        var output = {filename : KellyTools.getUrlFileName(selfUrl, false, true), method : 'sendResourceMedia', error : 'bad response status ' + this.status, base64 : false};
                        window.parent.postMessage(output, "*"); 
                    }
                };

                xhr.onerror = function(e) {
                    
                    var output = {filename : KellyTools.getUrlFileName(selfUrl, false, true), method : 'sendResourceMedia', error : 'url load fail', base64 : false};
                    window.parent.postMessage(output, "*");
                };

                xhr.open('get', selfUrl, true);
                xhr.send();  

        // get self body
        
        } else if (e.data.method.indexOf('getBody') != -1) {

            var output = {url : selfUrl, method : 'sendResourceBody', body : document.getElementsByTagName('body')[0].innerHTML};
            window.parent.postMessage(output, "*");
        } 
    }
    
    this.getFastSave = function() {
        if (!fastSave) {
            
            fastSave = new KellyFastSave();
            fastSave.favEnv = handler;
        }
        
        return fastSave;
    }    
    
    this.getImageGrid = function() {
        
        if (imageGrid) return imageGrid;
        
        imageGrid = new KellyTileGrid({
        
            tilesBlock : imagesBlock,
            rowHeight : 250,
            tileClass : env.className + '-FavItem',
            hideUnfited : false,
            
            rules : {
                fixed : 2,
                tmpBounds : { width : 200, height : 200},
                recheckAlways : true,
                heightDiffLast : 30,
                unfitedExtendMin : 2,
                collectLast : 2,
            },
            
            events : {
                // isBoundsLoaded : function(tile, tileMainEl) { return false },
                getBoundElement : function(self, tile) {
                
                    var el = tile.getElementsByClassName(env.className + '-preview');                    
                    if (el && el.length) return el[0];
                    return false;
                    
                },
                
                onBadBounds : function(self, data) {
                    
                    log('onBadBounds - error : ' + data.error); log(data.tile);
                    
                    // картинка была удалена с сервера \ ошибка загрузки \ нарушены пропорции
                    
                    if (data.errorCode == 2 || data.errorCode == 3 || data.errorCode == 4) {
                        
                        var altBounds = {width : 200, height : 200}, inheritBounds = false;
                        
                        if ((data.errorCode == 4 && fav.coptions.grid.type == 'fixed' && fav.coptions.grid.fixed == 1) || // oversized - keep original size if show 1 el per row
                             data.errorCode == 2 // load fail | todo - maybe add reload attempt (503 error gone away after few seconds)
                         ) inheritBounds = true;
                        
                        if (inheritBounds && data.boundEl.getAttribute('data-width')) {
                            altBounds.width = data.boundEl.getAttribute('data-width');
                            altBounds.height = data.boundEl.getAttribute('data-height'); // события onload \ onerror сохраняются                            
                        }
                        
                        data.boundEl.setAttribute('data-width', altBounds.width);
                        data.boundEl.setAttribute('data-height', altBounds.height);
                        data.boundEl.style.display = 'inline-block';
                        
                        return altBounds;
                        
                    } else {
                        
                        if (data.tile) data.tile.style.display = 'none';
                        return false;
                    }
                },
                
                getResizableElement : function(self, tile) {
                    return tile;
                },
                
                onGridUpdated : function(self, isAllBoundsLoaded) {
                    
                    if (isAllBoundsLoaded) imageEvents.saveImageProportions();
                },
                
                // для одного из элементов сетки загружены пропорции
                
                onLoadBounds : function(self, boundEl, state) {
                    
                    // check proportions of bound element and if its changed - update tile grid after
                    
                    return imageEvents.onLoadFavGalleryImage(boundEl, state == 'error' ? true : false);
                },
                
                onResizeImage : function(self, itemInfo) {
                
                    if (!itemInfo.tile) return;
                    
                    // hide buttons for small image blocks
                    
                    if (itemInfo.width < 140) {
                        var showPostBtn = KellyTools.getElementByClass(itemInfo.tile, env.className + '-FavItem-overlay-button');
                        if (showPostBtn) showPostBtn.style.display = 'none';
                    } 
                    
                    var checkDiff = function(maxWidth, width) { 
                        return (maxWidth - width) / (maxWidth / 100); // retrun difference in percent
                    }
                    
                    if ((itemInfo.width > itemInfo.origWidth && checkDiff(itemInfo.width, itemInfo.origWidth) > 25) || 
                        (itemInfo.height > itemInfo.origHeight && checkDiff(itemInfo.height, itemInfo.origHeight) > 25)) {
                            
                        // addition class for extramly small images that cant fit to current resized grid    
                        itemInfo.boundEl.classList.add(env.className + '-preview-small');

                        if (fav.coptions.grid.type == 'fixed' && fav.coptions.grid.fixed == 1) {
                            itemInfo.image.style.height = (itemInfo.origHeight > 120 ? itemInfo.origHeight : 120) + 'px';
                            itemInfo.image.style.width = itemInfo.width + 'px';
                            itemInfo.image.style.float = 'left';                            
                            return true;
                        }
                    }
                    
                    return false;
                },
                
                onResize : function(self) {
                    if (mode != 'fav') return true; // exit
                },
                
            },
            
        });
        
        if (KellyTools.getBrowserName() == 'firefox') {
            // firefox lose original width \ height if set src before onload
            imageGrid.useBlankSrc = true;
        }
        
        return imageGrid;
    }
    
    this.updateFavCounter = function() {
    
        if (!favCounter) return;        
        var itemsLengthClass = env.className + '-FavItemsCount';
        
        if (fav.items.length < 10) {
            itemsLengthClass += '-1';
        } else if (fav.items.length < 100) {
            itemsLengthClass += '-10';
        } else if (fav.items.length < 1000) {
            itemsLengthClass += '-100';
        } else {
            itemsLengthClass += '-1000';
        }
        
        favCounter.className = env.className + '-FavItemsCount ' + env.className + '-bgcolor-dynamic ' + itemsLengthClass;        
        favCounter.innerText = fav.items.length;
    }
    
    this.getStorageManager = function() {
        if (!storageManager) {
        
            storageManager = new KellyFavStorageManager();
            storageManager.fav = handler;
            
            storageManager.className = env.className;
            
            storageManager.prefix += env.profile + '_';      
            storageManager.prefixCfg += env.profile + '_';             
        }
        
        return storageManager;
    }
    
    this.getDownloadManager = function() {
        
        if (!downloadManager) {
            
            downloadManager = new KellyGrabber({
                className : env.className + '-downloader',
                imageClassName : env.className + '-FavItem',
                fav : handler,
                driver : fav.coptions.grabberDriver,
                // baseFolder
            });
        }
          
        return downloadManager;
    }
    
    this.getTooltip = function() {

        if (!tooltip) {
           
            tooltip = new KellyTooltip({
            
                classGroup : env.className + '-tooltipster', 
                selfClass : env.hostClass + ' ' + env.className + '-Default-tooltipster',
                closeButton : false,
                
                events : { 
                
                    onMouseOut : function(self, e) {
                        
                        if (handler.tooltipBeasy) return false;
                        
                        var related = e.toElement || e.relatedTarget;
                        if (self.isChild(related)) return;
                        
                        self.show(false);
                    },
                    
                    onClose : function(self) {
                        
                        // reset to defaults
                        
                        self.updateCfg({closeButton : false});
                        
                        if (handler.tooltipBeasy) {
                            setTimeout(function() {
                                handler.tooltipBeasy = false;
                            }, 500);
                        }
                        
                        self.getContent().onclick = function() {
                            // default
                        }
                    },
                
                }, 
                
            });
            
            tooltip.resetToDefaultOptions = function() {
                    
                tooltip.updateCfg({
                    closeButton : true,
                    target : 'screen', 
                    offset : {left : 40, top : -40}, 
                    positionY : 'bottom',
                    positionX : 'left',				
                    ptypeX : 'inside',
                    ptypeY : 'inside',
                });
            }
        } 
        
        return tooltip;
    }
    
    function log(info, errorLevel) {
        KellyTools.log(info, 'KellyFavItems', errorLevel);     
    }
        
    // загрузить настройки и локальное избранное    
    // локальное хранилище, структура данных поумолчанию
    /*
        var fav = {       
            items : [], 
            
            selected_cats_ids : [], // последние выбраные категории при добавлении изображения через диалоговое окно (categoryExclude, validateCategories, getCategoryBy)
            categories : [
                {id : 1, name : 'GIF', protect : true},
                {id : 2, name : 'NSFW', nsfw : true, protect : true},
            ],  // категории элементов
                               
            ids : 100, // счетчик уникальных идентификаторов
            
            coptions : {}
        };
    */
    
    this.load = function(type, onAfterload) {
                
        var onLoadItems = function(itemsDb) {
            
            if (!itemsDb) {
                itemsDb = sm.getDefaultData(); 
                log('load() ' + fav.coptions.storage + ' db not exist, default used');                
            }
            
            for (var k in itemsDb){
                if (typeof itemsDb[k] !== 'function') {
                    
                    fav[k] = itemsDb[k];
                }
            }
            
            page = 1;
            fav.selected_cats_ids = sm.validateCategories(fav.selected_cats_ids, fav);
            sm.validateDBItems(fav);
            
            fav.cats_assoc_buffer = false;
            
            if ((type == 'items' || !type) && onAfterload) onAfterload(); 
        }

        var onLoadConfig = function (config) {
            
            if (config) { 
                for (var k in config){
                    if (typeof config[k] !== 'function') {                        
                        fav[k] = config[k];
                    }
                }
            } else log('load() bad or empty config ' + sm.prefixCfg + 'config, default used');
                        
            sm.validateCfg(fav);            
           
            if (fav.coptions.debug) {
                KellyTools.DEBUG = true;                
                log('debug mode overloaded by user config');
            }
           
            sm.driver = fav.coptions.storageDriver;           
        
            if (!type) {
                sm.loadDB(fav.coptions.storage, onLoadItems);
            } else {
            
                if (onAfterload) onAfterload();
            }
        }
        
        var sm = handler.getStorageManager();
        
        if (!type || type == 'cfg') {
            sm.loadDB('config', onLoadConfig, true);            
        } else if (type == 'items') {
            sm.loadDB(fav.coptions.storage, onLoadItems);   
        }
    }
            
    this.save = function(type, onSave) {
    
        log('save() ' + type);
        var notSaved = (!type) ? 2 : 1 ; // save items data + config by default
        
        if (!type || type == 'items') {
        
            handler.getStorageManager().saveDB(fav.coptions.storage, { 
                categories : fav.categories, 
                items : fav.items,  
                ids : fav.ids, 
            }, function(error) {
                  log('save() save data to storage ' + (error ? error : 'OK'));
                  notSaved--;
                  if (!notSaved && onSave) onSave(error);
            });
        }
        
        if (!type || type == 'cfg') {
        
            handler.getStorageManager().saveDB('config', { 
                selected_cats_ids : fav.selected_cats_ids, 
                coptions : fav.coptions
            }, function(error) {
                 log('save() save cfg to storage ' + (error ? error : 'OK'));
                 notSaved--;
                 if (!notSaved && onSave) onSave(error);
            }, true);
        }
    }
    
    this.getFavPageListCount = function() {
       
        if (!displayedItems || !displayedItems.length) return 0;
        
        return Math.ceil(displayedItems.length / fav.coptions.grid.perPage);
    }
    
    this.goToFavPage = function(newPage) {
        
        if (page == newPage) return false;
        if (handler.tooltipBeasy) return false;
        
        if (!imagesBlock) return false;
        
        var totalPages = handler.getFavPageListCount();
        if (!totalPages) return false;
                      
        imageEvents.saveImageProportions();     
           
        if (newPage == 'next') newPage = page+1;
        else if (newPage == 'previuse' || newPage == 'prev' ) newPage = page-1;
        else {
            newPage = parseInt(newPage);
        }
        
        if (newPage < 1) newPage = 1;
                        
        if (newPage > totalPages) {
            newPage = totalPages;
        }
        
        if (newPage == page) {
            return false;
        }
         
        handler.getTooltip().show(false);
         
        if (env.events.onBeforeGoToFavPage && env.events.onBeforeGoToFavPage(newPage)) {
            return false;
        }
        
        page = newPage;
        
        handler.showSidebarMessage(false);
        
        handler.updateImagesBlock();
        handler.updateImageGrid();
                
        return true;
    }
    
    // updates navigation block in order of current selection for mode = fav
    
    function updatePagination(container) {
        
        return KellyTools.showPagination({ 
            container : container, 
            curPage : page, 
            onGoTo : handler.goToFavPage, 
            classPrefix : env.className + '-pagination',
            pageItemsNum : 4,
            itemsNum : displayedItems.length,
            perPage : fav.coptions.grid.perPage,
        });
    }

    this.addCss = function(text, remove) {

        var style = document.getElementById(env.className + '-mainCss');
        if (!style) {
            
            var head = document.head || document.getElementsByTagName('head')[0];
            var style = document.createElement('style');
                style.type = 'text/css';
                style.id = env.className + '-mainCss';
            
                head.appendChild(style);
        }
        
        if (remove) {
            style.innerHTML = '';
        }
        
        if (style.styleSheet){
          style.styleSheet.cssText = text;
        } else {
          style.appendChild(document.createTextNode(text));
        }
    }
    
    this.showItemInfo = function(item) {
    
        if (!item) return false;
    
        // console.log(item)
        
        var text = lng.s('Запись №__ITEMN__', 'item_number', {ITEMN : item.id}) + '<br>';
        
        if (item.name) {
            text += lng.s('Подпись : ', 'item_sign') + '<br>' + item.name + '<br>';
        }
        
        if (item.pw ) {
            text += item.pw + 'x' + item.ph;
            if (item.ps ) text += ' (' + lng.s('оригинал', 'source') + ')' + '<br>';
            else text += ' (' + lng.s('превью', 'preview') + ')' + '<br>';
        }
        
        text += '<div class="' + env.className + '-ItemTip-controll">';
        
        if (item.link) {
            text += '<a href="' + KellyTools.validateUrlForLocation(item.link, env.location) + '" target="_blank">' + lng.s('Показать пост', 'go_to_publication') + '</a>' + '<br>';
            
        }
        
        if (item.commentLink) {
            text += '<a href="' + KellyTools.validateUrlForLocation(item.commentLink, env.location) + '" target="_blank">' + lng.s('Показать комментарий', 'go_to_comment') + '</a>' + '<br>';
            
        }
        
        text += '</div>';
        
        if (typeof item.pImage != 'string' && item.pImage.length > 1) {
            text += lng.s('Изображений : __IMAGEN__', 'image_total', {IMAGEN : item.pImage.length}) + '<br>';
        }
    
        if (typeof item.pImage != 'string' && item.pImage.length > 1) {
            
            text += '<ul class="'+ env.className +'-ItemTip-images">';
            
            
                for (var i = 0; i < item.pImage.length; i++) {
                
                    var imgTitle = lng.s('Изображение __IMAGEN__', 'image', {IMAGEN : i});
                    if (i == 0) imgTitle = lng.s('Основное изображение', 'image_main');
                    
                    text += '<li><a href="' + env.getImageDownloadLink(item.pImage[i], true) + '" target="_blank">';
                    
                    text += '<img \
                             class="' + env.className + '-ItemTip-image" \
                             src="' + env.getStaticImage(env.getImageDownloadLink(item.pImage[i], false)) + '" \
                             alt="' + imgTitle + '" \
                             itemIndex="' + fav.items.indexOf(item) + '" \
                             kellyGallery="collection" \
                             kellyGalleryIndex="' + i + '" \
                            >';
                            
                    text += '</a></li>';
                }
                    
            text += '</ul>';
        
        } else {
                
            text += '<a href="' + env.getImageDownloadLink(item.pImage, true) + '" target="_blank">' + lng.s('Основное изображение', 'image_main') + '</a>' + '<br>';
        }
        
        return text;
    }
       
    // назначить событие отображения подсказки с информацией о изображении (используется в просмотрщике)
    // см. так же showItemInfoTooltip 
       
    function addImageInfoTip(el) {
        
        var item = false;
        
        var getCurrentViewedImage = function(state) {
            var image = false;
            
            if (state.imageData) {        
                if (typeof state.imageData.pImage != 'undefined') {
                    image = state.imageData;
                } else {
                    image = state.imageData[state.cursor];
                }
            }
            return image;
        }
        
        var showTooltip = function(el, e) {
        
            var state = imgViewer.getCurrentState();
            item = getCurrentViewedImage(state); 
            
            if (!item) return false;
        
            var message = document.createElement('div');
                
            KellyTools.setHTMLData(message, handler.showItemInfo(item));            
            handler.setShowCollectionEvent(message.getElementsByClassName(env.className + '-ItemTip-image'));
            
            return message;
        }
        
        var onShow = function(el, e, tooltip) {
            
            var state = imgViewer.getCurrentState();
            
            if (state.beasy || !state.shown || getCurrentViewedImage(state) != item) {
                tooltip.remove();
                imgViewer.tooltip = false;
            }
            
            if (imgViewer.tooltip) {
                imgViewer.tooltip.remove();
            }
            
            imgViewer.tooltip = tooltip;
            
            imgViewer.tooltip.updateCfg({events : { onClose : function(self) {
                KellyTools.stopMediaLoad(self.getContent());
            }}});
            
        }
        
        KellyTooltip.addTipToEl(el, showTooltip, {
            offset : {left : 0, top : 0}, 
            positionY : 'top',
            positionX : 'right',
            ptypeX : 'outside',
            ptypeY : 'inside',
            closeButton : false,
            selfClass : env.hostClass + ' ' + env.className + '-ItemTip-tooltipster',
            classGroup : env.className + '-tooltipster',
            removeOnClose : true,
        }, 100, onShow);    
    }
    
    function initWorktop() {
        
        if (env.events.onInitWorktop && env.events.onInitWorktop()) return true;    
        
        // todo modal mode for fit to ANY site, or overloading by profilejs
                
        handler.getImageGrid(); 
        
        var envContainers = env.getMainContainers();
        var modalClass = env.className + '-ModalBox';
        
        sideBarWrap = document.createElement('div');
        sideBarWrap.id = env.className + '-sidebar-wrap';
        sideBarWrap.className = env.className + '-sidebar-wrap ' + env.className + '-sidebar-wrap-hidden ' + env.hostClass; 
        
        var modalBoxHTML  = '<div class="' + modalClass + ' ' + modalClass +'-main">';
            modalBoxHTML += '<div class="' + modalClass + '-header">\
                                <a href="#" class="' + modalClass + '-hide-preview hidden" ></a>\
                                <a href="#" class="' + modalClass + '-close">' + lng.s('Закрыть', 'close') + '</a>\
                            </div>';
            modalBoxHTML += '<div class="' + modalClass + '-content">';
                                
            modalBoxHTML += '</div><div class="' + modalClass + '-message"></div>';
            modalBoxHTML += '</div>';
                
        var imgViewClass = env.className + '-ImgView';
        
        var imgView = document.createElement('div');
            imgView.className = imgViewClass;
            
            KellyTools.setHTMLData(imgView, '<div class="' + imgViewClass + '-loader ' + imgViewClass + '-loader-hidden"></div><div class="' + imgViewClass + '-img" ></div>');
            
            imgViewer = new KellyImgView({
                className : env.className + '-ImgView', 
                viewerBlock : imgView, 
                lazyHand : true,
                zoomByMouse : true,
                lockMoveMethod : ['edge', 'ie'].indexOf(KellyTools.getBrowserName()) != -1 ? 'hideScroll' : 'lockMove',
                userEvents : {
                    
                    onClose : function() {
                        if (imgViewer.tooltip) {
                            imgViewer.tooltip.remove();
                            imgViewer.tooltip = false;
                        }
                    },
                    
                    onNextImage : function(self, nextImage, action) {
                        
                        if (imgViewer.tooltip) {
                            imgViewer.tooltip.remove();
                            imgViewer.tooltip = false;
                        }
                    },
                    
                    onShow : function(self, show) {
                        if (handler.getTooltip().isShown()) {
                            handler.getTooltip().show(false);
                            handler.tooltipBeasy = false;
                        }
                    },
                    
                    onImageLoadFail : function(self) {
                        
                        self.cancelLoad();
                        
                        handler.getTooltip().resetToDefaultOptions();                        
                        handler.getTooltip().setMessage(lng.s('Не удалось загрузить изображение', 'image_fail'));                        
                        handler.getTooltip().show(true);
                        
                    }
                },
            });
            
        var downloaderHTML = '\
            <div class="' + modalClass + ' ' + modalClass + '-downloader hidden">\
                <div class="' + modalClass + '-content"></div>\
            </div>\
        ';
        
        var collapseButtonHTML = '<div class="' + env.className + '-sidebar-collapse">' + lng.s('Свернуть', 'collapse') + '</div>';
        
        KellyTools.setHTMLData(sideBarWrap, modalBoxHTML + downloaderHTML + collapseButtonHTML);
            
        modalBox = KellyTools.getElementByClass(sideBarWrap, modalClass + '-main');
        modalBoxContent = KellyTools.getElementByClass(modalBox, modalClass + '-content');
        modalBoxMessage = KellyTools.getElementByClass(modalBox, modalClass + '-message');
        
        downloaderBox = {
            modal : KellyTools.getElementByClass(sideBarWrap, modalClass + '-downloader'),
        }; 
        
        var collapseButton = KellyTools.getElementByClass(sideBarWrap, env.className + '-sidebar-collapse'); // compatibility button, shows only if needed by profile
            collapseButton.onclick = function() {
                var collapsed = this.getAttribute('data-collapsed');
                this.setAttribute('data-collapsed', collapsed ? '' : '1');
                
                var modalBoxes = sideBarWrap.getElementsByClassName(env.className + '-ModalBox');
                for (var i = 0; i < modalBoxes.length; i++) {
                    if (collapsed) {
                        KellyTools.classList('remove', modalBoxes[i], env.className + '-hidden');
                    } else {
                        KellyTools.classList('add', modalBoxes[i], env.className + '-hidden');
                    }
                }
            }
            
        downloaderBox.content = KellyTools.getElementByClass(downloaderBox.modal, modalClass + '-content');
        
        envContainers.sideBar.appendChild(sideBarWrap);
        envContainers.body.appendChild(imgView);
        
        imgViewer.addBaseButtons();
        
        var tip = imgViewer.addButton('?', 'info', function() { });
        addImageInfoTip(tip);
        
        
        // add fav button on top
        
        var counterHtml = '<div class="'+ env.className + '-FavItemsCount ' + env.className + '-bgcolor-dynamic"></div>';
        var iconHtml = '';
        
        if (fav.coptions.icon) {
            iconHtml = '<div class="' + env.className + '-icon ' + env.className + '-buttoncolor-dynamic" style="' + fav.coptions.icon + '"></div>';
        } else {            
            iconHtml = '<div class="' + env.className + '-icon ' + env.className + '-icon-diskete ' + env.className + '-buttoncolor-dynamic"></div>';
        }
        
        var favButton = createMainMenuButton(iconHtml + counterHtml, function() { 
                
                if (!checkSafeUpdateData()) return false;
                
                if (mode == 'fav') {
                    handler.hideFavoritesBlock();
                } else {                    
                    handler.showFavouriteImages();
                }
         
                return false; 
        }, 'fav');

        
        if (favButton) {
            menuButtons['fav'] = favButton;
            favCounter = favButton.getElementsByClassName(env.className  + '-FavItemsCount')[0];
            // if (handler.isMainDomain())
            handler.updateFavCounter();
        }
                
        var optionsButton = createMainMenuButton(lng.s('Настройки', 'options'), function() { 
                            
            if (!checkSafeUpdateData()) return false;
            
            if (mode == 'ctoptions') {
                handler.hideFavoritesBlock();
            } else {                    
                handler.showOptionsDialog();
            }
            
            return false; 
        
        }, 'options');
        
        if (optionsButton) {
            menuButtons['ctoptions'] = optionsButton;
        }
        
        if (fav.coptions.optionsSide) optionsButton.style.display = 'none';
        
        // add fav container
        
        siteContent = envContainers.siteContent; 
        favContent = envContainers.favContent; 
        
        return true;
    }
             
    // todo move method to profile
    
    function createMainMenuButton(name, onclick, index) {
        
        var submenu = env.getMainContainers().menu;
        
        if (!submenu) {
            log('bad submenu identifer');
            return false;
        }
        
        // old reactor
        var menuButtonTest = KellyTools.getElementByTag(submenu, 'a');
        if (menuButtonTest && menuButtonTest.getAttribute('rel') == 'v:url') {
            submenu = menuButtonTest.parentNode.parentNode;
        }
        
        // fix css issues
        var menuBrTest = KellyTools.getElementByTag(submenu, 'br');
        if (menuBrTest) menuBrTest.style.display = 'none';
        
        var menuButtonContainer = document.createElement('div');
            menuButtonContainer.className = 'submenuitem ' + env.hostClass + ' ' + env.className + '-MainMenuItem ' + env.className + '-ahover-dynamic' ;
            if (index) {
                menuButtonContainer.className += ' ' + env.className + '-MainMenuItem-' + index;
            }
            
        KellyTools.setHTMLData(menuButtonContainer, '<a href="#">' + name + '</a>');
        
        var menuButtonA = KellyTools.getElementByTag(menuButtonContainer, 'a');
        
        if (menuButtonA) {          
            menuButtonA.onclick = onclick;
            
            submenu.appendChild(menuButtonContainer);
            
        } else {
            log('main menu button not exist');
            return false;
        }
        
        return menuButtonContainer;
    }     
    
    // exit from Favourites plugin block
    
    this.hideFavoritesBlock = function() {
    
        siteContent.style.display = 'block';
        favContent.style.display = 'none';
        
        KellyTools.removeEventPListener(window, 'scroll', 'fav_scroll');

        imageGrid.close();
        
        for (var k in menuButtons){
            KellyTools.classList('remove', menuButtons[k], 'active');
        }

        handler.closeSidebar();
        mode = 'main';
        
        if (downloaderBox) {
            downloaderBox.modal.className = downloaderBox.modal.className.replace('active', 'hidden');
            
            imagesAsDownloadItems = false;
            handler.sideBarLock = false;
        }
    }
    
    // вывести контент расширения и назначить режим отображения
    
    function displayFavouritesBlock(newMode) {
        
        siteContent.style.display = 'none';
        favContent.style.display = 'block';
                
        if (!newMode) mode = 'fav';
        else mode = newMode;
        
        for (var k in menuButtons){
            KellyTools.classList('remove', menuButtons[k], 'active');           
        }
        
        if (typeof menuButtons[mode] != 'undefined') {
            KellyTools.classList('add', menuButtons[mode], 'active');
        }
    }
    
    this.updateImageGrid = function() {
        
        imageGrid.updateConfig({tilesBlock : imagesBlock});
        imageGrid.updateTileGrid();
        
        return;        
    }
    
    this.showOptionsDialog = function(tabActive) {
        
        if (!optionsManager) {
            optionsManager = new KellyOptions();
            optionsManager.favEnv = handler;
            optionsManager.wrap = favContent;
        }
        
        optionsManager.showOptionsDialog(tabActive);
        
        displayFavouritesBlock('ctoptions');
    }
    
    this.addExtendCats = function(itemIndex, remove) {
        
        if (!fav.categories[itemIndex]) return false;
        
        var category = fav.categories[itemIndex];        
        if (category.id == -1) return false;
        
        var catIndex = extendCats.indexOf(category.id);
        if (catIndex != -1 && !remove) return false;
        if (catIndex == -1 && remove) return false;
        
        if (remove) extendCats.splice(catIndex, 1);
        else {
            extendCats[extendCats.length] = category.id;
        }

        var tag = document.getElementById(env.className + '-extend-filter-' + category.id);
        if (tag) {
            tag.className = tag.className.replace('includable', '');    
            if (!remove) tag.className += ' includable';
            tag.className = tag.className.trim();
        }
        
        return true;
    }
    
    // update categories list element for specifed post. Currently used in edit mode (readonly = false)
    
    function updatePostCatList(index, list) {

        if (!list) return;
        list.innerHTML = '';
        
        if (fav.items[index].categoryId) {        
            for (var b = 0; b < fav.items[index].categoryId.length; b++) {
                
                var catLiItem = document.createElement('li');
                var category = handler.getStorageManager().getCategoryById(fav, fav.items[index].categoryId[b]);
                
                var spanName = document.createElement('span');
                    spanName.innerText = category.name;                
                
                var removeBtn = document.createElement('a');
                    removeBtn.innerText = lng.s('Удалить', 'delete');
                    removeBtn.href = '#';
                    removeBtn.setAttribute('itemIndex', index);
                    removeBtn.setAttribute('catId', category.id);                    
                    removeBtn.onclick = function() {                        
                        handler.removeCatFromPost(parseInt(this.getAttribute('itemIndex')), parseInt(this.getAttribute('catId')));                        
                        return false;
                    }
                    
                catLiItem.appendChild(spanName); 
                catLiItem.appendChild(removeBtn);                
                list.appendChild(catLiItem);                
            }
        }
    }
    
    this.removeCatFromPost = function(postIndex, catId) {
        
        if (!fav.items[postIndex]) return false;
        
        var index = fav.items[postIndex].categoryId.indexOf(catId);
        if (index != -1) fav.items[postIndex].categoryId.splice(index, 1);
        
        fav.items[postIndex].categoryId = handler.getStorageManager().validateCategories(fav.items[postIndex].categoryId, fav);
        updatePostCatList(postIndex, document.getElementById(env.className + '-cat-list-post' + postIndex));        
        handler.save('items');
    } 
    
    this.addCatsForPost = function(index) {
        
        if (!extendCats.length || !fav.items[index]) return false;
        
        for (var i = 0; i < extendCats.length; i++) if (fav.items[index].categoryId.indexOf(extendCats[i]) == -1) fav.items[index].categoryId.push(parseInt(extendCats[i]));

        fav.items[index].categoryId = handler.getStorageManager().validateCategories(fav.items[index].categoryId, fav);
        updatePostCatList(index, document.getElementById(env.className + '-cat-list-post' + index));        
        handler.save('items');
    } 
    
    this.toogleFilter = function(el) {
        
        if (!el) return;
        var filterId = parseInt(el.getAttribute('filterId'));
        
        var filter = handler.getStorageManager().getCategoryById(fav, filterId);
        if (filter.id == -1) return false;
        
        page = 1;
        
        if (el.className.indexOf('active') !== -1) {
            el.className = el.className.replace('active', '');
            el.className = el.className.replace('activeIgnore', '');
            
            var index = catFilters.indexOf(filter.id);
            if (index != -1) catFilters.splice(index, 1);
            index = catIgnoreFilters.indexOf(filter.id); 
            if (index != -1) catIgnoreFilters.splice(index, 1);
            
        } else {
            el.className += ' active';
            if (!catFilterNot) {
                catFilters[catFilters.length] = filter.id;
            } else {
                el.className += ' activeIgnore';
                catIgnoreFilters[catIgnoreFilters.length] = filter.id;
            }
        }
    }
    
    // get main image - cover for saved publication
    
    function getCoverImageByItem(item, full) {
        if (!item || !item.pImage) return '';        
        
        if (typeof item.pImage == 'string') {
            if (item.pImage.trim() !== '') return env.getImageDownloadLink(item.pImage, full);            
        } else {
            if (item.pImage.length) return env.getImageDownloadLink(item.pImage[0], full);
        }
        
        return '';
    }
    
    // отобразить мини-окно редактирования элемента избранного (редактор категорий \ удаление)
    // см. так же addImageInfoTip
    
    function showItemInfoTooltip(index, target) {
    
        index = parseInt(index);      
        if (!fav.items[index]) return;
        
        var tooltipEl = handler.getTooltip();
            tooltipEl.updateCfg({
                target : target, 
                offset : {left : 0, top : 0}, 
                positionY : 'bottom',
                positionX : 'left',                
                ptypeX : 'inside',
                ptypeY : 'outside',
                avoidOutOfBounds : false,
            });
            
        var item = fav.items[index];
        
        var baseClass = env.className + '-tooltipster-ItemInfo';
        
        // блок дополнительной информации о публикации со списком категорий
        var itemInfo = document.createElement('div');
            itemInfo.className = baseClass;
            itemInfo.id = baseClass + '-' + index;
            itemInfo.innerHTML = ''; 
            
            if (item.commentLink) {                
                KellyTools.setHTMLData(itemInfo, '<a href="' + item.commentLink + '" target="_blank">' + lng.s('Показать комментарий', 'go_to_comment') + '</a><br>');            
            }
            
        var removeItem = document.createElement('a');
            removeItem.setAttribute('itemIndex', index);        
            removeItem.onclick = function() { 
            
                var updateFavPage = function() { handler.showFavouriteImages(); };
                handler.showAddToFavDialog(parseInt(this.getAttribute('itemIndex')), updateFavPage, updateFavPage);
                
                return false; 
            }
            
            removeItem.innerText = lng.s('Изменить', 'edit');
            removeItem.href = '#';

        itemInfo.appendChild(removeItem);
         
        var addCats = document.createElement('a');
            addCats.href = '#';
            addCats.innerText = lng.s('Добавить отмеченые категории', 'add_selected_cats'); 
            addCats.setAttribute('itemIndex', index);
            addCats.onclick = function() {
                
                handler.addCatsForPost(parseInt(this.getAttribute('itemIndex')));                
                return false;
            }
            
        var priority = document.createElement('p');
            priority.className = baseClass + '-order-buttons';
            
        var priorityHtml = '\
            ' + lng.s('Приоритет', 'cat_order') + '\
                <a href="#" class="' + baseClass + '-neworder-up">&#9650;</a>\
                <a href="#" class="' + baseClass + '-neworder-down">&#9660;</a>\
                <a href="#" class="' + baseClass + '-neworder-accept">' + lng.s('Применить', 'change') + '</a>\
            ';
                
          
        KellyTools.setHTMLData(priority, priorityHtml); 
        
        var prioritySwitch = function(up) {
            
            var displayedPos = displayedItems.indexOf(index);
            
            if (displayedPos <= 0 && up) return false;
            if ((displayedPos == -1 || displayedPos == displayedItems.length - 1) && !up) return false;
            
            var switchWithIndex = up ? displayedItems[displayedPos - 1] : displayedItems[displayedPos + 1];
            
            if (!fav.items[index] || !fav.items[switchWithIndex]) return false;
            
            var tmp = fav.items[index];
            
            fav.items[index] = fav.items[switchWithIndex];
            fav.items[switchWithIndex] = tmp;
            
            index = switchWithIndex;
            
            handler.updateImagesBlock();
            handler.updateImageGrid();
            
            // var tooltipPos = {left : tooltipEl.self.style.left, top : tooltipEl.self.style.top};
            
            showItemInfoTooltip(index, false); //  target = env.className + '-FavItem-' + fav.items[index].id - не задаем чтобы не перемещать тултип
            
            handler.tooltipBeasy = true; 
            handler.getTooltip().updateCfg({closeButton : true});
            
            // handler.getTooltip().self.style.left = tooltipPos.left;
            // handler.getTooltip().self.style.top = tooltipPos.top;
            KellyTools.classList('add', KellyTools.getElementByClass(handler.getTooltip().self, baseClass + '-neworder-accept'), 'active');
            
        }       
                
        KellyTools.getElementByClass(priority, baseClass + '-neworder-up').onclick = function() {            
            prioritySwitch(true);   
            return false;
        };
        
        KellyTools.getElementByClass(priority, baseClass + '-neworder-down').onclick = function() {            
            prioritySwitch(false); 
            return false;           
        };
                
        KellyTools.getElementByClass(priority, baseClass + '-neworder-accept').onclick = function() {            
            KellyTools.classList('remove', this, 'active');
            handler.save('items');
            return false;           
        };
        
        itemInfo.appendChild(addCats);
        itemInfo.appendChild(priority);
        
        var catList = document.createElement('ul');
            catList.id = env.className + '-cat-list-post' + index;
            catList.className = baseClass + "-tags";
    
        updatePostCatList(index, catList);
            
        itemInfo.appendChild(catList);
        
        var container = tooltipEl.getContent();
            container.innerHTML = '';
        
        container.appendChild(itemInfo);
            
        tooltipEl.show(true);
    }
    
    function updateDisplayItemsList() {

        displayedItems = [];
        
        // applay filters 
        
        for (var i = fav.coptions.newFirst ? fav.items.length-1 : 0; fav.coptions.newFirst ? i >= 0 : i < fav.items.length; fav.coptions.newFirst ? i-- : i++) {
                                         
            if (excludeFavPosts && !fav.items[i].commentLink) continue;
            if (excludeFavComments && fav.items[i].commentLink) continue;            
            if (imagesAsDownloadItems && !getCoverImageByItem(fav.items[i])) continue;
            
            if (catIgnoreFilters && catIgnoreFilters.length) {
                var ignore = false;
                for (var b = 0; b < catIgnoreFilters.length; b++) {
                
                    if (fav.items[i].categoryId.indexOf(catIgnoreFilters[b]) !== -1) { 
                        ignore = true;
                        break;
                    }
                }
                
                if (ignore) continue;
            }
            
            if (catFilters && catFilters.length) {
            
                if (!fav.items[i].categoryId || !fav.items[i].categoryId.length) continue;
                
                var filterMatched = 0;
                
                for (var b = 0; b < catFilters.length; b++) {
                
                    if (fav.items[i].categoryId.indexOf(catFilters[b]) !== -1) { 
                    
                        filterMatched++; 
                        
                        if (logic == 'or') break;                     
                    }
                }

                if (logic == 'or' && !filterMatched) continue;
                if (logic == 'and' && filterMatched != catFilters.length) continue;
            }
            
            // output
            
            displayedItems[displayedItems.length] = i;
        
        }   
        
        galleryImages = [];
        galleryImagesData = [];
        
        for (var i = 0; i <= displayedItems.length-1; i++) {
        
            var item = fav.items[displayedItems[i]];
            var coverImage = getCoverImageByItem(item, fav.coptions.grid.viewerShowAs == 'hd' ? true : false);
            
            // whole gallery images array for current selector
            
            if (coverImage) {
            
                var galleryIndex = galleryImages.length;
                    // must be with same index - see kellyGalleryIndex=galleryImagesData. in showItem method
                    galleryImages[galleryIndex] = coverImage;
                    galleryImagesData[galleryIndex] = item;           
            }
        }
        
    }
    
    function updateGoToPageButton(gotoPage) {
        
        if (!gotoPage) gotoPage = KellyTools.getElementByClass(sideBarWrap, env.className + '-FavEditButton-page');
        
        if (!gotoPage) return;
        
        if (handler.getFavPageListCount() > 14) {
            KellyTools.classList('add', gotoPage, env.className + '-active'); 
        } else {
            KellyTools.classList('remove', gotoPage, env.className + '-active');
        }
    }
      
    function updateFilteredData() {

        if (!checkSafeUpdateData()) {
            return false;
        }
        
        displayedItems = false;
                
        updateDisplayItemsList();
        updateGoToPageButton();
        
        if (imagesAsDownloadItems) {
            
            handler.getDownloadManager().setDownloadTasks(displayedItems);
            handler.getDownloadManager().showGrabManager();
        }
        
        // init gallery only for current page
        // create gallery, by array
        imgViewer.addToGallery(galleryImages, 'fav-images', galleryImagesData);  
    }
    
    this.setShowCollectionEvent = function(buttons) {
        
        if (!buttons || !buttons.length) return;
        
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].onclick = function() {
            
                var item = fav.items[this.getAttribute('itemIndex')];
                var imageSet = [];
                
                for (var b = 0; b < item.pImage.length; b++) {
                    imageSet[imageSet.length] = env.getImageDownloadLink(item.pImage[b], fav.coptions.grid.viewerShowAs == 'hd' ? true : false);
                }
                
                imgViewer.addToGallery(imageSet, 'collection', item);
                imgViewer.loadImage(this);   
                
                return false;
            }
        }
    }
    
    function showItem(item, subItem) {
        
        if (!item) return false;
        
        if (typeof item.pImage !== 'string') {
            subItem = subItem <= item.pImage.length-1 ? subItem : 0;
        } else subItem = 0;
        
        var coverImage = getCoverImageByItem(item);
        
        var index = fav.items.indexOf(item);
           
        var itemBlock = document.createElement('div');
            itemBlock.className = env.className + '-FavItem ';            
            itemBlock.id = env.className + '-FavItem-' + item.id;
            
        if (subItem) {
            itemBlock.id += '-' + subItem;
            coverImage = env.getImageDownloadLink(item.pImage[subItem], false);
        }
                            
        var collectionBtn = false;
        var imageCount = 0;
                    
        itemBlock.setAttribute('itemIndex', index);
        
        // show as text 
        
        if (!coverImage) {
            
            var freeSpace = 250;
            
            var text = (!item.name && !item.text) ? '<div class="' + env.className + '-preview-text-noimage">' + lng.s('Без изображения', 'no_image') + '</div>' : '';
            
            if (item.name) {
                freeSpace -= item.name.length;
                text += '<div class="' + env.className + '-preview-text-name">' + item.name + '</div>';
            }
            
            if (freeSpace > 0 && item.text) {
                var ctext = item.text.length > freeSpace ? item.text.substring(0, freeSpace) + '...' : item.text;
                text += '<div class="' + env.className + '-preview-text-ctext">' + KellyTools.nlToBr(item.text) + '</div>';
            }
                                  
            var size = Math.ceil(text.length / 100) * 50;
            
            //itemBlock.setAttribute('data-width', size);
            
            var html = '\
                <div style="' + fav.coptions.grid.cssItem + '" class="' + env.className + '-preview" data-width="'+size+'" itemIndex="' + index + '">\
                    <div class="' + env.className + '-preview-text">' + text + '</div>\
                </div>\
            ';
            
            KellyTools.setHTMLData(itemBlock, html);
            
        } else {

        // show as image
        
            var pInfo = '';
            if (item.pw && !subItem) { // no proportions info for sub items currently
                pInfo = ' data-width="' + item.pw + '" data-height="' + item.ph + '" ';
            }                
            
            //if (item.pw) {
            //    itemBlock.setAttribute('data-width', item.pw);
            //    itemBlock.setAttribute('data-height', item.ph);
            //}
            
            imageCount = 1;
            
            if (typeof item.pImage !== 'string') imageCount = item.pImage.length;
            
            var additionAtributes = '';
            
            if (subItem) {
                additionAtributes += ' subItem="' + subItem + '" ';
            }
            
            // multi image list
            if (imageCount > 1) {
            
                additionAtributes += ' data-images="' + imageCount + '" ';
                
                // todo - button to explode collection ? create separate fav.items for pImage array items, keep link to index of main item
                
                collectionBtn = document.createElement('a');
                collectionBtn.innerText = imageCount;
                collectionBtn.href = item.pImage[0];
                collectionBtn.className = env.className + '-FavItem-collection';
                
                collectionBtn.setAttribute('kellyGallery', 'collection');
                collectionBtn.setAttribute('kellyGalleryIndex', 0);
                collectionBtn.setAttribute('itemIndex', index);
                
                handler.setShowCollectionEvent([collectionBtn]);
            }
                    
            if (!fav.coptions.animateGif || !item.pw) {
                coverImage = env.getStaticImage(coverImage);
            }
            
            var src = 'src="' + coverImage + '"';
            
            if (fav.coptions.grid.lazy) {
                src = ( imageGrid.useBlankSrc ? '' : 'src="' + imageGrid.gifBase64 ) + '" data-' + src;                
            }
            
            var html = '\
                <img style="' + fav.coptions.grid.cssItem + '" \
                     class="' + env.className + '-preview" \
                     kellyGalleryIndex="' + (galleryImagesData.indexOf(item) + subItem) + '" \
                     kellyGallery="fav-images" \
                     itemIndex="' + index + '"' + pInfo + additionAtributes + src + ' \
                >';
                            
            KellyTools.setHTMLData(itemBlock, html);       
        }
        
        if (!imagesAsDownloadItems) {
        
            var postLink = document.createElement('a');
                postLink.href = KellyTools.validateUrlForLocation( item.commentLink ? item.commentLink : item.link, env.location);
                postLink.className = env.className + '-FavItem-overlay-button';
                postLink.innerText = item.commentLink ? lng.s('Комментарий', 'comment') : lng.s('Публикация', 'publication'); 
                postLink.setAttribute('target', '_blank');
            
            var postHd = false;
            
            if (imageCount > 0 && fav.coptions.grid.viewerShowAs != 'hd') {
            
                postHd = document.createElement('a');
                postHd.href = '#';
                postHd.className = env.className + '-FavItem-overlay-button ' + env.className + '-FavItem-overlay-button-bottom';
                postHd.innerText = 'HD'; 
                
                
                if (imageCount > 1) {
                    postHd.innerText = 'HDs'; 
                }
                
                postHd.setAttribute('kellyGallery', 'hdsource');
                postHd.setAttribute('kellyGalleryIndex', 0);
                postHd.setAttribute('itemIndex', index);
                
                postHd.onclick = function() {
                    
                    var index = this.getAttribute('itemIndex');
                    
                    var imageSet = [];
                    
                    if (typeof fav.items[index].pImage != 'string') {
                        
                        for (var b = 0; b < fav.items[index].pImage.length; b++) {
                            
                            imageSet[imageSet.length] = env.getImageDownloadLink(fav.items[index].pImage[b], true);
                        }
                        
                    } else {
                        
                        imageSet[imageSet.length] = env.getImageDownloadLink(fav.items[index].pImage, true);
                    }
                    
                    imgViewer.addToGallery(imageSet, 'hdsource', fav.items[index]);
                    imgViewer.loadImage(this);   
                    
                    return false;
                }
            }            
            
            var itemBlockAdditions = document.createElement('DIV');
                itemBlockAdditions.className = env.className + '-FavItem-additions';
                
            if (collectionBtn) itemBlockAdditions.appendChild(collectionBtn);
            
            itemBlock.appendChild(itemBlockAdditions);        
            itemBlock.onmouseover = function(e) {                
                if (handler.tooltipBeasy) return false;
                if (readOnly) return false;
                
                var itemIndex = this.getAttribute('itemIndex');
                showItemInfoTooltip(this.getAttribute('itemIndex'), this);
            }  
                
            itemBlock.onmouseout = function(e) {    
                if (handler.tooltipBeasy) return false;
                if (readOnly) return false;
                
                var related = e.toElement || e.relatedTarget;
                if (handler.getTooltip().isChild(related)) return;
                    
                handler.getTooltip().show(false);
            }  
        
            itemBlock.appendChild(postLink);
            if (postHd) itemBlock.appendChild(postHd);
        }
        
        imagesBlock.appendChild(itemBlock);
    }
    
    this.updateImagesBlock = function() {
        
        if (!imagesBlock) return false;
        if (!fav.items.length) {
            imagesBlock.innerText = lng.s('Список избранных публикаций пуст', 'fav_list_empty');
            return false;
        }
        
        imageGrid.close(); // imageGrid.reset() - if some day will be mode without pagination 
                
        var startItem = (page - 1) * fav.coptions.grid.perPage;
        var end = startItem + fav.coptions.grid.perPage - 1;         
        if (end > displayedItems.length-1) end = displayedItems.length-1;
              
        log('show start : ' + startItem + ' | end : ' + end + ' | total : ' + displayedItems.length);
    
        for (var i = startItem; i <= end; i++) {
            showItem(fav.items[displayedItems[i]]);
        }
        
        if (imagesAsDownloadItems) {
            handler.getDownloadManager().updateStateForImageGrid(imagesBlock);
        }
        
        // connect events to current image elements
        var galleryEl = imagesBlock.getElementsByTagName('img');
        
        for (var i = 0, l = galleryEl.length; i < l; i++)  {
            galleryEl[i].onclick = function() {
                imgViewer.loadImage(this);
                return false;
            }
        }
        
        updatePagination(document.getElementById(env.className + '-pagination'));
     
        return true;
    }
    
    function showGoToPageTooltip(target) {
        
        var tooltipEl = handler.getTooltip();
            tooltipEl.updateCfg({
                target : target, 
                offset : {left : 0, top : 0}, 
                positionY : 'bottom',
                positionX : 'left',
                ptypeX : 'inside',                
                ptypeY : 'outside',
                avoidOutOfBounds : true,
                closeButton : false,
            });
        
        handler.tooltipBeasy = true; 
        
        var html = '\
            <div class="' + env.className + '-GoToPageForm">\
                <div>\
                    <p><input type="text" placeholder="' + lng.s('Перейти на страницу', 'goto') + '" value="" class="' + env.className + '-GoToPage"></p>\
                    <p><a href="#" class="' + env.className + '-Go">' + lng.s('Перейти', 'go') + '</a></p>\
                </div>\
            </div>';
        
        var container = tooltipEl.getContent();
        KellyTools.setHTMLData(container, html);
                
        KellyTools.getElementByClass(container, env.className + '-Go').onclick = function() { 
            
            var page = KellyTools.inputVal(env.className + '-GoToPage', 'int', container);
            var totalPages = handler.getFavPageListCount();
            
           
            if (page > totalPages) page = totalPages;
            if (page < 1) page = 1;
            
            handler.tooltipBeasy = false;
            tooltipEl.show(false);
            
            handler.goToFavPage(page);
            
            return false; 
        }
        
        tooltipEl.show(true, 'gotoFavPage');
    }  
    
    function showCategoryCreateTooltip(targetId) {
         
        var getTooltipTarget = function() {
            return document.getElementById(targetId);            
        }
        
        var tooltipEl = handler.getTooltip();
            tooltipEl.updateCfg({
                target : getTooltipTarget(), 
                offset : {left : 0, top : 0}, 
                positionY : 'bottom',
                positionX : 'left',
                ptypeX : 'inside',                
                ptypeY : 'outside',
                avoidOutOfBounds : true,
            });
        
        var html = '\
            <div class="' + env.className + 'CatAddForm">\
                <div>\
                    <p><input type="text" placeholder="' + lng.s('Название новой категории', 'cat_name') + '" value="" class="' + env.className + 'CatName"></p>\
                    <!--input type="text" placeholder="' + lng.s('Приоритет', 'cat_order') + '" value="" class="' + env.className + 'CatOrder"-->\
                    <p><a href="#" class="' + env.className + 'CatCreate">' + lng.s('Создать категорию', 'cat_create') + '</a></p>\
                </div>\
            </div>';
        
        var container = tooltipEl.getContent();
        KellyTools.setHTMLData(container, html);
        
        container.onclick = function() {
            handler.tooltipBeasy = true; 
            tooltipEl.updateCfg({closeButton : true});
        }
        
        KellyTools.getElementByClass(container, env.className + 'CatCreate').onclick = function () { 
            if (handler.categoryCreate(container)) {
                
                // handler.showFavouriteImages();
                showCatList();
                tooltipEl.updateCfg({target : getTooltipTarget()});
            }

            return false; 
        }
        
        tooltipEl.show(true, 'categoryCreate');
    }
    
    this.resetFilterSettings = function() {    
        page = 1;
        catFilters = [];
        catIgnoreFilters = [];
        extendCats = [];
    }
    
    function showCategoryControllTooltip(id, targetId) {
                
        var getTooltipTarget = function() {
            return document.getElementById(targetId);            
        }
        
        var category = handler.getStorageManager().getCategoryById(fav, id);                
        if (category.id == -1) return false;
        
        var tooltipEl = handler.getTooltip();
            tooltipEl.updateCfg({
                target : getTooltipTarget(), 
                offset : {left : 0, top : 0}, 
                positionY : 'bottom',
                positionX : 'left',
                ptypeX : 'inside',                
                ptypeY : 'outside',
                avoidOutOfBounds : true,
            });
        
        // Selected for add to publication in "Edit mode" (readonly = false)
        var filterChecked = '';
        if (extendCats.indexOf(category.id) != -1) {
            filterChecked = 'checked';
        }
        
        var isNSFWChecked = '';
        if (category.nsfw) isNSFWChecked = 'checked';
        
        // todo показывать кол-во элементов
        
        var baseClass = env.className + '-FiltersMenu';
        
        var deleteButtonHtml = '';
        if (!category.protect) {
            deleteButtonHtml += ' <a class="' + baseClass + '-delete-button" href="#">' + lng.s('Удалить', 'delete') + '</a>';
        }
        
        var itemIndex = fav.categories.indexOf(category);
        
        var html = '\
            <div class="' + baseClass + '-tooltip">\
                <label><input class="' + baseClass + '-check" type="checkbox" ' + filterChecked + '> ' + lng.s('Добавить к изображению', 'add_to_item') + '</label>\
                <label><input class="' + baseClass + '-nsfw" type="checkbox" ' + isNSFWChecked + '> NSFW </label>\
                <p><input class="' + baseClass + '-newname ' + baseClass + '-make-beasy" type="text" value="' + category.name + '" placeholder="' + lng.s('Новое название', 'new_name') + '"></p>\
                <p><input class="' + baseClass + '-associations ' + baseClass + '-make-beasy" type="text" value="' + (!category.assoc ? '' : category.assoc) + '" placeholder="' + lng.s('Ассоциации', 'associations_tags') + '"></p>\
                <p class="' + baseClass + '-order-buttons">' + lng.s('Приоритет', 'cat_order') + '\
                    <a href="#" class="' + env.className + '-neworder-up ' + baseClass + '-make-beasy">&#9650;</a>\
                    <a href="#" class="' + env.className + '-neworder-down ' + baseClass + '-make-beasy">&#9660;</a>\
                </p>\
                <!--input class="' + baseClass + '-neworder" type="text" value="' + (!category.order ? itemIndex : category.order) + '" placeholder="' + lng.s('Приоритет', 'cat_order') + '"-->\
                \
                <p><a class="' + baseClass + '-newname-button" href="#">' + lng.s('Применить', 'change') + '</a>\
                ' + deleteButtonHtml + '</p>\
            </div>';
        
        var container = tooltipEl.getContent();
            KellyTools.setHTMLData(container, html);
            
            container.onclick = function(e) {            
                if (e.target.className.indexOf('make-beasy') == -1) return;
                
                handler.tooltipBeasy = true; 
                tooltipEl.updateCfg({closeButton : true});
            }
        
        var flushCatButton = function() {            
            setTimeout(function() {
                var target = getTooltipTarget();
                if (target && target.className.indexOf('flush') == -1) {
                    target.className += ' flush';
                    setTimeout(function() {
                        target.className = target.className.replace('flush', '').trim();             
                    }, 300);
                } 
            }, 100);
        }
        
        var changeCatOrder = function(el, up) {
        
                itemIndex = handler.getStorageManager().categoryOrder(fav.categories, itemIndex, up);
                showCatList();
                flushCatButton();
                tooltipEl.updateCfg({target : getTooltipTarget()});
            }
        
        var orderChangeUp = KellyTools.getElementByClass(container, env.className + '-neworder-up');
            orderChangeUp.onclick = function() {
                changeCatOrder(this, true);
                return false;
            }
            
        var orderChangeDown = KellyTools.getElementByClass(container, env.className + '-neworder-down');
            orderChangeDown.onclick = function() {
                changeCatOrder(this, false);
                return false;
            }

        var renameButton = KellyTools.getElementByClass(container, baseClass + '-newname-button');
            renameButton.onclick = function () {
                
                var editCat = {
                
                    name : KellyTools.inputVal(baseClass + '-newname', 'string', container),
                    nsfw : KellyTools.getElementByClass(container, baseClass + '-nsfw').checked,
                    // order : parseInt(document.getElementById('kelly-filter-neworder-' + itemIndex).value),
                    assoc : KellyTools.getElementByClass(container, baseClass + '-associations').value,
                }
                
                var result = handler.categoryEdit(editCat, itemIndex);
                if (!result) return false;
                
                KellyTools.getElementByClass(container, baseClass + '-associations').value = category.assoc;
                
                showCatList();                
                flushCatButton();
                tooltipEl.updateCfg({target : getTooltipTarget()});
                
                // handler.showSidebarMessage('Изменения применены');
                return false;
            }

        if (!category.protect) {
            var deleteButton = KellyTools.getElementByClass(container, baseClass + '-delete-button');
                deleteButton.onclick = function () {
                
                    var updateFavPage = function() { 
                        
                        // after delete validated, test that, reset unnecessary
                        handler.resetFilterSettings();                        
                        handler.showFavouriteImages(); 
                    };
                    
                    handler.showRemoveCategoryDialog(itemIndex, updateFavPage, updateFavPage);
                    return false;
                }
        }
        
        var catExtender = KellyTools.getElementByClass(container, baseClass + '-check'); 
            catExtender.onclick = function() { 
                var remove = true;
                if (this.checked) remove = false;
                
                handler.addExtendCats(itemIndex, remove); 
            }
            
        tooltipEl.show(true, 'categoryEdit');
    }
    
    function showCatList(list) {
        
        if (!list) {
            list = KellyTools.getElementByClass(modalBoxContent, env.className + '-FiltersMenu');
        }
        
        if (!list) return false;
        
        list.innerHTML = '';
        
        handler.getStorageManager().sortCategories(fav.categories);
        
        for (var i = 0; i < fav.categories.length; i++) {
    
            var filter = document.createElement('li');
                filter.id = env.className + '-extend-filter-' + fav.categories[i].id;
                filter.setAttribute('itemId', fav.categories[i].id);
                   
                // Edit mode add to image check
                if (extendCats.indexOf(fav.categories[i].id) != -1) {
                    filter.className += ' includable';
                }
            
                filter.onmouseover = function (e) { 
                    if (handler.tooltipBeasy) return false;
                    if (readOnly) return false; 
                    showCategoryControllTooltip(this.getAttribute('itemId'), this.id);    
                }
                
                filter.onmouseout = function(e) {
                    if (handler.tooltipBeasy) return false;
                    if (readOnly) return false;
                    
                    var related = e.toElement || e.relatedTarget;
                    if (handler.getTooltip().isChild(related)) return;
                    
                    handler.getTooltip().show(false);
                }
                          
            // filter.onclick
            
            var catSelector = document.createElement('a');
                catSelector.innerText = fav.categories[i].name;
                catSelector.href = '#';
                catSelector.setAttribute('filterId', fav.categories[i].id);
                
                var catSelectorActive = '';    
                
                     if (catFilters.indexOf(fav.categories[i].id) != -1) catSelectorActive = 'active';
                else if (catIgnoreFilters.indexOf(fav.categories[i].id) != -1) catSelectorActive = 'activeIgnore';
                
                catSelector.className = catSelectorActive;
                catSelector.onclick = function() {
                
                    if (!checkSafeUpdateData()) return false;
                    handler.toogleFilter(this); 
                                        
                    updateFilteredData();
                    
                    handler.updateImagesBlock();
                    handler.updateImageGrid();
                    
                    return false;
                }
          
            
            filter.appendChild(catSelector);
            //filter.appendChild(catExtender);
            list.appendChild(filter);
                
        }
                
        var filterAdd = document.createElement('li');
            filterAdd.className = env.className + '-filters-CatCreate';
            filterAdd.id = env.className + '-filters-CatCreate';
            
            if (readOnly) filterAdd.style.display = 'none';
            
            KellyTools.setHTMLData(filterAdd, '<a href="#" onclick="return false;">+</a>');
            
            filterAdd.onmouseover = function (e) { 
                if (handler.tooltipBeasy) return false;
                showCategoryCreateTooltip(this.id);    
            }
            
            filterAdd.onmouseout = function(e) {
                if (handler.tooltipBeasy) return false;
                var related = e.toElement || e.relatedTarget;
                if (handler.getTooltip().isChild(related)) return;
                
                handler.getTooltip().show(false);
            }
        
            list.appendChild(filterAdd);    

        return true;
    }
    
    this.ignoreNSFW = function() {
                                
        for (var i = 0; i < fav.categories.length; i++) {
            if (fav.categories[i].nsfw) {
                if (catIgnoreFilters.indexOf(fav.categories[i].id) == -1) {
                    catIgnoreFilters[catIgnoreFilters.length] = fav.categories[i].id;
                }
                
                var catIndex = catFilters.indexOf(fav.categories[i].id);
                if (catIndex != -1) catFilters.splice(catIndex, 1);
            }
        }              
        
    }
    
    // check if we do something important before change mode  
    
    function checkSafeUpdateData() {
        
        if (handler.tooltipBeasy) {
            handler.tooltipBeasy = false;
        }
        
        handler.getTooltip().show(false);
            
        imageEvents.saveImageProportions();
        
        // todo save downloadManager config options by onConfigChanged event (currently event not exist, and config saved after click on Download button)
        
        // fav.coptions.grabber = self.getOptions();
        // handler.save('cfg');
        
        if (handler.getDownloadManager().getState() != 'wait') {
            handler.showSidebarMessage('Перед выполнением действия необходимо остановить загрузку данных');
            return false;
        } else {            
            
            handler.showSidebarMessage(false);            
        }
        
        return true;        
    }
                 
    // вывод всех изображений избранного \ обновление блока категорий
    // страницы сбрасываются только при смене фильтров
    
    this.showFavouriteImages = function() {
        
        imageGrid.close();        
        imageGrid.updateConfig({rowHeight : fav.coptions.grid.rowHeight, rules : fav.coptions.grid, type : fav.coptions.grid.type});
                
        if (mode != 'fav') {
            // moved to reset button
            // catFilters = [];
            // catIgnoreFilters = [];
        }        
        
        if (!env.isNSFW() || fav.coptions.ignoreNSFW) {                               
            handler.ignoreNSFW();
        }
        
        var controllsContainer = modalBoxContent;
        
        handler.showSidebarMessage(false);        
        clearSidebarLoadEvents();
        
        controllsContainer.innerHTML = '';
                
        if (!document.getElementById(env.className + '-mainCss')) {
            
            favContent.innerText = lng.s('Ошибка инициализации таблиц оформления', 'init_css_error');
            displayFavouritesBlock('fav');
            return;
        }
        
        // update image list selected array by current selected \ deselected category filters
        
        updateFilteredData();
        
        // prepare dom elements
        
        favContent.innerHTML = '';
        
        var editButton = document.createElement('a');
            editButton.href = '#';
            editButton.innerHTML = '';
            editButton.title = lng.s('Режим редактирования', 'edit_mode');
            editButton.onclick = function() {
                 
                if (!checkSafeUpdateData()) return false;
                
                var filterAdd = KellyTools.getElementByClass(controllsContainer, env.className + '-filters-CatCreate');
                    
                if (readOnly) {
                
                    readOnly = false;                    
                    this.className = this.className.replace('closed', 'open');
                
                } else {                
                    readOnly = true;
                    this.className = this.className.replace('open', 'closed');                    
                }
                                
                if (filterAdd) filterAdd.style.display = readOnly ? 'none' : 'inline-block';                
                return false;                
            }
            
            editButton.className  = env.className + '-FavEditButton-edit ' + env.className + '-iconset1 ';
            editButton.className += env.className + '-iconset1-lock ' + env.className + '-iconset1-lock-' + (readOnly ? 'closed' : 'open');
       
        var optionsButton = false;
        
        if (fav.coptions.optionsSide) {
            optionsButton = editButton.cloneNode();
            optionsButton.className = env.className + '-FavEditButton-options ' + env.className + '-iconset1 ' + env.className + '-icon-gear closed';
            optionsButton.title = lng.s('Настройки', 'options');
            optionsButton.onclick = function() {
                
                if (!checkSafeUpdateData()) return false;
                
                if (mode == 'ctoptions') {
                    handler.hideFavoritesBlock();                    
                    this.className = this.className.replace('closed', 'open');
                } else {                    
                    handler.showOptionsDialog();                    
                    this.className = this.className.replace('open', 'closed');
                }
                
                return false;
            }
        }   
        
        var resetButton = editButton.cloneNode();
            resetButton.title = lng.s('Сбросить', 'reset');
            resetButton.innerText = lng.s('Сбросить', 'reset');
            resetButton.onclick = function() {
            
                if (!checkSafeUpdateData()) return false;
                
                handler.resetFilterSettings();
                handler.showFavouriteImages();
                
                return false;                
            }
            
            resetButton.className = env.className + '-FavEditButton-reset';
        
        var filterComments = editButton.cloneNode();
            filterComments.title = '';
            filterComments.className = env.className + '-FavFilter ' + env.className + '-buttoncolor-dynamic';
            filterComments.innerText = lng.s('Комменты', 'comments');
           
        var filterPosts = filterComments.cloneNode();
            filterPosts.innerText = lng.s('Публикации', 'items');          
        
        filterComments.onclick = function() {
            
            if (!checkSafeUpdateData()) return false;
            page = 1;
            
            if (!excludeFavComments) {
                this.className = this.className.replace('active', '');
                excludeFavComments = true;
                
            } else {
                 this.className += ' active';
                 excludeFavComments = false;
            }
            
            updateFilteredData();
            
            handler.updateImagesBlock();
            handler.updateImageGrid();
            
            return false;
            
        }
            
        filterPosts.onclick = function() {
            
            if (!checkSafeUpdateData()) return false;
            
            page = 1;
            
            if (!excludeFavPosts) {
                this.className = this.className.replace('active', '');
                excludeFavPosts = true;
                
            } else {
                 this.className += ' active';
                 excludeFavPosts = false;
            }        
            
            updateFilteredData();
            
            handler.updateImagesBlock();
            handler.updateImageGrid();
            
            return false;
            
        }
            
        var filterNsfw = filterComments.cloneNode();        
            
            filterNsfw.innerText = 'NSFW';
            filterNsfw.title = lng.s('', 'nsfw_tip');
            filterNsfw.onclick = function () {
                
                if (!checkSafeUpdateData()) return false;
                
                if (fav.coptions.ignoreNSFW) {
                    fav.coptions.ignoreNSFW = false;
                    this.className += ' active';
                } else {
                    fav.coptions.ignoreNSFW = true;
                    this.className = this.className.replace('active', '');
                }
                
                handler.save('cfg');
                
                page = 1;
                handler.showFavouriteImages();
                return false;
            }
            
            if (!env.isNSFW()) {                
                filterNsfw.style.display = 'none';
            }
      
        if (!fav.coptions.ignoreNSFW) filterNsfw.className += ' active';            
        if (!excludeFavPosts) filterPosts.className += ' active';
        if (!excludeFavComments) filterComments.className += ' active';
            
        var typeFiltersContainer = document.createElement('div');
            typeFiltersContainer.className = env.className + '-TypeFiltersContainer';
            
            typeFiltersContainer.appendChild(filterComments);
            typeFiltersContainer.appendChild(filterPosts);
            typeFiltersContainer.appendChild(filterNsfw);
            
        var logicButton = editButton.cloneNode();
            logicButton.className = env.className + '-FavFilter ' + env.className + '-FavFilter-logic';
            logicButton.innerText = lng.s('', 'logic_' + logic);
            logicButton.title = lng.s('', 'logic_' + logic + '_help');
            
            logicButton.onclick = function () {
                
                if (!checkSafeUpdateData()) return false;
                
                logic = (logic == 'or') ? 'and' : 'or';
                logicButton.innerText = lng.s('', 'logic_' + logic);
                logicButton.title = lng.s('', 'logic_' + logic + '_help');
                
                updateFilteredData();
                
                handler.updateImagesBlock();
                handler.updateImageGrid();
                
                return false;
            }
            
        var no = logicButton.cloneNode();
            no.className = env.className + '-FavFilter';
            no.title = lng.s('Режим добавления в выборку \ исключения из выборки категорий', 'cats_filter');
            if (!catFilterNot) no.innerText = '+ ' + lng.s('Категории', 'cats');
            else no.innerText = '- ' + lng.s('Категории', 'cats');
            
            no.onclick = function () {
  
                if (catFilterNot) {
                    catFilterNot = false;
                    this.innerText = '+ ' + lng.s('Категории', 'cats');
                } else {
                    catFilterNot = true;
                    this.innerText = '- ' + lng.s('Категории', 'cats');
                }
            
                return false;
            }
            
        var gif = logicButton.cloneNode();            
            gif.className = env.className + '-FavFilter';
            gif.title = '';
            
            if (fav.coptions.animateGif) gif.innerText = '+ ' + lng.s('Анимация GIF', 'animate_gifs');
            else gif.innerText = '- ' + lng.s('Анимация GIF', 'animate_gifs');
            
            gif.onclick = function () {
                
                if (!checkSafeUpdateData()) return false;
                
                if (fav.coptions.animateGif) {
                    fav.coptions.animateGif = false;
                    this.innerText = '- ' + lng.s('Анимация GIF', 'animate_gifs');
                } else {
                    fav.coptions.animateGif = true;
                    this.innerText = '+ ' + lng.s('Анимация GIF', 'animate_gifs');
                }
            
                handler.save('cfg');
                
                updateFilteredData();
                
                handler.updateImagesBlock();
                handler.updateImageGrid();
                return false;
            }
            
        var additionButtons = document.createElement('div');
            additionButtons.className = env.className + '-filters-AdditionButtons';
            
            additionButtons.appendChild(resetButton);
            additionButtons.appendChild(editButton);
        
        if (optionsButton) {
            additionButtons.appendChild(optionsButton);
        }
         
        var gotoPage = editButton.cloneNode();
            gotoPage.innerText = lng.s('Страница', 'page');
            gotoPage.className = env.className + '-FavEditButton ' + env.className + '-FavEditButton-page';
            gotoPage.title = lng.s('Перейти на страницу', 'goto_page');
            gotoPage.onclick = function (e) { 
            
                if (handler.getTooltip().isShown() == 'gotoFavPage') {
                    handler.getTooltip().show(false);
                    handler.tooltipBeasy = false;
                } else {                      
                    showGoToPageTooltip(this);                       
                }                  
                
                return false;
            }
            
        additionButtons.appendChild(gotoPage);        
        updateGoToPageButton(gotoPage);
            
        if (!favNativeParser || (favNativeParser && !favNativeParser.isBeasy())) {   // handler.isDownloadSupported && 
            
            var showDownloadManagerForm = function(show) {
                
                if (!show) {
                    
                    downloaderBox.modal.className = downloaderBox.modal.className.replace('active', 'hidden');  
                    return;
                    
                } else {
                    var dm = handler.getDownloadManager();
                    
                    if (!dm.container) {
                         dm.container = downloaderBox.content;
                    }
                    
                    fav.coptions.grabber.itemsList = ''; // is range set save needed ?
                    
                    dm.updateCfg({
                        events : false,
                        options : fav.coptions.grabber,
                    });
                    
                    dm.updateCfg({
                        events : {
                            
                            onOptionsUpdate : function(self) {
                                
                                KellyTools.log('New download options confirmed', 'KellyFavItems | downloadManager');   
                                
                                fav.coptions.grabber = self.getOptions();
                                handler.save('cfg');
                            },
                            
                            onChangeState : function(self, newState) {
                                                                
                                if (newState == 'download') {
                                    
                                    setPreventClose(true);
                                    fav.coptions.grabber = self.getOptions();
                                    handler.save('cfg');
                                } else {
                                    
                                    setPreventClose(false);
                                    // remove beforeunload
                                }
                            },
                            
                            onDownloadAllEnd : function(handler, result) {
                                
                                KellyTools.log(result, 'KellyFavItems | downloadManager');   
                                
                            },
                        }
                    })
                    
                    dm.showGrabManager();  
                    
                    downloaderBox.modal.className = downloaderBox.modal.className.replace('hidden', 'active');    

                }
                
                onSideBarUpdate();
            }
                   
            var download = editButton.cloneNode();
                download.className = env.className + '-FavEditButton ' + env.className + '-FavEditButton-download ' + (imagesAsDownloadItems ? 'active' : 'hidden');
                download.innerText = lng.s('Загрузки', 'download_manager');
                download.title = lng.s('Загрузки', 'download_manager');
                
                download.onclick = function () {
                    if (!checkSafeUpdateData()) return false;
                    
                    if (imagesAsDownloadItems) { 
                        imagesAsDownloadItems = false;
                        
                        KellyTools.classList('remove', this, 'active');
                        KellyTools.classList('add', this, 'hidden');
                        
                        KellyTools.classList('remove', editButton, 'hidden');
                        
                        handler.sideBarLock = false;
                        showDownloadManagerForm(false);
                    } else {
                        imagesAsDownloadItems = true;
                        
                        KellyTools.classList('remove', this, 'hidden');
                        KellyTools.classList('add', this, 'active');
                        
                        KellyTools.classList('add', editButton, 'hidden');
                        
                        // turn off edit mode while in download mode
                        if (!readOnly) {
                            editButton.click();
                        }
                        
                        handler.sideBarLock = true;
                        handler.getDownloadManager().setDownloadTasks(displayedItems);                        
                        showDownloadManagerForm(true);
                    }
                    
                    updateFilteredData();
                    
                    handler.updateImagesBlock();                
                    handler.updateImageGrid();  
                                
                    if (env.events.onShowFavouriteImages) env.events.onShowFavouriteImages(imagesAsDownloadItems);
                    
                    return false;
                }
                
            additionButtons.appendChild(download);
            
            
            if (imagesAsDownloadItems) {
                
                // turn off edit mode while in download mode
                if (!readOnly) {
                    editButton.click();
                }
                
                KellyTools.classList('add', editButton, 'hidden');
            }       
       
        }
            
        var cOptions = document.createElement('div');    
        KellyTools.setHTMLData(cOptions, '<table><tbody><tr><td></td><td></td><td></td></tr></tbody></table>');
        
        var cOptionsSectors = cOptions.getElementsByTagName('td');
        var cOptionsSectorItems = [no, gif, logicButton];
        
        for (i = 0; i < cOptionsSectors.length; i++) {
            
            cOptionsSectors[i].appendChild(cOptionsSectorItems[i]);
        }
            
        additionButtons.appendChild(cOptions);
        
        var clearDiv = document.createElement('div');
            clearDiv.style.clear = 'both';
            
        additionButtons.appendChild(clearDiv);
            
        controllsContainer.appendChild(additionButtons);
        controllsContainer.appendChild(typeFiltersContainer);
        
        if (!readOnly) editButton.className += ' active';
        
        var filtersMenuBlock = document.createElement('div');
            filtersMenuBlock.className = env.className + '-FiltersMenu-container'; 
            
        var filtersMenu = document.createElement('ul');
            filtersMenu.className = env.className + '-FiltersMenu';
        
        showCatList(filtersMenu);  
                  
        filtersMenuBlock.appendChild(filtersMenu);
        controllsContainer.appendChild(filtersMenuBlock);
        
        var paginationContainer = document.createElement('div');
            paginationContainer.className = env.className + '-pagination';
            paginationContainer.id = env.className + '-pagination';
            
        controllsContainer.appendChild(paginationContainer);     
        
        if (!imagesBlock) {
            imagesBlock = document.createElement('div');
            imagesBlock.className = env.className + '-imagesBlock-container ' + env.className + '-imagesBlock-container-active';
        }
        
        if (imagesAsDownloadItems) {
            showDownloadManagerForm(true);
        }
        
        favContent.appendChild(imagesBlock);
        
        // display         
        
        handler.updateImagesBlock();
        
        handler.showSidebar(true, false, 'fav');
        
        displayFavouritesBlock('fav');
        handler.updateImageGrid();
        
        if (env.events.onShowFavouriteImages) env.events.onShowFavouriteImages(imagesAsDownloadItems);
        
        return false;
    }
    
    this.closeSidebar = function() {        
        
        clearSidebarLoadEvents();        
        sideBarWrap.className = sideBarWrap.className.replace( env.className + '-sidebar-wrap-active',  env.className + '-sidebar-wrap-hidden');        
               
        if (env.events.onSideBarShow) env.events.onSideBarShow(sideBarWrap, true);
    }
    
    this.showSidebarMessage = function(message, error) {
        
        modalBoxMessage.className = env.className + '-ModalBox-message ' + env.className + '-ModalBox-message-' + (message ? 'active' : 'hidden');
        
        if (!message) {
            KellyTools.setHTMLData(modalBoxMessage);
        } else {
            
            KellyTools.setHTMLData(modalBoxMessage, message);
            if (error) modalBoxMessage.className += ' ' + env.className + '-ModalBox-message-error';
        }
    }
    
    function clearSidebarLoadEvents() {
        KellyTools.stopMediaLoad(modalBoxContent);
    }
    
    this.showSidebar = function(hideHeader, onClose, action) {
        
        sideBarWrap.className = sideBarWrap.className.replace( env.className + '-sidebar-wrap-hidden',  env.className + '-sidebar-wrap-active');
               
        var header = KellyTools.getElementByClass(modalBox, env.className + '-ModalBox-header');
          
        var modalBoxBtnClose = KellyTools.getElementByClass(modalBox, env.className + '-ModalBox-close');
            modalBoxBtnClose.onclick = function() { 
            
                if (onClose) {
                    onClose(); 
                } else {
                    handler.closeSidebar();
                }
                
                return false; 
            };
        
        if (hideHeader) {
            header.style.display = 'none';
          
        } else {
            header.style.display = 'block';
        }
    
        onSideBarUpdate();        
        if (env.events.onSideBarShow) env.events.onSideBarShow(sideBarWrap, false, action);
    }
    
    function onSideBarUpdate() {
        if (env.events.onSideBarUpdate && env.events.onSideBarUpdate(sideBarWrap, handler.sideBarLock)) return;        
    }
    
    // preview dimensions, preview jpg for gif media, and other helpful information that collected before add item to storage 
    this.setSelectionInfo = function(type, info) {
        
        if (!type) {
        
            log('setSelectionInfo : clean selected info');
            if (selectedInfo) selectedInfo = false;
            
        } else {
        
            if (!selectedInfo) selectedInfo = new Object();        
            selectedInfo[type] = info;    
        }
    }        
    
    this.showRemoveCategoryDialog = function(itemIndex, onRemove, onCancel) {
    
        if (!fav.categories[itemIndex]) {
            log('attempt to remove unexist item ' + itemIndex);
            return false;
        }
        
        handler.getTooltip().show(false);        
        handler.showSidebarMessage(false);
        clearSidebarLoadEvents();
        
        var html = '<p>' + lng.s('Подтвердите удаление', 'delete_confirm') + '</p>';
            html += '<p><b>' + fav.categories[itemIndex].name + '</b> (ID : ' + fav.categories[itemIndex].id + ')</p>';
            html += '<p><label><input type="checkbox" name="removeImages" class="' + env.className + 'RemoveImages">' + lng.s('Удалить все связанные изображения', 'delete_rcat_items')  +  '</label></p>'
            html += '<p class="' + env.className + '-ModalBox-controll-buttons"><a href="#" class="' + env.className + 'Remove">' + lng.s('Удалить', 'delete')  +  '</a>';
            html += '<a href="#" class="' + env.className + 'Cancel">' + lng.s('Отменить', 'cancel')  +  '</a></p>';       
        
        KellyTools.setHTMLData(modalBoxContent, '<div class="' +  env.className + '-removeDialog">' + html + '</div>');
       
        var removeButton = KellyTools.getElementByClass(modalBoxContent, env.className + 'Remove');
        var removeApplyButton = KellyTools.getElementByClass(modalBoxContent, env.className + 'Apply');
    
        var onCancelCommon = function() {

            if (onCancel) {
                onCancel();
            } else {
                handler.closeSidebar();  
            } 
            
            return false; 
        }
        
        KellyTools.getElementByClass(modalBoxContent, env.className + 'Cancel').onclick = onCancelCommon;
        
        removeButton.onclick = function() { 
            
            var removeImages = KellyTools.getElementByClass(modalBoxContent, env.className + 'RemoveImages');
            if (removeImages && removeImages.checked) {
                removeImages = true;
            } else {
                removeImages = false;
            }
            
            handler.categoryRemove(itemIndex, removeImages);
            
            if (onRemove) {
                onRemove();
            } else {
                handler.closeSidebar();  
            } 
            
            return false; 
        }
        
        handler.showSidebar(false, onCancelCommon);
        onSideBarUpdate();
        return false;
    }
  
        
    function getSelectedPostMediaControlls() {

        var controlls = document.createElement('DIV'), text = selectedInfo ? selectedInfo['text'] : '', html = '';
            controlls.className = env.className + '-ModalBox-PreviewContainer active';
        
        if (selectedImages.length > 1) {
            html += '<!--p>' + lng.s('Основное изображение', 'image_main') + '</p-->' +
                    '<p class="' + env.className + '-ModalBox-controll-buttons">\
                        <a href="#" class="' + env.className + '-PreviewImage-del">' + lng.s('Удалить', 'delete')  + '</a>\
                        <a href="#" class="' + env.className + '-PreviewImage-prev">' + lng.s('Предыдущее', 'prev') + '</a>\
                        <a href="#" class="' + env.className + '-PreviewImage-next">' + lng.s('Следующее', 'next')  + '</a>\
                    </p>';
        }
        
        if (selectedImages.length) { 
        
            html += '<div class="' + env.className + '-PreviewImage-container">\
                        <img src="' + env.getStaticImage(selectedImages[0]) + '" class="' + env.className + '-PreviewImage">\
                    </div>';
            
        } else if (text) {
            
            text = text.length > 250 ? text.substring(0, 250) + '...' : text;
            html += '<div class="' + env.className + '-PreviewText-container">' + KellyTools.nlToBr(text) + '</div>';
        }
        
        var onLoadPreviewImage = function() {
            
            var dimensions = {width : parseInt(this.naturalWidth), height : parseInt(this.naturalHeight)};
            
            this.style.maxWidth = dimensions.width + 'px';
            handler.setSelectionInfo('dimensions', dimensions);
            
            onSideBarUpdate();            
            log('get width and height for ' + this.src); log(dimensions);       
        }
        
        var switchPreviewImage = function(next) {
            
            if (!selectedImages || selectedImages.length <= 1) return false;
            
            var previewImage = KellyTools.getElementByClass(modalBoxContent, env.className + '-PreviewImage');
            if (!previewImage) return false;
            
            var caret = previewImage.getAttribute('data-caret');
            if (!caret) caret = 0;
            else caret = parseInt(caret);
            
            if (!next) {            
                selectedImages.splice(caret, 1);
                next = 1;
            }
                
            caret += next;
            if (caret < 0) caret = selectedImages.length-1;
            else if (caret > selectedImages.length-1) caret = 0;
            
            previewImage.setAttribute('data-caret', caret);            
            previewImage.src = '';
            previewImage.onload = function() { return false; } 
            
            setTimeout(function() {
                previewImage.src = env.getStaticImage(selectedImages[caret]);
                previewImage.onload = onLoadPreviewImage;
            }, 100);
            
            handler.setSelectionInfo('dimensions', false);
            return false;
        }
        
        KellyTools.setHTMLData(controlls, html);
        KellyTools.getElementByClass(controlls, env.className + '-PreviewImage-prev').onclick = function() { return switchPreviewImage(-1); }
        KellyTools.getElementByClass(controlls, env.className + '-PreviewImage-next').onclick = function() { return switchPreviewImage(1); }
        KellyTools.getElementByClass(controlls, env.className + '-PreviewImage-del').onclick = function() { return switchPreviewImage(0); }
        KellyTools.getElementByClass(controlls, env.className + '-PreviewImage').onload = onLoadPreviewImage;
        
        return controlls;
    }
        
    this.showAddToFavDialog = function(postBlock, comment, onAdd, onRemove, onClose) {
        
        var postIndex = typeof postBlock == 'number' ? postBlock : false, existItem = false;        
        selectedPost = postBlock;
        
        if (postIndex === false && !postBlock) return false;        
        if (postIndex !== false) {
            postBlock = false;
            existItem = fav.items[postIndex];
            selectedPost = false;
        } 
        
        handler.showSidebarMessage(false);
        handler.setSelectionInfo(false);
        clearSidebarLoadEvents();
        
        if (existItem) {
            
            selectedImages = [];
            
            if (existItem.pImage) {            
                if (typeof existItem.pImage == 'string') {
                    selectedImages = [existItem.pImage];
                } else {           
                    for (var i = 0; i < existItem.pImage.length; i++) {
                        selectedImages[i] = existItem.pImage[i];
                    }
                }
            }
            
            fav.selected_cats_ids = existItem.categoryId;
            if (existItem.commentLink) handler.setSelectionInfo('text', existItem.text);
            
        } else {
        
            if (comment) {
                selectedComment = comment;
                selectedImages = env.getAllMedia(comment);
                handler.setSelectionInfo('text', env.getCommentText(comment));
            } else {            
                selectedComment = false;
                selectedImages = env.getAllMedia(postBlock);
            }
            
            var postTags = env.getPostTags ? env.getPostTags(selectedPost) : false;
            handler.getStorageManager().selectAutoCategories(fav, postTags, selectedImages);
        }
                  
        var controllsAndPreview = getSelectedPostMediaControlls(); // create selected preview + controlls dom, load dimensions of preview (also can be already pre-initialized throw getAllMedia method)  
        
        var hidePreview = KellyTools.getElementByClass(modalBox, env.className + '-ModalBox-hide-preview');
        if (hidePreview) {
            hidePreview.innerText = lng.s('Скрыть превью', 'item_preview_hide');
            hidePreview.className = selectedImages.length > 0 ? hidePreview.className.replace('hidden', 'active') :  hidePreview.className.replace('active', 'hidden'); 
            hidePreview.onclick = function() {
                
                if (controllsAndPreview.className.indexOf('hidden') != -1) {             
                    controllsAndPreview.className = controllsAndPreview.className.replace('hidden', 'active');
                    hidePreview.innerText = lng.s('Скрыть превью', 'item_preview_hide');
                } else {
                    controllsAndPreview.className = controllsAndPreview.className.replace('active', 'hidden');
                    hidePreview.innerText = lng.s('Показать превью', 'item_preview_show');
                }
                
                onSideBarUpdate();
                return false;
            }
        }
        
        var onCloseNative = function() {
            
            if (onClose) return onClose();
            
            if (hidePreview) {
                hidePreview.className = hidePreview.className.replace('active', 'hidden');
            }
            
            if (mode == 'fav') handler.showFavouriteImages();
            else {
                handler.save('cfg');
                handler.closeSidebar();
            }
        }
           
        handler.showSidebar(false, onCloseNative, 'addtofav');
                
        var catsHTML = '<option value="-1">[' + lng.s('Выбрать категорию', 'cat_select') + ']</option><option value="-2">[' +lng.s('Создать категорию', 'cat_create') + ']</option>';
        
        for (var i = 0; i < fav.categories.length; i++) catsHTML += '<option value="' + fav.categories[i].id + '">' + fav.categories[i].name + '</option>';   
        
        catsHTML = '<select class="' + env.className + 'Cat">' + catsHTML + '</select>';
         
        var html = '\
            <div class="' + env.className + 'SavePostWrap">\
                    <div class="' + env.className + 'CatAddForm" style="display : none;">\
                            <input type="text" placeholder="' + lng.s('Новая категория', 'cat_new_cat_name') + '" value="" class="' + env.className + 'CatName">\
                            <a href="#" class="' + env.className + 'CatCreate">' +lng.s('Создать категорию', 'cat_create') + '</a>\
                    </div>\
                    <div class="' + env.className + 'SavePost">\
                        <div class="' + env.className + 'CatList">' + catsHTML + '</div><div class="' + env.className + 'AddSection">\
                        <input type="text" placeholder="' +lng.s('Своя заметка', 'item_notice') + '" title="' + lng.s('', 'item_notice_title') + '" value="' + (existItem && existItem.name ? existItem.name : '') + '" class="' + env.className + 'Name">\
                        <a href="#" class="' + env.className + 'Add">' +lng.s('Сохранить', 'save') + '</a>\
                        <a href="#" class="' + env.className + 'Remove" ' + (!existItem ? 'style="display : none;"' : '') + '>' + lng.s('Удалить', 'delete') + '</a>\
                        <div style="clear : both"></div></div>\
                    </div><div class="' + env.className + 'CatAddToPostList"></div>\
            </div>';
            
        KellyTools.setHTMLData(modalBoxContent, html);
        modalBoxContent.insertBefore(controllsAndPreview, modalBoxContent.childNodes[0]);  
        
        var onNameChange = function () {
            
            var name = KellyTools.val(this.value, 'string');            
            var previewContainer = KellyTools.getElementByClass(modalBoxContent, env.className + '-ModalBox-PreviewContainer');           
            if (previewContainer) KellyTools.classList(name ? 'add' : 'remove', previewContainer, 'inactive');
            
            handler.setSelectionInfo('name', name);             
        }
        
        var removeBtn = KellyTools.getElementByClass(modalBoxContent, env.className + 'Remove');
        var name = KellyTools.getElementByClass(modalBoxContent, env.className + 'Name');
            name.onchange = onNameChange;
            name.onkeyup = onNameChange;
                
        var savingProcess = false;        
        var removeItem = function () { 
            
            if (!existItem || savingProcess) return false;
            handler.itemRemove(postIndex); 
            
            if (onRemove && onRemove()) return;
            
            onCloseNative();         
            return false; 
        }
        
        var saveItem = function () { 
            
            if (savingProcess) return false;             
            handler.showSidebarMessage(lng.s('', 'saving')); 
            
            var previewImage = KellyTools.getElementByClass(modalBoxContent, env.className + '-PreviewImage');
            if (previewImage) {
            
                var caret = previewImage.getAttribute('data-caret') ? parseInt(previewImage.getAttribute('data-caret')) : 0;               
                if (caret && caret < selectedImages.length && caret >= 1) {
                    var tmp = selectedImages[0];
                    selectedImages[0] = selectedImages[caret];
                    selectedImages[caret] = tmp;
                    previewImage.removeAttribute('data-caret');
                }
            }
            
            var result = getFavItemFromSelected(existItem);
            if (result.error) {
                
                handler.showSidebarMessage(result.errorText, true); 
                
            } else {
                
                savingProcess = true;                
                handler.itemAdd(result.postItem, function(error, exist, newIndex) {
                    
                    savingProcess = false;
                    
                    if (error) {                        
                        handler.showSidebarMessage(lng.s('Ошибка сохранения', 'storage_save_e1'), true);                        
                    } else {                      
                        
                        existItem = fav.items[newIndex];
                        postIndex = newIndex;
                        
                        removeBtn.style.display = '';
                        
                        if (onAdd) onAdd();
                        
                        handler.showSidebarMessage(lng.s('', exist ? 'item_upd' : 'item_added'));                         
                        handler.save('cfg');
                    }                                            
                });
            }
            
            return false; 
        }
        
        removeBtn.onclick = removeItem;
        KellyTools.getElementByClass(modalBoxContent, env.className + 'Add').onclick = saveItem;     
        KellyTools.getElementByClass(modalBoxContent, env.className + 'CatCreate').onclick = function () { handler.categoryCreate(); return false; }
        KellyTools.getElementByClass(modalBoxContent, env.className + 'Cat').onchange = function() {            
            if (this.options[this.selectedIndex].value > 0) {
                handler.categoryAdd();
                this.selectedIndex = 0;
            }
            
            KellyTools.getElementByClass(modalBoxContent, env.className + 'CatAddForm').setAttribute('style', this.options[this.selectedIndex].value != '-2' ? 'display : none;' : '');
        }
        
        var list = KellyTools.getElementByClass(modalBoxContent, env.className + 'CatAddToPostList');
        if (fav.selected_cats_ids.length) {        
            for (var i = 0; i < fav.selected_cats_ids.length; i++) {                
                if (handler.getStorageManager().getCategoryById(fav, fav.selected_cats_ids[i]).id == -1) continue;
                
                list.appendChild(createCatExcludeButton(fav.selected_cats_ids[i]));
            }            
        }            
        
        onSideBarUpdate();        
        
        if (fav.coptions.addToFavNoConfirm) {
            saveItem();
        }
        
        return false;
    }
    
    function getFavItemFromSelected(postItem) {
      
        if (!postItem && !selectedPost) {
            log('itemAdd : selected post empty');
            return {error : 'not_selected', errorText : ''};
        }
                          
        if (!postItem) {
            postItem = { 
                pImage : '', link : '', 
                // name : '', commentLink : '', text : '', pw : 0, ph : 0, ps : 0, -- optional parametrs
            };
        }
        
        postItem.categoryId = [];
        
        if (selectedInfo && selectedInfo['text']) postItem.text = selectedInfo['text'];
        if (selectedInfo && selectedInfo['name']) postItem.name = selectedInfo['name'];
        
        fav.selected_cats_ids = handler.getStorageManager().validateCategories(fav.selected_cats_ids, fav);        
        if (fav.selected_cats_ids.length) {        
            for (var i = 0; i < fav.selected_cats_ids.length; i++) {            
                postItem.categoryId[postItem.categoryId.length] = fav.selected_cats_ids[i];
            }
        }
        
        if (!postItem.link) {
            
            if (selectedComment) {                
                postItem.commentLink = env.getCommentLink(selectedComment);                
                if (!postItem.commentLink) {
                    return {error : 'post_link_empty', errorText : lng.s('Ошибка определения ссылки на комментарий', 'item_add_err1')};
                }
            }
            
            postItem.link = env.getPostLink(selectedPost);            
            if (!postItem.link) {
                return {error : 'post_link_empty', errorText : lng.s('Публикация не имеет ссылки', 'item_bad_url')};
            }  
        }
                
        // it is text only item - skip images
        
        if (postItem.name) { 
            postItem.pImage = '';
            return {error : false, postItem : postItem};
        }              
        
        postItem.pImage = selectedImages.length == 1 ? selectedImages[0] : selectedImages;
           
        if (selectedInfo && selectedInfo['dimensions'] && selectedInfo['dimensions'].width) {
        
            postItem.pw = selectedInfo['dimensions'].width;
            postItem.ph = selectedInfo['dimensions'].height;  
            
            // untrusted original proportions
            if (selectedInfo['dimensions'].schemaOrg) {
                postItem.ps = 1;
            }
        }
        
        return {error : false, postItem : postItem};
    }
    
    this.itemAdd = function(postItem, onSave) {
        
        var itemIndex = handler.getStorageManager().searchItem(fav, {link : postItem.link, commentLink : postItem.commentLink ? postItem.commentLink : false});        
        if (itemIndex !== false) {
            
            fav.items[itemIndex] = postItem;
            
            handler.save('items', function(error) {                
                if (onSave) onSave(error, true, itemIndex);
            });
            
        } else {        
        
            itemIndex = fav.items.length;
            
            fav.ids++;        
            postItem.id = fav.ids;
            
            fav.items[itemIndex] = postItem;

            handler.save('items', function(error) {
                
                if (!error) {
                
                    handler.updateFavCounter();               
                    
                    log('itemAdd : post saved');
                    log(postItem);
                    
                } else {
                    fav.items.splice(itemIndex, 1);        
                }
                
                if (onSave) onSave(error, false, itemIndex);
            });
        
        }
                
        return true;
    }
    
    // todo move to storage manager
    
    // удалить элемент с последующим обновлением контейнеров публикаций 
    // index - item index in fav.items[index] - comment \ or post
    // postBlock - not important post container dom element referense, helps to find affected post
        
    this.itemRemove = function(index) {
    
        fav.items.splice(index, 1);
        
        handler.updateFavCounter();        
        handler.save('items');

        handler.formatPostContainers();
    }
    
    // удалить категорию с последующим обновлением контейнеров публикаций 
    
    this.categoryRemove = function(i, removeImages) {
        
        if (!fav.categories[i]) return false;

        if (fav.categories[i].protect) {
            return false;
        }
        
        var removeCatId = fav.categories[i].id;
        
        var getItemWithRemoveCat = function() {
        
            for (var b = 0; b < fav.items.length; b++) {
                if (fav.items[b].categoryId.indexOf(removeCatId) !== -1) return b;
            }
            
            return false;
        }
        
        if (removeImages) {
        
            var imageItem = false;
            do { 
                
                imageItem = false;
                var itemIndex = getItemWithRemoveCat(); 
                
                if (itemIndex !== false) {
                    imageItem = true;
                    fav.items.splice(itemIndex, 1);
                } 
                
            } while (imageItem);
            
            handler.formatPostContainers();            
            handler.updateFavCounter();
            
        } else {
        
            // remove child posts
            for (var b = 0; b < fav.items.length; b++) {
                var itemCategoryIndex = fav.items[b].categoryId.indexOf(removeCatId);
                if (itemCategoryIndex === -1) continue;
                fav.items[b].categoryId.splice(itemCategoryIndex, 1);
            }
        }
       
       // x.options[x.selectedIndex]
       
       fav.categories.splice(i, 1);
       fav.selected_cats_ids = handler.getStorageManager().validateCategories(fav.selected_cats_ids, fav);
       
       handler.save();
       return true;
    }
    
    this.categoryExclude = function(newCatId) {
        
        var index = fav.selected_cats_ids.indexOf(newCatId);

        if (index == -1) return false;
        
        fav.selected_cats_ids.splice(index, 1);
        
        // console.log(fav.selected_cats_ids);        
    }
    
    function createCatExcludeButton(catId) {
        
        var category = handler.getStorageManager().getCategoryById(fav, catId);
        
        var catItem = document.createElement('a');
            catItem.href = '#';
            // catItem.innerText = lng.s('Исключить __CATEGORYNAME__', 'cat_exclude', { CATEGORYNAME : category.name });

            KellyTools.setHTMLData(catItem, '<div class="' + env.className + '-minus"></div><span>' + category.name + '</span>');
            catItem.setAttribute('categoryId', category.id);
            catItem.onclick = function() {
                
                handler.categoryExclude(parseInt(this.getAttribute('categoryId')));
                this.parentNode.removeChild(this);
                
                return false;
            }
            
        return catItem;
    }
    
    this.categoryEdit = function(data, index) {
        
        if (!fav.categories[index]) return false;
        
        var edited = false;
        
        // log(newName + ' | ' + index);
        if (data.name && fav.categories[index].name != data.name) {
            data.name = data.name.trim();
            
            if (
                data.name && 
                data.name.length && 
                handler.getStorageManager().getCategoryBy(fav, data.name, 'name').id == -1
            ) {
                fav.categories[index].name = data.name;
                edited = true;
            }            
        }  
        
        if (typeof data.nsfw != 'undefined') {
        
            if (data.nsfw)
            fav.categories[index].nsfw = true;
            else 
            fav.categories[index].nsfw = false;
            
            edited = true;
        }  
        
        
        if (typeof data.order != 'undefined') {
            
            data.order = parseInt(data.order);
            
            if (data.order)
            fav.categories[index].order = data.order;
            else 
            fav.categories[index].order = index;
            
            edited = true;
        }  
        
        if (typeof data.assoc != 'undefined') {
            
            data.assoc = handler.getStorageManager().categoryAssocFromString(data.assoc);
            fav.categories[index].assoc = handler.getStorageManager().categoryAssocToString(data.assoc);
            
            fav.cats_assoc_buffer = false;
            
            edited = true;
        } 
        
        if (edited) {
        
            handler.save('items');
            return fav.categories[index];
            
        } else return false;
        
    }

    this.getView = function(name) {
             if (name == 'sidebar') return sideBarWrap;
        else if (name == 'content') return favContent;
        else if (name == 'modalBox') return modalBox;
        else if (name == 'menu') return menuButtons;
    }
    
    this.getGlobal = function(name) {
        
             if (name == 'debug') return fav.coptions.debug;    
        else if (name == 'env') return env;        
        else if (name == 'fav') return fav;
        else if (name == 'filters') return catFilters;
        else if (name == 'lng') return lng;
        else if (name == 'options') return fav.coptions;
        else if (name == 'image_events') return imageEvents;
    }
    
    // add category to list of categories of selected item
    
    this.categoryAdd = function() {
    
        var list = KellyTools.getElementByClass(modalBoxContent, env.className + 'CatAddToPostList');
        if (!list) return false;
        
        var catSelect = KellyTools.getElementByClass(modalBoxContent, env.className + 'Cat');       
        var newCatId = parseInt(catSelect.options[catSelect.selectedIndex].value);
                
        if (fav.selected_cats_ids.indexOf(newCatId) !== -1) return false;
        
        if (handler.getStorageManager().getCategoryById(fav, newCatId).id == -1) return false;
        
        fav.selected_cats_ids[fav.selected_cats_ids.length] = parseInt(newCatId);
        
        list.appendChild(createCatExcludeButton(newCatId));
    }
    
    this.categoryCreate = function(container) {
        
        if (!container) {
            container = sideBarWrap;
        }
        
        if (!container) return false;
        
        var name = KellyTools.inputVal(env.className + 'CatName', 'string', container);
        
        var orderNum = 0;
        var order =  KellyTools.getElementByClass(container, env.className + 'CatOrder');
        if (order) {
            orderNum = parseInt(order.value)
        }  
                
        var catIsNSFW = KellyTools.getElementByClass(container, env.className + 'CatIsNSFW');
        if (catIsNSFW && catIsNSFW.checked) catIsNSFW = true;
        else catIsNSFW = false;
        
        if (!name) {
            handler.showSidebarMessage( lng.s('Введите название категории', 'cat_error_name'), true);
            return false;
        }
        
        if (!handler.getStorageManager().categoryCreate(fav, name, catIsNSFW, orderNum)) {
            handler.showSidebarMessage(lng.s('Категория с указаным именем уже существует', 'cat_error_name_exist'), true); 
            return false;
        }
        
        var option = document.createElement("option");
            option.text = name;
            option.value = fav.ids;
        
        var catSelect = KellyTools.getElementByClass(container, env.className + 'Cat');
        if (catSelect) {
            catSelect.add(option);
            catSelect.selectedIndex = catSelect.options.length-1;
        }
        
        handler.showSidebarMessage(lng.s('Категория добавлена', 'cat_add_success'));
        handler.save('items');
        
        return true;
    }    
    
    this.onDownloadNativeFavPagesEnd = function(stage, canceled) {
        
        log(stage);
        
        // we can safely close window only on autosave data. keep prevent close true in other case 
        
        var notice = KellyTools.getElementByClass(document, env.className + '-exporter-process');
            notice.innerText = '';
        
        var saveNotice = KellyTools.getElementByClass(document, env.className + '-exporter-save-result');
        var saveNoticeHtml = '';
        
        if (canceled) {
            saveNoticeHtml = lng.s('', 'download_partly');
        }
            
        var downloadBtn = KellyTools.getElementByClass(document, env.className + '-exporter-button-start');
        if (downloadBtn) downloadBtn.innerText = lng.s('Запустить скачивание страниц', 'download_start');    
        
        log('onDownloadNativeFavPagesEnd : ' + (canceled ? ' canceled' : 'job finished successfull'));
            
        if (!favNativeParser || !favNativeParser.collectedData.items.length) {
            
            if (notice) {
                notice.innerText = canceled ? lng.s('', 'download_empty') : '';            
            }  
            
            return false;
        }
        
        // notify about profile data was download automaticly
        
        if (!canceled &&
            fav.coptions.downloader.autosaveEnabled && 
            (favNativeParser.jobSaved || !favNativeParser.jobBeforeAutosave)
        ) { 
        
            favNativeParser.jobSaved += favNativeParser.jobAutosave - favNativeParser.jobBeforeAutosave;
            favNativeParser.saveData(true, 'onDownloadNativeFavPagesEnd');
            
            saveNoticeHtml += '<br><b>' + lng.s('', 'download_autosaved_ok') + '</b>';    
                    
            setPreventClose(false);
            
        } else {
            
            KellyTools.getElementByClass(document, env.className + '-Save').style.display = 'block';
            
            if (fav.coptions.downloader.autosaveEnabled && favNativeParser.jobSaved && favNativeParser.jobBeforeAutosave) {
                saveNoticeHtml += '<br><b>' + lng.s('', 'download_autosaved_partly', {LAST_PAGE : favNativeParser.jobSaved}) + '</b>';
            }
        }
        
        if (saveNotice) {
            KellyTools.setHTMLData(saveNotice, saveNoticeHtml);
        }
        
        var saveNew = KellyTools.getElementByClass(document, env.className + '-exporter-button-save');
            saveNew.onclick = function() {
            
                if (favNativeParser && favNativeParser.saveData) favNativeParser.saveData();
                return false;
            } 
            
        var addToProfile = KellyTools.getElementByClass(document, env.className + '-exporter-button-addtoprofile');
            addToProfile.onclick = function() {
            
                if (favNativeParser) {
                    handler.showOptionsDialog(env.className + '-Storage');
                    window.scrollTo(0,  handler.getStorageManager().wrap.getBoundingClientRect().top + KellyTools.getScrollTop());
                }
                
                return false;
            }
    }
    
    this.onDownloadNativeFavPage = function(worker, thread, jobsLength) {
        
        var error = '';
        
        KellyTools.getElementByClass(document, env.className + '-exporter-process').innerText = lng.s('Страниц в очереди __PAGESN__', 'download_pages_left', {PAGESN : jobsLength});
     
        if (!thread.response) {
        
            error = 'Страница не доступна ' + thread.job.data.page + ' (ошибка загрузки или превышен интервал ожидания)'; // window.document null  
            if (thread.error) {
                error += ' | Ошибка : [' + thread.error + ']';
            }
            
            favNativeParser.addJob(
                thread.job.url, 
                handler.onDownloadNativeFavPage, 
                {page : thread.job.data.page}
            );
            
        } else {
        
            
            var loadDoc = document.createElement('DIV');
                loadDoc.setAttribute('style', 'width : 0px; height : 0px; overflow : hidden; display : none; opacity : 0;');
                
                loadDoc.innerHTML = '';
                loadDoc.appendChild(KellyTools.val(thread.response, 'html'));
                
            var posts = env.getPosts(loadDoc);
            if (!posts) {
            
                error = 'Отсутствуют публикации для страницы ' + thread.job.data.page;
            } else {               
                favNativeParser.addToLog('Страница : ' + thread.job.data.page + ' найдено ' + posts.length + ' элементов');
            }
            
            worker.jobBeforeAutosave--;
        }
        
        if (error) {
        
            worker.errors += error;        
            favNativeParser.addToLog(error);
            return;
        }
                
        var pageInfo = {
            page : thread.job.data.page,
            itemsNum : 0,
        }
        
        // exclude unnesessery data to improve load speed - ok        
        // clear selected cats to ignore current profile categories in itemAdd method (used to collect selectedImages to new item)
            
            fav.selected_cats_ids = [];
                
        // for (var i = 0; i < posts.length; i++) 
            
        // ToDo - для сортировки по дате \ ид - учитывать их при обработке постов \ сортировать постфактум. на данный момент, просто применяется обратный проход по массиву элементов в рамках страницы
        // что бы записи шли по порядку добавления от старых - к более новым (мешанины не будет только при одном потоке)
            
        for (var i = posts.length - 1; i >= 0; i--) {         
        
            selectedComment = false;
            selectedPost = posts[i];
            
            handler.setSelectionInfo(false);
            
            selectedImages = env.getAllMedia(posts[i]);
                                
            if (fav.coptions.downloader.skipEmpty && !selectedImages.length) {
                log('onDownloadNativeFavPage : skip empty item');
                log(selectedPost);
                continue;
            }
            
            var postTags = [];
            
            if (env.getPostTags && (worker.catByTagList || worker.tagList)) {
                postTags = env.getPostTags(selectedPost);
            }
            
            worker.collectedData.selected_cats_ids = [];
            
            var sm = handler.getStorageManager();
                sm.selectAutoCategories(worker.collectedData, false, selectedImages);
                        
            if (postTags.length > 0 && worker.catByTagList) {
            
                for(var b = 0; b < worker.catByTagList.length; b++) {
                
                    if (postTags.indexOf(worker.catByTagList[b]) != -1) {
                
                        var itemCatId = sm.getCategoryBy(worker.collectedData, worker.catByTagList[b], 'name');
                            itemCatId = itemCatId.id;
                            
                        if (itemCatId == -1) {
                            itemCatId = handler.getStorageManager().categoryCreate(worker.collectedData, worker.catByTagList[b], false);                                
                        }
                        
                        if (itemCatId > 0 && worker.collectedData.selected_cats_ids.indexOf(itemCatId) == -1) {                                
                            worker.collectedData.selected_cats_ids.push(itemCatId);
                        }
                    }
                }
            }
            
            if (env.getPostTags && worker.tagList) {
                       
                if (!postTags.length) {
                    log('onDownloadNativeFavPage : post tag list is empty');
                    log(selectedPost);
                    continue;
                }
                
                var postOk = true;
                
                if (worker.tagList.exclude && worker.tagList.exclude.length > 0) {
                
                    for(var b = 0; b < worker.tagList.exclude.length; b++) {
                        if (postTags.indexOf(worker.tagList.exclude[b]) != -1) {
                            postOk = false;
                            break;
                        }
                    }
                    
                    if (!postOk) {
                        continue;
                    } 
                }                             
                
                if (worker.tagList.include && worker.tagList.include.length > 0) {
                    
                    postOk = false;
                    
                    for(var b = 0; b < worker.tagList.include.length; b++) {
                    
                        if (postTags.indexOf(worker.tagList.include[b]) != -1) {
                            postOk = true;
                            
                            var sm = handler.getStorageManager();
                            
                            var itemCatId = sm.getCategoryBy(worker.collectedData, worker.tagList.include[b], 'name');
                                itemCatId = itemCatId.id;
                                
                            if (itemCatId == -1) {
                                itemCatId = handler.getStorageManager().categoryCreate(worker.collectedData, worker.tagList.include[b], false);                                
                            }
                            
                            if (itemCatId > 0 && worker.collectedData.selected_cats_ids.indexOf(itemCatId) == -1) {                                
                                worker.collectedData.selected_cats_ids.push(itemCatId);
                            }
                            
                            break;
                        }
                        
                    }                    
                } 
                               
                if (!postOk) continue;
            }
            
            var result = getFavItemFromSelected();            
            if (!result.error) {
                
                var postItem = result.postItem;
                
                if (handler.getStorageManager().searchItem(worker.collectedData, postItem) === false) {
                    
                    if (worker.collectedData.selected_cats_ids.length >= 1) {
                        postItem.categoryId = handler.getStorageManager().validateCategories(worker.collectedData.selected_cats_ids, worker.collectedData);
                    }
                    
                    worker.collectedData.ids++;    
                
                    postItem.id = worker.collectedData.ids; 

                    worker.collectedData.items[worker.collectedData.items.length] = postItem;
                    
                    pageInfo.itemsNum++;
                }

            }
        }
        
        // prevent loading images and media
        var cleared = KellyTools.stopMediaLoad(loadDoc);        
        
        favNativeParser.addToLog('добавлено ' + pageInfo.itemsNum + ' элементов');
        
        log(pageInfo.page + ' | ' + pageInfo.itemsNum + ' | cleared res : ' + cleared);
        log('--');        
    
        if (fav.coptions.downloader.autosaveEnabled && !worker.jobBeforeAutosave) {
            
            worker.jobBeforeAutosave = worker.jobAutosave ? worker.jobAutosave : 1000;
            worker.jobSaved = worker.jobSaved ? worker.jobSaved+worker.jobAutosave : worker.jobAutosave;
            worker.saveData(true, 'onDownloadNativeFavPage');            
        }    
    }
    
    this.downloadNativeFavPage = function(el) {
        
        if (!favNativeParser || !favNativeParser.pageInfo) {
            log(env.profile + ' bad bookmarks page info');
            return false;
        }
        
        favNativeParser.errors = '';

        if (favNativeParser.getJobs().length) {
        
            favNativeParser.stop();
            
            setPreventClose(false);
            return false;
        }
                        
        var updateOptions = false;
        
        favNativeParser.collectedData = handler.getStorageManager().getDefaultData();
        
        var pages = KellyTools.getElementByClass(document, env.className + '-PageArray'); 
        
        // for big selections that can oversize localstorage
        
        var autosaveEnabled = KellyTools.getElementByClass(document, env.className + '-exporter-autosave-show');
            autosaveEnabled = autosaveEnabled && autosaveEnabled.checked ? true : false;
            
        if (fav.coptions.downloader.autosaveEnabled != autosaveEnabled) {
            updateOptions = true;
            fav.coptions.downloader.autosaveEnabled = autosaveEnabled;
            
        }
                
        if (autosaveEnabled) {
            
            var autosaveInput = KellyTools.getElementByClass(document, env.className + '-PageAutosave');
            var autosave = KellyTools.val(autosaveInput.value, 'int');
                   
            if (!autosave || autosave <= 1) {
                autosave = 1;
            } 
            
            if (autosave > favNativeParser.maxPagesPerExport) {
                autosave = favNativeParser.maxPagesPerExport;
            }
            
            if (fav.coptions.downloader.autosave != autosave) {
                updateOptions = true;
                fav.coptions.downloader.autosave = autosave;
            }
            
            if (autosave != autosaveInput.value) {
                autosaveInput.value = autosave;
            }
                  
            favNativeParser.jobAutosave = autosave;
            favNativeParser.jobBeforeAutosave = autosave;
            favNativeParser.jobSaved = 0;
            
        }
        
        var customUrl = false;
        var customUrlEl = KellyTools.getElementByClass(document, env.className +'-downloader-option-url');  
        
        if (customUrlEl && customUrlEl.value) {
            var customUrl = KellyTools.val(customUrlEl.value, 'longtext');
            
            if (customUrl) {
                
                if (customUrl.indexOf(window.location.origin) !== 0) {
                    
                    if (customUrl[0] != '/') customUrl = '/' + customUrl;
                    
                    customUrl = window.location.origin + customUrl;                    
                }
                
                customUrlEl.value = customUrl;    
                
                if (favNativeParser.pageInfo.url != customUrl) {
                    favNativeParser.pageInfo.url = customUrl;
                } else customUrl = false;
                
            } else customUrl = false;
        }
        
        var skipEmpty = KellyTools.getElementByClass(document, env.className + '-exporter-skip-empty');
            skipEmpty = skipEmpty && skipEmpty.checked ? true : false;
        
        if (fav.coptions.downloader.skipEmpty != skipEmpty) {
            updateOptions = true;
            fav.coptions.downloader.skipEmpty = skipEmpty;
        }
               
        var pagesList = [];
        
        var message = KellyTools.getElementByClass(document, env.className + '-exporter-process');        
        var saveNotice = KellyTools.getElementByClass(document, env.className + '-exporter-save-result');
        
        message.innerText = '';
        saveNotice.innerText = '';
        
        if (pages && pages.value.length) {
           
            pagesList = KellyTools.getPrintValues(pages.value, true, 1, customUrl ? false : favNativeParser.pageInfo.pages, pages);
            
        } else { 
        
            pagesList = KellyTools.getPrintValues('1-' + favNativeParser.pageInfo.pages, true);
        }    
              
        if (!fav.coptions.downloader.autosaveEnabled && favNativeParser.pageInfo.pages > favNativeParser.maxPagesPerExport && pagesList.length > favNativeParser.maxPagesPerExport ) {
                        
            message.innerText = lng.s('', 'download_limitpages', {MAXPAGESPERIMPORT : favNativeParser.maxPagesPerExport, CURRENTPAGESPERIMPORT : pagesList.length});
            return; 
        }
        
        if (!pagesList.length) {
            message.innerText = lng.s('Выборка пуста', 'selection_empty');
            return;
        }
        
        
        if (KellyTools.DEBUG) {
            var downloaderOptions = favNativeParser.getCfg();            
            var dhtml = '';
            
            var cfgUpdateVals = {length : 0};
            
            for (var k in downloaderOptions){
                var optionVal = KellyTools.getElementByClass(document, env.className +'-downloader-option-' + k);            
                if (!optionVal) continue;
                
                cfgUpdateVals[k] = optionVal.value;
                cfgUpdateVals.length++;
            }
            
            if (cfgUpdateVals.length) {
                favNativeParser.updateCfg(cfgUpdateVals);
            }
            
            // validated data
            downloaderOptions = favNativeParser.getCfg();
            for (var k in downloaderOptions){
                var optionVal = KellyTools.getElementByClass(document, env.className +'-downloader-option-' + k);            
                if (!optionVal) continue;
                optionVal.value = downloaderOptions[k];
            }
        }
        
        for (var i = 0; i < pagesList.length; i++) {
            
            var pageNumber = pagesList[i];
            
            favNativeParser.addJob(
                favNativeParser.pageInfo.url.replace('__PAGENUMBER__', pageNumber), 
                handler.onDownloadNativeFavPage, 
                {page : pageNumber}
            );
        }
        
        var showLogButton = KellyTools.getElementByClass(document, env.className + '-exporter-log-show');
            showLogButton.style.display = 'inline-block';
            
            showLogButton.onclick = function() {
                var log = KellyTools.getElementByClass(document, env.className + '-exporter-log-container');
                
                if (log.style.display == 'none') {
                    log.style.display = 'block';
                } else {
                    log.style.display = 'none';
                }
                
                return false;
            }
        
        var saveFavItemsButton = KellyTools.getElementByClass(document, env.className + '-Save');
            saveFavItemsButton.style.display = 'none';
         
        favNativeParser.tagList = false;
        
        var tagFilter = KellyTools.getElementByClass(document, env.className + '-exporter-tag-filter');
        var tagFilterEnabled = KellyTools.getElementByClass(document, env.className + '-exporter-tag-filter-show');
            tagFilterEnabled = tagFilterEnabled && tagFilterEnabled.checked ? true : false;
        
        if (tagFilterEnabled != fav.coptions.downloader.tagListEnabled) {
            
            fav.coptions.downloader.tagListEnabled = tagFilterEnabled;
            updateOptions = true;
        }
        
        if (fav.coptions.downloader.tagListEnabled && tagFilter) {
            if (tagFilter.value != fav.coptions.downloader.tagList) {
                
                fav.coptions.downloader.tagList = KellyTools.inputVal(tagFilter, 'longtext');                 
                updateOptions = true;
            }
            
            favNativeParser.tagList = KellyTools.parseTagsList(fav.coptions.downloader.tagList);
        }
        
        var catCreate = KellyTools.getElementByClass(document, env.className + '-exporter-create-by-tag');
        var catCreateEnabled = KellyTools.getElementByClass(document, env.className + '-exporter-create-by-tag-show');
            catCreateEnabled = catCreateEnabled && catCreateEnabled.checked ? true : false;
        
        if (catCreateEnabled != fav.coptions.downloader.catByTagListEnabled) {
            fav.coptions.downloader.catByTagListEnabled = catCreateEnabled;
            updateOptions = true;
        }
        
        if (fav.coptions.downloader.catByTagListEnabled && catCreate) {
            if (catCreate.value != fav.coptions.downloader.catByTagList) {
                
                fav.coptions.downloader.catByTagList = KellyTools.inputVal(catCreate, 'longtext');                 
                updateOptions = true;
            }
            
            favNativeParser.catByTagList = KellyTools.parseTagsList(fav.coptions.downloader.catByTagList);
            if (favNativeParser.catByTagList && favNativeParser.catByTagList.include && favNativeParser.catByTagList.include.length != 0) {
                favNativeParser.catByTagList = favNativeParser.catByTagList.include;
            } else {
                favNativeParser.catByTagList = false;
            }
        }
        
        if (updateOptions) {
            handler.save('cfg');
        }
        
        favNativeParser.addToLog('Инициализация...', true);
        el.innerText = lng.s('Загрузка... (Отменить)', 'download_started_cancel');  
        
        log('download native page started');
        log('Include Tag list :');
        log(favNativeParser.tagList);

        // add beforeunload
        
        setPreventClose(true);
        favNativeParser.exec();        
    }
    
    // todo - move parser to separate class
    
    this.getBookmarksParser = function() {
        
        if (favNativeParser) return favNativeParser;
        
        favNativeParser = new KellyThreadWork({env : handler});          
        favNativeParser.setEvent('onEnd', handler.onDownloadNativeFavPagesEnd);
        favNativeParser.maxPagesPerExport = 1000;
        favNativeParser.pageInfo = env.getFavPageInfo ? env.getFavPageInfo() : false;
        
        favNativeParser.addToLog = function(txt, clear) {
            
            txt = '[' + KellyTools.getTime() + '] ' + txt;
            
            var logEl = KellyTools.getElementByClass(favNativeParser.pageInfo.container, env.className + '-exporter-log');
            if (clear) {
                
                KellyTools.setHTMLData(logEl, txt + '<br>');
                logEl.setAttribute('data-lines', 0);
                
            } else {
                
                var text = document.createTextNode(txt), logNewLine = document.createElement('br'), logNum = parseInt(logEl.getAttribute('data-lines'));  
                
                if (!logNum) logNum = 0;                
                if (logNum > 1000) {
                    
                    logEl.innerHTML = '';
                    logEl.setAttribute('data-lines', 0);
                    logNum = 0;
                }
                                    
                logEl.appendChild(text);
                logEl.appendChild(logNewLine);                
                logEl.setAttribute('data-lines', logNum+1);
            }
        }
        
        favNativeParser.saveData = function(autosave, source) {
            
            log('favNativeParser : save current progress : ' + (autosave ? 'autosave - saved ' + favNativeParser.jobSaved  : 'click'));
            
            if (source) log('favNativeParser : source ' + source );
            
            if (favNativeParser.collectedData.selected_cats_ids) {
                delete favNativeParser.collectedData.selected_cats_ids;
            }
                    
            var fname = fav.coptions.baseFolder + '/' + handler.getStorageManager().dir.exportBookmark;
                fname += 'db_';
                                    
            if (favNativeParser.pageInfo.contentName) fname += '_' + favNativeParser.pageInfo.contentName;
            
            fname += '_' + KellyTools.getTimeStamp();
            
            if (autosave) {
                fname += '__page_' + favNativeParser.jobSaved;
                favNativeParser.addToLog('Автосохранение после ' + favNativeParser.jobSaved + ' страниц');
            }
            
            fname += '.' + handler.getStorageManager().format;            
            fname = KellyTools.validateFolderPath(fname);                    
            
            handler.getDownloadManager().createAndDownloadFile(JSON.stringify(favNativeParser.collectedData), fname);

            if (autosave) {
                favNativeParser.collectedData = handler.getStorageManager().getDefaultData();
            }
        }
        
        return favNativeParser;
    }
    
    this.showNativeFavoritePageInfo = function() {
        
        if (!env.getFavPageInfo) {
            log(env.profile + ' not support native downloads');
            return false;
        }        
        
        var favPageInfo = handler.getBookmarksParser().pageInfo;     
        if (!favPageInfo || !favPageInfo.items) {
            return false;
        }
                              
        var saveBlock = '\
            <div class="' + env.className + '-Save" style="display : none;">\
                <p>' + lng.s('', 'download_save_notice') + '</p>\
                <a href="#" class="' + env.className + '-exporter-button-addtoprofile ' + env.className + '-buttoncolor-dynamic" >' + lng.s('Добавить картинки в отдельный профиль', 'storage_parser_save_to_profile') + '</a>\
                <a href="#" class="' + env.className + '-exporter-button-save" >' + lng.s('Скачать как файл профиля', 'download_save') + '</a>\
            </div>\
            <div class="' + env.className + '-exporter-save-result"></div>';
        
        var items = favPageInfo.items;
        if (favPageInfo.pages > 2) { 
            items = '~' + items;
        }
        
        // для текстовый публикаций делать заголовок через метод setSelectionInfo
        
        var tagFilterHtml = '';
        
        var tags = fav.coptions.downloader.tagList ? fav.coptions.downloader.tagList : '';
        var createByTags = fav.coptions.downloader.catByTagList ? fav.coptions.downloader.catByTagList : '';
        var autosave = fav.coptions.downloader.autosave ? fav.coptions.downloader.autosave : handler.getBookmarksParser().maxPagesPerExport;
        
        if (env.getPostTags) {
        
            tagFilterHtml = '\
                <label><input type="checkbox" class="' + env.className + '-exporter-tag-filter-show" ' + ( fav.coptions.downloader.tagListEnabled ? 'checked' : '' ) + '> ' + lng.s('Применять фильтрацию по тегам', 'download_tag_filter_show') + '</label>\
                <div class="' + env.className + '-exporter-tag-filter-container" style=" ' + (  fav.coptions.downloader.tagListEnabled ? '' : 'display : none;' ) + '">'
                    + lng.s('', 'download_tag_filter_1') + '<br>'
                    + lng.s('Если теги не определены, выполняется сохранение всех публикаций', 'download_tag_filter_empty') 
                    + '</br>\
                    <textarea class="' + env.className + '-exporter-tag-filter" placeholder="' + lng.s('Фильтровать публикации по списку тегов', 'download_tag_filter') + '">' + tags + '</textarea>\
                </div>\
            ';
            
            tagFilterHtml += '\
                <label><input type="checkbox" class="' + env.className + '-exporter-create-by-tag-show" ' + ( fav.coptions.downloader.catByTagListEnabled ? 'checked' : '' ) + '> ' + lng.s('Автоматически создавать категории для тегов', 'download_createc_by_tag') + '</label>\
                <div class="' + env.className + '-exporter-create-by-tag-container" style="' + (  fav.coptions.downloader.catByTagListEnabled ? '' : 'display : none;' ) + '">'
                    + lng.s('Если публикация содержит один из перечисленных в поле тегов, к публикации будет добавлена соответствующая категория', 'download_createc_1') + '<br>'
                    + '</br>\
                    <textarea class="' + env.className + '-exporter-create-by-tag" placeholder="' + lng.s('Автоматически создавать категории для тегов', 'download_createc_by_tag') + '">' + createByTags + '</textarea>\
                </div>\
            ';
        }
        
        var downloaderOptions = handler.getBookmarksParser().getCfg();
        
        // настройки для отладки \ скрытые настройки
                    
        var dhtml = '<table><tbody>';
        
        for (var k in downloaderOptions){
             dhtml += '<tr><td>' + k + ' :</td><td><input type="text" value="' + downloaderOptions[k]+ '" class="' + env.className +'-downloader-option-' + k + '"></td></tr>';
        }   
        
        dhtml +=  '<tr><td>Ссылка :</td><td><input type="text" value="' + favPageInfo.url + '" class="' + env.className + '-downloader-option-url"></td></tr>';
        dhtml += '</tbody></table>';
        
        var autosaveHtml = '\
            <label>\
                <input type="checkbox" class="' + env.className + '-exporter-autosave-show" ' + (fav.coptions.downloader.autosaveEnabled ? 'checked' : '') + '> \
                ' +  lng.s('Автоматически сохранять в отдельный файл через указанное число страниц', 'download_pages_autosave') + '\
            </label>\
            <div class="' + env.className + '-exporter-autosave-container" style="display : ' + (fav.coptions.downloader.autosaveEnabled ? 'block' : 'none') + ';">\
                <input class="' + env.className +'-PageAutosave" type="text" placeholder="" value="' + autosave + '">\
            </div>\
        ';            
        
        var html = '\
            <input type="submit" value="' +  lng.s('выгрузить в профиль данных', 'download_form_open') + '" class="' + env.className + '-exporter-form-show">\
            <div class="' + env.className + '-exporter-container hidden">\
                 ' +  lng.s('Страниц', 'pages_n') + ' : ' + favPageInfo.pages + ' (' + items + ')<br>\
                 ' +  lng.s('Укажите список страниц выборки, которые необходимо скачать. Например 2, 4, 66-99, 44, 78, 8-9, 29-77 и т.п.,', 'download_example') + '<br>\
                 ' +  lng.s('Если нужно захватить все страницы оставьте не заполненным', 'download_tip') + '<br>\
                 <input class="' + env.className +'-PageArray" type="text" placeholder="' + lng.s('Страницы', 'pages')+ '" value="">\
                 ' + autosaveHtml + '\
                 <label><input type="checkbox" class="' + env.className + '-exporter-skip-empty" ' + (fav.coptions.downloader.skipEmpty ? 'checked' : '') + '> ' +  
                    lng.s('Пропускать публикации не имеющие медиа данных (текст, заблокировано цензурой)', 'download_skip_empty') +
                 '</label>\
                 ' + tagFilterHtml + '\
                 ' + saveBlock + '\
                 <div class="' + env.className + '-exporter-buttons">\
                    <a href="#" class="' + env.className + '-exporter-button-start">' + lng.s('Запустить скачивание страниц', 'download_start') + '</a>\
                    <a href="#" class="' + env.className + '-exporter-log-show" style="display : none;">' + lng.s('Показать лог', 'download_log') + '</a>\
                    <a href="#" class="' + env.className + '-tech-options-show" style="' + (!KellyTools.DEBUG ? 'display : none;' : '') + '">' + lng.s('Options', 'hidden_options') + '</a>\
                 </div>\
                 <div class="' + env.className + '-tech-options hidden">\
                    ' + dhtml + '\
                 </div>\
                 <div class="' + env.className + '-exporter-process"></div>\
                 <div class="' + env.className + '-exporter-log-container" style="display : none;">\
                    <div class="' + env.className + '-exporter-log"></div>\
                 </div>\
            </div>\
        ';    
        
        KellyTools.setHTMLData(favPageInfo.container, html);
        
        if (KellyTools.DEBUG) {
            var showHiddenOptBtn = KellyTools.getElementByClass(favPageInfo.container, env.className + '-tech-options-show');
                showHiddenOptBtn.onclick = function() {
                    KellyTools.toogleActive(KellyTools.getElementByClass(favPageInfo.container, env.className + '-tech-options'));
                    return false;
                }       
        }

        var showFormBtn = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-form-show');
            showFormBtn.onclick = function() {
                KellyTools.toogleActive(KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-container'));
                return false;
            }
            
            KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-autosave-show').onchange = function() {
                
                var el = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-autosave-container');
                    el.style.display = this.checked ? 'block' : 'none'; 
                    
                return false;
            }  
            
        if (env.getPostTags) {
            KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-tag-filter-show').onchange = function() {
                
                var el = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-tag-filter-container');
                    el.style.display = this.checked ? 'block' : 'none'; 
                
                return false;
            };
            
            KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-tag-filter').onchange = function() {
                var list = KellyTools.parseTagsList(this.value);
                
                var value = KellyTools.varListToStr(list.include, 'string', ', ');
                if (list.exclude.length) value += (value ? ', ' : '') + '-' + KellyTools.varListToStr(list.exclude, 'string', ', -');

                this.value = value;
                
                if (this.value != fav.coptions.downloader.tagList) {
                    fav.coptions.downloader.tagList = this.value;
                    handler.save('cfg');
                }
                
                return false;
            };
            
            KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-create-by-tag').onchange = function() {
                
                var list = KellyTools.parseTagsList(this.value);                
                var value = KellyTools.varListToStr(list.include, 'string', ', ');
                this.value = value;
                
                if (this.value != fav.coptions.downloader.catByTagList) {
                    fav.coptions.downloader.catByTagList = this.value;
                    handler.save('cfg');
                }
                
                return false;
            };
            
            KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-create-by-tag-show').onchange = function() {
                
                var el = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-create-by-tag-container');
                    el.style.display = this.checked ? 'block' : 'none'; 
                
                return false;
            };
        }            
        
        KellyTools.getElementByClass(document, env.className + '-exporter-button-start').onclick = function() {
            handler.downloadNativeFavPage(this);
            return false;
        };
        
    }
    
    this.formatPostContainers = function(container) {
        
        var publications = env.getPosts(container);
        for (var i = 0; i < publications.length; i++) env.formatPostContainer(publications[i]);
    }
    
    this.initExtensionResources = function() {
        
        var onLoadCssResource = function(response) {
            
            // console.log(response.url);
            
            if (!response || response.data === false) {    
                log('onLoadCssResource : bad init data');
                return false;
            }
            
            if (!response.data.css) {                
                log('onLoadCssResource : css empty');
                log('onLoadCssResource : Browser API response : ' + response.data.notice);                
                return false; 
            }
            
            handler.addCss(KellyTools.replaceAll(response.data.css, '__BASECLASS__', env.className));             
            handler.isDownloadSupported = response.isDownloadSupported;
                 
            if (!handler.isDownloadSupported) {
                
                log('browser not support download API. Most of functional is turned OFF');
                
                if (fav.coptions && fav.coptions.fastsave) {
                    fav.coptions.fastsave.enabled = false;
                }
            }
                      
            initWorktop();
                        
            if (env.events.onExtensionReady) env.events.onExtensionReady();
        };
        
        KellyTools.getBrowser().runtime.sendMessage({method: "getCss", items : ['main', env.profile], debug : fav.coptions.debug}, onLoadCssResource);        
        return true;
    }
        
    this.initFormatPage = function() {
        
        if (init) return false;
        init = true;
        
        if (env.events.onPageReady && env.events.onPageReady()) return false;        
        if (!env.getMainContainers()) return false;
        
        if (!KellyTools.getBrowser()) {        
            log('Fail to get API functions, safe exit from page ' + document.title, KellyTools.E_ERROR);
            return false; 
        }
                	
        // parallel with load resources in initCss
        
        KellyTools.getBrowser().runtime.onMessage.addListener(getApiMessage);
        KellyTools.addEventPListener(document.body, "keyup", function (e) {
            
            if (!e.target || e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') return;
            
            var c = e.keyCode - 36, right = c == 3 || c == 32 || c == 68 || c == 102, left = c == 1 || c == 29 || c == 65 || c == 100;
         
            if (mode  == 'fav') {
                
                // disable if already view any image
                
                if (handler.getTooltip().isShown() == 'categoryEdit') return;                
                if (imgViewer && imgViewer.getCurrentState().shown) return;
                
                if (right) {    
                    handler.goToFavPage('next');
                } else if (left) {                
                    handler.goToFavPage('prev');
                }             
            }
            
        }, 'next_fav_page');            
        
        // currently we can modify post containers without waiting css, looks fine
        handler.formatPostContainers();
        handler.initExtensionResources();
        return false;
    }
    
    constructor(cfg);
}

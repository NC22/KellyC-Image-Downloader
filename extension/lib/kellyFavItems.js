// part of KellyFavItems extension

function KellyFavItems(cfg) 
{
    var handler = this;       
    var env = false;
    
    // выбранная для добавления в закладки публикация, из этих данных формируется элемент для createDbItem
    
    var selectedPost = false, selectedImages = false, selectedComment = false;
    var selectedInfo = false; // какие-либо мета данные сохраняемые для определенной публикации (добавлять методом setSelectionInfo) 
    
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
    var favContent = false; // main extension container
    var imagesBlock = false;
    var submenuItems = false;
    var menuButtons = [];
    
    var mode = 'main'; // current extension page, main - not in extension, fav - show favourites, ctoptions - show extension options 
    
    // todo - replace single env.events by some thing like addEventListener method ?
    // todo - move BookmarksParser to separate class
    
    // Фильтры в режиме просмотра избранного    
    // исключать из выборки публикации по типу
    
    var excludeFavPosts = false;
    var excludeFavComments = false;
    
    var logic = 'and'; 
    var catFilters = [];
    var catFilterNot = false; // режим добавления категорий в список исключения при выборке 
    var catIgnoreFilters = [];
    var aFilters = false;
    
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
        items      - array of objects [.categoryId (array), .link (string), .pImage (string|array of strings), .commentLink (undefined|text) (see storage manager createDbItem method)
        coptions   - structured data (see this.load method for list of current available options)
        profile    - profile name taken from env.profile
        ids        - current ids counter
    */  
    
    var fav = {};
    
    this.mobileOptimization = false; // FALSE | If page optimized for mobile, contains additional settings for grid display if page was optimized for mobile 
    this.allowMobile = false; // TRUE | FALSE | Is auto mobile optimization enabled (display modalBoxes inline, adds "mobile" class) on initFormatPage for devices with < 1080px screen width
    
    this.isDownloadSupported = false;  
    
    this.proportionsUpdateCfg = {accurCheck : 0.05, lastLoadedItems : []};
    
    this.sideBarLock = false;
    this.tooltipBeasy = false; // set true if shown something important throw handler.getTooltip() with close button, prevent create another tooltips onmouseover and hide onmouseout, until close section
    this.dataFilterLock = false;
    
    // buffer for page loaded as media resource
    var selfData = false, selfUrl = window.location.href;
   
    var imageGrid = false; // see getImageGrid method
    var imageEvents = { // image grid custom events
        
        saveImageProportions : function() {
             
            if (handler.proportionsUpdateCfg.lastLoadedItems.length) {
                
                log('save new proportions for items');                  
                handler.proportionsUpdateCfg.lastLoadedItems = [];
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
            var aspectRatioCached = item.pw && item.ph ? item.pw / item.ph : false;
            
            // item proportions never was cached or missmatched with actual loaded image proportions (cache needed to build grid without waiting load images)
            
            if (!aspectRatioCached || (handler.proportionsUpdateCfg.accurCheck && Math.abs(aspectRatioCached - aspectRatio) > handler.proportionsUpdateCfg.accurCheck)) {
                
                handler.proportionsUpdateCfg.lastLoadedItems.push(fav.items[favItemIndex].id); // added to list of fav elements that was updated
                
                item.pw = imageWH.width;
                item.ph = imageWH.height;                
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
        
        if (typeof cfg.allowMobile != 'undefined') handler.allowMobile = cfg.allowMobile ? true : false;
        
        env = cfg.env;
        env.setLocation(cfg.location ? cfg.location : { href : '', protocol : 'http:', host : ''});          
        env.setFav(handler);     
    }
    
    this.exec = function() {
    
        if (!env) {
            log('empty environment attribute or profile name', KellyTools.E_ERROR);
            return false;
        }
        
        if (env.isDomainMatch && !env.isDomainMatch()) return false;
        
        var isMedia = document.contentType.indexOf('image') === 0 || document.contentType.indexOf('video') === 0;
        var childFrame = window.location !== window.parent.location;
        if (isMedia && childFrame) {
            
             // for Iframe hook, may be removed in future because of WebRequest API replacement 
            log(KellyTools.getProgName() + ' load as media item helper | profile ' + env.profile);
            KellyTools.addEventPListener(window, "message", getMediaMessage, 'input_message_');             
            window.parent.postMessage({filename : KellyTools.getUrlFileName(selfUrl, false, true), method : 'mediaReady'}, "*");
            
        } else if (!isMedia && !childFrame) {
            
            handler.load('cfg', function() {
                
                if (fav.coptions.disabled && env.hostClass != 'options_page') {
                    log('Site module is disabled - turn off');
                    return;
                }
                
                handler.load('items', function() {
                    handler.initFormatPage();
                    KellyTools.addEventPListener(window, "load", function() {
                        if (env.getMainContainers()) {
                            log('full page load, reinit post containers');
                            handler.formatPostContainers();                            
                        }
                    }, 'init_');                            
                }); 
            });
            
            log(KellyTools.getProgName() + ' init | loaded | profile ' + env.profile + ' | DEBUG ' + (KellyTools.DEBUG ? 'enabled' : 'disabled'));           
        }
        
        return true;
    }
        
    function getMediaMessage(e) {
        
        if (!e.data || !e.data.method) return false;
        if (e.data.method.indexOf('getMedia') != -1) { // get self as blob
        
            KellyTools.xmlRequest(selfUrl, false, function(urlOrig, blob, errorCode, errorText, controller) {
                
                var response = {filename : KellyTools.getUrlFileName(selfUrl, false, true), method : 'sendResourceMedia', error : blob === false ? '[' + errorCode + ']' + errorText : false, base64 : false};
                if (blob !== false) {
                    
                    KellyTools.blobToBase64(blob, function(base64) {  
                         response.type = document.contentType; response.base64 = base64;
                         window.parent.postMessage(response, "*");                        
                    });                             
                    
                } else window.parent.postMessage(response, "*");
            });
        }
    }
    
    function setPreventClose(active) {
        
        KellyTools.log('setPreventClose - new state - [' + (active ? 'CLOSE BLOCKED' : 'CLOSE UNLOCKED') + ']');
        KellyTools.injectAddition('dispetcher', function() {          
            window.postMessage({kelly_dynaminc : true, method : 'kelly_dynaminc.' + (active ? 'bind' : 'unbind') + '.beforeunload'}, "*");             
        });
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
            if (!checkDataFilterLock()) return false;
            
            handler.load('items', function() {
                
                handler.updateFavCounter();   
                handler.formatPostContainers();
                
                if (mode == 'fav') {
                    page = 1;
                    handler.showFavouriteImages();
                    //handler.hideFavoritesBlock();
                }                              
            }, true); 
            
            if (onReload) {
                onReload();
            } else {
                handler.closeSidebar();  
            } 
            
            return false; 
        }
         
        var onCancelCommon = function() {
            if (!checkDataFilterLock()) return false;
            
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
    
    this.getFastSave = function() {
        if (!fastSave) {
            
            fastSave = new KellyFastSave();
            fastSave.favEnv = handler;
        }
        
        return fastSave;
    }
    
    this.getToolbar = function() {
        
        if (handler.toolbar) return handler.toolbar;
        if (typeof KellyToolbar == 'undefined') return false;        
        
        handler.toolbar = new KellyToolbar({
            className : env.className + '-toolbar',
            collapsed : fav.coptions.toolbar.collapsed, 
            container : document.createElement('DIV'), 
            favController : handler,
            heartHidden : fav.coptions.toolbar.heartHidden, 
        });        
        
        env.getMainContainers().body.appendChild(handler.toolbar.container);
        return handler.toolbar;
    }
    
    this.getImageViewer = function() {
        
        if (imgViewer) return imgViewer;
        
        var imgView = document.createElement('div');
            imgView.className = env.className + '-ImgView';
            
            imgViewer = new KellyImgView({
                className : env.className + '-ImgView', 
                viewerBlock : imgView, 
                lazyHand : true,
                zoomByMouse : true,
                lockMoveMethod : 'lockMove',
                userEvents : {
                    
                    onClose : function() {
                        if (imgViewer.tooltip) imgViewer.tooltip.show(false);
                    },
                    
                    onNextImage : function(self, nextImage, action) {                        
                        if (imgViewer.tooltip) imgViewer.tooltip.show(false);
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
        
        imgViewer.addBaseButtons();
        addImageInfoTip(imgViewer.addButton('?', 'info', function() { }));
                
        env.getMainContainers().body.appendChild(imgView);
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
                    
                    if (env.events.onGridBadBounds) {
                        var envResult = env.events.onGridBadBounds(self, data);
                        if (envResult !== true) return envResult;
                    }    
                    
                    if (!data.tile.getAttribute('data-load-fail-notifyed')) {
                        log('onBadBounds - error : ' + data.error); log(data.tile);
                        data.tile.setAttribute('data-load-fail-notifyed', 1);
                    }
                    
                    // картинка была удалена с сервера \ ошибка загрузки \ нарушены пропорции
                    
                    if (data.errorCode == 2 || data.errorCode == 3 || data.errorCode == 4) {
                        
                        var altBounds = {width : 200, height : 200}, elBounds = altBounds;
                        if (data.boundEl.getAttribute('data-width')) elBounds = {width : parseInt(data.boundEl.getAttribute('data-width')), height : parseInt(data.boundEl.getAttribute('data-height'))};
                        
                        if (data.errorCode == 4 && Math.min(elBounds.width, elBounds.height) >= 200) { // oversized - turn to quad, keep original smaller side length with 200px min value
                            altBounds.width = Math.min(elBounds.width, elBounds.height); 
                            altBounds.height = altBounds.width; 
                        }
                        
                        // keep original size cases 
                        
                        if ((data.errorCode == 4 && fav.coptions.grid.type == 'fixed' && fav.coptions.grid.fixed == 1) || // oversized, and show 1 element per row
                             data.errorCode == 2 // load fail | todo - maybe add reload attempt (503 error gone away after few seconds)
                        ) {
                            altBounds.width = elBounds.width;
                            altBounds.height = elBounds.height; // события onload \ onerror сохраняются                            
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
                    
                    if (env.events.onGridUpdated) env.events.onGridUpdated(self, isAllBoundsLoaded);    
                    
                    if (isAllBoundsLoaded) imageEvents.saveImageProportions();
                },
                
                // для одного из элементов сетки загружены пропорции
                
                onLoadBounds : function(self, boundEl, state) {
                    
                    if (env.events.onGridLoadBounds) env.events.onGridLoadBounds(self, boundEl, state); 
                    
                    // check proportions of bound element and if its changed - update tile grid after
                    
                    return imageEvents.onLoadFavGalleryImage(boundEl, state == 'error' ? true : false);
                },
                
                onResizeImage : function(self, itemInfo) {
                    
                    var result = env.events.onGridResizeImages ? env.events.onGridResizeImages(self, itemInfo) : -1;
                    if (typeof result == 'boolean') return result; 
                    
                    if (!itemInfo.tile || !itemInfo.boundEl || itemInfo.boundEl.tagName != 'IMG') return false;
                    
                    // hide buttons for small image blocks
                    
                    if (itemInfo.width < 140) {
                        var showPostBtn = KellyTools.getElementByClass(itemInfo.tile, env.className + '-FavItem-overlay-button');
                        if (showPostBtn) showPostBtn.style.display = 'none';
                    }
                    
                    if (!itemInfo.boundEl.getAttribute('data-width')) return false; // not loaded
                    
                    var checkDiff = function(maxWidth, width) { 
                        return (maxWidth - width) / (maxWidth / 100); // retrun difference in percent
                    }
                    
                    var src = itemInfo.boundEl.getAttribute('data-src') ? itemInfo.boundEl.getAttribute('data-src') : itemInfo.boundEl.src;
                    if (src.indexOf('.svg') != -1) return false;
                    
                    if ((itemInfo.width > itemInfo.origWidth && checkDiff(itemInfo.width, itemInfo.origWidth) > 25) || 
                        (itemInfo.height > itemInfo.origHeight && checkDiff(itemInfo.height, itemInfo.origHeight) > 25)) {
                        
                        // addition class for extra small images that cant fit to current resized grid    
                        itemInfo.boundEl.classList.add(env.className + '-preview-small');
                        itemInfo.tile.classList.add(env.className + '-FavItem-small');
                        
                        if (fav.coptions.grid.type == 'fixed' && fav.coptions.grid.fixed == 1) { // grid show one el per row - dont use calculated height, and set manualy to prevent big white spaces
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
                    closeByBody : false,
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
        
        type = false - load cfg and items
    */
    
    this.load = function(type, onAfterload, context) {
                
        var onLoadItems = function(itemsDb) {
            
            if (!itemsDb) {
                itemsDb = sm.getDefaultData(); 
                log('load() ' + fav.coptions.storage + ' db not exist, default used');                
            }
            
            for (var key in itemsDb) {
                if (sm.favValidKeys['items'].indexOf(key) == -1) {
                    log('load() data key ' + key + ' skipped. Only ITEMS keys is allowed');
                } else fav[key] = itemsDb[key];
            }
            
            handler.resetFilterSettings();
            fav.selected_cats_ids = sm.validateCategories(fav.selected_cats_ids, fav);
            sm.validateDBItems(fav);
            
            fav.cats_assoc_buffer = false;
            fav.profile = env.profile;
            
            if (type == 'items' || !type) {
                if (env.events.onStorageAfterload && env.events.onStorageAfterload(fav, type, context, onAfterload)) return;
                if (onAfterload) onAfterload(fav);
            }
        }

        var onLoadConfig = function (config) {
            
            if (config) { 
                for (var k in config) fav[k] = config[k];                
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
                if (env.events.onStorageAfterload && env.events.onStorageAfterload(fav, type, context)) return;
                if (onAfterload) onAfterload(fav);
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
    
        log('save() [' + type + '] process - [initiated]');
        var notSaved = (!type) ? 2 : 1 ; // save items data + config by default
        
        if (!type || type == 'items') {
        
            handler.getStorageManager().saveDB(fav.coptions.storage, { 
                categories : fav.categories, 
                items : fav.items,  
                ids : fav.ids,
                profile : fav.profile,
            }, function(error) {
                  log('save() save [ITEMS] to storage [Result : ' + (error ? error : 'OK') + ']');
                  notSaved--;
                  if (!notSaved && onSave) onSave(error);
            });
        }
        
        if (!type || type == 'cfg') {
        
            handler.getStorageManager().saveDB('config', { 
                selected_cats_ids : fav.selected_cats_ids, 
                coptions : fav.coptions
            }, function(error) {
                 log('save() save [CFG] to storage [Result : ' + (error ? error : 'OK') + ']');                 
                 notSaved--;
                 if (!notSaved && onSave) onSave(error);
            }, true);
        }
    }
    
    this.getFavPageListCount = function() {
       
        if (!displayedItems || !displayedItems.length) return 1;
        
        return Math.ceil(displayedItems.length / fav.coptions.grid.perPage);
    }
    
    this.goToFavPage = function(newPage) {
        
        if (page == newPage) return false;
        if (handler.tooltipBeasy) return false;
        
        if (!imagesBlock) return false;
        
        var totalPages = handler.getFavPageListCount();
        if (totalPages <= 1) return false;
                      
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
          
        var autoScrollRow = fav.coptions.grid.autoScroll;            
        if (autoScrollRow) {
            
            var tiles = handler.getImageGrid().getTiles();   
            if (tiles && tiles.length) {
                
                var scrollTop = KellyTools.getScrollTop(), screenBottom = scrollTop + KellyTools.getViewport().screenHeight;
                var currentRow = 0, topItemBounds = false;
                
                for (var i = 0; i < tiles.length; i++) {
                    
                    if (tiles[i].className.indexOf('grid-last') == -1) continue;
                    
                    var itemBounds = tiles[i].getBoundingClientRect();
                    if (!topItemBounds) topItemBounds = itemBounds;                        
                    
                    if (itemBounds.top + scrollTop < screenBottom) {
                        currentRow++;
                    }
                }
                
                if (topItemBounds && currentRow >= autoScrollRow) window.scrollTo(0, topItemBounds.top + scrollTop - 90);
            }
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
    
    this.showItemInfo = function(item) {    
        if (!item) return false;
    
        var text = lng.s('Запись №__ITEMN__', 'item_number', {ITEMN : item.id}) + '<br>';               
        if (item.pw) text += item.pw + 'x' + item.ph + ' (' + lng.s('Кэш  пропорций : ', 'cache_wh') + ')';
        
        text += '<div class="' + env.className + '-ItemTip-controll">';
        
        if (item.relatedDoc) text += '<a href="' + item.relatedDoc + '" target="_blank">' + lng.s('Документ', 'related_doc') + '</a>' + '<br>';  
        else if (item.link) text += '<a href="' + KellyTools.validateUrlForLocation(item.link, env.location) + '" target="_blank">' + lng.s('Показать пост', 'go_to_publication') + '</a>' + '<br>';        
        if (item.commentLink)  text += '<a href="' + KellyTools.validateUrlForLocation(item.commentLink, env.location) + '" target="_blank">' + lng.s('Показать комментарий', 'go_to_comment') + '</a>' + '<br>';
        
        text += '</div>';
        
        if (typeof item.pImage != 'string' && item.pImage.length > 1) {
            
            text += lng.s('Изображений : __IMAGEN__', 'image_total', {IMAGEN : item.pImage.length}) + '<br>';
            text += '<ul class="'+ env.className +'-ItemTip-images">';            
            
                for (var i = 0; i < item.pImage.length; i++) {
                
                    var imgTitle = lng.s('Изображение __IMAGEN__', 'image', {IMAGEN : i});
                    if (i == 0) imgTitle = lng.s('Основное изображение', 'image_main');
                                     
                    text += '<li><a href="' + env.getImageDownloadLink(item.pImage[i], true) + '" target="_blank"><img \
                             class="' + env.className + '-ItemTip-image" \
                             src="' + env.getStaticImage(env.getImageDownloadLink(item.pImage[i], false)) + '" \
                             alt="' + imgTitle + '" \
                             itemIndex="' + fav.items.indexOf(item) + '" \
                             kellyGallery="collection" \
                             kellyGalleryIndex="' + i + '" \
                            ></a></li>';  
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
        
        var getCurrentViewedImage = function(state) {
            if (state.imageData) {        
                if (typeof state.imageData.pImage != 'undefined') return state.imageData;
                else return state.imageData[state.cursor];
            } else return false;
        }
                
        el.onclick = function() {
            
            var state = imgViewer.getCurrentState(), item = getCurrentViewedImage(state);
            if (state.beasy || !state.shown || !item) {
                if (imgViewer.tooltip) imgViewer.tooltip.show(false);
                return false;
            }
        
            imgViewer.tooltip = new KellyTooltip({
                target : this, offset : {left : 0, top : 40}, 
                positionY : 'bottom', positionX : 'left',				
                ptypeX : 'inside', ptypeY : 'outside',
                closeButton : true, avoidOutOfBounds : true, removeOnClose : true, closeByBody : true,
                selfClass : env.hostClass + ' ' + env.className + '-ItemTip-tooltipster',
                classGroup : env.className + '-tooltipster',
                events : { 
                    onClose : function(self) {imgViewer.tooltip = false; KellyTools.stopMediaLoad(self.getContent());}
                }
            });
           
            KellyTools.setHTMLData(imgViewer.tooltip.getContent(), handler.showItemInfo(item));                 
            handler.setShowCollectionEvent(imgViewer.tooltip.getContent().getElementsByClassName(env.className + '-ItemTip-image'));
            imgViewer.tooltip.show(true);
            return false;
        }
    }
    
    function initWorktop() {
        
        if (env.events.onInitWorktop && env.events.onInitWorktop()) return true;    
        handler.getImageGrid(); 
        
        var envContainers = env.getMainContainers();
        var modalClass = env.className + '-ModalBox';
        
        sideBarWrap = document.createElement('div');
        sideBarWrap.id = env.className + '-sidebar-wrap';
        sideBarWrap.className = env.className + '-sidebar-wrap ' + env.className + '-sidebar-wrap-hidden ' + env.hostClass; 
        
        var modalBoxHTML  = '<div class="' + modalClass + ' ' + modalClass +'-section ' + modalClass +'-main" data-title="sidebar_section_filters">';
            modalBoxHTML += '<div class="' + modalClass + '-header">\
                                <a href="#" class="' + modalClass + '-hide-preview hidden" ></a>\
                                <a href="#" class="' + modalClass + '-close">' + lng.s('Закрыть', 'close') + '</a>\
                            </div>';
            modalBoxHTML += '<div class="' + modalClass + '-content"></div>';                                
            modalBoxHTML += '<div class="' + modalClass + '-message"></div>';
            modalBoxHTML += '</div>';
                    
        var downloaderHTML = '\
            <div class="' + modalClass + '-wrap ' + modalClass + '-wrap-downloader hidden">\
                <div class="' + modalClass + ' ' + modalClass +'-section ' + modalClass + '-downloader" data-title="sidebar_section_downloads">\
                    <div class="' + modalClass + '-content ' + modalClass + '-downloader-content"></div>\
                </div>\
            </div>\
        ';
        
        var collapseButtonHTML = '<div class="' + env.className + '-sidebar-collapse">' + lng.s('Свернуть', 'collapse') + '</div>';
        
        KellyTools.setHTMLData(sideBarWrap, modalBoxHTML + downloaderHTML + collapseButtonHTML);
            
        modalBox = KellyTools.getElementByClass(sideBarWrap, modalClass + '-main');
        modalBoxContent = KellyTools.getElementByClass(modalBox, modalClass + '-content');
        modalBoxMessage = KellyTools.getElementByClass(modalBox, modalClass + '-message');
        
        downloaderBox = {
            modal : KellyTools.getElementByClass(sideBarWrap, modalClass + '-wrap-downloader'),
            content : KellyTools.getElementByClass(sideBarWrap, modalClass + '-downloader-content'),
        }; 
        
        var collapseButton = KellyTools.getElementByClass(sideBarWrap, env.className + '-sidebar-collapse'); // compatibility button, shows only if needed by profile
            collapseButton.onclick = function() {
                var collapsed = this.getAttribute('data-collapsed'), modalBoxes = sideBarWrap.getElementsByClassName(env.className + '-ModalBox');
                this.setAttribute('data-collapsed', collapsed ? '' : '1');
                
                for (var i = 0; i < modalBoxes.length; i++) KellyTools.classList(collapsed ? 'remove' : 'add', modalBoxes[i], env.className + '-hidden');
            }
          
        envContainers.sideBar.appendChild(sideBarWrap);        
        handler.getImageViewer();
        handler.getToolbar();
        
        // add fav button on top
         
        menuButtons['fav'] = createMainMenuButton(
            '<div class="'+ env.className + '-FavItemsCount ' + env.className + '-bgcolor-dynamic"></div>\
             <div class="' + env.className + '-icon ' + env.className + '-icon-diskete ' + env.className + '-buttoncolor-dynamic"></div>', 
            function() { 
                    
                    if (!checkDataFilterLock()) return false;
                    
                    if (mode == 'fav') handler.hideFavoritesBlock();
                    else handler.showFavouriteImages();
                    
                    return false;
            }, 'fav');
        
        if (menuButtons['fav']) {
            favCounter = menuButtons['fav'].getElementsByClassName(env.className  + '-FavItemsCount')[0];
            handler.updateFavCounter();
        }
                
        menuButtons['ctoptions'] = createMainMenuButton(lng.s('Настройки', 'options'), function() { 
                            
            if (!checkDataFilterLock()) return false;
            
            if (mode == 'ctoptions') handler.hideFavoritesBlock();
            else handler.showOptionsDialog();
            
            return false;
        }, 'options');
        
        if (env.hostClass == 'options_page' && typeof KellyAdditionsForm != 'undefined') {
            menuButtons['additions'] = createMainMenuButton(lng.s('', 'additions'), function() { 
                            
                if (!checkDataFilterLock()) return false;
                
                if (mode == 'additions') handler.hideFavoritesBlock();
                else handler.showAdditionsDialog();
                
                return false;
            }, 'additions');
        }
        
        if (fav.coptions.optionsSide) optionsButton.style.display = 'none';
        favContent = envContainers.favContent; 
        return true;
    }
      
    function createMainMenuButton(name, onclick, index) {
        
        var submenu = env.getMainContainers().menu;
        if (!submenu) return false;
                
        var menuButtonContainer = document.createElement('div');
            menuButtonContainer.className = env.hostClass + ' ' + env.className + '-MainMenuItem ' + env.className + '-ahover-dynamic' ;
        
        if (index) menuButtonContainer.className += ' ' + env.className + '-MainMenuItem-' + index;
            
        KellyTools.setHTMLData(menuButtonContainer, '<a href="javascript:void(0)">' + name + '</a>');
        
        var menuButtonA = KellyTools.getElementByTag(menuButtonContainer, 'a');
            menuButtonA.onclick = onclick;
            
        submenu.appendChild(menuButtonContainer);                   
        if (env.events.onCreateMenuItem) menuButtonContainer = env.events.onCreateMenuItem(submenu, menuButtonContainer, menuButtonA); 
       
        return menuButtonContainer;
    }     
    
    this.defaultNavigation = function() {
        
        if (typeof URLSearchParams == 'undefined') return false;
        
        var url = new URL(window.location.href), tab = url.searchParams.get('tab');
        if (!tab || ['options', 'profiles', 'help', 'modules', 'donate'].indexOf(tab) == -1) return false;
        
             if (tab == 'options') handler.showOptionsDialog();
        else if (tab == 'profiles') handler.showOptionsDialog(env.className + '-Storage');
        else if (tab == 'help') handler.showAdditionsDialog('additions_help');
        else if (tab == 'modules') handler.showAdditionsDialog('additions_modules');        
        else if (tab == 'donate') handler.showAdditionsDialog('additions_donate');
        
        return tab;
    }
    
    // exit from Favourites plugin block
    
    this.hideFavoritesBlock = function() {
        
        if (env.hostClass == 'options_page') return;
        
        if (env.events.onDisplayBlock) env.events.onDisplayBlock(mode, 'hide');
        if (handler.toolbar && fav.coptions.toolbar.enabled) handler.toolbar.events.onDisplayBlock(mode, 'hide'); 
        
        var envContainers = env.getMainContainers();
            envContainers.siteContent.style.display = 'block';
            
        KellyTools.classList('remove', envContainers.favContent, env.className + '-active');
        KellyTools.removeEventPListener(window, 'scroll', 'fav_scroll');
        imageGrid.close();
        
        for (var k in menuButtons) KellyTools.classList('remove', menuButtons[k], 'active');

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
        
        var envContainers = env.getMainContainers();
            envContainers.siteContent.style.display = 'none';
        
        var oldMode = mode;
 
        mode = !newMode ? 'fav' : newMode;
        
        for (var k in menuButtons) KellyTools.classList('remove', menuButtons[k], 'active');
        
        KellyTools.classList('add', menuButtons[mode], 'active');
        KellyTools.classList('add', envContainers.favContent, env.className + '-active');
        
        if (env.events.onDisplayBlock) env.events.onDisplayBlock(mode, 'show', oldMode);
        if (handler.toolbar && fav.coptions.toolbar.enabled) handler.toolbar.events.onDisplayBlock(mode, 'show', oldMode);   
    }
    
    this.updateImageGrid = function() {
        
        imageGrid.updateConfig({tilesBlock : imagesBlock});
        imageGrid.updateTileGrid();
        
        return;        
    }
    
    this.getOptionsManager = function() {
                
        if (!optionsManager) {
            optionsManager = new KellyOptions({favEnv : handler, wrap : favContent});       
            if (env.events.onCreateOptionsManager) env.events.onCreateOptionsManager(optionsManager);
        }
        
        return optionsManager;        
    }

    this.showAdditionsDialog = function(pageId) {  
        if (!checkDataFilterLock()) return false;
        
        KellyAdditionsForm.show(favContent, handler, pageId);
        displayFavouritesBlock('additions');
    }
    
    this.showOptionsDialog = function(tabActive) {  
        if (!checkDataFilterLock()) return false;
        
        handler.getOptionsManager().showOptionsDialog(tabActive);
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
            
            if (filter.color) el.style.background = filter.color;
            
            var index = catFilters.indexOf(filter.id);
            if (index != -1) catFilters.splice(index, 1);
            index = catIgnoreFilters.indexOf(filter.id); 
            if (index != -1) catIgnoreFilters.splice(index, 1);
            
        } else {
            
            el.className += ' active';
            el.style.background = '';
            
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
        
    function updateDisplayItemsList() {

        displayedItems = [];
                 
        var checkByUrlMatch = function(urlFilter, item, urlReg) {
            if (!fav.items[i].pImage) return false;
            
            if (urlReg) {
                var reg = new RegExp(urlFilter), match = typeof item.pImage == 'string' ? item.pImage.match(reg) : item.pImage[0].match(reg);                    
            } else {
                var match = typeof item.pImage == 'string' ? item.pImage.indexOf(urlFilter) != -1 : item.pImage[0].indexOf(urlFilter) != -1 ;        
            }
            
            if (match === null || match === false) return false;
            return true;
        }
        
        // applay filters
        
        for (var i = fav.coptions.newFirst ? fav.items.length-1 : 0; fav.coptions.newFirst ? i >= 0 : i < fav.items.length; fav.coptions.newFirst ? i-- : i++) {
            
            if (aFilters && aFilters.srcUrl && !checkByUrlMatch(aFilters.srcUrl, fav.items[i], aFilters.srcUrlReg)) continue;
            if (aFilters && aFilters.excUrl && checkByUrlMatch(aFilters.excUrl, fav.items[i], aFilters.excUrlReg)) continue;       
            if (aFilters && aFilters.wMin && (!fav.items[i].pw || fav.items[i].pw < aFilters.wMin)) continue;            
            if (aFilters && aFilters.hMin && (!fav.items[i].ph || fav.items[i].ph < aFilters.hMin)) continue;
            if (aFilters && aFilters.wMax && (!fav.items[i].pw || fav.items[i].pw > aFilters.wMax)) continue;            
            if (aFilters && aFilters.hMax && (!fav.items[i].ph || fav.items[i].ph > aFilters.hMax)) continue;
            
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
        
        KellyTools.classList(handler.getFavPageListCount() > 1 ? 'add' : 'remove', gotoPage, env.className + '-active');
    }

    this.setFilters = function(sFilters) {
        if (sFilters && typeof sFilters.imagesAsDownloadItems  != 'undefined') imagesAsDownloadItems = sFilters.imagesAsDownloadItems;          
        if (sFilters && typeof sFilters.excludeFavPosts  != 'undefined') excludeFavPosts =  sFilters.excludeFavPosts;
        if (sFilters && typeof sFilters.excludeFavComments != 'undefined') excludeFavComments =  sFilters.excludeFavComments;  
        if (sFilters && sFilters.catFilters) catFilters = sFilters.catFilters;
        if (sFilters && sFilters.catIgnoreFilters) catIgnoreFilters = sFilters.catIgnoreFilters; 
        if (sFilters && typeof sFilters.logic == 'string') logic = sFilters.logic;
        
        aFilters = sFilters;
    }
    
    this.getFilters = function() {
        return {
            imagesAsDownloadItems : imagesAsDownloadItems,
            excludeFavPosts : excludeFavPosts,
            excludeFavComments : excludeFavComments,
            catFilters : catFilters,
            catIgnoreFilters : catIgnoreFilters,
            logic : logic,
            readOnly : readOnly,
        };
    }
    
    function prepareDownloadItems() {
        return new Promise(function(resolve, reject) {
            
            handler.dataFilterLock = {message : 'Preparing download items...'};
            
            window.setTimeout(function () {
                
                handler.getDownloadManager().setDownloadTasks(displayedItems);
                handler.getDownloadManager().showGrabManager();
                handler.dataFilterLock = false;
                
                resolve();
                
            }, 0);
        });
    }
          
    this.updateFilteredData = function() {

        if (!checkDataFilterLock()) return false;
        
        displayedItems = false;
                
        updateDisplayItemsList();
        updateGoToPageButton();
        
        if (imagesAsDownloadItems) prepareDownloadItems();
        
        // init gallery only for current page, create gallery, by array
        imgViewer.addToGallery(galleryImages, 'fav-images', galleryImagesData);
        
        if (env.events.onUpdateFilteredData && env.events.onUpdateFilteredData(displayedItems)) return; 
        if (handler.toolbar && fav.coptions.toolbar.enabled) handler.toolbar.events.onUpdateFilteredData(displayedItems);
        
        var tiles = handler.getImageGrid().getTiles();   
        if (!handler.mobileOptimization && tiles && tiles.length) window.scrollTo(0, tiles[0].getBoundingClientRect().top + KellyTools.getScrollTop() - 90);
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
            
        if (handler.mobileOptimization) {  // todo - would be helpfull for any touch devices
            tooltipEl.updateCfg({
                avoidOutOfBounds : true,
                closeButton : true,
            });
        }
            
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
    
    function showItemInfoTooltipByElEvent(el, e) {
        
        if (handler.tooltipBeasy) return false;
        if (readOnly) return false;
        if (handler.dataFilterLock || handler.getDownloadManager().getState() != 'wait') return false;
        
        var itemIndex = el.getAttribute('itemIndex');
        showItemInfoTooltip(el.getAttribute('itemIndex'), el);
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
            var html = '\
                <div class="' + env.className + '-preview" data-width="'+size+'" itemIndex="' + index + '">\
                    <div class="' + env.className + '-preview-text">' + text + '</div>\
                </div>\
            ';
            
            KellyTools.setHTMLData(itemBlock, html);
            
        } else {

        // show as image
        
            var pInfo = (item.pw && !subItem) ? ' data-width="' + item.pw + '" data-height="' + item.ph + '" ' : '';            
            imageCount = 1;
            
            if (typeof item.pImage !== 'string') imageCount = item.pImage.length;
            
            var additionAtributes = '';
            
            if (subItem) {
                additionAtributes += ' subItem="' + subItem + '" ';
            }
            
            // multi image list
            if (imageCount > 1) {
            
                additionAtributes += ' data-images="' + imageCount + '" ';
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
            
            if (item.vd) {
                
                var html = '\
                ' + (item.vPoster ? '' : '<div class="' + env.className + '-FavItem-video-nopreview"><div></div></div>') + '\
                <video class="' + env.className + '-preview ' + env.className + '-media" \
                       data-width="' + (!item.pw ? '300' : item.pw) + '" data-height="' + (!item.ph ? '300' : item.ph) + '" \
                       loop="" muted="" \
                       poster="' + (item.vPoster ? item.vPoster : '') + '" \
                 ><source src="' + item.pImage + '"></video>\
                </video>';
                
            } else {
                
                var html = '\
                <img style="' + fav.coptions.grid.cssItem + '" \
                     class="' + env.className + '-preview ' + env.className + '-image" \
                     kellyGalleryIndex="' + (galleryImagesData.indexOf(item) + subItem) + '" \
                     kellyGallery="fav-images" \
                     itemIndex="' + index + '"' + pInfo + additionAtributes + src + '>';
            }
            
            KellyTools.setHTMLData(itemBlock, '<div class="' + env.className + '-preview-wrap">' + html + '</div>');       
        }
        
        if (!imagesAsDownloadItems) {
        
            var postLink = document.createElement('a');
                postLink.className = env.className + '-FavItem-overlay-button';                 
                postLink.setAttribute('target', '_blank');
                
            if (item.relatedDoc) {
                postLink.href = item.relatedDoc;
                postLink.innerText = lng.s('', 'related_doc'); 
            } else {
                postLink.href = KellyTools.validateUrlForLocation( item.commentLink ? item.commentLink : item.link, env.location);
                postLink.innerText = lng.s('', item.commentLink ? 'comment' : 'publication');
            }
            
            var postHd = false;
            
            if (imageCount > 0 && fav.coptions.grid.viewerShowAs != 'hd') {
            
                postHd = document.createElement('a');
                postHd.href = '#';
                postHd.className = env.className + '-FavItem-overlay-button ' + env.className + '-FavItem-overlay-button-bottom';
                postHd.innerText = imageCount > 1 ? 'HDs' : 'HD';                 
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
                if (showItemInfoTooltipByElEvent(this, e) === false) return false;
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
        if (!fav.items.length || !displayedItems.length) {
            KellyTools.setHTMLData(imagesBlock, '<div class="' + env.className + '-FavItem-grid-empty">' + lng.s('Список избранных публикаций пуст', 'fav_list_empty') + '</div>');
            return false;
        }
        
        var totalPages = handler.getFavPageListCount();
        if (page <= 0 || page > totalPages) page = totalPages;
        
        imageGrid.close(); // imageGrid.reset() - if some day will be mode without pagination 
                
        var startItem = (page - 1) * fav.coptions.grid.perPage;
        var end = startItem + fav.coptions.grid.perPage - 1;         
        if (end > displayedItems.length-1) end = displayedItems.length-1;
              
        log('show start : ' + startItem + ' | end : ' + end + ' | total : ' + displayedItems.length);
    
        for (var i = startItem; i <= end; i++) showItem(fav.items[displayedItems[i]]);
        
        if (imagesAsDownloadItems) handler.getDownloadManager().updateStateForImageGrid(imagesBlock);
        
        // connect events to current image elements
        var galleryEl = imagesBlock.getElementsByClassName(env.className + '-FavItem'); // imagesBlock.getElementsByTagName('img');
        
        for (var i = 0, l = galleryEl.length; i < l; i++)  {
            galleryEl[i].onclick = function(e) {
                
                if (!readOnly && handler.mobileOptimization) { // todo - would be helpfull for any touch devices
                      showItemInfoTooltipByElEvent(this, e);
                      return false; 
                }
                
                if (e.target.classList.contains(env.className + '-preview-wrap') || e.target.classList.contains(env.className + '-image') || e.target == this) {
                    
                    var target = e.target.classList.contains(env.className + '-image') ? e.target : KellyTools.getElementByClass(this, env.className + '-image');                                
                    if (target)  {
                        imgViewer.loadImage(target);
                        return false;
                    }
                }               
            }
        }
        
        updatePagination(KellyTools.getElementByClass(sideBarWrap, env.className + '-pagination'));     
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
                    ' + (imagesAsDownloadItems ? '<p><input type="text" placeholder="' + lng.s('Перейти к элементу', 'goton') + '" value="" class="' + env.className + '-GoToN"></p>' : '') + '\
                    <p><a href="#" class="' + env.className + '-Go">' + lng.s('Перейти', 'go') + '</a></p>\
                </div>\
            </div>';
        
        var container = tooltipEl.getContent();
        KellyTools.setHTMLData(container, html);
                
        KellyTools.getElementByClass(container, env.className + '-Go').onclick = function() { 
           
            handler.tooltipBeasy = false;
            tooltipEl.show(false);
            
            var formVars = [KellyTools.inputVal(env.className + '-GoToPage', 'int', container), KellyTools.inputVal(env.className + '-GoToN', 'int', container)];
            
            if (formVars[0] > 0) handler.goToFavPage(formVars[0]);
            else if (formVars[1] > 0) {
                
                var totalItems = handler.getDownloadManager().getDownloads().length;
                
                if (formVars[1] <= totalItems) {
                    
                    var downloadItemIndex = fav.coptions.grabber.invertNumeration ? totalItems - formVars[1] : formVars[1] - 1;
                    var favItemIndex = fav.items.indexOf(handler.getDownloadManager().getDownloads()[downloadItemIndex].item);
                    var displayItemIndex = fav.coptions.newFirst ? fav.items.length - favItemIndex + 1 : favItemIndex;
                    
                    // console.log(downloadItemIndex + ' | ' + favItemIndex + ' | page : ' + Math.ceil(displayItemIndex / fav.coptions.grid.perPage));
                                       
                    if (favItemIndex > -1) {
                        
                        handler.goToFavPage(Math.ceil(displayItemIndex / fav.coptions.grid.perPage));
                        
                        var target = document.getElementById(env.className + '-FavItem-' + fav.items[favItemIndex].id);
                        if (target) window.scrollTo(0,  target.getBoundingClientRect().top + KellyTools.getScrollTop());
                    }
                }
            }
                        
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
            if (handler.categoryCreate(container) !== false) {
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
            
        // todo показывать кол-во элементов   
        
        var baseClass = env.className + '-FiltersMenu', deleteButtonHtml = '', nsfwEnableHtml = '';
        
        if (!category.protect) deleteButtonHtml += ' <a class="' + baseClass + '-delete-button" href="#">' + lng.s('Удалить', 'delete') + '</a>';
        if (env.isNSFW && !env.isNSFW()) nsfwEnableHtml = '<label><input class="' + baseClass + '-nsfw" type="checkbox" ' + (category.nsfw ? 'checked' : '') + '> NSFW </label>'
            
        var itemIndex = fav.categories.indexOf(category);
        
        var html = '\
            <div class="' + baseClass + '-tooltip">\
                <label><input class="' + baseClass + '-check" type="checkbox" ' + (extendCats.indexOf(category.id) != -1 ? 'checked' : '') + '> ' + lng.s('Добавить к изображению', 'add_to_item') + '</label>\
                ' + nsfwEnableHtml + '\
                <label><input class="' + baseClass + '-nameTpl" type="checkbox" ' + (category.nameTpl ? 'checked' : '') + '> ' + lng.s('Использовать в шаблонах имени', 'cat_tpl_name') + ' </label>\
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
                    nameTpl : KellyTools.getElementByClass(container, baseClass + '-nameTpl').checked,
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
                    if (handler.dataFilterLock || handler.getDownloadManager().getState() != 'wait') return false;
                
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
            
            var catSelector = document.createElement('BUTTON');
                catSelector.innerText = fav.categories[i].name;
                catSelector.setAttribute('filterId', fav.categories[i].id);
                
                var catSelectorActive = '';    
                
                     if (catFilters.indexOf(fav.categories[i].id) != -1) catSelectorActive = 'active';
                else if (catIgnoreFilters.indexOf(fav.categories[i].id) != -1) catSelectorActive = 'activeIgnore';
                else if (fav.categories[i].color) catSelector.style.background = fav.categories[i].color;
                
                catSelector.className = catSelectorActive;
                catSelector.onclick = function() {
                
                    if (!checkDataFilterLock()) return false;
                    handler.toogleFilter(this); 
                                        
                    handler.updateFilteredData();                    
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
            
        var filterAddA = document.createElement('BUTTON');
            filterAddA.innerText = '+';
            filterAddA.onclick = function() { return false; };
            
            filterAdd.appendChild(filterAddA);
            
            filterAdd.onmouseover = function (e) { 
                if (handler.tooltipBeasy) return false;
                if (handler.dataFilterLock || handler.getDownloadManager().getState() != 'wait') return false;
                
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
           
    // check if we do something important before change mode  
    
    function checkDataFilterLock() {
        
        if (handler.tooltipBeasy) handler.tooltipBeasy = false;   
        
        handler.getTooltip().show(false);
        handler.showSidebarMessage(false);
        
        imageEvents.saveImageProportions();
        
        // todo check downloadManager config options save event (currently config saved after click on Download button)
                
        if (handler.dataFilterLock || handler.getDownloadManager().getState() != 'wait') { // todo - move to separate function if more checks needed
            
            var tooltip = KellyTools.getNoticeTooltip(env.hostClass, env.className);
                tooltip.getContent().innerText = handler.dataFilterLock && typeof handler.dataFilterLock != 'boolean' ? handler.dataFilterLock.message : 'Перед выполнением действия необходимо остановить загрузку данных или процесс';
                tooltip.show(true);
                
            return false;
            
        } else return true;          
    }
    
    function showDownloadManagerForm(show) {
        
        if (!show) {
            
            downloaderBox.modal.className = downloaderBox.modal.className.replace('active', 'hidden');  
            return;
            
        } else {
            
            var dm = handler.getDownloadManager();                    
            if (!dm.container) dm.container = downloaderBox.content;
            
            fav.coptions.grabber.itemsList = ''; // is range set save needed ?
            fav.coptions.grabber.manualExclude = fav.coptions.toolbar.enabled;
            
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
                
    this.updateCategoryList = function(list) { 
        showCatList(list); 
    }
    
    this.toogleDownloadManager = function() {
        if (!checkDataFilterLock() || mode != 'fav') return imagesAsDownloadItems;
         
        
        var downloadButton = KellyTools.getElementByClass(modalBoxContent, env.className + '-FavEditButton-download');
        var editButton = KellyTools.getElementByClass(modalBoxContent, env.className + '-FavEditButton-edit');
                
        if (imagesAsDownloadItems) { 
            imagesAsDownloadItems = false;
            
            KellyTools.classList('remove', downloadButton, 'active');
            KellyTools.classList('add', downloadButton, 'hidden');
            
            KellyTools.classList('remove', editButton, 'hidden');
            
            handler.sideBarLock = false;
            showDownloadManagerForm(false);
        } else {
            imagesAsDownloadItems = true;
            
            KellyTools.classList('remove', downloadButton, 'hidden');
            KellyTools.classList('add', downloadButton, 'active');
            
            KellyTools.classList('add', editButton, 'hidden');
            
            // turn off edit mode while in download mode
            if (!readOnly) {
                editButton.click();
            }
            
            handler.sideBarLock = true;                      
            showDownloadManagerForm(true);
            
            if (handler.mobileOptimization) {
                modalBox.classList.add('collapsed');
            }
        }
        
        handler.updateFilteredData();                    
        handler.updateImagesBlock();                
        handler.updateImageGrid();  
                    
        if (env.events.onDisplayBlock) env.events.onDisplayBlock('fav', 'show', 'fav');
        if (handler.toolbar && fav.coptions.toolbar.enabled) handler.toolbar.events.onDisplayBlock('fav', 'show', 'fav');
        
        return imagesAsDownloadItems;
    }
    
    this.updateFilterButtons = function() {
        
        var controllsContainer = modalBoxContent;
        
        handler.showSidebarMessage(false);        
        clearSidebarLoadEvents();
        
        controllsContainer.innerHTML = '';
        
        var editButton = document.createElement('BUTTON');
            editButton.innerHTML = '';
            editButton.title = lng.s('Режим редактирования', 'edit_mode');
            editButton.onclick = function() {
                 
                if (!checkDataFilterLock()) return false;
                
                var filterAdd = KellyTools.getElementByClass(controllsContainer, env.className + '-filters-CatCreate');
                    
                if (readOnly) {
                
                    readOnly = false;                    
                    this.className = this.className.replace('closed', 'open');
                
                } else {                
                    readOnly = true;
                    this.className = this.className.replace('open', 'closed');                    
                }
                                
                if (filterAdd) filterAdd.style.display = readOnly ? 'none' : 'inline-block'; 
                if (handler.toolbar && fav.coptions.toolbar.enabled) handler.toolbar.show(readOnly ? true : false);
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
                
                if (!checkDataFilterLock()) return false;
                
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
            
                if (!checkDataFilterLock()) return false;
                
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
            
            if (!checkDataFilterLock()) return false;
            page = 1;
            
            if (!excludeFavComments) {
                this.className = this.className.replace('active', '');
                excludeFavComments = true;
                
            } else {
                 this.className += ' active';
                 excludeFavComments = false;
            }
            
            handler.updateFilteredData();            
            handler.updateImagesBlock();
            handler.updateImageGrid();
            
            return false;
            
        }
            
        filterPosts.onclick = function() {
            
            if (!checkDataFilterLock()) return false;
            
            page = 1;
            
            if (!excludeFavPosts) {
                this.className = this.className.replace('active', '');
                excludeFavPosts = true;
                
            } else {
                 this.className += ' active';
                 excludeFavPosts = false;
            }        
            
            handler.updateFilteredData();            
            handler.updateImagesBlock();
            handler.updateImageGrid();
            
            return false;
            
        }
            
        var filterNsfw = filterComments.cloneNode();        
            
            filterNsfw.innerText = 'NSFW';
            filterNsfw.title = lng.s('', 'nsfw_tip');
            filterNsfw.onclick = function () {
                
                if (!checkDataFilterLock()) return false;
                
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
            
        if (env.isNSFW && !env.isNSFW()) filterNsfw.style.display = 'none';
      
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
                
                if (!checkDataFilterLock()) return false;
                
                logic = (logic == 'or') ? 'and' : 'or';
                logicButton.innerText = lng.s('', 'logic_' + logic);
                logicButton.title = lng.s('', 'logic_' + logic + '_help');
                
                handler.updateFilteredData();                
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
                
                if (!checkDataFilterLock()) return false;
                
                if (fav.coptions.animateGif) {
                    fav.coptions.animateGif = false;
                    this.innerText = '- ' + lng.s('Анимация GIF', 'animate_gifs');
                } else {
                    fav.coptions.animateGif = true;
                    this.innerText = '+ ' + lng.s('Анимация GIF', 'animate_gifs');
                }
            
                handler.save('cfg');
                
                handler.updateFilteredData();                
                handler.updateImagesBlock();
                handler.updateImageGrid();
                return false;
            }
            
        var additionButtons = document.createElement('div');
            additionButtons.className = env.className + '-filters-AdditionButtons';
                    
        var cOptionsTop = document.createElement('div'); 
            cOptionsTop.className = env.className + '-coptions-top ' + env.className + '-clear';  
            cOptionsTop.appendChild(resetButton);
            cOptionsTop.appendChild(editButton);
        
        if (optionsButton) cOptionsTop.appendChild(optionsButton);
         
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
            
        cOptionsTop.appendChild(gotoPage);        
        updateGoToPageButton(gotoPage);
            
        if (!favNativeParser || (favNativeParser && !favNativeParser.isBeasy())) {  
                  
            var download = editButton.cloneNode();
                download.className = env.className + '-FavEditButton ' + env.className + '-FavEditButton-download ' + (imagesAsDownloadItems ? 'active' : 'hidden');
                download.innerText = lng.s('Загрузки', 'download_manager');
                download.title = lng.s('Загрузки', 'download_manager');
                
                download.onclick = function () { handler.toogleDownloadManager(); return false; };
                
            cOptionsTop.appendChild(download);            
            
            if (imagesAsDownloadItems) {
                
                // turn off edit mode while in download mode
                if (!readOnly) {
                    editButton.click();
                }
                
                KellyTools.classList('add', editButton, 'hidden');
            }       
       
        }
            
        var cOptions = document.createElement('div'); 
            cOptions.className = env.className + '-coptions ' + env.className + '-clear';        
        KellyTools.setHTMLData(cOptions, '<table><tbody><tr><td></td><td></td><td></td></tr></tbody></table><div style="clear : both;"></div>');
        
        var cOptionsSectors = cOptions.getElementsByTagName('td');
        var cOptionsSectorItems = [no, gif, logicButton];
        
        for (var i = 0; i < cOptionsSectors.length; i++) {
            cOptionsSectors[i].className = env.className + '-td-opt-' + i;
            cOptionsSectors[i].appendChild(cOptionsSectorItems[i]);
        }
            
        additionButtons.appendChild(cOptionsTop);
        additionButtons.appendChild(cOptions);
            
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
            
        controllsContainer.appendChild(paginationContainer);
        if (imagesAsDownloadItems) showDownloadManagerForm(true);         
    }
    
    // вывод всех изображений избранного \ обновление блока категорий
    // страницы сбрасываются только при смене фильтров
    
    this.showFavouriteImages = function() {
        
        if (!checkDataFilterLock()) return false;
        
        imageGrid.close();        
        imageGrid.updateConfig({rowHeight : fav.coptions.grid.rowHeight, rules : fav.coptions.grid, type : fav.coptions.grid.type});
        if (handler.mobileOptimization) imageGrid.updateConfig({rules : handler.mobileOptimization.grid, type : handler.mobileOptimization.grid.type});
        
        if ((env.isNSFW && !env.isNSFW()) || fav.coptions.ignoreNSFW) handler.ignoreNSFW();
                    
        if (!document.getElementById(env.className + '-mainCss')) {
            
            favContent.innerText = lng.s('Ошибка инициализации таблиц оформления', 'init_css_error');
            displayFavouritesBlock('fav');
            return;
        }
        
        // update image list selected array by current selected \ deselected category filters
        
        handler.updateFilteredData();
        
        // prepare dom elements
        
        favContent.innerHTML = '';
                    
        if (!imagesBlock) {
            imagesBlock = document.createElement('div');
            imagesBlock.className = env.className + '-imagesBlock-container ' + env.className + '-imagesBlock-container-active';
        }
        
        favContent.appendChild(imagesBlock);
        
        handler.updateFilterButtons();
        handler.updateImagesBlock();

        displayFavouritesBlock('fav');
        handler.updateImageGrid();
     
        handler.showSidebar(true, false, 'fav');
        
        return false;
    }
    
    function showInlineSidebar(enabled) {
        
        var sectionItems = sideBarWrap.getElementsByClassName(env.className + '-ModalBox-section');
        
        if (enabled) {
            sideBarWrap.setAttribute('style', '');
            handler.sideBarParent = sideBarWrap.parentElement;
            favContent.insertBefore(sideBarWrap, imagesBlock);
            sideBarWrap.classList.add(env.className + '-inline');
            
            for (var i = 0; i < sectionItems.length; i++) {
                if (KellyTools.getElementByClass(sideBarWrap, env.className + '-section-' + sectionItems[i].getAttribute('data-title'))) continue;
                
                var el = document.createElement('div');
                    el.className = env.className + '-section-header-inline ' + env.className + '-section-' + sectionItems[i].getAttribute('data-title');
                    el.setAttribute('data-target', sectionItems[i].getAttribute('data-title'));
                    KellyTools.setHTMLData(el, '&#9660; ' + lng.s('', sectionItems[i].getAttribute('data-title')));                   
                    el.onclick = function() {
                        var target = sideBarWrap.querySelector('[data-title=' + this.getAttribute('data-target') + ']');
                        if (target.classList.contains('collapsed')) target.classList.remove('collapsed');
                        else target.classList.add('collapsed');
                    }
                    
                sectionItems[i].parentElement.insertBefore(el, sectionItems[i]);
            }
            
        } else {
            
            handler.sideBarParent.appendChild(sideBarWrap);
            sideBarWrap.classList.remove(env.className + '-inline');
        }        
    }
    
    this.enableMobileOptimization = function() {
        
        var width = KellyTools.getViewport().screenWidth;
        if (width < 1080) {
            
            handler.mobileOptimization = {grid : {type : 'fixed', fixed : 3}};
            
            if (fav.coptions) fav.coptions.toolbar.enabled = false;
            document.body.classList.add(env.className + '-mobile');
            
            if (width > 800) handler.mobileOptimization.grid.fixed = 3;
            else handler.mobileOptimization.grid.fixed = 2;
            
            return true;
            
        } else return false;        
    }
    
    this.closeSidebar = function(action) {        
        
        clearSidebarLoadEvents();        
        sideBarWrap.className = sideBarWrap.className.replace( env.className + '-sidebar-wrap-active',  env.className + '-sidebar-wrap-hidden');        

        if (action == 'fav' && handler.mobileOptimization) showInlineSidebar(false);               
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
            header.style.display = hideHeader ? 'none' : 'block';
         
        var modalBoxBtnClose = KellyTools.getElementByClass(modalBox, env.className + '-ModalBox-close');
            modalBoxBtnClose.onclick = function() { 
            
                if (onClose) {
                    onClose(action); 
                } else {
                    handler.closeSidebar(action);
                }
                
                return false; 
            };
            
        if (action == 'fav' && handler.mobileOptimization) showInlineSidebar(true);
        
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
  
        
    function updateSelectedPostMediaControlls(controlls) {

        var text = selectedInfo ? selectedInfo['text'] : '', html = '';
        
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
    }
    
    function updateCategoryControlls(select, list) {
        
        select.innerHTML = ''; list.innerHTML = '';
        var refresh = function() { updateCategoryControlls(select, list); };           
        var catsHTML = '<option value="-1">[' + lng.s('Выбрать категорию', 'cat_select') + ']</option><option value="-2">[' +lng.s('Создать категорию', 'cat_create') + ']</option>';
        
        for (var i = 0; i < fav.categories.length; i++) 
            catsHTML += '<option value="' + fav.categories[i].id + '" ' + (fav.selected_cats_ids.indexOf(fav.categories[i].id) != -1 ? 'style="font-weight : bold;"' : '') + '>' + fav.categories[i].name + '</option>';   
        
        catsHTML = '<select class="' + env.className + 'Cat">' + catsHTML + '</select>';
        
        KellyTools.getElementByClass(modalBox, env.className + 'CatAddForm').setAttribute('style', 'display : none;');         
        KellyTools.setHTMLData(select, catsHTML);
        KellyTools.getElementByClass(select, env.className + 'Cat').onchange = function() {
            
            if (this.options[this.selectedIndex].value > 0) {
                handler.categoryAdd(this.options[this.selectedIndex].value); // this.selectedIndex = 0;                 
                refresh();
            } else {
                KellyTools.getElementByClass(modalBox, env.className + 'CatAddForm').setAttribute('style', this.options[this.selectedIndex].value != '-2' ? 'display : none;' : ''); 
            }
        }
        
        if (fav.selected_cats_ids.length) {        
            for (var i = 0; i < fav.selected_cats_ids.length; i++) {
                
                if (handler.getStorageManager().getCategoryById(fav, fav.selected_cats_ids[i]).id == -1) continue;                
                list.appendChild(createCatExcludeButton(fav.selected_cats_ids[i], refresh));
            }            
        }     
    }
        
    this.showAddToFavDialog = function(postBlock, comment, onAdd, onRemove, onClose) {
        
        var postIndex = typeof postBlock == 'number' ? postBlock : false, existItem = false;        
        selectedPost = postBlock;
        selectedImages = [];
        
        if (postIndex === false && !postBlock) return false;        
        if (postIndex !== false) {
            existItem = fav.items[postIndex];
            postBlock = false;
            selectedPost = false;
            selectedComment = false;
        } 
        
        handler.showSidebarMessage(false);
        handler.setSelectionInfo(false);
        clearSidebarLoadEvents();
        
        if (existItem) {
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
           
        var html = '\
            <div class="' + env.className + '-ModalBox-PreviewContainer active"></div>\
            <div class="' + env.className + 'SavePostWrap">\
                    <div class="' + env.className + 'CatAddForm" style="display : none;">\
                            <input type="text" placeholder="' + lng.s('Новая категория', 'cat_new_cat_name') + '" value="" class="' + env.className + 'CatName">\
                            <a href="#" class="' + env.className + 'CatCreate">' +lng.s('Создать категорию', 'cat_create') + '</a>\
                    </div>\
                    <div class="' + env.className + 'SavePost">\
                        <div class="' + env.className + 'CatList"></div><div class="' + env.className + 'AddSection">\
                        <input type="text" placeholder="' +lng.s('Своя заметка', 'item_notice') + '" title="' + lng.s('', 'item_notice_title') + '" value="' + (existItem && existItem.name ? existItem.name : '') + '" class="' + env.className + 'Name">\
                        <a href="#" class="' + env.className + 'Add">' +lng.s('Сохранить', 'save') + '</a>\
                        <a href="#" class="' + env.className + 'Remove" ' + (!existItem ? 'style="display : none;"' : '') + '>' + lng.s('Удалить', 'delete') + '</a>\
                        <div style="clear : both"></div></div>\
                    </div><div class="' + env.className + 'CatAddToPostList"></div>\
            </div>';
            
        KellyTools.setHTMLData(modalBoxContent, html);
               
        var previewContainer = KellyTools.getElementByClass(modalBox, env.className + '-ModalBox-PreviewContainer');
        var catIncludeList = KellyTools.getElementByClass(modalBox, env.className + 'CatList'), catExcludeList = KellyTools.getElementByClass(modalBox, env.className + 'CatAddToPostList');        
        var hidePreview = KellyTools.getElementByClass(modalBox, env.className + '-ModalBox-hide-preview');
        if (hidePreview) {
            hidePreview.innerText = lng.s('Скрыть превью', 'item_preview_hide');
            KellyTools.classList(selectedImages.length > 0 ? 'remove' : 'add', hidePreview, 'hidden');
            hidePreview.onclick = function() {
                
                var newText = previewContainer.classList.contains('hidden') ? 'hide' : 'show';
                
                hidePreview.innerText = lng.s('', 'item_preview_' + newText);
                KellyTools.classList(newText == 'hide' ? 'remove' : 'add', previewContainer, 'hidden');
                
                onSideBarUpdate();
                return false;
            }
        }
        
        var onNameChange = function () {
            
            var name = KellyTools.val(this.value, 'string');                         
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
            
            fav.selected_cats_ids = handler.getStorageManager().validateCategories(fav.selected_cats_ids, fav);
            var result = handler.getStorageManager().createDbItem({
                    itemIndex : postIndex,
                    images : selectedImages,
                    info : selectedInfo,
                    cats : fav.selected_cats_ids,
                    comment : selectedComment,
                    post : selectedPost,
            }, fav);
            
            if (result.error) {
                
                handler.showSidebarMessage(result.errorText, true); 
                
            } else {
                
                savingProcess = true; 
                
                handler.itemsSave(result, function(error, exist, newIndex) {
                    
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

        updateSelectedPostMediaControlls(previewContainer);  // create selected preview + controlls dom, load dimensions of preview (also can be already pre-initialized throw getAllMedia method)  
        updateCategoryControlls(catIncludeList, catExcludeList);
        
        KellyTools.getElementByClass(modalBoxContent, env.className + 'Add').onclick = saveItem;     
        KellyTools.getElementByClass(modalBoxContent, env.className + 'CatCreate').onclick = function () { 
            var newIndex = handler.categoryCreate();
            if (newIndex !== false) {
                handler.categoryAdd(newIndex);
                updateCategoryControlls(catIncludeList, catExcludeList);
            }
            return false;
        }
        
        handler.showSidebar(false, onCloseNative, 'addtofav');     
        
        if (fav.coptions.addToFavNoConfirm) {
            saveItem();
        }
        
        return false;
    }
    
    this.itemsSave = function(result, onSave) {
        
         handler.save('items', function(error) {
            
            if (!error) {
            
                handler.updateFavCounter();   
                log('itemAdd : post saved | ' + (result.exist ? 'UPDATED' : 'NEW')); log(result.postItem);
                
            } else {
                fav.items.splice(result.itemIndex, 1);        
            }
            
            if (onSave) onSave(error, result.exist, result.itemIndex);
        });
                
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
        return true;       
    }
    
    this.categoryAdd = function(newCatId) {
        
        newCatId = parseInt(newCatId);
        
        if (fav.selected_cats_ids.indexOf(newCatId) !== -1) return false;        
        if (handler.getStorageManager().getCategoryById(fav, newCatId).id == -1) return false;
        
        fav.selected_cats_ids[fav.selected_cats_ids.length] = newCatId;
        return true;
    }    
    
    function createCatExcludeButton(catId, onExclude) {
        
        var category = handler.getStorageManager().getCategoryById(fav, catId);
        
        var catItem = document.createElement('a');
            catItem.href = '#'; 
            catItem.setAttribute('categoryId', category.id);
            catItem.onclick = function() {
                
                handler.categoryExclude(parseInt(this.getAttribute('categoryId')));
                this.parentNode.removeChild(this);
                
                if (onExclude) onExclude(this, catId);                
                return false;
            }
            
            KellyTools.setHTMLData(catItem, '<div class="' + env.className + '-minus"></div><span>' + category.name + '</span>');
            
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
            fav.categories[index].nsfw = data.nsfw ? true : false;
            edited = true;
        }  
        
        if (typeof data.nameTpl != 'undefined') {
            fav.categories[index].nameTpl = data.nameTpl ? true : false;
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
           
             if (name == 'env') return env;        
        else if (name == 'fav') return fav;
        else if (name == 'filtered') return displayedItems;
        else if (name == 'mode') return mode;
        else if (name == 'read_only') return readOnly;
        else if (name == 'logic') return logic;
        else if (name == 'options') return fav.coptions;
        else if (name == 'image_events') return imageEvents;
    }
    
    this.getCollectedData = function(type) {
        if (type == 'user-current') { 
            
            if (fav.items.length > 0) {
                return { 
                    img : false, 
                    title : lng.s('', 'storage_load_from_dump'),
                    info : lng.s('', 'storage_load_from_dump_info', {BOOKMARKS_NUM : fav.items.length}),
                    storage : fav, 
                };
            }
                
        } else if (type == 'user-bookmarks') {
            
             var bookmarksParser = handler.getBookmarksParser();
             if (bookmarksParser && !bookmarksParser.isBeasy() && bookmarksParser.collectedData && bookmarksParser.collectedData.items.length) {
                 
                 return {
                     img : bookmarksParser.pageInfo.contentImg,
                     title : lng.s('', 'storage_load_from_user'),
                     info : lng.s('', 'storage_load_from_user_info', {USER_NAME : bookmarksParser.pageInfo.contentName, BOOKMARKS_NUM : bookmarksParser.collectedData.items.length}),
                     storage : bookmarksParser.collectedData,
                 }
             }
        }      
        
        return false;
    }
    
    // create category from dom inputs and save changes, return false | itemIndex
    
    this.categoryCreate = function(container) {
        
        if (!container) container = sideBarWrap;        
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
        
        var itemIndex = handler.getStorageManager().categoryCreate({name : name, nsfw : catIsNSFW, order : orderNum}, fav);
        if (itemIndex === false) {
            handler.showSidebarMessage(lng.s('Категория с указаным именем уже существует', 'cat_error_name_exist'), true); 
            return false;
        }
        
        handler.showSidebarMessage(lng.s('Категория добавлена', 'cat_add_success'));
        handler.save('items');
        
        return itemIndex;
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
            favNativeParser.jobAutosave && 
            (favNativeParser.jobSaved || !favNativeParser.jobBeforeAutosave)
        ) { 
        
            favNativeParser.jobSaved += favNativeParser.jobAutosave - favNativeParser.jobBeforeAutosave;
            favNativeParser.saveData(true, 'onDownloadNativeFavPagesEnd');
            
            saveNoticeHtml += '<br><b>' + lng.s('', 'download_autosaved_ok') + '</b>';    
                    
            setPreventClose(false);
            
        } else {
            
            KellyTools.getElementByClass(document, env.className + '-Save').style.display = 'block';
            
            if (favNativeParser.jobAutosave && favNativeParser.jobSaved && favNativeParser.jobBeforeAutosave) {
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
        
            
            var loadDoc = KellyTools.val(KellyTools.validateHtmlDoc(thread.response), 'html');                
            var posts = env.getPosts(loadDoc);
            if (posts.length <= 0) {
            
                error = 'Отсутствуют публикации для страницы ' + thread.job.data.page;
            } else {  
                favNativeParser.addToLog('---');
                favNativeParser.addToLog('Страница : ' + thread.job.data.page + ' найдено ' + posts.length + ' постов');
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
            itemsNum : 0, censoredPosts : [], censoredPostIds : [],
        }
   
        for (var i = posts.length - 1; i >= 0; i--) {         
        
            selectedComment = false;
            selectedPost = posts[i];
            var lastCensoredPostId = false;
            
            handler.setSelectionInfo(false);
            
            selectedImages = env.getAllMedia(posts[i]);
            if (!selectedImages.length && favNativeParser.unlockRequests !== false && env.unlockManager.isCensored(selectedPost) === true) {
                var postId = selectedPost.id.match(/[0-9]+/g);
                if (postId.length <= 0) {
                    log('onDownloadNativeFavPage : skip item without id');
                    log(selectedPost);
                    continue;
                }
                
                favNativeParser.pageInfo.censoredNum++;
                selectedImages = ['censored:' + postId[0]];
                lastCensoredPostId = postId[0];
                
            } else if (fav.coptions.downloader.skipEmpty && !selectedImages.length) {
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
                            itemCatId = handler.getStorageManager().categoryCreate({name : worker.catByTagList[b], nsfw : false}, worker.collectedData);                                
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
                            
                            var itemCatId = handler.getStorageManager().getCategoryBy(worker.collectedData, worker.tagList.include[b], 'name');
                                itemCatId = itemCatId.id;
                                
                            if (itemCatId == -1) {
                                itemCatId = handler.getStorageManager().categoryCreate({name : worker.tagList.include[b], nsfw : false}, worker.collectedData);                                
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
            
            var result = handler.getStorageManager().createDbItem({
                images : selectedImages,
                info : selectedInfo,
                cats : worker.collectedData.selected_cats_ids,
                post : selectedPost,
            }, worker.collectedData, false);
            
            if (!result.error) {
                pageInfo.itemsNum++;
                
                if (lastCensoredPostId) {
                    pageInfo.censoredPosts[lastCensoredPostId] = result;
                    pageInfo.censoredPosts[lastCensoredPostId].post = selectedPost;
                    pageInfo.censoredPostIds.push(lastCensoredPostId);
                }
                
            } else {
                log('onDownloadNativeFavPage : skip item | ' + result.error + ' | ' + result.errorText);
                log(selectedPost);
            }
        }
        
        // prevent loading images and media
        var cleared = KellyTools.stopMediaLoad(loadDoc);        
        
        favNativeParser.addToLog('добавлено ' + pageInfo.itemsNum + ' элементов');
        if (pageInfo.censoredPostIds.length > 0) favNativeParser.addToLog('часть изображений заблокирована - ' + pageInfo.censoredPostIds.length);
        favNativeParser.addToLog('---');
        
        log('Page : ' + pageInfo.page + ' | ' + pageInfo.itemsNum + ' | cleared res : ' + cleared);
           
        var autosaveCheck = function() {
            if (favNativeParser.jobAutosave && !worker.jobBeforeAutosave) {
            
                worker.jobBeforeAutosave = worker.jobAutosave ? worker.jobAutosave : 1000;
                worker.jobSaved = worker.jobSaved ? worker.jobSaved+worker.jobAutosave : worker.jobAutosave;
                worker.saveData(true, 'onDownloadNativeFavPage');            
            }
            
            log('--'); 
        }
        
        if (favNativeParser.unlockRequests !== false && pageInfo.censoredPostIds.length > 0) {
            
            favNativeParser.addToLog('Восстанавливаю заблокированный контент...');
            favNativeParser.pause(true);
            
            var unlockRequest = env.unlockManager.unlockPostList(pageInfo.censoredPostIds, env.unlockManager.getTpl('query-post'), function(rids, unlockedData) {
        
                if (rids === false || !unlockedData) {
                    favNativeParser.addToLog('Не удалось получить информацию о заблокированных публикациях - Сервис не доступен более 20 сек.'); 
                    return;
                } 
                
                for (var i = 0; i < pageInfo.censoredPostIds.length; i++) {
                    
                    var blockPostId = pageInfo.censoredPostIds[i], blockPostData = unlockedData.data['node' + (i+1)];                    
                    var itemIndex = pageInfo.censoredPosts[blockPostId].itemIndex;
                    var item = worker.collectedData.items[itemIndex];
                                            
                    if (!blockPostData) {
                        
                        handler.getStorageManager().createDbItem({ 
                                cats : [favNativeParser.getCat('error', 'Load error')],
                                itemIndex : itemIndex,
                        }, worker.collectedData, true, true);
                        
                        favNativeParser.addToLog('Данные для заблокированного поста отсутствуют ' + pageInfo.censoredPostIds[i]);
                        continue;
                    }
                    
                    KellyTools.setHTMLData(pageInfo.censoredPosts[blockPostId].post, env.unlockManager.getTpl('post', {PICS : env.unlockManager.getPublicationAttributesHtml(blockPostData.attributes)}));    
                    
                    // update db item by index
                    handler.getStorageManager().createDbItem({ 
                        images : env.getAllMedia(pageInfo.censoredPosts[blockPostId].post),
                        itemIndex : itemIndex,
                    }, worker.collectedData, true, true);
                    
                    favNativeParser.addToLog('Картинки для заблокированного поста ' + blockPostId + ' найдены - ' + (typeof item.pImage == 'string' ? 1 : item.pImage.length)  + ' | fav index ' + itemIndex);
                }
                
                autosaveCheck();
                favNativeParser.removeUnlockRequest(unlockRequest);
                favNativeParser.pause(false);
            });
            
            favNativeParser.unlockRequests.push(unlockRequest);
            
            return false;
            
        } else autosaveCheck();           
    }
    
    this.downloadNativeFavPage = function(el) {
        
        if (!favNativeParser || !favNativeParser.pageInfo) {
            log(env.profile + ' bad bookmarks page info');
            return false;
        }
        
        favNativeParser.errors = '';

        if (favNativeParser.getJobs().length) {
        
            if (favNativeParser.unlockRequests !== false) favNativeParser.stopUnlockRequests();
            favNativeParser.stop();
            setPreventClose(false);
            return false;
        }
                        
        var updateOptions = false;
        
        favNativeParser.resetData();
        if (favNativeParser.pageInfo.contentName) favNativeParser.collectedData.dbName = KellyTools.generateIdWord(favNativeParser.pageInfo.contentName);
        
        var pages = KellyTools.getElementByClass(document, env.className + '-PageArray'); 
        var pagesN = KellyTools.val(KellyTools.getElementByClass(document, env.className + '-PagesN').value, 'int');
        if (pagesN >= 1) {
            favNativeParser.pageInfo.pages = pagesN;
        } else {
            KellyTools.getElementByClass(document, env.className + '-PagesN').value = favNativeParser.pageInfo.pages;
            pagesN = favNativeParser.pageInfo.pages;
        }
        
        // for big selections that can oversize localstorage
                    
        var autosaveEnabled = KellyTools.getElementByClass(document, env.className + '-exporter-autosave-show');
            autosaveEnabled = autosaveEnabled && autosaveEnabled.checked ? true : false;
            
        favNativeParser.jobAutosave = false;
        
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
                
                // if (customUrl.indexOf(window.location.origin) !== 0) {
                //  
                //    if (customUrl[0] != '/') customUrl = '/' + customUrl;
                //    
                //    customUrl = window.location.origin + customUrl;                    
                // }
                
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
              
        if (!autosaveEnabled && favNativeParser.pageInfo.pages > favNativeParser.maxPagesPerExport && pagesList.length > favNativeParser.maxPagesPerExport ) {
             
            handler.getTooltip().resetToDefaultOptions();                        
            handler.getTooltip().setMessage(lng.s('', 'download_limitpages', {MAXPAGESPERIMPORT : favNativeParser.maxPagesPerExport, CURRENTPAGESPERIMPORT : pagesList.length}));                        
            handler.getTooltip().show(true); 
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
        
        if (tagFilterEnabled && tagFilter) {
            if (tagFilter.value != fav.coptions.downloader.tagList) {
                
                fav.coptions.downloader.tagList = KellyTools.inputVal(tagFilter, 'longtext');                 
                updateOptions = true;
            }
            
            favNativeParser.tagList = KellyTools.parseTagsList(fav.coptions.downloader.tagList);
        }
        
        var catCreate = KellyTools.getElementByClass(document, env.className + '-exporter-create-by-tag');
        var catCreateEnabled = KellyTools.getElementByClass(document, env.className + '-exporter-create-by-tag-show');
            catCreateEnabled = catCreateEnabled && catCreateEnabled.checked ? true : false;
                
        if (catCreateEnabled && catCreate) {
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
        favNativeParser.maxPagesPerExport = 1200;
        favNativeParser.pageInfo = env.getFavPageInfo ? env.getFavPageInfo() : false;
        
        favNativeParser.resetData = function() {
            favNativeParser.collectedDataCats = {};
            favNativeParser.collectedData = handler.getStorageManager().getDefaultData();
        }
        
        favNativeParser.getCat = function(key, name) {
            if (favNativeParser.collectedDataCats[key]) return favNativeParser.collectedDataCats[key];
            favNativeParser.collectedDataCats[key] = K_FAV.getStorageManager().categoryCreate({name :  name}, favNativeParser.collectedData);
            return favNativeParser.collectedDataCats[key];
        }
        
        favNativeParser.unlockRequests = false;
         
        if (env.unlockManager && fav.coptions.unlock.censored) {
            
            favNativeParser.unlockRequests = [];
            
            // favNativeParser.unlockFailCat = handler.getStorageManager().categoryCreate({name : 'Unlock Fail'}, favNativeParser.collectedData);
            favNativeParser.stopUnlockRequests = function() {
                for (var i = 0; i < favNativeParser.unlockRequests.length; i++) favNativeParser.unlockRequests[i].abort();        
            }
            
            favNativeParser.removeUnlockRequest = function(request) {
                var rIndex = favNativeParser.unlockRequests.indexOf(request);
                if (rIndex == -1) return false;
            
                favNativeParser.unlockRequests.splice(rIndex, 1);
            }
        }
        
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

            if (autosave) favNativeParser.resetData();
        }
        
        return favNativeParser;
    }
    
    this.showNativeFavoritePageInfo = function() {
        
        if (!env.getFavPageInfo) {
            log(env.profile + ' not support native downloads');
            return false;
        }        
        
        var favPageInfo = handler.getBookmarksParser().pageInfo;     
        if (!favPageInfo || !favPageInfo.items) return false;
        
        if (favPageInfo.unlockRequests !== false) env.unlockManager.initWorkspace();
        
        KellyTools.getBrowser().runtime.sendMessage({method: "getResources", asObject : true, items : ['parser-form'], itemsRoute : {module : 'bookmarksParser', type : 'html'}}, function(request) {
            
            // env.getPostTags
            var downloaderOptions = handler.getBookmarksParser().getCfg(), dhtml = '';
            for (var k in downloaderOptions) dhtml += '<tr><td>' + k + ' :</td><td><input type="text" value="' + downloaderOptions[k] + '" class="' + env.className +'-downloader-option-' + k + '"></td></tr>';
            
            dhtml += '<tr><td>Ссылка :</td><td><input type="text" value="' + favPageInfo.url + '" class="' + env.className + '-downloader-option-url"></td></tr>';

            KellyTools.setHTMLData(favPageInfo.container, KellyTools.getTpl(request.data.loadedData, 'parser-form', {
                CLASSNAME : env.className, 
                EXTRA_OPTIONS : dhtml, 
                EXTRA : KellyTools.DEBUG, 
                SKIP_EMPTY : fav.coptions.downloader.skipEmpty ? true : false,
                PAGES : favPageInfo.pages,
                PAGES_AUTO : fav.coptions.downloader.autosave ? fav.coptions.downloader.autosave : handler.getBookmarksParser().maxPagesPerExport, 
                TAGS : env.getPostTags, 
                TAGLIST_FILTER : fav.coptions.downloader.tagList ? fav.coptions.downloader.tagList : '',
                TAGLIST_CREATE : fav.coptions.downloader.catByTagList ? fav.coptions.downloader.catByTagList : ''
            }));
                        
            var toogleFilter = favPageInfo.container.getElementsByClassName(env.className + '-toogle-filter');
            for (var i = 0; i < toogleFilter.length; i++) toogleFilter[i].onclick = function() {
                KellyTools.toogleActive(KellyTools.getElementByClass(favPageInfo.container, this.getAttribute('data-target')), env.className);
                if (this.tagName == 'INPUT' && this.type == 'checkbox') return true; else return false;
            }
            
            KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-button-start').onclick = function() {
                handler.downloadNativeFavPage(this);
                return false;
            };
            
            if (env.getPostTags) {
                
                KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-tag-filter').onchange = function() {
                    var list = KellyTools.parseTagsList(this.value);
                    
                    var value = KellyTools.varListToStr(list.include, 'string', ', ');
                    if (list.exclude.length) value += (value ? ', ' : '') + '-' + KellyTools.varListToStr(list.exclude, 'string', ', -');

                    this.value = value;
                    
                    if (this.value != fav.coptions.downloader.tagList) {
                        fav.coptions.downloader.tagList = this.value;
                        handler.save('cfg');
                    }
                };
                
                KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-create-by-tag').onchange = function() {
                    
                    var list = KellyTools.parseTagsList(this.value);
                    this.value = KellyTools.varListToStr(list.include, 'string', ', ');
                    
                    if (this.value != fav.coptions.downloader.catByTagList) {
                        fav.coptions.downloader.catByTagList = this.value;
                        handler.save('cfg');
                    }
                };                
            }
        });        
    }
    
    this.formatPostContainers = function(container) {
        
        if (!env.getPosts) return;
        
        var publications = env.getPosts(container);
        log('formatPostContainers : posts length ' + publications.length);
        for (var i = 0; i < publications.length; i++) env.formatPostContainer(publications[i]);
    }
    
    this.initWebRequestRules = function(data, onRegistered) {
                    
        if (!data) return false;
        
        data.method = 'registerDownloader';
        data.browser = KellyTools.getBrowserName();
        
        handler.runtime.webRequestPort.postMessage(data);
        
        // todo add unregister feature, put bottom event block before post?
        var onRegisteredEvent = false;
        if (onRegistered) {
             onRegisteredEvent = function(request) {                
                if (request.method == "registerDownloader") {                    
                    onRegistered(request.message == 'registered' ? true : false);
                    handler.runtime.webRequestPort.onMessage.removeListener(onRegisteredEvent);
                }
            }
            
            handler.runtime.webRequestPort.onMessage.addListener(onRegisteredEvent);
        }
        
        return true;
    }
    
	this.initBgEvents = function() {
        
		if (typeof handler.runtime == 'undefined') handler.runtime = {};
        if (!handler.runtime.webRequestPort) handler.runtime.webRequestPort = KellyTools.getBrowser().runtime.connect({name: "downloader"}); 
       
        if (!handler.runtime.onMessage) {
            
            handler.runtime.onMessage = function(request) {
                
                if (request.method == "onChanged") {
                    
                    handler.getDownloadManager().onDownloadProcessChanged(request.downloadDelta);
                    
                } else if (request.method == "onUpdateStorage") {
                    
                    var dbName = handler.getStorageManager().prefix + fav.coptions.storage;
               
                    // todo - пока только на обновление списка изображений - 
                    // обновление конфига тригирится в некоторых случаях без изменения - если реализовывать - нужно добавлять проверку
                    
                    if (!request.isCfg && dbName == request.dbName) { 
                        handler.showUpdateStorageDialog(request);
                    }
                    
                } else if (request.method == "registerDownloader") {
                    
                    log ('[PORT] webRequest API is [' + request.message +']');
                    
                } else if (request.method == "onPortCreate") {    
                     
                     log('[PORT] Connected to BG Process successful');  
                     handler.isDownloadSupported = request.isDownloadSupported;                 
                     if (!handler.isDownloadSupported) {
                
                        log('browser not support download API. Most of functional is turned OFF');                        
                        if (fav.coptions && fav.coptions.fastsave) fav.coptions.fastsave.enabled = false;
                        
                    } else {
                        
                        if (fav.coptions && fav.coptions.webRequest) handler.initWebRequestRules(env.webRequestsRules); // cur not wait callback
                        else log('webRequests API is [Disabled] by config');                       
                    }
                }
            }
            
            handler.runtime.webRequestPort.onMessage.addListener(handler.runtime.onMessage);
        }
    }
        
    this.initResources = function(resources) {
        
        resources = resources ? resources : ['core', env.profile];
        
        if (handler.mobileOptimization) {
            resources.push('coreMobile');
            resources.push(env.hostClass == 'options_page' ? 'singleMobile' : env.profile + 'Mobile');
        } 
        
        KellyTools.getBrowser().runtime.sendMessage({method: "getResources", items : resources}, function(request) {
             if (!request || !request.data.loadedData) {                
                log('onLoadCssResource : css empty');
                log('onLoadCssResource : Browser API response : ' + request.data.notice);                
                return false; 
            }
            
            KellyTools.addCss(env.className + '-mainCss', KellyTools.replaceAll(request.data.loadedData, '__BASECLASS__', env.className));                        
            initWorktop();            
            if (env.events.onExtensionReady) env.events.onExtensionReady();
        });
    }
        
    this.initFormatPage = function(resources) {
        
        if (init) return false;
        init = true;
        
        if (env.events.onPageReady && env.events.onPageReady()) return false;        
        if (!env.getMainContainers()) return false;
        
        if (!KellyTools.getBrowser()) {        
            log('Fail to get API functions, safe exit from page ' + document.title, KellyTools.E_ERROR);
            return false; 
        }
        
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
        
        
        if (handler.allowMobile) handler.enableMobileOptimization();
        
        // currently we can modify post containers without waiting css, looks fine
        handler.formatPostContainers();
        handler.initResources(resources);
        handler.initBgEvents();
        
        if (fav.coptions.debug) handler.runtime.webRequestPort.postMessage({method: "setDebugMode", state : true});
         
        return false;
    }
    
    constructor(cfg);
}

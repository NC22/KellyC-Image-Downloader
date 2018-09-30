// ==UserScript==
// @encoding utf-8
// @name           KellyFavItems
// @namespace      Kelly
// @description    useful script
// @author         Rubchuk Vladimir <torrenttvi@gmail.com>
// @license   GPLv3
// ==/UserScript==

function KellyFavItems() 
{
    this.PROGNAME = 'KellyFavItems v1.1.0.2b';
    
    var handler = this;	
        
    var env = false;
    var events = new Array();
    
    var selectedPost = false;
    var selectedImages = false;
    var selectedComment = false;
    var selectedInfo = false; // какие-либо мета данные сохраняемые для определенной публикации в обработчике itemAdd (добавлять методом setSelectionInfo)
    
    var extendCats = []; // выделеные категории для последующего добавления к определенной публикации в режиме просмотра избранного
    
    var init = false; // маркер инициализации расширения (вызов метода initExtension)
    
    // события
    
    // onPageReady - вызов выполняется сразу при запуске плагина если есть хотябы одна публикация, иначе window.onload, доступны все переменные конфига \ сохраненные публикации в fav.
    // onExtensionReady - вызывается после загрузки всех необходимых css ресурсов расширения  
    
    // dynamicly created DOM elements
    
    var sideBarWrap = false;
    var sideBarLock = false;
    var modalBox = false;
    var modalBoxContent = false;
    var modalBoxMessage = false;
    
    var downloaderBox = false;    
    var favCounter = false;
    
    //    
    
    var siteContent = false; // main page container - setted by env
    var favContent = false; // main extension container
    var imagesBlock = false;
    
    var publications = false;
    var submenuItems = false;
    var menuButtons = [];
    
    var mode = 'main'; // current extension page, main - not in extension, fav - show favourites page
    
    // Фильтры в режиме просмотра избранного    
    // исключать из выборки публикации по типу
    
    var excludeFavPosts = false;
    var excludeFavComments = false;
    
    var logic = 'and';
    var catFilters = [];
    var catFilterNot = false; // режим выбора категории с отрицанием
    var catIgnoreFilters = [];
    
    var commentsBlockTimer = [];
    
    var readOnly = true;
    var imagesAsDownloadItems = false;
    
    // addition classes
    var imgViewer = false;    
    var favNativeParser = false;
    var downloadManager = false;
    var storageManager = false;
    var tooltip = false;
           
    // todo replace all debug vriables to common global constant
    var debug = true;
    
    var page = 1;
    var uiBeasy = false;
    
    var displayedItems = [];
    var galleryImages = [];
    var galleryImagesData = [];
    
    var lng = KellyLoc;
    
    var imageGrid = false;
    
    /*  current loaded throw this.load method profile object
    
        Stores information about config, items, categories
        
        categories - array of objects [.name, .id] (see getStorageManager().categoryCreate method)
        items      - array of objects [.categoryId (array), .link (string), .pImage (string|array of strings), .commentLink (undefined|text) (see itemAdd method for list of current available structured data vars)
        coptions   - structured data (see this.load method for list of current available options)
    */  
    
    var fav = {};
    
    this.isDownloadSupported = false;
   
    // common actions for several controll elements

    var commonActions = {
        
        onLoadPreviewImage : function() {
        
            var dimensions = {width : parseInt(this.naturalWidth), height : parseInt(this.naturalHeight)};
            
            // if (selectedInfo && selectedInfo['dimensions'] && selectedInfo['dimensions'].width && selectedInfo['dimensions'].schemaOrg) return false;
                            
            handler.setSelectionInfo('dimensions', dimensions);
            
            log('get width and height for ' + this.src);
            log(dimensions);
            
            updateSidebarPosition(); 
            return false; 
        }
    }
    
    function constructor(noexec) {
        
        if (noexec) return;
        
        if (typeof K_DEFAULT_ENVIRONMENT == 'undefined') {
            
            // for other services, currently none
            
            var profile = false; // check by window.location.host if some excludes will be in future		
            
            if (profile) {
                KellyTools.getBrowser().runtime.sendMessage({method: "getProfile", profile : profile}, handler.exec);
            } else {
                log('Unknown servise or site, cant find profile for ' + window.location.host);
            }
            
        } else {
            handler.exec({env : K_DEFAULT_ENVIRONMENT});
        }
    }	
    
    this.exec = function(cfg) {

        if (env) {
            return;
        }
        
        if (!cfg || (!cfg.envText && !cfg.env)) {
            log('empty environment attribute or profile name');
            log(cfg.error);
            return;
        }
    
        if (cfg.envText) {
                
            log('text environment string disabled for security reasons');
            return;
            
            /*
            K_ENVIRONMENT = false;
        
            try {
                e__val(cfg.envText);
            } catch (e) {
                if (e) {
                    log(e);
                    return;
                }
            }
            
            if (typeof K_ENVIRONMENT != 'undefined') {
                env = K_ENVIRONMENT;
            }
            */
        
        } else env = cfg.env;
        
        if (!env) {
            log('init env error');
            return;
        }
        
        env.setFav(handler);		
        
        var action = getInitAction();        
        if (action == 'main') {
     
            handler.load(false, function() {
                
                KellyLoc.debug = debug;
                
                if (env.getPosts()) { 
                    handler.initOnPageReady();
                } else {
                    handler.addEventListner(window, "load", function (e) {
                        handler.initOnPageReady();
                        return false;
                    }, 'init_');
                }
            });  
            
        } else if (action == 'disable') {
        
        }
        
        log(handler.PROGNAME + ' init | loaded in ' + action + ' mode | profile ' + env.profile);        
    }
    
    function initImageGrid() {
        
        imageGrid = new KellyTileGrid({
        
            tilesBlock : imagesBlock,
            rowHeight : 250,
            tileClass : env.className + '-FavItem',
            hideUnfited : false,
            
            
            rules : {
                dontWait : true,
                fixed : 2,
                tmpBounds : { width : 200, height : 200},
            },
            
            events : {
                // isBoundsLoaded : function(tile, tileMainEl) { return false },
                getBoundElement : function(self, tile) {
                
                    var el = tile.getElementsByClassName(env.className + '-preview');
                    
                    if (el && el.length) return el[0];
                    return false;
                    
                },
                
                // для картинки неизвестны пропорции и картинка была удалена с сервера \ ошибка подключения
                
                onBadBounds : function(self, data) {
                    
                    if (data.errorCode == 2 || data.errorCode == 3 || data.errorCode == 4) {
                        
                        data.boundEl.setAttribute('data-width', 200);
                        data.boundEl.style.display = 'inline-block';
                        
                        return {width : 200};
                        
                    } else {
                        
                        if (data.tile) data.tile.style.display = 'none';
                        return false;
                    }
                },
                getResizableElement : function(self, tile) {
                    return tile;
                },
                onGridUpdated : function(self) {
                    
                    // if fav.coptions.imagegrid.padding
                    /*
                        var grid = imagesBlock.getElementsByClassName(env.className + '-FavItem-grid-resized');
                        
                        for (var i = 0; i < grid.length; i++) {
                            grid[i].style.boxSizing = 'border-box';
                            grid[i].style.padding = '6px';
                        }
                    */
                
                },
                
                // для одного из элементов сетки загружены пропорции
                
                onLoadBounds : function(self, boundEl, state) {
                
                    handler.onFavImageLoad(boundEl, state == 'error' ? true : false);
                    return false;
                },
                
                onResizeImage : function(self, itemInfo) {
                
                    // todo show in original size elements that smaller then resized version
                    
                    if (!itemInfo.tile) return;
                    if (itemInfo.width < 140) {
                        var showPostBtn = KellyTools.getElementByClass(itemInfo.tile, env.className + '-FavItem-overlay-button');
                        if (showPostBtn) {
                            showPostBtn.parentElement.removeChild(showPostBtn);
                        }
                    }                    
                },
                
            },
            
        });
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
        
        favCounter.className = env.className + '-FavItemsCount ' + env.className + '-buttoncolor-dynamic ' + itemsLengthClass;        
        favCounter.innerText = fav.items.length;
    }
    
    function getInitAction() { // if page included as Iframe, we use it just to restore local storage data on subdomain, or domain with other name
        var mode = KellyTools.getUrlParam(env.actionVar);
        if (!mode) return 'main';
        
        return mode;
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
                
                events : { onMouseOut : function(tooltip, e) {
                
                    var related = e.toElement || e.relatedTarget;
                    if (tooltip.isChild(related)) return;
                    
                    tooltip.show(false);
                }}, 
                
            });
        } 
        
        return tooltip;
    }
    
    function log(info) {
        if (debug) {
            KellyTools.log(info, 'KellyFavItems');
        }
    }

    // validate selected categories, remove from selected if some of them not exist
    
    function validateCategories(catList, db) {
           
        if (!db) db = fav;
        var tmpSelectedCategories = []; 
        
        if (catList) {
            
            for (var i = 0; i < catList.length; i++) {
            
                if (handler.getStorageManager().getCategoryById(db, catList[i]).id == -1) {
                    log('skip deprecated category ' + catList[i]);
                    continue;
                } 
                
                tmpSelectedCategories.push(catList[i]);
            }
        }       
        return tmpSelectedCategories;
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
            fav.selected_cats_ids = validateCategories(fav.selected_cats_ids);	
            
            sm.validateDBItems(fav);
            
            if ((type == 'items' || !type) && onAfterload) onAfterload(); 
        }

        var onLoadConfig = function (config) {
            
            if (config) fav = config;
            else log('load() bad or empty config ' + sm.prefixCfg + 'config, default used');
                                
            if (!fav.selected_cats_ids) fav.selected_cats_ids = [];
            if (!fav.coptions) {
            
                // default values
                
                fav.coptions = {                
                    syncByAdd : false,
                    newFirst : true,
                    hideSoc : true,
                    optionsSide : false,
                };
            }
            
            if (!fav.coptions.storage) {
                fav.coptions.storage = 'default';
            }
                    
            // fav.items[fav.items.length] = {"categoryId":[6,4,12],"previewImage":"http://img1.joyreactor.cc/pics/post/bad.jpg","name":""};
            
            if (!fav.coptions.comments_blacklist)  fav.coptions.comments_blacklist = [];
            if (!fav.coptions.posts_blacklist)  fav.coptions.posts_blacklist = [];
            
            fav.coptions.debug = fav.coptions.debug ? true : false;
            debug = fav.coptions.debug;
            env.debug = debug;
            
            fav.coptions.newFirst = fav.coptions.newFirst ? true : false;
            
            if (!fav.coptions.storageDriver) {
                fav.coptions.storageDriver = 'localstorage';
            }
            
            fav.coptions.hideSoc = fav.coptions.hideSoc ? true : false;
            
            if (!fav.coptions.tagList) fav.coptions.tagList = '';
                        
            sm.driver = fav.coptions.storageDriver;
                        
            fav.coptions.syncByAdd = fav.coptions.syncByAdd ? true : false;
            
            if (!fav.coptions.grid)  {
                fav.coptions.grid = {
                    fixed : false,
                    rowHeight : 250,
                    heightDiff : 10,
                    min : 2, 
                    cssItem : '',
                    perPage : 60,
                    type : 'dynamic',
                };
            }
            
            if (!fav.coptions.grid.type) {
                fav.coptions.grid.type = 'dynamic';
            }
            
            if (!fav.coptions.fastsave) {
            
                fav.coptions.fastsave = {
                    baseFolder : env.profile + '/Fast',
                    // nameTemplate : '#category_1#/#id#_#category_1#_#category_2#_#category_3#',
                    enabled : false,
                    check : false,
                    conflict : 'overwrite',
                };
            }
            
            if (!fav.coptions.downloader) {
                fav.coptions.downloader = {
                    //perPage : 200,
                }
            }
        
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
        var notSaved = (!type) ? 2 : 1 ;
        
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
    
    this.goToFavPage = function(newPage) {
        
        if (page == newPage) return false;
        if (uiBeasy) return false;
        if (!displayedItems || !displayedItems.length || !imagesBlock) return false;
                
        var totalPages = Math.ceil(displayedItems.length / fav.coptions.grid.perPage);
               
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
        
        page = newPage;
        
        uiBeasy = true;
        imagesBlock.className = imagesBlock.className.replace('active', 'hidden');
        
        setTimeout(function() {
            
            imagesBlock.className = imagesBlock.className.replace('hidden', 'active');
            imageGrid.close();
            
            handler.updateImagesBlock();
            handler.updateImageGrid();
            uiBeasy = false;
            
        }, 200);
        
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
            var	style = document.createElement('style');
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
            text += '<a href="' + item.link + '" target="_blank">' + lng.s('Показать пост', 'go_to_publication') + '</a>' + '<br>';
            
        }
        
        if (item.commentLink) {
            text += '<a href="' + item.commentLink + '" target="_blank">' + lng.s('Показать комментарий', 'go_to_comment') + '</a>' + '<br>';
            
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
                    text += '<img src="' + env.getStaticImage(env.getImageDownloadLink(item.pImage[i], false)) + '" alt="' + imgTitle + '"></a></li>';
                }
                    
            text += '</ul>';
        
        } else {
        
            text += '<a href="' + env.getImageDownloadLink(item.pImage, true) + '" target="_blank">' + lng.s('Основное изображение', 'image_main') + '</a>' + '<br>';
        }
        
        return text;
    }
       
    function addImageInfoTip(el) {
        
        var getMessage = function(el, e) {
        
            var item = false;
            var state = imgViewer.getCurrentState();
            if (state.imageData) {		
                if (typeof state.imageData.pImage != 'undefined') {
                    item = state.imageData;
                } else {
                    item = state.imageData[state.cursor];
                }
            }
            
            if (!item) return false;
        
            var message = document.createElement('div');
                KellyTools.setHTMLData(message, handler.showItemInfo(item));
                
            var itemTipControll = KellyTools.getElementByClass(message, env.className + '-ItemTip-controll');
               
            var fixProportions = document.createElement('a');
                fixProportions.href = '#';
                
                fixProportions.innerText = lng.s('Обновить пропорции', 'fix_proportions');
                
                fixProportions.onclick = function() {
                    
                    var currentIndex = fav.items.indexOf(item);
                    
                    if (currentIndex == -1) return;
                    
                    removeDimensionsForItem(item);
                    handler.saveWH(state.image, currentIndex);
                            
                    handler.updateImagesBlock();
                    handler.updateImageGrid();
                    
                    // item.pw = state.imageBounds.width;
                    // item.ph = state.imageBounds.height;
                    
                    this.innerText = lng.s('Пропорции обновлены', 'fix_proportions_ok');
                    log('fix proportions to ' + item.pw + ' | ' + item.ph);
                    
                    return false;
                }
                
                if (itemTipControll) {                    
                    itemTipControll.appendChild(fixProportions);
                }
         
            return message;
        }
        
        KellyTooltip.addTipToEl(el, getMessage, {
            offset : {left : -20, top : 0}, 
            positionY : 'top',
            positionX : 'right',
            ptypeX : 'outside',
            ptypeY : 'inside',
            closeButton : false,
            selfClass : env.hostClass + ' ' + env.className + '-ItemTip-tooltipster',
            classGroup : env.className + '-tooltipster',
            removeOnClose : true,
        }, 100);	
    }
    
    function initWorktop() {
        
        // todo modal mode for fit to ANY site
        var envContainers = env.getMainContainers();
        if (!envContainers.body) {
            debug = true;
            log('initWorktop() main container is undefined ' + env.profile);
        }
        
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
            
            imgViewer = new KellyImgView({className : env.className + '-ImgView', viewerBlock : imgView});
            
        var downloaderHTML = '\
            <div class="' + modalClass + ' ' + modalClass + '-downloader hidden">\
                <div class="' + modalClass + '-content"></div>\
            </div>\
        ';
        
        KellyTools.setHTMLData(sideBarWrap, modalBoxHTML + downloaderHTML);
            
        modalBox = KellyTools.getElementByClass(sideBarWrap, modalClass + '-main');
        modalBoxContent = KellyTools.getElementByClass(modalBox, modalClass + '-content');
        modalBoxMessage = KellyTools.getElementByClass(modalBox, modalClass + '-message');
        
        downloaderBox = {
            modal : KellyTools.getElementByClass(sideBarWrap, modalClass + '-downloader'),
        }; 
        
        downloaderBox.content = KellyTools.getElementByClass(downloaderBox.modal, modalClass + '-content');
        
        envContainers.body.appendChild(sideBarWrap);
        envContainers.body.appendChild(imgView);
        
        imgViewer.addBaseButtons();
        
        var tip = imgViewer.addButton('?', 'info', function() { });
        addImageInfoTip(tip);
        
        handler.addEventListner(window, "resize", function (e) {
            updateSidebarPosition();
        }, '_fav_dialog');
        
        handler.addEventListner(window, "scroll", function (e) {
            updateFastSaveButtonsState();
            updateSidebarPosition();
        }, '_fav_dialog');
        
        updateFastSaveButtonsState();

        // add fav button on top
        
        var counterHtml = '<div class="'+ env.className + '-FavItemsCount ' + env.className + '-basecolor-dynamic"></div>';
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
            menuButtons['fav'] = favButton.parentNode;
            favCounter = favButton.getElementsByClassName(env.className  + '-FavItemsCount')[0];
            // if (handler.isMainDomain())
            handler.updateFavCounter();
        }
        
        if (!fav.coptions.optionsSide) {
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
                menuButtons['ctoptions'] = optionsButton.parentNode;
            }
        }
        
        // add fav container
        
        siteContent = envContainers.content;        
        if (siteContent) {
        
            favContent = document.createElement('div');
            favContent.className = env.className + '-FavContainer';
            
            favContent.className += ' ' + env.hostClass; 
            
            siteContent.parentNode.insertBefore(favContent, siteContent);
        } else {
            log('main container inner not found');
        }
        
        
        if (env.onInitWorktop) env.onInitWorktop();	
    }
    
    function updateFastSaveButtonsState() {
    
        if (!handler.isDownloadSupported || !fav.coptions.fastsave.enabled || !fav.coptions.fastsave.check) {
            return false;
        }
        
        if (!publications || !publications.length) return false;

        var scrollBottom = KellyTools.getViewport().scrollBottom;
        
        for (var i = 0; i < publications.length; i++) {
            
            if (!publications[i]) continue;
            var button = KellyTools.getElementByClass(publications[i], env.className + '-fast-save-unchecked');
           
            if (!button) continue;
            
            if (button.getBoundingClientRect().top < scrollBottom + 100) {
                fastDownloadCheckState(publications[i], button);
            }         
                    
        }
    }
    
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
        
        return menuButtonA;
    }
    
    function getPostUserName(postBlock) {
        var nameContainer = KellyTools.getElementByClass(postBlock, 'uhead_nick');
        if (nameContainer) {
            var img = KellyTools.getElementByClass(postBlock, 'avatar');
            if (img) return img.getAttribute('alt');
        }
        
        return false;
    }
    
    function getCommentUserName(comment) {
        var nameContainer = KellyTools.getElementByClass(comment, 'reply-link');
        if (nameContainer) {   
                var a = KellyTools.getElementByTag(nameContainer, 'A');
                if (a) return a.textContent || a.innerText || '';
        }
        
        return false;
    }
    
    function getCommentsList(postBlock) {    
        
        var postFooter =  KellyTools.getElementByClass(postBlock, 'ufoot');
        if (!postFooter) return false;
        
        var list =  KellyTools.getElementByClass(postFooter, 'post_comment_list');
        if (!list) return false;        
        
        var comments = list.getElementsByClassName('comment');
        if (comments.length) return comments;
        
        return false;               
    }
    
    // todo move to profile
    
    function formatPostContainer(postBlock) {
        
        if (fav.coptions.posts_blacklist) {  
            var userName = getPostUserName(postBlock);
            if (fav.coptions.posts_blacklist.indexOf(userName) != -1) { 
                postBlock.style.display = 'none';            
                return false;
            }
        }
        
        var censored = postBlock.innerHTML.indexOf('/images/censorship') != -1 ? true : false;
        
        if (!env.updatePostFavButton(postBlock)) return false;    
        
        var toogleCommentsButton = postBlock.getElementsByClassName('toggleComments');

        if (toogleCommentsButton.length) {
            toogleCommentsButton = toogleCommentsButton[0];
            handler.removeEventListener(toogleCommentsButton, 'click', 'toogle_comments_' + postBlock.id);
            
            handler.addEventListner(toogleCommentsButton, "click", function (e) {
                    handler.onPostCommentsShowClick(postBlock);
                    return false;
            }, 'toogle_comments_' + postBlock.id);
        }
        
        formatComments(postBlock);     
            
        var shareButtonsBlock = KellyTools.getElementByClass(postBlock, 'share_buttons');
        if (shareButtonsBlock) {
            
            var fastSave = KellyTools.getElementByClass(postBlock,  env.className + '-fast-save');
            if (!censored && fav.coptions.fastsave.enabled) {
                
                if (!fastSave) {
                    fastSave = document.createElement('DIV');                    
                    shareButtonsBlock.appendChild(fastSave); 
                        
                    var fastSaveBaseClass =  env.hostClass + ' ' + env.className + '-fast-save ' + env.className + '-icon-diskete ';
                
                    fastSave.className = fastSaveBaseClass + env.className + '-fast-save-unchecked';
                    fastSave.onclick = function() {
                        if (this.className.indexOf('loading') != -1 || this.className.indexOf('unavailable') != -1) return false;
                                          
                        fastSave.className = fastSave.className.replace('unchecked', 'checked');
                        this.className += ' ' + env.className + '-fast-save-loading';
                        
                        fastDownloadPostData(postBlock, false, function(success) {
                            fastSave.className = fastSaveBaseClass + env.className + '-fast-save-' + (success ? '' : 'not') + 'downloaded';
                        });
                        
                        return false;
                    }  
                } 
                
            } else {
                if (fastSave) {
                    fastSave.parentNode.removeChild(fastSave);
                }
            }
            
            if (fav.coptions.hideSoc) {
                var shareButtons = shareButtonsBlock.childNodes;
                for (var i = 0; i < shareButtons.length; i++) {            
                    if (shareButtons[i].tagName == 'A' && shareButtons[i].className.indexOf('share') != -1) {
                        // keep technically alive
                        shareButtons[i].setAttribute('style', 'height : 0px; width : 0px; opacity : 0; margin : 0px; padding : 0px; display : block; overflow : hidden;');
                    }
                }
            }
        }
    }
             
    function toogleActive(el) {
        if (!el) return;
        
        if (el.className.indexOf('active') !== -1) {
            el.className = el.className.replace('active', '');
        } else {
            el.className += ' active';
        }
    }
    
    // exit from Favourites plugin block
    
    this.hideFavoritesBlock = function() {
    
        siteContent.style.display = 'block';
        favContent.style.display = 'none';
        handler.removeEventListener(window, 'scroll', 'fav_scroll');

        imageGrid.close();
        
        for (var k in menuButtons){
            if (typeof menuButtons[k] !== 'function') {
                menuButtons[k].className = menuButtons[k].className.replace('active', '');
            }
        }

        handler.closeSidebar();
        mode = 'main';
        
        if (downloaderBox) {
            downloaderBox.modal.className = downloaderBox.modal.className.replace('active', 'hidden');
            
            imagesAsDownloadItems = false;
            sideBarLock = false;
        }
    }
    
    // вывести окно расширения и назначить режим отображения
    
    function displayFavouritesBlock(newMode) {
        siteContent.style.display = 'none';
        favContent.style.display = 'block';
                
        if (!newMode) mode = 'fav';
        else mode = newMode;
        
        for (var k in menuButtons){
            if (typeof menuButtons[k] !== 'function') {
                menuButtons[k].className = menuButtons[k].className.replace('active', '');
            }
        }
        
        if (typeof menuButtons[mode] != 'undefined') {
            menuButtons[mode].className += ' active';
        }
    }
    
    function getCommentText(comment) {
    
        var contentContainer = KellyTools.getElementByClass(comment, 'txt');
        
        if (!contentContainer) return '';
        
        var textContainer = contentContainer.childNodes[0];
        return textContainer.textContent || textContainer.innerText || '';
    }
    
    function formatComments(block) {
    
        var comments = getCommentsList(block);
        if (!comments) return false;
        
        for(var i = 0; i < comments.length; i++) {
        
            if (fav.coptions.comments_blacklist) {  
                var userName = getCommentUserName(comments[i]);
                if (fav.coptions.comments_blacklist.indexOf(userName) != -1) { 
                    comments[i].style.display = 'none';            
                    continue;
                }
            }
        
            var addToFavButton = comments[i].getElementsByClassName('kelly-add-to-fav');
            
            if (!addToFavButton.length) {
        
                var bottomLinks = comments[i].getElementsByClassName('reply-link');
                if (bottomLinks.length) {
                
                    addToFavButton = document.createElement('a');
                    addToFavButton.href = '#';
                    
                    addToFavButton.innerText = lng.s('Добавить в избранное', 'add_to_fav');
                    
                    addToFavButton.setAttribute('commentId', comments[i].id);
                    addToFavButton.className = 'kelly-add-to-fav';
            
                    bottomLinks[0].appendChild(addToFavButton);
                    // responseButton.parentNode.inserBefore(addToFavButton, responseButton.nextSibling) insert after
                }
            } else {
                addToFavButton = addToFavButton[0];
            }
            
            
            // searh comment by link
            var link = KellyTools.getRelativeUrl(env.getCommentLink(comments[i]));
            if (!link) continue;
            
            var inFav = handler.getStorageManager().searchItem(fav, {link : false, commentLink : link});
    
            if (inFav !== false) {
                
                addToFavButton.setAttribute('itemIndex', inFav);
                addToFavButton.onclick = function() { 
                    handler.showRemoveFromFavDialog(this.getAttribute('itemIndex')); 
                    return false;
                };
                
                addToFavButton.innerText = lng.s('Удалить из избранного', 'remove_from_fav');
                
            } else {
            
                addToFavButton.onclick =  function() {						
                    handler.showAddToFavDialog(block, document.getElementById(this.getAttribute('commentId')));
                    return false;					
                }
                
                addToFavButton.innerText = lng.s('Добавить в избранное', 'add_to_fav');
            }
            
        }
        
        log(comments.length + ' - '+ block.id);
    }
    
    // format comments on button show with delay, until comments block will be loaded
    this.onPostCommentsShowClick = function(postBlock, clearTimer) {
        
        if (clearTimer) {
            commentsBlockTimer = false;
            clearTimeout(commentsBlockTimer[postBlock.id]);
        }
        
        if (commentsBlockTimer[postBlock.id]) return false;
        
        var commentsBlock = postBlock.getElementsByClassName('comment_list_post'); // KellyTools.getElementByClass(postBlock, 'comment_list_post'); // check is block loaded  
               
        if (!commentsBlock.length) { // todo exit after num iterations        
            commentsBlockTimer[postBlock.id] = setTimeout(function() { handler.onPostCommentsShowClick(postBlock, true); }, 100);
            return false;
        }
                       
        formatComments(postBlock);
        return false;
    }
        
    // fires when fav element preview dimensions loaded
    // also dimensions can be catched by setSelectionInfo method during Fav item addition before save
    
    this.onFavImageLoad = function(imgElement, error) {
        
        if (!error) {
        
            var favItemIndex = parseInt(imgElement.getAttribute('itemIndex'));
            if (!fav.items[favItemIndex]) {
                
                log('fav item not found ' + favItemIndex);
                // imgElement.setAttribute('error', '1');
                imgElement.style.display = 'none';
                
            } else if (!fav.items[favItemIndex].pw) {			
                
                handler.saveWH(imgElement, favItemIndex);
                // if (catAnimateGif) {
                //	var preview = getPreviewImageByItem(fav.items[favItemIndex]);
                //	imgElement.src = preview;
                // }
            }
        }
    }
        
    this.updateImageGrid = function() {
        
        imageGrid.updateConfig({tilesBlock : imagesBlock});
        imageGrid.updateTileGrid();
        
        return;		
    }
    
    this.updateOptionsConfig = function() {
    
        if (KellyTools.getElementByClass(favContent, 'kellyAutoScroll').checked) {
            fav.coptions.autoload_onscroll = true;
        } else {
            fav.coptions.autoload_onscroll = false;
        }
        
        fav.coptions.grid = {
            fixed :  KellyTools.inputVal(env.className + 'GridFixed', 'int', favContent),
            rowHeight : KellyTools.inputVal(env.className + 'GridRowHeight', 'int', favContent),
            min : KellyTools.inputVal(env.className + 'GridMin', 'int', favContent), 
            cssItem : KellyTools.inputVal(env.className + 'GridCssItem', 'string', favContent),
            heightDiff : KellyTools.inputVal(env.className + 'GridHeightDiff', 'int', favContent),
            perPage : KellyTools.inputVal(env.className + 'GridPerPage', 'int', favContent),
            type : fav.coptions.grid.type,
        };
        
        if (fav.coptions.grid.fixed < 1) {
            fav.coptions.grid.fixed = 1;
        }
        
        if (fav.coptions.grid.fixed > 10) {
            fav.coptions.grid.fixed = 10;
        }
        
        if (fav.coptions.grid.min > 10) {
            fav.coptions.grid.min = 10;
        }
        
        var refreshPosts = false;
        
        var hideSocCurrent = fav.coptions.hideSoc;
        fav.coptions.hideSoc = KellyTools.getElementByClass(favContent, env.className + 'HideSoc').checked ? true : false;
        
        if (hideSocCurrent != fav.coptions.hideSoc) {
            refreshPosts = true;
        }
        
        var fastSaveCurrent = KellyTools.getElementByClass(favContent, env.className + 'FastSaveEnabled').checked ? true : false;
        
        if (fastSaveCurrent != fav.coptions.fastsave.enabled) {
            refreshPosts = true;
        }
        
        var fconflictActions = document.getElementsByClassName(env.className + '-conflict');
        var fconflict = 'overwrite';
        
        for (var i = 0; i < fconflictActions.length; i++) {
        
            var value = KellyTools.inputVal(fconflictActions[i]);
            
            if (value && fconflictActions[i].checked && ['overwrite', 'uniquify'].indexOf(value) != -1) {
                 fconflict = fconflictActions[i].value;
            }
        }
        
        fav.coptions.fastsave = {
            baseFolder : KellyTools.inputVal(env.className + 'FastSaveBaseFolder', 'string', favContent),
            // nameTemplate : KellyTools.getElementByClass(favContent, env.className + 'FastSaveNameTemplate').value,
            enabled : fastSaveCurrent,
            check :  KellyTools.getElementByClass(favContent, env.className + 'FastSaveCheck').checked ? true : false,
            conflict : fconflict,
        };
        
        fav.coptions.debug = false;
        debug = false;
        env.debug = false;
        
        if (KellyTools.getElementByClass(favContent, env.className + 'OptionsDebug').checked) {
            fav.coptions.debug = true;
            debug = true;
            env.debug = false;
        }
        
        fav.coptions.newFirst = false;
        if (KellyTools.getElementByClass(favContent, env.className + 'NewFirst').checked) {
            fav.coptions.newFirst = true;
        }
        
        fav.coptions.syncByAdd = false;
        if (KellyTools.getElementByClass(favContent, env.className + 'SyncByAdd').checked) {
            fav.coptions.syncByAdd = true;
        }
        
        fav.coptions.optionsSide = false;
        if (KellyTools.getElementByClass(favContent, env.className + 'OptionsSide').checked) {
            fav.coptions.optionsSide = true;
        }
        
        var menuButton = KellyTools.getElementByClass(document, env.className + '-MainMenuItem-options');
        if (fav.coptions.optionsSide && menuButton) {            
            menuButton.parentElement.removeChild(menuButton);
            delete menuButtons['ctoptions'];
        } else if (!fav.coptions.optionsSide && !menuButton) {
            
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
                menuButtons['ctoptions'] = optionsButton.parentNode;
            }  
            
        }
        
           
        var iconFile = KellyTools.getElementByClass(favContent, 'kellyAutoScroll');
        
        if (iconFile.value) {
        
            var saveIcon = function(el, icon) {
                log(icon);
            }
            
            KellyTools.readInputFile(iconFile, saveIcon, 'dataurl');
        } 
                
        if (!fav.coptions.grid.rowHeight || fav.coptions.grid.rowHeight <= 0) fav.coptions.grid.rowHeight = 250;
        if (!fav.coptions.grid.min || fav.coptions.grid.min <= 0) fav.coptions.grid.min = 2;
        if (!fav.coptions.grid.heightDiff || fav.coptions.grid.heightDiff <= 0) fav.coptions.grid.heightDiff = 10;
        if (!fav.coptions.grid.perPage || fav.coptions.grid.perPage <= 0) fav.coptions.grid.perPage = 60;
        
        if (fav.coptions.grid.perPage > 1000) {
            fav.coptions.grid.perPage = 1000;
        }
        
        if (fav.coptions.grid.heightDiff > 60) {
            fav.coptions.grid.heightDiff = 60;
        }
                
        fav.coptions.comments_blacklist = KellyTools.getVarList(KellyTools.inputVal('kellyBlockcomments', 'string', favContent));
        fav.coptions.posts_blacklist = KellyTools.getVarList(KellyTools.inputVal('kellyBlockposts', 'string', favContent));
        
        var applaySave = function() {
        
            handler.showOptionsDialog();
            
            var messageBox = document.getElementsByClassName(env.className + '-OptionsMessage');
            
            for (var i = 0; i < messageBox.length; i++) {
                messageBox[i].innerText = lng.s('Настройки сохранены', 'options_saved');
            }
            
            handler.save('cfg');
        }
        
        applaySave();	

        
        if (refreshPosts) {
            
            handler.formatPostContainers(); 
        }        
    }
    
    this.showOptionsDialog = function(tabActive) {
       
        imageGrid.updateConfig({tilesBlock : false});
        
        if (!tabActive) {
            tabActive = env.className + '-BaseOptions';
                
            var tabItems = favContent.getElementsByClassName(env.className + '-tab-item');
            for (var i = 0; i < tabItems.length; i++) {
                if (tabItems[i].className.indexOf('active') != -1) {
                    tabActive = tabItems[i].getAttribute('data-tab');
                }
            }
        }
        
        if (fav.coptions.optionsSide) {
           
            var backActionButtons = sideBarWrap.getElementsByTagName('A');
            for (var i = 0; i < backActionButtons.length; i++) {
                backActionButtons[i].onclick = function() {
                    handler.showFavouriteImages();
                    return false;
                }                
            }
            
        } else {            
            
            handler.closeSidebar();
        }
                
        // currently only one type of storage
        favContent.innerHTML = '';
        var output= '';
    
        output += '<h3>' + lng.s('Добавление в избранное', 'options_fav_add') + '</h3>';
        output += '<table class="' + env.className + '-options-table">';
      
        output += '<tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'SyncByAdd" ' + (fav.coptions.syncByAdd ? 'checked' : '') + '> ' + lng.s('Дублировать в основное избранное пользователя если авторизован', 'sync_by_add') + '</label></td></tr>';
        output += '<tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'HideSoc" ' + (fav.coptions.hideSoc ? 'checked' : '') + '> ' + lng.s('Скрывать кнопки соц. сетей из публикаций', 'hide_soc') + '</label></td></tr>';
        
        output += '</table>';
        
        output += '<h3>' + lng.s('Быстрое сохранение', 'fast_download') + '</h3>';	
        
        output += '<table class="' + env.className + '-options-table">\
            <tr><td colspan="2"><label><input type="checkbox" class="' + env.className + 'FastSaveEnabled" ' + (fav.coptions.fastsave.enabled ? 'checked' : '') + '> ' + lng.s('Показывать кнопку быстрого сохранения для публикаций', 'fast_save_enabled') + '</label></td></tr>\
            <tr><td>' + lng.s('Сохранять в папку', 'fast_save_to') + '</td><td><input type="text" class="' + env.className + 'FastSaveBaseFolder" placeholder="' + env.profile + '/Fast' + '" value="' +  fav.coptions.fastsave.baseFolder + '"></td></tr>\
            <tr class="radioselect"><td colspan="2">\
                \
                    <label><input type="radio" name="' + env.className + '-conflict" class="' + env.className + '-conflict" ' + (!fav.coptions.fastsave.conflict || fav.coptions.fastsave.conflict == 'overwrite' ? 'checked' : '') + '> \
                    ' + lng.s('Перезаписывать при совпадении имен', 'fast_save_overwrite') + '\
                    </label>\
                    <label><input type="radio" name="' + env.className + '-conflict" class="' + env.className + '-conflict" ' + (fav.coptions.fastsave.conflict == 'uniquify' ? 'checked' : '') + '> \
                    ' + lng.s('Сохранять с другим именем', 'fast_save_uniq') + '\
                    </label>\
                \
            </td></tr>\
            <tr><td colspan="2">\
                <label><input type="checkbox" value="1" class="' + env.className + 'FastSaveCheck" ' + (fav.coptions.fastsave.check ? 'checked' : '') + '> ' + lng.s('Проверять был ли уже скачан файл', 'fast_save_check') + '</label>\
                <p>' + lng.s('Если файл уже скачан ранее, к кнопке сохранения будет добавлен зеленый маркер', 'fast_save_check_notice') + '</p>\
                </td>\
            </tr>\
            <!--tr><td>Шаблон имени файла</td><td><input type="text" class="' + env.className + 'FastSaveNameTemplate" value="' +  fav.coptions.fastsave.nameTemplate + '"></td></tr-->\
        ';
        output += '</table>';
        
        output += '<h3>' + lng.s('Настройки страницы избранного', 'cgrid_tiles_header') + '</h3>';		
         
        output += '<table class="' + env.className + '-options-table"><tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'NewFirst" ' + (fav.coptions.newFirst ? 'checked' : '') + '> ' + lng.s('Новые в начало', 'cgrid_new_to_begin') + '</td></tr>';        
        output += '<tr><td>' + lng.s('Элементов на страницу', 'cgrid_per_page') + '</td> <td><input type="text" class="' + env.className + 'GridPerPage" value="' +  fav.coptions.grid.perPage + '"></td></tr>';
        
        output += '<tr><td colspan="2">' + lng.s('Режим отображения публикаций', 'cgrid_type') + '</td></tr>';
        output += '\
            <tr class="radioselect"><td colspan="2">\
                \
                    <label><input type="radio" value="dynamic" name="' + env.className + 'GridType" class="' + env.className + 'GridType" ' + (fav.coptions.grid.type == 'dynamic'  ? 'checked' : '') + '> ' + lng.s('Динамическое количество в строке', 'cgrid_type_dynamic') + '</label>\
                    <label><input type="radio" value="fixed" name="' + env.className + 'GridType" class="' + env.className + 'GridType" ' + (fav.coptions.grid.type == 'fixed'  ? 'checked' : '') + '> ' + lng.s('Фиксированое количество в строке', 'cgrid_type_fixed') + '</label>\
                \
            </td></tr>\
        ';
        
        var classRow = env.className + 'GridType-option ' + env.className + 'GridType-dynamic ';
            classRow += fav.coptions.grid.type == 'dynamic' ? 'active' : 'hidden';
                  
        output += '<tr class="' + classRow + '"><td>' + lng.s('Максимальная высота одной строки', 'cgrid_max_row_height') + ' (px)</td> <td><input type="text" class="' + env.className + 'GridRowHeight" value="' +  fav.coptions.grid.rowHeight + '"></td></tr>';
        output += '<tr class="' + classRow + '"><td>' + lng.s('Допустимая погрешность высоты строки', 'cgrid_max_diff') + ' (%)</td> <td><input type="text" class="' + env.className + 'GridHeightDiff" value="' +  fav.coptions.grid.heightDiff + '"></td></tr>';
        output += '<tr class="' + classRow + '"><td>' + lng.s('Минимальное кол-во элементов в строке', 'cgrid_min_number') + '</td> <td><input type="text" class="' + env.className + 'GridMin" value="' +  fav.coptions.grid.min + '"></td></tr>';
            
            classRow = env.className + 'GridType-option ' + env.className + 'GridType-fixed ';
            classRow += fav.coptions.grid.type && fav.coptions.grid.type == 'fixed' ? 'active' : 'hidden';
            
        output += '<tr class="' + classRow + '"><td>' + lng.s('Фиксированное кол-во элементов на строку', 'cgrid_fixed') + '</td> <td><input type="text" class="' + env.className + 'GridFixed" value="' +  (!fav.coptions.grid.fixed ? '4' : fav.coptions.grid.fixed) + '"></td></tr>';
        
        output += '<tr><td>' + lng.s('Стиль по умолчанию для элемента строки', 'cgrid_default_rowst') + '</td> <td><input type="text" class="' + env.className + 'GridCssItem" value="' +  fav.coptions.grid.cssItem + '"></td></tr>';
        
        /*
        output += '<tr><td colspan="2"><h3>Кнопка меню</h3></td></tr>';	

        output += '<tr><td>Иконка :</td><td>';
        
        if (!fav.coptions.icon) {
            output += '<div class="' + env.className + '-icon ' + env.className + '-icon-diskete" style="position : static; display : inline-block;"></div>';
        } else {
            output += '<div class="' + env.className + '-icon" style="' + fav.coptions.icon + '"></div>';
        }
        
        output += '<input type="file" class="' + env.className + 'Icon"></td></td>';		
        */        
        output += '</table>';
                
        output += '<div><input type="submit" value="' + lng.s('Сохранить', 'save') + '" class="' + env.className + '-OptionsSave"></div>';
        output += '<div class="' + env.className + '-OptionsMessage"></div>';       
                
        var tabBaseOptions = document.createElement('DIV');            
            tabBaseOptions.className = env.className + '-tab ' + env.className + '-BaseOptions';	
            
            KellyTools.setHTMLData(tabBaseOptions, output);
            
        var tabStorage = document.createElement('DIV');
            tabStorage.className = env.className + '-tab ' + env.className + '-Storage';
            
        var tabOther = document.createElement('DIV');
            tabOther.className = env.className + '-tab ' + env.className + '-Other';
            
        var tabControlls = document.createElement('DIV');
        
            output = '\
            <div class="' + env.className + '-tab-list">\
                <ul>\
                    <li data-tab="' + env.className + '-BaseOptions" class="' + env.className + '-tab-item ' + env.className + '-buttoncolor-dynamic" >\
                        <a href="#" >' + lng.s('Основные настройки', 'options_main') + '</a>\
                    </li>\
                    <li data-tab="' + env.className + '-Storage" class="' + env.className + '-tab-item ' + env.className + '-buttoncolor-dynamic" >\
                        <a href="#">' + lng.s('Данные', 'storage') + '</a>\
                    </li>\
                    <li data-tab="' + env.className + '-Other" class="' + env.className + '-tab-item ' + env.className + '-buttoncolor-dynamic" >\
                        <a href="#" >' + lng.s('Остальное', 'other') + '</a>\
                    </li>\
                </ul>\
            </div>';
            
        KellyTools.setHTMLData(tabControlls, output);
            
        favContent.appendChild(tabControlls);
        favContent.appendChild(tabBaseOptions);
        favContent.appendChild(tabStorage);
        favContent.appendChild(tabOther);

        var gridType = favContent.getElementsByClassName(env.className + 'GridType');
        if (gridType) {
            for (var i = 0; i < gridType.length; i++) {
            
                gridType[i].onclick = function() {
                
                    fav.coptions.grid.type = this.value;
                    
                    if (!fav.coptions.grid.type ||  fav.coptions.grid.type == 'dynamic') {
                         fav.coptions.grid.type = 'dynamic';
                    } else {
                         fav.coptions.grid.type = 'fixed';
                    }
                    
                    var typeOptionList = favContent.getElementsByClassName(env.className + 'GridType-option');
                    if (typeOptionList) {
                        for (var i = 0; i < typeOptionList.length; i++) {
                        
                            if (typeOptionList[i].className.indexOf(fav.coptions.grid.type) == -1) {
                                typeOptionList[i].className = typeOptionList[i].className.replace('active', 'hidden');
                            } else {
                                typeOptionList[i].className = typeOptionList[i].className.replace('hidden', 'active');
                            }
                        }
                    }
                }
            }
        }
            
        var tabMenuItems = tabControlls.getElementsByClassName(env.className + '-tab-item');
        for (var i = 0; i < tabMenuItems.length; i++) {
            var tabEl = KellyTools.getElementByClass(favContent, tabMenuItems[i].getAttribute('data-tab'));
            if (!tabEl) continue;
            
            if (tabMenuItems[i].getAttribute('data-tab').indexOf(tabActive) != -1) {
                tabMenuItems[i].className += ' active';
                tabEl.style.display = 'block';
            } else {
                tabEl.style.display = 'none';
            }
            
            tabMenuItems[i].onclick = function() {
            
                for (var i = 0; i < tabMenuItems.length; i++) {
                    tabMenuItems[i].className = tabMenuItems[i].className.replace('active', '').trim();
                    KellyTools.getElementByClass(favContent, tabMenuItems[i].getAttribute('data-tab')).style.display = 'none';
                }
                
                KellyTools.getElementByClass(favContent, this.getAttribute('data-tab')).style.display = 'block';
                this.className += ' active';
                
                var messageBox = document.getElementsByClassName(env.className + '-OptionsMessage');
                for (var i = 0; i < messageBox.length; i++) {
                    messageBox[i].innerHTML = '';
                }
                return false;
            }
        }			
                    
        output = '<table>';        
        output += '<tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'OptionsSide" ' + (fav.coptions.optionsSide ? 'checked' : '') + '> \
               ' + lng.s('Перенести кнопку настроек из основного в боковое меню фильтров', 'options_side') + '</label></td></tr>';
       
        output += '<tr><td>' + lng.s('Игнорировать комментарии', 'ignore_comments') + ' :</td>\
                        <td><input type="text" class="kellyBlockcomments" value="' + KellyTools.varListToStr(fav.coptions.comments_blacklist) + '"></td>\
                   </tr>';
        output += '<tr><td>' + lng.s('Игнорировать посты', 'ignore_publications') + ' :</td>\
                        <td><input type="text" class="kellyBlockposts" value="' + KellyTools.varListToStr(fav.coptions.posts_blacklist) + '"></td>\
                   </tr>';
        output += '<tr><td colspan="2"><label><input type="checkbox" class="' + env.className + 'OptionsDebug" ' + (debug ? 'checked' : '') + '> ' + lng.s('Режим отладки', 'debug') + '</label></td></tr>';
        output += '<tr><td colspan="2"><label>' + lng.s('Версия', 'ext_ver') + ' : ' + handler.PROGNAME + '</label></td></tr>';
                  
        output += '</table>';
        output += '<div><input type="submit" value="' + lng.s('Сохранить', 'save') + '" class="' + env.className + '-OptionsSave"></div>';
        output += '<div class="' + env.className + '-OptionsMessage"></div>';    
        
        KellyTools.setHTMLData(tabOther, output);
        
        handler.getStorageManager().wrap = tabStorage;
        handler.getStorageManager().showDBManager();
        
        var saveButtons = document.getElementsByClassName(env.className + '-OptionsSave');
        for (var i = 0; i < saveButtons.length; i++) {
            saveButtons[i].onclick = function() {
                handler.updateOptionsConfig();
                return false;
            }
        }
        
        displayFavouritesBlock('ctoptions');
        
        var message = {};

        for (var k in KellyLoc.locs) {
            message[k] = {message : KellyLoc.locs[k]}
        }
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
            
        list.innerHTML = '';
        
        if (fav.items[index].categoryId) {
        
            for (var b = 0; b < fav.items[index].categoryId.length; b++) {
                
                var catLiItem = document.createElement('li');
                var category = handler.getStorageManager().getCategoryById(fav, fav.items[index].categoryId[b]);
                
                var spanName = document.createElement('span');
                    spanName.innerText = category.name;
                
                list.appendChild(spanName);
                
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
        if (index != -1) {        
            fav.items[postIndex].categoryId.splice(index, 1);
        }
        
        fav.items[postIndex].categoryId = validateCategories(fav.items[postIndex].categoryId);
        
        var list = document.getElementById(env.className + '-cat-list-post' + postIndex);
        
        if (list) {
            updatePostCatList(postIndex, list);
        }
        
        handler.save('items');
    } 
    
    this.addCatsForPost = function(index) {
        
        if (!extendCats.length) return false
        
        if (!fav.items[index]) return false;
        
        for (var i = 0; i < extendCats.length; i++) {
        
            if (fav.items[index].categoryId.indexOf(extendCats[i]) != -1) continue;
            
            fav.items[index].categoryId[fav.items[index].categoryId.length] = parseInt(extendCats[i]);
        }
        
        fav.items[index].categoryId = validateCategories(fav.items[index].categoryId);
        
        var list = document.getElementById(env.className + '-cat-list-post' + index)
        
        if (list) {
            updatePostCatList(index, list);
        }
        
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
    
    function getPreviewImageByItem(item, full) {
        if (!item || !item.pImage) return '';        
        
        if (typeof item.pImage == 'string') {
            if (item.pImage.trim() !== '') return env.getImageDownloadLink(item.pImage, full);            
        } else {
            if (item.pImage.length) return env.getImageDownloadLink(item.pImage[0], full);
        }
        
        return '';
    }
    
    function showItemInfoTooltip(index, target) {
    
        if (!fav.items[index]) return;
        
        var tooltipEl = handler.getTooltip();
            tooltipEl.updateCfg({
                target : target, 
                offset : {left : 0, top : 0}, 
                positionY : 'bottom',
                positionX : 'left',				
                ptypeX : 'inside',
                ptypeY : 'outside',
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
                handler.showRemoveFromFavDialog(this.getAttribute('itemIndex'), updateFavPage, updateFavPage, updateFavPage);
                
                return false; 
            }
            
            removeItem.innerText = lng.s('Удалить', 'delete');
            removeItem.href = '#';
            removeItem.style.display = 'block';

        itemInfo.appendChild(removeItem);
         
        var addCats = document.createElement('a');
            addCats.href = '#';
            addCats.innerText = lng.s('Добавить отмеченые категории', 'add_selected_cats'); 
            addCats.setAttribute('itemIndex', index);
            addCats.onclick = function() {
                handler.addCatsForPost(parseInt(this.getAttribute('itemIndex')));
                
                return false;
            }
                            
        itemInfo.appendChild(addCats);
        
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

        displayedItems = []; // все элементы попавшие в выборку
        
        // applay filters 
        
        for (var i = fav.coptions.newFirst ? fav.items.length-1 : 0; fav.coptions.newFirst ? i >= 0 : i < fav.items.length; fav.coptions.newFirst ? i-- : i++) {
                               
            if (excludeFavPosts && !fav.items[i].commentLink) continue;
            if (excludeFavComments && fav.items[i].commentLink) continue;            
            if (imagesAsDownloadItems && !getPreviewImageByItem(fav.items[i])) continue;
            
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
            var previewImage = getPreviewImageByItem(item);
            
            // whole gallery images array for current selector
            
            if (previewImage) {
            
                var galleryIndex = galleryImages.length;
                
                    galleryImages[galleryIndex] = previewImage;
                    galleryImagesData[galleryIndex] = item;           
            }
        }
        
    }
      
    function updateFilteredData() {

        if (!checkSafeUpdateData()) {
            return false;
        }
        
        displayedItems = false;
                
        updateDisplayItemsList();
        
        if (imagesAsDownloadItems) {
            
            handler.getDownloadManager().setDownloadTasks(displayedItems);
            handler.getDownloadManager().showGrabManager();
        }
        
        // init gallery only for current page
        // create gallery, by array
        imgViewer.addToGallery(galleryImages, 'fav-images', galleryImagesData);  
    }
    
    this.downloadFilteredData = function(format) { // todo format
        
        if (!displayedItems || !displayedItems.length) return false;
        
        var storage = handler.getStorageManager().getDefaultData();       
            storage.ids = fav.ids;
            storage.categories = [];
        
        // revers order (first added to array will count as "oldes")
        for (var i = displayedItems.length-1; i >= 0; i--) {
            
            var item = fav.items[displayedItems[i]];
            var itemCats = item.categoryId;
            
            if (itemCats) {
                for (var c = 0; c < itemCats.length; c++) {
                    if (handler.getStorageManager().getCategoryById(storage, itemCats[c]).id == -1) {
                        storage.categories[storage.categories.length] = handler.getStorageManager().getCategoryById(fav, itemCats[c]);
                    }                    
                }	
            }

            storage.items[storage.items.length] = item;			
        }
  
        var fname = env.profile + '/Storage/FilteredFavourites/';
            fname += fav.coptions.storage + '_filtered_' + KellyTools.getTimeStamp() + '.' + handler.getStorageManager().format;
            fname = KellyTools.validateFolderPath(fname);
            
        KellyTools.createAndDownloadFile(JSON.stringify(storage), fname);
        return true;
    }
    
    function showItem(item, subItem) {
        
        if (!item) return false;
        
        if (typeof item.pImage !== 'string') {
            subItem = subItem <= item.pImage.length-1 ? subItem : 0;
        } else subItem = 0;
        
        var previewImage = getPreviewImageByItem(item);
        
        var index = fav.items.indexOf(item);
           
        var itemBlock = document.createElement('div');
            itemBlock.className = env.className + '-FavItem ';			
            itemBlock.id = env.className + '-FavItem-' + item.id;
            
        if (subItem) {
            itemBlock.id += '-' + subItem;
            previewImage = env.getImageDownloadLink(item.pImage[subItem], false);
        }
                            
        var collectionBtn = false;
        var imageCount = 0;
                    
        itemBlock.setAttribute('itemIndex', index);
        
        if (!previewImage) {
            
            var freeSpace = 250;
            
            var text = (!item.name && !item.text) ? '<div class="' + env.className + '-preview-text-noimage">' + lng.s('Без изображения', 'no_image') + '</div>' : '';
            
            if (item.name) {
                freeSpace -= item.name.length;
                text += '<div class="' + env.className + '-preview-text-name">' + item.name + '</div>';
            }
            
            if (freeSpace > 0 && item.text) {
                var ctext = item.text.length > freeSpace ? value.substring(0, freeSpace) + '...' : item.text;
                text += '<div class="' + env.className + '-preview-text-ctext">' + item.text + '</div>';
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
            
            var pInfo = '';
            if (item.pw && !subItem) { // no proportions info for sub items currently
                pInfo = ' data-width="' + item.pw + '" data-height="' + item.ph + '" ';
            }                
            
            //if (item.pw) {
            //	itemBlock.setAttribute('data-width', item.pw);
            //	itemBlock.setAttribute('data-height', item.ph);
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
                
                // todo button to explode collection 
                
                collectionBtn = document.createElement('a');
                collectionBtn.innerText = imageCount;
                collectionBtn.href = item.pImage[0];
                collectionBtn.className = env.className + '-FavItem-collection';
                
                collectionBtn.setAttribute('kellyGallery', 'collection');
                collectionBtn.setAttribute('kellyGalleryIndex', 0);
                collectionBtn.setAttribute('itemIndex', index);
                
                collectionBtn.onclick = function() {
                
                    var item = fav.items[this.getAttribute('itemIndex')];
                                            
                    imgViewer.addToGallery(item.pImage, 'collection', item);
                    imgViewer.loadImage(this);   
                    
                    return false;
                }
                
            }
            // todo replace
            //env.getImageDownloadLink(galleryImages[galleryIndex], true)
            
            if (!fav.coptions.animateGif || !item.pw) previewImage = env.getStaticImage(previewImage);
            
            var html = '\
                <img style="' + fav.coptions.grid.cssItem + '" \
                     class="' + env.className + '-preview" \
                     kellyGalleryIndex="' + (galleryImagesData.indexOf(item) + subItem) + '" \
                     kellyGallery="fav-images" \
                     itemIndex="' + index + '"' + pInfo + additionAtributes + '\
                     src="' + previewImage + '" \
                >';
                            
            KellyTools.setHTMLData(itemBlock, html);       
        }
        
        if (!imagesAsDownloadItems) {
        
            var postLink = document.createElement('a');
                postLink.href = item.commentLink ? item.commentLink : item.link;
                postLink.className = env.className + '-FavItem-overlay-button';
                postLink.innerText = item.commentLink ? lng.s('Комментарий', 'comment') : lng.s('Публикация', 'publication'); 
                postLink.setAttribute('target', '_blank');
            
            var postHd = false;
            
            if (imageCount > 0) {
            
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
                
                if (readOnly) return false;
                
                var itemIndex = this.getAttribute('itemIndex');
                showItemInfoTooltip(this.getAttribute('itemIndex'), this);
            }  
                
            itemBlock.onmouseout = function(e) {    
                
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
    
    // noClear - add to show list (on move to next page for example)
    
    this.updateImagesBlock = function(noClear) {
        
        if (!imagesBlock) return false;
        if (!fav.items.length) {
            imagesBlock.innerText = lng.s('Список избранных публикаций пуст', 'fav_list_empty');
            return false;
        }
        
        // clear elements if update during page listing
        if (!noClear) {
            while (imagesBlock.firstChild) {
                imagesBlock.removeChild(imagesBlock.firstChild);
            }
        }
        
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
              
    function getSelectedPostMediaControlls(loadDimensions) {

        var controlls = document.createElement('DIV');
            controlls.className = env.className + '-ModalBox-PreviewContainer active';
        
        var html = '';
        
        if (selectedImages.length > 1) {
            html += '<p>' + lng.s('Основное изображение', 'image_main') + '</p>' +
                   '<p class="' + env.className + '-ModalBox-controll-buttons">' + 
                   '<a href="#" class="' + env.className + '-PreviewImage-del">' + lng.s('Удалить', 'delete')  + '</a><a href="#" class="' + env.className + '-PreviewImage-prev">\
                    ' + lng.s('Предыдущее', 'prev') + '</a><a href="#" class="' + env.className + '-PreviewImage-next">' + lng.s('Следующее', 'next')  + '</a>' +
                    '</p>';
        }
        
        if (selectedImages.length) {
            
            html += '<div class="' + env.className + '-PreviewImage-container"><img src="' + env.getStaticImage(selectedImages[0]) + '" class="' + env.className + '-PreviewImage"></div>';
        }
        
        KellyTools.setHTMLData(controlls, html);
        
        KellyTools.getElementByClass(controlls, env.className + '-PreviewImage-prev').onclick = function() { handler.switchPreviewImage(-1); return false; }
        KellyTools.getElementByClass(controlls, env.className + '-PreviewImage-next').onclick = function() { handler.switchPreviewImage(1); return false; }
        KellyTools.getElementByClass(controlls, env.className + '-PreviewImage-del').onclick = function() { handler.switchPreviewImage(0); return false; }
        
        if (loadDimensions) {
            KellyTools.getElementByClass(controlls, env.className + '-PreviewImage').onload = commonActions.onLoadPreviewImage;
        }
        
        return controlls;
    }
        
    function showCategoryCreateTooltip(target) {
        
        var tooltipEl = handler.getTooltip();
            tooltipEl.updateCfg({
                target : target, 
                offset : {left : 0, top : 0}, 
                positionY : 'bottom',
                positionX : 'left',
                ptypeX : 'inside',                
                ptypeY : 'outside',
            });
        
        html = '\
            <div class="' + env.className + 'CatAddForm">\
                <div>\
                    <input type="text" placeholder="' + lng.s('Название новой категории', 'cat_name') + '" value="" class="' + env.className + 'CatName"><br>\
                    <input type="text" placeholder="' + lng.s('Приоритет', 'cat_order') + '" value="" class="' + env.className + 'CatOrder"><br>\
                    <a href="#" class="' + env.className + 'CatCreate">' + lng.s('Создать категорию', 'cat_create') + '</a>\
                </div>\
            </div>';
        
        var container = tooltipEl.getContent();
        KellyTools.setHTMLData(container, html);
        
        KellyTools.getElementByClass(container, env.className + 'CatCreate').onclick = function () { 
            if (handler.categoryCreate(container)) {
                
                // handler.showFavouriteImages();
                showCatList();
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
    
    function showCategoryControllTooltip(id, target) {
        
        var category = handler.getStorageManager().getCategoryById(fav, id);                
        if (category.id == -1) return false;
        
        var tooltipEl = handler.getTooltip();
            tooltipEl.updateCfg({
                target : target, 
                offset : {left : 0, top : 0}, 
                positionY : 'bottom',
                positionX : 'left',
                ptypeX : 'inside',                
                ptypeY : 'outside',
            });
        
        // Edit mode add to image check
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
                <p>' + lng.s('Новое название', 'new_name') + '</p>\
                <input class="' + baseClass + '-newname" type="text" value="' + category.name + '" placeholder="' + lng.s('Новое название', 'new_name') + '">\
                <p class="' + baseClass + '-order-buttons">' + lng.s('Приоритет', 'cat_order') + '\
                <a href="#" class="' + env.className + '-neworder-up">&#9650;</a><a href="#" class="' + env.className + '-neworder-down">&#9660;</a></p>\
                <!--input class="' + baseClass + '-neworder" type="text" value="' + (!category.order ? itemIndex : category.order) + '" placeholder="' + lng.s('Приоритет', 'cat_order') + '"-->\
                <br>\
                <a class="' + baseClass + '-newname-button" href="#">' + lng.s('Применить', 'change') + '</a>\
                ' + deleteButtonHtml + '\
            </div>';
        
        var container = tooltipEl.getContent();
            KellyTools.setHTMLData(container, html);
        
        var flushCatButton = function() {            
            setTimeout(function() {
                var filterButton = document.getElementById(env.className + '-extend-filter-' + category.id); 
                
                if (filterButton && filterButton.className.indexOf('flush') == -1) {
                    filterButton.className += ' flush';
                    setTimeout(function() {
                        filterButton.className = filterButton.className.replace('flush', '').trim();             
                    }, 300);
                } 
            }, 100);
        }
        
        var changeCatOrder = function(el, up) {
        
                itemIndex = handler.getStorageManager().categoryOrder(fav.categories, itemIndex, up);
                showCatList();
                flushCatButton();
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
                    
                }
                
                var result = handler.categoryEdit(editCat, itemIndex);
                if (!result) return false;
                
                showCatList();                
                flushCatButton();
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
                
                    if (readOnly) return false; 
                    showCategoryControllTooltip(this.getAttribute('itemId'), this);    
                }
                
                filter.onmouseout = function(e) {
                
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

            if (readOnly) filterAdd.style.display = 'none';
            
            KellyTools.setHTMLData(filterAdd, '<a href="#" onclick="return false;">+</a>');
            
            filterAdd.onmouseover = function (e) { 
                showCategoryCreateTooltip(this);    
            }
            
            filterAdd.onmouseout = function(e) {
            
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
    
    function checkSafeUpdateData() {
    
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
        imageGrid.updateConfig({rowHeight : fav.coptions.grid.rowHeight, rules : fav.coptions.grid});
        
        
        if (fav.coptions.grid.type != 'fixed') {
            imageGrid.updateConfig({rules : {fixed : false}});
        }
        
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
        
        favContent.innerHTML = '';
        
        var editButton = document.createElement('a');
            editButton.href = '#';
            editButton.innerHTML = '';
            editButton.title = lng.s('Режим редактирования', 'edit_mode');
            editButton.onclick = function() {
                
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
            resetButton.innerText = lng.s('Сбросить', 'reset');
            resetButton.onclick = function() {
            
                if (!checkSafeUpdateData()) return false;
                
                handler.resetFilterSettings();
                handler.showFavouriteImages();
                
                return false;				
            }
            
            resetButton.className = env.className + '-FavEditButton-reset';
        
        var filterComments = editButton.cloneNode();
            filterComments.className = env.className + '-FavFilter ' + env.className + '-buttoncolor-dynamic';
            filterComments.innerText = lng.s('Комменты', 'comments');
           
        var filterPosts = filterComments.cloneNode();
            filterPosts.innerText = lng.s('Публикации', 'items');          
        
            if (!excludeFavPosts) filterPosts.className += ' active';
            if (!excludeFavComments) filterComments.className += ' active';
            
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
        
        var typeFiltersContainer = document.createElement('div');
            typeFiltersContainer.className = env.className + '-TypeFiltersContainer';
            typeFiltersContainer.appendChild(filterComments);
            typeFiltersContainer.appendChild(filterPosts);
            
        var logicButton = editButton.cloneNode();
            logicButton.className = env.className + '-FavFilter ' + env.className + '-FavFilter-logic';
            logicButton.innerText = lng.s('Логика И', 'logic_and');
            // logic.alt = 'Вывести записи где есть хотябы один из выбранных тегов';
            
            logicButton.onclick = function () {
                
                if (!checkSafeUpdateData()) return false;
                
                if (logic == 'or') {
                    logic = 'and';
                    this.innerText = lng.s('Логика И', 'logic_and');
                    
                } else {
                    logic = 'or';
                    this.innerText = lng.s('Логика ИЛИ', 'logic_or');
                }
                
                updateFilteredData();
                
                handler.updateImagesBlock();
                handler.updateImageGrid();
                
                return false;
            }
            
        var no = logicButton.cloneNode();
            no.className = env.className + '-FavFilter';
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
            
        var nsfw = logicButton.cloneNode();		
            nsfw.className = env.className + '-FavFilter';
            
            if (fav.coptions.ignoreNSFW) nsfw.innerText = '- NSFW';
            else nsfw.innerText = '+ NSFW';
            
            nsfw.onclick = function () {
                
                if (!checkSafeUpdateData()) return false;
                
                if (fav.coptions.ignoreNSFW) {
                    fav.coptions.ignoreNSFW = false;
                    this.innerText = '+ NSFW';
                } else {
                    fav.coptions.ignoreNSFW = true;
                    this.innerText = '- NSFW';
                }
                
                handler.save('cfg');
                
                page = 1;
                handler.showFavouriteImages();
                return false;
            }
            
            if (!env.isNSFW()) {                
                nsfw.style.display = 'none';
            }
            
        var additionButtons = document.createElement('div');
            additionButtons.className = env.className + '-filters-AdditionButtons';
            
            additionButtons.appendChild(resetButton);
            additionButtons.appendChild(editButton);
        
        if (optionsButton) {
            additionButtons.appendChild(optionsButton);
        }
            
        if (handler.isDownloadSupported) {   
            
            var showDownloadManagerForm = function(show) {
                
                if (!show) {
                    
                    downloaderBox.modal.className = downloaderBox.modal.className.replace('active', 'hidden');  
                    return;
                    
                } else {
                    var dm = handler.getDownloadManager();
                    
                    if (!dm.container) {
                         dm.container = downloaderBox.content;
                    }
                        
                    dm.showGrabManager();  
                    downloaderBox.modal.className = downloaderBox.modal.className.replace('hidden', 'active');                    
                }
                
                updateSidebarPosition();
            }
            
            var download = editButton.cloneNode();
                download.className = env.className + '-FavEditButton ' + env.className + '-FavEditButton-download ' + (imagesAsDownloadItems ? 'active' : 'hidden');
                download.innerText = lng.s('Загрузки', 'download_manager');
                
                download.onclick = function () {
                    if (!checkSafeUpdateData()) return false;
                    
                    if (imagesAsDownloadItems) { // todo ask before cancel if something in progress
                        imagesAsDownloadItems = false;
                        this.className = this.className.replace('active', 'hidden');
                        sideBarLock = false;
                        showDownloadManagerForm(false);
                    } else {
                        imagesAsDownloadItems = true;
                        this.className = this.className.replace('hidden', 'active');                
                        
                        sideBarLock = true;
                        handler.getDownloadManager().setDownloadTasks(displayedItems);                        
                        showDownloadManagerForm(true);
                    }
                    
                    handler.updateImagesBlock();                
                    handler.updateImageGrid();
                    return false;
                }
                
            additionButtons.appendChild(download);
        }
            
            typeFiltersContainer.appendChild(logicButton);
        
        var cOptions = document.createElement('div');	
        KellyTools.setHTMLData(cOptions, '<table><tbody><tr><td></td><td></td><td></td></tr></tbody></table>');
        
        var cOptionsSectors = cOptions.getElementsByTagName('td');
        var cOptionsSectorItems = [no, gif, nsfw];
        
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
        
        updateFilteredData();
        
        if (imagesAsDownloadItems) {
            showDownloadManagerForm(true);
        }
        
        favContent.appendChild(imagesBlock);       
        handler.updateImagesBlock();
        
        handler.showSidebar(true);
        
        displayFavouritesBlock('fav');
        handler.updateImageGrid();
        
        return false;
    }
    
    this.closeSidebar = function() {
        
        sideBarWrap.className = sideBarWrap.className.replace( env.className + '-sidebar-wrap-active',  env.className + '-sidebar-wrap-hidden');        
        clearSidebarLoadEvents();
        
        var siteSideBlock = env.getMainContainers().sideBlock;
        if (siteSideBlock) {
            siteSideBlock.style.visibility = 'visible';
            siteSideBlock.style.opacity = '1';
        }
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
    
    this.getSidebar = function() {
        return sideBarWrap;
    }
    
    function clearSidebarLoadEvents() {
        
        if (modalBoxContent) {
            
            var previewImage = KellyTools.getElementByClass(modalBoxContent, env.className + '-PreviewImage');
            if (previewImage) {
                previewImage.src = '';
                previewImage.onload = function() {}
            }
        }
    }
    
    this.showSidebar = function(hideHeader, onClose) {
        
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
    
        var siteSideBlock = env.getMainContainers().sideBlock;		
        if (siteSideBlock) {	
            siteSideBlock.style.visibility = 'hidden';
            siteSideBlock.style.opacity = '0'; 
        }
        
        updateSidebarPosition();
    }
    
    function updateSidebarPosition() {
        if (env.updateSidebarPosition && env.updateSidebarPosition(sideBarLock)) return;        
    }
    
    // preview dimensions, preview jpg for gif media 
    this.setSelectionInfo = function(type, info) {
        
        if (!type) {
        
            log('setSelectionInfo : clean selected info');
            if (selectedInfo) selectedInfo = false;
            
        } else {
        
            if (!selectedInfo) selectedInfo = new Object();        
            selectedInfo[type] = info;    
        }
    }
    
    // save preview image dimensions for fav.items[index], if not saved
    
    this.saveWH = function(el, index) {

        if (!el) return false;
        var src = el.getAttribute('src');
        if (!src) return false;
        
        var fileName = src.replace(/^.*[\\\/]/, '');        
        var imageWH = {width : parseInt(el.naturalWidth), height : parseInt(el.naturalHeight)};
        
        if (!fav.items[index]) { 
            log('item with index ' + index + 'not found');
        }
        
        if (fav.items[index].pImage) {
            fav.items[index].pw = imageWH.width;
            fav.items[index].ph = imageWH.height;
        }   
        
        handler.save('items');
    }
    
    this.switchPreviewImage = function(next) {
    
        if (!selectedImages) return false;
    
        if (selectedImages.length <= 1) return false;
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
            previewImage.onload = commonActions.onLoadPreviewImage;
        }, 100);
        
        // take dimensions from width \ height attributes ?
        // todo need more tests - after change image src width \ height may be wrong, so we cant use them for dimensions detect | may be recreate DOM img element helps
    
        handler.setSelectionInfo('dimensions', false);
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
        updateSidebarPosition();
        return false;
    }
    
    function removeDimensionsForItem(item) {
        if (!item) return false;
        
        log('clean proportions info');
        
        if (typeof item.pw != 'undefined') delete item.pw;
        if (typeof item.ph != 'undefined') delete item.ph;
        if (typeof item.ps != 'undefined') delete item.ps;
        
        return true;
    }
    
    // postBlock is deprecated variable - unimportant here, todo remove
    // onApply - применить изменения (удаление части элементов из подборки)
    // onRemove - полное удаление
    // onCancel - отмена
    
    this.showRemoveFromFavDialog = function(itemIndex, onRemove, onCancel, onApply) {
    
        if (!fav.items[itemIndex]) {
            log('attempt to remove unexist item ' + itemIndex);
            return false;
        }
        
        handler.showSidebarMessage(false);
        clearSidebarLoadEvents();
        
        var html = '<p>Подтвердите удаление</p>';
            html += '<p class="' + env.className + '-ModalBox-controll-buttons"><a href="#" class="' + env.className + 'Remove">' + lng.s('Удалить', 'delete')  +  '</a><a href="#" class="' + env.className + 'Apply">' + lng.s('Применить изменения', 'apply')  +  '</a>';
            html += '<a href="#" class="' + env.className + 'Cancel">' + lng.s('Отменить', 'cancel')  +  '</a></p>';       
        
        KellyTools.setHTMLData(modalBoxContent, '<div class="' +  env.className + '-removeDialog">' + html + '</div>');
        
        var removeButton = KellyTools.getElementByClass(modalBoxContent, env.className + 'Remove');
        var removeApplyButton = KellyTools.getElementByClass(modalBoxContent, env.className + 'Apply');
        var removeDialog = KellyTools.getElementByClass(modalBoxContent, env.className + '-removeDialog');
        
        selectedImages = false;
        
        var previewBefore = getPreviewImageByItem(fav.items[itemIndex]);
        
        if (fav.items[itemIndex].pImage) {
        
            if (typeof fav.items[itemIndex].pImage == 'string') {
                selectedImages = [fav.items[itemIndex].pImage];
            } else {
                selectedImages = [];
                
                for (var i = 0; i < fav.items[itemIndex].pImage.length; i++) {
                    selectedImages[i] = fav.items[itemIndex].pImage[i];
                }
            }
            
            var controlls = getSelectedPostMediaControlls();
            
            removeDialog.insertBefore(controlls, removeDialog.childNodes[0]);
        }
        
        
        if (!selectedImages || selectedImages.length <= 1) { 
            removeApplyButton.style.display = 'none';
        } else {
            removeButton.innerText = lng.s('Удалить всю подборку', 'delete_all_items');
        }
         
        removeApplyButton.onclick = function() {

            if (!selectedImages || selectedImages.length <= 0) {
                
                handler.itemRemove(itemIndex);  
                    
            } else {
                
                fav.items[itemIndex].pImage = selectedImages;

                var previewAfter = getPreviewImageByItem(fav.items[itemIndex]);
                
                if (previewAfter.indexOf(previewBefore) == -1) {
                    removeDimensionsForItem(fav.items[itemIndex]);
                }
                
                handler.save('items');
            }
            
            if (onApply) {
                onApply();
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
        
        removeButton.onclick = function() { 
            
            handler.itemRemove(itemIndex);  
                        
            if (onRemove) {
                onRemove();
            } else {
                handler.closeSidebar();  
            } 
            
            return false; 
        }
        
        handler.showSidebar(false, onCancelCommon);
        updateSidebarPosition();
        return false;
    }
    
    // sets auto categories by current selected media
    
    function selectAutoCategories(db) {
        
        if (!db) db = fav;
        
        // autoselect gif
        var gifCategory = handler.getStorageManager().getCategoryBy(db, 'GIF', 'name');
        var containGif = false;
        
        if (gifCategory.id !== -1) {  
        
            for (var i = 0; i < selectedImages.length; i++) {     
                if (selectedImages[i].indexOf('.gif') != -1) {
                    containGif = true;
                    break;
                }
            }           
            
            var selectedGifCat = db.selected_cats_ids.indexOf(gifCategory.id);
                        
            if (containGif && selectedGifCat == -1) {
                db.selected_cats_ids.push(gifCategory.id);
            } else if (!containGif && selectedGifCat != -1) {                
                db.selected_cats_ids.splice(selectedGifCat, 1);
            }           
        }
    }
    
    // todo callback onDownload
    function fastDownloadCheckState(postData, button) {
    
        if (!handler.isDownloadSupported || !fav.coptions.fastsave.enabled) {
            return false;
        }
        
        button.className = button.className.replace('unchecked', 'checked');
        var postMedia = env.getAllMedia(postData);
        
        if (postMedia && postMedia.length) {
            
            button.className += ' ' + env.className + '-fast-save-loading';
            var onSearch = function(response) {
                
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = false;
                    
                    // todo show \ indicate error ?
                }
                
                if (response && response.matchResults && response.matchResults[0].match) {
                    button.className = button.className.replace('checked', 'downloaded');
                } else {
                    button.className = button.className.replace('checked', 'notdownloaded');
                }
                
                button.className = button.className.replace(env.className + '-fast-save-loading', '').trim();
        
            }
            
            var timeout = setTimeout(function() {
                onSearch(false);
            }, 4000);
            
            // todo isFilesDownloaded - check by regular expression - in file name only file ID is important (file name in publication can change during time because of new tags \ editing \ etc)         
            KellyTools.getBrowser().runtime.sendMessage({method: "isFilesDownloaded", filenames : [KellyTools.getUrlFileName(env.getImageDownloadLink(postMedia[0]))]}, onSearch);
        
        } else {
            button.className = button.className.replace('checked', 'unavailable');
        }     
    }
    
    function fastDownloadPostData(postData, onInit, onDownload) {
        
        if (!handler.isDownloadSupported || !fav.coptions.fastsave.enabled) {
            return false;
        }
        
        if (!KellyTools.getBrowser()) return false;
        
        var postMedia = env.getAllMedia(postData);        
        if (postMedia && postMedia.length) {
            var dm = handler.getDownloadManager();
            
            var downloadInitiated = 0;
            var downloadDone = 0; 
            var downloadIds = [];
            
            KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.keepAliveListener"}, function(response) {});
         
            var timeoutListener = setTimeout(function() {
                 KellyTools.getBrowser().runtime.onMessage.removeListener(onDownloadStateChanged);
                 timeoutListener = false;
                 if (onDownload) onDownload(false);
            }, 4000);
            
            var onDownloadStateChanged = function(request, sender, sendResponse) {
   
                if (request.method == "onChanged" ) {                    
                                        
                    if (request.downloadDelta && request.downloadDelta.state) {
                    
                        if (request.downloadDelta.state.current != "in_progress" && downloadIds.indexOf(request.downloadDelta.id) != -1) {
                            downloadDone++;
                            downloadIds.splice(downloadIds.indexOf(request.downloadDelta.id), 1);
                            if (downloadDone == postMedia.length) {
                            
                                if (onDownload) onDownload(true);
                                
                                KellyTools.getBrowser().runtime.onMessage.removeListener(onDownloadStateChanged);
                                if (timeoutListener) {
                                    clearTimeout(timeoutListener);
                                    timeoutListener = false;
                                }
                            }
                        }
                        
                    }
                }
            }
            
            KellyTools.getBrowser().runtime.onMessage.addListener(onDownloadStateChanged); 
            
            for (var i = 0; i < postMedia.length; i++) {
            
                dm.createBlobFromUrl(env.getImageDownloadLink(postMedia[i], true), function(url, blobData, errorCode, errorNotice) {

                    if (!blobData) {
                        
                        log('downloadPostData : bad blob data for fast download; error : ' + errorCode + ' | message ' + errorNotice);
                        
                        downloadInitiated++;
                        if (downloadInitiated == postMedia.length) {
                            if (onDownload) onDownload(false);
                        }
                        
                        return;
                    }
                    
                    if (!fav.coptions.fastsave.conflict) {
                        fav.coptions.fastsave.conflict = 'overwrite';
                    }
                    
                    var downloadOptions = { 
                            conflictAction : fav.coptions.fastsave.conflict,
                            method : 'GET',
                            filename : KellyTools.validateFolderPath(fav.coptions.fastsave.baseFolder) + '/' + KellyTools.getUrlFileName(url),
                            url : blobData,
                        }
                        
                    dm.downloadUrl(true, downloadOptions, function(response) {
                    
                        downloadInitiated++;
                        if (response.downloadId && response.downloadId != -1) downloadIds.push(response.downloadId);
                     
                        if (downloadInitiated == postMedia.length) {
                            if (onInit) onInit(downloadInitiated, response.downloadId);
                        }
                    });
                });
            }
            
        } else {
           if (onDownload) onDownload(false);
        }
    }
    
    this.showAddToFavDialog = function(postBlock, comment) {
        
        if (!postBlock) return false;
        
        handler.showSidebarMessage(false);
        clearSidebarLoadEvents();
        
        handler.setSelectionInfo(false);        
        
        selectedPost = postBlock;
        
        if (comment) {
            selectedComment = comment;
            selectedImages = env.getAllMedia(comment);
        } else {            
            selectedComment = false;
            selectedImages = env.getAllMedia(postBlock);
        }
        
        // dimensions can be already initialized throw getAllMedia method
        var loadDimensions = selectedInfo && selectedInfo['dimensions'] ? false : true;
                
        var controlls = getSelectedPostMediaControlls(loadDimensions);
        
        var hidePreview = KellyTools.getElementByClass(modalBox, env.className + '-ModalBox-hide-preview');
        if (hidePreview) {
            hidePreview.innerText = lng.s('Скрыть превью', 'item_preview_hide');
            hidePreview.className = hidePreview.className.replace('hidden', 'active');
            hidePreview.onclick = function() {
                if (controlls.className.indexOf('hidden') != -1) {             
                    controlls.className = controlls.className.replace('hidden', 'active');
                    hidePreview.innerText = lng.s('Скрыть превью', 'item_preview_hide');
                } else {
                    controlls.className = controlls.className.replace('active', 'hidden');
                    hidePreview.innerText = lng.s('Показать превью', 'item_preview_show');
                }
                
                return false;
            }
            
            if (selectedImages.length > 0) {                
               hidePreview.className = hidePreview.className.replace('hidden', 'active'); 
            } else {
               hidePreview.className = hidePreview.className.replace('active', 'hidden'); 
            }
        }
        
        var onClose = function() {
            if (hidePreview) {
                hidePreview.className = hidePreview.className.replace('active', 'hidden');
            }
            
            handler.save('cfg');
            handler.closeSidebar();
        }
       
        selectAutoCategories();        
        handler.showSidebar(false, onClose);
                
        var catsHTML = '<option value="-1">' + lng.s('Без категории', 'cat_no_cat') + '</option>';
        
        for (var i = 0; i < fav.categories.length; i++) {
            var selected = '';
            
            //if (fav.last_cat == fav.categories[i].id) selected = 'selected';
            
            catsHTML += '<option value="' + fav.categories[i].id + '" ' + selected + '>' + fav.categories[i].name + '</option>';
        }
        
        catsHTML = '<select class="' + env.className + 'Cat">' + catsHTML + '</select>';
        
        var html = '\
        <div class="' + env.className + 'SavePostWrap">\
                <div class="' + env.className + 'CatAddForm">\
                    <div>\
                        <input type="text" placeholder="' + lng.s('Новая категория', 'cat_new_cat_name') + '" value="" class="' + env.className + 'CatName">\
                        <a href="#" class="' + env.className + 'CatCreate">' +lng.s('Создать категорию', 'cat_create') + '</a>\
                    </div>\
                </div>\
                <div class="' + env.className + 'SavePost">\
                    <div class="' + env.className + 'CatList">' + catsHTML + ' <a href="#" class="' + env.className + 'CatAdd">' +lng.s('Добавить категорию', 'cat_add') + '</a></div>\
                    <input type="text" placeholder="' +lng.s('Подпись', 'item_notice') + '" value="" class="' + env.className + 'Name">\
                    <a href="#" class="' + env.className + 'Add">' +lng.s('Сохранить', 'save') + '</a>\
                </div>\
                <div class="' + env.className + 'CatAddToPostList"></div>\
        </div>\
        ';

        KellyTools.setHTMLData(modalBoxContent, html);
        modalBoxContent.insertBefore(controlls, modalBoxContent.childNodes[0]);		
        
        KellyTools.getElementByClass(modalBoxContent, env.className + 'CatAdd').onclick = function() { handler.categoryAdd(); return false; }        
        KellyTools.getElementByClass(modalBoxContent, env.className + 'CatCreate').onclick = function () { handler.categoryCreate(); return false; }
        // KellyTools.getElementByClass(modalBoxContent, env.className + 'CatRemove').onclick = function () { handler.categoryRemove(); return false; }

        KellyTools.getElementByClass(modalBoxContent, env.className + 'Add').onclick = function () { 
            handler.save('cfg'); 
            if (handler.itemAdd() && fav.coptions.syncByAdd && env.syncFav) {
                env.syncFav(selectedPost, true);
            } 
            return false; 
        }
                
        var list = KellyTools.getElementByClass(modalBoxContent, env.className + 'CatAddToPostList');    

        if (fav.selected_cats_ids.length) {
        
            for (var i = 0; i < fav.selected_cats_ids.length; i++) {
                if (handler.getStorageManager().getCategoryById(fav, fav.selected_cats_ids[i]).id == -1) {
                    continue;
                } 
                
                list.appendChild(createCatExcludeButton(fav.selected_cats_ids[i]));
            }
            
        }            
        
        updateSidebarPosition();
        return false;
    }
    
    // noSave = true - only return new item without save and dialog
    
    this.itemAdd = function(noSave) {
        
        if (!selectedPost) {
            log('itemAdd : selected post empty');
            return false;
        }
                          
        var postItem = { 
            categoryId : [], 
            pImage : '', 
            link : '', 
            name : KellyTools.inputVal(env.className + 'Name', 'string', modalBoxContent),
            // commentLink : '',
        };
               
        fav.selected_cats_ids = validateCategories(fav.selected_cats_ids);
        
        if (fav.selected_cats_ids.length) {
        
            for (var i = 0; i < fav.selected_cats_ids.length; i++) {            
                postItem.categoryId[postItem.categoryId.length] = fav.selected_cats_ids[i];
            }
        }
                
        //var firstImageBlock = KellyTools.getElementByClass(selectedPost, 'image');
        if (selectedComment) {
        
            var text = getCommentText(selectedComment);
            console.log(text);
            if (text) postItem.text = text;

            postItem.commentLink = env.getCommentLink(selectedComment);
        } 

        if (selectedImages.length == 1) postItem.pImage = selectedImages[0];
        else if (selectedImages.length > 1) {
            var previewImage = KellyTools.getElementByClass(modalBoxContent, env.className + '-PreviewImage');
            
            // may unexist for images that taken from native favorites in iframe mode
            
            if (previewImage) {
            
                var caret = previewImage.getAttribute('data-caret');
                if (!caret) caret = 0;
                else caret = parseInt(caret);
                
                if (caret && caret < selectedImages.length && caret >= 1) {
                    var tmp = selectedImages[0];
                    selectedImages[0] = selectedImages[caret];
                    selectedImages[caret] = tmp;
                }
                
            }
            
            postItem.pImage = selectedImages;
        }
                
        if (selectedInfo && selectedInfo['dimensions'] && selectedInfo['dimensions'].width) {
        
            postItem.pw = selectedInfo['dimensions'].width;
            postItem.ph = selectedInfo['dimensions'].height;  
            
            // trusted original proportions
            if (selectedInfo['dimensions'].schemaOrg) {
                postItem.ps = 1;
            }
        }
        
        if (selectedInfo && selectedInfo['gifInfo'] && selectedInfo['gifInfo'].length) {
            postItem.gifInfo = selectedInfo['gifInfo'];     
        }
        
        postItem.link = env.getPostLink(selectedPost);           
        
        if (!postItem.link) {
            
            if (!noSave) handler.showSidebarMessage(lng.s('Публикация не имеет ссылки', 'item_bad_url'), true);
            return false;
            
        }
        
        if (noSave) return postItem;
        
        var inFav = handler.getStorageManager().searchItem(fav, {link : postItem.link, commentLink : postItem.commentLink ? postItem.commentLink : false});        
        if (inFav !== false) {
            
            fav.items[inFav] = postItem;
            handler.showSidebarMessage(lng.s('Избранная публикация обновлена', 'item_upd'));
            handler.save('items');
            return false;
        }
            
        fav.ids++;		
        postItem.id = fav.ids; 

        handler.showSidebarMessage(lng.s('Публикация добавлена в избранное', 'item_added'));
                
        fav.items[fav.items.length] = postItem;
        handler.updateFavCounter();
            
        selectedComment ? formatComments(selectedPost) : formatPostContainer(selectedPost);
        
        log('post saved');
        log(postItem);
        handler.save('items');
        
        return true;
    }
    
    // удалить элемент с последующим обновлением контейнеров публикаций 
    // index - item index in fav.items[index] - comment \ or post
    // postBlock - not important post container dom element referense, helps to find affected post
        
    this.itemRemove = function(index, postBlock) {
    
        fav.items.splice(index, 1);
        
        handler.updateFavCounter();
        
        handler.save('items');

        if (!postBlock) { // update all visible posts
        
            var posts = document.getElementsByClassName('postContainer');
            
            for (var i = 0; i < posts.length; i++) {
                formatPostContainer(posts[i]);
            }
            
        } else {
        
            formatPostContainer(postBlock);
            
        }
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
            
            var posts = document.getElementsByClassName('postContainer');
            
            for (var posti = 0; posti < posts.length; posti++) {
                formatPostContainer(posts[posti]);
            }
            
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
       fav.selected_cats_ids = validateCategories(fav.selected_cats_ids);
       
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
            catItem.innerText = lng.s('Исключить __CATEGORYNAME__', 'cat_exclude', { CATEGORYNAME : category.name });
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
        
        if (edited) {
        
            handler.save('items');
            return fav.categories[index];
            
        } else return false;
        
    }

    this.getGlobal = function(name) {
        
        if (name == 'debug') return debug;	
        if (name == 'env') return env;		
        if (name == 'fav') return fav;
        if (name == 'filters') return catFilters;
        if (name == 'lng') return lng;
        
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
    
    
    this.onDownloadNativeFavPagesEnd = function() {
    
        var downloadBtn = KellyTools.getElementByClass(document, 'kelly-DownloadFav');
        if (downloadBtn) downloadBtn.innerText = lng.s('Запустить скачивание страниц', 'download_start');	
            
        if (!favNativeParser || !favNativeParser.collectedData.items.length) return false;
                                
        KellyTools.getElementByClass(document, 'kelly-Save').style.display = 'block';
            
        var saveNew = KellyTools.getElementByClass(document, 'kelly-SaveFavNew');
            saveNew.onclick = function() {
            
                if (favNativeParser && favNativeParser.collectedData.items.length) {
                    
                    if (favNativeParser.collectedData.selected_cats_ids) {
                        delete favNativeParser.collectedData.selected_cats_ids;
                    }
                    
                    var fname = env.profile + '/Storage/ExportedFavourites/';
                        fname += 'db_';
                        
                    var pageInfo = env.getFavPageInfo();					
                    if (pageInfo.userName) fname += '_' + KellyTools.getUrlFileName(pageInfo.userName);
                    
                    fname += '_' + KellyTools.getTimeStamp() + '.' + handler.getStorageManager().format;
                    fname = KellyTools.validateFolderPath(fname);
                    
                    KellyTools.createAndDownloadFile(JSON.stringify(favNativeParser.collectedData), fname);	
                }
                
                return false;
            }            
    }
    
    this.onDownloadNativeFavPage = function(worker, thread, jobsLength) {
        
        var error = '';
        
        var logEl = KellyTools.getElementByClass(document, env.className + '-exporter-log');
        var logNewLine = document.createElement('br');
        
        var logNum = parseInt(logEl.getAttribute('data-lines'));
        if (!logNum) logNum = 0;
        
        if (logNum > 1000) {
            logEl.innerHTML = '';
        }
        
        KellyTools.getElementByClass(document, env.className + '-exporter-process').innerText = lng.s('Страниц в очереди __PAGESN__', 'download_pages_left', {PAGESN : jobsLength});
        
        var skipEmpty = KellyTools.getElementByClass(document, env.className + '-exporter-skip-empty');
            skipEmpty = skipEmpty && skipEmpty.checked ? true : false;
            
        if (!thread.response) {
        
            error = 'Страница не доступна ' + thread.job.data.page + ' (ошибка загрузки или превышен интервал ожидания)'; // window.document null  
            
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
                
            var posts = loadDoc.getElementsByClassName('postContainer');
            if (!posts) {
            
                error = 'Отсутствует контейнер postContainer для страницы ' + thread.job.data.page;
            } else {
                logNum++;
                
                var text = document.createTextNode('[' + KellyTools.getTime() + '] Страница : ' + thread.job.data.page + ' найдено ' + posts.length + ' элементов');
                
                logEl.appendChild(text);
                logEl.appendChild(logNewLine);                
                logEl.setAttribute('data-lines', logNum+1);
            }
        }
        
        if (error) {
        
            worker.errors += error;		
            
            var text = document.createTextNode('[' + KellyTools.getTime() + ']' + error);
            
            logEl.appendChild(text);
            logEl.appendChild(logNewLine);                
            logEl.setAttribute('data-lines', logNum+1);
            
            return;
        }
                
        var pageInfo = {
            page : thread.job.data.page,
            itemsNum : 0,
        }
        
        // check uniquie throw searchItem - ok
        // check for duplicates on save in current storage by post url updatePostFavButton as example - ok
        // exlude unnesessery data to improve load speed - ok
        
        // clear selected cats to ignore current profile categories in itemAdd method (used to collect selectedImages to new item)
            fav.selected_cats_ids = [];
            
        for (var i = 0; i < posts.length; i++) {
        
            selectedComment = false;
            selectedPost = posts[i];
            
            handler.setSelectionInfo(false);
            
            selectedImages = env.getAllMedia(posts[i]);
                                
            if (skipEmpty && !selectedImages.length) {
                log('onDownloadNativeFavPage : skip empty item');
                log(selectedPost);
                continue;
            }
            
            if (env.getPostTags && (worker.catByTagList || worker.tagList)) {
                 var postTags = env.getPostTags(selectedPost);
            }
            
            worker.collectedData.selected_cats_ids = [];
            selectAutoCategories(worker.collectedData);
            
            if (env.getPostTags && worker.catByTagList) {
            
                for(var b = 0; b < worker.catByTagList.length; b++) {
                
                    if (postTags.indexOf(worker.catByTagList[b]) != -1) {
                
                            var sm = handler.getStorageManager();
                            
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
            
            var postItem = handler.itemAdd(true);
            if (postItem) {
                
                if (handler.getStorageManager().searchItem(worker.collectedData, postItem) === false) {
                    
                    if (worker.collectedData.selected_cats_ids.length >= 1) {
                        postItem.categoryId = validateCategories(worker.collectedData.selected_cats_ids, worker.collectedData);
                    }
                    
                    worker.collectedData.ids++;	
                
                    postItem.id = worker.collectedData.ids; 

                    worker.collectedData.items[worker.collectedData.items.length] = postItem;
                    
                    pageInfo.itemsNum++;
                }

            }
        }
        
        // prevent loading images and media
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
        
        log(pageInfo.page + ' | ' + pageInfo.itemsNum + ' | cleared res : ' + cleared);
        // console.log(fav.native_tags);
        log('--');
        
    }
    
    this.downloadNativeFavPage = function(el) {
        
        if (!env.getFavPageInfo) {
            log(env.profile + 'not support native downloads');
            return false;
        }
        
        var favInfo = env.getFavPageInfo();        
        if (!favInfo) return false;
        
        if (!favNativeParser) {
            favNativeParser = new KellyThreadWork({env : handler});      
            favNativeParser.setEvent('onEnd', handler.onDownloadNativeFavPagesEnd);
        }

        favNativeParser.errors = '';

        if (favNativeParser.getJobs().length) {
        
            favNativeParser.stop();
            handler.onDownloadNativeFavPagesEnd();
            
            return false;
        }
        
        var maxPagesPerExport = 1000;
        
        favNativeParser.collectedData = handler.getStorageManager().getDefaultData();
        
        var pages = KellyTools.getElementByClass(document, 'kelly-PageArray'); 
        var pagesList = [];
        
        var message = KellyTools.getElementByClass(document, env.className + '-exporter-process');
        
        if (pages && pages.value.length) {
            
            pagesList = KellyTools.getPrintValues(pages.value, true, 1, favInfo.pages);
        } else { 
        
            pagesList = KellyTools.getPrintValues('1-' + favInfo.pages, true);
        }	
        
        if (favInfo.pages > maxPagesPerExport && pagesList.length > maxPagesPerExport) {
            
            message.innerText = lng.s('Выборка содержит превышающие лимиты значения. Ограничте выборку (не более __MAXPAGESPERIMPORT__ за одну операцию)', 'download_limitpages', {MAXPAGESPERIMPORT : maxPagesPerExport});
            return; 
        }
        
        if (!pagesList.length) {
            message.innerText = lng.s('Выборка пуста', 'selection_empty');
            return;
        }
        
        for (var i = 0; i < pagesList.length; i++) {
            
            var pageNumber = pagesList[i];
            
            favNativeParser.addJob(
                favInfo.url.replace('__PAGENUMBER__', pageNumber), 
                handler.onDownloadNativeFavPage, 
                {page : pageNumber}
            );
        }
        
        var showLogButton = KellyTools.getElementByClass(document, env.className + '-exporter-show-log');
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
        
        var saveFavItemsButton = KellyTools.getElementByClass(document, 'kelly-Save');
            saveFavItemsButton.style.display = 'none';
         
        favNativeParser.tagList = false;
        
        var updateOptions = false;
        
        var tagFilter = KellyTools.getElementByClass(document, env.className + '-exporter-tag-filter');
        var tagFilterEnabled = KellyTools.getElementByClass(document, env.className + '-exporter-show-tag-filter');
            tagFilterEnabled = tagFilterEnabled && tagFilterEnabled.checked ? true : false;
        
        if (tagFilterEnabled && tagFilter) {
            if (tagFilter.value != fav.coptions.tagList) {
                fav.coptions.tagList = KellyTools.inputVal(tagFilter, 'longtext'); 
                
                updateOptions = true;
            }
            
            favNativeParser.tagList = KellyTools.parseTagsList(fav.coptions.tagList);
        }
        
        var catCreate = KellyTools.getElementByClass(document, env.className + '-exporter-create-by-tag');
        var catCreateEnabled = KellyTools.getElementByClass(document, env.className + '-exporter-show-create-by-tag');
            catCreateEnabled = catCreateEnabled && catCreateEnabled.checked ? true : false;
        
        if (catCreateEnabled && catCreate) {
            if (catCreate.value != fav.coptions.catByTagList) {
                fav.coptions.catByTagList = KellyTools.inputVal(catCreate, 'longtext'); 
                
                updateOptions = true;
            }
            
            favNativeParser.catByTagList = KellyTools.parseTagsList(fav.coptions.catByTagList);
            if (favNativeParser.catByTagList && favNativeParser.catByTagList.include && favNativeParser.catByTagList.include.length != 0) {
                favNativeParser.catByTagList = favNativeParser.catByTagList.include;
            } else {
                favNativeParser.catByTagList = false;
            }
        }
        
        if (updateOptions) {
            handler.save('cfg');
        }
        
        var logEl = KellyTools.getElementByClass(document, env.className + '-exporter-log');
        
        KellyTools.setHTMLData(logEl, '[' + KellyTools.getTime() + '] Инициализация...' + "<br>");

        el.innerText = lng.s('Загрузка... (Отменить)', 'download_started_cancel');  
        
        log('download native page started');
        log('Include Tag list :');
        log(favNativeParser.tagList);
        
        favNativeParser.exec();        
    }
    
    this.showNativeFavoritePageInfo = function() {
    
        // not supported by browser
        if (!handler.isDownloadSupported) {
            return false;
        }
        
        if (!env.getFavPageInfo) {
            log(env.profile + 'not support native downloads');
            return false;
        }
        
        var favPageInfo = env.getFavPageInfo();
     
        if (favPageInfo && favPageInfo.items) {
        
            var saveBlock = '\
                <div class="kelly-Save" style="display : none;">\
                    <p>' + lng.s('', 'download_save_notice') + '</p>\
                    <a href="#" class="kelly-SaveFavNew" >' + lng.s('Скачать как файл профиля', 'download_save') + '</a>\
                </div>';
            
            var items = favPageInfo.items;
            if (favPageInfo.pages > 2) { 
                items = '~' + items;
            }
            
            // для текстовый публикаций делать заголовок через метод setSelectionInfo
            
            var tagFilterHtml = '';
            
            var tags = fav.coptions.tagList ? fav.coptions.tagList : '';
            var createByTags = fav.coptions.catByTagList ? fav.coptions.catByTagList : '';
            
            if (env.getPostTags) {
            
                tagFilterHtml = '\
                    <br><br>\
                    <label><input type="checkbox" class="' + env.className + '-exporter-show-tag-filter">Применять фильтрацию по тегам</label>\
                    <br>\
                    <div class="' + env.className + '-exporter-tag-filter-container" style="display : none;">'
                        + lng.s('', 'download_tag_filter_1') + '<br>'
                        + lng.s('Если теги не определены, выполняется сохранение всех публикаций', 'download_tag_filter_empty') 
                        + '</br>\
                        <textarea class="' + env.className + '-exporter-tag-filter" placeholder="' + lng.s('Фильтровать публикации по списку тегов', 'download_tag_filter') + '">' + tags + '</textarea>\
                    </div>\
                ';
                
                tagFilterHtml += '\
                    <br>\
                    <label><input type="checkbox" class="' + env.className + '-exporter-show-create-by-tag">' + lng.s('Автоматически создавать категории для тегов', 'download_createc_by_tag') + '</label>\
                    <br>\
                    <div class="' + env.className + '-exporter-create-by-tag-container" style="display : none;">'
                        + lng.s('Если публикация содержит один из перечисленных в поле тегов, к публикации будет добавлена соответствующая категория', 'download_createc_1') + '<br>'
                        + '</br>\
                        <textarea class="' + env.className + '-exporter-create-by-tag" placeholder="' + lng.s('Автоматически создавать категории для тегов', 'download_createc_by_tag') + '">' + createByTags + '</textarea>\
                    </div>\
                ';
            }
            
            var html = '\
                <input type="submit" value="' +  lng.s('выгрузить в профиль данных', 'download_form_open') + '" class="' + env.className + '-exporter-show-form">\
                <div class="' + env.className + '-exporter-container hidden">\
                     ' +  lng.s('Страниц', 'pages_n') + ' : ' + favPageInfo.pages + ' (' + items + ')<br>\
                     ' +  lng.s('Укажите список страниц выборки, которые необходимо скачать. Например 2, 4, 66-99, 44, 78, 8-9, 29-77 и т.п.,', 'download_example') + '<br>\
                     ' +  lng.s('Если нужно захватить все страницы оставьте не заполненным', 'download_tip') + '<br>\
                     <input class="kelly-PageArray" type="text" placeholder="' + lng.s('Страницы', 'pages')+ '" value=""><br>\
                     <label><input type="checkbox" class="' + env.className + '-exporter-skip-empty"> ' +  
                        lng.s('Пропускать публикации не имеющие медиа данных (текст, заблокировано цензурой)', 'download_skip_empty') +
                     '</label>\
                     ' + tagFilterHtml + '\
                     <br><a href="#" class="kelly-DownloadFav">' + lng.s('Запустить скачивание страниц', 'download_start') + '</a>\
                     <a href="#" class="' + env.className + '-exporter-show-log" style="display : none;">' + lng.s('Показать лог', 'download_log') + '</a>\
                     ' + saveBlock + '\
                     <div class="' + env.className + '-exporter-process"></div>\
                     <div class="' + env.className + '-exporter-log-container" style="display : none;">\
                        <div class="' + env.className + '-exporter-log"></div>\
                     </div>\
                </div>\
            ';	

            KellyTools.setHTMLData(favPageInfo.container, html);

            var showFormBtn = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-show-form');
                showFormBtn.onclick = function() {
                    
                    var exporterForm = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-container');
                    
                    if (exporterForm.className.indexOf('hidden') != -1) {
                        exporterForm.className = exporterForm.className.replace('hidden', 'active');
                    } else {
                        exporterForm.className = exporterForm.className.replace('active', 'hidden');
                    }
                    
                    return false;
                }
                
            if (env.getPostTags) {
                KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-show-tag-filter').onchange = function() {
                    
                    var el = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-tag-filter-container');
                        el.style.display = this.checked ? 'block' : 'none'; 
                    
                    return false;
                };
                
                KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-show-create-by-tag').onchange = function() {
                    
                    var el = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-create-by-tag-container');
                        el.style.display = this.checked ? 'block' : 'none'; 
                    
                    return false;
                };
            }            
            
            KellyTools.getElementByClass(document, 'kelly-DownloadFav').onclick = function() {
                handler.downloadNativeFavPage(this);
                return false;
            };
        }
        
    }
    
    this.formatPostContainers = function() {
        
        publications = env.getPosts();
        for (var i = 0; i < publications.length; i++) {
            formatPostContainer(publications[i]);
        }
    }
    
    function initExtensionResources() {
        
        if (init) return true;
        init = true;        
        
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
            }
            
            initImageGrid();           
            initWorktop();
                        
            if (env.onExtensionReady) env.onExtensionReady();
        };
        
        KellyTools.getBrowser().runtime.sendMessage({method: "getCss", items : ['main', env.profile]}, onLoadCssResource);		
        return true;
    }
        
    this.initOnPageReady = function() {
        
        if (init) return false;
        
        if (!KellyTools.getBrowser()) {
        
            log('Fail to get API functions, safe exit from page ' + document.title);
            return false; 
        }
        
        // parallel with load resources in initCss
        
        handler.addEventListner(document.body, "keyup", function (e) {
            
            if (!e.target) return;
            
            if (e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') {
                return;
            }
            
            var c = e.keyCode - 36;
           
            var right = c == 3 || c == 32 || c == 68 || c == 102;
            var left = c == 1 || c == 29 || c == 65 || c == 100;
         
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
        
        if (env.onPageReady && env.onPageReady()) {			
            return false;
        }
        
        // currently we can modify post containers without waiting css, looks fine
        handler.formatPostContainers();
        initExtensionResources();       
    }
    
    this.addEventListner = function(object, event, callback, prefix) {
    
        handler.removeEventListener(object, event, prefix);
        
        if (typeof object !== 'object') {
            object = document.getElementById(object);
        }

        if (!object)
            return false;
        if (!prefix)
            prefix = '';

        events[prefix + event] = callback;

        if (!object.addEventListener) {
            object.attachEvent('on' + event, events[prefix + event]);
        } else {
            object.addEventListener(event, events[prefix + event]);
        }

        return true;
    }

    this.removeEventListener = function(object, event, prefix) {
        if (typeof object !== 'object') {
            object = document.getElementById(object);
        }

        // console.log('remove :  : ' + Object.keys(events).length);
        if (!object)
            return false;
        if (!prefix)
            prefix = '';

        if (!events[prefix + event])
            return false;

        if (!object.removeEventListener) {
            object.detachEvent('on' + event, events[prefix + event]);
        } else {
            object.removeEventListener(event, events[prefix + event]);
        }

        events[prefix + event] = null;
        return true;
    }
    
    constructor();
}

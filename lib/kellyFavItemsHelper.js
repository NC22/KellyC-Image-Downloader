// ==UserScript==
// @encoding utf-8
// @name           KellyFavItemsHelper
// @namespace      Kelly
// @description    useful script
// ==/UserScript==

// отключать анимацию гиф если есть не загруженые

// опция - вкл. дебагер
// опция - собирать все метаданные о подборке - каждому изображению в подборке будут собраны данные о пропорциях
// сбор мета данных о пропорциях и размерах каждого изображения реализовать отдельно при необходимости
// возможность склеить категории, количество элементов в категории
// добавлять категории при скачивании из белого списка

// драйвер для тамблера
// в блоке добавления в избранное категории не удаляются после добавления в избранное один раз
// после декодирования урлов нет единого формата в массиве \ строки сравнивать сложнее
// удаленное хранилище. на основе уже используемых методов, реализовать api для коннекта по json и выполнения соотвтествующих запросов на удаленный сервер данных (теги - категории общие - картинки принадлежат определенному ресурсу в бд)
// при добавлении записей на удаленный сервер будет возможность добавления с кешем (картинка доступная отдельно от реактора или другого ресурса с которого она стащена) потом кеш можно будет скачать

// БАГ
// после сброса фильтров не сбрасывает страницу
// при добавлении последовательно нескольких картинок из ленты - теги берутся везде из последней и дублируются в другие картинки из последних - проверить более детально [ok]
// так же наблюдается в самой галереи для сохраненных картинок
// если исключить тег у какого-то элемента и удалить другой элемент, то сетка изображений поедет 
// нельзя исключить из списка удаленную категория
// если в посте и гифка и изображения то подцепляет то что первым

// ToDo
// [-] низкий приоритет
// стопорить проигрывание гифок (всегда показывать превьюшку, при клике на доп кнопку play проигрывать)
// многоуровневые категории (при клике на родителя - всплывашка с детьми)
// назначение родителя через режим редактирования категории (исключать группу GIF)
// оверлеем кол-во кадров - при клике вывод галереи только с этими кадрами [ok], возможность разбить их при выводе (кнопка Разбить (копируем как отедльные элементы и запоминаем родителя для возможности отмены) \ Удалить в режиме редактирования), отделить конкрентое изображение ( сохранять для доп кадров пропорции в отдельную переменную)
// грабер на php и подключение к нему [ок] реализовано через download api, название папки включает все выбраные категории \ фулл версии картинок возможность сохранять коллекции отдельной папкой \ только текущая страница \ выборочное исключение \ пропустить первые N \ название Удаленная категория - Без категории \ при выборе нескольких категорий возможность сохранять в разные категории один и тот же файл если он есть и там и там
// кол-во элементов в строке (предварительно перейти на класс tileGrid  float left; для элементов в сеткe

// кнопка - сохранять теги
// удаление категорий - удалять только саму категорию \ категорию и входящие в нее изображения [ok] - после удаления если кат выделена, не отображается. проверить


function KellyFavItemsHelper() 
{
    this.PROGNAME = 'KellyFavItemsHelper v0.94';
    
    var handler = this;	
	    
    var env = false;
    var events = new Array();
    
    var selectedPost = false;
    var selectedImages = false;
    var selectedComment = false;
    var selectedInfo = false; // какие-либо мета данные сохраняемые для определенной публикации в обработчике itemAdd (добавлять методом setSelectionInfo)
    
    var extendCats = []; // выделеные категории для последующего добавления к определенной публикации, в режиме просмотра избранного
    
    var init = false;
	var loadedCss = [];
    
    // Dom elements
    
    var sideBarWrap = false;
    var sideBarLock = false; // lock side bar position
    var modalBox = false;
    var modalBoxContent = false;
    var modalBoxMessage = false;
    
    var downloaderBox = false;
    
    var favCounter = false;
    
    var siteContent = false; // main page container - setted by env
    var favContent = false;
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
	       
    var debug = false;
    
    var page = 1;
    var uiBeasy = false;
    
    var displayedItems = [];
    var galleryImages = [];
    var galleryImagesData = [];
    
	var lng = KellyLoc;
    
	var imageGrid = false;
    var fav = {};
    
    this.isDownloadSupported = false;
	
	function initImageGrid() {
		
		imageGrid = new kellyTileGrid({
		
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
					if (data.error_code == 2 || data.error_code == 3 || data.error_code == 4) {
						data.mainElement.setAttribute('data-width', 200);
						data.mainElement.style.display = 'inline-block';
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
				// для неизвестного элемента загружены пропорции
				onLoadBounds : function(self, el, state) {
				
					handler.onFavImageLoad(el, state == 'error' ? true : false);
					return false;
				},
				
			},
			
		});
	}
    
    // categories - name \ id
    
    // todo добавление коментов в избранное - грузятся в post_comment_list,
    // после клика на commentnum toggleComments comOpened в теле контейнера поста - добавить событие при клике на ожидание списка коментов и добавлять к ним кнопку
    // если пост информационный - показывать текс в блоке 300х300 и масштабировать блок в общей сетке как изображение.
    
    // items - categoryId \ post link \ previewImage \ is_comment . todo - addition pictures (show number)
        
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
	
		// todo catch error details for custom profile
		
		if (cfg.envText) {
				
			K_ENVIRONMENT = false;
		
			try {
				eval(cfg.envText);
			} catch (e) {
				if (e) {
					log(e);
					return;
				}
			}
			
			if (typeof K_ENVIRONMENT != 'undefined') {
				env = K_ENVIRONMENT;
			}
		
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
                imgViewer = new KellyImgView({idGroup : env.className + '-ImgView'});
                initImageGrid();
                
                var posts = document.getElementsByClassName('postContainer');
                if (posts) handler.initOnPageReady();
                else {
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
		favCounter.innerHTML = fav.items.length;
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
		
			tooltip = new kellyTooltip({
			
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
    
    function validateCategories(catList) {
           
        var tmpSelectedCategories = []; 
        
		if (catList) {
			
			for (var i = 0; i < catList.length; i++) {
			
				if (handler.getStorageManager().getCategoryById(fav, catList[i]).id == -1) {
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
				fav.coptions = {};
			}
			
			if (!fav.coptions.storage) {
				fav.coptions.storage = 'default';
			}
					
			// fav.items[fav.items.length] = {"categoryId":[6,4,12],"previewImage":"http://img1.joyreactor.cc/pics/post/bad.jpg","name":""};
			// hide_sidebar : true,
			
			if (!fav.coptions.autoload_onscroll) fav.coptions.autoload_onscroll = false;
			if (!fav.coptions.comments_blacklist)  fav.coptions.comments_blacklist = [];
			if (!fav.coptions.posts_blacklist)  fav.coptions.posts_blacklist = [];
            
            fav.coptions.debug = fav.coptions.debug ? true : false;
            debug = fav.coptions.debug;
            
			fav.coptions.newFirst = fav.coptions.newFirst ? true : false;
			
			if (!fav.coptions.storageDriver) {
				fav.coptions.storageDriver = 'localstorage';
			}
            
            if (!fav.coptions.tagList) fav.coptions.tagList = '';
            			
			sm.driver = fav.coptions.storageDriver;
			
			if (!fav.coptions.grid)  {
				fav.coptions.grid = {
					fixed : false,
					rowHeight : 250,
					heightDiff : 10,
					min : 2, 
					cssItem : '',
					perPage : 60,
				};
			}
            
            if (!fav.coptions.downloader) {
                fav.coptions.downloader = {
                    perPage : 200,
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
	
    this.goToFavPage = function(newPage, byScroll) {
        
        if (page == newPage) return false;
        if (uiBeasy) return false;
        if (!displayedItems || !displayedItems.length || !imagesBlock) return false;
                
        var totalPages = Math.ceil(displayedItems.length / fav.coptions.grid.perPage);
               
        if (!byScroll) byScroll = false;
        
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
            
            handler.updateImagesBlock(byScroll);
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
	
    function initCss() {
        
		if (init) return;
        init = true;
        
		if (!KellyTools.getBrowser()) return false;
		
		var loadCssResource = function(response) {
			
			// console.log(response.url);
			
			if (!response || response.data === false) {	
                log('loadCssResource : bad init data');
				return false;
			}
            
            if (!response.data.css) {
                log('loadCssResource : css empty');
                log('loadCssResource : Browser API response : ' + response.data.notice);
				return false; 
            }
			
			handler.addCss(KellyTools.replaceAll(response.data.css, '__BASECLASS__', env.className));
			 
            initWorktop();
            handler.isDownloadSupported = response.isDownloadSupported;
            
            if (!handler.isDownloadSupported) {
                log('browser not support download API. Most of functional is turned OFF');
            }
		};
		
		KellyTools.getBrowser().runtime.sendMessage({method: "getCss", items : ['main', env.profile]}, loadCssResource);
		
		if (env.onInitCss) env.onInitCss();
        return true;
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
        
        if (item.link) {
            text += '<a href="' + item.link + '" target="_blank">' + lng.s('Перейти к публикации', 'go_to_publication') + '</a>' + '<br>';
            
        }
        
        if (item.commentLink) {
            text += '<a href="' + item.commentLink + '" target="_blank">' + lng.s('Перейти к комментарию', 'go_to_comment') + '</a>' + '<br>';
            
        }
        
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
		
			
			return handler.showItemInfo(item);
		}
		
		kellyTooltip.addTipToEl(el, getMessage, {
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
        
        var mainContainer = document.getElementById(env.mainContainer);
        
		var modalClass = env.className + '-ModalBox';
		
        sideBarWrap = document.createElement('div');
        sideBarWrap.id = env.className + '-sidebar-wrap';
        sideBarWrap.className = env.className + '-sidebar-wrap ' + env.className + '-sidebar-wrap-hidden ' + env.hostClass; 
        
        var modalBoxHTML  = '<div class="' + modalClass + ' ' + modalClass +'-main">';
            modalBoxHTML += '<div class="' + modalClass + '-header"><a href="#" class="' + modalClass + '-close">Закрыть</a></div>';
            modalBoxHTML += '<div class="' + modalClass + '-content">';
                                
            modalBoxHTML += '</div><div class="' + modalClass + '-message"></div>';
            modalBoxHTML += '</div>';
                     
        var imgView = document.createElement('div');
            imgView.id = env.className + '-ImgView';
            imgView.innerHTML = '<div id="' + env.className + '-ImgView-loader"></div><div id="' + env.className + '-ImgView-img" ></div>';
            
        var downloaderHTML = '\
            <div class="' + modalClass + ' ' + modalClass + '-downloader hidden">\
                <div class="' + modalClass + '-content"></div>\
            </div>\
        ';
        
        sideBarWrap.innerHTML = modalBoxHTML + downloaderHTML;
		
        modalBox = KellyTools.getElementByClass(sideBarWrap, modalClass + '-main');
        modalBoxContent = KellyTools.getElementByClass(modalBox, modalClass + '-content');
        modalBoxMessage = KellyTools.getElementByClass(modalBox, modalClass + '-message');
        
        downloaderBox = {
            modal : KellyTools.getElementByClass(sideBarWrap, modalClass + '-downloader'),
        }; 
        
        downloaderBox.content = KellyTools.getElementByClass(downloaderBox.modal, modalClass + '-content');
        
        mainContainer.appendChild(sideBarWrap);
        mainContainer.appendChild(imgView);
        
        imgViewer.addBaseButtons();
		
		var tip = imgViewer.addButton('?', 'info', function() { });
		addImageInfoTip(tip);
        
        handler.addEventListner(window, "resize", function (e) {
            updateSidebarPosition();
        }, '_fav_dialog');
		
        handler.addEventListner(window, "scroll", function (e) {
            updateSidebarPosition();
        }, '_fav_dialog');
        

        // add fav button on top
		
		var counterHtml = '<div class="'+ env.className + '-FavItemsCount ' + env.className + '-basecolor-dynamic"></div>';
        var iconHtml = '';
		
		if (fav.coptions.icon) {
			iconHtml = '<div class="' + env.className + '-icon ' + env.className + '-buttoncolor-dynamic" style="' + fav.coptions.icon + '"></div>';
		} else {			
			iconHtml = '<div class="' + env.className + '-icon ' + env.className + '-icon-diskete ' + env.className + '-buttoncolor-dynamic"></div>';
		}
		
        var favButton = createMainMenuButton(iconHtml + counterHtml, function() { 
			
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
        
        var optionsButton = createMainMenuButton(lng.s('Настройки', 'options'), function() { 

			if (mode == 'ctoptions') {
				handler.hideFavoritesBlock();
			} else {					
				handler.showOptionsDialog();
			}
			
		    return false; 
		
		});
		
        if (optionsButton) {
            menuButtons['ctoptions'] = optionsButton.parentNode;
        }
        
        // add fav container
        
        siteContent = document.getElementById(env.mainContentContainer);
        
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
	
    function createMainMenuButton(name, onclick, index) {
        
        var submenu = document.getElementById(env.menu);
        
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
			
            menuButtonContainer.innerHTML = '<a href="#">' + name + '</a>';
        
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
    
    function formatPostContainer(postBlock) {
        
        var userName = getPostUserName(postBlock);
        if (userName && fav.coptions.posts_blacklist && fav.coptions.posts_blacklist.indexOf(userName) != -1) {
        
            //var blockInfo = document.createElement('DIV');
            //    blockInfo.innerHTML = 'пост от ' + userName;
                
            // postBlock.parentNode.insertBefore(blockInfo, postBlock);   
            postBlock.style.display = 'none';
            
            return false;
        }
        
        if (!updatePostFavButton(postBlock)) return false;    
        
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
        
        var shareButtonsBlock = postBlock.getElementsByClassName('share_buttons');
        if (shareButtonsBlock.length) {
            var shareButtons = shareButtonsBlock[0].childNodes;
            
            for (var i = 0; i < shareButtons.length; i++) {
                if (shareButtons[i].tagName == 'A' && shareButtons[i].className.indexOf('share') != -1) {
                    shareButtons[i].style.height = '0px';
                    shareButtons[i].style.display = 'block';
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
    
    function updatePostFavButton(postBlock) {
		
        var link = env.getPostLink(postBlock);
        
        if (!link) {            
            log('bad postcontainer');
            return false;        
        }
        
        var linkUrl = KellyTools.getRelativeUrl(link.href);
		if (!linkUrl) {
            log('bad postcontainer url');
            return false;  
		}
				
        var inFav = handler.getStorageManager().searchItem(fav, {link : linkUrl, commentLink : false});
	    
        var addToFav = KellyTools.getElementByClass(postBlock, env.className + '-FavAdd');
    
        // create if not exist
        
        if (!addToFav) {
            addToFav = document.createElement('a');
            addToFav.className = env.className + '-FavAdd';
            addToFav.href = link.href; // keep same url as main button
            
            link.parentNode.insertBefore(addToFav, link);    
        }
        
        // update title
        
        if (inFav !== false) {
            addToFav.onclick = function() { handler.showRemoveFromFavDialog(inFav); return false; };
            addToFav.innerHTML = lng.s('Удалить из избранного', 'remove_from_fav');
        } else {
            addToFav.onclick = function() { handler.showAddToFavDialog(postBlock); return false; };
            addToFav.innerHTML = lng.s('Добавить в избранное', 'add_to_fav');
        }
        
        
        return true;
            
    }	
       
    function formatComments(block) {
    
        var comments = getCommentsList(block);
        if (!comments) return false;
        
        for(var i = 0; i < comments.length; i++) {
        
            var userName = getCommentUserName(comments[i]);
            if (userName && fav.coptions.comments_blacklist && fav.coptions.comments_blacklist.indexOf(userName) != -1) { 
                comments[i].style.display = 'none';
                
                continue;
            }
        
			var addToFavButton = comments[i].getElementsByClassName('kelly-add-to-fav');
			
            if (!addToFavButton.length) {
        
				var bottomLinks = comments[i].getElementsByClassName('reply-link');
				if (bottomLinks.length) {
				
					addToFavButton = document.createElement('a');
					addToFavButton.href = '#';
					addToFavButton.innerHTML = lng.s('Добавить в избранное', 'add_to_fav');
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
			var inFav = false;
			
			if (link != '#') {
				inFav = handler.getStorageManager().searchItem(fav, {link : false, commentLink : link});
			}
				
			if (inFav !== false) {
				
				addToFavButton.setAttribute('itemIndex', inFav);
				addToFavButton.onclick = function() { handler.showRemoveFromFavDialog(this.getAttribute('itemIndex')); return false; };
				addToFavButton.innerHTML = lng.s('Удалить из избранного', 'remove_from_fav');
				
			} else {
			
				addToFavButton.onclick =  function() {						
					handler.showAddToFavDialog(block, document.getElementById(this.getAttribute('commentId')));
					return false;					
				}
				
				addToFavButton.innerHTML = lng.s('Добавить в избранное', 'add_to_fav');
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
    
    this.showLocalStorage = function() {
    
        var textArea = KellyTools.getElementByClass(favContent, 'KellyLocalStorage');
            textArea.style.display = 'block';
            textArea.value = JSON.stringify(fav);
            
        KellyTools.getElementByClass(favContent, 'kellyShowLocalStorage').style.display = 'none';
    }
    
    function getVarList(str) {
        str = str.trim();
        
        if (!str) return [];
        
        str = str.split(",");
        
        for (var i=0; i <= str.length-1; i++) {
            var tmp = str[i].trim();
            if (tmp) str[i] = tmp;
        }
        
        return str;
    }
    
    function varListToStr(varlist) {
        if (!varlist || !varlist.length) return '';
        var str = '';        
        for (var i=0; i <= varlist.length-1; i++) {
        
            if (!varlist[i]) continue;
        
            if (str) str += ',' + varlist[i];
            else str = varlist[i];
        }
        
        return str;
    }
    
    this.updateOptionsConfig = function() {
    
        if (KellyTools.getElementByClass(favContent, 'kellyAutoScroll').checked) {
            fav.coptions.autoload_onscroll = true;
        } else {
            fav.coptions.autoload_onscroll = false;
        }
        
		fav.coptions.grid = {
			fixed : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridFixed').value),
			rowHeight : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridRowHeight').value),
			min : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridMin').value), 
			cssItem : KellyTools.getElementByClass(favContent, env.className + 'GridCssItem').value,
			heightDiff : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridHeightDiff').value),
			perPage : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridPerPage').value),
		};
        
        fav.coptions.debug = false;
        debug = false;
        
        if (KellyTools.getElementByClass(favContent, env.className + 'OptionsDebug').checked) {
			fav.coptions.debug = true;
            debug = true;
		}
		
		fav.coptions.newFirst = false;
		if (KellyTools.getElementByClass(favContent, env.className + 'NewFirst').checked) {
			fav.coptions.newFirst = true;
		}
		
				
		var iconFile = KellyTools.getElementByClass(favContent, 'kellyAutoScroll');
		
		if (iconFile.value) {
		
			var saveIcon = function(el, icon) {
				log(icon);
			}
			
			KellyTools.readFile(iconFile, saveIcon, 'dataurl');
		} 
				
		if (!fav.coptions.grid.fixed || fav.coptions.grid.fixed <= 0) fav.coptions.grid.fixed = false;
		if (!fav.coptions.grid.rowHeight || fav.coptions.grid.rowHeight <= 0) fav.coptions.grid.rowHeight = 250;
		if (!fav.coptions.grid.min || fav.coptions.grid.min <= 0) fav.coptions.grid.min = 2;
		if (!fav.coptions.grid.heightDiff || fav.coptions.grid.heightDiff <= 0) fav.coptions.grid.heightDiff = 10;
		if (!fav.coptions.grid.perPage || fav.coptions.grid.perPage <= 0) fav.coptions.grid.perPage = 60;
		
        fav.coptions.comments_blacklist = getVarList(KellyTools.getElementByClass(favContent, 'kellyBlockcomments').value);
        fav.coptions.posts_blacklist = getVarList(KellyTools.getElementByClass(favContent, 'kellyBlockposts').value);
        
		var applaySave = function(msg) {
		
			handler.showOptionsDialog();
			
			if (!msg) msg = lng.s('Настройки сохранены', 'options_saved');
            
            var messageBox = document.getElementsByClassName(env.className + '-OptionsMessage');
            for (var i = 0; i < messageBox.length; i++) {
                messageBox[i].innerHTML = msg;
            }
			handler.save('cfg');
		}
        
        applaySave();		
    }
    
    this.showOptionsDialog = function(tabActive) {
       
		if (!tabActive) {
			tabActive = env.className + '-BaseOptions';
				
			var tabItems = favContent.getElementsByClassName(env.className + '-tab-item');
			for (var i = 0; i < tabItems.length; i++) {
				if (tabItems[i].className.indexOf('active') != -1) {
					tabActive = tabItems[i].getAttribute('data-tab');
				}
			}
		}
		
        handler.closeSidebar();
                
        // currently only one type of storage
        favContent.innerHTML = '';
        var output= '';
    
		output += '<table>';
        /*
        moved to locale api
		output += '<tr><td colspan="2"><h3>' + lng.s('Язык расширения', 'language') + '</h3></td></tr>';
		
		output += '\
				<tr><td colspan="2">\
					<select class="' + env.className + 'Language">\
						<option value="ru" ' + (fav.coptions.language == 'ru' ? 'selected' : '') +'>Русский</option>\
						<option value="en" ' + (fav.coptions.language == 'en' ? 'selected' : '') +'>Английский</option>\
					</select>\
					</td>\
				</tr>';
		*/			
		output += '<tr><td colspan="2"><h3>' + lng.s('Настройки сетки элементов', 'cgrid_tiles_header') + '</h3></td></tr>';		
		
		
        output += '<tr><td colspan="2"><label>' + lng.s('Новые в начало', 'cgrid_new_to_begin') + ' <input type="checkbox" class="' + env.className + 'NewFirst" ' + (fav.coptions.newFirst ? 'checked' : '') + '></td></tr>';
        output += '<tr><td>' + lng.s('Максимальная высота одной строки', 'cgrid_max_row_height') + ' :</td> <td><input type="text" class="' + env.className + 'GridRowHeight" value="' +  fav.coptions.grid.rowHeight + '"></td></tr>';
		output += '<tr><td>' + lng.s('Допустимая погрешность высоты строки', 'cgrid_max_diff') + ' :</td> <td><input type="text" class="' + env.className + 'GridHeightDiff" value="' +  fav.coptions.grid.heightDiff + '"></td></tr>';
		output += '<tr><td>' + lng.s('Минимальное кол-во элементов в строке', 'cgrid_min_number') + ' :</td> <td><input type="text" class="' + env.className + 'GridMin" value="' +  fav.coptions.grid.min + '"></td></tr>';
        output += '<tr><td>' + lng.s('Фиксированное кол-во элементов на строку', 'cgrid_fixed') + ' :</td> <td><input type="text" class="' + env.className + 'GridFixed" value="' +  (!fav.coptions.grid.fixed ? '' : fav.coptions.grid.fixed) + '"></td></tr>';
        output += '<tr><td>' + lng.s('Стиль по умолчанию для элемента строки', 'cgrid_default_rowst') + ' :</td> <td><input type="text" class="' + env.className + 'GridCssItem" value="' +  fav.coptions.grid.cssItem + '"></td></tr>';
        output += '<tr><td>' + lng.s('Элементов на страницу', 'cgrid_per_page') + ' :</td> <td><input type="text" class="' + env.className + 'GridPerPage" value="' +  fav.coptions.grid.perPage + '"></td></tr>';
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
		
        var checked = '';
        if (fav.coptions.autoload_onscroll) {
            checked = 'checked';
        }
        
		//  не реализовано скрытие \ выгрузка из памяти данных не попадающив в область видимости, для того чтобы избежать повышеной нагрузки при использовании режима
		/*
        output += '<div ' + row +'>\
					<label>\
						<input type="checkbox" ' + checked +' class="kellyAutoScroll">Автоматическая загрузка следующей страницы при скролле\
					</label>\
				    </div>'; // todo check displayedImages array
        */
		
        output += '<div><a href="#" class="' + env.className + '-OptionsSave">' + lng.s('Сохранить', 'save') + '</a></div>';
        output += '<div class="' + env.className + '-OptionsMessage"></div>';       
        
		var tabControlls = document.createElement('DIV');
			tabControlls.innerHTML = '\
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
		
		var tabBaseOptions = document.createElement('DIV');
			tabBaseOptions.innerHTML = output;
			tabBaseOptions.className = env.className + '-tab ' + env.className + '-BaseOptions';
			
		var tabStorage = document.createElement('DIV');
			tabStorage.innerHTML = '';
			tabStorage.className = env.className + '-tab ' + env.className + '-Storage';
			
		var tabOther = document.createElement('DIV');
			tabOther.className = env.className + '-tab ' + env.className + '-Other';
			
        favContent.appendChild(tabControlls);
        favContent.appendChild(tabBaseOptions);
		favContent.appendChild(tabStorage);
		favContent.appendChild(tabOther);

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
				return false;
			}
		}			
		
		output = '';  
		    
		output += '<table>';
		output += '<tr><td>' + lng.s('Игнорировать комментарии', 'ignore_comments') + ' :</td> <td><input type="text" class="kellyBlockcomments" value="' + varListToStr(fav.coptions.comments_blacklist) + '"></td></tr>';
        output += '<tr><td>' + lng.s('Игнорировать посты', 'ignore_publications') + ' :</td> <td><input type="text" class="kellyBlockposts" value="' +  varListToStr(fav.coptions.posts_blacklist) + '"></td></tr>';
        output += '<tr><td colspan="2"><label><input type="checkbox" class="' + env.className + 'OptionsDebug" ' + (debug ? 'checked' : '') + '> ' + lng.s('Режим отладки', 'debug') + '</label></td></tr>';
             
		output += '</table>';
        output += '<div><a href="#" class="' + env.className + '-OptionsSave">' + lng.s('Сохранить', 'save') + '</a></div>';
        output += '<div class="' + env.className + '-OptionsMessage"></div>';    
        
		tabOther.innerHTML = output;
		
				
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
    
    this.extendCats = function(index, remove) {
        
		if (!fav.categories[index]) return false;
		var id = fav.categories[index].id;
		
        var catIndex = extendCats.indexOf(id);
        if (catIndex != -1 && !remove) return false;
        if (catIndex == -1 && remove) return false;
        
        if (remove) extendCats.splice(catIndex, 1);
        else {
            extendCats[extendCats.length] = id;
        }

		var tag = document.getElementById('kelly-filter-' + index);
		if (tag) {
			tag.className = tag.className.replace('includable', '');	
			if (!remove) tag.className += ' includable';
			tag.className = tag.className.trim();
		}
        
        return true;
    }
    
    function updatePostCatList(index, list) {
            
        list.innerHTML = '';
        
        if (fav.items[index].categoryId) {
        
            for (var b = 0; b < fav.items[index].categoryId.length; b++) {
                
                var tagItem = document.createElement('li');
                var category = handler.getStorageManager().getCategoryById(fav, fav.items[index].categoryId[b]);
                var spanName = document.createElement('span');
                    spanName.innerHTML = category.name;
                
                list.appendChild(spanName);
                
                var removeBtn = document.createElement('a');
                    removeBtn.innerHTML = lng.s('Удалить', 'delete');
                    removeBtn.href = '#';
                    removeBtn.setAttribute('itemIndex', index);
                    removeBtn.setAttribute('catId', category.id);
                    
                    removeBtn.onclick = function() {
                        
                        handler.removeCatFromPost(parseInt(this.getAttribute('itemIndex')), parseInt(this.getAttribute('catId')));
                        
                        return false;
                    }
                    
                tagItem.appendChild(spanName); 
                tagItem.appendChild(removeBtn);
                list.appendChild(tagItem);    
                
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
        
        var list = document.getElementById('kelly-cat-list-post' + postIndex);
        
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
        
        var list = document.getElementById('kelly-cat-list-post' + index)
        
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
			
				itemInfo.innerHTML += '<a href="' + item.commentLink + '" target="_blank">' + lng.s('Показать комментарий', 'go_to_comment') + '</a><br>'
			
			}
			
		var removeItem = document.createElement('a');
			removeItem.setAttribute('itemIndex', index);		
			removeItem.onclick = function() { 
			
				var updateFavPage = function() { handler.showFavouriteImages(); };
				handler.showRemoveFromFavDialog(this.getAttribute('itemIndex'), false, updateFavPage, updateFavPage, updateFavPage);
				
				return false; 
			}
			
			removeItem.innerHTML = lng.s('Удалить', 'delete');
			removeItem.href = '#';
			removeItem.style.display = 'block';

		itemInfo.appendChild(removeItem);
		 
		var addCats = document.createElement('a');
			addCats.href = '#';
			addCats.innerHTML = lng.s('Добавить отмеченые категории', 'add_selected_cats'); 
			addCats.setAttribute('itemIndex', index);
			addCats.onclick = function() {
				handler.addCatsForPost(parseInt(this.getAttribute('itemIndex')));
				
				return false;
			}
							
		itemInfo.appendChild(addCats);
		
		var catList = document.createElement('ul');
			catList.id = 'kelly-cat-list-post' + index;
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

        var time = new Date().getTime();        
        KellyTools.createAndDownloadFile(JSON.stringify(storage), 'filtered_' + time + '.json');
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
		
			var text = lng.s('Без изображения', 'no_image');
			if (item.name) text = item.name + '<br>' + text;
			if (item.text) text = item.text + '<br>' + text;
								  
			var size = Math.ceil(text.length / 100) * 50;
			
			//itemBlock.setAttribute('data-width', size);
			
			itemBlock.innerHTML = '\
                <div style="' + fav.coptions.grid.cssItem + '" class="' + env.className + '-preview" data-width="'+size+'" itemIndex="' + index + '">\
                    <div class="' + env.className + '-preview-text">' + text + '</div>\
                </div>\
            ';
			
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
				collectionBtn.innerHTML = imageCount;
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
			
			itemBlock.innerHTML = '\
				<img style="' + fav.coptions.grid.cssItem + '" \
					 class="' + env.className + '-preview" \
					 kellyGalleryIndex="' + (galleryImagesData.indexOf(item) + subItem) + '" \
					 kellyGallery="fav-images" \
					 itemIndex="' + index + '"' + pInfo + additionAtributes + '\
					 src="' + previewImage + '" \
				>';
		
		}
		
		if (!imagesAsDownloadItems) {
		
			var postLink = document.createElement('a');
				postLink.href = item.link;
				postLink.className = env.className + '-FavItem-overlay-button';
				postLink.innerHTML = lng.s('Показать пост', 'go_to_publication'); 
				postLink.setAttribute('target', '_blank');
			
			var postHd = false;
			
			if (imageCount > 0) {
			
				postHd = document.createElement('a');
				postHd.href = '#';
				postHd.className = env.className + '-FavItem-overlay-button ' + env.className + '-FavItem-overlay-button-bottom';
				postHd.innerHTML = 'HD'; 
				
				
				if (imageCount > 1) {
					postHd.innerHTML = 'HDs'; 
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
            imagesBlock.innerHTML = lng.s('Список избранных публикаций пуст', 'fav_list_empty');
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
	  
    // autoloading next page on scroll if close to bottom
    
    this.checkLoadNextFavPage = function() {
        
        if (imageGrid.isWaitLoad() !== false) return;
        
       // favContent.appendChild(imagesBlock);
        var favPos = KellyTools.getOffset(favContent);
		var offsetY = 200;
		var blockBottom = favPos.bottom - offsetY;
        
		if (blockBottom < (KellyTools.getViewport().scrollBottom + offsetY)) {
            handler.goToFavPage('next', true);
        }
        
    }
		
	function getSelectedPostMediaControlls() {

		var controlls = document.createElement('DIV');
		
		var img = '';
		
		if (selectedImages.length > 1) {
			img += '<p>' + lng.s('Основное изображение', 'image_main') + '</p>' +
                   '<p class="' + env.className + '-ModalBox-controll-buttons">' + 
                   '<a href="#" class="kellyPreviewImage-del">' + lng.s('Удалить', 'delete')  + '</a><a href="#" class="kellyPreviewImage-prev">\
					' + lng.s('Предыдущее', 'prev') + '</a><a href="#" class="kellyPreviewImage-next">' + lng.s('Следующее', 'next')  + '</a>' +
                    '</p>';
		}
		
		if (selectedImages.length) {
			
			img += '<div class="kellyPreviewImage-container"><img src="' + env.getStaticImage(selectedImages[0]) + '" class="kellyPreviewImage"></div>';
		}
		
		controlls.innerHTML = img;
		
		KellyTools.getElementByClass(controlls, 'kellyPreviewImage-prev').onclick = function() { handler.switchPreviewImage(-1); return false; }
		KellyTools.getElementByClass(controlls, 'kellyPreviewImage-next').onclick = function() { handler.switchPreviewImage(1); return false; }
		KellyTools.getElementByClass(controlls, 'kellyPreviewImage-del').onclick = function() { handler.switchPreviewImage(0); return false; }
		
		
		KellyTools.getElementByClass(controlls, 'kellyPreviewImage').onload = function() {
			
			var dimensions = {width : parseInt(this.naturalWidth), height : parseInt(this.naturalHeight)};
			
			// dont overwrite trusted proportions
			if (selectedInfo && selectedInfo['dimensions'] && selectedInfo['dimensions'].width && selectedInfo['dimensions'].schemaOrg) return false;
							
			handler.setSelectionInfo('dimensions', dimensions);
			
			// console.log('get width and height for ' + this.src);
			// console.log(dimensions);
			
			updateSidebarPosition(); 
			/*handler.saveWH(this, false);*/ 
			return false; 
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
			container.innerHTML = html;
		
        KellyTools.getElementByClass(container, env.className + 'CatCreate').onclick = function () { 
			if (handler.categoryCreate(container)) {
				
				// handler.showFavouriteImages();
				showCatList();
			}

			return false; 
		}
		
		tooltipEl.show(true, 'categoryCreate');
	}
	
	function showCategoryControllTooltip(i, target) {
	
		if (!fav.categories[i]) return;
		
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
		if (extendCats.indexOf(fav.categories[i].id) != -1) {
			filterChecked = 'checked';
		}
		
		var isNSFWChecked = '';
		if (fav.categories[i].nsfw) isNSFWChecked = 'checked';
		// todo показывать кол-во элементов
		
		var baseClass = env.className + '-FiltersMenu';
		
		var deleteButtonHtml = '';
		if (!fav.categories[i].protect) {
			deleteButtonHtml += ' <a class="' + baseClass + '-delete-button" itemIndex="' + i + '" href="#">' + lng.s('Удалить', 'delete') + '</a>';
		}
		
		var html = '\
		<div class="' + baseClass + '-tooltip" id="kelly-filter-edit-' + i + '">\
			<label><input class="' + baseClass + '-check" id="kelly-filter-check-' + i + '" type="checkbox" itemIndex="' + i + '" ' + filterChecked + '> ' + lng.s('Добавить к изображению', 'add_to_item') + '</label>\
			<label><input class="' + baseClass + '-nsfw" id="kelly-filter-nsfw-' + i + '" type="checkbox" ' + isNSFWChecked + '> NSFW </label>\
			<br>\
            <input class="' + baseClass + '-newname" id="kelly-filter-newname-' + i + '" type="text" value="' + fav.categories[i].name + '" placeholder="' + lng.s('Новое название', 'new_name') + '">\
            <br>\
            <input class="' + baseClass + '-neworder" id="kelly-filter-neworder-' + i + '" type="text" value="' + (!fav.categories[i].order ? 0 : fav.categories[i].order) + '" placeholder="' + lng.s('Приоритет', 'cat_order') + '">\
            <br>\
            <a class="' + baseClass + '-newname-button" itemIndex="' + i + '" href="#">' + lng.s('Изменить', 'change') + '</a>\
			' + deleteButtonHtml + '\
		</div>';
		
		var container = tooltipEl.getContent();
			container.innerHTML = html;
		
		var renameButton = KellyTools.getElementByClass(container, baseClass + '-newname-button');
			renameButton.onclick = function () {
				
				var itemIndex = parseInt(this.getAttribute('itemIndex'));                        
				if (!itemIndex) return false;
				
				var editCat = {
				
					name : document.getElementById('kelly-filter-newname-' + itemIndex).value,
					nsfw : document.getElementById('kelly-filter-nsfw-' + itemIndex).checked,
                    order : parseInt(document.getElementById('kelly-filter-neworder-' + itemIndex).value),
					
				}
                
                if (!editCat.order) editCat.order = 0;
				
				var result = handler.categoryEdit(editCat, itemIndex);
				if (!result) return false;
                
                showCatList();
				
				// document.getElementById('kelly-filter-selector-' + itemIndex).innerHTML = result.name;
				return false;
			}

		if (!fav.categories[i].protect) {
			var deleteButton = KellyTools.getElementByClass(container, baseClass + '-delete-button');
				deleteButton.onclick = function () {
					
					var itemIndex = parseInt(this.getAttribute('itemIndex'));  					
					var updateFavPage = function() { handler.showFavouriteImages(); };
					handler.showRemoveCategoryDialog(itemIndex, updateFavPage, updateFavPage);
					return false;
				}
		}
		
		var catExtender = KellyTools.getElementByClass(container, baseClass + '-check'); 
			catExtender.onclick = function() { 
				var remove = true;
				if (this.checked) remove = false;
				
				handler.extendCats(parseInt(this.getAttribute('itemIndex')), remove); 
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
				filter.id = 'kelly-filter-' + i;
				filter.setAttribute('itemIndex', i);
				   
			// Edit mode add to image check
			if (extendCats.indexOf(fav.categories[i].id) != -1) {
				filter.className += ' includable';
			}
			
			filter.onmouseover = function (e) { 
			
				if (readOnly) return false; 
				showCategoryControllTooltip(this.getAttribute('itemIndex'), this);    
			}
			
			filter.onmouseout = function(e) {
			
				if (readOnly) return false;
				
				var related = e.toElement || e.relatedTarget;
				if (handler.getTooltip().isChild(related)) return;
				
				handler.getTooltip().show(false);
			}
						  
			// filter.onclick
			
			var catSelector = document.createElement('a');
				catSelector.innerHTML = fav.categories[i].name;
				catSelector.id = 'kelly-filter-selector-' + i;
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
			
			filterAdd.innerHTML = '<a href="#" onclick="return false;">+</a>';
			
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
    
        if (handler.getDownloadManager().getState() == 'download') {
            handler.showSidebarMessage('Перед выполнением действия необходимо остановить загрузку данных');
            return false;
        }
        
        return true;        
    }
				 
	// вывод всех изображений избранного \ обновление блока категорий
    // страницы сбрасываются только при смене фильтров
	
    this.showFavouriteImages = function() {
        
		imageGrid.close();
		
		imageGrid.updateConfig({rowHeight : fav.coptions.grid.rowHeight, rules : fav.coptions.grid});
		
        if (fav.coptions.autoload_onscroll) {
            // todo auto scroll to top if next page was clicked manualy
            handler.addEventListner(window, "scroll", function (e) {
                handler.checkLoadNextFavPage();
            }, 'fav_scroll');
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
        controllsContainer.innerHTML = '';
                
		if (!document.getElementById(env.className + '-mainCss')) {
			
			favContent.innerHTML = lng.s('Ошибка инициализации таблиц оформления', 'init_css_error');
			displayFavouritesBlock('fav');
			return;
		}
		
        favContent.innerHTML = '';
		
        var editButton = document.createElement('a');
            editButton.href = '#';
			editButton.innerHTML = '';
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
					
		var resetButton = editButton.cloneNode();
			resetButton.innerHTML = 'Сбросить';
			resetButton.onclick = function() {
			
                if (!checkSafeUpdateData()) return false;
                
				page = 1;
				catFilters = [];
				catIgnoreFilters = [];
                
				handler.showFavouriteImages();
				
				return false;				
			}
			
			resetButton.className = env.className + '-FavEditButton-reset';
        
        var filterComments = editButton.cloneNode();
            filterComments.className = env.className + '-FavFilter ' + env.className + '-buttoncolor-dynamic';
            filterComments.innerHTML = lng.s('Комменты', 'comments');
           
        var filterPosts = filterComments.cloneNode();
            filterPosts.innerHTML = lng.s('Публикации', 'items');          
        
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
            logicButton.className = env.className + '-FavFilter';
            logicButton.innerHTML = lng.s('Логика И', 'logic_and');
            // logic.alt = 'Вывести записи где есть хотябы один из выбранных тегов';
            
            logicButton.onclick = function () {
                
                if (!checkSafeUpdateData()) return false;
                
				if (logic == 'or') {
					logic = 'and';
					this.innerHTML = lng.s('Логика И', 'logic_and');
					
				} else {
					logic = 'or';
					this.innerHTML = lng.s('Логика ИЛИ', 'logic_or');
				}
				
                updateFilteredData();
                
				handler.updateImagesBlock();
				handler.updateImageGrid();
				
                return false;
            }
            
        var no = logicButton.cloneNode();
            no.className = env.className + '-FavFilter';
            if (!catFilterNot) no.innerHTML = '+ ' + lng.s('Категории', 'cats');
            else no.innerHTML = '- ' + lng.s('Категории', 'cats');
			
            no.onclick = function () {
  
				if (catFilterNot) {
					catFilterNot = false;
					this.innerHTML = '+ ' + lng.s('Категории', 'cats');
				} else {
					catFilterNot = true;
					this.innerHTML = '- ' + lng.s('Категории', 'cats');
				}
			
                return false;
            }
			
        var gif = logicButton.cloneNode();			
            gif.className = env.className + '-FavFilter';
            if (fav.coptions.animateGif) gif.innerHTML = '+ ' + lng.s('Анимация GIF', 'animate_gifs');
            else gif.innerHTML = '- ' + lng.s('Анимация GIF', 'animate_gifs');
			
            gif.onclick = function () {
                
                if (!checkSafeUpdateData()) return false;
                
				if (fav.coptions.animateGif) {
					fav.coptions.animateGif = false;
					this.innerHTML = '- ' + lng.s('Анимация GIF', 'animate_gifs');
				} else {
					fav.coptions.animateGif = true;
					this.innerHTML = '+ ' + lng.s('Анимация GIF', 'animate_gifs');
				}
			
				handler.save('cfg');
                
                updateFilteredData();
				
				handler.updateImagesBlock();
				handler.updateImageGrid();
                return false;
            }
			
        var nsfw = logicButton.cloneNode();		
            nsfw.className = env.className + '-FavFilter';
            if (fav.coptions.ignoreNSFW) nsfw.innerHTML = '- NSFW';
            else nsfw.innerHTML = '+ NSFW';
			
            nsfw.onclick = function () {
                
                if (!checkSafeUpdateData()) return false;
                
				if (fav.coptions.ignoreNSFW) {
					fav.coptions.ignoreNSFW = false;
					this.innerHTML = '+ NSFW';
				} else {
					fav.coptions.ignoreNSFW = true;
					this.innerHTML = '- NSFW';
				}
				
				handler.save('cfg');
                
				page = 1;
				handler.showFavouriteImages();
                return false;
            }
			
        var additionButtons = document.createElement('div');
            additionButtons.className = env.className + '-filters-AdditionButtons';
		    additionButtons.appendChild(resetButton);
            additionButtons.appendChild(editButton);
        
        if (handler.isDownloadSupported) {   
        
            var showDownloadManagerForm = function(show) {
                
                if (!show) {
                    
                    downloaderBox.modal.className = downloaderBox.modal.className.replace('active', 'hidden');  
                    sideBarLock = false;
                    return;
                    
                } else {
                    sideBarLock = true;
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
                download.innerHTML = lng.s('Загрузки', 'download_manager');
                
                download.onclick = function () {
                    if (!checkSafeUpdateData()) return false;
                    
                    if (imagesAsDownloadItems) { // todo ask before cancel if something in progress
                        imagesAsDownloadItems = false;
                        this.className = this.className.replace('active', 'hidden');
                        
                        showDownloadManagerForm(false);
                    } else {
                        imagesAsDownloadItems = true;
                        this.className = this.className.replace('hidden', 'active');
                
                        showDownloadManagerForm(true);
                        
                        handler.getDownloadManager().setDownloadTasks(displayedItems);
                        handler.getDownloadManager().showGrabManager();
                    }
                    
                    handler.updateImagesBlock();                
                    handler.updateImageGrid();
                    return false;
                }
                
            additionButtons.appendChild(download);
        }
            
            typeFiltersContainer.appendChild(logicButton);
		
		var cOptions = document.createElement('table');	
			cOptions.innerHTML = '<tr><td></td><td></td><td></td></tr>';
		
		var cOptionsSectors = cOptions.getElementsByTagName('td');
		var cOptionsSectorItems = [no, gif, nsfw];
		
		for (i = 0; i < cOptionsSectors.length; i++) {
			
			cOptionsSectors[i].appendChild(cOptionsSectorItems[i]);
		}
			
		additionButtons.appendChild(cOptions);
			
        controllsContainer.appendChild(additionButtons);
        controllsContainer.appendChild(typeFiltersContainer);
		
		if (!readOnly) editButton.className += ' active';
		
        var filtersMenu = document.createElement('ul');
            filtersMenu.className = env.className + '-FiltersMenu';
        
		showCatList(filtersMenu);  
				  
        controllsContainer.appendChild(filtersMenu);
             
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
        
        var siteSideBlock = document.getElementById(env.sideBlock);
        if (siteSideBlock) {
            siteSideBlock.style.visibility = 'visible';
            siteSideBlock.style.opacity = '1';
        }
    }
    
	this.showSidebarMessage = function(message, error) {
		
		modalBoxMessage.className = env.className + '-ModalBox-message ' + env.className + '-ModalBox-message-' + (message ? 'active' : 'hidden');
		
		if (!message) {
			modalBoxMessage.innerHTML = '';
		} else {
			
			modalBoxMessage.innerHTML = message;
			if (error) modalBoxMessage.className += ' ' + env.className + '-ModalBox-message-error';
		}
	}
	
	this.getSidebar = function() {
		return sideBarWrap;
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
    
		var siteSideBlock = document.getElementById(env.sideBlock);		
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
		
			log('clean selected info');
			if (selectedInfo) selectedInfo = false;
			
			return;
		}
		
		if (!selectedInfo) selectedInfo = new Object();
		
        selectedInfo[type] = info;    
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
        var previewImage = KellyTools.getElementByClass(modalBoxContent, 'kellyPreviewImage');
        
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
        //previewImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        
        previewImage.src = env.getStaticImage(selectedImages[caret]);
        previewImage.onload = function() { return false; } // todo after change image src width \ height may be wrong, may be recreate DOM img element helps
        
        handler.setSelectionInfo('dimensions', false);
        //console.log( previewImage.src );
    }
	
	this.showRemoveCategoryDialog = function(itemIndex, onRemove, onCancel) {
	
		if (!fav.categories[itemIndex]) {
			log('attempt to remove unexist item ' + itemIndex);
			return false;
		}
		
		handler.getTooltip().show(false);
		
		handler.showSidebarMessage(false);
        
        var html = '<p>' + lng.s('Подтвердите удаление', 'delete_confirm') + '</p>';
			html += '<p><label><input type="checkbox" name="removeImages" class="' + env.className + 'RemoveImages">' + lng.s('Удалить все связанные изображения', 'delete_rcat_items')  +  '</label></p>'
            html += '<p class="' + env.className + '-ModalBox-controll-buttons"><a href="#" class="' + env.className + 'Remove">' + lng.s('Удалить', 'delete')  +  '</a>';
            html += '<a href="#" class="' + env.className + 'Cancel">' + lng.s('Отменить', 'cancel')  +  '</a></p>';       
        
        modalBoxContent.innerHTML = '<div class="' +  env.className + '-removeDialog">' + html + '</div>';
        
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
	
    this.showRemoveFromFavDialog = function(itemIndex, postBlock, onRemove, onCancel, onApply) {
    
        if (!fav.items[itemIndex]) {
			log('attempt to remove unexist item ' + itemIndex);
			return false;
		}
        
		handler.showSidebarMessage(false);
        
        var html = '<p>Подтвердите удаление</p>';
            html += '<p class="' + env.className + '-ModalBox-controll-buttons"><a href="#" class="' + env.className + 'Remove">' + lng.s('Удалить', 'delete')  +  '</a><a href="#" class="' + env.className + 'Apply">' + lng.s('Применить изменения', 'apply')  +  '</a>';
            html += '<a href="#" class="' + env.className + 'Cancel">' + lng.s('Отменить', 'cancel')  +  '</a></p>';       
        
        modalBoxContent.innerHTML = '<div class="' +  env.className + '-removeDialog">' + html + '</div>';
        
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
			removeButton.innerHTML = lng.s('Удалить всю подборку', 'delete_all_items');
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
    
    this.showAddToFavDialog = function(postBlock, comment) {
        
        if (!postBlock) return false;
        
        handler.showSidebarMessage(false);
        
        // selectedPostCats = [];
		handler.setSelectionInfo(false);
        
        selectedPost = postBlock;
        if (comment) {
            selectedComment = comment;
            selectedImages = env.getAllMedia(comment);
        } else {            
            selectedComment = false;
            selectedImages = env.getAllMedia(postBlock);
        }
       
        selectAutoCategories();        
        handler.showSidebar();
        		
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
						<input type="text" placeholder="' + lng.s('Название новой категории', 'cat_new_cat_name') + '" value="" class="' + env.className + 'CatName">\
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

		var controlls = getSelectedPostMediaControlls();
		
        modalBoxContent.innerHTML = html;
		modalBoxContent.insertBefore(controlls, modalBoxContent.childNodes[0]);		
        
        KellyTools.getElementByClass(modalBoxContent, env.className + 'CatAdd').onclick = function() { handler.categoryAdd(); return false; }        
        KellyTools.getElementByClass(modalBoxContent, env.className + 'CatCreate').onclick = function () { handler.categoryCreate(); return false; }
        // KellyTools.getElementByClass(modalBoxContent, env.className + 'CatRemove').onclick = function () { handler.categoryRemove(); return false; }

        KellyTools.getElementByClass(modalBoxContent, env.className + 'Add').onclick = function () { handler.itemAdd(); return false; }
                
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
        
        if (!selectedPost) return false;
                          
        var postItem = { 
            categoryId : [], 
            pImage : '', 
            link : '', 
            name : '',
			// commentLink : '',
        };
		
		var inputName = KellyTools.getElementByClass(modalBoxContent, 'kellyJRFavName');
		if (inputName) postItem.name = inputName.value;
               
        fav.selected_cats_ids = validateCategories(fav.selected_cats_ids);
        
        if (fav.selected_cats_ids.length) {
        
            for (var i = 0; i < fav.selected_cats_ids.length; i++) {            
                postItem.categoryId[postItem.categoryId.length] = fav.selected_cats_ids[i];
            }
        }
                
        //var firstImageBlock = KellyTools.getElementByClass(selectedPost, 'image');
        if (selectedComment) {
        
            var text = getCommentText(selectedComment);
            if (text) postItem.text = text;

            postItem.commentLink = env.getCommentLink(selectedComment);
        } 

		// todo replace long name previewImage to pimage		
		
        if (selectedImages.length == 1) postItem.pImage = selectedImages[0];
        else if (selectedImages.length > 1) {
            var previewImage = KellyTools.getElementByClass(modalBoxContent, 'kellyPreviewImage');
            
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
        
        var link = env.getPostLink(selectedPost);
        if (link) postItem.link = link.href;           
        
        if (!postItem.link) {
            
            if (noSave) handler.showSidebarMessage(lng.s('Публикация не имеет ссылки', 'item_bad_url'), true);
            return false;
            
        }
        
        if (noSave) return postItem;
		
		/*
			todo validate in storageManager
			
			postItem.link = postItem.link.replace('https://', '');
			postItem.link = postItem.link.replace('http://', '');
			
			if (postItem.commentLink) {
				postItem.commentLink = postItem.commentLink.replace('https://', '');
				postItem.commentLink = postItem.commentLink.replace('http://', '');
			}
		*/
		
		var selectedUrl = KellyTools.getRelativeUrl(selectedComment ? postItem.commentLink : postItem.link);
		var selectedUrlTypeKey = selectedComment ? 'commentLink' : 'link';
		
        for (var i = 0; i < fav.items.length; i++) {
            
            if ( KellyTools.getRelativeUrl(fav.items[i][selectedUrlTypeKey]).indexOf(selectedUrl) != -1 ) {
                fav.items[i] = postItem;
				handler.showSidebarMessage(lng.s('Избранная публикация обновлена', 'item_upd'));
                handler.save('items');
                return false;
            }
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
        handler.save('cfg');
        
    }
    
    function createCatExcludeButton(catId) {
        
        var category = handler.getStorageManager().getCategoryById(fav, catId);
        
        var catItem = document.createElement('a');
            catItem.href = '#';
            catItem.innerHTML = 'Исключить ' + category.name;
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
            fav.categories[index].order = 0;
            
            edited = true;
        }  
        
        if (edited) {
        
            handler.save('items');
            return fav.categories[index];
            
        } else return false;
        
    }

    this.getGlobal = function(name) {
		if (name == 'debug') return debug;	
		if (name == 'env' || name == 'env') return env;		
		if (name == 'fav') return fav;
        if (name == 'filters') return catFilters;
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
        
        handler.save('cfg');
    }
    
    this.categoryCreate = function(container) {
        
		if (!container) {
			container = sideBarWrap;
		}
		
        if (!container) return false;
        
        var name = KellyTools.getElementByClass(container, env.className + 'CatName').value;
        name = name.trim();
        
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
        
        var catSelect = KellyTools.getElementByClass(container, 'kellyJRFavCat');
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
        if (downloadBtn) downloadBtn.innerHTML = lng.s('Скачать', 'download');	
			
        if (!favNativeParser || !favNativeParser.collectedData.items.length) return false;
                                
        KellyTools.getElementByClass(document, 'kelly-Save').style.display = 'block';
            
        var saveNew = KellyTools.getElementByClass(document, 'kelly-SaveFavNew');
            saveNew.onclick = function() {
			
				if (favNativeParser && favNativeParser.collectedData.items.length) {
					
					var time = new Date().getTime();	
					var fname = 'db_' + time;
					var pageInfo = env.getFavPageInfo();
					
					if (pageInfo.userName) fname += '_' + pageInfo.userName;
					
					fname += '.json';
					
					KellyTools.createAndDownloadFile(JSON.stringify(favNativeParser.collectedData), fname);	
				}
				
				return false;
            }            
    }
    
    this.onDownloadNativeFavPage = function(worker, thread, jobsLength) {
		
		var error = '';
		var logEl = KellyTools.getElementByClass(document, env.className + '-exporter-log');
		var logNum = parseInt(logEl.getAttribute('data-lines'));
		if (!logNum) logNum = 0;
		
		if (logNum > 1000) {
			logEl.innerHTML = '';
		}
		
        KellyTools.getElementByClass(document, env.className + '-exporter-process').innerHTML = lng.s('Страниц в очереди __PAGESN__', 'download_pages_left', {PAGESN : jobsLength});
		
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
				loadDoc.innerHTML = thread.response;
				
			var posts = loadDoc.getElementsByClassName('postContainer');
			
			if (!posts) {
			
				error = 'Отсутствует контейнер postContainer для страницы ' + thread.job.data.page;
			} else {
				logNum++;
				logEl.innerHTML += '[' + KellyTools.getTime() + '] Страница : ' + thread.job.data.page + ' найдено ' + posts.length + ' элементов' + '<br>';
				logEl.setAttribute('data-lines', logNum+1);
			}
        }
		
		if (error) {
		
			worker.errors += error;		
			logEl.innerHTML += '[' + KellyTools.getTime() + ']' + error + '<br>';
			logEl.setAttribute('data-lines', logNum+1);
			
			return;
		}
				
        var pageInfo = {
            page : thread.job.data.page,
            itemsNum : 0,
        }
        
		// check uniquie throw searchItem
        // check for duplicates on save in current storage by post url updatePostFavButton as example
        // exlude unnesessery data to improve load speed
        
            fav.selected_cats_ids = [];
            
        for (var i = 0; i < posts.length; i++) {
        
            selectedComment = false;
            selectedPost = posts[i];
			
            handler.setSelectionInfo(false);
			
            selectedImages = env.getAllMedia(posts[i]);
            selectAutoCategories();
            
            if (env.getPostTags && worker.tagList) {
                
                var postTags = env.getPostTags(selectedPost);
                var postOk = false;
                    
                if (worker.tagList.include) {
                
                    for(var b = 0; b < worker.tagList.include.length; b++) {
                    
                        if (postTags.indexOf(worker.tagList.include[b]) != -1) {
                            postOk = true;
                            
                            var sm = handler.getStorageManager();
                            
                            var itemCatId = sm.getCategoryBy(worker.collectedData, worker.tagList.include[b], 'name');
                                itemCatId = itemCat.id;
                                
                            if (itemCatId == -1) {
                                itemCatId = handler.getStorageManager().categoryCreate(worker.collectedData, worker.tagList.include[b], false);                                
                            }
                            
                            if (itemCatId > 0) {                                
                                db.selected_cats_ids.push(itemCatId);
                            }
                            
                            break;
                        }
                        
                    }
                    
                } else {
                    postOk = true;
                }
                
                if (worker.tagList.exclude) {
                    for(var b = 0; b < worker.tagList.exclude.length; b++) {
                        if (postTags.indexOf(worker.tagList.exclude[b]) != -1) {
                            postOk = false;
                            break;
                        }
                    }
                }
            }
            
            var postItem = handler.itemAdd(true);
            if (postItem) {
			
				if (skipEmpty && !getPreviewImageByItem(postItem, false)) {
					log('skip empty item');
					log(postItem);
					continue;
				}
				
				if (handler.getStorageManager().searchItem(worker.collectedData, postItem) === false) {
					
					worker.collectedData.ids++;	
				
					postItem.id = worker.collectedData.ids; 

					worker.collectedData.items[worker.collectedData.items.length] = postItem;
					
					pageInfo.itemsNum++;
				}

			}
        }
        
        log(pageInfo.page + ' | ' + pageInfo.itemsNum);
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
        
		// todo replace by kellyStorage.getDefaultData 
		
        favNativeParser.collectedData = handler.getStorageManager().getDefaultData();
		
        var pages = KellyTools.getElementByClass(document, 'kelly-PageArray'); 
		var pagesList = [];
		
		var message = KellyTools.getElementByClass(document, env.className + '-exporter-process');
		
		if (pages && pages.value.length) {
			pagesList = KellyTools.getPrintValues(pages.value, true);
		} else { 
			pagesList = KellyTools.getPrintValues('1-' + favInfo.pages, true);
		}	
		
		if (!pagesList.length) {
			message.innerHTML = lng.s('Выборка пуста', 'selection_empty');
			return;
		}
		
        for (var i = 0; i < pagesList.length; i++) {
			
			var pageNumber = pagesList[i];
			
            favNativeParser.addJob(
                favInfo.url + pageNumber, 
                handler.onDownloadNativeFavPage, 
                {page : pageNumber},
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
        
        var tagFilter = KellyTools.getElementByClass(document, env.className + '-exporter-tag-filter');
        
        if (tagFilter) {
            if (tagFilter.value != fav.coptions.tagList) {
                fav.coptions.tagList = tagFilter.value; 
                
                handler.save('cfg');
            }
            
            favNativeParser.tagList = KellyTools.parseTagsList(tagFilter.value);
        }
        
		var logEl = KellyTools.getElementByClass(document, env.className + '-exporter-log');
			logEl.innerHTML = '[' + KellyTools.getTime() + '] Инициализация...' + "<br>";
			
        el.innerHTML = 'Загрузка... (Отменить)';  
		
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
        
            var saveBlock = '<div class="kelly-Save" style="display : none;"><a href="#" class="kelly-SaveFavNew" >Скачать список элементов</a></div>';
            
            var items = favPageInfo.items;
            if (favPageInfo.pages > 2) { 
                items = '~' + items;
            }
            
			// для текстовый публикаций делать заголовок через метод setSelectionInfo
			
            var tagFilterHtml = '';
            
            var tags = fav.coptions.tagList;
            
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
            }
            
            favPageInfo.container.innerHTML = '\
                <div class="' + env.className + '-exporter-container">\
                     <h2>' +  lng.s('Сделать локальную копию', 'download_title') + '</h2>\
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

            if (env.getPostTags) {
                KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-show-tag-filter').onchange = function() {
                    
                    var filterList = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-tag-filter-container');
                        filterList.style.display = this.checked ? 'block' : 'none'; 
                    
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
        var posts = document.getElementsByClassName(env.publication);
        for (var i = 0; i < posts.length; i++) {
            formatPostContainer(posts[i]);
        }
    }
    
    this.initOnPageReady = function() {
		
		if (init) return false;
		
        if (!initCss()) {
        
            log('safe exit from page ' + document.title);
            return false; 
        }
		
        handler.addEventListner(document.body, "keyup", function (e) {
            
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
		
        handler.formatPostContainers();      
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

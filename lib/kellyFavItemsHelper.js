// ==UserScript==
// @encoding utf-8
// @name           KellyFavItemsHelper
// @namespace      Kelly
// @description    useful script
// ==/UserScript==

// отключать анимацию гиф если есть не загруженые

// опция - вкл. дебагер
// опция - собирать все метаданные о подборке - каждому изображению в подборке будут собраны данные о пропорциях
// добавление категории через список фильртов +
// сбор мета данных о пропорциях и размерах каждого изображения реализовать отдельно при необходимости
// возможность склеить категории, количество элементов в категории

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
// проверять при сохранении кол-во сохраненных килобайт т.к. может закончится место и тогда массив может повредится
// Важное до релиза
// стопорить проигрывание гифок (всегда показывать превьюшку, при клике на доп кнопку play проигрывать)
// многоуровневые категории (при клике на родителя - всплывашка с детьми)
// импорт обычного избранного - доделать сбор тегов (учитывать только первые N), подсчитывать самые часто встречающиеся и создавать из них категории; сохранение в отдельное хранилище, докачивание странииц и выбор с какой начинать
// хранилище в фоновом расширении

// Остальное

// назначение родителя через режим редактирования категории (исключать группу GIF)
// автоматически выбирить группу gif для гифок. сохранять превьюшку для гифок - гораздо быстрей можно узнать размер файла [ok]
// оверлеем кол-во кадров - при клике вывод галереи только с этими кадрами [ok], возможность разбить их при выводе (кнопка Разбить (копируем как отедльные элементы и запоминаем родителя для возможности отмены) \ Удалить в режиме редактирования), отделить конкрентое изображение ( сохранять для доп кадров пропорции в отдельную переменную)
// грабер на php и подключение к нему [ок] реализовано через download api, название папки включает все выбраные категории \ фулл версии картинок возможность сохранять коллекции отдельной папкой \ только текущая страница \ выборочное исключение \ пропустить первые N \ название Удаленная категория - Без категории \ при выборе нескольких категорий возможность сохранять в разные категории один и тот же файл если он есть и там и там
// кол-во элементов в строке (предварительно перейти на класс tileGrid  float left; для элементов в сеткe
// скрывать сайдблок [ok]
// сортировка прямая и обратная
// дублировать в основное избранное сайта [-]
// автозагрузка при скролле не корректна

// опционально сейвить реакторские теги (хранить отдельным параметром по аналогии с основными), для совместимости надо будет категории хранить в самом хранилище картинок - иначе нормально не обменяться
// кнопка - сохранять теги
// удаление категорий - удалять только саму категорию \ категорию и входящие в нее изображения [ok] - после удаления если кат выделена, не отображается. проверить
// getModal - getControllBlock

function KellyFavItemsHelper() 
{
    this.PROGNAME = 'KellyFavItemsHelper v0.94';
    
    var handler = this;	
	    
    var env = false;
    
    var mainIframe = false;
	
    var events = new Array();
    
    var selectedPost = false;
    var selectedImages = false;
    var selectedComment = false;
    var selectedInfo = false; // какие-либо мета данные сохраняемые для определенной публикации в обработчике itemAdd (добавлять методом setSelectionInfo)
    
    var extendCats = []; // выделеные категории для последующего добавления к определенной публикации, в режиме просмотра избранного
    
    var excludeFavPosts = false;
    var excludeFavComments = false;
    
    var logic = 'and';
    
    var init = false;
	var loadedCss = [];
    
    // Dom elements
    
    var modalBox = false;
    var modalBoxContent = false;
    var modalBoxMessage = false;
    
    var favCounter = false;
    
    var siteContent = false; // if false after init - profile mismatch with page
    var favContent = false;
    
    var submenuItems = false;
    var menuButtons = [];
    
    var domCategoryList = false;
    
    var mode = 'main'; // fav,
    
    var catFilters = [];
    var catFilterNot = false; // режим выбора категории с отрицанием
	var catIgnoreFilters = [];
    
    var commentsBlockTimer = [];
    
    var readOnly = true; // todo save this option ? 
    
    // addition classes
    var imgViewer;    
    var favNativeParser = false;
    var downloadManager = false;
	var storageManager = false;
    var tooltip = false;
	
    // fav image grid
    
    var imagesBlock = false;
        
    var debug = true;
    
    var page = 1;
    var displayedItems = [];
	var lng = kellyLoc;
    
    // локальное хранилище, структура данных поумолчанию
    
    var fav = {       
        items : [], 
        
        selected_cats_ids : [], // последние выбраные категории при добавлении изображения через диалоговое окно (categoryExclude, validateCategories, getCategoryBy)
        categories : [
            {id : 1, name : 'GIF', protect : true},
            {id : 2, name : 'NSFW', nsfw : true, protect : true},
        ],  // категории элементов
               
        select_native_tags : false, // getNativeTagByName     
        // native_tags : [],     
        
        ids : 100, // счетчик уникальных идентификаторов
        
        coptions : {}
    };
	
	var imageGrid = false;
	
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
     
            if (handler.isMainDomain() ) {
			
                handler.load(false, function() {
					
					handler.loadLanguageSettings(function() {
					
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
					
				});  
        
            } else {            
            
                log('create iframe and request local storage')
            
                mainIframe = document.createElement('iframe');
                
                document.body.appendChild(mainIframe);
                
                mainIframe.src = env.mainIframeSrc + '?' + env.actionVar + '=getLocalStorage';
                mainIframe.onload = function() {
                    
                   // dont need do anything, child send to parent an message with method getLocalStorage after load by itself
                   
                }                

                mainIframe.style.width = '1px;';
                mainIframe.style.height = '1px';     
            }
			
            handler.addEventListner(window, "message", function (e) {
                handler.getMessage(e);
            }, 'input_message_');
        
            
        } else if (action == 'getLocalStorage') {
        
            handler.load();
            var output = { method : 'getLocalStorage', error : false, fav : fav, notice : ''};
            window.parent.postMessage(output, "*");
            
            handler.addEventListner(window, "message", function (e) {
                handler.getMessage(e);
            }, 'input_message_');
            
        } else if (action == 'disable') {
        
        } else if (action == 'sanitize') { 
			// можно исключить такие страницы из обработки плагином совсем прописав ислючения в manifest
            // режим отображения при быстрой загрузке контента в несколько iframeов
            if (env.cleanNative) cleanNative();
            window.parent.postMessage({method : 'speedUpOnLoad'}, "*"); // потоковый загрузчик детектит страницу как загруженую при отправке любого сообщения
        }
        
        log(handler.PROGNAME + ' init | loaded in ' + action + ' mode | profile ' + env.profile);        
	}
    
	
	this.updateFavCounter = function() {
		if (!favCounter) return;
		
		favCounter.className = favCounter.className.replace('counter-enabled', '');
		
		if (fav.items.length) {
			favCounter.className += ' counter-enabled';
		}
		
		favCounter.innerHTML = fav.items.length;
	}
   
    function cleanNative() {
        document.getElementsByTagName('HEAD')[0].innerHTML = '';
        var container = document.getElementById('container');
        document.body.innerHTML  = container.innerHTML;
        //window.stop(); - broke onLoad event - may be use messsages
    }
    
    // домен, локальное хранилище которого будет использоваться
    
    this.isMainDomain = function() {
        if (window.location.host == env.mainDomain) return true;
        else return false;
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
	
	function getTooltip() {
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
            KellyTools.log(info, 'KellyJRHelper');
        }
    }

    // validate selected categories, remove from selected if some of them not exist
    
    function validateCategories(catList) {
           
        var tmpSelectedCategories = []; 
        
		if (catList) {
			
			for (var i = 0; i < catList.length; i++) {
			
				if (getCategoryById(catList[i]).id == -1) {
					log('skip deprecated category ' + catList[i]);
					continue;
				} 
				
				tmpSelectedCategories.push(catList[i]);
			}
        }       
        return tmpSelectedCategories;
    }
    
	this.loadLanguageSettings = function(onLoadCallback) {
		
		// language profile init
		
		if (!fav.coptions.language) {
			fav.coptions.language = kellyLoc.detectLanguage();
			log('loadLanguageSettings() set default app language ' + fav.coptions.language);
		}
		
		var onLoadLoc = function(success) {
			if (!success) {
				kellyLoc.currentLanguage = kellyLoc.defaultLanguage;
				fav.coptions.language = kellyLoc.defaultLanguage;
			}
			
			if (onLoadCallback) onLoadCallback(success);
		}
		
		kellyLoc.currentLanguage = fav.coptions.language;
		kellyLoc.requestLoc(fav.coptions.language, onLoadLoc);
		
		kellyLoc.debug = debug;
	}
	
    // загрузить настройки и локальное избранное
    
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
					
			fav.coptions.newFirst = fav.coptions.newFirst ? true : false;
			
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
            
    this.save = function(type) {
        
        if (!handler.isMainDomain() && handler.getStorageManager().driver == 'localstorage') {
            
            log('save() send data to main domain');
            
            mainIframe.postMessage({method : 'updateLocalStorage', fav : fav, type : type}, "*");
            
        } else {
		
			console.log(type);
		
            if (!type || type == 'items') {
			
				handler.getStorageManager().saveDB(fav.coptions.storage, { 
					categories : fav.categories, 
					items : fav.items,  
					ids : fav.ids, 
				}, function(error) {
					  log('save() save data to storage ' + (error ? error : 'OK'));
				});
            }
			
			if (!type || type == 'cfg') {
			
				handler.getStorageManager().saveDB('config', { 
					selected_cats_ids : fav.selected_cats_ids, 
					coptions : fav.coptions
				}, function(error) {
					 log('save() save cfg to storage ' + (error ? error : 'OK'));
				}, true);
			}
        }
    }
	
    this.getMessage = function(e) {
           
        if (!e.data || !e.data.method) return false;
        
		// передача с основного домена локального хранилища. если хранилище будет в бекграунде в дальнейшем эти методы не понадобятся
		
        if (e.data.method.indexOf('askLocalStorage') != -1) {

            var output = { method : 'getLocalStorage', error : false, fav : fav, notice : ''};
            e.source.postMessage(output, "*");
        
		// получение массива с основного домена, вывод если уже активирована страница избранного
		
        } else if (e.data.method.indexOf('getLocalStorage') != -1) {
        
            // for subdomains - only sinc current data without save on subdomain local storage
            if (e.data.fav) {
                
                mainIframe = e.source;
                fav = e.data.fav;
				
				handler.loadLanguageSettings(function() {
					imgViewer = new KellyImgView({idGroup : env.className + '-ImgView'});
					initImageGrid();
					handler.initOnPageReady();
				});
				
            }
            
        } else if (e.data.method.indexOf('updateLocalStorage') != -1) {
			var saveType = '';
			if (e.data.type) saveType = e.data.type;
            if (e.data.fav) fav = e.data.fav;
            handler.save(saveType);
            
            log('save data by asking by other domain')
        }
    }
    
    this.goToFavPage = function(newPage, byScroll) {
    
        if (!displayedItems || !displayedItems.length) return false;
                
        var totalPages = Math.ceil(displayedItems.length / fav.coptions.grid.perPage);
               
        if (!byScroll) byScroll = false;
               
        if (newPage == 'next') page++;
        else if (newPage == 'previuse' || newPage == 'prev' ) page--;
        else {
            page = parseInt(newPage);
        }
		
        if (page < 1) page = 1;
		
        if (page > totalPages && byScroll) {
			page = totalPages;
			return false;
		}
		
		
        if (page > totalPages) page = totalPages;
        		
        imageGrid.close();
        
        handler.updateImagesBlock(false, byScroll);
        handler.updateImageGrid();
        
        return true;
    }
    
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

	function addCss(text, remove) {

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
				return false;
			}
			
			var cssManifest = "\n\r\n\r\n\r" + '/* ' +  response.url + ' */' + "\n\r\n\r\n\r";
			addCss(cssManifest + KellyTools.replaceAll(response.data, '__BASECLASS__', env.className));
			
			loadedCss[loadedCss.length] = response.item;
			
			if (loadedCss.length == 2) initWorktop(); 
		};
		
		KellyTools.getBrowser().runtime.sendMessage({method: "getCss", item : 'main'}, loadCssResource);
        KellyTools.getBrowser().runtime.sendMessage({method: "getCss", item : env.profile}, loadCssResource);
		
		if (env.onInitCss) env.onInitCss();
        return true;
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
						text += '<img src="' + env.getImageDownloadLink(item.pImage[i], false) + '" alt="' + imgTitle + '"></a></li>';
					}
						
				text += '</ul>';
			
			} else {
			
				text += '<a href="' + env.getImageDownloadLink(item.pImage, true) + '" target="_blank">' + lng.s('Основное изображение', 'image_main') + '</a>' + '<br>';
			}
			
			return text;
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
		}, 300);	
	}
	
	function initWorktop() {
		
        var mainContainer = document.getElementById(env.mainContainer);
        
		var modalClass = env.className + '-ModalBox';
		
        modalBox = document.createElement('div');
        modalBox.id = modalClass;
        modalBox.className = modalClass + ' ' + modalClass + '-hidden ' + env.hostClass; 
        
        var modalBoxHTML  = '';
            modalBoxHTML += '<div class="' + modalClass + '-header"><a href="#" class="' + modalClass + '-close">Закрыть</a></div>';
            modalBoxHTML += '<div class="' + modalClass + '-content">';
                                
            modalBoxHTML += '</div><div class="' + modalClass + '-message"></div>';
                     
        var imgView = document.createElement('div');
            imgView.id = env.className + '-ImgView';
            imgView.innerHTML = '<div id="' + env.className + '-ImgView-loader"></div><div id="' + env.className + '-ImgView-img" ></div>';
            
        modalBox.innerHTML = modalBoxHTML;
		
        modalBoxContent = modalBox.getElementsByClassName(modalClass + '-content')[0];
        modalBoxMessage = modalBox.getElementsByClassName(modalClass + '-message')[0];
        
        mainContainer.appendChild(modalBox);
        mainContainer.appendChild(imgView);
        
        imgViewer.addBaseButtons();
		
		var tip = imgViewer.addButton('?', 'info', function() { });
		addImageInfoTip(tip);
				
        handler.addEventListner(window, "scroll", function (e) {
            env.updateModalBlockPosition();
        }, '_fav_dialog');
        

        // add fav button on top
		
		var counterHtml = '<div class="'+ env.className + '-FavItemsCount"></div>';
        var iconHtml = '';
		
		if (fav.coptions.icon) {
			iconHtml = '<div class="' + env.className + '-icon" style="' + fav.coptions.icon + '"></div>';
		} else {			
			iconHtml = '<div class="' + env.className + '-icon ' + env.className + '-icon-diskete"></div>';
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
        
        var tweakButton = createMainMenuButton(lng.s('Настройки', 'options'), function() { 

			if (mode == 'tweak') {
				handler.hideFavoritesBlock();
			} else {					
				handler.showTweaksDialog();
			}
			
		    return false; 
		
		});
		
        if (tweakButton) {
            menuButtons['tweak'] = tweakButton.parentNode;
        }
        
        // add fav container
        
        siteContent = document.getElementById(env.mainContentContainer);
        
        if (siteContent) {
        
            favContent = document.createElement('div');
            favContent.className = env.className + '-FavContainer';
            
			favContent.className += ' ' + env.hostClass; 
			
            siteContent.parentNode.insertBefore(favContent, siteContent);
        } else {
            log('main container inner not found')
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
            menuButtonContainer.className = 'submenuitem ' + env.hostClass + ' ' + env.className + '-MainMenuItem';
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
            
    function getNativeTagByName(name) {
        
        //id = parseInt(id);
                      
        if (!fav.native_tags) return false;
        
        for (var i = 0; i < fav.native_tags.length; i++) {
            if (name == fav.native_tags[i].name) return fav.native_tags[i];
        }  
        
        return false;
    }
    
    function getCategoryBy(input, method) {
        if (!method) method = 'name';        
                            
        for (var i = 0; i < fav.categories.length; i++) {
            if (input == fav.categories[i][method]) return fav.categories[i];
        }  
        
        return {id : -1, name : lng.s('Удаленная категория', 'removed_cat')};      
    }
    
    function getCategoryById(id) {
        
        id = parseInt(id);
                            
        for (var i = 0; i < fav.categories.length; i++) {
            if (id == fav.categories[i].id) return fav.categories[i];
        }  
        
        return {id : -1, name : lng.s('Удаленная категория', 'removed_cat')};
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

        handler.closeModal();
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
        
    this.updateImageGrid = function(clearTimer) {

		  
		imageGrid.updateConfig({tilesBlock : imagesBlock});
		imageGrid.updateTileGrid(clearTimer);
		
		return;
		
    }
    
    this.showLocalStorage = function() {
    
        var textArea = KellyTools.getElementByClass(favContent, 'kellyLocalStorage');
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
    
    this.updateTweaksConfig = function() {
    
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
		
		fav.coptions.newFirst = false;
		if (KellyTools.getElementByClass(favContent, env.className + 'NewFirst').checked) {
			fav.coptions.newFirst = true
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
        
		var languageSelect = KellyTools.getElementByClass(favContent, env.className + 'Language');
		var language = languageSelect.options[languageSelect.selectedIndex].value;
		
		var applaySave = function(msg) {
		
			handler.showTweaksDialog();
			
			if (!msg) msg = lng.s('Настройки сохранены', 'options_saved');
			KellyTools.getElementByClass(favContent, 'kellyTweaksMessage').innerHTML = msg;
			
			handler.save('cfg');
		}
				
		if (fav.coptions.language != language) {
			fav.coptions.language = language;
			
			handler.loadLanguageSettings(function(success) {
				if (!success) {
					fav.coptions.language = kellyLoc.defaultLanguage;
					applaySave(lng.s('Ошибка загрузки языка', 'options_error_language'));
				} else {
					kellyLoc.currentLanguage = fav.coptions.language;
					applaySave();
				}	
			});
			
		} else {
			applaySave();
		}		
    }
    
    this.showTweaksDialog = function(tabActive) {
       
		if (!tabActive) {
			tabActive = env.className + '-BaseOptions';
				
			var tabItems = favContent.getElementsByClassName(env.className + '-tab-item');
			for (var i = 0; i < tabItems.length; i++) {
				if (tabItems[i].className.indexOf('active') != -1) {
					tabActive = tabItems[i].getAttribute('data-tab');
				}
			}
		}
		
        handler.closeModal();
                
        // currently only one type of storage
        favContent.innerHTML = '';
        var output= '';
    
		output += '<table>';
		output += '<tr><td colspan="2"><h3>' + lng.s('Язык расширения', 'language') + '</h3></td></tr>';
		
		output += '\
				<tr><td colspan="2">\
					<select class="' + env.className + 'Language">\
						<option value="ru" ' + (fav.coptions.language == 'ru' ? 'selected' : '') +'>Русский</option>\
						<option value="en" ' + (fav.coptions.language == 'en' ? 'selected' : '') +'>Английский</option>\
					</select>\
					</td>\
				</tr>';
					
		output += '<tr><td colspan="2"><h3>' + lng.s('Настройки сетки элементов', 'cgrid_tiles_header') + '</h3></td></tr>';		
		
		
        output += '<tr><td colspan="2"><label>' + lng.s('Новые в начало', 'cgrid_new_to_begin') + ' <input type="checkbox" class="' + env.className + 'NewFirst" ' + (fav.coptions.newFirst ? 'checked' : '') + '></td></tr>';
        output += '<tr><td>' + lng.s('Максимальная высота одной строки', 'cgrid_max_row_height') + ' :</td> <td><input type="text" class="' + env.className + 'GridRowHeight" value="' +  fav.coptions.grid.rowHeight + '"></td></tr>';
		output += '<tr><td>' + lng.s('Допустимая погрешность высоты строки', 'cgrid_max_diff') + ' :</td> <td><input type="text" class="' + env.className + 'GridHeightDiff" value="' +  fav.coptions.grid.heightDiff + '"></td></tr>';
		output += '<tr><td>' + lng.s('Минимальное кол-во элементов в строке', 'cgrid_min_number') + ' :</td> <td><input type="text" class="' + env.className + 'GridMin" value="' +  fav.coptions.grid.min + '"></td></tr>';
        output += '<tr><td>' + lng.s('Фиксированное кол-во элементов на строку', 'cgrid_fixed') + ' :</td> <td><input type="text" class="' + env.className + 'GridFixed" value="' +  (!fav.coptions.grid.fixed ? '' : fav.coptions.grid.fixed) + '"></td></tr>';
        output += '<tr><td>' + lng.s('Стиль по умолчанию для элемента строки', 'cgrid_default_rowst') + ' :</td> <td><input type="text" class="' + env.className + 'GridCssItem" value="' +  fav.coptions.grid.cssItem + '"></td></tr>';
        output += '<tr><td>' + lng.s('Элементов на страницу', 'cgrid_per_page') + ' :</td> <td><input type="text" class="' + env.className + 'GridPerPage" value="' +  fav.coptions.grid.perPage + '"></td></tr>';
		
		output += '<tr><td colspan="2"><h3>Кнопка меню</h3></td></tr>';	

        output += '<tr><td>Иконка :</td><td>';
		
		if (!fav.coptions.icon) {
			output += '<div class="' + env.className + '-icon ' + env.className + '-icon-diskete" style="position : static; display : inline-block;"></div>';
		} else {
			output += '<div class="' + env.className + '-icon" style="' + fav.coptions.icon + '"></div>';
		}
		
		output += '<input type="file" class="' + env.className + 'Icon"></td></td>';		
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
		
        output += '<div><a href="#" class="kellyTweaksSave">' + lng.s('Сохранить', 'save') + '</a></div>';
        output += '<div class="kellyTweaksMessage"></div>';
        
        
        output = '<div class="' + env.className + '-FavContainer-page">' + output + '</div>';
        
		
		var tabControlls = document.createElement('DIV');
			tabControlls.innerHTML = '<div class="' + env.className + '-tab-list">\
											<ul>\
												<li data-tab="' + env.className + '-BaseOptions" class="' + env.className + '-tab-item" >\
													<a href="#" >' + lng.s('Основные настройки', 'options_main') + '</a>\
												</li>\
												<li data-tab="' + env.className + '-Storage" class="' + env.className + '-tab-item" >\
													<a href="#">' + lng.s('Данные', 'storage') + '</a>\
												</li>\
												<li data-tab="' + env.className + '-Other" class="' + env.className + '-tab-item" >\
													<a href="#" >' + lng.s('Остальное', 'other') + '</a>\
												</li>\
											</ul>\
										</div>';
		
	
		
		var tabBaseOptions = document.createElement('DIV');
			tabBaseOptions.innerHTML = output;
			tabBaseOptions.className = env.className + '-tab ' + env.className + '-BaseOptions';
			
		var tabStorage = document.createElement('DIV');
			tabStorage.innerHTML = output;
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
           
		output += '</table>';
    	
		tabOther.innerHTML = output;
		
				
		handler.getStorageManager().wrap = tabStorage;
		handler.getStorageManager().showDBManager();
		
        KellyTools.getElementByClass(favContent, 'kellyTweaksSave').onclick = function() {
            handler.updateTweaksConfig();
            return false;
        }
        
        displayFavouritesBlock('tweak');
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
                var category = getCategoryById(fav.items[index].categoryId[b]);
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
        
        var filter = getCategoryById(filterId);
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
		
		var tooltipEl = getTooltip();
			tooltipEl.updateCfg({
				target : target, 
				offset : {left : 0, top : 0}, 
				positionY : 'bottom',
				positionX : 'left',				
				ptypeX : 'inside',
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
	
	// noClear - add to show list (on move to next page for example)
	
    this.updateImagesBlock = function(print, noClear) {
        
        if (imagesBlock) {
        
            // clear elements
            if (!noClear) {
                while (imagesBlock.firstChild) {
                    imagesBlock.removeChild(imagesBlock.firstChild);
                }
            }
            
        } else {
            imagesBlock = document.createElement('div');
        }
        
        displayedItems = []; // все элементы попавшие в выборку
		var galleryImages = []; // только элементы для которых присутствуют изображения
		var galleryImagesData = []; // ссылки на элементы fav.items к которым относится каждый элемент галереи
        
		// applay filters 
		
        for (var i = fav.coptions.newFirst ? fav.items.length-1 : 0; fav.coptions.newFirst ? i > 0 : i < fav.items.length; fav.coptions.newFirst ? i-- : i++) {
                               
            if (excludeFavPosts && !fav.items[i].commentLink) continue;
            if (excludeFavComments && fav.items[i].commentLink) continue;
            
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
        
        var startItem = (page - 1) * fav.coptions.grid.perPage;
        var end = startItem + fav.coptions.grid.perPage - 1;         
        if (end > displayedItems.length-1) end = displayedItems.length-1;
        
        log('show start : ' + startItem + ' | end : ' + end + ' | total : ' + displayedItems.length);
   
        for (var i = 0; i <= displayedItems.length-1; i++) {
        
            var item = fav.items[displayedItems[i]];
			var previewImage = getPreviewImageByItem(item);
            
            // whole gallery images array for current selector
            
			if (previewImage) {
			
				var galleryIndex = galleryImages.length;
				
				galleryImages[galleryIndex] = previewImage;
				galleryImagesData[galleryIndex] = item;
			}
			
            // current page displayed images
            
            if (i < startItem || i > end) continue;
            
            var index = displayedItems[i]; // fav.items[index]
               
            var itemBlock = document.createElement('div');
                itemBlock.className = env.className + '-FavItem';			
			
            var collectionBtn = false;
            var imageCount = 0;
						
			itemBlock.setAttribute('itemIndex', index);
			
                if (!previewImage) {
                
                    var text = lng.s('Без изображения', 'no_image');
                    if (item.name) text = item.name + '<br>' + text;
                    if (item.text) text = item.text + '<br>' + text;
					                      
					var size = Math.ceil(text.length / 100) * 50;
					
					//itemBlock.setAttribute('data-width', size);
					
                    itemBlock.innerHTML = '<div style="' + fav.coptions.grid.cssItem + '" class="' + env.className + '-preview" data-width="'+size+'" itemIndex="' + index + '"><div class="' + env.className + '-preview-text">' + text + '</div></div>';
					
                } else {
					
					var pInfo = '';
					if (item.pw) {
						pInfo = ' data-width="' + item.pw + '" data-height="' + item.ph + '" ';
					}
					
					
					//if (item.pw) {
					//	itemBlock.setAttribute('data-width', item.pw);
					//	itemBlock.setAttribute('data-height', item.ph);
					//}
					
                    imageCount = 1;
                    
					if (typeof item.pImage !== 'string') imageCount = item.pImage.length;
                    
                    var additionAtributes = '';
					
					// multi image list
                    if (imageCount > 1) {
                    
                        additionAtributes = 'data-images="' + imageCount + '"';
                        
                        // todo button to explode collection 
                        
                        collectionBtn = document.createElement('a');
                        collectionBtn.innerHTML = imageCount;
                        collectionBtn.href = item.pImage[0];
                        collectionBtn.className = 'kellyFavListItem-collection';
                        
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
					
                    itemBlock.innerHTML = '<img style="' + fav.coptions.grid.cssItem + '" class="' + env.className + '-preview" ' + pInfo + 'itemIndex="' + index + '" ' + additionAtributes + ' kellyGalleryIndex="' + galleryIndex + '" kellyGallery="fav-images" src="' + previewImage + '">';
                
                }
                                    
            var postLink = document.createElement('a');
                postLink.href = item.link;
				postLink.className = 'kellyFavListItem-overlay-button';
                postLink.innerHTML = lng.s('Показать пост', 'go_to_publication'); 
                postLink.setAttribute('target', '_blank');
			
			var postHd = false;
			
			if (imageCount > 0) {
			
				postHd = document.createElement('a');
                postHd.href = '#';
				postHd.className = 'kellyFavListItem-overlay-button kellyFavListItem-overlay-button-bottom';
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
                itemBlockAdditions.className = 'kellyFavListItem-additions';
                
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
				if (getTooltip().isChild(related)) return;
					
				getTooltip().show(false);
            }  
                
            itemBlock.appendChild(postLink);
			if (postHd) itemBlock.appendChild(postHd);
            
            
            imagesBlock.appendChild(itemBlock);
        }
        
        // init gallery only for current page
        // create gallery, by array
        imgViewer.addToGallery(galleryImages, 'fav-images', galleryImagesData);
        
        // connect events to current image elements
        var galleryEl = imagesBlock.getElementsByTagName('img');
        
        for (var i = 0, l = galleryEl.length; i < l; i++)  {
            galleryEl[i].onclick = function() {
                imgViewer.loadImage(this);
                return false;
            }
        }	
        
        if (!print) {
            updatePagination(document.getElementById(env.className + '-pagination'));
        }
        
        return imagesBlock;
    }
	  
    // autoloading next page on scroll if close to bottom
    
    this.checkLoadNextFavPage = function() {
        
        if (imageGrid.isWaitLoad() !== false) return;
        
       // favContent.appendChild(imagesBlock);
        var favPos = KellyTools.getOffset(favContent);
		var offsetY = 200;
		var blockBottom = favPos.bottom - offsetY;
        
		if (blockBottom < (KellyTools.getViewport().scrollBottom + offsetY)) {
            console.log('load')
            handler.goToFavPage('next', true);
        }
        
    }
		
	function getSelectedPostMediaControlls() {

			var controlls = document.createElement('DIV');
			
			var img = '';
			
			if (selectedImages.length > 1) {
				img += lng.s('Основное изображение', 'image_main') + ' <a href="#" class="kellyPreviewImage-del">' + lng.s('Удалить', 'delete')  + '</a><a href="#" class="kellyPreviewImage-prev">\
						' + lng.s('Предыдущее', 'prev') + '</a><a href="#" class="kellyPreviewImage-next">' + lng.s('Следующее', 'next')  + '</a><br>';
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
				
				console.log('get width and height for ' + this.src);
				console.log(dimensions);
				
				env.updateModalBlockPosition(); 
				/*handler.saveWH(this, false);*/ 
				return false; 
			}
		
		return controlls;
	}
				
    function itemGenerateFileName(index) {
    
        // todo take fav.items[index].link - postId as name, to get unique index always constant
        var name = index + '';
        if (fav.items[index].categoryId) {
        
            var headCat = fav.items[index].categoryId[0]; // todo set by manualy or detect by "importance" 
            
            if (catFilters && catFilters.length) {
                headCat = catFilters[0];
            }
            
            limitCatlist = fav.items[index].categoryId.length ;
            
            if (limitCatlist > 5) {
                var limitCatlist = 5;
            }
        
            for (var b = 0; b < limitCatlist; b++) {
                name += '_' + getCategoryById(fav.items[index].categoryId[b]).name;
            }
            
            name = getCategoryById(headCat).name + '/' + name;
        }
        
        return name;
    }
        
    this.showDownloadManager = function(response) {
      
        if (!favContent) return false;
      
        var managerContainer = KellyTools.getElementByClass(favContent, 'kellyFavDownloadManager');
        if (!managerContainer) return false;
      
        if (!downloadManager) {
            
            downloadManager = new KellyGrabber();
        }
        
        downloadManager.setContainer(managerContainer);        
        downloadManager.clearDownloads();
        
        var fullSize = false;
        
        for (var i = 0; i <= displayedItems.length-1; i++) {
        
            var item = fav.items[displayedItems[i]];
            if (!item.pImage) continue;   
                
            var fname = itemGenerateFileName(displayedItems[i]);            
            
            if (typeof item.pImage !== 'string') {
            
                for (var b = 0; b <= item.pImage.length-1; b++) {
                    
                    downloadManager.addFile(fname + '_' + b, env.getImageDownloadLink(item.pImage[b], fullSize));
                }
                
            } else {
            
                downloadManager.addFile(fname,  env.getImageDownloadLink(item.pImage, fullSize));
            }
        }  
            
        downloadManager.showGrabManager();
        
        //KellyTools.createAndDownloadFile('test', 'test.txt');
    }
    
	function showCategoryCreateTooltip(target) {
		
		var tooltipEl = getTooltip();
			tooltipEl.updateCfg({
				target : target, 
				offset : {left : 0, top : 0}, 
				positionY : 'bottom',
				positionX : 'left',
				ptypeX : 'inside',
			});
		
		html = '\
			<div class="' + env.className + 'CatAddForm">\
				<div>\
					<input type="text" placeholder="' + lng.s('Название новой категории', 'cat_name') + '" value="" class="' + env.className + 'CatName"><br>\
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
		
		var tooltipEl = getTooltip();
			tooltipEl.updateCfg({
				target : target, 
				offset : {left : 0, top : 0}, 
				positionY : 'bottom',
				positionX : 'left',
				ptypeX : 'inside',
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
			<br><input class="' + baseClass + '-newname" id="kelly-filter-newname-' + i + '" type="text" value="' + fav.categories[i].name + '" placeholder="' + lng.s('Новое название', 'new_name') + '">\
			<br><a class="' + baseClass + '-newname-button" itemIndex="' + i + '" href="#">' + lng.s('Изменить', 'change') + '</a>\
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
					
				}
				
				var result = handler.categoryEdit(editCat, itemIndex);
				if (!result) return false;
				
				document.getElementById('kelly-filter-selector-' + itemIndex).innerHTML = result.name;
				return false;
			}

		if (!fav.categories[i].protect) {
			var deleteButton = KellyTools.getElementByClass(container, baseClass + '-delete-button');
				deleteButton.onclick = function () {
					
					var itemIndex = parseInt(this.getAttribute('itemIndex'));                        
					if (!itemIndex) return false;
					
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
				if (getTooltip().isChild(related)) return;
				
				getTooltip().show(false);
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
					handler.toogleFilter(this); 
					
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
				if (getTooltip().isChild(related)) return;
				
				getTooltip().show(false);
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
        
		handler.showModalMessage(false);
        controllsContainer.innerHTML = '';
                
		if (!document.getElementById(env.className + '-mainCss')) {
			
			favContent.innerHTML = lng.s('Ошибка инициализации таблиц оформления', 'init_css_error');
			displayFavouritesBlock('fav');
			return;
		}
		
        favContent.innerHTML = '<div class="kellyFavDownloadManager"></div>';
		
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
		
            
        var download = editButton.cloneNode();
            download.className = env.className + '-FavEditButton-download';
            download.innerHTML = lng.s('Менеджер загрузок', 'download_manager');
            
            download.onclick = function () {
                
                handler.showDownloadManager();
                return false;
            }
			
		var resetButton = editButton.cloneNode();
			resetButton.innerHTML = 'Сбросить';
			resetButton.onclick = function() {
			
				page = 1;
				catFilters = [];
				catIgnoreFilters = [];
				handler.showFavouriteImages();
				
				return false;
				
			}
			
			resetButton.className = env.className + '-FavEditButton-reset';
        
        var filterComments = editButton.cloneNode();
            filterComments.className = env.className + '-FavFilter';
            filterComments.innerHTML = lng.s('Комменты', 'comments');
           
        var filterPosts = filterComments.cloneNode();
            filterPosts.innerHTML = lng.s('Публикации', 'items');          
        
            if (!excludeFavPosts) filterPosts.className += ' active';
            if (!excludeFavComments) filterComments.className += ' active';
            
        filterComments.onclick = function() {
            
			page = 1;
			
			if (!excludeFavComments) {
				this.className = this.className.replace('active', '');
				excludeFavComments = true;
				
			} else {
				 this.className += ' active';
				 excludeFavComments = false;
			}
			
			handler.updateImagesBlock();
			handler.updateImageGrid();
			
            return false;
            
        }
            
        filterPosts.onclick = function() {
                
			page = 1;
			
			if (!excludeFavPosts) {
				this.className = this.className.replace('active', '');
				excludeFavPosts = true;
				
			} else {
				 this.className += ' active';
				 excludeFavPosts = false;
			}        
			
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

				if (logic == 'or') {
					logic = 'and';
					this.innerHTML = lng.s('Логика И', 'logic_and');
					
				} else {
					logic = 'or';
					this.innerHTML = lng.s('Логика ИЛИ', 'logic_or');
				}
				
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
  
				if (fav.coptions.animateGif) {
					fav.coptions.animateGif = false;
					this.innerHTML = '- ' + lng.s('Анимация GIF', 'animate_gifs');
				} else {
					fav.coptions.animateGif = true;
					this.innerHTML = '+ ' + lng.s('Анимация GIF', 'animate_gifs');
				}
			
				handler.save('cfg');
				
				handler.updateImagesBlock();
				handler.updateImageGrid();
                return false;
            }
			
        var nsfw = logicButton.cloneNode();		
            nsfw.className = env.className + '-FavFilter';
            if (fav.coptions.ignoreNSFW) nsfw.innerHTML = '- NSFW';
            else nsfw.innerHTML = '+ NSFW';
			
            nsfw.onclick = function () {
  
				if (fav.coptions.ignoreNSFW) {
					fav.coptions.ignoreNSFW = false;
					this.innerHTML = '+ NSFW';
				} else {
					fav.coptions.ignoreNSFW = true;
					this.innerHTML = '- NSFW';
				}
				
				handler.save('cfg');
			
				handler.showFavouriteImages();
                return false;
            }
			
        var additionButtons = document.createElement('div');
            additionButtons.className = env.className + '-filters-AdditionButtons';
		    additionButtons.appendChild(resetButton);
            additionButtons.appendChild(editButton);
            additionButtons.appendChild(download);
            
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
        
        handler.updateImagesBlock();
                    
        favContent.appendChild(imagesBlock);
        handler.showModal(true);
        
        displayFavouritesBlock('fav');
        handler.updateImageGrid();
        
        return false;
    }
    
    this.closeModal = function() {
        modalBox.style.display = 'none';
        modalBox.className = modalBox.className.replace( env.className + '-ModalBox-active',  env.className + '-ModalBox-hidden');
		
        var sideBar = document.getElementById(env.sideBar);
        if (sideBar) {
            sideBar.style.visibility = 'visible';
            sideBar.style.opacity = '1';
        }
    }
    
	this.showModalMessage = function(message, error) {
		
		modalBoxMessage.className = env.className + '-ModalBox-message ' + env.className + '-ModalBox-message-' + (message ? 'active' : 'hidden');
		
		if (!message) {
			modalBoxMessage.innerHTML = '';
		} else {
			
			modalBoxMessage.innerHTML = message;
			if (error) modalBoxMessage.className += ' ' + env.className + '-ModalBox-message-error';
		}
	}
	
	this.getModal = function() {
		return modalBox;
	}
	
    this.showModal = function(hideHeader, onClose) {
	
        modalBox.style.display = 'block';
		modalBox.className = modalBox.className.replace( env.className + '-ModalBox-hidden',  env.className + '-ModalBox-active');
        
        var header = KellyTools.getElementByClass(modalBox, env.className + '-ModalBox-header');
          
		var modalBoxBtnClose = KellyTools.getElementByClass(modalBox, env.className + '-ModalBox-close');
			modalBoxBtnClose.onclick = function() { 
			
				if (onClose) {
					onClose(); 
				} else {
					handler.closeModal();
				}
				
				return false; 
			};
        
        if (hideHeader) {
            header.style.display = 'none';
          
        } else {
            header.style.display = 'block';
        }
    
		var sideBar = document.getElementById(env.sideBar);		
		if (sideBar) {	
			sideBar.style.visibility = 'hidden';
			sideBar.style.opacity = '0'; 
		}
		
        env.updateModalBlockPosition();
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
		
		getTooltip().show(false);
		
		handler.showModalMessage(false);
        
        var html = '<p>' + lng.s('Подтвердите удаление', 'delete_confirm') + '</p>';
			html += '<p><label><input type="checkbox" name="removeImages" class="' + env.className + 'RemoveImages">' + lng.s('Удалить все связанные изображения', 'delete_rcat_items')  +  '</label></p>'
            html += '<p><a href="#" class="' + env.className + 'Remove">' + lng.s('Удалить', 'delete')  +  '</a>';
            html += '<a href="#" class="' + env.className + 'Cancel">' + lng.s('Отменить', 'cancel')  +  '</a></p>';       
        
        modalBoxContent.innerHTML = '<div class="' +  env.className + '-removeDialog">' + html + '</div>';
        
		var removeButton = KellyTools.getElementByClass(modalBoxContent, env.className + 'Remove');
		var removeApplyButton = KellyTools.getElementByClass(modalBoxContent, env.className + 'Apply');

	
		var onCancelCommon = function() {

			if (onCancel) {
				onCancel();
			} else {
				handler.closeModal();  
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
				handler.closeModal();  
			} 
			
			return false; 
		}
        
        handler.showModal(false, onCancelCommon);
        env.updateModalBlockPosition();
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
        
		handler.showModalMessage(false);
        
        var html = '<p>Подтвердите удаление</p>';
            html += '<p><a href="#" class="' + env.className + 'Remove">' + lng.s('Удалить', 'delete')  +  '</a><a href="#" class="' + env.className + 'Apply">' + lng.s('Применить изменения', 'apply')  +  '</a>';
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
				handler.closeModal();  
			} 
			
			return false; 
		}
		 
		var onCancelCommon = function() {

			if (onCancel) {
				onCancel();
			} else {
				handler.closeModal();  
			} 
			
			return false; 
		}
		
		KellyTools.getElementByClass(modalBoxContent, env.className + 'Cancel').onclick = onCancelCommon;
		
        removeButton.onclick = function() { 
			
			handler.itemRemove(itemIndex);  
						
			if (onRemove) {
				onRemove();
			} else {
				handler.closeModal();  
			} 
			
			return false; 
		}
        
        handler.showModal(false, onCancelCommon);
        env.updateModalBlockPosition();
        return false;
    }
    
    this.showAddToFavDialog = function(postBlock, comment) {
        
        if (!postBlock) return false;
        
        handler.showModalMessage(false);
        
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
       
        // autoselect gif
        var gifCategory = getCategoryBy('GIF', 'name');
        var containGif = false;
        
        if (gifCategory.id !== -1) {            
            for (var i = 0; i < selectedImages.length; i++) {     
                if (selectedImages[i].indexOf('.gif') != -1) {
                    containGif = true;
                    break;
                }
            }
            
            
            var selectedGifCat = fav.selected_cats_ids.indexOf(gifCategory.id);
                        
            if (containGif && selectedGifCat == -1) {
                fav.selected_cats_ids.push(gifCategory.id);
            } else if (!containGif && selectedGifCat != -1) {                
                fav.selected_cats_ids.splice(selectedGifCat, 1);
            }           
        }
        
        handler.showModal();
        		
        var catsHTML = '<option value="-1">' +lng.s('Без категории', 'cat_no_cat') + '</option>';
        
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
                if (getCategoryById(fav.selected_cats_ids[i]).id == -1) {
                    continue;
                } 
                
                list.appendChild(createCatExcludeButton(fav.selected_cats_ids[i]));
            }
            
        }            
        
        env.updateModalBlockPosition();
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
        
        if (fav.select_native_tags) {
        
            postItem.nativeTags = [];
        
            if (!fav.native_tags) fav.native_tags = [];
            var nativeTags = KellyTools.getElementByClass(selectedPost, 'taglist');
            if (nativeTags) {
            
                var nativeTags = nativeTags.getElementsByTagName('A');
                
                if (nativeTags && nativeTags.length) {
                
                    var limitTags = 5;
                    if (nativeTags.length < limitTags) limitTags = nativeTags.length; // тегов все равно много, нужно продумать ассоциации или делать список тегов которые учитывать
                
                    for (var i = 0; i < limitTags; i++) {
                                                             
                        var tagName = nativeTags[i].innerHTML.trim();
                        if (!tagName) continue;
                        
                        var tagInfo = getNativeTagByName(tagName);
                        if (!tagInfo) {
                        
                            fav.ids++;
                            tagInfo = {name : tagName, id : fav.ids};
                            
                            fav.native_tags[fav.native_tags.length] = tagInfo;
                        }
                        
                        postItem.nativeTags[postItem.nativeTags.length] = tagInfo.id;  
                        
                    }    
                }
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
            
            if (noSave) handler.showModalMessage(lng.s('Публикация не имеет ссылки', 'item_bad_url'), true);
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
				handler.showModalMessage(lng.s('Избранная публикация обновлена', 'item_upd'));
                handler.save('items');
                return false;
            }
        }
        		
		fav.ids++;		
		postItem.id = fav.ids; 

		handler.showModalMessage(lng.s('Публикация добавлена в избранное', 'item_added'));
				
        fav.items[fav.items.length] = postItem;
        handler.updateFavCounter();
        	
        selectedComment ? formatComments(selectedPost) : formatPostContainer(selectedPost);
		
        console.log(postItem);
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
        
        console.log(fav.selected_cats_ids);
        handler.save('cfg');
        
    }
    
    function createCatExcludeButton(catId) {
        
        var category = getCategoryById(catId);
        
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
            
            if (data.name && data.name.length && getCategoryBy(data.name, 'name').id == -1) {
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
        
        if (edited) {
        
            handler.save('items');
            return fav.categories[index];
            
        } else return false;
        
    }

    this.getGlobal = function(name) {
		if (name == 'debug') return debug;	
		if (name == 'env' || name == 'env') return env;		
		if (name == 'fav') return fav;
    }
    
    // add category to list of categories of selected item
    
    this.categoryAdd = function() {
    
        var list = KellyTools.getElementByClass(modalBoxContent, env.className + 'CatAddToPostList');
        if (!list) return false;
        
        var catSelect = KellyTools.getElementByClass(modalBoxContent, env.className + 'Cat');       
        var newCatId = parseInt(catSelect.options[catSelect.selectedIndex].value);
                
        if (fav.selected_cats_ids.indexOf(newCatId) !== -1) return false;
        
        if (getCategoryById(newCatId).id == -1) return false;
        
        fav.selected_cats_ids[fav.selected_cats_ids.length] = parseInt(newCatId);
        
        list.appendChild(createCatExcludeButton(newCatId));
        
        handler.save('cfg');
    }
    
    this.categoryCreate = function(container) {
        
		if (!container) {
			container = modalBox;
		}
		
        if (!container) return false;
        
        var name = KellyTools.getElementByClass(container, env.className + 'CatName').value;
        name = name.trim();
                
        var catIsNSFW = KellyTools.getElementByClass(container, env.className + 'CatIsNSFW');
        if (catIsNSFW && catIsNSFW.checked) catIsNSFW = true;
        else catIsNSFW = false;
        
        if (!name) {
			handler.showModalMessage( lng.s('Введите название категории', 'cat_error_name'), true);
            return false;
        }
        
        for (var i = 0; i < fav.categories.length; i++) {
            if (fav.categories[i].name == name) {
               handler.showModalMessage(lng.s('Категория с указаным именем уже существует', 'cat_error_name_exist'), true);
               return false;            
            }
        }
        
        fav.ids++;
        
        fav.categories[fav.categories.length] = { name : name, id : fav.ids, nsfw : catIsNSFW};
        
        var option = document.createElement("option");
            option.text = name;
            option.value = fav.ids;
        
        var catSelect = KellyTools.getElementByClass(container, 'kellyJRFavCat');
		if (catSelect) {
			catSelect.add(option);
			catSelect.selectedIndex = catSelect.options.length-1;
		}
		
        handler.showModalMessage(lng.s('Категория добавлена', 'cat_add_success'));
        handler.save('items');
		
		return true;
    }
    
    
    this.onDownloadNativeFavPagesEnd = function() {
	
        var downloadBtn = KellyTools.getElementByClass(document, 'kelly-DownloadFav');
        if (downloadBtn) downloadBtn.innerHTML = lng.s('Скачать', 'download');	
			
        if (!favNativeParser || !favNativeParser.collectedData.items.length) return false;
                    
		// скачивать только в json файл, потом через менеджер уже на свое усмотрение объединять

            
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
		var logEl = KellyTools.getElementByClass(document, env.className + '-download-log');
		var logNum = parseInt(logEl.getAttribute('data-lines'));
		if (!logNum) logNum = 0;
		
		if (logNum > 1000) {
			logEl.innerHTML = '';
		}
		
        KellyTools.getElementByClass(document, env.className + '-download-process').innerHTML = lng.s('Страниц в очереди __PAGESN__', 'download_pages_left', {PAGESN : jobsLength});
		
		var skipEmpty = KellyTools.getElementByClass(document, env.className + '-skip-empty');
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
            fav.select_native_tags = false; // слишком много тегов, продумать возможные исключения, пока не учитывать
            
        for (var i = 0; i < posts.length; i++) {
        
            selectedComment = false;
            selectedPost = posts[i];
			
            handler.setSelectionInfo(false);
			
            selectedImages = env.getAllMedia(posts[i]);
            
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
		
        favNativeParser.collectedData = {
			ids : 100,
			categories : [
				{id : 1, name : 'GIF', protect : true},
				{id : 2, name : 'NSFW', nsfw : true, protect : true},
			],
			items : [],
		};
		
        var pages = KellyTools.getElementByClass(document, 'kelly-PageArray'); 
		var pagesList = [];
		
		var message = KellyTools.getElementByClass(document, env.className + '-download-process');
		
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
		
		var showLogButton = KellyTools.getElementByClass(document, env.className + '-download-show-log');
			showLogButton.style.display = 'inline-block';
			
			showLogButton.onclick = function() {
				var log = KellyTools.getElementByClass(document, env.className + '-download-log-container');
				
				if (log.style.display == 'none') {
					log.style.display = 'block';
				} else {
					log.style.display = 'none';
				}
				
				return false;
			}
		
		var saveFavItemsButton = KellyTools.getElementByClass(document, 'kelly-Save');
			saveFavItemsButton.style.display = 'none';
            

		var logEl = KellyTools.getElementByClass(document, env.className + '-download-log');
			logEl.innerHTML = '[' + KellyTools.getTime() + '] Инициализация...' + "<br>";
			
        el.innerHTML = 'Загрузка... (Отменить)';  
		
        favNativeParser.exec();
    }
    
    this.showNativeFavoritePageInfo = function() {
    
        var favPageInfo = env.getFavPageInfo();
        
        //todo 
		// скачать таблицей csv
        
        if (favPageInfo && favPageInfo.items) {
        
            var saveBlock = '<div class="kelly-Save" style="display : none;"><a href="#" class="kelly-SaveFavNew" >Скачать список элементов</a></div>';
            
            var items = favPageInfo.items;
            if (favPageInfo.pages > 2) { 
                items = '~' + items;
            }
            
			// для текстовый публикаций делать заголовок через метод setSelectionInfo
			
            favPageInfo.container.innerHTML = '\
			<div class="' + env.className + '-download-container">\
				 <h2>' +  lng.s('Сделать локальную копию', 'download_title') + '</h2>\
				 ' +  lng.s('Страниц', 'pages') + ' : ' + favPageInfo.pages + ' (' + items + ')<br>\
				 ' +  lng.s('Укажите список страниц выборки, которые необходимо скачать. Например 2, 4, 66-99, 44, 78, 8-9, 29-77 и т.п.,', 'download_example') + '<br>\
				 ' +  lng.s('Если нужно захватить все страницы оставьте не заполненным', 'download_tip') + '<br>\
				 <input class="kelly-PageArray" type="text" placeholder="Страницы" value=""><br>\
				 <label><input type="checkbox" class="' + env.className + '-skip-empty"> ' +  lng.s('Пропускать публикации не имеющие медиа данных (текст, заблокировано цензурой)', 'download_skip_empty') + '</label>\
				 <br><a href="#" class="kelly-DownloadFav">' + lng.s('Запустить скачивание страниц', 'download_start') + '</a>\
				 <a href="#" class="' + env.className + '-download-show-log" style="display : none;">' + lng.s('Показать лог', 'download_log') + '</a>\
				 ' + saveBlock + '\
				 <div class="' + env.className + '-download-process"></div>\
				 <div class="' + env.className + '-download-log-container" style="display : none;">\
					<div class="' + env.className + '-download-log"></div>\
				 </div>\
			</div>\
			';
								
            
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
                
				if (getTooltip().isShown() == 'categoryEdit') return;
				
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

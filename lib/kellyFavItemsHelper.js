// ==UserScript==
// @encoding utf-8
// @include http://joyreactor.cc/*
// @include http://*.joyreactor.cc/*
// @name           KellyFavItemsHelper
// @namespace      Kelly
// @description    useful script
// ==/UserScript==

// todo удаление тега без удаления изображений

// драйвер для тамблера
// в блоке добавления в избранное категории не удаляются после добавления в избранное один раз
// после декодирования урлов нет единого формата в массиве \ строки сравнивать сложнее
// удаленное хранилище. на основе уже используемых методов, реализовать api для коннекта по json и выполнения соотвтествующих запросов на удаленный сервер данных (теги - категории общие - картинки принадлежат определенному ресурсу в бд)
// при добавлении записей на удаленный сервер будет возможность добавления с кешем (картинка доступная отдельно от реактора или другого ресурса с которого она стащена) потом кеш можно будет скачать

// скрывать посты по нику
// БАГ
// при добавлении последовательно нескольких картинок из ленты - теги берутся везде из последней и дублируются в другие картинки из последних - проверить более детально [ok]
// так же наблюдается в самой галереи для сохраненных картинок
// если исключить тег у какого-то элемента и удалить другой элемент, то сетка изображений поедет 
// нельзя исключить из списка удаленную категория
// если в посте и гифка и изображения то подцепляет то что первым

// ToDo
// [-] низкий приоритет
// проверять при сохранении кол-во сохраненных килобайт т.к. может закончится место и тогда массив может повредится
// Важное до релиза
// хранить id для изображений чтобы были постоянные уникальные имена (сейчас по ключу)
// стопорить проигрывание гифок (всегда показывать превьюшку, при клике на доп кнопку play проигрывать)
// многоуровневые категории (при клике на родителя - всплывашка с детьми)
// импорт обычного избранного - доделать сбор тегов (учитывать только первые N), подсчитывать самые часто встречающиеся и создавать из них категории; сохранение в отдельное хранилище, докачивание странииц и выбор с какой начинать
// хранилище картинок - хранить вместе с категориями для совместимости и переносимости, возможность заменить \ склеить массивы данных
// скачивание \ загузка хранилища через файл
// хранилище в фоновом расширении
// стандартизация блока оформления
// высота элементов сетки
// вывод тайлов через отдельный класс
// 
// хранилище в фоне

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
// драйвер - вынести css стили и окружение в него

// SCHEMA
// JSON.parse(document.getElementById('postContainer3612319').getElementsByTagName('script')[0].textContent.trim()).image


function KellyFavItemsHelper() 
{
    var PROGNAME = 'KellyFavItemsHelper v0.94';
    
    // site profile
    
    // default storage names
	
    var storage = { config : 'kelly_jr_helper', db : 'kelly_jr_helper_db'};
    
    // default profile, move to separate file in future
	
    var environment = {
    
        // todo, add css - tilegrid, base, grabber
		// getAllMedia, getImageDownloadLink
		
        className : 'kellyJRFav', 
        profile : 'joyreactor',
        mainDomain : 'joyreactor.cc',
        mainIframeSrc : 'http://joyreactor.cc/about?kellyHelperMode=getLocalStorage', // to get local storage if web site use several subdomains
        mainContentContainer : 'contentinner',
        mainContainer : 'container',
		sideBar : 'sidebar',
		publication : 'postContainer',
		
		isNSFW : function() {
			var sfw = KellyTools.getElementByClass(document, 'sswither');
			if (sfw && sfw.className.indexOf('active') != -1) return false;
			else return true;
		},
		
		getPostLink : function(publication) {
			
			if (window.location.host.indexOf('old.') == -1) {

				var link = KellyTools.getElementByClass(publication, 'link_wr');
				if (link) return getChildByTag(link, 'a');
			} else {
				return publication.querySelector('[title="ссылка на пост"]');
			}			
		
		},
		
		getCommentLink : function(comment) {
			
			if (!comment) return '#';
			
			var links = comment.getElementsByTagName('a');
            
            for (var b = 0; b < links.length; b++) {
                if (links[b].href.indexOf('#comment') != -1) {
                    return links[b].href;                    
                }
            }
			
			return '#';
		},
		
		updateModalBlockPosition : function() {
		
			if (!modalBox || modalBox.className.indexOf('hidden') !== -1) return false;
        
			var sideBar = document.getElementById(env.sideBar);
			var minTop = 0;
			
			if (sideBar) {
				minTop = sideBar.getBoundingClientRect().top;
			}
			
			// screen.height / 2  - (modalBox.getBoundingClientRect().height / 2) - 24
			var modalBoxTop = 24;
			
			if (modalBoxTop < minTop) modalBoxTop = minTop;
			
			var scrollTop = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0);
			
			modalBox.style.top = modalBoxTop + scrollTop  + 'px';
			
			var offsetLeft = 0;
			
			if (window.location.host.indexOf('old.') == -1) {
				offsetLeft = 24;
			}
			
			if (sideBar) {
				modalBox.style.right = 'auto';
				modalBox.style.left = Math.round(sideBar.getBoundingClientRect().left) + 'px';
				modalBox.style.width = Math.round(sideBar.getBoundingClientRect().width) + offsetLeft + 'px';
			}		
		}
    }
    
    var env = environment;
    
    var mainIframe = false;
    
    var onDomReady = [];
    var events = new Array();
    var handler = this;
    
    var selectedPost = false;
    var selectedImages = false;
    var selectedComment = false;
    var selectedInfo = false; // какие-либо мета данные сохраняемые для определенной публикации в обработчике itemAdd (добавлять методом setSelectionInfo)
    
    var extendCats = []; // выделеные категории для последующего добавления к определенной публикации, в режиме просмотра избранного
    
    var excludeFavPosts = false;
    var excludeFavComments = false;
    
    var logic = 'and';
    
    var init = false;
    
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
	var catAnimateGif = true; // отображать гифки анимироваными
    var catIgnoreFilters = [];
    
    var commentsBlockTimer = [];
    
    var readOnly = true; // todo save this option ? 
    
    // addition classes
    var imgViewer;    
    var favNativeParser = false;
    var downloadManager = false;
    var tooltip = false;
	
    // fav image grid
    
    var imagesBlock = false;
        
    var debug = true;
    
    var page = 1;
    var displayedItems = [];
    
    // локальное хранилище, структура данных поумолчанию
    
    var fav = {       
        items : [], 
        
        selected_cats_ids : [], // последние выбраные категории при добавлении изображения через диалоговое окно (categoryExclude, validateCategories, getCategoryBy)
        categories : [
            {id : 1, name : 'GIF', protect : true},
            {id : 2, name : 'NSFW', nsfw : true, protect : true},
        ],  // категории элементов
               
        select_native_tags : false, // getNativeTagByName     
        native_tags : [],     
        
        storage : storage.db + '0', // текущее хранилище элементов (хранит посты - items, теги - native_tags \ категории - categories ассоциируемые с ними)
        
        ids : 100, // счетчик уникальных идентификаторов
        
        tweaks : {
            hide_sidebar : true,
            autoload_onscroll : true,
            commentsBlacklist : [],
            postsBlacklist : [],
        }
    };
	
	var imageGrid = false;
	
	function initImageGrid() {
		
		// todo тонкая настройка сетки
		// выводить не дожидаясь полной загрузки
		// фиксированое кол-во элементов на строку
		
		// добавить опцию в твики - стиль поумолчанию для элемента сетки, чтобы опция fixed была более полезной при перенастройки пользьвателем
		
		imageGrid = new kellyTileGrid({
		
			tilesBlock : imagesBlock,
			rowHeight : 250,
			tileClass : env.className + '-FavItem',
			hideUnfited : false,
			
			
			rules : {
				dontWait : true,
				fixed : 2,
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
					if (data.error_code == 2 || data.error_code == 3) {
						data.mainElement.setAttribute('data-width', 200);
						data.mainElement.style.display = 'inline-block';
						return {width : 200};
					} else return false;
				},
				getResizableElement : function(self, tile) {
					return tile;
				},
				onGridUpdated : function(self) {
					
					// if fav.tweaks.imagegrid.padding
					var grid = imagesBlock.getElementsByClassName(env.className + '-FavItem-grid-resized');
					
					for (var i = 0; i < grid.length; i++) {
						grid[i].style.boxSizing = 'border-box';
						grid[i].style.padding = '6px';
					}
				
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
        
    function constructor() {    
        var action = getInitAction();
        
        if (action == 'main') {
     
            if (isMainDomain()) {
			
                load();     
                
            } else {            
            
                log('create iframe and request local storage')
            
                mainIframe = document.createElement('iframe');
                
                document.body.appendChild(mainIframe);
                
                mainIframe.src = environment.mainIframeSrc;
                mainIframe.onload = function() {
                    
                   // dont need do anything, child send to parent an message with method getLocalStorage after load by itself
                   
                }                

                mainIframe.style.width = '1px;';
                mainIframe.style.height = '1px';     
            }
                           
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
        
            handler.addEventListner(window, "message", function (e) {
                handler.getMessage(e);
            }, 'input_message_');
        
            
        } else if (action == 'getLocalStorage') {
        
            load();
            var output = { method : 'getLocalStorage', error : false, fav : fav, notice : ''};
            window.parent.postMessage(output, "*");
            
            handler.addEventListner(window, "message", function (e) {
                handler.getMessage(e);
            }, 'input_message_');
            
        } else if (action == 'disable') {
        
        } else if (action == 'sanitize') {
            // режим отображения при быстрой загрузке контента в несколько iframeов
            cleanNative();
            window.parent.postMessage({method : 'speedUpOnLoad'}, "*"); // потоковый загрузчик детектит страницу как загруженую при отправке любого сообщения
        }
        
        log(PROGNAME + ' init | loaded in ' + action + ' mode');                
    }
    
    function cleanNative() {
        document.getElementsByTagName('HEAD')[0].innerHTML = '';
        var container = document.getElementById('container');
        document.body.innerHTML  = container.innerHTML;
        //window.stop(); - broke onLoad event - may be use messsages
    }
    
    // домен, локальное хранилище которого будет использоваться
    
    function isMainDomain() {
        if (window.location.host == environment.mainDomain) return true;
        else return false;
    }
    
    function getInitAction() { // if page included as Iframe, we use it just to restore local storage data on subdomain, or domain with other name
        var mode = findGetParameter('kellyHelperMode');
        if (!mode) return 'main';
        
        return mode;
    }
	
	function getTooltip() {
		if (!tooltip) {
		
			kellyTooltip.autoloadCss = true;		
			
			tooltip = new kellyTooltip({
			
				positionCenter : false, 
				baseClass : env.className + '-tooltipster', 
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

    // DOM \ Window common tools

    function getParentByTag(el, tagName) {
        var parent = el;
        if (!tagName) return false;
        
        tagName = tagName.toLowerCase();
        
        while (parent && parent.tagName.toLowerCase() != tagName) {
			parent = parent.parentElement;
        }  
        
        return parent;
    }
    
    function findGetParameter(parameterName) {
        var result = null,
            tmp = [];
        location.search
            .substr(1)
            .split("&")
            .forEach(function (item) {
              tmp = item.split("=");
              if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
            });
            
        return result;
    }
	
    // unused
    
    function getExtension(url) {
                 
        url = url.split("?");
        url = url[0];

        var ext = url.substr(url.length - 5).split(".");
        if (ext.length < 2) return '';

        ext = ext[1];
        return ext;        
    }
    
    function getChildByTag(el, tag) {
        if (!el) return false;
        
        var childNodes = el.getElementsByTagName(tag);
        
        if (!childNodes || !childNodes.length) return false;
        
        return childNodes[0];
    }
    
    function getElementByTag(el, tag) {
        return getChildByTag(el, tag);
    }
   
    // viewport functions 
    
    // get element position from top (y), include sroll in pixels
    
    function getOffset(el) { 
        el = el.getBoundingClientRect();
		var scrollTop = getScrollTop();
        return {
            left: el.left + window.scrollX, // notice - scroll left is ignored here
            top: el.top + scrollTop,
			bottom: el.top + scrollTop + el.height,
        }
    }

    function getScrollTop() {
        var scrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
        return scrollTop;
    }
    
    // Get screen width \ height

    function getViewport() {

		var elem = (document.compatMode === "CSS1Compat") ? 
			document.documentElement :
			document.body;

		var height = elem.clientHeight;
		var width = elem.clientWidth;	

        return {
            scrollBottom: getScrollTop() + height, // scroll + viewport height
            screenHeight: height,
			screenWidth: width,
        };
    }
    
    // validate selected categories, remove from selected if some of them not exist
    
    function validateCategories(catList) {
           
        var tmpSelectedCategories = []; 
        
        for (var i = 0; i < catList.length; i++) {
        
            if (getCategoryById(catList[i]).id == -1) {
                log('skip deprecated category ' + catList[i]);
                continue;
            } 
            
            tmpSelectedCategories.push(catList[i]);
        }
               
        return tmpSelectedCategories;
    }
    
    // загрузить настройки и локальное избранное
    
    function load() {
        var tmpFav = KellyTools.parseJSON(localStorage.getItem(storage.config));
        if (tmpFav) fav = tmpFav;
        else log('bad or empty local config ' + storage.config + ', default used')
              
        if (!fav.selected_cats_ids) fav.selected_cats_ids = [];
        if (!fav.tweaks) {
            fav.tweaks = {};
        }
        
        if (!fav.storage) {
            fav.storage = storage.db + '0';
        }
        
        var tmpElements = false;
        if (fav.items && fav.items.length) { // move elements to separate db, old storage format
            log('old format - items will be stored to ' + fav.storage + ' on any save operation');
        } else {
        
            tmpFav = KellyTools.parseJSON(localStorage.getItem(fav.storage));
            if (tmpFav) fav.items = tmpFav;
            else fav.items = [];
            
        }
		
		//fav.items[fav.items.length] = {"categoryId":[6,4,12],"previewImage":"http://img1.joyreactor.cc/pics/post/bad.jpg","name":""};
        
        if (!fav.tweaks.autoload_onscroll) fav.tweaks.autoload_onscroll = false;
        if (!fav.tweaks.commentsBlacklist)  fav.tweaks.commentsBlacklist = [];
        if (!fav.tweaks.postsBlacklist)  fav.tweaks.postsBlacklist = [];
		if (!fav.tweaks.grid)  {
			fav.tweaks.grid = {
				fixed : false,
				rowHeight : 250,
				heightDiff : 10,
				min : 2, 
				cssItem : '',
				perPage : 60,
			};
		}
 
        for (var i = 0; i < fav.selected_cats_ids.length; i++) {
            fav.selected_cats_ids[i] = parseInt(fav.selected_cats_ids[i]);
        }
                    
        
        for (var i = 0; i < fav.items.length; i++) {
            
            if (!fav.items[i].categoryId) fav.items[i].categoryId = [];
        
            for (var b = 0; b < fav.items[i].categoryId.length; b++) {
                fav.items[i].categoryId[b] = parseInt(fav.items[i].categoryId[b]);
            }
        }
        
        fav.selected_cats_ids = validateCategories(fav.selected_cats_ids);
    }
            
    // todo save items separate from config
    
    function save() {
        
        if (!isMainDomain()) {
            
            log('send data to main domain');
            
            mainIframe.postMessage({method : 'updateLocalStorage', fav : fav}, "*");
            
        } else {
            
            log('save data to local storage');
            
            // Storage Name - Json Data
            
            localStorage.setItem(fav.storage, JSON.stringify(fav.items));
                       
            localStorage.setItem(storage.config, JSON.stringify({ 
                categories : fav.categories, 
                selected_cats_ids : fav.selected_cats_ids, 
                storage : fav.storage, 
                ids : fav.ids, 
                tweaks : fav.tweaks
            }));
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
                favCounter.innerHTML = fav.items.length;
                         
                handler.formatPostContainers();
                
                if (mode == 'fav') {
                    handler.hideFavoritesBlock(); 
                    handler.showFavouriteImages();
                }
            }
            
        } else if (e.data.method.indexOf('updateLocalStorage') != -1) {

            if (e.data.fav) fav = e.data.fav;
            save();
            
            log('save data by asking by other domain')
        }
    }
    
    this.goToFavPage = function(newPage, byScroll) {
    
        if (!displayedItems || !displayedItems.length) return false;
                
        var totalPages = Math.ceil(displayedItems.length / fav.tweaks.grid.perPage);
               
        if (!byScroll) byScroll = false;
               
        if (newPage == 'next') page++;
        else if (newPage == 'previuse' || newPage == 'prev' ) page--;
        else {
            page = parseInt(newPage);
        }
        
        if (page < 1) page = 1;
        if (page > totalPages && byScroll) return false;
        if (page > totalPages) page = totalPages;
        
        imageGrid.close();
        
        handler.updateImagesBlock(false, byScroll);
        handler.updateImageGrid();
        
        return true;
    }
    
    function updatePagination(paginationContainer) {
        
        if (!paginationContainer) return false;
        
        paginationContainer.innerHTML = '';
        
        if (!displayedItems.length) return;
        
        var totalPages = Math.ceil(displayedItems.length / fav.tweaks.grid.perPage);

        if (totalPages <= 1) return;
        
        var pageListItemsNum = 4; // maximum number of page buttons
        var pageStart = 1; // rendered button start

        pageStart = page - Math.ceil(pageListItemsNum / 2);       
        if (pageStart < 1) pageStart = 1; 
        
        var pageEnd = pageStart + pageListItemsNum - 1; // rendered button end
        if (pageListItemsNum > totalPages) pageEnd = totalPages;
        
        if (pageEnd <= 1) pageEnd = totalPages;
        if (pageEnd > totalPages) pageEnd = totalPages;
        
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;
        
        var goToFunction = function() {
                handler.goToFavPage(this.getAttribute('pageNum'));
                return false;
            }
        
        var goToPreviuse = document.createElement('a');
            goToPreviuse.href = '#';
            goToPreviuse.setAttribute('pageNum', 'previuse');
            goToPreviuse.innerHTML = '<';
            goToPreviuse.className = 'kellyPagination-item';
            goToPreviuse.onclick = goToFunction;
                 
        if (pageStart > 1) {
            var goToBegin = goToPreviuse.cloneNode(true);
            goToBegin.setAttribute('pageNum', '1');
            goToBegin.onclick = goToFunction;
            goToBegin.innerHTML = '<<';
            
            paginationContainer.appendChild(goToBegin); 
        }
        
		if (pageStart > 1) { 
            paginationContainer.appendChild(goToPreviuse); 
        }
              
			  
        for (var pageNum = pageStart; pageNum <= pageEnd; pageNum++) {
             var pageEl = document.createElement('a');
                 pageEl.href = '#';
                 pageEl.innerHTML = pageNum;
                 pageEl.className = 'kellyPagination-item';
				 if (pageNum >= 100) pageEl.className += ' kellyPagination-item-100';
				 
                 pageEl.setAttribute('pageNum', pageNum);
                 
            if (page == pageNum) pageEl.className += ' active';
                
                pageEl.onclick = goToFunction;                
                paginationContainer.appendChild(pageEl);
        }

        var goToNext = document.createElement('a');
            goToNext.href = '#';
            goToNext.setAttribute('pageNum', 'next');
            goToNext.className = 'kellyPagination-item';
            goToNext.innerHTML = '>';
            goToNext.onclick = goToFunction;
            
        if (pageEnd < totalPages) { 
            paginationContainer.appendChild(goToNext);
        }
        
        if (pageEnd < totalPages) {
            var goToEnd = goToPreviuse.cloneNode(true);
            goToEnd.setAttribute('pageNum', totalPages);            
            goToEnd.onclick = goToFunction;
            goToEnd.innerHTML = '>>';
            
            paginationContainer.appendChild(goToEnd); 
        }
        
        if (totalPages > pageListItemsNum) {
        
            if (page < totalPages - 1) {
                // go to end
            }
            
            if (page > 1) {
                // go to begin
            }
        }
        
        return paginationContainer;
    }

    // for testing purposes, not finished
    this.loadDirectly = function() {
    
        if (document.getElementById(environment.mainContainer)) return;
        
        var a = document.createElement('a');
            a.innerHTML = 'Загрузить KellyFavHelper';
            a.href = "#";
            
        var fav = document.createElement('a');
            fav.innerHTML = 'Избранное';
            fav.href = "#";
            fav.onclick = function () {
                handler.showFavouriteImages();
            }
       
        var mainContainer = document.createElement('div');
            mainContainer.id = environment.mainContainer;
            
        a.onclick = function() {
            handler.initOnPageReady();
        }
        
        document.body.appendChild(a);
        document.body.appendChild(fav);
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
        
        init = true;
        
        var mainContainer = document.getElementById(environment.mainContainer);
        
        // if (!mainContainer) {
        //    if (document.title.indexOf('503 Service') !== -1) {
        //        handler.loadDirectly();
        //    }
        //    return false;
        // }
		
		if (!KellyTools.getBrowser()) return false;
		
		var loadCssResource = function(response) {
			
			// console.log(response.url);
			
			if (!response || response.data === false) {				
				return false;
			}
			
			var cssManifest = "\n\r\n\r\n\r" + '/* ' +  response.url + ' */' + "\n\r\n\r\n\r";
			addCss(cssManifest + KellyTools.replaceAll(response.data, '__BASECLASS__', env.className));
		};
		
		KellyTools.getBrowser().runtime.sendMessage({method: "getCss", item : 'main'}, loadCssResource);
        KellyTools.getBrowser().runtime.sendMessage({method: "getCss", item : env.profile}, loadCssResource);
		
		var modalClass = env.className + '-ModalBox';
		
        modalBox = document.createElement('div');
        modalBox.id = modalClass;
        modalBox.className = modalClass + ' ' + modalClass + '-hidden'; 
        
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
        
        handler.addEventListner(window, "scroll", function (e) {
            env.updateModalBlockPosition();
        }, '_fav_dialog');
        

        // add fav button on top
                
        var favButton = createMainMenuButton('Избранное (Всего : <i>Загружаю данные...</i>)', function() { 
			
				if (mode == 'fav') {
					handler.hideFavoritesBlock();
				} else {					
					handler.showFavouriteImages();
				}
		 
				return false; 
		});
        
        if (favButton) {
            menuButtons['fav'] = favButton.parentNode;
            favCounter = getChildByTag(favButton, 'i');
            if (isMainDomain()) favCounter.innerHTML = fav.items.length;
        }
        
        var tweakButton = createMainMenuButton('Настройки страницы', function() { 

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
        
        siteContent = document.getElementById(environment.mainContentContainer);
        
        if (siteContent) {
        
            favContent = document.createElement('div');
            favContent.className = env.className + '-FavContainer';
            
			var hostClass = window.location.host.split(".").join("_");
			
			favContent.className += ' ' + hostClass; 
			
            siteContent.parentNode.insertBefore(favContent, siteContent);
        } else {
            log('main container inner not found')
        }
        
        return true;
    }
    
    function createMainMenuButton(name, onclick) {
        
        var submenu = document.getElementById('submenu');
        
		if (!submenu) {
			log('bad submenu identifer');
			return false;
		}
		
        var menuButtonTest = getChildByTag(submenu, 'a');
		if (menuButtonTest && menuButtonTest.getAttribute('rel') == 'v:url') {
			submenu = menuButtonTest.parentNode.parentNode;
		}
		
        // todo positioning for post view pages
        
        var menuButtonContainer = document.createElement('div');
            menuButtonContainer.className = 'submenuitem ' + env.className + '-MainMenuItem';
            menuButtonContainer.innerHTML = '<a href="#">nope</a>';
        
        var menuButtonA = getChildByTag(menuButtonContainer, 'a');
        
        if (menuButtonA) {
            menuButtonA.setAttribute('href', '#');
            menuButtonA.innerHTML = name;
            
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
                var a = getElementByTag(nameContainer, 'A');
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
        if (userName && fav.tweaks.postsBlacklist.indexOf(userName) != -1) {
        
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
        
        return {id : -1, name : 'Удаленная категория'};      
    }
    
    function getCategoryById(id) {
        
        id = parseInt(id);
                            
        for (var i = 0; i < fav.categories.length; i++) {
            if (id == fav.categories[i].id) return fav.categories[i];
        }  
        
        return {id : -1, name : 'Удаленная категория'};
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
        
    function getStaticImage(source) {

        if (source.indexOf('reactor') != -1) {
        
            if (source.indexOf('static') !== -1 || source.indexOf('.gif') == -1) return source;
			
			source = source.replace('pics/comment/', 'pics/comment/static/');
            source = source.replace('post/', 'post/static/');
            source = source.replace('.gif', '.jpeg');
        }
        
        return source;
    }
    
    // will replace single image functions in future
    
    function getAllMedia(content) {
        
        var data = [];
        
        if (!content) return data;
        
        if (content.className.indexOf('comment') != -1) {
            content = KellyTools.getElementByClass(content, 'txt');
        } else {
            content = KellyTools.getElementByClass(content, 'post_content');
        }
        
        if (!content) return data;
        
        // censored posts not contain post container and
        // /images/censorship/ru.png
        
        var imagesEl = content.getElementsByClassName('image');
        
        for (var i = 0; i < imagesEl.length; i++) {
            
            if (imagesEl[i].innerHTML.indexOf('gif_source') !== -1) {
                
                // extended gif info for fast get dimensions \ keep gif unloaded until thats needed
                var gif = getChildByTag(imagesEl[i], 'a');
                
                if (gif) {
                    data.push(gif.getAttribute("href"));
                }
                
            } else {
            
                var image = getChildByTag(imagesEl[i], 'img');
                if (image) {
                    data.push(image.getAttribute("src"));
                }     
            }
        }  
        
        return data; //  return decodeURIComponent(url);
    }
    
    function updatePostFavButton(postBlock) {
		
        var link = env.getPostLink(postBlock);
        var inFav = -1;
        
        if (!link) {            
            log('bad postcontainer');
            return false;        
        }
        
        var linkUrl = KellyTools.getRelativeUrl(link.href);
		if (!linkUrl) {
            log('bad postcontainer url');
            return false;  
		}
		
        for (var i = 0; i < fav.items.length; i++) {
            
            // subdomain main differ but relative path always keeps the same
           
            if (KellyTools.getRelativeUrl(fav.items[i].link).indexOf(linkUrl) != -1 && !fav.items[i].commentLink) { // its not comment and post in favourites
                inFav = i;
                break;
            }
        }
    
        var addToFav = KellyTools.getElementByClass(postBlock, env.className + '-FavAdd');
    
        // create if not exist
        
        if (!addToFav) {
            addToFav = document.createElement('a');
            addToFav.className = env.className + '-FavAdd';
            addToFav.href = link.href; // keep same url as main button
            
            link.parentNode.insertBefore(addToFav, link);    
        }
        
        // update title
        
        if (inFav != -1) {
            addToFav.onclick = function() { handler.showRemoveFromFavDialog(inFav); return false; };
            addToFav.innerHTML = 'Удалить из избранного';
        } else {
            addToFav.onclick = function() { handler.showAddToFavDialog(postBlock); return false; };
            addToFav.innerHTML = 'Добавить в избранное';
        }
        
        
        return true;
            
    }	
       
    function formatComments(block) {
    
        var comments = getCommentsList(block);
        if (!comments) return false;
        
        for(var i = 0; i < comments.length; i++) {
        
            var userName = getCommentUserName(comments[i]);
            if (userName && fav.tweaks.commentsBlacklist.indexOf(userName) != -1) { 
                comments[i].style.display = 'none';
                
                continue;
            }
        
			var addToFavButton = comments[i].getElementsByClassName('kelly-add-to-fav');
			
            if (!addToFavButton.length) {
        
				var bottomLinks = comments[i].getElementsByClassName('reply-link');
				if (bottomLinks.length) {
				
					addToFavButton = document.createElement('a');
					addToFavButton.href = '#';
					addToFavButton.innerHTML = 'Добавить в избранное';
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
			var inFav = -1;
			
			if (link != '#') {
				
				for(var b = 0; b < fav.items.length; b++) {
					if (fav.items[b].commentLink && KellyTools.getRelativeUrl(fav.items[b].commentLink).indexOf(link) != -1) {
						inFav = b;
						break;
					}
				}
				
			}
				
			if (inFav != -1) {
				
				addToFavButton.setAttribute('itemIndex', inFav);
				addToFavButton.onclick = function() { handler.showRemoveFromFavDialog(this.getAttribute('itemIndex')); return false; };
				addToFavButton.innerHTML = 'Удалить из избранного';
				
			} else {
			
				addToFavButton.onclick =  function() {						
					handler.showAddToFavDialog(block, document.getElementById(this.getAttribute('commentId')));
					return false;					
				}
				
				addToFavButton.innerHTML = 'Добавить в избранное';
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
				
				console.log('fav item not found ' + favItemIndex);
				// imgElement.setAttribute('error', '1');
				imgElement.style.display = 'none';
				
			} else if (!fav.items[favItemIndex].pw) {
			
				 handler.saveWH(imgElement, favItemIndex);
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
            fav.tweaks.autoload_onscroll = true;
        } else {
            fav.tweaks.autoload_onscroll = false;
        }
        
		fav.tweaks.grid = {
			fixed : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridFixed').value),
			rowHeight : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridRowHeight').value),
			min : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridMin').value), 
			cssItem : KellyTools.getElementByClass(favContent, env.className + 'GridCssItem').value,
			heightDiff : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridHeightDiff').value),
			perPage : parseInt(KellyTools.getElementByClass(favContent, env.className + 'GridPerPage').value),
		};
				
		if (!fav.tweaks.grid.fixed || fav.tweaks.grid.fixed <= 0) fav.tweaks.grid.fixed = false;
		if (!fav.tweaks.grid.rowHeight || fav.tweaks.grid.rowHeight <= 0) fav.tweaks.grid.rowHeight = 250;
		if (!fav.tweaks.grid.min || fav.tweaks.grid.min <= 0) fav.tweaks.grid.min = 2;
		if (!fav.tweaks.grid.heightDiff || fav.tweaks.grid.heightDiff <= 0) fav.tweaks.grid.heightDiff = 10;
		if (!fav.tweaks.grid.perPage || fav.tweaks.grid.perPage <= 0) fav.tweaks.grid.perPage = 60;
		
        fav.tweaks.commentsBlacklist = getVarList(KellyTools.getElementByClass(favContent, 'kellyBlockcomments').value);
        fav.tweaks.postsBlacklist = getVarList(KellyTools.getElementByClass(favContent, 'kellyBlockposts').value);
        
		handler.showTweaksDialog();
        KellyTools.getElementByClass(favContent, 'kellyTweaksMessage').innerHTML = 'Настройки сохранены';
        save();
    }
    
    function getStorageList() {
        
        var tmpCfg = '';
        
        // todo this currently available only for main domain
        
        var storageInfo = [];
        while (tmpCfg = localStorage.getItem(storage.db + storageInfo.length)) {
            storageInfo[storageInfo.length] = tmpCfg;
        }
                  
        return storageInfo;
    }
    
    this.showTweaksDialog = function() {
        
        handler.closeModal();
        
        // показ данных конфига и хранилища картинок отдельно
        // выгрузка стандартного избранного 
        // todo - кол-во элементов на страницу
        
        // currently only one type of storage
        
        var output= '<div>Тип хранения данных : Локальное хранилище</div>';
        
        var storages = getStorageList();
        var storagesTxt = '';
        for (var i=0; i <= storages.length-1; i++){ 
            var lengthKb = storages[i].length / 1000;
            
            storagesTxt += 'storage : "' + storage.db + i + '" size : ' + lengthKb.toFixed(1) + 'кб<br>';
        }
        
        output += '<div>Существующие массивы данных : <br><br>' + storagesTxt + '<br><br></div>';
        output += '<div>Текущее хранилище : <input type="text" class="kellyLocalStorage-name" value="' + fav.storage + '"></div>';
        output += '<div><a href="#" class="kellyShowLocalStorage">Показать массив данных</a><textarea class="kellyLocalStorage" style="height : 400px; width : 100%; display : none;"></textarea></div>';
        output += '<div>Игнорировать комментарии : <input type="text" class="kellyBlockcomments" value="' + varListToStr(fav.tweaks.commentsBlacklist) + '"></div>';
        output += '<div>Игнорировать посты : <input type="text" class="kellyBlockposts" value="' +  varListToStr(fav.tweaks.postsBlacklist) + '"></div>';
                
		output += '<div>Настройки сетки элементов</div>';
		
		
        output += '<div>Максимальная высота одной строки : <input type="text" class="' + env.className + 'GridRowHeight" value="' +  fav.tweaks.grid.rowHeight + '"></div>';
		output += '<div>Допустимая погрешность высоты строки : <input type="text" class="' + env.className + 'GridHeightDiff" value="' +  fav.tweaks.grid.heightDiff + '"></div>';
		output += '<div>Минимальное кол-во элементов в строке : <input type="text" class="' + env.className + 'GridMin" value="' +  fav.tweaks.grid.min + '"></div>';
        output += '<div>Фиксированное кол-во элементов на строку : <input type="text" class="' + env.className + 'GridFixed" value="' +  (!fav.tweaks.grid.fixed ? '' : fav.tweaks.grid.fixed) + '"></div>';
        output += '<div>Стиль по умолчанию для элемента строки : <input type="text" class="' + env.className + 'GridCssItem" value="' +  fav.tweaks.grid.cssItem + '"></div>';
        output += '<div>Элементов на страницу : <input type="text" class="' + env.className + 'GridPerPage" value="' +  fav.tweaks.grid.perPage + '"></div>';
		
		
        var checked = '';
        if (fav.tweaks.autoload_onscroll) {
            checked = 'checked';
        }
        
        output += '<div><label><input type="checkbox" ' + checked +' class="kellyAutoScroll">Автоматическая загрузка следующей страницы при скролле</label></div>'; // todo check displayedImages array
        
        // favContent.innerHTML += '<div>Количество элементов на страницу : <input type="text" value="" class="kellyItemsPerPage">';
        
        output += '<div><a href="#" class="kellyTweaksSave">Сохранить</a></div>';
        output += '<div class="kellyTweaksMessage"></div>';
        
        
        output = '<div class="' + env.className + '-FavContainer-page">' + output + '</div>';
        
        favContent.innerHTML = output;
        
        // todo сохранение замены массива
        KellyTools.getElementByClass(favContent, 'kellyShowLocalStorage').onclick = function() {
            handler.showLocalStorage();
            return false;
        }
        
        KellyTools.getElementByClass(favContent, 'kellyTweaksSave').onclick = function() {
            handler.updateTweaksConfig();
            return false;
        }
        
        displayFavouritesBlock('tweak');
        
        /*
        modalBoxMessage.innerHTML = '';
        
        var checked = '';
        
        if (fav.tweaks.hide_sidebar) checked = 'checked';
        
        modalBoxContent.innerHTML = '<checkbox class="kellyTweakHideSidebar" ' + checked + '> Скрыть боковую панель'; // todo сделать кнопку сразу возле панели
        
        KellyTools.getElementByClass(modalBoxContent, 'kellyTweakHideSidebar').onclick = function() { 
        
            if (this.checked) this.hideSidebar(true);
            else this.hideSidebar(false);
            
        }
        
        handler.showModal();
        */
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
                    removeBtn.innerHTML = 'Удалить';
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
        
        save();
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
        
        save();
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
        if (!item || !item.previewImage) return '';        
        
        if (typeof item.previewImage == 'string') {
            if (item.previewImage.trim() !== '') return getImageDownloadLink(item.previewImage, full);            
        } else {
            if (item.previewImage.length) return getImageDownloadLink(item.previewImage[0], full);
        }
        
        return '';
    }
    
	function showItemInfoTooltip(index, target) {
	
		if (!fav.items[index]) return;
		
		var tooltipEl = getTooltip();
			tooltipEl.updateCfg({
				target : target, 
				offset : {left : 0, top : 0}, 
				position : 'bottom',
			});
			
		var item = fav.items[index];
		
		var baseClass = env.className + '-tooltipster-ItemInfo';
		
		// блок дополнительной информации о публикации со списком категорий
		var itemInfo = document.createElement('div');
			itemInfo.className = baseClass;
			itemInfo.id = baseClass + '-' + index;
			itemInfo.innerHTML = ''; 
			
			if (item.commentLink) {
			
				itemInfo.innerHTML += '<a href="' + item.commentLink + '" target="_blank">Показать комментарий</a><br>'
			
			}
			
		var removeItem = document.createElement('a');
			removeItem.setAttribute('itemIndex', index);		
			removeItem.onclick = function() { 
			
				var updateFavPage = function() { handler.showFavouriteImages(); };
				handler.showRemoveFromFavDialog(this.getAttribute('itemIndex'), false, updateFavPage, updateFavPage, updateFavPage);
				
				return false; 
			}
			
			removeItem.innerHTML = 'Удалить';
			removeItem.href = '#';
			removeItem.style.display = 'block';

		itemInfo.appendChild(removeItem);
		 
		var addCats = document.createElement('a');
			addCats.href = '#';
			addCats.innerHTML = 'Добавить отмеченые категории'; // todo удаление категорий
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
		
		var container = tooltipEl.getContentContainer();
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
        
        displayedItems = [];
        
        for (var i = 0; i < fav.items.length; i++) {
                   
            // skip by filter
            
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
            
            displayedItems[displayedItems.length] = {item : fav.items[i], index : i};
        
        }   
        
        var startItem = (page - 1) * fav.tweaks.grid.perPage;
        var end = startItem + fav.tweaks.grid.perPage - 1;         
        if (end > displayedItems.length-1) end = displayedItems.length-1;
        
        log(startItem + ' | ' + end + ' | ' + displayedItems.length);
        var galleryImages = [];
        
        for (var i = 0; i <= displayedItems.length-1; i++) {
        
            var item = displayedItems[i].item;
			var previewImage = getPreviewImageByItem(item);
            
            // whole gallery images array for current selector
            
			if (previewImage) {
			
				var galleryIndex = galleryImages.length;
				galleryImages[galleryIndex] = previewImage;
			}
			
            // current page displayed images
            
            if (i < startItem || i > end) continue;
            
            var index = displayedItems[i].index; // fav.items[index]
               
            var itemBlock = document.createElement('div');
                itemBlock.className = env.className + '-FavItem';
                itemBlock.style.lineHeight = '0px'; // prevent unexpected spaces
                itemBlock.style.margin = '0px'; 
                itemBlock.style.padding = '0px'; 
				
			
			
            var collectionBtn = false;
            var imageCount = 0;
						
			itemBlock.setAttribute('itemIndex', index);
			
                if (!previewImage) {
                
                    var text = 'Без изображения';
                    if (item.name) text = item.name + '<br>' + text;
                    if (item.text) text = item.text + '<br>' + text;
					                      
					var size = Math.ceil(text.length / 100) * 50;
					
					//itemBlock.setAttribute('data-width', size);
					
                    itemBlock.innerHTML = '<div style="' + fav.tweaks.grid.cssItem + '" class="' + env.className + '-preview" data-width="'+size+'" itemIndex="' + index + '"><div class="' + env.className + '-preview-text">' + text + '</div></div>';
					
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
                    
					if (typeof item.previewImage !== 'string') imageCount = item.previewImage.length;
                    
                    var additionAtributes = '';
					
					// multi image list
                    if (imageCount > 1) {
                    
                        additionAtributes = 'data-images="' + imageCount + '"';
                        
                        // todo button to explode collection 
                        
                        collectionBtn = document.createElement('a');
                        collectionBtn.innerHTML = imageCount;
                        collectionBtn.href = item.previewImage[0];
                        collectionBtn.className = 'kellyFavListItem-collection';
                        
                        collectionBtn.setAttribute('kellyGallery', 'collection');
                        collectionBtn.setAttribute('kellyGalleryIndex', 0);
                        collectionBtn.setAttribute('itemIndex', index);
                        
                        collectionBtn.onclick = function() {
                        
                            imgViewer.addToGallery(handler.getFavItems()[this.getAttribute('itemIndex')].previewImage, 'collection');
                            imgViewer.loadImage(this);   
                            
                            return false;
                        }
                        
                    }
                    // todo replace
                    //getImageDownloadLink(galleryImages[galleryIndex], true)
					
					if (!catAnimateGif) previewImage = getStaticImage(previewImage);
					
                    itemBlock.innerHTML = '<img style="' + fav.tweaks.grid.cssItem + '" class="' + env.className + '-preview" ' + pInfo + 'itemIndex="' + index + '" ' + additionAtributes + ' kellyGalleryIndex="' + galleryIndex + '" kellyGallery="fav-images" src="' + previewImage + '">';
                
                }
                                    
            var postLink = document.createElement('a');
                postLink.href = item.link;
				postLink.className = 'kellyFavListItem-overlay-button';
                postLink.innerHTML = 'Показать пост'; 
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
				
				var imageSet = '';	
				if (typeof fav.items[index].previewImage != 'string') {
					
					for (var b = 0; b < fav.items[index].previewImage.length; b++) {
						
						imageSet += getImageDownloadLink(fav.items[index].previewImage[b], true);
						if (b == 0) postHd.href = imageSet; 
						imageSet += ',';
					}
					
				} else {
					
					imageSet = getImageDownloadLink(fav.items[index].previewImage, true);
					postHd.href = imageSet; 
				}
				
					
				postHd.setAttribute('kellyGallery', 'hdsource');
				postHd.setAttribute('kellyGalleryIndex', 0);
				postHd.setAttribute('itemIndex', index);
				postHd.setAttribute('imageSet', imageSet);
				
				postHd.onclick = function() {
				
					imgViewer.addToGallery(this.getAttribute('imageSet').split(','), 'hdsource');
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
        imgViewer.addToGallery(galleryImages, 'fav-images');
        
        // connect events to current image elements
        var galleryEl= imagesBlock.getElementsByTagName('img');
        
        for (var i = 0, l = galleryEl.length; i < l; i++)  {
            galleryEl[i].onclick = function() {
                imgViewer.loadImage(this);
                return false;
            }
        }	
        
        if (!print) {
            updatePagination(document.getElementById('kelly-pagination'));
        }
        
        return imagesBlock;
    }
	  
    // autoloading next page on scroll if close to bottom
    
    this.checkLoadNextFavPage = function() {
        
        if (imageGrid.isWaitLoad() !== false) return;
        
       // favContent.appendChild(imagesBlock);
        var favPos = getOffset(favContent);
		var offsetY = 200;
		var blockBottom = favPos.bottom - offsetY;
        
		if (blockBottom < (getViewport().scrollBottom + offsetY)) {
            console.log('load')
            handler.goToFavPage('next', true);
        }
        
    }
		
	function getSelectedPostMediaControlls() {

			var controlls = document.createElement('DIV');
			
			var img = '';
			
			if (selectedImages.length > 1) {
				img += 'Основное изображение <a href="#" class="kellyPreviewImage-del">Удалить</a><a href="#" class="kellyPreviewImage-prev">Предыдущее</a><a href="#" class="kellyPreviewImage-next">Следующее</a><br>';
			}
			
			if (selectedImages.length) {
				
				img += '<div class="kellyPreviewImage-container"><img src="' + getStaticImage(selectedImages[0]) + '" class="kellyPreviewImage"></div>';
			}
			
			controlls.innerHTML = img;
			
			KellyTools.getElementByClass(controlls, 'kellyPreviewImage-prev').onclick = function() { handler.switchPreviewImage(-1); return false; }
			KellyTools.getElementByClass(controlls, 'kellyPreviewImage-next').onclick = function() { handler.switchPreviewImage(1); return false; }
			KellyTools.getElementByClass(controlls, 'kellyPreviewImage-del').onclick = function() { handler.switchPreviewImage(0); return false; }
			
			
			KellyTools.getElementByClass(controlls, 'kellyPreviewImage').onload = function() {
				
				var dimensions = {width : parseInt(this.naturalWidth), height : parseInt(this.naturalHeight)};
				
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
    
    function getImageDownloadLink(url, full) {
    
        url = url.trim();
        if (!url || url.length < 10) return url;
        
        // for correct download process we must keep same domain for image
		// to avoid show copyright \ watermarks
        
            if (environment.profile == 'joyreactor') {
            
                var imgServer = url.match(/img(\d+)/);
                if (imgServer &&  imgServer.length) {
                    
                    imgServer = imgServer[0];
                    
                    var relativeUrl = url.replace('http://', '');
                        relativeUrl = relativeUrl.replace('https://', '');
                     
                    var slash = relativeUrl.indexOf('/');
                    
                    if (slash > 0) { 
                        relativeUrl = relativeUrl.substr(slash + 1);
                    }
                    
                    url = window.location.origin + '/' + relativeUrl;
                    url = url.replace('http://', 'http://' + imgServer + '.');                    
                    url = url.replace('https://', 'https://' + imgServer + '.');
                    
                    if (full && url.indexOf('post/full/') == -1) {
                        url = url.replace('post/', 'post/full/' + imgServer);        
                    }
                    
                    if (!full && url.indexOf('post/full/') != -1) {
                        
                        url = url.replace('post/full/', 'post/' + imgServer);  
                    }
                }
            }
        
        return url;
    
    } 
    
    // todo move to modal?
    
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
        
            var item = displayedItems[i].item;
            if (!item.previewImage) continue;   
                
            var fname = itemGenerateFileName(displayedItems[i].index);            
            
            if (typeof item.previewImage !== 'string') {
            
                for (var b = 0; b <= item.previewImage.length-1; b++) {
                    
                    downloadManager.addFile(fname + '_' + b, getImageDownloadLink(item.previewImage[b], fullSize));
                }
                
            } else {
            
                downloadManager.addFile(fname,  getImageDownloadLink(item.previewImage, fullSize));
            }
        }  
            
        downloadManager.showGrabManager();
        
        //KellyTools.createAndDownloadFile('test', 'test.txt');
    }
    
	function showCategoryControllTooltip(i, target) {
	
		if (!fav.categories[i]) return;
		
		var tooltipEl = getTooltip();
			tooltipEl.updateCfg({
				target : target, 
				offset : {left : 0, top : 0}, 
				position : 'bottom',
			});
			
		var filter = document.createElement('li');
			filter.id = 'kelly-filter-' + i;
			filter.setAttribute('itemIndex', i);
			   
		// Edit mode add to image check
		var filterChecked = '';
		if (extendCats.indexOf(fav.categories[i].id) != -1) {
			filterChecked = 'checked';
		}
		
		var isNSFWChecked = '';
		if (fav.categories[i].nsfw) isNSFWChecked = 'checked';
		// todo показывать кол-во элементов
		
		var deleteButtonHtml = '';
		if (!fav.categories[i].protect) {
			deleteButtonHtml += ' <a class="kellyFavFiltersMenu-delete-button" itemIndex="' + i + '" href="#">Удалить</a>';
		}
		
		var html = '\
		<div class="kellyFavFiltersMenu-tooltip" id="kelly-filter-edit-' + i + '">\
			<label><input class="kellyFavFiltersMenu-check" id="kelly-filter-check-' + i + '" type="checkbox" itemIndex="' + i + '" ' + filterChecked + '> Добавить к изображению</label>\
			<label><input class="kellyFavFiltersMenu-nsfw" id="kelly-filter-nsfw-' + i + '" type="checkbox" ' + isNSFWChecked + '> NSFW </label>\
			<br><input class="kellyFavFiltersMenu-newname" id="kelly-filter-newname-' + i + '" type="text" value="' + fav.categories[i].name + '" placeholder="Новое название">\
			<br><a class="kellyFavFiltersMenu-newname-button" itemIndex="' + i + '" href="#">Изменить</a>\
			' + deleteButtonHtml + '\
		</div>';
		
		var container = tooltipEl.getContentContainer();
			container.innerHTML = html;
		
		var renameButton = KellyTools.getElementByClass(container, 'kellyFavFiltersMenu-newname-button');
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
			var deleteButton = KellyTools.getElementByClass(container, 'kellyFavFiltersMenu-delete-button');
				deleteButton.onclick = function () {
					
					var itemIndex = parseInt(this.getAttribute('itemIndex'));                        
					if (!itemIndex) return false;
					
					var updateFavPage = function() { handler.showFavouriteImages(); };
					handler.showRemoveCategoryDialog(itemIndex, updateFavPage, updateFavPage);
					return false;
				}
		}
		
		var catExtender = KellyTools.getElementByClass(container, 'kellyFavFiltersMenu-check'); 
			catExtender.onclick = function() { 
				var remove = true;
				if (this.checked) remove = false;
				
				handler.extendCats(parseInt(this.getAttribute('itemIndex')), remove); 
			}
			
		tooltipEl.show(true, 'categoryEdit');
	}
				 
	// вывод всех изображений избранного \ обновление блока категорий
    // страницы сбрасываются только при смене фильтров
	
    this.showFavouriteImages = function() {
        
		imageGrid.close();
		
		imageGrid.updateConfig({rowHeight : fav.tweaks.grid.rowHeight, rules : fav.tweaks.grid});
		
        if (fav.tweaks.autoload_onscroll) {
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
		
		if (!env.isNSFW()) {
		                           
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
		
        var controllsContainer = modalBoxContent;
        
		handler.showModalMessage(false);
        controllsContainer.innerHTML = '';
                
		if (!document.getElementById(env.className + '-mainCss')) {
			
			favContent.innerHTML = 'Ошибка инициализации таблиц оформления';
			displayFavouritesBlock('fav');
			return;
		}
		
        favContent.innerHTML = '<div class="kellyFavDownloadManager"></div>';
		
        var editButton = document.createElement('a');
            editButton.href = '#';
			editButton.innerHTML = 'Режим редактирования';
			editButton.onclick = function() {
				
				this.className = this.className.replace('active', '');
				
				if (readOnly) {
				
					readOnly = false;
					this.className += ' active'; 
					
				} else {
				
					readOnly = true;
				}
				
				return false;
				
			}
			
			editButton.className = 'kellyFavEditButton';
			
		var resetButton = document.createElement('a');
            resetButton.href = '#';
			resetButton.innerHTML = 'Сбросить';
			resetButton.onclick = function() {
			
				catFilters = [];
				catIgnoreFilters = [];
				handler.showFavouriteImages();
				
				return false;
				
			}
			
			resetButton.className = 'kellyFavEditButton-reset';
        
        var filterComments = editButton.cloneNode();
            filterComments.className = 'kellyFavFilter';
            filterComments.innerHTML = 'Комменты';
           
        var filterPosts = filterComments.cloneNode();
            filterPosts.innerHTML = 'Публикации';          
        
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
            typeFiltersContainer.className = 'kellyTypeFiltersContainer';
            typeFiltersContainer.appendChild(filterComments);
            typeFiltersContainer.appendChild(filterPosts);
            
        var logicButton = editButton.cloneNode();
            logicButton.className = 'kellyFavFilter';
            logicButton.innerHTML = 'Логика И';
            // logic.alt = 'Вывести записи где есть хотябы один из выбранных тегов';
            
            logicButton.onclick = function () {

				if (logic == 'or') {
					logic = 'and';
					this.innerHTML = 'Логика И';
					
				} else {
					logic = 'or';
					this.innerHTML = 'Логика ИЛИ';
				}
				
				handler.updateImagesBlock();
				handler.updateImageGrid();
				
                return false;
            }
            
        var download = editButton.cloneNode();
            download.innerHTML = 'Менеджер загрузок';
            
            download.onclick = function () {
                
                handler.showDownloadManager();
                return false;
            }
            
        var no = editButton.cloneNode();
            if (!catFilterNot) no.innerHTML = '+ Теги';
            else no.innerHTML = '- Теги';
			
            no.onclick = function () {
  
				if (catFilterNot) {
					catFilterNot = false;
					this.innerHTML = '+ Теги';
				} else {
					catFilterNot = true;
					this.innerHTML = '- Теги';
				}
			
                return false;
            }
			
        var gif = editButton.cloneNode();
            if (catAnimateGif) gif.innerHTML = '+ Анимация GIF';
            else gif.innerHTML = '- Анимация GIF';
			
            gif.onclick = function () {
  
				if (catAnimateGif) {
					catAnimateGif = false;
					this.innerHTML = '- Анимация GIF';
				} else {
					catAnimateGif = true;
					this.innerHTML = '+ Анимация GIF';
				}
			
				handler.updateImagesBlock();
				handler.updateImageGrid();
                return false;
            }
			
        var additionButtons = document.createElement('div');
            additionButtons.className = 'kellyAdditionButtons';
		    additionButtons.appendChild(resetButton);
            additionButtons.appendChild(editButton);
            additionButtons.appendChild(download);
            
            typeFiltersContainer.appendChild(logicButton);
            additionButtons.appendChild(no);
            additionButtons.appendChild(gif);
			
        controllsContainer.appendChild(additionButtons);
        controllsContainer.appendChild(typeFiltersContainer);
        
		
		if (!readOnly) editButton.className += ' active';
		
        var filtersMenu = document.createElement('ul');
            filtersMenu.className = 'kellyFavFiltersMenu';
        
        for (var i = 0; i < fav.categories.length; i++) {
        
                var filter = document.createElement('li');
                    filter.id = 'kelly-filter-' + i;
                    filter.setAttribute('itemIndex', i);
                       
				// Edit mode add to image check
                if (extendCats.indexOf(fav.categories[i].id) != -1) {
                    filter.className += ' includable';
                }
                
                // todo показывать кол-во элементов
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
                filtersMenu.appendChild(filter);
                
        }
        
        controllsContainer.appendChild(filtersMenu);
             
        var paginationContainer = document.createElement('div');
            paginationContainer.className = 'kellyPagination';
            paginationContainer.id = 'kelly-pagination';
            
        updatePagination(paginationContainer);
            
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
		
		if (fav.items[index].previewImage) {
			fav.items[index].pw = imageWH.width;
			fav.items[index].ph = imageWH.height;
		}   
		
		save();
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
        
        previewImage.src = getStaticImage(selectedImages[caret]);
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
        
        var html = '<p>Подтвердите удаление</p>';
			html += '<p><label><input type="checkbox" name="removeImages" class="' + env.className + 'RemoveImages"> Удалить все связанные изображения</label></p>'
            html += '<p><a href="#" class="' + env.className + 'Remove">Удалить</a>';
            html += '<a href="#" class="' + env.className + 'Cancel">Отменить</a></p>';       
        
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
    
	// postBlock is deprecated variable - unimportant here, todo remove
	
    this.showRemoveFromFavDialog = function(itemIndex, postBlock, onRemove, onCancel, onApply) {
    
        if (!fav.items[itemIndex]) {
			log('attempt to remove unexist item ' + itemIndex);
			return false;
		}
        
		handler.showModalMessage(false);
        
        var html = '<p>Подтвердите удаление</p>';
            html += '<p><a href="#" class="' + environment.className + 'Remove">Удалить</a><a href="#" class="' + environment.className + 'Apply">Применить изменения</a>';
            html += '<a href="#" class="' + environment.className + 'Cancel">Отменить</a></p>';       
        
        modalBoxContent.innerHTML = '<div class="' +  environment.className + '-removeDialog">' + html + '</div>';
        
		var removeButton = KellyTools.getElementByClass(modalBoxContent, environment.className + 'Remove');
		var removeApplyButton = KellyTools.getElementByClass(modalBoxContent, environment.className + 'Apply');
		var removeDialog = KellyTools.getElementByClass(modalBoxContent, environment.className + '-removeDialog');
		
		selectedImages = false;
		
		if (fav.items[itemIndex].previewImage) {
		
			if (typeof fav.items[itemIndex].previewImage == 'string') {
				selectedImages = [fav.items[itemIndex].previewImage];
			} else {
				selectedImages = [];
				
				for (var i = 0; i < fav.items[itemIndex].previewImage.length; i++) {
					selectedImages[i] = fav.items[itemIndex].previewImage[i];
				}
			}
			
			var controlls = getSelectedPostMediaControlls();
			
			removeDialog.insertBefore(controlls, removeDialog.childNodes[0]);			
			
		} 
		
		if (!selectedImages || selectedImages.length <= 1) { 
			removeApplyButton.style.display = 'none';
		} else {
			removeButton.innerHTML = 'Удалить всю подборку';
		}
		 
		removeApplyButton.onclick = function() {

			if (!selectedImages || selectedImages.length <= 0) {
				
				handler.itemRemove(itemIndex);  
					
			} else {
				
				fav.items[itemIndex].previewImage = selectedImages;				
				save();
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
		
		KellyTools.getElementByClass(modalBoxContent, environment.className + 'Cancel').onclick = onCancelCommon;
		
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
        selectedInfo = new Object();
        
        selectedPost = postBlock;
        if (comment) {
            selectedComment = comment;
            selectedImages = getAllMedia(comment);
        } else {            
            selectedComment = false;
            selectedImages = getAllMedia(postBlock);
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
        		
        var catsHTML = '<option value="-1">Без категории</option>';
        
        for (var i = 0; i < fav.categories.length; i++) {
            var selected = '';
            
            //if (fav.last_cat == fav.categories[i].id) selected = 'selected';
            
            catsHTML += '<option value="' + fav.categories[i].id + '" ' + selected + '>' + fav.categories[i].name + '</option>';
        }
        
        catsHTML = '<select class="' + env.className + 'Cat">' + catsHTML + '</select>';
		
        var html = '<div class="' + env.className + 'SavePostWrap">\
							<div class="' + env.className + 'CatAddForm">\
						        <div><input type="text" placeholder="Название новой категории" value="" class="' + env.className + 'CatName"><a href="#" class="' + env.className + 'CatCreate">Создать категорию</a></div>\
							</div>\
							<div class="' + env.className + 'SavePost">\
								<div class="' + env.className + 'CatList">' + catsHTML + ' <a href="#" class="' + env.className + 'CatAdd">Добавить категорию</a></div>\
								<input type="text" placeholder="Название" value="" class="' + env.className + 'Name"><a href="#" class="' + env.className + 'Add">Сохранить</a>\
							</div>\
							<div class="' + env.className + 'CatAddToPostList"></div>\
					</div>\
					';
	
		var controlls = getSelectedPostMediaControlls();
		
        modalBoxContent.innerHTML = html;
		modalBoxContent.insertBefore(controlls, modalBoxContent.childNodes[0]);		
        
        KellyTools.getElementByClass(modalBoxContent, environment.className + 'CatAdd').onclick = function() { handler.categoryAdd(); return false; }        
        KellyTools.getElementByClass(modalBoxContent, environment.className + 'CatCreate').onclick = function () { handler.categoryCreate(); return false; }
        // KellyTools.getElementByClass(modalBoxContent, environment.className + 'CatRemove').onclick = function () { handler.categoryRemove(); return false; }

        KellyTools.getElementByClass(modalBoxContent, environment.className + 'Add').onclick = function () { handler.itemAdd(); return false; }
                
        var list = KellyTools.getElementByClass(modalBoxContent, environment.className + 'CatAddToPostList');    

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
            previewImage : '', 
            link : '', 
            name : KellyTools.getElementByClass(modalBoxContent, 'kellyJRFavName').value,
			// commentLink : '',
        };
               
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
                
                    for(var i = 0; i < limitTags; i++) {
                                                             
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

        if (selectedImages.length == 1) postItem.previewImage = selectedImages[0];
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
            
            postItem.previewImage = selectedImages;
        }
        
        if (selectedInfo && selectedInfo['dimensions'] && selectedInfo['dimensions'].width) {
            postItem.pw = selectedInfo['dimensions'].width;
            postItem.ph = selectedInfo['dimensions'].height;     
        }
        
        if (selectedInfo && selectedInfo['gifInfo'] && selectedInfo['gifInfo'].length) {
            postItem.gifInfo = selectedInfo['gifInfo'];     
        }
        
        var link = env.getPostLink(selectedPost);
        if (link) postItem.link = link.href;           
        
        if (!postItem.link) {
            
            if (noSave) handler.showModalMessage('Публикация не имеет ссылки', true);
            return false;
            
        }
        
        if (noSave) return postItem;
        
		var selectedUrl = KellyTools.getRelativeUrl(selectedComment ? postItem.commentLink : postItem.link);
		var selectedUrlTypeKey = selectedComment ? 'commentLink' : 'link';
		
        for (var i = 0; i < fav.items.length; i++) {
            
            if ( KellyTools.getRelativeUrl(fav.items[i][selectedUrlTypeKey]).indexOf(selectedUrl) != -1 ) {
                fav.items[i] = postItem;
				handler.showModalMessage('Избранная публикация обновлена');
                save();
                return false;
            }
        }
        
		handler.showModalMessage('Публикация добавлена в избранное');
				
        fav.items[fav.items.length] = postItem;
        if (favCounter) favCounter.innerHTML = fav.items.length;
        	
        selectedComment ? formatComments(selectedPost) : formatPostContainer(selectedPost);
		
        console.log(postItem);
        save();
        
        return true;
    }
    
    // удалить элемент с последующим обновлением контейнеров публикаций 
	// index - item index in fav.items[index] - comment \ or post
    // postBlock - not important post container dom element referense, helps to find affected post
    	
    this.itemRemove = function(index, postBlock) {
    
        fav.items.splice(index, 1);
        
        if (favCounter) favCounter.innerHTML = fav.items.length;
        
        save();

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
			
			if (favCounter) favCounter.innerHTML = fav.items.length;
			
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
	   
	   save();
	   return true;
    }
    
    this.categoryExclude = function(newCatId) {
        
        var index = fav.selected_cats_ids.indexOf(newCatId);

        if (index == -1) return false;
        
        fav.selected_cats_ids.splice(index, 1);
        
        console.log(fav.selected_cats_ids);
        save();
        
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
        
            save();
            return fav.categories[index];
            
        } else return false;
        
    }
    
    this.getFavItems = function() {
        
        return fav.items;
    
    }
    
    // add category to list of categories of selected item
    
    this.categoryAdd = function() {
    
        var list = KellyTools.getElementByClass(modalBoxContent, environment.className + 'CatAddToPostList');
        if (!list) return false;
        
        var catSelect = KellyTools.getElementByClass(modalBoxContent, environment.className + 'Cat');       
        var newCatId = parseInt(catSelect.options[catSelect.selectedIndex].value);
                
        if (fav.selected_cats_ids.indexOf(newCatId) !== -1) return false;
        
        if (getCategoryById(newCatId).id == -1) return false;
        
        fav.selected_cats_ids[fav.selected_cats_ids.length] = parseInt(newCatId);
        
        list.appendChild(createCatExcludeButton(newCatId));
        
        save();
    }
    
    this.categoryCreate = function() {
        
        if (!modalBox) return;
        
        var name = KellyTools.getElementByClass(modalBoxContent, environment.className + 'CatName').value;
        name = name.trim();
                
        var catIsNSFW = KellyTools.getElementByClass(modalBoxContent, environment.className + 'CatIsNSFW');
        if (catIsNSFW && catIsNSFW.checked) catIsNSFW = true;
        else catIsNSFW = false;
        
        if (!name) {
			handler.showModalMessage('Введите название категории', true);
            return false;
        }
        
        for (var i = 0; i < fav.categories.length; i++) {
            if (fav.categories[i].name == name) {
               handler.showModalMessage('Категория с указаным именем уже существует', true);
               return false
            
            }
        }
        
        fav.ids++;
        
        fav.categories[fav.categories.length] = { name : name, id : fav.ids, nsfw : catIsNSFW};
        
        var option = document.createElement("option");
            option.text = name;
            option.value = fav.ids;
        
        var catSelect = modalBoxContent.getElementsByClassName('kellyJRFavCat')[0];
        catSelect.add(option);
        catSelect.selectedIndex = catSelect.options.length-1;
      
        handler.showModalMessage('Категория добавлена');
        save();
    }
    
    function getFavPageInfo() {
        var header = KellyTools.getElementByClass(document, 'mainheader');
        if (!header) return false;
        
        if (header.innerHTML.indexOf('Избранное') == -1) return false;
        
        var info = {
            pages : 1,
            items : 0,
            page : 1,
            header : header,
            url : false,
        }
        
        var posts = document.getElementsByClassName('postContainer');
        if (posts) info.items = posts.length;
        
        //(window.location.href.substr(window.location.href.length - 8) == 'favourite')
        
        var pagination = KellyTools.getElementByClass(document, 'pagination_expanded');

        if (pagination) {
            info.page = parseInt(KellyTools.getElementByClass(pagination, 'current').innerHTML);
            if (info.page > info.pages) info.pages = info.page;
            
            var pages = pagination.getElementsByTagName('A');
            for (var i = 0; i < pages.length; i++) {
                var pageNum = parseInt(pages[i].innerHTML);
                if (info.pages < pageNum) info.pages = pageNum;   
                
                if (!info.url) {
                    info.url = pages[i].href;   
                    
                    if (info.url.substr(info.url.length - 8) != 'favorite') {
                        info.url = info.url.substring(0, info.url.length - (String(pageNum).length + 1));
                    }
                    
                    info.url += '/';                    
                    info.url = info.url.replace(window.location.origin, "")
                }
            }
            
            info.items += (info.pages - 1) * 10;
        }
        
        return info;
    }
    
    this.onDownloadNativeFavPagesEnd = function() {
	
        var downloadBtn = KellyTools.getElementByClass(document, 'kelly-DownloadFav');
        if (downloadBtn) downloadBtn.innerHTML = 'Скачать';	
			
        if (!favNativeParser || !favNativeParser.collectedData.items.length) return false;
                    
		// скачивать только в json файл, потом через менеджер уже на свое усмотрение объединять

            
            KellyTools.getElementByClass(document, 'kelly-Save').style.display = 'block';
            
        var saveNew = KellyTools.getElementByClass(document, 'kelly-SaveFavNew');
            saveNew.onclick = function() {
			
				if (favNativeParser && favNativeParser.collectedData.items.length) {
					
					var time = new Date().getTime();							
					KellyTools.createAndDownloadFile(JSON.stringify(favNativeParser.collectedData), 'db_' + time + '.json');	
				}
				
				return false;
            }            
    }
    
    this.onDownloadNativeFavPage = function(worker, thread, iframeDoc, jobsLength) {
    
        if (!iframeDoc) {
            worker.errors += 'Отсутствует window.document для страницы ' + thread.job.data.page + '; ';
            return false;
        }
    
        var posts = iframeDoc.getElementsByClassName('postContainer');
        
        if (!posts) {
        
            worker.errors += 'Отсутствует контейнер postContainer для страницы ' + thread.job.data.page + '; ';
            return false;
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
            
            selectedImages = getAllMedia(posts[i]);
                                
            var postItem = handler.itemAdd(true);
            if (postItem) {
				
				worker.collectedData.ids++;	
				
				postItem.id = worker.collectedData.ids; 		
				worker.collectedData.items[worker.collectedData.items.length] = postItem;
				
				pageInfo.itemsNum++;
			}
        }
        
        console.log(pageInfo.page + ' | ' + pageInfo.itemsNum);
        // console.log(fav.native_tags);
        console.log('--');
        
        KellyTools.getElementByClass(document, 'kelly-DownloadFavProcess').innerHTML = 'Страниц в очереди ' + jobsLength + ' <br> ' + worker.errors;
    }
    
    this.downloadNativeFavPage = function(el) {
	
        var favInfo = getFavPageInfo();        
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
		
		var message = KellyTools.getElementByClass(document, 'kelly-DownloadFavProcess');
		
		if (pages && pages.value.length) {
			pagesList = KellyTools.getPrintValues(pages.value, true);
		} else { 
			pagesList = KellyTools.getPrintValues('1-' + favInfo.pages, true);
		}	
		
		if (!pagesList.length) {
			message.innerHTML = 'Выборка пуста';
			return;
		}
		
        for (var i = 0; i < pagesList.length; i++) {
			
			var pageNumber = pagesList[i];
			
            favNativeParser.addJob(
                favInfo.url + pageNumber, 
                handler.onDownloadNativeFavPage, 
                false, 
                {page : pageNumber}
            );
        }
		
        el.innerHTML = 'Загрузка... (Отменить)';  
		log('Инициализация...');
        favNativeParser.exec();
    }
    
    this.showNativeFavoritePageInfo = function() {
    
        var favPageInfo = getFavPageInfo();
        
        //todo тултип с инфой о пользователе - там и избранное но врятли нужно
        
        if (favPageInfo && favPageInfo.items) {
        
            var favPageInfoContainer = KellyTools.getElementByClass(document, 'kelly-FavNativeInfo'); 
            if (!favPageInfoContainer) {
                favPageInfoContainer = document.createElement('div');
                favPageInfoContainer.className = 'kelly-FavNativeInfo';
            }
            
            var saveBlock = '<div class="kelly-Save" style="display : none;"><a href="#" class="kelly-SaveFavNew" >Скачать список элементов</a></div>';
            
            var items = favPageInfo.items;
            if (favPageInfo.pages > 2) { 
                items = '~' + items;
            }
            
            favPageInfoContainer.innerHTML = 'Страниц : ' + favPageInfo.pages + ' (' + items + ')<br>\
											 Укажите список страниц выборки, например 2, 4, 66-99, 44, 78, 8-9, 29-77, если нужно захватить все страницы оставьте не заполненным<br>\
											 <input class="kelly-PageArray" type="text" placeholder="Страницы" value="">\
											 <a href="#" class="kelly-DownloadFav">Скачать</a>' + saveBlock + '\
											 <div class="kelly-DownloadFavProcess"></div>';
											 
            favPageInfo.header.parentNode.insertBefore(favPageInfoContainer, favPageInfo.header.nextSibling);
            
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
    
        if (!initCss()) {
        
            log('safe exit from page ' + document.title);
            return false; // exit
        }
        
        handler.showNativeFavoritePageInfo();
        handler.formatPostContainers();
    
        for (var i = 0; i < onDomReady.length; i++) {
            onDomReady[i]();
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

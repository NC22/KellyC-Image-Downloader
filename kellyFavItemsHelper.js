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
// добавлен unloadfavpage - дотестить тк был хреновый инет
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
// автоматически выбирить группу gif для гифок. сохранять превьюшку для гифок - гораздо быстрей можно узнать размер файла
// оверлеем кол-во кадров - при клике вывод галереи только с этими кадрами [ok], возможность разбить их при выводе (кнопка Разбить (копируем как отедльные элементы и запоминаем родителя для возможности отмены) \ Удалить в режиме редактирования), отделить конкрентое изображение ( сохранять для доп кадров пропорции в отдельную переменную)
// грабер на php и подключение к нему [ок] реализовано через download api, название папки включает все выбраные категории \ фулл версии картинок возможность сохранять коллекции отдельной папкой \ только текущая страница \ выборочное исключение \ пропустить первые N \ название Удаленная категория - Без категории \ при выборе нескольких категорий возможность сохранять в разные категории один и тот же файл если он есть и там и там
// кол-во элементов в строке (предварительно перейти на класс tileGrid  float left; для элементов в сеткe
// скрывать сайдблок [ok]
// сортировка прямая и обратная
// дублировать в основное избранное сайта [-]
// автозагрузка при скролле не корректна

// опционально сейвить реакторские теги (хранить отдельным параметром по аналогии с основными), для совместимости надо будет категории хранить в самом хранилище картинок - иначе нормально не обменяться
// кнопка - сохранять теги
// удаление категорий - удалять только саму категорию \ категорию и входящие в нее изображения
// драйвер - вынести css стили и окружение в него

function KellyFavItemsHelper() 
{
    var PROGNAME = 'KellyFavItemsHelper v0.93';
    
    // site profile
    
    // default storage names
    var storage = { config : 'kelly_jr_helper', db : 'kelly_jr_helper_db'};
    
    // default profile
    var environment = {
    
        // todo, add css - tilegrid, base, grabber
    
        className : 'kellyJRFav', // todo random class
        profile : 'joyreactor',
        mainDomain : 'joyreactor.cc',
        mainIframeSrc : 'http://joyreactor.cc/about?kellyHelperMode=getLocalStorage', // to get local storage if web site use several subdomains
        mainContentContainer : 'contentinner',
        mainContainer : 'container',
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
    var modalBoxBtnClose = false;
    
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
    
    // fav image grid
    
    var images = false;
    var imagesLoaded = 0;
    var imagesBlock = false;
    var imageGridTimer = false;
    var imageGridTimerSec = 0;
    var imageGridBeasy = false;
    var imagesRow = [];
    var imagesRowWidthReq = 0;
    var imagesRowHeight = 250;
    
    var landscape = 0;
    var portrait = 0;
        
    var debug = true;
    
    var page = 1;
    var perPage = 60;
    var displayedItems = [];
    
    // локальное хранилище, структура данных поумолчанию
    
    var fav = {       
        items : [], 
        
        selected_cats_ids : [], // последние выбраные категории при добавлении изображения через диалоговое окно (categoryExclude, validateCategories, getCategoryBy)
        categories : [
            {id : 1, name : 'GIF'},
            {id : 2, name : 'NSFW', nsfw : true},
        ],  // категории элементов
               
        select_native_tags : [], // getNativeTagByName     
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
                           
            imgViewer = new KellyImgView({idGroup : 'kellyImgView'});
            
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
        else false;
    }
    
    function getInitAction() { // if page included as Iframe, we use it just to restore local storage data on subdomain, or domain with other name
        var mode = findGetParameter('kellyHelperMode');
        if (!mode) return 'main';
        
        return mode;
    }
    
    function log(info) {
        if (debug) {
            if (typeof info == 'object' || typeof info == 'function') {
                console.log('KellyJRHelper : [' + getTime() + '] var output :');
                console.log(info);
            } else {
                console.log('KellyJRHelper : [' + getTime() + '] '+ info);
            }
        }
    }

    // DOM \ Window common tools

    function getTime() {
        var currentTime = new Date();
        var hours = currentTime.getHours();
        var minutes = currentTime.getMinutes();
        
        if (minutes < 10){
            minutes = "0" + minutes;
        }
        return hours + ":" + minutes;
    }

    function getParentByTag(el, tagName) {
        var parent = el;
        if (!tagName) return false;
        
        tagName = tagName.toLowerCase();
        
        while (parent && parent.tagName.toLowerCase() != tagName) {
			parent = parent.parentElement;
        }  
        
        return parent;
    }
    
    function getParentByClass(el, className) {
        var parent = el;
     
        while (parent && parent.className != className) {
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
    
    function getRelativeUrl(str) {
    
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
    
    function parseJSON(json) {
        
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
    
    // return one element by class
    
    function getElementByClass(parent, className) {
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
            screenHeight: height
        };
    }
    
    // validate selected categories, remove frome selected if some of them not exist
    
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
        var tmpFav = parseJSON(localStorage.getItem(storage.config));
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
        
            tmpFav = parseJSON(localStorage.getItem(fav.storage));
            if (tmpFav) fav.items = tmpFav;
            else fav.items = [];
            
        }
        
        if (!fav.tweaks.autoload_onscroll) fav.tweaks.autoload_onscroll = false;
        if (!fav.tweaks.commentsBlacklist)  fav.tweaks.commentsBlacklist = [];
        if (!fav.tweaks.postsBlacklist)  fav.tweaks.postsBlacklist = [];
        
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
                
        var totalPages = Math.ceil(displayedItems.length / perPage);
               
        if (!byScroll) byScroll = false;
               
        if (newPage == 'next') page++;
        else if (newPage == 'previuse' || newPage == 'prev' ) page--;
        else {
            page = parseInt(newPage);
        }
        
        if (page < 1) page = 1;
        if (page > totalPages && byScroll) return false;
        if (page > totalPages) page = totalPages;
        
        if (imageGridTimer) {
            clearTimeout(imageGridTimer);
            imageGridTimer = false;
        }
                
        handler.unloadFavPage();
        
        handler.updateImagesBlock(false, byScroll);
        handler.updateImageGrid();
        
        return true;
    }
    
    function updatePagination(paginationContainer) {
        
        if (!paginationContainer) return false;
        
        paginationContainer.innerHTML = '';
        
        if (!displayedItems.length) return;
        
        var totalPages = Math.ceil(displayedItems.length / perPage);

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
            paginationContainer.appendChild(goToPreviuse); 
        }
                   
        if (pageStart > 1) {
            var goToBegin = goToPreviuse.cloneNode(true);
            goToBegin.setAttribute('pageNum', '1');
            goToBegin.onclick = goToFunction;
            goToBegin.innerHTML = '<<';
            
            paginationContainer.appendChild(goToBegin); 
        }
        
        for (var pageNum = pageStart; pageNum <= pageEnd; pageNum++) {
             var pageEl = document.createElement('a');
                 pageEl.href = '#';
                 pageEl.innerHTML = pageNum;
                 pageEl.className = 'kellyPagination-item';
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
    
    function initCss() {
        
        init = true;
        
        var mainContainer = document.getElementById(environment.mainContainer);
        
        if (!mainContainer) {
            if (document.title.indexOf('503 Service') !== -1) {
                handler.loadDirectly();
            }
            return false;
        }
        
        var css = '.kellyJRFav { margin-right : 6px; }';
            css += '.kellyJRFavContainer { display : none; }';
            
        css += "\
            .kellyJRFavContainer { margin-bottom : 120px; line-height: 0px; }\
            .kellyJRFavContainer-page { line-height: 20px; }\
            .kellyPagination { margin-bottom : 16px; }\
            .kellyPagination-item.active, .kellyPagination-item:hover, .kellyPagination-item:focus\
            { background : #ffebc2; }\
            .kellyPagination-item\
            {\
            padding-left: 3px;\
            padding-right: 3px;\
            border-radius : 2px; text-decoration : none; display : inline-block; margin-right : 3px; line-height : 28px; text-align : center; width : 32px; height : 32px; font-size : 16px; background : #ffca61; border : 2px solid #3c0905; }\
            .kellyFavListItem{\
                display : inline-block; \
                position : relative; \
            }\
            ." + env.className + "-preview-text {\
               width : 100%; line-height : 14px; height : 100%; padding : 16px; background : #f2f2f2;  border : 2px dashed #c5c5c5; \
            }\
            ." + env.className+ "-preview {\
                 overflow : hidden; height : " + imagesRowHeight + "px; \
            }\
            .kellyFavListItem-tags > div > span { display : inline-block; min-width : 128px; }\
            .kellyFavListItem-tags > div { margin-top : 12px; background : #ffc32e; padding : 4px; }\
            .kellyFavListItem-info {\
                left : 0px;\
                bottom : 0px;\
                position : absolute;\
                text-align : left; \
                display : none;\
                width : 300px;\
                border : 2px dashed #c5c5c5;\
                background : #f2f2f2;\
                z-index : 9999;\
                padding : 8px;\
                line-height : 16px;\
                \
            }\
            .kellyFavListItem-overlay-button {\
                display : none;\
                line-height : 32px;\
                height : 32px;\
                font-size : 14px;\
                padding-left : 8px;\
                padding-right : 8px;\
                background : #e2e2e2;\
                left : 0px;\
                top : 0px;\
                position : absolute;\
                text-align : left; \
                \
            }\
            .kellyFavListItem-overlay-button-bottom {\
                left : 0px;\
				bottom : 0px;\
				top : auto;\
            }\
            .kellyFavListItem .kellyFavListItem-additions {\
                position: absolute;\
                padding: 0px;\
                right: 6px;\
                top: 6px;\
                left: auto;\
                padding-left: 0px;\
                padding-right: 0px;\
                display : inline-block;\
            }\
            .kellyFavListItem a.kellyFavListItem-collection {\
                display: block;\
                border: 1px solid #000;\
                padding: 0px;\
                margin-left: 6px;\
                width: 32px;\
                height: 32px;\
                text-align: center;\
                line-height: 32px;\
                background: #d5d5d5;\
                text-decoration: none;\
            }\
            .kellyFavListItem:hover > a {\
                display : inline-block;\
            }\
            .kellyFavEditButton { display : block; }\
			.kellyFavEditButton-reset { float : right; background : #fff; padding-left : 4px; padding-right : 4px;}\
            .kellyTypeFiltersContainer {  margin-top: 12px; }\
            .kellyFavFilter {\
                border-radius : 0px;\
                margin-bottom : 12px;\
                display : inline-block;\
                height : 32px;\
                line-height : 32px;\
                padding-left : 12px;\
                padding-right : 12px;\
                text-decoration : none;\
                margin-right : 6px;\
            }\
            .kellyFavFiltersMenu {\
                margin-bottom : 12px;\
                /* todo move tooltips max-height: 450px;\
                overflow-y: auto;\
                overflow-x: hidden;*/\
            }\
            .kellyFavFiltersMenu-tooltip { background : #f2f2f2; border : 2px dashed #c5c5c5; display : none; position : absolute; left : 0px; bottom : 0px; padding : 6px; z-index : 999;}\
            .kellyFavFiltersMenu > li.includable:before {\
                content: ' ';\
                width: 12px;\
                height: 12px;\
                background: #ff8d4b;\
                display: block;\
                position: absolute;\
                right: 5px;\
                top: 0px;\
                border-radius: 6px;\
                border: 2px solid #713d1e;\
            }\
            .kellyFavFiltersMenu > li { display : inline-block; position : relative; margin-top: 6px;}\
            .kellyFavFiltersMenu > li > a {\
                border-radius : 16px; text-decoration : none; display : inline-block; margin-right : 6px; line-height : 28px; text-align : center;  height : 32px; font-size : 14px; background : #ffc78e; \
                display : inline-block; line-height : 32px; padding-left : 4px; padding-right : 4px; \
            }\
            .kellyFavFilter.active,  .kellyFavEditButton.active { background : rgba(255, 92, 16, 0.75); }\
            .kellyFavFiltersMenu > li > a.active{\
                background : #ff5c10; \
            }\
            .kellyFavFiltersMenu > li > a.activeIgnore\
            { background : #ff002f; }\
            .kellyModalBox {\
                display : none;\
                position:absolute;\
                z-index:990;\
                margin : 0 auto;\
                width : 300px;\
                background : #fff;\
                min-height : 255px;\
                border : 1px solid #e1e1e1;\
                border-radius : 4px;\
                top: 244px;\
                /*left : 50%;*/\
                right : 4px;\
                /*margin-left : -400px;*/}\
            .kellyModalBox > div:first-child {\
                min-height : 32px;\
                text-align : right;\
                padding : 0px;\
                padding-right : 12px;\
                border-bottom : 1px solid #e1e1e1;\
                text-decoration : none;\
                background-color : #f5f5f5;}\
            .kellyModalBox > div:first-child a {\
                text-decoration : none;\
                color : #555;\
                font-size : 16px;\
                line-height : 32px;} \
            .kellyModalBox .kellyModalContent {\
                padding : 12px;	\
            }\
            .kellyModalBox .kellyModalContent a {\
                padding-left : 6px;	\
                padding-right : 6px;\
            }\
            #kellyImgView { \
                position : absolute; top : 0px; left : 0px; background : rgba(0, 0, 0, 0.50); visibility : hidden;\
                opacity : 0; transition : opacity 1s; width : 100%; height : 100%; z-index : 999;\
            }\
            #kellyImgView-img {\
                text-align : center;\
            }\
            #kellyImgView-img img {\
                opacity : 0;\
                transition : opacity 1s;\
            }\
			.kellyPreviewImage-container {\
				overflow : hidden;\
				width: 200px;\
				max-height : 400px;\
			}\
            .kellyPreviewImage {\
                width : 100%;\
                display : block; \
            }\
            ";      
        
        modalBox = document.createElement('div');
        modalBox.id = 'KellyJRHelperModalBox';
        modalBox.className = 'kellyModalBox';
        
        var modalBoxHTML  = '';
            modalBoxHTML += '<div class="kellyModalHeader"><a href="#">Закрыть</a></div>';
            modalBoxHTML += '<div class="kellyModalContent">';
                                
            modalBoxHTML += '</div><div class="kellyModalMessage"></div>';
                     
        var imgView = document.createElement('div');
            imgView.id = 'kellyImgView';
            imgView.innerHTML = '<div id="kellyImgView-img" ></div>';
            
        modalBox.innerHTML = modalBoxHTML;
        
        modalBoxBtnClose = getChildByTag(modalBox, 'a');
        modalBoxBtnClose.onclick = function() { handler.closeModal(); return false; };
        
        modalBoxContent = modalBox.getElementsByClassName('kellyModalContent')[0];
        modalBoxMessage = modalBox.getElementsByClassName('kellyModalMessage')[0];
        
        mainContainer.appendChild(modalBox);
        mainContainer.appendChild(imgView);
        
        imgViewer.addBaseButtons();
        
        handler.addEventListner(window, "scroll", function (e) {
            handler.updateModalBlockPosition();
        }, '_fav_dialog');
        
        var head = document.head || document.getElementsByTagName('head')[0],
		style = document.createElement('style');
		style.type = 'text/css';
		
		if (style.styleSheet){
		  style.styleSheet.cssText = css;
		} else {
		  style.appendChild(document.createTextNode(css));
		}

        // add fav button on top
                
        var favButton = createMainMenuButton('Избранное (Всего : <span>Загружаю данные...</span>)', function() { 
			
				if (mode == 'fav') {
					handler.hideFavoritesBlock();
				} else {					
					handler.showFavouriteImages();
				}
		 
				return false; 
		});
        
        if (favButton) {
            menuButtons['fav'] = favButton.parentNode;
            favCounter = getChildByTag(favButton, 'span');
            if (isMainDomain()) favCounter.innerHTML = fav.items.length;
        }
        
        var tweakButton = createMainMenuButton('Настройки страницы', function() { handler.showTweaksDialog(); return false; });
        if (tweakButton) {
            menuButtons['tweak'] = tweakButton.parentNode;
        }
        
        // add fav container
        
        siteContent = document.getElementById(environment.mainContentContainer);
        
        if (siteContent) {
        
            favContent = document.createElement('div');
            favContent.className = 'kellyJRFavContainer';
            
            siteContent.parentNode.appendChild(favContent);
        } else {
            log('main container inner not found')
        }
        
		head.appendChild(style);
        
        return true;
    }
    
    function createMainMenuButton(name, onclick) {
        
        var submenu = document.getElementById('submenu');
        
        // todo positioning for post view pages
        
        var menuButtonContainer = document.createElement('div');
            menuButtonContainer.className = 'submenuitem';
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
        var nameContainer = getElementByClass(postBlock, 'uhead_nick');
        if (nameContainer) {
            var img = getElementByClass(postBlock, 'avatar');
            if (img) return img.getAttribute('alt');
        }
        
        return false;
    }
    
    function getCommentUserName(comment) {
        var nameContainer = getElementByClass(comment, 'reply-link');
        if (nameContainer) {   
                var a = getElementByTag(nameContainer, 'A');
                if (a) return a.textContent || a.innerText || '';
        }
        
        return false;
    }
    
    function getCommentsList(postBlock) {    
        
        var postFooter =  getElementByClass(postBlock, 'ufoot');
        if (!postFooter) return false;
        
        var list =  getElementByClass(postFooter, 'post_comment_list');
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
	
	// обрываем загрузку если что то не успело загрузится. При сценариях - смена страницы \ закрытие блока с избранными картинками и т.п.
    
    this.unloadFavPage = function() {
                
        if (images && images.length) {
            // clear images if still something loading
            for (var i = 0; i < images.length; i++) {   
                    if (images[i].tagName == 'IMG') images[i].src = ''; 
            }
        }
        
    }
    
    // exit from Favourites plugin block
    
    this.hideFavoritesBlock = function() {
    
        siteContent.style.display = 'block';
        favContent.style.display = 'none';
        handler.removeEventListener(window, 'scroll', 'fav_scroll');

        handler.unloadFavPage();
        
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
    
        var contentContainer = getElementByClass(comment, 'txt');
        
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
            content = getElementByClass(content, 'txt');
        } else {
            content = getElementByClass(content, 'post_content');
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
    
        var linkSpan = postBlock.getElementsByClassName('link_wr');
        var inFav = -1;
        
        if (!linkSpan.length) { 
            
            log('bad postcontainer');
            return false;
        
        }
        
        var link = getRelativeUrl(getChildByTag(linkSpan[0], 'a').href);
               
        for (var i = 0; i < fav.items.length; i++) {
            
            // subdomain main differ but relative path always keeps the same
           
            if (getRelativeUrl(fav.items[i].link).indexOf(link) != -1 && !fav.items[i].commentLink) { // its not comment and post in favourites
                inFav = i;
                break;
            }
        }
    
        var addToFav = getElementByClass(postBlock, 'kellyJRFavDialogButton');
    
        // create if not exist
        
        if (!addToFav) {
            addToFav = document.createElement('a');
            addToFav.className = 'kellyJRFavDialogButton';
            addToFav.href = '#';
            
            var addToFavSpan = document.createElement('span');
                addToFavSpan.appendChild(addToFav);
                addToFavSpan.className = 'kellyJRFav';
                
            linkSpan[0].parentNode.insertBefore(addToFavSpan, linkSpan[0]);    
        }
        
        // update title
        
        if (inFav != -1) {
            addToFav.onclick = function() { handler.showRemoveFromFavDialog(inFav, postBlock); return false; };
            addToFav.innerHTML = 'Удалить из избранного';
        } else {
            addToFav.onclick = function() { handler.showAddToFavDialog(postBlock); return false; };
            addToFav.innerHTML = 'Добавить в избранное';
        }
        
        
        return true;
            
    }
	
	function getCommentLink(comment) {
			
			if (!comment) return '#';
			
			var links = comment.getElementsByTagName('a');
            
            for (var b = 0; b < links.length; b++) {
                if (links[b].href.indexOf('#comment') != -1) {
                    return links[b].href;                    
                }
            }
			
			return '#';
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
			var link = getCommentLink(comments[i]);
			var inFav = -1;
			
			if (link != '#') {
				
				for(var b = 0; b < fav.items.length; b++) {
					if (fav.items[b].commentLink && fav.items[b].commentLink.indexOf(link) != -1) {
						inFav = b;
						break;
					}
				}
				
			}
				
			if (inFav != -1) {
				
				addToFavButton.setAttribute('itemIndex', inFav);
				addToFavButton.onclick = function() { handler.showRemoveFromFavDialog(this.getAttribute('itemIndex'), block); return false; };
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
        
        var commentsBlock = postBlock.getElementsByClassName('comment_list_post'); // getElementByClass(postBlock, 'comment_list_post'); // check is block loaded  
               
        if (!commentsBlock.length) { // todo exit after num iterations        
            commentsBlockTimer[postBlock.id] = setTimeout(function() { handler.onPostCommentsShowClick(postBlock, true); }, 100);
            return false;
        }
                       
        formatComments(postBlock);
        return false;
    }
    
    // https://stackoverflow.com/questions/1977871/check-if-an-image-is-loaded-no-errors-in-javascript
    //
    
    function imgLoaded(imgElement) {
        var favItemIndex = parseInt(imgElement.getAttribute('itemIndex'));
        
        if (imgElement.getAttribute('error')) return true;
        
        if (!fav.items[favItemIndex]) {
            console.log('fav item not found ' + favItemIndex);
            return true;
        }
        
        if (fav.items[favItemIndex].pw) return true;
                        
        if (!imgElement.src) return true; // return true if bad image 
    
        var loaded = imgElement.complete && imgElement.naturalHeight !== 0;
        if (loaded) {
            handler.saveWH(imgElement, favItemIndex); // Important to save Width \ Height before leave
            return true;
        } else return false;
    }
    
    // fires when clicked on fav element preview and full size image loaded
            
    this.onFavImageLoad = function(el, onError) {
        //el.setAttribute('loaded', '1');
        
        if (onError || !el.naturalWidth || !el.naturalHeight) {
            el.setAttribute('error', '1');
            el.style.display = 'none';
        }
    }
    
    /* proportional resize by width or height */
    
	function getResizedInfo(resizeTo, info, resizeBy) 
	{		 
        var k;
        
		if (resizeBy == 'width') {
			k = info[resizeBy] / resizeTo;
			info.height = Math.ceil(info.height / k);
		} else {
			k = info[resizeBy] / resizeTo;
			info.width = Math.ceil(info.width / k);
		}
		
		info[resizeBy] = resizeTo;
		return info;
	}	 
    
    function resizeImagesRow() {
    
       // log ('format row , length : ' + imagesRow.length + ' heigth ' + imagesRowHeight + ' width ' + imagesRowWidthReq)
        if (!imagesRow.length) return false;
		
		var width = 0; // counter		
               
        // count total width of row, and resize by required row height
        for (var i=0; i <= imagesRow.length-1; ++i){ 
        
            imagesRow[i] = getResizedInfo(imagesRowHeight, imagesRow[i], 'height');
			width += parseInt(imagesRow[i].width); 
            
        }
        
      //  log ('row width ' + width);
		
		// get required row width by resizing common bounds width \ height
		// lose required height, if some proportions not fit
		
        var requiredWidth = Math.floor(imagesRowWidthReq);
		var required = getResizedInfo(imagesRowWidthReq, {width : width, 'height' : imagesRowHeight}, 'width');
		
        // finally resize image by required recalced height according to width
        
        var currentRowWidth = 0;
        for (var i=0; i <= imagesRow.length-1; ++i){ 
            imagesRow[i] = getResizedInfo(required.height, imagesRow[i], 'height');
            currentRowWidth += imagesRow[i].width;
            if (currentRowWidth > requiredWidth) imagesRow[i].width = imagesRow[i].width - (currentRowWidth - requiredWidth); // correct after float operations
            
            //imagesRow[i].image.width = imagesRow[i].width;
            //imagesRow[i].image.height = imagesRow[i].height; 
            imagesRow[i].image.style.width = imagesRow[i].width + 'px';
            imagesRow[i].image.style.height = imagesRow[i].height + 'px'; 
            /* 
            var container = getParentByClass(imagesRow[i].image, 'kellyFavListItem');
            if (container) {
                container.style.width = imagesRow[i].width + 'px';
                container.style.height = imagesRow[i].height + 'px';
            }
            */
        }

        portrait = 0;
        landscape = 0;
        imagesRow = new Array();
    }
    
    this.updateImageGrid = function(clearTimer) {

        if (clearTimer) {
            clearTimeout(imageGridTimer);
            imageGridTimer = false;            
        }
        
        if (imageGridTimer) return false;
        
        if (!imagesBlock) return false;
        
        // kellyFavPreviewImg
        // images = imagesBlock.getElementsByTagName('img');
        images = imagesBlock.getElementsByClassName(env.className + '-preview');
        imagesLoaded = 0;
        
        // todo - if image broken - it stucks
        
        var unloaded = '';
        
        for (var i = 0; i < images.length; i++) {   
            
            if (images[i].tagName != 'IMG') { // text previews without image
                
                imagesLoaded++;
            
            } else if (imgLoaded(images[i])) {
             
                imagesLoaded++;
                
            } else {
            
                unloaded += images[i].src + ',';
            
            }
        }
        
       
        // if (imageGridTimerSec > 5) console.log(unloaded);
        
        if (imagesLoaded == images.length) {
                
                imageGridTimerSec = 0;
                log('images loaded : ' + images.length);
                landscape = 0;
                portrait = 0;
                imagesRow = new Array();        
                
                var screenSize = imagesBlock.getBoundingClientRect().width; 
                
                imagesRowWidthReq =  Math.floor(screenSize); 
                
                if (screenSize < imagesRowWidthReq) imagesRowWidthReq = screenSize;
                 
                 /*
                for (var i in images)
                {
                    if( typeof images[i] == 'object' ){
                        console.log( images[i] );
                    }
                }
                 */
                 
                for (var i=0; i <= images.length-1; i++){ 
                
                     //  if (images[i].getAttribute('itemindex')) console.log(images[i].getAttribute('itemindex'))
                
                    if (images[i].getAttribute('error')) {
                        console.log('updateImageGrid error during load image');
                        console.log(images[i]);
                        images[i].style.display = 'none';
                        continue;
                    }
                    
                    var imageInfo = {
                        portrait : false,
                        image : images[i],
                        width : 0,
                        height : 0,
                    };
                        
                    if (images[i].tagName == 'IMG') {
                    
                        var favItemIndex = images[i].getAttribute('itemIndex');
                        if (!fav.items[favItemIndex]) {
                            console.log('updateImageGrid fav item not found ' + favItemIndex);
                            continue;
                        }                        
                    
                        if (!fav.items[favItemIndex].pw) fav.items[favItemIndex].pw = 0;
                        if (!fav.items[favItemIndex].ph) fav.items[favItemIndex].ph = 0;
                        
                        
                        imageInfo.width = parseInt(fav.items[favItemIndex].pw);
                        imageInfo.height = parseInt(fav.items[favItemIndex].ph);
                        
                        
                    } else {
                    
                        var commentText = images[i].textContent || images[i].innerText || ''
                        
                        var size = Math.ceil(commentText.length / 100) * 50;
                        
                        imageInfo.width = size;
                        imageInfo.height = size;
                    }
                                        
                    if (!imageInfo.width || !imageInfo.height) {
                        log(images[i].src + ' has empty information about width and height');
                        images[i].style.display = 'none';
                        continue;
                    }
                    
                    if (imageInfo.width < imageInfo.height) imageInfo.portrait = true;   
                   
                    if (imageInfo.portrait) portrait++;
                    else landscape++;
                    
                    imagesRow.push(imageInfo);
                    
                    if (i + 2 >= images.length) continue; // dont keep last one alone
                    
                    if (landscape == 1 && portrait >= 2) {
                        resizeImagesRow();
                    } else if (landscape == 2) {
                        resizeImagesRow();
                    } else if (portrait == 4) {
                        resizeImagesRow();
                    }
                }
                
                resizeImagesRow();
        } else {
            imageGridTimerSec += 0.1;
            imageGridTimer = setTimeout(function() { handler.updateImageGrid(true); }, 100);
        }
    }
    
    this.showLocalStorage = function() {
    
        var textArea = getElementByClass(favContent, 'kellyLocalStorage');
            textArea.style.display = 'block';
            textArea.value = JSON.stringify(fav);
            
        getElementByClass(favContent, 'kellyShowLocalStorage').style.display = 'none';
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
    
        if (getElementByClass(favContent, 'kellyAutoScroll').checked) {
            fav.tweaks.autoload_onscroll = true;
        } else {
            fav.tweaks.autoload_onscroll = false;
        }
        
        fav.tweaks.commentsBlacklist = getVarList(getElementByClass(favContent, 'kellyBlockcomments').value);
        fav.tweaks.postsBlacklist = getVarList(getElementByClass(favContent, 'kellyBlockposts').value);
        
        getElementByClass(favContent, 'kellyTweaksMessage').innerHTML = 'Настройки сохранены';
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
        
        if (menuButtons['tweak'].className.indexOf('active') !== -1) {
            handler.hideFavoritesBlock();
            return false;
        }
        
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
                
        var checked = '';
        if (fav.tweaks.autoload_onscroll) {
            checked = 'checked';
        }
        
        output += '<div><label><input type="checkbox" ' + checked +' class="kellyAutoScroll">Автоматическая загрузка следующей страницы при скролле</label></div>'; // todo check displayedImages array
        
        // favContent.innerHTML += '<div>Количество элементов на страницу : <input type="text" value="" class="kellyItemsPerPage">';
        
        output += '<div><a href="#" class="kellyTweaksSave">Сохранить</a></div>';
        output += '<div class="kellyTweaksMessage"></div>';
        
        
        output = '<div class="kellyJRFavContainer-page">' + output + '</div>';
        
        favContent.innerHTML = output;
        
        // todo сохранение замены массива
        getElementByClass(favContent, 'kellyShowLocalStorage').onclick = function() {
            handler.showLocalStorage();
            return false;
        }
        
        getElementByClass(favContent, 'kellyTweaksSave').onclick = function() {
            handler.updateTweaksConfig();
            return false;
        }
        
        displayFavouritesBlock('tweak');
        
        /*
        modalBoxMessage.innerHTML = '';
        
        var checked = '';
        
        if (fav.tweaks.hide_sidebar) checked = 'checked';
        
        modalBoxContent.innerHTML = '<checkbox class="kellyTweakHideSidebar" ' + checked + '> Скрыть боковую панель'; // todo сделать кнопку сразу возле панели
        
        getElementByClass(modalBoxContent, 'kellyTweakHideSidebar').onclick = function() { 
        
            if (this.checked) this.hideSidebar(true);
            else this.hideSidebar(false);
            
        }
        
        handler.showModal();
        */
    }
    
    this.extendCats = function(id, remove, checkbox) {
        
        var catIndex = extendCats.indexOf(id);
        if (catIndex != -1 && !remove) return false;
        if (catIndex == -1 && remove) return false;
        
        if (remove) extendCats.splice(catIndex, 1);
        else {
            extendCats[extendCats.length] = id;
        }
        
        if (checkbox) {
            var tag = getParentByTag(checkbox, 'li');
            
            if (tag) {
                tag.className = tag.className.replace('includable', '');
                
                if (!remove) tag.className += ' includable';
                tag.className = tag.className.trim();
            }
        }
        
        console.log(extendCats);
        
        return true;
    }
    
    function updatePostCatList(index, list) {
            
        list.innerHTML = '';
        
        if (fav.items[index].categoryId) {
        
            for (var b = 0; b < fav.items[index].categoryId.length; b++) {
                
                var tagItem = document.createElement('div');
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
        
        var startItem = (page - 1) * perPage;
        var end = startItem + perPage-1;         
        if (end > displayedItems.length-1) end = displayedItems.length-1;
        
        log(startItem + ' | ' + end + ' | ' + displayedItems.length);
        var galleryImages = [];
        
        for (var i = 0; i <= displayedItems.length-1; i++) {
        
            var item = displayedItems[i].item;
            
            // whole gallery images array for current selector
            
            var galleryIndex = galleryImages.length;
            galleryImages[galleryIndex] = getPreviewImageByItem(item);

            // current page displayed images
            
            if (i < startItem || i > end) continue;
            
            var index = displayedItems[i].index; // fav.items[index]
               
            var itemBlock = document.createElement('div');
                itemBlock.className = 'kellyFavListItem';
                itemBlock.style.lineHeight = '0px'; // prevent unexpected spaces
                itemBlock.style.margin = '0px'; 
                itemBlock.style.padding = '0px'; 
            
            var collectionBtn = false;
            var imageCount = 0;
			
			itemBlock.setAttribute('itemIndex', index);
			
                if (!getPreviewImageByItem(item)) {
                
                    var text = 'Без изображения';
                    if (item.name) text = item.name + '<br>' + text;
                    if (item.text) text = item.text + '<br>' + text;
                    
                    itemBlock.innerHTML = '<div class="' + env.className + '-preview" itemIndex="' + index + '"><div class="' + env.className + '-preview-text">' + text + '</div></div>';
                
                } else {
                    
                    // todo add addition images to image viewer 
                    imageCount = 1;
                    
					if (typeof item.previewImage !== 'string') imageCount = item.previewImage.length;
                    
                    var additionAtributes = '';
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
                        
                            imgViewer.acceptEvents(handler.getFavItems()[this.getAttribute('itemIndex')].previewImage, 'collection');
                            imgViewer.loadImage(this);   
                            
                            return false;
                        }
                        
                    }
                    // todo replace
                    //getImageDownloadLink(galleryImages[galleryIndex], true)
                    itemBlock.innerHTML = '<img class="' + env.className + '-preview" itemIndex="' + index + '" ' + additionAtributes + ' kellyGalleryIndex="' + galleryIndex + '" kellyGallery="fav-images" src="' + galleryImages[galleryIndex] + '">';
                
                }
                        
            var catListSpan = document.createElement('span');
                catListSpan.id = 'kelly-cat-list-post' + index;
                catListSpan.className="kellyFavListItem-tags";
        
            updatePostCatList(index, catListSpan);
            
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
				if (imageCount > 1) {
					
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
				
					imgViewer.acceptEvents(this.getAttribute('imageSet').split(','), 'hdsource');
					imgViewer.loadImage(this);   
					
					return false;
				}
			}
			
            // блок дополнительной информации о публикации со списком категорий
            var itemInfo = document.createElement('div');
                itemInfo.className = 'kellyFavListItem-info';
                itemInfo.id = 'kelly-fav-item-info' + index;
                itemInfo.innerHTML = ''; 
                
                if (item.commentLink) {
                
                    itemInfo.innerHTML += '<a href="' + item.commentLink + '" target="_blank">Показать комментарий</a><br>'
                
                }
                
            var removeItem = document.createElement('a');
                removeItem.setAttribute('itemIndex', index);
                
				
                removeItem.onclick = function() { 
                
					var updateFavPage = function() { handler.showFavouriteImages(); };
					handler.showRemoveFromFavDialog(this.getAttribute('itemIndex'), false, updateFavPage, updateFavPage);
					
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
            itemInfo.appendChild(catListSpan);
            
            var itemBlockAdditions = document.createElement('DIV');
                itemBlockAdditions.className = 'kellyFavListItem-additions';
                
            if (collectionBtn) itemBlockAdditions.appendChild(collectionBtn);
            
            itemBlock.appendChild(itemBlockAdditions);
        
            itemBlock.onmouseover = function() {                
                
                if (readOnly) return false;
                
                var itemIndex = this.getAttribute('itemIndex');
                
                var itemInfo = document.getElementById('kelly-fav-item-info' + itemIndex )
                
                itemInfo.style.display = 'inline-block';
                //var catList = document.getElementById('kelly-cat-list-post' + itemIndex )
                itemInfo.style.marginBottom = '-' + itemInfo.getBoundingClientRect().height + 'px'; 
                itemInfo.style.minHeight = itemInfo.getBoundingClientRect().height + 'px'; 
            }  
                
            itemBlock.onmouseout = function() {    
                
                if (readOnly) return false;
                
                var itemIndex = this.getAttribute('itemIndex');
                var itemInfo = document.getElementById('kelly-fav-item-info' + itemIndex )
                
                itemInfo.style.display = 'none';
            }  
                
            itemBlock.appendChild(itemInfo);
            itemBlock.appendChild(postLink);
			if (postHd) itemBlock.appendChild(postHd);
            
            
            imagesBlock.appendChild(itemBlock);
        }
        
        // init gallery only for current page
        // create gallery, by array
        imgViewer.acceptEvents(galleryImages, 'fav-images');
        
        // connect events to current image elements
        var galleryEl= imagesBlock.getElementsByTagName('img');
        
        for (var i = 0, l = galleryEl.length; i < l; i++)  {
            galleryEl[i].onclick = function() {
                imgViewer.loadImage(this);
                return false;
            }
            
            galleryEl[i].onload = function() {
                handler.onFavImageLoad(this, false);
            }
            
            galleryEl[i].onerror = function() {
                handler.onFavImageLoad(this, true);
            }
        }	
        
        if (!print) {
            updatePagination(document.getElementById('kelly-pagination'));
        }
        
        return imagesBlock;
    }
	  
    // autoloading next page on scroll if close to bottom
    
    this.checkLoadNextFavPage = function() {
        
        if (imageGridTimer !== false) return;
        
       // favContent.appendChild(imagesBlock);
        var favPos = getOffset(favContent);
		var offsetY = 200;
		var blockBottom = favPos.bottom - offsetY;
        
		if (blockBottom < (getViewport().scrollBottom + offsetY)) {
            console.log('load')
            handler.goToFavPage('next', true);
        }
        
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
      
        var managerContainer = getElementByClass(favContent, 'kellyFavDownloadManager');
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
        
        //downloadManager.createAndDownloadFile('test', 'test.txt');
    }
    
    // страницы сбрасываются только при смене фильтров
	
    this.showFavouriteImages = function() {
        
		handler.unloadFavPage();
		
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
		
        var controllsContainer = modalBoxContent;
        
        modalBoxMessage.innerHTML = '';
        controllsContainer.innerHTML = '';
                
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
            no.innerHTML = '+ Теги';
            
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
            
        var additionButtons = document.createElement('div');
            additionButtons.className = 'kellyAdditionButtons';
		    additionButtons.appendChild(resetButton);
            additionButtons.appendChild(editButton);
            additionButtons.appendChild(download);
            
            typeFiltersContainer.appendChild(logicButton);
            additionButtons.appendChild(no);
            
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
                var filterChecked = '';
                if (extendCats.indexOf(fav.categories[i].id) != -1) {
                    filterChecked = 'checked';
                    filter.className += ' includable';
                }
                
                var isNSFWChecked = '';
                if (fav.categories[i].nsfw) isNSFWChecked = 'checked';
                // todo показывать кол-во элементов
                
                var tooltip = '\
                <div class="kellyFavFiltersMenu-tooltip" id="kelly-filter-edit-' + i + '" style="display : none; width : 200px;">\
                    <label><input class="kellyFavFiltersMenu-check" id="kelly-filter-check-' + i + '" type="checkbox" itemId="' + fav.categories[i].id + '" ' + filterChecked + '> Отметить для добавления к изображению</label>\
                    <label><input class="kellyFavFiltersMenu-nsfw" id="kelly-filter-nsfw-' + i + '" type="checkbox" itemId="' + fav.categories[i].id + '" ' + isNSFWChecked + '> NSFW </label>\
                    <br><input class="kellyFavFiltersMenu-newname" id="kelly-filter-newname-' + i + '" type="text" value="" placeholder="новое название"><a class="kellyFavFiltersMenu-newname-button" itemIndex="' + i + '" href="#">Изменить</a>\
                </div>';
                
                filter.innerHTML = tooltip;
                
                var renameButton = getElementByClass(filter, 'kellyFavFiltersMenu-newname-button');
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
                
                var catExtender = getElementByClass(filter, 'kellyFavFiltersMenu-check'); // document.getElementById('kelly-filter-check-' + i); - not found
                filter.onmouseover = function () { 
                
                    if (readOnly) return false; 
                    
                    var id = 'kelly-filter-edit-' + this.getAttribute('itemIndex');
                    var tooltip = document.getElementById(id)
                        tooltip.style.display = 'block';
                    
                        tooltip.style.marginBottom = '-' + tooltip.getBoundingClientRect().height + 'px'; 
                        
                        var tooltipPos = tooltip.getBoundingClientRect();
                        console.log(tooltipPos.left + tooltipPos.width)
                        console.log(screen.width);
                        if (screen.width < tooltipPos.left + tooltipPos.width) {
                            tooltip.style.left = '-' + (tooltipPos.width / 2) + 'px';
                        }
    
                }
                
                filter.onmouseout = function() {
                
                    if (readOnly) return false;

                    var id = 'kelly-filter-edit-' + this.getAttribute('itemIndex');
                    document.getElementById(id).style.display = 'none';
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
              
                /*
                var catExtender = document.createElement('input');
                    catExtender.setAttribute('type', 'checkbox');
              
                if (extendCats.indexOf(fav.categories[i].id) != -1) {
                    catExtender.checked = true;
                }
                */
                
                filter.appendChild(catSelector);
                //filter.appendChild(catExtender);
                filtersMenu.appendChild(filter);
                
                //catExtender.setAttribute('itemId', fav.categories[i].id);
                catExtender.onclick = function() { 
                    var remove = true;
                    if (this.checked) remove = false;
                    
                    handler.extendCats(parseInt(this.getAttribute('itemId')), remove, this); 
                }
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
    
    this.updateModalBlockPosition = function() {
        if (!modalBox) return false;
        
        var sideBar = document.getElementById('sidebar');
        var minTop = 0;
        
        if (sideBar) {
            minTop = sideBar.getBoundingClientRect().top;
        }
        
        // screen.height / 2  - (modalBox.getBoundingClientRect().height / 2) - 24
        var modalBoxTop = 24;
        
        if (modalBoxTop < minTop) modalBoxTop = minTop;
        
        var scrollTop = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0);
        
        modalBox.style.top = modalBoxTop + scrollTop  + 'px';
    }
    
    this.closeModal = function() {
        modalBox.style.display = 'none';
        
        var sideBar = document.getElementById('sidebar');
        if (sideBar) {
            sideBar.style.visibility = 'visible';
            sideBar.style.opacity = '1';
        }
    }
    
    this.showModal = function(hideHeader) {
        modalBox.style.display = 'block';
        
        var sideBar = document.getElementById('sidebar');
        var header = getElementByClass(modalBox, 'kellyModalHeader');
          
        if (sideBar) {
            sideBar.style.visibility = 'hidden';
            sideBar.style.opacity = '0';
            modalBox.style.right = 'auto';
            modalBox.style.left = Math.round(sideBar.getBoundingClientRect().left) + 'px';
            modalBox.style.width = Math.round(sideBar.getBoundingClientRect().width) + 24 + 'px';
        }
        
        if (hideHeader) {
            header.style.display = 'none';
          
        } else {
            header.style.display = 'block';
        }
        
        handler.updateModalBlockPosition();
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
        
        if (index !== false) {
            if (fav.items[index].previewImage) {
                fav.items[index].pw = imageWH.width;
                fav.items[index].ph = imageWH.height;
            }   
            
            save();
        } else {
        
            // unused
            var changes = false;
            for (var i = 0; i < fav.items.length; i++) {
                                
                if (!fav.items[i].pw && getPreviewImageByItem(fav.items[i]).indexOf(fileName) != -1) {
                    fav.items[i].pw = imageWH.width;
                    fav.items[i].ph = imageWH.height; 
                    changes = true;
                }
                
            }
            
            if (changes) save();
        }
    }
    
    this.switchPreviewImage = function(next) {
        if (!selectedImages) return false;
        if (selectedImages.length <= 1) return false;
        var previewImage = getElementByClass(modalBoxContent, 'kellyPreviewImage');
        
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
        previewImage.onload = function() { return false; } // todo after change image width \ height may be wrong, may be recreate DOM img element helps
        
        handler.setSelectionInfo('dimensions', false);
        //console.log( previewImage.src );
    }
    
	// todo postBlock is unimportant here, remove
	
    this.showRemoveFromFavDialog = function(itemIndex, postBlock, onRemove, onCancel) {
    
        if (!fav.items[itemIndex]) {
			log('attempt to remove unexist item ' + itemIndex);
			return false;
		}
        
        modalBoxMessage.innerHTML = '';
        
        var html = '<p>Подтвердите удаление</p>';
            html += '<p><a href="#" class="' + environment.className + 'Remove">Удалить</a>';
            html += '<a href="#" class="' + environment.className + 'Cancel">Отменить</a></p>';       
        
        modalBoxContent.innerHTML = '<div class="' +  environment.className + '-removeDialog">' + html + '</div>';
         
        getElementByClass(modalBoxContent, environment.className + 'Cancel').onclick = function() {

			if (onCancel) {
				onCancel();
			} else {
				handler.closeModal();  
			} 
			
			return false; 
		}
        getElementByClass(modalBoxContent, environment.className + 'Remove').onclick = function() { 
			
			handler.itemRemove(itemIndex, postBlock);  
						
			if (onRemove) {
				onRemove();
			} else {
				handler.closeModal();  
			} 
			
			return false; 
		}
        
        handler.showModal();
        handler.updateModalBlockPosition();
        return false;
    }
    
    this.showAddToFavDialog = function(postBlock, comment) {
        
        if (!postBlock) return false;
        
        modalBoxMessage.innerHTML = '';
        
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
        
        var catsAddHTML = '<input type="text" placeholder="Название новой категории" value="" class="' + environment.className + 'CatName">';
            //catsAddHTML += '<label><input type="checkbox" class="' + environment.className + 'CatIsNSFW"> NSFW категория</label>';
            catsAddHTML += '<ul><li><a href="#" class="' + environment.className + 'CatAdd">Добавить категорию</a></li>';
            catsAddHTML += '<li><a href="#" class="' + environment.className + 'CatCreate">Создать категорию</a></li>';
            catsAddHTML += '<li><a href="#" class="' + environment.className + 'CatRemove">Удалить категорию</a></li></ul>';
        var catsHTML = '<option value="-1">Без категории</option>';
        
        for (var i = 0; i < fav.categories.length; i++) {
            var selected = '';
            
            //if (fav.last_cat == fav.categories[i].id) selected = 'selected';
            
            catsHTML += '<option value="' + fav.categories[i].id + '" ' + selected + '>' + fav.categories[i].name + '</option>';
        }
        
        catsHTML = '<select class="' + environment.className + 'Cat">' + catsHTML + '</select>';
        
        var savePostHTML = '<input type="text" placeholder="Название" value="" class="' + environment.className + 'Name"><a href="#" class="' + environment.className + 'Add">Сохранить</a>';
        
        var bO = '<div>';
        var bC = '</div>';
        
        var categoryListHTML = '<div class="kellyJRCategoryList"></div>'; 
        var img = '';
        
        if (selectedImages.length > 1) {
            img += 'Основное изображение <a href="#" class="kellyPreviewImage-del">Удалить</a><a href="#" class="kellyPreviewImage-prev">Предыдущее</a><a href="#" class="kellyPreviewImage-next">Следующее</a><br>';
        }
        
        if (selectedImages.length) {
            
            img += '<div class="kellyPreviewImage-container"><img src="' + getStaticImage(selectedImages[0]) + '" class="kellyPreviewImage"></div>';
        }
        
        modalBoxContent.innerHTML = img + bO + catsAddHTML + bC + bO + catsHTML + bC + bO + savePostHTML + bC + categoryListHTML;
        
        getElementByClass(modalBoxContent, 'kellyPreviewImage-prev').onclick = function() { handler.switchPreviewImage(-1); return false; }
        getElementByClass(modalBoxContent, 'kellyPreviewImage-next').onclick = function() { handler.switchPreviewImage(1); return false; }
        getElementByClass(modalBoxContent, 'kellyPreviewImage-del').onclick = function() { handler.switchPreviewImage(0); return false; }
        
        
        getElementByClass(modalBoxContent, 'kellyPreviewImage').onload = function() {
            
            var dimensions = {width : parseInt(this.naturalWidth), height : parseInt(this.naturalHeight)};
            
            handler.setSelectionInfo('dimensions', dimensions);
            
            console.log('get width and height for ' + this.src);
            console.log(dimensions);
            
            handler.updateModalBlockPosition(); 
            /*handler.saveWH(this, false);*/ 
            return false; 
        }
        
        getElementByClass(modalBoxContent, environment.className + 'CatAdd').onclick = function() { handler.categoryAdd(); return false; }        
        getElementByClass(modalBoxContent, environment.className + 'CatCreate').onclick = function () { handler.categoryCreate(); return false; }
        getElementByClass(modalBoxContent, environment.className + 'CatRemove').onclick = function () { handler.categoryRemove(); return false; }

        getElementByClass(modalBoxContent, environment.className + 'Add').onclick = function () { handler.itemAdd(); return false; }
                
        var list = getElementByClass(modalBoxContent, 'kellyJRCategoryList');    

        if (fav.selected_cats_ids.length) {
        
            for (var i = 0; i < fav.selected_cats_ids.length; i++) {
                if (getCategoryById(fav.selected_cats_ids[i]).id == -1) {
                    continue;
                } 
                
                list.appendChild(createCatExcludeButton(fav.selected_cats_ids[i]));
            }
            
        }            
        
        handler.updateModalBlockPosition();
        return false;
    }
    
    // noSave = true - only return new item without save and dialog
    
    this.itemAdd = function(noSave) {
        
        if (!selectedPost) return false;
                          
        var postItem = { 
            categoryId : [], 
            previewImage : '', 
            link : '', 
            name : getElementByClass(modalBoxContent, 'kellyJRFavName').value,
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
            var nativeTags = getElementByClass(selectedPost, 'taglist');
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
        
        //var firstImageBlock = getElementByClass(selectedPost, 'image');
        if (selectedComment) {
        
            var text = getCommentText(selectedComment);
            if (text) postItem.text = text;

            postItem.commentLink = getCommentLink(selectedComment);
        } 

        if (selectedImages.length == 1) postItem.previewImage = selectedImages[0];
        else if (selectedImages.length > 1) {
            var previewImage = getElementByClass(modalBoxContent, 'kellyPreviewImage');
            
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
        
        var linkSpan = getElementByClass(selectedPost, 'link_wr');
        if (linkSpan) postItem.link = getChildByTag(linkSpan, 'a').href;           
        
        if (!postItem.link) {
            
            if (noSave) modalBoxMessage.innreHTML = 'Публикация не имеет ссылки';
            return false;
            
        }
        
        if (noSave) return postItem;
        
        for (var i = 0; i < fav.items.length; i++) {
            
            if (
                (!selectedComment && fav.items[i].link.indexOf(postItem.link) != -1) || 
                (selectedComment && fav.items[i].commentLink && fav.items[i].commentLink.indexOf(postItem.commentLink) != -1)) 
            {
                fav.items[i] = postItem;
                modalBoxMessage.innerHTML = 'Избранная публикация обновлена';
                save();
                return false;
            }
        }
        
        modalBoxMessage.innerHTML = 'Публикация добавлена в избранное';
        
        fav.items[fav.items.length] = postItem;
        if (favCounter) favCounter.innerHTML = fav.items.length;
        
    
		formatPostContainer(selectedPost);
        console.log(postItem);
        save();
        
        return true;
    }
    
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
    
    this.categoryRemove = function() {
        
        if (!modalBox) return;
        
        var name = modalBoxContent.getElementsByClassName('kellyJRFavCatName')[0].value;
        name = name.trim();
        if (!name) {
            modalBoxMessage.innerHTML = 'Введите название категории для подтверждения удаления';
            return false;
        }
        
        for (var i = 0; i < fav.categories.length; i++) {
            if (fav.categories[i].name == name) {
            
                var removeCatId = fav.categories[i].id;
                
                // remove child posts
                 for (var b = 0; b < fav.items.length; b++) {                 
                    if (fav.items[b].categoryId.indexOf(removeCatId) !== -1) fav.items.splice(b, 1);
                 }
               
               // remove option from select
               
               var catSelect = modalBoxContent.getElementsByClassName('kellyJRFavCat')[0];
                for (var b = 0; b < catSelect.options.length; b++) {                 
                    if (catSelect.options[b].value == removeCatId) catSelect.remove(b);
                 }
               
               // x.options[x.selectedIndex]
               
               fav.categories.splice(i, 1);
               modalBoxMessage.innerHTML = 'Категория с указаным названием удалена';
               fav.selected_cats_ids = validateCategories(fav.selected_cats_ids);
               
               save();
               return false
                
            }
        }
        
        modalBoxMessage.innerHTML = 'Категория с указаным именем не найдена';
        
       return false;
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
        if (data.name) {
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
    
        var list = getElementByClass(modalBoxContent, 'kellyJRCategoryList');
        if (!list) return false;
        
        var catSelect = getElementByClass(modalBoxContent, environment.className + 'Cat');       
        var newCatId = parseInt(catSelect.options[catSelect.selectedIndex].value);
                
        if (fav.selected_cats_ids.indexOf(newCatId) !== -1) return false;
        
        if (getCategoryById(newCatId).id == -1) return false;
        
        fav.selected_cats_ids[fav.selected_cats_ids.length] = parseInt(newCatId);
        
        list.appendChild(createCatExcludeButton(newCatId));
        
        save();
    }
    
    this.categoryCreate = function() {
        
        if (!modalBox) return;
        
        var name = getElementByClass(modalBoxContent, environment.className + 'CatName').value;
        name = name.trim();
                
        var catIsNSFW = getElementByClass(modalBoxContent, environment.className + 'CatIsNSFW');
        if (catIsNSFW && catIsNSFW.checked) catIsNSFW = true;
        else catIsNSFW = false;
        
        if (!name) {
            modalBoxMessage.innerHTML = 'Введите название категории';
            return false;
        }
        
        for (var i = 0; i < fav.categories.length; i++) {
            if (fav.categories[i].name == name) {
               
               modalBoxMessage.innerHTML = 'Категория с указаным именем уже существует';
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
        
        modalBoxMessage.innerHTML = 'Категория добавлена'; 

        save();
    }
    
    function getFavPageInfo() {
        var header = getElementByClass(document, 'mainheader');
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
        
        var pagination = getElementByClass(document, 'pagination_expanded');

        if (pagination) {
            info.page = parseInt(getElementByClass(pagination, 'current').innerHTML);
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
    
    this.saveNativeFav = function() {
    
        if (!favNativeParser || !favNativeParser.collectedData || !favNativeParser.collectedData.length) return false;
              
        var saveNewName = getElementByClass(document, 'kelly-SaveNewName');
        if (!saveNewName) return false;
        
        var storageName = storageName.value.trim();
        if (!storageName) return false;
        
        var rewrite = true;
        if (getElementByClass(document, 'kelly-SaveNoRewrite').checked) rewrite = false;
        
        // todo хранить группы и итемы вместе. до этого дальше не продолжить работу
        if (fav.storage != storageName) {
            var existItems = parseJSON(localStorage.getItem(fav.storage));
            if (!existItems) existItems = [];
        } else {
            var existItems = fav.items;
        }
        
        
    }
    
    this.onDownloadNativeFavPagesEnd = function() {
    
        var downloadBtn = getElementByClass(document, 'kelly-DownloadFav');
            downloadBtn.innerHTML = 'Скачать';
            
            getElementByClass(document, 'kelly-Save').style.display = 'block';
            
        var saveNew = getElementByClass(document, 'kelly-SaveFavNew');
            saveNew.onclick = function() {
                handler.saveNativeFav();
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
            items : [],
        }
        
        // todo collect reactor tags
        // check for duplicates on save in current storage by post url updatePostFavButton as example
        // exlude unnesessery data to improve load speed
        
            fav.selected_cats_ids = false;
            fav.select_native_tags = true;
            
        for (var i = 0; i < posts.length; i++) {
        
            selectedComment = false;
            selectedPost = posts[i];
            
            selectedImages = getAllMedia(posts[i]);
                                
            var postItem = handler.itemAdd(true);
            if (postItem) pageInfo.items[pageInfo.items.length] = postItem;
        }
                        
        worker.collectedData[worker.collectedData.length] = pageInfo;
        console.log(pageInfo);
        console.log(fav.native_tags);
        console.log('--');
        
        getElementByClass(document, 'kelly-DownloadFavProcess').innerHTML = 'Скачана страница ' + pageInfo.page + ' страниц в очереди ' + jobsLength + ' <br> ' + worker.errors;
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
        
        el.innerHTML = 'Загрузка... (Отменить)';   
        favNativeParser.collectedData = [];
        
        for (var i = 1; i <= favInfo.pages; i++) {
        
            favNativeParser.addJob(
                favInfo.url + i, 
                handler.onDownloadNativeFavPage, 
                false, 
                {page : i}
            );
         
        }
        
        favNativeParser.exec();
    }
    
    this.showNativeFavoritePageInfo = function() {
    
        var favPageInfo = getFavPageInfo();
        
        //todo тултип с инфой о пользователе - там и избранное но врятли нужно
        
        if (favPageInfo && favPageInfo.items) {
        
            var favPageInfoContainer = getElementByClass(document, 'kelly-FavNativeInfo'); 
            if (!favPageInfoContainer) {
                favPageInfoContainer = document.createElement('div');
                favPageInfoContainer.className = 'kelly-FavNativeInfo';
            }
            
            var saveBlock = '<div class="kelly-Save" style="display : none;"><a href="#" class="kelly-SaveFavNew" >Сохранить в новое хранилище</a><input class="kelly-SaveNewName" type="text" placeholder="идентификатор хранилища" value="user-fav-t1"><input type="checkbox" class="kelly-SaveNoRewrite"> Дополнить без перезаписи </div>';
            
            var items = favPageInfo.items;
            if (favPageInfo.pages > 2) {            
                items = '~' + items;
            }
            
            favPageInfoContainer.innerHTML = favPageInfo.url + '<br>Страниц : ' + favPageInfo.pages + ' (' + items + ')<br><a href="#" class="kelly-DownloadFav">Скачать</a>' + saveBlock + '<div class="kelly-DownloadFavProcess"></div>';
            favPageInfo.header.parentNode.insertBefore(favPageInfoContainer, favPageInfo.header.nextSibling);
            
            getElementByClass(document, 'kelly-DownloadFav').onclick = function() {
                handler.downloadNativeFavPage(this);
            };
        }
        
    }
    
    this.formatPostContainers = function() {
        var posts = document.getElementsByClassName('postContainer');
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
                
                if (imgViewer && imgViewer.getCurrentImage().image) return;
                
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

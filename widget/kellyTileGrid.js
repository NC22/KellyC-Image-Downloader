/*
   @encoding utf-8
   @name           KellyTileGrid
   @namespace      Kelly
   @description    image view widget
   @author         Rubchuk Vladimir <torrenttvi@gmail.com>
   @license        GPLv3
   @version        v 1.1.0 14.12.18
   
   ToDo : 
   
   todo docs and examples
   
*/

function KellyTileGrid(cfg) {
    
    var tilesBlock = false;
    var tileClass = 'image';
    var loadTimer = false;
    
    var tiles = false;
    var tilesBoundsEls = false;
    var tilesLoadState = false; // is proportions loaded, todo rename
    var tilesLoaded = false;
    
    var currentTileRow = [];
    var requiredWidth = false;
    var hideUnfited = false;
    
    var rowHeight = 250; // требуемая высота тайловой строки
    
    var updateAnimationFrame = true;
    
    var rules = {
        min : 2, // минимальное кол-во элементов в строке не зависимо от rowHeight
        heightDiff : 10, // допустимая погрешность по высоте для текущей строки элементов
        heightDiffLast : 20, // допустимая погрешность для последнего ряда
        unfitedExtendMin : 2, // для последнего ряда - подгоняем по ширине не обращая внимания на требуемую высоту если осталось указанное кол-во изображений невместифшихся в сетку с требуемой высотой
        fixed : false, // фиксированное кол-во элементов на строку (если = true - игнорирует опции heightDiffLast\ heightDiff \ rowHeight)
        tmpBounds : false, // временные пропорции до тех пор пока изображение не загружено. на время загрузки к тайлу добавляется класс tileClass + "-tmp-bounds" 
        lazy : false, // загружать только изображения в области видимости. Если для изображения не определены пропорции оно будет загружено сразу
        loadLimit : 10, // работает только в режиме lazy = true, максимальное кол-во загружаемых единовременно элементов
        minAspectRatio : 0.2, // картинка маркируется классом oversized, вызывается событие onBadBounds, при отсутствии пользовательского обработчика возвращающего пропорции, картинка скрывается         
        recheckAlways : false, // (если данные из недоверенного источника) вызывать события загрузки пропорций изображения даже если есть предварительно заданные через атрибуты данные о пропорция для их пост валидации
    };
    
    var handler = this;
    var events = { 
        onGridUpdated : false, // (handler, isAllBoundsLoaded) after updateTileGrid method
        
        getResizableElement : false, // (handler, tile) если метод задан - возвращать элемент к которому в тайле будет применены атрибуты width \ height, по умолчанию сам тайл
        getBoundElement : false, // (handler, tile) если метод задан - возвращать элемент из которого можно получить данные о пропорция тайла (свойства data-width \ data-height) , по умолчанию сам тайл
        
        isBoundsLoaded : false, // (handler, tile, boundEl) is element loaded
        // getScaleElement
        onBadBounds : false, // (handler, data[errorCode, error, tile, boundEl]) element is loaded, but bounds is unsetted or loaded with error 
        onResize : false, // (handler) window resize
        onLoadBounds : false, // (handler, boundEl, errorTriger) some of bounds element is ready, if user function return true tilegrid will not refresh, todo - return tile
        onResizeImage : false, // (handler, tileResizedInfo[origHeight, origWidth, width, height])
    };
    
    var lazyEvent = false;
    var loading = 0;
    
    this.eventsChecked = false;
    
    var imgEvents = {
        onLoadBoundsError : function(e) {
            onLoadBounds(this, 'error'); 
        },
        onLoadBoundsSuccess : function(e) {
            onLoadBounds(this, 'success'); 
        },
    };
    
    function constructor(cfg) {
        handler.updateConfig(cfg);
        
        window.addEventListener('resize', onResize);	
    }
    
    this.updateConfig = function(cfg) {
        
        if (!cfg) return false;
                
        if (typeof cfg.tilesBlock != 'undefined') {
            
            tilesBlock = cfg.tilesBlock;
            
            if (typeof tilesBlock == 'string') {
                tilesBlock = document.getElementById(tilesBlock.trim());
            }            
        }
        
        if (cfg.rowHeight) {
            rowHeight = cfg.rowHeight;
        }
        
        if (cfg.rules) {
        
            for (var k in rules){
                if (typeof rules[k] !== 'function' && typeof cfg.rules[k] !== 'undefined') {
                     rules[k] = cfg.rules[k];
                }
            }
        }
        
        if (rules.lazy && !lazyEvent) {
    
            lazyEvent = function() {
                updateTileGridEvents();
            }
    
            window.addEventListener('scroll', lazyEvent);
        }
        
        if (!rules.lazy && lazyEvent) {
            
            window.removeEventListener('scroll',  lazyEvent);	
            lazyEvent = false;
        }
        
        if (cfg.tileClass) {
            tileClass = cfg.tileClass;
        }
        
        if (cfg.hideUnfited) {
            hideUnfited = true;
        } else {
            hideUnfited = false;
        }
        
        // some synonyms for rules section
        
        if (cfg.type && cfg.type != 'fixed') {
            rules.fixed = false;
        }
        
        if (cfg.events) {
        
            for (var k in events){
                if (typeof cfg.events[k] == 'function') {
                     events[k] = cfg.events[k];
                }
            }
        }
        
        return true;
    }
    
    function onResize() {
        if (!tilesBlock) return;
        
        if (events.onResize && events.onResize(handler)) {
            return true;
        } 
        
        delayUpdateTileGrid();
        handler.reset();
    }
    
   function isBoundsLoaded(tile, boundEl) {
        
        if (!boundEl) {
            boundEl = handler.getBoundElement(tile);
        }
        
        if (!boundEl) return true;
                
        if (events.isBoundsLoaded && events.isBoundsLoaded(handler, tile, boundEl)) {
            return true;
        } 
        
        if (boundEl.tagName != 'IMG') return true;  // text previews without image or some thing like that
        if (boundEl.getAttribute('error')) return true;
        if (boundEl.getAttribute('data-width')) return true;
        if (boundEl.getAttribute('data-src')) return false; // prevent detection of 1x1 holder
        
        if (!boundEl.src) {
            boundEl.setAttribute('error', '1');
            return true;
        }
    
        var loaded = boundEl.complete && boundEl.naturalHeight !== 0;
        return loaded;
    }
    
    // data errorCode
    // 1 - boundEl unexist
    // 2 - error image load
    // 3 - bad width \ height
    // 4 - oversized
    
    function onBadBounds(data) {
            
        // console.log(data);
        
        if (events.onBadBounds) {
            
            return events.onBadBounds(handler, data);
            
        } else {
        
            if (data.tile) data.tile.style.display = 'none';
        }
        
        return false;
            
    }
    
    function onLoadBounds(boundEl, state) {
        
        loading--;
        
        if (boundEl.tagName != 'IMG' && (!boundEl.naturalWidth || !boundEl.naturalHeight)) {
            state = 'error';
            // something not standard
        } 
                
        if (events.onLoadBounds && events.onLoadBounds(handler, boundEl, state)) {
            return true;
        } 
                 
        if (state == 'error') {
            boundEl.setAttribute('error', '1');
        } else {            
        
            // original naturalWidth \ height may be lost after resize operations
            
            if (boundEl.tagName = 'IMG' && !boundEl.getAttribute('data-width')) {
                boundEl.setAttribute('data-width', boundEl.naturalWidth);
                boundEl.setAttribute('data-height', boundEl.naturalHeight); 
                
                var tile = handler.getTileByBoundElement(boundEl);
                if (tile && tile.getAttribute('data-rowItem-rendered')) {
                    tile.setAttribute('data-rowItem-rendered', '');
                }                
            }
        }       
        
        delayUpdateTileGrid();
    }

    function delayUpdateTileGrid() {
        
        if (!updateAnimationFrame) return false;        
        updateAnimationFrame = false;
        
        window.requestAnimationFrame(function(){            
            updateAnimationFrame = true;
            handler.updateTileGrid();
        });      
    }
    
    function getResizedInfo(resizeTo, info, resizeBy) 
    {	
        if (resizeBy == 'width') {
            var k = info[resizeBy] / resizeTo;
            info.height = Math.ceil(info.height / k);
        } else {
            var k = info[resizeBy] / resizeTo;
            info.width = Math.ceil(info.width / k);
        }
        
        info[resizeBy] = resizeTo;
        return info;
    }	 

    this.getTilesBlock = function() {
        return tilesBlock;
    }

    this.getTiles = function() {
        return tilesBlock.getElementsByClassName(tileClass);
    }
    
    this.getBoundElement = function(tile) {
        if (events.getBoundElement) return events.getBoundElement(handler, tile);
        return tile;
    }

    this.getResizableElement = function(tile) {
        if (events.getResizableElement) return events.getResizableElement(handler, tile);
        return tile;
    }

    this.getTileByBoundElement = function(boundEl) {
        
        if (!tilesBlock) return false;
        tiles = handler.getTiles();
        
        for (var i = 0; i < tiles.length; i++) {
            if (handler.getBoundElement(tiles[i]) === boundEl) {
                return tiles[i];
            }
        }
    }
    
    // stops all in-progress images and clear tileblock
    
    this.close = function() {
        
        handler.reset();
        if (tilesBlock) {
            
            tiles = handler.getTiles();
            
            // останавливаем загрузку если что-то не успело загрузится. При сценариях - смена страницы \ закрытие блока с тайлами и т.п.
   
            for (var i = 0; i < tiles.length; i++) {
                var boundEl = handler.getBoundElement(tiles[i]);
                if (boundEl.tagName == 'IMG') {
                    boundEl.src = ''; 
                }
            }
            
            while (tilesBlock.firstChild) {
                tilesBlock.removeChild(tilesBlock.firstChild);
            }
        }        
    }
    
    this.isWaitLoad = function() {
        return tilesLoaded == tiles.length ? false : true;
    }
    
    // clear events, addition classes if tiles exist

    this.reset = function() {
        
        handler.eventsChecked = false;
        loading = 0;
        
        if (tilesBlock) {
            
            tiles = handler.getTiles();
            
            for (var i=0; i <= tiles.length-1; i++){ 
                
                var rElement = handler.getResizableElement(tiles[i]);
                removeClass(rElement, 'grid-first');
                removeClass(rElement, 'grid-last');
                
                var boundEl = handler.getBoundElement(tiles[i]);
                if (boundEl.tagName == 'IMG' && tiles[i].getAttribute('data-load-eventInit')) {
                    
                    boundEl.removeEventListener('error', imgEvents.onLoadBoundsError);
                    boundEl.removeEventListener('load',  imgEvents.onLoadBoundsSuccess);
                    
                    tiles[i].setAttribute('data-load-eventInit', '0');
                }
            }
        }
    }
    
    function updateTileGridEvents() {
        
        if (!tilesBlock || !tilesBoundsEls.length || handler.eventsChecked) return false;        
     
        if (rules.lazy) {
            var scrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
            var screenBoundEl = (document.compatMode === "CSS1Compat") ? document.documentElement : document.body;
            var screenBounds = { width : screenBoundEl.clientWidth, height : screenBoundEl.clientHeight};
            
            var isElInView = function(el) {
                    
                var bounds = el.getBoundingClientRect();
           
                if (screenBounds.height + scrollTop > scrollTop + bounds.top && scrollTop < scrollTop + bounds.bottom ) {
                    
                    return true;
                }
                
                return false;
            }
        }
        
        tiles = handler.getTiles();
        var skipped = 0;
        
        for (var i = 0; i < tiles.length; i++) {
               
            // lazyLoad disabled for elements without bounds data
            
            if (rules.lazy) {
                if (tilesBoundsEls[i].getAttribute('data-src')) {
                    
                    if (!tilesLoadState[i]) {
                        if (rules.loadLimit && loading >= rules.loadLimit) {
                            
                            break; 
                        }
                    }
                    
                    if (!tilesLoadState[i] || isElInView(tilesBoundsEls[i])) {
                        tilesBoundsEls[i].src = tilesBoundsEls[i].getAttribute('data-src');
                        tilesBoundsEls[i].setAttribute('data-src', '');
                    } else {
                            
                        skipped++;
                        continue;
                    }
                    
                }
            }
            
            if (!tilesLoadState[i] || rules.recheckAlways) {
                                
                if (tilesBoundsEls[i].tagName == 'IMG' && !tiles[i].getAttribute('data-load-eventInit')) {
                    
                    // test error states
                    /*
                        var testError = Math.floor(Math.random() * Math.floor(50));
                        if (testError > 25) {
                            tilesBoundsEls[i].src = tilesBoundsEls[i].src.replace('.', 'test.d');
                        }
                    */
                    
                    // addClass(tiles[i], 'tile-loading');
                    
                    tilesBoundsEls[i].addEventListener('error', imgEvents.onLoadBoundsError);
                    tilesBoundsEls[i].addEventListener('load',  imgEvents.onLoadBoundsSuccess);
                    
                    tiles[i].setAttribute('data-load-eventInit', '1');
                    
                    loading++;
                }
            }
        }
        
        if (tilesLoaded == tiles.length && !skipped) {
            handler.eventsChecked = true;
        }
        
        return true;     
    }
        
    function updateTileGridState() {
        
        if (!tilesBlock) return false;
        
        
        tiles = handler.getTiles();
        tilesLoaded = 0;
        tilesBoundsEls = [];
        tilesLoadState = [];
        
        for (var i = 0; i < tiles.length; i++) {
            
            tilesBoundsEls[i] = handler.getBoundElement(tiles[i]);
            tilesLoadState[i] = isBoundsLoaded(tiles[i], tilesBoundsEls[i]);
            
            if (tilesLoadState[i]) {
                tilesLoaded++;                
            }
            
        }
        
        return true;
    }
    
    function removeClass(el, name) {        
        if (el) {
            el.classList.remove(tileClass + '-' + name);
        }
    }
    
    function addClass(el, name) {
        if (el) {
            el.classList.add(tileClass + '-' + name);
        }
    }
    
    function getBoundElementData(boundEl, type) {
        
        type = type != 'width' ? 'height' : 'width';
        
        var dataValue = boundEl.getAttribute('data-' + type);
        
        if (typeof dataValue == 'undefined') {
            dataValue = boundEl.getAttribute(type); 
        }
        
        return parseInt(dataValue);
    }
    
    this.updateTileGrid = function() {		
        
        if (!updateTileGridState()) return false;
        
        var isAllBoundsLoaded = tilesLoaded == tiles.length;
        
        if (!isAllBoundsLoaded) {
            addClass(tilesBlock, 'loading');
        } else {
            removeClass(tilesBlock, 'loading');
        }
        
        if (isAllBoundsLoaded || rules.tmpBounds) {
        
            landscape = 0;
            portrait = 0;
            currentTileRow = [];        
            
            var screenSize = tilesBlock.getBoundingClientRect().width; 
            
            requiredWidth = Math.floor(screenSize); 
            if (screenSize < requiredWidth) requiredWidth = screenSize;

            if (!requiredWidth) {
                console.log('fail to get required width by block. Possible block is hidden');
                console.log(tilesBlock);
                return false;
            }
               
            for (var i=0; i <= tiles.length-1; i++){ 
                            
                var tileMainEl = handler.getBoundElement(tiles[i]);
                var alternativeBounds = false;					
                
                var imageInfo = {
                    portrait : false,
                    image : handler.getResizableElement(tiles[i]),
                    width : 0,
                    height : 0,
                    tile : tiles[i],
                };
                
                if (tilesLoadState[i]) {
                
                    if (rules.tmpBounds) {
                        removeClass(tiles[i], 'tmp-bounds');
                    }
                    
                    if (!tileMainEl) {							
                        alternativeBounds = onBadBounds({errorCode : 1, error : 'updateTileGrid getBoundElement fail', tile : tiles[i], boundEl : false});						
                        if (!alternativeBounds){						
                            continue;
                        }
                    }
                    
                    if (tileMainEl.getAttribute('error')) {
                    
                        alternativeBounds = onBadBounds({errorCode : 2, error : 'updateTileGrid error during load image', tile : tiles[i], boundEl : tileMainEl});						
                        if (!alternativeBounds) {						
                            continue;
                        }
                    }
                    
                    imageInfo.width = getBoundElementData(tileMainEl, 'width');
                    imageInfo.height = getBoundElementData(tileMainEl, 'height');
                    
                    if (!imageInfo.width) {
                    
                        if (tileMainEl.tagName == 'IMG') {
                                                    
                            imageInfo.width = parseInt(tileMainEl.naturalWidth);
                            imageInfo.height = parseInt(tileMainEl.naturalHeight); 
                        } 
                    }    
                    
                    if (!imageInfo.width || imageInfo.width < 0) {
                    
                        alternativeBounds = onBadBounds({errorCode : 3, error : 'no width \ height', tile : tiles[i],	boundEl : tileMainEl});						
                        if (!alternativeBounds) {
                        
                            continue;
                            
                        } else {
                        
                            imageInfo.width = alternativeBounds.width;
                            if (alternativeBounds.height) imageInfo.height = alternativeBounds.height;
                        }
                    } 
                
                    
                } else {
                    
                    addClass(tiles[i], 'tmp-bounds');
                    imageInfo.width = rules.tmpBounds.width;
                    imageInfo.height = rules.tmpBounds.height;
                }
                
                
                if (!imageInfo.height) imageInfo.height = imageInfo.width;
                
                var aspectRatio = imageInfo.width / imageInfo.height;
                var oversized = false;                
                
                if (aspectRatio <= rules.minAspectRatio) oversized = true; 
                
                if (oversized) {
                    
                    imageInfo.width = 0;
                    imageInfo.height = 0;
                    
                    alternativeBounds = onBadBounds({errorCode : 4, error : 'oversized', tile : tiles[i],	boundEl : tileMainEl});						
                    if (!alternativeBounds) {
                    
                        continue;
                        
                    } else {
                    
                        imageInfo.width = alternativeBounds.width;
                        if (alternativeBounds.height) imageInfo.height = alternativeBounds.height;
                        else imageInfo.height = imageInfo.width;
                        
                        addClass(tiles[i], 'oversized-bounds');
                    }
                }				
                    
                if (imageInfo.width < imageInfo.height) imageInfo.portrait = true;   
                imageInfo.portrait ? portrait++ : landscape++;
                
                tiles[i].style.display = 'inline-block';
                currentTileRow.push(imageInfo);
                
                if (!rules.fixed) {
                    if (currentTileRow.length < rules.min ) continue;
                    if (i + rules.min >= tiles.length) continue; // collect last elements, todo set as option
                    
                    var currentRowResultHeight = getExpectHeight();
                    
                    // если текущий ряд не масштабируеся под требуемую высоту с определенным допуском, продолжаем сбор изображений
                    
                    if (currentRowResultHeight > rowHeight + ( (rowHeight / 100) * rules.heightDiff )) continue;
                    
                } else {
                
                    if (currentTileRow.length < rules.fixed) continue;
                }
                
                // console.log(imageInfo);
                // console.log(currentTileRow);
                
                resizeImagesRow();
            }
                           
            if (currentTileRow.length) {
            
                if (getExpectHeight() > rowHeight + ( (rowHeight / 100) * rules.heightDiffLast )) {
                    
                    if (hideUnfited) {
                        
                        for (var i=0; i <= currentTileRow.length-1; i++){ 
                            currentTileRow[i].image.style.display = 'none';
                        }
                        
                    } else {
                        
                        
                        var showAsUnfited = currentTileRow.length >= rules.unfitedExtendMin ? false : true;
                        // if (rules.fixed) showAsUnfited = false;
                        
                        resizeImagesRow(showAsUnfited);
                    }
                    
                } else {
                
                    resizeImagesRow();
                }
            }

            var clear = tilesBlock.getElementsByClassName(tileClass + '-clear-both');
            
            if (clear.length) clear[0].parentNode.appendChild(clear[0]);
            else {
                clear = document.createElement('div');
                addClass(clear, 'clear-both');
                clear.setAttribute('style', 'clear : both;');
                tilesBlock.appendChild(clear);                        
            }   
        } 
    
        updateTileGridEvents();
        
        if (events.onGridUpdated) events.onGridUpdated(handler, isAllBoundsLoaded);
    }
    
    function getCurrentRowWidth() {
    
        var width = 0; 	
        for (var i=0; i <= currentTileRow.length-1; i++){ 
            
            // масштабируем до нужной высоты весь набор изображений и смотрим сколько получилось по ширине в сумме
            
            width += parseInt(getResizedInfo(rowHeight, {width : currentTileRow[i].width, height : currentTileRow[i].height}, 'height').width);            
        }
        
        return width;
    }
    
    function getExpectHeight() {
        
        return getResizedInfo(requiredWidth, {width : getCurrentRowWidth(), height : rowHeight}, 'width').height; // подгоняем к треуемой ширине
    }
    
    // if some of the items info contain zero values, can return NaN for all row items
    
    function resizeImagesRow(unfited) {
    
        if (!currentTileRow.length) return false;
        
        var width = 0; // counter		
               
        // count total width of row, and resize by required row height
        for (var i=0; i <= currentTileRow.length-1; ++i){ 
            currentTileRow[i].origWidth = currentTileRow[i].width;
            currentTileRow[i].origHeight = currentTileRow[i].hight;
            currentTileRow[i] = getResizedInfo(rowHeight, currentTileRow[i], 'height');
            width += parseInt(currentTileRow[i].width); 
            
        }
        
        // get required row width by resizing common bounds width \ height
        // lose required height, if some proportions not fit
        
        var required = getResizedInfo(requiredWidth, {width : width, 'height' : rowHeight}, 'width');
        
        // finally resize image by required recalced height according to width

        currentRowWidth = 0;
        
        for (var i=0; i <= currentTileRow.length-1; i++){ 
            
            if (!unfited) {
                currentTileRow[i] = getResizedInfo(required.height, currentTileRow[i], 'height');
            }
            
            currentRowWidth += currentTileRow[i].width;
            
            if (currentRowWidth > requiredWidth) {
                currentTileRow[i].width = currentTileRow[i].width - (currentRowWidth - requiredWidth); // correct after float operations
            }
            
            addClass(currentTileRow[i].image, 'grid-resized');
            
            if (i == 0) {
                addClass(currentTileRow[i].image, 'grid-first');
            }
            
            if (i == currentTileRow.length-1) {     
                addClass(currentTileRow[i].image, 'grid-last');
            }
                    
            if (events.onResizeImage && events.onResizeImage(handler, currentTileRow[i])) {
                
            } else {
        
                currentTileRow[i].image.style.width = currentTileRow[i].width + 'px';
                currentTileRow[i].image.style.height = currentTileRow[i].height + 'px'; 
                currentTileRow[i].image.style.float = 'left';
            }
        }
        
        
        portrait = 0;
        landscape = 0;
        currentTileRow = [];
    }
    
    constructor(cfg);
}
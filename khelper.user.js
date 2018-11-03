



//D:\Dropbox\Private\l scripts\jfav\release\Extension\\widget\kellyTooltip.js



/*
   @encoding utf-8
   @name           KellyTooltip
   @namespace      Kelly
   @description    image view widget
   @author         Rubchuk Vladimir <torrenttvi@gmail.com>
   @license        GPLv3
   @version        v 1.0.0 24.09.18
   
   ToDo : 
   
   todo docs and examples
   
*/

function KellyTooltip(cfg) {
    
    var handler = this;
    
    this.message = '';
    this.target = false; // target or 'screen'
    this.hideWidth = false;
    this.minWidth = false;
    
    this.closeByBody = false;
    
    this.self = false;
    this.classGroup = 'tooltipster'; // prefix for all classes in tooltip container
    this.selfClass = '';
    
    this.positionY = 'top';	
    this.positionX = 'center';
    this.ptypeX = '';
    this.ptypeY = 'outside';
    
    this.offset = {left : 0, top : -20};
    
    this.removeOnClose = false;
    this.closeButton = true;
    this.zIndex = false;
    
    this.contentId = '';
    this.avoidOutOfBounds = true;
    
    this.userEvents = { onMouseOut : false, onMouseOver : false, onClose : false  };
    
    var events = {};
    
    this.updateCfg = function(cfg) {
    
        var updateContainerClass = false;
        
        if (cfg.positionY && ['top', 'bottom', 'center'].indexOf(cfg.positionY) != -1) {
            handler.positionY = cfg.positionY;
            updateContainerClass = true;
        }
        
        if (cfg.positionX && ['left', 'right', 'center'].indexOf(cfg.positionX) != -1) {
            handler.positionX = cfg.positionX;
            updateContainerClass = true;
        }
        
        if (cfg.ptypeX && ['inside', 'outside'].indexOf(cfg.ptypeX) != -1) {
            handler.ptypeX = cfg.ptypeX;
            updateContainerClass = true;
        }

        if (cfg.ptypeY && ['inside', 'outside'].indexOf(cfg.ptypeY) != -1) {
            handler.ptypeY = cfg.ptypeY;
            updateContainerClass = true;
        }
        
        if (handler.self && updateContainerClass) {
            handler.self.className = getSelfClass();
        }
        
        var settings = ['avoidOutOfBounds', 'target', 'message', 'hideWidth', 'offset', 'minWidth', 'closeByBody', 'classGroup', 'selfClass', 'zIndex', 'closeButton', 'removeOnClose'];
        
        for (var i=0; i < settings.length; i++) {
            var key = settings[i];
            if (typeof cfg[key] != 'undefined') {
            
                handler[key] = cfg[key];
                
                if (key == 'closeButton' && handler.self) {
                    handler.getCloseButton().style.display = handler.closeButton ? 'block' : 'none';
                } else if (key == 'message' && handler.self) {
                    handler.setMessage(handler[key]);			
                } else if (key == 'zIndex' && handler.self) {
                    handler.self.style.zIndex = handler[key];
                }
                
            }
        }
        
        if (cfg.events && cfg.events.onClose) {
            handler.userEvents.onClose = cfg.events.onClose;
        }
        
        if (cfg.events && cfg.events.onMouseOut) {
            handler.userEvents.onMouseOut = cfg.events.onMouseOut;
        }
        
        if (cfg.events && cfg.events.onMouseIn) {
            handler.userEvents.onMouseIn = cfg.events.onMouseIn;
        }
        
        return handler;
    }
    
    function getSelfClass() {
            
        var className = handler.classGroup + '-wrap';
            className += ' ' + handler.classGroup + '-y-' + handler.positionY;
            className += ' ' + handler.classGroup + '-x-' + handler.positionX;
        
        if (handler.ptypeX) className += ' ' + handler.classGroup + '-' + handler.ptypeX;
        if (handler.ptypeY) className += ' ' + handler.classGroup + '-' + handler.ptypeY;
        if (handler.selfClass) className += ' ' + handler.selfClass;
        
        return className;
    }
    
    function constructor(cfg) {		
        
        if (KellyTooltip.autoloadCss) KellyTooltip.loadDefaultCss(KellyTooltip.autoloadCss);

        if (handler.self) return;

        handler.updateCfg(cfg);
        
        handler.self = document.createElement('div');
        handler.self.className = getSelfClass();
        
        var container = document.createElement('div');
            container.className = handler.classGroup + '-container';
            
        var content = document.createElement('div');
            content.className = handler.classGroup + '-content'; 
            
        var closeBtn = document.createElement('div');
            closeBtn.className = handler.classGroup + '-close'; 
            closeBtn.setAttribute('style', 'cursor : pointer; display:' + (handler.closeButton ? 'block' : 'none'));
            closeBtn.innerText = '+';
            closeBtn.onclick = function() {
                 handler.show(false); 
            }
            
            container.appendChild(closeBtn);
            container.appendChild(content);
                           
        handler.self.appendChild(container);
        
        handler.setMessage(handler.message);
        
        handler.self.onmouseover = function (e) { 
            if (handler.userEvents.onMouseOver) handler.userEvents.onMouseOver(handler, e);
        }
        
        handler.self.onmouseout = function(e) {
            if (handler.userEvents.onMouseOut) handler.userEvents.onMouseOut(handler, e);
        };
        
        document.body.appendChild(handler.self);	
     
        events.onBodyClick = function(e) {
            
            if (handler.closeByBody && !handler.isChild(e.target, handler.self)) {
                handler.show(false);
            }
        };
        
        document.body.addEventListener('click', events.onBodyClick);
        
        events.onResize = function(e) {
        
            //console.log(screen.width + ' ff '  + toolTip.hideAfterWidth)
            
            if (!checkRequierdWidth()) {
                handler.show(false);
                return;
            }
            
            handler.updatePosition();	
        }
        
        events.onScroll = function(e) {
        
            
            handler.updatePosition();	
        }
        
        window.addEventListener('resize', events.onResize);
        window.addEventListener('scroll', events.onScroll);
        
        return handler;
    }
    
    function checkRequierdWidth() {
        if (handler.hideAfterWidth && document.body.clientWidth <= handler.hideAfterWidth) return false;
        else return true;
    }
    
    function addHtml(el, html) {       
        
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');        
        var childs = doc.getElementsByTagName('body')[0].childNodes;
        
        while (childs.length > 0) {
            el.appendChild(childs[0]);
        }
    }
    
    this.setMessage = function(mess) {	
        
        if (!handler.self) return;
        
        handler.message = mess;
        this.getContent().innerHTML = '';
        
        if (typeof mess == 'string') { 
            addHtml(this.getContent(), mess);
        } else {
            this.getContent().appendChild(mess); 
        }
        
        return handler;
    }
    
    this.getCloseButton = function() {
        return handler.self.getElementsByClassName(handler.classGroup + '-close')[0];
    }

    this.getContent = function() {
        return handler.self.getElementsByClassName(handler.classGroup + '-content')[0];
    }
    
    this.getContentContainer = function() {
        return handler.self.getElementsByClassName(handler.classGroup + '-container')[0];
    }
    
    this.show = function(show, contentId) {
        if (!handler.self) return;
        
        handler.self.className = handler.self.className.replace(handler.classGroup + '-show', '').trim();
    
        if (show) {			
        
            if (!checkRequierdWidth()) return;
            
            handler.self.className += ' ' + handler.classGroup + '-show';
            if (handler.zIndex) handler.self.style.zIndex = handler.zIndex;
            
            handler.updatePosition();
            
            if (!contentId) contentId = 'default';
            
            handler.contentId = contentId;
            
        } else {
            if (handler.userEvents.onClose) handler.userEvents.onClose(handler);
            
            if (handler.removeOnClose) handler.remove();
            
            handler.contentId = false;
        }	
        
    }
    
    this.isShown = function() {
        return (handler.self && handler.self.className.indexOf(handler.classGroup + '-show') !== -1) ? handler.contentId : false;
    }
    
    this.remove = function() {
        if (handler.self) {
            handler.self.parentNode.removeChild(handler.self);
            handler.self = false;
            
            // но можно и добавлять \ удалять события при показе \ скрытии подсказки
            document.body.removeEventListener('click', events.onBodyClick); 
            window.removeEventListener('resize', events.onResize);
            window.removeEventListener('scroll', events.onScroll);
        }
    }

    // check is element related to an searchParent element
    
    this.isChild = function(childTarget, searchParent) {
        var parent = childTarget;

        if (!childTarget) return false;
        
        if (!searchParent) searchParent = handler.self;
        
        while (parent && parent != searchParent) {
            parent = parent.parentElement;
        } 

        return parent ? true : false;
    }
    
    this.getTarget = function() {
                
        if (!handler.target || handler.target == 'screen') return false;
        
        if (typeof handler.target == 'string') {
            var target = document.getElementById(handler.target);
            if (target) {
                handler.target = target;
                return handler.target;
            } else return false;		
            
        } else return handler.target;
    }
    
    this.updatePosition = function() {
    
        if (!handler.self) return false;
        
        var scrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
        var scrollLeft = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0);
        var screenBoundEl = (document.compatMode === "CSS1Compat") ? document.documentElement : document.body;
        var screenBounds = { width : screenBoundEl.clientWidth, height : screenBoundEl.clientHeight};
        
        if (handler.getTarget()) {			
            var pos = handler.getTarget().getBoundingClientRect();	
        } else if (handler.target == 'screen') {            
            var pos = {left : 0, top : 0, width : screenBounds.width, height : screenBounds.height};
        
        } else return false;
        
        var toolTip = handler.self;
        if (handler.minWidth) toolTip.style.minWidth = handler.minWidth + 'px';	
                 
        var toolTipBounds = toolTip.getBoundingClientRect();		
        
        var left = pos.left + handler.offset.left + scrollLeft;
        var top = pos.top + handler.offset.top + scrollTop;
              
        if (handler.positionY == 'top' && handler.ptypeY == 'outside') {

            top = top - toolTipBounds.height;

        } else if (handler.positionY == 'top' && handler.ptypeY == 'inside') {		
                        
        } else if (handler.positionY == 'bottom' && handler.ptypeY == 'outside') {             
            top = top + pos.height; 
        } else if (handler.positionY == 'bottom' && handler.ptypeY == 'inside') { 
            top = top + pos.height - toolTipBounds.height; 
        } else if (handler.positionY == 'center') {
            top += pos.height / 2 - toolTipBounds.height / 2;
        }
        
        if (handler.positionX == 'left' && handler.ptypeX == 'outside') {
            left = left - toolTipBounds.width;			
        } else if (handler.positionX == 'left' && handler.ptypeX == 'inside') {
                
        } else if (handler.positionX == 'right' && handler.ptypeX == 'outside' ) {
            left = left + pos.width;			
        } else if (handler.positionX == 'right' && handler.ptypeX == 'inside' ) {
            left = left + pos.width - toolTipBounds.width;	
        } else if (handler.positionX == 'center') {
            left += pos.width / 2 - toolTipBounds.width / 2;
        }
        
        if (this.avoidOutOfBounds && handler.target != 'screen') {
            
            // move to full width \ height to another side if out of bounds
            
            if ( top + toolTipBounds.height > scrollTop + screenBounds.height) {
                top = top - toolTipBounds.height - handler.offset.top; 
                
                if (handler.ptypeY == 'outside') {
                    top -= pos.height;
                }
                
            }  else if ( top + toolTipBounds.height < 0 ) {
                top = top + toolTipBounds.height + handler.offset.top;  
                
                if (handler.ptypeY == 'outside') {
                    top += pos.height;
                }
            }
            
            if ( left + toolTipBounds.width > scrollLeft + screenBounds.width) {
                
                left = left - toolTipBounds.width - handler.offset.left;  
                
                if (handler.ptypeX == 'outside') {
                    left -= pos.width;
                }
                
            } else if ( left + toolTipBounds.width < 0 ) {
                left = left + toolTipBounds.width + handler.offset.left;

                if (handler.ptypeX == 'outside') {
                    left += pos.width;
                }                
            }
        }
        
        toolTip.style.top = top + 'px';
        toolTip.style.left = left + 'px';
    }
        
    constructor(cfg);
}

/* static methods */

KellyTooltip.autoloadCss = false; // className
KellyTooltip.defaultStyle = false;

KellyTooltip.loadDefaultCss = function(className) {
    
    if (this.defaultStyle) return true;
    
    if (!className || className === true) className = 'tooltipster';
    var border = 0;
    
    var css = '\
        .' + className + '-wrap {\
            position : absolute;\
            opacity : 0;\
            z-index : 60;\
            pointer-events: none;\
        }\
        .' + className + '-container {\
            min-width: 210px;\
            min-height: 52px;\
            margin : 0;\
            background : rgba(96, 102, 126, 0.9490);\
            border : ' + border + 'px dashed #c5c5c5;\
            transition: opacity 0.1s;\
            color : #fff;\
            border-radius : 4px;\
            padding : 12px;\
        }\
        .' + className + '-close {\
            left: 0px;\
            right: auto;\
            position: absolute;\
            top: 0px;\
            display: block;\
            transform: rotate(45deg);\
            cursor: pointer;\
            font-size: 25px;\
            width: 25px;\
            height: 25px;\
            line-height: 25px;\
        }\
        .' + className + '-content {\
            text-align: left;\
            font-size: 16px;\
        }\
        .' + className + '-show {\
            opacity : 1;\
            pointer-events: auto;\
        }\
    ';	

    var head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');
    style.type = 'text/css';
    
    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    } 
    
    this.defaultStyle = style;
    head.appendChild(style);
    
    return true;
}

KellyTooltip.addTipToEl = function(el, message, cfg, delay, onShow) {
    
    if (!delay) delay = 50;
    
    if (!cfg) {
    
        cfg = {
            offset : {left : -20, top : 0}, 
            positionY : 'top',
            positionX : 'right',
            ptypeX : 'outside',
            ptypeY : 'inside',
            closeButton : false,
            selfClass : 'KellyTooltip-ItemTip-tooltipster',
            classGroup : 'KellyTooltip-tooltipster',
            removeOnClose : true,
        };
    }
    
    cfg.target = el;
    var wait = false;
    
    el.onmouseover = function (e) { 
        
        if (wait) return;
        
        var tipTimer = setTimeout(function() {
            
            var text = false;
            
            if (typeof message == 'function') {
                text = message(el, e);
                
                if (!text) return;
            } else text = message;			
            
            var tooltip = new KellyTooltip(cfg);
            
            setTimeout(function() {
                
                wait = false;
                
                tooltip.setMessage(text);			
                tooltip.show(true);
                tooltip.updatePosition();
                
                if (onShow) onShow(el, e,  tooltip);
                
                el.onmouseout = function(e) {
                    var related = e.toElement || e.relatedTarget;
                    if (tooltip.isChild(related)) return;
                    
                    tooltip.show(false);
                    delete tooltip;
                }
                
                tooltip.self.onmouseout = function(e) {					
                    var related = e.toElement || e.relatedTarget;
                    
                    if (tooltip.isChild(related) ) return;
                    
                    tooltip.show(false);
                    delete tooltip;
                }
            }, 100);           
            
            
        }, delay);
        
        el.onmouseout = function(e) {
            if (wait) return;
            
            if (tipTimer) {
                clearTimeout(tipTimer);
            }
        }
    }		
}


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\widget\kellyTileGrid.js



/*
   @encoding utf-8
   @name           KellyTileGrid
   @namespace      Kelly
   @description    image view widget
   @author         Rubchuk Vladimir <torrenttvi@gmail.com>
   @license        GPLv3
   @version        v 1.0.8 24.09.18
   
   ToDo : 
   
   todo docs and examples
   
*/

function KellyTileGrid(cfg) {
    
    var tilesBlock = false;
    var tileClass = 'image';
    var loadTimer = false;
    
    var tiles = false;
    var tilesLoadState = false;
    var tilesLoaded = false;
    
    var currentTileRow = false;
    var requiredWidth = false;
    var hideUnfited = false;
    
    var rowHeight = 250; // требуемая высота тайловой строки
    
    var updateAnimationFrame = true;
    
    var rules = {
        min : 2, // минимальное кол-во элементов в строке не зависимо от rowHeight
        heightDiff : 10, // допустимая погрешность по высоте для текущей строки элементов
        heightDiffLast : 20, // допустимая погрешность для последнего ряда
        unfitedExtendMin : 2, // для последнего ряда - подгоняем по ширине не обращая внимания на требуемую высоту если осталось указанное кол-во изображений невместифшихся в сетку с требуемой высотой
        dontWait : false,
        fixed : false,
        tmpBounds : false,
        minAspectRatio : 0.2, // картинка маркируется классом oversized, вызывается событие onBadBounds, при отсутствии пользовательского обработчика возвращающего пропорции, картинка скрывается         
        recheckAlways : false, // (если данные из недоверенного источника) вызывать события загрузки пропорций изображения даже если есть предварительно заданные через атрибуты данные о пропорция для их пост валидации
    };
    
    var handler = this;
    var events = { 
        onGridUpdated : false, // (handler) after updateTileGrid method
        
        getResizableElement : false, // (handler, tile) если метод задан - возвращать элемент к которому в тайле будет применены атрибуты width \ height, по умолчанию сам тайл
        getBoundElement : false, // (handler, tile) если метод задан - возвращать элемент из которого можно получить данные о пропорция тайла (свойства data-width \ data-height) , по умолчанию сам тайл
        
        isBoundsLoaded : false, // (handler, tile, boundEl) is element loaded
        // getScaleElement
        onBadBounds : false, // (handler, data[errorCode, error, tile, boundEl]) element is loaded, but bounds is unsetted or loaded with error 
        onResize : false, // (handler) window resize
        onLoadBounds : false, // (handler, boundEl, errorTriger) some of unknown bounds element is ready
        onResizeImage : false, // (handler, tileResizedInfo[origHeight, origWidth, width, height])
    };
    
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
    }
    
    this.updateConfig = function(cfg) {
        
        if (!cfg) return false;
                
        if (typeof cfg.tilesBlock != 'undefined') {
        
            tilesBlock = cfg.tilesBlock;
            
            if (typeof tilesBlock == 'string') {
                var el = document.getElementById(tilesBlock.trim());
                if (el) tilesBlock = document.getElementById(tilesBlock.trim());
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
        
        if (cfg.tileClass) {
            tileClass = cfg.tileClass;
        }
        
        if (cfg.hideUnfited) {
            hideUnfited = true;
        } else {
            hideUnfited = false;
        }
        
        if (cfg.events) {
        
            for (var k in events){
                if (typeof cfg.events[k] == 'function') {
                     events[k] = cfg.events[k];
                }
            }
        }
        
        window.addEventListener('resize', onResize);	
        return true;
    }
    
    function onResize() {
        if (!tilesBlock) return;
        
        if (events.onResize && events.onResize(handler)) {
            return true;
        } 
        
        delayUpdateTileGrid(true);
    }
    
   function isBoundsLoaded(tile) {
   
        var boundEl = handler.getBoundElement(tile);
        if (!boundEl) return true;
                
        if (events.isBoundsLoaded && events.isBoundsLoaded(handler, tile, boundEl)) {
            return true;
        } 
        
        if (boundEl.tagName != 'IMG') return true;  // text previews without image or some thing like that
        if (boundEl.getAttribute('error')) return true;
        if (boundEl.getAttribute('data-width')) return true;
        
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
        
        if (boundEl.tagName != 'IMG' && (!boundEl.naturalWidth || !boundEl.naturalHeight)) {
            state = 'error';
        }
        
        if (events.onLoadBounds && events.onLoadBounds(handler, boundEl, state)) {
            return true;
        } 
        
        if (state == 'error') {
            boundEl.setAttribute('error', '1');
        }        
        
        delayUpdateTileGrid();
    }

    function delayUpdateTileGrid(resize) {
        
        if (!updateAnimationFrame) return false;        
        updateAnimationFrame = false;
        
        window.requestAnimationFrame(function(){            
            updateAnimationFrame = true;
            handler.updateTileGrid(resize);
        });      
    }
    
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
    
    this.clearEvents = function() {
        
        if (!tilesBlock) return false;
        tiles = handler.getTiles();
        
        for (var i = 0; i < tiles.length; i++) {
            var boundEl = handler.getBoundElement(tiles[i]);
            if (boundEl.tagName == 'IMG' && tiles[i].getAttribute('data-load-eventInit')) {
                
                boundEl.removeEventListener('error', imgEvents.onLoadBoundsError);
                boundEl.removeEventListener('load',  imgEvents.onLoadBoundsSuccess);				
                tiles[i].setAttribute('data-load-eventInit', '0');
            }
        }
    }
        
    this.stopLoad = function() {
    
        // останавливаем загрузку если что-то не успело загрузится. При сценариях - смена страницы \ закрытие блока с тайлами и т.п.
   
        if (!tilesBlock) return false;
        for (var i = 0; i < tiles.length; i++) {
            var boundEl = handler.getBoundElement(tiles[i]);
            if (boundEl.tagName == 'IMG') {
                boundEl.src = ''; 
            }
        }
    }
    
    this.close = function() {
        handler.clearEvents();
        handler.stopLoad();
    }
    
    this.isWaitLoad = function() {
        return tilesLoaded == tiles.length ? false : true;
    }
    
    function markRowAsRendered() {
    
        for (var i=0; i <= currentTileRow.length-1; i++) { 
            currentTileRow[i].tile.setAttribute('data-rowItem-rendered', '1');
        }
    }

    function clearRowRenderMarks() {
        
        for (var i=0; i <= tiles.length-1; i++){ 
                
            if (tiles[i].getAttribute('data-rowItem-rendered')) {
                tiles[i].setAttribute('data-rowItem-rendered', '');
            }
        }
    }
    
    this.updateTileGridState = function() {
        
        if (!tilesBlock) return false;
        
        tiles = handler.getTiles();
        tilesLoaded = 0;        
        tilesLoadState = [];
        
        for (var i = 0; i < tiles.length; i++) {
            
            tilesLoadState[i] = isBoundsLoaded(tiles[i]);
            
            if (tilesLoadState[i]) {
                tilesLoaded++;                
            } 
            
            if (!tilesLoadState[i] || rules.recheckAlways) {
                
                var boundEl = handler.getBoundElement(tiles[i]);
                if (boundEl.tagName == 'IMG' && !tiles[i].getAttribute('data-load-eventInit')) {
                    
                    // test error states
                    /*
                        var testError = Math.floor(Math.random() * Math.floor(50));
                        if (testError > 25) {
                            boundEl.src = boundEl.src.replace('.', 'test.d');
                        }
                    */
                    
                    boundEl.addEventListener('error', imgEvents.onLoadBoundsError);
                    boundEl.addEventListener('load',  imgEvents.onLoadBoundsSuccess);
                    
                    tiles[i].setAttribute('data-load-eventInit', '1');
                }
            }
        }
        
        return true;
    }
    
    function getBoundElementData(boundEl, type) {
        
        type = type != 'width' ? 'height' : 'width';
        
        var dataValue = boundEl.getAttribute('data-' + type);
        
        if (typeof dataValue == 'undefined') {
            dataValue = boundEl.getAttribute(type); 
        }
        
        return parseInt(dataValue);
    }
    
    this.updateTileGrid = function(resize) {		
        
        if (!handler.updateTileGridState()) return false;
        
        if (resize) {
            clearRowRenderMarks();
        }
        
        if (tilesLoaded == tiles.length || (rules.dontWait && tilesLoaded >= rules.dontWait)) {
        
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
                
                // если понадобятся lazy load \ порядок загрузки изображений, лучше вынести в отдельное решение при необходимости, 
                // здесь нужен только контроль текущего состояния пропорций элементов
                
                if (tilesLoaded != tiles.length && rules.dontWait && tiles[i].getAttribute('data-rowItem-rendered')) continue;
                if (!tilesLoadState[i] && !rules.tmpBounds) break;
                                    
                var tileMainEl = this.getBoundElement(tiles[i]);
                var alternativeBounds = false;					
                
                var imageInfo = {
                    portrait : false,
                    image : this.getResizableElement(tiles[i]),
                    width : 0,
                    height : 0,
                    tile : tiles[i],
                };
                
                if (tilesLoadState[i]) {
                
                    if (rules.dontWait && rules.tmpBounds && tiles[i].className.indexOf(tileClass + '-tmp-bounds') !== -1) {
                        tiles[i].className = tiles[i].className.replace(tileClass + '-tmp-bounds', '');
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
                    
                    if (tiles[i].className.indexOf(tileClass + '-tmp-bounds') == -1) {
                        tiles[i].className += ' ' + tileClass + '-tmp-bounds';
                    }
                    
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
                        
                        if (tiles[i].className.indexOf(tileClass + '-oversized-bounds') == -1) {
                            tiles[i].className += ' ' + tileClass + '-oversized-bounds';
                        }
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
                
                markRowAsRendered();
                resizeImagesRow();
            }
                           
            if (currentTileRow.length) {
            
                if (getExpectHeight() > rowHeight + ( (rowHeight / 100) * rules.heightDiffLast )) {
                    
                    if (hideUnfited) {
                        
                        for (var i=0; i <= currentTileRow.length-1; ++i){ 
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
                clear.className = tileClass + '-clear-both';
                clear.setAttribute('style', 'clear : both;');
                tilesBlock.appendChild(clear);                        
            }

            if (events.onGridUpdated) events.onGridUpdated(handler);
            
        } 
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
            
            if (currentTileRow[i].image.className.indexOf(tileClass + '-grid-resized') == -1) {
                currentTileRow[i].image.className += ' ' + tileClass + '-grid-resized';
            }
            
            if (i == 0 && currentTileRow[i].image.className.indexOf(tileClass + '-grid-first') == -1) {
                //currentTileRow[i].image.className = currentTileRow[i].image.className.replace(tileClass + '-grid-first', '');
                currentTileRow[i].image.className += ' ' + tileClass + '-grid-first';                
            }
            
            if (i == currentTileRow.length-1 && currentTileRow[i].image.className.indexOf(tileClass + '-grid-last') == -1 ) {            
                currentTileRow[i].image.className += ' ' + tileClass + '-grid-last';                
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
        currentTileRow = new Array();
    }
    
    constructor(cfg);
}


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\widget\kellyImageView.js



/*
   @encoding utf-8
   @name           KellyImgView
   @namespace      Kelly
   @description    image view widget
   @author         Rubchuk Vladimir <torrenttvi@gmail.com>
   @license        GPLv3
   @version        v 1.1.2 03.11.18
   
   ToDo : 
   
   data-ignore-click - ok
   include pixel ratio detection - https://stackoverflow.com/questions/1713771/how-to-detect-page-zoom-level-in-all-modern-browsers
   add user event onButtonsShow
   
*/

function KellyImgView(cfg) {
    
    var handler = this;    
    var events = new Array();
    
    var beasy = false; // false or beasy process name (loadImage, close, nextImage)
    
    var image = false; // dom el - current loaded image, false if not shown (getCurrentImage().image)
    var imageBounds = false; 
    
    var selectedGallery = 'default'; // inherit by opened source
   
    var commClassName = false; // DOM viewer class \ id base name
   
    var block = false;
    var fadeTime = 500; // not synced with css
    var buttonsMargin = 6;
    var blockShown = false;
    
    var cursor = 0;
    
    // todo touch move by x, go to previuse \ next by swipe
    // realise throw dragStart \ DragMove functions that related to image block
    
    var isMoved = false;
    
    var scale = 1;
    
    var move = {x : -1, y : -1, left : false, top : false}; // начальная точка клика dragStart, базовая позиция перемещаемого элемента
    var lastPos = false;
    
    var buttons = {};
    
    var images = {}; // gallery_prefix - array of images ( string \ a \ img \ element with data-src attribute )
    var imagesData = {};
    
    var userEvents = { 
        onBeforeImageLoad : false,  // onBeforeImageLoad(handler, galleryItemPointer, galleryData) calls before onShow and initialize open image process (to prevent, return true in userEvent method) 
        onBeforeImageShow : false,  // onBeforeImageShow(handler, image) calls before add loaded image to container изображение загружено но не показано, переменные окружения обновлены
        onClose : false,            // onShow(handler) calls after hide viewer block
        onShow : false,             // onShow(handler, show) calls before show \ hide viewer block
        onNextImage : false,        // onNextImage(handler, nextImage, next)
    };
 
    var moveable = true;
    var swipe = false;	
    var bodyLockCss = false;
    
    // блокировка скролла при показе изображения
    // метод hideScroll - скрывает скроллбар для body (см. showBodyScroll), добавляет соразмерный отступ; минус - position : fixed элементы все равно сдвигаются если привязаны к правой стороне
    // метод lockMove   - прерывает события движения (см. disableMoveContainer), скроллбар остается
    
    // lockMove - not working in Edge
    // see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7134034/ - already two years not fixed bug in Edge with scroll event
    
    var lockMoveMethod = 'lockMove'; 
   
    var lazyHand = { enabled : false, event : false };
   
    function constructor(cfg) {
        handler.updateConfig(cfg);
    }
    
    function getBlock() {
    
        if (typeof block == 'string') {
            var el = document.getElementById(block.trim());
            if (el) block = el;
        }
        
        return block ? block : false;
    }
    
    this.updateConfig = function(cfg) {
        
        if (cfg.className) {
            commClassName = cfg.className;
        }
        
        if (cfg.viewerBlock) {
            block = cfg.viewerBlock;            
        }
        
        if (cfg.userEvents) {
            
            for (var k in userEvents){
                if (typeof cfg.userEvents[k] == 'function') {
                    userEvents[k] = cfg.userEvents[k];
                }
            }
        }
    
        if (cfg.userEvents === false) {
            for (var k in userEvents){
                 userEvents[k] = false;
            }               
        }
        
        if (cfg.buttonsMargin) {
        
        }
        
        if (typeof cfg.moveable != 'undefined') {
            moveable = cfg.moveable ? true : false;
        }
        
        if (typeof cfg.swipe != 'undefined') {
            swipe = cfg.swipe ? true : false;
        } 
        
        if (typeof cfg.lazyHand != 'undefined') {
            
            lazyHand.enabled = cfg.lazyHand ? true : false;            
            if (!lazyHand.enabled) {                         
                lazyHand.button = false;
                lazyHand.pos = false;
            }
        }
        
        if (cfg.lockMoveMethod) {
            lockMoveMethod = cfg.lockMoveMethod;
        }               
    }   
    
    function lazyHandUpdate(e) {
        
        if (!lazyHand.enabled || !lazyHand.button) {
            return false;
        }
            
        var curPos = getEventDot(e);
        var distance = false;
        
        if (lazyHand.pos) {
            distance = calcDistance(lazyHand.pos, curPos);
        }
        
        if (distance === false || distance > 30) {  
            lazyHand.button = false;
            lazyHand.pos = false;
            return false;
        } else {        
            return true;
        }
    }
       
    function isImgLoaded(imgElement) {
        
        if (!imgElement.src) return true;
    
        return imgElement.complete && imgElement.naturalHeight !== 0;
    }
    
    function showBodyScroll(show) {
        var body = document.body;
        
        body.className = body.className.replace(commClassName + '-margin', '').trim();
        body.className = body.className.replace(commClassName + '-lock', '').trim();
        
        if (show) {

            return;
            
        } else {
        
            if (!body || !body.clientWidth) return false;
        
            var diff = screen.width - body.clientWidth;
            if (!diff || diff <= 0) return false;
            
            if (bodyLockCss !== false) {
                bodyLockCss.innerHTML = '';
            }
    
            var head = document.head || document.getElementsByTagName('head')[0];
            
            bodyLockCss = document.createElement('style');
            bodyLockCss.type = 'text/css';
            
            head.appendChild(bodyLockCss);
            
            css = '.' + commClassName + '-margin {';
            css += 'margin-right : ' + diff + 'px;';
            css += '}';
            
            if (bodyLockCss.styleSheet){
              bodyLockCss.styleSheet.cssText = css;
            } else {
              bodyLockCss.appendChild(document.createTextNode(css));
            }
            
            body.className += ' ' + commClassName + '-lock ' + commClassName + '-margin';
        }

        return true;
    }
    
    this.getButton = function(index) {
    
        if (!index) return buttons;
    
        if (!buttons[index]) return false;
        
        return buttons[index];
    }
    
    this.getButtons = function() {
        return buttons;
    }
    
    this.getImages = function() {
        return images;
    }
    
    this.getCurrentState = function() {	
        
        return { 
            block : getBlock(),
            image : image, 
            beasy : beasy,
            gallery : selectedGallery, 
            index : cursor,
            cursor : cursor,
            shown : blockShown,
            blockShown : blockShown,
            imageBounds : imageBounds, // width, height, resizedWidth, resizedHeight
            imageData : imagesData[selectedGallery] ? imagesData[selectedGallery] : false,
        };
    }
    
    this.hideButtons = function(hide) {
        for (var k in buttons){
            if (typeof buttons[k] !== 'function') {
            
                buttons[k].className = buttons[k].className.replace(commClassName + '-btn-hidden', '').trim();
                
                if ((k == 'prev' || k == 'next') && (!images[selectedGallery] || images[selectedGallery].length <= 1)) {
                    buttons[k].className += ' ' + commClassName + '-btn-hidden';
                    continue;
                } else if (hide) {
                    buttons[k].className += ' ' + commClassName + '-btn-hidden';
                }
            }
        }        
    }
    
    this.hideLoader = function(hide) {
                
        var loader = getEl('loader');
        if (loader) {
            if (hide) addClass(loader, 'loader-hidden');
            else deleteClass(loader, 'loader-hidden');
        }
    }
    
    this.addButton = function(innerHTML, index, eventOnClick, addition) {
        
        if (!getBlock()) {        
            console.log('cant create buttons, main block not ready');
            return false;
        }
        
        var w, h, additionStyle, className;
        
        if (addition) {
            if (addition.w) w = parseInt(addition.w);
            if (addition.h) h = parseInt(addition.h);
            if (addition.additionStyle) additionStyle = addition.additionStyle;
            if (addition.className) className = addition.className;
        }
        
        if (!additionStyle) additionStyle = '';
        if (!className) className = commClassName + '-btn ' + commClassName + '-btn-' + index ;
        
        if (w) additionStyle += 'width : ' + w + 'px;';
        if (h) additionStyle += 'height : ' + h + 'px;';
        
        var button = document.createElement('div');
            if (additionStyle) button.setAttribute('style', additionStyle);
            button.onclick = function(e) {
                
                if (lazyHand.enabled) {                    
                    lazyHand.button = this; 
                    lazyHand.pos = getEventDot(e);
                }
                
                if (eventOnClick) eventOnClick(e);
            }
            button.className = className;
            
        addHtml(button, innerHTML);
        
        buttons[index] = button;
        block.appendChild(buttons[index]);
        
        return button;        
    }
    
    function addHtml(el, html) {       
        
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');        
        var childs = doc.getElementsByTagName('body')[0].childNodes;
        
        while (childs.length > 0) {
            el.appendChild(childs[0]);
        }
    }
    
    this.addBaseButtons = function(){
        if (buttons['close']) return true;
        
        handler.addButton(getSvgIcon('close', '#000'), 'close', function() { handler.cancelLoad(); });
        
        handler.addButton(getSvgIcon('left', '#000'), 'prev', function() { handler.nextImage(false); });
        handler.addButton(getSvgIcon('right', '#000'), 'next', function() { handler.nextImage(true); });
        
        return true;
    }

    this.updateButtonsPos = function(pos) {
        
        if (!image) return false;
        // console.log(window.getComputedStyle(image));
        
        if (!pos) {
            pos = {						
                left : parseInt(image.style.left),
                top : parseInt(image.style.top),
            }
        }
    
        var clientBounds = handler.getClientBounds();
        
        var item = 0;
        var horizontal = false;        
        
        var padding = 12;
        var left = pos.left + parseInt(image.style.width) + padding;
        var top = pos.top;
        
        for (var k in buttons) {
            
            if (buttons[k].className.indexOf('hidden') != -1) continue;
            
            item++;                
            var buttonBounds = buttons[k].getBoundingClientRect();
            
            if (item == 1) {
                // console.log(top - buttonBounds.height)
                if (left + buttonBounds.width > clientBounds.screenWidth - padding) {
                    horizontal = true;
                    left = pos.left;
                    top -= buttonBounds.height + padding;                    
                }
                
                if (horizontal && top <= 0) {
                    top = pos.top;
                    
                    if (pos.top + buttonBounds.height <= 0) {
                        top = 0;                        
                    }
                }
                
                if (!horizontal && top <= 0) {
                    top = padding;
                }
            } 
            
            buttons[k].style.left = left + 'px';
            buttons[k].style.top = top + 'px'; 
            
            if (horizontal) { 
                left += buttonBounds.width + buttonsMargin;
            } else {
                top += buttonBounds.height + buttonsMargin;
            }
        }
    }
    
    function deleteClass(el, name) {        
        if (el && el.className.indexOf(commClassName + '-' + name) != -1) {
            el.className = el.className.replace(commClassName + '-' + name, '').trim();
        }
    }
    
    function addClass(el, name) {
        if (el && el.className.indexOf(commClassName + '-' + name) == -1) {
            el.className += ' ' + commClassName + '-' + name;
        }
    }
    
    function getEl(name) {
        if (!getBlock()) return false;
        var pool = block.getElementsByClassName(commClassName + '-' + name);        
        if (pool && pool.length) return pool[0];
        else return false;
    }
    
    function preventEvent(event) {
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);
    }
    
    function showMainBlock(show) {
           
        if (show && blockShown) return;
        
        if (userEvents.onShow) {
            userEvents.onShow(handler, show);
        }
        
        handler.removeEventPListener(document.body, "mousemove", 'lazy_hand_');

        // will be extended if something from this events will be used for some thing else
        
        var disableMoveContainer = function(disable) {
        
            var stop = function(e) {
                preventEvent(e);
                return false;
            }
            
            if (disable) {
            
                handler.addEventPListener(window, 'wheel', stop, '_scroll');
                handler.addEventPListener(window, 'mousewheel', stop, '_scroll');
                handler.addEventPListener(window, 'touchmove', stop, '_scroll');
            
            } else {
            
                handler.removeEventPListener(window, 'touchmove', '_scroll');            
                handler.removeEventPListener(window, 'mousewheel', '_scroll');
                handler.removeEventPListener(window, 'wheel', '_scroll');
            }
            
        }            
        
        if (show) {
        
            if (lockMoveMethod == 'hideScroll') {
                showBodyScroll(false);
            } else {				
                disableMoveContainer(true);
            }
            
            blockShown = true;
            
            if (!getBlock()) {
                return;
            }
            
            addClass(block, 'active');
            deleteClass(block, 'fade');
            
            block.onclick = function(e) { 
                
                if (lazyHandUpdate(e) && e.target != lazyHand.button) {                    
                    preventEvent(e);
                    
                    try {                        
                        var retranslateEvent = new e.constructor(e.type, e); 
                        lazyHand.button.dispatchEvent(retranslateEvent);
                    } catch(e){
                        lazyHand.button.onclick(e);
                    }
                    
                    return false;
                }
                
                if (e.target != this) return false;
                
                handler.cancelLoad();
                return false; 
            }        
                 
            handler.addEventPListener(window, "scroll", function (e) {
                handler.updateBlockPosition();
            }, 'img_view_');
            
            handler.addEventPListener(window, "resize", function (e) {
                handler.updateSize(e);
                return false;
            }, 'image_update_');

           // env.addEventPListener(block, "mousemove", function (e) {
           //     handler.updateCursor();
           // }, 'image_mouse_move_');            

            handler.addEventPListener(document.body, "keyup", function (e) {
            
                var c = e.keyCode - 36;
               
                var right = c == 3 || c == 32 || c == 68 || c == 102;
                var left = c == 1 || c == 29 || c == 65 || c == 100;
               
                if (right || left) {
                    // lazyHand.ignore = true;
                    handler.nextImage(right, 1, e);
                }
                
                var minus = c == 73;
                var plus = c == 71;
                
                if (minus || plus) {
                    
                    handler.scale(plus);
                }
                
                
            }, 'next_image_key');    
        } else {       
            
            setTimeout(function() { 
            
                if (lockMoveMethod == 'hideScroll') {
                    showBodyScroll(true);
                } else {				
                    disableMoveContainer(false);
                } 
                
                deleteClass(block, 'active');
                deleteClass(block, 'fade');              
                handler.removeEventPListener(window, "scroll", 'img_view_');
                blockShown = false;
                
            }, fadeTime);  
            
            
            addClass(block, 'fade');
            handler.removeEventPListener(window, "resize", 'image_update_');
            handler.removeEventPListener(document.body, "keyup", 'next_image_key');
        }     
    }
    
    // initialize image viewer from gallery pointer with start cursor \ gallery and image src, or go to nextimage in selected gallery
    // see usage in .nextImage method
    
    // galleryItemPointer - dom element with kellyGallery and kellyGalleryIndex attributes, if false, go to next \ prev in current gallery
    // initial image must be setted in href \ src \ or in data-image attribute, else - set kellyGalleryIndex to -1 to start from begining of gallery array
    // next - bool  (true \ false, if false go to previuse) 
    
    // for navigation use nextImage method instead if gallery already opened
    
    this.loadImage = function(galleryItemPointer, galleryData) {
        
        if (beasy) return false;
        
        if (userEvents.onBeforeImageLoad && userEvents.onBeforeImageLoad(handler, galleryItemPointer, galleryData)) {
            return false;
        }
        
        // reset previouse image bounds info 
        
        if (image.parentNode) image.parentNode.removeChild(image);
        image = false;            
        imageBounds = false;
            
        beasy = 'loadImage';
        scale = 1;
        // console.log('load image');        
        
        if (!blockShown) {
            showMainBlock(true);
            // lazyHand.ignore = true;
        }
        
        if (!galleryItemPointer && !galleryData) {
        
            galleryItemPointer = images[selectedGallery][cursor];
            
        } else if (galleryData) {
            
            if (galleryData.gallery) {
                selectedGallery = galleryData.gallery;
            }
            
            if (typeof galleryData.cursor != 'undefined') {
                if (galleryData.cursor == 'next') {
                    galleryItemPointer = getNextImage(true, true);
                } else if (galleryData.cursor == 'prev') {
                    galleryItemPointer = getNextImage(false, true);
                } else {
                    cursor = galleryData.cursor;
                    galleryItemPointer = images[selectedGallery][cursor];
                }
            }
        }
                
        
        handler.hideButtons(true);
        handler.hideLoader(false);
        handler.updateBlockPosition();    
        
        image = document.createElement("img");
        image.src = getImageUrlFromPointer(galleryItemPointer);  
        
        if (isImgLoaded(image)) handler.imageShow();
        else image.onload = function() { 
            handler.imageShow(); return false; 
        }	
    }
    
    this.getClientBounds = function() {
    
        var elem = (document.compatMode === "CSS1Compat") ? 
            document.documentElement :
            document.body;

        return {
            screenHeight: elem.clientHeight,
            screenWidth: elem.clientWidth,
        };
    }
    
    this.getScale = function() { return scale; }
    
    this.scale = function(plus) {
        
        var newScale = scale;
        var step = 0.1;
        if (!plus) step = step * -1;
        
        newScale += step;
        
        if (newScale < 0.5) return;
        scale = newScale;
        
        var rHeight = imageBounds.resizedHeight; // resized variables
        var rWidth = imageBounds.resizedWidth;
        
        var newHeight = Math.round(rHeight * scale);
        
        var k = newHeight / rHeight;
        
        rHeight = k * rHeight;
        rWidth = k * rWidth;
        
        var pos = {left : parseInt(image.style.left), top : parseInt(image.style.top)};
        var posCenter = {left : pos.left + parseInt(image.style.width) / 2, top : pos.top + parseInt(image.style.height) / 2};
        
        image.style.width = rWidth + 'px';
        image.style.height = rHeight + 'px';
        
        image.style.left = Math.floor(posCenter.left - (rWidth / 2)) + 'px';
        image.style.top = Math.floor(posCenter.top - (rHeight / 2)) + 'px';        
        
        handler.updateButtonsPos();
    }
    
    // get local coordinats event pos
    
    function getEventDot(e) {
        e = e || window.event;
        var x, y;
        
        // 
        var scrollX = 0; // document.body.scrollLeft + document.documentElement.scrollLeft;
        var scrollY = 0; // document.body.scrollTop + document.documentElement.scrollTop;
        
        var touches = [];
        if (e.touches && e.touches.length > 0) {
            
            for (var i = 0; i < e.touches.length; i++) {
                touches[i] = {
                    x : e.touches[i].clientX + scrollX,
                    y : e.touches[i].clientY + scrollY,
                }
                
                if (i == 0) {
                    x = touches[0].x;
                    y = touches[0].y;
                }
            }
            
        } else {
            // e.pageX e.pageY e.x e.y bad for cross-browser
            x = e.clientX + scrollX;
            y = e.clientY + scrollY;		
        }
        
        //var rect = canvas.getBoundingClientRect();

        return {x: x, y: y, touches : touches};
    }
    
    // unused
    this.updateCursor = function(e) {
    
        console.log(getEventDot(e));
    }
    
    function calcDistance(pointA, pointB) {
        var a = pointA.x - pointB.x;
        var b = pointA.y - pointB.y;

        return Math.sqrt( a*a + b*b );
    }

    this.drag = function(e) {
        
        var prevTouches = lastPos ? lastPos.touches : false;
        
        lastPos = getEventDot(e);
        if (lastPos.touches && lastPos.touches.length > 2){
            return;
        }
        
        /*
        if (!animationFrame) return false;
        
        window.requestAnimationFrame(function() {
            animationFrame = true;
        })
        
        animationFrame = false;
        */
        
        if (prevTouches && prevTouches.length > 1 && lastPos.touches.length > 1) {
        
            var zoomIn = calcDistance(prevTouches[0], prevTouches[1]) < calcDistance(lastPos.touches[0], lastPos.touches[1]) ? true : false;
            handler.scale(zoomIn);
            
        } else if (moveable || scale != 1) {
        
            var newPos = {left : move.left + lastPos.x - move.x, top : move.top + lastPos.y - move.y}
            
            image.style.left = newPos.left + 'px';
            image.style.top =  newPos.top + 'px';
            
        } else if (scale == 1 && swipe) { // lastPos && lastPos.touches.length == 1
        
            var newPos = {left : move.left + lastPos.x - move.x, top : move.top}
            image.style.left = newPos.left + 'px';
            
        } else return;
        
        handler.updateButtonsPos(newPos);
    }
    
    this.dragEnd = function(e) {
    
        isMoved = false;
        handler.removeEventPListener(document.body, "mousemove", 'image_drag_');
        handler.removeEventPListener(document.body, "mouseup", 'image_drag_');
        handler.removeEventPListener(document.body, "touchmove", 'image_drag_');
        handler.removeEventPListener(document.body, "touchend", 'image_drag_');
        
        if (!lastPos) return;
        
        if (scale == 1 && swipe) { // lastPos && lastPos.touches.length == 1
            
            //image.style.transition = 'left 0.3s';
            
            var diff = lastPos.x - move.x;
            if (Math.abs(diff) > 64) {
            
                var next = false;
                if (diff <= 0) {
                    next = true;
                    //image.style.right =  + 'px';
                }
                
                handler.nextImage(next);
                
            } else {
            
                if (image) {
                
                    var newPos = {left : move.left, top : move.top}
                
                    image.style.left = newPos.left + 'px';                
                    handler.updateButtonsPos(newPos);
                }
            }
            
        }     

        lastPos = false;
    }
    
    this.dragStart = function(e) {
        
        if (isMoved) return false;        
        if (beasy) return false;
        
        move = getEventDot(e);

        move.left = parseInt(image.style.left);
        move.top = parseInt(image.style.top);
        
        // console.log(move); // 884 - 554
        // move.x = parseInt(image.style.left)
        
        isMoved = true; 
        handler.addEventPListener(document.body, "mousemove", function (e) {
            handler.drag(e);
        }, 'image_drag_');
        handler.addEventPListener(document.body, "mouseup", function (e) {
            handler.dragEnd(e);
        }, 'image_drag_');
        handler.addEventPListener(document.body, "mouseout", function (e) {
            handler.dragEnd(e);
        }, 'image_drag_');
        handler.addEventPListener(document.body, "touchend", function (e) {
            handler.dragEnd(e);
        }, 'image_drag_');
        handler.addEventPListener(document.body, "touchmove", function (e) {
            handler.drag(e);
        }, 'image_drag_');
    }
    
    // calls after image fully loaded and ready to show
    
    this.imageShow = function() {
    
        beasy = false;
        
        var imgContainer = getEl('img'); 

        handler.hideLoader(true);
        handler.updateSize(false);
        
        if (userEvents.onBeforeImageShow && userEvents.onBeforeImageShow(handler, image)) {
            return;
        }
        
        imgContainer.innerHTML = '';
        imgContainer.appendChild(image);
  
        image.onmousedown = function(e) {
        
            handler.dragStart(e);
            return false;
        }
        
        image.ontouchstart = function (e) {
            handler.dragStart(e);
            return false;
        }
        
        setTimeout(function() { 
        
            image.style.opacity = '1'; 
            handler.hideButtons(false);             
            handler.updateButtonsPos(false);
            
        }, 100);         
    }
    
    this.updateSize = function(e) {
        
        if (!image) return false;
            
        var bounds = handler.getClientBounds(); 
        
        var padding = 20;
        
        var maxWidth = bounds.screenWidth - padding; 
        var maxHeight = bounds.screenHeight - padding; 
        
        if (!imageBounds) {
            imageBounds = {
                width : image.width, 
                height : image.height, 
                resizedWidth : image.width, 
                resizedHeight : image.height
            }; // save orig bounds before transform
        }
        
        var wRatio = maxWidth / imageBounds.width;
        var hRatio = maxHeight / imageBounds.height;
        
        // get value by biggest difference 
        var ratio = hRatio;
        if (wRatio < hRatio) ratio = wRatio;

        if (ratio < 1) { // resize if image bigger than screen
            imageBounds.resizedWidth = Math.floor(ratio * imageBounds.width);
            imageBounds.resizedHeight = Math.floor(ratio * imageBounds.height);
          
            // console.log('set Image to : ' + rWidth + ' |' + rHeight);
        }
        
        image.style.position = 'absolute';
        
        // console.log('maxWidth : ' + maxWidth + ' image Width' + image.width + ' maxHeight : ' + maxHeight + ' image Height ' + image.height);
        
        var newPos = {left : Math.round((bounds.screenWidth - imageBounds.resizedWidth) / 2), top : Math.round((bounds.screenHeight - imageBounds.resizedHeight) / 2 )};
        
        // todo check this values after scale
        
        image.style.width = imageBounds.resizedWidth + 'px';
        image.style.height = imageBounds.resizedHeight + 'px';
        image.style.left =  newPos.left + 'px';
        image.style.top = newPos.top + 'px';
           
        handler.updateButtonsPos(newPos);
        return true;
    }
    
    // hide show image block and cancel load
    
    this.cancelLoad = function(stage) {

        if (stage == 2) {
            beasy = false; 
            isMoved = false;
            
            if (image) {
                image.src = '';
                image = false;  
                
                if (image.parentNode) image.parentNode.removeChild(image);
            }
           
            var imgContainer = getEl('img'); 
                imgContainer.innerHTML = '';
            
            if (userEvents.onClose) {
                userEvents.onClose(handler);
            }				
            return;
            
        } else {
          
            if (image) {
                image.onload = function() { return false; };                
            }
            
            showMainBlock(false);
            
            imageBounds = false;
            beasy = 'close'; 
            
            handler.hideLoader(true);
            
            setTimeout(function() { handler.cancelLoad(2);}, fadeTime);  
        }
        
    }
    
    // update image gallery viewer block position 
    
    this.updateBlockPosition = function() {
        if (blockShown && window.getComputedStyle(block).position !== 'fixed') {
            block.style.top = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0) + 'px'; // getScrollTop
        }
    }

    
    // get image url from source string or element
    // if source is member of exist gallery - move cursor to source index and switch to source gallery
    
    function getImageUrlFromPointer(source) {
    
        var sourceImg = '';
        
        // change gallery by source - affects on next image functions and buttons
        
        if (typeof source !== 'string' && source.getAttribute('kellyGallery') && source.getAttribute('kellyGalleryIndex')) {
        
            selectedGallery = source.getAttribute('kellyGallery');
            cursor = parseInt(source.getAttribute('kellyGalleryIndex'));
            sourceImg = getUrlFromGalleryItem(images[selectedGallery][cursor]);
            
        } else {
        
            sourceImg = getUrlFromGalleryItem(source);
        }
        
        if (!sourceImg) {
            console.log('image not found for element');
            console.log(source);
        }
        
        return validateUrl(sourceImg);
    }
    
    function getUrlFromGalleryItem(item) {
    
        var url = '';
        if (typeof item == 'string') {
        
            url  = item;
            
        } else {
        
            url = item.getAttribute('data-image');
            if (!url) {
            
                     if (item.tagName == 'A') url = item.href;
                else if (item.tagName == 'IMG') url = item.src;
            }
        }
        
        return validateUrl(url);
    }
    
    function validateUrl(source) {
        if (!source) return '';	
        return source.trim();
    }
    
    function getSvgIcon(name, color) {
    
        if (!color) color = '#000';
        
        var icon = '';
        var bounds = '170 170';
        
        if (name == 'close') {
        
            icon = '<g>\
                    <title>' + name + '</title>\
                    <line x1="27.5" x2="145.5" y1="24.9" y2="131.9" fill="none" stroke="' + color + '" stroke-linecap="round" stroke-linejoin="undefined" stroke-width="19"/>\
                    <line x1="144" x2="28" y1="24.9" y2="131.9" fill="none" stroke="' + color + '" stroke-linecap="round" stroke-linejoin="undefined" stroke-width="19"/>\
                    </g>';
                    
        } else if (name == 'left' || name == 'right') {
        
            bounds = '120 120';
            icon = '<g>\
                     <title>' + name + '</title>\
                     <path transform="rotate(' + (name == 'right' ? '90' : '-90') + ' 61.24249267578127,65.71360778808595) " id="svg_1" \
                     d="m12.242498,108.588584l48.999996,-85.74996l48.999996,85.74996l-97.999992,0z" \
                     stroke-width="1.5" stroke="' + color + '" fill="' + color + '"/>\
                     </g>';
        } 
        
        return '<?xml version="1.0" encoding="UTF-8"?>\
                    <svg viewBox="0 0 ' + bounds + '" xmlns="http://www.w3.org/2000/svg">' + icon + '</svg>'; 
    }
    
    function getNextImage(next, updateCursor) {

        var items = images[selectedGallery];
        var nextItemIndex = cursor;  
        
             if (next && items.length-1 == cursor) nextItemIndex = 0;
        else if (next) nextItemIndex += 1;
        else if (!next && !cursor) nextItemIndex = items.length-1;
        else nextItemIndex -= 1;
        
        if (updateCursor) {
            cursor = nextItemIndex;
        }
        
        return items[nextItemIndex];
    }
    
    this.nextImage = function(next, stage, event) {             
             
        if (stage == 2) {
        
            beasy = false;            
            handler.loadImage(false, {cursor : next ? 'next' : 'prev'});
            
        } else { // select image and fade
        
            if (beasy) return false;
            if (!image) return false;
            
            var nextImage = getNextImage(next);            
            if (!nextImage) return false;
            
            if (userEvents.onNextImage) {
                userEvents.onNextImage(handler, nextImage, next);
            }
            
            handler.hideLoader(false);
            handler.hideButtons(true);
            
            beasy = 'nextImage';
            image.style.opacity = '0';
            
            // todo make load at same time as previuse image fades
            
            setTimeout(function() {
                handler.nextImage(next, 2, false);
                return false;
            }, fadeTime);
            
        }
    }
        
    // accept events to A or IMG elements, or elements with attribute "data-image" and specify gallery name, or accept data for some galleryName
    // galleryItems - array of elements or className or array of src strings
    // data-ignore-click = child for prevent loadImage when click on child nodes
    // galleryName - key for gallery that store this elements, detecting of next element based on this key
    
    this.addToGallery = function(galleryItems, galleryName, data) {
        
        if (!galleryName) galleryName = 'default';
        
        // accept by class name
        
        if (typeof galleryItems === 'string') {
            var className = galleryItems;
            images[galleryName] = document.getElementsByClassName(className);
            
        // accept by list of urls
        
        } else if (galleryItems.length) {
            images[galleryName] = galleryItems;
            
        } else return false;
        
        // addition data for gallery elements
        
        if (typeof data == 'object') {
            imagesData[galleryName] = data;
        }
        
        if (images[galleryName].length && typeof images[galleryName][0] === 'string') {
        
            // image gallery contain only urls
        
        } else {
        
            // image gallery contain elements associated with gallery items
            
            for (var i = 0, l = images[galleryName].length; i < l; i++)  {
                images[galleryName][i].setAttribute('kellyGallery', galleryName);
                images[galleryName][i].setAttribute('kellyGalleryIndex', i);
                
                handler.addEventPListener(images[galleryName][i], 'click', function(e) {
                    
                    preventEvent(e);
                    
                    // ignore click on child elements if attribute is setted
                    
                    if (this.getAttribute('data-ignore-click') == 'child' && e.target !== this) return true; // pass throw child events if they exist
                
                    handler.loadImage(this);
                    return false;
                    
                }, 'showGallery');
            }	
        }
        
        return true;    
    }
    
    this.addEventPListener = function(object, event, callback, prefix) {
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

    this.removeEventPListener = function(object, event, prefix) {
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
    
    this.removeEvents = function(galleryName) {
        
        if (!images || !images[galleryName] || !images[galleryName].length) return false;
        
        for (var i = 0, l = images[galleryName].length; i < l; i++)  {
            var item = images[galleryName][i];
            if (typeof item == 'string') continue;
            
            handler.removeEventPListener(item, 'click', 'showGallery');
        }
    }
    
    constructor(cfg);
}


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\lib\kellyLoc.js



var KellyLoc = new Object();

    // buffered i18n.getMessage data
    KellyLoc.locs = {};		
    KellyLoc.browser = -1;
    
    // deprecated, detectLanguage not required for i18n mode
    KellyLoc.detectLanguage = function() {	

        var language = window.navigator.userLanguage || window.navigator.language;
        if (language) {
            if (language.indexOf('-') != -1) language = language.split('-')[0];
            
            language = language.trim();

            return language;
        } else return this.defaultLanguage;
        
    }
    
    KellyLoc.parseText = function(text, vars) {
        
        if (!text) return '';
        
        if (vars) {
            for (var key in vars){
                if (typeof vars[key] != 'function') {
                    text = text.replace('__' + key + '__', vars[key]);
                }
            }
        } 
        
        return text;
    }
    
    KellyLoc.s = function(defaultLoc, key, vars) {
        
        if (this.locs[key]) return this.parseText(this.locs[key], vars);
        
        if (this.browser == -1) this.browser = KellyTools.getBrowser();
        
        if (!this.browser || !this.browser.i18n || !this.browser.i18n.getMessage) return this.parseText(defaultLoc, vars);
        
        this.locs[key] = this.browser.i18n.getMessage(key);
        if (!this.locs[key]) this.locs[key] = defaultLoc;  
        
        return this.parseText(this.locs[key], vars);
    }


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\lib\kellyStorageManager.js



// part of KellyFavItems extension

function KellyFavStorageManager(cfg) {
    
    var handler = this;
    
    var MAX_ENV_SIZE = 300; // mb 
    var MAX_TOTAL_PER_DB = 30; // mb ~60000 images
    var MAX_CONFIG_SIZE = 2; // mb
    
    // prefixes modified by environment on init, relative to current site environment file
    // todo add list all storages for extension
    
    this.prefix = 'kelly_db_';
    this.prefixCfg = 'kelly_cfg_';
    
    this.api = KellyTools.getBrowser();
    
    this.wrap = false;
    
    this.className = 'KellyFavStorageManager';
    this.mergeProcess = false;
    
    this.driver = 'localstorage'; // config always loads from localstorage
    
    this.storageContainer = false; 
    this.storageList = false;
    
    this.inUse = false;
    
    this.fav = false; // kellyFavHelper
    this.favValidKeys = ['categories', 'items', 'ids', 'selected_cats_ids', 'meta', 'coptions', 'cats_assoc_buffer'];
        
    
    var lng = KellyLoc; // singleton
    
    this.format = 'json';
    this.slist = false;
    
    // todo - add check total amount of data without prefix, it can differs in future, if more then one environment will supported
    this.envTotalKb = 0;
    
    function constructor(cfg) {	}
            
    this.showMessage = function(text, error, section) {
    
        var	message = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-message' + (section ? '-' + section : ''));            
        if (!message) return;
        
        message.className = message.className.replace(handler.className + '-error', '').trim();
        
        if (error) message.className += ' ' + handler.className + '-error';
        KellyTools.setHTMLData(message, text);
        
        handler.inUse = false;
    }
    
    this.showStorageList = function(slist) {	
    
        if (!handler.storageList) return;
        
        handler.slist = slist;
        
        var html = '\
            <div class="' + handler.className + '-DBItems-total">\
                ' + lng.s('Общий размер данных', 'storage_manager_total') + ' : <span>' + (!slist.length ? '0' +  lng.s('кб', 'kb') :  lng.s('Загрузка', 'loading') + '...') + '</span>\
            </div>\
            ';        
    
            html += '\
            <div class="' + handler.className + '-DBItems-notice">\
                ' + lng.s('', 'storage_manager_' + handler.driver + '_notice') + '\
            </div>\
            ';  
            
        KellyTools.setHTMLData(handler.storageList, html);
        
        handler.envTotalKb = 0;
        var itemsLoaded = 0;
        
        for (var i=0; i < slist.length; i++) {
        
            var dbItem = document.createElement('DIV');
                dbItem.className = handler.className + '-DBItem';
                
                if (handler.fav.getGlobal('fav').coptions.storage == slist[i]) {
                    dbItem.className += ' active';
                }
            
            var dbName = slist[i];
                
            var html = '<span class="' + handler.className + '-DBItem-name">' + slist[i] + '</span>';
                html += '<span class="' + handler.className + '-DBItem-size ' + handler.className + '-' + dbName + '" ></span>';
                
            // if (handler.fav.isDownloadSupported) {
                html += '<a class="' + handler.className + '-DBItem-download' + '" href="#">' + lng.s('Скачать', 'download') + '</a>';
            // }
                html += '<a class="' + handler.className + '-DBItem-select' + '" href="#">' + lng.s('Выбрать', 'select') + '</a>';
        
            KellyTools.setHTMLData(dbItem, html);
                
            handler.storageList.appendChild(dbItem);			
            
            handler.getDBSize(dbName, false, function(dbName, size) {
                
                KellyTools.getElementByClass(handler.storageList, handler.className + '-' + dbName).innerText = parseFloat(size).toFixed(2) + 'кб';
                
                handler.envTotalKb += size;
                itemsLoaded++;
                
                if (itemsLoaded == slist.length) {
                    
                    var totalEl = KellyTools.getElementByClass(handler.storageList, handler.className + '-DBItems-total');
                    KellyTools.getElementByTag(totalEl, 'span').innerText = parseFloat(handler.envTotalKb).toFixed(2) + lng.s('кб', 'kb');
                }
            });
            
            var selectButton = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-select');
                selectButton.setAttribute('data-dbname', slist[i]);
                selectButton.onclick = function() {
                
                    if (!this.getAttribute('data-dbname')) return false;
                    
                    handler.fav.getGlobal('fav').coptions.storage = this.getAttribute('data-dbname');
                    handler.fav.save('cfg', function(error) {
                    
                        handler.getStorageList(handler.showStorageList);
                        handler.fav.load('items', function() {					
                            // clear selected ?
                            handler.fav.updateFavCounter();
                            handler.fav.resetFilterSettings();
                            handler.showMessage(lng.s('База данных выбрана', 'storage_selected'), false, 'storage');
                        });					
                    });
    
                    return false;
                }
            // if (handler.fav.isDownloadSupported) {	
            var downloadButton = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-download');
                downloadButton.setAttribute('data-dbname', slist[i]);
                downloadButton.onclick = function() {
                    var dbName = this.getAttribute('data-dbname');
                    
                    handler.loadDB(dbName, function(db) {
                    
                        if (db === false) {
                            return false;							
                        }
                        
                        var path = handler.fav.getGlobal('env').profile + '/Storage/ExportedDBs/' + dbName + '_' + KellyTools.getTimeStamp() + '.' + handler.format;
                            path = KellyTools.validateFolderPath(path);
                            
                        handler.fav.getDownloadManager().createAndDownloadFile(JSON.stringify(db), path);	
                    });
                    
                    return false;
                }
            // }    
        }
    
    }
    
    this.showCfgManager = function() {
        
        if (!handler.wrap) return;
        if (handler.inUse) return;
        
        handler.wrap.innerHTML = '';
        
        var overwriteId = handler.className + '-overwrite';
        var html = '\
            <div class="' + handler.className + '-wrap">\
                <table class="' + handler.className + '-options-table">\
                    <tr><td colspan="2"><h3>' + lng.s('Экспорт \\ Импорт настроек', 'storage_io_options') + '</h3></td></tr>\
                    <tr><td>' + lng.s('Загрузить из файла', 'storage_load_from_file') + '</td><td><input type="file" id="' + handler.className + '-cfg-file"></td></tr>\
                    <tr><td colspan="2">\
                        <input type="submit" class="' + handler.className + '-io-export" value="' + lng.s('Экспорт', 'storage_io_options_export') + '">\
                        <input type="submit" class="' + handler.className + '-io-import" value="' + lng.s('Импорт', 'storage_io_options_import') + '">\
                    </td></tr>\
                    <tr><td colspan="2"><div class="' + handler.className + '-message ' + handler.className + '-message-delete"></div></td></tr>\
                </table>\
            </div>\
        ';
        
        handler.storageContainer = document.createElement('DIV');
        KellyTools.setHTMLData(handler.storageContainer, html);
        
        var importCfgButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-io-export');
            importCfgButton.onclick = function() {
                
                if (handler.inUse) return false;
                handler.inUse = true;
                
                var fileInput = document.getElementById(handler.className + '-cfg-file');
                if (fileInput.value) {
                
                    KellyTools.readInputFile(fileInput, function(input, fileData) {
                        
                        var fileSizeMb = fileData.length / 1000 / 1000;
                        
                        if (fileSizeMb > MAX_CONFIG_SIZE) {
                            
                            fileSizeMb = fileSizeMb.toFixed(2);
                            handler.showMessage(lng.s('', 'storage_manager_hit_limit_db', { MAX_CONFIG_SIZE : MAX_CONFIG_SIZE, FILESIZE : fileSizeMb}), true);	
                            return;
                        }
                        
                        var newCfgData = KellyTools.parseJSON(fileData.trim());                          
                        if (newCfgData) { 
                        
                                var onDBSave =  function(error) {
                                
                                    if (!error) {
                                        
                                        handler.fav.load('cfg', function() {
                                            handler.inUse = false;
                                            handler.fav.showOptionsDialog(handler.fav.getGlobal('env').className + '-Cfg');

                                            var menuItems = handler.fav.getView('menu');
                                            if (menuItems['ctoptions']) menuItems['ctoptions'].style.display = handler.fav.getGlobal('fav').coptions.optionsSide ? 'none' : '';                                              
                                            handler.showMessage(lng.s('', 'storage_import_ok'));
                                        });						
                                        
                                    } else {
                                    
                                        handler.showMessage(lng.s('', 'storage_import_e2'), true);
                                    }
                                    
                                };
                                
                                newCfgData = handler.validateCfg(newCfgData);
                                
                                handler.saveDB('config', newCfgData, onDBSave, true);
                                
                           
                        } else {
                            handler.showMessage(lng.s('Ошибка парсинга структурированных данных', 'storage_create_e2'), true);	
                        }
                        
                    });
                
                } else {
                    
                    handler.showMessage(lng.s('Укажите файл из которого будут импортированы настройки', 'storage_import_e1'), true);	
                }
                
                return false;
            }
            
            var downloadButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-io-import');
                downloadButton.onclick = function() {
                 
                    var path = handler.fav.getGlobal('env').profile + '/Storage/ExportedCfgs/config_' + KellyTools.getTimeStamp() + '.' + handler.format;
                        path = KellyTools.validateFolderPath(path);
                    
                    var currentSession = handler.fav.getGlobal('fav');
                    
                    handler.fav.getDownloadManager().createAndDownloadFile(JSON.stringify({ 
                        selected_cats_ids : currentSession.selected_cats_ids, 
                        coptions : currentSession.coptions
                    }), path);	
                
                    return false;
                }   
                
        handler.wrap.appendChild(handler.storageContainer);
    }
        
    this.showDBManager = function() {
    
        if (!handler.wrap) return;
        if (handler.inUse) return;
        
        handler.wrap.innerHTML = '';
        
        var overwriteId = handler.className + '-overwrite';
        var html = '\
            <div class="' + handler.className + '-wrap">\
                <table class="' + handler.className + '-options-table">\
                    <tr><td>' + lng.s('Тип хранения данных', 'storage_type') + ' :</td><td>\
                        <select class="' + handler.className + '-driver">\
                            <option value="localstorage" ' + (handler.driver == 'localstorage' ? 'selected' : '') + '>Localstorage</option>\
                            <option value="api" ' + (handler.driver == 'api' ? 'selected' : '') + '>Browser API (<b>beta</b>)</option>\
                        </select>\
                    </td></tr>\
                    <tr><td colspan="2">' + lng.s('', 'storage_type_notice') + '</td></tr>\
                    <tr><td colspan="2"><h3>' + lng.s('Добавить новую базу', 'storage_add_new') + '</h3></td></tr>\
                    <tr><td>' + lng.s('Загрузить из файла', 'storage_load_from_file') + '</td><td><input type="file" id="' + handler.className + '-db-file"></td></tr>\
                    <tr><td>' + lng.s('Идентификатор базы', 'storage_name') + '</td><td><input type="text" id="' + handler.className + '-create-name" placeholder="custom_data"></td></tr>\
                    <tr><td><label for="' + overwriteId + '-cancel">' + lng.s('Отмена если существует', 'storage_create_cancel_if_exist') + '</label></td>\
                        <td><input type="radio" name="' + overwriteId + '" id="' + overwriteId + '-cancel" value="cancel" checked></td></tr>\
                    <tr style="display : none;"><td><label for="' + overwriteId + '-overwrite">Перезаписать если существует</label></td>\
                        <td><input type="radio" name="' + overwriteId + '" id="' + overwriteId + '-overwrite" value="overwrite" ></td></tr>\
                    <tr><td><label for="' + overwriteId + '-add">' + lng.s('', 'storage_create_add_if_exist') + '</label></td>\
                        <td><input type="radio" name="' + overwriteId + '" id="' + overwriteId + '-add" value="add"></td></tr>\
                    <tr><td colspan="2"><input type="submit" class="' + handler.className + '-create" value="' + lng.s('Создать', 'create') + '"></td></tr>\
                    <tr><td colspan="2"><div class="' + handler.className + '-message"></div></td></tr>\
                    <tr><td colspan="2"><h3>' + lng.s('Управление данными', 'storage_manage') + '</h3></td></tr>\
                    <tr><td colspan="2"><div class="' + handler.className +'-StorageList"></div></td></tr>\
                    <tr><td colspan="2"><div class="' + handler.className + '-message ' + handler.className + '-message-storage"></div></td></tr>\
                    <tr><td colspan="2"><h3>' + lng.s('Удалить базу данных', 'storage_delete') + '</h3></td></tr>\
                    <tr><td>' + lng.s('Идентификатор базы', 'storage_name') + '</td><td><input type="text" id="' + handler.className + '-delete-name" placeholder="custom_data"></td></tr>\
                    <tr><td colspan="2"><input type="submit" class="' + handler.className + '-delete" value="' + lng.s('Удалить', 'delete') + '"></td></tr>\
                    <tr><td colspan="2"><div class="' + handler.className + '-message ' + handler.className + '-message-delete"></div></td></tr>\
                </table>\
            </div>\
        ';
        
        handler.storageContainer = document.createElement('DIV');
        KellyTools.setHTMLData(handler.storageContainer, html);
        
        var driver = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-driver');
            driver.onchange = function() {
            
                var newDriver = KellyTools.val(this.options[this.selectedIndex].value);
            
                if (handler.fav.getGlobal('fav').coptions.storageDriver != newDriver) { 
                
                    handler.fav.getGlobal('fav').coptions.storageDriver = newDriver;
                    handler.driver = newDriver;
                    
                    handler.fav.save('cfg', function () {
                    
                        handler.getStorageList(handler.showStorageList);
                        handler.fav.load('items', function() {
                            
                            handler.fav.updateFavCounter();
                        });					
                    });					
                }
            }
        
        handler.storageList = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-StorageList');			
        
        
        var removeButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-delete');
            removeButton.onclick = function() {
                
                if (handler.inUse) return false;
                handler.inUse = true;
                
                var dbName = KellyTools.inputVal(document.getElementById(handler.className + '-delete-name')); 	
                if (!dbName) {
                    handler.showMessage('Введите название базы данных', true, 'delete');
                    return false;
                }
                
                if (handler.slist && handler.slist.indexOf(dbName) == -1) {
                    
                    handler.showMessage('Базы данных не существует', true, 'delete');
                    return false;					
                }
                
                handler.removeDB(dbName, function(error) {
                    
                    handler.showMessage('Данные удалены', true, 'delete');					
                    handler.getStorageList(handler.showStorageList);
                });	
                
                return false;
            };
            
        var createNewButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-create');
            createNewButton.onclick = function() {
                
                if (handler.inUse) return false;
                handler.inUse = true;
                
                var dbName = KellyTools.inputVal(document.getElementById(handler.className + '-create-name')); // todo validate by regular	
                if (!dbName) {
                    handler.showMessage(lng.s('Введите название базы данных', 'storage_empty_name'), true);
                    return false;
                }
                
                var overwrite = document.getElementById(overwriteId + '-overwrite').checked ? true : false;
                var add       = document.getElementById(overwriteId + '-add').checked ? true : false;
                var cancel    = document.getElementById(overwriteId + '-cancel').checked ? true : false;
                
                mode = 'cancel';
                if (add) mode = 'add';
                if (overwrite) mode = 'overwrite'; // dont needed - use delete instead, more safe and clear for user
                
                if (handler.slist === false) {

                    handler.showMessage(lng.s('Дождитесь загрузки списка баз данных', 'storage_beasy'), true);
                    return false;
                }
                
                var envMb = handler.envTotalKb / 1000;
                    
                if (envMb > MAX_ENV_SIZE) {
                                        
                    envMb = envMb.toFixed(2);
                    handler.showMessage(lng.s('', 'storage_manager_hit_limit_env', { MAX_ENV_SIZE : MAX_ENV_SIZE, ENVSIZE : envMb}), true);	
                    return false;
                }
                
                // check cached data before ask dispetcher
                if (mode == 'cancel' && handler.slist.indexOf(dbName) != -1) {
                    
                    handler.showMessage(lng.s('База данных уже существует', 'storage_create_already_exist'), true);
                    return false;					
                }
                
                // request if any bd already exist
                handler.loadDB(dbName, function(db) {
                    
                    if (db !== false && mode == 'cancel') {
                        handler.showMessage(lng.s('База данных уже существует', 'storage_create_already_exist'), true);
                        return false;							
                    }
                    
                    var onDBSave =  function(error) {
                    
                        if (!error) {
                            
                            var noticeName = 'storage_create_ok_mcancel';
                            if (db && mode == 'add') {
                                noticeName = 'storage_create_ok_madd';
                            }
                            
                            handler.getStorageList(handler.showStorageList);							
                            handler.showMessage(lng.s('', noticeName));
                            
                        } else {
                        
                            handler.showMessage(lng.s('Ошибка добавления базы данных', 'storage_create_e1'), true);
                        }
                        
                    };
                            
                    // load data from input file
                    
                    var fileInput = document.getElementById(handler.className + '-db-file');
                    if (fileInput.value) {
                    
                        KellyTools.readInputFile(fileInput, function(input, fileData) {
                            
                            var fileSizeMb = fileData.length / 1000 / 1000;
                            
                            if (fileSizeMb > MAX_TOTAL_PER_DB) {
                                
                                fileSizeMb = fileSizeMb.toFixed(2);
                                handler.showMessage(lng.s('', 'storage_manager_hit_limit_db', { MAX_TOTAL_PER_DB : MAX_TOTAL_PER_DB, FILESIZE : fileSizeMb}), true);	
                                return;
                            }
                            
                            var newDBData = KellyTools.parseJSON(fileData.trim());                          
                            if (newDBData) { 
                            
                                if (db && mode == 'add') {
                                    
                                    newDBData = handler.validateDBItems(newDBData);

                                    var result = handler.addDataToDb(db, newDBData);
                                    
                                    handler.log(result);  
                                    
                                    newDBData = db;
                                    handler.saveDB(dbName, newDBData, onDBSave);
                                } else {
                                    newDBData = handler.validateDBItems(newDBData);	
                                    handler.saveDB(dbName, newDBData, onDBSave);
                                }
                            } else {
                                handler.showMessage(lng.s('Ошибка парсинга структурированных данных', 'storage_create_e2'), true);	
                            }
                            
                        });
                    
                    } else {
                        
                        handler.saveDB(dbName, handler.getDefaultData(), onDBSave);
                    }
                    
                });
                
                return false;
            }
        
        handler.getStorageList(handler.showStorageList);
        
        handler.wrap.appendChild(handler.storageContainer);
    }
    
    /* IN DEV Not tested */

    this.mergeDB = function(dbsKeys) {
        
        if (handler.mergeProcess) return;
        if (!dbsKeys || dbsKeys.length <= 1) return;
        
        handler.mergeProcess = {
            dbs : {},
            loaded : 0,
            container : false,
            dbsKeys : dbsKeys,
        }
        
        for (var i=0; i < dbsKeys.length; i++) {
            handler.mergeProcess.dbs[dbsKeys[i]] = -1;
            handler.loadDB(name, function(db) { 
                onLoadDb(db, dbsKeys[i]);	
            });
        }
        
        var onLoadDb = function(db, key) {
            
            var mergeData = handler.mergeProcess;
            
            mergeData.loaded++;
            if (mergeData.loaded != mergeData.dbsKeys.length) return;
            
            mergeData.container = mergeData.dbs[mergeData.dbsKeys[0]];
            
            for (var i=1; i < dbsKeys.length; i++) {
                handler.addDataToDb(mergeData.container, mergeData.dbs[dbsKeys[i]]);
            }			
        }
        
    }

    this.addCategoriesToDb = function(item, newItem) {

    }
   
    this.getCategoryBy = function(db, input, method) {
        
        var index = handler.searchCategoryBy(db, input, method);
        if (index !== false) return db.categories[index];
        
        return {id : -1, name : KellyLoc.s('Удаленная категория', 'removed_cat')};      
    }
    
    this.getCategoryById = function(db, id) {
        
        id = parseInt(id);
                            
        for (var i = 0; i < db.categories.length; i++) {
            if (id == db.categories[i].id) return db.categories[i];
        }  
        
        return {id : -1, name : KellyLoc.s('Удаленная категория', 'removed_cat')};
    }
    
    this.categoryOrder = function(cats, index, up) {
        
        index = parseInt(index);
        
        if (!cats.length) return index;
        
        if (up && index == 0) {
            return index;
        }
        
        if (!up && index == cats.length - 1) {
            return index;
        }
        
        var switchIndex = up ? index - 1 : index + 1;
        var item = cats[index]; 
                
        var switchItem = cats[switchIndex]; 
        var switchOrder = switchItem.order;
        
        switchItem.order = item.order;
        item.order = switchOrder;
        
        cats[index] = switchItem;
        cats[switchIndex] = item;

        return switchIndex;
    }
    
    this.sortCategories = function(cats) {
        
        cats.sort(function(a, b) {
            if (!a.order) {
                a.order = cats.indexOf(a);
            }
            
            if (!b.order) {
                b.order = cats.indexOf(b);
            }
            return b.order - a.order;
        });
        
        for (var i = 0; i < cats.length; i++) {
            cats[i].order = cats.length - i;
        }
    }
    
    // search item by post link
    // item - {link : URL} or {commentLink : URL}
    // 
    
    this.searchItem = function(db, item) {
        
        var link = '';	
        var searchComment = false;
        
        if (item.commentLink) {
            link = KellyTools.getRelativeUrl(item.commentLink);
            searchComment = true;
        } else {
            link = KellyTools.getRelativeUrl(item.link);
        }
        
        if (!link) return false;
        
        for (var b = 0; b < db.items.length; b++) {
        
            if (searchComment && KellyTools.getRelativeUrl(db.items[b].commentLink) == link) {
                return b;
            } else if (!searchComment && KellyTools.getRelativeUrl(db.items[b].link) == link && !db.items[b].commentLink) {
                return b;
            }		
        }
        
        return false;
    }

    this.searchCategoryBy = function(db, input, method) {
        
        if (!method) method = 'name';   
        
        for (var c = 0; c < db.categories.length; c++) {
            if (db.categories[c][method] == input) return c;
        }
        // todo safe in buffer
        return false;
    }
    
    this.categoryAssocToString = function(assoc) {
        
        if (!assoc) return '';
        if (typeof assoc != 'object') return '';
        if (!assoc.length) return '';
        
        var string = '';
        
        for (var i = 0; i < assoc.length; i++) {
            assoc[i] = KellyTools.val(assoc[i], 'string');
            if (assoc[i]) {
                string += string ? ',' + assoc[i] : assoc[i];
            }            
        }
        
        return string;
    }
    
    this.categoryAssocFromString = function(assoc) {
             
        return KellyTools.getVarList(assoc, 'string');
    }
    
    this.updateAssocBuffer = function(db) {
        
        var pool = {};
        
        for (var i = 0; i < db.categories.length; i++) {
            if (!db.categories[i].assoc) continue;
            if (typeof db.categories[i].assoc != 'object') {
                pool[db.categories[i].id] = handler.categoryAssocFromString(db.categories[i].assoc);
            }
        }
        
        db.cats_assoc_buffer = pool;
        return pool;
    }
    
    this.addAssocCatsByTag = function(db, tag) {
        
        if (!db.cats_assoc_buffer) {
            handler.updateAssocBuffer(db);
        }
        
        var catAssocs = db.cats_assoc_buffer;
        
        for (var i = 0; i < db.categories.length; i++) {
            
            if (!catAssocs[db.categories[i].id] || !catAssocs[db.categories[i].id].length) continue;
            
            if (catAssocs[db.categories[i].id].indexOf(tag) != -1) {
                            
                if (db.selected_cats_ids.indexOf(db.categories[i].id) == -1) {
                    db.selected_cats_ids.push(db.categories[i].id);
                } 
            
            }
        }
        
        return false;
    }
    
    // todo move category edit to here
    
    this.categoryCreate = function(db, name, catIsNSFW, order, assoc) {
        
        if (!name) return false;
        
        for (var i = 0; i < db.categories.length; i++) {
            if (db.categories[i].name == name) {
               return false;
            }
        }
        
        if (!order) {
            order = db.categories.length + 1;
        }
          
        db.ids++;
        
        var key = db.categories.length;
        
        db.categories[key] = { 
            name : name, 
            id : db.ids, 
            nsfw : catIsNSFW,
            order : order,
        };

        if (assoc) {
            db.categories[key] = assoc;
        }        

        return db.ids;
    }
    
    this.copyObjectValues = function(from, to) {
        for (var k in from){
            if (typeof from[k] !== 'function') {
                to[k] = from[k];
            }
        }
    }

    // assoc input data categories to db categories, add new to db if not exist
    
    function convertCategoriesForDataItem(db, data, item, stats) {
        
        var assocDataCats = [];
        if (!item || !item.categoryId) return assocDataCats;
        
        var dataCats = item.categoryId;
        
        // console.log(data.categories);
         
        for (var c = 0; c < dataCats.length; c++) {
            
            var categoryId = dataCats[c];
            var dataCat = handler.getCategoryById(data, categoryId);
            
            if (dataCat.id == -1) {                
                handler.log('convertCategoriesForDataItem : skip unexist cat in data array - ' + categoryId);
                continue;
            }
            
            if (!dataCat.name) continue;
            
                dataCat.name = KellyTools.val(dataCat.name);
                
            if (!dataCat.name) continue;
             
            var existCatIndex = handler.searchCategoryBy(db, dataCat.name, 'name');
            
            if (existCatIndex !== false) {
                
                assocDataCats[assocDataCats.length] = db.categories[existCatIndex].id;
                
            } else {
                
                var newCatIndex = db.categories.length;
                
                db.categories[newCatIndex] = {};
                handler.copyObjectValues(dataCat, db.categories[newCatIndex]);
                
                db.ids++;
                db.categories[newCatIndex].id = db.ids;
                
                assocDataCats[assocDataCats.length] = db.categories[newCatIndex].id;
                
                if (stats) stats.newCategories++;
                
            }
        }
        
        return assocDataCats;
    }
    
    this.addDataToDb = function(db, data) {
        
        var limit = 0; // for tests
        
        if (!limit) {
            
            limit = data.items.length;
        }
        
        var stats = {
            
            added : 0,
            updated : 0,
            newCategories : 0,
        }
        
        for (var i = 0; i < limit; i++) {
            
            var existIndex = handler.searchItem(db, data.items[i]);
     
            if (existIndex !== false) {
                
                // merge categories
                
                data.items[i].categoryId = convertCategoriesForDataItem(db, data, data.items[i], stats);
                
                for (var b = 0; b < data.items[i].categoryId.length; b++) {
                    
                    if (db.items[existIndex].categoryId.indexOf(data.items[i].categoryId[b]) == -1) {                        
                        db.items[existIndex].categoryId[db.items[existIndex].categoryId.length] = data.items[i].categoryId[b];
                    }                    
                }
                
                stats.updated++;
                
            } else {
            
                // create new item 
                
                existIndex = db.items.length;
                
                db.items[existIndex] = {};
                handler.copyObjectValues(data.items[i], db.items[existIndex]);			
                
                db.ids++;
                
                db.items[existIndex].id = db.ids;                
                db.items[existIndex].categoryId = convertCategoriesForDataItem(db, data, data.items[i], stats);
                
                stats.added++;
            }
            
        }
        
        return stats;
    }
            
    this.getStorageList = function(callback, keepPrefix) {
                
        if (handler.driver == 'localstorage') {
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getLocalStorageList", 
                prefix : handler.prefix,
                keepPrefix : keepPrefix,
            }, function(response) {
                if (callback) callback(response.slist);				
            });
            
        } else {
                
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getApiStorageList", 
                prefix : handler.prefix,
                keepPrefix : keepPrefix,
            }, function(response) {
            
                if (callback) callback(response.slist);
            });
            
        }
    }
    
    // get database size in kb by default
    
    this.getDBSize = function(name, inBytes, callback) {
    
        name = handler.validateDBName(name);
        
        if (!name) {
            if (callback) callback(name, 0);
            return;
        }
        
        var dbName = handler.getFullDBName(name, cfg);
        
        if (handler.driver == 'localstorage') {
        
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getLocalStorageItem", 
                dbName : dbName,
            }, function(response) {
            
                if (!response.item) bytes = 0;
                
                if (inBytes) {
                    bytes = response.item.length;
                } else {
                    bytes = response.item.length / 1000;
                }	
                
                if (callback) callback(name, bytes);
            });
            
        } else {
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getApiStorageItemBytesInUse", 
                dbName : dbName,
            }, function(response) {
            
                if (!response.bytes) response.bytes = 0;
                
                if (!inBytes) {
                    response.bytes = response.bytes / 1000;
                }
            
                if (callback) callback(name, response.bytes);
            });
        }
    }

    this.log = function(text) {
        KellyTools.log(text, 'KellyStorageManager');
    }

    this.getDefaultData = function() {

        return {
            ids : 100,
            categories : [
                {id : 1, name : 'GIF', protect : true, order : -1},
                {id : 2, name : 'NSFW', nsfw : true, protect : true, order : -1},
            ],
            items : [],
            // native_tags : [],
        }
    }

    this.validateCfg = function(data) {
        
        var env = handler.fav.getGlobal('env');
        
        for (var key in data) {            
            if (typeof data[key] == 'function') {
                handler.log('data key ' + key + ' function is not allowed');
                delete data[key];
            } else if (handler.favValidKeys.indexOf(key) == -1) {
                handler.log('data key ' + key + ' is not allowed');
                delete data[key];
            }
        }
        
        if (!data.selected_cats_ids || typeof data.selected_cats_ids != 'object' || !(data.coptions instanceof Array)) {
            data.selected_cats_ids = [];
        }
        
        // defaults 
            
        if (!data.coptions || typeof data.coptions != 'object' || !(data.coptions instanceof Object)) {            
            
            data.coptions = {                
                syncByAdd : false,
                newFirst : true,
                hideSoc : true,
                optionsSide : false,
            };
        }
        
        if (!data.coptions.grabber) {
            
            data.coptions.grabber = {
                nameTemplate : '#number#_#filename#', // '#category_1#/#number#_#filename#'
                baseFolder : env.profile + '/' + 'Downloads',
                invertNumeration : true,
                quality : 'hd',
            };
        }
        
        if (!data.coptions.grid)  {
            
            data.coptions.grid = {
                fixed : false,
                rowHeight : 250,
                heightDiff : 10,
                min : 2, 
                cssItem : '',
                perPage : 60,
                type : 'dynamic',
                viewerShowAs : 'hd',
            };
        }  
          
        if (!data.coptions.fastsave) {
            
            data.coptions.fastsave = {
                baseFolder : env.profile + '/' + 'Fast',
                // nameTemplate : '#category_1#/#id#_#category_1#_#category_2#_#category_3#',
                enabled : false,
                check : false,
                conflict : 'overwrite',
            };
        }
        
        if (!data.coptions.downloader) {
            
            data.coptions.downloader = {
                //perPage : 200,
                skipEmpty : true,
                autosaveEnabled : false,
                tagList : '', // white list \ black list of categories
                catByTagList : '', // autocreate category by list of names
            }
        } 
        
        if (!data.coptions.storage) {
            data.coptions.storage = 'default';
        }
           
        if (!data.coptions.comments_blacklist)  data.coptions.comments_blacklist = [];
        if (!data.coptions.posts_blacklist)  data.coptions.posts_blacklist = [];
       
        if (!data.coptions.grabberDriver) {
            
            if (env.getRecomendedDownloadSettings) {
                data.coptions.grabberDriver = env.getRecomendedDownloadSettings();
            } else {
                data.coptions.grabberDriver = KellyGrabber.validateDriver(false);
            }                
        }        
                
        if (!data.coptions.storageDriver) {
            data.coptions.storageDriver = 'localstorage';
        }
        
        data.coptions.debug = data.coptions.debug ? true : false;     
        data.coptions.newFirst = data.coptions.newFirst ? true : false;       
        data.coptions.hideSoc = data.coptions.hideSoc ? true : false;                   
        data.coptions.syncByAdd = data.coptions.syncByAdd ? true : false;   
        
        return data;
    }
    
    // todo check links .items.pImage and .link and .commentLink
    this.validateDBItems = function(data) {
        
        for (var key in data) {            
            if (typeof data[key] == 'function') {
                handler.log('data key ' + key + ' function is not allowed');
                delete data[key];
            } else if (handler.favValidKeys.indexOf(key) == -1) {
                handler.log('data key ' + key + ' is not allowed');
                delete data[key];
            }
        }
        
        if (!data.categories) data.categories = [];
        if (!data.items) data.items = [];
        if (!data.ids) data.ids = 100;
        
        for (var i = 0; i < data.items.length; i++) {
            
            if (!data.items[i].categoryId) data.items[i].categoryId = [];
            if (!data.items[i].id) {
                
                data.ids++;
                data.items[i].id = data.ids;
            }
            
            for (var b = 0; b < data.items[i].categoryId.length; b++) {
                data.items[i].categoryId[b] = parseInt(data.items[i].categoryId[b]);
            }
        }       
        
        return data;
    }
    
    this.validateDBName = function(name) {
        if (!name || typeof name != 'string') return '';
        
        name = name.trim();
        
        if (!name) return '';
                
        return name.replace(/[^A-Za-z0-9_]/g, '');
    }

    
    this.getFullDBName = function(name, cfg) {
        
        return (cfg ? handler.prefixCfg : handler.prefix) + name;
        //return (cfg ? handler.prefixCfg : handler.prefix) + handler.fav.getGlobal('env').profile + '_' + name;
    }

    // callback(db)
    
    this.loadDB = function(name, callback, cfg) {
        
        name = handler.validateDBName(name);		
        if (!name) {
            if (callback) callback(false);
            return;
        }
        
        var dbName = handler.getFullDBName(name, cfg);
        
        if (handler.driver == 'localstorage' || cfg) {
        
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getLocalStorageItem", 
                dbName : dbName,
            }, function(response) {
                
                var db = false;
                
                if (response.item) {
                    
                    db = KellyTools.parseJSON(response.item);
                                        
                    if (!db) {
                        handler.log('db exist but structured data parsing fail ' + name);
                        db = false;
                    }
                    
                } else {
                    handler.log('unexist db key ' + name);                  
                }
                
                if (callback) callback(db);
            });
            
            
        } else {
        
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getApiStorageItem", 
                dbName : dbName,
            }, function(response) {

                if (!response.item || response.item === null || !response.item[dbName]) {
                    handler.log('unexist db key ' + name);
                    response.item = false;
                } else {
                    response.item = response.item[dbName];
                }
                // 	handler.copyObjectValues(response.item[dbName], db);
                                
                if (callback) callback(response.item);
                
            });
            
        }
    }
    
    // callback(error)

    this.removeDB = function(name, callback, cfg) {
            
        name = handler.validateDBName(name);
        
        if (!name) {
            if (callback) callback('empty or bad DB name');
            return;
        }
        
        var dbName = handler.getFullDBName(name, cfg);
        
        if (handler.driver == 'localstorage' || cfg) {
        
            KellyTools.getBrowser().runtime.sendMessage({
                method: "removeLocalStorageItem", 
                dbName : dbName,
            }, function(response) {
                
                if (callback) callback(false);
            });
                
        } else {
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "removeApiStorageItem", 
                dbName : dbName,
            }, function(response) {
                
                if (callback) callback(response.error);
            });			
        }
    } 
    
    // callback(error)
    // todo если понадобится, то хранить мета информацию (дата последнего изменения \ кол-во элементов и тд) в localstorage, реализовать методы .metaSet \ .metaGet
    
    this.saveDB = function(name, data, callback, cfg) {
            
        name = handler.validateDBName(name);
        
        if (!name) {
            if (callback) callback('empty or bad DB name');
            return;
        }
        
        var dbName = handler.getFullDBName(name, cfg);
        
        if (!cfg && handler.fav && handler.fav.getGlobal('env')) {
            
            // all storage data that can be accessed wihout JSON parse
            
            data.meta = '[meta_start]' + handler.fav.getGlobal('env').profile + '|' + KellyTools.getGMTDate() + '[meta_end]';
        }
        
        if (handler.driver == 'localstorage' || cfg) {
        
            // проверить поведение при пороговых значениях (~3-4мб данных)
            // upd. данные не сохраняются. Выполняется вызов исключения. добавлен в обработку ошибок despetcher
            // проверка корректного исполнения save в kellyFavItems не выполняется, добавить
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "setLocalStorageItem", 
                dbName : dbName,
                data : data,
            }, function(response) {
            
                if (response.error) {
                    handler.log(response.error);
                }
                
                if (callback) callback(response.error ? true : false);
            });
            
        } else {
            
            // при больших объемах данных данные сохраняются корректно (тесты при 40-100мб данных, фрагментация 1-2 мегабайта на одно хранилище)
            
            var save = {};
                save[dbName] = data;
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "setApiStorageItem", 
                dbName : dbName,
                data : save,
            }, function(response) {
                
                if (callback) callback(response.error);
            });
        }	   
    }
    
    constructor(cfg);
}


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\lib\kellyThreadWork.js



function KellyThreadWork(cfg) {


    var jobs = [];
    var env = false;
    var maxThreads = 1; // эксперименты чреваты баном за спам запросами, пробовать только за впном или если у вас динамический адрес
    var threads = [];
    var iframeC = 0;
    
    var timeout = 15; // таймаут ожидания загрузки страницы в секундах, в обработчик onLoad попадет response = false
    var timeoutOnEnd = [2, 2.2, 1.1, 3.4, 4, 3, 3, 3, 4.6]; // таймер перехода к следующей задаче после выполнения - сек. рандомно из массива
    
    // long pause every
    var pauseEvery = [40,30,20];
    var untilPause = getRandom(pauseEvery);
    var pauseTimer = [10,14,20];
    
    var beasy = false;
    var events = { onProcess : false, onEnd : false };
    var handler = this;
    var threadId = 1;
    
    
    function constructor(cfg) {
    
        handler.updateCfg(cfg);
    }
    
    function parseTimeset(text) {        
        
        if (typeof text == 'string') {            
            text = KellyTools.getVarList(text, 'float');            
        } 
        
        if (text && text.length) {
            
            var list = [];
            
            for (var i = 0; i < text.length; i++) {
                
                var tmp = text[i];
                
                if (typeof tmp != 'number') {
                    tmp = KellyTools.val(tmp, 'float');
                }
                
                if (tmp <= 0) continue;
                
                list[list.length] = tmp;                
            }
            
            return list;
            
        } else {
            return [];
        }
        
    }
    
    function timesetToString(timeset) {
        var string = '';
        
        for (var i = 0; i < timeset.length; i++) {
            string += string ? ',' + timeset[i] : timeset[i];
        }
        
        return string;
    }
    
    this.getCfg = function() {
        return {
            pauseEvery : timesetToString(pauseEvery),
            pauseTimer : timesetToString(pauseTimer),
            timeoutOnEnd : timesetToString(timeoutOnEnd),
            timeout : timeout,
            maxThreads : maxThreads,
        }
    }
    
    this.updateCfg = function(cfg) {
        
        if (!cfg) return;
        
        if (cfg.env) {
            env = cfg.env;
        }

        cfg.pauseEvery = parseTimeset(cfg.pauseEvery);
        
        if (cfg.pauseEvery.length) {
            pauseEvery = cfg.pauseEvery;            
            untilPause = getRandom(pauseEvery);
        }     
        
        cfg.pauseTimer = parseTimeset(cfg.pauseTimer);
        
        if (cfg.pauseTimer.length) {
            pauseTimer = cfg.pauseTimer;
        } 
        
        cfg.timeoutOnEnd = parseTimeset(cfg.timeoutOnEnd);
        if (cfg.timeoutOnEnd.length) {
            timeoutOnEnd = cfg.timeoutOnEnd;
        }
        
        cfg.timeout = KellyTools.val(cfg.timeout, 'float');  
        if (cfg.timeout > 2) {
            timeout = cfg.timeout;
        }
        
        cfg.maxThreads = KellyTools.val(cfg.maxThreads, 'int');
        if (cfg.maxThreads >= 1 && cfg.maxThreads <= 15) {
            maxThreads = cfg.maxThreads;
        }
    }
    
    function getRandom(input) {
        return input[Math.floor(Math.random() * ((input.length - 1) + 1))];
    }
    
    this.getJobs = function() {
        return jobs;
    }
    
    this.setEvent = function(name, f) {
        
        events[name] = f;    
    }
    
    this.stop = function(noCleanJobs) {
                    
        for (var i = 0; i < threads.length; i++) {
            
            if (threads[i].request) {
                threads[i].request.abort();
            }
            
            if (threads[i].timeoutTimer) {
                clearTimeout(threads[i].timeoutTimer);
                threads[i].timeoutTimer = false;
            }
        }
        
        threads = [];
        jobs = [];
        KellyTools.log('clean job', 'KellyThreadWork');
    }
        
    // todo add watch dog with timeout for long jobs
    
    this.onJobEnd = function(thread) {

        if (thread.timeoutTimer) {
            clearTimeout(thread.timeoutTimer);
            thread.timeoutTimer = false;
        }
        
        var threadIndex = threads.indexOf(thread);
        if (threadIndex == -1) return;
        
        threads.splice(threadIndex, 1);

        if (!thread.response) {
            // error
            KellyTools.log('job end without load document', 'KellyThreadWork');
            KellyTools.log(thread, 'KellyThreadWork');
        }

        thread.job.onLoad(handler, thread, jobs.length);
        
        if (events.onProcess) events.onProcess(jobs.length, thread);
        
        if (!jobs.length && !threads.length) {   
        
            if (events.onEnd) events.onEnd();
            
        } else {
            
            var timeout = getRandom(timeoutOnEnd);
            
            if (pauseEvery && pauseEvery.length) {
                
                if (untilPause > 0) {
                    untilPause--;
                    KellyTools.log('before pause ' + untilPause, 'KellyThreadWork');
                } else {
                    untilPause = getRandom(pauseEvery);
                    timeout = getRandom(pauseTimer);
                    
                    KellyTools.log('timeout ' + timeout + ' | new pause ' + untilPause, 'KellyThreadWork');
                    
                }
            }
            
            // clean timer ?
            setTimeout(function() {        
                 applayJob();
            }, timeout * 1000);
        }
    }

    function validateResponse(response) {
    
        if (response.indexOf('<body>') != -1) {
            response = response.replace(/(\r\n\t|\n|\r\t)/gm,"");
            response = response.match(/<body>([\s\S]*?)<\/body>/g); // (.*?)
            if (response && response.length >= 1) {
                response = response[0].replace(/<\/?body>/g,'')
            } else return 0;
            
        } else return 0;
        
        return response;
    }
    
    function applayJob() {
    
        if (threads.length >= maxThreads) return false;
        if (!jobs.length && !threads.length) {            
            if (events.onEnd) events.onEnd();
            return false;
        }
        
        if (!jobs.length) {            
            return false;
        }
        
        threadId++;
        var thread = {       
            job : jobs.pop(),
            response : false,
            request : false,
            id : threadId,
            error : '',
        }   
      
        var request = new XMLHttpRequest();
            request.open('GET', thread.job.url, true);

            request.onload = function() {
              if (this.status == 200) {		  
                thread.response = validateResponse(this.response);
              } else {
                thread.response = 0;
                thread.error = 'XMLHttpRequest : bad response status ' + this.status;
              }
              
              handler.onJobEnd(thread);
            };

            request.onerror = function() {
               
               thread.response = 0;
               thread.error = 'XMLHttpRequest : error without exit status check Access-Control-Allow-Origin';
               
               handler.onJobEnd(thread);
            };
            
            request.send();
        
        // may be banned as cross site scripting if protocol or domain differs
        /*	
            var request = getIframe();
                request.src = thread.job.url + '?' + env.getGlobal('env').actionVar + '=sanitize';
        */		
        
        thread.request = request;
        thread.timeoutTimer = setTimeout(function() {        
            handler.onJobEnd(thread);        
        }, timeout * 1000);
        
        threads[threads.length] = thread;
        
        return true;            
    }
    
    this.exec = function() {
    
        if (beasy) return false;
        
        if (!jobs.length) {            
            if (events.onEnd) events.onEnd();
            return false;
        }
        
        for (var i = 1; i <= maxThreads; i++) {
            if (!applayJob()) return false;
        }
      
    }
    
    // data - page \ nik \ etc
    
    this.addJob = function(url, onLoad, data) {
    
        if (typeof onLoad !== 'function') {
            onLoad = false;
        }
            
        var job = {
            url : url,
            onLoad : onLoad,
            data : data,
        };
        
        jobs[jobs.length] = job;
    }
    
    constructor(cfg);
}


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\lib\kellyGrabber.js



// part of KellyFavItems extension
// config saved onChangeState
// todo 
// - check dublicates during one task
// - ignore downloaded option
//   KellyTools.getBrowser().runtime.sendMessage({method: "isFilesDownloaded", filenames : [KellyTools.getUrlFileName(env.getImageDownloadLink(postMedia[0]))]}, onSearch);
// - revers numbers option

function KellyGrabber(cfg) {
    
    var handler = this;   
    
    var downloadingIds = []; // ids from chrome API that returned for each download process
  
    // array of current added throw method addDownloadItem download items
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
    
    downloads = []; 
        
    // .downloadId values constants
  
    var downloadsOffset = 0; // start from element N
    var ids = 0; // counter for downloads
    
    var acceptItems = false;
    
    var events = { 
    
        /*
            onDownloadAllEnd(handler, result)
            
            calls on download process ended
            
            you can check list of all current downloads (see methods handler.getDownloads and handler.getDownloadItemState)            
            addition returned result data
            
            result = {
                total     - num af items in download process
                complete  - successfull downloaded
                failed    - fails num
                failItems - fail items as downloadItem ojects
            }
        */
        
        onDownloadAllEnd : false, 
        
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
    };
    
    this.nameTemplate = false;
    
    var style = false;
    var className = 'kellyGrabber-';
    
    
    /*
        TRANSPORT_BLOBBASE64
    
        for bad designed browsers that cant catch blob url from front sended to background (currently 02.10.18 problem in firefox)
        so instead URL.createObjectURL(blob) string, full blob data encoded to base64 will be sended to background process for every file
        
        TRANSPORT_BLOB
        
        better performance
    */
    
    var transportMethod = KellyGrabber.TRANSPORT_BLOB; // TRANSPORT_BLOBBASE64;
    
    /*
        REQUEST_IFRAME 
        
        load url by iframe and get data from it throw postMessage, to avoid CORS
               
        REQUEST_XML 

        request url data by XML http request
    */
    
    var requestMethod = KellyGrabber.REQUEST_IFRAME;
    var requestIframeId = 0;

    
    var buttons = {};
    
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
    
    function constructor(cfg) {
        handler.resetOptions();
        handler.updateCfg(cfg);
    }
    
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
    
    this.resetOptions = function() {
        options = {	
            nameTemplate : '#category_1#/#number#_#filename#', 
            baseFolder : 'grabber',
            maxDownloadsAtTime : 2,
            interval : 1,
            cancelTimer : 3 * 60, 
            quality : 'hd',
            itemsList : '',
            invertNumeration : true,
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
        
    this.showGrabManager = function() {
    
        if (!handler.container) return false;
        
        var extendedClass = className + '-controll-extended ' + (extendedOptionsShown ? 'active' : 'hidden'); 
        var extendedShowTitle = {
            show : lng.s('Показать расширенные настройки', 'grabber_show_extended'),
            hide : lng.s('Скрыть расширенные настройки', 'grabber_hide_extended'),
        };
       
        if (!options.baseFolder) {
            handler.setBaseFolder(fav.getGlobal('env').profile + '/Downloads');
        }
       
        var html = '\
            <div class="' + className + '-controll">\
                <table>\
                    <tr><td>\
                        <label>' + lng.s('Основная директория', 'grabber_common_folder') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="' + lng.s('Директория', 'folder') + '" class="' + className + '-controll-baseFolder" value="' + options.baseFolder + '">\
                    </td></tr>\
                    <tr><td>\
                        <label>' + lng.s('Элементы', 'grabber_selected_items') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="1-2, 44-823, 1-999..." class="' + className + '-itemsList" value="' + options.itemsList + '">\
                    </td></tr>\
                    <!--tr class="' + className + '-range-tr"><td>\
                        <label>' + lng.s('Диапазон', 'grabber_range') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="С" class="' + className + '-from" value="">\
                        <input type="text" placeholder="По" class="' + className + '-to" value="">\
                    </td></tr-->\
                    <tr class="' + className + '-quality-tr"><td colspan="2">\
                        <label><input type="radio" name="' + className + '_image_size[]" value="hd" class="' + className + '-quality" checked>' + lng.s('Оригинал', 'grabber_source') + '</label>\
                        <label><input type="radio" name="' + className + '_image_size[]" value="preview" class="' + className + '-quality">' + lng.s('Превью', 'grabber_preview') + '</label>\
                    </td></tr>\
                    <tr class="' + className + '-extended-show-row"><td colspan="2">\
                        <label><a href="#" class="' + className + '-extended-show">' + extendedShowTitle[extendedOptionsShown ? 'hide' : 'show'] + '</a></label>\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>' + lng.s('Шаблон названия', 'grabber_name_template') + ' (<a href="#" class="' + className + '-nameTemplate-help">' + lng.s('Подсказка', 'tip') + '</a>)</label>\
                    </td><td>\
                        <input type="text" placeholder="" class="' + className + '-nameTemplate" value="' + options.nameTemplate + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td colspan="2">\
                        <label>' + lng.s('Инвертировать нумерацию', 'grabber_flip_numbers') + ' \
                            <input type="checkbox" class="' + className + '-invertNumeration" ' + (options.invertNumeration ? 'checked' : '') + '>\
                        </label>\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>' + lng.s('Количество потоков', 'grabber_threads_num') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-threads" value="' + options.maxDownloadsAtTime + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>' + lng.s('Интервал загрузки (сек)', 'grabber_interval') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-interval" value="' + options.interval + '">\
                    </td></tr>\
                    <tr class="' + extendedClass + '"><td>\
                        <label>' + lng.s('Таймаут при долгом выполнении запроса (сек)', 'grabber_timeout') + '</label>\
                    </td><td>\
                        <input type="text" placeholder="1" class="' + className + '-timeout" value="' + options.cancelTimer + '">\
                    </td></tr>\
                    <!--tr><td colspan="2">\
                        <label>' + lng.s('Исключать изображения с низким разрешением', 'grabber_exclude_lowres') + '</label>\
                        <label><input type="checkbox" class="' + className + '-exclude-low-res" value="1"></label>\
                    </td></tr-->\
                    <tr><td colspan="2"><div class="' + className + '-controll-buttons"></div></td></tr>\
                    <tr><td colspan="2">\
                        <div class="' + className + '-progressbar">\
                            <span class="' + className + '-progressbar-line ' + className + '-progressbar-line-ok"></span>\
                            <span class="' + className + '-progressbar-line ' + className + '-progressbar-line-err"></span>\
                            <span class="' + className + '-progressbar-state"></span>\
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
            updateTooltip : function() {
               
                if (!this.tooltip) {
                    return;
                }
                
                if (this.rendered !== false && this.rendered == failItems.length) {
                    return;
                }
                 
                var html = '';
                for (var i=0; i < failItems.length; i++) {
                    html+= '<p><b>#' + failItems[i].num + '</b> - ' + failItems[i].reason + '</p>';
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
           
            errorProgress.updateTooltip();
            
            setTimeout(function() {
                
                errorProgress.tooltip.show(true);                    
                errorProgress.tooltip.updatePosition();
                
            }, 100);
            
            return false;
        }        
            
        var baseFolderInput = KellyTools.getElementByClass(handler.container, className + '-controll-baseFolder');
            baseFolderInput.onchange = function() {
                
                handler.setBaseFolder(this.value);
                
                this.value = options.baseFolder;
                return;
            }        
            
        var itemsList = KellyTools.getElementByClass(handler.container, className + '-itemsList');
            itemsList.onchange = function() {
                
                if (!KellyTools.getPrintValues(this.value, false, 1, downloads.length).length) {                    
                    showNotice('grabber_selected_items_not_found', 1);    
                    this.value = '';
                }
                
                options.itemsList = this.value;                
                updateContinue(true);
                return;
            }  

        var invertNumeration = KellyTools.getElementByClass(handler.container, className + '-invertNumeration');
            invertNumeration.onchange = function() {
                
                options.invertNumeration = this.checked ? true : false;
                
                handler.clearStateForImageGrid();
                handler.updateStateForImageGrid();
                
                return;
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
                return;
            }       
            
            
        var quality = handler.container.getElementsByClassName(className + '-quality');
        if (quality) {
            for (var i=0; i < quality.length; i++) {		
                quality[i].onclick = function() {
                    options.quality = this.value == 'hd' ? 'hd' : 'preview';
                    
                    handler.setDownloadTasks();
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
                return false;
            }
        
        var threadsInput = KellyTools.getElementByClass(handler.container, className + '-threads');
            threadsInput.onchange = function() {
                                
                options.maxDownloadsAtTime = parseInt(this.value);
                if (!options.maxDownloadsAtTime || options.maxDownloadsAtTime < 0) options.maxDownloadsAtTime = 1;
                
                this.value = options.maxDownloadsAtTime;
            }
   
        var intervalInput = KellyTools.getElementByClass(handler.container, className + '-interval');
            intervalInput.onchange = function() {
                                
                options.interval = KellyTools.val(this.value, 'float');               
                if (!options.interval || options.interval < 0.1) options.interval = 0.1;
               
                this.value = options.interval;
            }
            
        var cancelInput = KellyTools.getElementByClass(handler.container, className + '-timeout');
            cancelInput.onchange = function() {
                                
                options.cancelTimer = KellyTools.val(this.value, 'float');                
                if (!options.cancelTimer || options.cancelTimer < 2) options.cancelTimer = 5 * 60;                
                
                this.value = options.cancelTimer;
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
            
            KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.keepAliveListener"}, function(response) {
                handler.download();
            });   
            
            updateContinue(true); 
            return false;
        });  
        
        continueBtn.style.display = 'none';        
        
        handler.addControllEl('save_as_json', lng.s('Скачать файл данных', 'grabber_save_as_json'), function() {
        
            fav.downloadFilteredData();            
            return false;
        }); 

        var logBtn = handler.addControllEl('save_log', lng.s('Скачать лог', 'grabber_save_log'), function() {
        
            downloadLog();            
            return false;
        });   

        logBtn.style.display = 'none';
        
        handler.updateStartButtonState('start');
        updateProgressBar();        
    }
    
    function updateProgressBar() {
        
        if (downloadProgress && downloadProgress.line) { 
        
            var total = downloads.length;
            if (acceptItems) {
                total = acceptItems.length;
            }
            
            var current = handler.countCurrent('complete');
            if (current > total) {
                toTxtLog('COUNTER more that total items. CHECK COUNTER ' + current + ' / ' + total);
                current = total;
            }
            
            var complete = Math.round(current / (total / 100));
            var bad = failItems.length ? Math.round(failItems.length / (total / 100)) : 0;
                        
            downloadProgress.state.innerText = current + ' / ' + total;        
            downloadProgress.line.style.width = complete + '%';
            
            if (bad > 0) {
                downloadProgress.lineErr.style.width = bad + '%';
            } else {
                downloadProgress.lineErr.style.width = '0px';
            }
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
    
        var fname = fav.getGlobal('env').profile + '/Storage/Logs/';
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
                                       
        var envVars = fav.getGlobal('env');
        var tooltip = new KellyTooltip({
            target : 'screen', 
            offset : {left : 20, top : -20}, 
            positionY : 'bottom',
            positionX : 'left',				
            ptypeX : 'inside',
            ptypeY : 'inside',
           // closeByBody : true,
            closeButton : true,
            removeOnClose : true,                    
            selfClass : envVars.hostClass + ' ' + envVars.className + '-tooltipster-help',
            classGroup : envVars.className + '-tooltipster',
        });
           
        var html = lng.s('', localizationKey);
        
        if (num > 1) {
            for (var i = 1; i <= num; i++) {
                html += lng.s('', localizationKey + '_' + i);
            }
        }
           
        var tcontainer = tooltip.getContent();
        KellyTools.setHTMLData(tcontainer, '<div>' + html + '</div>');
        
        tooltip.show(true);   
        tooltip.updatePosition();
        
        setTimeout(function() {
            tooltip.updateCfg({closeByBody : true});            
        }, 400);     
                    
        return true;
    }
    
    function showDownloadItemInfoTooltip(downloadIndex, target) {
    
        if (KellyTools.getElementByClass(document, fav.getGlobal('env').className + '-tooltipster-help')) {
            return;
        }
        
        if (!downloads[downloadIndex]) return;
        
        if (!handler.initDownloadItemFile(downloads[downloadIndex])) return;
        
        var item = downloads[downloadIndex].item;
        var tooltipEl = fav.getTooltip();
            tooltipEl.updateCfg({
                target : target, 
                offset : {left : 0, top : 0}, 
                positionY : 'top',
                positionX : 'right',				
                ptypeX : 'outside',
                ptypeY : 'inside',
                avoidOutOfBounds : false,
            });
            
        var baseClass = fav.getGlobal('env').className + '-tooltipster-ItemInfo';
        
        var itemInfo = document.createElement('div');
            itemInfo.className = baseClass;
            itemInfo.id = baseClass + '-' + downloadIndex;
            
        var html = lng.s('Сохранить как', 'grabber_save_as') + ' : <br>' + downloads[downloadIndex].filename + '.' + downloads[downloadIndex].ext + '<br><br>';
            html += fav.showItemInfo(item);
            
            if (downloads[downloadIndex].error) {
                html += 'error : ' + downloads[downloadIndex].error + '<br><br>';
                console.log(downloads[downloadIndex]);
            }
            
            KellyTools.setHTMLData(itemInfo, html);
    
        var tcontainer = tooltipEl.getContent();
            tcontainer.innerHTML = '';
            tcontainer.appendChild(itemInfo);
            
        tooltipEl.show(true);
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
                
            //    KellyTools.log(handler.isItemShown(downloads[i].item));
            if (!downloads[i].item) continue;
            
            var downloadItemId = imageClassName + '-' + downloads[i].item.id;
            var itemN = options.invertNumeration ? downloads.length - i : i + 1;
         
            if (downloads[i].subItem !== false) {                
                if (!subItems[downloads[i].item.id]) subItems[downloads[i].item.id] = [];
                subItems[downloads[i].item.id].push(i);                
            }
            
            var itemContainer = document.getElementById(downloadItemId);
            if (!itemContainer) {
                continue;
            }       
            
            // KellyTools.log(imageClassName + '-' + downloads[i].item.id);
        
            var holder = KellyTools.getElementByClass(itemContainer, imageClassName + '-download-state-holder');
                        
            if (!holder) {
                
                holder = document.createElement('DIV');
                holder.className = imageClassName + '-download-state-holder';
                holder.setAttribute('downloadIndex', i);
                
                var title = '#' + itemN;
                if (downloads[i].subItem !== false) {
                    
                    var itemNto = options.invertNumeration ? itemN - downloads[i].item.pImage.length+1 : itemN + downloads[i].item.pImage.length-1;
                    title += '-#' + itemNto;
                }
              
                var html = '\
                    <div class="' + imageClassName + '-download-number" data-start="' + itemN + '"><span>' + title + '</span></div>\
                    <div class="' + imageClassName + '-download-status"></div>\
               ';
               
                KellyTools.setHTMLData(holder, html);
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
                
                KellyTooltip.addTipToEl(holder, function(el, e){
                
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
            
            // update state by last item in collection

            if (downloads[i].subItem === false || downloads[i].subItem == downloads[i].item.pImage.length-1) {
                
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
            
            var textNodes = document.getElementsByClassName(imageClassName + '-download-number');
            for (var i = 0; i < textNodes.length; i++) {
                var textNode = KellyTools.getElementByTag(textNodes[i], 'span');                
                KellyTools.fitText(textNodes[i], textNode);
            }
            
        }, 100);
    }  
    
    this.getDownloadItemState = function(ditem) {
        
        if (!ditem.item) return 'skip';
        
        var itemIndex = downloads.indexOf(ditem);        
        if (itemIndex == -1) return 'skip';
        
        var acceptIndex = options.invertNumeration ? downloads.length - itemIndex : itemIndex+1;        
        if (acceptItems && acceptItems.indexOf(acceptIndex) == -1) return 'skip';
        
        if (ditem.downloadDelta) { // currently count any. Possible states - downloadDelta.state.current == "interrupted" / "complete"
            
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
    
    function assignEvents() {
    
        if (eventsEnabled) return;
        
        // sometimes runtime may be undefined after debug breakpoints
        // https://stackoverflow.com/questions/44234623/why-is-chrome-runtime-undefined-in-the-content-script
        
        // moved to refresh before download process
        // KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.keepAliveListener"}, function(response) {});
                
        KellyTools.getBrowser().runtime.onMessage.addListener(
            function(request, sender, sendResponse) {

            if (request.method == "onChanged") {       
                
                handler.onDownloadProcessChanged(request.downloadDelta);                
            }
        });  
        
        eventsEnabled = true;
    
    }
    
    this.onDownloadProcessChanged = function(downloadDelta) {
        
        if (mode != 'download') return;
        
        // KellyTools.log('incoming ' + downloadDelta.id);
        // its not our item, exit
        if (downloadingIds.indexOf(downloadDelta.id) === -1) {
            KellyTools.log('download id not found, skip ' + downloadDelta.id, 'KellyGrabber');
            return false;
        }
        
        if (downloadDelta.state) {
            
            if (downloadDelta.state.current != "in_progress") {
                
                // KellyTools.log(downloadDelta);
                downloadingIds.splice(downloadingIds.indexOf(downloadDelta.id), 1);
            
                var downloadIndex = handler.getDownloadById(downloadDelta.id);
                if (downloadIndex === false) {
                
                    KellyTools.log('item by download id not found in common stack', 'KellyGrabber');
                    KellyTools.log(downloadDelta, 'KellyGrabber');
                    
                    return false;
                }
                
                var downloadItem = downloads[downloadIndex];
                   
                if (downloadItem.cancelTimer) {
                    clearTimeout(downloadItem.cancelTimer);
                    downloadItem.cancelTimer = false;
                }
                 
                downloadItem.downloadDelta = downloadDelta;
                downloadItem.workedout = true;
                
                updateProgressBar();
                
                handler.onDownloadEnd(downloadItem);
               
            } else {
                
                // KellyTools.log(downloadDelta);
                // KellyTools.log(downloadDelta.url + 'download process ' + downloadDelta.fileSize);
            } 
            
            
        }
        
        handler.updateStateForImageGrid();
    }
    
    function updateProcessState() {
            
        var inProgress = handler.countCurrent('in_progress');
        var waitingNum = handler.countCurrent('wait');
        
        if (!waitingNum && !inProgress) {
            
            if (events.onDownloadAllEnd) {
                
                var response = {
                    
                    total : acceptItems ? acceptItems.length : downloads.length,
                    complete : handler.countCurrent('complete'),
                    failed : failItems.length,
                    failItems : failItems,
                }
                
                events.onDownloadAllEnd(handler, response);
            }
                                
            handler.updateStartButtonState('start');
            updateContinue(true);
        } 
        
        return {inProgress : inProgress, waitingNum : waitingNum};
    }
    
    this.onDownloadEnd = function(ditem) {
        
        var curState = updateProcessState();                
        if (curState.waitingNum) {
        
            setTimeout(function() {                        
                handler.addDownloadWork();
            }, options.interval * 1000);
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
        
        if (ditem.filename !== false) {
            return ditem;
        }
        
        var item = ditem.item;
        
        if (typeof item.pImage !== 'string') {                           
            ditem.url = fav.getGlobal('env').getImageDownloadLink(item.pImage[ditem.subItem], options.quality == 'hd');            
        } else {        
            ditem.url = fav.getGlobal('env').getImageDownloadLink(item.pImage, options.quality == 'hd');
        }        
               
        if (!ditem.url || ditem.url.length < 6) {
                        
            addFailItem(ditem, 'Некорректный Url скачиваемого файла ' + ditem.url);
            return false;
            
        } else {
            
            ditem.ext = KellyTools.getExt(ditem.url);
            
            if (!ditem.ext) {  
                
                addFailItem(ditem, 'Неопределено расширение для загружаемого файла ' + ditem.url);
                return false;
            }
        }
                
        var fileName = getNameTemplate();       
        if (item.categoryId) {            
        
            var categories = fav.getGlobal('fav').categories;
            var sm = fav.getStorageManager();
                sm.sortCategories(categories);
               
            var itemCatN = 0;
              
            for (var i = 0; i < categories.length; i++) {            
                if (item.categoryId.indexOf(categories[i].id) != -1) {
                    itemCatN++;
                    // KellyTools.log('#category_' + itemCatN + '#' + ' - replace - ' + favItems.categories[i].name);
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
            
            if (!fileUrlName) {
                
                KellyTools.log('cant find filename for ' + item.id);
                KellyTools.log(item);
                KellyTools.log(getNameTemplate());
                
                addFailItem(ditem, 'Ошибка получения имени файла (#filename#) для Url ' + ditem.url);                
                return false;
            }
            
            fileName = KellyTools.replaceAll(fileName, '#filename#', fileUrlName);
        }
        
        if (fileName.indexOf('#number#') != -1) {
            
            var itemIndex = downloads.indexOf(ditem);            
            var itemN = options.invertNumeration ? downloads.length - itemIndex : itemIndex+1;
            
            fileName = KellyTools.replaceAll(fileName, '#number#', itemN); 
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
        }
        
        return options.baseFolder;
    }
    
   
    this.getDownloads = function() {
        // todo deselect inaccepted 
        return downloads;
    }
    
    // full reset
    
    this.clearDownloads = function() {
        downloads = [];
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
                buttons['init'].innerText = lng.s('Начать выгрузку', 'grabber_start');
                buttons['init'].onclick = function() { 
                    downloadsOffset = 0;
                    handler.resetDownloadItems(false);
                     
                    KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.keepAliveListener"}, function(response) {
                        handler.download();
                    }); 
                    
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
                    return false;
                }       
            }
        }
      
        if (log && buttons['save_log']) {
             buttons['save_log'].style.display = 'block';
        }       
    }
    
    function updateContinue(hide) {
        
        if (!buttons['continue']) return;
        
        if (hide) {
            buttons['continue'].style.display = 'none';
            return;
        }
        
        var lastReadyIndex = 0;
        for (var i = downloadsOffset; i <= downloads.length-1; i++) {
            var state = handler.getDownloadItemState(downloads[i]);            
            if (state != 'complete' && state != 'skip') {
                break;
            } else {               
               lastReadyIndex = i;
            }
        }
        
        if (lastReadyIndex) {
            buttons['continue'].setAttribute('data-start-from', lastReadyIndex);            
            buttons['continue'].style.display = 'block';
        } else {
            buttons['continue'].style.display = 'none';
        }
    }
    
    this.cancelDownloads = function(onCancel) {    
        
        if (!downloads.length) return;
        
        if ( buttons['init'] ) {
             buttons['init'].innerText = lng.s('Остановка...', 'grabber_canceling');        
        }
        
        changeState('cancel');
        
        // that shold call from event OnStateChanged
                
        var untilStop = 0;      
 
        var checkAllCanceled = function() {            
            
            if (untilStop <= 0) {
                updateContinue();

                handler.resetDownloadItems(true);
                handler.updateStartButtonState('start');
                
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
                    downloads[i].dataRequest = false;
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
        
    this.downloadUrl = function(downloadOptions, onDownload) {
        
        if (!downloadOptions) return false;
        if (!downloadOptions.url) return false;
        if (!downloadOptions.filename) return false;
        
        if (!onDownload) {
            // some browser require default response function for API
            onDownload = function(response) {};
        }
        
        var isBlob = false;
        if (downloadOptions.url instanceof Blob) {
            downloadOptions.url = URL.createObjectURL(downloadOptions.url);
            isBlob = true;
        }
        
        KellyTools.getBrowser().runtime.sendMessage({method: "downloads.download", blob : isBlob, download : downloadOptions}, onDownload);             
        
        return true;
    }
    
    
    function toTxtLog(str) {
    
        log += '[' + KellyTools.getTime() + '] ' + str + "\r\n";
    }
    
    // download file by request as blob data. GET | ASYNC
    // callback(url, data (false on fail), errorCode, errorNotice);
    
    this.getDataFromUrl = function(urlOrig, callback) {
        
        if (requestMethod == KellyGrabber.REQUEST_XML) {
        
            var xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';

                xhr.onload = function(e) {
                    if (this.status == 200) {
                        
                        if (transportMethod == KellyGrabber.TRANSPORT_BLOBBASE64) {
                            
                            KellyTools.blobToBase64(this.response, function(base64) {
                                
                                callback(urlOrig, {base64 : base64, type : xhr.getResponseHeader('content-type')});
                              
                            });
                            
                        } else {
                        
                            callback(urlOrig, this.response);
                        }
                        
                    } else {
                        callback(urlOrig, false, this.status, this.statusText);
                    }
                };

                xhr.onerror = function(e) {
                    
                    callback(urlOrig, false, -1, 'check connection or domain mismatch (Access-Control-Allow-Origin header) | input url ' + urlOrig);
                };

                xhr.open('get', urlOrig, true);
                xhr.send();  
            
            return xhr;
            
        } else {
            
            var getIframe = function() {
            
                requestIframeId++;
                
                var iframe = document.createElement('iframe');
                    iframe.name = className + '-iframe-' + requestIframeId;
                    iframe.style.display = 'none';
                    iframe.style.width   = '1px';
                    iframe.style.height  = '1px';
                    
                document.getElementsByTagName('body')[0].appendChild(iframe);  
                return iframe;    
            }            
            
            var iframe = getIframe();
            
            var eventPrefix = 'input_message_' + iframe.name;
            var closeConnection = false;
            var onLoadIframe = false;                        
            
            onLoadIframe = function(e) {
                     
                if (!e.data || !e.data.method || closeConnection) return false;
                
                if (iframe && iframe.contentWindow === e.source) {        
                    
                    if (e.data.method.indexOf('mediaReady') != -1) {
                        
                        e.source.postMessage({method : 'getMedia'}, "*");
                        
                    } else if (e.data.method.indexOf('sendResourceMedia') != -1) {
                        
                        closeConnection = true;
                        
                        if (e.data.base64) {
                            
                            var ext = KellyTools.getUrlExt(urlOrig);
                            var mimetype = getMimeType(ext);
                            
                            callback(urlOrig, {base64 : e.data.base64, type : mimetype});  
                            
                        } else {
                            
                            // если разорвано подключение \ картинка недоступна - e.data.error = url load fail
                            // в случае если подключение блокирует adblock или еще какой-либо внешний процесс, то обратная связь пропадает (остается только таймаут)
                            
                            callback(urlOrig, false, -1, 'iframe load fail - ' + e.data.error);
                        }
                        
                        abortIframe();                       
                    }                    
                }
            }
                        
            var abortIframe = function() {
                fav.removeEventPListener(window, "message", onLoadIframe, eventPrefix);
            
                iframe.src = '';
                iframe.onload = function() {}
                iframe.onerror = function() {}
                
                if (iframe.parentElement) {
                    iframe.parentElement.removeChild(iframe);
                }
            }
            
            iframe.onerror = function() {      
            
                callback(urlOrig, false, -1, 'iframe load fail - connection error');                
                abortIframe();
            }

            fav.removeEventPListener(window, "message", onLoadIframe, eventPrefix);	
            fav.addEventPListener(window, "message", onLoadIframe, eventPrefix);
            
            iframe.src = urlOrig;
            
            return {type : 'iframe', self : iframe, abort : abortIframe};
        }
    }
    
    function getMimeType(ext) {
        
        var mimetype = 'application/x-' + ext;
        
        // MIME type list http://webdesign.about.com/od/multimedia/a/mime-types-by-content-type.htm
        
             if (ext == 'jpg' || ext == 'jpeg') mimetype = 'image/jpeg';
        else if (ext == 'png' ) mimetype = 'image/png';
        else if (ext == 'gif' ) mimetype = 'image/gif';
        else if (ext == 'zip' ) mimetype = 'application/zip';
        else if (ext == 'txt' ) mimetype = 'text/plain';
        else if (ext == 'json' ) mimetype = 'application/json';
        
        return ext;
    }
    
    // fileData - arrayBuffer or plain text
    
    this.createAndDownloadFile = function(fileData, filename, mimetype) {

        if (!fileData) return false;
        if (!KellyTools.getBrowser()) return false;
        
        var ext = KellyTools.getExt(filename);
        if (!ext) ext = 'txt';
        
        if (!mimetype) {
             mimetype = getMimeType(ext);
        }
        
        if (filename.indexOf('.') == -1) filename += '.' + ext;
        
        var downloadOptions = {
            filename : filename, 
            conflictAction : 'uniquify',
            method : 'GET',
        }
        
            downloadOptions.url = new Blob([fileData], {type : mimetype});
        
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
            
            var startDownload = function() {
                
                var link = document.createElement("A");                
                    link.style.display = 'none';
                    link.onclick = function() {
                        
                        var url = window.URL.createObjectURL(downloadOptions.url);
                        
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
        
        if (transportMethod == KellyGrabber.TRANSPORT_BLOBBASE64) {
                
            KellyTools.blobToBase64(downloadOptions.url, function(base64) {              
                downloadOptions.url = {base64 : base64, type : mimetype};
                startDownload();
            });
            
        } else {
            
            startDownload();
        }     
        
        return true;
    }
    
    function addFailItem(item, reason) {
        
        var itemIndex = downloads.indexOf(item) + 1;
        
        failItems[failItems.length] = {
            
            num : options.invertNumeration ? downloads.length - itemIndex : itemIndex+1,
            reason : reason,
        }
    }
    
    // start download of item, return false if fail to initialize, used only in addDownloadWork that marks failed to init items
    
    function downloadItemStart(download) {
    
        var baseFileFolder = options.baseFolder;        
        if (!baseFileFolder) baseFileFolder = '';
        
        if (baseFileFolder) {
            baseFileFolder += '/';
        }
        
        if (!handler.initDownloadItemFile(download)) return false;
                
        var downloadOptions = {
            filename : baseFileFolder + download.filename + '.' + download.ext, 
            conflictAction : download.conflictAction,
            method : 'GET',
        }
        
        toTxtLog('DOWNLOADID ' + download.id + ' | download : ' + downloadOptions.filename);
        
        // download of Blob data throw browser download API started, next catch changes throw onDownloadProcessChanged method until comlete state
                
        var onDownloadApiStart = function(response){
                
            if (!response.downloadId || response.downloadId < 0) {
                
                toTxtLog('DOWNLOADID ' + download.id + ' | download REJECTED by browser API : ' + downloadOptions.filename);
                toTxtLog('DOWNLOADID ' + download.id + ' | error : ' + response.error + "\n\r");
                
                addFailItem(download, 'Ошибка загрузки' + (response.error ? ' : ' + response.error : ''));
                
                resetItem(download);
                
                download.workedout = true;
                download.error = response.error;
                
                handler.onDownloadEnd(download);  
                
                updateProgressBar();
                handler.updateStateForImageGrid();
                
            } else {            

                toTxtLog('DOWNLOADID ' + download.id + ' | download ACCEPTED by browser API : ' + downloadOptions.filename);
                
                if (mode != 'download') { // perhapse promise was sended after cancel ?
                
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
                
        var onLoadFile = function(url, fileData, errorCode, errorNotice) {
            
            if (mode != 'download') return false;
            
            download.dataRequest = false;
            
            if (!fileData) {
            
                // get DATA ARRAY OR BLOB fail, download as url - bad way, due to copyright marks, so call onDownloadApi event with error
                
                /*
                    toTxtLog('file NOT LOADED as DATA ARRAY OR BLOB ' + download.url + ', attempt to download by download api without DATA ARRAY OR BLOB - BAD HEADERS : ' + downloadOptions.filename);
                    toTxtLog('LOAD FAIL NOTICE error code ' + errorCode + ', message : ' + errorNotice);
                
                    KellyTools.log('onLoadFile : bad blob data for download ' + download.url + '; error : ' + errorCode + ' | error message : ' + errorNotice);
                        
                    downloadOptions.url = download.url;
                    handler.downloadUrl(downloadOptions, onDownloadApiStart);
                */
                
                toTxtLog('DOWNLOADID ' + download.id + ' | file NOT LOADED as DATA ARRAY OR BLOB ' + download.url + ' : ' + downloadOptions.filename);
                toTxtLog('DOWNLOADID ' + download.id + ' | LOAD FAIL NOTICE error code ' + errorCode + ', message : ' + errorNotice);

                onDownloadApiStart({downloadId : false, error : 'DATA ARRAY get fail. Error code : ' + errorCode + ' |  error message : ' + errorNotice});                
                
            } else {
                
                toTxtLog('DOWNLOADID ' + download.id + ' | file LOADED as DATA ARRAY OR BLOB ' + download.url + ', send to browser API for save to folder : ' + downloadOptions.filename);                
                downloadOptions.url = fileData;     

                handler.downloadUrl(downloadOptions, onDownloadApiStart);
            }
        }
                
        download.dataRequest = handler.getDataFromUrl(download.url, onLoadFile);
        
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
    
    this.addDownloadWork = function() {
        
        if (mode != 'download') return false;
                
        var addCancelTimer = function(downloadItem) {
            
            downloadItem.cancelTimer = setTimeout(function() {
                
                if (!downloadItem) return;
                
                toTxtLog('DOWNLOADID ' + downloadItem.id + ' | CANCELED BY TIMEOUT ' + downloadItem.url + ', ' + downloadItem.filename);
                
                downloadItem.cancelTimer = false; 
                resetItem(downloadItem);
                           
                downloadItem.error = 'Canceled by timeout';	
                downloadItem.canceling = true;
                
                
                addFailItem(downloadItem, 'Завершена по таймауту');
                
                if (downloadItem.downloadId > 0) {                    
                    KellyTools.getBrowser().runtime.sendMessage({method: "downloads.cancel", downloadId : downloadItem.downloadId}, function(response) {   
                        downloadItem.canceling = false;	
                        downloadItem.workedout = true; 

                        handler.onDownloadEnd(downloadItem);
                    });                
                }
                
            }, options.cancelTimer * 1000);
        }
        
        var searchWorkErrorsLimit = 20;
        var currentWork = handler.countCurrent('in_progress'); 
        var newWorkNum = options.maxDownloadsAtTime - currentWork; 
        
        if (currentWork >= options.maxDownloadsAtTime) {
            return;
        } 
        
        for (var i = downloadsOffset; i <= downloads.length - 1; i++) {
            
            if (handler.getDownloadItemState(downloads[i]) != 'wait') continue;
            
            var downloadItem = downloads[i];
            
            downloadItem.downloadId = KellyGrabber.DOWNLOADID_GET_PROCESS;
            downloadItem.workedout = false;
                       
            if (downloadItemStart(downloads[i])) {
                
                if (options.cancelTimer) {
                    addCancelTimer(downloadItem);
                }
                
                newWorkNum--;
                
            } else {
                
                // bad name template \ url \ extension - common for corrupted data
                toTxtLog('CAND INIT Download item FILENAME for N ' +  i);
                
                try {
                    
                     toTxtLog('CANT INIT Download item dump ' + JSON.stringify(downloads[i].item));
                    
                } catch (E) {
                    
                }
                
                resetItem(downloadItem);
                
                downloadItem.workedout = true;
                downloadItem.error = 'Initialize download data error';
                                    
                searchWorkErrorsLimit--;
            }
              
            if (newWorkNum <= 0 || searchWorkErrorsLimit <= 0) {
                 break;
            }           
        }   
     
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
    
    this.download = function() {
        
        log = '';
        
        if (mode != 'wait') return false;
        
        if (!downloads.length) {
            KellyTools.log('work empty', 'KellyGrabber');
            return false;
        }
                
        acceptItems = false;               
        if (options.itemsList) {
            
            acceptItems = KellyTools.getPrintValues(options.itemsList, false, 1, downloads.length);
           
            if (!acceptItems.length) {
                acceptItems = false;
            }
           
           // KellyTools.log(acceptItems);
        }
        
        failItems = [];
        
        if (downloadsOffset <= 0) {
            downloadsOffset = 0;   
        } else if (downloadsOffset > downloads.length-1) {
            downloadsOffset = downloads.length-1;            
        }
                
        if (!options.interval) options.interval = 0.1;
                       
        assignEvents();
                        
        handler.resetDownloadItems(true);

        handler.updateStartButtonState('stop'); 
        handler.updateStateForImageGrid();
        
        log = '';
        
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

KellyGrabber.DOWNLOADID_GET_PROCESS = -1;
KellyGrabber.DOWNLOADID_INACTIVE = false;

KellyGrabber.validateDriver = function(driver) {
            
    var availableTransport = [KellyGrabber.TRANSPORT_BLOB, KellyGrabber.TRANSPORT_BLOBBASE64];          
    var availableRequest = [KellyGrabber.REQUEST_XML, KellyGrabber.REQUEST_IFRAME];
    
    var defaultDriver = {
           requestMethod : availableRequest[0], 
           transportMethod : availableTransport[0],
        }
        
    if (!driver) {
        return defaultDriver;
    }
    
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


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\lib\kellyFastSave.js



function KellyFastSave(cfg) {
    
    var handler = this;   
    
    this.favEnv = false;
    
    this.isAvailable = function() {
                
        if (!handler.favEnv.isDownloadSupported || !handler.favEnv.getGlobal('fav').coptions.fastsave.enabled) {
            return false;
        } else return true;
    }
    
    this.downloadCancel = function() {
        
        handler.favEnv.getDownloadManager().cancelDownloads();
    }
        
    this.downloadPostData = function(postData, onDownload) {
        
        if (!handler.isAvailable()) return false;
                      
        var postMedia = handler.favEnv.getGlobal('env').getAllMedia(postData);        
        if (!postMedia || !postMedia.length) {            
            if (onDownload) onDownload(false);
        }
        
        var dm = handler.favEnv.getDownloadManager();
        if (dm.getState() != 'wait') {            
            if (onDownload) onDownload(false);
            return false;
        }
        
        var options = handler.favEnv.getGlobal('fav').coptions;
        
        dm.clearDownloads();
        dm.resetOptions();
        
        dm.updateCfg({
            events : false,
        });
        
        dm.updateCfg({
            options : {    
                baseFolder : options.fastsave.baseFolder,
                nameTemplate : '#filename#',
            },
            events : {
                
                onUpdateView : function(handler) {
                    return true;
                },          
                
                onDownloadAllEnd : function(handler, result) { 
                
                    handler.clearDownloads();
                    
                    KellyTools.log(result, 'KellyFastSave | downloadPostData');   
                    var success = (result.complete == postMedia.length) ? true : false;
                    
                    if (onDownload) onDownload(success);
                },
            }
        });
        
        for (var i = 0; i < postMedia.length; i++) {
            dm.addDownloadItem({
                pImage : postMedia,
                id : -1,
                categoryId : []
            }, i, options.fastsave.conflict);
        }
                
        KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.keepAliveListener"}, function(response) {
            if (!dm.download()) {
                if (onDownload) onDownload(false);   
            }
        }); 

         return true;
    }
 
    this.downloadCheckState = function(postData, onGetState) {
    
        if (!handler.isAvailable()) return;
        
        var postMedia = handler.favEnv.getGlobal('env').getAllMedia(postData);        
        if (postMedia && postMedia.length) {
            
            var onSearch = function(response) {
                
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = false;
                }
                
                if (response && response.matchResults && response.matchResults[0].match) {
                    onGetState('downloaded');
                } else {
                    // error \ timeout or not downloaded
                    onGetState('notdownloaded');
                }     
            }
            
            var timeout = setTimeout(function() {
                onSearch(false);
            }, 4000);
                   
            KellyTools.getBrowser().runtime.sendMessage({
                method: "isFilesDownloaded", 
                filenames : [KellyTools.getUrlFileName(handler.favEnv.getGlobal('env').getImageDownloadLink(postMedia[0]))]
            }, onSearch);
        
        } else {
            onGetState('unavailable');
        }     
    }

}


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\lib\kellyTools.js



// part of KellyFavItems extension

KellyTools = new Object();

// Get screen width \ height

KellyTools.getViewport = function() {

    var elem = (document.compatMode === "CSS1Compat") ? 
        document.documentElement :
        document.body;

    var height = elem.clientHeight;
    var width = elem.clientWidth;	

    return {
        scrollBottom: KellyTools.getScrollTop() + height, // scroll + viewport height
        screenHeight: height,
        screenWidth: width,
    };
}

KellyTools.replaceAll = function(str, search, replacement) {
    return str.split(search).join(replacement);
}

KellyTools.getScrollTop = function() {

    var scrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
    return scrollTop;
}

KellyTools.getScrollLeft = function() {

    var scrollLeft = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0);
    return scrollLeft;
}

// basic validation of input string

KellyTools.val = function(value, type) {
    
    if (!value) value = '';    
    
    if (typeof value != 'string' && typeof String != 'undefined') {
        value = String(value);
    }
    
    value = value.trim();
    
    if (!type) type = 'string';
    
    if (type == 'string') {
        
        if (!value) return '';
        return value.substring(0, 255);
        
    } else if (type == 'int') {
        
        if (!value) return 0;
        
        value = parseInt(value);
        if (!value) value = 0;
        
        return value;
        
    } else if (type == 'float') {
        
        return KellyTools.validateFloatSting(value);
        
    } else if (type == 'bool') {
        
        return value ? true : false;
        
    } else if (type == 'html') {
        
        var parser = new DOMParser();
        var dom = parser.parseFromString(value, 'text/html');
            
        return dom.getElementsByTagName('body')[0];
        
    } else if (type == 'longtext') {
        
        if (!value) return '';
        return value.substring(0, 65400);
    }
}


// also some interesting design can be found here
// https://stackoverflow.com/questions/7370943/retrieving-binary-file-content-using-javascript-base64-encode-it-and-reverse-de

KellyTools.blobToBase64 = function(blob, cb) {
        
        var reader = new FileReader();
            reader.onload = function() {
        
        var dataUrl = reader.result;
        var base64 = dataUrl.split(',')[1];
            cb(base64);
        };

        reader.readAsDataURL(blob);
    };

// html must be completed and valid. For example - input : <table><tr><td></td></tr></table> - ok,  input : <td></td><td></td> - will add nothing 

KellyTools.setHTMLData = function(el, val) {
    
    if (!el) return;
    el.innerHTML = '';
    
    if (val) {
        var valBody = KellyTools.val(val, 'html');
       
        if (valBody && valBody.childNodes) { 
            while (valBody.childNodes.length > 0) {
                el.appendChild(valBody.childNodes[0]);
            }
        }
    }
}

KellyTools.toogleActive = function(el) {
    
    if (el.className.indexOf('hidden') != -1) {
        el.className = el.className.replace('hidden', 'active');
    } else {
        el.className = el.className.replace('active', 'hidden');
    }
}

KellyTools.inputVal = function(el, type, parent) {
    
    var value = ''; 
    
    if (typeof el == 'string') {
        if (!parent) parent = document;
        el = KellyTools.getElementByClass(parent, el);
    }
    
    if (el) value = el.value;    
    return KellyTools.val(value, type);
}

KellyTools.fitText = function(parent, textEl, noExtHeight) {
    
    var bounds = textEl.getBoundingClientRect();
    var parentBounds = parent.getBoundingClientRect();

    if (parentBounds.width >= bounds.width && parentBounds.height >= bounds.height) {
        return;
    }    
      
    var textStyle = window.getComputedStyle(textEl);
    var defaultFontSize = parseInt(textStyle.fontSize);
    var fontSize = defaultFontSize;
    
    if (!fontSize) return;
    
    while (fontSize > 10 && (parentBounds.width < bounds.width || parentBounds.height < bounds.height)) {
        fontSize--;        
        textEl.style.fontSize = fontSize + 'px'; 
        bounds = textEl.getBoundingClientRect();        
    }   
    
    if (!noExtHeight && parentBounds.height < bounds.height) {
        
        var defaultLineHeight = parseInt(textStyle.lineHeight);
        var redusedLineHeight = Math.round((defaultLineHeight / 100) * 66);
        
        parent.style.height = Math.round(bounds.height) + 'px';
        parent.style.lineHeight = redusedLineHeight + 'px';
    }
}

KellyTools.getChildByTag = function(el, tag) {
    if (!el) return false;
    
    var childNodes = el.getElementsByTagName(tag);
    
    if (!childNodes || !childNodes.length) return false;
    
    return childNodes[0];
}

KellyTools.getElementByTag = function (el, tag) {
    return KellyTools.getChildByTag(el, tag);
}

KellyTools.getParentByTag = function(el, tagName) {
    var parent = el;
    if (!tagName) return false;
    
    tagName = tagName.toLowerCase();
    
    while (parent && parent.tagName.toLowerCase() != tagName) {
        parent = parent.parentElement;
    }  
    
    return parent;
}

KellyTools.getUrlFileName = function(url, excludeExt, noDecode) {
    if (!url) return '';
    
    url = url.split("?");
    url = url[0];
    
    if (!url) return '';
    
    url = url.substring(url.lastIndexOf('/')+1);    
    
    if (!noDecode && url.indexOf('%') != -1) {
        url = decodeURIComponent(url);
        url = url.replace(/[^а-яА-Яa-z0-9áéíóúñü ._-]/gim, "");
    } 
    
    if (excludeExt && url.indexOf('.') != -1) {       
        url = url.substr(0, url.indexOf('.'));
    }
    
    return url;
}

KellyTools.getUrlExt = function(url) {
             
    url = url.split("?");
    url = url[0];
    
    return this.getExt(url);        
}
    
KellyTools.getUrlParam = function(param, url) {
    if (!url) url = location.search;
    
    var paramIndex = url.indexOf(param + "=");
    var paramValue = '';
    if (paramIndex != -1) {
        paramValue = url.substr(paramIndex).split('=');
        if (paramValue.length >= 2) {
            paramValue = paramValue[1].split('&')[0];
        }
    }
    
    return paramValue.trim();
}

// turn this - '2, 4, 66-99, 44, 78, 8-9, 29-77' to an array of all values [2, 4, 66, 67, 68 ... etc] in range

KellyTools.getPrintValues = function(print, reverse, limitFrom, limitTo) {

    var itemsToSelect = [];
    var options = print.split(',');
    
    for (var i = 0; i < options.length; i++) {

        var option = options[i].trim().split('-');
        if (!option.length || !option[0]) continue;
        if (option.length <= 1) option[1] = -1;
        

        option[0] = parseInt(option[0]);
        if (!option[0]) option[0] = 0;
        
        if (option[1]) {
            option[1] = parseInt(option[1]);
            if (!option[1]) option[1] = option[0];
        }

        if (option[0] == option[1]) option[1] = -1;

        if (option[1] !== -1) {

            if (option[1] < option[0]) {
                var switchOp = option[0];
                option[0] = option[1];
                option[1] = switchOp;
            }

            for (var b = option[0]; b <= option[1]; b++) {
                if (typeof limitTo != 'undefined' && b > limitTo) continue;
                if (typeof limitFrom != 'undefined' && b < limitFrom) continue;
                if (itemsToSelect.indexOf(b) == -1) itemsToSelect[itemsToSelect.length] = b;
            }

        } else {
            if (typeof limitTo != 'undefined' && option[0] > limitTo) continue; 
            if (typeof limitFrom != 'undefined' && option[0] < limitFrom) continue;            
            if (itemsToSelect.indexOf(option[0]) == -1) itemsToSelect[itemsToSelect.length] = option[0];
        }

    }
    
    if (!reverse) {
        itemsToSelect.sort(function(a, b) {
          return a - b;
        });
    } else {
        itemsToSelect.sort(function(a, b) {
          return b - a;
        });
    }
    
    return itemsToSelect;
}

KellyTools.getVarList = function(str, type) {
        
    if (!str) return [];
    
    str = str.trim();
    
    if (!str) return [];
    
    str = str.split(",");
    
    for (var i=0; i <= str.length-1; i++) {
        
        var tmp = KellyTools.val(str[i], type);
        if (tmp) str[i] = tmp;
    }
    
    return str;
}
    
KellyTools.varListToStr = function(varlist) {
    if (!varlist || !varlist.length) return '';
    var str = '';        
    for (var i=0; i <= varlist.length-1; i++) {
    
        if (!varlist[i]) continue;
    
        if (str) str += ',' + varlist[i];
        else str = varlist[i];
    }
    
    return str;
}
    
KellyTools.parseTagsList = function(text) {
    var text = text.split(','); 
    
    var tagList = {
        exclude : [],
        include : [],
    }
        
    for (var i = 0; i < text.length; i++) {
        var tagName = text[i].trim();        
        
        var exclude = false;
        if (tagName.charAt(0) == '-') {
            exclude = true;
        }
        
        if (tagName.charAt(0) == '-' || tagName.charAt(0) == '+') {
            tagName = tagName.substr(1);
        } 
        
        if (!tagName) {
            continue;
        }
        
        if (exclude) {
            tagList.exclude[tagList.exclude.length] = tagName;
        } else {
            tagList.include[tagList.include.length] = tagName;
        }
    }
    
    var getUniq = function(arr) {
            
        var uniq = [];

        for (var i=0; i < arr.length; i++) {
            if (uniq.indexOf(arr[i]) == -1) {
                uniq.push(arr[i]);
            }
        }
        
        return uniq;
    }
    
    if (tagList.exclude.length > 1) {
        tagList.exclude = getUniq(tagList.exclude);
    }
    
    if (tagList.include.length > 1) {
        tagList.include = getUniq(tagList.include);
    }
    
    if (!tagList.exclude.length && !tagList.include.length) return false;
    
    return tagList;
}

KellyTools.validateFloatSting = function(val) {

    if (!val) return 0.0;
    
    val = val.trim();
    val = val.replace(',', '.');
    val = parseFloat(val);
    
    if (!val) return 0.0;
    
    return val;    
}

// bring string to regular expression match template like /sdfsdf/sf/sd/fs/f/test.ttt 

KellyTools.folderPatchToRegularExpression = function(folder) {
    
    if (!folder) return '';
    folder = folder.trim();
    
    if (!folder) return '';
    // [\\(] [\\)]

    folder = KellyTools.replaceAll(folder, '\\(', '__CCCC__');    
    folder = KellyTools.replaceAll(folder, '\\)', '__DDDD__');
    folder = KellyTools.replaceAll(folder, '\\\\', '/');
    folder = KellyTools.replaceAll(folder, '\\\\', '(\\\\\\\\|/)');
    folder = KellyTools.replaceAll(folder, '/', '(\\\\\\\\|/)');
    folder = KellyTools.replaceAll(folder, '__CCCC__', '[\(]');    
    folder = KellyTools.replaceAll(folder, '__DDDD__', '[\)]');
    
    // todo check special characters 
    
    return folder;
}

// input - any string that suppose to be file path or directory -> output - dir/dir2/dir3/file.ext, dir/dir2, dir/dir2/dir3 ...

KellyTools.validateFolderPath = function(folder) {

    if (!folder) return '';
    folder = folder.trim();
    
    if (!folder) return '';
    folder = KellyTools.replaceAll(folder, '\\\\', '/');
    
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

KellyTools.getBrowser = function() {
    
    // chrome - Opera \ Chrome, browser - Firefox
    
    if (typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined') { // Edge has this object, but runtime is undefined
        return chrome;
    } else if (typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined') {
        return browser;
    } else {
        console.log('browser not suppot runtime API method');
        return false;
    }
}

KellyTools.getExt = function(str, limit) {
    
    var dot = str.lastIndexOf('.');
    
    if (dot === -1) return false;
    
    var ext =  str.substr(dot).split(".");
    if (ext.length < 2) return false;
    
    ext = ext[1];
    
    if (!limit) limit = 5;
    if (ext.length > limit) return false;
    if (ext.indexOf('/') !== -1) return false;
    
    return ext.toLocaleLowerCase();
}


KellyTools.getBrowserName = function() {
    
    if (typeof navigator == 'undefined') return 'unknown';
    
    var userAgent = navigator.userAgent;
    
    var test = ['opera', 'firefox', 'ie', 'edge', 'chrome'];
    
    for (var i = 0; i < test.length; i++) {
        var bTest = test[i];
        
        if (bTest == 'opera') {
            if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) return 'opera';
        } else if ( bTest == 'firefox' ) {
            if (typeof InstallTrigger !== 'undefined') return 'firefox';
        } else if ( bTest == 'ie' ) {
            if (/*@cc_on!@*/false || !!document.documentMode) return 'ie';
        } else if ( bTest == 'edge' ) {
            if (!!window.StyleMedia) return 'edge';
        } else if ( bTest == 'chrome' ) {
            if (!!window.chrome && !!window.chrome.webstore) return 'chrome';
        } 
    }
    
    return 'unknown';
}

KellyTools.DEBUG = false;
KellyTools.E_NOTICE = 1;
KellyTools.E_ERROR = 2;

/*
    errorLevel 
    
    1 - notice, notrace
    2 - error, trace, default
*/

KellyTools.log = function(info, module, errorLevel) {
    
    if (!module) module = 'Kelly';
  
    if (!errorLevel) {
        errorLevel = KellyTools.E_NOTICE;
    }    
     
    if (!this.DEBUG && errorLevel < KellyTools.E_ERROR) {
        return;
    }
    
    if (typeof info == 'object' || typeof info == 'function') {
        console.log('[' + KellyTools.getTime() + '] ' + module + ' :  var output :');
        console.log(info);
    } else {
        console.log('[' + KellyTools.getTime() + '] ' + module + ' : '+ info);
    }
    
    if (errorLevel >= KellyTools.E_ERROR && console.trace) {
        
        console.trace();
    }
}

// 01:12

KellyTools.getTime = function() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    
    if (minutes < 10){
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes;
}

// 2018_09_09__085827

KellyTools.getTimeStamp = function() {
    date = new Date();
    date = date.getUTCFullYear() + '_' +
        ('00' + (date.getUTCMonth()+1)).slice(-2) + '_' +
        ('00' + date.getUTCDate()).slice(-2) + '__' + 
        ('00' + date.getUTCHours()).slice(-2) + '' + 
        ('00' + date.getUTCMinutes()).slice(-2) + '' + 
        ('00' + date.getUTCSeconds()).slice(-2);
    
    return date;
}

// 2018-09-09 08:58:27

KellyTools.getGMTDate = function() {
    return new Date().toJSON().slice(0, 19).replace('T', ' ');
}

KellyTools.getParentByClass = function(el, className, strict) {
    var parent = el;
 
    while (parent && ((strict && !parent.classList.contains(className)) || (!strict && parent.className.indexOf(className) != -1))) {
        parent = parent.parentElement;
    }  
    
    return parent;
}

// read local file
// untested in dataurl mode - suppose get binary data - such as png image
// todo try - btoa(unescape(encodeURIComponent(rawData))) to store local as base64:image

KellyTools.readInputFile = function(input, onRead, readAs) {
    
    if (!input) return false;
    
     var file = input.files[0];
 
    if (file) {
    
      var fileReader = new FileReader();
          fileReader.onloadend = function (e) {
                if (onRead) onRead(input, e.target.result);
          };
          
        if (readAs == 'dataurl') {
            
            fileReader.readAsDataURL(file);
        } else {
            fileReader.readAsText(file)
        }
        return true;
    } else return false;
}	

// simple read by XMLHttpRequest method any local "Access-Control-Allow-Origin" url
// callback onLoad - executed only on succesful load data (response status = 200)
// callback onFail - executed in any other case - any problems during load, or bad response status

KellyTools.readUrl = function(url, onLoad, onFail, method, async, mimeType) {

    if (!method) method = 'GET';
    if (typeof async == 'undefined') async = true;

    var request = new XMLHttpRequest();
        request.open(method, url, async);
        
        if (mimeType) {
            
           request.overrideMimeType(mimeType);
        }        

        request.onload = function() {
            if (this.status == 200) {
                onLoad(this.response, url);
            } else {
                onFail(url, this.status, this.statusText);
            }
        };

        request.onerror = function() {
           onFail(url, -1);
        };

        request.send();
}

KellyTools.getRelativeUrl = function(str) {
    
    if ( typeof str !== 'string') return '/';

    str = str.trim();
    
    if (!str.length) return '/';
    
    str = str.replace(/^(?:\/\/|[^\/]+)*\//, "");
   
    if (!str.length) str = '/';

    if (str[0] != '/') {
        str = '/' + str;
    }
    
    return str;
}
    
KellyTools.getElementByClass = function(parent, className) {
        
    if (parent === false) parent = document.body;
    
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

KellyTools.parseJSON = function(json) {
    
    var data = false;
    
    if (json) {
        try {
            data = JSON.parse(json);
        } catch (e) {
            data = false;
        }
    }
    
    return data;
}

// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript

KellyTools.replaceAll = function(text, search, replace) {
    return text.replace(new RegExp(search, 'g'), replace);
}

KellyTools.dispatchEvent = function(target, name) {
    
    if (!target) return;
    if (!name) name = 'click';
    if(typeof(Event) === 'function') {
        
        var event = false;
        
        try {
            
            event = new Event(name, {bubbles: true, cancelable: true});
          
        } catch(e){

            event = document.createEvent('Event');
            event.initEvent(name, true, false);
        }
                
    } else {
        
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
    }

    var bn = target.getBoundingClientRect();

    event.clientX = Math.round(bn.left + KellyTools.getScrollLeft() + bn.width / 2);
    event.clientY = Math.round(bn.top + KellyTools.getScrollTop() + bn.height / 2);

    target.dispatchEvent(event);
}

// params - paginationContainer, curPage, onGoTo, classPrefix, pageItemsNum, itemsNum, perPage

KellyTools.showPagination = function(params) {
    
    if (!params) {
        return false;	
    }
        
    if (!params.container) return false;
    if (!params.classPrefix) {
        params.classPrefix = 'KellyTools';
    }
    
    if (!params.itemsNum) params.itemsNum = 0;
    if (!params.perPage) params.perPage = 50;
    
    params.container.innerHTML = '';
    
    if (!params.itemsNum) return;
    
    var totalPages = Math.ceil(params.itemsNum / params.perPage);

    if (totalPages <= 1) return;
    
    var page = params.curPage ? params.curPage : 1;
    var pageListItemsNum = params.pageItemsNum ? params.pageItemsNum : 4; // maximum number of page buttons
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
        if (params.onGoTo) params.onGoTo(this.getAttribute('pageNum'));
        return false;
    }
    
    var goToPreviuse = document.createElement('a');
        goToPreviuse.href = '#';
        goToPreviuse.setAttribute('pageNum', 'previuse');
        goToPreviuse.innerText = '<';
        goToPreviuse.className = params.classPrefix + '-item';
        goToPreviuse.onclick = goToFunction;
             
    if (pageStart > 1) {
        var goToBegin = goToPreviuse.cloneNode(true);
        goToBegin.setAttribute('pageNum', '1');
        goToBegin.onclick = goToFunction;
        goToBegin.innerText = '<<';
        
        params.container.appendChild(goToBegin); 
    }
    
    if (pageStart > 1) { 
        params.container.appendChild(goToPreviuse); 
    }
          
    for (var pageNum = pageStart; pageNum <= pageEnd; pageNum++) {
         var pageEl = document.createElement('a');
             pageEl.href = '#';
             pageEl.innerText = pageNum;
             pageEl.className = params.classPrefix + '-item';
             if (pageNum >= 100) pageEl.className += ' ' + params.classPrefix + '-item-100';
             
             pageEl.setAttribute('pageNum', pageNum);
             
        if (page == pageNum) pageEl.className += ' active';
            
            pageEl.onclick = goToFunction;                
            params.container.appendChild(pageEl);
    }

    var goToNext = document.createElement('a');
        goToNext.href = '#';
        goToNext.setAttribute('pageNum', 'next');
        goToNext.className = params.classPrefix + '-item';
        goToNext.innerText = '>';
        goToNext.onclick = goToFunction;
        
    if (pageEnd < totalPages) { 
        params.container.appendChild(goToNext);
    }
    
    if (pageEnd < totalPages) {
        var goToEnd = goToPreviuse.cloneNode(true);
        goToEnd.setAttribute('pageNum', totalPages);            
        goToEnd.onclick = goToFunction;
        goToEnd.innerText = '>>';
        
        params.container.appendChild(goToEnd); 
    }
    
    if (totalPages > pageListItemsNum) {
    
        if (page < totalPages - 1) {
            // go to end
        }
        
        if (page > 1) {
            // go to begin
        }
    }
    
    return params.container;
}
    


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\lib\kellyOptions.js



function KellyOptions(cfg) {
    
    var handler = this;   
    
    this.favEnv = false;
    this.wrap = false;
    
    var lng = KellyLoc;
    
    function constructor(cfg) { }   
    
    this.showOptionsDialog = function(tabActive) {
        
        if (!handler.wrap) return;
        
        handler.favEnv.getImageGrid().updateConfig({tilesBlock : false});
        
        var favContent = handler.wrap;
        var fav = handler.favEnv.getGlobal('fav');
        var env = handler.favEnv.getGlobal('env');
        
        // get current selected tab, before redraw
        if (!tabActive) {
            tabActive = env.className + '-BaseOptions';
                
            var tabItems = favContent.getElementsByClassName(env.className + '-tab-item');
            for (var i = 0; i < tabItems.length; i++) {
                if (tabItems[i].className.indexOf('active') != -1) {
                    tabActive = tabItems[i].getAttribute('data-tab');
                }
            }
        }
        
        // hide options dialog by click on any sidebar filter
        if (fav.coptions.optionsSide) {
           
            var backActionButtons = handler.favEnv.getView('sidebar').getElementsByTagName('A');
            for (var i = 0; i < backActionButtons.length; i++) {
                backActionButtons[i].onclick = function() {
                    handler.favEnv.showFavouriteImages();
                    return false;
                }                
            }
            
        } else {            
            
            handler.favEnv.closeSidebar();
        }
                
        // currently only one type of storage
        favContent.innerHTML = '';
        var output= '';
    
        output += '<h3>' + lng.s('Добавление в избранное', 'options_fav_add') + '</h3>';
        output += '<table class="' + env.className + '-options-table">';
      
        output += '<tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'SyncByAdd" ' + (fav.coptions.syncByAdd ? 'checked' : '') + '> ' + lng.s('Дублировать в основное избранное пользователя если авторизован', 'sync_by_add') + '</label></td></tr>';
        output += '<tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'HideSoc" ' + (fav.coptions.hideSoc ? 'checked' : '') + '> ' + lng.s('Скрывать кнопки соц. сетей из публикаций', 'hide_soc') + '</label></td></tr>';
        
        output += '</table>';
        
        if (handler.favEnv.isDownloadSupported) {
            
            output += '<h3>' + lng.s('Быстрое сохранение', 'fast_download') + '</h3>';	
            
            output += '<table class="' + env.className + '-options-table">\
                <tr><td colspan="2"><label><input type="checkbox" class="' + env.className + 'FastSaveEnabled" ' + (fav.coptions.fastsave.enabled ? 'checked' : '') + '> ' + lng.s('Показывать кнопку быстрого сохранения для публикаций', 'fast_save_enabled') + '</label></td></tr>\
                <tr><td>' + lng.s('Сохранять в папку', 'fast_save_to') + '</td><td><input type="text" class="' + env.className + 'FastSaveBaseFolder" placeholder="' + env.profile + '/Fast' + '" value="' +  fav.coptions.fastsave.baseFolder + '"></td></tr>\
                <tr class="radioselect"><td colspan="2">\
                    \
                        <label><input type="radio" name="' + env.className + '-conflict" value="overwrite" class="' + env.className + '-conflict" ' + (!fav.coptions.fastsave.conflict || fav.coptions.fastsave.conflict == 'overwrite' ? 'checked' : '') + '> \
                        ' + lng.s('Перезаписывать при совпадении имен', 'fast_save_overwrite') + '\
                        </label>\
                        <label><input type="radio" name="' + env.className + '-conflict" value="uniquify" class="' + env.className + '-conflict" ' + (fav.coptions.fastsave.conflict == 'uniquify' ? 'checked' : '') + '> \
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
        }
        
        output += '<h3>' + lng.s('Настройки страницы избранного', 'cgrid_tiles_header') + '</h3>';		
         
        output += '<table class="' + env.className + '-options-table">';
        output += '<tr><td colspan="2">\
                    <label>\
                        <input type="checkbox" value="1" class="' + env.className + 'NewFirst" ' + (fav.coptions.newFirst ? 'checked' : '') + '> \
                        ' + lng.s('Новые в начало', 'cgrid_new_to_begin') + '\
                    </lablel>\
                  </td></tr>';   
        output += '<tr><td colspan="2">' + lng.s('Режим просмотра', 'cgrid_imageview') + '</td></tr>';
        output += '<tr class="radioselect"><td colspan="2">\
                    \
                        <label><input type="radio" value="hd" name="' + env.className + '-grid-imageview" class="' + env.className + '-grid-imageview" ' + (!fav.coptions.grid.viewerShowAs || fav.coptions.grid.viewerShowAs == 'hd' ? 'checked' : '') + '> \
                        ' + lng.s('Открывать оригинал', 'cgrid_imageview_hd') + '\
                        </label>\
                        <label><input type="radio" value="preview" name="' + env.className + '-grid-imageview" class="' + env.className + '-grid-imageview" ' + (fav.coptions.grid.viewerShowAs == 'preview' ? 'checked' : '') + '> \
                        ' + lng.s('Открывать превью', 'cgrid_imageview_preview') + '\
                        </label>\
                    \
                    </td></tr>';    
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
        
               
        output += '</table>';
        
        if (handler.favEnv.isDownloadSupported) {
            
            output += '<h3>' + lng.s('Загрузки', 'grabber_options_title') + '</h3>';	
            
            output += '<table class="' + env.className + '-options-table">';
            output += '<tr><td colspan="2">' + lng.s('', 'grabber_options_notice') + '</td></tr>';

            output += '<tr><td>' + lng.s('Способ передачи данных в фоновый процесс', 'grabber_transport') + '</td>';
            output += '<td>';
            
            output += '<select class="' + env.className + 'GrabberTransport">';
            output += '<option value="' + KellyGrabber.TRANSPORT_BLOB + '" ' + (fav.coptions.grabberDriver.transportMethod == KellyGrabber.TRANSPORT_BLOB ? 'selected' : '') + '>' + lng.s('', 'grabber_transport_blob') + '</option>';
            output += '<option value="' + KellyGrabber.TRANSPORT_BLOBBASE64 + '" ' + (fav.coptions.grabberDriver.transportMethod == KellyGrabber.TRANSPORT_BLOBBASE64 ? 'selected' : '') + '>' + lng.s('', 'grabber_transport_blobbase64') + '</option>';
            output += '</select>&nbsp;&nbsp;&nbsp;(<a href="#" class="' + env.className + '-help" data-tip="grabber_transport_help">' + lng.s('', 'tip') + '</a>)';
            
            output += '</td></tr>';
            
            output += '<tr><td>' + lng.s('Способ скачивания изображений', 'grabber_request') + '</td>';
            output += '<td>';
            
            output += '<select class="' + env.className + 'GrabberRequest">';
            output += '<option value="' + KellyGrabber.REQUEST_XML + '" ' + (fav.coptions.grabberDriver.requestMethod == KellyGrabber.REQUEST_XML ? 'selected' : '') + '>' + lng.s('', 'grabber_request_xml') + '</option>';
            output += '<option value="' + KellyGrabber.REQUEST_IFRAME + '" ' + (fav.coptions.grabberDriver.requestMethod == KellyGrabber.REQUEST_IFRAME ? 'selected' : '') + '>' + lng.s('', 'grabber_request_iframe') + '</option>';
            output += '</select>&nbsp;&nbsp;&nbsp;(<a href="#" class="' + env.className + '-help" data-tip="grabber_request_help">' + lng.s('', 'tip') + '</a>)';
            
            output += '</td></tr>';           
            output += '</table>';
        }        
        
        output += '<div><input type="submit" value="' + lng.s('Сохранить', 'save') + '" class="' + env.className + '-OptionsSave"></div>';
        output += '<div class="' + env.className + '-OptionsMessage"></div>';  
        
            
        var tabBaseOptions = document.createElement('DIV');            
            tabBaseOptions.className = env.className + '-tab ' + env.className + '-BaseOptions';	
            
            KellyTools.setHTMLData(tabBaseOptions, output);
            
        var tabStorage = document.createElement('DIV');
            tabStorage.className = env.className + '-tab ' + env.className + '-Storage';
            
        var tabCfg = document.createElement('DIV');
            tabCfg.className = env.className + '-tab ' + env.className + '-Cfg';
            
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
                    <li data-tab="' + env.className + '-Cfg" class="' + env.className + '-tab-item ' + env.className + '-buttoncolor-dynamic" >\
                        <a href="#" >' + lng.s('Восстановление', 'restore') + '</a>\
                    </li>\
                </ul>\
            </div>';
            
        KellyTools.setHTMLData(tabControlls, output);
            
        favContent.appendChild(tabControlls);
        favContent.appendChild(tabBaseOptions);
        favContent.appendChild(tabStorage);
        favContent.appendChild(tabCfg);
        favContent.appendChild(tabOther);

        var tips = favContent.getElementsByClassName(env.className + '-help');
        for (var i = 0; i < tips.length; i++) {
            
            tips[i].onclick = function() {
                
                var tipName = this.getAttribute('data-tip');
                if (!tipName) return false;
                
                var tooltip = new KellyTooltip({
                    target : 'screen', 
                    offset : {left : 40, top : -40}, 
                    positionY : 'bottom',
                    positionX : 'left',				
                    ptypeX : 'inside',
                    ptypeY : 'inside',
                    closeButton : true,
                    removeOnClose : true,                    
                    selfClass : env.hostClass + ' ' + env.className + '-tooltipster-help',
                    classGroup : env.className + '-tooltipster',
                });
                   
                var html = lng.s('', tipName);
                for (var i = 1; i <= 10; i++) {
                    html += lng.s('', tipName + '_' + i);
                }
                   
                var tcontainer = tooltip.getContent();
                KellyTools.setHTMLData(tcontainer, '<div>' + html + '</div>');
                
                setTimeout(function() {
                    
                    tooltip.show(true);                    
                    tooltip.updatePosition();
                    tooltip.updateCfg({closeByBody : true});
                    
                }, 100);
                return false;
            }
        }
        
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
        
        var tabAction = function(tabActive) {
            if (tabActive == env.className + '-Storage') {
                                
                handler.favEnv.getStorageManager().wrap = tabStorage;
                handler.favEnv.getStorageManager().showDBManager();
                
            } else if (tabActive == env.className + '-Cfg') {
                            
                handler.favEnv.getStorageManager().wrap = tabCfg;
                handler.favEnv.getStorageManager().showCfgManager();
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
                
                tabAction(this.getAttribute('data-tab'));
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
        output += '<tr><td colspan="2"><label><input type="checkbox" class="' + env.className + 'OptionsDebug" ' + (fav.coptions.debug ? 'checked' : '') + '> ' + lng.s('Режим отладки', 'debug') + '</label></td></tr>';
        output += '<tr><td colspan="2"><label>' + lng.s('Версия', 'ext_ver') + ' : ' + handler.favEnv.PROGNAME + '</label></td></tr>';
                  
        output += '</table>';
        output += '<div><input type="submit" value="' + lng.s('Сохранить', 'save') + '" class="' + env.className + '-OptionsSave"></div>';
        output += '<div class="' + env.className + '-OptionsMessage"></div>';    
        
        KellyTools.setHTMLData(tabOther, output);
        
        var saveButtons = document.getElementsByClassName(env.className + '-OptionsSave');
        for (var i = 0; i < saveButtons.length; i++) {
            saveButtons[i].onclick = function() {
                handler.updateOptionsConfig();
                return false;
            }
        }
        
        tabAction(tabActive);
    }
    
    this.updateOptionsConfig = function() {
        
        if (!handler.wrap) return;
        
        var favContent = handler.wrap;
        var fav = handler.favEnv.getGlobal('fav');
        var env = handler.favEnv.getGlobal('env');
        
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
            viewerShowAs : 'hd',
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
                
        if (handler.favEnv.isDownloadSupported) {
            
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
            
        }

        var imageviewModeActions = document.getElementsByClassName(env.className + '-grid-imageview');
        for (var i = 0; i < imageviewModeActions.length; i++) {            
            var value = KellyTools.inputVal(imageviewModeActions[i]);            
            if (value && imageviewModeActions[i].checked && ['hd', 'preview'].indexOf(value) != -1) {
                 fav.coptions.grid.viewerShowAs = imageviewModeActions[i].value;
            }
        }
        
        fav.coptions.debug = false;
        
        if (KellyTools.getElementByClass(favContent, env.className + 'OptionsDebug').checked) {
            fav.coptions.debug = true;
            KellyTools.DEBUG = true;
            
            KellyTools.log('debug mode overloaded by user config', 'KellyOptions');
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
        
        var menuItems = handler.favEnv.getView('menu');
        if (menuItems['ctoptions']) menuItems['ctoptions'].style.display = fav.coptions.optionsSide ? 'none' : '';  
                
        if (handler.favEnv.isDownloadSupported) {
            
            var requestMethod = KellyTools.getElementByClass(favContent, env.className + 'GrabberRequest');
                requestMethod = requestMethod.options[requestMethod.selectedIndex].value;
                
            var transportMethod = KellyTools.getElementByClass(favContent, env.className + 'GrabberTransport');
                transportMethod = transportMethod.options[transportMethod.selectedIndex].value;
                
            if (requestMethod != fav.coptions.grabberDriver.requestMethod ||
                transportMethod != fav.coptions.grabberDriver.transportMethod) {
            
                fav.coptions.grabberDriver = KellyGrabber.validateDriver({
                    requestMethod : requestMethod,
                    transportMethod : transportMethod,            
                });
                             
                handler.favEnv.getDownloadManager().updateCfg({
                    driver : fav.coptions.grabberDriver,
                });
            }
        }
        
        /*
        var iconFile = KellyTools.getElementByClass(favContent, 'kellyAutoScroll');
        
        if (iconFile.value) {
        
            var saveIcon = function(el, icon) {
                log(icon);
            }
            
            KellyTools.readInputFile(iconFile, saveIcon, 'dataurl');
        } 
        */
                
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
            
            handler.favEnv.save('cfg');
        }
        
        applaySave();	

        
        if (refreshPosts) {
            
            handler.favEnv.formatPostContainers(); 
        }        
    }
    
    constructor(cfg);
}


//D:\Dropbox\Private\l scripts\jfav\release\Extension\\lib\kellyFavItems.js



﻿// ==UserScript==
// @encoding utf-8
// @name           KellyFavItems
// @namespace      Kelly
// @description    useful script
// @author         Rubchuk Vladimir <torrenttvi@gmail.com>
// @license        GPLv3
// ==/UserScript==

// todo выгрузка настроек \ автодамп импорта избранного сайта каждые N-страниц \ скрывать тултип при перелистывании страниц

function KellyFavItems() 
{
    this.PROGNAME = 'KellyFavItems v1.1.1.2';
    
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
    
    // dynamically created DOM elements
    
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
    
    var readOnly = true;
    var imagesAsDownloadItems = false;
    
    // addition classes
    var imgViewer = false;    
    var favNativeParser = false;
    var downloadManager = false;
    var storageManager = false;    
    var optionsManager = false;
    var fastSave = false;
    var tooltip = false;
               
    var page = 1;
    var tooltipBeasy = false; // pointer to dialog frame or true
    
    var displayedItems = [];
    var galleryImages = [];
    var galleryImagesData = [];
    
    var lng = KellyLoc;
    
    /*  fav - current loaded throw this.load method profile data object
    
        Stores information about config, items, categories
        
        categories - array of objects [.name, .id] (see getStorageManager().categoryCreate method)
        items      - array of objects [.categoryId (array), .link (string), .pImage (string|array of strings), .commentLink (undefined|text) (see itemAdd method for list of current available structured data vars)
        coptions   - structured data (see this.load method for list of current available options)
    */  
    
    var fav = {};
    
    this.isDownloadSupported = false;
    
    // buffer for page loaded as media rosource
    var selfData = false;
    var selfUrl = window.location.href;
   
    var imageGrid = false; // see getImageGrid method
    var imageGridProportions = []; // ids of updated fav items if some of ratio data deprecated
    var imageEvents = {
        
        onLoadPreviewImage : function() {
        
            var dimensions = {width : parseInt(this.naturalWidth), height : parseInt(this.naturalHeight)};
            
            // if (selectedInfo && selectedInfo['dimensions'] && selectedInfo['dimensions'].width && selectedInfo['dimensions'].schemaOrg) return false;
                            
            handler.setSelectionInfo('dimensions', dimensions);
            
            log('get width and height for ' + this.src);
            log(dimensions);
            
            updateSidebarPosition(); 
            return false; 
        },
                 
        // fires when fav element preview dimensions loaded
        // also dimensions can be catched by setSelectionInfo method in showAddToFavDialog
        
        onLoadFavGalleryImage : function(imgElement, error) {
            
            if (error) return false;
                        
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
            
            if (!aspectRatioCached || Math.abs(aspectRatioCached - aspectRatio) > 0.05) {
                imageGridProportions[imageGridProportions.length] = fav.items[favItemIndex].id;
                
                item.pw = imageWH.width;
                item.ph = imageWH.height;
                if (item.ps) delete item.ps;
                
                imgElement.setAttribute('data-width', imageWH.width);
                imgElement.setAttribute('data-height', imageWH.height);
                
                return false;
            } 
            
            
            return true;
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
                log('Unknown servise or site, cant find profile for ' + window.location.host, KellyTools.E_ERROR);
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
            log('empty environment attribute or profile name', KellyTools.E_ERROR);
            log(cfg.error);
            return;
        }
    
        if (cfg.envText) {
                
            log('text environment string disabled for security reasons', KellyTools.E_ERROR);
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
            log('init env error', KellyTools.E_ERROR);
            return;
        }
        
        if (isMediaResource()) {
            
            log(handler.PROGNAME + ' load as media item helper | profile ' + env.profile);
            
        } else {
            
            env.setFav(handler);		
            
            var action = getInitAction();        
            if (action == 'main') {
         
                handler.load(false, function() {
                    
                    if (env.getPosts()) {                
                        handler.initOnPageReady();                    
                    } else {                    
                        handler.addEventPListener(window, "load", function (e) {
                            handler.initOnPageReady();
                            return false;
                        }, 'init_');                    
                    }
                });
                
            } else if (action == 'disable') {
                
                // currently unused
                // window.parent.postMessage({url : selfUrl, method : 'readyAsResource'}, "*");
            }
            
            log(handler.PROGNAME + ' init | loaded in ' + action + ' mode | profile ' + env.profile + ' | DEBUG ' + (KellyTools.DEBUG ? 'enabled' : 'disabled'));           
        }
        
        handler.addEventPListener(window, "message", function (e) {
            getMessage(e);
        }, 'input_message_');             
    }
        
    function isMediaResource() {
        
        var ext = KellyTools.getUrlExt(selfUrl);        
        var media = ['jpg', 'jpeg', 'png', 'gif'];
        
        if (media.indexOf(ext) == -1) return false;
        
        window.parent.postMessage({filename : KellyTools.getUrlFileName(selfUrl, false, true), method : 'mediaReady'}, "*");
        return true;
    }

    function getMessage(e) {
        
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
                dontWait : true,
                fixed : 2,
                tmpBounds : { width : 200, height : 200},
                recheckAlways : true,
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
                    
                    log(data.error);
                    log(data.tile);
                    
                    if (data.errorCode == 2 || data.errorCode == 3 || data.errorCode == 4) {
                        
                        data.boundEl.setAttribute('data-width', 200);
                        data.boundEl.setAttribute('data-height', 200);
                        data.boundEl.style.display = 'inline-block';
                        
                        return {width : 200, height : 200};
                        
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
                    return imageEvents.onLoadFavGalleryImage(boundEl, state == 'error' ? true : false);
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
                
                onResize : function(self) {
                    if (mode != 'fav') return true; // exit
                },
                
            },
            
        });
        
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
        
        favCounter.className = env.className + '-FavItemsCount ' + env.className + '-buttoncolor-dynamic ' + itemsLengthClass;        
        favCounter.innerText = fav.items.length;
    }
    
    function getInitAction() { 
    
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
                driver : fav.coptions.grabberDriver,
                // baseFolder
            });
        }
          
        return downloadManager;
    }
    
    this.getTooltip = function(toDefaults) {
        if (!tooltip) {
        
            tooltip = new KellyTooltip({
            
                classGroup : env.className + '-tooltipster', 
                selfClass : env.hostClass + ' ' + env.className + '-Default-tooltipster',
                closeButton : false,
                
                events : { 
                
                    onMouseOut : function(tooltip, e) {
                        
                        if (tooltipBeasy) return false;
                        
                        var related = e.toElement || e.relatedTarget;
                        if (tooltip.isChild(related)) return;
                        
                        tooltip.show(false);
                    },
                    
                    onClose : function(tooltip) {
                        
                        tooltip.updateCfg({closeButton : false});
                        
                        setTimeout(function() {
                            tooltipBeasy = false;
                        }, 500);
                        
                        tooltip.getContent().onclick = function() {}
                    },
                
                }, 
                
            });
        } 
        
        return tooltip;
    }
    
    function log(info, errorLevel) {
        KellyTools.log(info, 'KellyFavItems', errorLevel);     
    }

    // validate selected categories, remove from selected if some of them not exist
    
    function validateCategories(catList, db) {
           
        if (!db) db = fav;
        var tmpSelectedCategories = []; 
        
        if (catList) {
            
            for (var i = 0; i < catList.length; i++) {
            
                if (handler.getStorageManager().getCategoryById(db, catList[i]).id == -1) {
                    log('validateCategories : skip deprecated category ' + catList[i]);
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
        if (tooltipBeasy) return false;
        
        if (!displayedItems || !displayedItems.length || !imagesBlock) return false;
                
              
        if (imageGridProportions.length) {
            log('save new proportions for items');
            imageGridProportions = [];
            handler.save('items');
        }
        
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
        
        //imagesBlock.className = imagesBlock.className.replace('active', 'hidden');
        
        //setTimeout(function() {
            
        //    imagesBlock.className = imagesBlock.className.replace('hidden', 'active');
        imageGrid.close();
        
        handler.updateImagesBlock();
        handler.updateImageGrid();
            
        //}, 200);
        
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
       
    function addImageInfoTip(el) {
        
        var item = false;
        
        var getCurrentImage = function(state) {
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
        
        var getMessage = function(el, e) {
        
            var state = imgViewer.getCurrentState();
            item = getCurrentImage(state); 
            
            if (!item) return false;
        
            var message = document.createElement('div');
                
            KellyTools.setHTMLData(message, handler.showItemInfo(item)); 
            
            handler.applayItemCollectionButton(message.getElementsByClassName(env.className + '-ItemTip-image'));
            
            return message;
        }
        
        var onShow = function(el, e, tooltip) {
            
            var state = imgViewer.getCurrentState();
            
            if (state.beasy || !state.shown || getCurrentImage(state) != item) {
                tooltip.remove();
                imgViewer.tooltip = false;
            }
            
            if (imgViewer.tooltip) {
                imgViewer.tooltip.remove();
            }
            
            imgViewer.tooltip = tooltip;
        }
        
        KellyTooltip.addTipToEl(el, getMessage, {
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
        
        // todo modal mode for fit to ANY site
                
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
                        }
                    }
                },
            });
            
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
        
        handler.addEventPListener(window, "resize", function (e) {
            
            if (env.events.onWindowResize && env.events.onWindowResize(e)) return;
            
            updateSidebarPosition();
            
        }, '_fav_dialog');
        
        handler.addEventPListener(window, "scroll", function (e) {
            
            if (env.events.onWindowScroll && env.events.onWindowScroll(e)) return;
            
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
        
        if (fav.coptions.optionsSide) optionsButton.style.display = 'none';
        
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
        
        
        if (env.events.onInitWorktop) env.events.onInitWorktop();	
        
        return true;
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
        handler.removeEventPListener(window, 'scroll', 'fav_scroll');

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
    
    // вывести контент расширения и назначить режим отображения
    
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
        
        optionsManager.showOptionsDialog();
        
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
    
    // category list tooltip in readOnly false mode
    
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
            
        handler.getDownloadManager().createAndDownloadFile(JSON.stringify(storage), fname);
        return true;
    }
    
    this.applayItemCollectionButton = function(items) {
        
        if (!items || !items.length) return;
        
        for (var i = 0; i < items.length; i++) {
            items[i].onclick = function() {
            
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

        // show as image
        
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
                
                handler.applayItemCollectionButton([collectionBtn]);
            }
            // todo replace
            //env.getImageDownloadLink(galleryImages[galleryIndex], true)
            
            if (!fav.coptions.animateGif || !item.pw) coverImage = env.getStaticImage(coverImage);
            
            var html = '\
                <img style="' + fav.coptions.grid.cssItem + '" \
                     class="' + env.className + '-preview" \
                     kellyGalleryIndex="' + (galleryImagesData.indexOf(item) + subItem) + '" \
                     kellyGallery="fav-images" \
                     itemIndex="' + index + '"' + pInfo + additionAtributes + '\
                     src="' + coverImage + '" \
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
                if (tooltipBeasy) return false;
                if (readOnly) return false;
                
                var itemIndex = this.getAttribute('itemIndex');
                showItemInfoTooltip(this.getAttribute('itemIndex'), this);
            }  
                
            itemBlock.onmouseout = function(e) {    
                if (tooltipBeasy) return false;
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
            KellyTools.getElementByClass(controlls, env.className + '-PreviewImage').onload = imageEvents.onLoadPreviewImage;
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
                avoidOutOfBounds : true,
            });
        
        html = '\
            <div class="' + env.className + 'CatAddForm">\
                <div>\
                    <input type="text" placeholder="' + lng.s('Название новой категории', 'cat_name') + '" value="" class="' + env.className + 'CatName"><br>\
                    <!--input type="text" placeholder="' + lng.s('Приоритет', 'cat_order') + '" value="" class="' + env.className + 'CatOrder"-->\
                    <a href="#" class="' + env.className + 'CatCreate">' + lng.s('Создать категорию', 'cat_create') + '</a>\
                </div>\
            </div>';
        
        var container = tooltipEl.getContent();
        KellyTools.setHTMLData(container, html);
        
        container.onclick = function() {
            tooltipBeasy = true; 
            tooltipEl.updateCfg({closeButton : true});
        }
        
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
                <br>\
                <a class="' + baseClass + '-newname-button" href="#">' + lng.s('Применить', 'change') + '</a>\
                ' + deleteButtonHtml + '\
            </div>';
        
        var container = tooltipEl.getContent();
            KellyTools.setHTMLData(container, html);
        
        container.onclick = function(e) {            
            if (e.target.className.indexOf('make-beasy') == -1) return;
            
            tooltipBeasy = tooltipEl; 
            tooltipEl.updateCfg({closeButton : true});
        }
        
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
                    assoc : KellyTools.getElementByClass(container, baseClass + '-associations').value,
                }
                
                var result = handler.categoryEdit(editCat, itemIndex);
                if (!result) return false;
                
                KellyTools.getElementByClass(container, baseClass + '-associations').value = category.assoc;
                
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
                    if (tooltipBeasy) return false;
                    if (readOnly) return false; 
                    showCategoryControllTooltip(this.getAttribute('itemId'), this);    
                }
                
                filter.onmouseout = function(e) {
                    if (tooltipBeasy) return false;
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
                if (tooltipBeasy) return false;
                showCategoryCreateTooltip(this);    
            }
            
            filterAdd.onmouseout = function(e) {
                if (tooltipBeasy) return false;
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
        
        if (tooltipBeasy) {
            handler.getTooltip().show(false);
        }
        
        if (imageGridProportions.length) {
            log('save new proportions for items');            
            imageGridProportions = [];
            handler.save('items');
        }
        
        // todo save downloadManager options by - need "changed" marker
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
            logicButton.title = '';
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
            no.title = lng.s('Режим добавления в выборку \ исключения из выборки категрии', 'cats_filter')
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
                    
                    fav.coptions.grabber.itemsList = ''; // is range set save needed ?
                    
                    dm.updateCfg({
                        events : false,
                        options : fav.coptions.grabber,
                    });
                    
                    dm.updateCfg({
                        events : {
                            onChangeState : function(self, newState) {
                                if (newState == 'download') {
                                    fav.coptions.grabber = self.getOptions();
                                    handler.save('cfg');
                                }
                            }
                        }
                    })
                    
                    dm.showGrabManager();  
                    
                    downloaderBox.modal.className = downloaderBox.modal.className.replace('hidden', 'active');                    
                }
                
                updateSidebarPosition();
            }
            
            var download = editButton.cloneNode();
                download.className = env.className + '-FavEditButton ' + env.className + '-FavEditButton-download ' + (imagesAsDownloadItems ? 'active' : 'hidden');
                download.innerText = lng.s('Загрузки', 'download_manager');
                download.title = lng.s('Загрузки', 'download_manager');
                
                download.onclick = function () {
                    if (!checkSafeUpdateData()) return false;
                    
                    if (imagesAsDownloadItems) { 
                        imagesAsDownloadItems = false;
                        this.className = this.className.replace('active', 'hidden');
                        editButton.style.display = 'block';
                        
                        sideBarLock = false;
                        showDownloadManagerForm(false);
                    } else {
                        imagesAsDownloadItems = true;
                        this.className = this.className.replace('hidden', 'active');  
                        
                        if (!readOnly) {
                            editButton.click();
                        }
                        
                        editButton.style.display = 'none';
                        
                        sideBarLock = true;
                        handler.getDownloadManager().setDownloadTasks(displayedItems);                        
                        showDownloadManagerForm(true);
                    }
                    
                    handler.updateImagesBlock();                
                    handler.updateImageGrid();
                    return false;
                }
                
            additionButtons.appendChild(download);
            
            
            if (imagesAsDownloadItems) {
                if (!readOnly) {
                    editButton.click();
                }
                
                editButton.style.display = 'none';
            }       
       
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
        if (env.events.onSideBarShow) env.events.onSideBarShow();
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
            previewImage.onload = imageEvents.onLoadPreviewImage;
        }, 100);
        
        // take dimensions from width \ height attributes ?

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
    // onApply  - применить изменения (удаление части элементов из подборки)
    // onRemove - полное удаление
    // onCancel - отмена
    
    this.showRemoveFromFavDialog = function(itemIndex, onRemove, onCancel, onApply) {
    
        if (!fav.items[itemIndex]) {
            log('attempt to remove unexist item ' + itemIndex);
            return false;
        }
        
        handler.showSidebarMessage(false);
        clearSidebarLoadEvents();
        
        var html = '<p>' + lng.s('Подтвердите удаление', 'delete_confirm') + '</p>';
            html += '<p class="' + env.className + '-ModalBox-controll-buttons"><a href="#" class="' + env.className + 'Remove">' + lng.s('Удалить', 'delete')  +  '</a><a href="#" class="' + env.className + 'Apply">' + lng.s('Применить изменения', 'apply')  +  '</a>';
            html += '<a href="#" class="' + env.className + 'Cancel">' + lng.s('Отменить', 'cancel')  +  '</a></p>';       
            html += '<div class="' + env.className + '-remove-catList"></div>';
            
        KellyTools.setHTMLData(modalBoxContent, '<div class="' +  env.className + '-removeDialog">' + html + '</div>');
        
        var removeButton = KellyTools.getElementByClass(modalBoxContent, env.className + 'Remove');
        var removeApplyButton = KellyTools.getElementByClass(modalBoxContent, env.className + 'Apply');
        var removeDialog = KellyTools.getElementByClass(modalBoxContent, env.className + '-removeDialog');
        
        var catList = KellyTools.getElementByClass(modalBoxContent, env.className + '-remove-catList');    
            
        html = '<p>';
        
        if (fav.items[itemIndex].categoryId.length) {
            for (var i = 0; i < fav.items[itemIndex].categoryId.length; i++) {
                var category = handler.getStorageManager().getCategoryById(fav, fav.items[itemIndex].categoryId[i]);
                if (category == -1) {
                    continue;
                } 
                
                html += (i > 0 ? ', ' : '') + '<span>' + category.name + ' (ID : ' + category.id + ')</span>';
            }
        }  
    
        html += '</p>';
        KellyTools.setHTMLData(catList, html);
        
        
        selectedImages = false;
        
        var previewBefore = getCoverImageByItem(fav.items[itemIndex]);
        
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

                var previewAfter = getCoverImageByItem(fav.items[itemIndex]);
                
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
    
    // selectAutoCategories(db) - db - selected database - by default current profile db
    // 
    // sets auto categories by current selected media
    // currently only auto detects GIF category, no any associations with tags supported
    // 
    // variables that can be helpful for future develop
    //
    // selectedPost - current selected post
    // var postTags = env.getPostTags(selectedPost); - current post taglist
    //
    // 
    
    function selectAutoCategories(db, tagList) {
        
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
      
        if (tagList) {
            // remove current assoc categories
            for (var i = 0; i < db.categories.length; i++) {
                if (!db.categories[i].assoc) continue;
                
                var selectedIndex = db.selected_cats_ids.indexOf(db.categories[i].id);
                if (selectedIndex != -1) {
                    db.selected_cats_ids.splice(selectedIndex, 1);
                }
            }
            
            // select actual assoc categories for tagList
            for (var i = 0; i < tagList.length; i++) {
                handler.getStorageManager().addAssocCatsByTag(db, tagList[i]);
            }
            
            // log(fav.cats_assoc_buffer);
        }
    }
        
    this.showAddToFavDialog = function(postBlock, comment, onAdd) {
        
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
       
        var postTags = false;
        
        if (env.getPostTags) {
            postTags = env.getPostTags(selectedPost);
        }
        
        selectAutoCategories(fav, postTags);        
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

            var result = handler.itemAdd();
                     
            if (result && onAdd) onAdd(selectedPost, selectedComment, selectedImages);            
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
        
            var text = env.getCommentText(selectedComment);
            if (text) postItem.text = text;

            postItem.commentLink = env.getCommentLink(selectedComment);
            
            if (!postItem.commentLink) {
                
                if (!noSave) handler.showSidebarMessage(lng.s('Ошибка определения ссылки на публикацию', 'item_add_err1'), true);
                return false;
            }
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
            
            // untrusted original proportions
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
            return true;
        }
            
        fav.ids++;		
        postItem.id = fav.ids; 

        handler.showSidebarMessage(lng.s('Публикация добавлена в избранное', 'item_added'));
                
        fav.items[fav.items.length] = postItem;
        handler.updateFavCounter();
            
        selectedComment ? env.formatComments(selectedPost) : env.formatPostContainer(selectedPost);
        
        log('post saved');
        log(postItem);
        handler.save('items');
        
        return true;
    }
    
    // todo move to storage manager
    
    // удалить элемент с последующим обновлением контейнеров публикаций 
    // index - item index in fav.items[index] - comment \ or post
    // postBlock - not important post container dom element referense, helps to find affected post
        
    this.itemRemove = function(index, postBlock) {
    
        fav.items.splice(index, 1);
        
        handler.updateFavCounter();
        
        handler.save('items');

        if (!postBlock) { // update all visible posts
        
           handler.formatPostContainers();
           
        } else {
        
            env.formatPostContainer(postBlock);
            
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
    
        var downloadBtn = KellyTools.getElementByClass(document, env.className + '-DownloadFav');
        if (downloadBtn) downloadBtn.innerText = lng.s('Запустить скачивание страниц', 'download_start');	
            
        if (!favNativeParser || !favNativeParser.collectedData.items.length) return false;
                                
        KellyTools.getElementByClass(document, env.className + '-Save').style.display = 'block';
            
        var saveNew = KellyTools.getElementByClass(document, env.className + '-SaveFavNew');
            saveNew.onclick = function() {
            
                if (favNativeParser && favNativeParser.saveData) favNativeParser.saveData();
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
     
        if (!thread.response) {
        
            error = 'Страница не доступна ' + thread.job.data.page + ' (ошибка загрузки или превышен интервал ожидания)'; // window.document null  
            if (thread.error) {
                error += ' | Ошибка воркера : [' + thread.error + ']';
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
                logNum++;
                
                var text = document.createTextNode('[' + KellyTools.getTime() + '] Страница : ' + thread.job.data.page + ' найдено ' + posts.length + ' элементов');
                
                logEl.appendChild(text);
                logEl.appendChild(logNewLine);                
                logEl.setAttribute('data-lines', logNum+1);
            }
            
            worker.jobBeforeAutoave--;
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
        
        // exlude unnesessery data to improve load speed - ok        
        // clear selected cats to ignore current profile categories in itemAdd method (used to collect selectedImages to new item)
            fav.selected_cats_ids = [];
            
        for (var i = 0; i < posts.length; i++) {
        
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
            selectAutoCategories(worker.collectedData, false);
            
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
    
        if (fav.coptions.downloader.autosaveEnabled && !worker.jobBeforeAutoave) {
            
            worker.jobBeforeAutoave = worker.jobAutosave ? worker.jobAutosave : 1000;
            worker.jobSaved = worker.jobSaved ? worker.jobSaved+worker.jobAutosave : worker.jobAutosave;
            worker.saveData(true);
            
        }
    
    }
    
    this.downloadNativeFavPage = function(el) {
        
        if (!env.getFavPageInfo) {
            log(env.profile + 'not support native downloads');
            return false;
        }
        
        var favInfo = env.getFavPageInfo();        
        if (!favInfo) return false;

        favNativeParser.errors = '';

        if (favNativeParser.getJobs().length) {
        
            favNativeParser.stop();
            handler.onDownloadNativeFavPagesEnd();
            
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
        
        log(autosaveEnabled);
        log(fav.coptions.downloader.autosaveEnabled);
        log(updateOptions);
        
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
            favNativeParser.jobBeforeAutoave = autosave;
            favNativeParser.jobSaved = 0;
            
        }
        
        var skipEmpty = KellyTools.getElementByClass(document, env.className + '-exporter-skip-empty');
            skipEmpty = skipEmpty && skipEmpty.checked ? true : false;
        
        if (fav.coptions.downloader.skipEmpty != skipEmpty) {
            updateOptions = true;
            fav.coptions.downloader.skipEmpty = skipEmpty;
        }
               
        var pagesList = [];
        
        var message = KellyTools.getElementByClass(document, env.className + '-exporter-process');
        
        if (pages && pages.value.length) {
            
            pagesList = KellyTools.getPrintValues(pages.value, true, 1, favInfo.pages);
        } else { 
        
            pagesList = KellyTools.getPrintValues('1-' + favInfo.pages, true);
        }	
                
        // todo разделить автосохранение и лимиты (автосохранение опционально)
                
        if (!fav.coptions.downloader.autosaveEnabled && favInfo.pages > favNativeParser.maxPagesPerExport && pagesList.length > favNativeParser.maxPagesPerExport ) {
                        
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
                favInfo.url.replace('__PAGENUMBER__', pageNumber), 
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
        
        var logEl = KellyTools.getElementByClass(document, env.className + '-exporter-log');
        
        KellyTools.setHTMLData(logEl, '[' + KellyTools.getTime() + '] Инициализация...' + "<br>");

        el.innerText = lng.s('Загрузка... (Отменить)', 'download_started_cancel');  
        
        log('download native page started');
        log('Include Tag list :');
        log(favNativeParser.tagList);
        
        favNativeParser.exec();        
    }
    
    this.showNativeFavoritePageInfo = function() {
        
        // single file downloads now supported in any browser
        
        // if (!handler.isDownloadSupported) {
        //    return false;
        // }
        
        if (!env.getFavPageInfo) {
            log(env.profile + 'not support native downloads');
            return false;
        }
        
        
        var favPageInfo = env.getFavPageInfo();
     
        if (favPageInfo && favPageInfo.items) {
                                
            if (!favNativeParser) {
                
                favNativeParser = new KellyThreadWork({env : handler});  
                
                favNativeParser.setEvent('onEnd', handler.onDownloadNativeFavPagesEnd);                
        
                favNativeParser.maxPagesPerExport = 1000;
                favNativeParser.saveData = function(autosave) {
                    
                    log('favNativeParser : save current progress : ' + (autosave ? 'autosave - saved ' + favNativeParser.jobSaved  : 'click'));
                    
                    if (favNativeParser.collectedData.selected_cats_ids) {
                        delete favNativeParser.collectedData.selected_cats_ids;
                    }
                    
                    var fname = env.profile + '/Storage/ExportedFavourites/';
                        fname += 'db_';
                        
                    var pageInfo = env.getFavPageInfo();					
                    if (pageInfo.userName) fname += '_' + KellyTools.getUrlFileName(pageInfo.userName);
                    
                    fname += '_' + KellyTools.getTimeStamp();
                    
                    if (autosave) {
                        fname += '__page_' + favNativeParser.jobSaved;
                    }
                    
                    fname += '.' + handler.getStorageManager().format;
                    
                    fname = KellyTools.validateFolderPath(fname);                    
                    
                    handler.getDownloadManager().createAndDownloadFile(JSON.stringify(favNativeParser.collectedData), fname);

                    if (autosave) {
                        favNativeParser.collectedData = handler.getStorageManager().getDefaultData();
                    }
                }
            }
        
            var saveBlock = '\
                <div class="' + env.className + '-Save" style="display : none;">\
                    <p>' + lng.s('', 'download_save_notice') + '</p>\
                    <a href="#" class="' + env.className + '-SaveFavNew" >' + lng.s('Скачать как файл профиля', 'download_save') + '</a>\
                </div><br>';
            
            var items = favPageInfo.items;
            if (favPageInfo.pages > 2) { 
                items = '~' + items;
            }
            
            // для текстовый публикаций делать заголовок через метод setSelectionInfo
            
            var tagFilterHtml = '';
            
            var tags = fav.coptions.downloader.tagList ? fav.coptions.downloader.tagList : '';
            var createByTags = fav.coptions.downloader.catByTagList ? fav.coptions.downloader.catByTagList : '';
            var autosave = fav.coptions.downloader.autosave ? fav.coptions.downloader.autosave : favNativeParser.maxPagesPerExport;
            
            if (env.getPostTags) {
            
                tagFilterHtml = '\
                    <label><input type="checkbox" class="' + env.className + '-exporter-tag-filter-show"> ' + lng.s('Применять фильтрацию по тегам', 'download_tag_filter_show') + '</label>\
                    <div class="' + env.className + '-exporter-tag-filter-container" style="display : none;">'
                        + lng.s('', 'download_tag_filter_1') + '<br>'
                        + lng.s('Если теги не определены, выполняется сохранение всех публикаций', 'download_tag_filter_empty') 
                        + '</br>\
                        <textarea class="' + env.className + '-exporter-tag-filter" placeholder="' + lng.s('Фильтровать публикации по списку тегов', 'download_tag_filter') + '">' + tags + '</textarea>\
                    </div>\
                ';
                
                tagFilterHtml += '\
                    <label><input type="checkbox" class="' + env.className + '-exporter-create-by-tag-show"> ' + lng.s('Автоматически создавать категории для тегов', 'download_createc_by_tag') + '</label>\
                    <div class="' + env.className + '-exporter-create-by-tag-container" style="display : none;">'
                        + lng.s('Если публикация содержит один из перечисленных в поле тегов, к публикации будет добавлена соответствующая категория', 'download_createc_1') + '<br>'
                        + '</br>\
                        <textarea class="' + env.className + '-exporter-create-by-tag" placeholder="' + lng.s('Автоматически создавать категории для тегов', 'download_createc_by_tag') + '">' + createByTags + '</textarea>\
                    </div>\
                ';
            }
            
            var downloaderOptions = favNativeParser.getCfg();
            
            var dhtml = '';
            
            for (var k in downloaderOptions){
                 dhtml += '<p>' + k + ' : <input value="' + downloaderOptions[k]+ '" class="' + env.className +'-downloader-option-' + k + '"></p>';
            }   
            
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
                     <a href="#" class="' + env.className + '-DownloadFav">' + lng.s('Запустить скачивание страниц', 'download_start') + '</a>\
                     <a href="#" class="' + env.className + '-exporter-log-show" style="display : none;">' + lng.s('Показать лог', 'download_log') + '</a>\
                     <a href="#" class="' + env.className + '-tech-options-show" style="' + (!KellyTools.DEBUG ? 'display : none;' : '') + '">' + lng.s('Options', 'hidden_options') + '</a>\
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
                
                KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-create-by-tag-show').onchange = function() {
                    
                    var el = KellyTools.getElementByClass(favPageInfo.container, env.className + '-exporter-create-by-tag-container');
                        el.style.display = this.checked ? 'block' : 'none'; 
                    
                    return false;
                };
            }            
            
            KellyTools.getElementByClass(document, env.className + '-DownloadFav').onclick = function() {
                handler.downloadNativeFavPage(this);
                return false;
            };
        }
        
    }
    
    this.formatPostContainers = function(container) {
        
        var publications = env.getPosts(container);
        for (var i = 0; i < publications.length; i++) {
            env.formatPostContainer(publications[i]);
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
        
    this.initOnPageReady = function() {
        
        if (init) return false;
        
        if (!env.getMainContainers().body) {
            log('initExtensionResources() main container is undefined ' + env.profile, KellyTools.E_ERROR);
            return false;
        }
        
        if (!KellyTools.getBrowser()) {
        
            log('Fail to get API functions, safe exit from page ' + document.title, KellyTools.E_ERROR);
            return false; 
        }
        
        // parallel with load resources in initCss
        
        handler.addEventPListener(document.body, "keyup", function (e) {
            
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
        
        if (env.events.onPageReady && env.events.onPageReady()) {			
            return false;
        }
        
        // currently we can modify post containers without waiting css, looks fine
        handler.formatPostContainers();
        initExtensionResources();       
    }
    
    this.addEventPListener = function(object, event, callback, prefix) {
    
        handler.removeEventPListener(object, event, prefix);
        
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

    this.removeEventPListener = function(object, event, prefix) {
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



//D:\Dropbox\Private\l scripts\jfav\release\Extension\\env\profiles\joyreactor.js



// part of KellyFavItems extension
// JoyReactor environment driver

// default profile driver must be assign to K_DEFAULT_ENVIRONMENT variable
// todo environment only ui methods

function kellyProfileJoyreactor() {
        
    var handler = this;
    var favPageUrlTpl = '/user/__USERNAME__/favorite/__PAGENUMBER__';  
    var publicationClass = 'postContainer';
    
    var mainDomain = 'joyreactor.cc';    
    var mainContainers = false;
    
    var commentsBlockTimer = [];
    
    var sideBarPaddingTop = 24;
    var publications = false;
      
    /* imp */
    
    this.className = 'kellyJRFav'; 
    this.profile = 'joyreactor';        
    this.hostClass = window.location.host.split(".").join("_");
    
    this.actionVar = 'dkl_pp';
  
    this.fav = false;        
    this.events = {

        onWindowScroll : function() {
            
            updateFastSaveButtonsState();
            return false;
        },
        
        onWindowResize : function() {
            
            return false;
        },
        
        onPageReady : function() {
            
            publications = handler.getPosts();
            
            return false;
        },
        
        onInitWorktop : function() {
            
            updateFastSaveButtonsState();
            return false;
        },
        
        onExtensionReady : function() {
                     
            if (window.location.host == handler.mainDomain || window.location.host.indexOf('old.') == -1) {

                var bar = document.getElementById('searchBar');
                
                var style = {
                    bg : false,
                    btn : false,
                };
                
                if (bar) {
                    style.bg = window.getComputedStyle(bar).backgroundColor;
                    
                    var btn = bar.querySelector('.submenuitem.active a');
                    if (btn) {
                        style.btn = window.getComputedStyle(btn).backgroundColor;
                    }
                }
                
                css = "\n\r\n\r\n\r" + '/* ' +  handler.profile + '-dynamic */' + "\n\r\n\r\n\r";
                if (style.btn && style.btn.indexOf('0, 0, 0, 0') == -1) {
                    css += '.' + handler.className + '-basecolor-dynamic {';
                    css += 'background-color : ' + style.btn + '!important;';
                    css += '}';
                }
                
                if (style.bg && style.bg.indexOf('0, 0, 0, 0') == -1) {
                
                    css += '.active .' + handler.className + '-buttoncolor-dynamic, \
                            .active.' + handler.className + '-buttoncolor-dynamic, \
                            .' + handler.className + '-ahover-dynamic:hover .' + handler.className + '-buttoncolor-dynamic, \
                            .' + handler.className + '-ahover-dynamic .' + handler.className + '-buttoncolor-dynamic:hover \
                            {';
                            
                    css += 'background-color : ' + style.btn + '!important;';
                    css += '}';
                                        
                    css += '.' + handler.className + '-buttoncolor-any-dynamic {';
                    css += 'background-color : ' + style.btn + '!important;';
                    css += '}';
                }
                
                handler.fav.addCss(css);
            }
            
            handler.fav.showNativeFavoritePageInfo();
        },
        
        onSideBarShow : function() {
            
            var sideBarWrap = handler.fav.getSidebar();            
            if (!sideBarWrap || sideBarWrap.className.indexOf('hidden') !== -1) return false;
            
            var filters = KellyTools.getElementByClass(sideBarWrap, handler.className + '-FiltersMenu');     
            
            if (filters && filters.offsetHeight > 440 && filters.className.indexOf('calculated') == -1) {
                
                var filtersBlock = KellyTools.getElementByClass(sideBarWrap, handler.className + '-FiltersMenu-container');
                    
                filtersBlock.style.maxHeight = '0';
                filtersBlock.style.overflow = 'hidden';
                
                var modalBox = KellyTools.getElementByClass(document, handler.className + '-ModalBox-main');						
                    modalBox.style.minHeight = '0';

                var modalBoxHeight = modalBox.getBoundingClientRect().height;       
                
                var viewport = KellyTools.getViewport();
                if (viewport.screenHeight < modalBoxHeight + filters.offsetHeight + sideBarPaddingTop) {
                    filtersBlock.style.maxHeight = (viewport.screenHeight - modalBoxHeight - sideBarPaddingTop - 44 - sideBarPaddingTop) + 'px';
                    filtersBlock.style.overflowY = 'scroll';

                } else {
                        
                    filtersBlock.style.maxHeight = 'none';
                    filtersBlock.style.overflow = 'auto';
                }
                
                filters.className += ' calculated';
            }
        }
    
    }
    
    function updatePostFavButton(publication) {
        
        var link = getPostLinkEl(publication);
        
        if (!link) {            
            KellyTools.log('empty post link element', 'profile updatePostFavButton');
            return false;        
        }
        
        var linkUrl = handler.getPostLink(publication, link);
        if (!linkUrl) {
            KellyTools.log('bad post url', 'profile updatePostFavButton');
            return false;  
        }
        
        var inFav = handler.fav.getStorageManager().searchItem(handler.fav.getGlobal('fav'), {link : linkUrl, commentLink : false});
        
        var addToFav = KellyTools.getElementByClass(publication, handler.className + '-post-FavAdd');
    
        // create if not exist
        
        if (!addToFav) {
            
            addToFav = document.createElement('a');
            addToFav.className = handler.className + '-post-FavAdd';
            
            // keep same url as main button, to dont loose getPostLink method functional and keep similar environment
            addToFav.href = link.href; 
           
            var parentNode = link.parentNode;
                parentNode.insertBefore(addToFav, link);
        }
        
        // update title
        
        if (inFav !== false) {
                        
            addToFav.innerText = KellyLoc.s('Удалить из избранного', 'remove_from_fav');
            addToFav.onclick = function() { 
            
                handler.fav.showRemoveFromFavDialog(inFav, function() {
                    if (handler.fav.getGlobal('fav').coptions.syncByAdd) handler.syncFav(publication, false);
                    
                    handler.fav.closeSidebar(); 
                }); 
                
                return false; 
            };
            
        } else {
            
            addToFav.innerText = KellyLoc.s('Добавить в избранное', 'add_to_fav');
            addToFav.onclick = function() { 
                
                handler.fav.showAddToFavDialog(publication, false, function(selectedPost, selectedComment, selectedImages) {                    
                    
                    if (!selectedComment && handler.fav.getGlobal('fav').coptions.syncByAdd) {
                        handler.syncFav(selectedPost, true);
                    }                     
                });
                
                return false; 
            };
            
        }
                
        return true;            
    }
    
    
    function getPostLinkEl(publication) {
        
        if (window.location.host.indexOf('old.') == -1) {

            var link = KellyTools.getElementByClass(publication, 'link_wr');
            if (link) link = KellyTools.getChildByTag(link, 'a');
        } else {
            var link = publication.querySelector('[title="ссылка на пост"]');
        }		
        
        return link;
    }
    
    function getMainImage(publication, content) {
        
        if (!publication) return false;
        
        var mainImage = false;
        var validateTextContent = function(input) {
            var output = "";
            for (var i=0; i < input.length; i++) {
                
                if (input.charCodeAt(i) > 127) continue;
                
                if (input.charAt(i) == "\\") output += "\\\\"; 
                else output += input.charAt(i);
            }
            
            // console.log(output);
            return output;
        }
        
        var schemaOrg = publication.querySelector('script[type="application/ld+json"]');
        
        if (schemaOrg) schemaOrg = schemaOrg.textContent.trim();
        if (schemaOrg) schemaOrg = validateTextContent(schemaOrg);
        
        if (schemaOrg && schemaOrg.indexOf('//schema.org') != -1) {
    
            mainImage = KellyTools.parseJSON(schemaOrg);
            if (mainImage && mainImage.image) {
                mainImage = mainImage.image;
                mainImage.url = handler.getImageDownloadLink(mainImage.url, false);
                if (!mainImage.url || !mainImage.width || !mainImage.height) {
                    mainImage = false;
                }
            } else {
                mainImage = false;
                KellyTools.log('parse json data fail : ' + schemaOrg, 'profile getMainImage');               
            }
        }

        if (mainImage) {					
            mainImage.schemaOrg = true;
        }
        
        return mainImage;
    }
    
    function getCommentsList(postBlock) {    
        
        var comments = postBlock.getElementsByClassName('comment');
        if (comments.length) return comments;

        return false;               
    }
    
    function getPostUserName(publication) {
        var nameContainer = KellyTools.getElementByClass(publication, 'uhead_nick');
        if (nameContainer) {
            var img = KellyTools.getElementByClass(publication, 'avatar');
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
    
    function updateFastSaveButtonsState() {
        
        var options = handler.fav.getGlobal('fav');
        
        
        if (!handler.fav.isDownloadSupported || !options.coptions.fastsave.enabled || !options.coptions.fastsave.check) {
            return false;
        }
        
        if (!publications || !publications.length) return false;

        var scrollBottom = KellyTools.getViewport().scrollBottom;
        
        var updatePublicationFastButton = function(publication) {
            
            var button = KellyTools.getElementByClass(publication, handler.className + '-fast-save-unchecked');           
            if (!button) return;
            
            if (button.getBoundingClientRect().top < scrollBottom + 100) {
                
                button.classList.remove(handler.className + '-fast-save-unchecked');
                
                handler.fav.getFastSave().downloadCheckState(publication, function(state) {
                    button.classList.add(handler.className + '-fast-save-' + state);
                });
            } 
        }
        
        for (var i = 0; i < publications.length; i++) {
            
            if (!publications[i]) continue;
            
            updatePublicationFastButton(publications[i]);                    
        }
    }
    
    this.getCommentText = function(comment) {
    
        var contentContainer = KellyTools.getElementByClass(comment, 'txt');
        
        if (!contentContainer) return '';
        
        var textContainer = contentContainer.childNodes[0];
        return textContainer.textContent || textContainer.innerText || '';
    }
        
    this.formatComments = function(block) {
    
        var comments = getCommentsList(block);
        if (!comments) return false;
        
        var blackList = handler.fav.getGlobal('fav').coptions.comments_blacklist;
        
        for(var i = 0; i < comments.length; i++) {
                                    
            if (blackList) {  
                var userName = getCommentUserName(comments[i]);
                if (blackList.indexOf(userName) != -1) { 
                    comments[i].style.display = 'none';            
                    continue;
                }
            }
        
            var addToFavButton = comments[i].getElementsByClassName(handler.className + '-addToFavComment');
            
            if (!addToFavButton.length) {
        
                var bottomLink = comments[i].getElementsByClassName('comment_link');
                if (bottomLink.length) {
                
                    addToFavButton = document.createElement('a');
                    addToFavButton.href = '#';
                    
                    addToFavButton.innerText = '';
                    
                    addToFavButton.setAttribute('commentId', comments[i].id);
                    addToFavButton.className = handler.className + '-addToFavComment';
            
                    bottomLink[0].parentElement.appendChild(addToFavButton);
                    // responseButton.parentNode.inserBefore(addToFavButton, responseButton.nextSibling) insert after
                }
            } else {
                addToFavButton = addToFavButton[0];
            }
            
            
            // searh comment by link
            var link = KellyTools.getRelativeUrl(handler.getCommentLink(comments[i]));
            if (!link) continue;
            
            var inFav = handler.fav.getStorageManager().searchItem(handler.fav.getGlobal('fav'), {link : false, commentLink : link});
    
            if (inFav !== false) {
                
                addToFavButton.setAttribute('itemIndex', inFav);
                addToFavButton.onclick = function() { 
                    handler.fav.showRemoveFromFavDialog(this.getAttribute('itemIndex')); 
                    return false;
                };
                
                addToFavButton.innerText = KellyLoc.s('удалить из избранного', 'remove_from_fav_comment');
                
            } else {
                                
                addToFavButton.onclick =  function() {		
                    var comment = KellyTools.getParentByClass(this, 'comment', true);
                    
                    // console.log(comment);
                    if (!comment) return false;
                   
                    handler.fav.showAddToFavDialog(block, comment);
                    return false;					
                }
                
                addToFavButton.innerText = KellyLoc.s('в избранное', 'add_to_fav_comment');
            }
            
        }
        
        KellyTools.log('formatComments : ' + comments.length + ' - '+ block.id);
    }    
    
    this.formatPostContainer = function(postBlock) {
        
        var coptions = handler.fav.getGlobal('fav').coptions;
        var blackList = coptions.posts_blacklist;
        
        if (blackList) {  
            var userName = getPostUserName(postBlock);
            if (blackList.indexOf(userName) != -1) { 
                postBlock.style.display = 'none';            
                return false;
            }
        }
        
        var censored = postBlock.innerHTML.indexOf('/images/censorship') != -1 ? true : false;
        
        if (!updatePostFavButton(postBlock)) return false;    
        
        var toogleCommentsButton = postBlock.getElementsByClassName('toggleComments');

        if (toogleCommentsButton.length) {
            toogleCommentsButton = toogleCommentsButton[0];
            handler.fav.removeEventPListener(toogleCommentsButton, 'click', 'toogle_comments_' + postBlock.id);
            
            var onPostCommentsShowClick = function(postBlock, clearTimer) {
        
                if (clearTimer) {
                    commentsBlockTimer = false;
                    clearTimeout(commentsBlockTimer[postBlock.id]);
                }
                
                if (commentsBlockTimer[postBlock.id]) return false;
                
                var commentsBlock = postBlock.getElementsByClassName('comment_list_post'); // KellyTools.getElementByClass(postBlock, 'comment_list_post'); // check is block loaded  
                       
                if (!commentsBlock.length) { // todo exit after num iterations        
                    commentsBlockTimer[postBlock.id] = setTimeout(function() { onPostCommentsShowClick(postBlock, true); }, 100);
                    return false;
                }
                               
                handler.formatComments(postBlock);
                return false;
            }
                    
            handler.fav.addEventPListener(toogleCommentsButton, "click", function (e) {
                
                onPostCommentsShowClick(postBlock);                   
                return false;
                
            }, 'toogle_comments_' + postBlock.id);
        }
        
        handler.formatComments(postBlock);     
            
        var shareButtonsBlock = KellyTools.getElementByClass(postBlock, 'share_buttons');
        if (shareButtonsBlock) {
            
            var fastSave = KellyTools.getElementByClass(postBlock,  handler.className + '-fast-save');
            if (!censored && coptions.fastsave.enabled) {
                
                if (!fastSave) {
                    fastSave = document.createElement('DIV');                    
                    shareButtonsBlock.appendChild(fastSave); 
                        
                    var fastSaveBaseClass =  handler.hostClass + ' ' + handler.className + '-fast-save ' + handler.className + '-icon-diskete ';
                
                    fastSave.className = fastSaveBaseClass + handler.className + '-fast-save-unchecked';
                    fastSave.onclick = function() {
                        
                        if (this.className.indexOf('unavailable') != -1) return false;
                        
                        if (this.className.indexOf('loading') != -1) {
                            
                            handler.fav.getFastSave().downloadCancel();
                            fastSave.classList.remove(handler.className + '-fast-save-loading');                          
                            
                        } else {
                                    
                            var downloadEnabled = handler.fav.getFastSave().downloadPostData(postBlock, function(success) {
                                fastSave.classList.remove(handler.className + '-fast-save-loading');
                                fastSave.className = fastSaveBaseClass + handler.className + '-fast-save-' + (success ? '' : 'not') + 'downloaded';
                            });
                            
                            if (downloadEnabled) {
                                fastSave.classList.remove(handler.className + '-fast-save-unchecked');
                                fastSave.classList.add(handler.className + '-fast-save-loading');
                            }
                        }
                        
                        return false;
                    }  
                } 
                
            } else {
                if (fastSave) {
                    fastSave.parentNode.removeChild(fastSave);
                }
            }
            
            if (coptions.hideSoc) {
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
            
    this.isNSFW = function() {
        
        var sfw = KellyTools.getElementByClass(document, 'sswither');
        
        if (sfw && sfw.className.indexOf('active') != -1) return false;
        else return true;
    }
    
    this.getMainContainers = function() {
        
        if (!mainContainers) {
            mainContainers = {
                
                // public
                
                body : document.getElementById('container'), // place where to put all dynamic absolute position elements
                content : document.getElementById('contentinner'), // place where to put main extension container
                
                // private
                
                sideBlock : document.getElementById('sidebar'),
                menu : document.getElementById('submenu'),
                tagList : document.getElementById('tagList'), // or check pageInner
            };
        }
        
        return mainContainers;
    }
    
    // will be replaced by formatPosts
    
    this.getPosts = function(container) {
        if (!container) container = document;
        
        return container.getElementsByClassName(publicationClass);
    }
    
    /* not imp */
    
    this.getPostTags = function(publication, limitTags) {
        
        if (!limitTags) limitTags = false;
        
        var tags = [];
        var nativeTags = KellyTools.getElementByClass(publication, 'taglist');
        if (!nativeTags) return tags;
        
        var nativeTags = nativeTags.getElementsByTagName('A');
        if (!nativeTags || !nativeTags.length) return tags;
    
        for (var i = 0; i < nativeTags.length; i++) {
           var tagName = nativeTags[i].innerHTML.trim(); 
           if (!tagName) continue;
           
           tags[tags.length] = tagName;
           if (limitTags && tags.length >= limitTags) return tags;
        }
        
        return tags;
    }
    
    /* imp */
    // get canonical url link in format "//url"
    
    this.getPostLink = function(publication, el) {
        
        if (!el) el = getPostLinkEl(publication);
    
        if (el) {
            var link = el.href.match(/[A-Za-z.0-9]+\/post\/[0-9]+/g);
            return link ? '//' + link[0] : false;
        }
        
        return '';    
    }    
    
    /* imp */
    // get canonical comment url link in format "//url"
    
    this.getCommentLink = function(comment) {
        
        if (!comment) return '';
        
        var links = comment.getElementsByTagName('a');
        
        for (var b = 0; b < links.length; b++) {
            if (links[b].href.length > 10 && links[b].href.indexOf('#comment') != -1) {
                var link = links[b].href.match(/[A-Za-z.0-9]+\/post\/[0-9]+#comment[0-9]+/g);
                return link ? '//' + link[0] : false;
            }
        }
        
        return '';
    }
    
    /* not imp */
    
    this.updateSidebarPosition = function(lock) {
    
        if (!handler.fav) return false;
        
        var sideBarWrap = handler.fav.getView('sidebar');
        
        if (!sideBarWrap || sideBarWrap.className.indexOf('hidden') !== -1) return false;
    
        var sideBlock = handler.getMainContainers().sideBlock;        
        var sideBlockBounds = sideBlock.getBoundingClientRect();
        
        var scrollTop = KellyTools.getScrollTop();
        var scrollLeft = KellyTools.getScrollLeft();
        
        var top = 0;
        
        if (sideBlock) {
            top = sideBlockBounds.top + scrollTop;
        }
                    
        // screen.height / 2  - (sideBarWrap.getBoundingClientRect().height / 2) - 24
        
        if (!lock && sideBarPaddingTop + scrollTop > top) top = sideBarPaddingTop + scrollTop;
                
        sideBarWrap.style.top = top + 'px';
       
        var widthBase = 0;
        
        if (window.location.host.indexOf('old.') == -1) {
            widthBase = 24;
        }
        
        if (sideBlock) {
            sideBarWrap.style.right = 'auto';
            sideBarWrap.style.left = Math.round(sideBlockBounds.left + scrollLeft) + 'px';
            sideBarWrap.style.width = Math.round(sideBlockBounds.width + widthBase) + 'px';
        } else {
            sideBarWrap.right = '0px';
        }		
        
        var tagList = handler.getMainContainers().tagList;
        if (tagList) {
            
            var sideBarWrapBounds = sideBarWrap.getBoundingClientRect();
            var bottomLimit = tagList.getBoundingClientRect().top + scrollTop;
            
            if (sideBarWrapBounds.height + sideBarWrapBounds.top + scrollTop >= bottomLimit) {
                
                // console.log(sideBarWrapBounds.height + scrollTop)
                sideBarWrap.style.top = (bottomLimit - sideBarWrapBounds.height) + 'px';
            }
        }
        
        // tagList
    }
    
    /* imp */
    
    this.getAllMedia = function(publication) {
        
        var data = [];
        
        if (!publication) return data;
        
        var content = false;
        
        if (publication.className.indexOf('comment') != -1) {
            content = KellyTools.getElementByClass(publication, 'txt');
        } else {
            content = KellyTools.getElementByClass(publication, 'post_content');
        }
        
        if (!content) return data;
        
        var mainImage = getMainImage(publication, content);
        
        // censored posts not contain post container and
        // /images/censorship/ru.png
        
        var imagesEl = content.getElementsByClassName('image');
        
        for (var i = 0; i < imagesEl.length; i++) {
            
            var image = '';
            
            if (imagesEl[i].innerHTML.indexOf('gif_source') !== -1) {
                
                // extended gif info for fast get dimensions \ keep gif unloaded until thats needed
                var gifSrc = imagesEl[i].getElementsByTagName('a');  
                if (gifSrc && gifSrc.length) {
                    for (var b = 0; b < gifSrc.length; gifSrc++) {
                        if (gifSrc[b].className.indexOf('gif_source') != -1) {
                            image = handler.getImageDownloadLink(gifSrc[b].getAttribute("href"), false);
                            break;
                        }
                    }
                }
                
            } else {
            
                var imageEl = KellyTools.getElementByTag(imagesEl[i], 'img');
                if (imageEl) {
                    image = handler.getImageDownloadLink(imageEl.getAttribute("src"), false);
                }     
            }
            
            if (image) data.push(image);
            
            // todo test assoc main image with gifs
            
            if (data.length == 1 && image && mainImage && image.indexOf(handler.getImageDownloadLink(mainImage.url, false, true)) != -1) {
                handler.fav.setSelectionInfo('dimensions', mainImage);
            } else if (data.length == 1 && image && mainImage) {                
                KellyTools.log('Main image in schema org for publication is exist, but not mutched with detected first image in publication');    
                KellyTools.log(image);
                KellyTools.log(handler.getImageDownloadLink(mainImage.url, false));                           
            }
        }

        if (!data.length && mainImage) {
            
            mainImage.url = handler.getImageDownloadLink(mainImage.url, false);
            data.push(mainImage.url);
            
            handler.fav.setSelectionInfo('dimensions', mainImage);
        }
        
        return data; //  return decodeURIComponent(url);
    }
    
    /* imp */
    // route format
    // [image-server-subdomain].[domain].cc/pics/[comment|post]/full/[title]-[image-id].[extension]
    
    this.getImageDownloadLink = function(url, full, relative) {
        
             url = url.trim();
        if (!url || url.length < 10) return url;
        
        // for correct download process we must keep same domain for image
        // to avoid show copyright \ watermarks
    
        var imgServer = url.match(/img(\d+)/);
        if (imgServer &&  imgServer.length) {
            
            // encoded original file name, decoded untested but may be work
            var filename = KellyTools.getUrlFileName(url, false, true);
            if (!filename) return url;
            
            imgServer = imgServer[0];
            var type = url.indexOf('comment') == -1 ? 'post' : 'comment';
            url = window.location.protocol + '//' + imgServer + '.' + window.location.host + '/pics/' + type + '/' + (full ? 'full/' : '') + filename;
        }
        
        
        return url;
    }
    
    /* imp */
    // return same url if not supported
    
    this.getStaticImage = function(source) {

        if (source.indexOf('reactor') != -1) {
        
            if (source.indexOf('static') !== -1 || source.indexOf('.gif') == -1) return source;
            
            source = source.replace('pics/comment/', 'pics/comment/static/');
            source = source.replace('post/', 'post/static/');
            source = source.replace('.gif', '.jpeg');
        }
        
        return source;
    },
    
    /* not imp */
    // return false if not supported for page \ site
    
    this.getFavPageInfo = function() {
    
        var header = KellyTools.getElementByClass(document, 'mainheader');
        if (!header) {
            return false;
        }
        
        if (header.innerHTML.indexOf('Избранное') == -1) {
            return false;
        }
        
        var info = {
            pages : 1,
            items : 0,
            page : 1,
            header : header,
            url : false,
            userName : false,
        }
        
        var parts = window.location.href.split('/');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] == 'user' && i+1 <= parts.length-1) {
                info.userName = parts[i+1];
                break;
            }
        }
        
        if (!info.userName) return false;
        
        info.url = '';
        info.url += window.location.origin + favPageUrlTpl;
        info.url = info.url.replace('__USERNAME__', info.userName);
        
        var posts = document.getElementsByClassName('postContainer');
        if (posts) info.items = posts.length;
        
        //(window.location.href.substr(window.location.href.length - 8) == 'favourite')
        
        if (window.location.host.indexOf('old.') != -1) {
            var pagination = document.getElementById('Pagination');
        } else {
            var pagination = KellyTools.getElementByClass(document, 'pagination_expanded'); 
        }  
        
        if (pagination) {
            var current = pagination.getElementsByClassName('current');
            
            if (current) {
                for (var i = 0; i < current.length; i++) {
                    if (parseInt(current[i].innerHTML)) {
                        info.page = parseInt(current[i].innerHTML);
                        break;
                    }
                }
            }
            
            if (info.page > info.pages) info.pages = info.page;
            
            var pages = pagination.getElementsByTagName('A');
            for (var i = 0; i < pages.length; i++) {
            
                var pageNum = parseInt(pages[i].innerHTML);
                if (info.pages < pageNum) info.pages = pageNum;   
                
            }
            
            info.items += (info.pages - 1) * 10;
        }
        
        
        info.container = KellyTools.getElementByClass(document, handler.className + '-FavNativeInfo'); 
        if (!info.container) {
        
            info.container = document.createElement('div');
            info.container.className = handler.className + '-FavNativeInfo';
            
            info.header.parentNode.insertBefore(info.container, info.header.nextSibling);
        }
            
        return info;
    }
    
    /* imp */
     
    this.syncFav = function(publication, inFav) {        
        var item = publication.querySelector('.favorite_link');
        if (!item) return;
        
        
        if (inFav && item.className.indexOf(' favorite') == -1) {                
            KellyTools.dispatchEvent(item);
        } else if (!inFav && item.className.indexOf(' favorite') != -1) {                
            KellyTools.dispatchEvent(item);
        }
    }
    
    /* imp */
    
    this.setFav = function(fav) {
        handler.fav = fav;
    }
    
    /* not imp */
    
    this.getRecomendedDownloadSettings = function() {
        
        var browser = KellyTools.getBrowserName();
        
        if (browser == 'opera' || browser == 'chrome') {
            
            return { 
                transportMethod : KellyGrabber.TRANSPORT_BLOB, 
                requestMethod : KellyGrabber.REQUEST_XML 
            }
            
        } else {
            
            return { 
                transportMethod : KellyGrabber.TRANSPORT_BLOBBASE64, 
                requestMethod : KellyGrabber.REQUEST_IFRAME 
            }
            
        }
        
    }
    
}

kellyProfileJoyreactor.getInstance = function() {
    if (typeof kellyProfileJoyreactor.self == 'undefined') {
        kellyProfileJoyreactor.self = new kellyProfileJoyreactor();
    }
    
    return kellyProfileJoyreactor.self;
}


var K_DEFAULT_ENVIRONMENT = kellyProfileJoyreactor.getInstance();

// initialization


if (!K_FAV) var K_FAV = new KellyFavItems();

// keep empty space to prevent syntax errors if some symbols will added at end
// end of file 

/*
   @encoding       utf-8
   @name           KellyImgView
   @namespace      Kelly
   @description    image view widget
   @author         Rubchuk Vladimir <torrenttvi@gmail.com>
   @license        GPLv3
   @version        v 1.2.1 04.11.20
   
   ToDo : 
   
   data-ignore-click - ok
   include pixel ratio detection - https://stackoverflow.com/questions/1713771/how-to-detect-page-zoom-level-in-all-modern-browsers
   add user event onButtonsShow
   alternative load by xmlHTTPrequest - make posible progressbar on "onprogress" event https://stackoverflow.com/questions/76976/how-to-get-progress-from-xmlhttprequest

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
    var blockInit = false;
    
    var fadeTime = 500; // not synced with css
    var buttonsMargin = 6;
    var blockShown = false;
    
    var cursor = 0;
    
    // realise throw dragStart \ DragMove functions that related to image block
    
    var isMoved = false;
    
    var scale = 1;
    
    var move = {x : -1, y : -1, left : false, top : false}; // начальная точка клика dragStart, базовая позиция перемещаемого элемента
    var lastPos = false, prevPos = false;
    
    var buttons = {};
    
    var images = {}; // gallery_prefix - array of images ( string \ a \ img \ element with data-src attribute )
    var imagesData = {};
    
    var zoomByMouse = false;
    
    var userEvents = { 
        onBeforeImageLoad : false,     // onBeforeImageLoad(handler, galleryItemPointer, galleryData) calls before onShow and initialize open image process (to prevent native behavior, return true in userEvent method)        
        onBeforeImageShow : false,     // onBeforeImageShow(handler, image) calls before add loaded image to container изображение загружено но не показано, переменные окружения обновлены
        onImageLoadFail : false,       // onImageLoadFail(handler) calls if image is failed to load
        onClose : false,               // onShow(handler) calls after hide viewer block
        onShow : false,                // onShow(handler, show) calls before show \ hide viewer block
        onNextImage : false,           // onNextImage(handler, nextImage, next) calls before load next image
    };
 
    var moveable = true;
    var swipe = false;	
    var bodyLockCss = false;
    var removePrevViewData = true;      // remove previouse image imidiate - need if not use any animations for fade in \ fade out
    
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
    
    this.updateConfig = function(cfg) {
        
        if (cfg.className) {
            commClassName = cfg.className;
        }
        
        if (cfg.viewerBlock) {
            block = cfg.viewerBlock;
            blockInit = false;
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
        
        if (typeof cfg.zoomByMouse != 'undefined') {
            zoomByMouse = cfg.zoomByMouse ? true : false;
        }
        
        if (cfg.buttonsMargin) {
        
        }
        
        if (typeof cfg.removePrevViewData != 'undefined') {
            removePrevViewData = cfg.removePrevViewData ? true : false;
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
    };    
    
    function getBlock() {
        
        if (!blockInit) {
            
            if (typeof block == 'string') {
                var el = document.getElementById(block.trim());
                if (el) block = el;
            }
            
            if (block) {
                initBlockData(block);
                blockInit = true;
            }
        }
        
        
        return block ? block : false;
    }
    
    function applyGallery(newGallery) {
        
        if (!newGallery) return false;
        
        newGallery = newGallery.trim();
        if (!newGallery) return false;
        
        if (selectedGallery != newGallery) {
            
            selectedGallery = newGallery;
            
            if (getBlock()) {
                
                if (!images[selectedGallery] || images[selectedGallery].length <= 1) {
                    
                    if (buttons['prev']) addClass(buttons['prev'], 'btn-hidden');
                    if (buttons['next']) addClass(buttons['next'], 'btn-hidden');

                    addClass(getBlock(), 'single-img');
                    
                } else {
                    
                    if (buttons['prev']) removeClass(buttons['prev'], 'btn-hidden');
                    if (buttons['next']) removeClass(buttons['next'], 'btn-hidden');
                    
                    removeClass(getBlock(), 'single-img');
                }                
                
            }
        }
        
        return true;
    }
    
    function initBlockData(block) {
        
        var tmp;
        
            block.innerHTML = '';
        
            tmp = document.createElement('DIV');
            addClass(tmp, 'loader');
            
            block.appendChild(tmp);
            
            tmp = document.createElement('DIV');
            addClass(tmp, 'img');
        
            block.appendChild(tmp);
            
            tmp = document.createElement('DIV');
            addClass(tmp, 'btns');
            
            block.appendChild(tmp);
        
        return true;
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
        
        removeClass(body, 'margin'); removeClass(body, 'lock');
        
        if (show) return; 
        
        var diff = body.clientWidth ? screen.width - body.clientWidth : 0;
        if (!diff || diff <= 0) diff = 0;
                    
        if (bodyLockCss !== false) {
            bodyLockCss.innerHTML = '';
        } else {                
            bodyLockCss = document.createElement('style');
            bodyLockCss.type = 'text/css';
        }

        var head = document.head || document.getElementsByTagName('head')[0];            
            head.appendChild(bodyLockCss);
        
        css = '.' + commClassName + '-margin {';
        css += 'margin-right : ' + diff + 'px;';
        css += '}';
        
        if (bodyLockCss.styleSheet){
          bodyLockCss.styleSheet.cssText = css;
        } else {
          bodyLockCss.appendChild(document.createTextNode(css));
        }
        
        addClass(body, 'lock'); addClass(body, 'margin');
        return true;
    }
        
    this.getButton = function(index) {
    
        if (!index) return buttons;
    
        if (!buttons[index]) return false;
        
        return buttons[index];
    };
    
    this.getButtons = function() {
        return buttons;
    };
    
    this.getImages = function() {
        return images;
    };
    
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
            imagePointer : images[selectedGallery] && images[selectedGallery][cursor] ? images[selectedGallery][cursor] : false,
            imageData : imagesData[selectedGallery] ? imagesData[selectedGallery] : false,
        };
    };
    
    this.hideButtons = function(hide) {
        
        var btns = getEl('btns');
        if (btns) {                 
            hide ? addClass(btns, 'btns-hidden') : removeClass(btns, 'btns-hidden');
        }       
    };
    
    this.hideLoader = function(hide) {
                
        var loader = getEl('loader');        
        var imgContainer = getEl('img'); 
        
        if (loader) {
            if (hide) {
                addClass(loader, 'loader-hidden');
                removeClass(imgContainer, 'img-loading');
            } else {
                removeClass(loader, 'loader-hidden');
                addClass(imgContainer, 'img-loading');
            }
        }
    };
    
    this.addButton = function(innerHTML, index, eventOnClick, addition) {
        
        if (!getBlock()) {        
            console.log('cant create buttons, main block not ready');
            return false;
        }
        
        var w, h, additionStyle, className;
        
        var lazyAccept = false;
        var fixed = false;
        
        if (addition) {
            if (addition.w) w = parseInt(addition.w);
            if (addition.h) h = parseInt(addition.h);
            if (addition.additionStyle) additionStyle = addition.additionStyle;
            if (addition.className) className = addition.className;
            if (addition.lazyAccept) lazyAccept = true;
            if (addition.fixed) fixed = true;  
        }
        
        if (!additionStyle) additionStyle = '';
        if (!className) className = commClassName + '-btn ' + commClassName + '-btn-' + index ;
        
        if (w) additionStyle += 'width : ' + w + 'px;';
        if (h) additionStyle += 'height : ' + h + 'px;';
        
        
        var button = document.createElement('div');
        
            if (additionStyle) button.setAttribute('style', additionStyle);
            
            button.onclick = function(e) {
             
                if (lazyAccept && lazyHand.enabled) {                    
                    lazyHand.button = this; 
                    lazyHand.pos = getEventDot(e);
                }
                
                if (eventOnClick) {
                    
                    eventOnClick(e, button);
                }
            };
            
            button.className = className;
            
        if (fixed) button.setAttribute('data-fixed', 'true');
            
        addHtml(button, innerHTML);
        
        buttons[index] = button;
        getEl('btns').appendChild(buttons[index]);
        
        return button;        
    };
    
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
        
        handler.addButton(getSvgIcon('close'), 'close', function() { handler.cancelLoad(); });
        
        handler.addButton(getSvgIcon('left'), 'prev', function() { handler.nextImage(false); }, {lazyAccept : true});
        handler.addButton(getSvgIcon('right'), 'next', function() { handler.nextImage(true); }, {lazyAccept : true});
        
        return true;
    };

    this.updateButtonsPos = function(pos) {
        
        if (!image) return false;
        // console.log(window.getComputedStyle(image));
        
        if (!pos) {
            pos = {						
                left : parseInt(image.style.left),
                top : parseInt(image.style.top),
            };
        }
    
        var clientBounds = handler.getClientBounds();
        
        var item = 0;
        var horizontal = false;        
        
        var padding = 12;
        var left = pos.left + parseInt(image.style.width) + padding;
        var top = pos.top;
        
        for (var k in buttons) {
            
            if (containsClass(buttons[k], 'btn-hidden') || buttons[k].getAttribute('data-fixed')) continue;
            
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
    };
    
    function containsClass(el, name) {        
        if (el) {
            return el.classList.contains(commClassName + '-' + name);
        }
        
        return false;
    }
    
    function removeClass(el, name) {        
        if (el) {
            el.classList.remove(commClassName + '-' + name);
        }
    }
    
    function addClass(el, name) {
        if (el) {
            el.classList.add(commClassName + '-' + name);
        }
    }
    
    function imageClearLoadEvents() {
        if (image) {
            
            image.onload = function() {
                // empty
                
                return false;
            };
            
            image.onerror = function() {
                // empty
                
                return false;
            };
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
    
    function zoomByScroll(event) {
        
        if (!event || !event.target || !containsClass(event.target, 'img-self')) return;
        
        var delta = Math.sign(event.deltaY);
        handler.scale(delta < 0 ? true : false);
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
            };
            
            if (disable) {
            
                handler.addEventPListener(window, 'wheel', stop, '_scroll', { passive: false });
                handler.addEventPListener(window, 'mousewheel', stop, '_scroll', { passive: false });
                handler.addEventPListener(window, 'touchmove', stop, '_scroll', { passive: false });
            
            } else {
            
                handler.removeEventPListener(window, 'touchmove', '_scroll');            
                handler.removeEventPListener(window, 'mousewheel', '_scroll');
                handler.removeEventPListener(window, 'wheel', '_scroll');
            }
            
        };
        
        if (show) {
            
            if (zoomByMouse) {
                handler.addEventPListener(window, 'wheel', zoomByScroll, '_zoom_by_scroll');
            }
        
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
            removeClass(block, 'fade');
            
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
            };        
                 
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
                
                removeClass(block, 'active');
                removeClass(block, 'fade');              
                handler.removeEventPListener(window, "scroll", 'img_view_');
                blockShown = false;
                
            }, fadeTime);  
            
            
            addClass(block, 'fade');
            handler.removeEventPListener(window, "resize", 'image_update_');
            handler.removeEventPListener(document.body, "keyup", 'next_image_key');
            handler.removeEventPListener(window, "wheel", '_zoom_by_scroll');
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
        
        var oldImage = false;
        
        if (image && image.parentNode) {

            if (removePrevViewData) {
                image.parentNode.removeChild(image);
                image = false;           
            } else {
                oldImage = image;
            }            
            
        } 
        
        imageBounds = false;
            
        beasy = 'loadImage';
        scale = 1;
        // console.log('load image');        
        
        handler.hideButtons(true);
        handler.hideLoader(false);
        
        if (!blockShown) {
            showMainBlock(true);
            // lazyHand.ignore = true;
        }
        
        handler.updateBlockPosition();
        
        if (!galleryItemPointer && !galleryData) {
        
            galleryItemPointer = images[selectedGallery][cursor];
            
        } else if (galleryData) {
            
            if (galleryData.gallery) {
                applyGallery(galleryData.gallery);
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
        
        image = document.createElement("img");
        
        addClass(image, 'img-self');
        
        image.src = getImageUrlFromPointer(galleryItemPointer);  
        
        // image.onmouseenter = function() {
        //    this.setAttribute('data-image-selected', 'true');
        // }   
        
        // image.onmouseleave = function() {
        //    this.setAttribute('data-image-selected', 'false');
        // }
            
        if (isImgLoaded(image)) {
            handler.imageShow();
        } else {
            image.onload = function() { 
                
                if (oldImage) {
                    oldImage.parentNode.removeChild(oldImage);
                }
                
                handler.imageShow(); 
                
                return false; 
            };
            
            image.onerror = function() {
                                
                imageClearLoadEvents();
                
                if (userEvents.onImageLoadFail && userEvents.onImageLoadFail(handler)) {
                    return false;
                }
            }
        }
    };
    
    this.getClientBounds = function() {
    
        var elem = (document.compatMode === "CSS1Compat") ? 
            document.documentElement :
            document.body;

        return {
            screenHeight: elem.clientHeight,
            screenWidth: elem.clientWidth,
        };
    };
    
    this.getScale = function() {
        return scale;
    };
    
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
    };
    
    // get local coordinats event pos
    
    function getEventDot(e) {
        var e = e || window.event, touches = [], x = e.clientX, y = e.clientY;
       
        if (e.touches && e.touches.length > 0) {
            
            x = e.touches[0].clientX; y = e.touches[0].clientY;
            for (var i = 0; i < e.touches.length; i++) touches[i] = { x : e.touches[i].clientX, y : e.touches[i].clientY};     
        } 
        
        return {x: x, y: y, touches : touches};
    }
    
    // unused
    this.updateCursor = function(e) {
    
        console.log(getEventDot(e));
    };
    
    function calcDistance(pointA, pointB) {
        var a = pointA.x - pointB.x;
        var b = pointA.y - pointB.y;

        return Math.sqrt( a*a + b*b );
    }

    this.drag = function(e) {
               
        lastPos = getEventDot(e);
        if (lastPos.touches && lastPos.touches.length > 2) return;
        
        var zoom = false;
        
        if (lastPos.touches && lastPos.touches.length == 2){
            var distanceDiff = !prevPos ? 0 : Math.abs(calcDistance(prevPos[0], prevPos[1]) - calcDistance(lastPos.touches[0], lastPos.touches[1]));        
            if (prevPos && distanceDiff > 20)  { 
            
                zoom = calcDistance(prevPos[0], prevPos[1]) < calcDistance(lastPos.touches[0], lastPos.touches[1]) ? 'in' : 'out';
                prevPos = lastPos.touches; 
                
            } else if (!prevPos) prevPos = lastPos ? lastPos.touches : false;  
            if (!zoom) return;
        }
        
               
        if (zoom) {
        
            handler.scale(zoom == 'in' ? true : false);
            
        } else if (moveable || scale != 1) {
        
            var newPos = {left : move.left + lastPos.x - move.x, top : move.top + lastPos.y - move.y};
            
            image.style.left = newPos.left + 'px';
            image.style.top =  newPos.top + 'px';
            
        } else if (scale == 1 && swipe) { // lastPos && lastPos.touches.length == 1
        
            var newPos = {left : move.left + lastPos.x - move.x, top : move.top};
            image.style.left = newPos.left + 'px';
            
        } else return;
        
        handler.updateButtonsPos(newPos);
    };
    
    this.dragEnd = function(e) {
    
        if (!isMoved) return false;
        
        isMoved = false;        
        
        removeClass(getBlock(), 'is-moved');
        
        handler.removeEventPListener(document.body, "mousemove", 'image_drag_');
        handler.removeEventPListener(document.body, "mouseup", 'image_drag_');
        handler.removeEventPListener(document.body, "touchmove", 'image_drag_');
        handler.removeEventPListener(document.body, "touchend", 'image_drag_');
        
        if (e === false || !lastPos) return;
        
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
                
            } else handler.updateSize(false);            
        }     

        lastPos = false;
    };
    
    this.dragStart = function(e) {
        
        if (isMoved) return false;        
        if (beasy) return false;
        
        addClass(getBlock(), 'is-moved');
        
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
    };
    
    // calls after image fully loaded and ready to show
    
    this.imageShow = function() {
            
        imageClearLoadEvents();
                
        beasy = false;
        
        // todo add support addition dom elements (not just img) for image var
        
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
        };
        
        image.ontouchstart = function (e) {
            handler.dragStart(e);
            return false;
        };
        
        setTimeout(function() { 
            if (image) image.style.opacity = '1'; 
            handler.hideButtons(false);             
            handler.updateButtonsPos(false);
            
        }, 100);         
    };
    
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
    };
    
    // hide show image block and cancel load
    
    this.cancelLoad = function(stage) {

        if (stage == 2) {
            beasy = false; 
            
            this.dragEnd(false);
            
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
          
            imageClearLoadEvents();
            
            showMainBlock(false);
            
            imageBounds = false;
            beasy = 'close'; 
            
            handler.hideLoader(true);
            
            setTimeout(function() { handler.cancelLoad(2);}, fadeTime);  
        }
        
    };
    
    // update image gallery viewer block position 
    
    this.updateBlockPosition = function() {
        if (blockShown && window.getComputedStyle(block).position !== 'fixed') {
            block.style.top = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0) + 'px'; // getScrollTop
        }
    };

    
    // get image url from source string or element
    // if source is member of exist gallery - move cursor to source index and switch to source gallery
    
    function getImageUrlFromPointer(source) {
    
        var sourceImg = '';
        
        // change gallery by source - affects on next image functions and buttons
        
        if (typeof source !== 'string' && source.getAttribute('kellyGallery') && source.getAttribute('kellyGalleryIndex')) {
        
            applyGallery(source.getAttribute('kellyGallery'));
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
                    <title></title>\
                    <line x1="27.5" x2="145.5" y1="24.9" y2="131.9" stroke-linecap="round" stroke-width="19" stroke="' + color + '"/>\
                    <line x1="144" x2="28" y1="24.9" y2="131.9" stroke="' + color + '" stroke-linecap="round" stroke-width="19"/>\
                    </g>';
                    
        } else if (name == 'left' || name == 'right') {
        
            bounds = '120 120';
            icon = '<g stroke="' + color + '" fill="' + color + '" >\
                     <title></title>\
                     <path transform="rotate(' + (name == 'right' ? '90' : '-90') + ' 61.24249267578127,65.71360778808595) " \
                     d="m12.242498,108.588584l48.999996,-85.74996l48.999996,85.74996l-97.999992,0z" \
                     stroke-width="1.5"/>\
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
            if (removePrevViewData) image.style.opacity = '0';
            
            // todo make load at same time as previuse image fades
            
            setTimeout(function() {
                handler.nextImage(next, 2, false);
                return false;
            }, fadeTime);
            
        }
    };
        
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
    };
    
    this.addEventPListener = function(object, event, callback, prefix, options) {
        if (!object)
            return false;
        if (!prefix)
            prefix = '';

        events[prefix + event] = callback;

        if (!object.addEventListener) {
            object.attachEvent('on' + event, events[prefix + event]);
        } else {
            object.addEventListener(event, events[prefix + event], options);
        }

        return true;
    };

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
    };
    
    this.removeEvents = function(galleryName) {
        
        if (!images || !images[galleryName] || !images[galleryName].length) return false;
        
        for (var i = 0, l = images[galleryName].length; i < l; i++)  {
            var item = images[galleryName][i];
            if (typeof item == 'string') continue;
            
            handler.removeEventPListener(item, 'click', 'showGallery');
        }
    };
    
    constructor(cfg);
}
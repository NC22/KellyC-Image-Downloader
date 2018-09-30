/*
   @encoding utf-8
   @name           KellyImgView
   @namespace      Kelly
   @description    image view widget
   @author         Rubchuk Vladimir <torrenttvi@gmail.com>
   @license        GPLv3
   @version        v 1.0.6 22.09.18
   
   ToDo : 
   
   data-ignore-click - ok
   include pixel ratio detection - https://stackoverflow.com/questions/1713771/how-to-detect-page-zoom-level-in-all-modern-browsers
   add user event onButtonsShow
   
*/

function KellyImgView(cfg) {
    
    var handler = this;    
    var events = new Array();
    
    var beasy = false;
    
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
        onBeforeGalleryOpen : false, // 
        onBeforeShow : false, // изображение загружено но не показано, переменные окружения обновлены
        onClose : false, //
    }; 
 
    var moveable = true;
    var swipe = false;	
    var bodyLockCss = false;
    var lockMoveMethod = 'lockMove'; // hideScroll (position : fixed элементы все равно сдвигаются если привязаны к правой стороне) | lockMove (блокирует движение но скроллбар остается)
   
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
         
            if (cfg.userEvents.onBeforeGalleryOpen) {
                userEvents.onBeforeGalleryOpen = cfg.userEvents.onBeforeGalleryOpen;
            }
            
            if (cfg.userEvents.onBeforeShow) {
                userEvents.onBeforeShow = cfg.userEvents.onBeforeShow;
            }
            
            if (cfg.userEvents.onClose) {
                userEvents.onClose = cfg.userEvents.onClose;
            }
        }
        
        if (cfg.buttonsMargin) {
        
        }
        
        if (typeof cfg.moveable != 'undefined') {
            moveable = cfg.moveable;
        }
        
        if (typeof cfg.swipe != 'undefined') {
            swipe = cfg.swipe;
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
        
        handler.updateButtonsPos();
    }
    
    this.hideLoader = function(hide) {
                
        var loader = getEl('loader');
        if (loader) {
            if (hide) addClass(loader, 'loader-hidden');
            else deleteClass(loader, 'loader-hidden');
        }
    }
    
    this.addButton = function(innerHTML, index, onclick, addition) {
        
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
            button.onclick = onclick;
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
        
        var left = pos.left + parseInt(image.style.width) + 12;
        var top = pos.top;
        
        for (var k in buttons) {
            
            if (buttons[k].className.indexOf('hidden') != -1) continue;
            
            item++;                
            var buttonBounds = buttons[k].getBoundingClientRect();
            
            if (item == 1) {
                // console.log(top - buttonBounds.height)
                if (left + buttonBounds.width > clientBounds.screenWidth - 12) {
                    horizontal = true;
                    left = pos.left;
                    top -= buttonBounds.height +  12;                    
                }

                if (horizontal && top - buttonBounds.height <= 0) {
                    top = pos.top;
                }
                
                if (!horizontal && top <= 0) {
                    top = 0;
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
    
    function showMainBlock(show) {
           
        if (show && blockShown) return;
        
        // will be extended if something from this events will be used for some thing else
        
        var disableMoveContainer = function(disable) {
        
            var stop = function(e) {
                event.preventDefault();
            }
            
            if (disable) {
            
                handler.addEventListner(window, 'wheel', stop, '_scroll');
                handler.addEventListner(window, 'mousewheel', stop, '_scroll');
                handler.addEventListner(window, 'touchmove', stop, '_scroll');
            
            } else {
            
                handler.removeEventListener(window, 'touchmove', '_scroll');            
                handler.removeEventListener(window, 'mousewheel', '_scroll');
                handler.removeEventListener(window, 'wheel', '_scroll');
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
            
                if (e.target != this) return false;
                handler.cancelLoad(); return false; 
            }        
                 
            handler.addEventListner(window, "scroll", function (e) {
                handler.updateBlockPosition();
            }, 'img_view_');
            
            handler.addEventListner(window, "resize", function (e) {

                    handler.updateSize(e);
                    return false;
            }, 'image_update_');

           // env.addEventListner(block, "mousemove", function (e) {
           //     handler.updateCursor();
           // }, 'image_mouse_move_');            

            handler.addEventListner(document.body, "keyup", function (e) {
            
                var c = e.keyCode - 36;
               
                var right = c == 3 || c == 32 || c == 68 || c == 102;
                var left = c == 1 || c == 29 || c == 65 || c == 100;
               
                if (right || left) {
                    
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
                handler.removeEventListener(window, "scroll", 'img_view_');
                blockShown = false;
                
            }, fadeTime);  
            
            
            addClass(block, 'fade');
            handler.removeEventListener(window, "resize", 'image_update_');
            handler.removeEventListener(document.body, "keyup", 'next_image_key');
        }     
    }
    
    // initialize image viewer from gallery pointer with start cursor \ gallery and image src, or go to nextimage in selected gallery
    
    // galleryItemPointer - dom element with kellyGallery and kellyGalleryIndex attributes, if false, go to next \ prev in current gallery
    // initial image must be setted in href \ src \ or in data-image attribute, else - set kellyGalleryIndex to -1 to start from begining of gallery array
    // next - bool  (true \ false, if false go to previuse) 
    
    // for navigation use nextImage method instead if gallery already opened
    
    this.loadImage = function(galleryItemPointer, galleryData) {
        
        if (beasy) return false;
        
        beasy = true;
        scale = 1;
        // console.log('load image');
        
        if (userEvents.onBeforeGalleryOpen) {
            userEvents.onBeforeGalleryOpen(handler, galleryItemPointer, galleryData);
        }
        
        if (!blockShown) showMainBlock(true);
        
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
        else image.onload = function() { handler.imageShow(); return false; }	
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
        handler.removeEventListener(document.body, "mousemove", 'image_drag_');
        handler.removeEventListener(document.body, "mouseup", 'image_drag_');
        handler.removeEventListener(document.body, "touchmove", 'image_drag_');
        handler.removeEventListener(document.body, "touchend", 'image_drag_');
        
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
        handler.addEventListner(document.body, "mousemove", function (e) {
            handler.drag(e);
        }, 'image_drag_');
        handler.addEventListner(document.body, "mouseup", function (e) {
            handler.dragEnd(e);
        }, 'image_drag_');
        handler.addEventListner(document.body, "mouseout", function (e) {
            handler.dragEnd(e);
        }, 'image_drag_');
        handler.addEventListner(document.body, "touchend", function (e) {
            handler.dragEnd(e);
        }, 'image_drag_');
        handler.addEventListner(document.body, "touchmove", function (e) {
            handler.drag(e);
        }, 'image_drag_');
    }
    
    this.imageShow = function() {
    
        beasy = false;
        
        var imgContainer = getEl('img'); 

        handler.hideLoader(true);
        handler.updateSize(false);
        
        if (userEvents.onBeforeShow) {
            userEvents.onBeforeShow(handler, image);
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
        
        handler.hideLoader(true);
        setTimeout(function() { image.style.opacity = '1'; handler.hideButtons(false); }, 100);  
        
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
            beasy = true; 
            
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
            if (image.parentNode) image.parentNode.removeChild(image);
            image = false;            
            imageBounds = false;
            
            handler.loadImage(false, {cursor : next ? 'next' : 'prev'});
            
        } else { // select image and fade
        
            if (beasy) return false;
            if (!image) return false;
            if (!getNextImage(next)) return false;
            
            handler.hideLoader(false);
            handler.hideButtons(true);
            
            beasy = true;
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
                images[galleryName][i].onclick = function(e) {
                                    
                    if (this.getAttribute('data-ignore-click') == 'child' && e.target !== this) return true; // pass throw child events if they exist
                
                    handler.loadImage(this);
                    return false;
                    
                }
            }	
        }
        
        return true;    
    }
    
    this.addEventListner = function(object, event, callback, prefix) {
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
    
    constructor(cfg);
}
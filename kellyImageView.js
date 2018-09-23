function KellyImgView(cfg) {
    
    var handler = this;    
    var events = new Array();
    
    var beasy = false;
    
    var image = false; // current loaded image, false if not show (getCurrentImage().image)
    var imageBounds = false; 
    var selectedSource = false; // opened source
    var selectedGallery = 'default'; // inherit by opened source
   
    var idGroup = 'kellyImgView'; // DOM viewer class base name
   
    var block = false;
    var fadeTime = 500; // not synced with css
    var buttonsMargin = 6;
    
    var cursor = 0;
    
    // todo touch move by x, go to previuse \ next by swipe
    // realise throw dragStart \ DragMove functions that related to image block
    
    var drag = false;
    
    var scale = 1;
    
    var move = {x : -1, y : -1, left : false, top : false}; // начальная точка клика dragStart, базовая позиция перемещаемого элемента
    var lastPos = false;
    
    var buttons = {};
    
    var images = []; // gallery_prefix - array of images ( string \ a \ img \ element with data-src attribute )
    var userEvents = { onBeforeGalleryOpen : false, onBeforeShow : false }; 
 
    var moveable = true;
    var swipe = false;
 
    // userEvents.onBeforeShow(handler, image);
    // todo onImageShow(handler, image);
    // todo при переинициализации базовых кнопок добавить возможность их отключать и выводить только конкретные
    // метод для удаления кнопок
    
    function constructor(cfg) {
        handler.updateConfig(cfg);
    }
    
    this.updateConfig = function(cfg) {
        if (cfg.idGroup) idGroup = cfg.idGroup;
        if (cfg.userEvents) {
         
            if (cfg.userEvents.onBeforeGalleryOpen) {
                userEvents.onBeforeGalleryOpen = cfg.userEvents.onBeforeGalleryOpen;
            }
            
            if (cfg.userEvents.onBeforeShow) {
                userEvents.onBeforeShow = cfg.userEvents.onBeforeShow;
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
    
    this.getButton = function(index) {
    
        if (!index) return buttons;
    
        if (!buttons[index]) return false;
        
        return buttons[index];
    }
    
    this.getButtons = function() {
        return buttons;
    }
        
    this.getCurrentImage = function() {
        return { image : image, source : selectedSource, gallery : selectedGallery, index : cursor};
    }
    
    this.hideButtons = function(hide) {
        for (var k in buttons){
            if (typeof buttons[k] !== 'function') {
            
                //if ((k == 'next' || k == 'prev') && images.length < 2 ) {
                //    buttons[k].style.opacity = '0';
                //    continue;
                //} 
            
                if (hide) buttons[k].style.opacity = '0';
                else buttons[k].style.opacity = '1';
            }
        }
    }
    
    this.hideLoader = function(hide) {
                
        var loader = document.getElementById(idGroup + '-loader');
        if (loader) {
            if (hide) loader.style.display = 'none'; 
            else loader.style.display = 'block';   
        }
    }
    
    this.addButton = function(innerHTML, index, onclick, addition) {
        block = document.getElementById(idGroup);
        if (!block) {        
            console.log('cant create buttons, main block not ready');
            return false;
        }
        
        var w,h,additionStyle,className;
        
        if (addition) {
            if (addition.w) w = parseInt(addition.w);
            if (addition.h) h = parseInt(addition.h);
            if (addition.additionStyle) additionStyle = addition.additionStyle;
            if (addition.className) className = addition.className;
        }
        
        if (!w) w = 32;
        if (!h) h = 32;
        if (!additionStyle) additionStyle = 'text-align : center; line-height : 32px; cursor : pointer; background : rgba(204,204,204,0.5); color : #000;';
        if (!className) className = idGroup + '-btn';
        
        w = 'width : ' + w + 'px;';
        h = 'height : ' + h + 'px;';
        
        var button = document.createElement('div');
            button.setAttribute('style', 'position : absolute; display : block; opacity : 0;' + w + h + additionStyle);
            button.onclick = onclick;
            button.className = className;
            button.innerHTML = innerHTML;
            
        buttons[index] = button;
        block.appendChild(buttons[index]);
        
        return button;        
    }
    
    this.addBaseButtons = function(){
        if (buttons['close']) return true;
        
        handler.addButton('&#10006;', 'close', function() { handler.cancelLoad(); });
        handler.addButton('&lt;', 'prev', function() { handler.nextImage(false); });
        handler.addButton('&gt;', 'next', function() { handler.nextImage(true); });
        
        return true;
    }

    this.onUpdateImagePos = function(pos) {
    
        if (!image) return false;
        
        var clientBounds = handler.getClientBounds();
        
        var item = 0;
        var horizontal = false;
        
        var left = pos.left + imageBounds.resizedWidth + 12;
        var top = pos.top;
        
        for (var k in buttons){
            if (typeof buttons[k] !== 'function') {
            
                item++;                
                var buttonBounds = buttons[k].getBoundingClientRect();
                
                if (item == 1) {
                    // console.log(top - buttonBounds.height)
                    if (left + buttonBounds.width > clientBounds.width - 12) {
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
    }
    
    function showMainBlock(show) {
           
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
        
            disableMoveContainer(true);
            
            block = document.getElementById(idGroup);        
            block.style.opacity = '1';
            block.style.visibility = 'visible';        
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
                // todo check when event occurse
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
            
                disableMoveContainer(false);      

                block.style.visibility = 'hidden';                 
                handler.removeEventListener(window, "scroll", 'img_view_');
            
            }, fadeTime);  
            
            
            handler.removeEventListener(window, "resize", 'image_update_');
            handler.removeEventListener(document.body, "keyup", 'next_image_key');
            block.style.opacity = '0';
        }     
    }
    
    // initialize image viewer from source with start cursor \ gallery and image src, or go to nextimage in selected gallery
    
    // source - dom element with kellyGallery and kellyGalleryIndex attributes (todo source as array?), if false, go to next \ prev in current gallery
	// initial image must be setted in href \ src \ or in data-image attribute, else - set kellyGalleryIndex to -1 to start from begining of gallery array
    // next - bool  (true \ false, if false go to previuse) 
    
    // use nextImage method instead
    
    this.loadImage = function(source, next) {
        
        if (beasy) return false;
        
        beasy = true;
        scale = 1;
        console.log('load image');
        
        if (source) {
        
            selectedSource = source;
            
            showMainBlock(true);
           
            // change gallery by source - affects on next image functions and buttons
            
            if (source.getAttribute('kellyGallery')) {
                selectedGallery = source.getAttribute('kellyGallery');
            } 
            
            if (source.getAttribute('kellyGalleryIndex')) {
                cursor = parseInt(source.getAttribute('kellyGalleryIndex'));
            }
            
        } else {
            source = getNextImage(next, true);
        }
                
        handler.hideButtons(true);
        handler.hideLoader(false);
        handler.updateBlockPosition();    
        
  		image = document.createElement("img");
        image.src = getImageLink(source);  
        
        if (isImgLoaded(image)) handler.imageShow();
        else image.onload = function() { handler.imageShow(); return false; }
    }
    
    this.getClientBounds = function() {
    
        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            x = w.innerWidth || e.clientWidth || g.clientWidth,
            y = w.innerHeight|| e.clientHeight|| g.clientHeight;
        
            return {width : x, height : y};
    }
    
    this.getScale = function() { return scale; }
    
    this.scale = function(plus) {
        if (plus) scale++;
        else scale--;
        
        if (scale < 1) scale = 1;
        
        var rHeight = imageBounds.resizedHeight; // resized variables
        var rWidth = imageBounds.resizedWidth;
        
        var newHeight = rHeight + (100 * (scale - 1));
                
        var k = newHeight / rHeight;
        
        rHeight = k * rHeight;
        rWidth = k * rWidth;
        
        var pos = {left : parseInt(image.style.left), top : parseInt(image.style.top)};
        var posCenter = {left : pos.left + parseInt(image.style.width) / 2, top : pos.top + parseInt(image.style.height) / 2};
        
        image.style.width = rWidth + 'px';
        image.style.height = rHeight + 'px';
        
        image.style.left = Math.floor(posCenter.left - (rWidth / 2)) + 'px';
        image.style.top = Math.floor(posCenter.top - (rHeight / 2)) + 'px';
        
    }
       
    function getEventDot(e) {
        e = e || window.event;
        var x, y;
        var scrollX = document.body.scrollLeft + document.documentElement.scrollLeft;
        var scrollY = document.body.scrollTop + document.documentElement.scrollTop;

        if (e.touches) {
            x = e.touches[0].clientX + scrollX;
            y = e.touches[0].clientY + scrollY;
        } else {
            // e.pageX e.pageY e.x e.y bad for cross-browser
            x = e.clientX + scrollX;
            y = e.clientY + scrollY;
        }

        //var rect = canvas.getBoundingClientRect();
        x -= /*rect.left+*/ scrollX;
        y -= /*rect.top +*/ scrollY;

        return {x: x, y: y};
    }
    
    this.updateCursor = function(e) {
    
        console.log(getEventDot(e));
    }

    this.drag = function(e) {
        lastPos = getEventDot(e);
            
        if (moveable) {
        
            var newPos = {left : move.left + lastPos.x - move.x, top : move.top + lastPos.y - move.y}
            
            image.style.left = newPos.left + 'px';
            image.style.top =  newPos.top + 'px';
            
        } else if (swipe) {
        
            var newPos = {left : move.left + lastPos.x - move.x, top : move.top}
            image.style.left = newPos.left + 'px';
            
        } else return;
        
        handler.onUpdateImagePos(newPos);
    }
    
    this.dragEnd = function(e) {
    
        drag = false;
        handler.removeEventListener(document.body, "mousemove", 'image_drag_');
        handler.removeEventListener(document.body, "mouseup", 'image_drag_');
        handler.removeEventListener(document.body, "touchmove", 'image_drag_');
        handler.removeEventListener(document.body, "touchend", 'image_drag_');
        
        if (swipe && lastPos) {
            
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
                var newPos = {left : move.left, top : move.top}
            
                image.style.left = newPos.left + 'px';                
                handler.onUpdateImagePos(newPos);
            }
            
        }     

        lastPos = false;
    }
    
    this.dragStart = function(e) {
        
        if (drag) return false;
        
        if (beasy) return false;
        
        move = getEventDot(e);
        move.left = parseInt(image.style.left);
        move.top = parseInt(image.style.top);
        
        // console.log(move); // 884 - 554
        // move.x = parseInt(image.style.left)
        
        drag = true; 
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
        var imgContainer = document.getElementById(idGroup + '-img');
            
        var loader = document.getElementById(idGroup + 'loader');
        
        if (loader)
            loader.style.display = 'none';
      
       
        
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
        
        var maxWidth = bounds.width - padding; 
        var maxHeight = bounds.height - padding; 
        
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
        
        var newPos = {left : Math.round((bounds.width - imageBounds.resizedWidth) / 2), top : Math.round((bounds.height - imageBounds.resizedHeight) / 2 )};
        
        // todo check this values after scale
        
        image.style.width = imageBounds.resizedWidth + 'px';
        image.style.height = imageBounds.resizedHeight + 'px';
        image.style.left =  newPos.left + 'px';
        image.style.top = newPos.top + 'px';
        
        handler.onUpdateImagePos(newPos);
        return true;
    }
    
    // hide show image block and cancel load
    
    this.cancelLoad = function(stage) {
            
        if (stage == 2) {
            beasy = false; 
            drag = false;
            
            if (image) {
                image.src = '';
                image = false;  
                
                if (image.parentNode) image.parentNode.removeChild(image);
            }
           
            var imgContainer = document.getElementById(idGroup+ '-img'); 
                imgContainer.innerHTML = '';
                
            return;
            
        } else {
          
            if (image) {
                image.onload = function() { return false; };                
            }
            
            showMainBlock(false);
            
            imageBounds = false;
            beasy = true; 
                   
            var loader = document.getElementById(idGroup + '-loader');
            if (loader)
                loader.style.display = 'none';
            
            setTimeout(function() { handler.cancelLoad(2);}, fadeTime);  
        }
        
    }
    
    // update image gallery viewer block position 
    
    this.updateBlockPosition = function() {
         if (window.getComputedStyle(block).position !== 'fixed') {
            block.style.top = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0) + 'px'; // getScrollTop
         }
    }

    
    // get next image from current gallery (next - false - get previuse)
    function getImageLink(source) {
        var sourceImg = '';
        
        if (typeof source === 'string') {
            return validateUrl(source);
        } else {        
                 if (source.tagName == 'A') sourceImg = source.href;
            else if (source.tagName == 'IMG') sourceImg = source.src;
            else sourceImg = source.getAttribute('data-image');
        }
        
        if (!sourceImg) {
            console.log('image not found for element');
            console.log(source);
        }
        
        return validateUrl(sourceImg);
    }
    
    function validateUrl(source) {
        if (!source) return '';
        return source.trim();
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
            
            handler.loadImage(false, next);
            
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
    // input - array of elements or className or array of src strings
    // data-ignore-click = child for prevent loadImage when click on child nodes
    // galleryName - key for gallery that store this elements, detecting of next element based on this key
    
    this.acceptEvents = function(input, galleryName) {
        
        if (!galleryName) galleryName = 'default';
    
        if (typeof input === 'string') {
            var className = input;
            images[galleryName] = document.getElementsByClassName(className);
        } else if (input.length) {
          
            images[galleryName] = input;
        } else return false;
        
        if (images[galleryName].length && typeof images[galleryName][0] === 'string') {
        
        } else {
        
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
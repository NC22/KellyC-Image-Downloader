 function KellyNradiowaveBg(cfg) {
           
        var bgItem = false; // current loaded item
        var character = false;
        var characterGhost = false;
        var order = false;
        
        var updateTimer = false;
        
        var loader = {image : document.createElement('IMG'), imageGhost : document.createElement('IMG')}; 
        
        var bgItems = [
            {src : 'light1.png', xAnim : {offset : 0, time : 40}, yAnim : {offsetX : 'center', time : 40}},
            {src : 'light2.png', xAnim : {offset : 0, time : 40}, yAnim : {offsetX : 'center', time : 40}},
          
            {src : 'bg5.png', xAnim : {offset : 0, time : 40}, yAnim : {offsetX : 'center', time : 40}},
            {src : 'bg2.png', xAnim : {offset : 0, time : 40}, yAnim : {offsetX : 'center', time : 40}},
        ];
        
        function shuffleArray(array) {
          var currentIndex = array.length,  randomIndex;

          while (currentIndex != 0) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [
              array[randomIndex], array[currentIndex]];
          }

          return array;
        }
        
        function getNextRandItem() {
        
            if (!order) {
            
                order = localStorage.getItem('kelly-bg-order');
                cursor = parseInt(localStorage.getItem('kelly-bg-cursor'));
                
                if (isNaN(cursor)) cursor = 0;
                
                if (order) order = order.split(',');
                if (!order || order.length != bgItems.length) order = false;
                
                if (!order) {
                    
                    order = [];
                    for (var i = 0; i < bgItems.length; i++) order.push(i);
                    
                    // order = shuffleArray(order);
                   
                }
            
            } else {
            
                cursor++;
                if (cursor > order.length-1) cursor = 0;
            }
            
            if (typeof bgItems[cursor] == 'undefined') {
                console.log('item ' + cursor + ' was removed - reset order');
                cursor = 0;
            }
            
            localStorage.setItem('kelly-bg-order', order.join(','));
            localStorage.setItem('kelly-bg-cursor', cursor);

            
            return order[cursor];
        }
        
       var handler = this;
        
       var addCss = function(id, css, clean) {
              
            var style = document.getElementById(id), head = document.head || document.getElementsByTagName('head')[0];
            if (!style) {
            
                style = document.createElement('style');
                style.type = 'text/css';
                style.id = id;       
                head.appendChild(style);
                
            }    
            
            if (style.styleSheet){
            
                if (clean) style.styleSheet.cssText = '';
                style.styleSheet.cssText += css;
                
            } else {
            
                if (clean) style.innerHTML = '';
                style.appendChild(document.createTextNode(css));
            }
            
        }
        
        var getRand = function(min, max) {
        
              min = Math.ceil(min);
              max = Math.floor(max);
              
              return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        var getViewport = function() {

            var elem = (document.compatMode === "CSS1Compat") ? document.documentElement : document.body;    
            return { screenHeight: elem.clientHeight, screenWidth: elem.clientWidth};
        }
        
        var getBgImageSize = function(imageBounds) {
            
            var bgSize = {}, viewport = getViewport();
            if (viewport.screenHeight >  viewport.screenWidth) { // resize image by screen height
                    
                    // viewport.screenWidth += bgItem.xAnim.maxMove;
                    
                    var imageRatio = viewport.screenHeight / imageBounds.h;
                    
                    bgSize.w = imageRatio * imageBounds.w;
                    bgSize.h = viewport.screenHeight;
                    
                    if (bgSize.w < viewport.screenWidth) {
                    
                        imageRatio = viewport.screenWidth / imageBounds.w;
                        
                        bgSize.w = viewport.screenWidth;
                        bgSize.h = imageRatio * imageBounds.h;
                        
                    }
                    
                } else { // by screen width
                    
                    // viewport.screenHeight += bgItem.yAnim.maxMove;
                  
                    var imageRatio = viewport.screenWidth / imageBounds.w;
                    
                    bgSize.w = viewport.screenWidth;
                    bgSize.h = imageRatio * imageBounds.h;
                    
                    if (bgSize.h < viewport.screenHeight) {
                    
                        imageRatio = viewport.screenHeight / imageBounds.h;
                        
                        bgSize.w = imageRatio * imageBounds.w;
                        bgSize.h = viewport.screenHeight;
                    }
                    
                }
                
                return bgSize;
        }
        
        this.resetLoad = function() {
            
            loader.inUse = false;
            
            loader.imageGhost.src = '';
            loader.imageGhost.onload = function() {};
            loader.imageGhost.onerror = function() {};
            
            loader.image.src = '';
            loader.image.onload = function() {};
            loader.image.onerror = function() {};
        }
           
        this.loadBgItem = function(itemN) {
            
            if (typeof itemN == 'number') bgItem = bgItems[itemN];
            
            if (!bgItem || itemN == 'random') {
                itemN = getNextRandItem();
                bgItem = bgItems[itemN];
            } 
            
            handler.resetLoad();
            loader.inUse = true;
                  
            //character.classList.remove('fade-in');
                
            loader.imageGhost.src = 'https://nradiowave.ru//style/Default/img/nradiowave/bg/o_' + bgItem.src;
            loader.imageGhost.onload = function() {
                
                var imageBounds  = {w : this.naturalWidth, h : this.naturalHeight};
                var bgSize = getBgImageSize(imageBounds);
                
                characterGhost.style.backgroundImage = 'url(' + this.src + ')';
                characterGhost.style.backgroundSize = bgSize.w + 'px ' + bgSize.h + 'px';
                
                characterGhost.classList.add('fade-in');
                
                
                loader.image.src = 'https://nradiowave.ru/style/Default/img/nradiowave/bg/' + bgItem.src;            
                loader.image.onload = function() {
                    
                    var imageBounds  = {w : this.naturalWidth, h : this.naturalHeight};
                    var viewport = getViewport(), bgSize = getBgImageSize(imageBounds), workAnim = 'xAnim';

                    
                    if (viewport.screenHeight >  viewport.screenWidth) { // resize image by screen height
                                            
                        if (!bgItem.xAnim.offset) bgItem.xAnim.offset = 0;
                        if (!bgItem.xAnim.maxMove) bgItem.xAnim.maxMove = bgSize.w - viewport.screenWidth - bgItem.xAnim.offset;
                        
                        character.style.animation = 'bg-move-x-'+ itemN +' ' + bgItem.xAnim.time + 's ease-in-out infinite';
                        
                        if (bgItem.xAnim.offsetY) {
                            character.style.backgroundPositionY = bgItem.xAnim.offsetY == 'center' ? 'center' : '-' + bgItem.xAnim.offsetY + 'px';
                        }
                        
                    } else { // by screen width
                        
                        workAnim = 'yAnim';
                        if (!bgItem.yAnim.offset) bgItem.yAnim.offset = 0;
                        if (!bgItem.yAnim.maxMove) bgItem.yAnim.maxMove = bgSize.h - viewport.screenHeight - bgItem.yAnim.offset;
                        
                        character.style.animation = 'bg-move-'+ itemN +' ' + bgItem.yAnim.time + 's ease-in-out infinite';
                        
                        if (bgItem.yAnim.offsetX) {
                            character.style.backgroundPositionX = bgItem.yAnim.offsetX == 'center' ? 'center' : '-' + bgItem.yAnim.offsetX + 'px';
                        }
                    }
                                    
                    if (!bgItem[workAnim].time) {
                        bgItem[workAnim].time = 0.2 * bgItem[workAnim].maxMove * 0.58; // 58px per 20s 
                    }
                    
                    handler.loadBgItemDelay('random', bgItem[workAnim].time * 0.5 * 1000);// bgItem[workAnim].time * 1.5 * 1000);

                        
                        var css =  '\
                            @keyframes bg-move-'+ itemN +' {\
                              0%, 100% {\
                                background-position-y: -' + (bgItem.yAnim.revers ? bgItem.yAnim.maxMove : bgItem.yAnim.offset) + 'px;\
                              }\
                              50% {\
                                background-position-y: -' + (bgItem.yAnim.revers ? bgItem.yAnim.offset : bgItem.yAnim.maxMove) + 'px;\
                              }\
                            }\
                            \
                            @keyframes bg-move-x-'+ itemN +' {\
                              0%, 100% {\
                                background-position-x: -' + bgItem.xAnim.offset + ';\
                              }\
                              50% {\
                                background-position-x: -' + bgItem.xAnim.maxMove + 'px;\
                              }\
                            }\
                         ';
                        
                        addCss('random-character-anims', css, true);
                        
                        character.style.backgroundImage = 'url(' + this.src + ')';
                        character.style.backgroundSize = bgSize.w + 'px ' + bgSize.h + 'px';
                        
                        character.classList.add('fade-in');
                        setTimeout(function() {characterGhost.classList.remove('fade-in');}, 900);
                        handler.resetLoad();
                    
                    }
            }        
        
            
        }
        
        this.loadBgItemDelay = function(itemN, delay) {
            if (updateTimer !== false) clearTimeout(updateTimer);
            
            updateTimer = setTimeout(function() { 
                
                updateTimer = false;
                character.classList.remove('fade-in');
                setTimeout(function() { handler.loadBgItem(itemN); }, 1000);
                
            }, delay);
        }
        
        this.init = function() {
        
            character = document.getElementsByClassName('random-character-main')[0]; 
            characterGhost = document.getElementsByClassName('random-character-ghost')[0];
              
            handler.loadBgItem('random');
            
            window.addEventListener('resize', function() {
                character.classList.remove('fade-in');
                character.style.backgroundSize = 'cover';
                character.style.backgroundPositionX = '0px';
                character.style.backgroundPositionY = '0px';
                character.style.animation = '';
                
                handler.loadBgItemDelay('current', 100);
            });
        }
    }

/*
   @encoding utf-8
   @name           KellyTooltip
   @namespace      Kelly
   @description    creates tooltip elements (attaches to an element or screen) widget
   @author         Rubchuk Vladimir <torrenttvi@gmail.com>
   @license        GPLv3
   @version        v 1.0.5 23.12.21
   
   ToDo : 
   
   todo docs and examples
   todo avoidOutOfBounds - configurable sides
   todo add optional dragable div element (onDragStart \ onDragEnd \ draggable)
   
   При удалении target'a возможно некорректное отображение (innerHTML = '') Добавить опцию для автоскрытия при некорректных данных о позиции элемента?
   
*/

function KellyTooltip(cfg) {
    
    var handler = this;
    
    this.message = '';
    this.target = false; // target or 'screen'
    this.hideWidth = false;
    this.minWidth = false;
    
    var closeByBodyPrevent = false; // skip onclick event after show (maybe disable body event complitely when show - false)
    this.closeByBody = false;
    
    this.self = false;
    this.classGroup = 'tooltipster'; // prefix for all classes in tooltip container
    this.selfClass = '';
    
    this.positionY = 'top';	
    this.positionX = 'center';
    this.ptypeX = '';
    this.ptypeY = 'outside';
    
    this.offset = {left : 0, top : -20};
    this.avoidOffset = {outBottom : 0, outLeft : 0};
    
    this.removeOnClose = false;
    this.removeSelfDelay = 600;
    
    this.closeButton = true;
    this.zIndex = false;
    
    this.contentId = '';
    this.avoidOutOfBounds = true;
    this.avoidLostTarget = true;
    
    this.userEvents = getDefaultUserEvents();
    
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
                
        var settings = [
            'avoidOutOfBounds',
            'avoidLostTarget',
            'avoidOffset', 
            'target', 
            'message',
            'hideWidth',
            'offset', 
            'minWidth', 
            'closeByBody',
            'classGroup', 
            'selfClass', 
            'zIndex', 
            'closeButton', 
            'removeOnClose',
            'removeSelfDelay',
        ];
        
        for (var i=0; i < settings.length; i++) {
            
            var key = settings[i];
            
            if (typeof cfg[key] != 'undefined') {
            
                handler[key] = cfg[key];
                
                if (key == 'selfClass' || key == 'classGroup' || key == 'target' || key == 'closeButton'){
                    updateContainerClass = true;
                }
                
                if (key == 'closeButton' && handler.self) {
                    handler.getCloseButton().style.display = handler.closeButton ? 'block' : 'none';
                } else if (key == 'message' && handler.self) {
                    handler.setMessage(handler[key]);			
                } else if (key == 'zIndex' && handler.self) {
                    handler.self.style.zIndex = handler[key];
                }
                
            }
        }
                
        if (handler.self && updateContainerClass) {
            
            // todo - better remove previouse class, without full overwrite
            
            handler.self.className = getSelfClass();
        }
        
        if (typeof cfg.events != 'undefined' && cfg.events === false) {
            
            handler.userEvents = getDefaultUserEvents();
            
        } else if (typeof cfg.events == 'object') {
                        
            for (var k in cfg.events){
                if (typeof cfg.events[k] === 'function') {
                     handler.userEvents[k] = cfg.events[k];
                }
            }
        }
        
        return handler;
    }
    
    function getDefaultUserEvents() {
        
        return { 
            onMouseOut : false, 
            onMouseOver : false, 
            onClose : false,
            onScroll : false,
            onResize : false,
        };
    }
    
    function getSelfClass() {
            
        var className = handler.classGroup + '-wrap';
            className += ' ' + handler.classGroup + '-y-' + handler.positionY;
            className += ' ' + handler.classGroup + '-x-' + handler.positionX;
        
        if (handler.target && handler.target == 'screen') className += ' ' + handler.classGroup + '-target-screen';
        
        if (handler.closeButton) className += ' ' + handler.classGroup + '-close-btn';
        if (handler.ptypeX) className += ' ' + handler.classGroup + '-' + handler.ptypeX;
        if (handler.ptypeY) className += ' ' + handler.classGroup + '-' + handler.ptypeY;
        
        if (handler.isShown()) className += ' ' + handler.classGroup + '-show';
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
            closeBtn.setAttribute('style', 'display:' + (handler.closeButton ? 'block' : 'none'));
            
        var closeBtnHtml = '<g>\
                    <title></title>\
                    <line x1="27.5" x2="145.5" y1="24.9" y2="131.9" stroke-linecap="round" stroke-width="19" stroke="#000"/>\
                    <line x1="144" x2="28" y1="24.9" y2="131.9" stroke="#000" stroke-linecap="round" stroke-width="19"/>\
                    </g>';
                    
            closeBtnHtml = '<?xml version="1.0" encoding="UTF-8"?>\
                    <svg viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg">' + closeBtnHtml + '</svg>';
                    
            addHtml(closeBtn, closeBtnHtml);
            
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
            
            if (handler.closeByBody && handler.isShown() && !closeByBodyPrevent && !handler.isChild(e.target, handler.self)) {
                handler.show(false);
            }
        };
        
        document.body.addEventListener('click', events.onBodyClick);
        
        events.onResize = function(e) {
        
            if (handler.userEvents.onResize && handler.userEvents.onResize(handler, e)) {
                return;
            }
            
            //console.log(screen.width + ' ff '  + toolTip.hideAfterWidth)
            
            if (!checkRequiredWidth()) {
                handler.show(false);
                return;
            }
            
            if (handler.isShown()) {
                handler.updatePosition();
            }   	
        }
        
        events.onScroll = function(e) {
            
            if (handler.userEvents.onScroll && handler.userEvents.onScroll(handler, e)) {
                return;
            }
            
            if (handler.isShown()) {
                handler.updatePosition();
            }    
        }
        
        window.addEventListener('resize', events.onResize);
        window.addEventListener('scroll', events.onScroll);
        
        return handler;
    }
    
    function checkRequiredWidth() {
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
        
        if (!mess) mess = '';
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
        
            if (!checkRequiredWidth()) return;
            
            handler.self.className += ' ' + handler.classGroup + '-show';
            if (handler.zIndex) handler.self.style.zIndex = handler.zIndex;
            
            handler.updatePosition();
            
            if (!contentId) contentId = 'default';
            
            handler.contentId = contentId;
            
            closeByBodyPrevent = true;            
            if (handler.closeByBody) {
                setTimeout(function() { closeByBodyPrevent = false; }, 100);
            }
            
            if (handler.userEvents.onShow) handler.userEvents.onShow(handler);
            
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
            
            var self = handler.self;
            
            setTimeout(function() { self.parentNode.removeChild(self); }, handler.removeSelfDelay);
            
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
    
    function calcPosForTarget(targetPos, toolTipBounds, envBounds, posX, posY, typeX, typeY, offset) {
           
        var left = targetPos.left + offset.left + envBounds.scrollLeft;  // left - inside element
        var top = targetPos.top + offset.top + envBounds.scrollTop; // top - inside element
              
        if (posY == 'top' && typeY == 'outside') {
            top = top - toolTipBounds.height;
        } else if (posY == 'top' && typeY == 'inside') {		
                        
        } else if (posY == 'bottom' && typeY == 'outside') {             
            top = top + targetPos.height; 
        } else if (posY == 'bottom' && typeY == 'inside') { 
            top = top + targetPos.height - toolTipBounds.height; 
        } else if (posY == 'center') {
            top += targetPos.height / 2 - toolTipBounds.height / 2;
        }
        
        if (posX == 'left' && typeX == 'outside') {
            left = left - toolTipBounds.width;			
        } else if (posX == 'left' && typeX == 'inside') {
                
        } else if (posX == 'right' && typeX == 'outside' ) {
            left = left + targetPos.width;			
        } else if (posX == 'right' && typeX == 'inside' ) {
            left = left + targetPos.width - toolTipBounds.width;	
        } else if (posX == 'center') {
            left += targetPos.width / 2 - toolTipBounds.width / 2;
        }
        
        return {left : left, top : top};
    }
    
    this.updatePosition = function() {
    
        if (!handler.self) return false;
        
        var screenBoundEl = (document.compatMode === "CSS1Compat") ? document.documentElement : document.body;
        var envBounds = {
            scrollTop : (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0),
            scrollLeft : (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0),
            screenWidth : screenBoundEl.clientWidth,
            screenHeight : screenBoundEl.clientHeight,
        }
        
        if (handler.getTarget()) {	
            
            if (handler.avoidLostTarget && !handler.getTarget().parentElement) {
                this.show(false);
                return false;
            }
            
            var targetPos = handler.getTarget().getBoundingClientRect();
            
        } else if (handler.target == 'screen') {            
        
            var targetPos = {left : 0, top : 0, width : envBounds.screenWidth, height : envBounds.screenHeight};
            
            if (handler.ptypeX == 'outside') handler.ptypeX = 'inside';
            if (handler.ptypeY == 'outside') handler.ptypeY = 'inside';
            
            handler.getContent().style.maxHeight = (targetPos.height-140) + 'px';
            handler.getContent().style.maxWidth = targetPos.width + 'px';
            
        } else return false;
        
        var toolTip = handler.self;
        if (handler.minWidth) toolTip.style.minWidth = handler.minWidth + 'px';	
                 
        var toolTipBounds = toolTip.getBoundingClientRect();
        var calcPos = calcPosForTarget(targetPos, toolTipBounds, envBounds, handler.positionX, handler.positionY, handler.ptypeX, handler.ptypeY, handler.offset);
                
        if (this.avoidOutOfBounds && handler.target != 'screen') {
            
            var modPos = {enabled : false, positionX : handler.positionX, positionY : handler.positionY, ptypeX : handler.ptypeX, ptypeY : handler.ptypeY, outY : false, outX : false};
            var modOffset = {left : handler.offset.left, top : handler.offset.top};

            if ( calcPos.top + toolTipBounds.height > envBounds.scrollTop + envBounds.screenHeight) { // go under screen in bottom
                modPos.enabled = true; modPos.positionY = 'top'; modPos.outY = 'bottom'; if (typeof handler.avoidOffset.outBottom != 'undefined') modOffset.top += handler.avoidOffset.outBottom;
            }  else if ( calcPos.top + toolTipBounds.height < 0 ) { // go out of screen from top
                modPos.enabled = true; modPos.positionY = 'bottom'; modPos.outY = 'top'; if (typeof handler.avoidOffset.outTop != 'undefined') modOffset.top += handler.avoidOffset.outTop;
            }
            
            if ( calcPos.left + toolTipBounds.width > envBounds.scrollLeft + envBounds.screenWidth) { // from right
                modPos.enabled = true; modPos.positionX = 'right'; modPos.outX = 'right'; if (typeof handler.avoidOffset.outRight != 'undefined') modOffset.left += handler.avoidOffset.outRight;
            } else if ( calcPos.left + toolTipBounds.width < 0 ) { // from left
                modPos.enabled = true; modPos.positionX = 'left'; modPos.outX = 'left'; if (typeof handler.avoidOffset.outLeft != 'undefined') modOffset.left += handler.avoidOffset.outLeft;
            }
            
            if (modPos.enabled) {
                
                if (handler.userEvents.onAvoidBounds && handler.userEvents.onAvoidBounds(handler, calcPos, modPos)) {
                    return;
                } 
                
                calcPos = calcPosForTarget(targetPos, toolTipBounds, envBounds, modPos.positionX, modPos.positionY, modPos.ptypeX, modPos.ptypeY, modOffset);
            }
        }
        
        toolTip.style.top = calcPos.top + 'px';
        toolTip.style.left = calcPos.left + 'px';
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
        .' + className + '-wrap.' + className + '-target-screen {\
            padding : 16px;\
        }\
        .' + className + '-wrap.' + className + '-target-screen .' + className + '-close {\
            top: -19px;\
            left: 17px;\
        }\
        .' + className + '-container {\
            min-width: 210px;\
            min-height: 52px;\
            margin : 0;\
            background: rgb(96, 96, 96);\
            border : 0;\
            transition: opacity 0.1s;\
            color : #fff;\
            border-radius : 0px;\
            padding : 12px;\
            max-width: 510px;\
        }\
        .' + className + '-close {\
            position: absolute;\
            display: block;\
            cursor: pointer;\
            font-size: 25px;\
            width: 25px;\
            height: 25px;\
            text-align: center;\
            line-height: 25px;\
            cursor : pointer;\
            right: auto;\
            top: 0px;\
            left: -32px;\
            background: rgb(96, 96, 96);\
        }\
        .' + className + '-close svg {\
            width: 26px;\
            height: 15px;\
        }\
        .' + className + '-close svg g line {\
            stroke: #fff;\
            fill: #fff;\
        }\
        .' + className + '-content {\
            text-align: left;\
            font-size: 16px;\
            overflow: auto;\
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

// dont use, untested

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
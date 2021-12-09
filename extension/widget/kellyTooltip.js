/*
   @encoding utf-8
   @name           KellyTooltip
   @namespace      Kelly
   @description    creates tooltip elements (attaches to an element or screen) widget
   @author         Rubchuk Vladimir <torrenttvi@gmail.com>
   @license        GPLv3
   @version        v 1.0.4 14.05.20
   
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
                
                if (key == 'selfClass' || key == 'classGroup'){
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
    
    this.updatePosition = function() {
    
        if (!handler.self) return false;
        
        var scrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
        var scrollLeft = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0);
        var screenBoundEl = (document.compatMode === "CSS1Compat") ? document.documentElement : document.body;
        var screenBounds = { width : screenBoundEl.clientWidth, height : screenBoundEl.clientHeight};
        
        if (handler.getTarget()) {	
            
            if (handler.avoidLostTarget && !handler.getTarget().parentElement) {
                this.show(false);
                return false;
            }
            
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
                } else {
                    top += pos.height; // untested
                }
                
            }  else if ( top + toolTipBounds.height < 0 ) {
                top = top + toolTipBounds.height + handler.offset.top;  
                
                if (handler.ptypeY == 'outside') {
                    top += pos.height;
                } else {
                    top -= pos.height; // untested
                }
            }
            
            if ( left + toolTipBounds.width > scrollLeft + screenBounds.width) {
                
                left = left - toolTipBounds.width - handler.offset.left;
                
                if (handler.ptypeX == 'outside') {
                    left -= pos.width;
                } else {
                    left += pos.width;
                }
                
            } else if ( left + toolTipBounds.width < 0 ) {
                left = left + toolTipBounds.width + handler.offset.left;

                if (handler.ptypeX == 'outside') {
                    left += pos.width;
                } else {
                    left -= pos.width; // untested
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
            cursor: pointer;\
            font-size: 25px;\
            width: 25px;\
            height: 25px;\
            text-align: center;\
            line-height: 25px;\
            cursor : pointer;\
        }\
        .' + className + '-close svg g line {\
            stroke: #56400c;\
            fill: #56400c;\
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
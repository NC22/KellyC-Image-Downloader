function kellyTooltip(cfg) {
	
	var handler = this;
	
	this.message = '';
	this.target = false;
	this.hideWidth = false;
	this.offset = {left : 0, top : -20};
	this.minWidth = false;
	
	this.closeByBody = false;
	
	this.self = false;
	this.baseClass = '';
	
	this.position = 'top';
	this.positionCenter = true;
	
	this.removeOnClose = false;
	this.closeButton = true;
	this.zIndex = false;
	
	this.contentId = '';
	
	this.userEvents = { onMouseOut : false, onMouseOver : false, onClose : false  };
	
	var events = {};
	
	this.updateCfg = function(cfg) {
	
		if (cfg.position && ['left', 'right', 'top', 'bottom'].indexOf(cfg.position) != -1) {
			handler.position = cfg.position;
		}
		
		var settings = ['target', 'hideWidth', 'offset', 'minWidth', 'closeByBody', 'baseClass', 'zIndex', 'positionCenter', 'closeButton'];
		
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
	}
	
	function constructor(cfg) {		
		
		if (kellyTooltip.autoloadCss) kellyTooltip.loadDefaultCss();

		if (handler.self) return;

		handler.updateCfg(cfg);
		
		var className = 'tooltipster-base ';
			className += 'tooltipster-' + handler.position;
		
		if (handler.baseClass) className += ' ' + handler.baseClass + '-base';
			
		handler.self = document.createElement('div');
		handler.self.className = 'tooltipster-wrap ' + (handler.baseClass ? handler.baseClass : '');			
		handler.self.innerHTML =  '<div class="' + className + '"><div class="tooltipster-content">' + handler.message;
		handler.self.innerHTML += '<span class="tooltipster-close" style="cursor : pointer; display:' + (handler.closeButton ? 'block' : 'none') +'">+</span></div>';
		handler.self.innerHTML += '</div>';	
		
		handler.self.onmouseover = function (e) { 
			if (handler.userEvents.onMouseOver) handler.userEvents.onMouseOver(handler, e);
		}
		
		handler.self.onmouseout = function(e) {
			if (handler.userEvents.onMouseOut) handler.userEvents.onMouseOut(handler, e);
		};
		
		document.body.appendChild(handler.self);	
		
		var closeButton = handler.self.getElementsByClassName('tooltipster-close')[0];
			closeButton.onclick = function() {
				
				 handler.show(false); 
			}
		
		events.onBodyClick = function(e) {
			
			if (handler.closeByBody) {
				
				if (e.target != handler.self) {
					
					var parent = e.target;
					while (parent && handler.self != parent) {
						parent = parent.parentElement;
					}  
					
					if (!parent) {								
						handler.show(false);
					}
				}
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
		
		window.addEventListener('resize', events.onResize);
		
	}
	
	function checkRequierdWidth() {
		if (handler.hideAfterWidth && document.body.clientWidth <= handler.hideAfterWidth) return false;
		else return true;
	}
			
	this.setMessage = function(mess) {		
		this.getContentContainer().innerHTML = handler.message;			
	}
	
	this.getCloseButton = function() {
		return handler.self.getElementsByClassName('tooltipster-close')[0];
	}
	
	this.getContentContainer = function() {
		return handler.self.getElementsByClassName('tooltipster-content')[0];
	}
	
	this.show = function(show, contentId) {
		if (!handler.self) return;
		
		handler.self.className = handler.self.className.replace('tooltipster-show', '').trim();
	
		if (show) {			
		
			if (!checkRequierdWidth()) return;
			
			handler.self.className += ' tooltipster-show';
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
		return (handler.self && handler.self.className.indexOf('tooltipster-show') !== -1) ? handler.contentId : false;
	}
	
	this.remove = function() {
		if (handler.self) {
			handler.self.parentNode.removeChild(handler.self);
			handler.self = false;
			
			// но можно и добавлять \ удалять события при показе \ скрытии подсказки
			document.body.removeEventListener('click', events.onBodyClick); 
			window.removeEventListener('resize', events.onResize);
		}
	}

	this.isChild = function(target) {
		var parent = target;
 
		while (parent && parent != handler.self) {
			parent = parent.parentElement;
		} 

		return parent ? true : false;
	}
	
	this.getTarget = function() {
	
		if (!handler.target) return false;
		
		if (typeof handler.target == 'string') {
			var target = document.getElementById(handler.target);
			if (target) {
				handler.target = target;
				return handler.target;
			} else return false;		
			
		} else return handler.target;
	}
	
	this.updatePosition = function() {
		
		var scrollTop = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0);
		
		// maybe some position modes will be added in future
		// 
		// var screenBoundEl = (document.compatMode === "CSS1Compat") ? document.documentElement : document.body; // clientHeight \ clientWidth
		
		if (!handler.getTarget()) {
			
			return;
		}
								
		var toolTip = handler.self;
		if (handler.minWidth) toolTip.style.minWidth = handler.minWidth + 'px';	
				
		var pos = handler.getTarget().getBoundingClientRect(); 
		var toolTipBounds = toolTip.getBoundingClientRect();
		
		
		var left = pos.left + handler.offset.left;
		
		if (handler.positionCenter) left += pos.width / 2 - toolTipBounds.width / 2;
		
		toolTip.style.left = left + 'px';
		
		if (handler.position == 'top') {
			toolTip.style.top = (pos.top - toolTipBounds.height + scrollTop + handler.offset.top) + 'px';			
		} else { // bottom
			toolTip.style.top = (pos.top + pos.height + scrollTop - handler.offset.top) + 'px';			
		}
	}
		
	constructor(cfg);
}

/* static methods */

kellyTooltip.autoloadCss = false;
kellyTooltip.defaultStyle = false;

kellyTooltip.loadDefaultCss = function() {
	
	if (this.defaultStyle) return true;
	
	var border = 0;
	
	var css = '\
		.tooltipster-wrap {\
			position : absolute;\
			padding-top : 6px;\
			opacity : 0;\
			z-index : 60;\
			pointer-events: none;\
		}\
		.tooltipster-base {\
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
		.tooltipster-close {\
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
		.tooltipster-content {\
			text-align: left;\
			font-size: 16px;\
		}\
		.tooltipster-show {\
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
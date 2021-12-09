// part of KellyFavItems extension
// todo addEventListener 
 
function KellyProfileDefault() {
        
    var handler = this;
    
    this.hostList = [];    
    this.webRequestsRules = { disable : true };
	
    this.profile = 'default';
    this.className = 'kelly-jr-ui'; // base class for every extension container \ element

    this.sidebarConfig = {
        topMax : 0,
        paddingTop : 24,
        nDisabled : -1, // 1 - sidebar not found or hidden (jras - sidebar can be hidden)
    };
    
    this.fav = false;
    
    /* imp, could be helpfull for set webreuqest rules, addition variables, depends on page environment. Unused in universal recorder */
    
    this.setLocation = function(location) {
        
        handler.location = {
            protocol : location.protocol,
            host : location.host,
            href : location.href,
        };
        
        handler.hostClass = handler.className + '-' + location.host.split('.').join("-");
    }
    
    // calls every time o request image link for download request or for show on page
    
    this.getImageDownloadLink = function(url, full, format) { return url; }
    this.getStaticImage = function(url) { return url; }
    
    this.getMainContainers = function() {
        
        // todo move create buttons methods from faitems core
        
        if (!handler.mContainers) {
            handler.mContainers = {
                
                // public
                
                body : document.getElementById('container'), // place where to put all dynamic absolute position elements
                siteContent : document.getElementById('contentinner'), // site main container
                favContent : false, // main extension container - image grid \ options block
                sideBar : false,  // place where to put extension sidebar block (add post \ filters menu)
                menu : document.getElementById('submenu'), // currently used in kellyFavItems to create menu buttons
                
                // private
                 
                sideBlock : document.getElementById('sidebar'), // helps to detect width of sideBar, only for updateSidebarPosition()
            };
            
            handler.mContainers.sideBar = handler.mContainers.body;
            
            if (handler.mContainers.siteContent) {                
                handler.mContainers.favContent = document.createElement('div');
                handler.mContainers.favContent.className = handler.className + '-FavContainer ' + handler.hostClass;                
                handler.mContainers.siteContent.parentNode.insertBefore(handler.mContainers.favContent, handler.mContainers.siteContent);                
            }
            
            if (!handler.mContainers.favContent || !handler.mContainers.body) {
                KellyTools.log('getMainContainers : cant create containers, check selectors', KellyTools.E_ERROR);
                KellyTools.log(handler.mContainers, KellyTools.E_ERROR);
                return false;               
            }
        }
        
        return handler.mContainers;
    }   
    
    this.events = {
        
        /*
            calls when new cfg | items list loaded 
            
            storage - current actual storage | loadType - cfg | items | false (both) | context - undefined (from any other method) | selectDB (from options page)
            if return true - prevent default callback
        */  
        
        onStorageAfterload : function(storage, loadType, context) { return false; },
        
        /* 
            calls on document.ready, or if getPosts find some data
            if return true prevent native init environment logic (initFormatPage -> InitWorktop)
        */        
        
        onPageReady : function() { return false; },
        
        /* 
            calls after extension resources is loaded
            if return true prevent native init worktop logic (image viewer initialization)
        */     
       
        onInitWorktop : function() {return false; },
        
        onExtensionReady : function() {
            handler.sidebarConfig.topMax = handler.getMainContainers().siteContent.getBoundingClientRect().top + KellyTools.getScrollTop();
            
            KellyTools.addEventPListener(window, "resize", updateSidebarPosition, '_fav_dialog');
            KellyTools.addEventPListener(window, "scroll", updateSidebarPosition, '_fav_dialog');
        },
        
        onSideBarShow : function(sideBarWrap, close) {
                       
            if (!sideBarWrap) return;
                                    
            var siteSideBlock = handler.getMainContainers().sideBlock;		
            if (siteSideBlock) {	
                siteSideBlock.style.visibility = close ? 'visible' : 'hidden';
                siteSideBlock.style.opacity = close ? '1' : '0'; 
            }
                
            if (close) {
                sideBarWrap.style.top = '50px';
                return;
            }
        
            updateSidebarProportions(sideBarWrap);
            updateSidebarPosition();
        },
        
        onSideBarUpdate : updateSidebarPosition,
        onOptionsUpdate : function(refreshPosts) {},        
        onDisplayBlock : function(mode, action, oldMode) {},                    
        onBeforeGoToFavPage : function(newPage) {},    
    }

    function updateSidebarProportions(sideBarWrap) {
        
        if (sideBarWrap.className.indexOf('inline') !== -1) return;
        var filters = KellyTools.getElementByClass(sideBarWrap, handler.className + '-FiltersMenu'); 
        if (filters && filters.offsetHeight > 440 && filters.className.indexOf('calculated') == -1) {
            
            var filtersBlock = KellyTools.getElementByClass(sideBarWrap, handler.className + '-FiltersMenu-container');
                
            filtersBlock.style.maxHeight = '0';
            filtersBlock.style.overflow = 'hidden';
            
            var modalBox = KellyTools.getElementByClass(document, handler.className + '-ModalBox-main');						
                modalBox.style.minHeight = '0';

            var modalBoxHeight = modalBox.getBoundingClientRect().height;       
            
            var viewport = KellyTools.getViewport();
            if (viewport.screenHeight < modalBoxHeight + filters.offsetHeight + handler.sidebarConfig.paddingTop) {
                filtersBlock.style.maxHeight = (viewport.screenHeight - modalBoxHeight - handler.sidebarConfig.paddingTop - 44 - handler.sidebarConfig.paddingTop) + 'px';
                filtersBlock.style.overflowY = 'scroll';

            } else {
                    
                filtersBlock.style.maxHeight = 'none';
                filtersBlock.style.overflow = 'auto';
            }
            
            filters.className += ' calculated';
        }
    }
    
    function updateSidebarPosition() {    
        
        if (!handler.fav) return false;
        
        var sideBarWrap = handler.fav.getView('sidebar'), sideBlock = handler.getMainContainers().sideBlock;        
        if (!sideBarWrap || sideBarWrap.className.indexOf('hidden') !== -1 || sideBarWrap.className.indexOf('inline') !== -1) return false;
            
        if (handler.sidebarConfig.nDisabled == -1) { // first time update position, validate sidebar block
            
            if (sideBlock && window.getComputedStyle(sideBlock).position == 'absolute') {
                 
                KellyTools.log('Bad sidebar position', 'updateSidebarPosition'); 
                handler.sidebarConfig.nDisabled = 1;
            }
            
            if (!sideBlock) {
                KellyTools.log('Sidebar not found', 'updateSidebarPosition'); 
                handler.sidebarConfig.nDisabled = 1;
            }
            
            if (handler.sidebarConfig.nDisabled == 1) {
                
                var collapseButton = KellyTools.getElementByClass(sideBarWrap, handler.className + '-sidebar-collapse');
                if (collapseButton) {
                    KellyTools.classList('add', collapseButton, handler.className + '-active');
                }
            }
        } 
        
        if (handler.sidebarConfig.nDisabled == 1) sideBlock = false;
        
        var scrollTop = KellyTools.getScrollTop(), scrollLeft = KellyTools.getScrollLeft();   
        var topMax = handler.sidebarConfig.topMax, top = topMax;
                           
        if (!handler.fav.sideBarLock && handler.sidebarConfig.paddingTop + scrollTop > top) top = handler.sidebarConfig.paddingTop + scrollTop;
                
        sideBarWrap.style.top = top + 'px';
       
        if (sideBlock) {
            
            var widthBase = 0, sideBlockBounds = sideBlock.getBoundingClientRect();               
            sideBarWrap.style.right = 'auto';
            sideBarWrap.style.left = Math.round(sideBlockBounds.left + scrollLeft) + 'px';
            sideBarWrap.style.width = Math.round(sideBlockBounds.width + widthBase) + 'px';
            
        } else {            
            sideBarWrap.style.right = '20px';
            sideBarWrap.style.left = 'auto';
        }
    }
    
    /* imp */
    
    this.setFav = function(fav) {
        handler.fav = fav;
    }
     
    /* not imp */
    
    this.getRecomendedDownloadSettings = function() {
        
        var browser = KellyTools.getBrowserName();        
        return { 
            transportMethod : browser == 'opera' || browser == 'chrome' ? KellyGrabber.TRANSPORT_BLOB : KellyGrabber.TRANSPORT_BLOBBASE64, 
            requestMethod : KellyGrabber.REQUEST_FETCH 
        }
    }   
}

KellyProfileDefault.getInstance = function() {
    if (typeof KellyProfileDefault.self == 'undefined') {
        KellyProfileDefault.self = new KellyProfileDefault();
    }
    
    return KellyProfileDefault.self;
}
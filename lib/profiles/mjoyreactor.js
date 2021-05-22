// part of KellyFavItems extension
// JoyReactor environment driver

var KellyProfileMJoyreactor = new Object();
    KellyProfileMJoyreactor.create = function() {
        
        KellyProfileMJoyreactor.self = new KellyProfileJoyreactor();   
        var handler = KellyProfileMJoyreactor.self;
        
        
        handler.getPostLinkEl = function(publication) { 
            var link = publication.querySelector('a.commentnum');
            if (link) return link;
            
            // could unexist for censored posts
            
            if (publication.id && publication.id.indexOf('postContainer') != -1) {
                var postId = publication.id.match(/[0-9]+/g);
                if (postId.length <= 0) return false;
                
                link = document.createElement('A');
                link.href = 'http://joyreactor.cc/post/' + postId;
                link.className = 'commentnum';
                link.style.display = 'none';
                
                publication.appendChild(link);
                return link;
            }
        
            return false;
        }
        
        handler.formatPostContainer = function(postBlock) {
            handler.getPostLinkEl(postBlock);
            var coptions = handler.fav.getGlobal('fav').coptions;       
            if (coptions.unlock.censored && typeof KellyProfileJoyreactorUnlock != 'undefined') {
                KellyProfileJoyreactorUnlock.formatIfCensored(handler, postBlock, coptions.unlock.censoredMode == 'auto' ? true : false);
            }
        }   
        
        handler.getMainContainers = function() {
        
            if (!handler.mContainers) {
                
                handler.mContainers = {
                    body : document.body,
                    menuHolder : document.querySelector('.m_menu'),
                    siteContent : document.querySelector('.m_wrapper'),                
                    menu : document.createElement('div'),
                };
                
                handler.mContainers.menu.id = 'submenu';
                handler.mContainers.menu.className = handler.hostClass;
                handler.mContainers.sideBar = handler.mContainers.body;
                handler.mContainers.menuHolder.appendChild(handler.mContainers.menu);
                
                if (handler.mContainers.siteContent) {                      
                    handler.mContainers.favContent = document.createElement('div');
                    handler.mContainers.favContent.className = handler.className + '-FavContainer ' + handler.hostClass;
                    handler.mContainers.siteContent.parentElement.appendChild(handler.mContainers.favContent);  
                }
                
                if (!handler.mContainers.favContent || !handler.mContainers.body) {
                    KellyTools.log('getMainContainers : cant create containers, check selectors', KellyTools.E_ERROR);
                    KellyTools.log(handler.mContainers, KellyTools.E_ERROR);
                    return false;               
                } 
                
                if (handler.location.href.indexOf('/tag/') != -1) {
                    
                    // reproduce same env as on joyreactor.cc for proper work of getFavPageInfo method
                    
                    var anchorEl = document.getElementById('blogHeader');
                    if (!anchorEl) {         
                         anchorEl = document.createElement('DIV');
                         anchorEl.id = 'blogHeader';
                         
                         handler.mContainers.siteContent.insertBefore(anchorEl, handler.mContainers.siteContent.firstChild);
                    }                    
                }                
            }
            
            return handler.mContainers;
        }        
    }
    
    KellyProfileMJoyreactor.getInstance = function() {
        if (typeof KellyProfileMJoyreactor.self == 'undefined') KellyProfileMJoyreactor.create();    
        return KellyProfileMJoyreactor.self;
    }
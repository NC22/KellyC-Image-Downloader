// part of KellyFavItems extension
// JoyReactor environment driver

var KellyProfileTopJoyreactor = new Object();
    KellyProfileTopJoyreactor.create = function() {
        
        KellyProfileTopJoyreactor.self = new KellyProfileJoyreactor();   
        var handler = KellyProfileTopJoyreactor.self;
                
        handler.events.onPageReadyOrig = handler.events.onPageReady;
        handler.events.onPageReady = function() {
            handler.events.onPageReadyOrig();
            handler.initUpdateWatcher();
            handler.fav.getFastSave().tooltipOptions = {
                positionY : 'bottom',
                positionX : 'left',
                closeButton : false,
            }
        }
        
        handler.initOnLoad = function(onLoad) {
            if (handler.getPosts().length > 0) return onLoad();
            handler.observer = new MutationObserver(function(mutations) {
                if (mutations.length > 0 && handler.getPosts().length > 0) {
                    handler.observer.disconnect();
                    onLoad(); 
                }                
            });
            handler.observer.observe(document.getElementById('root'), {childList: true, subtree: true});
        }
        
        handler.getPosts = function(container) {
            if (!container) container = document;
            return container.getElementsByClassName('post-card');
        }
        
        handler.getAllMedia = function(publication) {
            
            var data = [], content = KellyTools.getElementByClass(publication, 'card-text');
            if (!content || !publication) return data;
                 
            var imagesEl = content.getElementsByTagName('img');
            for (var i = 0; i < imagesEl.length; i++) {
                var image = handler.getImageDownloadLink(imagesEl[i].getAttribute("src"), false);
                if (image) data.push(image);
            }
            
            return data;
        }
        
        handler.getPostLinkEl = function(publication) { 
            return publication.querySelector('.card-footer a[rel="noopener noreferrer"]');
        }
        
        handler.formatPostContainer = function(postBlock) {
            
            var tags = postBlock.getElementsByClassName('badge');
            if (tags.length && tags[0].parentElement) tags[0].parentElement.classList.add('taglist');
            
            var coptions = handler.fav.getGlobal('fav').coptions;
            var postLink = handler.getPostLinkEl(postBlock);
            var buttonsBlock = KellyTools.getElementByClass(postBlock, handler.className + '-extension-additions');
            
            if (!buttonsBlock) {            
                buttonsBlock = document.createElement('div');
                buttonsBlock.className = handler.className + '-extension-additions';
                postLink.parentNode.insertBefore(buttonsBlock, postLink);
            }
       
            var link = handler.getPostLink(postBlock);
            var className =  handler.className + '-post-addtofav';
                       
            var fastSave = handler.fav.getFastSave();                         
                fastSave.showFastSaveButton(postBlock, buttonsBlock, coptions.fastsave.enabled, false, handler.className);   
                fastSave.showFastSaveButton(postBlock, buttonsBlock, coptions.fastsave.configurableEnabled, true, handler.className);  
                
            var addToFav = KellyTools.getElementByClass(postBlock, handler.className + '-post-addtofav');        
            if (!addToFav) {               
                addToFav = document.createElement('a');
                addToFav.href = postLink.href;
                addToFav.className = handler.className + '-post-addtofav';
                buttonsBlock.appendChild(addToFav);
            }         
            
            var postIndex = handler.fav.getStorageManager().searchItem(handler.fav.getGlobal('fav'), {link : link, commentLink : false});
            var action = postIndex !== false ? 'remove_from' : 'add_to';  
            var onAction = function(remove) {
                if (remove) handler.fav.closeSidebar();
                handler.formatPostContainer(postBlock); 
            }
            
            addToFav.onclick = function() { 
                handler.fav.showAddToFavDialog(action == 'remove_from' ? postIndex : postBlock, false, onAction, function() {onAction(true)});
                return false; 
            };
                          
            KellyTools.classList(action == 'remove_from' ? 'add' : 'remove', addToFav, handler.className + '-post-addtofav-added');
            addToFav.innerText = KellyLoc.s('', action + '_fav');       
        }   
        
        handler.initUpdateWatcher = function() {
            
            handler.observer = new MutationObserver(function(mutations) {

                for (var i = 0; i < mutations.length; i++) {
                    if (mutations[i].target.className.indexOf('post-card-row') != -1) {
                        handler.getMainContainers();
                        handler.fav.closeSidebar();
                        handler.fav.formatPostContainers();
                        KellyTools.log('New page loaded, format publications');
                        return;
                    } else if (mutations[i].target.id == 'root' && 
                               mutations[i].removedNodes.length > 0 && 
                               mutations[i].removedNodes[0].nodeType == Node.ELEMENT_NODE && 
                               mutations[i].removedNodes[0].classList.contains('container') &&
                               handler.fav.getGlobal('mode') == 'main') {
                                   
                        handler.fav.closeSidebar();
                        KellyTools.log('Page publications removed');
                        return;
                   }
                }
            });
            
            handler.observer.observe(handler.getMainContainers().body, {childList: true, subtree: true});
        }
    
        handler.getMainContainers = function() {
        
            if (!handler.mContainers) {
                
                handler.mContainers = {
                    body : document.getElementById('root'),
                    menuHolder : document.querySelector('.nsfw_switcher'),
                    siteContent : document.querySelector('.postContainer'),                
                    menu : document.createElement('div'),
                };
                
                handler.mContainers.menu.id = 'submenu';
                handler.mContainers.menu.className = handler.hostClass;
                handler.mContainers.sideBar = handler.mContainers.body;
                handler.mContainers.menuHolder.appendChild(handler.mContainers.menu);
                
                if (handler.mContainers.siteContent) {                      
                    handler.mContainers.favContent = document.createElement('div');
                    handler.mContainers.favContent.className = handler.className + '-FavContainer ' + handler.hostClass;
                }
                
                if (!handler.mContainers.favContent || !top || !handler.mContainers.body) {
                    KellyTools.log('getMainContainers : cant create containers, check selectors', KellyTools.E_ERROR);
                    KellyTools.log(handler.mContainers, KellyTools.E_ERROR);
                    return false;               
                }
                
            } else {
                handler.mContainers.body = document.getElementById('root');
                handler.mContainers.sideBar = handler.mContainers.body;
                handler.mContainers.siteContent = document.querySelector('.postContainer');
                handler.mContainers.menuHolder = document.querySelector('.nsfw_switcher');
                handler.mContainers.menuHolder.appendChild(handler.mContainers.menu);
                handler.mContainers.body.appendChild(handler.mContainers.favContent);   
            }
            
            return handler.mContainers;
        }        
    }
    
    KellyProfileTopJoyreactor.getInstance = function() {
        if (typeof KellyProfileTopJoyreactor.self == 'undefined') KellyProfileTopJoyreactor.create();    
        return KellyProfileTopJoyreactor.self;
    }
// part of KellyFavItems extension
// JoyReactor environment driver

var KellyProfileTopJoyreactor = new Object();
    KellyProfileTopJoyreactor.create = function() {
        
        KellyProfileTopJoyreactor.self = new KellyProfileJoyreactor();   
        var handler = KellyProfileTopJoyreactor.self;
        
        handler.mainContainerClass = 'content-container';
        
        handler.events.onPageReadyOrig = handler.events.onPageReady;
        handler.events.onExtensionReady = function() {
            if (handler.unlockManager) handler.unlockManager.formatCensoredPosts();
        };
        
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
                
                if (mutations.length > 0 && document.body.querySelector('.post-card')) {
                    handler.observer.disconnect();
                    handler.initPosts(onLoad); 
                }                
            });
            
            handler.observer.observe(document.getElementById('root'), {childList: true, subtree: true});
        }
        
        // currently no any direct links on page
        handler.initPosts = function(onInit) {
            KellyTools.addCss(handler.className + '-hide-popup', ".ant-dropdown { display : none;}", true);
            
            var post = document.body.querySelectorAll('.post-card'), postValid = [];
            for (var i = 0; i < post.length; i++) {
                var linkButton = post[i].querySelector('.post-footer button.ant-dropdown-trigger');
                if (linkButton) {
                    postValid.push(post[i]); linkButton.click();
                    var link = document.createElement('A');
                        link.className = handler.className + '-post-link';
                    linkButton.parentNode.insertBefore(link, linkButton);
                }
            }
            
            setTimeout(function() {
                
                var link = document.body.querySelectorAll('.ant-dropdown-placement-topCenter .ant-dropdown-menu-item:last-child a');
                for (var i = 0; i < link.length; i++) {   
                    postValid[i].querySelector('.post-footer button.ant-dropdown-trigger').click(); 
                    postValid[i].getElementsByClassName(handler.className + '-post-link')[0].href = link[i].href;
                    postValid[i].classList.add(handler.className + '-post');
                }
                
                setTimeout(function() { KellyTools.addCss(handler.className + '-hide-popup', "", true); }, 1000);
                onInit();
            }, 100);
        }
        
        handler.getPosts = function(container) {
            if (!container) container = document;
            return document.getElementsByClassName(handler.className + '-post');
        }
        
        handler.getAllMedia = function(publication) {
            
            var data = [], content = KellyTools.getElementByClass(publication, 'post-content');
            if (!content || !publication) return data;
                 
            var imagesEl = content.getElementsByTagName('img');
            for (var i = 0; i < imagesEl.length; i++) {
                 
                var imageLink = imagesEl[i].getAttribute("src");
                if (imageLink.indexOf('static/') != -1) {
                    imageLink = imageLink.replace('static/', '');
                    imageLink = imageLink.substr(0, imageLink.lastIndexOf('.')) + '.gif';
                }
                
                var image = handler.getImageDownloadLink(imageLink, false);
                if (image) data.push(image);
            }
            
            return data;
        }
        
        handler.getPostLinkEl = function(publication) { 
            return publication.getElementsByClassName(handler.className + '-post-link')[0];
        }
        
        handler.formatPostContainer = function(postBlock) {
            
            var coptions = handler.fav.getGlobal('fav').coptions;
            if (coptions.hideAddToFav && !coptions.fastsave.enabled && !coptions.fastsave.configurableEnabled) return;
            
            var tags = postBlock.getElementsByClassName('badge');
            if (tags.length && tags[0].parentElement) tags[0].parentElement.classList.add('taglist');
            
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
            
            if (!coptions.hideAddToFav) {
                
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
        }   
        
        handler.initUpdateWatcher = function() {
            
            handler.observer = new MutationObserver(function(mutations) {

                for (var i = 0; i < mutations.length; i++) {
                    
                    if (mutations[i].target.className.indexOf(handler.mainContainerClass) != -1) {
                        handler.initPosts(function() {
                            KellyTools.log('New page loaded, format publications');   
                            handler.getMainContainers();
                            if (handler.fav.getGlobal('mode') == 'main') handler.fav.closeSidebar();
                            else handler.fav.hideFavoritesBlock();
                            handler.fav.formatPostContainers();
                            if (handler.unlockManager) handler.unlockManager.formatCensoredPosts();    
                        });
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
            
            handler.hostClass = handler.className + '-' + 'top-joyreactor-cc';        
              
            if (!handler.mContainers) {
                
                handler.mContainers = { 
                    favContent : document.createElement('div'),                
                    menu : document.createElement('div'),
                };
                
                handler.mContainers.menu.id = 'submenu';
                handler.mContainers.menu.className = handler.hostClass;                
                handler.mContainers.favContent.className = handler.className + '-FavContainer ' + handler.hostClass;
            } 
            
            // todo reinit only on observer
            
            handler.mContainers.body = document.getElementById('root');
            handler.mContainers.sideBar = handler.mContainers.body;
            handler.mContainers.sideBlock = document.querySelector('.sidebar');
            handler.mContainers.siteContent = document.querySelector('.' + handler.mainContainerClass);
            handler.mContainers.menuHolder = document.querySelector('.nsfw_switcher');
            
            if (!handler.mContainers.siteContent || !handler.mContainers.body) {
                KellyTools.log('getMainContainers : cant create containers, check selectors', KellyTools.E_ERROR);
                KellyTools.log(handler.mContainers, KellyTools.E_NOTICE);
                return false;               
            }
            
            handler.mContainers.menuHolder.appendChild(handler.mContainers.menu);
            handler.mContainers.siteContent.parentElement.insertBefore(handler.mContainers.favContent, handler.mContainers.siteContent.nextSibling); 
        
            return handler.mContainers;
        }        
    }
    
    KellyProfileTopJoyreactor.getInstance = function() {
        if (typeof KellyProfileTopJoyreactor.self == 'undefined') KellyProfileTopJoyreactor.create();    
        return KellyProfileTopJoyreactor.self;
    }
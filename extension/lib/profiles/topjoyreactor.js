// part of KellyFavItems extension
// JoyReactor environment driver

var KellyProfileTopJoyreactor = new Object();
    KellyProfileTopJoyreactor.create = function() {
        
        KellyProfileTopJoyreactor.self = new KellyProfileJoyreactor();   
        var handler = KellyProfileTopJoyreactor.self;
        
        handler.mainContainerClass = 'content-container';
        
        handler.events.onPageReadyOrig = handler.events.onPageReady;
        handler.events.onExtensionReady = function() {
            handler.sidebarConfig.widthBase = 0;
            
            setTimeout(function() {
                handler.sidebarConfig.topMax = handler.mContainers.siteContent.getBoundingClientRect().top + KellyTools.getScrollTop() + 24;   
            }, 300);
            
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
            
            window.addEventListener('message', function(e) {
                    
                    if (!e.data || !e.data.method || e.data.method != 'kelly_fetch_hook_event' || !e.data.requestId) return false;
                    
                    var getGraphQLPosts = function(inData) {
                        
                        if (!inData) return false;
                        
                        if (inData.node) { // e.data.eventDataIn.requestCfg.body.indexOf(...) RefetchPagerQuery
                             return inData.node.postPager.posts;
                        } else if (inData.blog) { // e.data.eventDataIn.requestCfg.body.indexOf(...) TagPageQuery 
                            return inData.blog.postPager.posts; 
                        } else if (inData.user) { // e.data.eventDataIn.requestCfg.body.indexOf(...) UserProfilePageQuery
                            return inData.user.postPager.posts;     
                        } else if (inData.weekTopPosts) { // e.data.eventDataIn.requestCfg.body.indexOf(...) WeekTopPageQuery
                            return inData.weekTopPosts;  
                        } else { // main page
                            return false;
                        }
                        
                    }
                    
                    var response = {
                        method : 'kelly_fetch_hook_event_complite',
                        requestId : e.data.requestId,
                        eventName : e.data.eventName,
                        eventDataOut : false,
                    };     
                    
                    if (e.data.eventName == 'onRequestReady') {
                                                    
                        var posts = false;
                        try {
                            
                            if (Object.prototype.toString.call(e.data.eventDataIn.responseJson) === '[object Array]') {
                                
                                for (var i = 0; i < e.data.eventDataIn.responseJson.length; i++) {
                                    posts = getGraphQLPosts(e.data.eventDataIn.responseJson[i].data);
                                   
                                    if (posts) break;
                                }
                                
                            } else {
                                
                                posts = getGraphQLPosts(e.data.eventDataIn.responseJson.data);
                            }
                             console.log(posts);
                        } catch(e) {      
                            console.log(e);
                            
                            posts = false;
                        }
                        
                        if (posts) {
                            for (var i = 0; i < posts.length; i++) {
                                posts[i].text += '<span class="kelly-post-id" style="display : none;" data-id="' + (KellyProfileJoyreactorUnlock.getNodeId(posts[i].id)) + '"></span>';
                                posts[i].unsafe = false;
                            }
                        }
                        
                        response.eventDataOut = {
                            responseBody : JSON.stringify(e.data.eventDataIn.responseJson),
                            responseOptions : { "status" : 200 , "statusText" : "OK", "headers" : e.data.eventDataIn.responseHeaders },
                        };
                    }
                    
                    e.source.postMessage(response, window.location.origin);
            }); 
            
            KellyTools.injectAddition('fetch', function() {});
            
            if (handler.getPosts().length > 0) return onLoad();
            
            handler.observer = new MutationObserver(function(mutations) {
                
                if (mutations.length > 0 && document.body.querySelector('.post-card')) {
                    handler.observer.disconnect();
                    handler.initPosts(onLoad); 
                }                
            });
            
            handler.observer.observe(document.getElementById('root'), {childList: true, subtree: true});
        }
        
        handler.initPosts = function(onInit) {
            
            var post = document.body.querySelectorAll('.post-card'), postValid = [];
            for (var i = 0; i < post.length; i++) {
                
                var link = post[i].querySelector('.post-footer a.ant-btn.ant-btn-text');
                if (link) {
                    link.classList.add(handler.className + '-post-link'); 
                    post[i].classList.add(handler.className + '-post');
                } else {
                    var linkButton = post[i].querySelector('.post-footer button.ant-dropdown-trigger'), postId = post[i].querySelector('.kelly-post-id');
                    if (linkButton && postId) {
                        link = document.createElement('A');
                        link.className = handler.className + '-post-link';
                        link.href = '/post/' + postId.getAttribute('data-id');
                        linkButton.parentNode.insertBefore(link, linkButton); 
                        post[i].classList.add(handler.className + '-post');
                    }
                }
            }
            
            onInit();
        }
        
        handler.getPosts = function(container) {
            if (!container) container = document;
            return document.getElementsByClassName(handler.className + '-post');
        }
        
        handler.getAllMedia = function(publication) {
            
            var data = [], content = KellyTools.getElementByClass(publication,publication.classList.contains('comment') ? 'comment-content' : 'post-content');
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
        
        handler.getCommentText = function(comment) {
            var contentContainer = comment.querySelector('.comment-content');
            if (contentContainer) return KellyTools.getElementText(contentContainer);
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
        
        handler.formatComments = function(block) {
            
            if (handler.fav.getGlobal('fav').coptions.hideAddToFav) return;
            
            var comments = block.getElementsByClassName('comment');        
            for(var i = 0; i < comments.length; i++) {
                 
                var link = KellyTools.getRelativeUrl(handler.getCommentLink(comments[i]));
                if (!link) continue;
                
                var addToFavButton = comments[i].getElementsByClassName(handler.className + '-addToFavComment');            
                if (!addToFavButton.length) {
            
                    var bottomLink = comments[i].getElementsByClassName('comment-link');

                    addToFavButton = document.createElement('a');
                    addToFavButton.href = '#';
                    addToFavButton.className = handler.hostClass + ' ' + handler.className + '-addToFavComment';
                    bottomLink[0].parentNode.insertBefore(addToFavButton, bottomLink[0].nextSibling);                     
                }         
                
                handler.updateCommentAddToFavButtonState(block, comments[i], link);
            }
            
            KellyTools.log('formatComments : ' + comments.length + ' - '+ block.id);
        }    
        
        handler.initUpdateWatcher = function() {
            
            handler.observer = new MutationObserver(function(mutations) {

                for (var i = 0; i < mutations.length; i++) {
                    
                   if (mutations[i].target.classList.contains('content')) {
                        var post = KellyTools.getParentByClass(mutations[i].target, handler.className + '-post');
                        if (post) {
                            handler.formatComments(post);
                        }
                        
                        return;
                        
                   } else if (mutations[i].target.classList.contains(handler.mainContainerClass)) {
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
// part of KellyFavItems extension
// JoyReactor environment driver

function KellyProfileJoyreactor() {
        
    var handler = this;
    
    var favPageUrlTpl = {
        tag : '/tag/__CONTENTNAME__/__PAGENUMBER__',
        tag_all : '/tag/__CONTENTNAME__/all/__PAGENUMBER__',
        favorite : '/user/__CONTENTNAME__/favorite/__PAGENUMBER__',
    }
    
    this.hostList = [
        "joyreactor.cc", 
        "reactor.cc", 
        "joyreactor.com",
        "jr-proxy.com",
        "jrproxy.com",
        "cookreactor.com",
        "pornreactor.cc",
        "thatpervert.com",
        "fapreactor.com",
        "safereactor.cc",
    ];
	
    this.profile = 'joyreactor';
    this.className = 'kelly-jr-ui'; // base class for every extension container \ element
    
    this.sidebarConfig = {
        topMax : 0,
        paddingTop : 24,
        nDisabled : -1, // 1 - sidebar not found or hidden (jras - sidebar can be hidden)
    };
    
    this.fav = false;
    var publications = false, commentsBlockTimer = [];
    
    /* imp */
    
    this.setLocation = function(location) {
        
        handler.location = {
            protocol : location.protocol,
            host : location.host,
            href : location.href,
            domain : null, // subdomain without fandom level
        };
        
        var hostParts = location.host.split('.');        
        if (hostParts.length >= 2) {
            
            handler.location.domain  = hostParts[hostParts.length-2];
            handler.location.domain += '.' + hostParts[hostParts.length-1];           
        } else {
            
            handler.location.domain = handler.location.host;
        }
        
        handler.hostClass = handler.className + '-' + hostParts.join("-");
    }
    
    this.isNSFW = function() {
        
        var sfw = KellyTools.getElementByClass(document, 'sswither');        
        if (sfw && sfw.className.indexOf('active') != -1) return false;
        else return true;
    }
    
    /* imp */
    
    this.getPostLinkEl = function(publication) {
        
        var selector = handler.location.host != 'old.reactor.cc' ? '.ufoot_first .link_wr a' : '.ufoot [title="ссылка на пост"]';

        return publication.querySelector(selector);
    }
    
    // get canonical url link in format "//url"
    
    this.getPostLink = function(publication, el) {
        
        if (!el) el = handler.getPostLinkEl(publication);
    
        if (el) {
            var link = el.href.match(/[A-Za-z.0-9]+\/post\/[0-9]+/g);
            return link ? '//' + link[0] : false;
        }
        
        return '';    
    }   
    
    this.getPosts = function(container) {
        
        if (!container) container = document;        
        return container.getElementsByClassName('postContainer');
    }
    
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
                tagList : document.getElementById('tagList'),   // helps to detect lowest position of sideBar by Y (top), only for updateSidebarPosition()
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
            calls on document.ready, or if getPosts find some data
            if return true prevent native init environment logic (initFormatPage -> InitWorktop)
        */        
        
        onPageReady : function() {
            
            publications = handler.getPosts();            
            return false;
        },
        
        /* 
            calls after extension resources is loaded
            if return true prevent native init worktop logic (image viewer initialization)
        */     
        
        onInitWorktop : function() {
            return false;
        },
        
        onExtensionReady : function() {
                
            handler.sidebarConfig.topMax = handler.getMainContainers().siteContent.getBoundingClientRect().top + KellyTools.getScrollTop();            
            updateFastSaveButtonsState();

            KellyTools.addEventPListener(window, "resize", updateSidebarPosition, '_fav_dialog');
            KellyTools.addEventPListener(window, "scroll", function (e) {                
                updateSidebarPosition();                
                updateFastSaveButtonsState();                
            }, '_fav_dialog');
            
            // get fandom css for buttons
            
            if ( document.getElementById('searchBar') && (
                (handler.location.domain == 'joyreactor.cc' && handler.location.host != 'top.joyreactor.cc') ||
                (handler.location.domain == 'reactor.cc' && handler.location.host != 'old.reactor.cc'))
               ) {

                var bar = document.getElementById('searchBar'), style = { bg : window.getComputedStyle(bar).backgroundColor };                                    
                var css = "\n\r\n\r\n\r" + '/* ' +  handler.profile + '-dynamic */' + "\n\r\n\r\n\r";
                    
                if (style.bg && style.bg.indexOf('0, 0, 0, 0') == -1) {
                    
                    css += '.' + handler.className + '-bgcolor-dynamic {background-color : ' + style.bg + '!important;}';
                    css += '.active .' + handler.className + '-buttoncolor-dynamic,\
                            .active.' + handler.className + '-buttoncolor-dynamic,\
                            .' + handler.className + '-ahover-dynamic:hover .' + handler.className + '-buttoncolor-dynamic,\
                            .' + handler.className + '-ahover-dynamic .' + handler.className + '-buttoncolor-dynamic:hover \
                            { background-color : ' + style.bg + '!important; }';
                                  
                    css += '.' + handler.className + '-buttoncolor-any-dynamic { background-color : ' + style.bg + '!important; }';
                }
                               
                handler.fav.addCss(css);
                        
            }
            
            handler.fav.showNativeFavoritePageInfo();
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
        
        onSideBarUpdate : function() {
            
            updateSidebarPosition();
        },
        
        onOptionsUpdate : function(refreshPosts) {
            
            if (refreshPosts) {
                
                var old = document.querySelectorAll('.' + handler.className + '-post-button-base');
                for (var i = 0; i < old.length; i++) {
                    if (old[i].parentNode) old[i].parentNode.removeChild(old[i]);                
                }
                
                handler.fav.formatPostContainers(); 
                return true;
            }
        },
        
        onShowFavouriteImages : function(imagesAsDownloadItems) {
            
            var notice = false;
            if (!handler.fav.isDownloadSupported) {
                if (imagesAsDownloadItems) {                    
                    notice = KellyLoc.s('', 'downloader_not_supported' + ( handler.hostClass == 'options_page' ? '_options' : ''), {ENV_URL : handler.location.href, ENV_URL_TITLE : handler.location.host});                    
                } else if (handler.hostClass == 'options_page') {                    
                    notice = KellyLoc.s('', 'show_images_options_notice', {ENV_URL : handler.location.href, ENV_URL_TITLE : handler.location.host});
                }
            }  

            if (notice !== false) {
                
                var tooltip = handler.fav.getTooltip();
                    tooltip.resetToDefaultOptions();                        
                    tooltip.setMessage(notice);                        
                    tooltip.show(true); 
                    
                handler.fav.tooltipBeasy = true; 
            }           
        },
                    
        onBeforeGoToFavPage : function(newPage) {
              
            var autoScrollRow = handler.fav.getGlobal('fav').coptions.grid.autoScroll;            
            if (autoScrollRow) {
                
                var tiles = handler.fav.getImageGrid().getTiles();   
                if (tiles && tiles.length) {
                    
                    var scrollTop = KellyTools.getScrollTop(), screenBottom = scrollTop + KellyTools.getViewport().screenHeight;
                    var currentRow = 0, topItemBounds = false;
                    
                    for (var i = 0; i < tiles.length; i++) {
                        
                        if (tiles[i].className.indexOf('grid-last') == -1) continue;
                        
                        var itemBounds = tiles[i].getBoundingClientRect();
                        if (!topItemBounds) topItemBounds = itemBounds;                        
                        
                        if (itemBounds.top + scrollTop < screenBottom) {
                            currentRow++;
                        }
                    }
                    
                    if (topItemBounds && currentRow >= autoScrollRow) window.scrollTo(0, topItemBounds.top + scrollTop - 90);
                }
            }

        }        
    
    }
    
    function syncFav(publication, inFav) {        
        var item = publication.querySelector('.favorite_link');
        if (!item) return;        
        
        if (inFav && item.className.indexOf(' favorite') == -1) {                
            KellyTools.dispatchEvent(item);
        } else if (!inFav && item.className.indexOf(' favorite') != -1) {                
            KellyTools.dispatchEvent(item);
        }
    }
        
    function getMainImage(publication, content) {
        
        if (!publication) return false;
        
        var mainImage = false;
        var validateTextContent = function(input) {
            var output = "";
            for (var i=0; i < input.length; i++) {
                
                if (input.charCodeAt(i) > 127) continue;
                
                if (input.charAt(i) == "\\") output += "\\\\"; 
                else output += input.charAt(i);
            }
            
            return output;
        }
        
        var schemaOrg = publication.querySelector('script[type="application/ld+json"]');
        
        if (schemaOrg) schemaOrg = schemaOrg.textContent.trim();
        if (schemaOrg) schemaOrg = validateTextContent(schemaOrg);
        
        if (schemaOrg && schemaOrg.indexOf('//schema.org') != -1) {
    
            mainImage = KellyTools.parseJSON(schemaOrg);
            if (mainImage && mainImage.image) {
                mainImage = mainImage.image;
                mainImage.url = handler.getImageDownloadLink(mainImage.url, false);
                if (!mainImage.url || !mainImage.width || !mainImage.height) {
                    mainImage = false;
                }
            } else {
                mainImage = false;
                KellyTools.log('parse json data fail : ' + schemaOrg, 'profile getMainImage');               
            }
        }

        if (mainImage) mainImage.schemaOrg = true;        
        return mainImage;
    }
    
    function getCommentsList(postBlock) {    
        
        var comments = postBlock.getElementsByClassName('comment');
        if (comments.length) return comments;

        return false;               
    }
    
    function getPostUserName(publication) {
        var nameContainer = KellyTools.getElementByClass(publication, 'uhead_nick');
        if (nameContainer) {
            var img = KellyTools.getElementByClass(publication, 'avatar');
            if (img) return img.getAttribute('alt');
        }
        
        return false;
    }
    
    function getCommentUserName(comment) {
        var nameContainer = KellyTools.getElementByClass(comment, 'reply-link');
        if (nameContainer) {   
            var a = KellyTools.getElementByTag(nameContainer, 'A');
            if (a) return a.textContent || a.innerText || '';
        }
        
        return false;
    }
    
    function updateFastSaveButtonsState() {
        
        var options = handler.fav.getGlobal('fav');        
        if (!handler.fav.isDownloadSupported || !options.coptions.fastsave.enabled || !options.coptions.fastsave.check || !publications || !publications.length) {
            return false;
        }
        
        var scrollBottom = KellyTools.getViewport().screenHeight + KellyTools.getScrollTop();        
        var updatePublicationFastButton = function(publication) {
            
            var button = KellyTools.getElementByClass(publication, handler.className + '-fast-save-unchecked');           
            if (!button) return;
            
            if (button.getBoundingClientRect().top < scrollBottom + 100) {
                
                button.classList.remove(handler.className + '-fast-save-unchecked');
                
                handler.fav.getFastSave().downloadCheckState(publication, function(state) {
                    button.classList.add(handler.className + '-fast-save-' + state);
                });
            } 
        }
        
        for (var i = 0; i < publications.length; i++) updatePublicationFastButton(publications[i]);
    }

    function isPostCensored(postBlock) {
        return (postBlock.innerHTML.indexOf('/images/censorship') != -1 || postBlock.innerHTML.indexOf('/images/unsafe_ru') != -1) ? true : false;
    }

    function updateSidebarProportions(sideBarWrap) {
        
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
        if (!sideBarWrap || sideBarWrap.className.indexOf('hidden') !== -1) return false;
            
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
            if (handler.hostClass.indexOf('old') == -1) widthBase = 24;
            
            sideBarWrap.style.right = 'auto';
            sideBarWrap.style.left = Math.round(sideBlockBounds.left + scrollLeft) + 'px';
            sideBarWrap.style.width = Math.round(sideBlockBounds.width + widthBase) + 'px';
            
        } else {            
            sideBarWrap.style.right = '20px';
            sideBarWrap.style.left = 'auto';
        }		
        
        var tagList = handler.getMainContainers().tagList;
        if (tagList) {
            
            var sideBarWrapBounds = sideBarWrap.getBoundingClientRect();
            var bottomLimit = tagList.getBoundingClientRect().top + scrollTop;
            
            if (sideBarWrapBounds.height + sideBarWrapBounds.top + scrollTop >= bottomLimit) {
                var newTop = bottomLimit - sideBarWrapBounds.height;
                if (topMax < newTop)  sideBarWrap.style.top = newTop + 'px';
            }
        }
    }
    
    function updateAddToFavButton(postBlock, shareButtonsBlock, side) {
         
        var link = handler.getPostLinkEl(postBlock);        
        if (!link) {            
            KellyTools.log('empty post link element', 'profile updatePostFavButton');
            return false;        
        }
        
        var linkUrl = handler.getPostLink(postBlock, link);
        if (!linkUrl) {
            KellyTools.log('bad post url', 'profile updatePostFavButton');
            return false;  
        }
        
        var sideName = side ? 'sidebar' : 'post';
        var className =  handler.className + '-' + sideName + '-addtofav';
       
        var addToFav = KellyTools.getElementByClass(postBlock, className);        
        if (!addToFav) {
            
            if (side) {
                addToFav = document.createElement('DIV'); 
                addToFav.className =  handler.hostClass + ' ' + handler.className + '-post-button-base ' + handler.className + '-icon-diskete ' + className;
                     
                shareButtonsBlock.appendChild(addToFav);
            } else {
                
                addToFav = document.createElement('span');
                addToFav.className = handler.hostClass + ' ' + handler.className + '-post-button-base ' + handler.className + '-link';
                
                // keep same url as main button, to dont loose getPostLink method functional and keep similar environment
                
                KellyTools.setHTMLData(addToFav, '<a href="#" class="' + className + '" href="' + link.href + '"></a>');
                               
                link.parentElement.parentElement.insertBefore(addToFav, link.parentElement); 
                addToFav = KellyTools.getElementByClass(addToFav, className);
            }           
        }         
        
        var postIndex = handler.fav.getStorageManager().searchItem(handler.fav.getGlobal('fav'), {link : linkUrl, commentLink : false});
        var action = postIndex !== false ? 'remove_from' : 'add_to';  
        var onAction = function(remove) {
            if (handler.fav.getGlobal('fav').coptions.syncByAdd) syncFav(postBlock, false);
            if (remove) handler.fav.closeSidebar(); 
            
            handler.formatPostContainer(postBlock); 
        }
        
        addToFav.onclick = function() { 
            handler.fav.showAddToFavDialog(action == 'remove_from' ? postIndex : postBlock, false, onAction, function() {onAction(true)});
            return false; 
        };
                      
        KellyTools.classList(action == 'remove_from' ? 'add' : 'remove', addToFav, handler.className + '-' + sideName + '-addtofav-added');
        
        if (side) addToFav.title = KellyLoc.s('', action + '_fav_tip');
        else addToFav.innerText = KellyLoc.s('', action + '_fav'); 
        
        return addToFav;
    }
    
    // todo get post text?
    
    this.getCommentText = function(comment) {
        
        var contentContainer = comment.querySelector('.txt > div');
        if (contentContainer && !contentContainer.className) return KellyTools.getElementText(contentContainer);
        
        var contentContainer = comment.querySelector('.txt > span');
        if (contentContainer && !contentContainer.className) return KellyTools.getElementText(contentContainer);
        
        for (var i = 0; i < comment.childNodes.length; i++) {
            if (comment.childNodes[i].tagName && 
                ['div', 'span'].indexOf(comment.childNodes[i].tagName.toLowerCase()) != -1 &&
                !comment.childNodes[i].className
            ) {
                return KellyTools.getElementText(comment.childNodes[i]);
            }
        }
             
    }
        
    this.formatComments = function(block) {
    
        var comments = getCommentsList(block);
        if (!comments) return false;
        
        var blackList = handler.fav.getGlobal('fav').coptions.comments_blacklist;
        
        for(var i = 0; i < comments.length; i++) {
                                    
            if (blackList) {  
                var userName = getCommentUserName(comments[i]);
                if (blackList.indexOf(userName) != -1) { 
                    comments[i].style.display = 'none';            
                    continue;
                }
            }
                    
            var link = KellyTools.getRelativeUrl(handler.getCommentLink(comments[i]));
            if (!link) continue;
            
            var addToFavButton = comments[i].getElementsByClassName(handler.className + '-addToFavComment');            
            if (!addToFavButton.length) {
        
                var bottomLink = comments[i].getElementsByClassName('reply-link');
                var linksPlaceholder = false;
                
                if (!bottomLink.length) {
                    bottomLink = comments[i].getElementsByClassName('comment_link');    
                    if (bottomLink.length) {
                        linksPlaceholder = bottomLink[0].parentElement;
                    }                        
                } else {
                    linksPlaceholder = bottomLink[0];
                }
                
                if (linksPlaceholder) {
                
                    addToFavButton = document.createElement('a');
                    addToFavButton.href = '#';                    
                    addToFavButton.innerText = '';
                    addToFavButton.className = handler.hostClass + ' ' + handler.className + '-addToFavComment';
            
                    linksPlaceholder.appendChild(addToFavButton);
                    // responseButton.parentNode.inserBefore(addToFavButton, responseButton.nextSibling) insert after
                } else {
                     KellyTools.log('formatComments : cant find placeholder for append "Add to fav button"'); 
                }
                
            } else {
                addToFavButton = addToFavButton[0];
            }            
            
            addToFavButton.innerText = KellyLoc.s('в избранное', 'add_to_fav_comment');
            addToFavButton.removeAttribute('data-item-index');
            
            var inFav = handler.fav.getStorageManager().searchItem(handler.fav.getGlobal('fav'), {link : false, commentLink : link}); // search comment by link            
            if (inFav !== false) {
                addToFavButton.setAttribute('data-item-index', inFav);
                addToFavButton.innerText = KellyLoc.s('удалить из избранного', 'remove_from_fav_comment');
            }
            
            addToFavButton.onclick =  function() {
                var itemIndex = this.getAttribute('data-item-index');
                var onUpdateItem = function() { handler.formatComments(block); }
                var comment = KellyTools.getParentByClass(this, 'comment');
                if (comment) handler.fav.showAddToFavDialog(itemIndex ? parseInt(itemIndex) : block, comment, onUpdateItem, onUpdateItem);
                return false;					
            }
        }
        
        KellyTools.log('formatComments : ' + comments.length + ' - '+ block.id);
    }    
        
    this.formatPostContainer = function(postBlock) {
        
        var coptions = handler.fav.getGlobal('fav').coptions;
        var blackList = coptions.posts_blacklist;        
        if (blackList) {  
            var userName = getPostUserName(postBlock);
            if (blackList.indexOf(userName) != -1) { 
                postBlock.style.display = 'none';            
                return false;
            }
        }
        
        var shareButtonsBlock = KellyTools.getElementByClass(postBlock, 'share_buttons');        
        if (!shareButtonsBlock) {
            KellyTools.log('formatPostContainer : cant find placeholder for append "Add to fav button"'); 
            return false;
        }
                  
        var addToFav = updateAddToFavButton(postBlock, shareButtonsBlock, coptions.addToFavSide);        
        if (!addToFav) {
            return false;
        }
        
        var fastSave = handler.fav.getFastSave();
        if (!isPostCensored(postBlock)) {                           
            fastSave.showFastSaveButton(postBlock, shareButtonsBlock, coptions.fastsave.enabled, false, handler.className);   
            fastSave.showFastSaveButton(postBlock, shareButtonsBlock, coptions.fastsave.configurableEnabled, true, handler.className);            
        }

        var toogleCommentsButton = postBlock.getElementsByClassName('toggleComments');

        if (toogleCommentsButton.length) {
            toogleCommentsButton = toogleCommentsButton[0];
            
            KellyTools.removeEventPListener(toogleCommentsButton, 'click', 'toogle_comments_' + postBlock.id);                                
            KellyTools.addEventPListener(toogleCommentsButton, "click", function (e) {
                
                if (commentsBlockTimer[postBlock.id]) return false;
                
                commentsBlockTimer[postBlock.id] = setInterval(function() {
                      if (postBlock.getElementsByClassName('comment_list_post').length > 0) {
                          clearInterval(commentsBlockTimer[postBlock.id]);
                          commentsBlockTimer[postBlock.id] = false;
                          handler.formatComments(postBlock);
                      }
                }, 100);
                
                return false;
                
            }, 'toogle_comments_' + postBlock.id);
        }
        
        handler.formatComments(postBlock);     
                
        if (coptions.hideSoc) {
            var shareButtons = shareButtonsBlock.childNodes;
            for (var i = 0; i < shareButtons.length; i++) {            
                if (shareButtons[i].tagName == 'A' && shareButtons[i].className.indexOf('share') != -1) {
                    // keep technically alive
                    shareButtons[i].setAttribute('style', 'height : 0px; width : 0px; opacity : 0; margin : 0px; padding : 0px; display : block; overflow : hidden;');
                }
            }
        }
    }   
       
    /* not imp */
    
    this.getPostTags = function(publication, limitTags) {
        
        if (!limitTags) limitTags = false;
        
        var tags = [];
        var nativeTags = KellyTools.getElementByClass(publication, 'taglist');
        if (!nativeTags) return tags;
        
        var nativeTags = nativeTags.getElementsByTagName('A');
        if (!nativeTags || !nativeTags.length) return tags;        
        
        for (var i = 0; i < nativeTags.length; i++) {
           var tagName = nativeTags[i].innerHTML.trim(); 
           if (!tagName) continue;
           
           tags[tags.length] = tagName;
           if (limitTags && tags.length >= limitTags) return tags;
        }
        
        return tags;
    }
        
    /* imp */
    // get canonical comment url link in format "//url"
    
    this.getCommentLink = function(comment) {
        
        if (!comment) return '';
        
        var links = comment.getElementsByTagName('a');
        
        for (var b = 0; b < links.length; b++) {
            if (links[b].href.length > 10 && links[b].href.indexOf('#comment') != -1) {
                var link = links[b].href.match(/[A-Za-z.0-9]+\/post\/[0-9]+#comment[0-9]+/g);
                return link ? '//' + link[0] : false;
            }
        }
        
        return '';
    }
    
    /* imp */
    
    this.getAllMedia = function(publication) {
        
        var data = [], content = false;
        if (!publication) return data;
        
        // highlited comments - <div class="comment hightlighted filled">[...]</div> | common comments    - <div class="comment"><div class="txt">[...]</div></div>
            
        content = publication.className.indexOf('comment') != -1 ? publication : KellyTools.getElementByClass(publication, 'post_content');
        if (!content || isPostCensored(publication)) return data;
        
        var mainImage = getMainImage(publication, content);      
        var imagesEl = content.getElementsByClassName('image');
        
        for (var i = 0; i < imagesEl.length; i++) {
            
            var image = '';
            
            if (imagesEl[i].innerHTML.indexOf('gif_source') !== -1) {
                
                // extended gif info for fast get dimensions \ keep gif unloaded until thats needed
                var gifSrc = imagesEl[i].getElementsByTagName('a');  
                if (gifSrc && gifSrc.length) {
                    for (var b = 0; b < gifSrc.length; gifSrc++) {
                        if (gifSrc[b].className.indexOf('gif_source') != -1) {
                            image = handler.getImageDownloadLink(gifSrc[b].getAttribute("href"), false);
                            break;
                        }
                    }
                }
                
            } else {
            
                var imageEl = KellyTools.getElementByTag(imagesEl[i], 'img');
                if (imageEl) {
                    image = handler.getImageDownloadLink(imageEl.getAttribute("src"), false);
                }     
            }
            
            if (image) data.push(image);
            
            // todo test assoc main image with gifs
            
            if (data.length == 1 && image && mainImage && image.indexOf(handler.getImageDownloadLink(mainImage.url, false)) != -1) {
                handler.fav.setSelectionInfo('dimensions', mainImage);
            } else if (data.length == 1 && image && mainImage) {                
                KellyTools.log('Main image in schema org for publication is exist, but not mutched with detected first image in publication');    
                KellyTools.log(image);
                KellyTools.log(handler.getImageDownloadLink(mainImage.url, false));                           
            }
        }
        
        if (!data.length && mainImage) {
            
            mainImage.url = handler.getImageDownloadLink(mainImage.url, false);
            data.push(mainImage.url);
            
            handler.fav.setSelectionInfo('dimensions', mainImage);
        }
        
        return data; //  return decodeURIComponent(url);
    }
    
    /* imp */
    // route format
    // [image-server-subdomain].[domain]/pics/[comment|post]/[full|animation format]/[title]-[image-id].[extension]
    // format - animation file format in request - optional, unvalidated, used for video formats in downloader
    
    this.getImageDownloadLink = function(url, full, format) {
        
             url = url.trim();
        if (!url || url.length < 10) return url;
        
        // for correct download process we must keep same domain for image
        // to avoid show copyright \ watermarks
    
        var imgServer = url.match(/img(\d+)/);
        if (imgServer &&  imgServer.length) {
            
            // encoded original file name, decoded untested but may be work
            var filename = KellyTools.getUrlFileName(url, false, true);
            if (!filename) return url;
            
            imgServer = imgServer[0];
            var type = url.indexOf('comment') == -1 ? 'post' : 'comment';
      
            if (format && ['mp4', 'webm'].indexOf(format) != -1) {                
                filename = filename.split('.')[0] + '.' + format;
                full = false;
            } else format = false;
            
            var host = handler.location.host;
                 if (handler.location.domain == 'reactor.cc') host = 'reactor.cc'; // prevent 301 redirect in fandoms for media requests
            else if (host == 'top.joyreactor.cc') host = 'joyreactor.cc';
            
            url  = handler.location.protocol + '//' + imgServer + '.' + host + '/pics/' + type + '/';
            url += (format ? format + '/' : '') + (full ? 'full/' : '') + filename;
        }
        
        
        return url;
    }
    
    /* imp */
    // return same url if not supported
    
    this.getStaticImage = function(url) {

        var imgServer = url.match(/img(\d+)/);
        if (imgServer &&  imgServer.length) {
            
            if (url.indexOf('static') !== -1 || url.indexOf('.gif') == -1) return url;
            
            url = url.replace('pics/comment/', 'pics/comment/static/');
            url = url.replace('post/', 'post/static/');
            url = url.replace('.gif', '.jpeg');
        }
        
        return url;
    },
    
    /* not imp */

    // Расширяет страницу формой грабера на этапе инициализации если страница соответствует условиям и возвращает информацию о странице
    // return false if not supported for page \ site
    
    this.getFavPageInfo = function() {
 
        var info = {
            pages : 1,
            items : 0,
            page : 1,
            route : false,
            url : false,
            contentName : false, // url decoded, todo - rename - Tag name or User name
            contentImg : false,
        }      
        
        if (handler.location.href.indexOf('/tag/') != -1) {
            
            info.route = 'tag';
            if (handler.location.href.indexOf('/all') != -1) {
                info.route = 'tag_all';
            }
                        
            var insertAfterEl = document.getElementById('blogHeader');
            if (insertAfterEl) {         
                info.contentImg = insertAfterEl.querySelector('.blog_avatar');                
            }
            
        } else if (handler.location.href.indexOf('/favorite') != -1) {
            
            info.route = 'favorite';            
            var insertAfterEl = KellyTools.getElementByClass(document, 'mainheader');
            if (insertAfterEl) {
                info.contentImg = document.querySelector('.sidebarContent .user img')
            }
            
        } else return false;
                
        if (!insertAfterEl) {
            return false;
        }  
        
        if (info.contentImg) info.contentImg = info.contentImg.src;
        
        var parts = handler.location.href.split('/');
        
        info.contentName = parts.indexOf(info.route == 'favorite' ? 'user' : 'tag');            
        if (info.contentName != -1 && info.contentName + 1 <= parts.length-1){
            info.contentName = parts[info.contentName+1];
        } else return false;
        
        info.url = handler.location.protocol + '//' + handler.location.host + favPageUrlTpl[info.route].replace('__CONTENTNAME__', info.contentName);        
        info.contentName = KellyTools.getUrlFileName(info.contentName);
        
        var posts = handler.getPosts();
        if (posts) info.items = posts.length;
        
        if (handler.location.host.indexOf('old.') != -1) {
            var pagination = document.getElementById('Pagination');
        } else {
            var pagination = KellyTools.getElementByClass(document, 'pagination_expanded'); 
        }  
        
        if (pagination) {
            
            var current = pagination.getElementsByClassName('current');            
            if (current) {                
                for (var i = 0; i < current.length; i++) {
                    if (parseInt(current[i].innerHTML)) {
                        info.page = parseInt(current[i].innerHTML);
                        break;
                    }
                }
            }
            
            if (info.page > info.pages) info.pages = info.page;
            
            var pages = pagination.getElementsByTagName('A');
            for (var i = 0; i < pages.length; i++) {
            
                var pageNum = parseInt(pages[i].innerHTML);
                if (info.pages < pageNum) info.pages = pageNum;   
                
            }
            
            info.items += (info.pages - 1) * 10;
        }
        
        
        info.container = KellyTools.getElementByClass(document, handler.className + '-exporter-wrap'); 
        if (!info.container) {        
            info.container = document.createElement('div');
            info.container.className = handler.hostClass + ' ' + handler.className + '-exporter-wrap ' + handler.className + '-exporter-wrap-' + info.route;
            
            insertAfterEl.parentNode.insertBefore(info.container, insertAfterEl.nextSibling);
        }
            
        return info;
    }

    
    /* imp */
    
    this.setFav = function(fav) {
        handler.fav = fav;
    }
     
    /* not imp */
    
    // for ignore pages and domains if needed, return main | ignore
    
    this.getInitAction = function() { 
    
        if (this.hostList.indexOf(this.location.domain) != -1 && !document.getElementById(this.className + '-mainCss')) {
            return 'main';
        } 
        
        return 'ignore';
    }
    
    /* not imp */
    
    this.getRecomendedDownloadSettings = function() {
        
        var browser = KellyTools.getBrowserName();
        
        if (browser == 'opera' || browser == 'chrome') {
            
            return { 
                transportMethod : KellyGrabber.TRANSPORT_BLOB, 
                requestMethod : KellyGrabber.REQUEST_XML 
            }
            
        } else {
            
            return { 
                transportMethod : KellyGrabber.TRANSPORT_BLOBBASE64, 
                requestMethod : KellyGrabber.REQUEST_IFRAME 
            }
            
        }
        
    }   
}

KellyProfileJoyreactor.getInstance = function() {
    if (typeof KellyProfileJoyreactor.self == 'undefined') {
        KellyProfileJoyreactor.self = new KellyProfileJoyreactor();
    }
    
    return KellyProfileJoyreactor.self;
}
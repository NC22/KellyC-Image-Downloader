// part of KellyFavItems extension
// JoyReactor environment driver

// default profile driver must be assign to K_DEFAULT_ENVIRONMENT variable
// todo environment only ui methods

function kellyProfileJoyreactor() {
        
    var handler = this;
    var favPageUrlTpl = '/user/__USERNAME__/favorite/__PAGENUMBER__';  
    var publicationClass = 'postContainer';
    
    var mainDomain = 'joyreactor.cc';    
    var mainContainers = false;
    
    var commentsBlockTimer = [];
    
    var sideBarPaddingTop = 24;
    var publications = false;
      
    /* imp */
    
    this.className = 'kellyJRFav'; 
    this.profile = 'joyreactor';        
    this.hostClass = window.location.host.split(".").join("_");
    
    this.actionVar = 'dkl_pp';
  
    this.fav = false;        
    this.events = {

        onWindowScroll : function() {
            
            updateFastSaveButtonsState();
            return false;
        },
        
        onWindowResize : function() {
            
            return false;
        },
        
        onPageReady : function() {
            
            publications = handler.getPosts();
            
            return false;
        },
        
        onInitWorktop : function() {
            
            updateFastSaveButtonsState();
            return false;
        },
        
        onExtensionReady : function() {
                     
            if (window.location.host == handler.mainDomain || window.location.host.indexOf('old.') == -1) {

                var bar = document.getElementById('searchBar');
                
                var style = {
                    bg : false,
                    btn : false,
                };
                
                if (bar) {
                    style.bg = window.getComputedStyle(bar).backgroundColor;
                    
                    var btn = bar.querySelector('.submenuitem.active a');
                    if (btn) {
                        style.btn = window.getComputedStyle(btn).backgroundColor;
                    }
                }
                
                css = "\n\r\n\r\n\r" + '/* ' +  handler.profile + '-dynamic */' + "\n\r\n\r\n\r";
                if (style.btn && style.btn.indexOf('0, 0, 0, 0') == -1) {
                    css += '.' + handler.className + '-basecolor-dynamic {';
                    css += 'background-color : ' + style.btn + '!important;';
                    css += '}';
                }
                
                if (style.bg && style.bg.indexOf('0, 0, 0, 0') == -1) {
                
                    css += '.active .' + handler.className + '-buttoncolor-dynamic, \
                            .active.' + handler.className + '-buttoncolor-dynamic, \
                            .' + handler.className + '-ahover-dynamic:hover .' + handler.className + '-buttoncolor-dynamic, \
                            .' + handler.className + '-ahover-dynamic .' + handler.className + '-buttoncolor-dynamic:hover \
                            {';
                            
                    css += 'background-color : ' + style.btn + '!important;';
                    css += '}';
                                        
                    css += '.' + handler.className + '-buttoncolor-any-dynamic {';
                    css += 'background-color : ' + style.btn + '!important;';
                    css += '}';
                }
                
                handler.fav.addCss(css);
            }
            
            handler.fav.showNativeFavoritePageInfo();
        },
        
        onSideBarShow : function() {
            
            var sideBarWrap = handler.fav.getSidebar();            
            if (!sideBarWrap || sideBarWrap.className.indexOf('hidden') !== -1) return false;
            
            var filters = KellyTools.getElementByClass(sideBarWrap, handler.className + '-FiltersMenu');     
            
            if (filters && filters.offsetHeight > 440 && filters.className.indexOf('calculated') == -1) {
                
                var filtersBlock = KellyTools.getElementByClass(sideBarWrap, handler.className + '-FiltersMenu-container');
                    
                filtersBlock.style.maxHeight = '0';
                filtersBlock.style.overflow = 'hidden';
                
                var modalBox = KellyTools.getElementByClass(document, handler.className + '-ModalBox-main');						
                    modalBox.style.minHeight = '0';

                var modalBoxHeight = modalBox.getBoundingClientRect().height;       
                
                var viewport = KellyTools.getViewport();
                if (viewport.screenHeight < modalBoxHeight + filters.offsetHeight + sideBarPaddingTop) {
                    filtersBlock.style.maxHeight = (viewport.screenHeight - modalBoxHeight - sideBarPaddingTop - 44 - sideBarPaddingTop) + 'px';
                    filtersBlock.style.overflowY = 'scroll';

                } else {
                        
                    filtersBlock.style.maxHeight = 'none';
                    filtersBlock.style.overflow = 'auto';
                }
                
                filters.className += ' calculated';
            }
        }
    
    }
    
    function updatePostFavButton(publication) {
        
        var link = getPostLinkEl(publication);
        
        if (!link) {            
            KellyTools.log('empty post link element', 'profile updatePostFavButton');
            return false;        
        }
        
        var linkUrl = handler.getPostLink(publication, link);
        if (!linkUrl) {
            KellyTools.log('bad post url', 'profile updatePostFavButton');
            return false;  
        }
        
        var inFav = handler.fav.getStorageManager().searchItem(handler.fav.getGlobal('fav'), {link : linkUrl, commentLink : false});
        
        var addToFav = KellyTools.getElementByClass(publication, handler.className + '-post-FavAdd');
    
        // create if not exist
        
        if (!addToFav) {
            
            addToFav = document.createElement('a');
            addToFav.className = handler.className + '-post-FavAdd';
            
            // keep same url as main button, to dont loose getPostLink method functional and keep similar environment
            addToFav.href = link.href; 
           
            var parentNode = link.parentNode;
                parentNode.insertBefore(addToFav, link);
        }
        
        // update title
        
        if (inFav !== false) {
                        
            addToFav.innerText = KellyLoc.s('Удалить из избранного', 'remove_from_fav');
            addToFav.onclick = function() { 
            
                handler.fav.showRemoveFromFavDialog(inFav, function() {
                    if (handler.fav.getGlobal('fav').coptions.syncByAdd) handler.syncFav(publication, false);
                    
                    handler.fav.closeSidebar(); 
                }); 
                
                return false; 
            };
            
        } else {
            
            addToFav.innerText = KellyLoc.s('Добавить в избранное', 'add_to_fav');
            addToFav.onclick = function() { 
                
                handler.fav.showAddToFavDialog(publication, false, function(selectedPost, selectedComment, selectedImages) {                    
                    
                    if (!selectedComment && handler.fav.getGlobal('fav').coptions.syncByAdd) {
                        handler.syncFav(selectedPost, true);
                    }                     
                });
                
                return false; 
            };
            
        }
                
        return true;            
    }
    
    
    function getPostLinkEl(publication) {
        
        if (window.location.host.indexOf('old.') == -1) {

            var link = KellyTools.getElementByClass(publication, 'link_wr');
            if (link) link = KellyTools.getChildByTag(link, 'a');
        } else {
            var link = publication.querySelector('[title="ссылка на пост"]');
        }		
        
        return link;
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
            
            // console.log(output);
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

        if (mainImage) {					
            mainImage.schemaOrg = true;
        }
        
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
        
        
        if (!handler.fav.isDownloadSupported || !options.coptions.fastsave.enabled || !options.coptions.fastsave.check) {
            return false;
        }
        
        if (!publications || !publications.length) return false;

        var scrollBottom = KellyTools.getViewport().scrollBottom;
        
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
        
        for (var i = 0; i < publications.length; i++) {
            
            if (!publications[i]) continue;
            
            updatePublicationFastButton(publications[i]);                    
        }
    }
    
    this.getCommentText = function(comment) {
    
        var contentContainer = KellyTools.getElementByClass(comment, 'txt');
        
        if (!contentContainer) return '';
        
        var textContainer = contentContainer.childNodes[0];
        return textContainer.textContent || textContainer.innerText || '';
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
        
            var addToFavButton = comments[i].getElementsByClassName(handler.className + '-addToFavComment');
            
            if (!addToFavButton.length) {
        
                var bottomLink = comments[i].getElementsByClassName('comment_link');
                if (bottomLink.length) {
                
                    addToFavButton = document.createElement('a');
                    addToFavButton.href = '#';
                    
                    addToFavButton.innerText = '';
                    
                    addToFavButton.setAttribute('commentId', comments[i].id);
                    addToFavButton.className = handler.className + '-addToFavComment';
            
                    bottomLink[0].parentElement.appendChild(addToFavButton);
                    // responseButton.parentNode.inserBefore(addToFavButton, responseButton.nextSibling) insert after
                }
            } else {
                addToFavButton = addToFavButton[0];
            }
            
            
            // searh comment by link
            var link = KellyTools.getRelativeUrl(handler.getCommentLink(comments[i]));
            if (!link) continue;
            
            var inFav = handler.fav.getStorageManager().searchItem(handler.fav.getGlobal('fav'), {link : false, commentLink : link});
    
            if (inFav !== false) {
                
                addToFavButton.setAttribute('itemIndex', inFav);
                addToFavButton.onclick = function() { 
                    handler.fav.showRemoveFromFavDialog(this.getAttribute('itemIndex')); 
                    return false;
                };
                
                addToFavButton.innerText = KellyLoc.s('удалить из избранного', 'remove_from_fav_comment');
                
            } else {
                                
                addToFavButton.onclick =  function() {		
                    var comment = KellyTools.getParentByClass(this, 'comment', true);
                    
                    // console.log(comment);
                    if (!comment) return false;
                   
                    handler.fav.showAddToFavDialog(block, comment);
                    return false;					
                }
                
                addToFavButton.innerText = KellyLoc.s('в избранное', 'add_to_fav_comment');
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
        
        var censored = postBlock.innerHTML.indexOf('/images/censorship') != -1 ? true : false;
        
        if (!updatePostFavButton(postBlock)) return false;    
        
        var toogleCommentsButton = postBlock.getElementsByClassName('toggleComments');

        if (toogleCommentsButton.length) {
            toogleCommentsButton = toogleCommentsButton[0];
            handler.fav.removeEventPListener(toogleCommentsButton, 'click', 'toogle_comments_' + postBlock.id);
            
            var onPostCommentsShowClick = function(postBlock, clearTimer) {
        
                if (clearTimer) {
                    commentsBlockTimer = false;
                    clearTimeout(commentsBlockTimer[postBlock.id]);
                }
                
                if (commentsBlockTimer[postBlock.id]) return false;
                
                var commentsBlock = postBlock.getElementsByClassName('comment_list_post'); // KellyTools.getElementByClass(postBlock, 'comment_list_post'); // check is block loaded  
                       
                if (!commentsBlock.length) { // todo exit after num iterations        
                    commentsBlockTimer[postBlock.id] = setTimeout(function() { onPostCommentsShowClick(postBlock, true); }, 100);
                    return false;
                }
                               
                handler.formatComments(postBlock);
                return false;
            }
                    
            handler.fav.addEventPListener(toogleCommentsButton, "click", function (e) {
                
                onPostCommentsShowClick(postBlock);                   
                return false;
                
            }, 'toogle_comments_' + postBlock.id);
        }
        
        handler.formatComments(postBlock);     
            
        var shareButtonsBlock = KellyTools.getElementByClass(postBlock, 'share_buttons');
        if (shareButtonsBlock) {
            
            var fastSave = KellyTools.getElementByClass(postBlock,  handler.className + '-fast-save');
            if (!censored && coptions.fastsave.enabled) {
                
                if (!fastSave) {
                    fastSave = document.createElement('DIV');                    
                    shareButtonsBlock.appendChild(fastSave); 
                        
                    var fastSaveBaseClass =  handler.hostClass + ' ' + handler.className + '-fast-save ' + handler.className + '-icon-diskete ';
                
                    fastSave.className = fastSaveBaseClass + handler.className + '-fast-save-unchecked';
                    fastSave.onclick = function() {
                        
                        if (this.className.indexOf('unavailable') != -1) return false;
                        
                        if (this.className.indexOf('loading') != -1) {
                            
                            handler.fav.getFastSave().downloadCancel();
                            fastSave.classList.remove(handler.className + '-fast-save-loading');                          
                            
                        } else {
                                    
                            var downloadEnabled = handler.fav.getFastSave().downloadPostData(postBlock, function(success) {
                                fastSave.classList.remove(handler.className + '-fast-save-loading');
                                fastSave.className = fastSaveBaseClass + handler.className + '-fast-save-' + (success ? '' : 'not') + 'downloaded';
                            });
                            
                            if (downloadEnabled) {
                                fastSave.classList.remove(handler.className + '-fast-save-unchecked');
                                fastSave.classList.add(handler.className + '-fast-save-loading');
                            }
                        }
                        
                        return false;
                    }  
                } 
                
            } else {
                if (fastSave) {
                    fastSave.parentNode.removeChild(fastSave);
                }
            }
            
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
    }   
            
    this.isNSFW = function() {
        
        var sfw = KellyTools.getElementByClass(document, 'sswither');
        
        if (sfw && sfw.className.indexOf('active') != -1) return false;
        else return true;
    }
    
    this.getMainContainers = function() {
        
        if (!mainContainers) {
            mainContainers = {
                
                // public
                
                body : document.getElementById('container'), // place where to put all dynamic absolute position elements
                content : document.getElementById('contentinner'), // place where to put main extension container
                
                // private
                
                sideBlock : document.getElementById('sidebar'),
                menu : document.getElementById('submenu'),
                tagList : document.getElementById('tagList'), // or check pageInner
            };
        }
        
        return mainContainers;
    }
    
    // will be replaced by formatPosts
    
    this.getPosts = function(container) {
        if (!container) container = document;
        
        return container.getElementsByClassName(publicationClass);
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
    // get canonical url link in format "//url"
    
    this.getPostLink = function(publication, el) {
        
        if (!el) el = getPostLinkEl(publication);
    
        if (el) {
            var link = el.href.match(/[A-Za-z.0-9]+\/post\/[0-9]+/g);
            return link ? '//' + link[0] : false;
        }
        
        return '';    
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
    
    /* not imp */
    
    this.updateSidebarPosition = function(lock) {
    
        if (!handler.fav) return false;
        
        var sideBarWrap = handler.fav.getView('sidebar');
        
        if (!sideBarWrap || sideBarWrap.className.indexOf('hidden') !== -1) return false;
    
        var sideBlock = handler.getMainContainers().sideBlock;        
        var sideBlockBounds = sideBlock.getBoundingClientRect();
        
        var scrollTop = KellyTools.getScrollTop();
        var scrollLeft = KellyTools.getScrollLeft();
        
        var top = 0;
        
        if (sideBlock) {
            top = sideBlockBounds.top + scrollTop;
        }
                    
        // screen.height / 2  - (sideBarWrap.getBoundingClientRect().height / 2) - 24
        
        if (!lock && sideBarPaddingTop + scrollTop > top) top = sideBarPaddingTop + scrollTop;
                
        sideBarWrap.style.top = top + 'px';
       
        var widthBase = 0;
        
        if (window.location.host.indexOf('old.') == -1) {
            widthBase = 24;
        }
        
        if (sideBlock) {
            sideBarWrap.style.right = 'auto';
            sideBarWrap.style.left = Math.round(sideBlockBounds.left + scrollLeft) + 'px';
            sideBarWrap.style.width = Math.round(sideBlockBounds.width + widthBase) + 'px';
        } else {
            sideBarWrap.right = '0px';
        }		
        
        var tagList = handler.getMainContainers().tagList;
        if (tagList) {
            
            var sideBarWrapBounds = sideBarWrap.getBoundingClientRect();
            var bottomLimit = tagList.getBoundingClientRect().top + scrollTop;
            
            if (sideBarWrapBounds.height + sideBarWrapBounds.top + scrollTop >= bottomLimit) {
                
                // console.log(sideBarWrapBounds.height + scrollTop)
                sideBarWrap.style.top = (bottomLimit - sideBarWrapBounds.height) + 'px';
            }
        }
        
        // tagList
    }
    
    /* imp */
    
    this.getAllMedia = function(publication) {
        
        var data = [];
        
        if (!publication) return data;
        
        var content = false;
        
        if (publication.className.indexOf('comment') != -1) {
            
            // highlited comments - <div class="comment hightlighted filled">[...]</div>
            // common comments    - <div class="comment"><div class="txt">[...]</div></div>
            
            content = publication;
            
        } else {
            content = KellyTools.getElementByClass(publication, 'post_content');
        }
        
        if (!content) return data;
        
        var mainImage = getMainImage(publication, content);
        
        // censored posts not contain post container and
        // /images/censorship/ru.png
        
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
            
            if (data.length == 1 && image && mainImage && image.indexOf(handler.getImageDownloadLink(mainImage.url, false, true)) != -1) {
                handler.fav.setSelectionInfo('dimensions', mainImage);
            } else if (data.length == 1 && image && mainImage) {                
                KellyTools.log('Main image in schema org for publication is exist, but not mutched with detected first image in publication');    
                KellyTools.log(image);
                KellyTools.log(handler.getImageDownloadLink(mainImage.url, false));                           
            }
        }
        
        console.log(imagesEl);
        console.log(data);

        if (!data.length && mainImage) {
            
            mainImage.url = handler.getImageDownloadLink(mainImage.url, false);
            data.push(mainImage.url);
            
            handler.fav.setSelectionInfo('dimensions', mainImage);
        }
        
        return data; //  return decodeURIComponent(url);
    }
    
    /* imp */
    // route format
    // [image-server-subdomain].[domain].cc/pics/[comment|post]/full/[title]-[image-id].[extension]
    
    this.getImageDownloadLink = function(url, full, relative) {
        
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
            url = window.location.protocol + '//' + imgServer + '.' + window.location.host + '/pics/' + type + '/' + (full ? 'full/' : '') + filename;
        }
        
        
        return url;
    }
    
    /* imp */
    // return same url if not supported
    
    this.getStaticImage = function(source) {

        if (source.indexOf('reactor') != -1) {
        
            if (source.indexOf('static') !== -1 || source.indexOf('.gif') == -1) return source;
            
            source = source.replace('pics/comment/', 'pics/comment/static/');
            source = source.replace('post/', 'post/static/');
            source = source.replace('.gif', '.jpeg');
        }
        
        return source;
    },
    
    /* not imp */
    // return false if not supported for page \ site
    
    this.getFavPageInfo = function() {
    
        var header = KellyTools.getElementByClass(document, 'mainheader');
        if (!header) {
            return false;
        }
        
        if (header.innerHTML.indexOf('Избранное') == -1) {
            return false;
        }
        
        var info = {
            pages : 1,
            items : 0,
            page : 1,
            header : header,
            url : false,
            userName : false,
        }
        
        var parts = window.location.href.split('/');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i] == 'user' && i+1 <= parts.length-1) {
                info.userName = parts[i+1];
                break;
            }
        }
        
        if (!info.userName) return false;
        
        info.url = '';
        info.url += window.location.origin + favPageUrlTpl;
        info.url = info.url.replace('__USERNAME__', info.userName);
        
        var posts = document.getElementsByClassName('postContainer');
        if (posts) info.items = posts.length;
        
        //(window.location.href.substr(window.location.href.length - 8) == 'favourite')
        
        if (window.location.host.indexOf('old.') != -1) {
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
        
        
        info.container = KellyTools.getElementByClass(document, handler.className + '-FavNativeInfo'); 
        if (!info.container) {
        
            info.container = document.createElement('div');
            info.container.className = handler.className + '-FavNativeInfo';
            
            info.header.parentNode.insertBefore(info.container, info.header.nextSibling);
        }
            
        return info;
    }
    
    /* imp */
     
    this.syncFav = function(publication, inFav) {        
        var item = publication.querySelector('.favorite_link');
        if (!item) return;
        
        
        if (inFav && item.className.indexOf(' favorite') == -1) {                
            KellyTools.dispatchEvent(item);
        } else if (!inFav && item.className.indexOf(' favorite') != -1) {                
            KellyTools.dispatchEvent(item);
        }
    }
    
    /* imp */
    
    this.setFav = function(fav) {
        handler.fav = fav;
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

kellyProfileJoyreactor.getInstance = function() {
    if (typeof kellyProfileJoyreactor.self == 'undefined') {
        kellyProfileJoyreactor.self = new kellyProfileJoyreactor();
    }
    
    return kellyProfileJoyreactor.self;
}


var K_DEFAULT_ENVIRONMENT = kellyProfileJoyreactor.getInstance();


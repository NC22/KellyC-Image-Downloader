// !@ - not required by FavItems object methods	
// default profile object, move to separate file in future
// todo move formatcomment \ formatpost

var K_ENVIRONMENT = {
    
    fav : false, 
    
    className : 'kellyJRFav', 
    profile : 'joyreactor',
    mainDomain : 'joyreactor.cc',
    favPage : '/user/__USERNAME__/favorite/__PAGENUMBER__',
    
    publication : 'postContainer',
    menu : 'submenu',
    
    hostClass : window.location.host.split(".").join("_"),
    
    actionVar : 'dkl_pp', 
    containers : false,

    isNSFW : function() {
        var sfw = KellyTools.getElementByClass(document, 'sswither');
        if (sfw && sfw.className.indexOf('active') != -1) return false;
        else return true;
    },
    
    getMainContainers : function() {
        
        if (!this.containers) {
            this.containers = {
                body : document.getElementById('container'),
                content : document.getElementById('contentinner'),
                sideBlock : document.getElementById('sidebar'),
            };
        }
        
        return this.containers;
    },
   
    /* @! */        
    getPostTags : function(publication, limitTags) {
        
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
    },
    
    getPostLink : function(publication) {
        
        if (window.location.host.indexOf('old.') == -1) {

            var link = KellyTools.getElementByClass(publication, 'link_wr');
            if (link) return KellyTools.getChildByTag(link, 'a');
        } else {
            return publication.querySelector('[title="ссылка на пост"]');
        }			
    
    },
    
    getAllMedia : function(publication) {
        
        var data = [];
        
        if (!publication) return data;
        
        var content = false;
        
        if (publication.className.indexOf('comment') != -1) {
            content = KellyTools.getElementByClass(publication, 'txt');
        } else {
            content = KellyTools.getElementByClass(publication, 'post_content');
        }
        
        if (!content) return data;
        
        var mainImage = this.getMainImage(publication, content);
        
        // censored posts not contain post container and
        // /images/censorship/ru.png
        
        var imagesEl = content.getElementsByClassName('image');
        
        for (var i = 0; i < imagesEl.length; i++) {
            
            var image = '';
            
            if (imagesEl[i].innerHTML.indexOf('gif_source') !== -1) {
                
                // extended gif info for fast get dimensions \ keep gif unloaded until thats needed
                var gif = KellyTools.getElementByTag(imagesEl[i], 'a');                
                if (gif) {
                    image = this.getImageDownloadLink(gif.getAttribute("href"), false);
                }
                
            } else {
            
                var imageEl = KellyTools.getElementByTag(imagesEl[i], 'img');
                if (imageEl) {
                    image = this.getImageDownloadLink(imageEl.getAttribute("src"), false);
                }     
            }
            
            if (image) data.push(image);
            
            // todo test assoc main image with gifs
            
            if (data.length == 1 && image && mainImage && image.indexOf(this.getImageDownloadLink(mainImage.url, false, true)) != -1) {
                this.fav.setSelectionInfo('dimensions', mainImage);
            } else if (data.length == 1 && image && mainImage) {
                KellyTools.log(image);
                KellyTools.log(this.getImageDownloadLink(mainImage.url, false));
            }
        }

        if (!data.length && mainImage) {
            
            mainImage.url = this.getImageDownloadLink(mainImage.url, false);
            data.push(mainImage.url);
            
            this.fav.setSelectionInfo('dimensions', mainImage);
        }
        
        return data; //  return decodeURIComponent(url);
    },		
    
    /* @! */
    getMainImage : function(publication, content) {
        
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
        
        try {
            var schemaOrg = publication.querySelector('script[type="application/ld+json"]');
            
            if (schemaOrg) schemaOrg = schemaOrg.textContent.trim();
            if (schemaOrg) schemaOrg = validateTextContent(schemaOrg);
            
            if (schemaOrg && schemaOrg.indexOf('//schema.org') != -1) {
        
                mainImage = JSON.parse(schemaOrg);
                if (mainImage && mainImage.image) {
                    mainImage = mainImage.image;
                    mainImage.url = this.getImageDownloadLink(mainImage.url, false);
                    if (!mainImage.url || !mainImage.width || !mainImage.height) {
                        mainImage = false;
                    }
                } else mainImage = false;
            }

        } catch (e) {
            mainImage = false;
            KellyTools.log(e, 'profile getMainImage');
            if (schemaOrg) {
                KellyTools.log(schemaOrg, 'profile getMainImage json data');
            }
        }
        
        if (mainImage) {					
            mainImage.schemaOrg = true;
        }
        
        return mainImage;
    },
    
    // route format
    // [image-server-subdomain].[domain].cc/pics/post/full/[title]-[image-id].[extension]
    
    getImageDownloadLink : function(url, full, relative) {
        
             url = url.trim();
        if (!url || url.length < 10) return url;
        
        // for correct download process we must keep same domain for image
        // to avoid show copyright \ watermarks
    
        var imgServer = url.match(/img(\d+)/);
        if (imgServer &&  imgServer.length) {
            
            imgServer = imgServer[0];
            
            var relativeUrl = url.replace('http://', '');
                relativeUrl = relativeUrl.replace('https://', '');
                relativeUrl = relativeUrl.replace('//', '');
                
            var slash = relativeUrl.indexOf('/');
            
            if (slash > 0) { 
                relativeUrl = relativeUrl.substr(slash + 1);
            }
            
            if (full && relativeUrl.indexOf('post/full/') == -1) {
                relativeUrl = relativeUrl.replace('post/', 'post/full/');        
            }
            
            if (!full && relativeUrl.indexOf('post/full/') != -1) {
                
                relativeUrl = relativeUrl.replace('post/full/', 'post/');  
            }

            if (relative) return relativeUrl;

            url = window.location.origin + '/' + relativeUrl;
            url = url.replace('http://', 'http://' + imgServer + '.');                    
            url = url.replace('https://', 'https://' + imgServer + '.');
        }
        
        
        return url;
    },
    
    getCommentLink : function(comment) {
        
        if (!comment) return '#';
        
        var links = comment.getElementsByTagName('a');
        
        for (var b = 0; b < links.length; b++) {
            if (links[b].href.indexOf('#comment') != -1) {
                return links[b].href;                    
            }
        }
        
        return '#';
    },
    
    updateSidebarPosition : function(lock) {
    
        if (!this.fav) return false;
        
        var sideBarWrap = this.fav.getSidebar();
        
        if (!sideBarWrap || sideBarWrap.className.indexOf('hidden') !== -1) return false;
    
        var sideBlock = this.getMainContainers().sideBlock;
        var minTop = 0;
        
        if (sideBlock) {
            minTop = sideBlock.getBoundingClientRect().top;
        }
                    
        var modalBoxTop = 24;
        
        var filters = KellyTools.getElementByClass(sideBarWrap, this.className + '-FiltersMenu'); 
        var filtersBlock = KellyTools.getElementByClass(sideBarWrap, this.className + '-FiltersMenu-container');
                    
        if (filters && filters.offsetHeight > 440 && filters.className.indexOf('calculated') == -1) {
            
            filtersBlock.style.maxHeight = '0';
            filtersBlock.style.overflow = 'hidden';
            
            var modalBox = KellyTools.getElementByClass(document, this.className + '-ModalBox-main');						
                modalBox.style.minHeight = '0';

            var modalBoxHeight = modalBox.getBoundingClientRect().height;       
            
            var viewport = KellyTools.getViewport();
            if (viewport.screenHeight < modalBoxHeight + filters.offsetHeight + modalBoxTop) {
                filtersBlock.style.maxHeight = (viewport.screenHeight - modalBoxHeight - modalBoxTop - 44 - modalBoxTop) + 'px';
                filtersBlock.style.overflowY = 'scroll';

            } else {
                    
                filtersBlock.style.maxHeight = 'none';
                filtersBlock.style.overflow = 'auto';
            }
            
            filters.className += ' calculated';
        }
        
        // screen.height / 2  - (sideBarWrap.getBoundingClientRect().height / 2) - 24
        
        if (lock || modalBoxTop < minTop) modalBoxTop = minTop;
        
        var scrollTop = KellyTools.getScrollTop();
        var scrollLeft = KellyTools.getScrollLeft();
        
        sideBarWrap.style.top = modalBoxTop + scrollTop  + 'px';
        
        var widthBase = 0;
        
        if (window.location.host.indexOf('old.') == -1) {
            widthBase = 24;
        }
        
        if (sideBlock) {
            sideBarWrap.style.right = 'auto';
            sideBarWrap.style.left = Math.round(sideBlock.getBoundingClientRect().left + scrollLeft) + 'px';
            sideBarWrap.style.width = Math.round(sideBlock.getBoundingClientRect().width + widthBase) + 'px';
        } else {
            sideBarWrap.right = '0px';
        }		
        
        // tagList
    },
    
    getStaticImage : function(source) {

        if (source.indexOf('reactor') != -1) {
        
            if (source.indexOf('static') !== -1 || source.indexOf('.gif') == -1) return source;
            
            source = source.replace('pics/comment/', 'pics/comment/static/');
            source = source.replace('post/', 'post/static/');
            source = source.replace('.gif', '.jpeg');
        }
        
        return source;
    },
    
    getFavPageInfo : function() {
    
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
        
        if (window.origin.indexOf('https') != -1) {
            info.url = 'https://';
        } else {
            info.url = 'http://';
        }

        // основной домен предоставляет больше метаинфы в отличии от old.
        info.url += this.mainDomain + this.favPage;
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
        
        
        info.container = KellyTools.getElementByClass(document, this.className + '-FavNativeInfo'); 
        if (!info.container) {
        
            info.container = document.createElement('div');
            info.container.className = this.className + '-FavNativeInfo';
            
            info.header.parentNode.insertBefore(info.container, info.header.nextSibling);
        }
            
        return info;
    },
    
    /* @! */
    onInitWorktop : function() {
    
    },
    
    /* @! */
    onExtensionReady : function() {
                 
        if (window.location.host == this.mainDomain || window.location.host.indexOf('old.') == -1) {

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
            
            css = "\n\r\n\r\n\r" + '/* ' +  this.profile + '-dynamic */' + "\n\r\n\r\n\r";
            if (style.btn && style.btn.indexOf('0, 0, 0, 0') == -1) {
                css += '.' + this.className + '-basecolor-dynamic {';
                css += 'background-color : ' + style.btn + '!important;';
                css += '}';
            }
            
            if (style.bg && style.bg.indexOf('0, 0, 0, 0') == -1) {
            
                css += '.active .' + this.className + '-buttoncolor-dynamic, \
                        .active.' + this.className + '-buttoncolor-dynamic, \
                        .' + this.className + '-ahover-dynamic:hover .' + this.className + '-buttoncolor-dynamic, \
                        .' + this.className + '-ahover-dynamic .' + this.className + '-buttoncolor-dynamic:hover \
                        {';
                        
                css += 'background-color : ' + style.btn + '!important;';
                css += '}';
                                    
                css += '.' + this.className + '-buttoncolor-any-dynamic {';
                css += 'background-color : ' + style.btn + '!important;';
                css += '}';
            }
            
            this.fav.addCss(css);
        }
        
        this.fav.showNativeFavoritePageInfo();
    },
    
    syncFav : function(publication, inFav) {
    
        var body = this.getMainContainers().body;            
        if (!body) return;
        
        var item = publication.querySelector('.favorite_link');
        if (!item) return;
        
        
        if (inFav && item.className.indexOf(' favorite') == -1) {                
            KellyTools.dispatchEvent(item);
        } else if (!inFav && item.className.indexOf(' favorite') != -1) {                
            KellyTools.dispatchEvent(item);
        }
    },
    
    /* @! */
    onPageReady : function() {
        
        return false;
    },
    
    setFav : function(fav) {
        this.fav = fav;
    }
}

var K_DEFAULT_ENVIRONMENT = K_ENVIRONMENT;


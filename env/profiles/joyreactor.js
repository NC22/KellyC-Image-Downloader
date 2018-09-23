	// !@ - not required by FavItemsHelper object methods
	
	// default profile object, move to separate file in future
	
    var K_ENVIRONMENT = {
		
		fav : false, 
		
        className : 'kellyJRFav', 
        profile : 'joyreactor',
        mainDomain : 'joyreactor.cc',
        mainIframeSrc : '//joyreactor.cc/about', // to get local storage if web site use several subdomains
        mainContentContainer : 'contentinner',
        mainContainer : 'container',
		sideBar : 'sidebar',
		publication : 'postContainer',
		menu : 'submenu',
		hostClass : window.location.host.split(".").join("_"),
		
		actionVar : 'dkl_pp', // deprecated
		
		cleanNative : false, // ускоряет загрузку страниц при выгрузки данных с сайта, НО не нужно т.к. сайт банит за быстрый спам запросами
		
		isNSFW : function() {
			var sfw = KellyTools.getElementByClass(document, 'sswither');
			if (sfw && sfw.className.indexOf('active') != -1) return false;
			else return true;
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
				var schemaOrg = KellyTools.getElementByTag(publication, 'SCRIPT');
			
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
		
		updateModalBlockPosition : function() {
		
			if (!this.fav) return false;
			
			var modalBox = this.fav.getModal();
			
			if (!modalBox || modalBox.className.indexOf('hidden') !== -1) return false;
        
			var sideBar = document.getElementById(this.sideBar);
			var minTop = 0;
			
			if (sideBar) {
				minTop = sideBar.getBoundingClientRect().top;
			}
			
			// screen.height / 2  - (modalBox.getBoundingClientRect().height / 2) - 24
			var modalBoxTop = 24;
			
			if (modalBoxTop < minTop) modalBoxTop = minTop;
			
			var scrollTop = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0);
			
			modalBox.style.top = modalBoxTop + scrollTop  + 'px';
			
			var offsetLeft = 0;
			
			if (window.location.host.indexOf('old.') == -1) {
				offsetLeft = 24;
			}
			
			if (sideBar) {
				modalBox.style.right = 'auto';
				modalBox.style.left = Math.round(sideBar.getBoundingClientRect().left) + 'px';
				modalBox.style.width = Math.round(sideBar.getBoundingClientRect().width) + offsetLeft + 'px';
			}		
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
			
			var posts = document.getElementsByClassName('postContainer');
			if (posts) info.items = posts.length;
			
			//(window.location.href.substr(window.location.href.length - 8) == 'favourite')
			
			var pagination = KellyTools.getElementByClass(document, 'pagination_expanded');

			if (pagination) {
				info.page = parseInt(KellyTools.getElementByClass(pagination, 'current').innerHTML);
				if (info.page > info.pages) info.pages = info.page;
				
				var pages = pagination.getElementsByTagName('A');
				for (var i = 0; i < pages.length; i++) {
					var pageNum = parseInt(pages[i].innerHTML);
					if (info.pages < pageNum) info.pages = pageNum;   
					
					if (!info.url) {
						info.url = pages[i].href;   
						
						if (info.url.substr(info.url.length - 8) != 'favorite') {
							info.url = info.url.substring(0, info.url.length - (String(pageNum).length + 1));
						}
						
						info.url += '/';                    
						info.url = info.url.replace(window.location.origin, "")
					}
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
		
		onInitWorktop : function() {
		
		},
		
		onPageReady : function() {
			this.fav.showNativeFavoritePageInfo();
			return false;
		},
		
		setFav : function(fav) {
			this.fav = fav;
		}
    }
	
	var K_DEFAULT_ENVIRONMENT = K_ENVIRONMENT;
	
	
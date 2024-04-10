KellyRecorderFilterTwitter = new Object();
KellyRecorderFilterTwitter.manifest = {host : 'twitter.com', detectionLvl : ['imageAny', 'imagePreview', 'imageOriginal']};

KellyRecorderFilterTwitter.onInitLocation = function(handler, data) {
    if (handler.url.indexOf('twitter') != -1) {

        handler.getConfig(function(options, source) {
            
            
            if (options.tweekTwitter18W) {
                
                KellyRecorderFilterTwitter.observer = new MutationObserver(function(mutations) {

                    for (var i = 0; i < mutations.length; i++) {
                        
                        if (mutations[i].addedNodes.length > 0) {
                            
                            for (var b = 0; b < mutations[i].addedNodes.length; b++) {
                                
                                if (mutations[i].addedNodes[b] != handler.recorder &&
                                    mutations[i].addedNodes[b].nodeType == Node.ELEMENT_NODE) {
                                        
                                        KellyRecorderFilterTwitter.delayUpdate18wTweek();
                                }                            
                            }
                            
                        } 
                    }
                });

                KellyRecorderFilterTwitter.observer.observe(document.body, {childList: true, subtree: true});
                KellyRecorderFilterTwitter.delayUpdate18wTweek();
            }
        });
    } 
}

KellyRecorderFilterTwitter.update18wTweek = function() {
        
    var getParentByTag = function(el, tagName) {
        var parent = el;
        if (!tagName) return false;
        
        tagName = tagName.toLowerCase();
        
        while (parent && parent.tagName.toLowerCase() != tagName) {
            parent = parent.parentElement;
        }  
        
        return parent;
    }

    var findSignMainBlock = function(el) {
        var parent = el;
      
        while (parent) {
            parent = parent.parentElement;
            if (parent.children.length == 1) {
                var testBlock = parent.children[0].querySelector('div[role="button"]') ; 
                if (testBlock) return parent;
            }
        }  
        
        return false;
    }

    
    if (window.location.href.indexOf('/media') != -1) {
        
        var posts = document.querySelectorAll('li[role="listitem"]');

        for(var i=0; i < posts.length; i++) {

            var post = posts[i]; 
            var containers = post.getElementsByTagName('DIV');

            for (var b = 0; b < containers.length; b++) {
                
                if (containers[b].children.length == 2 && containers[b].children[0].tagName == 'DIV' && containers[b].children[1].tagName == 'DIV') {
                    var style = window.getComputedStyle(containers[b].children[0]);
                    if (style.filter && style.filter.indexOf('blur') != -1 && style.filter.indexOf('blur(0px)') == -1) {
                        containers[b].children[0].style.filter = 'blur(0px)';
                        containers[b].children[1].style.display = 'none';
                        break;
                    }
                }
            }
        }
        
    } else {
        
        var posts = document.getElementsByTagName('ARTICLE');
        for(var i=0; i < posts.length; i++) {

            var post = posts[i]; 
            var containers = post.getElementsByTagName('DIV');
            var warningEl = false;

            for (var b = 0; b < containers.length; b++) {
                
                if (!warningEl) {
                    var sign = containers[b].getElementsByTagName('SPAN');
                        
                    if (sign.length > 0 && sign[0].innerHTML.indexOf('sensitive') != -1) {

                        warningEl = findSignMainBlock(sign[0]);
                        warningEl.style.display = 'none';
                    }
                }
                
                var style = window.getComputedStyle(containers[b]);
                if (style.filter && style.filter.indexOf('blur') != -1) {
                    containers[b].style.filter = 'blur(0px)';
                    //containers[b].style.webkitFilter = ''; 
                    //console.log(containers[b]);
                }
            }            
        }
        
    }
}

KellyRecorderFilterTwitter.delayUpdate18wTweek = function() {
        
    if (KellyRecorderFilterTwitter.timer18wTweek) {
        clearTimeout(KellyRecorderFilterTwitter.timer18wTweek);
    } 
    
    
    KellyRecorderFilterTwitter.timer18wTweek = setTimeout(KellyRecorderFilterTwitter.update18wTweek, 300);
}

KellyRecorderFilterTwitter.addItemByDriver = function(handler, data) {
    if (handler.url.indexOf('twitter') != -1 && data.el.tagName == 'IMG' && data.el.src.indexOf('name=') != -1 && data.el.src.indexOf('pbs.twimg.com/media') != -1) {
        
       handler.addSingleSrc(data.item, data.el.src, 'addSrcFromAttributes-src', data.el, 'imagePreview');
       handler.addSingleSrc(data.item, data.el.src.split('&name=')[0] + '&name=orig', 'addSrcFromAttributes-src', data.el, 'imageOriginal');
       
       return data.item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;            
    } 
}

KellyPageWatchdog.validators.push({url : 'twitter', patterns : [['twimg.com/media', 'imageAny']]});
KellyPageWatchdog.filters.push(KellyRecorderFilterTwitter);
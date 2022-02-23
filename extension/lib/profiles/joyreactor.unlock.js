var KellyProfileJoyreactorUnlock = {
  
    postMaxHeight : 2000, cacheLimit : 400, cacheCleanUpN : 100, cacheItemMaxSizeKb : 15, ratingUnhideAfterHours : 48, ratingMaxVoteHours : 48, commentMaxDeleteMinutes : 10, // unhide rating for comments older > 24 hour
    tplItems : ['att-image', 'att-youtube', 'att-coub', 'query', 'query-post', 'query-post-with-comments', 'post', 'post-locked', 'comment', 'comment-old', 'post-form-comment', 'post-form-vote', 'comment-form-vote'],
    unlockPool : {pool : {}, tpl : 'query-post', delay : 2, maxAttempts : 10, reattemptTime : 1.4, timer : false, request : false}, 
    authData : {token : false}, initEvents : [],
    
    getNodeId : function(data) { 
        return window.atob(data).split(':')[1];                 
    },
    
    getPublicationAttributesHtml : function(data, htmlContext, isComment) {
        var html = '', type = isComment ? 'comment' : 'post', self = this;
        if (!data) return html;
        
        var itemN = 0, attributeHolders = htmlContext && htmlContext.indexOf('&attribute_insert_') != -1;
                
        data.forEach(function(attributeData) {
            var itemHtml = ''; itemN++;
            if (attributeData.type != 'PICTURE') {
                if (['YOUTUBE', 'COUB'].indexOf(attributeData.type) != -1)  itemHtml = self.getTpl('att-' + attributeData.type.toLowerCase(), { VALUE : attributeData.value});
            } else {                
                var src = "//img10.joyreactor.cc/pics/" + type + '/post-' + self.getNodeId(attributeData.id) + '.' + attributeData.image.type.toLowerCase();
                itemHtml = self.getTpl('att-image', { POSTURL_PREVIEW : src, POSTURL_FULL : src.replace(type + '/', type + '/full/')});
            }
            
            if (attributeHolders) htmlContext = htmlContext.replace('&attribute_insert_' + itemN + '&', itemHtml);
            else html += itemHtml;            
        });
        
        return htmlContext + html;
    },            
    
    getTpl(tplName, data) {
        return KellyTools.getTpl(this.tplData, tplName, data, true);
    },
    
    getVoteForm(form, id, publicationDate, rating, hideSymbol, meAuthor) {
        
        var readOnly = !this.authData.token || !this.authData.time || meAuthor || this.authData.time - publicationDate > this.ratingMaxVoteHours * 60 * 60 * 1000 ? true : false;
      
        if (!readOnly && this.authData.token && this.authData.time && !meAuthor && this.authData.time - publicationDate < this.ratingUnhideAfterHours * 60 * 60 * 1000) rating = hideSymbol;
        else rating = KellyTools.val(rating, 'float').toFixed(1);
        
        return this.getTpl(form, {VOTE : !readOnly, CONTENT_ID : id, RATING : rating});
    },
    
    cacheReset : function() {
        this.options.unlock.cacheData = {ids : [], data : []}; 
    },
    
    cacheUpdate : function(ids, data) {
        
        if (ids.length > this.cacheLimit) {
            console.log('Oversized cache data list');
            return;
        }
        
        var cacheData = this.options.unlock.cacheData;
        if (cacheData.ids.length >= this.cacheLimit) {
            if (this.cacheCleanUpN == this.cacheLimit) this.cacheReset();
            else {
                cacheData.ids.splice(0, this.cacheCleanUpN);
                cacheData.data.splice(0, this.cacheCleanUpN);
            }
        }        
        
        for (var i = 0; i < ids.length; i++) {
            
            if (!data || !data['node' + (i + 1)]) continue;
            var cachePost = data['node' + (i + 1)]; // clone \ duplicate if you needed original object for something in future
            if (cachePost.comments) delete cachePost.comments;
            
            var cachePostInKbs = JSON.stringify(cachePost).length / 1000;
            if (cachePostInKbs > this.cacheItemMaxSizeKb) {
                console.log('Oversized cache element. Skip');
                continue;
            }
            
            var cacheIndex = cacheData.ids.indexOf(ids[i]);
            if (cacheIndex == -1) {
                cacheData.ids.push(ids[i]);
                cacheData.data.push(cachePost)
            } else {
                cacheData.data[cacheIndex] = cachePost;
                // todo - voted
            }
            
        }
        
        if (this.handler && this.handler.fav) this.handler.fav.save('cfg');
    },
    
    updatePostBounds : function(postBlock, mediaContainer) {
          var cImage = mediaContainer ? mediaContainer.getElementsByTagName('img') : [], totalHeight = 0, loaded = 0, fullList = [], self = this;          
          var postExpandBtn = KellyTools.getElementByClass(mediaContainer, 'post_content_expand');
          var postContent = KellyTools.getElementByClass(mediaContainer, 'post_content');   

          if (postExpandBtn && postContent) {
              var checkOnAllLoad = function(self, error) {
                  loaded++;
                  totalHeight += error ? 0 : self.getBoundingClientRect().height;
                  
                  if (loaded < cImage.length) return;
                  
                  if (totalHeight < KellyProfileJoyreactorUnlock.postMaxHeight) {                                         
                      postContent.classList.remove('post_content_cut');
                      postExpandBtn.style.display = 'none';
                      postContent.style.maxHeight = 'unset';
                  }
              }
              
              var showFull = function(e) {
                self.handler.fav.getImageViewer().addToGallery(fullList, 'post-image-full', ['related data for item 0', 'related...']);
                self.handler.fav.getImageViewer().loadImage(false, {gallery : 'post-image-full', cursor : this.getAttribute('kellyGalleryIndex')});                 
                e.preventDefault();
                return false;
              }
              
              for (var i = 0; i < cImage.length; i++) {
                 if (cImage[i].parentElement.classList.contains('prettyPhotoLink')) {
                     fullList.push(cImage[i].parentElement.href);
                     cImage[i].parentElement.setAttribute('kellyGalleryIndex', i);                     
                     cImage[i].parentElement.onclick = showFull;
                 }
                 cImage[i].onload = function() {checkOnAllLoad(this, false);};
                 cImage[i].onerror = function() {checkOnAllLoad(this, true);};
              }
              
              if (cImage.length <= 0) checkOnAllLoad(postContent, false);
          }      
    },
    
    unlockPostList : function(ids, queryPost, callback) {
        
        var query = "", self = KellyProfileJoyreactorUnlock;
        for (var i = 0; i < ids.length; i++) query += "\\n " + "node" + (i + 1) + ":node(id : \\\"" + window.btoa('Post:' + ids[i]) + "\\\") {" + queryPost.replace(/(?:\r\n|\r|\n)/g, '') + "}";
        
        if (!query) return false;
        
        var unlockController = {attempts : 0};
            unlockController.log = function(text, eventId) { console.log (text + ' | ' + eventId); };
            unlockController.abort = function() {
                if (unlockController.fetch) {
                    unlockController.fetch.abort();
                    unlockController.fetch = false;
                }
                if (unlockController.reattemptTimeout) {
                    clearTimeout(unlockController.reattemptTimeout);
                    unlockController.reattemptTimeout = false;
                }
            }
            unlockController.unlockRequest = function(query) {
            
                if (unlockController.fetch) return false;
                         
                unlockController.attempts++;
                
                unlockController.log('Unlock post request ' + ' Attempt : ' + unlockController.attempts + '/' + self.unlockPool.maxAttempts, 'unlockRequest');
                unlockController.fetch = KellyTools.fetchRequest('https://api.joyreactor.cc/graphql?unlocker=1', {
                    method : 'POST', 
                    headers : {'Content-Type': 'application/json'},
                    body: self.getTpl('query', { QUERY : query }),
                    responseType : 'json',
                }, function(url, responseData, responseStatusCode, error, fetchRequest) {
                               
                    if (error || !responseData || !responseData.data['node1']) {
                        
                        unlockController.fetch = false;
                        if (unlockController.attempts < self.unlockPool.maxAttempts) {
                            
                            unlockController.log('Bad response ' + ' Attempt : ' + unlockController.attempts + '/' + self.unlockPool.maxAttempts, 'responseError');
                            unlockController.log(error, 'responseErrorInfo');
                            
                            unlockController.reattemptTimeout = setTimeout(function() {unlockController.unlockRequest(query);}, self.unlockPool.reattemptTime * 1000);
                            
                        } else callback(false);
                        
                        return false;
                    }
                    
                    for (var i = 0; i < ids.length; i++) {
                        
                    }
                    callback(ids, responseData);
                });
            
            }
            
            unlockController.unlockRequest(query);
            return unlockController;       
    },
                                    
    onPoolUnlockedDataReady : function(rids, unlockedData, pool) {
        
        var self = KellyProfileJoyreactorUnlock;
        
        for (var i = 0; i < rids.length; i++) {
                           
            var postUnlockedData = unlockedData ? unlockedData.data['node' + (i+1)] : false, htmlComments = '', poolItem = pool[rids[i]], postId = rids[i];
            var htmlPostCommentForm = (self.authData.token ? self.getTpl('post-form-comment', { POST_ID : postId, AUTH_TOKEN : self.authData.token}) : '');
            
            if (rids === false || !postUnlockedData) {
                poolItem.onReady(false, 'Ошибка загрузки данных. (Повторная попытка по клику на "Комментарии")');
                continue;
            }
            
            if (poolItem.mediaBlock) {
                KellyTools.setHTMLData(poolItem.mediaBlock, self.getTpl('post', {PICS : self.getPublicationAttributesHtml(postUnlockedData.attributes, postUnlockedData.text)})); 
                self.updatePostBounds(poolItem.postBlock, poolItem.mediaBlock); 
            }
            
            poolItem.postBlock.setAttribute('data-state', self.unlockPool.tpl);
            poolItem.unlocked = true;
            
            if (self.unlockPool.tpl == 'query-post-with-comments' && poolItem.commentsBlock) {
                
                if (postUnlockedData.comments && postUnlockedData.comments.length > 0) {
                    postUnlockedData.comments.forEach(function(comment) { 
                        var datetime = new Date(comment.createdAt);
                        var meAuthor = KellyTools.val(self.getNodeId(comment.user.id), 'int') == self.authData.userId ? true : false;
                        
                        htmlComments += self.getTpl('comment', { 
                            PICS : self.getPublicationAttributesHtml(comment.attributes, comment.text, true), 
                            USER_NAME : comment.user.username, 
                            USER_ID : self.getNodeId(comment.user.id),
                            POST_ID : postId,                        
                            COMMENT_ID : self.getNodeId(comment.id),
                            DATE : datetime.getDate() + ' ' + ['янв.', 'фев.', 'март', 'апр.', 'май', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'нояб.', 'дек.'][datetime.getMonth()] + ' ' + datetime.getFullYear(),
                            TIME : KellyTools.getTime(datetime),
                            VOTE : self.getVoteForm('comment-form-vote', self.getNodeId(comment.id), datetime, comment.rating, '≈0', meAuthor),
                            RESPONSE : self.authData.token ? true : false,
                            DELETE : self.authData.token && meAuthor && self.authData.time - datetime < self.commentMaxDeleteMinutes * 60 * 1000  ? true : false,
                        });
                        
                    });                        
                    
                    KellyTools.setHTMLData(poolItem.commentsBlock, htmlComments + htmlPostCommentForm);
                    postUnlockedData.comments.forEach(function(comment) {
                        if (!comment.parent) return;
                        
                        var parentEl = document.getElementById('comment_list_comment_' + self.getNodeId(comment.parent.id));
                        var childEl = document.getElementById('comment' + self.getNodeId(comment.id));
                        var childChildsEl = document.getElementById('comment_list_comment_' + self.getNodeId(comment.id));
                        if (parentEl && childEl && childChildsEl) {
                            parentEl.appendChild(childEl);
                            parentEl.appendChild(childChildsEl);
                        }
                    });
                    
                } else KellyTools.setHTMLData(poolItem.commentsBlock, '<i>нет комментариев</i>' + htmlPostCommentForm);                    
            }
            
            if (poolItem.ratingBlock) {
                KellyTools.setHTMLData(poolItem.ratingBlock, self.getVoteForm('post-form-vote', postId, new Date(postUnlockedData.createdAt), postUnlockedData.rating, '--'));
                poolItem.ratingBlock.style.display = '';
            }
            
            poolItem.onReady(true);     
        }        
        
        if (rids !== false && unlockedData && !unlockedData.cachedItem && self.options.unlock.cache) self.cacheUpdate(rids, unlockedData.data);        
    },
        
    unlockPostListDelayed : function(delay) {
        
        var self = KellyProfileJoyreactorUnlock, ids = [];
                
        if (self.unlockPool.timer) clearTimeout(self.unlockPool.timer);
        
        if (delay) {
            self.unlockPool.timer = setTimeout(self.unlockPostListDelayed, self.unlockPool.delay * 1000);
            return;
        }
        
        for (var postId in self.unlockPool.pool) {
            self.unlockPool.pool[postId].postBlock.setAttribute('data-state', 'load');
            ids.push(postId);
        }     
        
        if (self.unlockPool.request || ids.length <= 0) return;
   
        self.unlockPool.request = self.unlockPostList(ids, self.getTpl(self.unlockPool.tpl), function(rids, unlockedData) {
            self.onPoolUnlockedDataReady(rids, unlockedData, self.unlockPool.pool);
            self.unlockPool.request = false;        
            self.unlockPool.pool = {};
        });
    },
    
    formatCensoredPost : function(postBlock) {
        
        var self = KellyProfileJoyreactorUnlock, postId = postBlock.id.match(/[0-9]+/g), uClassName = self.handler.className;
        if (postId.length <= 0 || !this.isCensored(postBlock)) return false;
        
        postId = postId[0], cImage = postBlock.getElementsByTagName('img'), cImageItem = cImage[cImage.length-1], auto = self.options.unlock.censoredMode != 'click' && !self.unlockPool.request;
        if (cImage.length == 0 || (cImageItem.src.indexOf('/images/censorship') == -1 && cImageItem.src.indexOf('/images/unsafe_ru') == -1)) return false;
        
        var unlockData = {
            postId : postId, 
            postBlock : postBlock, 
            ratingBlock : KellyTools.getElementByClass(postBlock, 'post_rating'), 
            commentsBlock : KellyTools.getElementByClass(postBlock, 'post_comment_list'), 
            mediaBlock : KellyTools.setHTMLData(document.createElement('DIV'), this.getTpl('post-locked', {CLASSNAME : uClassName, POST_ID : postId, AUTO : auto, CLICK : !auto})), 
            onReady : function(success, errorText) {
            
                if (errorText) KellyTools.getElementByClass(unlockData.mediaBlock, uClassName + '-censored-notice').innerText = errorText;                
                if (unlockData.initiator) self.showCNotice(success ? false : errorText);
                
                if (success && unlockData.initiator) {
                    self.handler.formatPostContainer(unlockData.postBlock);
                    if (unlockData.commentsBlock && unlockData.initiator.className.indexOf('comment') != -1) unlockData.commentsBlock.style.display = '';                
                    if (unlockData.commentsBlock && unlockData.initiator.className.indexOf('comment') != -1) setTimeout(function() { window.scrollTo(0, unlockData.commentsBlock.getBoundingClientRect().top + KellyTools.getScrollTop() - 90); }, 200);       
                }
                return false;
            },
            onManualLoad : function(e) {   
                
                unlockData.initiator = e.target;  
                
                if (postBlock.getAttribute('data-state') == 'query-post-with-comments' && unlockData.initiator.className.indexOf('comment') != -1 && !unlockData.commentsBlock.style.display) {
                    unlockData.commentsBlock.style.display = 'none';
                    return false;
                }
                
                if (postBlock.getAttribute('data-state') == 'load' || Object.keys(self.unlockPool.pool).length > 0) return self.showCNotice('Дождитесь окончания загрузки...');
                
                self.showCNotice('Загрузка...');
                self.unlockPool.tpl = unlockData.initiator.className.indexOf('comment') != -1 ? 'query-post-with-comments' : 'query-post';
                self.unlockPool.pool[postId] = unlockData;
                self.unlockPostListDelayed(false);
                return false;
            }
        };
       
        cImageItem.parentNode.insertBefore(unlockData.mediaBlock, cImage[cImage.length-1]);
        cImageItem.parentElement.removeChild(cImageItem);
        KellyTools.getElementByClass(unlockData.mediaBlock, uClassName + '-censored').onclick = unlockData.onManualLoad;
        
        var commentsExpand = KellyTools.getElementByClass(postBlock, 'commentnum');
        if (commentsExpand) {
            commentsExpand.classList.remove('toggleComments');
            commentsExpand.onclick = unlockData.onManualLoad;
        }
        
        if (self.options.unlock.auth && unlockData.ratingBlock) unlockData.ratingBlock.style.display = 'none'; 
        
        if (auto) { // can be beasy in some cases - ex. if too many mutations called on page during ajax pagination
                
                self.unlockPool.pool[postId] = unlockData;    
            if (self.options.unlock.cache && self.options.unlock.cacheData.ids.indexOf(postId) != -1) {
                    self.onPoolUnlockedDataReady([postId], {cachedItem : true, data : {'node1' : self.options.unlock.cacheData.data[self.options.unlock.cacheData.ids.indexOf(postId)]}}, self.unlockPool.pool);
                    delete self.unlockPool.pool[postId];
                    KellyTools.log('Unlock : restore from cache ' + postId, KellyTools.E_NOTICE);
                    
            } else self.unlockPostListDelayed(true);
        }
        
        return true;
    },
    
    isCensored : function(post) {
        if (post.innerHTML.indexOf(this.handler.className + '-censored') != -1) return false;
        if (post.innerHTML.indexOf('/images/censorship') != -1 || post.innerHTML.indexOf('/images/unsafe_ru') != -1) return true;
        return false;
    },
    
    getCensored : function() {
        var publications = KellyProfileJoyreactorUnlock.handler.getPosts(), censored = [];
        for (var i = 0; i < publications.length; i++) if (this.isCensored(publications[i])) censored.push(publications[i]);
        
        return censored;
    },
    
    formatCensoredPosts : function() {
        
        if (!this.options.unlock.censored) return;        
        if (!this.options.unlock.cache || typeof this.options.unlock.cacheData == 'undefined') this.cacheReset();
        
        this.unlockPool.tpl = 'query-post';
        var censoredData = this.getCensored();
        if (censoredData.length > 0) this.initWorkspace(function() {
            for (var i = 0; i < censoredData.length; i++) KellyProfileJoyreactorUnlock.formatCensoredPost(censoredData[i]);
        });
    },
    
    initWorkspace : function(callback) {
        var self = this;
        if (self.initState == 'loaded') return callback();
        
        if (callback) self.initEvents.push(callback);
        if (self.initState == 'loading') return;
        self.initState = 'loading';
        
        var onReady = function() {self.initState = 'loaded'; for (var i = 0; i < self.initEvents.length; i++) self.initEvents[i]();};
        
        KellyTools.getBrowser().runtime.sendMessage({method: "getResources", asObject : true, items : self.tplItems, itemsRoute : {module : 'joyreactorUnlocker', type : 'html'}}, function(request) {

            self.tplData = request.data.loadedData; 
            if (self.handler.location.host == 'old.reactor.cc') self.tplData['comment'] = self.tplData['comment-old'];
            
            if (self.options.unlock.auth) {
                KellyTools.injectAddition('dispetcher', function() {
                
                    // get auth token if user sign-in, call callback only after all data is ready
                    
                    KellyTools.addEventPListener(window, "message", function(e) {
                        if (e && e.data && e.data.method == 'kelly_dynaminc.getvar' && e.data.senderId == 'dynamic_dispetcher') {
                            self.authData = {time : new Date(parseInt(e.data.varList.server_time) * 1000), token : e.data.varList.token ? KellyTools.val(e.data.varList.token, 'string') : false, userId : KellyTools.val(e.data.varList.user_id, 'int')};
                            if (self.authData.userId <= 0) self.authData.token = false;
                            KellyTools.removeEventPListener(window, "message", 'get_main_window_data');
                            onReady();
                            return true;
                        }
                    }, 'get_main_window_data');
                    
                    // post comment form implementation 
                    
                    KellyTools.addEventPListener(document, "click", function(e) {
                        
                        if (self.initState == 'loaded' && e && e.target && e.target.tagName == 'INPUT' && e.target.classList.contains('post_comment_form_unlocked') && !self.authData.postRequest && !self.unlockPool.request && self.authData.token ) {
                            
                            var postForm = KellyTools.getParentByTag(e.target, 'form');
                            var postId = KellyTools.getElementByClass(postForm, 'post_id').value;
                            var postData = {postId : postId, postBlock : document.getElementById('postContainer' + postId), commentsBlock : KellyTools.getElementByClass(document.getElementById('postContainer' + postId), 'post_comment_list'), onReady : function() {self.showCNotice();}};

                            self.authData.postRequest = KellyTools.xmlRequest(postForm.action, {method : 'POST', responseType : 'json', formData : new FormData(postForm)}, function(url, response, errorStatus, errorText) {
                               
                                if (response === false) {
                                    
                                    self.showCNotice('Ошибка отправки [' + errorText + ']');
                                    
                                } else if (response.error !== 'ok') {
                                    
                                    self.showCNotice(response.error);
                                    
                                } else {
                                    
                                    self.showCNotice('Отправлено, обновляю комменты...');
                                    self.unlockPool.tpl = 'query-post-with-comments';
                                    self.unlockPool.pool = {};
                                    self.unlockPool.pool[postId] = postData;                                
                                    self.unlockPostListDelayed(false);
                                }
                                
                                self.authData.postRequest = false;
                            });
                        }
                    }, 'get_main_window_data');
                    window.postMessage({kelly_dynaminc : true, senderId : 'joyreactor.unlock', method : 'kelly_dynaminc.getvar', varList : ['user_id', 'token', 'server_time']}, window.location.origin);             
                });
            } else {
                onReady();
            }
        });
    },
    
    initCfg : function(env) {        
        this.handler = env;       
        
        this.handler.events.onBeforeDownloadCfg = function(fav) {
            KellyProfileJoyreactorUnlock.cacheReset();
        }
        
        this.handler.events.onValidateCfg = function(data) {
            
            if (!data.coptions.unlock) {
                data.coptions.unlock = {censored : true, censoredMode : 'auto', cache : true, auth : true};
            }
            
            if (typeof data.coptions.darkTheme == 'undefined') data.coptions.darkTheme = true;
        
            if (typeof data.coptions.unlock.cache == 'undefined') data.coptions.unlock.cache = true;
            if (typeof data.coptions.unlock.auth == 'undefined') data.coptions.unlock.auth = true;   
            
            KellyProfileJoyreactorUnlock.options = data.coptions;
        }
        
        this.handler.events.onCreateOptionsManager = function(optionsManager) {

            optionsManager.tabData['Other'].parts['unlock_common'] = 'unlock_';  
            optionsManager.cfgInput['unlock_unlockCensored'] = {name : 'censored', parent : 'unlock', loc : 'unlock_censored', type : 'bool', default : true};
            optionsManager.cfgInput['unlock_unlockCensoredMode'] = {name : 'censoredMode', parent : 'unlock', loc : 'unlock_censored_mode', default : 'auto', listLoc : ['unlock_censored_auto', 'unlock_censored_manual'], list : ['auto' , 'click'], type : 'enum'};
            optionsManager.cfgInput['unlock_unlockCensoredCache'] = {name : 'cache', parent : 'unlock', loc : 'unlock_censored_cache', type : 'bool', default : true};
            optionsManager.cfgInput['unlock_unlockCensoredAuth'] = {name : 'auth', parent : 'unlock', loc : 'unlock_censored_auth', type : 'bool', default : true};
        }      
        return this;
    },
    
    showCNotice : function(text) {
        var tooltip = this.handler.fav.getTooltip();
        if (!text) tooltip.show(false);
        else {
            tooltip.resetToDefaultOptions();
            tooltip.updateCfg({closeButton : false, closeByBody : true});
            tooltip.setMessage(text);    
            tooltip.show(true);
        } 
        return false;
    }
 }
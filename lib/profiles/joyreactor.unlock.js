var KellyProfileJoyreactorUnlock = {
            
    queryPost : '... on Post {attributes {id, image {type}}}',
    queryPostWithComments : '... on Post { comments { level, parent {id}, user {id, username}, id, text,  attributes { id, image { type }} }, attributes { id, image { type }} }',
    
    commentTpl : '<div class="comment hightlighted filled" id="comment__COMMENT_ID__">\
                  <div class="txt"><div><p>__TEXT__</p><div>__PICS__</div></div><div class="comments_bottom">\
                  <img src="http://img0.joyreactor.cc/pics/avatar/user/__USER_ID__" class="avatar">&nbsp;\
                  <a href="/user/__USER_NAME__" class="comment_username">__USER_NAME__</a>&nbsp;<a href="/post/__POST_ID__#comment__COMMENT_ID__" class="comment_link">ссылка</a></div></div></div>\
                  <div class="comment_list" id="comment_list_comment___COMMENT_ID__"></div>',
    
    postTpl    : '<div class="post_content" style="max-height : unset;">__PICS__</div>',
    imageTpl   : '<div class="image"><a href="__POSTURL_FULL__" class="prettyPhotoLink" target="_blank" rel="prettyPhoto"><img src="__POSTURL_PREVIEW__"></a></div>',
    
    getNodeId : function(data) { 

        return window.atob(data).split(':')[1];                 
    },
    
    getAttributesHtml : function(data, isComment) {
        var html = '', type = isComment ? 'comment' : 'post';
        if (!data) return html;
        data.forEach(function(imageData) {                        
            var src = "//img10.joyreactor.cc/pics/" + type + '/post-' + KellyProfileJoyreactorUnlock.getNodeId(imageData.id) + '.' + imageData.image.type.toLowerCase();
            html += KellyProfileJoyreactorUnlock.getTpl('image', { POSTURL_PREVIEW : src, POSTURL_FULL : src.replace(type + '/', type + '/full/')});
        });
        return html;
    },            
    
    getTpl(tplName, data) {
        var html = this[tplName + 'Tpl'];
        for (var k in data) html = KellyTools.replaceAll(html, '__' + k + '__', data[k]);
        return html;
    },
    
    unlockPost : function(postId, postBlock, postContainer, commentsContainer, callback) {
        
        var self = KellyProfileJoyreactorUnlock;        
        if (postBlock.getAttribute('data-state') == 'ready') {
            callback(true, true);
            return;
        } else if (postBlock.getAttribute('data-state')) {
            callback(false);
            return self.showCNotice('Дождитесь окончания загрузки...');
        };        
        
        self.showCNotice('Загрузка...');                
        postBlock.setAttribute('data-state', 'load');
          
        KellyTools.fetchRequest('https://api.joyreactor.cc/graphql', {
            method : 'POST', 
            headers : {'Content-Type': 'application/json'},
            body: "{\"operationName\":null,\"variables\":{},\"query\":\"{\\n  node(id: \\\"" + window.btoa('Post:' + postId) + "\\\") {" + (commentsContainer ? self.queryPostWithComments :  self.queryPost) + "}}\"}",
            responseType : 'json',
        }, function(url, responseData, responseStatusCode, error, fetchRequest) {
                        
            if (error || !responseData || !responseData.data.node) {
                postBlock.removeAttribute('data-state');
                KellyTools.log(error, KellyTools.E_ERROR);
                callback(false);
                return self.showCNotice('Ошибка обработки данных');
            }
            
            postBlock.setAttribute('data-state', 'ready');
            var html = self.getAttributesHtml(responseData.data.node.attributes), htmlComments = '';
                     
            if (responseData.data.node.comments) {
                responseData.data.node.comments.forEach(function(comment) { 
                    htmlComments += self.getTpl('comment', { 
                        TEXT : comment.text,
                        PICS : self.getAttributesHtml(comment.attributes, true), 
                        USER_NAME : comment.user.username, 
                        USER_ID : self.getNodeId(comment.user.id),
                        POST_ID : postId,                        
                        COMMENT_ID : self.getNodeId(comment.id),
                    });
                });
            }   
            
            KellyTools.setHTMLData(postContainer, self.getTpl('post', {PICS : html}));                    
            if (htmlComments && commentsContainer) {
                KellyTools.setHTMLData(commentsContainer, htmlComments);
                responseData.data.node.comments.forEach(function(comment) {
                    if (comment.parent) {
                        var parentEl = document.getElementById('comment_list_comment_' + self.getNodeId(comment.parent.id));
                        var childEl = document.getElementById('comment' + self.getNodeId(comment.id));
                        var childChildsEl = document.getElementById('comment_list_comment_' + self.getNodeId(comment.id));
                        if (parentEl && childEl && childChildsEl) {
                            parentEl.appendChild(childEl);
                            parentEl.appendChild(childChildsEl);
                        }
                    }
                });
            } else if (commentsContainer) KellyTools.setHTMLData(commentsContainer, '<i>нет комментариев</i>');
                                 
            self.handler.formatPostContainer(postBlock);
            self.showCNotice(false);
            callback(true, false);
        });
    },
    
    checkCensorship : function(handler, postBlock) {
        
        this.handler = handler;        
        var postId = postBlock.id.match(/[0-9]+/g);
        if (postId.length <= 0) return;
                          
        postId = postId[0], cImage = postBlock.getElementsByTagName('img');
        for (var b = 0; b < cImage.length; b++) {
            
            if (cImage[b].classList.contains(handler.classList + '-censored')) return;
            if (cImage[b].src.indexOf('/images/censorship') == -1 && cImage[b].src.indexOf('/images/unsafe_ru') == -1) continue;
            
            var postContainer = KellyTools.setHTMLData(document.createElement('DIV'), '<div class="' + handler.className + '-censored-notice">Заблокированный пост. Кликни на картинку или "Комментарии" для восстановления</div>');            
            var commentsContainer = KellyTools.getElementByClass(postBlock, 'post_comment_list'); // sets - false to make only post data request
            var onClick = function() {   
                var caller = this;
                KellyProfileJoyreactorUnlock.unlockPost(postId, postBlock, postContainer, commentsContainer, function(success, cached) {
                    if (!success) return;                    
                    if (commentsContainer) {
                        if (caller.className.indexOf('comment') != -1) {                    
                            if (cached) commentsContainer.style.display = commentsContainer.style.display ? '' : 'none';
                            else setTimeout(function() { window.scrollTo(0, commentsContainer.getBoundingClientRect().top + KellyTools.getScrollTop() - 90); }, 200);
                        } else commentsContainer.style.display = 'none';
                    }
                });  
                return false;
            }
            
            cImage[b].parentNode.insertBefore(postContainer, cImage[b]);
            cImage[b].classList.add(handler.className + '-censored');
            cImage[b].src = "//img10.joyreactor.cc/pics/thumbnail/post-" + postId + '.jpg';
            cImage[b].onclick = onClick;
            
            var commentsExpand = KellyTools.getElementByClass(postBlock, 'commentnum');
            if (commentsExpand) {
                commentsExpand.classList.remove('toggleComments');
                commentsExpand.onclick = onClick;
            }
            
            postContainer.appendChild(cImage[b]);
            break;
        }
        
    },
    
    showCNotice : function(text) {
        var tooltip = this.handler.fav.getTooltip();
        if (!text) tooltip.show(false);
        else {
            tooltip.resetToDefaultOptions();
            tooltip.updateCfg({closeButton : false});
            tooltip.setMessage(text);    
            tooltip.show(true);
        } 
        return false;
    }
 }
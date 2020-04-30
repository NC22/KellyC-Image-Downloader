// part of KellyFavItems extension
// JoyReactor environment driver tweak

function kellyProfileJoyreactorEditTweak() {
        
    var handler = this;
    
    var userName = -1;
    var initSession = false;
    var token = false;
    
    var actionUrl = {
        remove : '/post_comment/delete/__COMMENT_ID__',
        create : '/post_comment/create',
    } 
    
    var jEnv = kellyProfileJoyreactor.getInstance();   
    var loading = false; // is any request loading
    var postFormPrototype = false;
    
    function getPostFormCopy() {
        
        if (postFormPrototype) {            
            return postFormPrototype.cloneNode(true);
        }
        
        postFormPrototype = document.createElement('div');
        postFormPrototype.className = jEnv.className + '-edit-comment';
        
        var tpl = '<textarea name="comment_text" class="comment_text" placeholder="Текст комментария" rows="5" cols="75"></textarea>\
            <br>\
            <input type="submit" value="Изменить" class="' + jEnv.className + '-edit-update">\
            <input type="submit" value="Отмена" class="' + jEnv.className + '-edit-cancel">\
            <input type="submit" value="Удалить" class="' + jEnv.className + '-edit-remove">\
            Картинка:\
            <span>\
              <a href="javascript:" class="' + jEnv.className + '-edit-file-btn">из файла</a>\
              <input type="file" accept="image/*" class="' + jEnv.className + '-edit-file" value="" style="display:none">\
              &nbsp;\
              <a href="javascript:" class="' + jEnv.className + '-edit-url-btn">из URL</a>\
              <input type="text" class="' + jEnv.className + '-edit-url" value="" style="display:none">\
            </span>';
        
        KellyTools.setHTMLData(postFormPrototype, tpl);        
        return postFormPrototype.cloneNode(true);
    }
                    
    var sendRemoveRequest = function(commentId, formData, onSuccess, onError) {
         
        var env = kellyProfileJoyreactor.getInstance();
           
        var removeRequest = new XMLHttpRequest();                    
            removeRequest.open('GET', env.location.protocol + '//' + env.location.host + actionUrl.remove.replace('__COMMENT_ID__', commentId), true);
            removeRequest.responseType = 'text';                            
            removeRequest.onload = function() {
                
                if (this.status == 200) {	

                    if (!this.response) {
                        onError('Ошибка. Сервер вернул пустое сообщение. Удаление не выполнено');                                        
                    } else {                                        
                        onSuccess(this.response);
                    }
                   
                } else {
                    onError('Ошибка. Сервер не доступен. Код ошибки ' + this.status + '. Удаление не выполнено');                                        
                }
            };

            removeRequest.onerror = function() {                                   
                onError('Ошибка. Сервер временно не доступен. Проверьте подключение к интеренету. Удаление не выполнено');                                                       
            };
            
            removeRequest.send(formData);
    }
    
    var sendCreateRequest = function(commentId, formData, onSuccess, onError) {
         
        var env = kellyProfileJoyreactor.getInstance();
        var errCommonText = ' Удаление комментария прошло успешно, но добавление не выполнено. Нажмите "Изменить" или обновите страницу и добавьте комментарий вручную';
        
        var createRequest = new XMLHttpRequest();                    
            createRequest.open('POST', env.location.protocol + '//' + env.location.host + actionUrl.create.replace('__COMMENT_ID__', commentId), true);
            createRequest.responseType = 'json';                            
            createRequest.onload = function() {
                
                if (this.status == 200) {	

                    if (!this.response) {
                        onError('Ошибка. Сервер вернул пустое сообщение.' + errCommonText);                                        
                    } else {      
                    
                        if (!this.url) onError('Ошибка. Сервер не вернул информацию о созданном сообщении. Обновите страницу.', 3004);
                        else {
                            
                            sendGetCommentBodyRequest(this.response.url, function(commentText) {
                                
                                onSuccess(commentText);
                            
                            }, onError);
                            
                        }
                    }
                   
                } else {
                    onError('Ошибка. Сервер не доступен. Код ошибки ' + this.status + '.' + errCommonText);                                        
                }
            };

            createRequest.onerror = function() {                                   
                onError('Ошибка. Сервер временно не доступен. Проверьте подключение к интеренету.' + errCommonText);                                                       
            };
            
            createRequest.send(formData);
    }
    
    var sendGetCommentBodyRequest = function(url, onSuccess, onError) {
        
        var env = kellyProfileJoyreactor.getInstance(); 
        var errCommonText = 'Сообщение отредактировано, но сервер не вернул информацию о отображении сообщения - обновите страницу';
        
        var createRequest = new XMLHttpRequest();                    
            createRequest.open('GET', env.location.protocol + '//' + env.location.host + url, true);
            createRequest.responseType = 'text';
            createRequest.onload = function() {
                
                if (this.status == 200) {	

                    if (!this.response) {
                        onError('Ошибка. Сервер вернул пустое сообщение.' + errCommonText, 3000);                                        
                    } else {                                        
                        onSuccess(this.response);
                    }
                   
                } else {
                    onError('Ошибка. Сервер не доступен. Код ошибки ' + this.status + '.' + errCommonText, 3001);                                        
                }
            };

            createRequest.onerror = function() {                                   
                onError('Ошибка. Сервер временно не доступен. Проверьте подключение к интеренету.' + errCommonText, 3002);                                                       
            };
            
            createRequest.send();            
    }

    this.initSessionData = function() {
        
        if (initSession) return;
        
        initSession = true;
              
        KellyTools.injectAddition('dispetcher', function() {  
        
            window.postMessage({kelly_dynaminc : true, var_name : 'token', method : 'kelly_dynaminc.getvar'}, "*");   
                          
            var getTokenData = function(e) {
                
                if (e.data.senderId != 'dynamic_dispetcher') return;
                                
                if (e.data.token) {
                    token = e.data.token;
                }
                
                window.removeEventListener('message', getTokenData);
            }
        
            window.addEventListener('message', getTokenData);
        });  
        
    }
    
    function decodeEntites(text) {
        var entities = [
            ['amp', '&'],
            ['apos', '\''],
            ['#x27', '\''],
            ['#x2F', '/'],
            ['#39', '\''],
            ['#47', '/'],
            ['lt', '<'],
            ['gt', '>'],
            ['nbsp', ' '],
            ['quot', '"']
        ];

        for (var i = 0, max = entities.length; i < max; ++i) 
            text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);

        return text;
    }

    function getEditableData(comment) {
        
        var txtContainer = KellyTools.getElementByClass(comment, jEnv.className + '-comment-text');
        var txtContainerCopy = txtContainer.cloneNode(true);
        
        var media = txtContainerCopy.getElementsByClassName('image');
        for (var i = 0; i < media.length; i++) {            
            if (media[i] && media[i].childNodes) { 
                while (media[i].firstChild) {
                    media[i].parentNode.insertBefore(media[i].firstChild, media[i]);
                }
            }
        }        
        
        var inputImage = false;
        var inputData = comment.querySelector('.txt > .image');
        if (inputData) {
                
            var inputImage = inputData.getElementsByTagName('IMG');
            if (inputImage.length > 0) inputImage = inputImage[0].src;
            else inputImage = false;
        }
        
        for (var i = 0; i < media.length; i++) {            
            if (media[i] && media[i].childNodes) { 
                    media[i].parentNode.removeChild(media[i]);
            }
        }
        
        var textareaText = txtContainerCopy.innerHTML.replace(/<br\s?\/?>/g,"\n");        
            textareaText = textareaText.split("\n");
            
        var textareaTextTmp = '';
        
        for (var i = 0; i < textareaText.length; i++) {
            textareaTextTmp += textareaText[i].trim() + "\n";
        }
        
        textareaText = decodeEntites(textareaTextTmp);
            
        return {textarea : textareaText, url : inputImage}
    }
    
    function showEditForm(comment) {
        
        if (comment.classList.contains(jEnv.className + '-comment-editing')) return;
                
        var txtContainer = comment.querySelector('.txt > div');  
            txtContainer.classList.add(jEnv.className + '-comment-text');
           
        var bounds = txtContainer.getBoundingClientRect();
        
        var postForm = getPostFormCopy();
            postForm.classList.add(jEnv.className + '-comment-edit-form');
        
        var resultLog = document.createElement('div');
            resultLog.classList.add(jEnv.className + '-log');
            
        postForm.appendChild(resultLog);
        
        var cancelBtn = KellyTools.getElementByClass(postForm, jEnv.className + '-edit-cancel');            
        var postBtn = KellyTools.getElementByClass(postForm, jEnv.className + '-edit-update');            
        var removeBtn = KellyTools.getElementByClass(postForm, jEnv.className + '-edit-remove');       
        var urlInput = KellyTools.getElementByClass(postForm, jEnv.className + '-edit-url');     
        var fileInput = KellyTools.getElementByClass(postForm, jEnv.className + '-edit-file');    
        
        KellyTools.getElementByClass(postForm, jEnv.className + '-edit-file-btn').onclick = selectImageInput;
        KellyTools.getElementByClass(postForm, jEnv.className + '-edit-url-btn').onclick = selectImageInput;        
        
        var onError = function(notice, code) {
            loading = false;
            postForm.classList.remove(jEnv.className + '-loading');
            resultLog.innerText = notice;    

            if (code && code >= 3000) { // unknown state - refresh page required to prevent accidently double create comment
                postBtn.setAttribute('data-unknown-error', 1);
            }
        }
        
        var onAfterCreate = function(newCommentHtml) {
            
            loading = false;                    
            postForm.classList.remove(jEnv.className + '-loading');  
            
            var newComment = KellyTools.setHTMLData(comment.nextSibling, newCommentHtml);            
            comment.parentNode.removeChild(comment);
            
            handler.onFormatComment(newComment);
            
            // comment.classList.remove(jEnv.className + '-comment-editing');            
            postForm.parentNode.removeChild(postForm);
        };
        
        var selectImageInput = function() {
            if (this.className.indexOf('file') != -1) {
                urlInput.style.display = 'none';
                fileInput.style.display = '';
            } else {
                urlInput.style.display = '';
                fileInput.style.display = 'none';
            }
        }      
        
        var editableData = getEditableData(comment);        
        if (editableData.url) {
            
                var urlInput = postForm.getElementsByClassName(jEnv.className + '-edit-url')[0];
                    urlInput.value = editableData.url;
                    urlInput.style.display = '';  

               fileInput.style.display = 'none'; 
        } 
        
        var textArea = postForm.getElementsByTagName('textarea')[0];
            textArea.value = editableData.textarea;
            textArea.style.height = parseInt(bounds.height + 40) + 'px';
            
        // todo detect already setted image 

        cancelBtn.onclick = function() {
            if (loading) return false;                
            
            comment.classList.remove(jEnv.className + '-comment-editing');
            postForm.parentNode.removeChild(postForm);
            
            return false;
        }
        
        removeBtn.onclick = function() {
            if (loading) return false;
            
            loading = true;  
            
            var commentRemoveData = new FormData();                        
                commentRemoveData.append("token", token);
            
            sendRemoveRequest(commentId, commentRemoveData, function() {
                
                loading = false;
                comment.parentNode.removeChild(comment);
                
            }, onError);
            
            return false;
        }
        
        postBtn.onclick = function() {
            
            if (loading) return false;
            
            if (postBtn.getAttribute('data-unknown-error')) {
                onError('Требуется обновить страницу');
                return false;
            }
            
            loading = true;                    
            postForm.classList.add(jEnv.className + '-loading');
            
            var postId = parseInt(comment.getAttribute('parent'));
            var parentId = comment.parentElement && comment.parentElement.classList.contains('comment_list') ? parseInt(comment.parentElement.id.match(/[0-9]+/g)) : false;
            var commentId = comment.parentElement.id.match(/[0-9]+/g);            
            
            var commentCreateData = new FormData();
                commentCreateData.append("token", token);
                commentCreateData.append("post_id", postId);
                commentCreateData.append("parent_id", parentId ? parentId : 0);
                commentCreateData.append("comment_text", textArea.value);
                
            var imageInput = postForm.getElementsByClassName('comment_picture')[0];
              
            if (imageInput.value && imageInput.files && imageInput.files.length >= 1) {
                imageInput.append(imageInput.name, imageInput.files[0]);
            }
            
            commentCreateData.append("comment_picture_url",  postForm.getElementsByClassName('comment_picture')[0].value);
            
            var commentRemoveData = new FormData();                        
                commentRemoveData.append("token", token);
             
            if (postBtn.getAttribute('data-comment-removed')) {
               
                sendCreateRequest(commentId, commentCreateData, onAfterCreate, onError);
                
            } else {
            
                sendRemoveRequest(commentId, commentRemoveData, function() {
                    
                    postBtn.setAttribute('data-comment-removed', 1);
                    
                    sendCreateRequest(commentId, commentCreateData, onAfterCreate, onError);
                    
                }, onError);
            }
        }     
        
        txtContainer.parentNode.insertBefore(postForm, txtContainer);        
        comment.classList.add(jEnv.className + '-comment-editing');   

        var postFormBounds = postForm.getBoundingClientRect();        
        var scrollTop = KellyTools.getScrollTop();
        
        if (postFormBounds.bottom < 0) {
            window.scrollTo(0, postFormBounds.top + scrollTop - 90);  
        }           
                    
    }
    
    this.onFormatComment = function(comment) {
       
        var deleteBtn = KellyTools.getElementByClass(comment, 'comment_link' /* 'delete' */);
        if (!deleteBtn) return; // not editable
        
        if (comment.getElementsByClassName(jEnv.className + '-comment-text').length) return; // already formated
        
        handler.initSessionData();
        
        var editBtn = document.createElement('a');
            editBtn.className = jEnv.className + '-edit';
            editBtn.href = '#';
            editBtn.innerText = 'редактировать';
            
        deleteBtn.parentNode.insertBefore(editBtn, deleteBtn);

        editBtn.onclick = function() {
            
            if (!token) {
                console.log('cant detect token id');
                return false; 
            }
            
            showEditForm(comment);
            
            return false;
        }
    }
}

kellyProfileJoyreactorEditTweak.getInstance = function() {
    if (typeof kellyProfileJoyreactorEditTweak.self == 'undefined') {
        kellyProfileJoyreactorEditTweak.self = new kellyProfileJoyreactorEditTweak();
    }
    
    return kellyProfileJoyreactorEditTweak.self;
}
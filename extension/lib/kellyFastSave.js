function KellyFastSave(cfg) {
    
    var handler = this;     
    
    this.downloadTooltip = false;    
    this.favEnv = false;
    this.tooltipOptions = false;
    this.beasyButtons = false; // false or pool of fastSave elements, if downloading in process
    
    function addPostMedia(postMedia) {
        
        var item = {
            pImage : postMedia,
            id : -1,
            categoryId : []
        };
            
        var conflict = handler.favEnv.getGlobal('fav').coptions.fastsave.conflict, dm = handler.favEnv.getDownloadManager();
        for (var i = 0; i < postMedia.length; i++) {
            dm.addDownloadItem(item, i, conflict);
        }
    }
    
    /*
        Check is download methods supported by browser
        return boolean
    */
    
    this.isAvailable = function() {
        
        return !handler.favEnv.isDownloadSupported ? false : true;
    }
    
    /*
        Reset any dowloads if something in work now. No any callbacks, see  download manager methods for more options
    */
    
    this.downloadCancel = function() {
        
        handler.favEnv.getDownloadManager().cancelDownloads();
    }
    
    this.showFastSaveButton = function(postBlock, placeholder, showButton, configurable, classPrefix) {
        
        var buttonClass =  classPrefix + '-fast-save' + (configurable ? ' ' + classPrefix + '-fast-save-configurable' : '');
        var iconClass =  classPrefix + '-icon-download' + (configurable ? '-configurable' : '');
        var fastSave = KellyTools.getElementByClass(placeholder, buttonClass);
        
        if (showButton) {
            
            if (!fastSave) {
                
                fastSave = document.createElement('DIV'); 
                fastSave.title = KellyLoc.s('', 'fast_download');     
                
                placeholder.appendChild(fastSave); 
                    
                var fastSaveBaseClass =  handler.favEnv.getGlobal('env').hostClass + ' ' + classPrefix + '-post-button-base ' + buttonClass + ' ' + iconClass + ' ';
            
                fastSave.className = fastSaveBaseClass + (configurable ? '' : classPrefix + '-fast-save-unchecked');
                fastSave.onclick = function() {
                    
                    if (this.className.indexOf('unavailable') != -1) return false;
                    
                    if (this.className.indexOf('loading') != -1) {
                        
                        handler.downloadCancel();
                        fastSave.classList.remove(classPrefix + '-fast-save-loading');                          
                        
                    } else {  
                        
                        var onDownloadSuccess = function(success) {                            
                            for (var i = 0; i < handler.beasyButtons.length; i++) {                                
                                handler.beasyButtons[i].classList.remove(classPrefix + '-fast-save-loading');
                                handler.beasyButtons[i].className = fastSaveBaseClass + classPrefix + '-fast-save-' + (success ? '' : 'not') + 'downloaded';
                            }
                            
                            handler.beasyButtons = false;
                        };
                        
                        var onDownloadInit = function() {   
                        
                            if (!handler.beasyButtons) handler.beasyButtons = [];
                            handler.beasyButtons.push(fastSave);
                            
                            fastSave.classList.remove(classPrefix + '-fast-save-unchecked');
                            fastSave.classList.add(classPrefix + '-fast-save-loading');
                        };
                        
                        // if something still loading, add to current process
                        
                        if (handler.favEnv.getDownloadManager().getState() == 'download' && handler.beasyButtons) {
                            
                            var additionMedia = handler.favEnv.getGlobal('env').getAllMedia(postBlock);
                            if (additionMedia && additionMedia.length > 0) {
                                
                                addPostMedia(additionMedia);
                                onDownloadInit();
                                
                                return false;
                            }
                        }
                        
                        if (configurable) {
                            handler.showDownloadPostDataForm(fastSave, postBlock, onDownloadSuccess, onDownloadInit);
                        } else {                        
                            handler.downloadPostData(postBlock, onDownloadSuccess, onDownloadInit);
                        }
                        
                    }
                    
                    return false;
                }  
            } 
            
        } else {
            
            if (fastSave) {
                fastSave.parentNode.removeChild(fastSave);
            }
                        
            fastSave = false;
        }
        
        return fastSave;
    }
    
    this.showDownloadPostDataForm = function(target, postData, onDownloadEnd, onDownloadInit) {
        
        if (handler.favEnv.getDownloadManager().getState() != 'wait') return;
        
        var env = handler.favEnv.getGlobal('env');
        var baseClass = env.className + '-download-tooltipster-';                 
        var options = handler.favEnv.getGlobal('fav').coptions;
        var lastQuality = !options.fastsave.qualityConfigurable ? 'hd' : options.fastsave.qualityConfigurable;
        
        var downloadClick = function(qualitySelector) { 
        
            if (qualitySelector) lastQuality = qualitySelector.getAttribute('data-quality') == 'hd' ? 'hd' : 'preview';
            
            options.fastsave.qualityConfigurable = lastQuality;
            options.fastsave.baseFolderConfigurable = KellyTools.validateFolderPath(KellyTools.getElementByClass(handler.downloadTooltip.getContent(), baseClass + 'download-folder').value); 
            
            handler.downloadTooltip.show(false);
            
            handler.favEnv.save('cfg', function() {
                
                handler.downloadPostData(postData, onDownloadEnd, onDownloadInit, {
                    baseFolder : options.fastsave.baseFolderConfigurable,
                    quality : lastQuality,
                });
                
            });
            
            return false; 
        };
        
         if (this.downloadTooltip && this.downloadTooltip.isShown() && this.downloadTooltip.getTarget() == target) {
             downloadClick();
             return;
         }
        
         if (!this.downloadTooltip) {
             this.downloadTooltip = new KellyTooltip({
                    target : target, 
                    offset : {left : 0, top : 8}, 
                    positionY : 'bottom',
                    positionX : 'right',
                    ptypeX : 'inside',                
                    ptypeY : 'outside',
                    avoidOutOfBounds : false,
                    closeButton : true,
                    closeByBody : true,
                    removeOnClose : false,                    
                    selfClass : env.hostClass + ' ' + env.className + '-download-tooltipster',
                    classGroup : env.className + '-tooltipster',
                });
         } else {
             this.downloadTooltip.updateCfg({
                 target : target,
             });
         }
         
         if (this.tooltipOptions) this.downloadTooltip.updateCfg(this.tooltipOptions);
        
        var baseFolder = !options.fastsave.baseFolderConfigurable ? options.fastsave.baseFolder : options.fastsave.baseFolderConfigurable;  
        var html = '\
            <div class="' + env.className + '-download-tooltipster-content">\
                <div>\
                    <!--p>#CURRENT_LOCATION#, #PUBLICATION_HOME#</p-->\
                    <p><input type="text" placeholder="' + KellyLoc.s('Сохранять в папку', 'fast_save_to') + '" value="' + baseFolder + '" class="' + baseClass + 'download-folder"></p>\
                    <p>\
                        <a href="#" data-quality="hd" class="' + baseClass + 'download-hd ' + (lastQuality == 'hd' ? 'active' : '')+ '">' + KellyLoc.s('Скачать оригинал (HD)', 'dowload_hd') + '</a>\
                        <a href="#" data-quality="preview" class="' + baseClass + 'download ' + (lastQuality != 'hd' ? 'active' : '')+ '">' + KellyLoc.s('Скачать превью', 'dowload_preview') + '</a>\
                    </p>\
                </div>\
            </div>';
            
        KellyTools.setHTMLData(handler.downloadTooltip.getContent(), html);

        KellyTools.getElementByClass(handler.downloadTooltip.getContent(), baseClass + 'download').onclick = function() { return downloadClick(this); };
        KellyTools.getElementByClass(handler.downloadTooltip.getContent(), baseClass + 'download-hd').onclick =  function() { return downloadClick(this); };
        
        this.downloadTooltip.show(true);
    }
    
    /*
        Asyc download publication. Download folder \ overwrite rules taken from main config - fav.coptions (handler.favEnv.getGlobal('fav'))
        
        postData - html element, publication container
        onGetState(state) - calls when state is recieved - return string ( 'downloaded' || 'notdownloaded' || 'unavailable' )
        
    */
    
    this.downloadPostData = function(postData, onDownloadEnd, onDownloadInit, dmOptions) {
        
        if (!handler.isAvailable()) {
            
            KellyTools.log('downloadPostData - download is not available', 'KellyFastSave');
            
            if (onDownloadEnd) onDownloadEnd(false);
            return false;
        }
                      
        var postMedia = handler.favEnv.getGlobal('env').getAllMedia(postData);        
        if (!postMedia || !postMedia.length) {
        
            KellyTools.log('downloadPostData - fail to get media from post', 'KellyFastSave');
            
            if (onDownloadEnd) onDownloadEnd(false);
            return false;
        }
        
        var dm = handler.favEnv.getDownloadManager();
        if (dm.getState() != 'wait') {
            
            KellyTools.log('downloadPostData - beasy state by something else ' + dm.getState(), 'KellyFastSave');
            
            if (onDownloadEnd) onDownloadEnd(false);
            return false;
        }
        
        var options = handler.favEnv.getGlobal('fav').coptions;
        
        dm.clearDownloads();
        dm.resetOptions();
        
        // reset events
        
        dm.updateCfg({
            events : false,
        });
        
        if (!dmOptions) {
            dmOptions = {    
                baseFolder : options.fastsave.baseFolder,
                nameTemplate : '#filename#',
            };
        }
        
        dmOptions.keepAliveTimer = options.grabber.keepAliveTimer;
        dmOptions.animationFormat = options.grabber.animationFormat;
        dmOptions.titleUpdate = false;
        
        if (dmOptions.baseFolder) {            
            var rootPlace = handler.favEnv.getGlobal('env').location.host.split('.')[0];            
            dmOptions.baseFolder = dmOptions.baseFolder.replace('#CURRENT_LOCATION#', rootPlace);
        }
        
        dm.updateCfg({
            options : dmOptions,
            events : {
                
                onOptionsUpdate : function() {
                    return true;
                },
                
                onUpdateView : function(handler) {
                    return true;
                },          
                
                onDownloadAllEnd : function(handler, result) { 
                    
                    handler.clearDownloads();
                    
                    KellyTools.log(result, 'KellyFastSave | downloadPostData');   
                    KellyTools.log(handler.getLog(), 'KellyFastSave | downloadPostData'); 
                    
                    var success = (result.complete == postMedia.length) ? true : false;
                    
                    if (onDownloadEnd) onDownloadEnd(success);
                },
            }
        });
        
        addPostMedia(postMedia);
        
        if (!dm.download()) {
            if (onDownloadEnd) onDownloadEnd(false);   
        }
        
        if (onDownloadInit) onDownloadInit();
        return true;
    }
 
    /*
        Asyc check is publication already downloaded - currently unused because of slow performanse with big download log 
        
        postData - html element, publication container
        onGetState(state) - calls when state is recieved - return string ( 'downloaded' || 'notdownloaded' || 'unavailable')
        
    */
    
    this.downloadCheckState = function(postData, onGetState) {
    
        if (!handler.isAvailable()) return;
        
        var postMedia = handler.favEnv.getGlobal('env').getAllMedia(postData);        
        if (postMedia && postMedia.length) {
            
            var onSearch = function(response) {
                
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = false;
                }
                
                if (response && response.matchResults && response.matchResults[0].match && response.matchResults[0].match.state == 'complete') {
                                        
                    KellyTools.log(response, 'KellyFastSave | downloadCheckState');   
                    
                    onGetState('downloaded');
                } else {
                    // error \ timeout or not downloaded
                    onGetState('notdownloaded');
                }     
            }
            
            var timeout = setTimeout(function() {
                onSearch(false);
            }, 4000);
                   
            var downloadFolder = handler.favEnv.getGlobal('fav').coptions.fastsave.baseFolder;
                   
            KellyTools.getBrowser().runtime.sendMessage({
                method: "isFilesDownloaded", 
                filenames : [KellyTools.validateFolderPath(downloadFolder) + '/' + KellyTools.getUrlFileName(handler.favEnv.getGlobal('env').getImageDownloadLink(postMedia[0]))]
            }, onSearch);
        
        } else {
            onGetState('unavailable');
        }     
    }
}
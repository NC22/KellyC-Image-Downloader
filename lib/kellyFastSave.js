function KellyFastSave(cfg) {
    
    var handler = this;   
    
    this.favEnv = false;
    
    this.isAvailable = function() {
                
        if (!handler.favEnv.isDownloadSupported || !handler.favEnv.getGlobal('fav').coptions.fastsave.enabled) {
            return false;
        } else return true;
    }
    
    this.downloadCancel = function() {
        
        handler.favEnv.getDownloadManager().cancelDownloads();
    }
        
    this.downloadPostData = function(postData, onDownload) {
        
        if (!handler.isAvailable()) return false;
                      
        var postMedia = handler.favEnv.getGlobal('env').getAllMedia(postData);        
        if (!postMedia || !postMedia.length) {            
            if (onDownload) onDownload(false);
        }
        
        var dm = handler.favEnv.getDownloadManager();
        if (dm.getState() != 'wait') {            
            if (onDownload) onDownload(false);
            return false;
        }
        
        var options = handler.favEnv.getGlobal('fav').coptions;
        
        dm.clearDownloads();
        dm.resetOptions();
        
        dm.updateCfg({
            events : false,
        });
        
        dm.updateCfg({
            options : {    
                baseFolder : options.fastsave.baseFolder,
                nameTemplate : '#filename#',
            },
            events : {
                
                onUpdateView : function(handler) {
                    return true;
                },          
                
                onDownloadAllEnd : function(handler, result) { 
                
                    handler.clearDownloads();
                    
                    KellyTools.log(result, 'KellyFastSave | downloadPostData');   
                    var success = (result.complete == postMedia.length) ? true : false;
                    
                    if (onDownload) onDownload(success);
                },
            }
        });
        
        for (var i = 0; i < postMedia.length; i++) {
            dm.addDownloadItem({
                pImage : postMedia,
                id : -1,
                categoryId : []
            }, i, options.fastsave.conflict);
        }
                
        KellyTools.getBrowser().runtime.sendMessage({method: "onChanged.keepAliveListener"}, function(response) {
            if (!dm.download()) {
                if (onDownload) onDownload(false);   
            }
        }); 

         return true;
    }
 
    this.downloadCheckState = function(postData, onGetState) {
    
        if (!handler.isAvailable()) return;
        
        var postMedia = handler.favEnv.getGlobal('env').getAllMedia(postData);        
        if (postMedia && postMedia.length) {
            
            var onSearch = function(response) {
                
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = false;
                }
                
                if (response && response.matchResults && response.matchResults[0].match) {
                    onGetState('downloaded');
                } else {
                    // error \ timeout or not downloaded
                    onGetState('notdownloaded');
                }     
            }
            
            var timeout = setTimeout(function() {
                onSearch(false);
            }, 4000);
                   
            KellyTools.getBrowser().runtime.sendMessage({
                method: "isFilesDownloaded", 
                filenames : [KellyTools.getUrlFileName(handler.favEnv.getGlobal('env').getImageDownloadLink(postMedia[0]))]
            }, onSearch);
        
        } else {
            onGetState('unavailable');
        }     
    }

}
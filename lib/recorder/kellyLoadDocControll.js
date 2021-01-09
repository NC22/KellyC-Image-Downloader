function KellyLoadDocControll(cfg) 
{    
    var handler = this;
    var lng = KellyLoc;
    var total = 0, fail = 0, qImages = 0;
    
    this.storage = false;
    this.filtered = false; 
    
    var stage = 'off'; // step 1. - loadDoc - download data from related links / step 2. - loadImg - check proportions for loaded images from related doc
    
    this.docs = []; // common list of all related docs from all storage items (used to prevent add duplicate jobs)  

    /*
        docsImages.push({
            src : (detected image link)
            groups : (assigned groups - unused)
            relatedItem : (original item data attached to request by [handler.thread.addJob] method) 
            untrustedData : if false - means that item not required in passing step 2. and can be added as "Original image" immidiatly
        }
    */
    
    this.docsImages = []; // list of images that loaded from all related documents on step 1. by parseImagesDocByDriver | parseImages methods
    
    this.srcs = []; // common list of all currently selected image sources and added related doc images, contains filtered related images srcs by default
    
    this.events = {}; // onQualityImageFound onAllImagesLoaded
    
    this.imageLoader = false;  
    this.parser = false;
    this.tread = false;
    
    
    function constructor(cfg) {
         
        // todo set protocol / method / addition rules by driver - handler.parser.onRelatedDocJobCreate, handler.parser.onRelatedJobResponse
        
        if (cfg.storage) handler.storage = cfg.storage;
        if (cfg.filtered) handler.filtered = cfg.filtered;
                 
        handler.thread = new KellyThreadWork(cfg.threadOptions && typeof cfg.threadOptions['pauseEvery'] != 'undefined' ? cfg.threadOptions : KellyLoadDocControll.threadDefaults);

        handler.parser = new KellyPageWatchdog();
        handler.imageLoader = false;
    }   

    handler.log = function(txt) {
        
        console.log(txt);
    }
    
    handler.addDocItem = function(docItem) {
        if (handler.srcs.indexOf(docItem.src) == -1) {
            handler.srcs.push(docItem.src);
            handler.events.onQualityImageFound(docItem.relatedItem, docItem);
            qImages++;
            return true;
        } else {
            docItem.refused = 'duplicate';
            return false;  
        }            
    }
    
    handler.runImgLoad = function() {
        
        if (handler.docsImages.length <= 0) return false;
        
        stage = 'loadImg', total = handler.docsImages.length, qImages = 0;
        
        handler.docsImages.forEach(function(docImage) {
           if (!docImage.untrustedData) handler.addDocItem(docImage);
        });
        
        handler.updateState('beforeImageLoad');
        
        handler.imageLoader = KellyLoadDocControll.createImageLoaderController({
            onEnd : function(reason) {
                 
                 if (reason == 'stop') return;
                 
                 var items = handler.storage.items;
                 for (var i = 0; i < handler.docsImages.length; i++) {
                    if (!handler.docsImages[i].untrustedData) continue;
                    
                    if (handler.events.onRelatedDocImageCheck && handler.events.onRelatedDocImageCheck(handler.docsImages[i]) === true) continue;
                    
                    if (!handler.docsImages[i].relatedItem.pw || (handler.docsImages[i].relatedItem.pw <= handler.docsImages[i].pw && handler.docsImages[i].relatedItem.ph <= handler.docsImages[i].ph)) {
                        handler.addDocItem(handler.docsImages[i]);
                    } else handler.docsImages[i].refused = 'proportions';
                 }
                 
                 stage = 'off';
                 handler.events.onStagesEnd('done', qImages);
            },                    
            onAskJob : function(controller) {
                
                 if (!handler.docsImages.length) return false;
                 
                 for (var i = 0; i < handler.docsImages.length; i++) {
                    if (handler.docsImages[i].untrustedData && !handler.docsImages[i].pw) return {src : handler.docsImages[i].src, item : handler.docsImages[i]}; 
                 }
                 
                 return false;
            },
            onImageLoad : function(controller, item, proportions, error) {
                
                if (error) {
                    console.log(item);
                    console.log('[onImageLoad] ' + error);
                }
                
                item.pw = proportions[0];
                item.ph = proportions[1];
                
                handler.updateState('onImageLoad');
            },
        });
        
        handler.imageLoader.run();
        return true;
    }
    
    handler.onDownloadDocEnd = function(reason) {
        
        handler.log('Load jobs is done [reason : ' + reason + ']');
        
        stage = 'off';
        
        if (reason != 'stop') {
            handler.updateState('onDownloadDocEnd');
        }
    }

    handler.onDownloadDoc = function(self, thread, jobsLength) {
        
        var error = '';
        
        if (!thread.response) {
        
            error = 'Документ не доступен [' + thread.job.url + '] (ошибка загрузки или превышен интервал ожидания)'; // window.document null  
            if (thread.error) {
                error += ' | Ошибка : [' + thread.error + ']';
            }
            
            // restart ?
            
            // handler.addJob(
            //    thread.job.url, 
            //    KellyDPage.onDownloadDoc, 
            //    thread.job.data
            // );
            
        } else {
            
            handler.parser.imagesPool = [];             
            handler.parser.url = thread.job.url;
            handler.parser.host = KellyTools.getLocationFromUrl(thread.job.url).hostname; 
            handler.parser.untrustedData = false;
            handler.parser.parseImagesDocByDriver(thread);  
            
            if (handler.parser.imagesPool.length == 0) {
                
                if (thread.request.contentType.indexOf('image') != -1) {
                    thread.response = '<body><img src="' + thread.job.url + '"></body>';
                }
                
                if (typeof thread.response == 'string') {
                                   
                    handler.parser.untrustedData = true;
                    thread.loadDoc = KellyTools.val(KellyTools.validateHtmlDoc(thread.response), 'html');
                    handler.parser.parseImages(thread.loadDoc);                
                    KellyTools.stopMediaLoad(thread.loadDoc);
                } 
            }
            
            // todo - optional put this info to log el on page
            handler.log('[LOADED] ' + thread.job.url + ' - images found : ' + handler.parser.imagesPool.length);
            
            for (var i = 0; i < handler.parser.imagesPool.length; i++) {
                
                handler.parser.imagesPool[i].relatedSrc.forEach(function(src, index) {
                    
                    handler.docsImages.push({
                        src : src,
                        groups : handler.parser.imagesPool[i].relatedGroups && handler.parser.imagesPool[i].relatedGroups[index] ? handler.parser.imagesPool[i].relatedGroups[index] : [], // currently unused
                        relatedItem : thread.job.data, // item data attached to request by [handler.thread.addJob] method 
                        untrustedData : handler.parser.untrustedData,
                    });
                    
                });
            }
        }
        
        handler.updateState('onDownloadDoc');
        
        if (error) {
        
            handler.errors += error;
            handler.log(error);
           
            return;
        }
            
    }
    
    handler.updateState = function(context) {
        
        var stat = false, trustedImages = 0;
        
        for (var i = 0; i < handler.docsImages.length; i++) {
            if (!handler.docsImages[i].untrustedData || handler.docsImages[i].pw) trustedImages++;
        }
        
        if (stage == 'loadDoc') {
            
            stat = { total : total, current : total - handler.thread.getJobs().length, images : handler.docsImages.length, trustedImages : trustedImages };
            
        } else if ( stage == 'loadImg') {
            
            stat = { total : total, current : trustedImages};
        }
        
        handler.events.onUpdateState(stage, context, stat);        
    }
    
    handler.stop = function() {
        if (stage == 'loadDoc') {
            handler.thread.stop();
        } else if (stage == 'loadImg') {
            handler.imageLoader.stop();
        }
        
        handler.events.onStagesEnd('stop');
        handler.reset();
    }
    
    handler.reset = function() {
          
        handler.docs = [];
        handler.docsImages = [];
        handler.srcs = [];
        
        stage = 'off';
        total = 0;
    }
    
    handler.run = function() {
        
        handler.reset();
        
        stage = 'loadDoc';
        
        var items = handler.storage.items;
        
        for (var i = 0; i < handler.filtered.length; i++) {
            var item = items[handler.filtered[i]];
            if (item.relatedDoc && handler.docs.indexOf(item.relatedDoc) == -1) {
                
                handler.srcs.push(item.pImage);
                handler.docs.push(item.relatedDoc); 
                total++;
                
                handler.thread.addJob(
                    item.relatedDoc, 
                    handler.onDownloadDoc, 
                    item
                ); 
            }
        }
        
        handler.log('Start processing documents ' + handler.docs.length + ' from selected ' + handler.filtered.length);
        handler.updateState('run');
        
        handler.thread.setEvent('onEnd', handler.onDownloadDocEnd);
        handler.thread.exec(); 
    }
    
    handler.getCurrentStage = function() {
        return stage;
    }
   
    constructor(cfg);
}


// events - onImageLoad | onAskJob | onStop

/*
KellyDPage.createImageLoaderController({
    onAskJob : function(controller) {
         var items = K_FAV.getGlobal('fav').items;
         for (var i = 0; i < items.length; i++) {
            if (!items[i].pw) return {src : items[i].pImage, item : items[i]};
         } 

         // jobEnd - refresh statistic \ filtered data
    },
    onImageLoad : function(controller, item, proportions, error) {
        
         item.pw = proportions[0];
         item.ph = proportions[1];
    },
})
*/

KellyLoadDocControll.createImageLoaderController = function(events) {
            
    var controller = new Object();
        controller.events = events;
        controller.loadingBWorkers = [];
        controller.loadingBWorkersMax = 5;
        // todo add timeout
        controller.stop = function() { // stop on goto new page

             for (var i = 0; i < controller.loadingBWorkers.length; i++) {
                    controller.loadingBWorkers[i].src = '';
                    controller.loadingBWorkers[i].onload = function() {};
                    controller.loadingBWorkers[i].onerror = function() {};
             }
             
             if (controller.events.onEnd) controller.events.onEnd('stop');
        }

        controller.run = function() {
             
             if (controller.loadingBWorkers.length >= controller.loadingBWorkersMax) return;
                 
             var job = controller.events.onAskJob(controller);         
             if (!job && controller.loadingBWorkers.length == 0) {
                 if (controller.events.onEnd) controller.events.onEnd('done');
             }
             
             if (!job) return;
             
             var endJob = function () {         
                 if (controller.loadingBWorkers.indexOf(image) != -1) controller.loadingBWorkers.splice(controller.loadingBWorkers.indexOf(image), 1);
             }
             
             var image = document.createElement('IMG');
                 image.src = job.src;
                 
                 image.onerror = function() { 

                        console.log('[IMAGE LOAD ERROR] - ' + image.src);
                        
                        endJob(); 
                        controller.events.onImageLoad(controller, job.item, [-1, -1], true);
                        controller.run();
                 };
                 
                 image.onload = function() {                 
                        endJob();
                        controller.events.onImageLoad(controller, job.item, [parseInt(image.naturalWidth), parseInt(image.naturalHeight)]);
                        controller.run();
                 }
                 
                controller.loadingBWorkers.push(image);
        }
    
    return controller;
}


KellyLoadDocControll.threadDefaults = {   
    pauseEvery : '50',
    pauseTimer : '1.2,1.8,2,2.4,2.8',
    timeout : '5',
    timeoutOnEnd : '0.8',
    maxThreads : '1',
}
    
KellyLoadDocControll.initOptions = function(optionsManager) {
    optionsManager.tabData['BaseOptions'].parts['recorder_request_settings'] = [];
    var notice = false;
    for (var k in KellyLoadDocControll.threadDefaults){
        var type = 'varlist-float';
        
             if (k == 'timeout') type = 'float';
        else if (k == 'maxThreads') type = 'int';
        
        optionsManager.tabData['BaseOptions'].parts['recorder_request_settings'].push('recorder_thread_' + k);
        optionsManager.cfgInput['recorder_thread_' + k] = {loc : 'thread_' + k, name : k, parent : 'recorderThread', type : type, default : KellyLoadDocControll.threadDefaults[k]};
        if (!notice) {
            notice = true;
            optionsManager.cfgInput['recorder_thread_' + k]['noticeUp'] = 'thread_sec_notice';
        }
    }
}
function KellyLoadDocControll(cfg) 
{    
    var handler = this;
    var lng = KellyLoc;
    var total = 0, fail = 0, qImages = 0;
    
    this.storage = false;
    this.filtered = false; 
    
    var stage = 'off'; // step 1. - loadDoc - download data from related links / step 2. - loadImg - check proportions for loaded images from related doc
    
    var validatorIndex = false;
    
    this.additionOptions = {
        'relatedDocDeepSearch' : false, // if true - always use 2-steps process
        'relatedDocTrustedUrl' : false, // replaces _validators.js by custom input url string for mark items as trusted images by handler.parser[KellyPageWatchdog].parseImages() method
        'relatedDocTrustedUrlReg' : false, // is input url string is reg-exp
    };
    
    this.docs = []; // common list of all related docs from all storage items (used to prevent add duplicate jobs)  

    /*
        docsImages.push({
            src : (detected image link)
            groups : (assigned groups - unused), referer - takes from relatedItem
            relatedItem : (original item data attached to request by [handler.thread.addJob] method) 
            untrustedData : False - image marked as ORIGINAL (stage 2. not required) and can be added as "Original image" immidiatly
        }
    */
    
    this.docsImages = []; // list of images that loaded from all related documents on step 1. by parseImagesDocByDriver | parseImages methods
    
    this.srcs = []; // common list of all currently selected image sources and added related doc images, contains filtered related images srcs by default
    
    this.events = {}; // onQualityImageFound onAllImagesLoaded
    
    this.imageLoader = false;  
    this.parser = false;
    
    this.thread = false;
    this.threadOptions = false;
    
    function constructor(cfg) {
        // todo - configure image loader thread num
        // todo set protocol / method / addition rules by driver - handler.parser.onRelatedDocJobCreate, handler.parser.onRelatedJobResponse
        
        if (cfg.storage) handler.storage = cfg.storage;
        if (cfg.filtered) handler.filtered = cfg.filtered;
                 
        handler.threadOptions = cfg.threadOptions && typeof cfg.threadOptions['pauseEvery'] != 'undefined' ? cfg.threadOptions : KellyLoadDocControll.threadDefaults;
        handler.thread = new KellyThreadWork(handler.threadOptions);

        handler.parser = new KellyPageWatchdog();
        handler.imageLoader = false;
    }   

    handler.log = function(txt) {
        
        console.log(txt);
    }
    
    handler.getStat = function() {
        
        var stat = false, trustedImages = 0;
        
        for (var i = 0; i < handler.docsImages.length; i++) {
            if (
                !handler.docsImages[i].untrustedData || 
                handler.docsImages[i].pw // will be undefined until loadImg stage
               ) trustedImages++;
        }
        
        if (stage == 'loadDoc') {
            
            stat = { 
                total : total, // number of related docs
                current : total - handler.thread.getJobs().length, // load docs left 
                images : handler.docsImages.length, // number of images founded in documents
                trustedImages : trustedImages, // images that marked by validator as trusted original image
            };
            
        } else if ( stage == 'loadImg') {
            
            stat = {
                total : total, // total images 
                current : trustedImages, // checked \ loaded images
                addedImaged : qImages, // images that was added after checks
           };
           
        }
        
        return stat;
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
        
        if (qImages > 0 && !handler.additionOptions.relatedDocDeepSearch) { // todo - check - maybe more usefull not check qImages num and always stop on relatedDocDeepSearch = false ?
             stage = 'off';
             handler.events.onStagesEnd('done', qImages);
             return false;
        }
        
        handler.updateState('beforeImageLoad');
        
        handler.imageLoader = KellyLoadDocControll.createImageLoaderController({
            onEnd : function(reason) {
                 
                 if (reason == 'stop') return;
                 
                 var items = handler.storage.items;
                 for (var i = 0; i < handler.docsImages.length; i++) {
                    if (!handler.docsImages[i].untrustedData) continue;
                    
                    if (handler.events.onRelatedDocImageCheck && handler.events.onRelatedDocImageCheck(handler.docsImages[i]) === true) continue;
                    
                    // todo - optional check ratio - preview can have different ratio because of crop for ex ? | optional skip other if one original found ?
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
                    if (handler.docsImages[i].untrustedData && !handler.docsImages[i].pw) {
                        handler.docsImages[i].pw = -2; handler.docsImages[i].ph = -2; // mark as - load in progress
                        return {src : handler.docsImages[i].src, item : handler.docsImages[i]}; 
                    }
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
        }, handler.threadOptions);
        
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
            
            // restart on Fail ? n attempts ?
            
            // handler.addJob(
            //    thread.job.url, 
            //    KellyDPage.onDownloadDoc, 
            //    thread.job.data
            // );
            
        } else {
            
            var threadLocation = KellyTools.getLocationFromUrl(thread.job.url);
            
            handler.parser.imagesPool = [];   
            handler.parser.setLocation({url : thread.job.url, host : threadLocation.origin}); // KellyTools.getLocationFromUrl(thread.job.url).hostname
           
            // untrustedData - can we be sure that collected handler.parser.imagesPool is original HD images
            // If false - add images as originals to final results ( handler.parser.imagesPool -> handler.docsImages -> onQualityImageFound -> KellyDPage.addStorageItem) without check [width x height]
            // Trust by default if some thing added by external site driver
            
            handler.parser.untrustedData = false;

            // Optional addition validator setted by user via extended options
            if (handler.additionOptions.relatedDocTrustedUrl) {
                
                handler.parser.customValidators = [{
                    url : handler.parser.url, 
                    host : threadLocation.host, 
                    patterns : [[handler.additionOptions.relatedDocTrustedUrlReg ? new RegExp(handler.additionOptions.relatedDocTrustedUrl) : handler.additionOptions.relatedDocTrustedUrl, 'imageByDocument']]
                }];
                
            } else handler.parser.customValidators = false;
            
            // try to add data to handler.parser.imagesPool by external driver - if fail - read data by default controller
            
            if (handler.parser.parseImagesDocByDriver(thread) !== true) { 
                
                // Content-type image
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
                    
                    var itemGroups = handler.parser.imagesPool[i].relatedGroups && handler.parser.imagesPool[i].relatedGroups[index] ? handler.parser.imagesPool[i].relatedGroups[index] : [];
                    
                    // array, that will be used in callback KellyDPage.aDProgress.docLoader.events.onQualityImageFound, after all image proportions will be loaded (or will be used imidiatly if untrustedData = false)
                    
                    handler.docsImages.push({
                        src : src,
                        groups : itemGroups, // itemGroups currently only used here in untrustedData key for check is trusted item or not (trusted group - imageByDocument)
                        relatedItem : thread.job.data, // item data attached to request by [handler.thread.addJob] method 
                        untrustedData : itemGroups.indexOf('imageByDocument') != -1 ? false : handler.parser.untrustedData,
                    });
                    
                });
            }
        }
        
        handler.updateState('onDownloadDoc'); // after preparations on event in controller, handler.runImgLoad will be called
        
        if (error) {
        
            handler.errors += error;
            handler.log(error);
           
            return;
        }
            
    }
    
    handler.updateState = function(context) {
        
        handler.events.onUpdateState(stage, context, handler.getStat());        
    }
    
    handler.stop = function() {
        if (stage == 'loadDoc') {
            handler.thread.stop();
        } else if (stage == 'loadImg') {
            handler.imageLoader.stop();
        }
        
        handler.events.onStagesEnd('stop', qImages);
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

KellyLoadDocControll.createImageLoaderController = function(events, cfg) {
            
    var controller = new Object();
        controller.events = events;
        controller.loadingBWorkers = [];
        
        // console.log(cfg);
        // configurable params before .run()
        
        controller.loadingBWorkersMax = cfg && cfg.imgLoaderMaxThreads ? parseInt(cfg.imgLoaderMaxThreads) : 3; 
        controller.timeout = cfg && cfg.imgLoaderTimeout ? cfg.imgLoaderTimeout : 35; // max seconds for one job
      
        controller.stop = function() { // stop on goto new page

             for (var i = 0; i < controller.loadingBWorkers.length; i++) controller.loadingBWorkers[i].stopJob();
             if (controller.events.onEnd) controller.events.onEnd('stop');
        }

        controller.run = function() {
                        
            for (var i = 1; i <= controller.loadingBWorkersMax; i++) {
                if (!controller.applayJob()) break;
            }
            
            console.log('[IMAGE LOAD RUN] - Threads : ' + controller.loadingBWorkersMax + ' | Timeout : ' + controller.timeout + ' | Start workers : ' + controller.loadingBWorkers.length);
            return controller.loadingBWorkers;
        }

        controller.applayJob = function() {
             
             if (controller.loadingBWorkers.length >= controller.loadingBWorkersMax) {
                 return false;
             }
             
             var job = controller.events.onAskJob(controller);    
                 
             if (!job && controller.loadingBWorkers.length == 0) {
                 if (controller.events.onEnd) controller.events.onEnd('done');
             }
             
             if (!job) {
                 return false;
             }
             
             var endJob = function () {   
                 
                 job.stopJob();
                 
                 if (controller.loadingBWorkers.indexOf(job) != -1) {
                     controller.loadingBWorkers.splice(controller.loadingBWorkers.indexOf(job), 1);
                 }
                 
                 controller.applayJob();
             }
             
             var endJobByTimeout = function() {
                 
                 console.log('[IMAGE LOAD ERROR] - Timeout - ' + job.imageEl.src);
                 endJob(); 
             }
             
            job.imageEl = document.createElement('IMG');
            job.imageEl.onerror = function() { 

                console.log('[IMAGE LOAD ERROR] - ' + this.src);

                controller.events.onImageLoad(controller, job.item, [-1, -1], true);
                endJob();
            };
                 
            job.imageEl.onload = function() {                 

                var newBounds = [parseInt(this.naturalWidth), parseInt(this.naturalHeight)];
                                
                if (!newBounds[0] || !newBounds[1]) {
                    
                    console.log('[IMAGE LOAD ERROR] - Fail to read bounds, but image is loaded ' + this.src);                        
                    controller.events.onImageLoad(controller, job.item, [-1, -1], true);
                } else {

                    controller.events.onImageLoad(controller, job.item, newBounds);
                }

                endJob();
            }

            job.imageEl.src = job.src;
            job.loadTimeout = setTimeout(endJobByTimeout, controller.timeout * 1000);
            job.stopJob = function() {

                if (job.stopped) return;

                job.imageEl.src = '';
                job.imageEl.onload = function() {};
                job.imageEl.onerror = function() {};
                
                if (job.loadTimeout !== false) {
                    clearTimeout(job.loadTimeout);
                    job.loadTimeout = false;
                }
                
                job.stopped = true;
            }
              
            controller.loadingBWorkers.push(job);
            return true;
        }
    
    return controller;
}

KellyLoadDocControll.threadDefaults = {   
    pauseEvery : '50', // varlist
    pauseTimer : '1.2,1.8,2,2.4,2.8', // varlist
    timeout : 5,
    timeoutOnEnd : '0.8', // varlist
    maxThreads : 1,
    imgLoaderTimeout : 25,
    imgLoaderMaxThreads : 3,
}

KellyLoadDocControll.validateCfg = function(data) {
    
    if (!data.coptions.recorderThread) data.coptions.recorderThread = {};
    for (var k in KellyLoadDocControll.threadDefaults){
        if (typeof data.coptions.recorderThread[k] == 'undefined') data.coptions.recorderThread[k] = KellyLoadDocControll.threadDefaults[k];          
    }
}

KellyLoadDocControll.initOptions = function(optionsManager) {
    
    optionsManager.tabData['BaseOptions'].parts['recorder_request_settings'] = [];
    optionsManager.tabData['BaseOptions'].parts['recorder_image_request_settings'] = [];
     
    var notice = false;
    
    for (var k in KellyLoadDocControll.threadDefaults){
        
        var type = 'varlist-float', block = 'recorder_request_settings';
        
             if (['timeout', 'imgLoaderTimeout'].indexOf(k) != -1) type = 'float';
        else if (['maxThreads', 'imgLoaderMaxThreads'].indexOf(k) != -1) type = 'int';
        
        if (['imgLoaderMaxThreads', 'imgLoaderTimeout'].indexOf(k) != -1) block = 'recorder_image_request_settings';
        
        optionsManager.tabData['BaseOptions'].parts[block].push('recorder_thread_' + k);
        optionsManager.cfgInput['recorder_thread_' + k] = {loc : 'thread_' + k, name : k, parent : 'recorderThread', type : type, default : KellyLoadDocControll.threadDefaults[k]};
         
        if (!notice) {
            notice = true;
            optionsManager.cfgInput['recorder_thread_' + k]['noticeUp'] = 'thread_sec_notice';
        }
    }
}
var KellyEDRecorder = new Object;
    KellyEDRecorder.cacheEnabled = false;
    KellyEDRecorder.recorder = {};
    
    // todo - save recorder state cache for manifest v3
    
    KellyEDRecorder.getDefaultRecorder = function() {
        return {
            images : [],     // array of founded images, could be collected from various tabs - see kellyPageWatchdog (imagesPool = []) for object description
            record : false,  // is recording enabled
            cats : {},       // array of category objects that extends KellyDPage.cats
            host : false,    // used as profile name only, images[] could be taken from various hosts and contain different [referrer]
            url : false,     // used as profile name only
            srcs : [],       // list of all added relatedSrc strings during record process, to prevent dublicates
        };
    }
    
    KellyEDRecorder.loadState = function() {
        KellyEDispetcher.api.storage.local.get('kelly_cache_recorder', function(response) {
            
            var result = 'OK';
            if (KellyEDispetcher.api.runtime.lastError) {
                result = KellyEDispetcher.api.runtime.lastError.message;
            }
            
            if (!response || response === null || !response['kelly_cache_recorder'] || typeof response['kelly_cache_recorder'].srcs == 'undefined') {
                result = 'Bad storage item - Reset';
                response['kelly_cache_recorder'] = KellyEDRecorder.getDefaultRecorder();
            } 
            
            KellyEDRecorder.recorder = response['kelly_cache_recorder'];
            KellyTools.log('[loadState] [' + result + ']', 'KellyEDRecorder');  
        });
    }
    
    // base64 items can be very heavy, calc max size ?
    
    KellyEDRecorder.saveState = function() {
        
        KellyEDispetcher.api.storage.local.set({'kelly_cache_recorder' : KellyEDRecorder.recorder}, function() {
            
            var result = 'OK';
            if (KellyEDispetcher.api.runtime.lastError) {
                result = KellyEDispetcher.api.runtime.lastError.message;
            }
            
            KellyTools.log('[saveState] [' + result + ']', 'KellyEDRecorder');
        });
    }
    
    KellyEDRecorder.init = function() {
        
        KellyEDRecorder.cacheEnabled = KellyTools.getManifestVersion() > 2 ? true : false;
        if (KellyEDRecorder.cacheEnabled) KellyEDRecorder.loadState();
        
        KellyEDispetcher.events.push({onMessage : KellyEDRecorder.onMessage});
    }
    
    KellyEDRecorder.onMessage = function(dispetcher, data) {
        
        var response = data.response; // default response array {senderId : 'dispetcher', error : '', method : request.method,}
        var request = data.request;
        var callback = function (cacheUpdate) {
           
           if (cacheUpdate && KellyEDRecorder.cacheEnabled) KellyEDRecorder.saveState(); 
           if (data.callback) data.callback(response);
           
           return true;
        }
        
        if (request.method == 'addRecord') {
            
            response.imagesNum = 0;
            
            if (request.clean) { // start record and skip check recording state
                       
                 KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
                     
            } else if (!KellyEDRecorder.recorder.record) { // add if recording
                
                response.error = 'Record is not enabled';
                return callback();
            }
            
            if (request.host && !KellyEDRecorder.recorder.host) {
                
                KellyEDRecorder.recorder.host = request.host;
                KellyEDRecorder.recorder.url = request.url;
            }
            
            KellyTools.log('[addRecord] : images : ' + request.images.length + ' | cats : ' + (request.cats ? Object.keys(request.cats).length : 'not setted'));
            
            // addition categories information (color \ name etc.)
            
            if (request.cats) {
                
                for (var k in request.cats) {
                    
                    if (typeof KellyEDRecorder.recorder.cats[k] == 'undefined') {
                        
                        KellyEDRecorder.recorder.cats[k] = request.cats[k];
                    }
                }
            }
    
            if (request.images) {
                                
                for (var i = 0; i < request.images.length; i++) {
                    
                    var validatedSrc = [], validatedGroups = [];
                    
                    for (var srcIndex = 0; srcIndex < request.images[i].relatedSrc.length; srcIndex++) {
                        
                        if (KellyEDRecorder.recorder.srcs.indexOf(request.images[i].relatedSrc[srcIndex]) != -1) {
                            
                            if (!request.allowDuplicates) continue;
                            // console.log('skip ' + request.images[i].relatedSrc[srcIndex]);                
                            
                        } else {
                            
                            KellyEDRecorder.recorder.srcs.push(request.images[i].relatedSrc[srcIndex]);
                        }
                        
                        validatedSrc.push(request.images[i].relatedSrc[srcIndex]);
                        if (request.images[i].relatedGroups && request.images[i].relatedSrc[srcIndex]) validatedGroups[srcIndex] = request.images[i].relatedGroups[srcIndex];
                    }
                    
                    if (validatedSrc.length > 0) {
                        
                        request.images[i].relatedSrc = validatedSrc;
                        
                        if (validatedGroups.length > 0) request.images[i].relatedGroups = validatedGroups;
                        else delete request.images[i].relatedGroups;
                        
                        KellyEDRecorder.recorder.images.push(request.images[i]);
                    } else {
                        // console.log('skip, no new images');
                        // console.log(KellyEDRecorder.recorder.images[i]);
                    }
                }  
            }
            
            // todo - skip save state for zero
            response.imagesNum = KellyEDRecorder.recorder.images.length;
            return callback(true);
            
        } else if (request.method == 'getRecord') {
            
            if (!KellyEDRecorder.recorder || !KellyEDRecorder.recorder.images) {
                KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
            }
            
            response.images = KellyEDRecorder.recorder.images;
            response.cats = KellyEDRecorder.recorder.cats;
            response.url = KellyEDRecorder.recorder.url;
            response.host = KellyEDRecorder.recorder.host;
            
            return callback();
            
        } else if (request.method == 'startRecord') {
            
            response.isRecorded = true; 
            
            KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();            
            KellyEDRecorder.recorder.record = true;
            
            return callback(true);
            
        }  else if (request.method == 'stopRecord') {
            
            if (request.clean) KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
            
            response.isRecorded = false;
            response.imagesNum = KellyEDRecorder.recorder.images.length;
            KellyEDRecorder.recorder.record = false;
            
            return callback(true);
            
        } else if (request.method == 'isRecorded') {
            
            response.isRecorded = KellyEDRecorder.recorder.record ? true : false; 
            response.imagesNum = 0;
            
            if (response.isRecorded) response.imagesNum = KellyEDRecorder.recorder.images.length;
            
            return callback();
        }
        
        return false;
    }
    
    KellyEDRecorder.init();
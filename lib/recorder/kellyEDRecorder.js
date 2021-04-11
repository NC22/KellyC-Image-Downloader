var KellyEDRecorder = new Object;
    KellyEDRecorder.recorder = {};
    
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
    
    KellyEDRecorder.onMessage = function(dispetcher, response, request, sender, callback) {
           
        if (request.method == 'addRecord') {
            
            if (request.clean) KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
            
            if (request.host && !KellyEDRecorder.recorder.host) {
                KellyEDRecorder.recorder.host = request.host;
                KellyEDRecorder.recorder.url = request.url;
            }
            
            // addition categories information (color \ name etc.)
            if (request.cats) {
                for (var k in request.cats) if (typeof KellyEDRecorder.recorder.cats[k] == 'undefined') KellyEDRecorder.recorder.cats[k] = request.cats[k];
            }
            
            if (request.images) {
                                
                for (var i = 0; i < request.images.length; i++) {
                    
                    var validatedSrc = [], validatedGroups = [];
                    
                    for (var srcIndex = 0; srcIndex < request.images[i].relatedSrc.length; srcIndex++) {
                        
                        if (KellyEDRecorder.recorder.srcs.indexOf(request.images[i].relatedSrc[srcIndex]) != -1) {
                            // console.log('skip ' + request.images[i].relatedSrc[srcIndex]);
                            continue;
                            
                        } else {
                            
                            validatedSrc.push(request.images[i].relatedSrc[srcIndex]);
                            
                            KellyEDRecorder.recorder.srcs.push(request.images[i].relatedSrc[srcIndex]);
                            if (request.images[i].relatedGroups && request.images[i].relatedSrc[srcIndex]) validatedGroups[srcIndex] = request.images[i].relatedGroups[srcIndex];
                        }            
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
            
            response.imagesNum = KellyEDRecorder.recorder.images.length;
            
            if (callback) callback(response); 
            
            return true;
            
        } else if (request.method == 'getRecord') {
            
            if (!KellyEDRecorder.recorder || !KellyEDRecorder.recorder.images) KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
            response.images = KellyEDRecorder.recorder.images;
            response.cats = KellyEDRecorder.recorder.cats;
            response.url = KellyEDRecorder.recorder.url;
            response.host = KellyEDRecorder.recorder.host;
            
            if (callback) callback(response); 
            
        } else if (request.method == 'startRecord') {
            
            response.isRecorded = true; 
            
            KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();            
            KellyEDRecorder.recorder.record = true;
            
            if (callback) callback(response); 
            
            return true;
            
        }  else if (request.method == 'stopRecord') {
            
            if (request.clean) KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
            
            response.isRecorded = false;
            response.imagesNum = KellyEDRecorder.recorder.images.length;
            KellyEDRecorder.recorder.record = false;
            
            if (callback) callback(response); 
            
            return true;
            
        } else if (request.method == 'isRecorded') {
            
            response.isRecorded = KellyEDRecorder.recorder.record ? true : false;   
            if (response.isRecorded) response.imagesNum = KellyEDRecorder.recorder.images.length;
            
            if (callback) callback(response); 
            
            return true;
        }
        
        return false;
    }
    
    KellyEDispetcher.events.push({onMessage : KellyEDRecorder.onMessage});
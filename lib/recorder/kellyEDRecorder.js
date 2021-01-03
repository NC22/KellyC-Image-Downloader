var KellyEDRecorder = new Object;
    KellyEDRecorder.recorder = {};
    
    KellyEDRecorder.getDefaultRecorder = function() {
        return {images : [], record : false, cats : {}, host : false, url : false, cache : []};
    }
    
    KellyEDRecorder.onMessage = function(dispetcher, response, request, sender, callback) {
           
        if (request.method == 'addRecord') {
            
            if (request.clean) KellyEDRecorder.recorder = KellyEDRecorder.getDefaultRecorder();
            
            if (request.host && !KellyEDRecorder.recorder.host) {
                KellyEDRecorder.recorder.host = request.host;
                KellyEDRecorder.recorder.url = request.url;
            }
            
            // addition catigories information (color \ name etc.)
            if (request.cats) {
                for (var k in request.cats) if (typeof KellyEDRecorder.recorder.cats[k] == 'undefined') KellyEDRecorder.recorder.cats[k] = request.cats[k];
            }
            
            if (request.images) {
                                
                rImages : for (var i = 0; i < request.images.length; i++) {
                                        
                    for (var b = 0; b < request.images[i].relatedSrc.length; b++) {
                        if (KellyEDRecorder.recorder.cache.indexOf(request.images[i].relatedSrc[b]) != -1) continue rImages;                        
                    }
                    
                    request.images[i].relatedSrc.forEach(function(src) { 
                        KellyEDRecorder.recorder.cache.push(src);
                    });
                    
                    KellyEDRecorder.recorder.images.push(request.images[i]);
                }  
            }
            
            response.imagesNum = KellyEDRecorder.recorder.images.length;
            
            if (callback) callback(response); 
            
            return true;
            
        } else if (request.method == 'getRecord') {
            
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
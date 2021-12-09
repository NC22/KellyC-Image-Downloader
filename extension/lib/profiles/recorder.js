// part of KellyFavItems extension

var KellyProfileRecorder = new Object();
    KellyProfileRecorder.create = function() {
        
        KellyProfileRecorder.self = new KellyProfileDefault();   
        var handler = KellyProfileRecorder.self;
        
        handler.profile = 'recorder';
    }
    
    KellyProfileRecorder.getInstance = function() {
        if (typeof KellyProfileRecorder.self == 'undefined') KellyProfileRecorder.create();    
        return KellyProfileRecorder.self;
    }
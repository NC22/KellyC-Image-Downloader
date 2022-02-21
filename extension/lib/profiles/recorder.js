// part of KellyFavItems extension

var KellyProfileRecorder = new Object();
    KellyProfileRecorder.create = function() {
        
        KellyProfileRecorder.self = new KellyProfileDefault();   
        var handler = KellyProfileRecorder.self;
        
        handler.profile = 'recorder';    
        handler.extLinks = {
        
            pp : 'https://github.com/NC22/KellyC-Image-Downloader/wiki/%5BPP%5D-Privacy-Policy',
            github : 'https://github.com/NC22/KellyC-Image-Downloader',
            
            install_ff : 'https://addons.mozilla.org/ru/firefox/addon/kellyc-favorites/',
            install_chrome : 'https://chrome.google.com/webstore/detail/kellyc-image-downloader/mbhkdmjolnhcppnkldbdfaomeabjiofm?hl=en',
            install_edge : 'https://microsoftedge.microsoft.com/addons/detail/kellyc-image-downloader/dgjfegjceojpbngijkaekoihllhhdocn',
            install_opera : 'https://kellydownloader.com/ru/install-opera/',
            
            author : 'https://nradiowave.catface.ru/',
        };
    }
    
    KellyProfileRecorder.getInstance = function() {
        if (typeof KellyProfileRecorder.self == 'undefined') KellyProfileRecorder.create();    
        return KellyProfileRecorder.self;
    }
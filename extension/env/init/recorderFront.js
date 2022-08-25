
if (typeof K_WATCHDOG == 'undefined') {
    
     var onDOMRendered = function() {
         
        K_WATCHDOG = new KellyPageWatchdog();
        K_WATCHDOG.exec(); 
     }
     
     if (document.body) { // "run_at": "document_idle"
        
        onDOMRendered();
        
    } else { // "run_at": "document_start"
        
        document.addEventListener("DOMContentLoaded", onDOMRendered);
    }
    
}

// keep empty space to prevent syntax errors if some symbols will added at end
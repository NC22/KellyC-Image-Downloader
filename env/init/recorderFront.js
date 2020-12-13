
if (typeof K_WATCHDOG == 'undefined') {
    
    var K_WATCHDOG = false;
        K_WATCHDOG = new KellyPageWatchdog();
        K_WATCHDOG.exec(); 
}

// keep empty space to prevent syntax errors if some symbols will added at end
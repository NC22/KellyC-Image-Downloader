var KellyLoc = new Object();

    // buffered i18n.getMessage data
    KellyLoc.locs = {};		
    KellyLoc.browser = -1;
    
    // deprecated, detectLanguage not required for i18n mode
    KellyLoc.detectLanguage = function() {	

        var language = window.navigator.userLanguage || window.navigator.language;
        if (language) {
            if (language.indexOf('-') != -1) language = language.split('-')[0];
            
            language = language.trim();

            return language;
        } else return this.defaultLanguage;
        
    }
    
    KellyLoc.parseText = function(text, vars) {
        
        if (!text) return '';
        
        if (vars) {
            for (var key in vars){
                if (typeof vars[key] != 'function') {
                    text = text.replace('__' + key + '__', vars[key]);
                }
            }
        } 
        
        return text;
    }
    
    KellyLoc.s = function(defaultLoc, key, vars) {
        
        if (this.locs[key]) return this.parseText(this.locs[key], vars);
        
        if (this.browser == -1) this.browser = KellyTools.getBrowser();
        
        if (!this.browser || !this.browser.i18n || !this.browser.i18n.getMessage) return this.parseText(defaultLoc, vars);
        
        this.locs[key] = this.browser.i18n.getMessage(key);
        if (!this.locs[key]) this.locs[key] = defaultLoc;  
        
        return this.parseText(this.locs[key], vars);
    }
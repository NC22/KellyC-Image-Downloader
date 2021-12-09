// part of KellyFavItems extension
// требуется для обработки событий в "небезопасном" окне вне расширения.
// используемые функции
// - активирует подтверждение на закрытие окна если выполняется процесс загрузки профилей \ тегов или скачивание картинок

(function() {    
    
    var KellyDynamicDispetcher = new Object;       
        KellyDynamicDispetcher.enabledEvents = {};
        KellyDynamicDispetcher.messageNameBase = 'kelly_dynaminc';
        KellyDynamicDispetcher.getMessage = function(e) {
            
            var handler = KellyDynamicDispetcher;
            
            if (!e.data || !e.data.method || !e.data[handler.messageNameBase]) return false;
            
            var response = {
                
                senderId : 'dynamic_dispetcher',
                error : '',
                method : e.data.method,  
                location : window.location.href,
            };
            
            
            if (e.data.method == handler.messageNameBase + '.unbind.beforeunload') {
                
                handler.removeBeforeUnload();
                
            } else if (e.data.method == handler.messageNameBase + '.bind.beforeunload') {
            
                if (!handler.enabledEvents['before_unload']) {
                    
                    handler.enabledEvents['before_unload'] = function(e) {
                        e.preventDefault();
                        e.returnValue = '';
                        
                        return "";
                    };
                    
                    window.addEventListener('beforeunload', handler.enabledEvents['before_unload']);                    
                }
                
            } else if (e.data.method == handler.messageNameBase + '.getvar') {
                
                
                if (e.data.varList) {
                    
                    var getVarAsString = function(value) {
                        if (typeof value != 'string' && typeof String != 'undefined') value = String(value);
                        return value;
                    }
                    
                    response.varList = {};
                    for (var i = 0; i < e.data.varList.length; i++) response.varList[e.data.varList[i]] = typeof window[e.data.varList[i]] != 'undefined' ? getVarAsString(window[e.data.varList[i]]) : false; 
                        
                } else {
                    
                    response.error = 'var_name is undefined';
                }
                
            } else if (e.data.method == handler.messageNameBase + '.self.remove') {
            
                handler.remove();
            } 
            
            e.source.postMessage(response, window.location.origin);
        };
        
        KellyDynamicDispetcher.removeBeforeUnload = function() {
        
            if (this.enabledEvents['before_unload']) {
                
                window.removeEventListener('beforeunload', this.enabledEvents['before_unload']);
                this.enabledEvents['before_unload'] = false;                    
            }
        }
        
        KellyDynamicDispetcher.init = function() {            
            window.addEventListener('message', KellyDynamicDispetcher.getMessage);            
        }
        
        KellyDynamicDispetcher.remove = function() {
            
            this.removeBeforeUnload();
            window.removeEventListener('message', KellyDynamicDispetcher.getMessage);
        }
        
        KellyDynamicDispetcher.init();
}());
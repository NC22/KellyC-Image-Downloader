// make optional, connect to kellyFavItems

function KellyToolbar(cfg) {
    
    var handler = this;
        handler.container = false;
        handler.className = 'toolbar';
        handler.dom = {};
        handler.events = {
            
            onDisplayBlock : function(mode, action, oldMode) {
                
                if (mode == 'fav') {
                    
                    handler.show(true);
                    
                    if (K_FAV.getFilters().imagesAsDownloadItems) {
                        handler.container.classList.add(handler.className + '-downloader');
                    } else {
                        handler.container.classList.remove(handler.className + '-downloader');
                    } 
                    
                } else handler.show(false);
                               
            },        
            onUpdateFilteredData : function(displayedItems) {
                handler.show(true);
            },
        }  
    
    function constructor(cfg) { 
        
        handler.container = cfg.container;
        handler.className = cfg.className;
        handler.container.classList.add(handler.className);
        
        handler.favController = cfg.favController;
        handler.env = cfg.favController.getGlobal('env');
    }
    
    function getCatListHtml(title, filter, logic) {
        
         var html = '';         
         var db = handler.favController.getGlobal('fav');
         
         if (filter.length > 0) {
             
             html = '[' + title + '';
             
             if (filter.length == 1) {
                html += ' <b>из категории</b>';
             } else {                 
                if (logic == 'AND') html += ' содержащие <b>все категории</b>';
                else html += ' содержащие <b>одну из категорий</b>';
             }
             
             html += ': ';
             
             for (var i = 0; i < filter.length; i++) {
                
                var group = handler.favController.getStorageManager().getCategoryById(db, filter[i]);
                html += (i > 0 ? ', ' : '') + '<b>' + group.name + '</b>';
             }
             
             html += ']';
         }
         
         return html;
    }
    
    function updateStatesInfo() {
        
         var filters = handler.favController.getFilters();
         var html = '';
         
         if (!handler.favController.getGlobal('read_only')) {
             html += '[<b>Режим редактирования</b>]';
         }
         
         if (filters.catFilters.length <= 0 && filters.catIgnoreFilters.length <= 0) {
             html += '[Категории не выбраны]';
         } else {
             html += getCatListHtml('Выбраны картинки', filters.catFilters, filters.logic);
             if (filters.catFilters.length > 0) html += ' ';
             html += getCatListHtml('Исключены картинки', filters.catIgnoreFilters, filters.logic);
         }
         
         KellyTools.setHTMLData(handler.dom.catList, '<span>' + html + '</span>');  
    }
    
    function init() {
        
        var html = '\
            <input id="' + handler.className + '-deselect-all" type="checkbox" class="' + handler.env.className +'-FavItem-download-enabled" checked>\
            <label for="' + handler.className + '-deselect-all">Исключить все</label>\
            \
            <div class="' + handler.className + '-catlist"></div>\
            \
            <div class="' + handler.className + '-right">\
                \
                <!--a href="#">\
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16"><path fill-rule="evenodd" d="M4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.565 20.565 0 008 13.393a20.561 20.561 0 003.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 01-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5zM8 14.25l-.345.666-.002-.001-.006-.003-.018-.01a7.643 7.643 0 01-.31-.17 22.075 22.075 0 01-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 01-3.744 2.584l-.018.01-.006.003h-.002L8 14.25zm0 0l.345.666a.752.752 0 01-.69 0L8 14.25z"></path></svg>\
                    <span>Donate</span>\
               </a-->\
               <div class="' + handler.className + '-theme" title="Переключить тему"></div>\
           </div>';       
       
        KellyTools.setHTMLData(handler.container, html);   
        handler.dom.deselectAll = handler.container.getElementsByClassName(handler.env.className +'-FavItem-download-enabled')[0];
        handler.dom.catList = handler.container.getElementsByClassName(handler.className + '-catlist')[0];
        handler.dom.themeToogle = handler.container.getElementsByClassName(handler.className + '-theme')[0];
        
        handler.dom.deselectAll.onchange = function() {
            handler.favController.getDownloadManager().setManualExcluded(this.checked ? 'select_all' : 'deselect_all');
        }
        
        handler.dom.themeToogle.onclick = function() {
            
            var options = handler.favController.getGlobal('options');
            
            if (document.body.classList.contains(handler.env.className + '-dark')) {
                document.body.classList.remove(handler.env.className + '-dark');
                options.darkTheme = false;
            } else {
                
                if (!document.getElementById(handler.className + '-dyn-css')) {
                    KellyTools.getBrowser().runtime.sendMessage({method: "getResources", items : ['dark']}, function(request) {
                        if (!request || !request.data.loadedData) return false; 
                        
                        KellyTools.addCss(handler.className + '-dyn-css', KellyTools.replaceAll(request.data.loadedData, '__BASECLASS__', handler.env.className), true);
                        
                    });  
                }
                
                document.body.classList.add(handler.env.className + '-dark');
                options.darkTheme = true;
            }

            handler.favController.save('cfg');
        }
    }
    
    this.show = function(visible) {
       
       if (!visible) {
           if (handler.container) handler.container.classList.remove(handler.className + '-shown');
           return;
       } else {
           handler.container.classList.add(handler.className + '-shown');
       }
       
       if (!handler.container.innerHTML) {
            init();
       }
       
       updateStatesInfo();
    }
    
    constructor(cfg);    
}
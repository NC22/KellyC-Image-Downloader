// make optional, connect to kellyFavItems

function KellyToolbar(cfg) {
    
    var handler = this;
        handler.container = false;
        handler.className = 'toolbar';
        handler.dom = { help : false, deselectAll : false, collapseToogle : false, themeToogle : false, catlist : false};
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
        handler.collapsed = cfg.collapsed ? true : false;
        handler.heartHidden = cfg.heartHidden ? true : false;
        
        handler.container.classList.add(handler.className);
        if (handler.collapsed) {
           handler.container.classList.add(handler.className + '-collapsed'); 
        }
        
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
                if (logic == 'and') html += ' содержащие <b>все категории</b>';
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
         
         if (!filters.readOnly) {
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
               <div class="' + handler.className + '-help" title="Помочь проекту"></div>\
               <div class="' + handler.className + '-theme" title="Переключить тему"></div>\
               <div class="' + handler.className + '-collapse" title="Свернуть панель инструментов"><div class="' + handler.className + '-collapse-icon"></div></div>\
           </div>';       
       
        KellyTools.setHTMLData(handler.container, html);   
        handler.dom.deselectAll = handler.container.getElementsByClassName(handler.env.className +'-FavItem-download-enabled')[0];
        handler.dom.catList = handler.container.getElementsByClassName(handler.className + '-catlist')[0];
        handler.dom.themeToogle = handler.container.getElementsByClassName(handler.className + '-theme')[0];
        handler.dom.collapseToogle = handler.container.getElementsByClassName(handler.className + '-collapse')[0];
        handler.dom.help = handler.container.getElementsByClassName(handler.className + '-help')[0];
        
        if (handler.heartHidden && handler.dom.help) handler.dom.help.style.display = 'none';
        
        handler.dom.help.onclick = function() {
            // KellyTools.getBrowser().tabs.create({url: '/env/html/recorderDownloader.html?tab=donate'}, function(tab){}); 
            handler.favController.showAdditionsDialog('additions_donate');
            return false;
        }
        
        handler.dom.deselectAll.onchange = function() {
            handler.favController.getDownloadManager().setManualExcluded(this.checked ? 'select_all' : 'deselect_all');
        }
        
        handler.dom.collapseToogle.onclick = function() {
            
            var options = handler.favController.getGlobal('options');
            
            if (handler.container.classList.contains(handler.className + '-collapsed')) {
                
                handler.container.classList.remove(handler.className + '-collapsed'); 
                options.toolbar.collapsed = false;                
            } else {
                
                handler.container.classList.add(handler.className + '-collapsed'); 
                options.toolbar.collapsed = true;
            }
            
            handler.collapsed = options.toolbar.collapsed;
            handler.favController.save('cfg');
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
    
    this.showHeart = function(visible) {
        if (!handler.dom.help) return false;
        
        handler.dom.help.style.display = visible ? '' : 'none';
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
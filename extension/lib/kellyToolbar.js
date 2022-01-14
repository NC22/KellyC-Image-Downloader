// make optional, connect to kellyFavItems

function KellyToolbar(cfg) {
    
    var handler = this;
        handler.container = false;
        handler.cfg = {heartNewWindow : false, themeHidden : false,};
        handler.className = 'toolbar';
        handler.dom = { help : false, deselectAll : false, collapseToogle : false, themeToogle : false, catlist : false};
        handler.events = {
            
            onDisplayBlock : function(mode, action, oldMode) {
                
                if (mode == 'fav') {
                    
                    handler.show(handler.cfg.userCfg.enabled);
                    updateBlocksClass(K_FAV.getFilters().imagesAsDownloadItems, 'downloader-enabled');
                    
                } else handler.show(false);
                               
            },        
            onUpdateFilteredData : function(displayedItems) {
                handler.show(true);
            },
        }  
    
    function constructor(cfg) { 
        
        handler.container = cfg.container;
        handler.className = cfg.className;
        
        handler.cfg = cfg;
        handler.env = cfg.favController.getGlobal('env');        
        handler.favController = cfg.favController;
    }
    
    function getCatListHtml(title, filter, logic) {
        
         var html = '';
         var db = handler.favController.getGlobal('fav');
         
         if (filter.length > 0) {
             
             html = '[' + title + '';
             
             if (filter.length == 1) {
                html += ' ' + KellyLoc.s('', 'toolbar_from_single_cat');
             } else {                 
                if (logic == 'and') html += ' '  + KellyLoc.s('', 'toolbar_from_and_cats');
                else html += ' ' + KellyLoc.s('', 'toolbar_from_or_cats');
             }
             
             html += ': ';
             
             for (var i = 0; i < filter.length; i++) {
                
                var group = handler.favController.getStorageManager().getCategoryById(db, filter[i]);
                if (group.id > 0) html += (i > 0 ? ', ' : '') + '<b>' + group.name + '</b>'; // todo - check - after sort - some unexist items adds to exclude filter
             }
             
             html += ']';
         }
         
         return html;
    }
    
    function updateStatesInfo() {
        
         if (handler.cfg.userCfg.tiny) {
             handler.dom.catList.innerHTML = '';
             return;
         }
         
         var filters = handler.favController.getFilters();
         var html = '';
         // var maxWidth = KellyTools.getViewport().screenWidth - (handler.cfg.tiny ? 0 : 150) - 75; // todo - pixels per char - 7.5
         
         if (!filters.readOnly) {
             html += '[<b>' + KellyLoc.s('', 'toolbar_edit_mode') + '</b>]';
         }
         
         if (filters.catFilters.length <= 0 && filters.catIgnoreFilters.length <= 0) {
             html += '[' + KellyLoc.s('', 'toolbar_cat_not_selected') + ']';
         } else {
             html += getCatListHtml(KellyLoc.s('', 'toolbar_selected_images'), filters.catFilters, filters.logic);
             if (filters.catFilters.length > 0) html += ' ';
             html += getCatListHtml(KellyLoc.s('', 'toolbar_deselected_images'), filters.catIgnoreFilters, filters.logic);
         }
         
         KellyTools.setHTMLData(handler.dom.catList, '<span>' + html + '</span>');  
    }
    
    function initBlock(html, name) {
        
        handler.dom[name] = KellyTools.setHTMLData(handler.dom[name] ? handler.dom[name] : document.createElement('DIV'), html);
        handler.dom[name].className = handler.env.hostClass + ' ' + handler.className + ' ' + handler.className + '-' + name + (handler.cfg.userCfg.tiny ? ' ' + handler.className + '-tiny' : '');
        handler.container.appendChild(handler.dom[name]);
    }
    
    function updateBlocksClass(add, className) {
        handler.dom['main'].classList[(add ? 'add' : 'remove')](handler.className + '-' + className);
        handler.dom['downloader-container'].classList[(add ? 'add' : 'remove')](handler.className + '-' + className);        
    } 
    
    this.init = function() {
        
        initBlock('\
                <input id="' + handler.className + '-deselect-all" type="checkbox" class="' + handler.env.className +'-FavItem-download-enabled" checked>\
                <label for="' + handler.className + '-deselect-all">' + KellyLoc.s('', 'toolbar_deselect_all') + '</label>\
        ', 'downloader-container'); 
        
        initBlock('\
               <div class="' + handler.className + '-catlist"></div>\
               <div class="' + handler.className + '-right">\
                   <div class="' + handler.className + '-help" title="' + KellyLoc.s('', 'toolbar_help') + '"></div>\
                   <div class="' + handler.className + '-theme" title="' + KellyLoc.s('', 'toolbar_theme') + '"></div>\
                   <div class="' + handler.className + '-collapse" title="' + KellyLoc.s('', 'toolbar_collapse') + '"><div class="' + handler.className + '-collapse-icon"></div></div>\
               </div>\
        ', 'main');
        
        handler.dom.deselectAll = handler.container.getElementsByClassName(handler.env.className +'-FavItem-download-enabled')[0];
        handler.dom.catList = handler.container.getElementsByClassName(handler.className + '-catlist')[0];
        handler.dom.themeToogle = handler.container.getElementsByClassName(handler.className + '-theme')[0];
        handler.dom.collapseToogle = handler.container.getElementsByClassName(handler.className + '-collapse')[0];
        handler.dom.help = handler.container.getElementsByClassName(handler.className + '-help')[0];

        if (handler.cfg.themeHidden && handler.dom.themeToogle) handler.dom.themeToogle.style.display = 'none';
        if (handler.cfg.userCfg.heartHidden && handler.dom.help) handler.dom.help.style.display = 'none';
        if (handler.cfg.userCfg.collapsed) updateBlocksClass(true, 'collapsed');
            
        handler.dom.help.onclick = function() {
            
            if (handler.cfg.heartNewWindow) {
                
                window.open(KellyTools.getBrowser().runtime.getURL('/env/html/' + handler.env.profile + 'Downloader.html') + '?tab=donate');
                
            } else {
                handler.dom.deselectAll.checked = true; // download mode resetes after leave main page
                handler.favController.showAdditionsDialog('additions_donate');
            }
            
            return false;
        }
        
        handler.dom.deselectAll.onclick = function() {
            handler.favController.getDownloadManager().setManualExcluded(this.checked ? 'select_all' : 'deselect_all');
        }
        
        handler.dom.collapseToogle.onclick = function() {
            
            handler.cfg.userCfg.collapsed = !handler.dom['main'].classList.contains(handler.className + '-collapsed');
            updateBlocksClass(handler.cfg.userCfg.collapsed, 'collapsed');
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
    
    this.show = function(visible) {
       
       if (!handler.dom['main']) handler.init();
       
       updateBlocksClass(visible, 'shown');
       updateBlocksClass(handler.cfg.userCfg.tiny, 'tiny');
       
       if (visible) updateStatesInfo();
    }
    
    constructor(cfg);    
}
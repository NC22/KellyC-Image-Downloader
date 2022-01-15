// make optional, connect to kellyFavItems

function KellyToolbar(cfg) {
    
    var handler = this;
        handler.container = false;
        handler.cfg = {show : false, heartNewWindow : false, themeHidden : false, deselectBtn : false};
        handler.className = 'toolbar';
        handler.dom = {};
        handler.events = {            
            onDisplayBlock : function(mode, action, oldMode) {
                handler.show(handler.cfg.userCfg.enabled && mode == 'fav' && action == 'show');           
            },        
            onUpdateFilteredData : function(displayedItems) {
                handler.show(handler.cfg.show);
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
         
         KellyTools.setHTMLData(handler.dom['catlist'], '<span>' + html + '</span>');  
    }
    
    function initBlock(html, name) {
        
        handler.dom[name] = KellyTools.setHTMLData(handler.dom[name] ? handler.dom[name] : document.createElement('DIV'), html);
        handler.container.appendChild(handler.dom[name]);
    }
    
    function updateBlocksClass() {
        
        var className = handler.env.hostClass + ' ' + handler.className + ' ' + handler.className + '-' + (handler.cfg.userCfg.tiny ? 'tiny' : 'full');
        if (handler.cfg.userCfg.collapsed) className += ' ' + handler.className + '-collapsed';
        if (handler.cfg.show) className += ' ' + handler.className + '-shown';
        
        handler.dom['main'].className = className + ' ' + handler.className + '-main';
        handler.dom['helper-container'].className = className + ' ' + handler.className + '-helper-container';
        if (handler.cfg.deselectBtn || !handler.cfg.userCfg.tiny) handler.dom['helper-container'].className += ' ' + handler.className + '-helper-enabled';
    } 
    
    this.init = function() {
    
        initBlock('\
                <div class="' + handler.className + '-deselect-wrap"></div>\
                <!--div class="' + handler.className + '-tiny-toogle">[...]</div-->\<div class="' + handler.className + '-catlist"></div>\
        ', 'helper-container'); 
        
        initBlock('\
               <div class="' + handler.className + '-right">\
                   <div class="' + handler.className + '-help" title="' + KellyLoc.s('', 'toolbar_help') + '"></div>\
                   <div class="' + handler.className + '-theme" title="' + KellyLoc.s('', 'toolbar_theme') + '"></div>\
                   <div class="' + handler.className + '-collapse" title="' + KellyLoc.s('', 'toolbar_collapse') + '"><div class="' + handler.className + '-collapse-icon"></div></div>\
               </div>\
        ', 'main');
        
        var dom = ['deselect-wrap', 'catlist', 'theme', 'collapse', 'help'];
        for (var i = 0; i < dom.length; i++) {
            handler.dom[dom[i]] = handler.container.getElementsByClassName(handler.className + '-' + dom[i])[0];
        }
        
        handler.dom['help'].onclick = function() {
            
            if (handler.cfg.heartNewWindow) {
                
                window.open(KellyTools.getBrowser().runtime.getURL('/env/html/' + handler.env.profile + 'Downloader.html') + '?tab=donate');
                
            } else {
                handler.setDeselectBtn(handler.cfg.deselectBtn); // reset state
                handler.favController.showAdditionsDialog('additions_donate');
            }
            
            return false;
        }
        
        handler.dom['collapse'].onclick = function() {
            
            handler.cfg.userCfg.collapsed = !handler.cfg.userCfg.collapsed;
            updateBlocksClass();
            handler.favController.save('cfg');
        }
        
        handler.dom['theme'].onclick = function() {
            
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
        
        handler.setDeselectBtn(handler.cfg.deselectBtn);
    }
    
    this.setDeselectBtn = function(btn) {
        
        handler.dom['deselect-wrap'].innerHTML = '';        
        handler.cfg.deselectBtn = btn;
        
        if (!btn) return;
        
        KellyTools.setHTMLData(handler.dom['deselect-wrap'], '\
            <input id="' + handler.className + '-deselect-all" type="checkbox" class="' + handler.env.className +'-FavItem-download-enabled" checked>\
            <label for="' + handler.className + '-deselect-all" class="' + handler.className + '-deselect-all-label">' + KellyLoc.s('', btn.loc ? btn.loc : 'toolbar_deselect_all') + '</label>\
        ');
        
        handler.dom['deselect-all'] = document.getElementById(handler.className + '-deselect-all');
        handler.dom['deselect-all'].onclick = function(e) {
            return btn.callback(handler, this, e);
        }
    }
    
    this.show = function(visible) {
       
        if (!handler.dom['main']) handler.init();
        
        handler.cfg.show = visible;
        updateBlocksClass();
           
        if (handler.cfg.show) {
            
            if (handler.cfg.themeHidden) handler.dom['theme'].style.display = 'none';
            if (handler.cfg.userCfg.heartHidden) handler.dom['help'].style.display = 'none'; 
            if (handler.cfg.userCfg.tiny) handler.dom['catlist'].innerHTML = '';
            else updateStatesInfo();
        }
    }
    
    constructor(cfg);    
}
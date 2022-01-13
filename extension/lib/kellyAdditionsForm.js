KellyAdditionsForm = {    
    tpl :  ['menu-item', 'page', 'profile-selector', 'profile-selector-recorder'],
    menu : ['additions_about', 'additions_help', 'additions_modules'],
    
    initToggleProfile : function(p, favEnv) {    

        var settings = false, el = document.querySelector('[data-profile=' + p.profile + ']');  
        if (!el) return;
        
        if (!favEnv) {
            favEnv = new KellyFavItems({env : p})
            favEnv.load('cfg', function(fav) { settings = fav; el.checked = !settings.coptions.disabled;}); 
        } else {
            settings = favEnv.getGlobal('fav');
            el.checked = !settings.coptions.disabled;
        }            
        
        el.onchange = function() {
            settings.coptions.disabled = settings.coptions.disabled ? false : true;
            favEnv.save('cfg'); 
        }
    },
    show : function(container, favEnv, pageId) {
      
      pageId = pageId ? pageId : KellyAdditionsForm.menu[0];
            
      favEnv.closeSidebar();
      
      KellyTools.getBrowser().runtime.sendMessage({method: "getResources", asObject : true, items : KellyAdditionsForm.tpl, itemsRoute : {module : 'additions', type : 'html'}}, function(request) {
             
             var pModulesHtml = '', menuHtml = '';
             var pModules = [KellyProfileRecorder, KellyProfileJoyreactor];
             var curP = favEnv.getGlobal('env'), bcEnv = curP.className, bc = bcEnv + '-additions';
             
             KellyTools.tplClass = bc;
             
             for (var i = 0; i < pModules.length; i++) {
        
                var p = pModules[i].getInstance(), tplName = '', tplData = '';
                if (p.profile == 'recorder') {
                    
                    tplName = 'profile-selector-recorder';
                    tplData = {
                        CURRENT : curP.profile == p.profile,
                    };
                    
                } else {
                    
                    tplName = 'profile-selector';
                    tplData = {
                        HOSTLIST : p.hostList.join(', '),
                        PROFILEID : p.profile, 
                        CURRENT : curP.profile == p.profile,
                        PROFILENAME : KellyLoc.s('', 'options_page_custom_cfg', {PROFILENAME : KellyTools.getCamelWord(p.profile)}),
                    };
                }
                
                pModulesHtml += KellyTools.getTpl(request.data.loadedData, tplName, tplData); 
            }
            
            for (var i = 0; i < KellyAdditionsForm.menu.length; i++) {
                menuHtml += KellyTools.getTpl(request.data.loadedData, 'menu-item', {NAME : KellyLoc.s(KellyAdditionsForm.menu[i], KellyAdditionsForm.menu[i]), TARGET : KellyAdditionsForm.menu[i]});
            }
            
            KellyTools.setHTMLData(container, KellyTools.getTpl(request.data.loadedData, 'page', {MODULES : pModulesHtml, MENU : menuHtml, HIDDENCLASS : bcEnv + '-hidden'}));
            
            for (var i = 0; i < pModules.length; i++) {
                KellyAdditionsForm.initToggleProfile(pModules[i].getInstance(), curP == pModules[i].getInstance() ? favEnv : false);
            }
            
            var selectMenu = function(el) {
                
                var opened = el.parentElement.classList.contains(bc + '-active');
                
                for (var i = 0; i < KellyAdditionsForm.menu.length; i++) { 
                
                    container.getElementsByClassName(bc + '-' + KellyAdditionsForm.menu[i] + '-menu-item')[0].parentElement.classList.remove(bc + '-active');
                    container.getElementsByClassName(bc + '-' + KellyAdditionsForm.menu[i])[0].classList.add(bcEnv + '-hidden');
                    container.getElementsByClassName(bc + '-' + KellyAdditionsForm.menu[i])[0].classList.remove(bcEnv + '-active');
                }
                
                container.getElementsByClassName(el.getAttribute('data-target') + '-menu-item')[0].parentElement.classList.add(bc + '-active');
                container.getElementsByClassName(el.getAttribute('data-target'))[0].classList.remove(bcEnv + '-hidden');
                container.getElementsByClassName(el.getAttribute('data-target'))[0].classList.add(bcEnv + '-active');
            }
            
            var menu = container.getElementsByClassName(bc + '-menu-item');
            for (var i = 0; i < menu.length; i++) {
                
                menu[i].onclick = function() { 
                    selectMenu(this); return false;
                };
                                
                if (menu[i].getAttribute('data-target').indexOf(pageId) != -1) {
                    selectMenu(menu[i]);
                }
            }
        });   
    },    
}
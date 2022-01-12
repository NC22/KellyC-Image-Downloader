// part of KellyFavItems extension

function KellyOptions(cfg) {
    
    var handler = this;  
    
    var lng = KellyLoc, env = false, fav = false;
    this.favEnv = false; this.wrap = false; this.protectedOptions = [];    
    
    this.tabData = {
         'BaseOptions' : {loc : 'options_main'},
         'Storage' : {loc : 'storage', onSelect : function(handler) {
            handler.favEnv.getStorageManager().wrap = KellyTools.getElementByClass(handler.wrap, handler.tabActive);
            handler.favEnv.getStorageManager().showDBManager();
          }},
         'Cfg' : {loc : 'restore', onSelect : function(handler) {
            handler.favEnv.getStorageManager().wrap = KellyTools.getElementByClass(handler.wrap, handler.tabActive);
            handler.favEnv.getStorageManager().showCfgManager();
          }},
         'Other' : {loc : 'other'},
    };
    
    this.tabData['BaseOptions'].parts = {
        _common : [],
        options_fav_add : ['syncByAdd', 'hideAddToFav', 'hideSoc', 'addToFavNoConfirm', 'addToFavSide'], 
        fast_download : 'fastsave_',
        cgrid_tiles_header : ['newFirst', 'grid_'],         
    };
    
    this.tabData['Other'].parts = { 
        _common : ['debug', 'mobileOptimization', 'darkTheme', 'optionsSide', 'hideTopMenu'],
        grabber_options_title : ['baseFolder', 'grabberDriver_', 'webRequest'],
    };
    
    this.cfgInput = {     
    
        'grid_lazy': {name : 'lazy', parent : 'grid', loc : 'cgrid_lazy', type : 'bool'},         
        'grid_perPage' : {name : 'perPage', parent : 'grid', loc : 'cgrid_per_page', type : 'int'}, 
        'grid_autoScroll' : {name : 'autoScroll', parent : 'grid', notice : 'cgrid_autoscroll_notice',  placeholder : 'cgrid_autoscroll_input', loc : 'cgrid_autoscroll', type : 'int'},        
        'grid_viewerShowAs' : {name : 'viewerShowAs', parent : 'grid', loc : 'cgrid_imageview', listLoc : ['cgrid_imageview_hd', 'cgrid_imageview_preview'], list : ['hd', 'preview'], type : 'enum'},
        'grid_type' : {name : 'type', parent : 'grid', loc : 'cgrid_type', listLoc : ['cgrid_type_dynamic', 'cgrid_type_fixed'], list : ['dynamic' , 'fixed'], type : 'enum'},             
        'grid_fixed' : {name : 'fixed', parent : 'grid', bc : 'fixed', loc : 'cgrid_fixed', type : 'int', default : 4}, 
        'grid_rowHeight' : {name : 'rowHeight', parent : 'grid', bc : 'dynamic',  loc : 'cgrid_max_row_height', type : 'int'}, 
        'grid_min' : {name : 'min', parent : 'grid', bc : 'dynamic', loc : 'cgrid_min_number', type : 'int'}, 
        'grid_heightDiff' : {name : 'heightDiff', parent : 'grid', bc : 'dynamic', loc : 'cgrid_max_diff', type : 'int'},

        'syncByAdd' : {loc : 'sync_by_add', type : 'bool'}, 
        'hideAddToFav': {loc : 'hide_add_to_fav', type : 'bool', default : false},
        'hideSoc': {loc : 'hide_soc', refresh : true, type : 'bool'},
        'addToFavNoConfirm': {loc : 'add_to_fav_auto', type : 'bool'},
        'addToFavSide': {loc : 'add_to_fav_side', type : 'bool'}, 
        
        'fastsave_qualityConfigurable' : {name : 'qualityConfigurable', parent : 'fastsave', type : 'static'},
        'fastsave_baseFolderConfigurable' : {name : 'baseFolderConfigurable', parent : 'fastsave', type : 'static'},            
        'fastsave_enabled': {name : 'enabled', parent : 'fastsave', loc : 'fast_save_enabled', refresh : true, type : 'bool'},
        'fastsave_conflict' : {name : 'conflict', parent : 'fastsave', listLoc : ['fast_save_overwrite', 'fast_save_uniq'], list : ['overwrite', 'uniquify'], type : 'enum'},    
        'fastsave_baseFolder' : {name : 'baseFolder', parent : 'fastsave', placeholder : 'fast_save_to_placeholder', tip : 'fast_save_help', loc : 'fast_save_to', type : 'folder'},
        // 'fastsave_check': {name : 'check', parent : 'fastsave', loc : 'fast_save_check', notice : 'fast_save_check_notice', type : 'bool'},
        'fastsave_configurableEnabled': {name : 'configurableEnabled', parent : 'fastsave', loc : 'fast_save_configurable_enabled', refresh : true, type : 'bool'},
       
        'newFirst': {loc : 'cgrid_new_to_begin', type : 'bool'},

        /*'mobileOptimization': {loc : 'mobile_optimization', type : 'bool'}, -- currently enables automaticly when screen width < 1080px */
        'darkTheme': {loc : 'dark_theme', type : 'bool'},
        'optionsSide': {loc : 'options_side', type : 'bool'}, // options button moved to side block
        //'hideTopMenu': {loc : 'hide_top_menu', type : 'bool'},
        'debug': {loc : 'debug', type : 'bool', onChange : function(newVal) { KellyTools.DEBUG = newVal; KellyTools.log('debug mode overloaded by user config', 'KellyOptions'); }},
        'webRequest': {loc : 'web_request_api', type : 'bool'},
        'baseFolder' : {loc : 'options_storage', type : 'folder'},
        
        'grabberDriver_requestMethod' : {name : 'requestMethod', parent : 'grabberDriver', loc : 'grabber_request', tip : 'grabber_request_help', listLoc : ['grabber_request_xml', 'grabber_request_iframe', 'grabber_request_fetch'], 
            list : [KellyGrabber.REQUEST_XML, KellyGrabber.REQUEST_IFRAME, KellyGrabber.REQUEST_FETCH], type : 'select', noticeUp : 'grabber_options_notice'},
        'grabberDriver_transportMethod' : {name : 'transportMethod', parent : 'grabberDriver', loc : 'grabber_transport', tip : 'grabber_transport_help', listLoc : ['grabber_transport_blob', 'grabber_transport_blobbase64'], 
            list : [KellyGrabber.TRANSPORT_BLOB, KellyGrabber.TRANSPORT_BLOBBASE64], type : 'select'},       
    }  
    
    function constructor(cfg) {
        for (var k in cfg) if (['favEnv', 'wrap'].indexOf(k) != -1) handler[k] = cfg[k];
        env = handler.favEnv.getGlobal('env');
        handler.tabActive = env.className + '-BaseOptions';
    }   
    
    this.showSection = function(key, close) {
        if (close) return '</table>';
        var output = key != '_common' ? '<h3 data-section="' + env.className + '-options-' + key + '">' + lng.s('', key) + '</h3>' : '';
            output += '<table class="' + env.className + '-options-table ' + env.className + '-options-' + key + '">';   
        
        return output;
    }
    
    this.showCfgItem = function(cfgKey) { 
        if (!handler.cfgInput[cfgKey] || handler.protectedOptions.indexOf(cfgKey) != -1) return '';
        
        var bc = env.className + '-' + cfgKey, type = handler.cfgInput[cfgKey].type, val = handler.getCfgValue(cfgKey), output = '', placeholder = handler.cfgInput[cfgKey].placeholder ? lng.s('', handler.cfgInput[cfgKey].placeholder) : '';
        var rowBc = bc + '-row' + (handler.cfgInput[cfgKey].bc ? ' ' + env.className + '-bc-' + handler.cfgInput[cfgKey].bc : '');
            rowBc += (handler.cfgInput[cfgKey].parent ? ' ' + env.className + '-' + handler.cfgInput[cfgKey].parent + '-group' : '');
        
        if (type == 'enum' && handler.cfgInput[cfgKey].list.indexOf(val) == -1) val = handler.cfgInput[cfgKey].default;
        if (typeof val == 'undefined' && handler.cfgInput[cfgKey].default) val = handler.cfgInput[cfgKey].default;
                    
        if (handler.cfgInput[cfgKey].noticeUp) output += '<tr><td colspan="2">' + lng.s('', handler.cfgInput[cfgKey].noticeUp) + '</td></tr>';
        if (type.indexOf('varlist') != -1) type = type.split('-')[1]; 
        
        if (type == 'bool') {
             
          output = '<tr class="' + rowBc + '"><td colspan="2"><label><input type="checkbox" value="1" class="' + bc + '" ' + (val ? 'checked' : '') + '> ' + lng.s('', handler.cfgInput[cfgKey].loc) + '</label>'; 
          if (handler.cfgInput[cfgKey].notice) output += ' <p>' + lng.s('', handler.cfgInput[cfgKey].notice) + '</p>';     
             
        } else if (type == 'enum') {
            
            if (handler.cfgInput[cfgKey].loc) output += '<tr><td colspan="2">' + lng.s('', handler.cfgInput[cfgKey].loc) + '</td></tr>';
            
            output += '<tr class="' + env.className + '-radioselect"><td colspan="2">';
            
            for (var i = 0; i < handler.cfgInput[cfgKey].list.length; i++) 
                output += '<label><input type="radio" name="' + bc + '" value="' + handler.cfgInput[cfgKey].list[i] + '"\
                           class="' + env.className + '-' + cfgKey + '" ' + ((i == 0 && !val) || val == handler.cfgInput[cfgKey].list[i] ? 'checked' : '') + '> \
                          ' + lng.s('', handler.cfgInput[cfgKey].listLoc[i]) + '</label>';                          
            
        } else if (type == 'select') {            
            
            output += '<tr><td>' + lng.s('', handler.cfgInput[cfgKey].loc) + '</td><td>';
            output += '<select class="' + bc + '">';
            for (var i = 0; i < handler.cfgInput[cfgKey].list.length; i++)
                output += '<option value="' + handler.cfgInput[cfgKey].list[i] + '" ' + ((i == 0 && !val) || val == handler.cfgInput[cfgKey].list[i] ? 'selected' : '') + '>' +  lng.s('', handler.cfgInput[cfgKey].listLoc[i]) + '</option>';
            if (handler.cfgInput[cfgKey].tip) output += '</select>&nbsp;&nbsp;&nbsp;(<a href="#" class="' + env.className + '-help" data-tip="' + handler.cfgInput[cfgKey].tip + '">' + lng.s('', 'tip') + '</a>)';
                        
        } else if (type == 'folder' || type == 'string' || type == 'int' || type == 'float') {
            
             output += '<tr class="' + rowBc + '"><td>' + lng.s('', handler.cfgInput[cfgKey].loc) + '</td><td><input type="text" class="' + bc + '" placeholder="' + placeholder + '" value="' + val + '">';                            
             if (handler.cfgInput[cfgKey].tip) output += '&nbsp;&nbsp;&nbsp;(<a href="#" class="' + env.className + '-help" data-tip="' + handler.cfgInput[cfgKey].tip + '">' + lng.s('', 'tip') + '</a>)';  
             if (handler.cfgInput[cfgKey].notice) output += '</td></tr>' + '<tr><td colspan="2">' + lng.s('', handler.cfgInput[cfgKey].notice);
       
        } else return '';   

        return output + '</td></tr>'; 
    }
    
    this.showCfgPool = function(input) {
        var output = '', list = [];
        if (!input) return output;
        if (typeof input == 'string') list.push(input); else list = input;
        
        for (var i = 0; i < list.length; i++) {
            if (list[i][list[i].length-1] == '_') {
                for (var cfgKey in handler.cfgInput) if (cfgKey.indexOf(list[i]) != -1) output += handler.showCfgItem(cfgKey); 
            } else output += handler.showCfgItem(list[i]);
        }
        return output;
    }
    
    this.showSave = function() {        
        return '<div class="' + env.className + '-OptionsSave-wrap"><input type="submit" value="' + lng.s('Сохранить', 'save') + '" class="' + env.className + '-OptionsSave"></div>';
    }
    
    this.getCfgValue = function(cfgKey) {
        return !handler.cfgInput[cfgKey].parent ? fav.coptions[cfgKey] : fav.coptions[handler.cfgInput[cfgKey].parent][handler.cfgInput[cfgKey].name];
    }
    
    this.setCfgValue = function(cfgKey, val) {
        if (handler.cfgInput[cfgKey].onChange && handler.cfgInput[cfgKey].onChange(val)) return;                
        if (!handler.cfgInput[cfgKey].parent) fav.coptions[cfgKey] = val; 
        else fav.coptions[handler.cfgInput[cfgKey].parent][handler.cfgInput[cfgKey].name] = val;
    } 

    this.applyInputSettingsPool = function() {
        
        var refreshPosts = false;
        for (var cfgKey in handler.cfgInput) {
            
            if (handler.cfgInput[cfgKey].list) for (var i = 0; i < handler.cfgInput[cfgKey].list.length; i++) handler.cfgInput[cfgKey].list[i] = KellyTools.val(handler.cfgInput[cfgKey].list[i], 'string');
            var type = handler.cfgInput[cfgKey].type, varlist = false;
            if (type.indexOf('varlist') != -1) {
                type = type.split('-')[1]; varlist = true;
            }
            
            var input = KellyTools.getElementByClass(handler.wrap, env.className + '-' + cfgKey);
            if (!input || handler.cfgInput[cfgKey].type == 'static') {
                KellyTools.log('item with key ' + cfgKey + ' skipped (input is disabled or value is protected)', 'KellyOptions'); continue;
            }
            
            if (type == 'bool') {
                
                var value = input.checked ? true : false;                
                if (handler.cfgInput[cfgKey].refresh && handler.getCfgValue(cfgKey) != value) refreshPosts = true;                
                
                handler.setCfgValue(cfgKey, value);
                
            } else if (type == 'enum') {
                
                input = handler.wrap.getElementsByClassName(env.className + '-' + cfgKey);
                for (var i = 0; i < input.length; i++) {            
                    var value = KellyTools.val(input[i].value);            
                    if (value && input[i].checked && handler.cfgInput[cfgKey].list.indexOf(value) != -1) handler.setCfgValue(cfgKey, value);
                }
                
            } else if (type == 'select') {
                 
                if (handler.cfgInput[cfgKey].list.indexOf(input.value) != -1) handler.setCfgValue(cfgKey, input.value);
                
            }  else if (type == 'string' || type == 'int' || type == 'float') {
                
                 handler.setCfgValue(cfgKey, varlist ? KellyTools.varListToStr(KellyTools.getVarList(input.value, type), type) : KellyTools.val(input.value, type));  
                 
            } else if (type == 'folder') {
                
                 handler.setCfgValue(cfgKey, KellyTools.validateFolderPath(KellyTools.val(input.value, 'string')));  
                 
            } else KellyTools.log('unsupported type for ' + cfgKey, 'KellyOptions'); 
        }
        
        return refreshPosts;
    }
    
    this.setMessage = function(text) {
        var messageEl = KellyTools.getElementByClass(handler.wrap, env.className + '-OptionsMessage');
            messageEl.style.display = text ? '' : 'none';
            messageEl.innerText = text ? text : '';  
    }
    
    this.updateEvents = function() {
        
        var tips = handler.wrap.getElementsByClassName(env.className + '-help');
        for (var i = 0; i < tips.length; i++) {
            
            tips[i].onclick = function() {
                
                var tooltip = KellyTools.getNoticeTooltip(env.hostClass, env.className);
                var tipName = this.getAttribute('data-tip'), html = lng.s('', tipName);
                for (var i = 1; i <= 10; i++) html += lng.s('', tipName + '_' + i);
                   
                KellyTools.setHTMLData(tooltip.getContent(), '<div>' + html + '</div>');                
                tooltip.show(true);
                return false;
            }
        }
                
        var tabActivate = function(tab) {        
            handler.tabActive = tab.getAttribute('data-tab');
            
            for (var i = 0; i < tabMenuItems.length; i++) {
                KellyTools.classList('remove', tabMenuItems[i], 'active');
                KellyTools.getElementByClass(handler.wrap, tabMenuItems[i].getAttribute('data-tab')).style.display = 'none';
            }
            
            handler.setMessage(false);
            KellyTools.getElementByClass(handler.wrap, handler.tabActive).style.display = 'block';
            KellyTools.classList('add', tab, 'active');
            
            var tabKey = handler.tabActive.replace(env.className + '-', '');
            if (handler.tabData[tabKey].onSelect) handler.tabData[tabKey].onSelect(handler);
        }
          
        var tabMenuItems = handler.wrap.getElementsByClassName(env.className + '-tab-item');
        for (var i = 0; i < tabMenuItems.length; i++) {
    
            if (tabMenuItems[i].getAttribute('data-tab').indexOf(handler.tabActive) != -1) tabActivate(tabMenuItems[i]);            
            tabMenuItems[i].onclick = function() { tabActivate(this); return false; }
        }
        
        var saveButtons = handler.wrap.getElementsByClassName(env.className + '-OptionsSave');
        for (var i = 0; i < saveButtons.length; i++) saveButtons[i].onclick = function() { handler.updateOptionsConfig(); return false; }
        
        var updateGridSelector = function(val) {
                var typeOptionList = handler.wrap.getElementsByClassName(env.className + '-grid-group');                
                for (var i = 0; i < typeOptionList.length; i++) {
                    if (typeOptionList[i].className.indexOf('bc-dynamic') == -1 && typeOptionList[i].className.indexOf('bc-fixed') == -1) continue;
                    KellyTools.classList('add', typeOptionList[i], 'hidden');
                    if ((typeOptionList[i].className.indexOf(val) != -1)) KellyTools.classList('remove', typeOptionList[i], 'hidden');
                }
            }
            
        var gridType = handler.wrap.getElementsByClassName(env.className + '-grid_type');
        for (var i = 0; i < gridType.length; i++) gridType[i].onclick = function() { updateGridSelector(this.value); }

        updateGridSelector(handler.getCfgValue('grid_type'));
    }
    
    this.showOptionsDialog = function(selectTab) {
        
        if (!handler.wrap) return;
        
        fav = handler.favEnv.getGlobal('fav');
        if (selectTab) handler.tabActive = selectTab;
        
        // hide options dialog by click on any sidebar filter
        if (fav.coptions.optionsSide) {
           
            var backActionButtons = handler.favEnv.getView('sidebar').getElementsByTagName('A'), backAction = function() { handler.favEnv.showFavouriteImages(); return false; };                
            for (var i = 0; i < backActionButtons.length; i++) backActionButtons[i].onclick = backAction;
            
        } else handler.favEnv.closeSidebar();
                
        handler.favEnv.getImageGrid().close();         
        var outputTabs = '', output = '', htmlFastIcon = '<div class="' + env.hostClass + ' ' + env.className + '-fast-save ' + env.className +'-icon-download" style=""></div>';
        
        for (var tabKey in handler.tabData) {       
            output += '<div class="' + env.className + '-tab ' + env.className + '-' + tabKey + '">';
            
            if (handler.tabData[tabKey].parts) {
                for (var sKey in handler.tabData[tabKey].parts) output += handler.showSection(sKey) + handler.showCfgPool(handler.tabData[tabKey].parts[sKey]) + handler.showSection(sKey, true);
                output += handler.showSave();
            }
            
            if (tabKey == 'BaseOptions') output = output.replace('[ICON]', htmlFastIcon).replace('[ICON2]', htmlFastIcon.replace('icon-download', 'icon-download-configurable'));
            output += '</div>';
            outputTabs += '<li data-tab="' + env.className + '-' + tabKey + '" class="' + env.className + '-tab-item ' + env.className + '-buttoncolor-dynamic" ><a href="#" >' + lng.s('', handler.tabData[tabKey].loc) + '</a></li>';
        }
                 
        KellyTools.setHTMLData(handler.wrap, '<div class="' + env.className + '-tab-list"><ul>' + outputTabs + '</ul></div>' + output + '<div class="' + env.className + '-OptionsMessage"></div>');                    
        handler.updateEvents(); handler.setMessage(false);
    }
    
    this.updateOptionsConfig = function() {
        
        if (!handler.wrap) return;
        
        var fav = handler.favEnv.getGlobal('fav'), refreshPosts = handler.applyInputSettingsPool(false);        
        if (fav.coptions.grid.autoScroll <= 0) fav.coptions.grid.autoScroll = '';
        if (fav.coptions.grid.autoScroll > 1000) fav.coptions.grid.autoScroll = 1000;        
        if (fav.coptions.grid.fixed < 1) fav.coptions.grid.fixed = 1;        
        if (fav.coptions.grid.fixed > 10) fav.coptions.grid.fixed = 10;        
        if (fav.coptions.grid.min > 10) fav.coptions.grid.min = 10;
        if (!fav.coptions.grid.rowHeight || fav.coptions.grid.rowHeight <= 0) fav.coptions.grid.rowHeight = 250;
        if (!fav.coptions.grid.min || fav.coptions.grid.min <= 0) fav.coptions.grid.min = 2;
        if (!fav.coptions.grid.heightDiff || fav.coptions.grid.heightDiff <= 0) fav.coptions.grid.heightDiff = 10;
        if (!fav.coptions.grid.perPage || fav.coptions.grid.perPage <= 0) fav.coptions.grid.perPage = 60;        
        if (fav.coptions.grid.perPage > 1000) fav.coptions.grid.perPage = 1000;        
        if (fav.coptions.grid.heightDiff > 60) fav.coptions.grid.heightDiff = 60;
                               
        var menuItems = handler.favEnv.getView('menu');        
        if (menuItems['ctoptions']) menuItems['ctoptions'].style.display = fav.coptions.optionsSide ? 'none' : ''; 
                
        if (handler.favEnv.isDownloadSupported) {
            fav.coptions.grabberDriver = KellyGrabber.validateDriver({requestMethod : fav.coptions.grabberDriver.requestMethod, transportMethod : fav.coptions.grabberDriver.transportMethod});                             
            handler.favEnv.getDownloadManager().updateCfg({driver : fav.coptions.grabberDriver});
        }                

        handler.showOptionsDialog(); handler.setMessage(lng.s('Настройки сохранены', 'options_saved'));
        handler.favEnv.save('cfg');	

        if (env.events.onOptionsUpdate && env.events.onOptionsUpdate(refreshPosts)) return;        
        if (refreshPosts) handler.favEnv.formatPostContainers(); 
        if (handler.cfgInput['bottomToolbar'] && handler.favEnv.getToolbar() && !fav.coptions.bottomToolbar) {
            handler.favEnv.getToolbar().show(false);
        } 
    }
    
    constructor(cfg);
}
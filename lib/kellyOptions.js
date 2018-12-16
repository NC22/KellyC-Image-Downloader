// part of KellyFavItems extension

// todo - move profile-only props to profile (add onShow \ onUpdate events)
// profile-only options 
// "hide social networks"
// "auto-scroll to top"

function KellyOptions(cfg) {
    
    var handler = this;   
    
    this.favEnv = false;
    this.wrap = false;
    
    var lng = KellyLoc;
    
    function constructor(cfg) { }   
    
    this.showOptionsDialog = function(tabActive) {
        
        if (!handler.wrap) return;
        
        handler.favEnv.getImageGrid().close();
        
        var favContent = handler.wrap;
        var fav = handler.favEnv.getGlobal('fav');
        var env = handler.favEnv.getGlobal('env');
        
        // get current selected tab, before redraw
        if (!tabActive) {
            tabActive = env.className + '-BaseOptions';
                
            var tabItems = favContent.getElementsByClassName(env.className + '-tab-item');
            for (var i = 0; i < tabItems.length; i++) {
                if (tabItems[i].className.indexOf('active') != -1) {
                    tabActive = tabItems[i].getAttribute('data-tab');
                }
            }
        }
        
        // hide options dialog by click on any sidebar filter
        if (fav.coptions.optionsSide) {
           
            var backActionButtons = handler.favEnv.getView('sidebar').getElementsByTagName('A');
            for (var i = 0; i < backActionButtons.length; i++) {
                backActionButtons[i].onclick = function() {
                    handler.favEnv.showFavouriteImages();
                    return false;
                }                
            }
            
        } else {            
            
            handler.favEnv.closeSidebar();
        }
                
        // currently only one type of storage
        favContent.innerHTML = '';
        var output= '';
    
        output += '<h3>' + lng.s('Добавление в избранное', 'options_fav_add') + '</h3>';
        output += '<table class="' + env.className + '-options-table">';
      
        output += '<tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'SyncByAdd" ' + (fav.coptions.syncByAdd ? 'checked' : '') + '> ' + lng.s('Дублировать в основное избранное пользователя если авторизован', 'sync_by_add') + '</label></td></tr>';
        output += '<tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'HideSoc" ' + (fav.coptions.hideSoc ? 'checked' : '') + '> ' + lng.s('Скрывать кнопки соц. сетей из публикаций', 'hide_soc') + '</label></td></tr>';
              
        output += '<tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'addToFavSide" ' + (fav.coptions.addToFavSide ? 'checked' : '') + '> \
               ' + lng.s('Перенести кнопку "добавить в избранное" для публикаций в блок соц. сетей', 'add_to_fav_side') + '</label></td></tr>';
       
        output += '</table>';
        
        if (handler.favEnv.isDownloadSupported) {
            
            output += '<h3>' + lng.s('Быстрое сохранение', 'fast_download') + '</h3>';	
            
            output += '<table class="' + env.className + '-options-table">\
                <tr><td colspan="2"><label><input type="checkbox" class="' + env.className + 'FastSaveEnabled" ' + (fav.coptions.fastsave.enabled ? 'checked' : '') + '> ' + lng.s('Показывать кнопку быстрого сохранения для публикаций', 'fast_save_enabled') + '</label></td></tr>\
                <tr><td>' + lng.s('Сохранять в папку', 'fast_save_to') + '</td><td><input type="text" class="' + env.className + 'FastSaveBaseFolder" placeholder="' + env.profile + '/Fast' + '" value="' +  fav.coptions.fastsave.baseFolder + '"></td></tr>\
                <tr class="radioselect"><td colspan="2">\
                    \
                        <label><input type="radio" name="' + env.className + '-conflict" value="overwrite" class="' + env.className + '-conflict" ' + (!fav.coptions.fastsave.conflict || fav.coptions.fastsave.conflict == 'overwrite' ? 'checked' : '') + '> \
                        ' + lng.s('Перезаписывать при совпадении имен', 'fast_save_overwrite') + '\
                        </label>\
                        <label><input type="radio" name="' + env.className + '-conflict" value="uniquify" class="' + env.className + '-conflict" ' + (fav.coptions.fastsave.conflict == 'uniquify' ? 'checked' : '') + '> \
                        ' + lng.s('Сохранять с другим именем', 'fast_save_uniq') + '\
                        </label>\
                    \
                </td></tr>\
                <tr><td colspan="2">\
                    <label><input type="checkbox" value="1" class="' + env.className + 'FastSaveCheck" ' + (fav.coptions.fastsave.check ? 'checked' : '') + '> ' + lng.s('Проверять был ли уже скачан файл', 'fast_save_check') + '</label>\
                    <p>' + lng.s('Если файл уже скачан ранее, к кнопке сохранения будет добавлен зеленый маркер', 'fast_save_check_notice') + '</p>\
                    </td>\
                </tr>\
                <!--tr><td>Шаблон имени файла</td><td><input type="text" class="' + env.className + 'FastSaveNameTemplate" value="' +  fav.coptions.fastsave.nameTemplate + '"></td></tr-->\
            ';
            
            output += '</table>';
        }
        
        output += '<h3>' + lng.s('Настройки страницы избранного', 'cgrid_tiles_header') + '</h3>';		
         
        output += '<table class="' + env.className + '-options-table">';
        output += '<tr><td colspan="2">\
                    <label>\
                        <input type="checkbox" value="1" class="' + env.className + 'NewFirst" ' + (fav.coptions.newFirst ? 'checked' : '') + '> \
                        ' + lng.s('Новые в начало', 'cgrid_new_to_begin') + '\
                    </lablel>\
                  </td></tr>'; 
        output += '<tr><td colspan="2">\
                    <label>\
                        <input type="checkbox" value="1" class="' + env.className + 'Lazy" ' + (fav.coptions.grid.lazy ? 'checked' : '') + '> \
                        ' + lng.s('Загружать картинки только когда они будут в видимой области (lazyLoad)', 'cgrid_lazy') + '\
                    </lablel>\
                  </td></tr>';                   
        output += '<tr><td colspan="2">' + lng.s('Режим просмотра', 'cgrid_imageview') + '</td></tr>';
        output += '<tr class="radioselect"><td colspan="2">\
                    \
                        <label><input type="radio" value="hd" name="' + env.className + '-grid-imageview" class="' + env.className + '-grid-imageview" ' + (!fav.coptions.grid.viewerShowAs || fav.coptions.grid.viewerShowAs == 'hd' ? 'checked' : '') + '> \
                        ' + lng.s('Открывать оригинал', 'cgrid_imageview_hd') + '\
                        </label>\
                        <label><input type="radio" value="preview" name="' + env.className + '-grid-imageview" class="' + env.className + '-grid-imageview" ' + (fav.coptions.grid.viewerShowAs == 'preview' ? 'checked' : '') + '> \
                        ' + lng.s('Открывать превью', 'cgrid_imageview_preview') + '\
                        </label>\
                    \
                    </td></tr>';    
        output += '<tr><td>' + lng.s('Элементов на страницу', 'cgrid_per_page') + '</td> <td><input type="text" class="' + env.className + 'GridPerPage" value="' +  fav.coptions.grid.perPage + '"></td></tr>';
 
        output += '<tr><td>' + lng.s('Пролистывать на вверх при переходе на новую страницу', 'cgrid_autoscroll') + '</td>\
                   <td><input type="text" placeholder="' + lng.s('Номер строки элементов', 'cgrid_autoscroll_input') + '" class="' + env.className + 'GridAutoScroll" value="' + (fav.coptions.grid.autoScroll ? fav.coptions.grid.autoScroll  : '') + '"></td></tr>';
        output += '<tr><td colspan="2">' + lng.s('Если страница пролистана до N строки элементов, автоматически проматывать страницу при переходе на новую в начало', 'cgrid_autoscroll_notice') + '</td></tr>';
       
        output += '<tr><td colspan="2">' + lng.s('Режим отображения публикаций', 'cgrid_type') + '</td></tr>';
        output += '\
            <tr class="radioselect"><td colspan="2">\
                \
                    <label><input type="radio" value="dynamic" name="' + env.className + 'GridType" class="' + env.className + 'GridType" ' + (fav.coptions.grid.type == 'dynamic'  ? 'checked' : '') + '> ' + lng.s('Динамическое количество в строке', 'cgrid_type_dynamic') + '</label>\
                    <label><input type="radio" value="fixed" name="' + env.className + 'GridType" class="' + env.className + 'GridType" ' + (fav.coptions.grid.type == 'fixed'  ? 'checked' : '') + '> ' + lng.s('Фиксированое количество в строке', 'cgrid_type_fixed') + '</label>\
                \
            </td></tr>\
        ';
        
        var classRow = env.className + 'GridType-option ' + env.className + 'GridType-dynamic ';
            classRow += fav.coptions.grid.type == 'dynamic' ? 'active' : 'hidden';
                  
        output += '<tr class="' + classRow + '"><td>' + lng.s('Максимальная высота одной строки', 'cgrid_max_row_height') + ' (px)</td> <td><input type="text" class="' + env.className + 'GridRowHeight" value="' +  fav.coptions.grid.rowHeight + '"></td></tr>';
        output += '<tr class="' + classRow + '"><td>' + lng.s('Допустимая погрешность высоты строки', 'cgrid_max_diff') + ' (%)</td> <td><input type="text" class="' + env.className + 'GridHeightDiff" value="' +  fav.coptions.grid.heightDiff + '"></td></tr>';
        output += '<tr class="' + classRow + '"><td>' + lng.s('Минимальное кол-во элементов в строке', 'cgrid_min_number') + '</td> <td><input type="text" class="' + env.className + 'GridMin" value="' +  fav.coptions.grid.min + '"></td></tr>';
            
            classRow = env.className + 'GridType-option ' + env.className + 'GridType-fixed ';
            classRow += fav.coptions.grid.type && fav.coptions.grid.type == 'fixed' ? 'active' : 'hidden';
            
        output += '<tr class="' + classRow + '"><td>' + lng.s('Фиксированное кол-во элементов на строку', 'cgrid_fixed') + '</td> <td><input type="text" class="' + env.className + 'GridFixed" value="' +  (!fav.coptions.grid.fixed ? '4' : fav.coptions.grid.fixed) + '"></td></tr>';
        
        // output += '<tr><td>' + lng.s('Стиль по умолчанию для элемента строки', 'cgrid_default_rowst') + '</td> <td><input type="text" class="' + env.className + 'GridCssItem" value="' +  fav.coptions.grid.cssItem + '"></td></tr>';
        
               
        output += '</table>';
        
        if (handler.favEnv.isDownloadSupported) {
            
            output += '<h3>' + lng.s('Загрузки', 'grabber_options_title') + '</h3>';	
            
            output += '<table class="' + env.className + '-options-table">';
            output += '<tr><td colspan="2">' + lng.s('', 'grabber_options_notice') + '</td></tr>';

            output += '<tr><td>' + lng.s('Способ передачи данных в фоновый процесс', 'grabber_transport') + '</td>';
            output += '<td>';
            
            output += '<select class="' + env.className + 'GrabberTransport">';
            output += '<option value="' + KellyGrabber.TRANSPORT_BLOB + '" ' + (fav.coptions.grabberDriver.transportMethod == KellyGrabber.TRANSPORT_BLOB ? 'selected' : '') + '>' + lng.s('', 'grabber_transport_blob') + '</option>';
            output += '<option value="' + KellyGrabber.TRANSPORT_BLOBBASE64 + '" ' + (fav.coptions.grabberDriver.transportMethod == KellyGrabber.TRANSPORT_BLOBBASE64 ? 'selected' : '') + '>' + lng.s('', 'grabber_transport_blobbase64') + '</option>';
            output += '</select>&nbsp;&nbsp;&nbsp;(<a href="#" class="' + env.className + '-help" data-tip="grabber_transport_help">' + lng.s('', 'tip') + '</a>)';
            
            output += '</td></tr>';
            
            output += '<tr><td>' + lng.s('Способ скачивания изображений', 'grabber_request') + '</td>';
            output += '<td>';
            
            output += '<select class="' + env.className + 'GrabberRequest">';
            output += '<option value="' + KellyGrabber.REQUEST_XML + '" ' + (fav.coptions.grabberDriver.requestMethod == KellyGrabber.REQUEST_XML ? 'selected' : '') + '>' + lng.s('', 'grabber_request_xml') + '</option>';
            output += '<option value="' + KellyGrabber.REQUEST_IFRAME + '" ' + (fav.coptions.grabberDriver.requestMethod == KellyGrabber.REQUEST_IFRAME ? 'selected' : '') + '>' + lng.s('', 'grabber_request_iframe') + '</option>';
            output += '</select>&nbsp;&nbsp;&nbsp;(<a href="#" class="' + env.className + '-help" data-tip="grabber_request_help">' + lng.s('', 'tip') + '</a>)';
            
            output += '</td></tr>';           
            output += '</table>';
        }        
        
        output += '<div><input type="submit" value="' + lng.s('Сохранить', 'save') + '" class="' + env.className + '-OptionsSave"></div>';
        output += '<div class="' + env.className + '-OptionsMessage"></div>';  
        
            
        var tabBaseOptions = document.createElement('DIV');            
            tabBaseOptions.className = env.className + '-tab ' + env.className + '-BaseOptions';	
            
            KellyTools.setHTMLData(tabBaseOptions, output);
            
        var tabStorage = document.createElement('DIV');
            tabStorage.className = env.className + '-tab ' + env.className + '-Storage';
            
        var tabCfg = document.createElement('DIV');
            tabCfg.className = env.className + '-tab ' + env.className + '-Cfg';
            
        var tabOther = document.createElement('DIV');
            tabOther.className = env.className + '-tab ' + env.className + '-Other';
            
        var tabControlls = document.createElement('DIV');
        
            output = '\
            <div class="' + env.className + '-tab-list">\
                <ul>\
                    <li data-tab="' + env.className + '-BaseOptions" class="' + env.className + '-tab-item ' + env.className + '-buttoncolor-dynamic" >\
                        <a href="#" >' + lng.s('Основные настройки', 'options_main') + '</a>\
                    </li>\
                    <li data-tab="' + env.className + '-Storage" class="' + env.className + '-tab-item ' + env.className + '-buttoncolor-dynamic" >\
                        <a href="#">' + lng.s('Данные', 'storage') + '</a>\
                    </li>\
                    <li data-tab="' + env.className + '-Other" class="' + env.className + '-tab-item ' + env.className + '-buttoncolor-dynamic" >\
                        <a href="#" >' + lng.s('Остальное', 'other') + '</a>\
                    </li>\
                    <li data-tab="' + env.className + '-Cfg" class="' + env.className + '-tab-item ' + env.className + '-buttoncolor-dynamic" >\
                        <a href="#" >' + lng.s('Восстановление', 'restore') + '</a>\
                    </li>\
                </ul>\
            </div>';
            
        KellyTools.setHTMLData(tabControlls, output);
            
        favContent.appendChild(tabControlls);
        favContent.appendChild(tabBaseOptions);
        favContent.appendChild(tabStorage);
        favContent.appendChild(tabCfg);
        favContent.appendChild(tabOther);

        var tips = favContent.getElementsByClassName(env.className + '-help');
        for (var i = 0; i < tips.length; i++) {
            
            tips[i].onclick = function() {
                
                var tipName = this.getAttribute('data-tip');
                if (!tipName) return false;
                
                var tooltip = new KellyTooltip({
                    target : 'screen', 
                    offset : {left : 40, top : -40}, 
                    positionY : 'bottom',
                    positionX : 'left',				
                    ptypeX : 'inside',
                    ptypeY : 'inside',
                    closeButton : true,
                    removeOnClose : true,                    
                    selfClass : env.hostClass + ' ' + env.className + '-tooltipster-help',
                    classGroup : env.className + '-tooltipster',
                });
                   
                var html = lng.s('', tipName);
                for (var i = 1; i <= 10; i++) {
                    html += lng.s('', tipName + '_' + i);
                }
                   
                var tcontainer = tooltip.getContent();
                KellyTools.setHTMLData(tcontainer, '<div>' + html + '</div>');
                
                setTimeout(function() {
                    
                    tooltip.show(true);                    
                    tooltip.updatePosition();
                    tooltip.updateCfg({closeByBody : true});
                    
                }, 100);
                return false;
            }
        }
        
        var gridType = favContent.getElementsByClassName(env.className + 'GridType');
        if (gridType) {
            for (var i = 0; i < gridType.length; i++) {
            
                gridType[i].onclick = function() {
                
                    fav.coptions.grid.type = this.value;
                    
                    if (!fav.coptions.grid.type ||  fav.coptions.grid.type == 'dynamic') {
                         fav.coptions.grid.type = 'dynamic';
                    } else {
                         fav.coptions.grid.type = 'fixed';
                    }
                    
                    var typeOptionList = favContent.getElementsByClassName(env.className + 'GridType-option');
                    if (typeOptionList) {
                        for (var i = 0; i < typeOptionList.length; i++) {
                        
                            if (typeOptionList[i].className.indexOf(fav.coptions.grid.type) == -1) {
                                typeOptionList[i].className = typeOptionList[i].className.replace('active', 'hidden');
                            } else {
                                typeOptionList[i].className = typeOptionList[i].className.replace('hidden', 'active');
                            }
                        }
                    }
                }
            }
        }
        
        var tabAction = function(tabActive) {
            if (tabActive == env.className + '-Storage') {
                                
                handler.favEnv.getStorageManager().wrap = tabStorage;
                handler.favEnv.getStorageManager().showDBManager();
                
            } else if (tabActive == env.className + '-Cfg') {
                            
                handler.favEnv.getStorageManager().wrap = tabCfg;
                handler.favEnv.getStorageManager().showCfgManager();
            }
        }
        
        var tabMenuItems = tabControlls.getElementsByClassName(env.className + '-tab-item');
        for (var i = 0; i < tabMenuItems.length; i++) {
            var tabEl = KellyTools.getElementByClass(favContent, tabMenuItems[i].getAttribute('data-tab'));
            if (!tabEl) continue;
            
            if (tabMenuItems[i].getAttribute('data-tab').indexOf(tabActive) != -1) {
                tabMenuItems[i].className += ' active';
                tabEl.style.display = 'block';
            } else {
                tabEl.style.display = 'none';
            }
            
            tabMenuItems[i].onclick = function() {
            
                for (var i = 0; i < tabMenuItems.length; i++) {
                    tabMenuItems[i].className = tabMenuItems[i].className.replace('active', '').trim();
                    KellyTools.getElementByClass(favContent, tabMenuItems[i].getAttribute('data-tab')).style.display = 'none';
                }
                
                KellyTools.getElementByClass(favContent, this.getAttribute('data-tab')).style.display = 'block';
                this.className += ' active';
                
                var messageBox = document.getElementsByClassName(env.className + '-OptionsMessage');
                for (var i = 0; i < messageBox.length; i++) {
                    messageBox[i].innerHTML = '';
                }
                
                tabAction(this.getAttribute('data-tab'));
                return false;
            }
        }			
                    
        output = '<table>';        
        output += '<tr><td colspan="2"><label><input type="checkbox" value="1" class="' + env.className + 'OptionsSide" ' + (fav.coptions.optionsSide ? 'checked' : '') + '> \
               ' + lng.s('Перенести кнопку настроек из основного в боковое меню фильтров', 'options_side') + '</label></td></tr>';
         
        output += '<tr><td>' + lng.s('Игнорировать комментарии', 'ignore_comments') + ' :</td>\
                        <td><input type="text" class="kellyBlockcomments" value="' + KellyTools.varListToStr(fav.coptions.comments_blacklist) + '"></td>\
                   </tr>';
        output += '<tr><td>' + lng.s('Игнорировать посты', 'ignore_publications') + ' :</td>\
                        <td><input type="text" class="kellyBlockposts" value="' + KellyTools.varListToStr(fav.coptions.posts_blacklist) + '"></td>\
                   </tr>';
        output += '<tr><td colspan="2"><label><input type="checkbox" class="' + env.className + 'OptionsDebug" ' + (fav.coptions.debug ? 'checked' : '') + '> ' + lng.s('Режим отладки', 'debug') + '</label></td></tr>';
        output += '<tr><td colspan="2"><label>' + lng.s('Версия', 'ext_ver') + ' : ' + KellyTools.getProgName() + '</label></td></tr>';
                  
        output += '</table>';
        output += '<div><input type="submit" value="' + lng.s('Сохранить', 'save') + '" class="' + env.className + '-OptionsSave"></div>';
        output += '<div class="' + env.className + '-OptionsMessage"></div>';    
        
        KellyTools.setHTMLData(tabOther, output);
        
        var saveButtons = document.getElementsByClassName(env.className + '-OptionsSave');
        for (var i = 0; i < saveButtons.length; i++) {
            saveButtons[i].onclick = function() {
                handler.updateOptionsConfig();
                return false;
            }
        }
        
        tabAction(tabActive);
    }
    
    this.updateOptionsConfig = function() {
        
        if (!handler.wrap) return;
        
        var favContent = handler.wrap;
        var fav = handler.favEnv.getGlobal('fav');
        var env = handler.favEnv.getGlobal('env');
                
        fav.coptions.grid = {
            fixed :  KellyTools.inputVal(env.className + 'GridFixed', 'int', favContent),
            rowHeight : KellyTools.inputVal(env.className + 'GridRowHeight', 'int', favContent),
            min : KellyTools.inputVal(env.className + 'GridMin', 'int', favContent), 
            cssItem : KellyTools.inputVal(env.className + 'GridCssItem', 'string', favContent),
            heightDiff : KellyTools.inputVal(env.className + 'GridHeightDiff', 'int', favContent),
            perPage : KellyTools.inputVal(env.className + 'GridPerPage', 'int', favContent),
            autoScroll : KellyTools.inputVal(env.className + 'GridAutoScroll', 'int', favContent),
            type : fav.coptions.grid.type,
            viewerShowAs : 'hd',
        };
        
        if (fav.coptions.grid.autoScroll <= 0) {
            fav.coptions.grid.autoScroll = '';
        }
        
        if (fav.coptions.grid.autoScroll > 1000) {
            fav.coptions.grid.autoScroll = 1000;
        }
        
        if (fav.coptions.grid.fixed < 1) {
            fav.coptions.grid.fixed = 1;
        }
        
        if (fav.coptions.grid.fixed > 10) {
            fav.coptions.grid.fixed = 10;
        }
        
        if (fav.coptions.grid.min > 10) {
            fav.coptions.grid.min = 10;
        }
        
        var refreshPosts = false;
        
        var hideSocCurrent = fav.coptions.hideSoc;
        fav.coptions.hideSoc = KellyTools.getElementByClass(favContent, env.className + 'HideSoc').checked ? true : false;        
        if (hideSocCurrent != fav.coptions.hideSoc) {
            refreshPosts = true;
        }
                
        if (handler.favEnv.isDownloadSupported) {
            
            var fastSaveCurrent = KellyTools.getElementByClass(favContent, env.className + 'FastSaveEnabled').checked ? true : false;            
            if (fastSaveCurrent != fav.coptions.fastsave.enabled) {
                refreshPosts = true;
            }
            
            var fconflictActions = document.getElementsByClassName(env.className + '-conflict');
            var fconflict = 'overwrite';
            
            for (var i = 0; i < fconflictActions.length; i++) {
            
                var value = KellyTools.inputVal(fconflictActions[i]);
                
                if (value && fconflictActions[i].checked && ['overwrite', 'uniquify'].indexOf(value) != -1) {
                     fconflict = fconflictActions[i].value;
                }
            }
            
            fav.coptions.fastsave = {
                baseFolder : KellyTools.validateFolderPath(KellyTools.inputVal(env.className + 'FastSaveBaseFolder', 'string', favContent)),
                // nameTemplate : KellyTools.getElementByClass(favContent, env.className + 'FastSaveNameTemplate').value,
                enabled : fastSaveCurrent,
                check :  KellyTools.getElementByClass(favContent, env.className + 'FastSaveCheck').checked ? true : false,
                conflict : fconflict,
            };
            
        }

        var imageviewModeActions = document.getElementsByClassName(env.className + '-grid-imageview');
        for (var i = 0; i < imageviewModeActions.length; i++) {            
            var value = KellyTools.inputVal(imageviewModeActions[i]);            
            if (value && imageviewModeActions[i].checked && ['hd', 'preview'].indexOf(value) != -1) {
                 fav.coptions.grid.viewerShowAs = imageviewModeActions[i].value;
            }
        }
        
        fav.coptions.debug = false;
        
        if (KellyTools.getElementByClass(favContent, env.className + 'OptionsDebug').checked) {
            fav.coptions.debug = true;
            KellyTools.DEBUG = true;
            
            KellyTools.log('debug mode overloaded by user config', 'KellyOptions');
        }
        
        fav.coptions.newFirst = false;
        if (KellyTools.getElementByClass(favContent, env.className + 'NewFirst').checked) {
            fav.coptions.newFirst = true;
        }
        
        fav.coptions.grid.lazy = false;
        if (KellyTools.getElementByClass(favContent, env.className + 'Lazy').checked) {
            fav.coptions.grid.lazy = true;
        }
        
        fav.coptions.syncByAdd = false;
        if (KellyTools.getElementByClass(favContent, env.className + 'SyncByAdd').checked) {
            fav.coptions.syncByAdd = true;
        }
        
        fav.coptions.optionsSide = false;
        if (KellyTools.getElementByClass(favContent, env.className + 'OptionsSide').checked) {
            fav.coptions.optionsSide = true;
        }
        
        var addToFavSide = KellyTools.getElementByClass(favContent, env.className + 'addToFavSide').checked;
        if (addToFavSide != fav.coptions.addToFavSide) {
            fav.coptions.addToFavSide = addToFavSide;
            refreshPosts = true;
        }
        
        var menuItems = handler.favEnv.getView('menu');
        
        if (menuItems['ctoptions']) {
            menuItems['ctoptions'].style.display = fav.coptions.optionsSide ? 'none' : '';  
        }
                
        if (handler.favEnv.isDownloadSupported) {
            
            var requestMethod = KellyTools.getElementByClass(favContent, env.className + 'GrabberRequest');
                requestMethod = requestMethod.options[requestMethod.selectedIndex].value;
                
            var transportMethod = KellyTools.getElementByClass(favContent, env.className + 'GrabberTransport');
                transportMethod = transportMethod.options[transportMethod.selectedIndex].value;
                
            if (requestMethod != fav.coptions.grabberDriver.requestMethod ||
                transportMethod != fav.coptions.grabberDriver.transportMethod) {
            
                fav.coptions.grabberDriver = KellyGrabber.validateDriver({
                    requestMethod : requestMethod,
                    transportMethod : transportMethod,            
                });
                             
                handler.favEnv.getDownloadManager().updateCfg({
                    driver : fav.coptions.grabberDriver,
                });
            }
        }
        
        /*
        var iconFile = KellyTools.getElementByClass(favContent, 'kellyAutoScroll');
        
        if (iconFile.value) {
        
            var saveIcon = function(el, icon) {
                log(icon);
            }
            
            KellyTools.readInputFile(iconFile, saveIcon, 'dataurl');
        } 
        */
                
        if (!fav.coptions.grid.rowHeight || fav.coptions.grid.rowHeight <= 0) fav.coptions.grid.rowHeight = 250;
        if (!fav.coptions.grid.min || fav.coptions.grid.min <= 0) fav.coptions.grid.min = 2;
        if (!fav.coptions.grid.heightDiff || fav.coptions.grid.heightDiff <= 0) fav.coptions.grid.heightDiff = 10;
        if (!fav.coptions.grid.perPage || fav.coptions.grid.perPage <= 0) fav.coptions.grid.perPage = 60;
        
        if (fav.coptions.grid.perPage > 1000) {
            fav.coptions.grid.perPage = 1000;
        }
        
        if (fav.coptions.grid.heightDiff > 60) {
            fav.coptions.grid.heightDiff = 60;
        }
                
        fav.coptions.comments_blacklist = KellyTools.getVarList(KellyTools.inputVal('kellyBlockcomments', 'string', favContent));
        fav.coptions.posts_blacklist = KellyTools.getVarList(KellyTools.inputVal('kellyBlockposts', 'string', favContent));
        
        var applaySave = function() {
        
            handler.showOptionsDialog();
            
            var messageBox = document.getElementsByClassName(env.className + '-OptionsMessage');
            
            for (var i = 0; i < messageBox.length; i++) {
                messageBox[i].innerText = lng.s('Настройки сохранены', 'options_saved');
            }
            
            handler.favEnv.save('cfg');
        }
        
        applaySave();	

        if (env.events.onOptionsUpdate && env.events.onOptionsUpdate(refreshPosts)) {
            return;
        }
        
        if (refreshPosts) {            
            handler.favEnv.formatPostContainers(); 
        }        
    }
    
    constructor(cfg);
}
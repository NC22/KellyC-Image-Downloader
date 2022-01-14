// part of KellyFavItems extension

function KellyFavStorageManager(cfg) {
    
    var handler = this;
    
    var MAX_ENV_SIZE = 256; // mb 
    var MAX_TOTAL_PER_DB = 28; // mb ~60000 images
    var MAX_CONFIG_SIZE = 2; // mb
    
    // from root = Downloads/coptions.baseFolder/[dir]/
    this.dir = {
        exportProfile : 'ExportedProfiles/',
        exportFiltered : 'FilteredProfiles/',
        exportBookmark : 'ExportedBookmarks/',
        logs : 'Logs/',
        cfgs : 'ExportedCfgs/',
    }
    
    this.collectSource = ['user-bookmarks']; // save data from workers temp memory - currently available - user-bookmarks | user-current
    
    // todo add events - onBeforeSave \ onBeforeLoad
    // todo - more options for "add data to db" function (import only images without categories)
    // prefixes can be modified by environment on init, relative to current site environment file
        
    this.prefix = 'kelly_db_';
    this.prefixCfg = 'kelly_cfg_';
    
    this.api = KellyTools.getBrowser();
    
    this.wrap = false;
    
    this.className = 'KellyFavStorageManager';
    this.mergeProcess = false;
    
    this.driver = 'api';
    this.configDriver = 'api'; // config always loads from api, also used as default storage driver in validateCfg
    
    this.storageContainer = false; 
    this.storageList = false;
    
    this.inUse = false;
    
    this.fav = false; // KellyFavItems
    this.favValidKeys = {cfg : ['coptions', 'selected_cats_ids', 'meta', 'cats_assoc_buffer'], items : ['categories', 'items', 'ids', 'profile']};
             
    var lng = KellyLoc; // singleton
    
    this.format = 'json';
    this.slist = false;
    
    // todo - add check total amount of data without prefix, it can differs in future, if more then one environment will supported
    this.envTotalKb = 0;
    
    function constructor(cfg) {    }
            
    this.showMessage = function(text, error, section) {
    
        var message = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-message' + (section ? '-' + section : ''));            
        if (!message) return;
        
        message.parentElement.classList.add(handler.className + '-active');
        message.classList.remove(handler.className + '-error');
        message.classList.remove(handler.className + '-success');
        
        if (error) message.classList.add(handler.className + '-error');
        else message.classList.add(handler.className + '-success');
        
        KellyTools.setHTMLData(message, text);
        
        handler.inUse = false;
    }
    
    this.showStorageList = function(slist) {    
    
        if (!handler.storageList) return;
        
        handler.slist = slist;
        handler.envTotalKb = 0;
        
        var html = '<div class="' + handler.className + '-DBItems-total">\
                    ' + lng.s('Общий размер данных', 'storage_manager_total') + ' : <span>' + (!slist.length ? '0' +  lng.s('кб', 'kb') :  lng.s('Загрузка', 'loading') + '...') + '</span> \
                    [' + lng.s('', 'storage_manager_' + handler.driver + '_notice', {MAX_TOTAL_PER_DB : MAX_TOTAL_PER_DB, MAX_ENV_SIZE : MAX_ENV_SIZE}) + ']\
                    </div>';
            
        KellyTools.setHTMLData(handler.storageList, html);
        
        var itemsLoaded = 0, config = handler.fav.getGlobal('options');
        
        if (!slist.length) {
            
            html = '<div class="' + handler.className + '-DBItem active"><span class="' + handler.className + '-DBItem-name">' + config.storage + '</span></div>';
            KellyTools.setHTMLData(handler.storageList, html);
            return;
        }
        
        for (var i = 0; i < slist.length; i++) {            
            
            var dbItem = document.createElement('DIV');
                dbItem.className = handler.className + '-DBItem';
                
            if (config.storage == slist[i]) dbItem.className += ' active';
            
            var dbName = slist[i], dbDesc = config.storageDesc && config.storageDesc[slist[i]] ? config.storageDesc[slist[i]] : false;
                
            var html = '<span class="' + handler.className + '-DBItem-name">' + (dbDesc && dbDesc.name ? dbDesc.name : slist[i]) + '</span>';
                html += '<span class="' + handler.className + '-DBItem-size ' + handler.className + '-' + dbName + '" ></span>';                
                html += '<a class="' + handler.className + '-DBItem-download' + '" href="#">' + lng.s('Скачать', 'download') + '</a>';
                html += '<a class="' + handler.className + '-DBItem-select' + '" href="#">' + lng.s('Выбрать', 'select') + '</a>';
                html += '<a class="' + handler.className + '-DBItem-download-empty ' + handler.className + '-right' + '" href="#">' + lng.s('Скачать пустой шаблон', 'download_empty_p') + '</a>';
        
            KellyTools.setHTMLData(dbItem, html);
                
            handler.storageList.appendChild(dbItem);            
            
            handler.getDBSize(dbName, function(dbName, size) {
                
                KellyTools.getElementByClass(handler.storageList, handler.className + '-' + dbName).innerText = parseFloat(size).toFixed(2) + 'кб';
                
                handler.envTotalKb += size;
                itemsLoaded++;
                
                if (itemsLoaded == slist.length) {
                    
                    var totalEl = KellyTools.getElementByClass(handler.storageList, handler.className + '-DBItems-total');
                    KellyTools.getElementByTag(totalEl, 'span').innerText = parseFloat(handler.envTotalKb).toFixed(2) + lng.s('кб', 'kb');
                }
            });
            
            var selectButton = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-select');
                selectButton.setAttribute('data-dbname', slist[i]);
                selectButton.onclick = function() {
                    
                    if (handler.fav.dataFilterLock || handler.fav.getDownloadManager().getState() != 'wait') return false;
                    if (handler.inUse || !this.getAttribute('data-dbname')) return false;
                    
                    handler.fav.dataFilterLock = true;
                    handler.inUse = true; 
                    handler.log('set [CFG][STORAGE] to ' + this.getAttribute('data-dbname'));
                    
                    handler.fav.getGlobal('options').storage = this.getAttribute('data-dbname');
                    resetDBCache(false, 'selectButton');
        
                    handler.fav.save('cfg', function(error) {
                                                
                        handler.fav.load('items', function() {   
                        
                            // console.log(handler.fav.getGlobal('options').storageDesc);        
                            // clear selected ?
                            
                            handler.fav.updateFavCounter();
                            handler.fav.resetFilterSettings();
                            handler.fav.formatPostContainers();
                             
                            handler.getStorageList(handler.showStorageList);
                            
                            handler.fav.dataFilterLock = false;
                            handler.showMessage(lng.s('База данных выбрана', 'storage_selected'), false, 'storage');
                        }, 'selectDB');                    
                    });
    
                    return false;
                }
            
            var downloadProfile = function() {
                    var dbName = this.getAttribute('data-dbname');
                    var dbClean = this.getAttribute('data-empty') ? true : false;
                    
                    handler.loadDB(dbName, function(db) {
                    
                        if (db === false) {
                            return false;                            
                        }
                        
                        if (dbClean) {
                            dbName += '_clean';
                            db.items = [];
                            db.ids = 100;
                        }
                        
                        var path = handler.fav.getGlobal('options').baseFolder + '/' + handler.dir.exportProfile + dbName + '_' + KellyTools.getTimeStamp() + '.' + handler.format;
                            path = KellyTools.validateFolderPath(path);
                            
                        handler.fav.getDownloadManager().createAndDownloadFile(JSON.stringify(db), path);    
                    });
                    
                    return false;
                } 
                
            var downloadButton = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-download');
                downloadButton.setAttribute('data-dbname', slist[i]);
                downloadButton.onclick = downloadProfile;
                
            var downloadButtonEmpty = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-download-empty');
                downloadButtonEmpty.setAttribute('data-dbname', slist[i]);
                downloadButtonEmpty.setAttribute('data-empty', '1');
                downloadButtonEmpty.onclick = downloadProfile   
        }
    }
    
    this.showCfgManager = function() {
        
        if (!handler.wrap) return;
        if (handler.inUse) return;
        
        handler.wrap.innerHTML = '';
        
        var overwriteId = handler.className + '-overwrite';
        var html = '\
            <div class="' + handler.className + '-wrap">\
                <table class="' + handler.className + '-options-table">\
                    <tr><td colspan="2"><h3>' + lng.s('Экспорт \\ Импорт настроек', 'storage_io_options') + '</h3></td></tr>\
                    <tr><td>' + lng.s('Загрузить из файла', 'storage_load_from_file') + '</td><td><input type="file" id="' + handler.className + '-cfg-file"></td></tr>\
                    <tr><td colspan="2" class="' + handler.className + '-cfg-buttons">\
                        <input type="submit" class="' + handler.className + '-io-export" value="' + lng.s('Экспорт', 'storage_io_options_export') + '">\
                        <input type="submit" class="' + handler.className + '-io-import" value="' + lng.s('Импорт', 'storage_io_options_import') + '">\
                    </td></tr>\
                    <tr><td colspan="2"><div class="' + handler.className + '-message ' + handler.className + '-message-delete"></div></td></tr>\
                </table>\
            </div>\
        ';
        
        handler.storageContainer = document.createElement('DIV');
        KellyTools.setHTMLData(handler.storageContainer, html);
        
        var importCfgButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-io-export');
            importCfgButton.onclick = function() {
                
                if (handler.inUse) return false;
                handler.inUse = true;
                
                var fileInput = document.getElementById(handler.className + '-cfg-file');
                if (fileInput.value) {
                
                    KellyTools.readInputFile(fileInput, function(input, fileData) {
                        
                        var fileSizeMb = fileData.length / 1000 / 1000;                        
                        if (fileSizeMb > MAX_CONFIG_SIZE) {
                            
                            fileSizeMb = fileSizeMb.toFixed(2);
                            handler.showMessage(lng.s('', 'storage_manager_hit_limit_db', { MAX_CONFIG_SIZE : MAX_CONFIG_SIZE, FILESIZE : fileSizeMb}), true);    
                            return;
                        }
                        
                        var newCfgData = KellyTools.parseJSON(fileData.trim());                          
                        if (newCfgData) { 
                        
                                var onDBSave =  function(error) {
                                
                                    if (!error) {
                                        
                                        handler.fav.load('cfg', function() {
                                            handler.inUse = false;
                                            handler.fav.showOptionsDialog(handler.fav.getGlobal('env').className + '-Cfg');

                                            var menuItems = handler.fav.getView('menu');
                                            if (menuItems['ctoptions']) menuItems['ctoptions'].style.display = handler.fav.getGlobal('fav').coptions.optionsSide ? 'none' : '';                                              
                                            handler.showMessage(lng.s('', 'storage_import_ok'));
                                        });                        
                                        
                                    } else {
                                    
                                        handler.showMessage(lng.s('', 'storage_import_e2'), true);
                                    }
                                    
                                };
                                
                                newCfgData = handler.validateCfg(newCfgData);
                                
                                handler.saveDB('config', newCfgData, onDBSave, true);
                                
                           
                        } else {
                            handler.showMessage(lng.s('Ошибка парсинга структурированных данных', 'storage_create_e2'), true);    
                        }
                        
                    });
                
                } else {
                    
                    handler.showMessage(lng.s('Укажите файл из которого будут импортированы настройки', 'storage_import_e1'), true);    
                }
                
                return false;
            }
            
            var downloadButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-io-import');
                downloadButton.onclick = function() {
                 
                    var path = handler.fav.getGlobal('options').baseFolder + '/' + handler.dir.cfgs + 'config_' + KellyTools.getTimeStamp() + '.' + handler.format;
                        path = KellyTools.validateFolderPath(path);
                    
                    var currentSession = handler.fav.getGlobal('fav');
                    if (handler.fav.getGlobal('env').events.onBeforeDownloadCfg && handler.fav.getGlobal('env').events.onBeforeDownloadCfg(currentSession)) return false;
                                        
                    handler.fav.getDownloadManager().createAndDownloadFile(JSON.stringify({ 
                        selected_cats_ids : currentSession.selected_cats_ids, 
                        coptions : currentSession.coptions
                    }), path);    
                
                    return false;
                }   
                
        handler.wrap.appendChild(handler.storageContainer);
    }
    
    this.applayDBCreateButton = function(el, idPrefix) {
        
        if (!el) {
            return false;
            
        }

        el.onclick = function() {
            
            if (handler.inUse) return false;
            handler.inUse = true;
            
            var dbName = KellyTools.inputVal(document.getElementById(idPrefix + '-create-name')); // todo validate by regular    
            if (!dbName) {
                handler.showMessage(lng.s('Введите название базы данных', 'storage_empty_name'), true);
                return false;
            }
                        
            var source = 'file';
            for (var i = 0; i < handler.collectSource.length; i++) {
                var byDataSource = document.getElementById(idPrefix + '-data-source-' + handler.collectSource[i]);
                if (byDataSource && byDataSource.checked) {
                    source = byDataSource.value;
                    break;
                }
            }
            
            var mode = document.getElementById(idPrefix + '-conflict-action').value;
            if (['add', 'overwrite', 'cancel'].indexOf(mode) == -1) mode = 'cancel';
            
            // validate memory limits
            
            if (handler.slist === false) {

                handler.showMessage(lng.s('Дождитесь загрузки списка баз данных', 'storage_beasy'), true);
                return false;
            }
            
            var envMb = handler.envTotalKb / 1000, env = handler.fav.getGlobal('env');                
            if (envMb > MAX_ENV_SIZE) {
                                    
                envMb = envMb.toFixed(2);
                handler.showMessage(lng.s('', 'storage_manager_hit_limit_env', { MAX_ENV_SIZE : MAX_ENV_SIZE, ENVSIZE : envMb}), true);    
                return false;
            }
            
            // check cached data before ask dispetcher
            if (mode == 'cancel' && handler.slist.indexOf(dbName) != -1) {
                
                handler.showMessage(lng.s('База данных уже существует', 'storage_create_already_exist'), true);
                return false;                    
            }
            
            // request if any bd already exist
            handler.loadDB(dbName, function(db) {
                
                if (db !== false && mode == 'cancel') {
                    handler.showMessage(lng.s('База данных уже существует', 'storage_create_already_exist'), true);
                    return false;                            
                }
                
                var onDBSave =  function(error) {
                
                    if (!error) {
                        
                        var noticeName = 'storage_create_ok_mcancel';
                        
                        if (db !== false && (mode == 'add' || mode == 'overwrite')) noticeName = 'storage_create_ok_m' + mode;
                        
                        if (dbName == handler.fav.getGlobal('fav').coptions.storage) {
                            
                            handler.fav.load('items', function() {
                                handler.fav.updateFavCounter();
                            });    
                        }
                        
                        handler.getStorageList(handler.showStorageList);
                        handler.showMessage(lng.s('', noticeName));
                        
                    } else {
                    
                        handler.showMessage(lng.s('Ошибка добавления базы данных', 'storage_create_e1'), true);
                    }
                    
                };
                    
                var createProfileByInput = function(input, fileData) {
                    
                    var fileSizeMb = fileData.length / 1000 / 1000;                    
                    if (fileSizeMb > MAX_TOTAL_PER_DB) {
                        
                        fileSizeMb = fileSizeMb.toFixed(2);
                        handler.showMessage(lng.s('', 'storage_manager_hit_limit_db', { MAX_TOTAL_PER_DB : MAX_TOTAL_PER_DB, FILESIZE : fileSizeMb}), true);    
                        return;
                    }
                    
                    var newDBData = KellyTools.parseJSON(fileData.trim());
                    if (newDBData) { 
                    
                        if (!KellyTools.DEBUG && typeof newDBData.profile != 'undefined' && env.profile && newDBData.profile != env.profile) {
                            handler.showMessage(lng.s('', 'storage_create_e4', { PROFILE_MODULE : newDBData.profile, CURRENT_MODULE : env.profile}), true);
                            return;
                        }
                                                
                        newDBData = handler.validateDBItems(newDBData);                            
                        for (var key in newDBData) {            
                            if (handler.favValidKeys['items'].indexOf(key) == -1) {
                                handler.log('[createProfileByInput] data key ' + key + ' skipped. Only ITEMS keys is allowed');
                                delete newDBData[key];
                            }
                        }
                        
                        // database already exist, check mode, skip any keys except 'items'
                        
                        if (db) {
                            
                            if (mode == 'add') {
                                
                                
                                var result = handler.addDataToDb(db, newDBData);            
                                
                                handler.log(result);  // todo show result public - stats - {added: 759, updated: 0, newCategories: 2}                              
                                newDBData = db;
                                
                            } else if (mode == 'overwrite') {
                                
                                // put newDBData as is
                                
                            } else {
                                
                                handler.log('unexpected rewrite mode ' + mode);
                                return;
                            }
                            
                            handler.saveDB(dbName, newDBData, onDBSave);
                            
                        } else { // storage with name not exist, mode is not important
                               
                            handler.saveDB(dbName, newDBData, onDBSave);
                        }
                        
                    } else {
                        handler.showMessage(lng.s('Ошибка парсинга структурированных данных', 'storage_create_e2'), true);    
                    }
                    
                }
                
                // load data from input file
                
                if (source == 'file') {
                    
                    var fileInput = document.getElementById(idPrefix + '-db-file');
                    if (fileInput.value) {
                    
                        KellyTools.readInputFile(fileInput, createProfileByInput);
                    
                    } else {
                        
                        // create empty profile
                        
                        handler.saveDB(dbName, handler.getDefaultData(), onDBSave);
                    }
                
                } else {
                       
                    var collectedData = handler.fav.getCollectedData(source);
                    if (collectedData) {
                        
                        createProfileByInput(false, JSON.stringify(collectedData.storage));
                        
                    } else {
                        
                        handler.showMessage(lng.s('Данные из профиля пользователя не доступны', 'storage_create_e3'), true);    
                    }
                    
                }
                
            });
            
            return false;
        }
        
        return true;
    }
     
    this.showDBManager = function(idPrefix) {
    
        if (!handler.wrap) return;
        if (handler.inUse) return;
        
        handler.wrap.innerHTML = '';
        idPrefix = idPrefix ? idPrefix : handler.className + '-dbmanager';
        
        var sourceHtml = '<tr><td>' + lng.s('Загрузить из файла', 'storage_load_from_file') + '</td><td><input type="file" id="' + idPrefix + '-db-file"></td></tr>';
        var dbDefaultName = '';
        
        var sourceHtml = '';
        for (var i = 0; i < handler.collectSource.length; i++) {
            var sourceData = handler.fav.getCollectedData(handler.collectSource[i]);
            if (sourceData) {
                sourceHtml += '<tr>\
                    <td>\
                        <label>\
                            <input type="radio" id="' + idPrefix + '-data-source-' + handler.collectSource[i] + '" name="' + idPrefix + '-data-source" value="' + handler.collectSource[i] + '" checked> ' + sourceData.title + '\
                        </label>\
                    </td>\
                    <td class="' + handler.className + '-options-table-datasource">' + (sourceData.img ? '<img src="' + sourceData.img + '">' : '' ) + '\
                        <span>' + sourceData.info + '</span>\
                    </td>\
                </tr>';
                
                dbDefaultName = sourceData.storage.dbName ? sourceData.storage.dbName : ''; // currently last one   
                // contentImg - todo save image as preview for profile (use method kellyGrabber.getDataFromUrl)
            }
        }
        
        if (!sourceHtml) sourceHtml = '<tr><td>' + lng.s('Загрузить из файла', 'storage_load_from_file') + '</td><td><input type="file" id="' + idPrefix + '-db-file"></td></tr>';
        else sourceHtml = '<tr><td>\
                            <label>\
                                <input type="radio" id="' + idPrefix + '-data-source-file" name="' + idPrefix + '-data-source" value="file"> ' + lng.s('Загрузить из файла', 'storage_load_from_file') + '\
                            </label>\
                            </td>\
                            <td><input type="file" id="' + idPrefix + '-db-file"></td>\
                        </tr>' + sourceHtml;
        
        //  LocalStorage select is depricated - bringback selector when sync \ other drivers implemented
        
        var html = '\
            <div class="' + handler.className + '-wrap">\
                <table class="' + handler.className + '-options-table">\
                    <!--tr><td>' + lng.s('Тип хранения данных', 'storage_type') + ' :</td><td>\
                        <select class="' + handler.className + '-driver">\
                            <option value="localstorage" ' + (handler.driver == 'localstorage' ? 'selected' : '') + '>Localstorage</option>\
                            <option value="api" ' + (handler.driver == 'api' ? 'selected' : '') + '>Browser API</option>\
                        </select>\
                    </td></tr>\
                    <tr><td colspan="2">' + lng.s('', 'storage_type_notice') + '</td></tr-->\
                    <tr><td colspan="2"><h3>' + lng.s('Добавить новую базу', 'storage_add_new') + '</h3></td></tr>\
                    ' + sourceHtml + '\
                    <tr><td>' + lng.s('Идентификатор базы', 'storage_name') + '</td>\
                        <td><input type="text" id="' + idPrefix + '-create-name" placeholder="custom_data" value="' + dbDefaultName + '"></td></tr>\
                    <tr><td>' + lng.s('', 'storage_conflict_action') + ' :</td><td>\
                        <select id="' + idPrefix + '-conflict-action" name="' + idPrefix + '-conflict-action">\
                            <option value="cancel" selected>' + lng.s('', 'storage_create_cancel_if_exist') + '</option>\
                            <option value="overwrite">' + lng.s('', 'storage_create_overwrite_if_exist') + '</option>\
                            <option value="add">' + lng.s('', 'storage_create_add_if_exist') + '</option>\
                        </select>\
                    </td></tr>\
                    <tr><td colspan="2"><input type="submit" class="' + handler.className + '-create" value="' + lng.s('Создать', 'create') + '"></td></tr>\
                    <tr><td colspan="2" class="' + handler.className + '-hidden"><div class="' + handler.className + '-message"></div></td></tr>\
                    <tr><td colspan="2"><h3>' + lng.s('Управление данными', 'storage_manage') + '</h3></td></tr>\
                    <tr><td colspan="2"><div class="' + handler.className +'-StorageList">' + lng.s('Загрузка', 'loading') + '...' + '</div></td></tr>\
                    <tr><td colspan="2" class="' + handler.className + '-hidden"><div class="' + handler.className + '-message ' + handler.className + '-message-storage"></div></td></tr>\
                    <tr><td colspan="2"><h3>' + lng.s('Удалить базу данных', 'storage_delete') + '</h3></td></tr>\
                    <tr><td>' + lng.s('Идентификатор базы', 'storage_name') + '</td><td><input type="text" id="' + idPrefix + '-delete-name" placeholder="custom_data"></td></tr>\
                    <tr><td colspan="2"><input type="submit" class="' + handler.className + '-delete" value="' + lng.s('Удалить', 'delete') + '"></td></tr>\
                    <tr><td colspan="2" class="' + handler.className + '-hidden"><div class="' + handler.className + '-message ' + handler.className + '-message-delete"></div></td></tr>\
                </table>\
            </div>\
        ';
        
        handler.storageContainer = document.createElement('DIV');
        KellyTools.setHTMLData(handler.storageContainer, html);
        
        /*
        
        nothing to modify currently - localStorage will be unavailable in manifest v3
        
        var driver = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-driver');
            driver.onchange = function() {
            
                var newDriver = KellyTools.val(this.options[this.selectedIndex].value);
            
                if (handler.fav.getGlobal('fav').coptions.storageDriver != newDriver) { 
                
                    handler.fav.getGlobal('fav').coptions.storageDriver = newDriver;
                    handler.driver = newDriver;
                    
                    resetDBCache(false, 'changeDriver');
        
                    handler.fav.save('cfg', function () {
                    
                        handler.getStorageList(handler.showStorageList);
                        handler.fav.load('items', function() {
                            
                            handler.fav.updateFavCounter();
                        });                    
                    });                    
                }
            }
        */
        
        
        var removeButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-delete');
            removeButton.onclick = function() {
                
                if (handler.inUse) return false;
                handler.inUse = true;
                
                var dbName = KellyTools.inputVal(document.getElementById(idPrefix + '-delete-name'));     
                if (!dbName) {
                    handler.showMessage('Введите название базы данных', true, 'delete');
                    return false;
                }
                
                if (handler.slist && handler.slist.indexOf(dbName) == -1) {
                    
                    handler.showMessage('Базы данных не существует', true, 'delete');
                    return false;                    
                }
                
                handler.removeDB(dbName, function(error) {
                    
                    handler.showMessage('Данные удалены', false, 'delete');                    
                    handler.getStorageList(handler.showStorageList);
                });    
                
                return false;
            };
            
        
        var createNewButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-create');
        handler.applayDBCreateButton(createNewButton, idPrefix);
        
        handler.getStorageList(handler.showStorageList);
        handler.storageList = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-StorageList');            
        
        handler.wrap.appendChild(handler.storageContainer);
    }
    
    /* Unused | Not tested */

    this.mergeDB = function(dbsKeys) {
        
        if (handler.mergeProcess) return;
        if (!dbsKeys || dbsKeys.length <= 1) return;
        
        handler.mergeProcess = {
            dbs : {},
            loaded : 0,
            container : false,
            dbsKeys : dbsKeys,
        }
        
        for (var i=0; i < dbsKeys.length; i++) {
            handler.mergeProcess.dbs[dbsKeys[i]] = -1;
            handler.loadDB(name, function(db) { 
                onLoadDb(db, dbsKeys[i]);    
            });
        }
        
        var onLoadDb = function(db, key) {
            
            var mergeData = handler.mergeProcess;
            
            mergeData.loaded++;
            if (mergeData.loaded != mergeData.dbsKeys.length) return;
            
            mergeData.container = mergeData.dbs[mergeData.dbsKeys[0]];
            
            for (var i=1; i < dbsKeys.length; i++) {
                handler.addDataToDb(mergeData.container, mergeData.dbs[dbsKeys[i]]);
            }            
        }
        
    }
   
    this.getCategoryBy = function(db, input, method) {
        
        var index = handler.searchCategoryBy(db, input, method);
        if (index !== false) return db.categories[index];
        
        return {id : -1, name : KellyLoc.s('Удаленная категория', 'removed_cat')};      
    }
    
    this.getCategoryById = function(db, id) {
        
        id = parseInt(id);
                            
        for (var i = 0; i < db.categories.length; i++) {
            if (id == db.categories[i].id) return db.categories[i];
        }  
        
        return {id : -1, name : KellyLoc.s('Удаленная категория', 'removed_cat')};
    }
    
    this.categoryOrder = function(cats, index, up) {
        
        index = parseInt(index);
        
        if (!cats.length) return index;
        
        if (up && index == 0) {
            return index;
        }
        
        if (!up && index == cats.length - 1) {
            return index;
        }
        
        var switchIndex = up ? index - 1 : index + 1;
        var item = cats[index]; 
                
        var switchItem = cats[switchIndex]; 
        var switchOrder = switchItem.order;
        
        switchItem.order = item.order;
        item.order = switchOrder;
        
        cats[index] = switchItem;
        cats[switchIndex] = item;

        return switchIndex;
    }
    
    this.sortCategories = function(cats) {
        
        cats.sort(function(a, b) {
            if (!a.order) {
                a.order = cats.indexOf(a);
            }
            
            if (!b.order) {
                b.order = cats.indexOf(b);
            }
            return b.order - a.order;
        });
        
        for (var i = 0; i < cats.length; i++) {
            cats[i].order = cats.length - i;
        }
    }
    
    // search item by post link
    // item - {link : URL} or {commentLink : URL}
    // 
    
    this.searchItem = function(db, item) {
        
        var link = '';    
        var searchComment = false;
        
        if (item.commentLink) {
            link = KellyTools.getRelativeUrl(item.commentLink);
            searchComment = true;
        } else {
            link = KellyTools.getRelativeUrl(item.link);
        }
        
        if (!link) return false;
        
        for (var b = 0; b < db.items.length; b++) {
        
            if (searchComment && KellyTools.getRelativeUrl(db.items[b].commentLink) == link) {
                return b;
            } else if (!searchComment && KellyTools.getRelativeUrl(db.items[b].link) == link && !db.items[b].commentLink) {
                return b;
            }        
        }
        
        return false;
    }

    this.searchCategoryBy = function(db, input, method) {
        
        if (!method) method = 'name';   
        
        for (var c = 0; c < db.categories.length; c++) {
            if (db.categories[c][method] == input) return c;
        }
        // todo safe in buffer
        return false;
    }
    
    this.categoryAssocToString = function(assoc) {
        
        return KellyTools.varListToStr(assoc, 'string', ', ');
    }
    
    this.categoryAssocFromString = function(assoc) {
             
        return KellyTools.getVarList(assoc, 'string');
    }
    
    this.updateAssocBuffer = function(db) {
        
        var pool = {};
        
        for (var i = 0; i < db.categories.length; i++) {
            if (!db.categories[i].assoc) continue;
            if (typeof db.categories[i].assoc != 'object') {
                pool[db.categories[i].id] = handler.categoryAssocFromString(db.categories[i].assoc);
            }
        }
        
        db.cats_assoc_buffer = pool;
        return pool;
    }
    
    this.addAssocCatsByTag = function(db, tagName) {
        
        if (!db.cats_assoc_buffer) {
            handler.updateAssocBuffer(db); // refreses .cats_assoc_buffer variable - assoc string list buffer [category id] -> [tag text name, tag text name, ...]
        }
        
        var catAssocs = db.cats_assoc_buffer;
        
        for (var i = 0; i < db.categories.length; i++) {
            
            if (!catAssocs[db.categories[i].id] || !catAssocs[db.categories[i].id].length) continue;
            
            if (catAssocs[db.categories[i].id].indexOf(tagName) != -1) { // search tag text name in assoc buffer
                            
                if (db.selected_cats_ids.indexOf(db.categories[i].id) == -1) {
                    db.selected_cats_ids.push(db.categories[i].id);
                } 
            
            }
        }
        
        return false;
    }
    
    /*
        check is category name unique and create category in db, if data valid        
        
        return category id, return false if already exists by name or name is empty
        
        assoc array example can be found in kellyFavItems (see categoryAssocFromString \ categoryAssocToString methods)
    */
    
    this.categoryCreate = function(data, db) {

        if (!data || !data.name || handler.searchCategoryBy(db, data.name, 'name') !== false) return false;
            
        if (!data.order) data.order = db.categories.length + 1;
          
        db.ids++;
        db.categories.push({ 
            name : data.name, 
            id : db.ids, 
            nsfw : data.nsfw ? true : false,
            order : data.order, 
            // assoc : '', - can be undefined
            // color : false, - can be undefined
        });

        if (data.color) db.categories[db.categories.length-1].color = data.color;
        if (typeof data.nameTpl != 'undefined') db.categories[db.categories.length-1].nameTpl = data.nameTpl ? true : false;
            
        return db.ids;
    }
    
    this.copyObjectValues = function(from, to) {
        for (var k in from){
            if (typeof from[k] !== 'function') {
                to[k] = from[k];
            }
        }
    }

    // todo - searchCategoryBy and addition methods could be slow without buffer on big data arrays, create assoc ids buffer
    
    // assoc input data categories by names to db categories, add new catigories to db if not exist
    // return valid to db categoiyId array
    
    function convertCategoriesForDataItem(db, data, item, stats) {
        
        var assocDataCats = [];
        if (!item || !item.categoryId) return assocDataCats;
        
        var dataCats = item.categoryId;
        
        // console.log(data.categories);
         
        for (var c = 0; c < dataCats.length; c++) {
            
            var categoryId = dataCats[c];
            var dataCat = handler.getCategoryById(data, categoryId);
            
            if (dataCat.id == -1) {                
                handler.log('convertCategoriesForDataItem : skip unexist cat in data array - ' + categoryId);
                continue;
            }
            
            if (!dataCat.name) continue;
            
                dataCat.name = KellyTools.val(dataCat.name);
                
            if (!dataCat.name) continue;
             
            var existCatIndex = handler.searchCategoryBy(db, dataCat.name, 'name');            
            if (existCatIndex !== false) {
                
                assocDataCats[assocDataCats.length] = db.categories[existCatIndex].id;
                
            } else {
                
                var newCatIndex = db.categories.length;
                
                db.categories[newCatIndex] = {};
                handler.copyObjectValues(dataCat, db.categories[newCatIndex]);
                
                db.ids++;
                db.categories[newCatIndex].id = db.ids;
                
                assocDataCats[assocDataCats.length] = db.categories[newCatIndex].id;
                
                if (stats) stats.newCategories++;
                
            }
        }
        
        return assocDataCats;
    }
    
    this.addDataToDb = function(db, data) {
        
        var limit = 0; // for tests
        
        if (!limit) {
            limit = data.items.length;
        }
        
        var stats = {
            
            added : 0,
            updated : 0,
            newCategories : 0,
        }
        
        var niCatId = handler.categoryCreate({name :  'New Items'}, db);
        
        for (var i = 0; i < limit; i++) {
            
            var existIndex = handler.searchItem(db, data.items[i]);     
            if (existIndex !== false) {
                
                // merge categories
                
                data.items[i].categoryId = convertCategoriesForDataItem(db, data, data.items[i], stats);
                
                for (var b = 0; b < data.items[i].categoryId.length; b++) {
                    
                    if (db.items[existIndex].categoryId.indexOf(data.items[i].categoryId[b]) == -1) {                        
                        db.items[existIndex].categoryId[db.items[existIndex].categoryId.length] = data.items[i].categoryId[b];
                    }                    
                }
                
                stats.updated++;
                
            } else {
            
                // create new item 
                
                existIndex = db.items.length;
                
                db.items[existIndex] = {};
                handler.copyObjectValues(data.items[i], db.items[existIndex]);            
                
                db.ids++;
                
                db.items[existIndex].id = db.ids;                
                db.items[existIndex].categoryId = convertCategoriesForDataItem(db, data, data.items[i], stats);
                db.items[existIndex].categoryId.push(niCatId);
                
                stats.added++;
            }
            
        }
        
        return stats;
    }
            
    this.getStorageList = function(callback, keepPrefix) {
                
        if (handler.driver == 'localstorage') {
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getLocalStorageList", 
                prefix : handler.prefix,
                keepPrefix : keepPrefix,
            }, function(response) {
                if (callback) callback(response.slist);                
            });
            
        } else {
            
            // todo weak point - cant get names without load all items. need to add cached list
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getApiStorageList", 
                prefix : handler.prefix,
                keepPrefix : keepPrefix,
            }, function(response) {
            
                if (callback) callback(response.slist);
            });
            
        }
    }
    
    function resetDBCache(name, caller) {
        handler.log('Reset cache [DB ' + (name ? name : 'UNSETTED') + '] caller : ' + caller);
        handler.fav.getGlobal('fav').coptions.storageInfo = {};
    }
    
    function getDBCache(name, option) {
                
        var options = handler.fav.getGlobal('fav').coptions;
        
        if (typeof options.storageInfo == 'undefined') return false;
        if (name === false) {
            var dbNames =  Object.keys(options.storageInfo);
            if (dbNames.length) {
                return dbNames;
            } else return false;
            
        } else if (typeof options.storageInfo[name] == 'undefined' ||
            name == options.storage) {
            
            return false;
        } 
        
        var dbCache = options.storageInfo;
        if (dbCache[name]) return (typeof dbCache[name][option] == 'undefined' ? false : dbCache[name][option]);
        
        return false;         
    }
    
    /* 
        todo - use for cache database names list \ calculated size of every db to reduse JSON.stringify method and use of BG API

        partly tested, currently unused
    */
    
    function setDBCache(name, option, value) {
        
        return; 
        
        var options = handler.fav.getGlobal('fav').coptions;
        
        if (typeof options.storageInfo == 'undefined') options.storageInfo = {};
        if (typeof options.storageInfo[name] == 'undefined') options.storageInfo[name] = {};
            
        options.storageInfo[name][option] = value;
    }
    
    // get database size in kb
    
    this.getDBSize = function(name, callback) {
        
        var origName = name;
        var cache = getDBCache(origName, 'size');

        name = handler.validateDBName(name);
        
        if (!name) {
            if (callback) callback(name, 0);
            return;
        }

        if (cache !== false)  {
            if (callback) callback(name, cache);
            return;
        }
        
        var dbName = handler.getFullDBName(name, cfg);
        
        /* depricated */
        
        if (handler.driver == 'localstorage') {
        
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getLocalStorageItem", 
                dbName : dbName,
            }, function(response) {
            
                if (!response.item) bytes = 0;
                
                bytes = response.item.length / 1000;
                
                setDBCache(origName, 'size', bytes);                
                if (callback) callback(name, bytes);
            });
            
        } else {
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getApiStorageItemBytesInUse", 
                dbName : dbName,
            }, function(response) {
            
                if (!response.bytes) response.bytes = 0;
                
                response.bytes = response.bytes / 1000;
            
                setDBCache(origName, 'size', response.bytes);
                if (callback) callback(name, response.bytes);
            });
        }
    }

    this.log = function(text) {
        KellyTools.log(text, 'KellyStorageManager');
    }

    this.getDefaultData = function() {
        
        var env = handler.fav.getGlobal('env');
        
        return {
            ids : 100,
            categories : [
                {id : 1, name : 'GIF', protect : true, order : -1},
                {id : 2, name : 'NSFW', nsfw : true, protect : true, order : -1},
            ],
            items : [],
            profile : env && env.profile ? env.profile : 'default',
            // dinamic data that can be addeded after load - cats_assoc_buffer, selected_cats_ids
        }
    }

      
    // selectAutoCategories(db) - db - selected database - by default current profile db
    // 
    // sets auto categories by media tags and file names
    // currently auto detects few formats, and associates categories of db (complites selected_cats_ids var) by tag names array list

    this.selectAutoCategories = function(db, tagList, sImages) {
        
        if (!db) return;
        
        // autoselect format cats
        var formats = ['jpg', 'jpeg', 'png', 'gif', 'webp']; 
        
        for (var i = 0; i < formats.length; i++) {
            var gifCategory = handler.getCategoryBy(db, formats[i].toUpperCase(), 'name');
            var containGif = false;
            
            if (gifCategory.id !== -1) {  
            
                for (var b = 0; b < sImages.length; b++) {     
                    if (sImages[b].toLowerCase().indexOf('.' + formats[i].toLowerCase()) != -1) {
                        containGif = true;
                        break;
                    }
                }
                
                var selectedGifCat = db.selected_cats_ids.indexOf(gifCategory.id);
                            
                if (containGif && selectedGifCat == -1) {
                    db.selected_cats_ids.push(gifCategory.id);
                } else if (!containGif && selectedGifCat != -1) {                
                    db.selected_cats_ids.splice(selectedGifCat, 1);
                }           
            }
        }
      
        if (tagList) {
            // remove current assoc categories
            for (var i = 0; i < db.categories.length; i++) {
                if (!db.categories[i].assoc) continue;
                
                var selectedIndex = db.selected_cats_ids.indexOf(db.categories[i].id);
                if (selectedIndex != -1) {
                    db.selected_cats_ids.splice(selectedIndex, 1);
                }
            }
            
            // select actual assoc categories for tagList
            for (var i = 0; i < tagList.length; i++) {
                handler.addAssocCatsByTag(db, tagList[i]);
            }
            
            // log(fav.cats_assoc_buffer);
        }
    }
    
    this.validateCategories = function(catList, db) {
           
        var tmpSelectedCategories = [];        
        if (!db || !catList || !catList.length) return tmpSelectedCategories;
        
        for (var i = 0; i < catList.length; i++) {
        
            if (handler.getCategoryById(db, catList[i]).id == -1) {
                handler.log('validateCategories : skip deprecated category ' + catList[i]);
                continue;
            } 
            
            tmpSelectedCategories.push(catList[i]);
        }
        
        return tmpSelectedCategories;
    }
    
    /* 
        creates or update exist db item
        
        will update exist item on dublicate postLink + commentLink or if itemIndex specifed
        
        notSearch - skip uniq check item (improve speed, used for batch operations)
        
        input :
        { itemIndex : false || int, images : [], cats : [], info : {text, name, dimensions : {width , height}}, post || postLink (uniq), comment || commentLink (uniq), relatedDoc, referrer, vd (isVideo - bool) }
        
        return :
        { error : false || string, itemIndex : int || undefined on error, id : int || undefined on error, exist : bool || undefined on error }
    */
    
    this.createDbItem = function(data, db, update, notSearch) {
        
        if (typeof update == 'undefined') update = true;
        
        var keys = ['text', 'name', 'categoryId', 'commentLink', 'link', 'pImage', 'pw', 'ph'];
        var existItem = typeof data.itemIndex == 'number' && db.items[data.itemIndex] ? db.items[data.itemIndex] : false;
        var itemIndex = existItem ? data.itemIndex : false;        
        var postItem = existItem ? existItem : {}, env = handler.fav.getGlobal('env');  
        
        if (typeof data.itemIndex == 'number' && !existItem) {
            return {error : 'post_index_not_found', errorText : 'fail to get exist item by itemIndex'};
        }
        
        if (data.referrer) postItem.referrer = data.referrer;    
        if (data.relatedDoc) postItem.relatedDoc = data.relatedDoc; // could be not unique
        if (typeof data.vd != 'undefined') postItem.vd = data.vd ? true : false;
        
        if (data.info && data.info.text) postItem.text = KellyTools.val(data.info.text);
        
        if (data.info && data.info.name) {
            
            postItem.pImage = '';
            postItem.name = KellyTools.val(data.info.name);
            if (!postItem.name) return {error : 'post_name_empty', errorText : 'fail to parse input name for item'};
            
        } else if (data.images) {
        
            postItem.pImage = data.images.length == 1 ? data.images[0] : data.images;
               
            if (data.info && data.info['dimensions'] && data.info['dimensions'].width) {                
                postItem.pw = KellyTools.val(data.info['dimensions'].width, 'int');
                postItem.ph = KellyTools.val(data.info['dimensions'].height, 'int');  // todo remove .ps meta
            }
        } 
        
        postItem.categoryId = [];
        
        if (data.cats && data.cats.length) {            
            for (var i = 0; i < data.cats.length; i++) postItem.categoryId.push(data.cats[i]);
            postItem.categoryId = handler.validateCategories(postItem.categoryId, db);     
        }
        
        if (!existItem) { // read-only for exist items, pair link + comment link uniq and used for compare and prevent dublicates
            if (data.comment || data.commentLink) {                
                postItem.commentLink = data.comment ? env.getCommentLink(data.comment) : data.commentLink;                
                if (!postItem.commentLink) {
                    return {error : 'post_link_empty', errorText : lng.s('Ошибка определения ссылки на комментарий', 'item_add_err1')};
                }
            }
            
            if (!postItem.link) {
                postItem.link = data.post ? env.getPostLink(data.post) : data.postLink;            
                if (!postItem.link) {
                    return {error : 'post_link_empty', errorText : lng.s('Публикация не имеет ссылки', 'item_bad_url')};
                }  
            } 
        }

        for (var key in postItem) if (typeof postItem[key] == 'function' || keys.indexOf(key) == -1) delete data[key];
        
        if (itemIndex === false && !notSearch) itemIndex = handler.searchItem(db, postItem);
        
        if (itemIndex !== false) {
            
            if (!update) {
                return {error : 'post_already_exist', errorText : 'update dissabled, skip already existed element with index ' + itemIndex};
            }
            
            db.items[itemIndex] = postItem;
            existItem = true;
        } else {   
        
            db.ids++;
            
            postItem.id = db.ids; 
            itemIndex = db.items.length; 
            db.items[itemIndex] = postItem;
            existItem = false;
        }
        
        return {error : false, postItem : postItem, itemIndex : itemIndex, id : postItem.id, exist : existItem};
    }

    this.validateCfg = function(data) {
        
        var env = handler.fav.getGlobal('env');
        
        for (var key in data) {            
            if (typeof data[key] == 'function') {
                handler.log('data key ' + key + ' function is not allowed');
                delete data[key];
            } else if (handler.favValidKeys['cfg'].indexOf(key) == -1) {
                handler.log('data key ' + key + ' is not allowed');
                delete data[key];
            }
        }
        
        if (!data.selected_cats_ids || typeof data.selected_cats_ids != 'object' || !(data.coptions instanceof Array)) {
            data.selected_cats_ids = [];
        }
        
        // defaults 
            
        if (!data.coptions || typeof data.coptions != 'object' || !(data.coptions instanceof Object)) {            
            
            data.coptions = {                
                syncByAdd : true,
                newFirst : true,
                hideSoc : true,
                hideAddToFav : false,
                optionsSide : false,
                addToFavSide : false,                
                addToFavNoConfirm : false,
                webRequest : true,
                // darkTheme : true,
                // storageDesc - associations of .storage keys with pretty names | todo - make changable from options [Profiles] tab
            };
        }
        
        if (!data.coptions.baseFolder) {
            data.coptions.baseFolder = env.profile + '/' + 'Storage';
        }
        
        if (!data.coptions.grabber) {
            
            data.coptions.grabber = {
                nameTemplate : '#number#_#filename#', // '#category_1#/#number#_#filename#'
                baseFolder : env.profile + '/' + 'Downloads',
                invertNumeration : true,
                quality : 'hd',
                skipDownloaded : false,
            };
        }
        
        if (!data.coptions.grid)  {
            
            data.coptions.grid = {
                fixed : 3,
                type : 'fixed', // [dynamic | fixed], if dynamic, fixed var will be ignored
                rowHeight : 250,
                heightDiff : 10,
                min : 2, 
                cssItem : '',
                perPage : 60,                
                viewerShowAs : 'hd',
                autoScroll : 1,
                lazy : true,
            };
        }  
                    
        if (!data.coptions.fastsave) {
            
            data.coptions.fastsave = {
                baseFolder : env.profile + '/' + 'Fast',
                baseFolderConfigurable : env.profile + '/' + 'Fast',
                qualityConfigurable : 'hd',
                // nameTemplate : '#category_1#/#id#_#category_1#_#category_2#_#category_3#',
                enabled : true,
                check : false,
                conflict : 'overwrite',
                configurableEnabled : false,
            };
        }
        
        if (!data.coptions.downloader) {
            
            data.coptions.downloader = {
                //perPage : 200,
                skipEmpty : true,
                autosaveEnabled : false,
                tagList : '', // white list \ black list of categories
                catByTagList : '', // autocreate category by list of names
            }
        } 
        
        if (!data.coptions.storage) {
            data.coptions.storage = 'default';
        }
        
        // todo - data.coptions.storageDesc - addition information that describe storage item - name \ image (base64), currently only name used
        
        if (typeof data.coptions.webRequest == 'undefined') data.coptions.webRequest = true;
        
        if (!data.coptions.grabberDriver) {
            
            if (env.getRecomendedDownloadSettings) {
                data.coptions.grabberDriver = env.getRecomendedDownloadSettings();
            } else {
                data.coptions.grabberDriver = KellyGrabber.validateDriver(false);
            }                
        }        
                
        if (!data.coptions.storageDriver) {
            data.coptions.storageDriver = handler.configDriver;
        }
        
        if (!data.coptions.toolbar) {
            data.coptions.toolbar = {
                enabled : true,
                collapsed : false,
                heartHidden : false,
                tiny : false,
            }
        }
        
        data.coptions.webRequest = data.coptions.webRequest ? true : false;
        data.coptions.debug = data.coptions.debug ? true : false;
        data.coptions.newFirst = data.coptions.newFirst ? true : false;       
        data.coptions.hideSoc = data.coptions.hideSoc ? true : false;  
        data.coptions.hideAddToFav = data.coptions.hideAddToFav ? true : false;                 
        data.coptions.syncByAdd = data.coptions.syncByAdd ? true : false;   
        
        // data.coptions.mobileOptimization = false; // enables automaticly by screen width
        
        if (env.events.onValidateCfg) env.events.onValidateCfg(data);
        
        return data;
    }
    
    // validate whole result array with Cfg \ Item keys allowed
    this.validateDBItems = function(data) {
        
        for (var key in data) {            
            if (typeof data[key] == 'function') {
                handler.log('data key ' + key + ' function is not allowed');
                delete data[key];
            } else if (handler.favValidKeys['cfg'].indexOf(key) == -1 && handler.favValidKeys['items'].indexOf(key) == -1) {
                handler.log('data key ' + key + ' is not allowed');
                delete data[key];
            }
        }
        
        if (!data.categories) data.categories = [];
        if (!data.items) data.items = [];
        if (!data.ids) data.ids = 100;
        
        // data.profile - allowed undefined
        
        for (var i = 0; i < data.items.length; i++) {
            
            if (!data.items[i].categoryId) data.items[i].categoryId = [];
            if (!data.items[i].id) {
                
                data.ids++;
                data.items[i].id = data.ids;
            }
            
            for (var b = 0; b < data.items[i].categoryId.length; b++) {
                data.items[i].categoryId[b] = parseInt(data.items[i].categoryId[b]);
            }
        }       
        
        return data;
    }
    
    this.validateDBName = function(name) {
        if (!name || typeof name != 'string') return '';
        
        name = name.trim();
        
        if (!name) return '';
                
        return name.replace(/[^A-Za-z0-9_]/g, '');
    }

    
    this.getFullDBName = function(name, cfg) {
        
        return (cfg ? handler.prefixCfg : handler.prefix) + name;
        //return (cfg ? handler.prefixCfg : handler.prefix) + handler.fav.getGlobal('env').profile + '_' + name;
    }

    // callback(db)
    
    this.loadDB = function(name, callback, cfg, driver) {
        
        name = handler.validateDBName(name);        
        if (!name) {
            if (callback) callback(false);
            return;
        }
        
        var dbName = handler.getFullDBName(name, cfg);
       
        if (typeof driver == 'undefined') {
            driver = cfg ? handler.configDriver : handler.driver;
        }
        
        handler.log('load ' + (cfg ? 'CFG' : 'ITEMS') + ' from ' + name + ' driver - ' + driver);
        
        if (driver == 'localstorage') {
            
            /* depricated */            
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getLocalStorageItem", 
                dbName : dbName,
            }, function(response) {
                
                var db = false;
                
                if (response.item) {
                    
                    db = KellyTools.parseJSON(response.item);
                                        
                    if (!db) {
                        handler.log('db exist but structured data parsing fail ' + name);
                        db = false;
                    }
                    
                } else {
                    handler.log('unexist db key ' + name);                  
                }
                
                if (callback) callback(db);
            });
            
            
        } else {
        
            KellyTools.getBrowser().runtime.sendMessage({
                method: "getApiStorageItem", 
                dbName : dbName,
            }, function(response) {

                if (!response.item || response.item === null || !response.item[dbName]) {
                    handler.log('unexist db key ' + name);
                    if (cfg) {
                        handler.log('attempt to restore config from localstorage');
                        handler.loadDB(name, callback, true, 'localstorage');
                        return;
                    }
                    
                    response.item = false;
                } else {
                    response.item = response.item[dbName];
                }
                //     handler.copyObjectValues(response.item[dbName], db);
                                
                if (callback) callback(response.item);
                
            });
            
        }
    }
    
    // callback(error)

    this.removeDB = function(name, callback, cfg, driver) {
       
        if (!cfg) resetDBCache(name, 'removeDB');
            
        name = handler.validateDBName(name);
 
        if (!name) {
            if (callback) callback('empty or bad DB name');
            return;
        }
        
        var dbName = handler.getFullDBName(name, cfg);
       
        if (typeof driver == 'undefined') {
            driver = cfg ? handler.configDriver : handler.driver;
        }
        
        if (driver == 'localstorage') {
            
            /* depricated */
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "removeLocalStorageItem", 
                dbName : dbName,
            }, function(response) {
                
                if (callback) callback(false);
            });
                
        } else {
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "removeApiStorageItem", 
                dbName : dbName,
            }, function(response) {
                
                if (callback) callback(response.error);
            });            
        }
    } 
    
    // callback(error)
    // todo если понадобится, то хранить мета информацию (дата последнего изменения \ кол-во элементов и тд) в localstorage, реализовать методы .metaSet \ .metaGet
    // name, data, callback, cfg - является ли data конфигом - конфиг в отличии от данных сохраняется в локальное хранилище всегда
    
    this.saveDB = function(name, data, callback, cfg, driver) {
        
        if (!cfg) resetDBCache(name, 'saveDB');
               
        name = handler.validateDBName(name);
        
        if (!name) {
            if (callback) callback('empty or bad DB name');
            return;
        }
        
        var dbName = handler.getFullDBName(name, cfg);
     
        if (typeof driver == 'undefined') {
            driver = cfg ? handler.configDriver : handler.driver;
        }
        
        if (driver == 'localstorage') {
        
            /* depricated */
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "setLocalStorageItem", 
                dbName : dbName,
                data : data,
                dbOrigName : name,
                isCfg : cfg,
            }, function(response) {
            
                if (response.error) {
                    handler.log(response.error);
                }
                
                if (callback) callback(response.error ? true : false);
            });
            
        } else {
            
            // при больших объемах данных данные сохраняются корректно (тесты при 40-100мб данных, фрагментация 1-5 мегабайт на одно хранилище)
            
            var save = {};
                save[dbName] = data;
            
            KellyTools.getBrowser().runtime.sendMessage({
                method: "setApiStorageItem", 
                dbName : dbName,
                data : save,
                dbOrigName : name,
                isCfg : cfg,
            }, function(response) {
                
                if (callback) callback(response.error);
            });
        }       
    }
    
    constructor(cfg);
}
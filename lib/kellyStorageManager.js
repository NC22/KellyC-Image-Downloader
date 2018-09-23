function KellyFavStorageManager(cfg) {
	
	var handler = this;
	
    // prefixes modified by environment on init, relative to current profile name
    // todo add list all storages for extension
    
	this.prefix = 'kelly_db_';
	this.prefixCfg = 'kelly_cfg_';
	
	this.api = KellyTools.getBrowser();
	
	this.wrap = false;
	
	this.className = 'KellyFavStorageManager';
	this.mergeProcess = false;
	
	this.driver = 'localstorage'; // config always loads from localstorage
	
	this.storageContainer = false; 
	this.storageList = false;
	
	this.inUse = false;
    
	this.fav = false; // kellyFavHelper
    
    var lng = KellyLoc; // singleton
    
    this.format = 'json';
		
	this.slist = false;
	
	function constructor(cfg) {	}
			
	this.showMessage = function(text, error, section) {
	
		var	message = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-message' + (section ? '-' + section : ''));
			
		if (!message) return;
		
		message.className = message.className.replace(handler.className + '-error', '').trim();
		
		if (error) message.className += ' ' + handler.className + '-error';
		message.innerHTML = text;
		
		handler.inUse = false;
	}
	
	this.showStorageList = function(slist) {	
	
		if (!handler.storageList) return;
		
		handler.slist = slist;
		
		handler.storageList.innerHTML = '<div class="' + handler.className + '-DBItems-total">' + lng.s('Общий размер данных', 'storage_manager_total') + ' : <span>' + (!slist.length ? '0' +  lng.s('кб', 'kb') :  lng.s('Загрузка', 'loading') + '...') + '</span></div>' ;
		var totalKb = 0;
		var itemsLoaded = 0;
		
		for (var i=0; i < slist.length; i++) {
		
			var dbItem = document.createElement('DIV');
				dbItem.className = handler.className + '-DBItem';
				
				if (handler.fav.getGlobal('fav').coptions.storage == slist[i]) {
					dbItem.className += ' active';
				}
			
			var dbName = slist[i];
			
				dbItem.innerHTML  = '<span class="' + handler.className + '-DBItem-name">' + slist[i] + '</span>';
				dbItem.innerHTML += '<span class="' + handler.className + '-DBItem-size ' + handler.className + '-' + dbName + '" ></span>';
				if (handler.fav.isDownloadSupported) {
                    dbItem.innerHTML += '<a class="' + handler.className + '-DBItem-download' + '" href="#">' + lng.s('Скачать', 'download') + '</a>';
                }
				dbItem.innerHTML += '<a class="' + handler.className + '-DBItem-select' + '" href="#">' + lng.s('Выбрать', 'select') + '</a>';
				
			handler.storageList.appendChild(dbItem);			
			
			handler.getDBSize(dbName, false, function(dbName, size) {
				KellyTools.getElementByClass(handler.storageList, handler.className + '-' + dbName).innerHTML = parseFloat(size).toFixed(2) + 'кб';
				
				totalKb += size;
				itemsLoaded++;
				if (itemsLoaded == slist.length) {
					var totalEl = KellyTools.getElementByClass(handler.storageList, handler.className + '-DBItems-total');
					KellyTools.getElementByTag(totalEl, 'span').innerHTML = parseFloat(totalKb).toFixed(2) + lng.s('кб', 'kb');
				}
			});
			
			var selectButton = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-select');
				selectButton.setAttribute('data-dbname', slist[i]);
				selectButton.onclick = function() {
				
					if (!this.getAttribute('data-dbname')) return false;
					
					handler.fav.getGlobal('fav').coptions.storage = this.getAttribute('data-dbname');
					handler.fav.save('cfg', function(error) {
					
						handler.getStorageList(handler.showStorageList);
						handler.fav.load('items', function() {					
								
							handler.fav.updateFavCounter();
                            handler.fav.resetFilterSettings();
							handler.showMessage(lng.s('База данных выбрана', 'storage_selected'), false, 'storage');
						});					
					});
	
					return false;
				}
			if (handler.fav.isDownloadSupported) {	
                var downloadButton = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-download');
                    downloadButton.setAttribute('data-dbname', slist[i]);
                    downloadButton.onclick = function() {
                        var dbName = this.getAttribute('data-dbname');
                        
                        handler.loadDB(dbName, function(db) {
                        
                            if (db === false) {
                                return false;							
                            }
                            
                            var path = handler.fav.getGlobal('env').profile + '/Storage/ExportedDBs/' + dbName + '_' + KellyTools.getTimeStamp() + '.' + handler.format;
                                path = KellyTools.validateFolderPath(path);
                                
                            KellyTools.createAndDownloadFile(JSON.stringify(db), path);	
                        });
                        
                        return false;
                    }
            }    
		}
	
	}
		
	this.showDBManager = function() {
	
		if (!handler.wrap) return;
		if (handler.inUse) return;
		
		handler.wrap.innerHTML = '';
		
		/*
		if (handler.driver == 'localstorage' && !handler.fav.isMainDomain()) {
			
			handler.wrap.innerHTML = '<div>\
				<p>Тип хранения данных ' + handler.driver + ' не поддерживает управление данными с дочерних доменов</p>\
				<p>Перейдите на <a href="http://' + handler.fav.getGlobal('env').mainDomain + '/">основной домен</a> для переключения текущего хранилищя или управления данными\
			</div>';
			
			return;
		}
		*/
		
		var overwriteId = handler.className + '-overwrite';
		var html = '\
			<div class="' + handler.className + '-wrap">\
				<table class="' + handler.className + '-options-table">\
					<tr><td>' + lng.s('Тип хранения данных', 'storage_type') + ' :</td><td>\
						<select class="' + handler.className + '-driver">\
							<option value="localstorage" ' + (handler.driver == 'localstorage' ? 'selected' : '') + '>Localstorage</option>\
							<option value="api" ' + (handler.driver == 'api' ? 'selected' : '') + '>Browser API (testing)</option>\
						</select>\
					</td></tr>\
					<tr><td colspan="2">' + lng.s('', 'storage_type_notice') + '</td></tr>\
					<tr><td colspan="2"><h3>' + lng.s('Добавить новую базу', 'storage_add_new') + '</h3></td></tr>\
					<tr><td>' + lng.s('Загрузить из файла', 'storage_load_from_file') + '</td><td><input type="file" id="' + handler.className + '-db-file"></td></tr>\
					<tr><td>' + lng.s('Идентификатор базы', 'storage_name') + '</td><td><input type="text" id="' + handler.className + '-create-name" placeholder="custom_data"></td></tr>\
					<tr style="display : none;"><td><label for="' + overwriteId + '-cancel">' + lng.s('Отмена если существует', 'storage_create_cancel_if_exist') + '</label></td>\
						<td><input type="radio" name="' + overwriteId + '" id="' + overwriteId + '-cancel" value="cancel" checked></td></tr>\
					<tr style="display : none;"><td><label for="' + overwriteId + '-overwrite">Перезаписать если существует</label></td>\
						<td><input type="radio" name="' + overwriteId + '" id="' + overwriteId + '-overwrite" value="overwrite" ></td></tr>\
					<tr style="display : none;"><td><label for="' + overwriteId + '-add">Дополнить если существует</label></td>\
						<td><input type="radio" name="' + overwriteId + '" id="' + overwriteId + '-add" value="add"></td></tr>\
					<tr><td colspan="2"><input type="submit" class="' + handler.className + '-create" value="' + lng.s('Создать', 'create') + '"></td></tr>\
					<tr><td colspan="2"><div class="' + handler.className + '-message"></div></td></tr>\
					<tr><td colspan="2"><h3>' + lng.s('Управление данными', 'storage_manage') + '</h3></td></tr>\
					<tr><td colspan="2"><div class="' + handler.className +'-StorageList"></div></td></tr>\
					<tr><td colspan="2"><div class="' + handler.className + '-message ' + handler.className + '-message-storage"></div></td></tr>\
					<tr><td colspan="2"><h3>' + lng.s('Удалить базу данных', 'storage_delete') + '</h3></td></tr>\
					<tr><td>' + lng.s('Идентификатор базы', 'storage_name') + '</td><td><input type="text" id="' + handler.className + '-delete-name" placeholder="custom_data"></td></tr>\
					<tr><td colspan="2"><input type="submit" class="' + handler.className + '-delete" value="' + lng.s('Удалить', 'delete') + '"></td></tr>\
					<tr><td colspan="2"><div class="' + handler.className + '-message ' + handler.className + '-message-delete"></div></td></tr>\
				</table>\
			</div>\
		';
		
		handler.storageContainer = document.createElement('DIV');
		handler.storageContainer.innerHTML = html;
		
		var driver = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-driver');
			driver.onchange = function() {
			
				var newDriver = KellyTools.val(this.options[this.selectedIndex].value);
			
				if (handler.fav.getGlobal('fav').coptions.storageDriver != newDriver) { 
                
					handler.fav.getGlobal('fav').coptions.storageDriver = newDriver;
					handler.driver = newDriver;
                    
					handler.fav.save('cfg', function () {
					
						handler.getStorageList(handler.showStorageList);
						handler.fav.load('items', function() {
							
							handler.fav.updateFavCounter();
						});					
					});					
				}
			}
		
			
		
		handler.storageList = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-StorageList');			
		
		
		var removeButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-delete');
			removeButton.onclick = function() {
				
				if (handler.inUse) return false;
				handler.inUse = true;
				
				var dbName = KellyTools.inputVal(document.getElementById(handler.className + '-delete-name')); 	
				if (!dbName) {
					handler.showMessage('Введите название базы данных', true, 'delete');
					return false;
				}
				
				if (handler.slist && handler.slist.indexOf(dbName) == -1) {
					
					handler.showMessage('Базы данных не существует', true, 'delete');
					return false;					
				}
				
				handler.removeDB(dbName, function(error) {
					
					handler.showMessage('Данные удалены', true, 'delete');					
					handler.getStorageList(handler.showStorageList);
				});	
				
				return false;
			};
			
		var createNewButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-create');
			createNewButton.onclick = function() {
				
				if (handler.inUse) return false;
				handler.inUse = true;
				
				var dbName = KellyTools.inputVal(document.getElementById(handler.className + '-create-name')); // todo validate by regular	
				if (!dbName) {
					handler.showMessage(lng.s('Введите название базы данных', 'storage_empty_name'), true);
					return false;
				}
				
				var overwrite = document.getElementById(overwriteId + '-overwrite').checked ? true : false;
				var add = document.getElementById(overwriteId + '-add').checked ? true : false;
				var cancel = document.getElementById(overwriteId + '-cancel').checked ? true : false;
				
				if (cancel && handler.slist === false) {

					handler.showMessage(lng.s('Дождитесь загрузки списка баз данных', 'storage_beasy'), true);
					return false;
				}
				
                // check cached data before ask dispetcher
				if (cancel && handler.slist.indexOf(dbName) != -1) {
					
					handler.showMessage(lng.s('База данных уже существует', 'storage_create_already_exist'), true);
					return false;					
				}
				
                // request if any bd already exist
				handler.loadDB(dbName, function(db) {
					
					if (db !== false) {
						handler.showMessage(lng.s('База данных уже существует', 'storage_create_already_exist'), true);
						return false;							
					}
					
					var onDBSave =  function(error) {
					
						if (!error) {
							
							handler.getStorageList(handler.showStorageList);							
							handler.showMessage(lng.s('База данных добавлена', 'storage_create_ok'));
							
						} else {
						
							handler.showMessage(lng.s('Ошибка добавления базы данных', 'storage_create_e1'), true);
						}
						
					};
							
					// load data from input file
					
					var fileInput = document.getElementById(handler.className + '-db-file');
					if (fileInput.value) {
					
						KellyTools.readFile(fileInput, function(input, fileData) {
														
							var db = KellyTools.parseJSON(fileData.trim());
							if (db) {
								db = handler.validateDBItems(db);	
								handler.saveDB(dbName, db, onDBSave);
							} else {
								handler.showMessage(lng.s('Ошибка парсинга структурированных данных', 'storage_create_e2'), true);	
							}
							
						});
					
					} else {
						
						handler.saveDB(dbName, handler.getDefaultData(), onDBSave);
					}
					
				});
				
				return false;
			}
		
		handler.getStorageList(handler.showStorageList);
		
		handler.wrap.appendChild(handler.storageContainer);
	}

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

	this.addCategoriesToDb = function(item, newItem) {

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
        
        console.log(switchIndex);
        
        
        console.log(switchIndex);
                
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
		var isComment = false;
		
		if (item.commentLink) {
			link = KellyTools.getRelativeUrl(item.commentLink);
			isComment = true;
		} else {
			link = KellyTools.getRelativeUrl(item.link);
		}
		
		if (!link) return false;
		
		for (var b = 0; b < db.items.length; b++) {
		
			if (isComment && KellyTools.getRelativeUrl(db.items[b].commentLink).indexOf(link) != -1) {
				return b;
			} else if (!isComment && KellyTools.getRelativeUrl(db.items[b].link).indexOf(link) != -1) {
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
    
    this.categoryCreate = function(db, name, catIsNSFW, order) {
        
        if (!name) return false;
        
        for (var i = 0; i < db.categories.length; i++) {
            if (db.categories[i].name == name) {
               return false;
            }
        }
        
        if (!order) {
            order = db.categories.length;
        }
          
        db.ids++;
        
        var key = db.categories.length;
        
        db.categories[key] = { 
            name : name, 
            id : db.ids, 
            nsfw : catIsNSFW,
            order : order,
        }; 
        

        return db.ids;
    }
    
	this.copyObjectValues = function(from, to) {
		for (var k in from){
			if (typeof from[k] !== 'function') {
				to[k] = from[k];
			}
		}
	}

    /* IN DEV, not tested */
    
	this.addDataToDb = function(db, data) {

		for (var i = 0; i < data.items.length; i++) {
			
			var existIndex = handler.searchItem(db, data.items[i]);
			// todo update categories \ add new item with new id
			
			if (existIndex !== false) {
			
				// db.items[existIndex].categoryId = db.items[existIndex].categoryId.concat(data.items[i].categoryId);
			
			} else {
			
				existIndex = db.items.length;
				
				db.items[existIndex] = {};
				copyObjectValues(data.items[i], db.items[existIndex]);			
				
				db.ids++;
				db.items[existIndex].id = db.ids;
				
				var dataCats = data.items[i].categoryId;
				var actualItemCats = [];
				
				for (var c = 0; c < dataCats.length; c++) {
				
					var dataCat = data.categories[dataCats[c]];
					var existCatIndex = handler.searchCategoryBy(db, dataCat.name, 'name');
					
					if (existCatIndex !== false) {
						actualItemCats[actualItemCats.length] = db.categories[existCatIndex].id;
					} else {
						existCatIndex = db.categories.length;
						db.categories[existCatIndex] = {};
						copyObjectValues(dataCat, db.categories[existCatIndex]);
						
						db.ids++;
						db.categories[existCatIndex].id = db.ids;
						
						actualItemCats[actualItemCats.length] = db.categories[existCatIndex].id;
					}
				}
			}
			
		}
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
				
			KellyTools.getBrowser().runtime.sendMessage({
				method: "getApiStorageList", 
				prefix : handler.prefix,
				keepPrefix : keepPrefix,
			}, function(response) {
			
				if (callback) callback(response.slist);
			});
			
		}
	}
		
	this.getDBSize = function(name, inBytes, callback) {
	
		name = handler.validateDBName(name);
		
		if (!name) {
			if (callback) callback(name, 0);
			return;
		}
		
		var dbName = handler.getFullDBName(name, cfg);
		
		if (handler.driver == 'localstorage') {
		
			KellyTools.getBrowser().runtime.sendMessage({
				method: "getLocalStorageItem", 
				dbName : dbName,
			}, function(response) {
			
				if (!response.item) bytes = 0;
				
				if (inBytes) {
					bytes = response.item.length;
				} else {
					bytes = response.item.length / 1000;
				}	
				
				if (callback) callback(name, bytes);
			});
			
		} else {
			
			KellyTools.getBrowser().runtime.sendMessage({
				method: "getApiStorageItemBytesInUse", 
				dbName : dbName,
			}, function(response) {
			
				if (!response.bytes) response.bytes = 0;
				
				if (!inBytes) {
					response.bytes = response.bytes / 1000;
				}
			
				if (callback) callback(name, response.bytes);
			});
		}
	}

	this.log = function(text) {
		if (handler.fav && handler.fav.getGlobal('debug')) {
			KellyTools.log(text, 'KellyStorageManager');
		}
	}

	this.getDefaultData = function() {

		return {
			ids : 100,
			categories : [
				{id : 1, name : 'GIF', protect : true, order : -1},
				{id : 2, name : 'NSFW', nsfw : true, protect : true, order : -1},
			],
			items : [],
			// native_tags : [],
		}
	}

	// todo check links .items.pImage and .link and .commentLink
	this.validateDBItems = function(data) {
		
        var validKeys = ['categories', 'items', 'ids', 'selected_cats_ids', 'meta', 'coptions'];
        
        for (var key in data) {            
            if (typeof data[key] == 'function') {
                handler.log('data key ' + key + ' function is not allowed');
                delete data[key];
            } else if (validKeys.indexOf(key) == -1) {
                handler.log('data key ' + key + ' is not allowed');
                delete data[key];
            }
        }
        
		if (!data.categories) data.categories = [];
		if (!data.items) data.items = [];
		if (!data.ids) data.ids = 100;
		
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
	
	this.loadDB = function(name, callback, cfg) {
		
		name = handler.validateDBName(name);		
		if (!name) {
			if (callback) callback(false);
			return;
		}
		
		var dbName = handler.getFullDBName(name, cfg);
		
		if (handler.driver == 'localstorage' || cfg) {
		
			KellyTools.getBrowser().runtime.sendMessage({
				method: "getLocalStorageItem", 
				dbName : dbName,
			}, function(response) {
				
				var db = false;
				
				if (response.item) {
					db = KellyTools.parseJSON(response.item);
				}
				
				if (!db) {
					handler.log('unexist db key ' + name);
					db = false;
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
					response.item = false;
				} else {
					response.item = response.item[dbName];
				}
				// 	handler.copyObjectValues(response.item[dbName], db);
								
				if (callback) callback(response.item);
				
			});
			
		}
	}
	
	// callback(error)

	this.removeDB = function(name, callback, cfg) {
			
		name = handler.validateDBName(name);
		
		if (!name) {
			if (callback) callback('empty or bad DB name');
			return;
		}
		
		var dbName = handler.getFullDBName(name, cfg);
		
		if (handler.driver == 'localstorage' || cfg) {
		
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
	
	this.saveDB = function(name, data, callback, cfg) {
			
		name = handler.validateDBName(name);
		
		if (!name) {
			if (callback) callback('empty or bad DB name');
			return;
		}
		
		var dbName = handler.getFullDBName(name, cfg);
		
		if (!cfg && handler.fav && handler.fav.getGlobal('env')) {
            
            // all storage data that can be accessed wihout JSON parse
            
			data.meta = '[meta_start]' + handler.fav.getGlobal('env').profile + '|' + KellyTools.getGMTDate() + '[meta_end]';
		}
		
		if (handler.driver == 'localstorage' || cfg) {
		
			// проверить поведение при пороговых значениях (~3-4мб данных)
			// upd. данные не сохраняются. Выполняется вызов исключения. добавлен в обработку ошибок despetcher
            // проверка корректного исполнения save в kellyFavItems не выполняется, добавить
			
			KellyTools.getBrowser().runtime.sendMessage({
				method: "setLocalStorageItem", 
				dbName : dbName,
				data : data,
			}, function(response) {
            
				if (response.error) {
					handler.log(response.error);
				}
				
				if (callback) callback(response.error ? true : false);
			});
			
		} else {
			
			// при больших объемах данных данные сохраняются корректно (тесты при 40-100мб данных, фрагментация 1-2 мегабайта на одно хранилище)
			
			var save = {};
				save[dbName] = data;
			
			KellyTools.getBrowser().runtime.sendMessage({
				method: "setApiStorageItem", 
				dbName : dbName,
				data : save,
			}, function(response) {
				
				if (callback) callback(response.error);
			});
		}	   
	}
	
	constructor(cfg);
}
// таблицы для форм
// количество элементов в бд
// добавить методы работы через Dispetcher и протестировать метод работы через API Google
// потсраничная навигация для грабера данных

function KellyFavStorageManager(cfg) {
	
	var handler = this;
	
	this.prefix = 'kelly_db_';
	this.prefixCfg = 'kelly_cfg_';
	
	this.api = KellyTools.getBrowser();
	
	this.wrap = false;
	
	this.className = 'KellyFavStorageManager';
	this.mergeProcess = false;
	
	this.driver = 'localstorage';  
	
	this.storageContainer = false; 
	this.storageList = false;
	
	this.inUse = false;
	this.fav = false;
		
	this.slist = false;
	
	function constructor(cfg) {		
	
	}	
		
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
		
		handler.storageList.innerHTML = '';
		var totalKb = 0;
		
		for (var i=0; i < slist.length; i++) {
		
			var dbItem = document.createElement('DIV');
				dbItem.className = handler.className + '-DBItem';
				
				if (handler.fav.getGlobal('fav').coptions.storage == slist[i]) {
					dbItem.className += ' active';
				}
				
				dbItem.innerHTML  = '<span class="' + handler.className + '-DBItem-name">' + slist[i] + '</span>';
				dbItem.innerHTML += '<span class="' + handler.className + '-DBItem-size"></span>';
				dbItem.innerHTML += '<a class="' + handler.className + '-DBItem-download' + '" href="#">Скачать</a>';
				dbItem.innerHTML += '<a class="' + handler.className + '-DBItem-select' + '" href="#">Выбрать</a>';
				
			handler.storageList.appendChild(dbItem);
			
			var dbItemSize = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-size');	
			handler.getDBSize(slist[i], false, function(size) {				
				dbItemSize.innerHTML = size + 'кб';
				
				totalKb++;
			});
			
			var selectButton = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-select');
				selectButton.setAttribute('data-dbname', slist[i]);
				selectButton.onclick = function() {
				
					if (!this.getAttribute('data-dbname')) return false;
					
					handler.fav.getGlobal('fav').coptions.storage = this.getAttribute('data-dbname');
					handler.fav.save('cfg');
	
					handler.getStorageList(handler.showStorageList);
					handler.fav.load('items');					
					handler.fav.updateFavCounter();
					handler.showMessage('База данных выбрана', false, 'storage');
					return false;
				}
				
			var downloadButton = KellyTools.getElementByClass(dbItem, handler.className + '-DBItem-download');
				downloadButton.setAttribute('data-dbname', slist[i]);
				downloadButton.onclick = function() {
					var dbName = this.getAttribute('data-dbname');
					
					handler.loadDB(dbName, function(db) {
					
						if (db === false) {
							return false;							
						}
						
						var time = new Date().getTime();
						
						KellyTools.createAndDownloadFile(JSON.stringify(db), dbName + '_' + time + '.json');						
					});
					
					return false;
				}
		}
	
	}
		
	this.showDBManager = function() {
	
		if (!handler.wrap) return;
		if (handler.inUse) return;
		
		handler.wrap.innerHTML = '';
		
		if (handler.driver == 'localstorage' && !handler.fav.isMainDomain()) {
			
			handler.wrap.innerHTML = '<div>\
				<p>Тип хранения данных ' + handler.driver + ' не поддерживает управление данными с дочерних доменов</p>\
				<p>Перейдите на <a href="http://' + handler.fav.getGlobal('env').mainDomain + '/">основной домен</a> для переключения текущего хранилищя или управления данными\
			</div>';
			
			return;
		}
		
		var overwriteId = handler.className + '-overwrite';
		var html = '\
			<div class="' + handler.className + '-wrap">\
				<table>\
					<tr><td>Тип хранения данных :</td><td>' + handler.driver + '</td></tr>\
					<tr><td colspan="2"><h3>Добавить новую базу</h3></td></tr>\
					<tr><td>Загрузить из файла</td><td><input type="file" id="' + handler.className + '-db-file"></td></tr>\
					<tr><td>Идентификатор базы</td><td><input type="text" id="' + handler.className + '-create-name" placeholder="custom_data"></td></tr>\
					<tr><td><label for="' + overwriteId + '-cancel">Отмена если существует</label></td>\
						<td><input type="radio" name="' + overwriteId + '" id="' + overwriteId + '-cancel" value="cancel" checked></td></tr>\
					<tr><td><label for="' + overwriteId + '-overwrite">Перезаписать если существует</label></td>\
						<td><input type="radio" name="' + overwriteId + '" id="' + overwriteId + '-overwrite" value="overwrite" ></td></tr>\
					<tr><td><label for="' + overwriteId + '-add">Дополнить если существует</label></td>\
						<td><input type="radio" name="' + overwriteId + '" id="' + overwriteId + '-add" value="add"></td></tr>\
					<tr><td colspan="2"><a href="#" class="' + handler.className + '-create">Создать</a></td></tr>\
					<tr><td colspan="2"><div class="' + handler.className + '-message"></div></td></tr>\
					<tr><td colspan="2"><h3>Управление данными</h3></td></tr>\
					<tr><td colspan="2"><div class="' + handler.className +'-StorageList"></div></td></tr>\
					<tr><td colspan="2"><div class="' + handler.className + '-message ' + handler.className + '-message-storage"></div></td></tr>\
					<tr><td colspan="2"><h3>Удалить базу данных</h3></td></tr>\
					<tr><td>Идентификатор базы</td><td><input type="text" id="' + handler.className + '-delete-name" placeholder="custom_data"></td></tr>\
					<tr><td colspan="2"><a href="#" class="' + handler.className + '-delete">Удалить</a></td></tr>\
					<tr><td colspan="2"><div class="' + handler.className + '-message ' + handler.className + '-message-delete"></div></td></tr>\
				</table>\
			</div>\
		';
		
		
		handler.storageContainer = document.createElement('DIV');
		handler.storageContainer.innerHTML = html;
			
		
		handler.storageList = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-StorageList');			
		
		
		var removeButton = KellyTools.getElementByClass(handler.storageContainer, handler.className + '-delete');
			removeButton.onclick = function() {
				
				if (handler.inUse) return false;
				handler.inUse = true;
				
				var dbName = document.getElementById(handler.className + '-delete-name').value.trim(); 	
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
				
				var dbName = document.getElementById(handler.className + '-create-name').value.trim(); // todo validate by regular	
				if (!dbName) {
					handler.showMessage('Введите название базы данных', true);
					return false;
				}
				
				var overwrite = document.getElementById(overwriteId + '-overwrite').checked ? true : false;
				var add = document.getElementById(overwriteId + '-add').checked ? true : false;
				var cancel = document.getElementById(overwriteId + '-cancel').checked ? true : false;
				
				if (cancel && handler.slist === false) {

					handler.showMessage('Дождитесь загрузки списка баз данных', true);
					return false;
				}
				
				if (cancel && handler.slist.indexOf(dbName) != -1) {
					
					handler.showMessage('Базы данных уже существует', true);
					return false;					
				}
				
				handler.loadDB(dbName, function(db) {
					
					if (db !== false) {
						handler.showMessage('База данных уже существует', true);
						return false;							
					}
					
					var onDBSave =  function(error) {
					
						if (!error) {
							
							handler.getStorageList(handler.showStorageList);							
							handler.showMessage('База данных добавлена');
							
						} else {
						
							handler.showMessage('Ошибка добавления базы данных', true);
						}
						
					};
							
					// load data from input file
					
					var fileInput = document.getElementById(handler.className + '-db-file');
					if (fileInput.value) {
					
						KellyTools.readFile(fileInput, function(input, fileData) {
														
							var db = KellyTools.parseJSON(fileData.trim());
							if (db) {
								db = handler.validateDB(db);	
								handler.saveDB(dbName, db, onDBSave);
							} else {
								handler.showMessage('Ошибка парсинга структурированных данных', true);	
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

	this.searchCategory = function(db, category) {
		
		if (!category || !category.name) return false;
		
		for (var c = 0; c < db.categories.length; c++) {
			if (db.categories[c].name == category.name) return c;
		}
		// todo safe in buffer
		return false;
	}

	this.copyObjectValues = function(from, to) {
		for (var k in from){
			if (typeof from[k] !== 'function') {
				to[k] = from[k];
			}
		}
	}

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
					var existCatIndex = handler.searchCategory(db, dataCat);
					
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
		
			var slist = [];
			if (typeof localStorage == 'undefined' || !localStorage.length) return slist;
		
			for (var i = 0; i < localStorage.length; i++) {
				if (localStorage.key(i).indexOf(handler.prefix) !== -1) {
					if (keepPrefix) slist.push(localStorage.key(i));
					else slist.push(localStorage.key(i).replace(handler.prefix, '')); 
				}
			}
			
			if (callback) callback(slist);
			
		} else {
			
			handler.api.storage.local.get(null, function(dbs) {
				
				if (dbs) {
					var slist = [];
					var names = Object.keys(dbs);

					for (var i = 0; i < names.length; i++) {
						if (names[i].indexOf(handler.prefix) !== -1) {
							if (keepPrefix) slist.push(names[i]);
							else slist.push(names[i].replace(handler.prefix, '')); 
						}
					}
				}
				
				if (callback) callback(slist);
			});
		}
	}
		
	this.getDBSize = function(name, inBytes, callback) {
	
		name = handler.validateDBName(name);
		
		if (!name) {
			if (callback) callback(0);
			return;
		}
		
		var dbName = handler.prefix + name;
		
		if (handler.driver == 'localstorage') {
		
			var item = localStorage.getItem(dbName);
			
			if (!item) bytes = 0;
			
			if (inBytes) {
				bytes = item.length;
			} else {
				bytes = item.length / 1000;
			}	
			
			if (callback) callback(bytes);
			
		} else {
			
			handler.api.storage.local.getBytesInUse(dbName, function(bytes){
				
				if (!bytes) bytes = 0;
				
				if (!inBytes) {
					bytes = bytes / 1000;
				}
			
				if (callback) callback(bytes);
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
				{id : 1, name : 'GIF', protect : true},
				{id : 2, name : 'NSFW', nsfw : true, protect : true},
			],
			items : [],
			// native_tags : [],
		}
	}

	// todo check links .items.pImage and .link and .commentLink
	this.validateDB = function(data) {
		
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

	// callback(db)
	
	this.loadDB = function(name, callback, cfg) {
		
		name = handler.validateDBName(name);
		
		if (!name) {
			if (callback) callback(false);
			return;
		}
		
		var dbName = (cfg ? handler.prefixCfg : handler.prefix) + name;
		
		if (handler.driver == 'localstorage') {
		
			var db = KellyTools.parseJSON(localStorage.getItem(dbName));
			
			if (!db) {
				handler.log('unexist db key ' + name);
				db = false;
			}
			
			if (db && !cfg) db = handler.validateDB(db, cfg);	
			
			if (callback) callback(db);
			
		} else {
			
			handler.api.storage.local.get(dbName, function(db) {
			
				if (!db || db === null || !db[dbName]) {
					handler.log('unexist db key ' + name);
					db = false;
				}
				
				if (db && !cfg) db = handler.validateDB(db[dbName]);	
				
				if (callback) callback(db);
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
		
		var dbName = (cfg ? handler.prefixCfg : handler.prefix) + name;
		
		if (handler.driver == 'localstorage') {
		
			localStorage.removeItem(dbName)
			
			if (callback) callback(false);
			
		} else {
		
			handler.api.storage.local.remove(dbName, function() {
			
				var error = false;
				
				if (handler.api.runtime.lastError) {
					
					error = handler.api.runtime.lastError.message;
				}
				
				if (callback) callback(error);
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
		
		var dbName = (cfg ? handler.prefixCfg : handler.prefix) + name;
		
		if (handler.fav && handler.fav.getGlobal('env')) {
			data.meta = {
				profile : handler.fav.getGlobal('env').profile,
				timestamp : KellyTools.getGMTDate(),
			}
		}
		
		if (handler.driver == 'localstorage') {
		
			// проверить поведение при пороговых значениях (~3-4мб данных)
			
			localStorage.setItem(dbName, JSON.stringify(data));
			handler.log(dbName);
			if (callback) callback(false);
			
		} else {
		
			var save = {};
				save[dbName] = data;
				
			handler.api.storage.local.set(save, function() {
			
				var error = false;
				
				if (handler.api.runtime.lastError) {
					
					error = handler.api.runtime.lastError.message;
				}
				
				if (callback) callback(error);
			});
		
		}	   
	}
	
	constructor(cfg);
}
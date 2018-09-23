function KellyFavStorageManager(cfg) {
	
	var handler = this;
	
	this.prefix = 'kelly_db_';
	this.api = KellyTools.getBrowser();
	
	this.wrap = false;
	
	this.baseClass = 'KellyFavStorageManager';
	this.mergeProcess = false;
	
	this.driver = 'localstorage'; // 
	
	this.storageContainer = false; 
	this.inUse = false;
	
	this.downloadManager = false; // KellyGrabber
	
	function constructor(cfg) {		
	
	}	
	
	this.showMessage = function(text, error) {
	
		var	message = KellyTools.getElementByClass(storageContainer, handler.baseClass + '-message');
			
		if (!message) return;
		
		message.className = message.className.replace(handler.baseClass + '-error', '').trim();
		
		if (error) message.className += ' ' + handler.baseClass + '-error';
		message.innerHTML = text;
	
	}

	this.showDBManager = function() {
	
		if (!handler.wrap) return;
		if (handler.inUse) return;
		
		handler.wrap.innerHTML = '';
		
		var html = '<div class="' + handler.baseClass + '-wrap">\
						<div class="' + handler.baseClass +'-controlls">\
							Файл базы данных <input type="file" id="' + handler.baseClass + '-db-file">\
							<input type="text" id="' + handler.baseClass + '-create-name" placeholder="Название базы данных"><a href="#" id="' + handler.baseClass + '-create">Добавить</a>\
							<div class="' + handler.baseClass + '-message"></div>\
						</div>\
						<h3>Управление данными</h3>\
						<div class="' + handler.baseClass +'-StorageList"></div>\
						<h3>Удалить базу данных</h3>\
						<input type="text" id="' + handler.baseClass + '-delete-name" placeholder="Название базы данных"><a href="#" id="' + handler.baseClass + '-delete">Удалить</a>\
					</div>\
		';
			
		var storageList = KellyTools.getElementByClass(storageContainer, handler.baseClass + '-StorageList');
				
		var showStorageList = function(slist) {			
			
			var totalKb = 0;
			
			for (var i=0; i < slist.length; i++) {
			
				var dbItem = document.createElement('DIV');
					dbItem.className = handler.baseClass + '-DBItem';
					dbItem.innerHTML  = '<span class="' + handler.baseClass + '-DBItem-name">' + slist[i] + '</span>';
					dbItem.innerHTML += '<span class="' + handler.baseClass + '-DBItem-size"></span>';
					dbItem.innerHTML += '<a class="' + handler.baseClass + '-DBItem-download' + '" href="#">Скачать</a>';
					
				storageList.appendChild(dbItem);
				
				var dbItemSize = KellyTools.getElementByClass(dbItem, handler.baseClass + '-DBItem-size');	
				handler.getDBSize(slist[i], true, function(size) {				
					dbItemSize.innerHTML = size + 'кб';
					
					totalKb++;
				});

				var downloadButton = KellyTools.getElementByClass(storageContainer, handler.baseClass + '-DBItem-download');
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
					}
			}
	
		}
		
		var storageContainer = document.createElement('DIV');
			storageContainer.innerHTML = html;
			
			var createNewButton = KellyTools.getElementByClass(storageContainer, handler.baseClass + '-create');
				createNewButton.onclick = function() {
					
					if (handler.inUse) return;
					handler.inUse = true;
					
					var dbName = document.getElementById(handler.baseClass + '-create-name');	
					if (!dbName) {
						handler.showMessage('Введите название базы данных', true);
						return false;
					}
					
					handler.loadDB(dbName, function(db) {
						
						if (db !== false) {
							handler.showMessage('База данных уже существует', true);
							handler.inUse = false;
							return false;							
						}
						
						// load data from input file
						
						KellyTools.readFile(handler.baseClass + '-db-file', function(input, fileData) {
														
							var db = KellyTools.parseJSON(fileData.trim());
							if (db) db = handler.validateDB(db);	
							saveDB(dbName, db, function(error) {
							
								if (!error) {
									
									handler.getStorageList(showStorageList);
									
									handler.showMessage('База данных добавлена');
								} else {
								
									handler.showMessage('Ошибка добавления базы данных', true);
								}
								
								handler.inUse = false;
							});
							
						});
						
					});
					
				}
			
			handler.getStorageList(showStorageList);
			
			handler.wrap.appendChild(storageContainer);
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
		
			if (isComment && KellyTools.getRelativeUrl(data.items[b].commentLink).indexOf(link) != -1) {
				return b;
			} else if (!isComment && KellyTools.getRelativeUrl(data.items[b].link).indexOf(link) != -1) {
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
				
		if (handler.driver == 'localStorage') {
		
			var slist = [];
			if (typeof localStorage == 'undefined' || !localStorage.length) return slist;
		
			for (var i = 0; i < localStorage.length; i++) {
				if (localStorage.key(i).indexOf(handler.prefix) !== -1) {
					if (keepPrefix) slist.push(names[i]);
					else slist.push(names[i].replace(handler.prefix, '')); 
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
	
		var dbName = handler.prefix + name;
		
		if (handler.driver == 'localStorage') {
		
			var item = localStorage.getItem(dbName);
			
			if (!item) return 0;
			
			if (inBytes) {
				return item.length;
			} else {
				return item.length / 1000;
			}	
			
		} else {
			
			handler.api.storage.local.getBytesInUse(dbName, function(bytes){
				
				if (!bytes) return 0;
				
				if (!inBytes) {
					bytes = bytes / 1000;
				}
			
				if (callback) callback(bytes);
			});
		}
	}

	this.log = function(text) {
		console.log('KellyStorageManager : ' + text);
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

	this.loadDB = function(name, callback) {
		
		var dbName = handler.prefix + name;
		
		if (handler.driver == 'localStorage') {
		
			var db = KellyTools.parseJSON(localStorage.getItem(dbName));
			
			if (db) db = handler.validateDB(db);	
			else {
				log('unexist db key ' + name);
				db = false;
			}
			
			if (callback) callback(db);
			
		} else {
			
			handler.api.storage.local.get(dbName, function(db) {
			
				if (!db || db === null || !db[dbName]) {
					handler.log('unexist db key ' + name);
					db = false;
				}
				
				if (db) db = handler.validateDB(db[dbName]);	
				
				if (callback) callback(db);
			});	
			
		}
	}
	
	// callback(error)

	this.removeDB = function(name, callback) {
		
		var dbName = handler.prefix + name;
		
		if (handler.driver == 'localStorage') {
		
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
	
	this.saveDB = function(name, data, callback) {
		
		var dbName = handler.prefix + name;
		
		if (handler.driver == 'localStorage') {
		
			// проверить поведение при пороговых значениях (~3-4мб данных)
			
			localStorage.setItem(dbName, JSON.stringify(data));
			
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
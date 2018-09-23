// kellyTileGrid version 1.0.7 | 20.09.18 | Rubchuk Vladimir
// todo docs and examples

function kellyTileGrid(cfg) {
    
    var tilesBlock = false;
    var tileClass = 'image';
    var loadTimer = false;
	
    var tiles = false;
	var tilesLoadState = false;
	var tilesLoaded = false;
	
    var currentTileRow = false;
    var requiredWidth = false;
    var hideUnfited = false;
    
    var rowHeight = 250; // требуемая высота тайловой строки
	
	var rules = {
		min : 2, // минимальное кол-во элементов в строке не зависимо от rowHeight
		heightDiff : 10, // допустимая погрешность по высоте для текущей строки элементов
		heightDiffLast : 20, // допустимая погрешность для последнего ряда
		unfitedExtendMin : 2, // для последнего ряда - подгоняем по ширине не обращая внимания на требуемую высоту если осталось указанное кол-во изображений невместифшихся в сетку с требуемой высотой
		dontWait : false,
		fixed : false,
		tmpBounds : false,
		oversizedHeightRatio : 0.2,
        
		// внимание к длинным картинкам -oversized
	};
    
    var handler = this;
    var events = { 
		onGridUpdated : false, // (handler) after updateTileGrid method
		
		getResizableElement : false, // (handler, tile) если метод задан - возвращать элемент к которому в тайле будет применены атрибуты width \ height, по умолчанию сам тайл
		getBoundElement : false, // (handler, tile) если метод задан - возвращать элемент из которого можно получить данные о пропорция тайла (свойства data-width \ data-height) , по умолчанию сам тайл
		
		isBoundsLoaded : false, // (handler, tile, boundEl) is element loaded
		// getScaleElement
		onBadBounds : false, // (handler, data[errorCode, error, tile, boundEl]) element is loaded, but bounds is unsetted or loaded with error 
		onResize : false, // (handler) window resize
		onLoadBounds : false, // (handler, boundEl, errorTriger) some of unknown bounds element is ready
		onResizeImage : false, // (handler, tileResizedInfo[origHeight, origWidth, width, height])
	};
	
	var imgEvents = {
		onError : function(e) {
			onLoadBounds(this, 'error'); 
		},
		onSuccess : function(e) {
			onLoadBounds(this, 'success'); 
		},
	};
    
    function constructor(cfg) {
        handler.updateConfig(cfg);
    }
    
    this.updateConfig = function(cfg) {
        
        if (!cfg) return false;
                
        if (typeof cfg.tilesBlock != 'undefined') {
        
            tilesBlock = cfg.tilesBlock;
            
            if (typeof tilesBlock == 'string') {
                var el = document.getElementById(tilesBlock.trim());
                if (el) tilesBlock = document.getElementById(tilesBlock.trim());
            }
        }
        
        if (cfg.rowHeight) {
            rowHeight = cfg.rowHeight;
        }
		
		if (cfg.rules) {
		
			for (var k in rules){
				if (typeof rules[k] !== 'function' && typeof cfg.rules[k] !== 'undefined') {
					 rules[k] = cfg.rules[k];
				}
			}
		}
        
        if (cfg.tileClass) {
            tileClass = cfg.tileClass;
        }
        
        if (cfg.hideUnfited) {
            hideUnfited = true;
        } else {
            hideUnfited = false;
        }
		
		if (cfg.events) {
		
			for (var k in events){
				if (typeof cfg.events[k] == 'function') {
					 events[k] = cfg.events[k];
				}
			}
		}
		
		window.addEventListener('resize', onResize);	
        return true;
    }
    
	function onResize() {
		if (!tilesBlock) return;
		
		if (events.onResize && events.onResize(handler)) {
			return true;
		} 
		
		handler.updateTileGrid(true);
	}
	
   function isBoundsLoaded(tile) {
   
		var boundEl = handler.getBoundElement(tile);
		if (!boundEl) return true;
				
		if (events.isBoundsLoaded && events.isBoundsLoaded(handler, tile, boundEl)) {
			return true;
		} 
		
   		if (boundEl.tagName != 'IMG') return true;  // text previews without image or some thing like that
        if (boundEl.getAttribute('error')) return true;
        if (boundEl.getAttribute('data-width')) return true;
        
        if (!boundEl.src) {
            boundEl.setAttribute('error', '1');
            return true;
        }
    
        var loaded = boundEl.complete && boundEl.naturalHeight !== 0;
        return loaded;
    }
	
	function onBadBounds(data) {
			
		console.log(data);
		
		if (events.onBadBounds) {
			
			return events.onBadBounds(handler, data);
			
		} else {
		
			if (data.tile) data.tile.style.display = 'none';
		}
		
		return false;
			
	}
	
	function onLoadBounds(boundEl, state) {
		
		if (boundEl.tagName != 'IMG' && (!boundEl.naturalWidth || !boundEl.naturalHeight)) {
			state = 'error';
		}
		
		if (events.onLoadBounds && events.onLoadBounds(handler, boundEl, state)) {
			return true;
		} 
		
		if (state == 'error') {
			boundEl.setAttribute('error', '1');
		} else {
			
		}
		
		handler.updateTileGrid();
	}

    function getResizedInfo(resizeTo, info, resizeBy) 
    {		 
        var k;
        
        if (resizeBy == 'width') {
            k = info[resizeBy] / resizeTo;
            info.height = Math.ceil(info.height / k);
        } else {
            k = info[resizeBy] / resizeTo;
            info.width = Math.ceil(info.width / k);
        }
        
        info[resizeBy] = resizeTo;
        return info;
    }	 

    this.getTilesBlock = function() {
        return tilesBlock;
    }

    this.getTiles = function() {
        return tilesBlock.getElementsByClassName(tileClass);
    }
	
	this.getBoundElement = function(tile) {
		if (events.getBoundElement) return events.getBoundElement(handler, tile);
		return tile;
	}

	this.getResizableElement = function(tile) {
		if (events.getResizableElement) return events.getResizableElement(handler, tile);
		return tile;
	}
	
	this.clearEvents = function() {
		
        if (!tilesBlock) return false;
        tiles = handler.getTiles();
		
        for (var i = 0; i < tiles.length; i++) {
			var boundEl = handler.getBoundElement(tiles[i]);
			if (boundEl.tagName == 'IMG' && tiles[i].getAttribute('data-load-eventInit')) {
				
				boundEl.removeEventListener('error', imgEvents.onError);
				boundEl.removeEventListener('load',  imgEvents.onSuccess);				
				tiles[i].setAttribute('data-load-eventInit', '0');
			}
		}
	}
		
	this.stopLoad = function() {
	
		// останавливаем загрузку если что-то не успело загрузится. При сценариях - смена страницы \ закрытие блока с тайлами и т.п.
   
        if (!tilesBlock) return false;
        for (var i = 0; i < tiles.length; i++) {
			var boundEl = handler.getBoundElement(tiles[i]);
			if (boundEl.tagName == 'IMG') {
				boundEl.src = ''; 
			}
		}
	}
	
	this.close = function() {
		handler.clearEvents();
		handler.stopLoad();
	}
	
	this.isWaitLoad = function() {
		return tilesLoaded == tiles.length ? false : true;
	}
	
	function markRowAsRendered() {
	
		for (var i=0; i <= currentTileRow.length-1; i++) { 
			currentTileRow[i].tile.setAttribute('data-rowItem-rendered', '1');
		}
	}

	function clearRowRenderMarks() {
		
		for (var i=0; i <= tiles.length-1; i++){ 
				
			if (tiles[i].getAttribute('data-rowItem-rendered')) {
				tiles[i].setAttribute('data-rowItem-rendered', '');
			}
		}
	}
	
	this.updateTileGridState = function() {
		
        if (!tilesBlock) return false;
		
        tiles = handler.getTiles();
        tilesLoaded = 0;        
		tilesLoadState = [];
		
        for (var i = 0; i < tiles.length; i++) {
			
			tilesLoadState[i] = isBoundsLoaded(tiles[i]);
			
            if (tilesLoadState[i]) {
                tilesLoaded++;                
            } else {
			
				var boundEl = handler.getBoundElement(tiles[i]);
				if (boundEl.tagName == 'IMG' && !tiles[i].getAttribute('data-load-eventInit')) {
					
					// test error states
					/*
						var testError = Math.floor(Math.random() * Math.floor(50));
						if (testError > 25) {
							boundEl.src = boundEl.src.replace('.', 'test.d');
						}
					*/
					
					boundEl.addEventListener('error', imgEvents.onError);
					boundEl.addEventListener('load', imgEvents.onSuccess);
					
					tiles[i].setAttribute('data-load-eventInit', '1');
				}
			}
        }
		
		return true;
	}
	
    this.updateTileGrid = function(resize) {		
		
        if (!handler.updateTileGridState()) return false;
		
		if (resize) {
			clearRowRenderMarks();
		}
		
        if (tilesLoaded == tiles.length || (rules.dontWait && tilesLoaded >= rules.dontWait)) {
		
			landscape = 0;
			portrait = 0;
			currentTileRow = [];        
			
			var screenSize = tilesBlock.getBoundingClientRect().width; 
			
			requiredWidth = Math.floor(screenSize); 
			if (screenSize < requiredWidth) requiredWidth = screenSize;

			if (!requiredWidth) {
				console.log('fail to get required width by block. Possible block is hidden');
				console.log(tilesBlock);
				return false;
			}
			   
			for (var i=0; i <= tiles.length-1; i++){ 
				
				// если понадобятся lazy load \ порядок загрузки изображений, лучше вынести в отдельное решение при необходимости, 
				// здесь нужен только контроль текущего состояния пропорций элементов
				
				if (tilesLoaded != tiles.length && rules.dontWait && tiles[i].getAttribute('data-rowItem-rendered')) continue;
				if (!tilesLoadState[i] && !rules.tmpBounds) break;
									
				var tileMainEl = this.getBoundElement(tiles[i]);
				var alternativeBounds = false;					
				
				var imageInfo = {
					portrait : false,
					image : this.getResizableElement(tiles[i]),
					width : 0,
					height : 0,
					tile : tiles[i],
				};
				
				if (tilesLoadState[i]) {
				
					if (rules.dontWait && rules.tmpBounds && tiles[i].className.indexOf(tileClass + '-tmp-bounds') !== -1) {
						tiles[i].className = tiles[i].className.replace(tileClass + '-tmp-bounds', '');
					}
					
					if (!tileMainEl) {							
						alternativeBounds = onBadBounds({errorCode : 1, error : 'updateTileGrid getBoundElement fail', tile : tiles[i], boundEl : false});						
						if (!alternativeBounds){						
							continue;
						}
					}
					
					if (tileMainEl.getAttribute('error')) {
					
						alternativeBounds = onBadBounds({errorCode : 2, error : 'updateTileGrid error during load image', tile : tiles[i], boundEl : tileMainEl});						
						if (!alternativeBounds) {						
							continue;
						}
					}
					
					imageInfo.width = parseInt(tileMainEl.getAttribute('data-width'));
					imageInfo.height = parseInt(tileMainEl.getAttribute('data-height'));
					
					if (!imageInfo.width) {
					
						if (tileMainEl.tagName == 'IMG') {
													
							imageInfo.width = parseInt(tileMainEl.naturalWidth);
							imageInfo.height = parseInt(tileMainEl.naturalHeight); 
						} 
					}    
					
					if (!imageInfo.width || imageInfo.width < 0) {
					
						alternativeBounds = onBadBounds({errorCode : 3, error : 'no width \ height', tile : tiles[i],	boundEl : tileMainEl});						
						if (!alternativeBounds) {
						
							continue;
							
						} else {
						
							imageInfo.width = alternativeBounds.width;
							if (alternativeBounds.height) imageInfo.height = alternativeBounds.height;
						}
					} 
				
					
				} else {
					
					if (tiles[i].className.indexOf(tileClass + '-tmp-bounds') == -1) {
						tiles[i].className += ' ' + tileClass + '-tmp-bounds';
					}
					
					imageInfo.width = rules.tmpBounds.width;
					imageInfo.height = rules.tmpBounds.height;
				}
				
				
				if (!imageInfo.height) imageInfo.height = imageInfo.width;
				
				var ratio = Math.min(imageInfo.width, imageInfo.height) / Math.max(imageInfo.height, imageInfo.width);
				var oversized = false;
				
				if (imageInfo.height > imageInfo.width && ratio <= rules.oversizedHeightRatio) oversized = true; 
				
				if (oversized) {
					
					imageInfo.width = 0;
					imageInfo.height = 0;
					
					alternativeBounds = onBadBounds({errorCode : 4, error : 'oversized', tile : tiles[i],	boundEl : tileMainEl});						
					if (!alternativeBounds) {
					
						continue;
						
					} else {
					
						imageInfo.width = alternativeBounds.width;
						if (alternativeBounds.height) imageInfo.height = alternativeBounds.height;
						else imageInfo.height = imageInfo.width;
						
						if (tiles[i].className.indexOf(tileClass + '-oversized-bounds') == -1) {
							tiles[i].className += ' ' + tileClass + '-oversized-bounds';
						}
					}
					
					
			    }				
					
				if (imageInfo.width < imageInfo.height) imageInfo.portrait = true;   
				imageInfo.portrait ? portrait++ : landscape++;
				
				tiles[i].style.display = 'inline-block';
				currentTileRow.push(imageInfo);
				
				if (!rules.fixed) {
                    if (currentTileRow.length < rules.min ) continue;
					// if (i + rules.min >= tiles.length) continue; // keep collect last elements
					
					var currentRowResultHeight = getExpectHeight();
					
					// если текущий ряд не масштабируеся под требуемую высоту с определенным допуском, продолжаем сбор изображений
					
					if (currentRowResultHeight > rowHeight + ( (rowHeight / 100) * rules.heightDiff )) continue;
					
				} else {
				
					if (currentTileRow.length < rules.fixed) continue;
				}
				
				// console.log(imageInfo);
				// console.log(currentTileRow);
				
				markRowAsRendered();
				resizeImagesRow();
			}
						   
			if (currentTileRow.length) {
			
				if (getExpectHeight() > rowHeight + ( (rowHeight / 100) * rules.heightDiffLast )) {
					
					if (hideUnfited) {
						
						for (var i=0; i <= currentTileRow.length-1; ++i){ 
							currentTileRow[i].image.style.display = 'none';
						}
						
					} else {
						
						
						var showAsUnfited = currentTileRow.length >= rules.unfitedExtendMin ? false : true;
						// if (rules.fixed) showAsUnfited = false;
						
						resizeImagesRow(showAsUnfited);
					}
					
				} else {
				
					resizeImagesRow();
				}
			}

			var clear = tilesBlock.getElementsByClassName(tileClass + '-clear-both');
			if (clear.length) clear[0].parentNode.appendChild(clear[0]);
			else {
				clear = document.createElement('div');
				clear.className = tileClass + '-clear-both';
				clear.setAttribute('style', 'clear : both;');
				tilesBlock.appendChild(clear);                        
			}

			if (events.onGridUpdated) events.onGridUpdated(handler);
			
        } 
    }
    
	function getCurrentRowWidth() {
	
	    var width = 0; 	
        for (var i=0; i <= currentTileRow.length-1; ++i){ 
            
			// масштабируем до нужной высоты весь набор изображений и смотрим сколько получилось по ширине в сумме
            
			width += parseInt(getResizedInfo(rowHeight, {width : currentTileRow[i].width, height : currentTileRow[i].height}, 'height').width);            
        }
		
		return width;
	}
	
    function getExpectHeight() {
        
        return getResizedInfo(requiredWidth, {width : getCurrentRowWidth(), height : rowHeight}, 'width').height; // подгоняем к треуемой ширине
    }
    
	// if some of the items info contain zero values, can return NaN for all row items
	
    function resizeImagesRow(unfited) {
    
        if (!currentTileRow.length) return false;
        
        var width = 0; // counter		
               
        // count total width of row, and resize by required row height
        for (var i=0; i <= currentTileRow.length-1; ++i){ 
			currentTileRow[i].origWidth = currentTileRow[i].width;
			currentTileRow[i].origHeight = currentTileRow[i].hight;
            currentTileRow[i] = getResizedInfo(rowHeight, currentTileRow[i], 'height');
            width += parseInt(currentTileRow[i].width); 
            
        }
        
        // get required row width by resizing common bounds width \ height
        // lose required height, if some proportions not fit
        
        var required = getResizedInfo(requiredWidth, {width : width, 'height' : rowHeight}, 'width');
        
        // finally resize image by required recalced height according to width

        currentRowWidth = 0;
        
        for (var i=0; i <= currentTileRow.length-1; ++i){ 
            
			if (!unfited) {
				currentTileRow[i] = getResizedInfo(required.height, currentTileRow[i], 'height');
			}
			
            currentRowWidth += currentTileRow[i].width;
            
            if (currentRowWidth > requiredWidth) {
                currentTileRow[i].width = currentTileRow[i].width - (currentRowWidth - requiredWidth); // correct after float operations
            }
            
			if (currentTileRow[i].image.className.indexOf(tileClass + '-grid-resized') == -1) {
                currentTileRow[i].image.className += ' ' + tileClass + '-grid-resized';
			}
			
            if (i == 0 && currentTileRow[i].image.className.indexOf(tileClass + '-grid-first') == -1) {
                //currentTileRow[i].image.className = currentTileRow[i].image.className.replace(tileClass + '-grid-first', '');
                currentTileRow[i].image.className += ' ' + tileClass + '-grid-first';                
            }
            
            if (i == currentTileRow.length-1 && currentTileRow[i].image.className.indexOf(tileClass + '-grid-last') == -1 ) {            
                currentTileRow[i].image.className += ' ' + tileClass + '-grid-last';                
            }
            		
			if (events.onResizeImage && events.onResizeImage(handler, currentTileRow[i])) {
				
			} else {
		
				currentTileRow[i].image.style.width = currentTileRow[i].width + 'px';
				currentTileRow[i].image.style.height = currentTileRow[i].height + 'px'; 
				currentTileRow[i].image.style.float = 'left';
			}
        }
		
		
        portrait = 0;
        landscape = 0;
        currentTileRow = new Array();
    }
    
    constructor(cfg);
}
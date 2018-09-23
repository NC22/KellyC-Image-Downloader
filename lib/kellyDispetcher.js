// only background extensions has access to download API, so we create one
// todo рассылать onChanged при обновлении данных если открыто несколько вкладок

// KellyTools.getBrowser().downloads - не поддерживается Edge

var KellyEventsDispetcher = new Object;
	KellyEventsDispetcher.tabEvents = {};
	KellyEventsDispetcher.tabList = []; // all active tabs that request css
	
	KellyEventsDispetcher.eventsAccepted = false;
	KellyEventsDispetcher.envDir = 'env/';

	KellyEventsDispetcher.subscribeTab = function (tabId, event) {

		if (typeof this.tabEvents[event] == 'undefined') this.tabEvents[event] = [];

		if (this.tabEvents[event].indexOf(tabId) == -1) this.tabEvents[event].push(tabId);
		
		return tabId;
	}
    
	KellyEventsDispetcher.init = function() {
	
		if (this.eventsAccepted) return true;
		
		KellyTools.getBrowser().runtime.onMessage.addListener(this.onMessage);
		this.eventsAccepted = true;
		
		return true;
	}
	
	KellyEventsDispetcher.onMessage = function(request, sender, callback) {
			
		console.log(request);    
		console.log(sender.tab ?
					"from a content script:" + sender.tab.url :
					"from the extension");

		var response = {
			
			senderId : 'dispetcher',
			error : '',
			method : request.method,
			
		}
			
		if (request.method == 'downloads.cancel') {        
					
			KellyTools.getBrowser().downloads.cancel(request.downloadId);
					
		} else if (request.method == 'downloads.download') {
		
			var operationId = request.operationId;
			KellyEventsDispetcher.subscribeTab(sender.tab.id, 'download');
		
			KellyTools.getBrowser().downloads.download(request.download, function (downloadId) {
				
				if (operationId == -1) return;
				
				for (var i=0; i <= tabEvents['download'].length-1; ++i) {
					KellyTools.getBrowser().tabs.sendMessage(tabEvents['download'][i], {method: "setDownloadIdByOperationId", downloadId : downloadId, operationId : operationId}, function(response) {});
				}
				
			});
			
			if (request.blob) {
				URL.revokeObjectURL(request.download.url);
			}
			
			/* for Firefox posibly
			var onStartedDownload = function(id) {
				console.log('Started downloading: ' + id);
			}

			var onFailed = function(error) {
			  console.log('Download failed: ' + error);
			}  
			
			downloading.then(onStartedDownload, onFailed);      
		
			*/
			
		} else if (request.method == "onChanged.addListener") {
		
			KellyEventsDispetcher.subscribeTab(sender.tab.id, 'onChanged');
			
			// unstable in chrome, to do replace by check state in 
			// chrome.downloads.search({id : downloadId}, function(array of DownloadItem results) {...}) 
			
			// диспетчер один - табов много
			// если в табе 1 инициализировать скачивалку, потом в табе 2 инициировать еще одну, то в табе 1 скачивалка потеряет событие getBrowser().downloads.onChanged возможно из за того что перезапишется
			// sender, а событие уже повешено. 
			
			KellyTools.getBrowser().downloads.onChanged.addListener(
				function(downloadDelta) {
					  
					for (var i=0; i <= tabEvents['onChanged'].length-1; ++i) {
						KellyTools.getBrowser().tabs.sendMessage(tabEvents['onChanged'][i], {method: "onChanged", downloadDelta : downloadDelta}, function(response) {});
					}
				}
			);
			
		} else if (request.method == "getLocalStorage") {
		
			
		
		} else if (request.method == 'getCss') {
			
			var	onFail = function(url, errorCode, errorText) {
			
				if (callback) callback({
					error : errorCode,
					errorText : errorText,
					url : url,
					data : false,
					item : request.item,
				});
			}
			
			var onSuccess = function(data, url) {
			
				if (callback) { 
				
					callback({
						data : data,
						url : url,
						items : request.item,
					});
				}
			}
			
			KellyEventsDispetcher.tabList[KellyEventsDispetcher.tabList.length] = sender.tab;
			
			var css = KellyTools.getBrowser().runtime.getURL(KellyEventsDispetcher.envDir + 'css/' + request.item + '.css');
			// console.log(css);
			
			KellyTools.readUrl(css, onSuccess, onFail); 
			
			return true; // async mode
			
		} else if (request.method == 'getProfile') {
			
			var	onFail = function(url, errorCode, errorText) {
			
				if (callback) {
					
					callback({
						envText : false, 
						profile : request.profile, 
						error : 'load error',
					});
				}
			}
			
			var onSuccess = function(data, url) {
				
				var environment = false;
				var error = '';
				
				if (callback) { 
				

					callback({
						envText : data, 
						profile : request.profile, 
						error : error,
					});
				}
			}
			
			var profile = KellyTools.getBrowser().runtime.getURL(KellyEventsDispetcher.envDir + 'profiles/' + request.profile + '.js');
			KellyTools.readUrl(profile, onSuccess, onFail); 
			
			return true; // async mode
		} else if (request.method == 'getLanguage') {
						
			var	onFail = function(url, errorCode, errorText) {
				if (callback) {
					
					callback({
						languageData : false, 
						language : request.language, 
						error : 'load error',
					});
				}
			}
			
			var onSuccess = function(data, url) {
				var error = '';
				
				if (callback) { 
				
					callback({
						languageData : data, 
						language : request.language, 
						error : error,
					});
				}
			}
			
			var language = KellyTools.getBrowser().runtime.getURL(KellyEventsDispetcher.envDir + 'loc/' + request.language + '.js');
			
			KellyTools.readUrl(language, onSuccess, onFail); 
			
			return true; // async mode
		}

		if (callback) callback(response);
		
	}
	
	
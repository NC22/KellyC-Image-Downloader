var kellyLoc = new Object();

	// loaded by requestLoc method localization data
	kellyLoc.locs = {};	
	
	kellyLoc.debug = true;
	kellyLoc.currentLanguage = 'ru';
	
	// green light language, that associate with app defaultLoc vars
	// dont require load addition localization data to locs array
	
	kellyLoc.defaultLanguage = 'ru'; 
	
	kellyLoc.detectLanguage = function() {	

		var language = window.navigator.userLanguage || window.navigator.language;
		if (language) {
			if (language.indexOf('-') != -1) language = language.split('-')[0];
			
			language = language.trim();

			return language;
		} else return this.defaultLanguage;
		
	}
	
	kellyLoc.log = function(message) {
		if (this.debug) {
			KellyTools.log(message, 'kellyLoc');
		}
	}
	
	kellyLoc.requestLoc = function(language, onLoad) {
		
		if (language == kellyLoc.defaultLanguage || kellyLoc.locs[language] ) {
			if (onLoad) onLoad(true);
			return;
		}
		
		var loadLanguage = function(response) {
			
			if (response && response.languageData) {
				kellyLoc.log('requestLoc() load custom language profile ' + language );
			} else {
				kellyLoc.log('requestLoc() language load fail ' + language + ' | API response empty');
				if (onLoad) onLoad(kellyLoc.locs[language] ? true : false);		
				
				return;
			}		
			
			try {
				eval(response.languageData);
			} catch (e) {
				if (e) {
					log(e);
					return;
				}
			}
			
			if (typeof localizationProfile != 'undefined') {
				kellyLoc.locs[language] = localizationProfile;
			} else {
				kellyLoc.log('requestLoc() language load fail ' + language + ' | localizationProfile variable empty');
			}
			
			if (onLoad) onLoad(kellyLoc.locs[language] ? true : false);		
		}
		
		KellyTools.getBrowser().runtime.sendMessage({method: "getLanguage", language : language}, loadLanguage);
	}
	
	kellyLoc.parseText = function(text, vars) {
		
		if (!text) return '';
		
		if (vars) {
			for (var key in vars){
				if (typeof vars[key] != 'function') {
					text = text.replace('__' + key + '__', vars[key]);
				}
			}
		} 
		
		return text;
	}
	
	kellyLoc.s = function(defaultLoc, key, vars, overrideLanguage) {
	
		var language = this.currentLanguage;		
		if (overrideLanguage) language = overrideLanguage;
		
		if (language == this.defaultLanguage) return this.parseText(defaultLoc, vars);
		
		if (!this.locs[language]) {
			this.log('kellyLoc.s : language undefined ' + language);	
			return this.parseText(defaultLoc, vars);
		} else if (!this.locs[language][key]) {
			this.log('kellyLoc.s : language key undefined ' + language + ' key ' + key);
			return this.parseText(defaultLoc, vars);
		} else return this.parseText(this.locs[language][key], vars);
	}
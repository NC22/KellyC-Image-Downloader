KellyOptionsPage = new Object();

KellyOptionsPage.addToggleProfileEvent = function(p) {    

    var settings = false, K_FAV = new KellyFavItems({env : p}), el = document.querySelector('[data-profile=' + p.profile + ']');  
    if (!el) return;
    
    K_FAV.load('cfg', function(fav) { settings = fav; el.checked = !fav.coptions.disabled;}); 
    
    el.onchange = function() {
        settings.coptions.disabled = settings.coptions.disabled ? false : true;
        K_FAV.save('cfg'); 
    }
}

KellyOptionsPage.init = function() {
    
    KellyOptionsPage.profiles = [KellyProfileRecorder, KellyProfileJoyreactor];
    var handler = KellyOptionsPage;

    var bc = 'profile-selector', html = '', itemHtml = '';
    document.title = KellyTools.getProgName();
            
    for (var i = 0; i < handler.profiles.length; i++) {
        
        var p = handler.profiles[i].getInstance(); 
        if (p.profile == 'recorder') { // filter.constructor.name - конструктор пока везде Object
            itemHtml = '<label></label><a href="' + p.profile + 'Downloader.html?tab=options"><div class="' + bc + '-name">' + KellyLoc.s('', 'options_page_recorder_cfg') + '</div>';            
            itemHtml += '<div class="' + bc + '-hostlist">' + KellyLoc.s('test', 'options_page_recorder_desc') + '</div>';
        } else {        
            itemHtml = '<label><input type="checkbox" class="profile-toggle" data-profile="' + p.profile + '">' + KellyLoc.s('', 'options_page_module_enabled') + '</label>';
            itemHtml += '<a href="' + p.profile + 'Downloader.html?tab=options"><div class="' + bc + '-name">' + KellyLoc.s('', 'options_page_custom_cfg', {PROFILENAME : KellyTools.getCamelWord(p.profile)})+ '</div>';
            if (p.hostList && p.hostList.length > 0)  itemHtml += '<div class="' + bc + '-hostlist">' + KellyLoc.s('', 'options_page_custom_sites') + p.hostList.join(', ') + '</div>';  
        }
        
        html += '<div class="' + bc + '">' + itemHtml + '</a></div>';
    }
    
    var pageLoc = document.querySelectorAll('[data-loc]');
    for (var i = 0; i < pageLoc.length; i++) {
        pageLoc[i].innerText = KellyLoc.s('', pageLoc[i].getAttribute('data-loc'));
    }
    
    /*
    html += '<div class="' + bc + '-recorder-filters"><div class="' + bc + '-title"><h2>Фильтры для записывающего модуля</h2></div><table><tr><td>Сайт</td><td>Скачать оригинал</td><td>Скачать превью</td></tr>';
    KellyPageWatchdog.validators.forEach(function(filter) {
        if (!filter.host) return;
        var detectionLvl = [];
        for (var i = 0; i < filter.patterns.length; i++) {
            if (['imageByDocument', 'imageOriginal', 'imagePreview', 'imageAny'].indexOf(filter.patterns[i][1]) != -1) detectionLvl.push(filter.patterns[i][1]);
        }
        
        KellyPageWatchdog.filters.push({manifest : {host : filter.host, detectionLvl : detectionLvl}});
    });
    KellyPageWatchdog.filters.forEach(function(filter) {
        var original = 'НЕТ', preview = 'НЕТ';
        if ( filter.manifest.detectionLvl.indexOf('imageByDocument') != -1 ) original = 'Через доп. запрос';
        if ( filter.manifest.detectionLvl.indexOf('imageOriginal') != -1 ) original = 'ОК';
        if ( filter.manifest.detectionLvl.indexOf('imagePreview') != -1 || filter.manifest.detectionLvl.indexOf('imageAny') != -1 ) preview = 'ОК';
        
        html += '<tr><td>' + filter.manifest.host + '</td><td class="' + bc + '-original ' + bc + '-original-' + (original != 'НЕТ' ? 'ok' : 'fail') +'">' + original + '</td>';
        html += '<td class="' + bc + '-preview ' + bc + '-preview-' + (preview != 'НЕТ' ? 'ok' : 'fail') +'">' + preview + '</td></tr>';
    });
    html += '</table></div>';
    */
    
    KellyTools.setCopyright('copyright-software', 'options'); KellyTools.setHTMLData(document.getElementById('profile-selector'), html + '<div style="clear : both;"></div>'); 
    for (var i = 0; i < handler.profiles.length; i++) KellyOptionsPage.addToggleProfileEvent(handler.profiles[i].getInstance());
}


KellyTools.loadFrontJs(KellyOptionsPage.init);
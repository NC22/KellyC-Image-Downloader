KellyOptionsPage = new Object();
KellyOptionsPage.profiles = [KellyProfileRecorder, KellyProfileJoyreactor];

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
    
    var bc = 'profile-selector', html = '<div class="' + bc + '-title"><h1>Выберите страницу настроек модуля</h1></div>', itemHtml = '';
    document.title = KellyTools.getProgName();
    
    for (var i = 0; i < this.profiles.length; i++) {
        
        var p = this.profiles[i].getInstance(); 
        if (p.profile == 'recorder') { // filter.constructor.name - конструктор пока везде Object
            itemHtml = '<label></label><a href="' + p.profile + 'Downloader.html?tab=options"><div class="' + bc + '-name">Настройки [Всплывающее окно записи]</div>';            
            itemHtml += '<div class="' + bc + '-hostlist">Универсальный инструмент для скачивания картинок с любого сайта (вызывается по клику на иконку расширения).</div>';
        } else {        
            itemHtml = '<label><input type="checkbox" class="profile-toggle" data-profile="' + p.profile + '"> Модуль включен</label>';
            itemHtml += '<a href="' + p.profile + 'Downloader.html?tab=options"><div class="' + bc + '-name">Настройки [Встраиваемый модуль для ' + p.profile.charAt(0).toUpperCase() + p.profile.slice(1) + ']</div>';
            if (p.hostList && p.hostList.length > 0)  itemHtml += '<div class="' + bc + '-hostlist">Встроен в сайты : ' + p.hostList.join(', ') + '</div>';  
        }
        
        html += '<div class="' + bc + '">' + itemHtml + '</a></div>';
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
    
    KellyTools.setCopyright('copyright-software', 'options'); KellyTools.setHTMLData(document.getElementById('profile-selector'), html); 
    for (var i = 0; i < this.profiles.length; i++) KellyOptionsPage.addToggleProfileEvent(this.profiles[i].getInstance());
}

KellyOptionsPage.init();
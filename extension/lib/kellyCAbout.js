// related to About page

var KellyCAbout = new Object();    
    KellyCAbout.language = 'en';
    
KellyCAbout.showPage = function(cfg) {
    
    var handler = KellyCAbout;
        handler.cfg = cfg;
        
    var url = new URL(window.location.href), mode = url.searchParams.get('mode');
    if (!mode || ['update', 'about'].indexOf(mode) == -1) mode = 'about';
    
    
    document.body.classList.add('mode-' + mode);
    
    if (KellyCAbout.jr) document.body.classList.add('env-jr');
    
    handler.container = document.getElementsByClassName('notice-' + handler.language)[0];
    handler.container.style.display = '';
    
    if (mode == 'update') {        
        handler.container.getElementsByClassName('version')[0].innerText = KellyTools.getBrowser().runtime.getManifest().version;
    }
    
    handler.bgManager = new KellyNradiowaveBg();
    handler.bgManager.init();
}

KellyCAbout.initVideos = function() {

    var video = document.querySelectorAll('video');
    for (var i = 0; i < video.length; i++) {
        video[i].onclick = function() {
            
            if (this.paused) {
                this.play();
            } else {
                this.pause();
            }
            
            return false;
        }
    }
} 

KellyCAbout.initSpoilers = function() {

    var spoiler = document.querySelectorAll('.spoiler-show');
    for (var i = 0; i < spoiler.length; i++) {
        spoiler[i].onclick = function() {
            var target = this.parentElement.querySelector('.spoiler');
            if (!target) return true;
            
            if (target.classList.contains('spoiler-hidden')) target.classList.remove('spoiler-hidden');
            else target.classList.add('spoiler-hidden');
            return false;
        }
    }
} 

KellyCAbout.init = function() 
{   
    var jrDb = 'kelly_cfg_joyreactor_config';
    
    KellyTools.getBrowser().runtime.sendMessage({
        method: "getApiStorageItem", 
        dbName : jrDb,
    }, function(response) {

        if (!response.item || response.item === null || !response.item[jrDb]) {
            KellyCAbout.jr = false;
        } else {
            KellyCAbout.jr = true;
        }
        
        var lang = KellyTools.getBrowser().i18n.getUILanguage();
        if (lang.indexOf('ru') != -1) KellyCAbout.language = 'ru';
        
        KellyCAbout.initSpoilers();
        KellyCAbout.initVideos();
        KellyCAbout.showPage();    
        
    });
}
function KellyThreadWork(cfg) {

    var jobs = [];
    var maxThreads = 1; // эксперименты чреваты баном за спам запросами, пробовать только за впном или если у вас динамический адрес
    var threads = [];
    
    var timeout = 15; // таймаут ожидания загрузки страницы в секундах, в обработчик onLoad попадет response = false
    var timeoutOnEnd = [2, 2.2, 1.1, 3.4, 4, 3, 3, 3, 4.6]; // таймер перехода к следующей задаче после выполнения - сек. рандомно из массива

    // long pause every
    var pauseEvery = [40,30,20];
    var untilPause = getRandom(pauseEvery);
    var pauseTimer = [10,14,20];
    
    var events = { onProcess : false, onEnd : false };
    var handler = this;
    var threadId = 1;
    var beasy = false, pause = false;
    
    function constructor(cfg) {
        handler.updateCfg(cfg);
    }
    
    function parseTimeset(text) {      
    
        if (typeof text == 'number') text = KellyTools.val(text, 'string');
        if (typeof text == 'string') text = KellyTools.getVarList(text, 'float');
        
        if (text && text.length) {
            
            var list = [];
            
            for (var i = 0; i < text.length; i++) {
                
                var tmp = text[i];
                
                if (typeof tmp != 'number') {
                    tmp = KellyTools.val(tmp, 'float');
                }
                
                if (tmp <= 0) continue;
                
                list[list.length] = tmp;                
            }
            
            return list;
            
        } else {
            return [];
        }
        
    }
    
    function timesetToString(timeset) {
        var string = '';
        
        for (var i = 0; i < timeset.length; i++) {
            string += string ? ',' + timeset[i] : timeset[i];
        }
        
        return string;
    }
    
    this.getCfg = function() {
        return {
            pauseEvery : timesetToString(pauseEvery),
            pauseTimer : timesetToString(pauseTimer),
            timeoutOnEnd : timesetToString(timeoutOnEnd),
            timeout : timeout,
            maxThreads : maxThreads,
        }
    }
    
    this.pause = function(state) {
        if (!handler.isBeasy()) return;
        
        pause = state ? true : false;
        if (pause == false) {
            for (var i = 1; i <= maxThreads; i++) if (!applayJob()) break;
        }
    }
    
    this.updateCfg = function(cfg) {
        
        if (!cfg) return;

        var tmp = parseTimeset(cfg.pauseEvery);        
        if (tmp.length) {
            pauseEvery = tmp;            
            untilPause = getRandom(pauseEvery);
        }     
                
        tmp = parseTimeset(cfg.pauseTimer);        
        if (tmp.length) pauseTimer = tmp;
        
        tmp = parseTimeset(cfg.timeoutOnEnd);
        if (tmp.length) timeoutOnEnd = tmp;
        
        tmp = KellyTools.val(cfg.timeout, 'float');  
        if (tmp > 2) timeout = tmp;
        
        tmp = KellyTools.val(cfg.maxThreads, 'int');
        if (tmp >= 1 && tmp <= 15) maxThreads = tmp;
    }
    
    function getRandom(input) {
        return input[Math.floor(Math.random() * ((input.length - 1) + 1))];
    }
    
    this.getJobs = function() {
        return jobs;
    }
    
    this.setEvent = function(name, f) {
        
        events[name] = f;    
    }
    
    this.stop = function(noCleanJobs) {
        
        KellyTools.log('clean job', 'KellyThreadWork');        
        onEnd('stop', true);             
    }
    
    function removeThreadItem(thread) {
        
        var threadIndex = threads.indexOf(thread);
        if (threadIndex == -1) return false;
        
        threads.splice(threadIndex, 1);
        return true;
    }
      
    this.onJobEnd = function(thread) {
        
        removeThreadItem(thread);
        
        if (!thread.response) {
            // error
            KellyTools.log('job end without load document', 'KellyThreadWork');
            KellyTools.log(thread, 'KellyThreadWork');
        }

        thread.job.onLoad(handler, thread, jobs.length);
        
        if (events.onProcess) events.onProcess(jobs.length, thread);
        
        handler.clearThreadTimers(thread);
        
        if (!jobs.length && !threads.length) {   
        
            onEnd('onJobEnd');
            
        } else if (jobs.length > 0) {
            
            var timeout = getRandom(timeoutOnEnd);
            
            if (pauseEvery && pauseEvery.length) {
                
                if (untilPause > 0) {
                    untilPause--;
                    KellyTools.log('before pause ' + untilPause, 'KellyThreadWork');
                } else {
                    untilPause = getRandom(pauseEvery);
                    timeout = getRandom(pauseTimer);
                    
                    KellyTools.log('timeout ' + timeout + ' | new pause ' + untilPause, 'KellyThreadWork');
                    
                }
            }
            
            var threadPlaceholder = {};
                threadPlaceholder.applayTimer = setTimeout(function() {  
                     applayJob(threadPlaceholder);
                }, timeout * 1000);
            
            threads.push(threadPlaceholder);
        }
    }

    function applayJob(threadPlaceholder) {
    
        if (threadPlaceholder) removeThreadItem(threadPlaceholder);
    
        if (threads.length >= maxThreads || pause) return false;
        if (!jobs.length && !threads.length) { 
            onEnd('applayJob');
            return false;
        }
        
        if (!jobs.length) {            
            return false;
        }
        
        threadId++;
        var thread = {       
            job : jobs.pop(),
            response : false,
            request : false,
            id : threadId,
            error : '',
        }  
        
        var config = thread.job.config ? thread.job.config : {method : 'GET', responseType : 'text'};
        var defaultCallback = function(urlOrig, data, errorCode, errorText, controller) {

            if (data !== false) {
                thread.response = data;
            } else {
                thread.response = false;
                thread.error = '[HTTP Request ERROR] Error code : ' + errorCode + ' |  error message : ' + errorText;
            }
        
            handler.onJobEnd(thread);
        }
        
        // method | responseType
        
        thread.rules = [];
        
        if (thread.job.url.indexOf('##FETCH_RULES##') != -1) {
            thread.job.url = thread.job.url.split('##FETCH_RULES##');
            thread.rules = thread.job.url.length == 2 ? thread.job.url[1] : false;
            thread.job.url = thread.job.url[0];
            
            thread.rules = thread.rules.split('&');
            thread.rules.forEach(function(rule) {
                 rule = rule.split('=');
                 if (rule.length == 2 && rule.indexOf('mark_') == -1) config[rule[0]] = rule[1];
            });
        }
        
        thread.request = KellyTools.xmlRequest(thread.job.url, config, defaultCallback);
        thread.timeoutTimer = setTimeout(function() {  handler.onJobEnd(thread); }, timeout * 1000);        
        threads.push(thread);
        
        return true;            
    }
    
    this.isBeasy = function() {
        return beasy;
    }
    
    this.clearThreadTimers = function(thread) {
        
        if (thread.applayTimer) {                
            clearTimeout(thread.applayTimer);
            thread.applayTimer = false;
        }
        
        if (thread.request) {
            thread.request.abort();                
            threadrequest = false;
        }
        
        if (thread.timeoutTimer) {
            clearTimeout(thread.timeoutTimer);
            thread.timeoutTimer = false;
        }
    }
    
    function onEnd(cname, forced) {
                            
        for (var i = 0; i < threads.length; i++) handler.clearThreadTimers(threads[i]);
        
        threads = []; jobs = [];
        
        forced = forced ? true : false;
        beasy = false;
        pause = false;
        
        if (events.onEnd) events.onEnd(cname, forced);
    }
    
    this.exec = function() {
    
        if (this.isBeasy()) return false;
        
        if (!jobs.length) {            
            onEnd('exec');
            return false;
        }
               
        for (var i = 1; i <= maxThreads; i++) {
            if (!applayJob()) break;
            else beasy = true;
        }
        
        // job exist, but not applayed (bad maxThreads \ applayJob)
        
        if (!this.isBeasy()) {
            onEnd('exec_fail');
            return false;
        }
        
        return true;
    }
    
    // data - page \ nik \ etc
    
    this.addJob = function(url, onLoad, data, requestCfg) {
    
        if (typeof onLoad !== 'function') {
            onLoad = false;
        }
            
        var job = {
            url : url,
            onLoad : onLoad,
            data : data,
            config : requestCfg ? requestCfg : false,
        };
        
        jobs[jobs.length] = job;
        return job;
    }
    
    constructor(cfg);
}
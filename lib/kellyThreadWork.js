function KellyThreadWork(cfg) {


    var jobs = [];
    var env = false;
    var maxThreads = 1; // эксперименты чреваты баном за спам запросами, пробовать только за впном или если у вас динамический адрес
    var threads = [];
    var iframeC = 0;
    
    var timeout = 15; // таймаут ожидания загрузки страницы в секундах, в обработчик onLoad попадет response = false
    var timeoutOnEnd = [2, 2.2, 1.1, 3.4, 4, 3, 3, 3, 4.6]; // таймер перехода к следующей задаче после выполнения - сек. рандомно из массива
    
    // long pause every
    var pauseEvery = [40,30,20];
    var untilPause = getRandom(pauseEvery);
    var pauseTimer = [10,14,20];
    
    var beasy = false;
    var events = { onProcess : false, onEnd : false };
    var handler = this;
    var threadId = 1;
    var applayJobTimer = false;
    
    
    function constructor(cfg) {
    
        handler.updateCfg(cfg);
    }
    
    function parseTimeset(text) {        
        
        if (typeof text == 'string') {            
            text = KellyTools.getVarList(text, 'float');            
        } 
        
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
    
    this.updateCfg = function(cfg) {
        
        if (!cfg) return;
        
        if (cfg.env) {
            env = cfg.env;
        }

        cfg.pauseEvery = parseTimeset(cfg.pauseEvery);
        
        if (cfg.pauseEvery.length) {
            pauseEvery = cfg.pauseEvery;            
            untilPause = getRandom(pauseEvery);
        }     
        
        cfg.pauseTimer = parseTimeset(cfg.pauseTimer);
        
        if (cfg.pauseTimer.length) {
            pauseTimer = cfg.pauseTimer;
        } 
        
        cfg.timeoutOnEnd = parseTimeset(cfg.timeoutOnEnd);
        if (cfg.timeoutOnEnd.length) {
            timeoutOnEnd = cfg.timeoutOnEnd;
        }
        
        cfg.timeout = KellyTools.val(cfg.timeout, 'float');  
        if (cfg.timeout > 2) {
            timeout = cfg.timeout;
        }
        
        cfg.maxThreads = KellyTools.val(cfg.maxThreads, 'int');
        if (cfg.maxThreads >= 1 && cfg.maxThreads <= 15) {
            maxThreads = cfg.maxThreads;
        }
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
                    
        for (var i = 0; i < threads.length; i++) {
            
            if (threads[i].request) {
                threads[i].request.abort();                
                threads[i].request = false;
            }
            
            if (threads[i].timeoutTimer) {
                clearTimeout(threads[i].timeoutTimer);
                threads[i].timeoutTimer = false;
            }
        }
        
        threads = [];
        jobs = [];
        
        KellyTools.log('clean job', 'KellyThreadWork');
        
        if (applayJobTimer) {
            clearTimeout(applayJobTimer);
            applayJobTimer = false;
        }
        
        if (events.onEnd) events.onEnd('stop', true);
            
    }
        
    // todo add watch dog with timeout for long jobs
    
    this.onJobEnd = function(thread) {

        if (thread.request) {
            thread.request.abort();
            thread.request = false;
        }
        
        if (thread.timeoutTimer) {
            clearTimeout(thread.timeoutTimer);
            thread.timeoutTimer = false;
        }
        
        var threadIndex = threads.indexOf(thread);
        if (threadIndex == -1) return;
        
        threads.splice(threadIndex, 1);

        if (!thread.response) {
            // error
            KellyTools.log('job end without load document', 'KellyThreadWork');
            KellyTools.log(thread, 'KellyThreadWork');
        }

        thread.job.onLoad(handler, thread, jobs.length);
        
        if (events.onProcess) events.onProcess(jobs.length, thread);
        
        if (!jobs.length && !threads.length) {   
        
            if (events.onEnd) events.onEnd('onJobEnd');
            
        } else {
            
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
                        
            applayJobTimer = setTimeout(function() {        
                 applayJob();
            }, timeout * 1000);
        }
    }

    function validateResponse(response) {
    
        if (response.indexOf('<body>') != -1) {
            response = response.replace(/(\r\n\t|\n|\r\t)/gm,"");
            response = response.match(/<body>([\s\S]*?)<\/body>/g); // (.*?)
            if (response && response.length >= 1) {
                response = response[0].replace(/<\/?body>/g,'')
            } else return 0;
            
        } else return 0;
        
        return response;
    }
    
    function applayJob() {
    
        if (threads.length >= maxThreads) return false;
        if (!jobs.length && !threads.length) {            
            if (events.onEnd) events.onEnd('applayJob');
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
      
        var request = new XMLHttpRequest();
            request.open('GET', thread.job.url, true);

            request.onload = function() {
                
                thread.request = false;
                
                if (this.status == 200) {		  
                    thread.response = validateResponse(this.response);
                } else {
                    thread.response = false;
                    thread.error = 'XMLHttpRequest : bad response status ' + this.status;
                }

                handler.onJobEnd(thread);
            };

            request.onerror = function() {
               
                thread.request = false;
                thread.response = false;
                
                thread.error = 'XMLHttpRequest : error without exit status check Access-Control-Allow-Origin';

                handler.onJobEnd(thread);
            };
            
            request.send();
        
        // may be banned as cross site scripting if protocol or domain differs
        /*	
            var request = getIframe();
                request.src = thread.job.url + '?' + env.getGlobal('env').actionVar + '=sanitize';
        */		
        
        thread.request = request;
        thread.timeoutTimer = setTimeout(function() {        
            handler.onJobEnd(thread);        
        }, timeout * 1000);
        
        threads[threads.length] = thread;
        
        return true;            
    }
    
    this.exec = function() {
    
        if (beasy) return false;
        
        if (!jobs.length) {            
            if (events.onEnd) events.onEnd('exec');
            return false;
        }
        
        for (var i = 1; i <= maxThreads; i++) {
            if (!applayJob()) return false;
        }
      
    }
    
    // data - page \ nik \ etc
    
    this.addJob = function(url, onLoad, data) {
    
        if (typeof onLoad !== 'function') {
            onLoad = false;
        }
            
        var job = {
            url : url,
            onLoad : onLoad,
            data : data,
        };
        
        jobs[jobs.length] = job;
    }
    
    constructor(cfg);
}
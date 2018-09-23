function KellyThreadWork(cfg) {


    var jobs = [];
    var env = false;
    var maxThreads = 1; // эксперименты чреваты баном за спам запросами, пробовать только за впном или если у вас динамический адрес
    var threads = [];
    var iframeC = 0;
	
    var timeout = 15; // таймаут ожидания загрузки страницы в секундах, в обработчик onLoad попадет idocument = false
	var timeoutOnEnd = [2, 2.2, 1.1, 3.4, 4, 3, 3, 3, 4.6]; // таймер перехода к следующей задаче после выполнения - сек. рандомно из массива
    
	// long pause every
	var pauseEvery = [40,30,20];
	var untilPause = getRandom(pauseEvery);
	var pauseTimer = [10,14,20];
    
    var beasy = false;
    var events = { onProcess : false, onEnd : false };
    var handler = this;
	var threadId = 1;
	
    
    function constructor(cfg) {
	
        if (cfg.env) {
            env = cfg.env;
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
			}
			
			if (threads[i].timeoutTimer) {
				clearTimeout(threads[i].timeoutTimer);
				threads[i].timeoutTimer = false;
			}
        }
        
        threads = [];
        jobs = [];
        console.log('clean job');
    }
        
    // todo add watch dog with timeout for long jobs
    
    this.onJobEnd = function(thread) {

        if (thread.timeoutTimer) {
            clearTimeout(thread.timeoutTimer);
            thread.timeoutTimer = false;
        }
        
        for (var i = 0; i < threads.length; i++) {
            if (threads[i].id == thread.id) {     
                
                threads.splice(i, 1);
        
                if (!thread.response) {
                    // error
                    console.log('job end without load document');
                    console.log(thread);
                }
        
                thread.job.onLoad(handler, thread, jobs.length);
                
                if (events.onProcess) events.onProcess(jobs.length, thread);
				
				if (!jobs.length && !threads.length) {   
				
					if (events.onEnd) events.onEnd();
					
				} else {
					
					var timeout = getRandom(timeoutOnEnd);
					
					if (pauseEvery && pauseEvery.length) {
						
						if (untilPause > 0) {
							untilPause--;
							console.log('before pause ' + untilPause);
						} else {
							untilPause = getRandom(pauseEvery);
							timeout = getRandom(pauseTimer);
							
							console.log('timeout ' + timeout + ' | new pause ' + untilPause);
							
						}
					}
					
					// clean timer ?
					setTimeout(function() {        
						 applayJob();
					}, timeout * 1000);
				}
                
                break;
            }
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
            if (events.onEnd) events.onEnd();
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
        }   
      
		var request = new XMLHttpRequest();
		request.open('GET', thread.job.url, true);

		request.onload = function() {
		  if (this.status == 200) {		  
			thread.response = validateResponse(this.response);
		  } else {
			thread.response = 0;
		  }
		  
		  handler.onJobEnd(thread);
		};

		request.onerror = function() {
		   thread.response = 0;
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
            if (events.onEnd) events.onEnd();
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
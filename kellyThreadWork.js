// unfinished
// replace on load - to send message - OK
// call error on load

function KellyThreadWork(cfg) {


    var jobs = [];
    var env = false;
    var maxThreads = 5; // 15 одновременно и вы в бане на несколько часов
    var threads = [];
    var iframeC = 0;
    var timeout = 15; // todo

    
    
    var beasy = false;
    var events = { onProcess : false, onEnd : false };
    var handler = this;
    
    function constructor(cfg) {
        if (cfg.env) {
            env = cfg.env;
        }
        
        
        env.addEventListner(window, "message", function(e) { handler.loadIframeOnMessage(e); }, 'input_message_');
    }
    
    this.getJobs = function() {
        return jobs;
    }
    
    this.setEvent = function(name, f) {
        
        events[name] = f;    
    }
    
    // todo
    this.stop = function(noCleanJobs) {
                    
        for (var i = 0; i < threads.length; i++) {
        
            //if (!object.removeEventListener) {
            //    object.detachEvent('on' + event, events[prefix + event]);
            //} else {
            //    object.removeEventListener(event, events[prefix + event]);
            //}
        
            threads[i].frame.parentNode.removeChild(threads[i].frame);
            
        }
        
        threads = [];
        jobs = [];
        console.log('clean job');
    }
    
    function getIframe() {
        iframeC++;
        
        var iframe = document.createElement('iframe')
            iframe.name = 'k-ajax-frame-' + iframeC;
            iframe.style.display = 'none';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            
        document.getElementsByTagName('body')[0].appendChild(iframe);
  
        return iframe;
    
    }
    
    // Catch input messages from loaded iframe page
    // speedUpOnLoad - sends by kellyHelper in ?kellyHelperMode=sanitize mode
        
    this.loadIframeOnMessage = function(e) {
               
        if (!e.data || !e.data.method) return false;
        
        if (e.data.method.indexOf('speedUpOnLoad') != -1) {        
                        
            for (var i = 0; i < threads.length; i++) {
                if (threads[i].frame.contentWindow == e.source) { 
                    threads[i].frameWindow = e.source;         
                    handler.onJobEnd(threads[i]);
                    break;
                }
            }
        }
    }
    
    // todo add watch dog with timeout for long jobs
    
    this.onJobEnd = function(thread) {
        if (!thread.frame) return;     

        if (thread.timeoutTimer) {
            clearTimeout(thread.timeoutTimer);
            thread.timeoutTimer = false;
        }
        
        //var iframeDoc = getIframeDocument(thread.frame);

        //if (iframeDoc.location.href == 'about:blank') return; // Opera 
            
        for (var i = 0; i < threads.length; i++) {
            if (threads[i].frame == thread.frame) {     
                
                threads.splice(i, 1);
        
                var idocument = false;
                if (thread.frameWindow && thread.frameWindow.document) {
                    idocument = thread.frameWindow.document
                } else {
                    // error
                    console.log('job end without load document');
                    console.log(thread);
                }
        
                thread.job.onLoad(handler, thread, idocument, jobs.length);
                
                thread.frame.parentNode.removeChild(thread.frame);
                
                if (events.onProcess) events.onProcess(jobs.length, thread);
                
                applayJob();
                
                break;
            }
        }
    }

    function getIframeDocument(iframeNode) {

        if (iframeNode.contentDocument)
            return iframeNode.contentDocument;
        if (iframeNode.contentWindow)
            return iframeNode.contentWindow.document;
        return iframeNode.document;
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
        
        var thread = {                
            frame : getIframe(),
            frameWindow : false,
            job : jobs.pop(),                
        }   
                            
        if (thread.job.form) {
            thread.job.target = frame.name;
            thread.job.submit();
        } else {
            thread.frame.src = thread.job.url + '?kellyHelperMode=sanitize';
        }
        
        thread.timeoutTimer = setTimeout(function() {        
            handler.onJobEnd(thread);        
        }, timeout * 1000);
        
        threads[threads.length] = thread;
        
        return true;            
    }
    
    this.exec = function() {
    
        if (beasy) return false;
        
        for (var i = 1; i <= maxThreads; i++) {
            applayJob();
        }
      
    }
    
    // data - page \ nik \ etc
    
    this.addJob = function(url, onLoad, form, data) {
    
        if (typeof onLoad !== 'function') {
            onLoad = false;
        }
        
        if (!form) {
            form = false;
        }
    
        var job = {
            url : url,
            onLoad : onLoad,
            form : form,
            data : data,
        };
        
        jobs[jobs.length] = job;
    }
    
    constructor(cfg);
}
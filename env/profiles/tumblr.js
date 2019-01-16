
// for testing purposes only, just dummy profile


function kellyProfileTumblr() {
        
    var handler = this; 
    var publicationClass = 'postContainer';
    
    var mainDomain = 'tumblr.com';    
    var mainContainers = false;
    
    var commentsBlockTimer = [];
    
    /* imp */
            
    this.location = {
        protocol : window.location.protocol,
        host : window.location.host,
        href : window.location.href,
    }
	
    this.className = 'kellyJRFav'; 
    this.profile = 'tumblr';        
    this.hostClass = handler.location.host.split(".").join("_");

    this.fav = false;        
    this.events = {

        onWindowScroll : function() {
            
            updateFastSaveButtonsState();
            return false;
        },
        
        onWindowResize : function() {
            
            return false;
        },
        
        onPageReady : function() {
                        
            handler.fav.initExtensionResources();
            
            return true;
        },
        
        onInitWorktop : function() {
            // exit 
            return true;
        },
        
        onExtensionReady : function() {
                     
            KellyTools.log('tumblr controller initialized');
            KellyTools.log(handler.location);
            
            
        },
        
        onSideBarShow : function() {
            
           
        }
    
    }
    
    this.getInitAction = function() {
        
        var page = handler.location.href;
        
        if (page.indexOf('yahoo_cookie_receiver') != -1) return 'ignore';
        else return 'main';
        
    }
    
    this.getCommentText = function(comment) {
    
        
    }
        
    this.formatComments = function(block) {
    
    }    
    
    this.formatPostContainer = function(postBlock) {
        
        
    }   
            
    this.isNSFW = function() {
        
        return true;
    }
    
    this.getMainContainers = function() {
        
        if (!mainContainers) {
            mainContainers = {
                
                body : false,
                content : false, // place where to put main extension container
                
            };
        }
        
        return mainContainers;
    }
    
    this.getPosts = function(container) {
        return [];
    }
    
  
    /* imp */
    // get canonical url link in format "//url"
    
    this.getPostLink = function(publication, el) {
     
        return '';    
    }    
    
    /* imp */
    // get canonical comment url link in format "//url"
    
    this.getCommentLink = function(comment) {
      
        return '';
    }
    
    /* imp */
    
    this.getAllMedia = function(publication) {
        
        var data = [];
        
        return data; //  return decodeURIComponent(url);
    }
    
    /* imp */
    
    this.getImageDownloadLink = function(url, full, relative) {
        
        
        return url;
    }
    
    /* imp */
    // return same url if not supported
    
    this.getStaticImage = function(source) {

        return source;
    },
    
        
    /* imp */
    
    this.setFav = function(fav) {
        handler.fav = fav;
    }
            
}

kellyProfileTumblr.getInstance = function() {
    if (typeof kellyProfileTumblr.self == 'undefined') {
        kellyProfileTumblr.self = new kellyProfileTumblr();
    }
    
    return kellyProfileTumblr.self;
}

KellyTools.DEBUG = true;
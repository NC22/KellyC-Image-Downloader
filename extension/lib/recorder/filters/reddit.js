KellyRecorderFilterReddit = new Object();
KellyRecorderFilterReddit.manifest = {host : 'reddit.com', detectionLvl : ['imageOriginal', 'imagePreview', 'imageByDocument']};

KellyRecorderFilterReddit.addItemByDriver = function(handler, data) {
    
    if (handler.url.indexOf('reddit.com') == -1) return;
    
    if (data.el.getAttribute('data-click-id') == 'image') return handler.addDriverAction.SKIP;
    
    if (data.el.getAttribute('data-testid') && data.el.getAttribute('data-testid') == 'post-container') {
        
        // bookmarks, upvoted, downvoted etc.
        
        if (handler.url.indexOf('/user/') != -1) {
        
            var preview = data.el.querySelector('[data-click-id="image"]');
            if (preview) {
                handler.addSrcFromStyle(preview, data.item, 'reddit_post');
            }
        
        // regular pages posts listing 
        
        } else {
            
            var preview = data.el.querySelector('[data-click-id="media"] img');
            if (preview) {
                handler.addSingleSrc(data.item, preview.src, 'addSrcFromAttributes-src', preview, 'reddit_post');
            }
        }
        
        
        // console.log(data.item);
        // console.log(handler.lastError);
        // console.log(preview);
        
        var link = data.el.querySelector('a[data-click-id="body"]');
        if (link) {
            data.item.relatedDoc = link.href;
        } else {
            data.item.relatedSrc = [];
        }
        
        return data.item.relatedSrc.length > 0 ? handler.addDriverAction.ADD : handler.addDriverAction.SKIP;
    }
}

KellyRecorderFilterReddit.parseImagesDocByDriver = function(handler, data) {    
     
    if (handler.url.indexOf('reddit.com') == -1) return;
        
    var pageDataRegExp = /window\.___r[\s]*=[\s]*\{([\s\S]*)\}\}\;\<\/script/g
    var pageData = pageDataRegExp.exec(data.thread.response);

    if (pageData) {
        
        try {
            var redditData = JSON.parse('{' + pageData[1] + '}}');
            
            for (var postId in redditData.posts.models) {
                
                var model = redditData.posts.models[postId];
                
                if (model.media.mediaMetadata ) {
                    for (var mediaId in model.media.mediaMetadata) {
                        
                        if (model.media.mediaMetadata[mediaId].s) {
                            
                            handler.imagesPool.push({
                                relatedSrc : [ model.media.mediaMetadata[mediaId].s.u ], 
                                relatedGroups : [['reddit_orig']] 
                            });
                        }
                        
                    }
                    
                } else if (redditData.posts.models[postId].media.content) {
                    handler.imagesPool.push({
                        relatedSrc : [ redditData.posts.models[postId].media.content ], 
                        relatedGroups : [['reddit_orig']] 
                    });
                }
                
                break;
            }
        
        } catch (e) {
            console.log(e);
        }
    }
    
    return true;
}
     
KellyRecorderFilterReddit.onStartRecord = function(handler, data) {
     if (handler.url.indexOf('reddit.com') == -1) return;
     
     handler.additionCats = {
        reddit_post : {name : 'Post (Preview)', color : '#b7dd99', selected : 90},
        reddit_orig : {name : 'Post media', color : '#b7dd99', selected : 91},
     };
}

KellyPageWatchdog.validators.push({
    url : 'reddit.com', 
    host : 'reddit.com', 
    patterns : [
        ['preview.redd.it/award_images', 'imageTrash'],
        ['external-preview.redd.it', 'imageTrash'], 
        ['preview.redd.it', 'imagePreview'], 
        ['i.imgur.com', 'imagePreview'], 
        ['i.redd.it', 'imagePreview'], 
    ]
});


KellyPageWatchdog.filters.push(KellyRecorderFilterReddit);
// use chrome.tabs.executeScript(tabId, {file: filename}, function() {  handler.exec(); }); to inject custom environments instead of preseted

if (typeof K_FAV == 'undefined') {
    var K_FAV = new KellyFavItems({env : KellyProfileJoyreactor.getInstance(), location : window.location});
        K_FAV.exec();
}

// keep empty space to prevent syntax errors if some symbols will added at end
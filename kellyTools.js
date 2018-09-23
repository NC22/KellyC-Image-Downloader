// todo move helpfullcommon functions from main class FavItemsHelper to here

KellyTools = new Object();

KellyTools.getBrowser = function() {
    
    // chrome - Opera \ Chrome, browser - Firefox
    
    if (typeof chrome !== 'undefined') {
        return chrome;
    } else if (typeof browser !== 'undefined') {
        return browser;
    } else {
        console.log('browser not support download API');
        return false;
    }
}
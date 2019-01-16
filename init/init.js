if (typeof K_DEFAULT_ENVIRONMENT == 'undefined' || !K_DEFAULT_ENVIRONMENT) {
    var K_DEFAULT_ENVIRONMENT = false;
}

if (typeof K_INIT_HOOK != 'undefined') {
    K_INIT_HOOK();
} else {
    var K_FAV = new KellyFavItems();
}

// keep empty space to prevent syntax errors if some symbols will added at end
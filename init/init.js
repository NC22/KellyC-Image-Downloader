if (typeof K_DEFAULT_ENVIRONMENT == 'undefined' || !K_DEFAULT_ENVIRONMENT) {
    var K_DEFAULT_ENVIRONMENT = false;
}

if (typeof K_FAV == 'undefined') {
    var K_FAV = new KellyFavItems();
}

// keep empty space to prevent syntax errors if some symbols will added at end
/*
 |--------------------------------------------------------------------------
 | Browser-sync config file
 |--------------------------------------------------------------------------
 |
 | For up-to-date information about the options:
 |   http://www.browsersync.io/docs/options/
 |
 | There are more options than you see here, these are just the ones that are
 | set internally. See the website for more info.
 |
 |
 */

// If a cert and key are provided then use them
let https = true;

if (process.env.SSL_KEY && process.env.SSL_CERT) {
    https = {
        "key": `${process.env.SSL_KEY}`,
        "cert": `${process.env.SSL_CERT}`
    }
}

module.exports = {
    "https": https,
    "open": false,
    "files": "tmp/themeWatchNotify",
    "awaitWriteFinish": false,
    "watchOptions": {
        "ignoreInitial": true
    },
    "proxy": `https://${process.env.THEMEKIT_STORE}?preview_theme_id=${process.env.THEMEKIT_THEME_ID}`,
    "port": 3000,
    "reloadDelay": 50,
    "reloadDebounce": 0,
    "reloadThrottle": 5000,
    "snippetOptions": {
        rule: {
            match: /<\/body>/i,
            fn: function (snippet, match) {
                return snippet + match;
            }
        }
    }
};
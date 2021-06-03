'use strict'
const chokidar = require('chokidar')
const path = require('path')
const fs = require('fs')
const loadConfigFile = require('rollup/dist/loadConfigFile')
const rollup = require('rollup')
const themeKit = require('@shopify/themekit')
const bs = require('browser-sync').create()
const bsConfig = require('./bs-config')

try {
    fs.rmdirSync(`${__dirname}/dist`, {recursive: true});
    console.log(`${__dirname}/dist is deleted!`);
} catch (err) {
    console.error(`Error while deleting ${__dirname}/dist`);
}

const themeSrcDirectories = [`${__dirname}/src/config/*.json`, `${__dirname}/src/locales/*.json`, `${__dirname}/src/snippets/*.liquid`, `${__dirname}/src/sections/*.liquid`, `${__dirname}/src/layout/*.liquid`, `${__dirname}/src/templates/**/*.liquid`]
const liquidTargetDirectories = [`${__dirname}/dist`, `${__dirname}/dist/snippets`, `${__dirname}/dist/sections`, `${__dirname}/dist/layout`, `${__dirname}/dist/templates`, `${__dirname}/dist/templates/customers`, `${__dirname}/dist/config`, `${__dirname}/dist/locales`]

for (let dir of liquidTargetDirectories) {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir)
        } catch (error) {
            console.error(error)
        }
    }
}

const themeWatcher = chokidar.watch(themeSrcDirectories, {
    watch: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 100
    }
});

const assetsWatcher = chokidar.watch(['./src/assets/**/*'], {
    watch: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 1000
    }
});

const iconWatcher = chokidar.watch('./src/icons/**/*.svg', {
    watch: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 200
    }
});

const liquidDest = `${__dirname}/dist`;
const assetsDest = `${__dirname}/dist/assets`;
const iconsDest = `${__dirname}/dist/snippets`;

const log = console.log.bind(console);

function copyFile(src, dest) {
    if (!fs.existsSync(dest)) {
        // If the destination file doesn't exist
        try {
            fs.linkSync(src, dest);
            log(`${src} didn't exist copied to ${dest}`);
        } catch (error) {
            log(error);
        }
        // Check for existing hard link
    } else if (fs.statSync(dest).ino === fs.statSync(src).ino) {
        log(`${dest} is linked so wasn't copied`);
    } else {
        // Remove existing file and sync the new one
        try {
            fs.unlinkSync(dest);
            fs.linkSync(src, dest);
            log(`${dest} deleted and linked to new file from ${src}`);
        } catch (error) {
            log(error);
        }
    }
}

function copyIcon(src, dest) {
    if (!fs.existsSync(dest)) {
        try {
            fs.copyFileSync(src, dest);
        } catch (error) {
            log(`${dest} could not be copied`);
        }
    }
}

function deleteFile(dest) {
    if (fs.existsSync(dest)) {
        try {
            fs.unlinkSync(dest);
            log(`Deleted ${dest}`);
        } catch (error) {
            log(`${dest} could not be deleted`, error);
        }
    }
}

function getFlatDest(pathName) {
    return `${assetsDest}/${path.basename(pathName)}`
}

function getFlatIconDest(pathName) {
    return `${iconsDest}/icon-${path.basename(pathName, '.svg')}.liquid`
}

function getParentAndFile(pathName) {
    if (path.basename(path.dirname(pathName)) !== 'customers') {
        return `${liquidDest}/${path.basename(path.dirname(pathName))}/${path.basename(pathName)}`
    } else {
        return `${liquidDest}/templates/customers/${path.basename(pathName)}`
    }
}

themeWatcher
    .on('add', filepath => copyFile(filepath, getParentAndFile(filepath)))
    .on('change', filepath => copyFile(filepath, getParentAndFile(filepath)))
    .on('unlink', filepath => deleteFile(getParentAndFile(filepath)));

assetsWatcher
    .on('add', filepath => copyFile(filepath, getFlatDest(filepath)))
    .on('change', filepath => copyFile(filepath, getFlatDest(filepath)))
    .on('unlink', filepath => deleteFile(getFlatDest(filepath)));

iconWatcher
    .on('add', filepath => copyIcon(filepath, getFlatIconDest(filepath)))
    .on('change', filepath => copyIcon(filepath, getFlatIconDest(filepath)))
    .on('unlink', filepath => deleteFile(getFlatIconDest(filepath)));

// load the config file next to the current script;
// the provided config object has the same effect as passing "--format es"
// on the command line and will override the format of all outputs
loadConfigFile(path.resolve(__dirname, 'rollup.config.js')).then(
    async ({options, warnings}) => {
        // "warnings" wraps the default `onwarn` handler passed by the CLI.
        // This prints all warnings up to this point:
        console.log(`We currently have ${warnings.count} warnings`);

        // This prints all deferred warnings
        warnings.flush();
        // options is an array of "inputOptions" objects with an additional "output"
        // property that contains an array of "outputOptions".
        // The following will generate all outputs for all inputs, and write them to disk the same
        // way the CLI does it:
        for (const optionsObj of options) {
            const bundle = await rollup.rollup(optionsObj);
            await Promise.all(optionsObj.output.map(bundle.write));
        }

        // You can also pass this directly to "rollup.watch"
        rollup.watch(options);
    }
);

if (!fs.existsSync(`${__dirname}/tmp`)) {
    fs.mkdirSync(`${__dirname}/tmp`)
}

themeKit.command('watch', {
    env: process.env.NODE_ENV,
    notify: `${__dirname}/tmp/themeWatchNotify`,
})

bs.init(bsConfig)
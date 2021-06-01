'use strict'
const cp = require("child_process")
const chokidar = require("chokidar")
const path = require("path")
const fs = require("fs")

const themeSrcDirectories = [`${__dirname}/src/config/*.json`, `${__dirname}/src/locales/*.json`, `${__dirname}/src/snippets/*.liquid`, `${__dirname}/src/sections/*.liquid`, `${__dirname}/src/layout/*.liquid`, `${__dirname}/src/templates/*.liquid`]
const liquidTargetDirectories = [`${__dirname}/dist/snippets`, `${__dirname}/dist/sections`, `${__dirname}/dist/layout`, `${__dirname}/dist/templates`, `${__dirname}/dist/config`, `${__dirname}/dist/locales`]

for (let dir of liquidTargetDirectories) {
    fs.stat(dir, (error) => {
        if (error) {
            fs.mkdir(dir, (error) => {
                if (error) {
                    log(error)
                } else {
                    log(`Created ${dir}`)
                }
            })
        }
    })
}

const themeWatcher = chokidar.watch(themeSrcDirectories, {
    watch: true,
    ignoreInitial: false,
    awaitWriteFinish: {
        stabilityThreshold: 500
    }
});

const assetsWatcher = chokidar.watch(['./src/assets/**/*'], {
    watch: true,
    ignoreInitial: false,
    awaitWriteFinish: {
        stabilityThreshold: 1000
    }
});

const iconWatcher = chokidar.watch('./src/icons/**/*.svg', {
    watch: true,
    ignoreInitial: false,
    awaitWriteFinish: {
        stabilityThreshold: 200
    }
});

const liquidDest = `${__dirname}/dist`;
const assetsDest = `${__dirname}/dist/assets`;
const iconsDest = `${__dirname}/dist/snippets`;

const log = console.log.bind(console);

function copyFile(src, dest) {
    if (fs.statSync(dest).ino !== fs.statSync(src).ino) {
        try {
            fs.linkSync(src, dest);
            log(`${src} was out of sync and copied to ${dest}`);
        } catch (error) {
            log(error);
        }
    } else {
        log(`${dest} is up to date so wasn't copied`);
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
    return `${liquidDest}/${path.basename(path.dirname(pathName))}/${path.basename(pathName)}`
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

run("rollup");
run("theme-watch");
run("browser-sync");

function run(scriptName) {
    cp.spawn("npm", ["run", scriptName], {stdio: "inherit"});
}
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

const themeSrcDirectories = [`${__dirname}/src/config/*.json`, `${__dirname}/src/locales/*.json`, `${__dirname}/src/snippets/*.liquid`, `${__dirname}/src/sections/*.liquid`, `${__dirname}/src/layout/*.liquid`, `${__dirname}/src/templates/**/*.liquid`];
const liquidTargetDirectories = [`${__dirname}/dist`, `${__dirname}/dist/assets`, `${__dirname}/dist/snippets`, `${__dirname}/dist/sections`, `${__dirname}/dist/layout`, `${__dirname}/dist/templates`, `${__dirname}/dist/templates/customers`, `${__dirname}/dist/config`, `${__dirname}/dist/locales`];

const createDist = async function () {
    for (let dir of liquidTargetDirectories) {
        try {
            fs.mkdirSync(dir)
        } catch (error) {
            throw error
        }
    }
}

createDist().then(() => init());

function init() {
    const assetsWatcher = chokidar.watch(`${__dirname}/src/assets/**/*`, {
        watch: true,
        ignoreInitial: false,
        awaitWriteFinish: {
            stabilityThreshold: 2000
        }
    });

    const themeWatcher = chokidar.watch(['./src/icons/*.svg', ...themeSrcDirectories], {
        watch: true,
        ignoreInitial: false
    });

    const distWatcher = chokidar.watch('./dist/**/*', {
        watch: true,
        ignoreInitial: true
    });

    const liquidDest = `${__dirname}/dist`;
    const assetsDest = `${__dirname}/dist/assets`;
    const iconsDest = `${__dirname}/dist/snippets`;

    const log = console.log.bind(console);

    function copyFile(src, dest) {
        fs.copyFile(src, dest, (err) => {
            if (err) {
                console.error(err)
                return
            }
        })
    }

    function deleteFile(path) {
        fs.unlink(path, (err) => {
            if (err) {
                console.error(err)
                return
            }
        })
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

    function getParentAndFileForUpload(pathName) {
        if (path.basename(path.dirname(pathName)) !== 'customers') {
            return `${path.basename(path.dirname(pathName))}/${path.basename(pathName)}`
        } else {
            return `templates/customers/${path.basename(pathName)}`
        }
    }

    const debounce = (callback, wait) => {
        let timeoutId = null;
        return (...args) => {
            global.clearTimeout(timeoutId);
            timeoutId = global.setTimeout(() => {
                callback.apply(null, args);
            }, wait);
        };
    }

    let wasAddLast = null;
    let add = [];
    let remove = [];
    let finalThemeKit = [];

    const limitUploads = debounce(() => {
        if (add.length > 0) {
            finalThemeKit.push({
                event: 'add',
                dirs: [...new Set(add)]
            })
        } else if (remove.length > 0) {
            finalThemeKit.push({
                event: 'remove',
                dirs: [...new Set(remove)]
            })
        }
        updateTheme(finalThemeKit);
        add = [];
        remove = [];
        finalThemeKit = [];
    }, 320)

    function handleFiles(e, dir) {
        log('handle:', e, dir)
        if (e === 'add' || e === 'change') {
            if (wasAddLast === 'false') {
                finalThemeKit.push({
                    event: 'remove',
                    dirs: [...new Set(remove)]
                })
                remove = [];
            }
            add.push(getParentAndFileForUpload(dir))
            wasAddLast = 'true';
        }

        if (e === 'unlink') {
            if (wasAddLast === 'true') {
                finalThemeKit.push({
                    event: 'add',
                    dirs: [...new Set(add)]
                })
                add = [];
            }
            remove.push(getParentAndFileForUpload(dir))

            wasAddLast = 'false';
        }

        limitUploads()

    }

    async function updateTheme(arrayOfDirectories) {
        log('update:', arrayOfDirectories);

        for (const dirObj of arrayOfDirectories) {
            if (dirObj.event === 'add' && dirObj.dirs.length > 0) {
                await themeKit.command('deploy', {
                    env: process.env.NODE_ENV,
                    files: dirObj.dirs,
                })
            }
            if (dirObj.event === 'remove' && dirObj.dirs.length > 0) {
                await themeKit.command('remove', {
                    env: process.env.NODE_ENV,
                    files: dirObj.dirs,
                })
            }
        }
    }

    themeWatcher
        .on('add', filepath => copyFile(filepath, path.basename(path.dirname(filepath)) === 'icons' ? getFlatIconDest(filepath) : getParentAndFile(filepath)))
        .on('change', filepath => copyFile(filepath, path.basename(path.dirname(filepath)) === 'icons' ? getFlatIconDest(filepath) : getParentAndFile(filepath)))
        .on('unlink', filepath => deleteFile(getParentAndFile(filepath)));

    assetsWatcher
        .on('add', filepath => copyFile(filepath, getFlatDest(filepath)))
        .on('change', filepath => copyFile(filepath, getFlatDest(filepath)))
        .on('unlink', filepath => deleteFile(getFlatDest(filepath)));

    distWatcher
        .on('all', handleFiles)

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

            try {

                for (const optionsObj of options) {
                    const bundle = await rollup.rollup(optionsObj);
                    await Promise.all(optionsObj.output.map(bundle.write));
                }

                // You can also pass this directly to "rollup.watch"
                rollup.watch(options)
                console.log('Rollup Watching...')
            } catch (error) {
                console.log(error)
            }
        }
    );

    if (!fs.existsSync(`${__dirname}/tmp`)) {
        fs.mkdirSync(`${__dirname}/tmp`)
    }

    function uploadFile(files) {
        themeKit.command('deploy', {
            env: process.env.NODE_ENV,
            files: files,
        })
    }

    function removeFile(files) {
        themeKit.command('remove', {
            env: process.env.NODE_ENV,
            files: files,
        })
    }

    bs.init(bsConfig);
}
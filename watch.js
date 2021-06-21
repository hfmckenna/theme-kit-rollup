'use strict'
const nodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;
const chokidar = require('chokidar')
const path = require('path')
const fs = require('fs')
const rollup = require('rollup')
const themeKit = require('@shopify/themekit')
const bs = require('browser-sync').create()
const bsConfig = require('./bs-config')
const postcss = require("rollup-plugin-postcss")

const production = process.env.NODE_ENV === 'production';

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

    const rollupWatcher = chokidar.watch('./src/scripts/**/*.js', {
        watch: true,
        ignoreInitial: true
    });

    const styleWatcher = chokidar.watch('./src/styles/**/*.css', {
        watch: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 2000
        }
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
                bs.reload()
            }
            if (dirObj.event === 'remove' && dirObj.dirs.length > 0) {
                await themeKit.command('remove', {
                    env: process.env.NODE_ENV,
                    files: dirObj.dirs,
                })
                bs.reload()
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

    rollupWatcher
        .on('all', build)

    styleWatcher
        .on('all', styles)

    distWatcher
        .on('all', handleFiles)

    async function build() {
        // create a bundle
        const bundle = await rollup.rollup({
            input: "./src/scripts/theme.js", plugins: [
                nodeResolve(),
            ]
        });

        console.log(bundle.watchFiles); // an array of file names this bundle depends on

        // or write the bundle to disk
        await bundle.write({
            file: 'dist/assets/theme.js',
            sourcemap: true,
            format: 'iife',
        });

        // closes the bundle
        await bundle.close();
    }

    async function styles(event) {
        // create a bundle
        console.log(event)
        try {
            const bundle = await rollup.rollup({
                input: "src/styles/theme.css",
                plugins: [
                    postcss({
                            extract: true,
                            minimize: production,
                            sourceMap: !production,
                            config: {
                                path: './postcss.config.js'
                            }
                        }
                    ),
                ]
            });

            console.log(bundle.watchFiles); // an array of file names this bundle depends on

            // or write the bundle to disk
            await bundle.write({
                file: "dist/assets/theme.css"
            });

            // closes the bundle
            await bundle.close();
            bs.reload()

        } catch (error) {
            throw new Error(error)
        }
    }


    if (!fs.existsSync(`${__dirname}/tmp`)) {
        fs.mkdirSync(`${__dirname}/tmp`)
    }

    bs.init(bsConfig);

}
'use strict'
const path = require('path')
const fs = require('fs')
const themeKit = require('@shopify/themekit')
const loadConfigFile = require('rollup/dist/loadConfigFile')
const rollup = require('rollup')
const glob = require('glob')

try {
    fs.rmdirSync(`${__dirname}/dist`, {recursive: true});
    console.log(`${__dirname}/dist is deleted!`);
} catch (err) {
    console.error(`Error while deleting ${__dirname}/dist`);
}

const themeSrcDirectories = [`${__dirname}/src/config/*.json`, `${__dirname}/src/locales/*.json`, `${__dirname}/src/snippets/*.liquid`, `${__dirname}/src/sections/*.liquid`, `${__dirname}/src/layout/*.liquid`, `${__dirname}/src/templates/**/*.liquid`]
const liquidTargetDirectories = [`${__dirname}/dist`, `${__dirname}/dist/assets`, `${__dirname}/dist/snippets`, `${__dirname}/dist/sections`, `${__dirname}/dist/layout`, `${__dirname}/dist/templates`, `${__dirname}/dist/templates/customers`, `${__dirname}/dist/config`, `${__dirname}/dist/locales`]

for (let dir of liquidTargetDirectories) {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir)
        } catch (error) {
            console.error(error)
        }
    }
}

const liquidDest = `${__dirname}/dist`;
const assetsDest = `${__dirname}/dist/assets`;
const iconsDest = `${__dirname}/dist/snippets`;

const log = console.log.bind(console);

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

themeSrcDirectories.forEach(dir => {
    glob(dir, function (er, files) {
        for (let file of files) {
            copyFile(file, getParentAndFile(file))
        }
    })
})

glob('./src/assets/**/*', function (er, files) {
    for (let file of files) {
        copyFile(file, getFlatDest(file))
    }
})

glob('./src/icons/**/*.svg', function (er, files) {
    for (let file of files) {
        copyIcon(file, getFlatIconDest(file))
    }
})

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
            log(`${dest} deleted and overwritten`);
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

loadConfigFile(path.resolve(__dirname, 'rollup.config.js'), {format: 'es'}).then(
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

        themeKit.command('deploy', {
            env: process.env.NODE_ENV,
            noDelete: true
        })
        .catch(error => console.log(error))
    }
);

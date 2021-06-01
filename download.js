'use strict'
const fs = require("fs")
const themeKit = require('@shopify/themekit')

async function transferIcons() {
    function callback(err) {
        if (err) throw err
    }

    const files = fs.readdirSync(`${__dirname}/src/snippets/`).filter(file => file.startsWith('icon-') && file.endsWith('.liquid'))

    for (let file of files) {
        let svgFileName = file.replace(/^icon-/g, '').replace(/.liquid$/g, '.svg')
        await fs.copyFile(`${__dirname}/src/snippets/${file}`, `${__dirname}/src/icons/${svgFileName}`, callback);
        await fs.unlink(`${__dirname}/src/snippets/${file}`, callback);
    }
}

themeKit.command('download', {
    env: process.env.NODE_ENV,
    dir: 'src'
})
    .then(() => transferIcons())
    .catch(error => console.log(error))

function getFlatIconDest(pathName) {
    return `${iconsDest}/icon-${path.basename(pathName, '.svg')}.liquid`
}
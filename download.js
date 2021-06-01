'use strict'
const fs = require("fs")
const themeKit = require('@shopify/themekit')

async function transferIcons() {
    const files = fs.readdirSync(`${__dirname}/src/snippets/`).filter(file => file.startsWith('icon-') && file.endsWith('.liquid'))

    for (let file of files) {
        function callback(err) {
            if (err) throw err
            else {
                fs.unlinkSync(`${__dirname}/src/snippets/${file}`);
            }
        }
        let svgFileName = file.replace(/^icon-/g, '').replace(/.liquid$/g, '.svg')
        fs.copyFile(`${__dirname}/src/snippets/${file}`, `${__dirname}/src/icons/${svgFileName}`, callback);
    }
}

themeKit.command('download', {
    env: process.env.NODE_ENV,
    dir: 'src'
})
    .then(() => transferIcons())
    .catch(error => console.log(error))
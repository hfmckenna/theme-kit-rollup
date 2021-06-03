import commonjs from "@rollup/plugin-commonjs";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import {terser} from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";
import del from 'rollup-plugin-delete';

const production = process.env.NODE_ENV === 'production';

let minifiedThemeOutput = [{
    file: 'dist/assets/theme.min.js',
    sourcemap: false,
    format: 'iife',
    name: 'Theme',
    plugins: [terser(),]
}];

let themeOutput = [{
    file: 'dist/assets/theme.js',
    sourcemap: !production,
    format: 'iife',
    name: 'Theme',
}, ...(production ? minifiedThemeOutput : [])];

let minifiedVendorOutput = [{
    file: 'dist/assets/vendor.min.js',
    sourcemap: false,
    format: 'iife',
    name: 'Theme',
    plugins: [terser()]
}];

let vendorOutput = [{
    file: 'dist/assets/vendor.js',
    sourcemap: !production,
    format: 'iife',
    name: 'Theme',
}, ...(production ? minifiedVendorOutput : [])];

export default [
    {
        input: "src/styles/theme.css",
        output: {
            file: "dist/assets/theme.css",
        },
        plugins: [
            del({targets: ['dist/assets/theme.min.css', 'dist/assets/theme.css']}),
            postcss({
                    extract: true,
                    sourceMap: !production,
                    minimize: production,
                    config: {
                        path: "./postcss.config.js",
                    },
                }
            ),
        ],
    },
    {
        input: "src/scripts/vendor.js",
        output: vendorOutput,
        plugins: [
            del({
                targets: ['dist/assets/vendor.min.js', 'dist/assets/vendor.min.js.map', 'dist/assets/vendor.js', 'dist/assets/vendor.js.map'],
                runOnce: true
            })
        ],
    },
    {
        input: "src/scripts/theme.js",
        output: themeOutput,
        plugins: [
            del({
                targets: ['dist/assets/theme.min.js', 'dist/assets/theme.min.js.map', 'dist/assets/theme.js', 'dist/assets/theme.js.map'],
                runOnce: true
            }),
            nodeResolve({}),
            commonjs({}),
        ],
    }
];

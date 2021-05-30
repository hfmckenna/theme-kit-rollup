import commonjs from "@rollup/plugin-commonjs";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import {terser} from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";

const production = !process.env.ROLLUP_WATCH;

let minifiedOutput = [{
    file: 'dist/assets/theme.min.js',
    sourcemap: false,
    format: 'iife',
    name: 'Theme',
    plugins: [terser()]
}];

let themeOutput = [{
    file: 'dist/assets/theme.js',
    sourcemap: true,
    format: 'iife',
    name: 'Theme',
}, ...(production ? minifiedOutput : [])];

export default [
    {
        input: "src/styles/theme.css",
        output: {
            file: "dist/assets/theme.css",
            sourcemap: !production,
        },
        plugins: [
            postcss({
                    extract: true,
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
        output: {
            file: "dist/assets/vendor.js",
            sourcemap: !production,
            format: 'iife',
            compact: production
        },
        plugins: [
            terser()
        ],
    },
    {
        input: "src/scripts/theme.js",
        output: themeOutput,
        plugins: [
            nodeResolve({
                dedupe: ['@shopify/theme-a11y', '@shopify/theme-cart', '@shopify/theme-currency', '@shopify/theme-images', '@shopify/theme-product', '@shopify/theme-sections']
            }),
            commonjs({}),
        ],
    }
]
;
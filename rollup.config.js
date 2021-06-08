import commonjs from "@rollup/plugin-commonjs";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import {terser} from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";

const production = process.env.NODE_ENV === 'production';

let minifiedThemeOutput = [{
    file: 'dist/assets/theme.min.js',
    sourcemap: false,
    format: 'iife',
    plugins: [terser()]
}];

let themeOutput = [{
    file: 'dist/assets/theme.js',
    sourcemap: true,
    format: 'iife',
}, ...(production ? minifiedThemeOutput : [])];

export default [
    {
        input: "src/styles/theme.css",
        output: {
            file: "dist/assets/theme.css",
        },
        plugins: [
            postcss({
                    extract: true,
                    minimize: production,
                    sourceMap: !production,
                    config: {
                        path: "./postcss.config.js",
                    },
                }
            ),
        ],
    },
    {
        input: "src/scripts/theme.js",
        output: themeOutput,
        plugins: [
            nodeResolve(),
            commonjs()
        ],
    }
];

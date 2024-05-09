const {nodeResolve} = require("@rollup/plugin-node-resolve")
const commonjs = require("@rollup/plugin-commonjs")
const terser = require("@rollup/plugin-terser")
const json = require("@rollup/plugin-json")

const plugins = [
    nodeResolve(),
    commonjs(),
	json(),
    // terser()
]
// npm i -D rollup @rollup/plugin-commonjs @rollup/plugin-node-resolve @rollup/plugin-terser @rollup/plugin-json
// 打包后就可以舍弃node_modules了
module.exports = [
    {
        input: "./parser.js",
        output: {
            file: "./parser.build.js",
            format: "cjs",
            exports: "auto",
            sourcemap: false
        },
        plugins: [
            ...plugins
        ]
    }
]

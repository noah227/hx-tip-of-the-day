const cozip = require("cozip")
const publishName = `${require("./package.json").name}.zip`

;(() => {
    cozip(publishName, [
        ["./extension.js", false],
        ["./config.helper.js", false], 
        ["./main.js", false],
        ["./main.utils.js", false],
        ["./styles.css", false],
        ["./package.json", false],
        ["./node_modules/hx-configuration-helper", true],
        ["./parser.build.js", false],
        ["./tips", true],
    ], err => {
        if (err) console.error(err)
        else {
            console.log("打包完成, 文件大小", (require("fs").statSync(publishName).size / 1024).toFixed(2), "KB")
        }
    })
})()

const hx = require("hbuilderx")
const {
	marked
} = require("marked")
const fs = require("fs")
const path = require("path")
const {
	showTipDialog,
	getTipContent
} = require("./main.utils.js")

// 其中要注意个静态资源路径替换的问题


const renderTip = (context) => {
	const md = getTipContent()
	showTipDialog(md)
}

module.exports = {
	renderTip
}
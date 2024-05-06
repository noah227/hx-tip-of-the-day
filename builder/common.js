const fs = require("fs")
const path = require("path")
const _ = {
	/**
	 * 文件名修正，以避免非法文件名
	 * @param {string} name
	 */
	fixName(name){
		return name.replaceAll(/[\/\\:*?"<>|]/g, "_s_")
	},
	/**
	 * 只是个检查文件夹是否存在、不存在则创建的函数
	 */
	touchDir(fsPath){
		if(!fs.existsSync(fsPath)) fs.mkdirSync(fsPath)
		return fsPath
	},
	/**
	 * 提取markdown内容，以`##`级别进行断落划分
	 * @return {{id: string, stackList: string[]}[][]}
	 */
	extractMd(mdPath){
		const mdContent = fs.readFileSync(mdPath, {encoding: "utf8"})
		const mdStack = []
		let currentStack = {id: "", stackList: []}
		let stackStart = false
		mdContent.split("\n").forEach(line => {
			if(line.startsWith("##")) {
				stackStart = true
				if(currentStack.id) mdStack.push({...currentStack})
				currentStack = {id: line, stackList: []}
			}
			if(!stackStart) return
			currentStack.stackList.push(line)
		})
		console.log(`读取${mdPath}, 共计${mdStack.length}条，分别为：\n${mdStack.map(stack => stack.id).join("\n")}`)
		return mdStack
	}
}

module.exports = _
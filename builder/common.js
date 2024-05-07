const fs = require("fs")
const path = require("path")

/**
 * 过滤有效的文件夹
 * @param {string[]} dir
 * @param {(p, d) => boolean} extraFilter 额外的过滤
 */
const filterDirs = (sList, cwd=null, extraFilter=null) => {
	extraFilter = extraFilter || ((p, d) => true)
	return sList.filter(s => {
		const p = cwd ? path.resolve(cwd, s) : s
		return fs.statSync(p).isDirectory() && extraFilter(p, s)
	})
}

/**
 * 文件名修正，以避免非法文件名
 * @param {string} name
 */
const fixName = (name) => name.replaceAll(/[\/\\:*?"<>|]/g, "_s_")

/**
 * 因为官方文档的原始md内容的部分标题里是有@标注（id标记）的，不需要展示出来
 * @param {string} id
 */
const fixId = (id) => {
	const atIndex = id.lastIndexOf("@")
	return atIndex > 0 ? id.slice(0, atIndex) : id
}

const _ = {
	fixName,
	/**
	 * 只是个检查文件夹是否存在、不存在则创建的函数
	 * @param {string} fsPath 文件路径
	 * @param {boolean} destroyMode 如果存在，先销毁，然后再创建
	 */
	touchDir(fsPath, destroyMode=false){
		if(destroyMode && fs.existsSync(fsPath)) fs.rmSync(fsPath, {recursive: true})
		if(!fs.existsSync(fsPath)) fs.mkdirSync(fsPath)
		return fsPath
	},
	filterDirs,
	/**
	 * 读取并过滤有效的文件夹
	 * @param {string[]} dir
	 * @param {(p, d: string) => boolean} extraFilter 额外的过滤
	 */
	readAndfilterDirs(dir, extraFilter=null){
		return filterDirs(fs.readdirSync(dir), dir, extraFilter)
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
			line = fixId(line)
			// table行修复（因为官方文档的md中table的写法不能够被marked直接识别出来，需要处理下）
			if(/\|(-+\s+\|)+/.test(line)) line = line.replaceAll(/\s+/g, "")
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
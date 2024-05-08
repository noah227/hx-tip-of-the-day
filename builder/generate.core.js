const fs = require("fs")
const path = require("path")
const {execSync} = require("child_process")

const {fixName, touchDir, extractMd, readAndfilterDirs} = require("./common")
const generateConfig = require("./generate.config")

// 拉取内存存储路径
const docsPath = path.resolve(__dirname, "docs")
// 临时输出文件夹
const outDir = touchDir(path.resolve(__dirname, "out"), true)
// 临时图片输出文件夹
const imgDir = touchDir(path.resolve(outDir, "images"))
// 临时md输出文件夹
const mdOuterDir = touchDir(path.resolve(outDir, "markdowns"))
const options = {cwd: path.resolve(__dirname)}

// 从git拉取部分官方文档内容
const cloneFromGit = () => {
	if(fs.existsSync(docsPath)) fs.rmSync(docsPath, {recursive: true})
	// const docsGit = "https://github.com/dcloudio/hbuilderx-extension-docs.git"
	console.log("从git拉取文件中...")
	const docsGit = "https://gitee.com/noah227/hbuilderx-extension-docs.git"
	execSync(`git clone --filter=blob:none --sparse ${docsGit} docs`, options)
	const optionsNew = {cwd: path.resolve(__dirname, "docs")}
	execSync(`git sparse-checkout set `, optionsNew)
	const sparseDirList = ["zh-cn/Tutorial/UserGuide", "static/snapshots"]
	const sparseDirs = sparseDirList.join(" ")
	execSync(`git sparse-checkout add ${sparseDirs}`, optionsNew)
	console.log(`已拉取官方教程文件（sparse-checkout：）${sparseDirs}\n`)
}

const extractAndCopy = (extracOnly=false) => {
	console.log("开始生成文件列表")
	const tutorialPath = path.resolve(__dirname, "docs/zh-cn/Tutorial") 
	// 目前只提取了 高效极客技巧 这一部分
	const {allowedList} = generateConfig.docs
	const userGuidePath = path.resolve(tutorialPath, "UserGuide")
	const mdList = fs.readdirSync(userGuidePath).filter(s => s.endsWith(".md") && allowedList.includes(s))
	console.log(`已获取markdown文件列表：\n${mdList.join("\n")}`)
	const mdContentList = mdList.map(md => extractMd(path.resolve(userGuidePath, md)))
	console.log(`已读取markdown文件内容`, mdContentList)
	if(extracOnly) return mdContentList
	
	// 输出md到临时文件夹
	mdContentList.forEach(list => {
		list.forEach(({id, stackList}) => {
			const mdName = fixName(id.replace(/#+\s*/, "").replace("\r", ""))
			// 官方教程的，加上下划线前缀
			const mdDir = touchDir(path.resolve(mdOuterDir, "_" + mdName))
			const mdPath = path.resolve(mdDir, "tip.md")
			fs.writeFileSync(mdPath, [...stackList].join("\n"), {encoding: "utf8"})
		})
	})
}

module.exports = {
	cloneFromGit,
	extractAndCopy,
	copyImages(){
		const mdContentList = extractAndCopy(true)
		// 提取并处理图片列表
		const imgList = mdContentList.reduce((imgList, list) => {
			for(let i = 0; i < list.length; i ++) {
				const mdContent = list[i].stackList.join("\n")
				// /static/snapshots/tutorial/explorer/explorer_2.png
				const reg = /\/static\/(\w+\/)*([\w-]+)\.([\.\w]*)/g
				while (true) {
					const imgMatch = reg.exec(mdContent)
					if(!imgMatch) break
					const imgPath = imgMatch[0]
					console.log(`已匹配`, imgPath)
					const imgName = imgMatch[2], imgExt = imgMatch[3]
					imgList.push(imgPath)
				}
			}
			return imgList
		}, [])
		console.log(`共计${imgList.length}张文件图片资源匹配`, imgList)
		console.log("开始图片复制")
		// 加载资源替换配置
		const replacement = require("./media.replacement/replacement.json")
		// 开始图片复制
		imgList.forEach(imgPath => { 
			const imgSource = replacement[imgPath] ? path.resolve(__dirname, `media.replacement/medias/${replacement[imgPath]}`) : path.join(docsPath, imgPath)
			const imgDestination = path.resolve(imgDir, path.basename(imgPath))
			console.log(`复制：从 ${path.relative(__dirname, imgSource)} 到 ${path.relative(__dirname, imgDestination)}`)
			fs.cpSync(imgSource, imgDestination)
		})
		console.log("图片复制结束")
	},
	/**
	 * 迁移内容到发布文件夹
	 */
	migrate(){
		console.warn("！！！迁移操作不会自动清空目标文件夹内容，如有需要，进行手动清除")
		touchDir(path.resolve(__dirname, "../tips"))
		console.log("开始迁移图片")
		fs.cpSync(imgDir, touchDir(path.resolve(__dirname, "../tips/images")), {recursive: true})
		console.log("开始迁移markdown文件")
		fs.cpSync(mdOuterDir, touchDir(path.resolve(__dirname, "../tips/markdowns")), {recursive: true})
		console.log("迁移结束")
	},
	/**
	 * 处理自定义tip文件
	 */
	processCustomized(){
		const uuid = require("uuid") 
		// 自定义tip源根路径
		const customizedRoot = path.resolve(__dirname, "customized")
		const isProduction = process.env.NODE_ENV === "production"
		const dirs = readAndfilterDirs(customizedRoot, (p, d) => {
			return d !== "template" && (isProduction ? !d.startsWith("test_") : true)
		})
		const contentList = []
		// 临时输出文件夹
		const customizedOutDir = touchDir(path.resolve(outDir, "customized"))
		
		const copyMediasFull = []
		// md临时输出文件夹
		const customizedOutMdDir = touchDir(path.resolve(customizedOutDir, "markdowns"))
		// 文件名随机化防冲突处理
		dirs.forEach(d => {
			const copyMedias = []
			const mdPath = path.resolve(customizedRoot, d, "tip.md")
			const mdContent = fs.readFileSync(mdPath, {encoding: "utf8"})
			const mdContentProcessed = mdContent.split("\n").map(line => {
				const regMatch = /(\.\/)?(tip_files\/)(\w+)\.(\w+)/.exec(line)
				if(regMatch) {
					const name = regMatch[3], ext = regMatch[4]
					const rename = uuid.v4()
					copyMedias.push([rename, name, ext])
					return line.replace(name, rename)
				}
				return line
			}).join("\n")
			copyMediasFull.push({id: d, mediaList: copyMedias})
			const currentOutDir = touchDir(path.resolve(customizedOutMdDir, d))
			fs.writeFileSync(path.resolve(currentOutDir, "tip.md"), mdContentProcessed, {encoding: "utf-8"})
		})
		// 图片临时输出文件夹
		const imageOutDir = touchDir(path.resolve(customizedOutDir, "images"))
		copyMediasFull.forEach(({id, mediaList}) => {
			mediaList.forEach(([rename, name, ext]) => {
				const fileSource = path.resolve(customizedRoot, id, `tip_files/${name}.${ext}`)
				const fileDestination = path.resolve(imageOutDir, `${rename || name}.${ext}`)
				console.log(`复制：从${path.relative(__dirname, fileSource)} 到 ${path.relative(__dirname, fileDestination)}`)
				fs.cpSync(fileSource, fileDestination)
			})
		})
	},
	/**
	 * 文件迁移
	 */
	migrateCustomized(){
		console.warn("！！！迁移操作不会自动清空目标文件夹内容，如有需要，进行手动清除")
		console.log("开始迁移图片") 
		fs.cpSync(path.resolve(outDir, "customized/images"), touchDir(path.resolve(__dirname, "../tips/images")), {recursive: true})
		console.log("开始迁移markdown文件")
		fs.cpSync(path.resolve(outDir, "customized/markdowns"), touchDir(path.resolve(__dirname, "../tips/markdowns")), {recursive: true})
		console.log("迁移结束")
	}
} 
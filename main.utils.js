const fs = require("fs")
const hx = require("hbuilderx")
const path = require("path")
const parser = require("./parser.build")
const {Helper} = require("hx-configuration-helper")
const keyMap = require("./config.helper") 

const helper = new Helper(__dirname)
const excludeList = ["template"]

const tipsRoot = path.resolve(__dirname, "tips")
const markdownDir = path.resolve(tipsRoot, "markdowns")
const imagesDir = path.resolve(tipsRoot, "images")
/**
 * 加载tips列表
 * 在排除列表的会排除
 * 以`test-`开头的也会排除
 */
const loadRenderList = () => {
	return fs.readdirSync(markdownDir).filter(d => {
		return excludeList.indexOf(d) < 0 && fs.statSync(path.resolve(markdownDir, d)).isDirectory() && !d
			.startsWith("test-")
	})
}


const pkgId = require("./package.json").id
/**
 * 获取上一次tip的索引
 */
const loadLastTipIndex = () => {
	const index = hx.workspace.getConfiguration(pkgId).get("tipIndex", 0)
	return index
}

/**
 * @param {number} listLength tips列表长度
 */
const getCurrentTipIndex = (listLength, delta = 0) => {
	if (useRandomIndex()) {
		return Math.floor(Math.random() * listLength)
	}
	const lastIndex = loadLastTipIndex()
	const tipIndex = lastIndex + delta
	if (tipIndex < 0) return listLength - 1
	// 防止文件数量变动导致的索引越界的情况
	return tipIndex < listLength ? tipIndex : 0
}

const useRandomIndex = () => {
	return hx.workspace.getConfiguration(pkgId).get("useRandomIndex")
}

/**
 * 保存索引位置
 * HBuilderX支持隐藏的pluginConfig配置
 * @param {number} index
 */
const saveTipIndex = (index) => {
	hx.workspace.getConfiguration(pkgId).update("tipIndex", index)
}

const getTipContent = (delta = 1) => {
	const tipsList = loadRenderList()
	const tipIndex = getCurrentTipIndex(tipsList.length, delta)
	saveTipIndex(tipIndex)
	const tipName = tipsList[tipIndex]
	// 当前tip文件夹
	const tipDir = path.resolve(markdownDir, tipName)
	// 当前md路径
	const tipPath = path.resolve(tipDir, "tip.md")
	const content = fs.readFileSync(tipPath, {
		encoding: "utf8"
	})
	// 安全处理并进行src修正
	return parser(content, true).replaceAll(/(src=")(tip_files)?\/(\w+\/)*([\w-]+\.\w+)/g, `$1${imagesDir}/$4`)
}

const getWindowSize = () => {
	const sizeS = helper.getItem(keyMap.webviewSize)
	let w = 720, h = 520
	try {
		let [_w, _h] = sizeS.trim().split(":")
		_w = parseInt(_w), _h = parseInt(_h)
		w = _w || w
		h = _h || h
	}
	catch(e){
		console.error(e)
	}
	return [w, h]
}

const showTipDialog = (content, isLaunchTriggered) => {
	let buttons = ["上一条", "下一条", "关闭"]
	if (isLaunchTriggered) buttons = ["不再展示", ...buttons]
	const [w, h] = getWindowSize()
	let webviewDialog = hx.window.createWebViewDialog({
		modal: false,
		title: "每日小贴士",
		dialogButtons: buttons,
		size: {
			width: w,
			height: h
		}
	}, {
		enableScripts: true
	});

	let webview = webviewDialog.webView;
	setHtml(webview, content)

	webview.onDidReceiveMessage((msg) => {
		console.log(msg)
		switch (msg.command) {
			case "close":
				webviewDialog.close()
				break
			case "dont-show":
				webviewDialog.close()
				hx.workspace.getConfiguration(pkgId).update("activateOnLaunch", false)
				hx.window.showInformationMessage("已设置不再展示，可到插件配置里修改")
				break
			case "show-prev":
				setHtml(webview, getTipContent(-1))
				console.log("上一条")
				break
			case "show-next":
				setHtml(webview, getTipContent(1))
				console.log("下一条")
				break
			case "open-external-link":
				console.log("外链打开", msg.data)
				hx.env.openExternal(msg.data)
				break
		}
	});

	let promi = webviewDialog.show();
	promi.then(function(data) {
		// 处理错误信息
		logLastLaunch()
	});

}

const getRecordPath = () => path.resolve(__dirname, "record.json")
const getRecord = () => {
	const recordPath = getRecordPath()
	return fs.existsSync(recordPath) ? JSON.parse(fs.readFileSync(recordPath, {encoding: "utf8"})) : {}
}
/**
 * 记录上次启动时间
 */
const logLastLaunch = () => {
	const data = getRecord()
	data.lastLaunchTime = Date.now()
	fs.writeFileSync(getRecordPath(), JSON.stringify(data), {encoding: "utf8"})
}

/**
 * @param {any} webview
 * @param {string} htmlContent
 */
const setHtml = (webview, htmlContent) => {
	webview.html = `
	    <html>
		<head>
			<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
			<style>
				${getThemeFit()}
				${getInjectedStyle()}
			</style>
		<head>
		<body>${htmlContent}</body>
	    <script>
	    function initReceive() {
	        hbuilderx.onDidReceiveMessage((msg)=>{
	            if(msg.type == 'DialogButtonEvent'){
	                let button = msg.button;
					if(button == '上一条'){
					    hbuilderx.postMessage({
					        command: 'show-prev'
					    });
					}
					else if(button == '不再展示'){
					    hbuilderx.postMessage({
					        command: 'dont-show'
					    });
					}
	                else if(button == '下一条'){
	                    hbuilderx.postMessage({
	                        command: 'show-next'
	                    });
	                }
					else if(button == '关闭'){
	                    // 关闭
						hbuilderx.postMessage({
	                        command: 'close'
	                    });
	                }
	            }
	        });
	    }
	    window.addEventListener("hbuilderxReady", initReceive);
	    </script>
		<script>
		const hxWebRoot = "https://hx.dcloud.net.cn"
		window.onload = () => {
			document.querySelectorAll("a").forEach(a => {
				a.addEventListener("click", e => {
					let href = a.getAttribute("href") ?? ""
					if(href.startsWith("/")) href = hxWebRoot + href
					hbuilderx.postMessage({
						command: "open-external-link",
						data: href
					});
					e.preventDefault()
				})
			})
		}
		
		document.addEventListener("mousedown", e => {
			// 阻止中键链接跳转
			if(e.button === 1 && e.target.tagName === "A") {
				e.preventDefault()
			}
		})
		</script>
	    </html>
	`
} 

/**
 * 主题适配
 * 直接摘抄自官方文档
 */
const getThemeFit = () => {
	// hx的dialog创建并没有适配主题，只有webview可以适配，会非常丑
	return ""
	var background = '';
	var color = ""
	let config = hx.workspace.getConfiguration();
	let colorScheme = config.get('editor.colorScheme');
	if (colorScheme == 'Monokai') {
		background = 'rgb(39,40,34)'
		color = "#f0f0f0"
	} else if (colorScheme == 'Atom One Dark') {
		background = 'rgb(40,44,53)'
		color = "f0f0f0"
	} else {
		background = 'rgb(255,250,232)'
		color = "#232323"
	};
	const style = `
		body {
			color: ${color};
			background-color: ${background}
		}
	`
	return style
}

const getInjectedStyle = () => {
	return fs.readFileSync(path.resolve(__dirname, "./styles.css"), {encoding: "utf8"})
}

module.exports = {
	loadRenderList,
	getTipContent,
	showTipDialog,
	getRecord,
	h: helper
}
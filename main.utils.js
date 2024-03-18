const fs = require("fs")
const hx = require("hbuilderx")
const path = require("path")
const {
	marked
} = require("marked")

const excludeList = ["template"]
/**
 * 加载tips列表
 */
const loadRenderList = () => {
	const tipsRoot = path.resolve(__dirname, "tips")
	return fs.readdirSync(tipsRoot).filter(d => excludeList.indexOf(d) < 0)
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
	const lastIndex = loadLastTipIndex()
	const tipIndex = lastIndex + delta
	if (tipIndex < 0) return 0
	// 防止文件数量变动导致的索引越界的情况
	return tipIndex < listLength ? tipIndex : 0
}

/**
 * 保存索引位置
 * HBuilderX支持隐藏的pluginConfig配置
 * @param {number} index
 */
const saveTipIndex = (index) => {
	hx.workspace.getConfiguration(pkgId).update("tipIndex", index)
}

const getTipContent = (delta = 0) => {
	const tipsList = loadRenderList()
	const tipIndex = getCurrentTipIndex(tipsList.length, delta)
	saveTipIndex(tipIndex)
	const tipName = tipsList[tipIndex]
	const tipDir = `./tips/${tipName}`
	const tipPath = path.resolve(__dirname, `./${tipDir}/tip.md`)
	const content = fs.readFileSync(tipPath, {
		encoding: "utf8"
	})
	return marked.parse(content).replaceAll("./", path.join(__dirname, tipDir) + "/")
}

const showTipDialog = (content) => {
	let webviewDialog = hx.window.createWebViewDialog({
		modal: false,
		title: "每日一句",
		dialogButtons: [
			"上一条", "下一条", "关闭"
		],
		size: {
			width: 620,
			height: 480
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
			case "show-prev":
				setHtml(webview, getTipContent(-1))
				console.log("上一条")
				break
			case "show-next":
				setHtml(webview, getTipContent(1))
				console.log("下一条")
				break
		}
	});

	let promi = webviewDialog.show();
	promi.then(function(data) {
		// 处理错误信息
	});

}

/**
 * @param {any} webview
 * @param {string} htmlContent
 */
const setHtml = (webview, htmlContent) => {
	webview.html = `
	    <html>
		<head>
			<style>
				body {margin: 0;}
				img {max-width: 100%; object-fit: contain;}
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
	    </html>
	`
}

module.exports = {
	loadRenderList,
	getTipContent,
	showTipDialog
}
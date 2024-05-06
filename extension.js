var hx = require("hbuilderx");
const main = require("./main.js");
const { getRecord, h } = require("./main.utils.js");
const path = require("path")

const pkgId = require(path.resolve(__dirname, "package.json")).id

/**
 * 判断IDE启动（分每次启动和每日首次启动）时是否展示
 * 至于从工具栏的启动不在此处判定
 */
const shallActivateInstantly = () => {
	const keyMap = require("./config.helper.js")
	
	const activateOnLaunch = h.getItem(keyMap.activateOnLaunch)
	// 用户配置了不再主动展示
	if(!activateOnLaunch) return false
	
	const activateWhen = h.getItem(keyMap.activateWhen)
	// 一天只展示一次
	return activateWhen === "每日首次启动时" ? !getIfAlreadyShown() : true
}

const getIfAlreadyShown = () => {
	let ret = false
	const {lastLaunchTime} = getRecord()
	if(!lastLaunchTime) return ret
	try {
		const lastT = new Date(lastLaunchTime)
		const lastM = lastT.getMonth() + 1
		const lastD = lastT.getDate()
		const T = new Date()
		const M = T.getMonth() + 1
		const D = T.getDate()
		// 月日相同即当天启动过
		ret = lastM === M && lastD === D
	}catch(e){console.error(e)}	
	return ret
}

//该方法将在插件激活的时候调用
function activate(context) {
	if(shallActivateInstantly()) { 
		main.renderTip(context, true)
	}
	let disposable = hx.commands.registerCommand('extension.showTip', (ctx) => {
		main.renderTip(ctx)
	});
	//订阅销毁钩子，插件禁用的时候，自动注销该command。
	context.subscriptions.push(disposable);
}
//该方法将在插件禁用的时候调用（目前是在插件卸载的时候触发）
function deactivate() {

}
module.exports = {
	activate,
	deactivate
}
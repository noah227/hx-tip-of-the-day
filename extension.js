var hx = require("hbuilderx");
const main = require("./main.js")

const shallActivateInstantly = () => {
	// 配置
	const activateOnLaunch = hx.workspace.getConfiguration(require("./package.json").id).get("activateOnLaunch")
	return activateOnLaunch
	// 一天只显示一次
	let alreadyShown = false
	const fs = require("fs")
	const path = require("path")
	const _ = path.resolve(__dirname, ".record")
	if(fs.existsSync(_)) {
		const s = fs.readFileSync(_, {encoding: "utf8"}).trim()
		alreadyShown = (Date.now() - new Date(s).getTime()) < 864e5
	}
	return activateOnLaunch && !alreadyShown
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
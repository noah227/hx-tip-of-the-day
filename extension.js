var hx = require("hbuilderx");
const main = require("./main.js")
//该方法将在插件激活的时候调用
function activate(context) {
	if(hx.workspace.getConfiguration(require("./package.json").id).get("activateOnLaunch")) { 
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
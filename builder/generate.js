const inquirer = require("inquirer")

const {cloneFromGit, extractAndCopy, copyImages, migrate, processCustomized, migrateCustomized} = require("./generate.core")

// todo Commander
// cloneFromGit()
// extractAndCopy()
// copyImages()
// migrate()
// processCustomized()
// migrateCustomized()

;(async () => {
	const { actions } = await inquirer.prompt([{
		name: 'actions',
		type: 'checkbox',
		message: `选择要执行的操作（注意有些操作需要前置执行其他操作）`,
		choices: [
			{ name: '从git拉取官方教程文档', value: 'cloneFromGit' },
			{ name: '处理文档内容', value: 'extractAndCopy' },
			{ name: '复制文档图片', value: 'copyImages' },
			{ name: '迁移处理的内容', value: 'migrate' },
			{ name: '处理自定义内容', value: 'processCustomized' },
			{ name: '迁移已处理的自定义内容', value: 'migrateCustomized' },
		]
	}])
	actions.includes("cloneFromGit") && cloneFromGit()
	actions.includes("extractAndCopy") && extractAndCopy()
	actions.includes("copyImages") && copyImages()
	actions.includes("migrate") && migrate()
	actions.includes("processCustomized") && processCustomized()
	actions.includes("migrateCustomized") && migrateCustomized()
})()

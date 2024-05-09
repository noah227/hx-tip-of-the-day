const {marked} = require("marked")
const sanitizeHtml = require("sanitize-html")

/**
 * @param {string} mdContent
 */
module.exports = (mdContent, sanitize=true) => {
	const content = marked.parse(mdContent)
	return sanitize ? sanitizeHtml(content, {
		allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"]
	}) : content
}
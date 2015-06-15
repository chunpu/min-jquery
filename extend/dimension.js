var $ = require('../')
var _ = require('min-util')

_.each('width height'.split(' '), function(type) {
	_.each(['inner', 'outer', ''], function(opt) {

		var funcName = type
		var upper = type.charAt(0).toUpperCase() + type.substr(1)
		if (opt) {
			funcName = opt + upper
		}

		$.fn[funcName] = function() {
			var el = this[0]
			if (!el) return
			var ret = 0
			if ('outer' == opt) {
				ret = el['offset' + upper]
			} else {
				// TODO too complex!
				ret = el['offset' + upper]
			}
			return parseFloat(ret) || 0
		}

	})
})

$.fn.offset = function() {
	var el = this[0]
	if (!el) return
	var offset = el.getBoundingClientRect()
	return _.only(offset, 'left top')
}

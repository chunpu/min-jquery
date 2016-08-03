var _ = require('min-util')
var $ = require('../')

function merge(arr) {
	return _.union.apply(null, arr)
}

var one = {
	children: function(node) {
		var ret = []
		var son = node.firstChild
		for (; son; son = son.nextSibling) {
			if (1 == son.nodeType) {
				ret.push(son)
			}
		}
		return ret
	},
	parent: function(node) {
		return node.parentNode
	}
}

_.each('children parent'.split(' '), function(key) {
	$.fn[key] = function() {
		return merge(_.map(this, function(node) {
			return one[key].apply(null, arguments)
		}))
	}
})

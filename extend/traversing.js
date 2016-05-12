var _ = require('min-util')
var $ = require('../')

function merge(arr) {
	return _.union.apply(null, arr)
}

var one = {
	children: function(node) {
		return node.children
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

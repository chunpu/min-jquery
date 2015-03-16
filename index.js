var _ = require('min-util')
var parse = require('min-parse')
var find = require('min-find')

module.exports = exports = $

var doc = global.document
var is = _.is

function $(val, box) {
	if (is.fn(val)) return $(doc).ready(val)
	if (!(this instanceof $)) return new $(val, box)
	if (!val) return

	if (is.string(val)) {
		if (-1 == val.indexOf('<')) {
			val = find(val, box)
		} else {
			val = parse.html(val)
		}
	}

	if (!is.arraylike(val)) val = [val]
	for (var i = 0; i < val.length; i++) {
		this.push(val[i])
	}
}

_.inherits($, Array)

var proto = $.fn = $.prototype

$.extend = proto.extend = function() {
	var arr = arguments
	if (1 == arr.length) {
		return _.extend(this, arr[0])
	}
	return _.extend.apply(_, arr)
}

$.fn.extend({
	jquery: true
})

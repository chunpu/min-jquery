var $ = require('../')
var _ = require('min-util')

$.extend({
	swap: swap
})

function swap(el, tempStyle, cb, args) {
	var style = el.style
	var keys = _.keys(tempStyle)
	var oldStyle = _.only(style, keys)

	_.extend(style, tempStyle)
	var ret = cb.apply(el, args || [])
	_.extend(style, oldStyle)
	return ret
}

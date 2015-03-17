var _ = require('min-util')
var $ = require('../')

$.fn.extend({
	addClass: function(str) {
		str = _.trim(str)
		return this.each(function() {
			this.className += ' ' + str
		})
	},
	removeClass: function(name) {
		return this.each(function() {
			var arr = getClassList(this.className)
			this.className = _.without(arr, name).join(' ')
		})
	}
})

function getClassList(str) {
	var arr = _.trim(str).split(/ +/)
	return _.uniq(arr)
}

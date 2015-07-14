var _ = require('min-util')
var $ = require('../')

// https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
function ClassList(elem) {}

var proto = ClassList.prototype

_.extend(proto, {
	add: function() {
		var classes = classListGetter(this)
		this.className = _.union(classes, arguments).join(' ')
	},
	remove: function() {
		var classes = classListGetter(this)
		this.className = _.difference(classes, arguments).join(' ')
	},
	contains: function(name) {
		return _.includes(classListGetter(this), name)
	},
	toggle: function(name, force) {
		var has = proto.contains.call(this, name)
		var method = 'add'
		if (true != force) {
			if (has || false == force) {
				method = 'remove'
			}
		}
		proto[method].call(this, name)
	}
})

function classListGetter(el) {
	return _.trim(el.className).split(/\s+/)
}

_.each('add remove toggle'.split(' '), function(key) {
	$.fn[key + 'Class'] = function() {
		var args = arguments
		return this.each(function() {
			proto[key].apply(this, args)
		})
	}
})

$.fn.hasClass = function(name) {
	return _.every(this, function(el) {
		return proto.contains.call(el, name)
	})
}

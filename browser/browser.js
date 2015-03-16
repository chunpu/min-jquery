(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.$ = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var $ = require('..')

$.fn.extend({
	on: function() {
	},
	off: function() {
	}
})

},{"..":5}],2:[function(require,module,exports){
require('./util')
require('./event')
require('./ready')

},{"./event":1,"./ready":3,"./util":4}],3:[function(require,module,exports){
(function (global){
var $ = require('..')
var ready = require('min-ready')()

var docLoad = 'DOMContentLoaded'
var winLoad = 'load'

var doc = global.document

$.fn.extend({
	ready: function(fn) {
		ready(fn)
		return this
	}
})

setTimeout(bindEvent) // wait all extend ready

function bindEvent() {
	if ('complete' == doc.readyState) {
		return ready.ready($)
	}
	$(doc).on(docLoad, loaded)
	$(global).on(winLoad, loaded)
}

function loaded() {
	$(global).off(docLoad, loaded)
	$(doc).off(winLoad, loaded)
	ready.ready()
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"..":5,"min-ready":10}],4:[function(require,module,exports){
(function (global){
var $ = require('../')
var _ = require('min-util')
var parse = require('min-parse')

var is = _.is
var knownTypes = 'boolean number string function array date regexp object error'.split(' ')

$.extend({
	  noop: _.noop
	, toArray: function(arr, ret) {
		return $.merge(ret, arr)
	}
	, each: function(arr, fn) {
		_.each(arr, function(val, i) {
			return fn.call(val, i, val, arr)
		})
		return arr
	}
	, grep: _.filter
	, inArray: _.has
	, isArray: is.arr
	, isEmptyObject: is.empty
	, isFunction: is.fn
	, isNumeric: is.num
	, isPlainObject: is.hash
	, isWindow: function(val) {
		return val == global
	}
	, makeArray: _.slice
	, map: _.map
	, merge: function(first, second) {
		first = first || []
		var len = first.length || 0
		_.each(second, function(val, i) {
			first.length++
			first[len + i] = val
		})
		return first
	}
	, now: function() {
		return +new Date
	}
	, parseHTML: parse.html
	, parseJSON: parse.json
	, parseXML: parse.xml
	, proxy: _.bind
	, trim: _.trim
	, type: function(val) {
		var ret = is._class(val)
		if (!_.has(knownTypes, ret)) ret = 'object'
		return ret
	}
})

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../":5,"min-parse":8,"min-util":12}],5:[function(require,module,exports){
(function (global){
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

proto.extend({jquery: true})

require('./extend')

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./extend":2,"min-find":6,"min-parse":8,"min-util":12}],6:[function(require,module,exports){
(function (global){
module.exports = exports = find

// id http://www.w3.org/TR/html4/types.html#type-id
// http://www.w3.org/TR/html-markup/syntax.html#tag-name
// jquery cannot deal with colons (":"), and periods ("."), and we believe most people never use it

var isValid = /^[-\w]+$/

var doc = global.document

// always return array
function find(selector, box) {
	box = box || doc
	var ret = []
	var nodes
	if (selector && box.getElementsByTagName) {
		selector += ''
		if (isValid.test(selector)) {
			// is tag
			nodes = box.getElementsByTagName(selector)
		} else {
			var id = selector.substr(1)
			if (doc == box && '#' == selector.charAt(0) && isValid.test(id)) {
				// is id and from document
				var elem = doc.getElementById(id)
				if (elem) {
					return [elem]
				}
			} else {
				// complex css select, not id or tag
				var fn = exports.custom || query
				try {
					nodes = fn(selector, box)
				} catch (ignore) {}
			}
		}
		if (nodes) {
			var len = nodes.length || 0
			for (var i = 0; i < len; i++) {
				ret.push(nodes[i])
			}
		}
	}
	return ret
}

function query(selector, box) {
	// it will also panic with invalid selector like '#1234'
	return box.querySelectorAll(selector)
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
(function (global){
var is = exports

var obj = Object.prototype

is.browser = (function() {
	return global.window == global
})()

// simple modern browser detect
is.h5 = (function() {
	if (is.browser && navigator.geolocation) {
		return true
	}
	return false
})()

function _class(val) {
	var name = obj.toString.call(val)
	// [object Class]
	return name.substring(8, name.length - 1).toLowerCase()
}

function _type(val) {
	// undefined object boolean number string symbol function
	return typeof val
}

function owns(owner, key) {
	return obj.hasOwnProperty.call(owner, key)
}

is._class = _class

is._type = _type

is.owns = owns

// not a number
is.nan = function(val) {
	return !is.num(val)
}

is.infinite = function(val) {
	return val == Infinity || val == -Infinity
}

is.num = is.number = function(num) {
	return !isNaN(num) && 'number' == _class(num)
}

// int or decimal
is.iod = function(val) {
	if (is.num(val) && !is.infinite(val)) {
		return true
	}
	return false
}

is.decimal = function(val) {
	if (is.iod(val)) {
		return 0 != val % 1
	}
	return false
}

is.int = function(val) {
	if (is.iod(val)) {
		return 0 == val % 1
	}
	return false
}

// object or function
is.oof = function(val) {
	if (val) {
		var tp = _type(val)
		return 'object' == tp || 'function' == tp
	}
	return false
}

// regexp should return object
is.obj = is.object = function(obj) {
	return is.oof(obj) && 'function' != _class(obj)
}

is.hash = is.plainObject = function(hash) {
	if (hash) {
		if ('object' == _class(hash)) {
			// old window is object
			if (hash.nodeType || hash.setInterval) {
				return false
			}
			return true
		}
	}
	return false
}

is.undef = function(val) {
	return 'undefined' == _type(val)
}

// host function should return function, e.g. alert
is.fn = function(fn) {
	return 'function' == _class(fn)
}

is.str = is.string = function(str) {
	return 'string' == _class(str)
}

// number or string
is.nos = function(val) {
	return is.iod(val) || is.str(val)
}

is.array = function(arr) {
	return 'array' == _class(arr)
}

is.arraylike = function(arr) {
	if (is.obj(arr)) {
		if (owns(arr, 'length')) {
			var len = arr.length
			if (is.int(len) && len >= 0) {
				return true
			}
		}
	}
	return false
}

is.empty = function(val) {
	if (is.str(val) || is.arraylike(val)) {
		return 0 === val.length
	}
	if (is.hash(val)) {
		for (var key in val) {
			if (owns(val, key)) {
				return false
			}
		}
	}
	return true
}

is.element = function(elem) {
	if (is.obj(elem) && 1 === elem.nodeType) {
		if (is.h5) {
			return /element/.test(_class(elem))
		}
		return true
	}
	return false
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
(function (global){
var _ = require('min-util')
var is = require('min-is')

exports.html = function(str, box) {
	// unsafe html, e.g. `<script>`
	if (is.str(str)) {
		box = box || document
		var div = box.createElement('div')
		div.innerHTML = str + ''
		return div.childNodes
	}
	return []
}

exports.xml = function(str) {
	str = str + ''
	var xml
	try {
		if (global.DOMParser) {
			var parser = new DOMParser()
			xml = parser.parseFromString(str, 'text/xml')
		} else {
			xml = new ActiveXObject('Microsoft.XMLDOM')
			xml.async = 'false'
			xml.loadXML(str)
		}
	} catch (e) {
		xml = undefined
	}
	if (xml && xml.documentElement) {
		if (!xml.getElementsByTagName('parsererror').length) {
			return xml
		}
	}
	throw new Error('Invalid XML: ' + str)
}

var JSON = global.JSON || {}

exports.json = JSON.parse || evalJSON

var validJson = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g

function evalJSON(str) {
	str = _.trim(str + '')
	var depth, requireNonComma
	var invalid = str.replace(validJson, function(token, comma, open, close) {
		if (requireNonComma && comma) depth = 0
		if (depth = 0) return token
		requireNonComma = open || comma
		depth += !close - !open
		return ''
	})
	invalid = _.trim(invalid)
	if (invalid) throw new Error('Invalid JSON: ' + str)
	return Function('return ' + str)()
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-is":9,"min-util":12}],9:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],10:[function(require,module,exports){
var _ = require('min-util')
var is = _.is

module.exports = Ready

function Ready() {
	var queue = []
	function ready(val) {
		if (is.str(val)) {
			return ready.call(this, arguments)
		}
		if (val) {
			ready.ctx = this
			queue.push(val)
		}
		if (ready.isReady) {
			var len = queue.length
			for (var i = 0; i < len; i++) {
				exec.call(ready.ctx, queue[i])
			}
			queue.length = 0
		}
	}
	ready.ready = function(ctx) {
		ready.isReady = true
		if (ctx) {
			ready.ctx = ctx
		}
		ready()
	}
	ready.queue = queue
	return ready
}

function exec(val) {
	var me = this
	if (is.fn(val)) {
		val.call(me, me)
	} else if (is.arraylike(val)) {
		var name = val[0]
		if (is.str(name)) {
			// a.b.c.d
			var arr = name.split('.')
			var key
			var fn = me
			while (arr.length) {
				key = arr.shift()
				fn = fn[key] || {}
			}
			if (is.fn(fn) && 0 == arr.length) {
				fn.apply(me, _.slice(val, 1))
			}
		}
	}
}

},{"min-util":11}],11:[function(require,module,exports){
var is = require('min-is')

var _ = exports

_.is = is

function extend(dst) {
	var len = arguments.length
	if (len > 1) {
		for (var i = 1; i < len; i++) {
			var hash = arguments[i]
			if (hash) {
				for (var key in hash) {
					if (is.owns(hash, key)) {
						var val = hash[key]
						if (is.undef(val) || val === dst[key] || val == dst) continue
						dst[key] = val
					}
				}
			}
		}
	}
	return dst
}

_.keys = function(hash) {
	var ret = []
	if (hash) {
		for (var key in hash) {
			if (is.owns(hash, key)) {
				ret.push(key)
			}
		}
	}
	return ret
}

_.extend = extend

function fix(arr) {
	if (!is.arraylike(arr)) arr = []
	return arr
}

function identity(val) {
	return val
}

_.identity = identity

var stopKey = 'stopOnFalse'

function each(arr, fn, custom) {
	if (!is.fn(fn)) fn = identity
	var fixed = arr
	if (!is.arraylike(arr)) fixed = []

	var len = fixed.length
	var opt = extend({}, custom)
	
	if (custom) {
		var ints = ['from', 'end', 'step']
		for (var i = 0; i < ints.length; i++) {
			var val = +opt[ints[i]]
			if (!is.int(val)) val = undefined
			opt[ints[i]] = val
		}
	}

	var from = opt.from || 0
	var end = opt.end || len
	var step = opt.step || 1

	if (custom) {
		if (from < 0) from = 0
		if (end > len) end = len
		if (from + step * Infinity <= end) return arr // cannot finish
	}

	if (opt.reverse) {
		step = -step
		var tmp = from
		from = end
		end = tmp
	}

	for (var i = from; i < end; i += step) {
		var ret
		if (opt.context) {
			ret = fn.call(opt.context, arr[i], i, arr)
		} else {
			ret = fn(arr[i], i, arr)
		}
		// default is stop on false
		if (false !== opt[stopKey] && false === ret) break
	}
	return arr
}

_.each = each

_.map = function(arr, fn) {
	var ret = []
	each(arr, function(item, i, arr) {
		ret[i] = fn(item, i, arr)
	})
	return ret
}

_.filter = function(arr, fn) {
	var ret = []
	each(arr, function(item, i, arr) {
		var val = fn(item, i, arr)
		if (val) ret.push(item)
	})
	return ret
}

_.some = function(arr, fn) {
	var ret = false
	each(arr, function(item, i, arr) {
		if (fn(item, i, arr)) {
			ret = true
			return false
		}
	})
	return ret
}

_.every = function(arr, fn) {
	var ret = true
	each(arr, function(item, i, arr) {
		if (!fn(item, i, arr)) {
			ret = false
			return false
		}
	})
	return ret
}

_.find = function(arr, fn) {
	var ret
	each(arr, function(item, i, arr) {
		if (fn(item, i, arr)) {
			ret = item
			return false
		}
	})
	return ret
}

function slice(arr, from, end) {
	var ret = []
	each(arr, function(item) {
		ret.push(item)
	}, {
		  from: from
		, end: end
	})
	return ret
}

_.slice = slice

function indexOf(val, sub) {
	if (is.str(val)) return val.indexOf(sub)
	var ret = -1
	each(val, function(item, i) {
		if (item == sub) {
			ret = i
			return false
		}
	})
	return ret
}

_.indexOf = indexOf

function has(val, sub) {
	return -1 != indexOf(val, sub)
}

_.has = has

_.uniq = function(arr) {
	var ret = []
	each(arr, function(item) {
		if (!has(ret, item)) ret.push(item)
	})
	return ret
}

function reduce(arr, fn, prev) {
	each(arr, function(item, i) {
		prev = fn(prev, item, i, arr)
	})
	return prev
}

_.reduce = reduce

_.only = function(obj, keys) {
	obj = obj || {}
	if (is.str(keys)) keys = keys.split(/ +/)
	return reduce(keys, function(ret, key) {
		if (null != obj[key]) ret[key] = obj[key]
		return ret
	}, {})
}

var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g

_.trim = function(str) {
	if (null == str) return ''
	return ('' + str).replace(rtrim, '')
}

_.flatten = function(arrs) {
	var ret = []
	each(arrs, function(arr) {
		if (is.arraylike(arr)) {
			each(arr, function(item) {
				ret.push(item)
			})
		} else ret.push(arr)
	})
	return ret
}

_.union = function() {
	return _.uniq(flatten(arguments))
}

_.bind = function(fn, ctx) {
	if (!is.fn(fn)) return fn
	var args = slice(arguments, 2)
	ctx = ctx || this
	return function() {
		return fn.apply(ctx, _.flatten([args, arguments]))
	}
}

_.create = (function() {
	function Object() {} // so it seems like Object.create
	return function(proto, property) {
		// not same as Object.create, Object.create(proto, propertyDescription)
		if ('object' != typeof proto) {
			// null is ok
			proto = null
		}
		Object.prototype = proto
		return _.extend(new Object, property)
	}
})()

_.inherits = function(ctor, superCtor) {
	ctor.super_ = superCtor
	ctor.prototype = _.create(superCtor.prototype, {
		constructor: ctor
	})
}

},{"min-is":7}],12:[function(require,module,exports){
var is = require('min-is')

var _ = exports

_.is = is

function extend(dst) {
	var len = arguments.length
	if (len > 1) {
		for (var i = 1; i < len; i++) {
			var hash = arguments[i]
			if (hash) {
				for (var key in hash) {
					if (is.owns(hash, key)) {
						var val = hash[key]
						if (is.undef(val) || val === dst[key] || val === dst) continue
						dst[key] = val
					}
				}
			}
		}
	}
	return dst
}

_.noop = function() {}

_.keys = function(hash) {
	var ret = []
	if (hash) {
		for (var key in hash) {
			if (is.owns(hash, key)) {
				ret.push(key)
			}
		}
	}
	return ret
}

_.extend = extend

function fix(arr) {
	if (!is.arraylike(arr)) arr = []
	return arr
}

function identity(val) {
	return val
}

_.identity = identity

var stopKey = 'stopOnFalse'

function each(arr, fn, custom) {
	if (!is.fn(fn)) fn = identity
	var fixed = arr
	if (!is.arraylike(arr)) fixed = []

	var len = fixed.length
	var opt = extend({}, custom)
	
	if (custom) {
		var ints = ['from', 'end', 'step']
		for (var i = 0; i < ints.length; i++) {
			var val = +opt[ints[i]]
			if (!is.int(val)) val = undefined
			opt[ints[i]] = val
		}
	}

	var from = opt.from || 0
	var end = opt.end || len
	var step = opt.step || 1

	if (custom) {
		if (from < 0) from = 0
		if (end > len) end = len
		if (from + step * Infinity <= end) return arr // cannot finish
	}

	if (opt.reverse) {
		step = -step
		var tmp = from
		from = end
		end = tmp
	}

	for (var i = from; i < end; i += step) {
		var ret
		if (opt.context) {
			ret = fn.call(opt.context, arr[i], i, arr)
		} else {
			ret = fn(arr[i], i, arr)
		}
		// default is stop on false
		if (false !== opt[stopKey] && false === ret) break
	}
	return arr
}

_.each = each

_.map = function(arr, fn) {
	var ret = []
	each(arr, function(item, i, arr) {
		ret[i] = fn(item, i, arr)
	})
	return ret
}

_.filter = function(arr, fn) {
	var ret = []
	each(arr, function(item, i, arr) {
		var val = fn(item, i, arr)
		if (val) ret.push(item)
	})
	return ret
}

_.some = function(arr, fn) {
	var ret = false
	each(arr, function(item, i, arr) {
		if (fn(item, i, arr)) {
			ret = true
			return false
		}
	})
	return ret
}

_.every = function(arr, fn) {
	var ret = true
	each(arr, function(item, i, arr) {
		if (!fn(item, i, arr)) {
			ret = false
			return false
		}
	})
	return ret
}

_.find = function(arr, fn) {
	var ret
	each(arr, function(item, i, arr) {
		if (fn(item, i, arr)) {
			ret = item
			return false
		}
	})
	return ret
}

function slice(arr, from, end) {
	var ret = []
	each(arr, function(item) {
		ret.push(item)
	}, {
		  from: from
		, end: end
	})
	return ret
}

_.slice = slice

function indexOf(val, sub) {
	if (is.str(val)) return val.indexOf(sub)
	var ret = -1
	each(val, function(item, i) {
		if (item == sub) {
			ret = i
			return false
		}
	})
	return ret
}

_.indexOf = indexOf

function has(val, sub) {
	return -1 != indexOf(val, sub)
}

_.has = has

_.uniq = function(arr) {
	var ret = []
	each(arr, function(item) {
		if (!has(ret, item)) ret.push(item)
	})
	return ret
}

function reduce(arr, fn, prev) {
	each(arr, function(item, i) {
		prev = fn(prev, item, i, arr)
	})
	return prev
}

_.reduce = reduce

_.only = function(obj, keys) {
	obj = obj || {}
	if (is.str(keys)) keys = keys.split(/ +/)
	return reduce(keys, function(ret, key) {
		if (null != obj[key]) ret[key] = obj[key]
		return ret
	}, {})
}

var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g

_.trim = function(str) {
	if (null == str) return ''
	return ('' + str).replace(rtrim, '')
}

_.flatten = function(arrs) {
	var ret = []
	each(arrs, function(arr) {
		if (is.arraylike(arr)) {
			each(arr, function(item) {
				ret.push(item)
			})
		} else ret.push(arr)
	})
	return ret
}

_.union = function() {
	return _.uniq(flatten(arguments))
}

_.bind = function(fn, ctx) {
	if (!is.fn(fn)) return fn
	var args = slice(arguments, 2)
	ctx = ctx || this
	return function() {
		return fn.apply(ctx, _.flatten([args, arguments]))
	}
}

_.create = (function() {
	function Object() {} // so it seems like Object.create
	return function(proto, property) {
		// not same as Object.create, Object.create(proto, propertyDescription)
		if ('object' != typeof proto) {
			// null is ok
			proto = null
		}
		Object.prototype = proto
		return _.extend(new Object, property)
	}
})()

_.inherits = function(ctor, superCtor) {
	ctor.super_ = superCtor
	ctor.prototype = _.create(superCtor.prototype, {
		constructor: ctor
	})
}

},{"min-is":7}]},{},[5])(5)
});
var $ = require('../')
var _ = require('min-util')
var parse = require('min-parse')

var is = _.is
var knownTypes = 'boolean number string function array date regexp object error'.split(' ')

$.extend({
	  noop: _.noop
	, toArray: function(arr, ret) {
		_.each(arr, function(val) {
			ret.push(val)
		})
		return ret
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
		_.each(second, function(val) {
			first.push(val)
		})
		return first
	}
	, now: function() {
		return +new Date
	}
	, parseHTML: parse.html
	, parseJSON: parse.json
	, parseXML: parse.xml
	, proxy: function(fn, ctx) {
		if (is.str(ctx)) {
			return _.bind(fn[ctx], fn)
		}
		return _.bind(fn, ctx)
	}
	, trim: _.trim
	, type: function(val) {
		var ret = is._class(val)
		if (!_.has(knownTypes, ret)) ret = 'object'
		return ret
	}
})
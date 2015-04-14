var $ = require('../')
var _ = require('min-is')
var Emitter = require('min-event')

var emitter = new Emitter
var uid = require('muid')()

$.Event = Event

$.event = {
	add: function(el, type, handler, data, selector, isOnce) {
		var arr = type.split('.')
		type = arr.shift()
		var action = isOnce ? 'once' : 'on'
		var event = emitter[action](handler)
		_.extend(event, {
			type: type,
			data: data,
			namespace: arr,
			selector: selector
		})
		var binded = getBinded(el)
		if (!binded[type]) {
			binded[type] = true
			bind(el, type)
		}
	},
	trigger: function() {
	}
}

function filterEvents(event) {
	
}

function Event(src) {
	this.originalEvent = src
	this.type = src.type
	this.target = src.target || src.srcElement
}

function handler() {
	
}

function getBinded(el) {
	var ret = $._data(el)
	if (!ret.events) ret.events = {}
	return ret
}

function bind(el, type) {
	if (el.addEventListener) {
		el.addEventListener(type, handler, false)
	} else if (el.attachEvent) {
		el.attachEvent('on' + type, handler)
	}
}

function unbind(el, type) {
	if (el.removeEventListener) {
		el.removeEventListener(type, handler, false)
	} else if (el.detachEvent) {
		el.detachEvent('on' + type, handler)
	}
}

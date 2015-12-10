// unfinished!!!!!!!!!!
var $ = require('../')
var _ = require('min-util')

$.Event = Event

var _event = $.event = {
	add: function(el, type, handler, data, selector, isOnce) {
		var arr = type.split('.')
		type = arr.shift()

		var item = {
			  handler: handler
			, type: type
			, data: data
			, namespace: arr
			, selector: selector
		}

		var priv = getPriv4Event(el)
		var events = priv.events[type]
		if (!events) {
			// init events
			events = priv.events[type] = []
			bind(el, type, priv.handler)
		}

		events.push(item)
	},
	trigger: function(el, ev) {
		// fix ev
		var priv = getPriv4Event(el)
		var filtered = _.filter(priv.events[ev.type], function(item) {
			return _.has(item.namespace, ev.namespace)
		})
		_.each(filtered, function(item) {
			var ret = item.handler.call(el, ev)
			if (false === ret) {
				var origin = ev.originalEvent
				if (origin.preventDefault) {
					origin.preventDefault()
				} else {
					origin.returnValue = false
				}
				if (origin.stopPropagation) {
					origin.stopPropagation()
				}
				origin.cancelBubble = true
			}
		})
	},
	off: function(el, ev, handler) {
		var priv = getPriv4Event(el)
		var events = priv.events
		if (!ev || '.' == ev.charAt(0)) {
			for (var key in events) {
				_event.off(el, key + ev, handler)
			}
			return
		}
		var arr = ev.split('.')
	}
}

function filterEvents(ev) {
	
}

function getPriv4Event(el) {
	var priv = $._data(el)
	if (!priv.handler) {
		priv.handler = function(ev) {
			$.trigger(el, $.Event(ev))
		}
	}
	if (!priv.events) {
		priv.events = {}
	}
	return priv
}

function Event(src) {
	this.originalEvent = src
	this.type = src.type
	this.target = src.target || src.srcElement
}

function getBinded(el) {
	var ret = $._data(el)
	if (!ret.events) ret.events = {}
	return ret
}

function bind(el, type, fn) {
	if (el.addEventListener) {
		el.addEventListener(type, fn, false)
	} else if (el.attachEvent) {
		el.attachEvent('on' + type, fn)
	}
}

function unbind(el, type, fn) {
	if (el.removeEventListener) {
		el.removeEventListener(type, fn, false)
	} else if (el.detachEvent) {
		el.detachEvent('on' + type, fn)
	}
}

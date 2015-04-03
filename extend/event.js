var $ = require('../')

var eventNS = 'events'

// TODO fix ie event to w3c
// http://www.brainjar.com/dhtml/events/default3.asp

$.Event = function(src, props) {
	if (!(this instanceof $.Event)) {
		return new $.Event(src, props)
	}
	src = src || {}
	if ('string' == typeof src) {
		src = {
			type: src
		}
	}
	this.originalEvent = src
	this.type = src.type
	this.target = src.target || src.srcElement
	if (props) {
		$.extend(this, props)
	}
}

$.extend({
	on: function(elem, type, handler, data, selector) {
		var events = $._data(elem, eventNS)
		var arr = type.split('.')
		type = arr[0]
		var namespace = arr[1]
		if (!events) {
			// set data priv
			events = {}
			$._data(elem, eventNS, events)
		}

		function miniHandler(ev) {
			// we have to save element for old ie
			$.trigger(elem, $.Event(ev))
		}

		if (!events[type]) {
			events[type] = []
			if (elem.addEventListener) {
				elem.addEventListener(type, miniHandler, false)
			} else if (elem.attachEvent) {
				elem.attachEvent('on' + type, miniHandler)
			}
		}
		var typeEvents = events[type]
		var ev = {
			handler: handler,
			namespace: namespace,
			selector: selector,
			type: type
		}
		typeEvents.push(ev)
	},
	trigger: function(elem, ev) {
		var events = $._data(elem, eventNS)
		if ('string' == typeof ev) {
			// self trigger, ev = type
			ev = $.Event(ev, {
				target: elem
			})
		}
		var typeEvents = events[ev.type]
		if (typeEvents) {
			typeEvents = typeEvents.slice() // avoid self remove
			var len = typeEvents.length
			for (var i = 0; i < len; i++) {
				var obj = typeEvents[i]
				var ret = obj.handler.call(elem, ev)
				if (false === ret) {
					ev = ev.originalEvent || ev
					if (ev.preventDefault) {
						ev.preventDefault()
					} else {
						ev.returnValue = false
					}
					if (ev.stopPropagation) {
						ev.stopPropagation()
					}
					ev.cancelBubble = true
				}
			}
		}
	},
	off: function(elem, ev, handler) {
		var events = $._data(elem, eventNS)
		if (!events) return

		ev = ev || ''
		if (!ev || '.' == ev.charAt(0)) {
			// namespace
			for (var key in events) {
				$.off(elem, key + ev, handler)
			}
			return
		}

		var arr = ev.split('.')
		var type = arr[0] // always have
		var namespace = arr[1]
		var typeEvents = events[type]
		if (typeEvents) {
			for (var i = typeEvents.length - 1; i >= 0; i--) {
				var x = typeEvents[i]
				var shouldRemove = true
				if (namespace && namespace != x.namespace) {
					shouldRemove = false
				}
				if (handler && handler != x.handler) {
					shouldRemove = false
				}
				if (shouldRemove) {
					typeEvents.splice(i, 1)
				}
			}
		}
	}
})

$.fn.extend({
	eventHandler: function(events, handler, fn) {
		if (!events) {
			return this.each(function() {
				fn(this)
			})
		}
		events = events.split(' ')
		return this.each(function() {
			for (var i = 0; i < events.length; i++) {
				fn(this, events[i], handler)
			}
		})
	},
	on: function(events, handler) {
		return this.eventHandler(events, handler, $.on)
	},
	off: function(events, handler) {
		return this.eventHandler(events, handler, $.off)
	},
	trigger: function(events, handler) {
		return this.eventHandler(events, handler, $.trigger)
	}
})

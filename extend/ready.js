var $ = require('..')
var ready = require('min-ready')()

var docLoad = 'DOMContentLoaded'
var winLoad = 'load'

var doc = global.document

$.fn.extend({
	ready: function(fn) {
		ready.queue(fn)
		return this
	}
})

setTimeout(bindEvent) // wait all extend ready

function bindEvent() {
	if (doc && 'complete' == doc.readyState) {
		ready.ctx = $
		return ready.open()
	}
	$(doc).on(docLoad, loaded)
	$(global).on(winLoad, loaded)
}

function loaded() {
	$(global).off(docLoad, loaded)
	$(doc).off(winLoad, loaded)
	ready.ctx = $
	ready.open()
}

var assert = require('assert')
var $ = require('../')
var _ = require('min-util')
var doc = global.document
var resetBox = doc.createElement('div')
var appendBox = doc.createElement('div')

doc.body.appendChild(resetBox)
doc.body.appendChild(appendBox)
_.extend(global, {
	  assert: assert
	, $: $
	, init: function(html) {
		resetBox.innerHTML = html
	}
	, initWithoutClear: function(html) {
		appendBox.innerHTML += html
	}
})

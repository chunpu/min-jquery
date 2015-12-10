var $ = require('../')
var _ = require('min-util')

var display = 'display'

_.each('show hide toggle'.split(' '), function(key) {
	$.fn[key] = function() {
        return this.each(function(i, el) {
            var act = key
            var old = $.css(el, display)
            var isHiden = 'none' == old
            if ('toggle' == key) {
                act = 'hide'
                if (isHiden) {
                    act = 'show'
                }
            }
            if ('show' == act && isHiden) {
                var css = $._data(el, display) || '' // '' clear display value
                $.css(el, display, css)
            } else if ('hide' == act && !isHiden) {
                $._data(el, display, old)
                $.css(el, display, 'none')
            }
        })
    }
})

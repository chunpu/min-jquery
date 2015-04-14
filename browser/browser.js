(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.$ = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var querystring = require('min-qs')
var $ = require('../')
var uid = require('muid')

var cors = 'withCredentials'

var support = {}

$.support = support

var ajaxSetting = {
    xhr: function() {
        try {
            if (window.XMLHttpRequest) {
                return new XMLHttpRequest()
            }
            return new ActiveXObject('Microsoft.XMLHTTP')
        } catch (e) {}
    },
    jsonp: 'callback'
}

$.ajaxSetting = ajaxSetting

function getScript(url, opt, cb) {
    var head = $('head')[0]
    var script = document.createElement('script')

    function finish(err) {
        if (script) {
            if (cb) {
                // fake xhr
                var xhr = {
                    status: 200
                }
                if (err) {
                    xhr = {
                        status: 0
                    }
                }
                cb(err, xhr)
            }
            script.onload = script.onerror = script.onreadystatechange = null
            head.removeChild(script)
            script = null
        }
    }

    function send() {
        script.async = true
        script.src = url
        script.onload = script.onerror = script.onreadystatechange = function(ev) {
            var state = script.readyState
            if (ev && 'error' == ev.type) { // old browser has no onerror
                finish('error')
            } else if (!state || /loaded|complete/.test(state)) { // new browser has no state
                finish(null)
            }
        }
        head.appendChild(script)
    }

    return {
        abort: function() {
            cb = null
            finish()
        },
        send: send
    }
}

function request(url, opt, cb) {
    // cb can only be called once
    if (url && 'object' == typeof url) {
        return $.ajax(url.url, url, cb)
    }

    if ('function' == typeof opt) {
        cb = opt
        opt = {}
    }

    var hasCalled = false
    var callback = function(err, res, body) {
        if (hasCalled) return
        cb = cb || $.noop
        hasCalled = true
        cb(err, res, body)
    }

    var dataType = opt.dataType || 'text' // html, script, jsonp, text

    var req
    var isJsonp = false
    if ('jsonp' == dataType) {
        isJsonp = true
        var jsonp = opt.jsonp || ajaxSetting.jsonp
        var jsonpCallback = opt.jsonpCallback || [$.expando, $.now(), Math.random()].join('_')
        jsonpCallback = jsonpCallback.replace(/[^\w|$]/g, '')
        var keyTmpl = jsonp + '=?'
        var query = $.extend({}, opt.data)
        if (url.indexOf(keyTmpl) != -1) {
            url.replace(keyTmpl, jsonp + '=' + jsonpCallback)
        } else {
            query[jsonp] = jsonpCallback
        }
        if (!opt.cache) {
            query._ = $.now()
        }
        url = bindQuery2url(url, query)

        dataType = 'script'
        window[jsonpCallback] = function(ret) { // only get first one
            callback(null, {
                status: 200
            }, ret)
            window[jsonpCallback] = null
        }
    }
    if ('script' == dataType) {
        req = getScript(url, opt, isJsonp ? null : callback)
    } else if (/html|text/.test(dataType)) {
        req = getXhr(url, opt, callback)
    }
    req.send()

    if (opt.timeout) {
        setTimeout(function() {
            req.abort() // should never call callback, because user know he abort it
            callback('timeout', {
                status: 0,
                readyState: 0,
                statusText: 'timeout'
            })
            if (isJsonp) {
                window[jsonpCallback] = $.noop
            }
        }, opt.timeout)
    }
}

$.ajax = function(url, opt) {
    // TODO fuck the status, statusText, even for jsonp
    var ret = {}
    request(url, opt, function(err, xhr, body) {
        xhr = xhr || {}
        var jqxhr = {
            status: xhr.status,
            statusText: xhr.statusText,
            readyState: xhr.readyState
        }
        $.extend(ret, jqxhr)
        // success, timeout, error
        var resText = 'success'
        if (err || 200 != ret.status) {
            resText = 'error'
            if ('timeout' == err) {
                resText = 'timeout'
            }
            opt.error && opt.error(ret, resText, xhr.statusText)
        } else {
            opt.success && opt.success(body || xhr.responseText, resText, ret)
        }
        opt.complete && opt.complete(ret, resText)
    })
    return ret
}

$.each(['get', 'post'], function(i, method) {
    $[method] = function(url, data, callback, dataType) {
        if ('function' == typeof data) {
            dataType = callback
            callback = data
            data = undefined
        }
        $.ajax(url, {
            type: method,
            dataType: dataType,
            data: data,
            success: callback
        })
    }
})

function getXhr(url, opt, cb) {

    var xhr = ajaxSetting.xhr()

    function send() {
        if (!xhr) return
        var type = opt.type || 'GET'

        url = bindQuery2url(url, opt.data)

        xhr.open(type, url, !cb.async)

        if (cors in xhr) {
            support.cors = true
            xhr[cors] = true // should after open
        }

        var headers = opt.headers
        if (headers) {
            for (var key in headers) {
                xhr.setRequestHeader(key, headers[key])
            }
        }

        xhr.send(opt.data || null)

        var handler = function() {
            if (handler &&  4 === xhr.readyState) {
                handler = undefined
                cb && cb(null, xhr, xhr.responseText)
            }
        }

        if (false === opt.async) {
            handler()
        } else if (4 === xhr.readyState) {
            setTimeout(handler)
        } else {
            xhr.onreadystatechange = handler
        }
    }

    function abort() {
        if (!xhr) return
        cb = null
        xhr.abort()
    }

    return {
        send: send,
        abort: abort
    }

}

function bindQuery2url(url, query) {
    if (-1 == url.indexOf('?')) {
        url += '?'
    }
    var last = url.charAt(url.length - 1)
    if ('&' != last && '?' != last) {
        url += '&'
    }
    return url + querystring.stringify(query)
}

},{"../":12,"min-qs":17,"muid":20}],2:[function(require,module,exports){
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
		return _.has(classListGetter(this), name)
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

},{"../":12,"min-util":19}],3:[function(require,module,exports){
var $ = require('../')
var _ = require('min-util')

_.each('width height'.split(' '), function(type) {
	_.each(['inner', 'outer', ''], function(opt) {

		var funcName = type
		var upper = type.charAt(0).toUpperCase() + type.substr(1)
		if (opt) {
			funcName = opt + upper
		}

		$.fn[funcName] = function() {
			var el = this[0]
			if (!el) return
			var ret = 0
			if ('outer' == opt) {
				ret = el['offset' + upper]
			} else {
				// TODO too complex!
				ret = el['offset' + upper]
			}
			return parseFloat(ret) || 0
		}

	})
})

$.fn.offset = function() {
	var el = this[0]
	if (!el) return
	return {
		left: el.offsetLeft,
		top: el.offsetTop
	}
}

},{"../":12,"min-util":19}],4:[function(require,module,exports){
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
                var css = $._data(el, display) || 'block'
                $.css(el, display, css)
            } else if ('hide' == act && !isHiden) {
                $._data(el, display, old)
                $.css(el, display, 'none')
            }
        })
    }
})

},{"../":12,"min-util":19}],5:[function(require,module,exports){
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

		var eventHandler = $._data(elem, 'handler')
		if (!eventHandler) {
			// one element one handler
			eventHandler = function(ev) {
				// we have to save element for old ie
				$.trigger(elem, $.Event(ev))
			}
			$._data(elem, 'handler', eventHandler)
		}

		if (!events[type]) {
			events[type] = []
			bind(elem, type, eventHandler)
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
			if (!events[type].length) {
				unbind(elem, type, $._data(elem, 'handler'))
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

},{"../":12}],6:[function(require,module,exports){
require('./util')
require('./event')
require('./ready')
require('./proto-util')
require('./node-prop')
require('./node-method')
require('./effect')
require('./ajax')
require('./dimension')
require('./class-list')

},{"./ajax":1,"./class-list":2,"./dimension":3,"./effect":4,"./event":5,"./node-method":7,"./node-prop":8,"./proto-util":9,"./ready":10,"./util":11}],7:[function(require,module,exports){
var _ = require('min-util')
var $ = require('../')

$.buildFragment = function(elems, context) {
	context = context || document
	var fragment = context.createDocumentFragment()
	for (var i = 0, elem; elem = elems[i++];) {
		var nodes = []
		if ('string' == typeof elem) {
			if (elem.indexOf('<') == -1) {
				nodes.push(context.createTextNode(elem))
			} else {
				var div = document.createElement('div')
				div.innerHTML = elem
				$.toArray(div.childNodes, nodes)
			}
		} else if ('object' == typeof elem) {
			if (elem.nodeType) {
				nodes.push(elem)
			} else {
				$.toArray(elem, nodes)
			}

		}
	}
	for (var i = 0, node; node = nodes[i++];) {
		fragment.appendChild(node)
	}
	return fragment
}


$.fn.extend({
      domManip: function(args, fn) {
        return this.each(function() {
            var node = $.buildFragment(args)
            // always build to one node(fragment)
            fn.call(this, node)
        })
    }
    , remove: function() {
        return this.domManip(arguments, function() {
            if (this.parentNode) {
                this.parentNode.removeChild(this)
            }
        })
    }
    , before: function() {
        return this.domManip(arguments, function(elem) {
            if (elem.parentNode) {
                elem.parentNode.insertBefore(elem, this)
            }
        })
    }
    , after: function() {
        return this.domManip(arguments, function(elem) {
            if (elem.parentNode) {
                elem.parentNode.insertBefore(elem, this.nextSibling)
            }
        })
    }
    , append: function() {
        return this.domManip(arguments, function(elem) {
            this.appendChild(elem)
        })
    }
})

},{"../":12,"min-util":19}],8:[function(require,module,exports){
(function (global){
var _ = require('min-util')
var $ = require('../')
var Data = require('min-data')
var uid = require('muid')

var is = _.is
var data_user = new Data
var data_priv = new Data

var getComputedStyle = global.getComputedStyle || function(el) {
	if (el && el.currentStyle) {
		return el.currentStyle
	}
	return {}
}

$.extend({
	expando: data_priv.expando,
	access: function(elems, fn, key, val, isChain) {
		var i = 0
		if (key && 'object' === typeof key) {
   			// set multi k, v
   			for (i in key) {
   				$.access(elems, fn, i, key[i], true)
   			}
   		} else if (undefined === val) {
   			// get value
   			var ret
   			if (elems[0]) { // TODO text, html should be ''
   				ret = fn(elems[0], key)
   			}
   			if (!isChain) {
   				return ret
   			}
   		} else {
   			// set one k, v
   			for (i = 0; i < elems.length; i++) {
   				fn(elems[i], key, val)
   			}
   		}
   		return elems
   	},
    attr: function(elem, key, val) {
        if (undefined === val) {
            return elem.getAttribute(key)
        } else if (null === val) {
            return elem.removeAttribute(key)
        }
        elem.setAttribute(key, '' + val)
    },
    text: function(elem, key, val) {
        if (undefined !== val) return elem.textContent = '' + val
        var nodeType = elem.nodeType
        if (3 == nodeType || 4 == nodeType) {
            return elem.nodeValue
        }
        if ('string' == typeof elem.textContent) {
            return elem.textContent
        }
        var ret = ''
        for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
            ret += $.text(elem)
        }
        return ret
    },
    html: function(elem, key, val) {
        if (undefined === val) {
            return elem.innerHTML
        }
        elem.innerHTML = '' + val
    },
    prop: function(elem, key, val) {
        if (undefined === val) {
            return elem[key]
        }
        elem[key] = val
    },
    css: function(elem, key, val) {
        var style = elem.style || {}
        if (undefined === val) {
            var ret = style[key]
            if (ret) return ret
            //if (window.getComputedStyle) {
            //    return getComputedStyle(elem, null)[key]
            //}
			return getComputedStyle(elem, null)[key]
        } else {
            style[key] = val
        }
    },
    data: function(elem, key, val) {
        if (undefined !== val) {
            // set val
            data_user.set(elem, key, val)
        } else {
            if (key && 'object' == typeof key) {
                // set multi
                for (var k in key) {
                    $.data(elem, k, key[k])
                }
            } else {
                // get
				if (key) {
	                return data_user.get(elem, key)
				}
				// get or set data, always return object
				return data_user.getData(elem, true)
            }
        }
    },
    _data: function(elem, key, val) {
        if (undefined !== val) {
            // set val
            data_priv.set(elem, key, val)
        } else {
            if (key && 'object' == typeof key) {
                // set multi
                for (var k in key) {
                    $._data(elem, k, key[k])
                }
            } else {
                // get
                return data_priv.get(elem, key)
            }
        }
    },
    removeData: function(elem, key) {
        data_user.remove(elem, key)
    }
})

$.fn.extend({
      text: function(val) {
        return $.access(this, $.text, null, val)
    }
    , html: function(val) {
        return $.access(this, $.html, null, val)
    }
    , attr: function(key, val) {
        return $.access(this, $.attr, key, val)
    }
    , prop: function(key, val) {
        return $.access(this, $.prop, key, val)
    }
    , css: function(key, val) {
        return $.access(this, $.css, key, val)
    }
    , data: function(key, val) {
        return $.access(this, $.data, key, val)
    }
    , _data: function(key, val) {
        return $.access(this, $.data, key, val)
    }
    , removeData: function(key) {
        return $.access(this, $.removeData, key, undefined, true)
    }
})

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../":12,"min-data":13,"min-util":19,"muid":20}],9:[function(require,module,exports){
var $ = require('../')
var _ = require('min-util')

var is = _.is

$.fn.extend({
	  toArray: function() {
		return $.toArray(this)
	}
	, pushStack: function(nodes) {
		var ret = $(nodes)
		ret.prevObject = this
		ret.context = this.context
		return ret
	}
	, get: function(i) {
		if (!is.num(i)) return this.toArray()
		if (i > 0) {
			return this[i]
		}
		return this.get(i + this.length)
	}
	, each: function(fn) {
		_.each(this, function(val, i) {
			return fn.call(val, i, val, this)
		})
		return this
	}
	, map: function(fn) {
		var arr = _.map(this, function(val, i) {
			return fn.call(val, i, val, this)
		})
		return this.pushStack(arr)
	}
	, filter: function(fn) {
		var arr = _.filter(this, function(val, i) {
			return fn.call(val, i, val, this)
		})
		return this.pushStack(arr)
	}
	, end: function() {
		return this.prevObject || $()
	}
	, eq: function(i) {
		if (i < 0) return this.eq(i + this.length)
		return this.pushStack([this[i]])
	}
	, first: function() {
		return this.eq(0)
	}
	, last: function() {
		return this.eq(-1)
	}
	, slice: function(start, end) {
		var arr = _.slice(this, start, end)
		return this.pushStack(arr)
	}
	, find: function(str) {
		var arr = _.map(this, function(box) {
			return $(str, box)
		})
		return this.pushStack(_.union.apply(_, arr))
	}
})

},{"../":12,"min-util":19}],10:[function(require,module,exports){
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
	if (doc && 'complete' == doc.readyState) {
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
},{"..":12,"min-ready":18}],11:[function(require,module,exports){
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
	, now: _.now
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
},{"../":12,"min-parse":16,"min-util":19}],12:[function(require,module,exports){
(function (global){
var _ = require('min-util')
var parse = require('min-parse')
var find = require('min-find')
var uid = require('muid')

uid.prefix = 'minJQ-'
var doc = global.document
var is = _.is

module.exports = exports = $

function $(val, box) {
	if (is.fn(val)) return $(doc).ready(val)
	if (!(this instanceof $)) return new $(val, box)

	this.length = 0

	if (!val) return

	if (is.string(val)) {
		if (-1 == val.indexOf('<')) {
			val = find(val, box)
		} else {
			val = parse.html(val)
		}
	}

	// if (!is.arraylike(val)) val = [val] // IE10..11 is fucked..
	if (!is.int(val.length)) val = [val]

	var len = val.length
	for (var i = 0; i < len; i++) {
		this[i] = val[i]
	}
	this.length = len
}

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
},{"./extend":6,"min-find":14,"min-parse":16,"min-util":19,"muid":20}],13:[function(require,module,exports){
var uid = require('muid')

module.exports = Data

function Data() {
	this.expando = uid()
	this.cache = [null]
}

var proto = Data.prototype

proto.get = function(owner, key) {
	var data = this.getData(owner)
	if (null == key) {
		return data
	}
	return data[key]
}

proto.set = function(owner, key, value) {
	var data = this.getData(owner, true)
	data[key] = value
	return owner
}

proto.remove = function(owner, key) {
	if (undefined === key) {
		this.discard(owner)
	} else {
		var data = this.getData(owner)
		delete data[key]
	}
	return owner
}

proto.getData = function(owner, shouldCreate) {
	var data = {}
	if (owner) {
		var count = owner[this.expando]
		var cache = this.cache
		if (count) {
			return cache[count]
		}
		if (shouldCreate) {
			owner[this.expando] = cache.length
			cache.push(data)
		}
	}
	return data
}

proto.discard = function(owner) {
	if (owner && owner[this.expando]) {
		// old IE will crash on element `delete`
		owner[this.expando] = undefined
	}
}

},{"muid":20}],14:[function(require,module,exports){
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
},{}],15:[function(require,module,exports){
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
	if (elem && 1 === elem.nodeType) {
		return true
	}
	return false
}

is.regexp = function(val) {
	return 'regexp' == _class(val)
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
(function (global){
var _ = require('min-util')
var is = require('min-is')

exports.html = function(str, box) {
	// unsafe html, e.g. `<script>`
	if (is.str(str)) {
		box = box || document
		var div = box.createElement('div')
		// add noscope element for old IE like parse('<style>')
		div.innerHTML = 'x<div>' + str + '</div>'
		return div.lastChild.childNodes
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
},{"min-is":15,"min-util":19}],17:[function(require,module,exports){
exports.parse = function(qs, sep, eq) {
	qs += ''
	sep = sep || '&'
	eq = eq || '='
	var decode = exports.decode || decodeURIComponent

	var ret = {}
	qs = qs.split(sep)
	for (var i = 0; i < qs.length; i++) {
		var arr = qs[i].split(eq)
		if (2 == arr.length) {
			var k = arr[0]
			var v = arr[1]
			if (k) {
				try {
					k = decode(k)
					v = decode(v)
					ret[k] = v
				} catch (ignore) {}
			}
		}
	}
	return ret
}

exports.stringify = function(obj, sep, eq) {
	obj = obj || {}
	sep = sep || '&'
	eq = eq || '='
	var encode = exports.encode || encodeURIComponent

	var ret = []
	for (var k in obj) {
		if (Object.hasOwnProperty.call(obj, k)) {
			var v = obj[k]
			if (v || '' == v || 0 == v) {
				ret.push(encode(k) + eq + encode(v))
			}
		}
	}
	return ret.join(sep)
}

},{}],18:[function(require,module,exports){
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

},{"min-util":19}],19:[function(require,module,exports){
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

_.now = function() {
	return +new Date
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

function identity(val) {
	return val
}

_.identity = identity

var stopKey = 'stopOnFalse'

function each(arr, fn, custom) {
	if (!is.fn(fn)) fn = identity
	if (!is.arraylike(arr)) arr = []

	var len = arr.length
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

_.without = function(arr) {
	var other = _.slice(arguments, 1)
	return _.difference(arr, other)
}

_.difference = function(arr, other) {
	var ret = []
	_.each(arr, function(val) {
		if (!_.has(other, val)) {
			ret.push(val)
		}
	})
	return ret
}	

_.asyncMap = function(arr, fn, cb) {
	var ret = []
	var count = 0
	var hasDone, hasStart

	each(arr, function(arg, i) {
		hasStart = true
		fn(arg, function(err, val) {
			if (hasDone) return
			count++
			if (err) {
				hasDone = true
				return cb(err)
			}
			ret[i] = val
			if (count == arr.length) {
				hasDone = true
				cb(null, ret)
			}
		})
	})

	if (!hasStart) cb(null) // empty
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

_.tostr = tostr

function tostr(str) {
	if (str || 0 == str) return str + ''
	return ''
}

_.capitalize = function(str) {
	str = tostr(str)
	return str.charAt(0).toUpperCase() + str.substr(1)
}

_.decapitalize = function(str) {
	str = tostr(str)
	return str.charAt(0).toLowerCase() + str.substr(1)
}

_.camelCase = function(str) {
	str = tostr(str)
	var arr = str.split(/[^\w]|_+/)
	arr = _.map(arr, function(val) {
		return _.capitalize(val)
	})
	return _.decapitalize(arr.join(''))
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
	return _.uniq(_.flatten(arguments))
}

_.bind = function(fn, ctx) {
	if (is.str(ctx)) {
		var obj = fn
		fn = obj[ctx]
		ctx = obj
	}
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

},{"min-is":15}],20:[function(require,module,exports){
module.exports = exports = muid

exports.prefix = ''

function muid(len) {
	len = len || 7
	var random = Math.random().toString(35).substr(2, len)
	return exports.prefix + random
}

},{}]},{},[12])(12)
});
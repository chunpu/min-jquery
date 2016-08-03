(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.$ = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
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
        global[jsonpCallback] = function(ret) { // only get first one
            callback(null, {
                status: 200
            }, ret)
            global[jsonpCallback] = null
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

$.ajax = function(opt) {
    // TODO fuck the status, statusText, even for jsonp
	// we use `$.ajax(opt)` instead of `$.ajax(url, opt)`
	// because zepto only support `$.ajax(opt)`, jquery support both
	// http://zeptojs.com/#$.ajax
    var ret = {}
	opt = opt || {}
    request(opt.url, opt, function(err, xhr, body) {
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
        $.ajax({
			url: url,
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../":13,"min-qs":18,"muid":39}],2:[function(require,module,exports){
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

},{"../":13,"min-util":30}],3:[function(require,module,exports){
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
	var offset = el.getBoundingClientRect()
	return _.only(offset, 'left top')
}

},{"../":13,"min-util":30}],4:[function(require,module,exports){
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

},{"../":13,"min-util":30}],5:[function(require,module,exports){
var $ = require('../')
var _ = require('min-util')
var is = _.is

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
	one: function(elem, type, handler, data, selector) {
		if (is.fn(handler)) {
			var wrapper = _.once(function() {
				$.off(elem, type, wrapper)
				wrapper = null
				handler.apply(this, arguments)
			})
			return $.on(elem, type, wrapper, data, selector)
		}
	},
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
				events[type] = null // remove the array
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
	one: function(events, handler) {
		return this.eventHandler(events, handler, $.one)
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

},{"../":13,"min-util":30}],6:[function(require,module,exports){
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
require('./traversing')

},{"./ajax":1,"./class-list":2,"./dimension":3,"./effect":4,"./event":5,"./node-method":7,"./node-prop":8,"./proto-util":9,"./ready":10,"./traversing":11,"./util":12}],7:[function(require,module,exports){
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

},{"../":13,"min-util":30}],8:[function(require,module,exports){
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
},{"../":13,"min-data":14,"min-util":30,"muid":39}],9:[function(require,module,exports){
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

},{"../":13,"min-util":30}],10:[function(require,module,exports){
(function (global){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"..":13,"min-ready":19}],11:[function(require,module,exports){
var _ = require('min-util')
var $ = require('../')

function merge(arr) {
	return _.union.apply(null, arr)
}

var one = {
	children: function(node) {
		var ret = []
		var son = node.firstChild
		for (; son; son = son.nextSibling) {
			if (1 == son.nodeType) {
				ret.push(son)
			}
		}
		return ret
	},
	parent: function(node) {
		return node.parentNode
	}
}

_.each('children parent'.split(' '), function(key) {
	$.fn[key] = function() {
		return merge(_.map(this, function(node) {
			return one[key].apply(null, arguments)
		}))
	}
})

},{"../":13,"min-util":30}],12:[function(require,module,exports){
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
	, inArray: _.includes
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
		if (!_.includes(knownTypes, ret)) ret = 'object'
		return ret
	}
})

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../":13,"min-parse":17,"min-util":30}],13:[function(require,module,exports){
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

	if (!is.arraylike(val)) val = [val]

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
},{"./extend":6,"min-find":15,"min-parse":17,"min-util":30,"muid":39}],14:[function(require,module,exports){
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

},{"muid":39}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
(function (global){
var is = exports

var obj = Object.prototype

var navigator = global.navigator

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

is.mobile = (function() {
	if (is.browser && /mobile/i.test(navigator.userAgent)) {
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
	// window has length for iframe too, but it is not arraylike
	if (!is.window(arr) && is.obj(arr)) {
		var len = arr.length
		if (is.int(len) && len >= 0) {
			return true
		}
	}
	return false
}

is.window = function(val) {
	if (val && val.window == val) {
		return true
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
},{}],17:[function(require,module,exports){
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
},{"min-is":16,"min-util":30}],18:[function(require,module,exports){
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
			if (v || '' === v || 0 === v) {
				ret.push(encode(k) + eq + encode(v))
			}
		}
	}
	return ret.join(sep)
}

},{}],19:[function(require,module,exports){
(function (global){
var _ = require('min-util')
var is = _.is

var open = 1
var close = 0

module.exports = Ctor

function Ctor(queueList) {
	var me = this
	if (!(me instanceof Ctor)) return new Ctor(queueList)
	me.queueList = queueList || []
	me.close()
}

var proto = Ctor.prototype

proto.queue = function() {
	var me = this
	var args = arguments
	if (me.isOpen) {
		me.exec(args)
	} else {
		me.queueList.push(args)
	}
}

proto.close = function() {
	this.isOpen = false
}

proto.open = function() {
	this.isOpen = true
	this.execAll()
}

proto.execAll = function() {
	var me = this
	var queue = me.queueList
	_.each(queue, function(args) {
		me.exec(args)
	})
	queue.length = 0
}

proto.exec = function(args) {
	var func
	var first = _.first(args)
	var ctx = this.ctx
	if (is.fn(first)) {
		func = first
	} else {
		func = _.get(ctx, first)
	}
	if (is.fn(func)) {
		try {
			func.apply(ctx, _.slice(args, 1))
		} catch (ignore) {}
	}
}

proto.overwriteQueue = function(name) {
	var me = this
	global[name] = function() {
		me.queue.apply(me, arguments)
	}
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-util":20}],20:[function(require,module,exports){
module.exports = require('./src')

/* webpack only
if (DEBUG && global.console) {
	console.debug('debug mode')
}
*/

},{"./src":25}],21:[function(require,module,exports){
var is = require('min-is')

var slice = [].slice

var _ = exports

_.is = is

_.extend = _.assign = extend

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
	return -1 != findIndex(arr, fn)
}

_.every = function(arr, fn) {
	return -1 == findIndex(arr, negate(fn))
}

_.reduce = reduce

_.findIndex = findIndex

_.find = function(arr, fn) {
	var index = _.findIndex(arr, fn)
	if (-1 != index) {
		return arr[index]
	}
}

_.indexOf = indexOf

_.includes = function(val, sub) {
	return -1 != indexOf(val, sub)
}

_.toArray = toArray

_.slice = function(arr, start, end) {
	// support array and string
	var ret = [] // default return array
	var len = getLength(arr)
	if (len >= 0) {
		start = start || 0
		end = end || len
		// raw array and string use self slice
		if (!is.fn(arr.slice)) {
			arr = toArray(arr)
		}
		ret = arr.slice(start, end)
	}
	return ret
}

_.negate = negate

_.forIn = forIn

_.keys = keys

var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g

_.trim = function(str) {
	if (null == str) return ''
	return ('' + str).replace(rtrim, '')
}

_.noop = function() {}

_.len = getLength

function getLength(arr) {
	if (null != arr) return arr.length
}

function each(arr, fn) {
	var len = getLength(arr)
	if (len && is.fn(fn)) {
		for (var i = 0; i < len; i++) {
			if (false === fn(arr[i], i, arr)) break
		}
	}
	return arr
}

function findIndex(arr, fn) {
	var ret = -1
	each(arr, function(item, i, arr) {
		if (fn(item, i, arr)) {
			ret = i
			return false
		}
	})
	return ret
}

function toArray(arr) {
	var ret = []
	each(arr, function(item) {
		ret.push(item)
	})
	return ret
}


function extend(target) {
	if (target) {
		var sources = slice.call(arguments, 1)
		each(sources, function(src) {
			forIn(src, function(val, key) {
				if (!is.undef(val)) {
					target[key] = val
				}
			})
		})
	}
	return target
}

function negate(fn) {
	return function() {
		return !fn.apply(this, arguments)
	}
}

function indexOf(val, sub) {
	if (is.str(val)) return val.indexOf(sub)

	return findIndex(val, function(item) {
		// important!
		return sub === item
	})
}

function reduce(arr, fn, prev) {
	each(arr, function(item, i) {
		prev = fn(prev, item, i, arr)
	})
	return prev
}

function forIn(hash, fn) {
	if (hash) {
		for (var key in hash) {
			if (is.owns(hash, key)) {
				if (false === fn(hash[key], key, hash)) break
			}
		}
	}
	return hash
}

function keys(hash) {
	var ret = []
	forIn(hash, function(val, key) {
		ret.push(key)
	})
	return ret
}


},{"min-is":16}],22:[function(require,module,exports){
var _ = module.exports = require('./')

var each = _.each
var includes = _.includes
var is = _.is
var proto = Array.prototype

_.reject = function(arr, fn) {
	return _.filter(arr, function(val, i, arr) {
		return !fn(val, i, arr)
	})
}

_.without = function(arr) {
	var other = _.slice(arguments, 1)
	return _.difference(arr, other)
}

_.difference = function(arr, other) {
	var ret = []
	_.each(arr, function(val) {
		if (!includes(other, val)) {
			ret.push(val)
		}
	})
	return ret
}

_.pluck = function(arr, key) {
	return _.map(arr, function(item) {
		if (item) return item[key]
	})
}

_.size = function(arr) {
	var len = _.len(arr)
	if (null == len) {
		len = _.keys(arr).length
	}
	return len
}

_.first = function(arr) {
	if (arr) return arr[0]
}

_.last = function(arr) {
	var len = _.len(arr)
	if (len) {
		return arr[len - 1]
	}
}

_.asyncMap = function(arr, fn, cb) {
	// desperate
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

_.uniq = function(arr) {
	var ret = []
	each(arr, function(item) {
		if (!includes(ret, item)) ret.push(item)
	})
	return ret
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

_.sample = function(arr, n) {
	var ret = _.toArray(arr)
	var len = ret.length
	var need = Math.min(n || 1, len)
	for (var i = 0; i < len; i++) {
		var rand = _.random(i, len - 1)
		var tmp = ret[rand]
		ret[rand] = ret[i]
		ret[i] = tmp
	}
	ret.length = need
	if (null == n) {
		return ret[0]
	}
	return ret
}

_.shuffle = function(arr) {
	return _.sample(arr, Infinity)
}

_.compact = function(arr) {
	return _.filter(arr, _.identity)
}

_.rest = function(arr) {
	return _.slice(arr, 1)
}

_.invoke = function() {
	var args = arguments
	var arr = args[0]
	var fn = args[1]
	var isFunc = is.fn(fn)
	args = _.slice(args, 2)

	return _.map(arr, function(item) {
		if (isFunc) {
			return fn.apply(item, args)
		}
		if (null != item) {
			var method = item[fn]
			if (is.fn(method)) {
				return method.apply(item, args)
			}
		}
	})
}

_.partition = function(arr, fn) {
	var hash = _.groupBy(arr, function(val, i, arr) {
		var ret = fn(val, i, arr)
		if (ret) return 1
		return 2
	})
	return [hash[1] || [], hash[2] || []]
}

_.groupBy = function(arr, fn) {
	var hash = {}
	_.each(arr, function(val, i, arr) {
		var ret = fn(val, i, arr)
		hash[ret] = hash[ret] || []
		hash[ret].push(val)
	})
	return hash
}

_.range = function() {
	var args = arguments
	if (args.length < 2) {
		return _.range(args[1], args[0])
	}
	var start = args[0] || 0
	var last = args[1] || 0
	var step = args[2]
	if (!is.num(step)) {
		step = 1
	}
	var count = last - start
	if (0 != step) {
		count = count / step
	}
	var ret = []
	var val = start
	for (var i = 0; i < count; i++) {
		ret.push(val)
		val += step
	}
	return ret
}

_.pullAt = function(arr) {
	// `_.at` but mutate
	var indexes = _.slice(arguments, 1)
	return mutateDifference(arr, indexes)
}

function mutateDifference(arr, indexes) {
	var ret = []
	var len = _.len(indexes)
	if (len) {
		indexes = indexes.sort(function(a, b) {
			return a - b
		})
		while (len--) {
			var index = indexes[len]
			ret.push(proto.splice.call(arr, index, 1)[0])
		}
	}
	ret.reverse()
	return ret
}

_.remove = function(arr, fn) {
	// `_.filter` but mutate
	var len = _.len(arr) || 0
	var indexes = []
	while (len--) {
		if (fn(arr[len], len, arr)) {
			indexes.push(len)
		}
	}
	return mutateDifference(arr, indexes)
}

_.fill = function(val, start, end) {
	// TODO
}

},{"./":25}],23:[function(require,module,exports){
var _ = require('./')
var is = _.is

module.exports = Cache

function Cache() {
	this.data = {}
}

var proto = Cache.prototype

proto.has = function(key) {
	return is.owns(this.data, key)
}

proto.get = function(key) {
	return this.data[key]
}

proto.set = function(key, val) {
	this.data[key] = val
}

proto['delete'] = function(key) {
	delete this.data[key]
}

},{"./":25}],24:[function(require,module,exports){
var _ = module.exports = require('./')

var is = _.is
var slice = _.slice

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

// from lang.js `Function.prototype.inherits`
// so belong to function
_.inherits = function(ctor, superCtor) {
	ctor.super_ = superCtor
	ctor.prototype = _.create(superCtor.prototype, {
		constructor: ctor
	})
}

_.delay = function(fn, wait) {
	var args = _.slice(arguments, 2)
	return setTimeout(function() {
		fn.apply(this, args)
	}, wait)
}

_.before = function(n, fn) {
	return function() {
		if (n > 1) {
			n--
			return fn.apply(this, arguments)
		}
	}
}

_.once = function(fn) {
	return _.before(2, fn)
}

_.after = function(n, fn) {
	return function() {
		if (n > 1) {
			n--
		} else {
			return fn.apply(this, arguments)
		}
	}
}

_.throttle = function(fn, wait, opt) {
	wait = wait || 0
	opt = _.extend({
		leading: true,
		trailing: true,
		maxWait: wait
	}, opt)
	return _.debounce(fn, wait, opt)
}

_.debounce = function(fn, wait, opt) {
	wait = wait || 0
	opt = _.extend({
		leading: false,
		trailing: true
	}, opt)
	var maxWait = opt.maxWait
	var lastExec = 0 // wait
	var lastCall = 0 // just for maxWait
	var now = _.now()
	var timer

	if (!opt.leading) {
		lastExec = now
	}

	function ifIsCD() {
		if (now - lastExec > wait) return false
		if (maxWait && now - lastCall > maxWait) return false
		return true
	}

	function exec(fn, ctx, args) {
		lastExec = _.now() // update last exec
		return fn.apply(ctx, args)
	}

	function cancel() {
		if (timer) {
			clearTimeout(timer)
			timer = null
		}
	}

	function debounced() {
		now = _.now() // update now
		var isCD = ifIsCD()
		lastCall = now // update last call
		var me = this
		var args = arguments

		cancel()

		if (!isCD) {
			exec(fn, me, args)
		} else {
			if (opt.trailing) {
				timer = _.delay(function() {
					exec(fn, me, args)
				}, wait)
			}
		}
	}

	debounced.cancel = cancel

	return debounced
}

function memoize(fn) {
	var cache = new memoize.Cache
	function memoized() {
		var args = arguments
		var key = args[0]
		if (!cache.has(key)) {
			var ret = fn.apply(this, args)
			cache.set(key, ret)
		}
		return cache.get(key)
	}
	memoized.cache = cache
	return memoized
}

memoize.Cache = require('./cache')

_.memoize = memoize

_.wrap = function(val, fn) {
	return function() {
		var args = [val]
		args.push.apply(args, arguments)
		return fn.apply(this, args)
	}
}

_.curry = function(fn) {
	var len = fn.length
	return setter([])

	function setter(args) {
		return function() {
			var arr = args.concat(_.slice(arguments))
			if (arr.length >= len) {
				arr.length = len
				return fn.apply(this, arr)
			}
			return setter(arr)
		}
	}
}

},{"./":25,"./cache":23}],25:[function(require,module,exports){
var cou = require('cou')

module.exports = cou.extend(_, cou)

require('./array')
require('./object')
require('./function')
require('./util')
require('./string')
require('./math')

_.mixin(_, _)

function _(val) {
	if (!(this instanceof _)) return new _(val)
	this.__value = val
	this.__chain = false
}


},{"./array":22,"./function":24,"./math":26,"./object":27,"./string":28,"./util":29,"cou":21}],26:[function(require,module,exports){
var _ = module.exports = require('./')

_.sum = function(arr) {
	return _.reduce(arr, function(sum, val) {
		return sum + val
	}, 0)
}

_.max = function(arr, fn) {
	var index = -1
	var data = -Infinity
	fn = fn || _.identity
	_.each(arr, function(val, i) {
		val = fn(val)
		if (val > data) {
			data = val
			index = i
		}
	})
	if (index > -1) {
		return arr[index]
	}
	return data
}

_.min = function(arr, fn) {
	var index = -1
	var data = Infinity
	fn = fn || _.identity
	_.each(arr, function(val, i) {
		val = fn(val)
		if (val < data) {
			data = val
			index = i
		}
	})
	if (index > -1) {
		return arr[index]
	}
	return data
}

},{"./":25}],27:[function(require,module,exports){
var _ = module.exports = require('./')

var is = _.is
var each = _.each
var forIn = _.forIn

_.only = function(obj, keys) {
	obj = obj || {}
	if (is.str(keys)) keys = keys.split(/ +/)
	return _.reduce(keys, function(ret, key) {
		if (null != obj[key]) ret[key] = obj[key]
		return ret
	}, {})
}

_.values = function(obj) {
	return _.map(_.keys(obj), function(key) {
		return obj[key]
	})
}

_.pick = function(obj, fn) {
	if (!is.fn(fn)) {
		return _.pick(obj, function(val, key) {
			return key == fn
		})
	}
	var ret = {}
	forIn(obj, function(val, key, obj) {
		if (fn(val, key, obj)) {
			ret[key] = val
		}
	})
	return ret
}

_.functions = function(obj) {
	return _.keys(_.pick(obj, function(val) {
		return is.fn(val)
	}))
}

_.mapKeys = function(obj, fn) {
	var ret = {}
	forIn(obj, function(val, key, obj) {
		var newKey = fn(val, key, obj)
		ret[newKey] = val
	})
	return ret
}

_.mapObject = _.mapValues = function(obj, fn) {
	var ret = {}
	forIn(obj, function(val, key, obj) {
		ret[key] = fn(val, key, obj)
	})
	return ret
}

// return value when walk through path, otherwise return empty
_.get = function(obj, path) {
	path = toPath(path)
	if (path.length) {
		var flag = _.every(path, function(key) {
			if (null != obj) { // obj can be indexed
				obj = obj[key]
				return true
			}
		})
		if (flag) return obj
	}
}

_.has = function(obj, path) {
	path = toPath(path)
	if (path.length) {
		var flag = _.every(path, function(key) {
			if (null != obj && is.owns(obj, key)) {
				obj = obj[key]
				return true
			}
		})
		if (flag) return true
	}
	return false
}

_.set = function(obj, path, val) {
	path = toPath(path)
	var cur = obj
	_.every(path, function(key, i) {
		if (is.oof(cur)) {
			if (i + 1 == path.length) {
				cur[key] = val
			} else {
				var item = cur[key]
				if (null == item) {
					// fill value with {} or []
					var item = {}
					if (~~key == key) {
						item = []
					}
				}
				cur = cur[key] = item
				return true
			}
		}
	})
	return obj
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

_.defaults = function() {
	var args = arguments
	var target = args[0]
	var sources = _.slice(args, 1)
	if (target) {
		_.each(sources, function(src) {
			_.mapObject(src, function(val, key) {
				if (is.undef(target[key])) {
					target[key] = val
				}
			})
		})
	}
	return target
}

_.isMatch = function(obj, src) {
	var ret = true
	obj = obj || {}
	forIn(src, function(val, key) {
		if (val !== obj[key]) {
			ret = false
			return false
		}
	})
	return ret
}

_.toPlainObject = function(val) {
	var ret = {}
	forIn(val, function(val, key) {
		ret[key] = val
	})
	return ret
}

_.invert = function(obj) {
	var ret = {}
	forIn(obj, function(val, key) {
		ret[val] = key
	})
	return ret
}

// topath, copy from lodash

var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g
var reEscapeChar = /\\(\\)?/g;

function toPath(val) {
	if (is.array(val)) return val
	var ret = []
	_.tostr(val).replace(rePropName, function(match, number, quote, string) {
		var item = number || match
		if (quote) {
			item = string.replace(reEscapeChar, '$1')
		}
		ret.push(item)
	})
	return ret
}

},{"./":25}],28:[function(require,module,exports){
var _ = module.exports = require('./')

_.tostr = tostr

var indexOf = _.indexOf

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

_.startsWith = function(str, val) {
	return 0 == indexOf(str, val)
}

_.endsWith = function(str, val) {
	val += '' // null => 'null'
	return val == _.slice(str, _.len(str) - _.len(val))
}

_.lower = function(str) {
	return tostr(str).toLowerCase()
}

_.upper = function(str) {
	return tostr(str).toUpperCase()
}

_.repeat = function(str, count) {
	return _.map(_.range(count), function() {
		return str
	}).join('')
}

_.padLeft = function(str, len, chars) {
	str = _.tostr(str)
	len = len || 0
	var delta = len - str.length
	return getPadStr(chars, delta) + str
}

_.padRight = function(str, len, chars) {
	str = _.tostr(str)
	len = len || 0
	var delta = len - str.length
	return str + getPadStr(chars, delta)
}

function getPadStr(chars, len) {
	chars = _.tostr(chars) || ' ' // '' will never end
	var count = Math.floor(len / chars.length) + 1
	return _.repeat(chars, count).slice(0, len)
}

function tostr(str) {
	if (str || 0 == str) return str + ''
	return ''
}

},{"./":25}],29:[function(require,module,exports){
var _ = module.exports = require('./')
var is = _.is

_.now = function() {
	return +new Date
}

_.constant = function(val) {
	return function() {
		return val
	}
}

_.identity = function(val) {
	return val
}

_.random = function(min, max) {
	return min + Math.floor(Math.random() * (max - min + 1))
}

_.mixin = function(dst, src, opt) {
	var keys = _.functions(src)
	if (dst) {
		if (is.fn(dst)) {
			opt = opt || {}
			var isChain = !!opt.chain
			// add to prototype
			var proto = dst.prototype
			_.each(keys, function(key) {
				var fn = src[key]
				proto[key] = function() {
					var me = this
					var args = [me.__value]
					args.push.apply(args, arguments)
					var ret = fn.apply(me, args)
					if (me.__chain) {
						me.__value = ret
						return me
					}
					return ret
				}
			})
		} else {
			_.each(keys, function(key) {
				dst[key] = src[key]
			})
		}
	}
	return dst
}

_.chain = function(val) {
	var ret = _(val)
	ret.__chain = true
	return ret
}

_.value = function() {
	this.__chain = false
	return this.__value
}

},{"./":25}],30:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"./src":35,"dup":20}],31:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21,"min-is":16}],32:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"./":35,"dup":22}],33:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"./":35,"dup":23}],34:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"./":35,"./cache":33,"dup":24}],35:[function(require,module,exports){
var cou = require('cou')

module.exports = cou.extend(_, cou)

require('./array')
require('./object')
require('./function')
require('./util')
require('./string')

_.mixin(_, _)

function _(val) {
	if (!(this instanceof _)) return new _(val)
	this.__value = val
	this.__chain = false
}


},{"./array":32,"./function":34,"./object":36,"./string":37,"./util":38,"cou":31}],36:[function(require,module,exports){
var _ = module.exports = require('./')

var is = _.is
var each = _.each
var forIn = _.forIn

_.only = function(obj, keys) {
	obj = obj || {}
	if (is.str(keys)) keys = keys.split(/ +/)
	return _.reduce(keys, function(ret, key) {
		if (null != obj[key]) ret[key] = obj[key]
		return ret
	}, {})
}

_.values = function(obj) {
	return _.map(_.keys(obj), function(key) {
		return obj[key]
	})
}

_.pick = function(obj, fn) {
	if (!is.fn(fn)) {
		return _.pick(obj, function(val, key) {
			return key == fn
		})
	}
	var ret = {}
	forIn(obj, function(val, key, obj) {
		if (fn(val, key, obj)) {
			ret[key] = val
		}
	})
	return ret
}

_.functions = function(obj) {
	return _.keys(_.pick(obj, function(val) {
		return is.fn(val)
	}))
}

_.mapObject = _.mapValues = function(obj, fn) {
	var ret = {}
	forIn(obj, function(val, key, obj) {
		ret[key] = fn(val, key, obj)
	})
	return ret
}

_.get = function(obj, path) {
	path = toPath(path)
	if (path.length) {
		var flag = _.every(path, function(key) {
			if (null != obj && key in Object(obj)) {
				obj = obj[key]
				return true
			}
		})
		if (flag) return obj
	}
}

_.has = function(obj, path) {
	path = toPath(path)
	if (path.length) {
		var flag = _.every(path, function(key) {
			if (null != obj && is.owns(obj, key)) {
				obj = obj[key]
				return true
			}
		})
		if (flag) return true
	}
	return false
}

_.set = function(obj, path, val) {
	path = toPath(path)
	var cur = obj
	_.every(path, function(key, i) {
		if (is.oof(cur)) {
			if (i + 1 == path.length) {
				cur[key] = val
			} else {
				var item = cur[key]
				if (null == item) {
					// fill value with {} or []
					var item = {}
					if (~~key == key) {
						item = []
					}
				}
				cur = cur[key] = item
				return true
			}
		}
	})
	return obj
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

_.defaults = function() {
	var args = arguments
	var target = args[0]
	var sources = _.slice(args, 1)
	if (target) {
		_.each(sources, function(src) {
			_.mapObject(src, function(val, key) {
				if (is.undef(target[key])) {
					target[key] = val
				}
			})
		})
	}
	return target
}

_.isMatch = function(obj, src) {
	var ret = true
	obj = obj || {}
	forIn(src, function(val, key) {
		if (val !== obj[key]) {
			ret = false
			return false
		}
	})
	return ret
}

_.toPlainObject = function(val) {
	var ret = {}
	forIn(val, function(val, key) {
		ret[key] = val
	})
	return ret
}

_.invert = function(obj) {
	var ret = {}
	forIn(obj, function(val, key) {
		ret[val] = key
	})
	return ret
}

// topath, copy from lodash

var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g
var reEscapeChar = /\\(\\)?/g;

function toPath(val) {
	if (is.array(val)) return val
	var ret = []
	_.tostr(val).replace(rePropName, function(match, number, quote, string) {
		var item = number || match
		if (quote) {
			item = string.replace(reEscapeChar, '$1')
		}
		ret.push(item)
	})
	return ret
}

},{"./":35}],37:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"./":35,"dup":28}],38:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"./":35,"dup":29}],39:[function(require,module,exports){
module.exports = exports = muid

exports.prefix = ''

function muid(len) {
	len = len || 7
	var random = Math.random().toString(35).substr(2, len)
	return exports.prefix + random
}

},{}]},{},[13])(13)
});
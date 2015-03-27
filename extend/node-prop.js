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

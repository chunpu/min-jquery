var querystring = require('min-qs')
var $ = require('../')

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
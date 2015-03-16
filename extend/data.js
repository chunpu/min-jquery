var uid = require('uid')
var _ = require('min-util')

module.exports = Data

function Data() {
	this.expando = uid()
	this.cache = []
}

_.extend(Data.prototype, {
	  get: function(owner, key) {
        var ret = this.cache[owner[this.expando]] || {}
        if (key) {
            return ret[key]
        }
        return ret
    }
    , set: function(owner, key, val) {
        var expando = this.expando
        var cache = this.cache
        if (owner[expando] >= 0) {
            cache[owner[expando]][key] = val
        } else {
            var len = cache.length
            owner[expando] = len
            cache[len] = {}
            cache[len][key] = val
        }
    }
    , remove: function(owner, key) {
        var expando = this.expando
        var cache = this.cache
        var len = owner[expando]
        if (len >= 0) {
            if (undefined === key) {
                cache[len] = {}
            } else {
                delete cache[len][key]
            }
        }
    }
})

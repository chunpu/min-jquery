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

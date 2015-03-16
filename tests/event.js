describe('event', function() {
    initWithoutClear('<div id="event"></div>')
    var $el = $('#event')

    it('simple on and trigger', function() {
        var i = 0
        var handler = function(ev) {
            assert($el[0] == this, 'this == element')
            assert.equal(ev.type, 'click')
            i++
        }
        $el.on('click', handler).trigger('click')
        assert.equal(i, 1)
    })

    it('off', function() {
        var i = 0
        var handler1 = function() {
            i++
        }
        var handler2 = function() {
            i += 2
        }
        $el.on('click', handler1).on('click', handler2)
        $el.off('click', handler2)
        $el.trigger('click')
        assert.equal(i, 1)

        $el.off()
        $el.trigger('click')
        assert.equal(i, 1)
    })

    it('multi', function() {
        var i = 0
        var handler1 = function() {
            i++
        }
        var handler2 = function() {
            i += 3
        }
        $el.on('ev1', handler1).on('ev2', handler2).trigger('ev1').trigger('ev2')
        assert.equal(i, 4)
        $el.off().trigger('ev1').trigger('ev2')
        assert.equal(i, 4)
    })

    it('namespace', function() {
        var i = 0
        var ns1 = function() {
            i++
        }
        var ns2 = function() {
            i += 3
        }
        $el.on('click.ns1', ns1).on('click.ns2', ns2).trigger('click')
        assert.equal(i, 1 + 3)
        $el.off('.ns1').trigger('click')
        assert.equal(i, 1 + 3 + 3)
    })
})

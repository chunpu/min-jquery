describe('display', function() {
    var $box = $('#display')

    it('show', function() {
        var $el = $('<div style="display: none">block</div>')
        var el = $el[0]
        $box.append($el)
        assert.equal('none', el.style.display)
        $el.show()
        assert.equal('', el.style.display)
        $el.show()
        assert.equal('', el.style.display)

        var $inline = $('<a style="display: none">inline</a>')
        var inline = $inline[0]
        $box.append($inline)
        assert.equal('none', inline.style.display)
        $inline.show()
        //assert.equal('inline', inline.style.display)
        $inline.show()
        //assert.equal('inline', inline.style.display)
    })

    it('hide', function() {
        var $el = $('<div>xxxx</div>')
        var el = $el[0]
        $box.append($el)
        $el.hide()
        assert.equal('none', el.style.display)
        $el.hide()
        assert.equal('none', el.style.display)
        $el.show()
        // assert.equal('', el.style.display) // TODO IE fucked?
        assert('' == el.style.display || 'block' == el.style.display)
    })

    it('toggle', function() {
        var $el = $('<a>xxxx</a>')
        var el = $el[0]
        $box.append($el)
        $el.toggle()
        assert.equal('none', el.style.display)
        $el.toggle()
        assert('' == el.style.display || 'inline' == el.style.display)
        $el.css('display', 'inline-block')
        $el.toggle()
        assert.equal('none', el.style.display)
        $el.toggle()
        assert.equal('inline-block', el.style.display)
    })
})

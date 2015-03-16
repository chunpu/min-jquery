describe('manipulation', function() {
    initWithoutClear("<div id='html'><div>html</div></div><div id='text'>text</div>")
    it('text', function() {
        assert.equal($('#text').text(), 'text')
        assert.equal($('#html').text(), 'html')
        assert.equal($('#text').text('new text').text(), 'new text')
    })

    it('html', function() {
        assert.equal($('#html').html().toLowerCase(), '<div>html</div>')
        assert.equal($('#html').html('new html').html(), 'new html')
        assert.equal($('#html').html('').html(), '')
    })

    it('append element', function() {
        var el = $('<a>link</a>')[0]
        var $box = $('#html')
        $box.html('')
        $box.append(el)
        assert.equal($box.html().toLowerCase(), '<a>link</a>')
    })

    it('append elements list', function() {
        var $el = $('<a>link</a><p>link2</p>')
        var $box = $('#html')
        $box.html('')
        $box.append($el)
        assert.equal($box.text().replace(/\s+/, ''), 'linklink2')
    })

    it('append html', function() {
        var $box = $('#html')
        $box.html('')
        $box.append('<a>link</a><p>link2</p>')
        assert.equal($box.text().replace(/\s+/, ''), 'linklink2')
    })

})

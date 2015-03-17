describe('find', function() {
    it('#id', function() {
        init('<ul id="ul"></ul>')
        var $ul = $('#ul')
        assert.equal(1, $ul.length, 'find id')
        assert.equal($ul[0].id, 'ul')

        var empty = $('#ul', $ul[0])
        assert.equal(empty.length, 0, 'not a document')
    })

    it('tag', function() {
        init('<ul id="ul"><li><a class="inul"></a></li><li><a class="inul"></a></li></ul>')
        var $ul = $('ul')
        assert($ul.length > 0, 'get at least one <ul>')
        assert($ul[0].tagName.toUpperCase(), 'UL')

        var ul = $('#ul')[0]
        var $a = $(ul).find('a')
        assert($a.length == 2, 'ul has 2 a')
        for (var i = 0, a; a = $a[i++];) {
            assert.equal(a.className, 'inul', 'a should inside ul')
            assert.equal(a.tagName.toUpperCase(), 'A', 'tagName is A')
        }
    })
})

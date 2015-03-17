describe('class-list', function() {
	it('should add the class name', function() {
		var div = $('<div>')
		div[0].className = 'foo'
		div.addClass('bar')
		assert(-1 != div[0].className.indexOf('foo'))
		assert(-1 != div[0].className.indexOf('bar'))
	})

	it('should remove the class name', function() {
		var div = $('<div>')
		div[0].className = 'foo bar foo bar2'
		div.removeClass('foo')
		assert('bar bar2' == div[0].className)
	})
})

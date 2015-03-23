describe('class-list', function() {
	it('should add or remove multi class name', function() {
		var div = $('<div>')
		div[0].className = 'foo'
		div.addClass('bar')

		assert(-1 != div[0].className.indexOf('foo'))
		assert(-1 != div[0].className.indexOf('bar'))
		div.addClass('bar1', 'bar2')

		assert(-1 != div[0].className.indexOf('foo'))
		assert(-1 != div[0].className.indexOf('bar2'))
		assert(-1 != div[0].className.indexOf('bar1'))

		div.removeClass('bar', 'bar2')

		assert(-1 == div[0].className.indexOf('bar2'))
		assert(-1 == div[0].className.split(/\s+/).indexOf('bar'))
		assert(-1 != div[0].className.indexOf('bar1'))

	})

	it('is contain class', function() {
		var div = $('<div>')
		div[0].className = 'foo'
		assert(true === div.hasClass('foo'))
	})

	it('can toggle class', function() {
		var div = $('<div>')
		div[0].className = 'foo'
		div.toggleClass('foo')

		assert(-1 == div[0].className.indexOf('foo'))
		div[0].className = ''
		div.toggleClass('foo')
		assert(-1 != div[0].className.indexOf('foo'))

		div[0].className = 'foo'
		div.toggleClass('foo', true)
		assert(-1 != div[0].className.indexOf('foo'))
		div[0].className = ''
		div.toggleClass('foo', false)
		assert(-1 == div[0].className.indexOf('foo'))
	})

})

describe('dimension', function() {
	it('width outerWidth innerWidth', function() {
		var body = $('body')
		var width = body.width()
		var outerWidth = body.outerWidth()
		var innerWidth = body.innerWidth()
		
		assert(outerWidth > 100)
		assert(innerWidth > 100)
		assert(outerWidth >= width)
	})
})

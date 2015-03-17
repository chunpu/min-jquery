describe('offset', function() {
	it('should return offset top and left', function() {
		var body = $('body')
		var offset = body.offset()
		assert(offset.top >= 0)
		assert(offset.left >= 0)
	})
})

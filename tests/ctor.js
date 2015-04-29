describe('constructor', function() {
	it('should return arraylike', function() {
		//assert(0 == $().length)
		assert(3 == $([1, 2, 3]).length)
		assert(1 == $(global).length)
	})
})

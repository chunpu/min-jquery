describe('proto-util', function() {
	it('can this.each', function() {
		var arr = []
		assert(0 == $().length)
		$([1, 2, 3]).each(function(i, val) {
			arr.push(val)
		}).toArray()
		assert.deepEqual([1, 2, 3], arr)
	})
})

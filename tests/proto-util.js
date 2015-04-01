describe('proto-util', function() {
	it('can .each', function() {
		var arr = []
		assert(0 == $().length)
		$([1, 2, 3]).each(function(i, val) {
			arr.push(val)
		}).toArray()
		assert.deepEqual([1, 2, 3], arr)
	})

	it('can .map', function() {
		var arr = $([1, 2, 3]).map(function(i, val) {
			return val * 2
		}).toArray()
		assert.deepEqual([2, 4, 6], arr)
	})
})

describe('proto-util', function() {
	it('can this.each', function() {
		var arr = []
		$([1, 2, 3]).each(function(i, val) {
			arr.push(val)
		})
		assert.deepEqual([1, 2, 3], arr)
	})
})

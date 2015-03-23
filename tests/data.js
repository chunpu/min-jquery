describe('data', function() {
	var el = global.document.body
	it('basic', function() {
		$.data(el, 'foo', 'bar')
		assert.equal($.data(el, 'foo'), 'bar')
	})
	
	it('update', function() {
		$.data(el, 'foo', {
			a: 1
		})
		assert.deepEqual($.data(el, 'foo'), {
			a: 1
		})
		$.data(el, 'foo', {
			b: 2
		})
		assert.deepEqual($.data(el, 'foo'), {
			b: 2
		})
	})

	it('remove', function() {
		$.data(el, 'bar', 'foo')
		assert.equal($.data(el, 'bar'), 'foo')
		$.removeData(el)
		assert.deepEqual($.data(el), {})
	})

	it('multi set', function() {
		assert.deepEqual($.data(el), {})
		$.data(el, {
			a: 1,
			b: 2
		})
		assert.deepEqual($.data(el), {
			a: 1,
			b: 2
		})
	})

	it('$(el).data', function() {
		var $el = $(el)
		$(el).removeData()
		assert.deepEqual($el.data(), {})
		assert.equal($el.data('a', 222), $el)
		assert.equal($el.removeData(), $el)
		$el.data('a', 'not').removeData().data({
			a: 'oka',
			b: 'okb'
		}).data('c', 'okc')
		assert.deepEqual($el.data(), {
			a: 'oka',
			b: 'okb',
			c: 'okc'
		})
	})
})

describe('util', function() {

    it('basic', function() {
        assert($, '$')
        assert('object' == typeof $.fn, '$.fn')
        assert($.fn === $.prototype)
    })

    describe('util', function() {
        it('test each', function() {
            $.each(undefined, $.noop)
            var valArr = []
            $.each([1, 2, 3], function(k, v) {
                assert(this == v)
                valArr.push(v)
            })
            assert.deepEqual([1, 2, 3], valArr, 'should equal')
            valArr.length = 0
            $.each([1, 2, 3], function(k, v) {
                valArr.push(v)
                if (v == 2) return false
            })
            assert.deepEqual([1, 2], valArr, 'break loop')
        })
/*
        it('$.extend $.fn.extend', function() {
            $.extend({
                a: 1,
                b: 2
            })
            assert(1 === $.a)
            assert(2 === $.b)

            $.fn.extend({
                c: 3,
                d: 4
            })
            assert(3 === $.fn.c)
            assert(4 === $.fn.d)

            var raw = {a: 1, b: 2}
            var ret = $.extend(raw, {c: 3}, {d: 4})
            assert(ret === raw)
            assert.deepEqual(raw, {
                a: 1,
                b: 2,
                c: 3,
                d: 4
            })
        })
*/
        it('$.noop', function() {
            assert('function' == typeof $.noop)
        })

        it('$.grep', function() {
            assert.deepEqual(
                $.grep([1, 2, 3, 4, 5], function(val) {
                    return val > 3
                }), [4, 5]
            )
        })

        it('$.map', function() {
            assert.deepEqual(
                $.map([1, 0, 2, 4], function(val) {
                    return val + 1
                }), [2, 1, 3, 5]
            )
        })

        it('$.trim', function() {
            assert.equal($.trim('  qq   '), 'qq')
            var nbsp = String.fromCharCode(160)
            assert.equal($.trim('  ' + nbsp + 'qq ' + nbsp), 'qq')
            assert.equal($.trim(), '')
            assert.equal($.trim(' '), '')
            assert.equal($.trim(5), '5')
            assert.equal($.trim(false), 'false')
            assert.equal($.trim(null), '')
            assert.equal($.trim('ipad\xA0'), 'ipad')
            assert.equal($.trim('\uFEFF \xA0! | \uFEFF'), '! |')
        })

        it('$.proxy', function() {
            $.proxy(function(a, b, c, d) {
                assert.deepEqual(this, {a: 1})
                assert.equal(a, 2)
                assert(b, 3)
                assert.equal(c, 4)
                assert.equal(d, undefined)
            }, {a: 1}, 2, 3)(4)
        })

        it('$.now', function() {
            var now1 = $.now()
            var now2 = +new Date()
            assert(now2 - now1 < 100)
            assert(now1 > 10000000)
        })

        it('$.merge', function() {
            assert.deepEqual($.merge([1, 2], [3, 4]), [1, 2, 3, 4])
            assert.deepEqual($.merge([1, 2], {0: 3, 1: 4, length: 2}), [1, 2, 3, 4])
            assert.deepEqual($.merge({0: 1, 1: 2, length: 2}, [3, 4]), {
                0: 1,
                1: 2,
                2: 3,
                3: 4,
                length: 4
            })
        })

        it('$.error', function() {
            var i = 0
            try {
                $.error('error')
            } catch (e) {
                i++
                assert(e.message, 'error')
            }
            assert(i == 1)
        })
    })
})

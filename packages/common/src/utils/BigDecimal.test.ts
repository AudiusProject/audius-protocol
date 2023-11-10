import { AUDIO, BigDecimal, wAUDIO } from './BigDecimal'

describe('BigDecimal', function () {
  describe('constructor', function () {
    it('constructs properly using bigint', function () {
      expect(
        new BigDecimal(
          BigInt('1234567890123456789012345678901234567890')
        ).toString()
      ).toBe('1234567890123456789012345678901234567890')
    })
    it('constructs properly using negative bigint', function () {
      expect(
        new BigDecimal(
          BigInt('-1234567890123456789012345678901234567890')
        ).toString()
      ).toBe('-1234567890123456789012345678901234567890')
    })
    it('constructs properly using bigint and decimal places', function () {
      expect(
        new BigDecimal(
          BigInt('1234567890123456789012345678901234567890'),
          10
        ).toString()
      ).toBe('123456789012345678901234567890.1234567890')
    })
    it('constructs properly using string', function () {
      expect(new BigDecimal('123.456').toString()).toBe('123.456')
    })
    it('constructs properly using negative string', function () {
      expect(new BigDecimal('-123.456').toString()).toBe('-123.456')
    })
    it('constructs properly using string and decimal places', function () {
      expect(new BigDecimal('123.456').toString()).toBe('123.456')
    })
    it('constructs properly using number', function () {
      expect(new BigDecimal(123.456).toString()).toBe('123.456')
    })
    it('constructs properly using negative number', function () {
      expect(new BigDecimal(-123.456).toString()).toBe('-123.456')
    })
    it('constructs properly using another BigDecimal', function () {
      expect(new BigDecimal(new BigDecimal(1, 3)).toString()).toBe('1.000')
    })
    it('constructs properly using another negative BigDecimal', function () {
      expect(new BigDecimal(new BigDecimal(-1, 3)).toString()).toBe('-1.000')
    })
    it('constructs properly using another BigDecimal and decimal places', function () {
      expect(new BigDecimal(new BigDecimal(1, 3), 10).toString()).toBe(
        '1.0000000000'
      )
    })
    it('throws if using a number that uses scientific notation', function () {
      expect(() => new BigDecimal(0.00000000000000001).toString()).toThrow(
        'Number must not be in scientific notation'
      )
    })
    it('throws if using NaN', function () {
      expect(() => new BigDecimal(NaN).toString()).toThrow(
        'Number must be finite'
      )
    })
    it('throws if using infinite number', function () {
      expect(() => new BigDecimal(Number.POSITIVE_INFINITY).toString()).toThrow(
        'Number must be finite'
      )
    })
    it('throws if using bad string', function () {
      expect(() => new BigDecimal('hello').toString()).toThrow()
    })
  })
  describe('floor', function () {
    it('floors positive decimals correctly', function () {
      expect(new BigDecimal(1.2345).floor().toString()).toBe('1.0000')
    })
    it('floors negative decimals correctly', function () {
      expect(new BigDecimal(-1.2345).floor().toString()).toBe('-2.0000')
    })
    it('floors 0 correctly', function () {
      expect(new BigDecimal(0, 3).floor().toString()).toBe('0.000')
    })
    it('floors whole numbers correctly', function () {
      expect(new BigDecimal(4, 3).floor().toString()).toBe('4.000')
    })
    it('floors large numbers correctly', function () {
      expect(
        new BigDecimal(BigInt('1234567890123456789099999999999999999999'), 20)
          .floor()
          .toString()
      ).toBe('12345678901234567890.00000000000000000000')
    })
    it('floors tiny numbers correctly', function () {
      expect(new BigDecimal(BigInt('1'), 20).floor().toString()).toBe(
        '0.00000000000000000000'
      )
    })
    it('floors to arbitrary decimal places correctly', function () {
      expect(
        new BigDecimal(BigInt('1234567890123456789099999999999999999999'), 20)
          .floor(2)
          .toString()
      ).toBe('12345678901234567890.99000000000000000000')
    })
    it('throws when decimal places are out of range', function () {
      expect(() =>
        new BigDecimal(BigInt('1234567890123456789099999999999999999999'), 20)
          .floor(50)
          .toString()
      ).toThrow('Digits must be non-negative')
    })
    it('floors to zero if decimal places is beyond number', function () {
      expect(new BigDecimal(BigInt('12345'), 3).floor(-10).toString()).toBe(
        '0.000'
      )
    })
  })

  describe('ceil', function () {
    it('ceils positive decimals correctly', function () {
      expect(new BigDecimal(1.2345).ceil().toString()).toBe('2.0000')
    })
    it('ceils negative decimals correctly', function () {
      expect(new BigDecimal(-1.2345).ceil().toString()).toBe('-1.0000')
    })
    it('ceils 0 correctly', function () {
      expect(new BigDecimal(0, 3).ceil().toString()).toBe('0.000')
    })
    it('ceils whole numbers correctly', function () {
      expect(new BigDecimal(4, 3).ceil().toString()).toBe('4.000')
    })
    it('ceils large numbers correctly', function () {
      expect(
        new BigDecimal(BigInt('1234567890123456789099999999999999999999'), 20)
          .ceil()
          .toString()
      ).toBe('12345678901234567891.00000000000000000000')
    })
    it('ceils tiny numbers correctly', function () {
      expect(new BigDecimal(BigInt('1'), 20).ceil().toString()).toBe(
        '1.00000000000000000000'
      )
    })
    it('ceils to arbitrary decimal places correctly', function () {
      expect(
        new BigDecimal(BigInt('1234567890123456789000000000000000000001'), 20)
          .ceil(2)
          .toString()
      ).toBe('12345678901234567890.01000000000000000000')
    })
    it('throws when decimal places are out of range', function () {
      expect(() =>
        new BigDecimal(BigInt('1234567890123456789000000000000000000001'), 20)
          .ceil(50)
          .toString()
      ).toThrow('Digits must be non-negative')
    })
    it('ceils to 1s place of represented place if decimal places is beyond number', function () {
      expect(new BigDecimal(BigInt('12345'), 3).ceil(-10).toString()).toBe(
        '10000000000.000'
      )
    })
  })

  describe('trunc', function () {
    it('truncs positive decimals correctly', function () {
      expect(new BigDecimal(1.2345).trunc().toString()).toBe('1.0000')
    })
    it('truncs negative decimals correctly', function () {
      expect(new BigDecimal(-1.2345).trunc().toString()).toBe('-1.0000')
    })
    it('truncs 0 correctly', function () {
      expect(new BigDecimal(0, 3).trunc().toString()).toBe('0.000')
    })
    it('truncs whole numbers correctly', function () {
      expect(new BigDecimal(4, 3).trunc().toString()).toBe('4.000')
    })
    it('truncs large numbers correctly', function () {
      expect(
        new BigDecimal(BigInt('1234567890123456789099999999999999999999'), 20)
          .trunc()
          .toString()
      ).toBe('12345678901234567890.00000000000000000000')
    })
    it('truncs tiny numbers correctly', function () {
      expect(new BigDecimal(BigInt('1'), 20).trunc().toString()).toBe(
        '0.00000000000000000000'
      )
    })
    it('truncs to arbitrary decimal places correctly', function () {
      expect(
        new BigDecimal(BigInt('1234567890123456789099999999999999999999'), 20)
          .trunc(2)
          .toString()
      ).toBe('12345678901234567890.99000000000000000000')
    })
    it('throws when decimal places are out of range', function () {
      expect(() =>
        new BigDecimal(BigInt('1234567890123456789099999999999999999999'), 20)
          .trunc(50)
          .toString()
      ).toThrow('Digits must be non-negative')
    })
    it('truncs to 1s place of represented place if decimal places is beyond number', function () {
      expect(new BigDecimal(BigInt('12345'), 3).trunc(-10).toString()).toBe(
        '0.000'
      )
    })
  })

  describe('toPrecision', function () {
    it('work on positive numbers', function () {
      expect(new BigDecimal('1234.56789').toPrecision(7).toString()).toBe(
        '1234.56700'
      )
    })
    it('works on negative numbers', function () {
      expect(new BigDecimal('-1234.56789').toPrecision(7).toString()).toBe(
        '-1234.56700'
      )
    })
    it('works when precision is more than the number of digits', function () {
      expect(new BigDecimal('-1234.56789').toPrecision(100).toString()).toBe(
        '-1234.56789'
      )
    })
    it('works when precision is less than the number of decimal places', function () {
      expect(new BigDecimal('-1234.56789').toPrecision(2).toString()).toBe(
        '-1200.00000'
      )
    })
  })

  describe('toFixed', function () {
    it('rounds up positive numbers when appropriate', function () {
      expect(new BigDecimal('1234.5678').toFixed(2)).toBe('1234.57')
      expect(new BigDecimal('1234.5678').toFixed()).toBe('1235')
    })
    it('rounds down positive numbers when appropriate', function () {
      expect(new BigDecimal('8765.4321').toFixed(2)).toBe('8765.43')
      expect(new BigDecimal('8765.4321').toFixed()).toBe('8765')
    })
    it('rounds up negative numbers when appropriate', function () {
      expect(new BigDecimal('-1234.5678').toFixed(2)).toBe('-1234.57')
      expect(new BigDecimal('-1234.5678').toFixed()).toBe('-1235')
    })
    it('rounds down negative numbers when appropriate', function () {
      expect(new BigDecimal('-8765.4321').toFixed(2)).toBe('-8765.43')
      expect(new BigDecimal('-8765.4321').toFixed()).toBe('-8765')
    })
    it('has no decimal places when called without args', function () {
      expect(new BigDecimal('1', 5).toFixed()).toBe('1')
    })
    it('has as many decimal places as specified', function () {
      expect(new BigDecimal('1', 5).toFixed(3)).toBe('1.000')
    })
    it('adds additional decimal places if beyond the precision of the BigDecimal', function () {
      expect(new BigDecimal('1').toFixed(3)).toBe('1.000')
    })
    it('throws when using non-negative decimal places', function () {
      expect(() => new BigDecimal('1').toFixed(-1)).toThrow(
        'decimalPlaces must be non-negative'
      )
    })
  })

  describe('toShorthand', function () {
    it('shows zero correctly', function () {
      expect(new BigDecimal('0.00000').toShorthand()).toBe('0')
    })
    it('shows whole numbers correctly', function () {
      expect(new BigDecimal('8.0099').toShorthand()).toBe('8')
    })
    it('shows negative numbers correctly', function () {
      expect(new BigDecimal('-8.0099').toShorthand()).toBe('-8')
    })
    it('shows decimal numbers correctly', function () {
      expect(new BigDecimal('12.345').toShorthand()).toBe('12.34')
    })
    it('shows trailing zero if necessary', function () {
      expect(new BigDecimal('12.301').toShorthand()).toBe('12.30')
      expect(new BigDecimal('12.30').toShorthand()).toBe('12.30')
    })
    it('shows thousands correctly', function () {
      expect(new BigDecimal('9999.9999').toShorthand()).toBe('9999.99')
    })
    it('shows ten thousands correctly', function () {
      expect(new BigDecimal('10000.9999').toShorthand()).toBe('10K')
    })
    it('shows hundred thousands correctly', function () {
      expect(new BigDecimal('443123.9999').toShorthand()).toBe('443K')
    })
  })

  describe('helpers', function () {
    it('converts wAUDIO to AUDIO', function () {
      expect(AUDIO(wAUDIO(BigInt('12345678901234567890'))).toString()).toBe(
        '123456789012.345678900000000000'
      )
    })
    it('converts AUDIO to wAUDIO', function () {
      expect(wAUDIO(AUDIO(BigInt('12345678901234567890'))).toString()).toBe(
        '12.34567890'
      )
    })
  })
})

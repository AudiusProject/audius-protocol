import {
  CurrencyAmount,
  ceil,
  floor,
  fromFixedDecimalString,
  toFixedDecimalString,
  truncate,
  toDecimalString,
  fromDecimalString,
  AUDIO,
  wAUDIO,
  formatBalance,
  toFixedString
} from './currencyUtils'

describe('currency amount utils', function () {
  type FloorCeilToFixedDecimalStringTestCase = {
    fn: typeof floor | typeof ceil | typeof toFixedDecimalString
    args: readonly [bigint, number]
    expected: any
  }

  describe('floor', function () {
    const floorTestCases: FloorCeilToFixedDecimalStringTestCase[] = [
      { fn: floor, args: [BigInt(12300), 2], expected: BigInt(12300) },
      { fn: floor, args: [BigInt(12301), 2], expected: BigInt(12300) },
      { fn: floor, args: [BigInt(12350), 2], expected: BigInt(12300) },
      { fn: floor, args: [BigInt(12399), 2], expected: BigInt(12300) }
    ]

    for (const { fn, args, expected } of floorTestCases) {
      it(`${fn.name}(${args.join(', ')}) === ${expected}`, () => {
        expect(fn({ amount: args[0], decimals: args[1] })).toBe(expected)
      })
    }
  })

  describe('ceil', function () {
    const ceilTestCases: FloorCeilToFixedDecimalStringTestCase[] = [
      { fn: ceil, args: [BigInt(12300), 2], expected: BigInt(12300) },
      { fn: ceil, args: [BigInt(12301), 2], expected: BigInt(12400) },
      { fn: ceil, args: [BigInt(12350), 2], expected: BigInt(12400) },
      { fn: ceil, args: [BigInt(12399), 2], expected: BigInt(12400) }
    ]

    for (const { fn, args, expected } of ceilTestCases) {
      it(`${fn.name}(${args.join(', ')}) === ${expected}`, () => {
        expect(fn({ amount: args[0], decimals: args[1] })).toBe(expected)
      })
    }
  })

  describe('truncate', function () {
    type TruncateTestCase = {
      fn: typeof truncate
      args: readonly [bigint, number]
      expected: any
    }

    const truncateTestCases: TruncateTestCase[] = [
      { fn: truncate, args: [BigInt(12300), 2], expected: BigInt(12000) },
      { fn: truncate, args: [BigInt(12301), 2], expected: BigInt(12000) },
      { fn: truncate, args: [BigInt(12350), 2], expected: BigInt(12000) },
      { fn: truncate, args: [BigInt(12399), 2], expected: BigInt(12000) }
    ]

    for (const { fn, args, expected } of truncateTestCases) {
      it(`${fn.name}(${args.join(', ')}) === ${expected}`, () => {
        expect(fn(...args)).toBe(expected)
      })
    }
  })

  describe('toFixedDecimalString', function () {
    const toFixedDecimalStringTestCases: FloorCeilToFixedDecimalStringTestCase[] =
      [
        {
          fn: toFixedDecimalString,
          args: [BigInt(1234), 2],
          expected: '12.34'
        },
        {
          fn: toFixedDecimalString,
          args: [BigInt(1000), 2],
          expected: '10.00'
        },
        { fn: toFixedDecimalString, args: [BigInt(1), 2], expected: '0.01' },
        { fn: toFixedDecimalString, args: [BigInt(1234), 0], expected: '1234' }
      ]

    for (const { fn, args, expected } of toFixedDecimalStringTestCases) {
      it(`${fn.name}(${args.join(', ')}) === "${expected}"`, () => {
        expect(fn({ amount: args[0], decimals: args[1] })).toBe(expected)
      })
    }
  })

  describe('toDecimalString', function () {
    const toDecimalStringTestCases = [
      {
        fn: toDecimalString,
        args: { amount: BigInt('1234567890000'), decimals: 4 },
        expected: '123456789.0'
      },
      {
        fn: toDecimalString,
        args: { amount: BigInt('1234567890100'), decimals: 4 },
        expected: '123456789.01'
      },
      {
        fn: toDecimalString,
        args: { amount: BigInt('1234567890102'), decimals: 4 },
        expected: '123456789.0102'
      }
    ]

    for (const { fn, args, expected } of toDecimalStringTestCases) {
      it(`${fn.name}(${Object.values(args).join(
        ', '
      )}) === "${expected}"`, () => {
        expect(fn(args)).toBe(expected)
      })
    }
  })

  describe('fromDecimalString', function () {
    type FromDecimalStringTestCase = {
      fn: typeof fromDecimalString
      args: readonly [string, number]
      expected: CurrencyAmount
    }
    const fromDecimalStringTestCases: FromDecimalStringTestCase[] = [
      {
        fn: fromDecimalString,
        args: ['123456789.0', 4],
        expected: { amount: BigInt('1234567890000'), decimals: 4 }
      },
      {
        fn: fromDecimalString,
        args: ['123456789.01', 4],
        expected: { amount: BigInt('1234567890100'), decimals: 4 }
      },
      {
        fn: fromDecimalString,
        args: ['123456789.0102', 4],
        expected: { amount: BigInt('1234567890102'), decimals: 4 }
      }
    ]

    for (const { fn, args, expected } of fromDecimalStringTestCases) {
      it(`${fn.name}(${args.join(', ')}) === (${Object.values(expected).join(
        ', '
      )})`, () => {
        expect(fn(...args)).toMatchObject(expected)
      })
    }
  })

  describe('fromFixedDecimalString', function () {
    type FromFixedDecimalStringTestCase = {
      fn: typeof fromFixedDecimalString
      args: readonly [string]
      expected: any
    }
    const fromFixedDecimalStringTestCases: FromFixedDecimalStringTestCase[] = [
      {
        fn: fromFixedDecimalString,
        args: ['0.01'],
        expected: { amount: BigInt(1), decimals: 2 }
      },
      {
        fn: fromFixedDecimalString,
        args: ['1.23'],
        expected: { amount: BigInt(123), decimals: 2 }
      },
      {
        fn: fromFixedDecimalString,
        args: ['123'],
        expected: { amount: BigInt(123), decimals: 0 }
      },
      {
        fn: fromFixedDecimalString,
        args: ['1234567890.123456789012345678'],
        expected: {
          amount: BigInt('1234567890123456789012345678'),
          decimals: 18
        }
      }
    ]

    for (const { fn, args, expected } of fromFixedDecimalStringTestCases) {
      it(`${fn.name}(${args.join(', ')}) === (${Object.values(expected).join(
        ', '
      )})`, () => {
        expect(fn(...args)).toMatchObject(expected)
      })
    }
  })

  describe('to fixed string', function () {
    it('includes trailing 0s if inside decimal count', function () {
      expect(toFixedString(AUDIO(1.1), 2)).toBe('1.10')
    })
    it('excludes trailing decimals outside decimal count', function () {
      expect(toFixedString(AUDIO(123.456789), 2)).toBe('123.45')
    })
    it('works for non-decimal amounts', function () {
      expect(toFixedString(AUDIO(123), 2)).toBe('123.00')
    })
    it('works when decimals is 0', function () {
      expect(toFixedString(AUDIO(123), 0)).toBe('123')
    })
    it('throws when decimals is < 0', function () {
      expect(() => toFixedString(AUDIO(123), -1)).toThrow(
        'Decimals must be positive'
      )
    })
  })

  describe('format as a balance', function () {
    type ToBalanceSummaryTestCase = {
      fn: typeof formatBalance
      args: CurrencyAmount
      expected: string
    }
    const balanceSummaryTestCases: ToBalanceSummaryTestCase[] = [
      {
        fn: formatBalance,
        args: { amount: BigInt(0), decimals: 18 },
        expected: '0'
      },
      {
        fn: formatBalance,
        args: { amount: BigInt('8000000000000000000'), decimals: 18 },
        expected: '8'
      },
      {
        fn: formatBalance,
        args: { amount: BigInt('8000000000000110000'), decimals: 18 },
        expected: '8'
      },
      {
        fn: formatBalance,
        args: { amount: BigInt('8010000000000000000'), decimals: 18 },
        expected: '8.01'
      },
      {
        fn: formatBalance,
        args: { amount: BigInt('4210000000000000005500'), decimals: 18 },
        expected: '4210'
      },
      {
        fn: formatBalance,
        args: { amount: BigInt('9999995400000000000000'), decimals: 18 },
        expected: '9999.99'
      },
      {
        fn: formatBalance,
        args: { amount: BigInt('12345777777777777777777'), decimals: 18 },
        expected: '12K'
      },
      {
        fn: formatBalance,
        args: { amount: BigInt('560109954'), decimals: 4 },
        expected: '56K'
      }
    ]

    for (const { fn, args, expected } of balanceSummaryTestCases) {
      it(`${fn.name}(${toFixedDecimalString(args)}) === "${expected}"`, () => {
        expect(fn(args)).toBe(expected)
      })
    }
  })

  describe('CurrencyAmount constructor', function () {
    it('correctly constructs an AUDIO amount from a decimal string', function () {
      const { amount, decimals } = AUDIO('1.234')
      expect(amount).toBe(BigInt('1234000000000000000'))
      expect(decimals).toBe(18)
    })
    it('correctly constructs an AUDIO amount from a decimal number', function () {
      const { amount, decimals } = AUDIO(1.234)
      expect(amount).toBe(BigInt('1234000000000000000'))
      expect(decimals).toBe(18)
    })
    it('correctly constructs an AUDIO amount from the Wei amount', function () {
      const { amount, decimals } = AUDIO(BigInt('1234000000000000000'))
      expect(amount).toBe(BigInt('1234000000000000000'))
      expect(decimals).toBe(18)
    })
    it('correctly constructs an AUDIO amount from a different currency amount', function () {
      const { amount, decimals } = AUDIO({ amount: BigInt(1234), decimals: 3 })
      expect(amount).toBe(BigInt('1234000000000000000'))
      expect(decimals).toBe(18)
    })
    it('correctly converts wAUDIO to AUDIO', function () {
      const waudio = wAUDIO(BigInt(123400000))
      const { amount, decimals } = AUDIO(waudio)
      expect(amount).toBe(BigInt('1234000000000000000'))
      expect(decimals).toBe(18)
    })
  })
})

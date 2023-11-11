import type BN from 'bn.js'

/**
 * Parses a string into the constructor args for a {@link BigDecimal}.
 *
 * Doesn't do any validation of the string - if it's malformed the `BigInt`
 * construction will fail.
 * @param value The value represented as a fixed decimal string.
 * @param decimalPlaces The number of decimal places the result should have.
 * @returns
 */
const parseBigDecimalString = (
  value: string,
  decimalPlaces?: number
): BigDecimalCtorArgs => {
  let [whole, decimal] = value.split('.')
  decimal = decimal ?? ''
  if (decimalPlaces !== undefined) {
    decimal = decimal.padEnd(decimalPlaces, '0').substring(0, decimalPlaces)
  }
  return {
    value: BigInt(`${whole}${decimal}`),
    decimalPlaces: decimalPlaces ?? decimal.length
  }
}

type BigDecimalCtorArgs = {
  value: bigint
  decimalPlaces: number
}

/**
 * A custom options type for our custom toLocaleString() implementation, that
 * only allows a subset of the Intl.NumberFormat options.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat}
 */
type FormatOptions = {
  /**
   * Whether to use grouping separators, such as thousands separators or thousand/lakh/crore separators.
   *
   * Note: Does not support `'always'`, `'auto'`, or `'min2'`
   * @defaultValue `true`
   */
  useGrouping?: boolean
  /**
   * The minimum number of fraction digits to use.
   * @defaultValue `0`
   */
  minimumFractionDigits?: number
  /**
   * The maximum number of fraction digits to use.
   * @defaultValue `this.decimalPlaces` (include all decimal places)
   */
  maximumFractionDigits?: number
  /**
   * How decimals should be rounded.
   *
   * Possible values are:
   *
   * `'ceil'`
   *    > Round toward +∞. Positive values round up.
   *      Negative values round "more positive".
   *
   * `'floor'`
   *    > Round toward -∞. Positive values round down.
   *      Negative values round "more negative".
   *
   * `'trunc'` (default)
   *    > Round toward 0. This _magnitude_ of the value is always
   *      reduced by rounding. Positive values round down.
   *      Negative values round "less negative".
   *
   * `'halfExpand'`
   *    > Ties away from 0. Values above the half-increment round away from
   *      zero, and below towards 0. Does what Math.round() does.
   *
   * Note: Does not support `'expand'`, `'halfCeil'`, `'halfFloor'`,
   * `'halfTrunc'` or `'halfEven'`
   * @defaultValue `'trunc'`
   */
  roundingMode?: 'ceil' | 'floor' | 'trunc' | 'halfExpand'
  /**
   * The strategy for displaying trailing zeros on whole numbers.
   *
   * Possible values are:
   *
   * `'auto'` (default)
   *    > Keep trailing zeros according to minimumFractionDigits and
   *      minimumSignificantDigits.
   *
   * `'stripIfInteger'`
   *    > Remove the fraction digits if they are all zero. This is the same as
   *      "auto" if any of the fraction digits is non-zero.
   *
   * @defaultValue `'auto'`
   */
  trailingZeroDisplay?: 'auto' | 'stripIfInteger'
}

/**
 * Gets the default formatting options for toLocalString() for a given BigDecimal.
 *
 * Noticable differences from {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#moreprecision Intl.NumberFormat}:
 * - `maximumFractionDigits` is the total number of digits, not `3`.
 * - `roundingMode` is `'trunc'`.
 *
 * @param bigDecimal
 * @returns
 */
const defaultFormatOptions = (bigDecimal: BigDecimal) =>
  ({
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: bigDecimal.decimalPlaces,
    roundingMode: 'trunc',
    trailingZeroDisplay: 'auto'
  } as const)

/**
 * BigDecimal uses a BigInt and the number of decimal digits to represent a
 * fixed precision decimal number. It's useful for representing currency,
 * especially cryptocurrency, as balances and amounts are quite large but still
 * have decimal representations and formats.
 *
 * This class is not meant to be constructed manually, but rather using helpers
 * such as {@link AUDIO}, {@link wAUDIO}, {@link SOL}, and {@link USDC}.
 *
 * This class is not meant to be persisted and have math operated on it. It's
 * primarily convenience utilites for formatting these large numbers according
 * to their decimal counts. To do math on BigDecimal, do math on the internal
 * value instead.
 *
 * @example
 * // Math on values
 * wAUDIO(4).value + wAUDIO(5).value // 900000000n
 *
 * @example
 * // Automatically formats to fixed precision decimals
 * SOL(1).toString() // '1.000000000'
 *
 * @example
 * // Convert USDC to cents
 * USDC(1.32542).toFixed(2) // '1.33'
 *
 * @example
 * // Get the number of decimals in AUDIO
 * AUDIO(0).decimalPlaces // 18
 *
 * @see {@link AUDIO} for the Ethereum ERC-20 AUDIO token
 * @see {@link wAUDIO} for the Solana SPL "wrapped" AUDIO token
 * @see {@link SOL} for the Solana native SOL token
 * @see {@link USDC} for the Solana Circle USDC stablecoin token
 */
export class BigDecimal {
  public value: bigint
  public decimalPlaces: number

  /**
   * Constructs a `BigDecimal`.
   *
   * If `decimalPlaces` is not specified, the number of decimals is inferred.
   *
   * If `value` is a `BigDecimal`, converts to the new amount of decimals.
   * This may lose precision.
   *
   * @param value The value to be represented.
   * @param decimalPlaces The number of decimal places the value has.
   */
  constructor(
    value: BigDecimalCtorArgs | bigint | number | string | BN,
    decimalPlaces?: number
  ) {
    switch (typeof value) {
      case 'number': {
        if (!Number.isFinite(value)) {
          throw new Error('Number must be finite')
        }
        if (value.toString() === value.toExponential()) {
          throw new Error('Number must not be in scientific notation')
        }
        const parsed = parseBigDecimalString(value.toString(), decimalPlaces)
        this.value = parsed.value
        this.decimalPlaces = parsed.decimalPlaces
        break
      }
      case 'string': {
        const parsed = parseBigDecimalString(value, decimalPlaces)
        this.value = parsed.value
        this.decimalPlaces = parsed.decimalPlaces
        break
      }
      case 'object': {
        if (value instanceof BigDecimal) {
          const parsed = parseBigDecimalString(value.toString(), decimalPlaces)
          this.value = parsed.value
          this.decimalPlaces = parsed.decimalPlaces
        } else if ('value' in value) {
          this.value = value.value
          this.decimalPlaces = value.decimalPlaces
        } else {
          // Can't do `value instanceof BN` as the condition because BN is just
          // a type here, so checked for the CtorArgs instead and used `else`.
          this.value = BigInt(value.toString())
          this.decimalPlaces = decimalPlaces ?? 0
        }
        break
      }
      default:
        this.value = value
        this.decimalPlaces = decimalPlaces ?? 0
    }
  }

  /**
   * Math.ceil() but for BigDecimal.
   * @param decimalPlaces The number of decimal places ceil to.
   * @returns A new `BigDecimal` with the result for chaining.
   */
  public ceil(decimalPlaces?: number) {
    const digits = this.decimalPlaces - (decimalPlaces ?? 0)
    return this._ceil(digits)
  }

  private _ceil(digitsToRemove?: number) {
    const digitsCount = digitsToRemove ?? this.decimalPlaces
    if (digitsCount < 0) {
      throw new RangeError('Digits must be non-negative')
    }
    const divisor = BigInt(10 ** digitsCount)
    const bump = this.value % divisor > 0 ? BigInt(1) : BigInt(0)
    return new BigDecimal({
      value: (this.value / divisor + bump) * divisor,
      decimalPlaces: this.decimalPlaces
    })
  }

  /**
   * Math.floor() but for BigDecimal.
   * @param decimalPlaces The number of decimal places to floor to.
   * @returns A new `BigDecimal` with the result for chaining.
   */
  public floor(decimalPlaces?: number) {
    const digits = this.decimalPlaces - (decimalPlaces ?? 0)
    return this._floor(digits)
  }

  private _floor(digitsToRemove?: number) {
    const digitsCount = digitsToRemove ?? this.decimalPlaces
    if (digitsCount < 0) {
      throw new RangeError('Digits must be non-negative')
    }
    const divisor = BigInt(10 ** digitsCount)
    const signOffset =
      this.value < 0 && digitsCount > 0
        ? BigInt(-1 * 10 ** digitsCount)
        : BigInt(0)
    return new BigDecimal({
      value: (this.value / divisor) * divisor + signOffset,
      decimalPlaces: this.decimalPlaces
    })
  }

  /**
   * Math.trunc() but for BigDecimal.
   * @param decimalPlaces The number of decimal places to truncate to.
   * @returns A new `BigDecimal` with the result for chaining.
   */
  public trunc(decimalPlaces?: number) {
    const digits = this.decimalPlaces - (decimalPlaces ?? 0)
    return this._trunc(digits)
  }

  private _trunc(digitsToRemove?: number) {
    const digitsCount = digitsToRemove ?? this.decimalPlaces
    if (digitsCount < 0) {
      throw new RangeError('Digits must be non-negative')
    }
    const divisor = BigInt(10 ** digitsCount)
    return new BigDecimal({
      value: (this.value / divisor) * divisor,
      decimalPlaces: this.decimalPlaces
    })
  }

  /**
   * Math.round() but for BigDecimal.
   * @param decimalPlaces The number of decimal places to round to.
   * @returns A new `BigDecimal` with the result for chaining.
   */
  public round(decimalPlaces?: number) {
    const digits = this.decimalPlaces - (decimalPlaces ?? 0)
    return this._round(digits)
  }

  private _round(digitsToRemove?: number) {
    const digitsCount = digitsToRemove ?? this.decimalPlaces
    if (digitsCount < 0) {
      throw new RangeError('Digits must be non-negative')
    }
    // Divide to get the test digit in the ones place
    const divisor = BigInt(10 ** (digitsCount - 1))
    let quotient = this.value / divisor
    const signMultiplier = this.value > 0 ? BigInt(1) : BigInt(-1)
    const bump = signMultiplier * BigInt(10)
    // Check the ones place digit and modify 10s digit if it's >= 5
    if ((quotient * signMultiplier) % BigInt(10) >= 5) {
      quotient += bump
    }
    // Divide by 10 to remove the test digit
    quotient /= BigInt(10)
    // Multiply by the original divisor and 10 to get the number of digits back
    return new BigDecimal(quotient * divisor * BigInt(10), this.decimalPlaces)
  }

  /**
   * Number.toPrecision() but for BigDecimal.
   * @param significantDigits The number of significant digits to keep.
   * @returns The number truncated to the significant digits specified as a string.
   */
  public toPrecision(significantDigits: number) {
    const signOffset = this.value < 0 ? -1 : 0
    const digitsToRemove = Math.max(
      this.value.toString().length - significantDigits + signOffset,
      0
    )
    const str = this._trunc(digitsToRemove).toString()
    const decimalOffset = this.decimalPlaces > 0 ? -1 : 0
    return str.padEnd(significantDigits - decimalOffset - signOffset, '0')
  }

  /**
   * Number.toFixed() but for BigDecimal.
   * @param decimalPlaces The number of decimal places to show.
   * @returns The number rounded to the decimal places specifed as a string.
   */
  public toFixed(decimalPlaces?: number) {
    const decimalCount = decimalPlaces ?? 0
    if (decimalCount < 0) {
      throw new RangeError('decimalPlaces must be non-negative')
    }
    const d =
      decimalCount > this.decimalPlaces ? this : this.round(decimalCount)
    const [whole, decimalOrUndefined] = d.toString().split('.')
    const decimal = (decimalOrUndefined ?? '').padEnd(decimalCount + 1, '0')
    const decimalTruncated = decimal.substring(0, decimalCount)
    return decimalCount > 0 ? `${whole}.${decimalTruncated}` : whole
  }

  /**
   * Represents the BigDecimal as a fixed decimal string by inserting the
   * decimal point in the appropriate spot and padding any needed zeros.
   *
   * Not to be used for UI purposes.
   *
   * @see {@link toLocaleString} for UI appropriate strings.
   */
  public toString() {
    const str = this.value.toString().padStart(this.decimalPlaces + 1, '0')
    return this.decimalPlaces > 0
      ? `${str.substring(0, str.length - this.decimalPlaces)}.${str.substring(
          str.length - this.decimalPlaces
        )}`
      : str
  }

  /**
   * Analogous to Number().toLocaleString(), with some important differences in
   * the options available and the defaults. Be sure to check the defaults.
   *
   * @see {@link defaultFormatOptions}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat Mozilla NumberFormat documentation}
   *
   * @param locale The string specifying the locale (default is 'en-US').
   * @param options The options for formatting. The available options and defaults are different than NumberFormat.
   */
  public toLocaleString(locale?: string, options?: FormatOptions) {
    // Apply defaults
    options = {
      ...defaultFormatOptions(this),
      ...options
    }
    // Apply rounding method
    let str = ''
    switch (options.roundingMode) {
      case 'ceil':
        str = this.ceil(options.maximumFractionDigits).toString()
        break
      case 'floor':
        str = this.floor(options.maximumFractionDigits).toString()
        break
      case 'trunc':
        str = this.trunc(options.maximumFractionDigits).toString()
        break
      case 'halfExpand':
        str = this.round(options.maximumFractionDigits).toString()
        break
    }

    let [whole, decimal] = str.split('.')

    // Strip trailing zeros
    decimal = (decimal ?? '').replace(/0+$/, '')

    if (options.minimumFractionDigits !== undefined) {
      if (
        options.trailingZeroDisplay !== 'stripIfInteger' ||
        BigInt(decimal) !== BigInt(0)
      ) {
        decimal = decimal.padEnd(options.minimumFractionDigits, '0')
      }
    }

    // Localize with a decimal to extract the separator
    const wholeInt = BigInt(whole)
    const wholeWithDecimal = wholeInt.toLocaleString(locale, {
      ...options,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })
    // Get the separator character
    const decimalSeparator = wholeWithDecimal.substring(
      wholeWithDecimal.length - 2,
      wholeWithDecimal.length - 1
    )
    // Remove the decimal
    whole = wholeWithDecimal.substring(0, wholeWithDecimal.length - 2)
    return decimal.length > 0 ? `${whole}${decimalSeparator}${decimal}` : whole
  }

  /**
   * Formats the decimal as an easy-to-read shorthand summary.
   * Used primarily for balances in tiles and headers.
   *
   * - Always truncates, never rounds up. (eg. `1.9999 => "1.99"`)
   * - Don't show decimal places if they'd appear as 0. (eg. `1.00234 => "1"`)
   * - Shows two decimal places if they'd be non-zero. (eg. `1.234 => "1.23"`)
   * - Count by 1,000s if over 10k (eg. `25413 => "25k"`)
   *
   * @example
   * 0 => "0"
   * 8 => "8"
   * 8.01 => "8.01"
   * 8.10 => "8.10"
   * 4,210 => "4210"
   * 9,999.99 => "9999.99"
   * 56,010 => "56K"
   * 443,123 => "443K"
   */
  public toShorthand() {
    if (this.value === BigInt(0)) {
      return '0'
    }
    const divisor = BigInt(10 ** this.decimalPlaces)
    const quotient = this.value / divisor
    if (quotient >= 10000) {
      return `${quotient / BigInt(1000)}K`
    } else if (this.value % divisor === BigInt(0)) {
      return quotient.toString()
    } else {
      const amountString = this.value.toString()
      const decimalStart = amountString.length - this.decimalPlaces
      // Get the first two decimals (truncated)
      const decimal = amountString.substring(decimalStart, decimalStart + 2)
      if (decimal === '00') {
        return quotient.toString()
      }
      return `${quotient}.${decimal}`
    }
  }
}

const createTokenConstructor =
  <T extends BigDecimal>(
    decimalPlaces: ConstructorParameters<typeof BigDecimal>[1]
  ) =>
  (value: ConstructorParameters<typeof BigDecimal>[0]): T =>
    new BigDecimal(value, decimalPlaces) as T

type AudioTokens = BigDecimal & { _brand: 'AUDIO' }
/**
 * Constructs a {@link BigDecimal} representing an amount of Ethereum ERC-20
 * AUDIO tokens, which have 18 decimal places.
 *
 * Used on the protocol dashboard and in the governance and staking systems.
 * Also used for balance totals after adding linked wallets on the Rewards page.
 */
export const AUDIO = createTokenConstructor<AudioTokens>(18)

type wAudioTokens = BigDecimal & { _brand: 'wAUDIO' }
/**
 * Constructs a {@link BigDecimal} representing an amount of Solana SPL AUDIO
 * tokens, which have 8 decimal places.
 *
 * Used for in-app experiences, like tipping and rewards.
 */
export const wAUDIO = createTokenConstructor<wAudioTokens>(8)

type SolTokens = BigDecimal & { _brand: 'SOL' }
/**
 * Constructs a {@link BigDecimal} representing an amount of Solana native SOL
 * tokens, which have 9 decimal places.
 *
 * Used as an intermediary token for purchasing wAUDIO and for paying for fees
 * of Solana transactions on the platform.
 */
export const SOL = createTokenConstructor<SolTokens>(9)

type UsdcTokens = BigDecimal & { _brand: 'USDC' }
/**
 * Constructs a {@link BigDecimal} representing an amount of Solana SPL USDC
 * tokens, which have 6 decimal places.
 *
 * Used for purchasing content in-app, and getting "USD" prices via Jupiter
 * for the wAUDIO token and SOL.
 */
export const USDC = createTokenConstructor<UsdcTokens>(6)

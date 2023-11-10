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
    value: BigDecimalCtorArgs | bigint | number | string,
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
        } else {
          this.value = value.value
          this.decimalPlaces = value.decimalPlaces
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
   *
   * Also allows specifying the number of decimals to keep.
   *
   * @param decimalPlaces The number of decimal places to keep before ceiling.
   * @returns A new `BigDecimal` with the result for chaining.
   *
   * @example
   * // Specifying how many decimals to keep
   * new BigDecimal('1.234').ceil(1).toString() // '1.300'
   *
   * @example
   * // Specifying a negative number ceils away whole parts
   * new BigDecimal('1234.1234').ceil(-1).toString() // '1240.0000'
   */
  public ceil(decimalPlaces?: number) {
    const digits = this.decimalPlaces - (decimalPlaces ?? 0)
    return this._ceil(digits)
  }

  private _ceil(digits?: number) {
    const digitsCount = digits ?? this.decimalPlaces
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
   *
   * Also allows specifying the number of decimals to keep.
   *
   * @param decimalPlaces The number of decimal places to keep before flooring.
   * @returns A new `BigDecimal` with the result for chaining.
   *
   * @example
   * // Specifying how many decimals to keep
   * new BigDecimal('1.234').floor(1).toString() // '1.200'
   *
   * @example
   * // Specifying a negative number floors away whole parts
   * new BigDecimal('1234.1234').floor(-1).toString() // '1230.0000'
   */
  public floor(decimalPlaces?: number) {
    const digits = this.decimalPlaces - (decimalPlaces ?? 0)
    return this._floor(digits)
  }

  private _floor(digits?: number) {
    const digitsCount = digits ?? this.decimalPlaces
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
   * Number.toPrecision() but for BigDecimal.
   * @param significantDigits The number of significant digits to keep.
   * @returns A new BigDecimal with the result for chaining.
   */
  public toPrecision(significantDigits: number) {
    const signOffset = this.value < 0 ? -1 : 0
    const digits = Math.max(
      this.value.toString().length - significantDigits + signOffset,
      0
    )
    return this.value > 0 ? this._floor(digits) : this._ceil(digits)
  }

  /**
   * Number.toFixed() but for BigDecimal.
   * @param decimalPlaces The number of decimal places to keep.
   * @returns A new `BigDecimal` with the result for chaining.
   */
  public toFixed(decimalPlaces?: number) {
    const decimalCount = decimalPlaces ?? 0
    const [whole, decimalOrUndefined] = this.toString().split('.')
    const decimal = (decimalOrUndefined ?? '').padEnd(decimalCount + 1, '0')
    const decimalTruncated = decimal.substring(0, decimalCount - 1)

    const digitToRound =
      decimalCount > 0
        ? Number(decimal[decimalCount - 1])
        : Number(whole[whole.length - 1])
    const testDigit = Number(decimal[decimalCount])
    const roundedDigit = testDigit >= 5 ? digitToRound + 1 : digitToRound

    if (decimalCount > 0) {
      return `${whole}.${decimalTruncated}${roundedDigit}`
    } else if (decimalCount === 0) {
      return whole.substring(0, whole.length - 1) + roundedDigit
    } else {
      throw new Error('decimalPlaces must be non-negative')
    }
  }

  /**
   * Represents the BigDecimal as a fixed decimal string by inserting the
   * decimal point in the appropriate spot and padding any needed zeros.
   */
  public toString() {
    const str = this.value.toString().padStart(this.decimalPlaces + 1, '0')
    return this.decimalPlaces > 0
      ? `${str.substring(0, str.length - this.decimalPlaces)}.${str.substring(
          str.length - this.decimalPlaces
        )}`
      : str
  }
}

const createTokenConstructor =
  (decimalPlaces: number) => (value: string | number | BigDecimal | bigint) =>
    new BigDecimal(value, decimalPlaces)

/**
 * Constructs a {@link BigDecimal} representing an amount of Ethereum ERC-20
 * AUDIO tokens, which have 18 decimal places.
 *
 * Used on the protocol dashboard and in the governance and staking systems.
 * Also used for balance totals after adding linked wallets on the Rewards page.
 */
export const AUDIO = createTokenConstructor(18)
/**
 * Constructs a {@link BigDecimal} representing an amount of Solana SPL AUDIO
 * tokens, which have 8 decimal places.
 *
 * Used for in-app experiences, like tipping and rewards.
 */
export const wAUDIO = createTokenConstructor(8)
/**
 * Constructs a {@link BigDecimal} representing an amount of Solana native SOL
 * tokens, which have 9 decimal places.
 *
 * Used as an intermediary token for purchasing wAUDIO and for paying for fees
 * of Solana transactions on the platform.
 */
export const SOL = createTokenConstructor(9)
/**
 * Constructs a {@link BigDecimal} representing an amount of Solana SPL USDC
 * tokens, which have 6 decimal places.
 *
 * Used for purchasing content in-app, and getting "USD" prices via Jupiter
 * for the wAUDIO token and SOL.
 */
export const USDC = createTokenConstructor(6)

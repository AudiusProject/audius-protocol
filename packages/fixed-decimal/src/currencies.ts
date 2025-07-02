import { FixedDecimal } from './FixedDecimal.js'
import { Brand } from './utilityTypes.js'

/**
 * Creates a {@link FixedDecimal} constructor for a currency.
 * @param decimalPlaces the number of decimal places for the currency
 */
const createTokenConstructor =
  <T extends bigint>(
    decimalPlaces: ConstructorParameters<typeof FixedDecimal<T>>[1],
    defaultFormatOptions?: ConstructorParameters<typeof FixedDecimal<T>>[2]
  ) =>
  (value: ConstructorParameters<typeof FixedDecimal<T>>[0]) =>
    new FixedDecimal<T>(value, decimalPlaces, defaultFormatOptions)

/**
 * A `bigint` representing an amount of Ethereum ERC-20 AUDIO tokens, which have
 * 18 decimal places, as a count of the smallest possible denomination of AUDIO.
 */
export type AudioWei = Brand<bigint, 'AUDIO'>
/**
 * Constructs an amount of {@link AudioWei} from a fixed decimal string,
 * decimal number, or a bigint in the smallest denomination of AUDIO.
 *
 * AUDIO is used on the protocol dashboard and in the governance and staking
 * systems. Also used for calculating the balance totals of all connected
 * wallets and the Hedgehog wallet on the Rewards page.
 */
export const AUDIO = createTokenConstructor<AudioWei>(18)

/**
 * A `bigint` representing an amount of Solana SPL AUDIO tokens, which have
 * 8 decimal places, as a count of the smallest possible denomination of wAUDIO.
 */
export type wAudioWei = bigint & { _brand: 'wAUDIO' }
/**
 * Constructs an amount of {@link wAudioWei} from a fixed decimal string,
 * decimal number, or a bigint in the smallest denomination of wAUDIO.
 *
 * wAUDIO is used for in-app experiences, like tipping and rewards.
 */
export const wAUDIO = createTokenConstructor<wAudioWei>(8)

/**
 * A `bigint` representing an amount of Solana native SOL tokens, which have
 * 9 decimal places, as a count of the smallest possible denomination of SOL.
 */
export type SolWei = bigint & { _brand: 'SOL' }
/**
 * Constructs an amount of {@link SolWei} from a fixed decimal string,
 * decimal number, or a bigint in the smallest denomination of SOL.
 *
 * SOL is used as an intermediary token for purchasing wAUDIO and for paying
 * for fees of Solana transactions on the platform.
 */
export const SOL = createTokenConstructor<SolWei>(9)

/**
 * A `bigint` representing an amount of Solana SPL USDC tokens, which have
 * 6 decimal places, as a count of the smallest possible denomination of USDC.
 */
export type UsdcWei = bigint & { _brand: 'USDC' }
/**
 * Constructs an amount of {@link UsdcWei} from a fixed decimal string,
 * decimal number, or a bigint in the smallest denomination of USDC.
 *
 * USDC is used for purchasing content in-app, and getting "USD" prices via
 * Jupiter for the wAUDIO token and SOL.
 */
export const USDC = createTokenConstructor<UsdcWei>(6, {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

/**
 * A `bigint` representing an amount of BONK tokens, which have
 * 5 decimal places, as a count of the smallest possible denomination of BONK.
 */
export type BonkWei = Brand<bigint, 'BONK'>
/**
 * Constructs an amount of {@link BonkWei} from a fixed decimal string,
 * decimal number, or a bigint in the smallest denomination of BONK.
 *
 * BONK is used for trading and swapping in the platform.
 */
export const BONK = createTokenConstructor<BonkWei>(5)

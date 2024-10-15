import type BN from 'bn.js'

import { FixedDecimal } from './FixedDecimal.js'
import { Brand } from './utilityTypes.js'

/**
 * Creates a {@link FixedDecimal} constructor for a currency.
 * @param decimalPlaces the number of decimal places for the currency
 */
const createTokenConstructor =
  <T extends bigint, K extends BN = BN>(
    decimalPlaces: ConstructorParameters<typeof FixedDecimal<T, K>>[1],
    defaultFormatOptions?: ConstructorParameters<typeof FixedDecimal<T, K>>[2]
  ) =>
  (value: ConstructorParameters<typeof FixedDecimal<T, K>>[0]) =>
    new FixedDecimal<T, K>(value, decimalPlaces, defaultFormatOptions)

/**
 * A `bigint` representing an amount of Ethereum ERC-20 AUDIO tokens, which have
 * 18 decimal places, as a count of the smallest possible denomination of AUDIO.
 */
export type AudioWei = Brand<bigint, 'AUDIO'>
/**
 * Same as @audius/common BNWei.
 * For backwards compatibility without circular dependency.
 */
export type BNWei = Brand<BN, 'BNWei'>
/**
 * Constructs an amount of {@link AudioWei} from a fixed decimal string,
 * decimal number, or a bigint or BN in the smallest denomination of AUDIO.
 *
 * AUDIO is used on the protocol dashboard and in the governance and staking
 * systems. Also used for calculating the balance totals of all connected
 * wallets and the Hedgehog wallet on the Rewards page.
 */
export const AUDIO = createTokenConstructor<AudioWei, BNWei>(18)

/**
 * A `bigint` representing an amount of Solana SPL AUDIO tokens, which have
 * 8 decimal places, as a count of the smallest possible denomination of wAUDIO.
 */
export type wAudioWei = bigint & { _brand: 'wAUDIO' }
/**
 * Same as @audius/common BNAudio.
 * For backwards compatibility without circular dependency.
 */
export type BNAudio = Brand<BN, 'BNAudio'>
/**
 * Constructs an amount of {@link wAudioWei} from a fixed decimal string,
 * decimal number, or a bigint or BN in the smallest denomination of wAUDIO.
 *
 * wAUDIO is used for in-app experiences, like tipping and rewards.
 */
export const wAUDIO = createTokenConstructor<wAudioWei, BNAudio>(8)

/**
 * A `bigint` representing an amount of Solana native SOL tokens, which have
 * 9 decimal places, as a count of the smallest possible denomination of SOL.
 */
export type SolWei = bigint & { _brand: 'SOL' }
/**
 * Constructs an amount of {@link SolWei} from a fixed decimal string,
 * decimal number, or a bigint or BN in the smallest denomination of SOL.
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
 * Same as @audius/common BNUSDC.
 * For backwards compatibility without circular dependency.
 */
export type BNUSDC = Brand<BN, 'BNUSDC'>
/**
 * Constructs an amount of {@link UsdcWei} from a fixed decimal string,
 * decimal number, or a bigint or BN in the smallest denomination of USDC.
 *
 * USDC is used for purchasing content in-app, and getting "USD" prices via
 * Jupiter for the wAUDIO token and SOL.
 */
export const USDC = createTokenConstructor<UsdcWei, BNUSDC>(6, {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

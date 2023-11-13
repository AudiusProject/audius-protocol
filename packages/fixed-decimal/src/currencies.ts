import { FixedDecimal } from './FixedDecimal'

/**
 * @ignore
 * Creates a {@link FixedDecimal} constructor for a currency.
 * @param decimalPlaces the number of decimal places for the currency
 */
const createTokenConstructor =
  <T extends FixedDecimal>(
    decimalPlaces: ConstructorParameters<typeof FixedDecimal>[1]
  ) =>
  (value: ConstructorParameters<typeof FixedDecimal>[0]): T =>
    new FixedDecimal(value, decimalPlaces) as T

/**
 * A {@link FixedDecimal} representing an amount of Ethereum ERC-20
 * AUDIO tokens, which have 18 decimal places.
 *
 * Used on the protocol dashboard and in the governance and staking systems.
 * Also used for balance totals after adding linked wallets on the Rewards page.
 */
type AudioTokens = FixedDecimal & { _brand: 'AUDIO' }
/**
 * Constructs an amount of {@link AudioTokens} from a fixed decimal string,
 * decimal number, or a bigint or BN in the smallest denomination.
 */
export const AUDIO = createTokenConstructor<AudioTokens>(18)

/**
 * A {@link FixedDecimal} representing an amount of Solana SPL AUDIO
 * tokens, which have 8 decimal places.
 *
 * Used for in-app experiences, like tipping and rewards.
 */
type wAudioTokens = FixedDecimal & { _brand: 'wAUDIO' }
/**
 * Constructs an amount of {@link wAudioTokens} from a fixed decimal string,
 * decimal number, or a bigint or BN in the smallest denomination.
 */
export const wAUDIO = createTokenConstructor<wAudioTokens>(8)

/**
 * A {@link FixedDecimal} representing an amount of Solana native SOL
 * tokens, which have 9 decimal places.
 *
 * Used as an intermediary token for purchasing wAUDIO and for paying for fees
 * of Solana transactions on the platform.
 */
type SolTokens = FixedDecimal & { _brand: 'SOL' }
/**
 * Constructs an amount of {@link SolTokens} from a fixed decimal string,
 * decimal number, or a bigint or BN in the smallest denomination.
 */
export const SOL = createTokenConstructor<SolTokens>(9)

/**
 * A {@link FixedDecimal} representing an amount of Solana SPL USDC
 * tokens, which have 6 decimal places.
 *
 * Used for purchasing content in-app, and getting "USD" prices via Jupiter
 * for the wAUDIO token and SOL.
 */
type UsdcTokens = FixedDecimal & { _brand: 'USDC' }
/**
 * Constructs an amount of {@link UsdcTokens} from a fixed decimal string,
 * decimal number, or a bigint or BN in the smallest denomination.
 */
export const USDC = createTokenConstructor<UsdcTokens>(6)

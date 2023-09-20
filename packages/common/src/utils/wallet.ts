import BN from 'bn.js'

import {
  BNAudio,
  BNUSDC,
  BNWei,
  StringAudio,
  StringUSDC,
  StringWei
} from 'models/Wallet'
import { AmountObject } from 'store/ui'
import {
  WEI,
  trimRightZeros,
  formatNumberCommas,
  formatWeiToAudioString,
  parseWeiNumber,
  convertFloatToWei
} from 'utils/formatUtil'
import { Nullable } from 'utils/typeUtils'

/** AUDIO utils */
const WEI_DECIMALS = 18 // 18 decimals on ETH AUDIO
const SPL_DECIMALS = 8 // 8 decimals on SPL AUDIO

export const zeroBNWei = new BN(0) as BNWei

export const weiToAudioString = (bnWei: BNWei): StringAudio => {
  const stringAudio = formatWeiToAudioString(bnWei) as StringAudio
  return stringAudio
}

export const weiToAudio = (bnWei: BNWei): BNAudio => {
  const stringAudio = formatWeiToAudioString(bnWei) as StringAudio
  return stringAudioToBN(stringAudio)
}

export const audioToWei = (stringAudio: StringAudio): BNWei => {
  const wei = parseWeiNumber(stringAudio) as BNWei
  return wei
}

export const stringWeiToBN = (stringWei: StringWei): BNWei => {
  return new BN(stringWei) as BNWei
}

export const stringAudioToBN = (stringAudio: StringAudio): BNAudio => {
  return new BN(stringAudio) as BNAudio
}

export const stringWeiToAudioBN = (stringWei: StringWei): BNAudio => {
  const bnWei = stringWeiToBN(stringWei)
  const stringAudio = weiToAudioString(bnWei)
  return new BN(stringAudio) as BNAudio
}

export const weiToString = (wei: BNWei): StringWei => {
  return wei.toString() as StringWei
}

export const stringAudioToStringWei = (stringAudio: StringAudio): StringWei => {
  return weiToString(audioToWei(stringAudio))
}

export const parseAudioInputToWei = (audio: StringAudio): Nullable<BNWei> => {
  if (!audio.length) return null
  // First try converting from float, in case audio has decimal value
  const floatWei = convertFloatToWei(audio) as Nullable<BNWei>
  if (floatWei) return floatWei
  // Safe to assume no decimals
  try {
    return audioToWei(audio)
  } catch {
    return null
  }
}

/**
 * Format wei BN to the full $AUDIO currency with decimals
 * @param amount The wei amount
 * @param shouldTruncate truncate decimals at truncation length
 * @param significantDigits if truncation set to true, how many significant digits to include
 * @returns $AUDIO The $AUDIO amount with decimals
 */
export const formatWei = (
  amount: BNWei,
  shouldTruncate = false,
  significantDigits = 4
): StringAudio => {
  const aud = amount.div(WEI)
  const wei = amount.sub(aud.mul(WEI))
  if (wei.isZero()) {
    return formatNumberCommas(aud.toString()) as StringAudio
  }
  const decimals = wei.toString().padStart(18, '0')

  let trimmed = `${aud}.${trimRightZeros(decimals)}`
  if (shouldTruncate) {
    const splitTrimmed = trimmed.split('.')
    const [before] = splitTrimmed
    let [, after] = splitTrimmed
    // If we have only zeros, just lose the decimal
    after = after.substr(0, significantDigits)
    if (parseInt(after) === 0) {
      trimmed = before
    } else {
      trimmed = `${before}.${after}`
    }
  }
  return formatNumberCommas(trimmed) as StringAudio
}

const convertBigIntToUIString = (amount: bigint, decimals: number) => {
  const str = amount.toString()
  return `${str.substring(0, str.length - decimals)}.${str.substring(
    str.length - decimals
  )}`
}

export const convertBigIntToAmountObject = (
  amount: bigint,
  decimals: number
): AmountObject => {
  return {
    amount: Number(amount),
    amountString: amount.toString(),
    uiAmount: Number(amount) / 10 ** decimals,
    uiAmountString: convertBigIntToUIString(amount, decimals)
  }
}

export const convertWAudioToWei = (amount: BN) => {
  const decimals = WEI_DECIMALS - SPL_DECIMALS
  return amount.mul(new BN('1'.padEnd(decimals + 1, '0'))) as BNWei
}

export const convertWeiToWAudio = (amount: BN) => {
  const decimals = WEI_DECIMALS - SPL_DECIMALS
  return amount.div(new BN('1'.padEnd(decimals + 1, '0')))
}

/** USDC Utils */
export const BN_USDC_WEI = new BN('1000000')
export const BN_USDC_CENT_WEI = new BN('10000')
const BN_USDC_WEI_ROUNDING_FRACTION = new BN('9999')

/** Round a USDC value as a BN up to the nearest cent and return as a BN */
export const ceilingBNUSDCToNearestCent = (value: BNUSDC): BNUSDC => {
  return value
    .add(BN_USDC_WEI_ROUNDING_FRACTION)
    .div(BN_USDC_CENT_WEI)
    .mul(BN_USDC_CENT_WEI) as BNUSDC
}

/** Round a USDC value as a BN down to the nearest cent and return as a BN */
export const floorBNUSDCToNearestCent = (value: BNUSDC): BNUSDC => {
  return value.div(BN_USDC_CENT_WEI).mul(BN_USDC_CENT_WEI) as BNUSDC
}

/** Formats a USDC wei string (full precision) to a fixed string suitable for
display as a dollar amount. Note: will lose precision by rounding _up_ to nearest cent */
export const formatUSDCWeiToUSDString = (amount: StringUSDC, precision = 2) => {
  // remove negative sign if present.
  const amountPos = amount.replace('-', '')
  // Since we only need two digits of precision, we will multiply up by 1000
  // with BN, divide by $1 Wei, ceiling up to the nearest cent,
  //  and then convert to JS number and divide back down before formatting to
  // two decimal places.
  const cents = formatUSDCWeiToCeilingDollarNumber(new BN(amountPos) as BNUSDC)
  return formatNumberCommas(cents.toFixed(precision))
}

/**
 * Formats a USDC BN (full precision) to a number of dollars.
 * Note: will lose precision by rounding _up_ to nearest cent.
 */
export const formatUSDCWeiToCeilingDollarNumber = (amount: BNUSDC) => {
  return (
    ceilingBNUSDCToNearestCent(amount).div(BN_USDC_CENT_WEI).toNumber() / 100
  )
}

/**
 * Formats a USDC BN (full precision) to a number of cents.
 * Note: will lose precision by rounding _up_ to nearest cent.
 */
export const formatUSDCWeiToCeilingCentsNumber = (amount: BNUSDC) => {
  return ceilingBNUSDCToNearestCent(amount).div(BN_USDC_CENT_WEI).toNumber()
}

/**
 * Formats a USDC BN (full precision) to a number of dollars.
 * Note: will lose precision by rounding _down_ to nearest cent.
 */
export const formatUSDCWeiToFloorDollarNumber = (amount: BNUSDC) => {
  return floorBNUSDCToNearestCent(amount).div(BN_USDC_CENT_WEI).toNumber() / 100
}

/**
 * Formats a USDC BN (full precision) to a number of cents.
 * Note: will lose precision by rounding _down_ to nearest cent.
 */
export const formatUSDCWeiToFloorCentsNumber = (amount: BNUSDC) => {
  return floorBNUSDCToNearestCent(amount).div(BN_USDC_CENT_WEI).toNumber()
}

/** General Wallet Utils */
export const shortenSPLAddress = (addr: string) => {
  return `${addr.substring(0, 4)}...${addr.substr(addr.length - 5)}`
}

export const shortenEthAddress = (addr: string) => {
  return `0x${addr.substring(2, 4)}...${addr.substr(addr.length - 5)}`
}

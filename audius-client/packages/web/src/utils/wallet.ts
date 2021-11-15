import BN from 'bn.js'

import { BNAudio, BNWei, StringAudio, StringWei } from 'common/models/Wallet'
import {
  WEI,
  trimRightZeros,
  formatNumberCommas,
  formatWeiToAudioString,
  parseWeiNumber
} from 'common/utils/formatUtil'

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

/**
 * Format wei BN to the full $AUDIO currency with decimals
 * @param {BN} amount The wei amount
 * @param {boolean} shouldTruncate truncate decimals at truncation length
 * @param {number} significantDigits if truncation set to true, how many significant digits to include
 * @returns {string} $AUDIO The $AUDIO amount with decimals
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
    let [before, after] = trimmed.split('.')
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

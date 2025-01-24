import BN from 'bn.js'
import { UserBasicInfo } from '../processNotifications/mappers/base'
import { getContentNode, getHostname } from './env'

export const AUDIO_DIVISOR = 100000000

export const formatNumberCommas = (num) => {
  const parts = num.toString().split('.')
  return (
    parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (parts[1] ? '.' + parts[1] : '')
  )
}

export const trimRightZeros = (number) => {
  return number.replace(/(\d)0+$/gm, '$1')
}

/** USDC Utils */
export const BN_USDC_WEI = new BN('1000000')
export const BN_USDC_CENT_WEI = new BN('10000')
const BN_USDC_WEI_ROUNDING_FRACTION = new BN('9999')

/** Round a USDC value as a BN up to the nearest cent and return as a BN */
export const ceilingBNUSDCToNearestCent = (value: BN): BN => {
  return value
    .add(BN_USDC_WEI_ROUNDING_FRACTION)
    .div(BN_USDC_CENT_WEI)
    .mul(BN_USDC_CENT_WEI) as BN
}

/** Formats a USDC wei string (full precision) to a fixed string suitable for
display as a dollar amount. Note: will lose precision by rounding _up_ to nearest cent */
export const formatUSDCWeiToUSDString = (amount: string, precision = 2) => {
  // Since we only need two digits of precision, we will multiply up by 1000
  // with BN, divide by $1 Wei, ceiling up to the nearest cent,
  //  and then convert to JS number and divide back down before formatting to
  // two decimal places.
  const cents =
    ceilingBNUSDCToNearestCent(new BN(amount) as BN)
      .div(BN_USDC_CENT_WEI)
      .toNumber() / 100
  return formatNumberCommas(cents.toFixed(precision))
}
const ETH_WEI = new BN('1000000000000000000')
const SOL_WEI = new BN('100000000')

export const formatWei = (
  num: string,
  chain: 'eth' | 'sol',
  shouldTruncate = false,
  significantDigits = 4
) => {
  const WEI = chain === 'eth' ? ETH_WEI : SOL_WEI
  const amount = new BN(num)
  const aud = amount.div(WEI)
  const wei = amount.sub(aud.mul(WEI))
  if (wei.isZero()) {
    return formatNumberCommas(aud.toString())
  }
  const decimals = wei.toString().padStart(18, '0')

  let trimmed = `${aud}.${trimRightZeros(decimals)}`
  if (shouldTruncate) {
    const [before, after] = trimmed.split('.')
    // If we have only zeros, just lose the decimal
    const trimmedAfter = after.substr(0, significantDigits)
    if (parseInt(trimmedAfter) === 0) {
      trimmed = before
    } else {
      trimmed = `${before}.${trimmedAfter}`
    }
  }
  return formatNumberCommas(trimmed)
}

export const getNumberSuffix = (num) => {
  if (num === 1) return 'st'
  else if (num === 2) return 'nd'
  else if (num === 3) return 'rd'
  return 'th'
}

export const formatImageUrl = (profilePictureSizes: string, size: number) => {
  return `${getContentNode()}/content/${profilePictureSizes}/${size}x${size}.jpg`
}

const PROFILE_PICTURE_PLACEHOLDER_URL =
  'https://download.audius.co/static-resources/email/imageProfilePicEmpty.png'

export const formatProfilePictureUrl = (user: UserBasicInfo) => {
  if (user.profile_picture_sizes) {
    return formatImageUrl(user.profile_picture_sizes, 480)
  } else if (user.profile_picture) {
    return `${getContentNode()}/content/${user.profile_picture}`
  } else {
    return PROFILE_PICTURE_PLACEHOLDER_URL
  }
}

export const formatProfileUrl = (handle: string) => {
  return `${getHostname()}/${handle}`
}

export const formatContentUrl = (handle: string, slug: string) => {
  return `${getHostname()}/${handle}/${slug}`
}

import BN from 'bn.js'
import numeral from 'numeral'

import { BNWei } from 'models/Wallet'

import dayjs from './dayjs'

/**
 * The format for counting numbers should be 4 characters if possible (3 numbers and 1 Letter) without trailing 0
 * ie.
 * 375 => 375
 * 4,210 => 4.21K
 * 56,010 => 56K
 * 443,123 => 443K
 * 4,001,000 => 4M Followers
 */
export const formatCount = (count: number) => {
  if (count >= 1000) {
    const countStr = count.toString()
    if (countStr.length % 3 === 0) {
      return numeral(count).format('0a').toUpperCase()
    } else if (countStr.length % 3 === 1 && countStr[2] !== '0') {
      return numeral(count).format('0.00a').toUpperCase()
    } else if (countStr.length % 3 === 1 && countStr[1] !== '0') {
      return numeral(count).format('0.0a').toUpperCase()
    } else if (countStr.length % 3 === 2 && countStr[2] !== '0') {
      return numeral(count).format('0.0a').toUpperCase()
    } else {
      return numeral(count).format('0a').toUpperCase()
    }
  } else if (!count) {
    return '0'
  } else {
    return `${count}`
  }
}

/**
 * The format any currency should be:
 * - show 0 if 0
 * - don't show decimal places if input is a round number
 * - show only up to 2 decimal places if input is not a round number
 * - round down to nearest thousand if input is greater than 10000
 * ie.
 * 0 => 0
 * 8 => 8
 * 8.01 => 8.01
 * 8.10 => 8.10
 * 4,210 => 4210
 * 9,999.99 => 9999.99
 * 56,010 => 56K
 * 443,123 => 443K
 */
export const formatCurrencyBalance = (amount: number) => {
  if (amount === 0) {
    return '0'
  } else if (amount >= 9999.995) {
    const roundedAmount = Math.floor(amount / 1000)
    return `${roundedAmount}K`
  } else if (Number.isInteger(amount)) {
    return amount.toString()
  } else {
    const decimalCount = amount > 10000 ? 0 : 2
    return amount.toFixed(decimalCount)
  }
}

/**
 * Formats a number of bytes into a nice looking string.
 * ie.
 * 1024 => 1.02 KB
 * 3072 => 3.07 KB
 */
export const formatBytes = (bytes: number) => {
  return numeral(bytes).format('0.00 b')
}

/**
 * Formats a URL name for routing.
 *  Removes reserved URL characters
 *  Replaces white space with -
 *  Lower cases
 */
export const formatUrlName = (name: string) => {
  if (!name) return ''
  return (
    name
      .replace(/!|%|#|\$|&|'|\(|\)|&|\*|\+|,|\/|:|;|=|\?|@|\[|\]/g, '')
      .replace(/\s+/g, '-')
      // Reduce repeated `-` to a single `-`
      .replace(/-+/g, '-')
      .toLowerCase()
  )
}

/**
 * Encodes a formatted URL name for routing.
 * Using window.location will automatically decode
 * the encoded component, so using the above formatUrlName(string) can
 * be used to compare results with the window.location directly.
 */
export const encodeUrlName = (name: string) => {
  return encodeURIComponent(formatUrlName(name))
}

/**
 * Formats a message for sharing
 */
export const formatShareText = (title: string, creator: string) => {
  return `${title} by ${creator} on Audius`
}

/**
 * Reduces multiple sequential newlines (> 3) into max `\n\n` and
 * trims both leading and trailing newlines
 */
export const squashNewLines = (str: string | null) => {
  return str ? str.replace(/\n\s*\n\s*\n/g, '\n\n').trim() : str
}

/** Trims a string to alphanumeric values only */
export const trimToAlphaNumeric = (string: string) => {
  if (!string) return string
  return string.replace(/[#|\W]+/g, '')
}

export const pluralize = (
  message: string,
  count: number | null,
  suffix = 's',
  pluralizeAnyway = false
) => `${message}${(count ?? 0) > 1 || pluralizeAnyway ? suffix : ''}`

/**
 * Format a $AUDIO string with commas and decimals
 * @param amount The $AUDIO amount
 * @param decimals Number of decimal places to display
 * @returns The formatted $AUDIO amount
 */
export const formatAudio = (amount: string, decimals?: number) => {
  // remove negative sign if present.
  const amountPos = amount.replace('-', '')
  let audio = (parseFloat(amountPos) / AUDIO_DIVISOR).toString()
  const formatString = '0,0' + (decimals ? '.' + '0'.repeat(decimals!) : '')
  audio = numeral(audio).format(formatString)
  return audio
}

// Wei -> Audio

export const formatWeiToAudioString = (wei: BNWei) => {
  const aud = wei.div(WEI_DIVISOR)
  return aud.toString()
}

/**
 * Format a number to have commas
 */
export const formatNumberCommas = (num: number | string) => {
  const parts = num.toString().split('.')
  return (
    parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (parts[1] ? '.' + parts[1] : '')
  )
}

export const formatPrice = (num: number) => {
  return formatNumberCommas((num / 100).toFixed(2))
}

export const trimRightZeros = (number: string) => {
  return number.replace(/(\d)0+$/gm, '$1')
}

export const AUDIO_DIVISOR = 100000000
export const WEI_DIVISOR = new BN('1000000000000000000')
export const USDC_DIVISOR = new BN('1000000')

export const checkOnlyNumeric = (number: string) => {
  const reg = /^\d+$/
  return reg.test(number)
}

export const checkOnlyWeiFloat = (number: string) => {
  const reg = /^[+-]?\d+(\.\d+)?$/
  const isFloat = reg.test(number)
  if (!isFloat) return false
  const nums = number.split('.')
  if (nums.length !== 2) return false
  if (!checkOnlyNumeric(nums[0]) || !checkOnlyNumeric(nums[1])) return false
  if (nums[1].length > 18) return false
  return true
}

export const convertFloatToWei = (number: string) => {
  const nums = number.split('.')
  if (nums.length !== 2) return null
  if (!checkOnlyNumeric(nums[0]) || !checkOnlyNumeric(nums[1])) return null
  const aud = new BN(nums[0]).mul(WEI_DIVISOR)
  const weiMultiplier = 18 - nums[1].length
  const wei = new BN(nums[1]).mul(new BN('1'.padEnd(weiMultiplier + 1, '0')))
  return aud.add(wei)
}

export const checkWeiNumber = (number: string) => {
  return checkOnlyNumeric(number) || checkOnlyWeiFloat(number)
}

// Audio -> Wei
export const parseWeiNumber = (number: string) => {
  if (checkOnlyNumeric(number)) {
    return new BN(number).mul(WEI_DIVISOR)
  } else if (checkOnlyWeiFloat(number)) {
    return convertFloatToWei(number)
  } else {
    return null
  }
}

type FormatOptions = {
  minDecimals?: number
  maxDecimals?: number
  excludeCommas?: boolean
}

export const formatNumberString = (
  number?: string,
  options?: FormatOptions
) => {
  if (!number) {
    return null
  }
  const parts = number.split('.')
  const res =
    parts.length > 1 && parts[1] !== undefined
      ? parts[0] +
        '.' +
        parts[1]
          .substring(0, options?.maxDecimals ?? parts[1].length)
          .padEnd(options?.minDecimals ?? 0, '0')
      : parts[0]
  return options?.excludeCommas ? res : formatNumberCommas(res)
}

export const formatCapitalizeString = (word: string) => {
  const lowerCase = word.toLowerCase()
  const firstChar = word.charAt(0).toUpperCase()
  return firstChar + lowerCase.slice(1)
}

export const formatMessageDate = (date: string) => {
  const d = dayjs(date)
  const today = dayjs()
  if (d.isBefore(today, 'week')) return d.format('M/D/YY h:mm A')
  if (d.isBefore(today, 'day')) return d.format('dddd h:mm A')
  return d.format('h:mm A')
}

/**
 * Generate a short base36 hash for a given string.
 * Used to generate short hashes for for queries and urls.
 */
export const getHash = (str: string) =>
  Math.abs(
    str.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
  ).toString(36)

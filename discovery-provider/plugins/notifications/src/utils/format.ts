import BN from 'bn.js'

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

const ETH_WEI = new BN('1000000000000000000')
const SOL_WEI = new BN('100000000')

export const formatWei = (num: string, chain: 'eth' | 'sol', shouldTruncate = false, significantDigits = 4) => {
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
    let [before, after] = trimmed.split('.')
    // If we have only zeros, just lose the decimal
    after = after.substr(0, significantDigits)
    if (parseInt(after) === 0) {
      trimmed = before
    } else {
      trimmed = `${before}.${after}`
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

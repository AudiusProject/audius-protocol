const BN = require('bn.js')

const WEI = new BN('1000000000000000000')

const formatNumberCommas = (num) => {
  const parts = num.toString().split('.')
  return (
    parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (parts[1] ? '.' + parts[1] : '')
  )
}

const trimRightZeros = (number) => {
  return number.replace(/(\d)0+$/gm, '$1')
}

// Copied from AudiusClient
const formatWei = (amount, shouldTruncate = false, significantDigits = 4) => {
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

const capitalize = (str) => {
  if (!str) return str
  if (str.length === 1) return str[0].toUpperCase()
  return `${str[0].toUpperCase()}${str.slice(1, str.length)}`
}

module.exports = {
  capitalize,
  formatWei
}

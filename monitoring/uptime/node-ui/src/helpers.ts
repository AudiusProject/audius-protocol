import BN from 'bn.js'
import { ethers } from 'ethers'

export function getAud(amount: BN) {
  const aud = amount.div(new BN('1000000000000000000'))
  const wei = amount.sub(aud.mul(new BN('1000000000000000000')))
  if (wei.isZero()) {
    return aud.toString()
  }
  const decimals = wei.toString().padStart(18, '0')
  return `${aud.toString()}.${trimRightZeros(decimals)}`
}

export function trimRightZeros(number: string) {
  return number.replace(/(\d)0+$/gm, '$1')
}

export const formatNumberCommas = (num: string) => {
  const parts = num.toString().split('.')
  return (
    parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (parts[1] ? '.' + parts[1] : '')
  )
}

export const formatWei = (amount: BN | null) => {
  if (!BN.isBN(amount as any)) return ''
  return formatNumberCommas(getAud(amount as BN))
}

export const utf8ToBytes32 = (utf8Str: string) => {
  return ethers.encodeBytes32String(utf8Str)
}

export const bytes32ToUtf8 = (bytes32Str: string) => {
  return ethers.decodeBytes32String(bytes32Str)
}

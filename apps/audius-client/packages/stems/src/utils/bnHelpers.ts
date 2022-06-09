import BN from 'bn.js'

export function getBNPercentage(n1: BN, n2: BN): number {
  if (n2.isZero()) return 0
  const thousand = new BN('1000')
  const num = n1.mul(thousand).div(n2)
  if (num.gte(thousand)) return 1
  return num.toNumber() / 1000
}

export function clampBN(value: BN, min: BN, max: BN): BN {
  return BN.min(BN.max(value, min), max)
}

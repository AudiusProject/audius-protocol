const BN = require('bn.js')

const MIN_WAUDIO_AMOUNT = new BN('1000000000') // 10^9

/**
 * Converts Wei Audio (BN) to wAudio (BN).
 * wAudio has only 9 digits of precision vs. 18 in Wei Audio.
 * The amount must be >= 10^9 and have no remainder when divided by 10^9.
 * @param {BN} amount Wei Audio amount
 */
const wAudioFromWeiAudio = (amount) => {
  if (amount.lt(MIN_WAUDIO_AMOUNT)) {
    throw new Error(
      `${amount.toString()} is below minimum bounds ${MIN_WAUDIO_AMOUNT.toString()}`
    )
  }
  const { div, mod } = amount.divmod(MIN_WAUDIO_AMOUNT)
  if (!mod.isZero()) {
    throw new Error(
      `${amount.toString()} is too precise for conversion to wAudio. Remainder: ${mod.toString()}`
    )
  }
  return div
}

module.exports = {
  wAudioFromWeiAudio
}

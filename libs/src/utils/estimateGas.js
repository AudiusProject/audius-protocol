// The absolute highest we will suggest for a gas limit (upper bound).
// Normally the gas estimator will estimate far far below this.
const GAS_LIMIT_MAXIMUM = 1000000

// Default multiplier on top of gas estimate to be extra safe that txns
// will go through
const GAS_LIMIT_MULTIPLIER = 1.05

/**
 * Returns estimated gas use for a txn for a contract method
 * @param options
 * @param {Method} options.method the contract method
 * @param {number} gasLimitMaximum the maximum amount of gas we will allow
 * (likely will return a number much smaller than this)
 * @param {number} multipler the multiplier to safe-guard against estimates that are too low
 */
const estimateGas = async ({
  method,
  gasLimitMaximum = GAS_LIMIT_MAXIMUM,
  multiplier = GAS_LIMIT_MULTIPLIER
}) => {
  const estimatedGas = await method.estimateGas({ gas: gasLimitMaximum })
  // Rounding is necessary here as fractional gas limits will break
  const safeEstimatedGas = Math.ceil(estimatedGas * multiplier)
  console.info(`Estimated gas limit ${safeEstimatedGas} for method ${method._method.name}`)
  return safeEstimatedGas
}

module.exports = { estimateGas }

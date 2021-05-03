// Default multiplier on top of gas estimate to be extra safe that txns
// will go through
const GAS_LIMIT_MULTIPLIER = 1.05

/**
 * Returns estimated gas use for a txn for a contract method
 * @param options
 * @param {Method} options.method the contract method
 * @param {string?} options.from address the method will be sent from (required if the contract requires a certain sender, e.g. guardian)
 * @param {number?} options.gasLimitMaximum the maximum amount of gas we will allow
 * (likely will return a number much smaller than this)
 * @param {number?} optionsmultipler the multiplier to safe-guard against estimates that are too low
 */
const estimateGas = async ({
  method,
  from,
  gasLimitMaximum,
  multiplier = GAS_LIMIT_MULTIPLIER
}) => {
  const estimatedGas = await method.estimateGas({ from, gas: gasLimitMaximum })
  // Rounding is necessary here as fractional gas limits will break
  const safeEstimatedGas = Math.ceil(estimatedGas * multiplier)
  console.info(`Estimated gas limit ${safeEstimatedGas} for method ${method._method.name}`)
  return safeEstimatedGas
}

module.exports = { estimateGas }

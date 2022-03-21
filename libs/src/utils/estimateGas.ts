// Default multiplier on top of gas estimate to be extra safe that txns
// will go through
const GAS_LIMIT_MULTIPLIER = 1.05

type Method = {
  estimateGas: (config: {from: string | undefined, gas: number | undefined}) => number
  _method: {
    name: string
  }
}

type EstimateGasConfig = {
  method: Method
  from?: string
  gasLimitMaximum?: number
  multiplier?: number

}

/**
 * Returns estimated gas use for a txn for a contract method
 * @param options
 * @param options.method the contract method
 * @param options.from address the method will be sent from (required if the contract requires a certain sender, e.g. guardian)
 * @param options.gasLimitMaximum the maximum amount of gas we will allow
 * (likely will return a number much smaller than this)
 * @param optionsmultipler the multiplier to safe-guard against estimates that are too low
 */
export const estimateGas = async ({
  method,
  from,
  gasLimitMaximum,
  multiplier = GAS_LIMIT_MULTIPLIER
}: EstimateGasConfig) => {
  try {
    const estimatedGas = await method.estimateGas({ from, gas: gasLimitMaximum })
    // Rounding is necessary here as fractional gas limits will break
    const safeEstimatedGas = Math.ceil(estimatedGas * multiplier)
    console.info(`Estimated gas limit ${safeEstimatedGas} for method ${method._method.name}`)
    return safeEstimatedGas
  } catch (e) {
    console.error(`Unable to estimate gas for transaction ${method._method.name}, using ${gasLimitMaximum}`)
    return gasLimitMaximum
  }
}
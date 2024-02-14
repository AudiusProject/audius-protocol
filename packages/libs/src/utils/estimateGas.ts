import type Wallet from 'ethereumjs-wallet'

// Default multiplier on top of gas estimate to be extra safe that txns
// will go through
const GAS_LIMIT_MULTIPLIER = 1.05

export interface ContractMethod {
  arguments: string[]
  estimateGas: (config: {
    from: Wallet | string | undefined
    gas: number | undefined
  }) => Promise<number>
  _method: {
    name: string
    inputs: Array<{ type: string }>
  }
  encodeABI: () => string
  send: <Tx>(config: {
    from: Wallet | string | undefined
    gas?: number
    gasPrice?: number
  }) => Tx
}

interface EstimateGasConfig {
  // The contract method
  method: ContractMethod
  // Address the method will be sent from (required if the contract requires a certain sender, e.g. guardian)
  from?: Wallet | string
  // The maximum amount of gas we will allow (likely will return a number much smaller than this)
  gasLimitMaximum: number
  // The multiplier to safe-guard against estimates that are too low
  multiplier?: number
  // Whether or not to throw if gas estimation fails. Usually this signals that a
  // contract call's simulation failed and likely the actual contract call will fail.
  shouldThrowIfGasEstimationFails?: boolean
}

/**
 * Returns estimated gas use for a txn for a contract method
 */
export const estimateGas = async ({
  method,
  from,
  gasLimitMaximum,
  multiplier = GAS_LIMIT_MULTIPLIER,
  shouldThrowIfGasEstimationFails = false
}: EstimateGasConfig) => {
  try {
    const estimatedGas = await method.estimateGas({
      from,
      gas: gasLimitMaximum
    })
    // Rounding is necessary here as fractional gas limits will break
    const safeEstimatedGas = Math.ceil(estimatedGas * multiplier)
    console.info(
      `Estimated gas limit ${safeEstimatedGas} for method ${method._method.name}`
    )
    return safeEstimatedGas
  } catch (e) {
    console.error(
      `Unable to estimate gas for transaction ${method._method.name}`,
      e
    )
    if (shouldThrowIfGasEstimationFails) {
      throw e
    }
    return gasLimitMaximum
  }
}

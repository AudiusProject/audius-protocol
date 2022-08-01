import type { AbiItem } from 'web3-utils'

export type ContractABI = {
  abi: AbiItem[]
  contractName: string
}

export const importEthContractABIs: (pathStr: string) => ContractABI

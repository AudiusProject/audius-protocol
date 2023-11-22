import type { AbiItem } from 'web3-utils'
import registryJSON from '../eth-contracts/ABIs/Registry.json'
import { useEnvVars } from '../providers/EnvVarsProvider'
import { useReadContract } from 'wagmi'
import { utf8ToBytes32 } from '../utils/utils'

type addressString = `0x${string}`

type ContractABI = {
  abi: AbiItem[]
  contractName: string
}

export const useContractAddress = (contractName: string) => {
  const envVars = useEnvVars()
  const result = useReadContract({
    abi: registryJSON.abi,
    address: envVars.ethRegistryAddress as addressString,
    functionName: 'getContract',
    args: [utf8ToBytes32(contractName)],
    query: {
      enabled: !!envVars.ethRegistryAddress,
      staleTime: Infinity // never refetch
    }
  })

  return {
    data: result.data,
    isPending: result.status === 'pending',
    error: result.error
  }
}

export const useEthContract = (
  json: ContractABI,
  functionName: string,
  args: any[]
) => {
  const {
    data: contractAddress,
    isPending: isContractAddressPending,
    error: contractAddressError
  } = useContractAddress(json.contractName)

  const result = useReadContract({
    abi: json.abi,
    address: contractAddress as addressString,
    functionName,
    args,
    query: {
      enabled: !!contractAddress,
      staleTime: Infinity // never refetch
    }
  })

  const isPending = isContractAddressPending || result.status === 'pending'
  const error = contractAddressError || result.error
  return {
    data: result.data,
    isPending,
    error
  }
}

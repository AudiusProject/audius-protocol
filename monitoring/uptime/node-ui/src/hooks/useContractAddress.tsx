import registryJSON from '../eth-contracts/ABIs/Registry.json'
import { useEnvVars } from '../providers/EnvVarsProvider'
import { useReadContract } from 'wagmi'
import { utf8ToBytes32 } from '../utils/utils'

export type addressString = `0x${string}`

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

  console.log(`useContractAddress ${result.status}`)
  return {
    data: result.data,
    isPending: result.status === 'pending',
    error: result.error
  }
}

import { type addressString, useContractAddress } from './useContractAddress'
import serviceTypeManagerJSON from '../eth-contracts/ABIs/ServiceTypeManager.json'
import { useReadContract } from 'wagmi'
import { utf8ToBytes32, bytes32ToUtf8 } from '../utils/utils'

export const serviceType = Object.freeze({
  DISCOVERY_PROVIDER: 'discovery-node',
  CREATOR_NODE: 'content-node'
})

const useMinChainVersion = (contractAddress: string, serviceType: string) => {
  const result = useReadContract({
    abi: serviceTypeManagerJSON.abi,
    address: contractAddress as addressString,
    functionName: 'getCurrentVersion',
    args: [utf8ToBytes32(serviceType)],
    query: {
      enabled: !!contractAddress,
      staleTime: Infinity // never refetch
    }
  })
  return {
    data: result.data ? bytes32ToUtf8(result.data) : result.data,
    status: result.status,
    error: result.error
  }
}

const useMinChainVersions = () => {
  // Get ServiceTypeManager's contract address
  const {
    data: contractAddress,
    isPending: isContractAddressPending,
    error: contractAddressError
  } = useContractAddress(serviceTypeManagerJSON.contractName)

  const expectedVersions: Record<string, string | null | undefined> = {}
  const {
    data: discoveryVersion,
    status: discoveryVersionStatus,
    error: discoveryVersionError
  } = useMinChainVersion(
    contractAddress as string,
    serviceType.DISCOVERY_PROVIDER
  )
  if (discoveryVersionStatus === 'success') {
    expectedVersions[serviceType.DISCOVERY_PROVIDER] = discoveryVersion
  }

  const {
    data: contentVersion,
    status: contentVersionStatus,
    error: contentVersionError
  } = useMinChainVersion(contractAddress as string, serviceType.CREATOR_NODE)
  if (contentVersionStatus === 'success') {
    expectedVersions[serviceType.CREATOR_NODE] = contentVersion
  }

  const isPending =
    isContractAddressPending ||
    discoveryVersionStatus === 'pending' ||
    contentVersionStatus === 'pending'
  const error =
    contractAddressError || discoveryVersionError || contentVersionError
  return {
    data: expectedVersions,
    isPending,
    error
  }
}

export default useMinChainVersions

import { useEthContract, type ContractABI } from './useEthContracts'
import serviceTypeManagerJSON from '../eth-contracts/ABIs/ServiceTypeManager.json'
import { utf8ToBytes32, bytes32ToUtf8 } from '../helpers'

export const serviceType = Object.freeze({
  DISCOVERY_PROVIDER: 'discovery-node',
  CREATOR_NODE: 'content-node'
})

const useMinChainVersions = () => {
  const expectedVersions: Record<string, string | null | undefined> = {}

  const {
    data: discoveryResult,
    isPending: isDiscoveryResultPending,
    error: discoveryResultError
  } = useEthContract(
    serviceTypeManagerJSON as ContractABI,
    'getCurrentVersion',
    [utf8ToBytes32(serviceType.DISCOVERY_PROVIDER)]
  )
  if (!isDiscoveryResultPending && !discoveryResultError && discoveryResult) {
    expectedVersions[serviceType.DISCOVERY_PROVIDER] = bytes32ToUtf8(
      discoveryResult as string
    )
  }

  const {
    data: contentResult,
    isPending: isContentResultPending,
    error: contentResultError
  } = useEthContract(
    serviceTypeManagerJSON as ContractABI,
    'getCurrentVersion',
    [utf8ToBytes32(serviceType.CREATOR_NODE)]
  )
  if (!isContentResultPending && !contentResultError && contentResult) {
    expectedVersions[serviceType.CREATOR_NODE] = bytes32ToUtf8(
      contentResult as string
    )
  }

  const isPending = isDiscoveryResultPending || isContentResultPending
  const error = discoveryResultError || contentResultError
  return {
    data: expectedVersions,
    isPending,
    error
  }
}

export default useMinChainVersions

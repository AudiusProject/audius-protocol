import type { ReadContractParameters } from 'viem'

import { abi } from './abi'
import { SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS } from './constants'

export const getGovernanceAddressParams: ReadContractParameters<typeof abi> = {
  address: SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS,
  abi,
  functionName: 'getGovernanceAddress'
}

export const setGovernanceAddressParams = null
export const addServiceTypeParams = null
export const removeServiceTypeParams = null
export const getServiceTypeInfoParams = null
export const getValidServiceTypesParams = null
export const serviceTypeIsValidParams = null
export const setServiceVersionParams = null
export const getVersionParams = null
export const getCurrentVersionParams = null
export const getNumberOfVersionsParams = null
export const serviceVersionIsValidParams = null

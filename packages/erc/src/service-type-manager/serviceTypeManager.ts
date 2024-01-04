import type { PublicClient } from 'viem'

import { abi } from './abi'
import { SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS } from './constants'

export const getGovernanceAddress = (client: PublicClient) =>
  client.readContract({
    address: SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS,
    abi,
    functionName: 'getGovernanceAddress'
  })

export const getServiceTypeInfo = (
  client: PublicClient,
  { serviceType }: { serviceType: `0x${string}` }
) =>
  client.readContract({
    address: SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS,
    abi,
    functionName: 'getServiceTypeInfo',
    args: [serviceType]
  })

export const getValidServiceTypes = (client: PublicClient) =>
  client.readContract({
    address: SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS,
    abi,
    functionName: 'getValidServiceTypes'
  })

export const serviceTypeIsValid = (
  client: PublicClient,
  { serviceType }: { serviceType: `0x${string}` }
) =>
  client.readContract({
    address: SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS,
    abi,
    functionName: 'serviceTypeIsValid',
    args: [serviceType]
  })

export const getVersion = (
  client: PublicClient,
  {
    serviceType,
    versionIndex
  }: { serviceType: `0x${string}`; versionIndex: bigint }
) =>
  client.readContract({
    address: SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS,
    abi,
    functionName: 'getVersion',
    args: [serviceType, versionIndex]
  })

export const getCurrentVersion = (
  client: PublicClient,
  { serviceType }: { serviceType: `0x${string}` }
) =>
  client.readContract({
    address: SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS,
    abi,
    functionName: 'getCurrentVersion',
    args: [serviceType]
  })

export const getNumberOfVersions = (
  client: PublicClient,
  { serviceType }: { serviceType: `0x${string}` }
) =>
  client.readContract({
    address: SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS,
    abi,
    functionName: 'getNumberOfVersions',
    args: [serviceType]
  })

// TODO - writes
export const setGovernanceAddress = null
export const addServiceType = null
export const removeServiceType = null
export const setServiceVersion = null
export const serviceVersionIsValid = null

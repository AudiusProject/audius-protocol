import type { PublicClient } from 'viem'

import { abi } from './abi'
import { SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS } from './constants'

export class ServiceTypeManager {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? SERVICE_TYPE_MANAGER_CONTRACT_ADDRESS
  }

  getGovernanceAddress = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getGovernanceAddress'
    })

  getServiceTypeInfo = ({ serviceType }: { serviceType: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getServiceTypeInfo',
      args: [serviceType]
    })

  getValidServiceTypes = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getValidServiceTypes'
    })

  serviceTypeIsValid = ({ serviceType }: { serviceType: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'serviceTypeIsValid',
      args: [serviceType]
    })

  getVersion = ({
    serviceType,
    versionIndex
  }: {
    serviceType: `0x${string}`
    versionIndex: bigint
  }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getVersion',
      args: [serviceType, versionIndex]
    })

  getCurrentVersion = ({ serviceType }: { serviceType: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getCurrentVersion',
      args: [serviceType]
    })

  getNumberOfVersions = ({ serviceType }: { serviceType: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getNumberOfVersions',
      args: [serviceType]
    })

  // TODO - writes
  setGovernanceAddress = null
  addServiceType = null
  removeServiceType = null
  setServiceVersion = null
  serviceVersionIsValid = null
}

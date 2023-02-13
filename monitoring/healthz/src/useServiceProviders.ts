import useSWR from 'swr'
import prod from './sps/prod.json'
import stage from './sps/stage.json'

export type NodeTypeID = 'content-node' | 'discovery-node'

export type SP = {
  id: string
  endpoint: string
  isRegistered: boolean
  delegateOwnerWallet: string
  type: {
    id: NodeTypeID
  }

  health?: any
  apiJson?: any
  discoveryHealth?: any
}

export function getServiceProviders(env: string, type: NodeTypeID): SP[] {
  const isStaging = env == 'staging'
  const sps = (isStaging ? stage : prod) as SP[]
  return sps.filter((sp) => sp.type.id == type)
}

export function useServiceProviders(env: string, type: NodeTypeID) {
  return useSWR<SP[]>([env, type], getServiceProviders)
}

export function useDiscoveryProviders() {
  return useServiceProviders('prod', 'discovery-node')
}

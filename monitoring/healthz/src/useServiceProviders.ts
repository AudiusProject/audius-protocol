import useSWR from 'swr'
import prod from './sps/prod.json'
import stage from './sps/stage.json'

export type SP = {
  endpoint: string
  isRegistered: boolean

  health?: any
  apiJson?: any
  discoveryHealth?: any
}

export function getServiceProviders(
  env: string,
  type: 'content-node' | 'discovery-node'
): SP[] {
  const isStaging = env == 'staging'
  const sps = isStaging ? stage : prod
  return sps.filter((sp) => sp.type.id == type)
}

export function useServiceProviders(
  env: string,
  type: 'content-node' | 'discovery-node'
) {
  return useSWR<SP[]>([env, type], getServiceProviders)
}

export function useDiscoveryProviders() {
  return useServiceProviders('prod', 'discovery-node')
}

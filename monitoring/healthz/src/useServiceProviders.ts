import useSWR from 'swr'
import { getRegisteredNodes } from './utils/contracts'

const prodEndpoint =
  'https://api.audius.co'

const stagingEndpoint =
  'https://api.stagdius.co'

export type SP = {
  delegateOwnerWallet: string
  endpoint: string
  isRegistered: boolean
  type: {
    id: string
  }

  health?: any
  apiJson?: any
  discoveryHealth?: any
}

export function apiGatewayFetcher(
  env: string,
  type: 'content' | 'discovery'
) {
  return fetch(`${env == 'staging' ? stagingEndpoint : prodEndpoint}/${type}/verbose?all=true`)
    .then(async (resp) => {
      const data = await resp.json()
      const sps = data.data as SP[]

      const hostSortKey = (sp: SP) =>
        new URL(sp.endpoint).hostname.split('.').reverse().join('.')

      // useful for finding duplicate wallets:
      // const hostSortKey = (sp: SP) => sp.delegateOwnerWallet

      sps.sort((a, b) => (hostSortKey(a) < hostSortKey(b) ? -1 : 1))
      // console.log(sps)
      return sps
    })
    .catch(async (e) => {
      // fallback to chain if GA is down
      console.warn("falling back to chain rpc to gather SPs", e)
      const sps = getRegisteredNodes(env, type)
      return sps
    })
}

export function useServiceProviders(
  env: string,
  type: 'content' | 'discovery'
) {
  const { data: sps, error } = useSWR<SP[]>([env, type], async () => {
    const sps = await apiGatewayFetcher(env, type)
    hostSort(sps)
    return sps
  })
  return { data: sps, error }
}

export function useDiscoveryProviders() {
  return useServiceProviders('prod', 'discovery')
}

export function useContentProviders() {
  return useServiceProviders('prod', 'content')
}

export function hostSort(sps: SP[]) {
  const hostSortKey = (sp: SP) =>
    new URL(sp.endpoint).hostname.split('.').reverse().join('.')
  sps.sort((a, b) => (hostSortKey(a) < hostSortKey(b) ? -1 : 1))
}

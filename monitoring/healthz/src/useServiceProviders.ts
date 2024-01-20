import useSWR from 'swr'
import { getRegisteredNodes } from './utils/contracts'

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
  return getRegisteredNodes(env, type)
    .then(async (resp) => {
      const sps = resp

      console.log({ oldSps: sps, type})

      const hostSortKey = (sp: SP) =>
        new URL(sp.endpoint).hostname.split('.').reverse().join('.')

      // useful for finding duplicate wallets:
      // const hostSortKey = (sp: SP) => sp.delegateOwnerWallet

      sps.sort((a, b) => (hostSortKey(a) < hostSortKey(b) ? -1 : 1))
      // console.log(sps)
      return sps
    })
}

export function useServiceProviders(
  env: string,
  type: 'content' | 'discovery'
) {
  const { data: sps, error } = useSWR<SP[]>([env, type], async () => {
    const sps = await apiGatewayFetcher(env, type)
    const shouldIncludeUnregistered =
      env !== 'prod' && type === 'discovery'
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

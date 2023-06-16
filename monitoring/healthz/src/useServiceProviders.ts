import useSWR from 'swr'

const prodEndpoint =
  'https://api.thegraph.com/subgraphs/name/audius-infra/audius-network-mainnet'

const stagingEndpoint =
  'https://api.thegraph.com/subgraphs/name/audius-infra/audius-network-goerli'

const gql = `
query ServiceProviders($type: String) {
  serviceNodes(where: {isRegistered: true, type: $type}) {
    delegateOwnerWallet
    endpoint
    isRegistered
    type {
      id
    }
  }
}
`

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

export function theGraphFetcher(
  env: string,
  type: 'content-node' | 'discovery-node'
) {
  return fetch(env == 'staging' ? stagingEndpoint : prodEndpoint, {
    method: 'POST',
    body: JSON.stringify({
      query: gql,
      variables: {
        type,
      },
    }),
  }).then(async (resp) => {
    const data = await resp.json()
    const sps = data.data.serviceNodes as SP[]

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
  type: 'content-node' | 'discovery-node'
) {
  const { data: sps, error } = useSWR<SP[]>([env, type], async () => {
    const sps = await theGraphFetcher(env, type)
    const shouldIncludeUnregistered =
      env !== 'prod' && type === 'discovery-node'
    if (shouldIncludeUnregistered) {
      sps.push(...unregisteredStageNodes())
      hostSort(sps)
    }
    return sps
  })
  return { data: sps, error }
}

export function useDiscoveryProviders() {
  return useServiceProviders('prod', 'discovery-node')
}

export function useContentProviders() {
  return useServiceProviders('prod', 'content-node')
}

export function hostSort(sps: SP[]) {
  const hostSortKey = (sp: SP) =>
    new URL(sp.endpoint).hostname.split('.').reverse().join('.')
  sps.sort((a, b) => (hostSortKey(a) < hostSortKey(b) ? -1 : 1))
}

function unregisteredStageNodes() {
  return [
    {
      delegateOwnerWallet: '0xb1C931A9ac123866372CEbb6bbAF50FfD18dd5DF',
      endpoint: 'https://discoveryprovider4.staging.audius.co',
      isRegistered: false,
      type: { id: 'discovery-node' },
    },
  ]
}

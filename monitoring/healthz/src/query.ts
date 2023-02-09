import { QueryClient } from '@tanstack/react-query'
import { getServiceProviders, SP } from './useServiceProviders'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 0,
    },
  },
})

export async function fetchSPs({ queryKey }: { queryKey: string[] }) {
  return queryClient.fetchQuery(queryKey, () =>
    getServiceProviders(queryKey[0], queryKey[1] as any)
  )
}

export async function fetchApi({ queryKey }: { queryKey: string[] }) {
  const sps = await fetchHealth({ queryKey })

  sps.map(async (sp) => {
    const apiUrl = `${sp.endpoint}${queryKey[2]}`
    const apiJson = await queryClient.fetchQuery([apiUrl], fetchUrl)

    // attach health to SP record
    queryClient.setQueryData(queryKey, (before: any[] | undefined) => {
      if (!before) throw new Error('impossible')

      return before.map((x) => {
        if (x.endpoint == sp.endpoint) {
          return { ...x, apiJson: apiJson.data }
        }
        return x
      })
    })
  })

  return sps
}

export async function fetchHealth({ queryKey }: { queryKey: string[] }) {
  const sps = await fetchSPs({ queryKey })

  // in a separate "thread" fetch the health for each endpoint
  sps.map(async (sp) => {
    const healthUrl = `${sp.endpoint}/health_check`
    const health = await queryClient.fetchQuery([healthUrl], fetchUrl)

    // attach health to SP record
    queryClient.setQueryData(queryKey, (before: any[] | undefined) => {
      if (!before) throw new Error('impossible')

      return before.map((x) => {
        if (x.endpoint == sp.endpoint) {
          return { ...x, health }
        }
        return x
      })
    })

    // in a second separate "thread"
    // if has selectedDiscoveryProvider,
    // fetch health myDiscovery
    const myDiscovery = health.data.selectedDiscoveryProvider
    if (myDiscovery) {
      const healthEndpoint = myDiscovery + '/health_check'
      const discoveryHealth = await queryClient.fetchQuery(
        [healthEndpoint],
        fetchUrl
      )

      queryClient.setQueryData(queryKey, (before: SP[] | undefined) => {
        if (!before) throw new Error('impossible2')
        return before.map((x) => {
          if (x.health?.data.selectedDiscoveryProvider == myDiscovery) {
            return { ...x, discoveryHealth }
          }
          return x
        })
      })
    }
  })

  return sps
}

export async function fetchUrl({ queryKey }: { queryKey: string[] }) {
  const url = queryKey[0]
  console.log('wut', queryKey, url)
  const resp = await fetch(url)
  if (resp.status != 200) {
    throw new Error(`${resp.status}: ${url}`)
  }
  const data = await resp.json()
  console.log('OK', data)
  return data
}

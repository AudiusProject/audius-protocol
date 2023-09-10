import { paramsToQueryString } from '../../utils/stringUtils'
import { Env } from '../env'
import { LocalStorage } from '../local-storage'

const DISCOVERY_PROVIDER_TIMESTAMP = '@audius/libs:discovery-node-timestamp'

export const getEagerDiscprov = async (
  localStorage: LocalStorage,
  env: Env
) => {
  const cachedDiscProvData = await localStorage.getItem(
    DISCOVERY_PROVIDER_TIMESTAMP
  )

  // Set the eager discprov to use to either
  // 1. local storage discprov if available
  // 2. dapp whitelist
  // Note: This discovery provider is only used on intial paint
  let eagerDiscprov: string
  if (cachedDiscProvData) {
    const cachedDiscprov = JSON.parse(cachedDiscProvData)
    eagerDiscprov = cachedDiscprov.endpoint
  } else {
    const EAGER_DISCOVERY_NODES = env.EAGER_DISCOVERY_NODES?.split(',') ?? []
    eagerDiscprov =
      EAGER_DISCOVERY_NODES[
        Math.floor(Math.random() * EAGER_DISCOVERY_NODES.length)
      ]
  }
  return eagerDiscprov
}

/**
 * Takes a request object provided from the audius libs API and makes the request
 * using the fetch API.
 */
export const makeEagerRequest = async (
  req: any,
  endpoint: string,
  requiresUser = false,
  localStorage: LocalStorage,
  env: Env
) => {
  const eagerDiscprov = await getEagerDiscprov(localStorage, env)
  const discprovEndpoint = endpoint ?? eagerDiscprov
  const user = await localStorage.getAudiusAccountUser()
  if (!user && requiresUser) throw new Error('User required to continue')

  const headers: { [key: string]: string } = {}
  if (user && user.user_id) {
    headers['X-User-ID'] = `${user.user_id}`
  }

  let baseUrl = `${discprovEndpoint}/${req.endpoint}`
  if (req.urlParams) {
    baseUrl = `${baseUrl}${req.urlParams}`
  }

  let res: any
  if (req?.method?.toLowerCase() === 'post') {
    headers['Content-Type'] = 'application/json'
    const url = `${baseUrl}?${paramsToQueryString(req.queryParams)}`
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.data)
    })
  } else {
    const url = `${baseUrl}?${paramsToQueryString(req.queryParams)}`
    res = await fetch(url, {
      headers
    })
  }

  const json = await res.json()
  if (json.data) return json.data
  return json
}

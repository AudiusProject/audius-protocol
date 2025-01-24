const DEFAULT_TIMEOUT_MS = 7500
export const TIMED_OUT_ERROR = 'Request Timed Out'

export const fetchWithTimeout = async (
  url: string,
  timeout: number = DEFAULT_TIMEOUT_MS
) => {
  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(`${TIMED_OUT_ERROR}:${url}`)), timeout)
  })

  const res = (await Promise.race([fetch(url), timeoutPromise])) as Response
  if (!res.ok) {
    throw new Error(res.statusText)
  }
  return res.json()
}

export const withTimeout = async (
  asyncCall: () => Promise<any>,
  timeout: number = DEFAULT_TIMEOUT_MS
) => {
  const timeoutPromise = new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(`${TIMED_OUT_ERROR}`)), timeout)
  })

  const res = await Promise.race([asyncCall, timeoutPromise])
  return res
}

// use discovery node from libs to fetch data
export const fetchWithLibs = async (req: {
  endpoint: string
  queryParams?: object
}) => {
  // TODO use audius client instead of window.audiusLibs
  const data = await window.audiusLibs.discoveryProvider._makeRequest(req)

  // if all nodes are unhealthy and unavailable
  if (!data) return Promise.reject(new Error())

  return data
}

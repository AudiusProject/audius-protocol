const DEFAULT_TIMEOUT_MS = 7500
export const TIMED_OUT_ERROR = 'Request Timed Out'

export const fetchWithTimeout = async (
  url: string,
  timeout: number = DEFAULT_TIMEOUT_MS
) => {
  const timeoutPromise = new Promise((_, reject) => {
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
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${TIMED_OUT_ERROR}`)), timeout)
  })

  const res = await Promise.race([asyncCall, timeoutPromise])
  return res
}

export const fetchUntilSuccess = async (endpoints: string[]): Promise<any> => {
  // Pick a random endpoint and make a call to that endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
  console.log('Attempting endpoint: ', endpoint)
  try {
    return await fetchWithTimeout(endpoint)
  } catch (e) {
    console.error(e)
    return await fetchUntilSuccess(endpoints)
  }
}

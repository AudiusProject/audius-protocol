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
  const allowList = [
    'https://discoveryprovider.audius.co',
    'https://discoveryprovider2.audius.co',
    'https://discoveryprovider3.audius.co',
    'https://dn2.monophonic.digital',
    'https://dn1.monophonic.digital'
  ]

  try {
    const response = await fetchWithTimeout('https://api.audius.co')
    const allHealthyDps = response.data as string[]
    const allowedHealthyDPs = allHealthyDps.filter(url =>
      allowList.includes(url)
    )
    const allowedEndpoints = endpoints.filter(endpoint =>
      allowedHealthyDPs.some(url => endpoint.startsWith(url))
    )

    // Pick a random endpoint from the allowed endpoints
    const endpoint =
      allowedEndpoints[Math.floor(Math.random() * allowedEndpoints.length)]
    console.info('Attempting endpoint: ', endpoint)
    return await fetchWithTimeout(endpoint)
  } catch (e) {
    console.error(e)
    return await fetchUntilSuccess(endpoints)
  }
}

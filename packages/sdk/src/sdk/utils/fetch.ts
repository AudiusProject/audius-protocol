import crossFetch from 'cross-fetch'

const fetch = (input: RequestInfo | URL, init?: RequestInit) =>
  crossFetch(input, {
    ...(init ?? {}),
    credentials:
      'credentials' in Request.prototype ? init?.credentials : undefined
  })

export * from 'cross-fetch'
export default fetch

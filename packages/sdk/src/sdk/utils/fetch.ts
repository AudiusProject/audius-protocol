import crossFetch from 'cross-fetch'

const fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers)
  if (typeof process !== 'undefined' && process.versions?.node) {
    // TODO: remove this once we have a better solution
    // gzip with large responses currently breaks the node fetch implementation
    // so ask the server to not gzip the response
    headers.set('Accept-Encoding', 'identity')
  }

  return crossFetch(input, {
    ...init,
    headers,
    credentials:
      'credentials' in Request.prototype ? init?.credentials : undefined
  })
}

export * from 'cross-fetch'
export default fetch

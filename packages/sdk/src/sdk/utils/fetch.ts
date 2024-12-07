// import crossFetch from 'cross-fetch'

// const fetch = (input: RequestInfo | URL, init?: RequestInit) =>
//   crossFetch(input, {
//     ...(init ?? {}),
//     credentials:
//       'credentials' in Request.prototype ? init?.credentials : undefined
//   })

// export * from 'cross-fetch'
// export default fetch

import crossFetch from 'cross-fetch'

const fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers)
  headers.set('Accept-Encoding', 'identity')

  return crossFetch(input, {
    ...init,
    headers,
    credentials:
      'credentials' in Request.prototype ? init?.credentials : undefined
  })
}

export * from 'cross-fetch'
export default fetch

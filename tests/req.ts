import request, { CoreOptions, UrlOptions } from 'request'

const req = (options: CoreOptions & UrlOptions): Promise<string> =>
  new Promise((resolve) => {
    request(options, (error, resp, body) => resolve(body))
  })

export default req

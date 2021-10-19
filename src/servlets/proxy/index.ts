import express from 'express'
import { IncomingMessage } from 'http'
import https from 'https'
import HttpsProxyAgent from 'https-proxy-agent'
import urlLib from 'url'

import promiseAny from '../utils/promise.any'

const PROXY_URLS = (process.env.PROXY_URLS || '').split(',')

export const router = express.Router()

const proxyRequest = async (proxyUrl: string, formattedUrl: string) => {
  // @ts-ignore
  const proxyOpts = urlLib.parse(proxyUrl)
  // @ts-ignore
  proxyOpts.rejectUnauthorized = false
  // @ts-ignore
  const agent = new HttpsProxyAgent(proxyOpts)

  const options = urlLib.parse(formattedUrl)
  // @ts-ignore
  options.agent = agent
  // @ts-ignore
  options.rejectUnauthorized = false

  console.log(`Proxying to ${formattedUrl} via ${proxyUrl}`)
  const start = Date.now()
  const result = await new Promise((resolve, reject) => {
    https.get(options, (res: IncomingMessage) => {
      let json = ''
      res.on('data', (chunk) => {
          json += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(json)
            resolve(data)
          } catch (e) {
            reject(new Error('Error parsing JSON!'))
          }
        } else {
          reject(new Error(`Request failed with ${res.statusCode}`))
        }
      })
    }).on('error', (e: Error) => {
      console.error(`Error at https.get for ${proxyUrl}`)
      reject(e)
    })
  })
  const duration = Date.now() - start
  console.log(`[${duration}] Proxy succeeded to ${formattedUrl} via ${proxyUrl}`)
  return result
}

/**
 * Proxy request via external
 */
router.get('/', async (
  req: express.Request,
  expressRes: express.Response
) => {
    try {
      const {
        url,
        replace
      } = req.query

      if (!url) throw new Error('No url provided')
      if (!replace) throw new Error('No replace json provided')

      let formattedUrl = url
      const parsedReplaceJSON = JSON.parse(replace)
      Object.keys(parsedReplaceJSON).forEach((key: string) => {
        formattedUrl = formattedUrl.replace(key, parsedReplaceJSON[key])
      })

      const requests = PROXY_URLS.map((proxy) => proxyRequest(proxy, formattedUrl))
      const result = await promiseAny(requests)

      expressRes.json(result)
    } catch (e) {
      console.error(e)
      expressRes.status(500).send({ error: e.message })
    }
})

/**
 * Simple proxy with no external
 */
router.get('/simple', async (
  req: express.Request,
  res: express.Response
) => {
  const { url } = req.query
  const newReq = https.request(decodeURI(url), (newRes: any) => {
    const headers = {
      'Access-Control-Allow-Method': '*',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*'
    }

    res.writeHead(newRes.statusCode, headers)
    newRes.pipe(res)
  }).on('error', (err) => {
    res.statusCode = 500
    res.end()
  })
  req.pipe(newReq)
})

import express from 'express'
import { IncomingMessage } from 'http'
import https from 'https'
import HttpsProxyAgent from 'https-proxy-agent'
import urlLib from 'url'

const PROXY_URL = process.env.PROXY_URL

export const router = express.Router()

/**
 * Returns status 200 to check for liveness
 */
router.get('/', async (
  req: express.Request,
  expressRes: express.Response) => {
    try {
      const {
        url,
        replace
      } = req.query

      if (!url) throw new Error('No url provided')
      if (!replace) throw new Error('No replace json provided')
      // @ts-ignore
      const agent = new HttpsProxyAgent(PROXY_URL)

      let formattedUrl = url
      const parsedReplaceJSON = JSON.parse(replace)
      Object.keys(parsedReplaceJSON).forEach((key: string) => {
        formattedUrl = formattedUrl.replace(key, parsedReplaceJSON[key])
      })
      const options = urlLib.parse(formattedUrl)
      // @ts-ignore
      options.agent = agent

      console.log(`Proxying to ${formattedUrl}`)
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
        })
      })
      console.log(`Proxy succeeded to ${formattedUrl}`)
      expressRes.json(result)
    } catch (e) {
      console.error(e)
      expressRes.status(500).send({ error: e.message })
    }
})

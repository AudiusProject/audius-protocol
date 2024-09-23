import { Hono } from 'hono'
import { renderToString } from 'react-dom/server'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import { sdk } from '@audius/sdk'

const apiKey = import.meta.env.VITE_AUDIUS_API_SECRET as string
const apiSecret = import.meta.env.VITE_AUDIUS_API_SECRET as string

const app = new Hono()
app.use(logger())

const audiusSdk = sdk({
  appName: 'Audius SDK React Hono Example',
  apiKey,
  apiSecret
})

app.get('/', (c) => {
  return c.html(
    renderToString(
      <html>
        <head>
          <meta charSet='utf-8' />
          <meta content='width=device-width, initial-scale=1' name='viewport' />
          {import.meta.env.PROD ? (
            <script type='module' src='/static/client/main.js'></script>
          ) : (
            <script type='module' src='/src/client/main.tsx'></script>
          )}
        </head>
        <body>
          <div id='root'></div>
          <script src='https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js'></script>
        </body>
      </html>
    )
  )
})

app.post(
  '/favorite',
  zValidator(
    'json',
    z.object({
      trackId: z.string(),
      userId: z.string()
    })
  ),
  async (c) => {
    try {
      const { trackId, userId } = c.req.valid('json')
      await audiusSdk.tracks.favoriteTrack({
        trackId,
        userId
      })
      return c.json({ trackId })
    } catch (e) {
      throw new HTTPException(500, {
        message: (e as Error).message || 'Unknown server error',
        cause: e
      })
    }
  }
)

app.post(
  '/unfavorite',
  zValidator(
    'json',
    z.object({
      trackId: z.string(),
      userId: z.string()
    })
  ),
  async (c) => {
    try {
      const { trackId, userId } = c.req.valid('json')
      await audiusSdk.tracks.unfavoriteTrack({
        trackId,
        userId
      })
      return c.json({ trackId })
    } catch (e) {
      throw new HTTPException(500, {
        message: (e as Error).message || 'Unknown server error',
        cause: e
      })
    }
  }
)

export type AppType = typeof app

export default app

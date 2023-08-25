import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

const DEBUG = false

addEventListener('fetch', (event) => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500
        })
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const options = {}

  // Always map requests to `/` since this is an SPA
  options.mapRequestToAsset = (request) => {
    const cleanedUrl = request.url.replace('/embed/', '/')
    const req = mapRequestToAsset(new Request(cleanedUrl, request))
    const url = new URL(req.url)

    if (url.pathname.endsWith('.html')) {
      return new Request(`${url.origin}/index.html`, req)
    }
    return req
  }
  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true
      }
    }

    const page = await getAssetFromKV(event, options)

    // allow headers to be altered
    const response = new Response(page.body, page)

    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'unsafe-url')
    response.headers.set('Feature-Policy', 'none')

    return response
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 })
  }
}

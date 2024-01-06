import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import { renderPage } from 'vike/server'

const DEBUG = true
const BROWSER_CACHE_TTL_SECONDS = 60 * 60 * 24

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
  if (!isAssetUrl(event.request.url)) {
    // If the request is not for an asset, then it's a request for a page

    const pageContextInit = {
      urlOriginal: event.request.url
    }

    const pageContext = await renderPage(pageContextInit)

    const { httpResponse } = pageContext
    if (!httpResponse) {
      throw new Error(pageContext.errorWhileRendering)
    } else {
      const { body, statusCode: status, headers } = httpResponse
      return new Response(body, { headers, status })
    }
  } else {
    // Adjust browser cache on assets that don't change frequently and/or
    // are given unique hashes when they do.
    const asset = await getAssetFromKV(event)

    const response = new Response(asset.body, asset)
    response.headers.set('cache-control', BROWSER_CACHE_TTL_SECONDS)

    return response
  }
}

function isAssetUrl(url) {
  const { pathname } = new URL(url)
  return (
    pathname.startsWith('/assets') ||
    pathname.startsWith('/scripts') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/favicons') ||
    pathname.startsWith('/manifest.json')
  )
}

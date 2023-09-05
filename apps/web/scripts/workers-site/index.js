import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

const DEBUG = false

addEventListener('fetch', event => {
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

function checkIsBot(val) {
  if (!val) {
    return false
  }
  const botTest = new RegExp(
    'altavista|baiduspider|bingbot|discordbot|duckduckbot|facebookexternalhit|gigabot|ia_archiver|linkbot|linkedinbot|msnbot|nextgensearchbot|reaper|slackbot|snap url preview service|telegrambot|twitterbot|whatsapp|whatsup|yahoo|yandex|yeti|yodaobot|zend|zoominfobot|embedly',
    'i'
  )
  return botTest.test(val)
}

async function handleEvent(event) {
  const url = new URL(event.request.url)
  const { pathname, search, hash } = url

  const isUndefined = pathname === '/undefined'
  if (isUndefined) {
    return Response.redirect(url.origin, 302)
  }

  const userAgent = event.request.headers.get('User-Agent') || ''

  const isBot = checkIsBot(userAgent)
  const isEmbed = pathname.startsWith('/embed')
  const is204 = pathname === '/204'

  if (isBot || isEmbed || is204) {
    const destinationURL = GA + pathname + search + hash
    const newRequest = new Request(destinationURL, event.request)
    newRequest.headers.set('host', GA)
    newRequest.headers.set('x-access-token', GA_ACCESS_TOKEN)

    return await fetch(newRequest)
  }

  const isSitemap = pathname.startsWith('/sitemaps')
  if (isSitemap) {
    const destinationURL = SITEMAP + pathname + search + hash
    const newRequest = new Request(destinationURL, event.request)
    return await fetch(newRequest)
  }

  const options = {}
  // Always map requests to `/`
  options.mapRequestToAsset = request => {
    const url = new URL(request.url)
    url.pathname = `/`
    return mapRequestToAsset(new Request(url, request))
  }

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true
      }
    }

    return await getAssetFromKV(event, options)
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 })
  }
}

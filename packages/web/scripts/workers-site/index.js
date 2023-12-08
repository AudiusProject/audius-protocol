import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

import { handleSsr } from './ssr'

/* globals GA, GA_ACCESS_TOKEN, EMBED, DISCOVERY_NODES, HTMLRewriter */

const DEBUG = true
const BROWSER_CACHE_TTL_SECONDS = 60 * 60 * 24

const discoveryNodes = DISCOVERY_NODES.split(',')
const discoveryNode =
  discoveryNodes[Math.floor(Math.random() * discoveryNodes.length)]

let h1 = null

const routes = [
  { pattern: /^\/([^/]+)$/, name: 'user', keys: ['handle'] },
  {
    pattern: /^\/([^/]+)\/([^/]+)$/,
    name: 'track',
    keys: ['handle', 'title']
  },
  {
    pattern: /^\/([^/]+)\/playlist\/([^/]+)$/,
    name: 'playlist',
    keys: ['handle', 'title']
  },
  {
    pattern: /^\/([^/]+)\/album\/([^/]+)$/,
    name: 'album',
    keys: ['handle', 'title']
  }
]

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

function matchRoute(input) {
  for (const route of routes) {
    const match = route.pattern.exec(input)
    if (match) {
      const result = { name: route.name, params: {} }
      route.keys.forEach((key, index) => {
        result.params[key] = match[index + 1]
      })
      return result
    }
  }
  return null
}

function checkIsBot(val) {
  if (!val) {
    return false
  }
  const botTest =
    /altavista|baiduspider|bingbot|discordbot|duckduckbot|facebookexternalhit|gigabot|ia_archiver|linkbot|linkedinbot|msnbot|nextgensearchbot|reaper|slackbot|snap url preview service|telegrambot|twitterbot|whatsapp|whatsup|yahoo|yandex|yeti|yodaobot|zend|zoominfobot|embedly/i
  return botTest.test(val)
}

async function getMetadata(pathname) {
  if (pathname.startsWith('/scripts')) {
    return { metadata: null, name: null }
  }

  const route = matchRoute(pathname)
  if (!route) {
    return { metadata: null, name: null }
  }

  let discoveryRequestPath
  switch (route.name) {
    case 'user': {
      const { handle } = route.params
      if (!handle) return { metadata: null, name: null }
      discoveryRequestPath = `v1/users/handle/${handle}`
      break
    }
    case 'track': {
      const { handle, title } = route.params
      if (!handle || !title) return { metadata: null, name: null }
      discoveryRequestPath = `v1/tracks?handle=${handle}&slug=${title}`
      break
    }
    case 'playlist': {
      const { handle, title } = route.params
      if (!handle || !title) return { metadata: null, name: null }
      discoveryRequestPath = `v1/full/playlists/by_permalink/${handle}/${title}`
      break
    }
    case 'album': {
      const { handle, title } = route.params
      if (!handle || !title) return { metadata: null, name: null }
      discoveryRequestPath = `v1/full/playlists/by_permalink/${handle}/${title}`
      break
    }
    default:
      return { metadata: null, name: null }
  }
  try {
    const res = await fetch(`${discoveryNode}/${discoveryRequestPath}`)
    if (res.status !== 200) {
      throw new Error(res.status)
    }
    const json = await res.json()
    return { metadata: json, name: route.name }
  } catch (e) {
    return { metadata: null, name: null }
  }
}

function clean(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

class SEOHandlerBody {
  element(element) {
    if (!h1) {
      return
    }
    const h1Tag = `<h1 id="audius-h1" style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;">${h1}</h1>`
    element.prepend(h1Tag, { html: true })
  }
}

class SEOHandlerHead {
  constructor(pathname) {
    self.pathname = pathname
  }

  async element(element) {
    const { metadata, name } = await getMetadata(self.pathname)

    if (!metadata || !name || !metadata.data || metadata.data.length === 0) {
      // We didn't parse this to anything we have custom tags for, so just return the default tags
      const tags = `<meta property="og:title" content="Audius - Empowering Creators">
      <meta name="description" content="Audius is a music streaming and sharing platform that puts power back into the hands of content creators." data-react-helmet="true">
      <meta property="og:description" content="Audius is a music streaming and sharing platform that puts power back into the hands of content creators.">
      <meta property="og:image" content="https://audius.co/ogImage.jpg">
      <meta name="twitter:title" content="Audius - Empowering Creators">
      <meta name="twitter:description" content="Audius is a music streaming and sharing platform that puts power back into the hands of content creators.">
      <meta name="twitter:image" content="https://audius.co/ogImage.jpg">
      <meta name="twitter:image:alt" content="The Audius Platform">`
      element.append(tags, { html: true })
      return
    }

    let title, description, ogDescription, image, permalink
    switch (name) {
      case 'user': {
        title = `${metadata.data.name} • Audius`
        h1 = metadata.data.name
        description = `Play ${metadata.data.name} on Audius and discover followers on Audius | Listen and stream tracks, albums, and playlists from your favorite artists on desktop and mobile`
        ogDescription = metadata.data.bio || description
        image = metadata.data.profile_picture
          ? metadata.data.profile_picture['480x480']
          : ''
        permalink = `/${metadata.data.handle}`
        break
      }
      case 'track': {
        title = `${metadata.data.title} by ${metadata.data.user.name} • Audius`
        h1 = metadata.data.title
        description = `Stream ${metadata.data.title} by ${metadata.data.user.name} on Audius | Stream similar artists to ${metadata.data.user.name} on desktop and mobile`
        ogDescription = metadata.data.description || description
        image = metadata.data.artwork ? metadata.data.artwork['480x480'] : ''
        permalink = metadata.data.permalink
        break
      }
      case 'playlist': {
        title = `${metadata.data[0].playlist_name} by ${metadata.data[0].user.name} • Audius`
        h1 = metadata.data[0].playlist_name
        description = `Listen to ${metadata.data[0].playlist_name}, a playlist curated by ${metadata.data[0].user.name} on Audius | Stream tracks, albums, playlists on desktop and mobile`
        ogDescription = metadata.data[0].description || ''
        image = metadata.data[0].artwork
          ? metadata.data[0].artwork['480x480']
          : ''
        permalink = metadata.data[0].permalink
        break
      }
      case 'album': {
        title = `${metadata.data[0].playlist_name} by ${metadata.data[0].user.name} • Audius`
        h1 = metadata.data[0].playlist_name
        description = `Listen to ${metadata.data[0].playlist_name}, an album by ${metadata.data[0].user.name} on Audius | Stream tracks, albums, playlists on desktop and mobile`
        ogDescription = metadata.data[0].description || ''
        image = metadata.data[0].artwork
          ? metadata.data[0].artwork['480x480']
          : ''
        permalink = metadata.data[0].permalink
        break
      }
      default:
        return
    }
    const tags = `<title>${clean(title)}</title>
    <meta name="description" content="${clean(
      description
    )}" data-react-helmet="true">

    <link rel="canonical" href="https://audius.co${encodeURI(permalink)}">
    <meta property="og:title" content="${clean(title)}">
    <meta property="og:description" content="${clean(ogDescription)}">
    <meta property="og:image" content="${image}">
    <meta property="og:url" content="https://audius.co${encodeURI(permalink)}">
    <meta property="og:type" content="website" />

    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${clean(title)}">
    <meta name="twitter:description" content="${clean(ogDescription)}">
    <meta name="twitter:image" content="${image}">`
    element.append(tags, { html: true })
  }
}

async function handleEvent(event) {
  const url = new URL(event.request.url)
  const { pathname, search, hash } = url

  const isUndefined = pathname === '/undefined'
  if (isUndefined) {
    return Response.redirect(url.origin, 302)
  }

  const isSitemap = pathname.startsWith('/sitemaps')
  if (isSitemap) {
    const destinationURL = discoveryNode + pathname + search + hash
    const newRequest = new Request(destinationURL, event.request)
    return await fetch(newRequest)
  }

  const userAgent = event.request.headers.get('User-Agent') || ''

  const is204 = pathname === '/204'
  if (is204) {
    const response = new Response(undefined, { status: 204 })
    response.headers.set('access-control-allow-methods', '*')
    response.headers.set('access-control-allow-origin', '*')
    return response
  }

  const isBot = checkIsBot(userAgent)

  if (isBot) {
    const destinationURL = GA + pathname + search + hash
    const newRequest = new Request(destinationURL, event.request)
    newRequest.headers.set('host', GA)
    newRequest.headers.set('x-access-token', GA_ACCESS_TOKEN)

    return await fetch(newRequest)
  }

  const isEmbed = pathname.startsWith('/embed')
  if (isEmbed) {
    const destinationURL = EMBED + pathname + search + hash
    const newRequest = new Request(destinationURL, event.request)

    return await fetch(newRequest)
  }

  const options = {}

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true
      }
    }

    if (!isAssetUrl(event.request.url)) {
      const response = await handleSsr(event.request.url)
      if (response !== null) return response
    } else {
      // Adjust browser cache on assets that don't change frequently and/or
      // are given unique hashes when they do.
      const asset = await getAssetFromKV(event, options)

      const response = new Response(asset.body, asset)
      response.headers.set('cache-control', BROWSER_CACHE_TTL_SECONDS)
      return response
    }
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 })
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

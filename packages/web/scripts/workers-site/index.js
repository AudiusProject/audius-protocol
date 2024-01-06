import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'
import manifestJSON from '__STATIC_CONTENT_MANIFEST'

/* globals HTMLRewriter */

const assetManifest = JSON.parse(manifestJSON)

const SSR = true
const DEBUG = false
const BROWSER_CACHE_TTL_SECONDS = 60 * 60 * 24

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

function checkIsCrawler(val) {
  if (!val) {
    return false
  }
  const crawlerTest = /Googlebot|forceSSR/i
  return crawlerTest.test(val)
}

async function getMetadata(pathname, discoveryNode) {
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
  constructor(pathname, discoveryNode) {
    self.pathname = pathname
    self.discoveryNode = discoveryNode
  }

  async element(element) {
    const { metadata, name } = await getMetadata(
      self.pathname,
      self.discoveryNode
    )

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

async function handleEvent(request, env, ctx) {
  const url = new URL(request.url)
  const { pathname, search, hash } = url

  const isUndefined = pathname === '/undefined'
  if (isUndefined) {
    return Response.redirect(url.origin, 302)
  }

  const discoveryNodes = env.DISCOVERY_NODES.split(',')
  const discoveryNode =
    discoveryNodes[Math.floor(Math.random() * discoveryNodes.length)]

  const isSitemap = pathname.startsWith('/sitemaps')
  if (isSitemap) {
    const destinationURL = discoveryNode + pathname + search + hash
    const newRequest = new Request(destinationURL, request)
    return await fetch(newRequest)
  }

  const userAgent = request.headers.get('User-Agent') || ''

  const is204 = pathname === '/204'
  if (is204) {
    const response = new Response(undefined, { status: 204 })
    response.headers.set('access-control-allow-methods', '*')
    response.headers.set('access-control-allow-origin', '*')
    return response
  }

  const isBot = checkIsBot(userAgent)

  if (isBot) {
    const destinationURL = env.GA + pathname + search + hash
    const newRequest = new Request(destinationURL, request)
    newRequest.headers.set('host', env.GA)
    newRequest.headers.set('x-access-token', env.GA_ACCESS_TOKEN)

    return await fetch(newRequest)
  }

  const isEmbed = pathname.startsWith('/embed')
  if (isEmbed) {
    const destinationURL = env.EMBED + pathname + search + hash
    const newRequest = new Request(destinationURL, request)

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

    // For now, only SSR for crawlers
    if (SSR && checkIsCrawler(userAgent)) {
      const ssrResponse = await env.SSR.fetch(request.clone())
      return ssrResponse
    } else {
      if (!isAssetUrl(request.url)) {
        // Map all non-asset requests to the root path
        options.mapRequestToAsset = (request) => {
          const url = new URL(request.url)
          url.pathname = `/`
          return mapRequestToAsset(new Request(url, request))
        }

        const asset = await getAsset(request, env, ctx, options)

        const rewritten = new HTMLRewriter()
          .on('head', new SEOHandlerHead(pathname, discoveryNode))
          .on('body', new SEOHandlerBody())
          .transform(asset)

        return rewritten
      } else {
        const asset = await getAsset(request, env, ctx, options)

        // Adjust browser cache on assets that don't change frequently and/or
        // are given unique hashes when they do.
        const response = new Response(asset.body, asset)
        response.headers.set('cache-control', BROWSER_CACHE_TTL_SECONDS)

        return response
      }
    }
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 })
  }
}

async function getAsset(request, env, ctx, options) {
  return await getAssetFromKV(
    {
      request,
      waitUntil: ctx.waitUntil.bind(ctx)
    },
    {
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      ASSET_MANIFEST: assetManifest,
      ...options
    }
  )
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

export default {
  fetch(request, env, ctx) {
    try {
      return handleEvent(request, env, ctx)
    } catch (e) {
      if (DEBUG) {
        return new Response(e.message || e.toString(), {
          status: 500
        })
      }
      return new Response('Internal Error', { status: 500 })
    }
  }
}

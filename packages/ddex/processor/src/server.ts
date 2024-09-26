import 'dotenv/config'

import { serve } from '@hono/node-server'
import { fromBuffer as fileTypeFromBuffer } from 'file-type'
import { Context, Hono } from 'hono'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import { html } from 'hono/html'
import { decode } from 'hono/jwt'
import { prettyJSON } from 'hono/pretty-json'
import { HtmlEscapedString } from 'hono/utils/html'
import {
  ReleaseProcessingStatus,
  ReleaseRow,
  kvRepo,
  releaseRepo,
  userRepo,
  xmlRepo,
} from './db'
import {
  DDEXContributor,
  DDEXRelease,
  parseDdexXml,
  reParsePastXml,
} from './parseDelivery'
import { prepareAlbumMetadata, prepareTrackMetadatas } from './publishRelease'
import { readAssetWithCaching } from './s3poller'
import { sources } from './sources'
import { startUsersPoller } from './usersPoller'
import { parseBool, simulateDeliveryForUserName } from './util'

// read env
const { NODE_ENV, DDEX_URL } = process.env
const ADMIN_HANDLES = (process.env.ADMIN_HANDLES || '')
  .split(',')
  .map((h) => h.toLowerCase().trim())

// validate ENV
if (!DDEX_URL) console.warn('DDEX_URL not defined')

// globals
const COOKIE_NAME = 'audiusUser'
const COOKIE_SECRET = kvRepo.getCookieSecret()

const IS_PROD = NODE_ENV == 'production'
const API_HOST = IS_PROD
  ? 'https://discoveryprovider2.audius.co'
  : 'https://discoveryprovider2.staging.audius.co'

const app = new Hono()
app.use(prettyJSON({ space: 4 }))

app.get('/', async (c) => {
  const me = await getAudiusUser(c)

  return c.html(
    Layout(html`
      <div class="container">
        <h1>ddexer</h1>

        ${c.req.query('loginRequired')
          ? html`<mark>Please login to continue</mark><br />`
          : ''}
        ${me
          ? html`
              <h4>Welcome back @${me.handle}</h4>
              <a href="/auth/logout" role="button">log out</a>
            `
          : html`
              <div>
                ${sources
                  .all()
                  .map(
                    (s) => html`
                      <a role="button" href="/auth/source/${s.name}"
                        >${s.name}</a
                      >
                    `
                  )}
              </div>
            `}
      </div>
    `)
  )
})

app.get('/auth/source/:sourceName', (c) => {
  const sourceName = c.req.param('sourceName')
  const source = sources.findByName(sourceName)
  const myUrl = DDEX_URL || 'http://localhost:8989'
  const base = IS_PROD
    ? 'https://audius.co/oauth/auth?'
    : 'https://staging.audius.co/oauth/auth?'
  const params = new URLSearchParams({
    scope: 'write',
    redirect_uri: `${myUrl}/auth/redirect`,
    api_key: source.ddexKey,
    response_mode: 'query',
  })
  const u = base + params.toString()
  return c.redirect(u)
})

app.get('/auth/redirect', async (c) => {
  try {
    const uri = c.req.query('redirect_uri') || ''
    const token = c.req.query('token')
    if (!token) {
      throw new Error('no token')
    }

    const jwt = decode(token!)
    const payload = jwt.payload as JwtUser
    if (!payload.userId) {
      throw new Error('invalid payload')
    }

    // upsert user record
    userRepo.upsert({
      apiKey: payload.apiKey,
      id: payload.userId,
      handle: payload.handle,
      name: payload.name,
    })

    // after user upsert, rescan for matches
    reParsePastXml()

    // set cookie
    const j = JSON.stringify(payload)
    await setSignedCookie(c, COOKIE_NAME, j, COOKIE_SECRET!)

    const params = new URLSearchParams({ token })
    return c.redirect(`${uri}/?` + params.toString())
  } catch (e) {
    console.log(e)
    return c.body('invalid jwt', 400)
  }
})

// ====================== AUTH REQUIRED ======================

app.use('*', async (c, next) => {
  const me = await getAudiusUser(c)
  if (!me) return c.redirect('/?loginRequired=true')
  await next()
})

app.get('/auth/whoami', async (c) => {
  const me = await getAudiusUser(c)
  return c.json({ me })
})

app.get('/auth/logout', async (c) => {
  deleteCookie(c, COOKIE_NAME)
  return c.redirect('/')
})

// ====================== ADMIN REQUIRED ======================

app.use('*', async (c, next) => {
  const me = await getAudiusUser(c)
  if (!me || !ADMIN_HANDLES.includes(me.handle.toLowerCase())) {
    return c.text('you are not admin')
  }
  await next()
})

app.get('/releases', (c) => {
  const queryStatus = c.req.query('status')
  const rows = releaseRepo.all({
    status: queryStatus,
    pendingPublish: parseBool(c.req.query('pendingPublish')),
  })

  let lastXmlUrl = ''
  const xmlSpacer = (row: ReleaseRow) => {
    if (row.xmlUrl != lastXmlUrl) {
      lastXmlUrl = row.xmlUrl
      return html`<tr>
        <td colspan="10">
          <div style="margin-top: 20px;">
            <kbd>${row.source}</kbd>
            <kbd>${row.xmlUrl}</kbd>
          </div>
        </td>
      </tr>`
    }
  }

  return c.html(
    Layout(html`
      <h1>Releases</h1>

      <div style="display: flex; gap: 10px;">
        <!-- filters -->
        <form>
          <select
            name="status"
            aria-label="Select"
            onchange="this.form.submit()"
          >
            <option selected value="">All</option>
            ${Object.values(ReleaseProcessingStatus).map(
              (s) =>
                html`<option ${queryStatus == s ? 'selected' : ''}>
                  ${s}
                </option>`
            )}
          </select>
        </form>

        <div style="flex-grow: 1"></div>

        <!-- actions -->
        <form method="POST" action="/releases/reparse">
          <button class="outline">re-parse</button>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Key</th>
            <th>Type</th>
            <th>Artist</th>
            <th>Title</th>
            <th>Genre</th>
            <th>Status</th>
            <th>Publish Errors</th>
            <th>Published?</th>
            <th>debug</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (row) =>
              html` ${xmlSpacer(row)}
                <tr>
                  <td class="${row._parsed?.isMainRelease ? 'bold' : ''}">
                    ${row._parsed?.ref}
                  </td>
                  <td>
                    <a href="/releases/${encodeURIComponent(row.key)}"
                      >${row.key}</a
                    >
                  </td>
                  <td>${row._parsed?.releaseType}</td>
                  <td>
                    ${row._parsed?.audiusUser || row._parsed?.artists[0]?.name}
                  </td>
                  <td>${row._parsed?.title}</td>
                  <td>${row._parsed?.audiusGenre}</td>
                  <td>
                    <mark><b>${row.status}</b></mark>
                    ${row._parsed?.problems?.map(
                      (p) => html`<mark>${p}</mark>`
                    )}
                  </td>
                  <td>
                    ${row.publishErrorCount > 0 &&
                    html`<a
                      href="/releases/${encodeURIComponent(row.key)}/error"
                      >${row.publishErrorCount}</a
                    >`}
                  </td>
                  <td>
                    ${row.entityType == 'track' &&
                    html` <a href="${API_HOST}/v1/full/tracks/${row.entityId}">
                      ${row.entityId}
                    </a>`}
                    ${row.entityType == 'album' &&
                    html` <a
                      href="${API_HOST}/v1/full/playlists/${row.entityId}"
                    >
                      ${row.entityId}
                    </a>`}
                  </td>
                  <td>
                    <a href="/xmls/${encodeURIComponent(row.xmlUrl)}">xml</a>

                    <a
                      href="/releases/${encodeURIComponent(
                        row.key
                      )}/json?pretty"
                      >parsed</a
                    >

                    <a href="/xmls/${encodeURIComponent(row.xmlUrl)}?parse=sdk"
                      >sdk</a
                    >
                  </td>
                </tr>`
          )}
        </tbody>
      </table>
    `)
  )
})

app.post('/releases/reparse', async (c) => {
  reParsePastXml()
  return c.redirect('/releases')
})

app.get('/releases/:key', (c) => {
  const row = releaseRepo.get(c.req.param('key'))
  if (!row) return c.json({ error: 'not found' }, 404)
  if (c.req.query('json') != undefined) {
    return c.json(row)
  }

  const parsedRelease = row._parsed!

  const mapArtist = (c: DDEXContributor) =>
    html`<li><span>${c.name}</span>: <em>${c.role}</em></li>`

  return c.html(
    Layout(html`
      <div style="display: flex; gap: 20px">
        <div style="text-align: center">
          <img
            src="/release/${row.key}/images/${parsedRelease.images[0]?.ref}"
            style="width: 200px; height: 200px; display: block; margin-bottom: 10px"
          />
          <mark>${parsedRelease.parentalWarningType}</mark>
        </div>

        <div style="flex-grow: 1">
          <h3>${parsedRelease.title}</h3>
          <h5>
            ${parsedRelease.artists.map(
              (a) =>
                html`<em style="margin-right: 5px" data-tooltip="${a.role}"
                  >${a.name}</em
                >`
            )}
          </h5>
          ${parsedRelease.soundRecordings.map(
            (sr) => html`
              <article style="display: flex; gap: 20px">
                <div>
                  <button
                    class="outline contrast"
                    onClick="play('/release/${row.key}/soundRecordings/${sr.ref}')"
                  >
                    play
                  </button>
                </div>
                <div style="flex-grow: 1">
                  <div>
                    <a href="/release/${row.key}/soundRecordings/${sr.ref}">
                      <h4 style="margin-top: 10px">${sr.title}</h4>
                    </a>
                  </div>

                  <div style="margin-left: 10px">
                    <h6>Artists</h6>
                    <ul>
                      ${sr.artists.map(mapArtist)}
                    </ul>
                    <h6>Contributors</h6>
                    <ul>
                      ${sr.contributors.map(mapArtist)}
                    </ul>
                    <h6>Indirect Contributors</h6>
                    <ul>
                      ${sr.indirectContributors.map(mapArtist)}
                    </ul>
                  </div>
                </div>
              </article>
            `
          )}

          <audio id="playa" controls />
        </div>
      </div>
      <script>
        function play(url) {
          playa.onloadstart = () => {
            console.log('loading...')
          }
          playa.oncanplay = () => {
            console.log('OK')
          }
          if (playa.src.includes(url)) {
            playa.paused ? playa.play() : playa.pause()
          } else {
            playa.src = url
            playa.play()
          }
        }
      </script>
    `)
  )
})

app.get('/release/:key/:type/:ref/:name?', async (c) => {
  const key = c.req.param('key')!
  const type = c.req.param('type')
  const ref = c.req.param('ref')
  const row = releaseRepo.get(key)
  if (!row) return c.json({ error: 'not found' }, 404)

  const collection =
    type == 'images' ? row._parsed?.images : row._parsed?.soundRecordings
  const asset = collection!.find((i) => i.ref == ref)
  if (!asset) return c.json({ error: 'not found' }, 404)

  const ok = await readAssetWithCaching(
    row.xmlUrl,
    asset.filePath,
    asset.fileName
  )

  // some mime stuff
  if (asset.fileName.endsWith('flac')) {
    c.header('Content-Type', 'audio/flac')
  } else {
    const ft = await fileTypeFromBuffer(ok.buffer)
    if (ft) {
      c.header('Content-Type', ft.mime)
    }
  }
  return c.body(ok.buffer)
})

app.get('/xmls/:xmlUrl', (c) => {
  const xmlUrl = c.req.param('xmlUrl')
  const row = xmlRepo.get(xmlUrl)
  if (!row) return c.json({ error: 'not found' }, 404)

  // parse=true will parse the xml to internal representation
  if (parseBool(c.req.query('parse'))) {
    const parsed = parseDdexXml(
      row.source,
      row.xmlUrl,
      row.xmlText
    ) as DDEXRelease[]

    // parse=sdk will convert internal representation to SDK friendly format
    if (c.req.query('parse') == 'sdk') {
      const sdkReleases = parsed.map((release) => {
        const tracks = prepareTrackMetadatas(release)
        if (tracks.length > 1) {
          const album = prepareAlbumMetadata(release)
          return {
            ref: release.ref,
            album,
            tracks,
          }
        } else {
          return {
            ref: release.ref,
            track: tracks[0],
          }
        }
      })
      return c.json(sdkReleases)
    }
    return c.json(parsed)
  }
  c.header('Content-Type', 'text/xml')
  return c.body(row.xmlText)
})

app.get('/releases/:key/json', (c) => {
  const row = releaseRepo.get(c.req.param('key'))
  if (!row) return c.json({ error: 'not found' }, 404)
  c.header('Content-Type', 'application/json')
  return c.body(row?.json)
})

app.get('/releases/:key/error', (c) => {
  const row = releaseRepo.get(c.req.param('key'))
  if (!row) return c.json({ error: 'not found' }, 404)
  return c.text(row.lastPublishError)
})

app.get('/users', (c) => {
  const users = userRepo.all()
  return c.html(
    Layout(
      html`<h1>Users</h1>

        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>handle</th>
              <th>name</th>
              <th>api key</th>
              <th>created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${users.map(
              (user) =>
                html`<tr>
                  <td>${user.id}</td>
                  <td>${user.handle}</td>
                  <td>${user.name}</td>
                  <td>
                    <b title="${user.apiKey}"
                      >${sources.findByApiKey(user.apiKey).name}</b
                    >
                  </td>
                  <td>${user.createdAt}</td>
                  <td>
                    ${!IS_PROD &&
                    html`
                      <form action="/users/simulate/${user.apiKey}/${user.id}">
                        <select
                          name="exampleFileName"
                          required
                          onchange="this.form.submit()"
                        >
                          <option selected disabled value="">
                            Simulate Delivery
                          </option>
                          <optgroup label="Track">
                            <option value="track_basic.xml">Basic</option>
                            <option value="track_follow_gated.xml">
                              Follow Gated Stream / Tip Gated Download
                            </option>
                            <option value="track_pay_gated.xml">
                              Pay Gated
                            </option>
                          </optgroup>
                          <optgroup label="Album">
                            <option value="album_basic.xml">Basic</option>
                          </optgroup>
                        </select>
                      </form>
                    `}
                  </td>
                </tr>`
            )}
          </tbody>
        </table> `
    )
  )
})

app.get('/users/simulate/:apiKey/:id', async (c) => {
  if (IS_PROD) {
    return c.text(`simulate delivery is disabled in prod`, 400)
  }

  // find source
  const source = sources.all().find((s) => s.ddexKey == c.req.param('apiKey'))
  const user = userRepo.findOne({
    id: c.req.param('id'),
    apiKey: c.req.param('apiKey'),
  })
  const exampleFileName = c.req.query('exampleFileName')

  if (!source || !user || !exampleFileName) {
    return c.text(`invalid simulate request`, 400)
  }

  // simulate delivery
  await simulateDeliveryForUserName(source, exampleFileName, user.name)

  return c.redirect('/releases')
})

type JwtUser = {
  userId: string
  email: string
  name: string
  handle: string
  verified: boolean
  profilePicture: {
    '150x150': string
    '480x480': string
    '1000x1000': string
  }
  apiKey: string
}

async function getAudiusUser(c: Context) {
  const j = await getSignedCookie(c, COOKIE_SECRET!, COOKIE_NAME)
  if (!j) return
  return JSON.parse(j) as JwtUser
}

function Layout(inner: HtmlEscapedString | Promise<HtmlEscapedString>) {
  return html`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ddex</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
        />
        <style>
          :root {
            --pico-font-size: 16px;
            --pico-line-height: 1.3;
            // --pico-border-radius: 1rem;
            // --pico-spacing: 0.5rem;
            // --pico-form-element-spacing-vertical: 0.5rem;
          }
          h1 {
            --pico-typography-spacing-vertical: 0.5rem;
          }
          button {
            --pico-font-weight: 700;
          }
          mark {
            margin-right: 5px;
          }
          .bold {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div style="display: flex; gap: 15px; padding: 10px;">
          <b>ddex</b>
          <a href="/">home</a>
          <a href="/auth/whoami">whoami</a>
          <a href="/releases">releases</a>
          <a href="/users">users</a>
        </div>
        <div style="padding: 50px;">${inner}</div>
      </body>
    </html>
  `
}

export function startServer() {
  const port = 8989
  console.log(`Server is running on port ${port}`)

  serve({
    fetch: app.fetch,
    port,
  })

  startUsersPoller().catch(console.error)
}

// for:
// https://github.com/honojs/node-server/issues/167
process
  .on('unhandledRejection', (reason, p) => {
    console.error('unhandledRejection', reason, 'promise', p)
  })
  .on('uncaughtException', (err) => {
    console.error('unhandledRejection', err)
  })

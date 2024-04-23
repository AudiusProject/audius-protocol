import 'dotenv/config'

import { serve } from '@hono/node-server'
import { Context, Hono } from 'hono'
import { ReleaseRow, UserRow, db, dbUpsert } from './db'
import { prettyJSON } from 'hono/pretty-json'
import { html, raw } from 'hono/html'
import { HtmlEscapedString } from 'hono/utils/html'
import { decode } from 'hono/jwt'
import { getSignedCookie, setSignedCookie, deleteCookie } from 'hono/cookie'
import { DDEXRelease, reParsePastXml } from './parseDelivery'

const { NODE_ENV, DDEX_KEY, COOKIE_SECRET } = process.env
const COOKIE_NAME = 'audiusUser'

const API_HOST =
  NODE_ENV == 'production'
    ? 'https://discoveryprovider2.audius.co/'
    : 'https://discoveryprovider2.staging.audius.co/'

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
              <h4>Welcome back ${me.name}</h4>
              <a href="/auth/logout" role="button">log out</a>
            `
          : html` <a role="button" href="/auth">login</a> `}
      </div>
    `)
  )
})

app.get('/auth', (c) => {
  if (!DDEX_KEY) {
    return c.text('DDEX_KEY is required', 500)
  }
  const base = 'https://staging.audius.co/oauth/auth?'
  const params = new URLSearchParams({
    scope: 'write',
    redirect_uri: 'http://localhost:8989/auth/callback',
    api_key: DDEX_KEY!
  })
  const u = base + params.toString()
  return c.redirect(u)
})

app.get('/auth/callback', (c) => {
  // for some reason auth redirects with a hash instead of query param
  // redirect again with a query param
  return c.html(
    html` <h1>redirecting</h1>
      <script>
        window.location = '/auth/success?' + window.location.hash.substr(1)
      </script>`
  )
})

app.get('/auth/success', async (c) => {
  try {
    const token = c.req.query('token')
    const { payload } = decode(token!)
    if (!payload.userId) {
      throw new Error('invalid payload')
    }

    // upsert user record
    dbUpsert('users', {
      id: payload.userId,
      handle: payload.handle,
      name: payload.name
    })

    const j = JSON.stringify(payload)
    await setSignedCookie(c, COOKIE_NAME, j, COOKIE_SECRET!)
    return c.redirect('/')
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

app.get('/releases', (c) => {
  const rows = db
    .prepare('SELECT * from releases limit ?')
    .bind(33)
    .all() as ReleaseRow[]
  for (const row of rows) {
    row._json = JSON.parse(row.json) as DDEXRelease
  }
  return c.html(
    Layout(html`
      <h1>Releases</h1>

      <form method="POST" action="/releases/reparse">
        <button>rematch</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Release Type</th>
            <th>Is Main</th>
            <th>Audius User</th>
            <th>Audius Genre</th>
            <th>Problems</th>
            <th>Published?</th>
            <th>debug</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (row) =>
              html`<tr>
                <td>
                  <a href="/releases/${encodeURIComponent(row.key)}"
                    >${row.key}</a
                  >
                </td>
                <td>${row._json?.releaseType}</td>
                <td>${row._json?.isMainRelease ? 'Yes' : ''}</td>
                <td>${row._json?.audiusUser}</td>
                <td>${row._json?.audiusGenre}</td>
                <td>
                  ${row._json?.problems?.map((p) => html`<mark>${p}</mark>`)}
                </td>
                <td>
                  ${row.entityType == 'track' &&
                  html` <a href="${API_HOST}/v1/tracks/${row.entityId}">
                    ${row.entityId}
                  </a>`}
                  ${row.entityType == 'album' &&
                  html` <a href="${API_HOST}/v1/playlists/${row.entityId}">
                    ${row.entityId}
                  </a>`}
                </td>
                <td>
                  <a href="/releases/${encodeURIComponent(row.key)}/xml">xml</a>
                  <a href="/releases/${encodeURIComponent(row.key)}/json?pretty"
                    >json</a
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
  await reParsePastXml()
  return c.redirect('/releases')
})

app.get('/releases/:key', (c) => {
  return c.html(html`release detail for ${c.req.param('key')}`)
})

app.get('/releases/:key/xml', (c) => {
  const row = db
    .prepare('select xmlText from releases where key = ?')
    .bind(c.req.param('key'))
    .get() as any
  c.header('Content-Type', 'text/xml')
  return c.body(row.xmlText)
})

app.get('/releases/:key/json', (c) => {
  const row = db
    .prepare('select json from releases where key = ?')
    .bind(c.req.param('key'))
    .get() as any
  c.header('Content-Type', 'application/json')
  return c.body(row.json)
})

app.get('/users', (c) => {
  const users = db.prepare('select * from users').all() as UserRow[]
  return c.html(
    Layout(
      html`<h1>Users</h1>

        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>handle</th>
              <th>name</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(
              (user) =>
                html`<tr>
                  <td>${user.id}</td>
                  <td>${user.handle}</td>
                  <td>${user.name}</td>
                </tr>`
            )}
          </tbody>
        </table> `
    )
  )
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
            --pico-border-radius: 1rem;
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
            margin-right: 1rem;
          }
        </style>
      </head>
      <body>
        <div style="display: flex; gap: 15px; padding: 10px;">
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
    port
  })
}

startServer()

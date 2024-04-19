import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { db } from './state'
import { prettyJSON } from 'hono/pretty-json'
import { html, raw } from 'hono/html'
import { HtmlEscapedString } from 'hono/utils/html'

const app = new Hono()
app.use(prettyJSON({ space: 4 }))

app.get('/', (c) => {
  const rows = db.prepare('SELECT * from releases limit ?').bind(33).all()
  return c.json(rows)
})

app.get('/hello', (c) => {
  const rows = db
    .prepare('SELECT * from releases limit ?')
    .bind(33)
    .all() as any[]
  return c.html(
    Layout(html`
      <h1>Hello</h1>
      <h2>there</h2>

      <button class="btn btn-primary">Base class</button>

      ${rows.map(
        (row) =>
          html`<h3>
            <a href="/releases/${encodeURIComponent(row.key)}">${row.key}</a>
          </h3>`
      )}
    `)
  )
})

app.get('/releases/:key', (c) => {
  return c.html(html`release detail for ${c.req.param('key')}`)
})

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
            --pico-font-family: Pacifico, cursive;
            --pico-font-weight: 400;
            --pico-typography-spacing-vertical: 0.5rem;
          }
          button {
            --pico-font-weight: 700;
          }
        </style>
      </head>
      <body>
        ${inner}
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

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import {
  actionLogForUser,
  getUser,
  getUserScore,
  type ActionRow,
  type TrackDetails,
  type UserDetails
} from './actionLog'
import { logger } from 'hono/logger'
import { config } from './config'

const app = new Hono()

app.use(logger())

app.get('/', async (c) => {
  console.log(c.req.query())
  const userId = parseInt(c.req.query('id') || '1')
  const user = await getUser(userId)
  if (!user) return c.text(`user id not found: ${c.req.query('id')}`, 404)
  const signals = await getUserScore(userId)
  if (!user || !signals)
    return c.text(`user id not found: ${c.req.query('id')}`, 404)

  const signalArray = Object.values(signals)
  const score = signalArray.filter(Boolean).length / signalArray.length

  let lastDate = ''
  function dateHeader(timestamp: Date) {
    const d = timestamp.toDateString()
    if (d != lastDate) {
      lastDate = d
      return (
        <tr>
          <td colspan={4}>
            <div class='text-xl font-bold pt-2'>{d}</div>
          </td>
        </tr>
      )
    }
    return null
  }

  const rows = await actionLogForUser(userId)
  return c.html(
    <Layout>
      <div class='px-16 py-8'>
        <div class='flex gap-4 items-center'>
          <Image img={user.img} size={100} />
          <div>
            <div>
              <span class='text-2xl font-bold mr-2'>{user.name}</span>
              <span>{user.handle}</span>
            </div>
            <div class='flex gap-2 mt-2 items-center'>
              <div class='badge badge-xl badge-neutral'>
                {(score * 100).toFixed(0)}%
              </div>
              {Object.entries(signals).map(([name, ok]) => (
                <div
                  class={`badge badge-soft badge-${ok ? 'success' : 'error'}`}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
        <table>
          {rows.map((r) => (
            <>
              {dateHeader(r.timestamp)}
              <tr>
                <td>{r.timestamp.toLocaleTimeString()}</td>
                <td>{r.verb}</td>
                <td>{r.target}</td>
                <td>{renderDetails(r)}</td>
              </tr>
            </>
          ))}
        </table>
      </div>
      <style>{`
        td {
          padding: 10px;
        }
      `}</style>
    </Layout>
  )
})

function renderDetails(row: ActionRow) {
  switch (row.target) {
    case 'track':
    case 'playlist': {
      const track = row.details as TrackDetails
      return (
        <div>
          {/* <Image img={track.img} /> */}
          <b>{track.title}</b>
        </div>
      )
    }
    case 'user': {
      const user = row.details as UserDetails
      return (
        <div class='flex gap-2'>
          {/* <Image img={user.img} /> */}
          {user.amount && <div>${user.amount / 100_000_000}</div>}
          <div class='font-bold'>{user.handle}</div>
        </div>
      )
    }
    default:
      return <pre>{JSON.stringify(row.details)}</pre>
  }
}

function Image({ img, size }: { img: string; size?: number }) {
  size ||= 50
  if (!img)
    return (
      <div
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          background: '#efefef'
        }}
      ></div>
    )
  return (
    <img
      src={`https://creatornode2.audius.co/content/${img}/150x150.jpg`}
      width={size}
      height={size}
    />
  )
}

type LayoutProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any
}
function Layout(props: LayoutProps) {
  return (
    <html lang='en'>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='color-scheme' content='light' />
        <link
          href='https://cdn.jsdelivr.net/npm/daisyui@5.0.0-beta.8/daisyui.css'
          rel='stylesheet'
          type='text/css'
        />
        <script src='https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4'></script>
      </head>
      <body>
        <main>
          <body>
            <div>{props.children}</div>
          </body>
        </main>
      </body>
    </html>
  )
}

const port = config.serverPort || 4200
serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import {
  actionLogForUser,
  getUser,
  getUserScore,
  recentTips,
  sql,
  type ActionRow,
  type TrackDetails,
  type UserDetails
} from './actionLog'
import { logger } from 'hono/logger'
import { config } from './config'
import { SolanaUtils, Utils } from '@audius/sdk'
import bn from 'bn.js'

let CONTENT_NODE = 'https://creatornode2.audius.co'
let FRONTEND = 'https://audius.co'

if (config.environment == 'stage') {
  CONTENT_NODE = 'https://creatornode10.staging.audius.co'
  FRONTEND = 'https://staging.audius.co'
}

const app = new Hono()

app.use(logger())

app.post('/attestation/:handle', async (c) => {
  const handle = c.req.param('handle').toLowerCase()
  const { challengeId, challengeSpecifier, amount } = await c.req.json()

  const users =
    await sql`select user_id, wallet from users where handle_lc = ${handle}`
  const user = users[0]
  if (!user) return c.text(`handle not found: ${handle}`, 404)

  // TODO: check score

  try {
    const bnAmount = SolanaUtils.uiAudioToBNWaudio(amount)
    const identifier = SolanaUtils.constructTransferId(
      challengeId,
      challengeSpecifier
    )
    const toSignStr = SolanaUtils.constructAttestation(
      user.wallet,
      bnAmount,
      identifier
    )
    const { signature, recoveryId } = SolanaUtils.signBytes(
      Buffer.from(toSignStr),
      config.privateSignerAddress
    )
    const result = new bn(Uint8Array.of(...signature, recoveryId)).toString(
      'hex'
    )

    return c.json({ result })
  } catch (error) {
    console.log(`Something went wrong: ${error}`)
    return c.text(`Something went wrong`, 500)
  }
})

app.get('/', async (c) => {
  const tips = await recentTips()

  let lastDate = ''
  function dateHeader(timestamp: Date) {
    const d = timestamp.toDateString()
    if (d != lastDate) {
      lastDate = d
      return (
        <>
          <tr>
            <td colspan={4}>
              <div class='text-xl font-bold pt-2'>{d}</div>
            </td>
          </tr>
          <tr>
            <th>Timestamp</th>
            <th>Sender</th>
            <th>Receiver</th>
            <th>Amount</th>
          </tr>
        </>
      )
    }
    return null
  }

  return c.html(
    <Layout container>
      <h1 class='text-4xl font-bold mt-8'>Recent Tips</h1>
      <table class='table'>
        <tbody>
          {tips.map((tip) => (
            <>
              {dateHeader(tip.timestamp)}
              <tr>
                <td>{tip.timestamp.toLocaleTimeString()}</td>
                <td>
                  <a href={`/user?q=${encodeURIComponent(tip.sender.handle)}`}>
                    {tip.sender.handle}
                  </a>
                </td>
                <td>
                  <a
                    href={`/user?q=${encodeURIComponent(tip.receiver.handle)}`}
                  >
                    {tip.receiver.handle}
                  </a>
                </td>
                <td class='text-right'>{tip.amount / 100_000_000}</td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </Layout>
  )
})

app.get('/user', async (c) => {
  const idOrHandle = c.req.query('q') || '1'
  const user = await getUser(idOrHandle)
  if (!user) return c.text(`user id not found: ${idOrHandle}`, 404)
  const signals = await getUserScore(user.id)
  if (!signals) return c.text(`user id not found: ${idOrHandle}`, 404)

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

  const rows = await actionLogForUser(user.id)
  return c.html(
    <Layout title={user.handle + ` | AAO`}>
      <div class='px-16 py-8'>
        <div class='flex gap-4 items-center'>
          <Image img={user.img} size={100} />
          <div>
            <div class='text-2xl font-bold'>{user.name}</div>
            <div class='flex gap-4 items-end'>
              <div>
                <a href={`${FRONTEND}/${user.handle}`} target='_blank'>
                  {user.handle}
                </a>
              </div>
              <div>{user.id}</div>
              <div>{Utils.encodeHashId(user.id)}</div>
              {user.isVerified && <div class='badge'>Verified</div>}
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
      src={`${CONTENT_NODE}/content/${img}/150x150.jpg`}
      width={size}
      height={size}
    />
  )
}

type LayoutProps = {
  title?: string
  container?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any
}
function Layout(props: LayoutProps) {
  return (
    <html lang='en'>
      <head>
        <title>{props.title || 'AAO'}</title>
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
            <div className='navbar bg-base-100 shadow-sm px-8 gap-4'>
              <div class='font-bold'>
                <a href='/'>AAO</a>
              </div>
              <form action='/user'>
                <input
                  name='q'
                  type='search'
                  class='input'
                  autocomplete={'off'}
                  placeholder='Search ID or Handle'
                />
              </form>
            </div>
            <div class={props.container ? 'container mx-auto' : ''}>
              {props.children}
            </div>
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

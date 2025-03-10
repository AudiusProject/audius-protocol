import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { basicAuth } from 'hono/basic-auth'
import {
  actionLogForUser,
  getUser,
  getRecentUsers,
  getUserNormalizedScore,
  getUserScore,
  recentTips,
  sql,
  type ActionRow,
  type TrackDetails,
  type UserDetails,
  getAAOAttestation,
  queryUsers
} from './actionLog'
import { logger } from 'hono/logger'
import { config } from './config'
import { SolanaUtils, Utils } from '@audius/sdk'
import bn from 'bn.js'
import { userFingerprints } from './identity'
import { cors } from 'hono/cors'

let CONTENT_NODE = 'https://creatornode2.audius.co'
let FRONTEND = 'https://audius.co'

if (config.environment == 'stage') {
  CONTENT_NODE = 'https://creatornode10.staging.audius.co'
  FRONTEND = 'https://staging.audius.co'
}

let { AAO_AUTH_USER, AAO_AUTH_PASSWORD } = process.env
if (!AAO_AUTH_USER) {
  AAO_AUTH_USER = 'test'
  console.warn('AAO_AUTH_USER not set.  Falling back to: ', AAO_AUTH_USER)
}
if (!AAO_AUTH_PASSWORD) {
  AAO_AUTH_PASSWORD = 'test'
  console.warn(
    'AAO_AUTH_PASSWORD not set.  Falling back to: ',
    AAO_AUTH_PASSWORD
  )
}

const app = new Hono()

app.use(logger())
app.use('/attestation/*', cors())

app.post('/attestation/:handle', async (c) => {
  const handle = c.req.param('handle').toLowerCase()
  const { challengeId, challengeSpecifier, amount } = await c.req.json()

  const users =
    await sql`select user_id, wallet from users where handle_lc = ${handle}`
  const user = users[0]
  if (!user) return c.json({ error: `handle not found: ${handle}` }, 404)

  // pass / fail
  const userScore = await getUserNormalizedScore(user.user_id)
  if (userScore.overallScore < 0) {
    return c.json({ error: 'denied' }, 400)
  }

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
    return c.json({ error: `Something went wrong` }, 500)
  }
})

//
// UI
//

app.use(
  '/attestation/ui/*',
  basicAuth({
    username: AAO_AUTH_USER,
    password: AAO_AUTH_PASSWORD
  })
)

app.get('/attestation/ui', async (c) => {
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
                  <a
                    href={`/attestation/ui/user?q=${encodeURIComponent(tip.sender.handle)}`}
                  >
                    {tip.sender.handle}
                  </a>
                </td>
                <td>
                  <a
                    href={`/attestation/ui/user?q=${encodeURIComponent(tip.receiver.handle)}`}
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

app.get('/attestation/ui/user', async (c) => {
  const idOrHandle = c.req.query('q') || '1'
  const user = await getUser(idOrHandle)
  if (!user) return c.text(`user id not found: ${idOrHandle}`, 404)
  const signals = await getUserScore(user.id)
  const userScore = (await getUserNormalizedScore(user.id))!

  if (!signals) return c.text(`user id not found: ${idOrHandle}`, 404)

  const fingerprints = await userFingerprints(user.id)
  const fingerprintUsers = await queryUsers({
    ids: fingerprints.flatMap((f) => f.userIds)
  })

  let lastDate = ''
  function dateHeader(timestamp: Date) {
    const d = timestamp.toDateString()
    if (d != lastDate) {
      lastDate = d
      return (
        <tr>
          <td colspan={4}>
            <div class='font-bold pt-2'>{d}</div>
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
              <div
                className={`badge badge-xl ${userScore.overallScore < 0 ? 'badge-error' : 'badge-neutral'}`}
              >
                {(userScore.normalizedScore * 100).toFixed(0)}%
              </div>{' '}
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
        <h2 class='text-xl font-bold mt-4'>Score Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th class='text-left'>Play Count</th>
              <th class='text-left'>Follower Count</th>
              <th class='text-left'>Fast Challenge Count</th>
              <th class='text-left'>Following Count</th>
              <th class='text-left'>Fingerprint Count</th>
              <th class='text-left'>Overall Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{userScore.playCount}</td>
              <td>{userScore.followerCount}</td>
              <td>{userScore.challengeCount}</td>
              <td>{userScore.followingCount}</td>
              <td>{userScore.fingerprintCount}</td>
              <td>{userScore.overallScore}</td>
            </tr>
          </tbody>
        </table>

        <h2 class='text-xl font-bold mt-4'>Fingerprints</h2>
        <table>
          <thead>
            <tr>
              <th class='text-left'>Fingerprint</th>
              <th class='text-left'>User Count</th>
              <th class='text-left'>Users</th>
            </tr>
          </thead>
          <tbody>
            {fingerprints.map((f) => (
              <tr>
                <td>{f.fingerprint}</td>
                <td>{f.userCount}</td>
                <td class='flex gap-2'>
                  {f.userIds
                    .slice(0, 20)
                    .map((id) => fingerprintUsers.find((u) => u.id == id))
                    .filter(Boolean)
                    .map((u) => (
                      <a href={`/attestation/ui/user?q=${u!.handle}`}>
                        {u!.handle}
                      </a>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 class='text-xl font-bold mt-4'>Actions</h2>
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
        th, td {
          padding: 10px;
        }
      `}</style>
    </Layout>
  )
})

app.get('/attestation/ui/recent-users', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const recentUsers = await getRecentUsers(page)
  const userScores = recentUsers
    ? await Promise.all(
        recentUsers.map(async (user) => {
          const [userScore, flagged] = await Promise.all([
            getUserNormalizedScore(user.id),
            getAAOAttestation(user.handle)
          ])
          return {
            ...userScore,
            flagged
          }
        })
      )
    : []

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
            <th>Handle</th>
            <th>Listen Activity</th>
            <th>Follower Count</th>
            <th>Following Count</th>
            <th>Fast Challenges</th>
            <th>Overall Score</th>
            <th>Normalized Score</th>
          </tr>
        </>
      )
    }
    return null
  }

  return c.html(
    <Layout container>
      <h1 class='text-4xl font-bold mt-8'>Recent Users</h1>
      <table class='table'>
        <tbody>
          {userScores.map((userScore) => (
            <>
              {dateHeader(userScore.timestamp)}
              <tr
                className={
                  userScore?.flagged && userScore.overallScore < 0
                    ? 'bg-purple-100'
                    : userScore.overallScore < 0
                      ? 'bg-red-100'
                      : userScore?.flagged
                        ? 'bg-blue-100'
                        : ''
                }
              >
                <td>{userScore.timestamp.toLocaleTimeString()}</td>
                <td>
                  <a
                    href={`/attestation/ui/user?q=${encodeURIComponent(userScore.handleLowerCase)}`}
                  >
                    {userScore.handleLowerCase}
                  </a>
                </td>
                <td>{userScore.playCount}</td>
                <td>{userScore.followerCount}</td>
                <td>{userScore.followingCount}</td>
                <td>{userScore.challengeCount}</td>
                <td>{userScore.overallScore}</td>
                <td>{userScore.normalizedScore}</td>
              </tr>
            </>
          ))}
        </tbody>
      </table>

      <div class='flex'>
        <a
          href={`/attestation/ui/recent-users?page=${encodeURIComponent(page - 1)}`}
          class='flex items-center justify-center px-3 h-8 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
        >
          Previous
        </a>

        <a
          href={`/attestation/ui/recent-users?page=${encodeURIComponent(page + 1)}`}
          class='flex items-center justify-center px-3 h-8 ms-3 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
        >
          Next
        </a>
      </div>
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
          <div class='font-bold'>
            <a href={`/attestation/ui/user?q=${user.handle}`}>{user.handle}</a>
          </div>
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
                <a href='/attestation/ui'>AAO</a>
              </div>
              <form action='/attestation/ui/user'>
                <input
                  name='q'
                  type='search'
                  class='input'
                  autocomplete={'off'}
                  placeholder='Search ID or Handle'
                />
              </form>
              <a href='/attestation/ui/recent-users' class='btn'>
                Recent Users
              </a>
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

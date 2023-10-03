import { dp_db } from '../db.js'
import { slack } from '../slack.js'
import dotenv from 'dotenv'
import axios from 'axios'
import { getPreviousState } from './utils.js'

dotenv.config()
const { audius_discprov_identity_service_url, USERS_SLACK_CHANNEL } =
  process.env
const social_handle_url = (handle) =>
  `${audius_discprov_identity_service_url}/social_handles?handle=${handle}`

// TODO: send blocknumber through pg trigger
export default async ({ user_id, blocknumber }) => {
  if (blocknumber === undefined) {
    console.warn('no block number returned')
    return
  }
  const current = await dp_db('users')
    .select('handle', 'is_verified') // get this block number
    .where('user_id', '=', user_id)
    .first()
    .catch(console.error)
  const old = await getPreviousState({
    table: 'users',
    id: user_id,
    blocknumber,
    db: dp_db
  })

  // user create
  if (old === undefined) return

  if (current.is_verified !== old.is_verified) {
    const is_verified = current.is_verified
    const handle = current.handle

    const { data } = await axios
      .get(social_handle_url(handle))
      .catch(console.error)

    const { twitterVerified, instagramVerified, tikTokVerified } = data

    let source = 'unknown'
    if (twitterVerified) {
      source = 'twitter'
    }
    if (instagramVerified) {
      source = 'instagram'
    }
    if (tikTokVerified) {
      source = 'tiktok'
    }

    const header = `User *${handle}* ${
      is_verified ? 'is now' : 'is no longer'
    } verified via ${source}!`

    const body = {
      userId: user_id,
      handle,
      link: `https://audius.co/${handle}`,
      source
    }

    console.log({ to_slack: body }, 'sending to slack')
    await slack.sendMsg(USERS_SLACK_CHANNEL, header, body).catch(console.error)
  }
}

import { dp_db } from '../db.js'
import { slack } from '../slack.js'
import dotenv from 'dotenv'
import { getPreviousState } from './utils.js'

dotenv.config()
const { USERS_SLACK_CHANNEL } =
  process.env

// TODO: send blocknumber through pg trigger
export default async ({ user_id, blocknumber }) => {
  if (blocknumber === undefined) {
    console.warn('no block number returned')
    return
  }
  const current = await dp_db('users')
    .select('handle', 'is_verified')
    .where('user_id', '=', user_id)
    .first()
    .catch(console.error)
  const old = await getPreviousState({
    table: 'users',
    id: user_id,
    blocknumber,
    db: dp_db
  })

  console.log({ current, old, user_id, blocknumber })

  if (current === undefined) {
    console.warn(
      { user_id, blocknumber },
      'user does not have a current record'
    )
    return
  }

  const new_user_is_verified = !old && current.is_verified
  const existing_user_became_verified = !old?.is_verified && current.is_verified

  console.log({
    user_id,
    existing_user_became_verified,
    new_user_is_verified
  })

  if (existing_user_became_verified || new_user_is_verified) {
    const is_verified = current.is_verified
    const handle = current.handle

    let source
    if (current.verified_with_twitter) {
      source = 'twitter'
    } else if (current.verified_with_instagram) {
      source = 'instagram'
    } else if (current.verified_with_tiktok) {
      source = 'tiktok'
    } else {
      source = 'manual'
    }

    const header = `User *${handle}* ${is_verified ? 'is now' : 'is no longer'
      } verified via ${source}!`

    const body = {
      userId: user_id,
      handle,
      link: `https://audius.co/${handle}`,
      source
    }

    console.log({ to_slack: body }, 'user verification')
    await slack.sendMsg(USERS_SLACK_CHANNEL, header, body).catch(console.error)
  }
}

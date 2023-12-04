import retry from 'async-retry'
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

  const is_new_user = old === undefined
  const new_user_is_verified = is_new_user && current.is_verified
  const is_existing_user = !is_new_user
  const existing_user_previously_unverified =
    is_existing_user && old.is_verified === false
  const user_currently_verified = current.is_verified === true
  const existing_user_became_verified =
    user_currently_verified && existing_user_previously_unverified

  console.log({
    user_id,
    existing_user_became_verified,
    new_user_is_verified,
    is_new_user,
    is_existing_user
  })

  if (existing_user_became_verified || new_user_is_verified) {
    const is_verified = current.is_verified
    const handle = current.handle

    let source
    try {
      const data = await retry(
        async (_) => {
          const { data } = await axios
            .get(social_handle_url(handle))
            .catch(console.error)

          if (Object.keys(data).length === 0) {
            throw new Error('social handles not in identity yet')
          }

          return data
        },
      )
      const { twitterVerified, instagramVerified, tikTokVerified } = data

      if (twitterVerified) {
        source = 'twitter'
      }
      if (instagramVerified) {
        source = 'instagram'
      }
      if (tikTokVerified) {
        source = 'tiktok'
      }
    } catch (e) {
      source = 'could not figure out source!'
      console.error(e)
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

    console.log({ to_slack: body }, 'user verification')
    await slack.sendMsg(USERS_SLACK_CHANNEL, header, body).catch(console.error)
  }
}

import { dp_db } from '../db.js'
import { slack } from '../slack.js'
import { USDC } from '@audius/fixed-decimal'

const { PURCHASES_SLACK_CHANNEL } = process.env

export default async (row) => {
  const {
    buyer_user_id,
    seller_user_id,
    amount,
    content_type,
    content_id,
    access,
    extra_amount,
    vendor
  } = row

  const users = await dp_db('users')
    .select('users.user_id', 'users.handle', 'users.name')
    .where('users.user_id', '=', buyer_user_id)
    .orWhere('users.user_id', '=', seller_user_id)

  const buyer = users.find((u) => u.user_id === buyer_user_id)
  const seller = users.find((u) => u.user_id === seller_user_id)

  let contentMetadata
  if (content_type === 'track') {
    contentMetadata = await dp_db('tracks')
      .select('tracks.title')
      .where('tracks.track_id', '=', content_id)
      .first()
  } else {
    contentMetadata = await dp_db('playlists')
      .select('playlists.playlist_name as title')
      .where('playlists.playlist_id', '=', content_id)
      .first()
  }

  const { sendMsg } = slack
  const header = `*${seller.name}* (@${seller.handle}) just made a sale!`
  const data = {
    buyer: `${buyer.name} (@${buyer.handle})`,
    content_title: contentMetadata.title,
    content_type,
    price: USDC(BigInt(amount)).toLocaleString(),
    payExtra: USDC(BigInt(extra_amount)).toLocaleString(),
    access,
    vendor,
    buyer_user_id,
    seller_user_id,
    content_id
  }

  await sendMsg(PURCHASES_SLACK_CHANNEL, header, data).catch(console.error)
}

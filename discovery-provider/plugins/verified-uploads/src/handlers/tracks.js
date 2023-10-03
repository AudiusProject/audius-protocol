import { dp_db } from '../db.js'
import { slack } from '../slack.js'
import dotenv from 'dotenv'

dotenv.config()
const { TRACKS_SLACK_CHANNEL } = process.env

export const isOldUpload = (uploadDate) => {
  let uploadedDate = new Date(uploadDate).getTime()
  let oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  oneWeekAgo = oneWeekAgo.getTime()
  return oneWeekAgo > uploadedDate
}

export default async ({ track_id, updated_at, created_at }) => {
  const isUpload = updated_at === created_at
  if (!isUpload) return

  const trackId = track_id
  const results = await dp_db('tracks')
    .innerJoin('users', 'tracks.owner_id', '=', 'users.user_id')
    .innerJoin('track_routes', 'tracks.track_id', '=', 'track_routes.track_id')
    .select(
      'tracks.title',
      'tracks.mood',
      'tracks.genre',
      'tracks.release_date',
      'tracks.is_premium',
      'tracks.owner_id',
      'users.user_id',
      'users.handle',
      'users.name',
      'tracks.track_id',
      'users.is_verified',
      'track_routes.slug',
      'tracks.is_unlisted'
    )
    .where('tracks.track_id', '=', trackId)
    .where('users.is_verified', '=', true)
    .first()
    .catch(console.error)

  if (results === undefined) return

  const { title, genre, mood, is_premium, handle, slug, release_date, name } =
    results

  const { sendMsg } = slack
  const header = `:audius-spin: New upload from *${name}* 🔥`
  const data = {
    Title: title,
    Genre: genre,
    Mood: mood,
    Premium: is_premium,
    Handle: handle,
    Link: `https://audius.co/${handle}/${slug}`,
    Release: release_date || created_at
  }
  console.log({ to_slack: data }, 'track upload')
  await sendMsg(TRACKS_SLACK_CHANNEL, header, data).catch(console.error)
}

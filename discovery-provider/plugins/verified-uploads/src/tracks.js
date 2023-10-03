import { db } from './db.js'
import { slack } from './slack.js'

const { TRACKS_SLACK_CHANNEL } = process.env

export const isOldUpload = (uploadDate) => {
  let uploadedDate = new Date(uploadDate).getTime()
  let oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  oneWeekAgo = oneWeekAgo.getTime()
  return oneWeekAgo > uploadedDate
}

export const handleTracks = async ({ track_id }) => {
  const trackId = track_id
  const results = await db('tracks')
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
      'tracks.created_at',
      'tracks.updated_at',
      'tracks.is_unlisted'
    )
    .where('tracks.track_id', '=', trackId)
    .first()
    .catch(console.error)

  const {
    title,
    mood,
    release_date,
    is_premium,
    handle,
    name,
    genre,
    slug,
    is_unlisted
  } = results
  if (is_unlisted) {
    console.log(
      { handle, release_date, title },
      `received new verified track but it's unlisted or an old upload`
    )
    return
  }
  console.log(`received new verified track from ${handle}`)
  const { sendMsg } = slack
  const header = `:audius-spin: New upload from *${name}* 🔥`
  const data = {
    Title: title,
    Genre: genre,
    Mood: mood,
    Premium: is_premium,
    Handle: handle,
    Link: `https://audius.co/${handle}/${slug}`,
    Release: release_date
  }
  await sendMsg(TRACKS_SLACK_CHANNEL, header, data)
}

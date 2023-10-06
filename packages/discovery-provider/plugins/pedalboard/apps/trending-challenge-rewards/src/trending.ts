import { App } from '@pedalboard/basekit'
import { Knex } from 'knex'
import { SharedData } from './config'
import { intoResult } from './utils'
import { WebClient } from '@slack/web-api'
import moment from 'moment'
import { Table, TrendingResults } from '@pedalboard/storage'

enum TrendingTypes {
  Tracks = 'TrendingType.TRACKS',
  Playlists = 'TrendingType.PLAYLISTS',
  UndergroundTracks = 'TrendingType.UNDERGROUND_TRACKS'
}

type TrendingEntry = {
  handle: string // twitter or discovery
  rank: number
}

export const announceTopFiveTrending = async (
  app: App<SharedData>,
  maybeWeek?: string
) => {
  const identityDbRes = await intoResult(async () => app.getIdDb())
  if (identityDbRes.err) {
    console.error('Identity connection error: ', identityDbRes)
    return
  }
  const identityDb = identityDbRes.unwrap()
  const discoveryDb = app.getDnDb()

  const week = maybeWeek || moment().format('YYYY-MM-DD')

  console.log('getting top trending for week ', week)

  const [tracks, playlists, undergroundTracks] = await queryTopFiveTrending(
    discoveryDb,
    week
  )

  const trackHandles = await queryHandles(identityDb, tracks)
  const playlistHandles = await queryHandles(identityDb, playlists)
  const undergroundHandles = await queryHandles(identityDb, undergroundTracks)

  const trackEntries = assembleEntries(trackHandles, tracks)
  const playlistEntries = assembleEntries(playlistHandles, playlists)
  const undergroundEntries = assembleEntries(
    undergroundHandles,
    undergroundTracks
  )

  console.log('track entries', JSON.stringify(trackEntries))
  console.log('playlist entries', JSON.stringify(playlistEntries))
  console.log('underground entries', JSON.stringify(undergroundEntries))

  const trendingTracksTweet = composeTweet(
    'Top 5 Trending Tracks 🔥',
    week,
    trackEntries
  )
  const trendingPlaylistTweet = composeTweet(
    'Top 5 Trending Playlists 🎚️',
    week,
    playlistEntries
  )
  const trendingUndergroundTweet = composeTweet(
    'Top 5 Trending Underground 🎵',
    week,
    undergroundEntries
  )

  const webClient = new WebClient(process.env.SLACK_BOT_TOKEN)
  await sendTweet(webClient, [
    trendingTracksTweet,
    trendingPlaylistTweet,
    trendingUndergroundTweet
  ])
}

export const queryTopFiveTrending = async (
  discoveryDb: Knex,
  week: string
): Promise<TrendingResults[][]> => {
  // 2023-06-09
  const tracks = await discoveryDb<TrendingResults>(Table.TrendingResults)
    .where('type', '=', TrendingTypes.Tracks)
    .where('week', '=', week)
    .orderBy('rank')
    .limit(5)

  const playlists = await discoveryDb<TrendingResults>(Table.TrendingResults)
    .where('type', '=', TrendingTypes.Playlists)
    .where('week', '=', week)
    .orderBy('rank')
    .limit(5)

  const undergroundTracks = await discoveryDb<TrendingResults>(
    Table.TrendingResults
  )
    .where('type', '=', TrendingTypes.UndergroundTracks)
    .where('week', '=', week)
    .orderBy('rank')
    .limit(5)

  return [tracks, playlists, undergroundTracks]
}

export const queryHandles = async (
  identityDb: Knex,
  trendingResults: TrendingResults[]
): Promise<Map<number, string>> => {
  const blockchainUserIds = trendingResults.map((res) => res.user_id)
  const userHandles = await identityDb('Users')
    .select('handle', 'blockchainUserId')
    .whereIn('blockchainUserId', blockchainUserIds)
  const handles = userHandles.map((handle) => handle.handle)
  const twitterHandles = await identityDb('SocialHandles')
    .select('handle', 'twitterHandle')
    .whereIn('handle', handles)
  const handleMap = new Map<number, string>()
  for (const userId of blockchainUserIds) {
    const userHandle = userHandles.find(
      (handle) => handle.blockchainUserId === userId
    )
    const twitterHandle = twitterHandles.find(
      (handle) =>
        handle.handle === userHandle.handle && handle.twitterHandle !== null
    )
    if (twitterHandle === undefined)
      handleMap.set(userId, `@/${userHandle.handle}`)
    else {
      handleMap.set(userId, `@${twitterHandle.twitterHandle}`)
    }
  }
  return handleMap
}

export const assembleEntries = (
  userIdToHandle: Map<number, string>,
  trendingResults: TrendingResults[]
): TrendingEntry[] => {
  const trendingEntries = []
  for (const result of trendingResults) {
    const { rank, user_id } = result
    const handle = userIdToHandle.get(user_id)!
    trendingEntries.push({
      handle,
      rank
    })
  }
  return trendingEntries
}

export const composeTweet = (
  title: string,
  week: string,
  entries: TrendingEntry[]
): string => {
  // order by rank in case db queries reordered in some way
  const orderedEntries = entries.sort((a, b) => {
    if (a.rank < b.rank) return -1 // a has a lower number, thus a higher rank
    if (a.rank > b.rank) return 1 // a has a higher number, thus a lower rank
    return 0 // ranks are equal, no sort to be done
  })
  const newLine = '\n'
  const handles = orderedEntries
    .map((entry) => `${entry.handle}${newLine}`)
    .join('')
  return '```\n' + `${title} (${week})` + newLine + handles + '```'
}

const sendTweet = async (slack: WebClient, tweets: string[]) => {
  const channel = process.env.SLACK_CHANNEL
  if (channel === undefined) throw Error('SLACK_CHANNEL not defined')
  for (const tweet of tweets) {
    await slack.chat.postMessage({
      channel,
      text: tweet
    })
  }
}

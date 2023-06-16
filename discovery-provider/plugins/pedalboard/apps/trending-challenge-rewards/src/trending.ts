import App from "basekit/src/app";
import { Knex } from "knex";
import { SharedData } from "./config";
import { intoResult } from "./utils";
import { WebClient } from "@slack/web-api";
import moment from "moment";
import { Table, TrendingResults } from "storage/src";

enum TrendingTypes {
  Tracks = "TrendingType.TRACKS",
  Playlists = "TrendingType.PLAYLISTS",
  UndergroundTracks = "TrendingType.UNDERGROUND_TRACKS",
}

type TrendingEntry = {
  handle: string; // twitter or discovery
  rank: number;
};

export const announceTopFiveTrending = async (app: App<SharedData>) => {
  const identityDbRes = await intoResult(async () => app.getIdDb());
  if (identityDbRes.err) {
    console.error("Identity connection error: ", identityDbRes);
    return;
  }
  const identityDb = identityDbRes.unwrap();
  const discoveryDb = app.getDnDb();

  const [tracks, playlists, undergroundTracks] = await queryTopFiveTrending(
    discoveryDb
  );

  const trackHandles = await queryHandles(identityDb, tracks)
  const playlistHandles = await queryHandles(identityDb, playlists)
  const undergroundHandles = await queryHandles(identityDb, undergroundTracks)

  const trackEntries = assembleEntries(trackHandles, tracks)
  const playlistEntries = assembleEntries(playlistHandles, playlists)
  const undergroundEntries = assembleEntries(undergroundHandles, undergroundTracks)

  const trendingTracksTweet = composeTweet("Top 5 Trending Tracks 🔥", trackEntries)
  const trendingPlaylistTweet = composeTweet("Top 5 Trending Playlists 🎚️", playlistEntries)
  const trendingUndergroundTweet = composeTweet("Top 5 Trending Underground 🎵", undergroundEntries)

  // TODO: send slack msg
};

const queryTopFiveTrending = async (
  discoveryDb: Knex
): Promise<TrendingResults[][]> => {
  // 2023-06-09
  const week = moment().format("YYYY-MM-DD");
  const tracks = await discoveryDb<TrendingResults>(Table.TrendingResults)
    .where("type", "=", TrendingTypes.Tracks)
    .where("week", "=", week)
    .orderBy("rank")
    .limit(5);

  const playlists = await discoveryDb<TrendingResults>(Table.TrendingResults)
    .where("type", "=", TrendingTypes.Playlists)
    .where("week", "=", week)
    .orderBy("rank")
    .limit(5);

  const undergroundTracks = await discoveryDb<TrendingResults>(
    Table.TrendingResults
  )
    .where("type", "=", TrendingTypes.UndergroundTracks)
    .where("week", "=", week)
    .orderBy("rank")
    .limit(5);

  return [tracks, playlists, undergroundTracks];
};

const queryHandles = async (identityDb: Knex, trendingResults: TrendingResults[]): Promise<Map<number, string>> => {
    const blockchainUserIds = trendingResults.map((res) => res.user_id)
    // join SocialHandles and Users tables in identity
    // select 'handle' from users table by blockchainUserId
    // select 'twitterHandle' from social handles table by handle
    // after query, if twitter handle undefined, add `@/` to handle
    // otherwise just add `@`
    return new Map()
}

const assembleEntries = (userIdToHandle: Map<number, string>, trendingResults: TrendingResults[]): TrendingEntry[] => {
    return []
}

const composeTweet = (title: string, entries: TrendingEntry[]): string => {
  // order by rank in case db queries reordered in some way
  const orderedEntries = entries.sort((a, b) => {
    if (a.rank < b.rank) return 1 // a has a lower number, thus a higher rank
    if (a.rank > b.rank) return -1 // a has a higher number, thus a lower rank
    return 0 // ranks are equal, no sort to be done
  })
  const newLine = "\n"
  const handles = entries.map((entry) => `${entry.handle}${newLine}`)
  return "```" + title + newLine + handles + "```"
};

const sendTweet = async (slack: WebClient, tweets: string[]) => {};

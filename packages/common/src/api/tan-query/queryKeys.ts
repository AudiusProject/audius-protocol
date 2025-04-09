import { User } from '~/models'
import { ID } from '~/models/Identifiers'

import { TQCollection, TQTrack } from './models'
import { QueryKey } from './types'

export const QUERY_KEYS = {
  aiTracks: 'aiTracks',
  accountUser: 'accountUser',
  trackCommentList: 'trackCommentList',
  userCommentList: 'userCommentList',
  comment: 'comment',
  commentReplies: 'commentReplies',
  downloadTrackStems: 'downloadTrackStems',
  stemsArchiveJob: 'stemsArchiveJob',
  exploreContent: 'exploreContent',
  trackCommentNotificationSetting: 'trackCommentNotificationSetting',
  trackCommentCount: 'trackCommentCount',
  track: 'track',
  tracks: 'tracks',
  tracksByUser: 'tracksByUser',
  tracksByHandle: 'tracksByHandle',
  trackByPermalink: 'trackByPermalink',
  tracksByPlaylist: 'tracksByPlaylist',
  tracksByAlbum: 'tracksByAlbum',
  user: 'user',
  users: 'users',
  userByHandle: 'userByHandle',
  userTracksByHandle: 'userTracksByHandle',
  userPlaylists: 'userPlaylists',
  userAlbums: 'userAlbums',
  userCollectibles: 'userCollectibles',
  collection: 'collection',
  collections: 'collections',
  collectionByPermalink: 'collectionByPermalink',
  followers: 'followers',
  favoritedTracks: 'favoritedTracks',
  supporters: 'supporters',
  supporter: 'supporter',
  topSupporter: 'topSupporter',
  supportedUsers: 'supportedUsers',
  relatedArtists: 'relatedArtists',
  purchases: 'purchases',
  purchasesCount: 'purchasesCount',
  sales: 'sales',
  salesCount: 'salesCount',
  mutualFollowers: 'mutualFollowers',
  emailInUse: 'emailInUse',
  handleInUse: 'handleInUse',
  handleReservedStatus: 'handleReservedStatus',
  search: 'search',
  trending: 'trending',
  suggestedArtists: 'suggestedArtists',
  topArtistsInGenre: 'topArtistsInGenre',
  audioTransactions: 'audioTransactions',
  audioTransactionsCount: 'audioTransactionsCount',
  libraryCollections: 'libraryCollections',
  favorites: 'favorites',
  following: 'following',
  notifications: 'notifications',
  notificationUnreadCount: 'notificationUnreadCount',
  reposts: 'reposts',
  remixers: 'remixers',
  remixersCount: 'remixersCount',
  trackHistory: 'trackHistory',
  topTags: 'topTags',
  feed: 'feed',
  authorizedApps: 'authorizedApps',
  developerApps: 'developerApps',
  searchAutocomplete: 'searchAutocomplete',
  purchasers: 'purchasers',
  purchasersCount: 'purchasersCount',
  remixedTracks: 'remixedTracks',
  mutedUsers: 'mutedUsers',
  salesAggregate: 'salesAggregate',
  usdcTransactionsCount: 'usdcTransactionsCount',
  usdcTransactions: 'usdcTransactions',
  libraryTracks: 'libraryTracks',
  remixes: 'remixes',
  premiumTracks: 'premiumTracks',
  profileReposts: 'profileReposts',
  profileTracks: 'profileTracks',
  trendingIds: 'trendingIds',
  trendingPlaylists: 'trendingPlaylists',
  trendingUnderground: 'trendingUnderground',
  trackPageLineup: 'trackPageLineup',
  events: 'events',
  eventsByEntityId: 'eventsByEntityId'
} as const

/**
 * Core entity query key fns are separated here due to cylical import issues
 * These methods are imported in the cache selectors which cause a circular dependency issue if importing directly from the query hook files.
 */

export const getUserQueryKey = (userId: ID | null | undefined) => {
  return [QUERY_KEYS.user, userId] as unknown as QueryKey<User>
}

export const getCollectionQueryKey = (collectionId: ID | null | undefined) => {
  return [
    QUERY_KEYS.collection,
    collectionId
  ] as unknown as QueryKey<TQCollection>
}

export const getTrackQueryKey = (trackId: ID | null | undefined) => {
  return [QUERY_KEYS.track, trackId] as unknown as QueryKey<TQTrack>
}

export const getUserByHandleQueryKey = (handle: string | null | undefined) => {
  return [QUERY_KEYS.userByHandle, handle] as unknown as QueryKey<ID>
}

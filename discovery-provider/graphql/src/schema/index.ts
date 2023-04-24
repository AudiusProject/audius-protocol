// TODO: Eventually separate entity specific schema parts and resolvers into their own files https://www.apollographql.com/blog/backend/schema-design/modularizing-your-graphql-schema-code/

import { Context } from '../models'

// scalar EpochTimeStamp

// type TrackSegment {
//   duration: String!
//   multihash: String!
// }

// type Followee {
//   user: User!
//   is_delete: Boolean!
//   repost_item_id: String!
//   repost_type: String!
// }

// type Download {
//   is_downloadable: Boolean
//   requires_follow: Boolean
//   cid: String
// }

// type FieldVisibility {
//   genre: Boolean!
//   mood: Boolean!
//   tags: Boolean!
//   share: Boolean!
//   play_count: Boolean!
//   remixes: Boolean!
// }

// type Remix {
//   parent_track_id: ID!
//   user: User
//   has_remix_author_reposted: Boolean!
//   has_remix_author_saved: Boolean!
// }

// type RemixOf {
//   tracks: [Remix!]!
// }

// enum TokenStandard {
//   ERC721
//   ERC1155
// }

// type PremiumConditionsEthNFTCollection {
//   chain: Chain!
//   standard: TokenStandard!
//   address: String!
//   name: String!
//   slug: String!
//   imageUrl: String
//   externalLink: String
// }

// type PremiumConditionsSolNFTCollection {
//   chain: Chain!
//   address: String!
//   name: String!
//   imageUrl: String
//   externalLink: String
// }

// union PremiumConditionsNFTCollection =
//     PremiumConditionsEthNFTCollection
//   | PremiumConditionsSolNFTCollection

// type PremiumConditions {
//   nft_collection: PremiumConditionsNFTCollection
//   follow_user_id: Int
//   tip_user_id: Int
// }

// type PremiumContentSignature {
//   data: String!
//   signature: String!
// }

// type EthCollectionMap {
//   slug: String!
//   name: String!
//   address: String!
//   standard: TokenStandard!
//   img: String
//   externalLink: String
// }

// type SolCollectionMap {
//   mint: String!
//   name: String!
//   img: String
//   externalLink: String
// }

// enum PremiumTrackStatus {
//   UNLOCKING
//   UNLOCKED
//   LOCKED
// }

// type Track {
//   blocknumber: Int!
//   activity_timestamp: String
//   is_delete: Boolean!
//   track_id: Int!
//   created_at: String!
//   isrc: String
//   iswc: String
//   credits_splits: String
//   description: String
//   followee_reposts: [Repost!]!
//   followee_saves: [Favorite!]!
//   genre: String!
//   has_current_user_reposted: Boolean!
//   has_current_user_saved: Boolean!
//   download: Download
//   license: License
//   mood: String
//   play_count: Int!
//   owner_id: ID!
//   release_date: String
//   repost_count: Int!
//   save_count: Int!
//   tags: String
//   title: String!
//   track_segments: [TrackSegment!]!
//   cover_art: String
//   cover_art_sizes: String
//   is_unlisted: Boolean!
//   is_available: Boolean!
//   is_premium: Boolean!
//   premium_conditions: PremiumConditions
//   premium_content_signature: PremiumContentSignature
//   field_visibility: FieldVisibility
//   listenCount: Int
//   permalink: String!
//   is_playlist_upload: Boolean
//   is_invalid: Boolean
//   stem_of: Stem
//   remix_of: RemixOf
//   dateListened: String
//   duration: Int!
//   offline: OfflineTrackMetadata
// }

// type Stem {
//   track_id: ID!
//   category: String!
// }

// type TrackImage {
//   cover_art: String
//   cover_art_sizes: String
// }

// type UserTrack {
//   track: Track!
//   user: User!
// }

export const typeDefs = `#graphql
  type BlockConfirmation {
    blockPassed: Boolean
  }

  type Query {
    blockConfirmation(blockNumber: Int!): BlockConfirmation
  }
`

type QueryBlockConfirmationArgs = {
  blockNumber: number
}

export const resolvers = {
  Query: {
    blockConfirmation: async (
      _: null,
      { blockNumber }: QueryBlockConfirmationArgs,
      { dataSources }: Context
    ) => {
      const result = await dataSources.db.getBlockConfirmation(blockNumber)
      return { blockPassed: result }
    }
  }
}

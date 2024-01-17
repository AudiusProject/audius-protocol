// The TypeScript definitions below are automatically generated.
// Do not touch them, or risk, your modifications being lost.

export enum Challengetype {
  Boolean = "boolean",
  Numeric = "numeric",
  Aggregate = "aggregate",
  Trending = "trending",
}

export enum Reposttype {
  Track = "track",
  Playlist = "playlist",
  Album = "album",
}

export enum Savetype {
  Track = "track",
  Playlist = "playlist",
  Album = "album",
}

export enum Skippedtransactionlevel {
  Node = "node",
  Network = "network",
}

export enum WalletChain {
  Eth = "eth",
  Sol = "sol",
}

export enum Table {
  AggregateDailyAppNameMetrics = "aggregate_daily_app_name_metrics",
  AggregateDailyTotalUsersMetrics = "aggregate_daily_total_users_metrics",
  AggregateDailyUniqueUsersMetrics = "aggregate_daily_unique_users_metrics",
  AggregateMonthlyAppNameMetrics = "aggregate_monthly_app_name_metrics",
  AggregateMonthlyPlays = "aggregate_monthly_plays",
  AggregateMonthlyTotalUsersMetrics = "aggregate_monthly_total_users_metrics",
  AggregateMonthlyUniqueUsersMetrics = "aggregate_monthly_unique_users_metrics",
  AggregatePlaylist = "aggregate_playlist",
  AggregatePlays = "aggregate_plays",
  AggregateTrack = "aggregate_track",
  AggregateUser = "aggregate_user",
  AggregateUserTips = "aggregate_user_tips",
  AppDelegates = "app_delegates",
  AppNameMetrics = "app_name_metrics",
  AssociatedWallets = "associated_wallets",
  AudioTransactionsHistory = "audio_transactions_history",
  AudiusDataTxs = "audius_data_txs",
  Blocks = "blocks",
  ChallengeDisbursements = "challenge_disbursements",
  ChallengeListenStreak = "challenge_listen_streak",
  ChallengeProfileCompletion = "challenge_profile_completion",
  Challenges = "challenges",
  Chat = "chat",
  ChatBlockedUsers = "chat_blocked_users",
  ChatMember = "chat_member",
  ChatMessage = "chat_message",
  ChatMessageReactions = "chat_message_reactions",
  ChatPermissions = "chat_permissions",
  CidData = "cid_data",
  Delegations = "delegations",
  EthBlocks = "eth_blocks",
  Follows = "follows",
  HourlyPlayCounts = "hourly_play_counts",
  IndexingCheckpoints = "indexing_checkpoints",
  Milestones = "milestones",
  Notification = "notification",
  NotificationSeen = "notification_seen",
  PgStatStatements = "pg_stat_statements",
  PlaylistRoutes = "playlist_routes",
  Playlists = "playlists",
  PlaylistSeen = "playlist_seen",
  Plays = "plays",
  Pubkeys = "pubkeys",
  Reactions = "reactions",
  RelatedArtists = "related_artists",
  Remixes = "remixes",
  Reposts = "reposts",
  RewardManagerTxs = "reward_manager_txs",
  RewardsManagerBackfillTxs = "rewards_manager_backfill_txs",
  RouteMetrics = "route_metrics",
  RpcCursor = "rpc_cursor",
  Rpclog = "rpclog",
  RpcLog = "rpc_log",
  Saves = "saves",
  SchemaMigrations = "schema_migrations",
  SequelizeMeta = "SequelizeMeta",
  SkippedTransactions = "skipped_transactions",
  SplTokenBackfillTxs = "spl_token_backfill_txs",
  SplTokenTx = "spl_token_tx",
  Stems = "stems",
  Subscriptions = "subscriptions",
  SupporterRankUps = "supporter_rank_ups",
  TrackRoutes = "track_routes",
  Tracks = "tracks",
  TrackTrendingScores = "track_trending_scores",
  TrendingResults = "trending_results",
  UrsmContentNodes = "ursm_content_nodes",
  UserBalanceChanges = "user_balance_changes",
  UserBalances = "user_balances",
  UserBankAccounts = "user_bank_accounts",
  UserBankBackfillTxs = "user_bank_backfill_txs",
  UserBankTxs = "user_bank_txs",
  UserChallenges = "user_challenges",
  UserEvents = "user_events",
  UserListeningHistory = "user_listening_history",
  UserPubkeys = "user_pubkeys",
  Users = "users",
  UserTips = "user_tips",
}

export type Tables = {
  aggregate_daily_app_name_metrics: AggregateDailyAppNameMetrics;
  aggregate_daily_total_users_metrics: AggregateDailyTotalUsersMetrics;
  aggregate_daily_unique_users_metrics: AggregateDailyUniqueUsersMetrics;
  aggregate_monthly_app_name_metrics: AggregateMonthlyAppNameMetrics;
  aggregate_monthly_plays: AggregateMonthlyPlays;
  aggregate_monthly_total_users_metrics: AggregateMonthlyTotalUsersMetrics;
  aggregate_monthly_unique_users_metrics: AggregateMonthlyUniqueUsersMetrics;
  aggregate_playlist: AggregatePlaylist;
  aggregate_plays: AggregatePlays;
  aggregate_track: AggregateTrack;
  aggregate_user: AggregateUser;
  aggregate_user_tips: AggregateUserTips;
  app_delegates: AppDelegates;
  app_name_metrics: AppNameMetrics;
  associated_wallets: AssociatedWallets;
  audio_transactions_history: AudioTransactionsHistory;
  audius_data_txs: AudiusDataTxs;
  blocks: Blocks;
  challenge_disbursements: ChallengeDisbursements;
  challenge_listen_streak: ChallengeListenStreak;
  challenge_profile_completion: ChallengeProfileCompletion;
  challenges: Challenges;
  chat: Chat;
  chat_blocked_users: ChatBlockedUsers;
  chat_member: ChatMember;
  chat_message: ChatMessage;
  chat_message_reactions: ChatMessageReactions;
  chat_permissions: ChatPermissions;
  cid_data: CidData;
  delegations: Delegations;
  eth_blocks: EthBlocks;
  follows: Follows;
  hourly_play_counts: HourlyPlayCounts;
  indexing_checkpoints: IndexingCheckpoints;
  milestones: Milestones;
  notification: Notification;
  notification_seen: NotificationSeen;
  pg_stat_statements: PgStatStatements;
  playlist_routes: PlaylistRoutes;
  playlists: Playlists;
  playlist_seen: PlaylistSeen;
  plays: Plays;
  pubkeys: Pubkeys;
  reactions: Reactions;
  related_artists: RelatedArtists;
  remixes: Remixes;
  reposts: Reposts;
  reward_manager_txs: RewardManagerTxs;
  rewards_manager_backfill_txs: RewardsManagerBackfillTxs;
  route_metrics: RouteMetrics;
  rpc_cursor: RpcCursor;
  rpclog: Rpclog;
  rpc_log: RpcLog;
  saves: Saves;
  schema_migrations: SchemaMigrations;
  SequelizeMeta: SequelizeMeta;
  skipped_transactions: SkippedTransactions;
  spl_token_backfill_txs: SplTokenBackfillTxs;
  spl_token_tx: SplTokenTx;
  stems: Stems;
  subscriptions: Subscriptions;
  supporter_rank_ups: SupporterRankUps;
  track_routes: TrackRoutes;
  tracks: Tracks;
  track_trending_scores: TrackTrendingScores;
  trending_results: TrendingResults;
  ursm_content_nodes: UrsmContentNodes;
  user_balance_changes: UserBalanceChanges;
  user_balances: UserBalances;
  user_bank_accounts: UserBankAccounts;
  user_bank_backfill_txs: UserBankBackfillTxs;
  user_bank_txs: UserBankTxs;
  user_challenges: UserChallenges;
  user_events: UserEvents;
  user_listening_history: UserListeningHistory;
  user_pubkeys: UserPubkeys;
  users: Users;
  user_tips: UserTips;
};

export type AggregateDailyAppNameMetrics = {
  id: number;
  application_name: string;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
};

export type AggregateDailyTotalUsersMetrics = {
  id: number;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
};

export type AggregateDailyUniqueUsersMetrics = {
  id: number;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
  summed_count: number | null;
};

export type AggregateMonthlyAppNameMetrics = {
  id: number;
  application_name: string;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
};

export type AggregateMonthlyPlays = {
  play_item_id: number;
  timestamp: Date;
  count: number;
};

export type AggregateMonthlyTotalUsersMetrics = {
  id: number;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
};

export type AggregateMonthlyUniqueUsersMetrics = {
  id: number;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
  summed_count: number | null;
};

export type AggregatePlaylist = {
  playlist_id: number;
  is_album: boolean | null;
  repost_count: number | null;
  save_count: number | null;
};

export type AggregatePlays = {
  play_item_id: number;
  count: string | null;
};

export type AggregateTrack = {
  track_id: number;
  repost_count: number;
  save_count: number;
};

export type AggregateUser = {
  user_id: number;
  track_count: string | null;
  playlist_count: string | null;
  album_count: string | null;
  follower_count: string | null;
  following_count: string | null;
  repost_count: string | null;
  track_save_count: string | null;
  supporter_count: number;
  supporting_count: number;
};

export type AggregateUserTips = {
  sender_user_id: number;
  receiver_user_id: number;
  amount: string;
};

export type AppDelegates = {
  address: string;
  blockhash: string | null;
  blocknumber: number | null;
  user_id: number | null;
  name: string;
  is_personal_access: boolean;
  is_delete: boolean;
  created_at: Date;
  txhash: string;
  is_current: boolean;
  updated_at: Date;
};

export type AppNameMetrics = {
  application_name: string;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
  id: string;
  ip: string | null;
};

export type AssociatedWallets = {
  id: number;
  user_id: number;
  wallet: string;
  blockhash: string;
  blocknumber: number;
  is_current: boolean;
  is_delete: boolean;
  chain: WalletChain;
};

export type AudioTransactionsHistory = {
  user_bank: string;
  slot: number;
  signature: string;
  transaction_type: string;
  method: string;
  created_at: Date;
  updated_at: Date;
  transaction_created_at: Date;
  change: string;
  balance: string;
  tx_metadata: string | null;
};

export type AudiusDataTxs = {
  signature: string;
  slot: number;
};

export type Blocks = {
  blockhash: string;
  parenthash: string | null;
  is_current: boolean | null;
  number: number | null;
};

export type ChallengeDisbursements = {
  challenge_id: string;
  user_id: number;
  specifier: string;
  signature: string;
  slot: number;
  amount: string;
};

export type ChallengeListenStreak = {
  user_id: number;
  last_listen_date: Date | null;
  listen_streak: number;
};

export type ChallengeProfileCompletion = {
  user_id: number;
  profile_description: boolean;
  profile_name: boolean;
  profile_picture: boolean;
  profile_cover_photo: boolean;
  follows: boolean;
  favorites: boolean;
  reposts: boolean;
};

export type Challenges = {
  id: string;
  type: Challengetype;
  amount: string;
  active: boolean;
  step_count: number | null;
  starting_block: number | null;
};

export type Chat = {
  chat_id: string;
  created_at: Date;
  last_message_at: Date;
  last_message: string | null;
};

export type ChatBlockedUsers = {
  blocker_user_id: number;
  blockee_user_id: number;
  created_at: Date;
};

export type ChatMember = {
  chat_id: string;
  user_id: number;
  cleared_history_at: Date | null;
  invited_by_user_id: number;
  invite_code: string;
  last_active_at: Date | null;
  unread_count: number;
};

export type ChatMessage = {
  message_id: string;
  chat_id: string;
  user_id: number;
  created_at: Date;
  ciphertext: string;
};

export type ChatMessageReactions = {
  user_id: number;
  message_id: string;
  reaction: string;
  created_at: Date;
  updated_at: Date;
};

export type ChatPermissions = {
  user_id: number;
  permits: string | null;
};

export type CidData = {
  cid: string;
  type: string | null;
  data: unknown | null;
};

export type Delegations = {
  shared_address: string;
  blockhash: string | null;
  blocknumber: number | null;
  delegate_address: string;
  user_id: number;
  is_revoked: boolean;
  is_current: boolean;
  is_approved: boolean;
  updated_at: Date;
  created_at: Date;
  txhash: string;
};

export type EthBlocks = {
  last_scanned_block: number;
  created_at: Date;
  updated_at: Date;
};

export type Follows = {
  blockhash: string | null;
  blocknumber: number | null;
  follower_user_id: number;
  followee_user_id: number;
  is_current: boolean;
  is_delete: boolean;
  created_at: Date;
  txhash: string;
  slot: number | null;
};

export type HourlyPlayCounts = {
  hourly_timestamp: Date;
  play_count: number;
};

export type IndexingCheckpoints = {
  tablename: string;
  last_checkpoint: number;
  signature: string | null;
};

export type Milestones = {
  id: number;
  name: string;
  threshold: number;
  blocknumber: number | null;
  slot: number | null;
  timestamp: Date;
};

export type Notification = {
  id: number;
  specifier: string;
  group_id: string;
  type: string;
  slot: number | null;
  blocknumber: number | null;
  timestamp: Date;
  data: unknown | null;
  user_ids: number[] | null;
  type_v2: string | null;
};

export type NotificationSeen = {
  user_id: number;
  seen_at: Date;
  blocknumber: number | null;
  blockhash: string | null;
  txhash: string | null;
};

export type PgStatStatements = {
  userid: unknown | null;
  dbid: unknown | null;
  queryid: string | null;
  query: string | null;
  calls: string | null;
  total_time: number | null;
  min_time: number | null;
  max_time: number | null;
  mean_time: number | null;
  stddev_time: number | null;
  rows: string | null;
  shared_blks_hit: string | null;
  shared_blks_read: string | null;
  shared_blks_dirtied: string | null;
  shared_blks_written: string | null;
  local_blks_hit: string | null;
  local_blks_read: string | null;
  local_blks_dirtied: string | null;
  local_blks_written: string | null;
  temp_blks_read: string | null;
  temp_blks_written: string | null;
  blk_read_time: number | null;
  blk_write_time: number | null;
};

export type PlaylistRoutes = {
  slug: string;
  title_slug: string;
  collision_id: number;
  owner_id: number;
  playlist_id: number;
  is_current: boolean;
  blockhash: string;
  blocknumber: number;
  txhash: string;
};

export type Playlists = {
  blockhash: string | null;
  blocknumber: number | null;
  playlist_id: number;
  playlist_owner_id: number;
  is_album: boolean;
  is_private: boolean;
  playlist_name: string | null;
  playlist_contents: unknown;
  playlist_image_multihash: string | null;
  is_current: boolean;
  is_delete: boolean;
  description: string | null;
  created_at: Date;
  upc: string | null;
  updated_at: Date;
  playlist_image_sizes_multihash: string | null;
  txhash: string;
  last_added_to: Date | null;
  slot: number | null;
  metadata_multihash: string | null;
};

export type PlaylistSeen = {
  user_id: number;
  playlist_id: number;
  seen_at: Date;
  is_current: boolean;
  blocknumber: number | null;
  blockhash: string | null;
  txhash: string | null;
};

export type Plays = {
  id: number;
  user_id: number | null;
  source: string | null;
  play_item_id: number;
  created_at: Date;
  updated_at: Date;
  slot: number | null;
  signature: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

export type Pubkeys = {
  wallet: string;
  pubkey: string | null;
};

export type Reactions = {
  id: number;
  slot: number;
  reaction_value: number;
  sender_wallet: string;
  reaction_type: string;
  reacted_to: string;
  timestamp: Date;
  tx_signature: string | null;
};

export type RelatedArtists = {
  user_id: number;
  related_artist_user_id: number;
  score: number;
  created_at: Date;
};

export type Remixes = {
  parent_track_id: number;
  child_track_id: number;
};

export type Reposts = {
  blockhash: string | null;
  blocknumber: number | null;
  user_id: number;
  repost_item_id: number;
  repost_type: Reposttype;
  is_current: boolean;
  is_delete: boolean;
  created_at: Date;
  txhash: string;
  slot: number | null;
  is_repost_of_repost: boolean;
};

export type RewardManagerTxs = {
  signature: string;
  slot: number;
  created_at: Date;
};

export type RewardsManagerBackfillTxs = {
  signature: string;
  slot: number;
  created_at: Date;
};

export type RouteMetrics = {
  route_path: string;
  version: string;
  query_string: string;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
  id: string;
  ip: string | null;
};

export type RpcCursor = {
  relayed_by: string;
  relayed_at: Date;
};

export type Rpclog = {
  cuid: string;
  wallet: string | null;
  method: string | null;
  params: unknown | null;
  jetstream_seq: number | null;
};

export type RpcLog = {
  relayed_at: Date;
  from_wallet: string;
  rpc: unknown;
  sig: string;
  relayed_by: string;
  applied_at: Date;
};

export type Saves = {
  blockhash: string | null;
  blocknumber: number | null;
  user_id: number;
  save_item_id: number;
  save_type: Savetype;
  is_current: boolean;
  is_delete: boolean;
  created_at: Date;
  txhash: string;
  slot: number | null;
  is_save_of_repost: boolean;
};

export type SchemaMigrations = {
  version: string;
};

export type SequelizeMeta = {
  name: string;
};

export type SkippedTransactions = {
  id: number;
  blocknumber: number;
  blockhash: string;
  txhash: string;
  created_at: Date;
  updated_at: Date;
  level: Skippedtransactionlevel | null;
};

export type SplTokenBackfillTxs = {
  last_scanned_slot: number;
  signature: string;
  created_at: Date;
  updated_at: Date;
};

export type SplTokenTx = {
  last_scanned_slot: number;
  signature: string;
  created_at: Date;
  updated_at: Date;
};

export type Stems = {
  parent_track_id: number;
  child_track_id: number;
};

export type Subscriptions = {
  blockhash: string | null;
  blocknumber: number | null;
  subscriber_id: number;
  user_id: number;
  is_current: boolean;
  is_delete: boolean;
  created_at: Date;
  txhash: string;
};

export type SupporterRankUps = {
  slot: number;
  sender_user_id: number;
  receiver_user_id: number;
  rank: number;
};

export type TrackRoutes = {
  slug: string;
  title_slug: string;
  collision_id: number;
  owner_id: number;
  track_id: number;
  is_current: boolean;
  blockhash: string;
  blocknumber: number;
  txhash: string;
};

export type Tracks = {
  blockhash: string | null;
  track_id: number;
  is_current: boolean;
  is_delete: boolean;
  owner_id: number;
  title: string | null;
  cover_art: string | null;
  tags: string | null;
  genre: string | null;
  mood: string | null;
  credits_splits: string | null;
  create_date: string | null;
  release_date: string | null;
  file_type: string | null;
  metadata_multihash: string | null;
  blocknumber: number | null;
  track_segments: unknown;
  created_at: Date;
  description: string | null;
  isrc: string | null;
  iswc: string | null;
  license: string | null;
  updated_at: Date;
  cover_art_sizes: string | null;
  download: unknown | null;
  is_unlisted: boolean;
  field_visibility: unknown | null;
  route_id: string | null;
  stem_of: unknown | null;
  remix_of: unknown | null;
  txhash: string;
  slot: number | null;
  is_available: boolean;
  is_stream_gated: boolean;
  stream_conditions: unknown | null;
  track_cid: string | null;
  is_playlist_upload: boolean;
  duration: number | null;
  ai_attribution_user_id: number | null;
};

export type TrackTrendingScores = {
  track_id: number;
  type: string;
  genre: string | null;
  version: string;
  time_range: string;
  score: number;
  created_at: Date;
};

export type TrendingResults = {
  user_id: number;
  id: string | null;
  rank: number;
  type: string;
  version: string;
  week: Date;
};

export type UrsmContentNodes = {
  blockhash: string | null;
  blocknumber: number | null;
  created_at: Date;
  is_current: boolean;
  cnode_sp_id: number;
  delegate_owner_wallet: string;
  owner_wallet: string;
  proposer_sp_ids: number[];
  proposer_1_delegate_owner_wallet: string;
  proposer_2_delegate_owner_wallet: string;
  proposer_3_delegate_owner_wallet: string;
  endpoint: string | null;
  txhash: string;
  slot: number | null;
};

export type UserBalanceChanges = {
  user_id: number;
  blocknumber: number;
  current_balance: string;
  previous_balance: string;
  created_at: Date;
  updated_at: Date;
};

export type UserBalances = {
  user_id: number;
  balance: string;
  created_at: Date;
  updated_at: Date;
  associated_wallets_balance: string;
  waudio: string | null;
  associated_sol_wallets_balance: string;
};

export type UserBankAccounts = {
  signature: string;
  ethereum_address: string;
  created_at: Date;
  bank_account: string;
};

export type UserBankBackfillTxs = {
  signature: string;
  slot: number;
  created_at: Date;
};

export type UserBankTxs = {
  signature: string;
  slot: number;
  created_at: Date;
};

export type UserChallenges = {
  challenge_id: string;
  user_id: number;
  specifier: string;
  is_complete: boolean;
  current_step_count: number | null;
  completed_blocknumber: number | null;
};

export type UserEvents = {
  id: number;
  blockhash: string | null;
  blocknumber: number | null;
  is_current: boolean;
  user_id: number;
  referrer: number | null;
  is_mobile_user: boolean;
  slot: number | null;
};

export type UserListeningHistory = {
  user_id: number;
  listening_history: unknown;
};

export type UserPubkeys = {
  user_id: number;
  pubkey_base64: string;
};

export type Users = {
  blockhash: string | null;
  user_id: number;
  is_current: boolean;
  handle: string | null;
  wallet: string | null;
  name: string | null;
  profile_picture: string | null;
  cover_photo: string | null;
  bio: string | null;
  location: string | null;
  metadata_multihash: string | null;
  creator_node_endpoint: string | null;
  blocknumber: number | null;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
  handle_lc: string | null;
  cover_photo_sizes: string | null;
  profile_picture_sizes: string | null;
  primary_id: number | null;
  secondary_ids: number[] | null;
  replica_set_update_signer: string | null;
  has_collectibles: boolean;
  txhash: string;
  playlist_library: unknown | null;
  is_deactivated: boolean;
  slot: number | null;
  user_storage_account: string | null;
  user_authority_account: string | null;
  artist_pick_track_id: number | null;
  is_available: boolean;
  is_storage_v2: boolean;
  allow_ai_attribution: boolean;
};

export type UserTips = {
  slot: number;
  signature: string;
  sender_user_id: number;
  receiver_user_id: number;
  amount: string;
  created_at: Date;
  updated_at: Date;
};

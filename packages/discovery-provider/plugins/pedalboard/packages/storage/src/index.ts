// The TypeScript definitions below are automatically generated.
// Do not touch them, or risk, your modifications being lost.

export enum Challengetype {
  Boolean = "boolean",
  Numeric = "numeric",
  Aggregate = "aggregate",
  Trending = "trending",
}

export enum DelistEntity {
  Tracks = "TRACKS",
  Users = "USERS",
}

export enum DelistTrackReason {
  Dmca = "DMCA",
  Acr = "ACR",
  Manual = "MANUAL",
  AcrCounterNotice = "ACR_COUNTER_NOTICE",
  DmcaRetraction = "DMCA_RETRACTION",
  DmcaCounterNotice = "DMCA_COUNTER_NOTICE",
  DmcaAndAcrCounterNotice = "DMCA_AND_ACR_COUNTER_NOTICE",
}

export enum DelistUserReason {
  StrikeThreshold = "STRIKE_THRESHOLD",
  CopyrightSchool = "COPYRIGHT_SCHOOL",
  Manual = "MANUAL",
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

export enum UsdcPurchaseAccessType {
  Stream = "stream",
  Download = "download",
}

export enum UsdcPurchaseContentType {
  Track = "track",
  Playlist = "playlist",
  Album = "album",
}

export enum WalletChain {
  Eth = "eth",
  Sol = "sol",
}

export enum Table {
  SequelizeMeta = "SequelizeMeta",
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
  AlembicVersion = "alembic_version",
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
  ChatBan = "chat_ban",
  ChatBlockedUsers = "chat_blocked_users",
  ChatMember = "chat_member",
  ChatMessage = "chat_message",
  ChatMessageReactions = "chat_message_reactions",
  ChatPermissions = "chat_permissions",
  CidData = "cid_data",
  DashboardWalletUsers = "dashboard_wallet_users",
  DelistStatusCursor = "delist_status_cursor",
  DeveloperApps = "developer_apps",
  EthBlocks = "eth_blocks",
  Follows = "follows",
  Grants = "grants",
  HourlyPlayCounts = "hourly_play_counts",
  IndexingCheckpoints = "indexing_checkpoints",
  Milestones = "milestones",
  Notification = "notification",
  NotificationSeen = "notification_seen",
  PaymentRouterTxs = "payment_router_txs",
  PgStatStatements = "pg_stat_statements",
  PgStatStatementsInfo = "pg_stat_statements_info",
  PlaylistRoutes = "playlist_routes",
  PlaylistSeen = "playlist_seen",
  Playlists = "playlists",
  Plays = "plays",
  Pubkeys = "pubkeys",
  Reactions = "reactions",
  RelatedArtists = "related_artists",
  Remixes = "remixes",
  Reposts = "reposts",
  RevertBlocks = "revert_blocks",
  RewardManagerTxs = "reward_manager_txs",
  RewardsManagerBackfillTxs = "rewards_manager_backfill_txs",
  RouteMetrics = "route_metrics",
  RpcCursor = "rpc_cursor",
  RpcError = "rpc_error",
  RpcLog = "rpc_log",
  Rpclog = "rpclog",
  Saves = "saves",
  SchemaMigrations = "schema_migrations",
  SchemaVersion = "schema_version",
  SkippedTransactions = "skipped_transactions",
  SplTokenBackfillTxs = "spl_token_backfill_txs",
  SplTokenTx = "spl_token_tx",
  Stems = "stems",
  Subscriptions = "subscriptions",
  SupporterRankUps = "supporter_rank_ups",
  TrackDelistStatuses = "track_delist_statuses",
  TrackPriceHistory = "track_price_history",
  TrackRoutes = "track_routes",
  TrackTrendingScores = "track_trending_scores",
  Tracks = "tracks",
  TrendingResults = "trending_results",
  UsdcPurchases = "usdc_purchases",
  UsdcTransactionsHistory = "usdc_transactions_history",
  UsdcUserBankAccounts = "usdc_user_bank_accounts",
  UserBalanceChanges = "user_balance_changes",
  UserBalances = "user_balances",
  UserBankAccounts = "user_bank_accounts",
  UserBankBackfillTxs = "user_bank_backfill_txs",
  UserBankTxs = "user_bank_txs",
  UserChallenges = "user_challenges",
  UserDelistStatuses = "user_delist_statuses",
  UserEvents = "user_events",
  UserListeningHistory = "user_listening_history",
  UserPubkeys = "user_pubkeys",
  UserTips = "user_tips",
  Users = "users",
}

export type Tables = {
  "SequelizeMeta": SequelizeMeta,
  "aggregate_daily_app_name_metrics": AggregateDailyAppNameMetrics,
  "aggregate_daily_total_users_metrics": AggregateDailyTotalUsersMetrics,
  "aggregate_daily_unique_users_metrics": AggregateDailyUniqueUsersMetrics,
  "aggregate_monthly_app_name_metrics": AggregateMonthlyAppNameMetrics,
  "aggregate_monthly_plays": AggregateMonthlyPlays,
  "aggregate_monthly_total_users_metrics": AggregateMonthlyTotalUsersMetrics,
  "aggregate_monthly_unique_users_metrics": AggregateMonthlyUniqueUsersMetrics,
  "aggregate_playlist": AggregatePlaylist,
  "aggregate_plays": AggregatePlays,
  "aggregate_track": AggregateTrack,
  "aggregate_user": AggregateUser,
  "aggregate_user_tips": AggregateUserTips,
  "alembic_version": AlembicVersion,
  "app_name_metrics": AppNameMetrics,
  "associated_wallets": AssociatedWallets,
  "audio_transactions_history": AudioTransactionsHistory,
  "audius_data_txs": AudiusDataTxs,
  "blocks": Blocks,
  "challenge_disbursements": ChallengeDisbursements,
  "challenge_listen_streak": ChallengeListenStreak,
  "challenge_profile_completion": ChallengeProfileCompletion,
  "challenges": Challenges,
  "chat": Chat,
  "chat_ban": ChatBan,
  "chat_blocked_users": ChatBlockedUsers,
  "chat_member": ChatMember,
  "chat_message": ChatMessage,
  "chat_message_reactions": ChatMessageReactions,
  "chat_permissions": ChatPermissions,
  "cid_data": CidData,
  "dashboard_wallet_users": DashboardWalletUsers,
  "delist_status_cursor": DelistStatusCursor,
  "developer_apps": DeveloperApps,
  "eth_blocks": EthBlocks,
  "follows": Follows,
  "grants": Grants,
  "hourly_play_counts": HourlyPlayCounts,
  "indexing_checkpoints": IndexingCheckpoints,
  "milestones": Milestones,
  "notification": Notification,
  "notification_seen": NotificationSeen,
  "payment_router_txs": PaymentRouterTxs,
  "pg_stat_statements": PgStatStatements,
  "pg_stat_statements_info": PgStatStatementsInfo,
  "playlist_routes": PlaylistRoutes,
  "playlist_seen": PlaylistSeen,
  "playlists": Playlists,
  "plays": Plays,
  "pubkeys": Pubkeys,
  "reactions": Reactions,
  "related_artists": RelatedArtists,
  "remixes": Remixes,
  "reposts": Reposts,
  "revert_blocks": RevertBlocks,
  "reward_manager_txs": RewardManagerTxs,
  "rewards_manager_backfill_txs": RewardsManagerBackfillTxs,
  "route_metrics": RouteMetrics,
  "rpc_cursor": RpcCursor,
  "rpc_error": RpcError,
  "rpc_log": RpcLog,
  "rpclog": Rpclog,
  "saves": Saves,
  "schema_migrations": SchemaMigrations,
  "schema_version": SchemaVersion,
  "skipped_transactions": SkippedTransactions,
  "spl_token_backfill_txs": SplTokenBackfillTxs,
  "spl_token_tx": SplTokenTx,
  "stems": Stems,
  "subscriptions": Subscriptions,
  "supporter_rank_ups": SupporterRankUps,
  "track_delist_statuses": TrackDelistStatuses,
  "track_price_history": TrackPriceHistory,
  "track_routes": TrackRoutes,
  "track_trending_scores": TrackTrendingScores,
  "tracks": Tracks,
  "trending_results": TrendingResults,
  "usdc_purchases": UsdcPurchases,
  "usdc_transactions_history": UsdcTransactionsHistory,
  "usdc_user_bank_accounts": UsdcUserBankAccounts,
  "user_balance_changes": UserBalanceChanges,
  "user_balances": UserBalances,
  "user_bank_accounts": UserBankAccounts,
  "user_bank_backfill_txs": UserBankBackfillTxs,
  "user_bank_txs": UserBankTxs,
  "user_challenges": UserChallenges,
  "user_delist_statuses": UserDelistStatuses,
  "user_events": UserEvents,
  "user_listening_history": UserListeningHistory,
  "user_pubkeys": UserPubkeys,
  "user_tips": UserTips,
  "users": Users,
};

export type SequelizeMeta = {
  name: string;
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
  personal_count: number | null;
};

export type AggregateDailyUniqueUsersMetrics = {
  id: number;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
  summed_count: number | null;
  personal_count: number | null;
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
  personal_count: number | null;
};

export type AggregateMonthlyUniqueUsersMetrics = {
  id: number;
  count: number;
  timestamp: Date;
  created_at: Date;
  updated_at: Date;
  summed_count: number | null;
  personal_count: number | null;
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
  dominant_genre: string | null;
  dominant_genre_count: number;
};

export type AggregateUserTips = {
  sender_user_id: number;
  receiver_user_id: number;
  amount: string;
};

export type AlembicVersion = {
  version_num: string;
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
  created_at: Date | null;
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
  weekly_pool: number | null;
  cooldown_days: number | null;
};

export type Chat = {
  chat_id: string;
  created_at: Date;
  last_message_at: Date;
  last_message: string | null;
};

export type ChatBan = {
  user_id: number;
  is_banned: boolean;
  updated_at: Date;
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
  created_at: Date;
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
  updated_at: Date;
};

export type CidData = {
  cid: string;
  type: string | null;
  data: unknown | null;
};

export type DashboardWalletUsers = {
  wallet: string;
  user_id: number;
  is_delete: boolean;
  updated_at: Date;
  created_at: Date;
  blockhash: string | null;
  blocknumber: number | null;
  txhash: string;
};

export type DelistStatusCursor = {
  host: string;
  entity: DelistEntity;
  created_at: Date;
};

export type DeveloperApps = {
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
  description: string | null;
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

export type Grants = {
  blockhash: string | null;
  blocknumber: number | null;
  grantee_address: string;
  user_id: number;
  is_revoked: boolean;
  is_current: boolean;
  is_approved: boolean;
  updated_at: Date;
  created_at: Date;
  txhash: string;
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

export type PaymentRouterTxs = {
  signature: string;
  slot: number;
  created_at: Date;
};

export type PgStatStatements = {
  userid: unknown | null;
  dbid: unknown | null;
  toplevel: boolean | null;
  queryid: string | null;
  query: string | null;
  plans: string | null;
  total_plan_time: number | null;
  min_plan_time: number | null;
  max_plan_time: number | null;
  mean_plan_time: number | null;
  stddev_plan_time: number | null;
  calls: string | null;
  total_exec_time: number | null;
  min_exec_time: number | null;
  max_exec_time: number | null;
  mean_exec_time: number | null;
  stddev_exec_time: number | null;
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
  temp_blk_read_time: number | null;
  temp_blk_write_time: number | null;
  wal_records: string | null;
  wal_fpi: string | null;
  wal_bytes: string | null;
  jit_functions: string | null;
  jit_generation_time: number | null;
  jit_inlining_count: string | null;
  jit_inlining_time: number | null;
  jit_optimization_count: string | null;
  jit_optimization_time: number | null;
  jit_emission_count: string | null;
  jit_emission_time: number | null;
};

export type PgStatStatementsInfo = {
  dealloc: string | null;
  stats_reset: Date | null;
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

export type PlaylistSeen = {
  user_id: number;
  playlist_id: number;
  seen_at: Date;
  is_current: boolean;
  blocknumber: number | null;
  blockhash: string | null;
  txhash: string | null;
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
  is_image_autogenerated: boolean;
  ddex_app: string | null;
  ddex_release_ids: unknown | null;
  artists: unknown | null;
  copyright_line: unknown | null;
  producer_copyright_line: unknown | null;
  parental_warning_type: string | null;
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

export type RevertBlocks = {
  blocknumber: number;
  prev_records: unknown;
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

export type RpcError = {
  sig: string;
  rpc_log_json: unknown;
  error_text: string;
  error_count: number;
  last_attempt: Date;
};

export type RpcLog = {
  relayed_at: Date;
  from_wallet: string;
  rpc: unknown;
  sig: string;
  relayed_by: string;
  applied_at: Date;
};

export type Rpclog = {
  cuid: string;
  wallet: string | null;
  method: string | null;
  params: unknown | null;
  jetstream_seq: number | null;
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

export type SchemaVersion = {
  file_name: string;
  md5: string | null;
  applied_at: Date;
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

export type TrackDelistStatuses = {
  created_at: Date;
  track_id: number;
  owner_id: number;
  track_cid: string;
  delisted: boolean;
  reason: DelistTrackReason;
};

export type TrackPriceHistory = {
  track_id: number;
  splits: unknown;
  total_price_cents: string;
  blocknumber: number;
  block_timestamp: Date;
  created_at: Date;
  access: UsdcPurchaseAccessType;
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

export type TrackTrendingScores = {
  track_id: number;
  type: string;
  genre: string | null;
  version: string;
  time_range: string;
  score: number;
  created_at: Date;
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
  file_type: string | null;
  metadata_multihash: string | null;
  blocknumber: number | null;
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
  preview_cid: string | null;
  audio_upload_id: string | null;
  preview_start_seconds: number | null;
  release_date: Date | null;
  track_segments: unknown[];
  is_scheduled_release: boolean;
  is_downloadable: boolean;
  is_download_gated: boolean;
  download_conditions: unknown | null;
  is_original_available: boolean;
  playlists_containing_track: number[] | null;
  orig_file_cid: string | null;
  orig_filename: string | null;
  ddex_app: string | null;
  ddex_release_ids: unknown | null;
  artists: unknown | null;
  resource_contributors: unknown | null;
  indirect_resource_contributors: unknown | null;
  rights_controller: unknown | null;
  copyright_line: unknown | null;
  producer_copyright_line: unknown | null;
  parental_warning_type: string | null;
};

export type TrendingResults = {
  user_id: number;
  id: string | null;
  rank: number;
  type: string;
  version: string;
  week: Date;
};

export type UsdcPurchases = {
  slot: number;
  signature: string;
  buyer_user_id: number;
  seller_user_id: number;
  amount: string;
  content_type: UsdcPurchaseContentType;
  content_id: number;
  created_at: Date;
  updated_at: Date;
  extra_amount: string;
  access: UsdcPurchaseAccessType;
};

export type UsdcTransactionsHistory = {
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

export type UsdcUserBankAccounts = {
  signature: string;
  ethereum_address: string;
  created_at: Date;
  bank_account: string;
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
  amount: number;
  created_at: Date;
};

export type UserDelistStatuses = {
  created_at: Date;
  user_id: number;
  delisted: boolean;
  reason: DelistUserReason;
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

export type UserTips = {
  slot: number;
  signature: string;
  sender_user_id: number;
  receiver_user_id: number;
  amount: string;
  created_at: Date;
  updated_at: Date;
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


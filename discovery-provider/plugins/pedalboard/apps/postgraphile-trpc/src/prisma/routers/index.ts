import { t } from "./helpers/createRouter";
import { sequelizemetasRouter } from "./SequelizeMeta.router";
import { aggregate_daily_app_name_metricsRouter } from "./aggregate_daily_app_name_metrics.router";
import { aggregate_daily_total_users_metricsRouter } from "./aggregate_daily_total_users_metrics.router";
import { aggregate_daily_unique_users_metricsRouter } from "./aggregate_daily_unique_users_metrics.router";
import { aggregate_monthly_app_name_metricsRouter } from "./aggregate_monthly_app_name_metrics.router";
import { aggregate_monthly_playsRouter } from "./aggregate_monthly_plays.router";
import { aggregate_monthly_total_users_metricsRouter } from "./aggregate_monthly_total_users_metrics.router";
import { aggregate_monthly_unique_users_metricsRouter } from "./aggregate_monthly_unique_users_metrics.router";
import { aggregate_playlistsRouter } from "./aggregate_playlist.router";
import { aggregate_playsRouter } from "./aggregate_plays.router";
import { aggregate_tracksRouter } from "./aggregate_track.router";
import { aggregate_usersRouter } from "./aggregate_user.router";
import { aggregate_user_tipsRouter } from "./aggregate_user_tips.router";
import { alembic_versionsRouter } from "./alembic_version.router";
import { app_name_metricsRouter } from "./app_name_metrics.router";
import { associated_walletsRouter } from "./associated_wallets.router";
import { audio_transactions_historiesRouter } from "./audio_transactions_history.router";
import { audius_data_txsRouter } from "./audius_data_txs.router";
import { blocksRouter } from "./blocks.router";
import { challenge_disbursementsRouter } from "./challenge_disbursements.router";
import { challenge_listen_streaksRouter } from "./challenge_listen_streak.router";
import { challenge_profile_completionsRouter } from "./challenge_profile_completion.router";
import { challengesRouter } from "./challenges.router";
import { chatsRouter } from "./chat.router";
import { chat_bansRouter } from "./chat_ban.router";
import { chat_blocked_usersRouter } from "./chat_blocked_users.router";
import { chat_membersRouter } from "./chat_member.router";
import { chat_messagesRouter } from "./chat_message.router";
import { chat_message_reactionsRouter } from "./chat_message_reactions.router";
import { chat_permissionsRouter } from "./chat_permissions.router";
import { cid_dataRouter } from "./cid_data.router";
import { delist_status_cursorsRouter } from "./delist_status_cursor.router";
import { developer_appsRouter } from "./developer_apps.router";
import { eth_blocksRouter } from "./eth_blocks.router";
import { followsRouter } from "./follows.router";
import { grantsRouter } from "./grants.router";
import { hourly_play_countsRouter } from "./hourly_play_counts.router";
import { indexing_checkpointsRouter } from "./indexing_checkpoints.router";
import { milestonesRouter } from "./milestones.router";
import { notificationsRouter } from "./notification.router";
import { notification_seensRouter } from "./notification_seen.router";
import { playlist_routesRouter } from "./playlist_routes.router";
import { playlist_seensRouter } from "./playlist_seen.router";
import { playlistsRouter } from "./playlists.router";
import { playsRouter } from "./plays.router";
import { pubkeysRouter } from "./pubkeys.router";
import { reactionsRouter } from "./reactions.router";
import { related_artistsRouter } from "./related_artists.router";
import { remixesRouter } from "./remixes.router";
import { repostsRouter } from "./reposts.router";
import { reward_manager_txsRouter } from "./reward_manager_txs.router";
import { rewards_manager_backfill_txsRouter } from "./rewards_manager_backfill_txs.router";
import { route_metricsRouter } from "./route_metrics.router";
import { rpc_cursorsRouter } from "./rpc_cursor.router";
import { rpc_logsRouter } from "./rpc_log.router";
import { rpclogsRouter } from "./rpclog.router";
import { savesRouter } from "./saves.router";
import { schema_migrationsRouter } from "./schema_migrations.router";
import { schema_versionsRouter } from "./schema_version.router";
import { skipped_transactionsRouter } from "./skipped_transactions.router";
import { spl_token_backfill_txsRouter } from "./spl_token_backfill_txs.router";
import { spl_token_txesRouter } from "./spl_token_tx.router";
import { stemsRouter } from "./stems.router";
import { subscriptionsRouter } from "./subscriptions.router";
import { supporter_rank_upsRouter } from "./supporter_rank_ups.router";
import { track_delist_statusesRouter } from "./track_delist_statuses.router";
import { track_routesRouter } from "./track_routes.router";
import { track_trending_scoresRouter } from "./track_trending_scores.router";
import { tracksRouter } from "./tracks.router";
import { trending_resultsRouter } from "./trending_results.router";
import { ursm_content_nodesRouter } from "./ursm_content_nodes.router";
import { user_balance_changesRouter } from "./user_balance_changes.router";
import { user_balancesRouter } from "./user_balances.router";
import { user_bank_accountsRouter } from "./user_bank_accounts.router";
import { user_bank_backfill_txsRouter } from "./user_bank_backfill_txs.router";
import { user_bank_txsRouter } from "./user_bank_txs.router";
import { user_challengesRouter } from "./user_challenges.router";
import { user_delist_statusesRouter } from "./user_delist_statuses.router";
import { user_eventsRouter } from "./user_events.router";
import { user_listening_historiesRouter } from "./user_listening_history.router";
import { user_pubkeysRouter } from "./user_pubkeys.router";
import { user_tipsRouter } from "./user_tips.router";
import { usersRouter } from "./users.router";

export const appRouter = t.router({
  sequelizemeta: sequelizemetasRouter,
  aggregate_daily_app_name_metrics: aggregate_daily_app_name_metricsRouter,
  aggregate_daily_total_users_metrics: aggregate_daily_total_users_metricsRouter,
  aggregate_daily_unique_users_metrics: aggregate_daily_unique_users_metricsRouter,
  aggregate_monthly_app_name_metrics: aggregate_monthly_app_name_metricsRouter,
  aggregate_monthly_plays: aggregate_monthly_playsRouter,
  aggregate_monthly_total_users_metrics: aggregate_monthly_total_users_metricsRouter,
  aggregate_monthly_unique_users_metrics: aggregate_monthly_unique_users_metricsRouter,
  aggregate_playlist: aggregate_playlistsRouter,
  aggregate_plays: aggregate_playsRouter,
  aggregate_track: aggregate_tracksRouter,
  aggregate_user: aggregate_usersRouter,
  aggregate_user_tips: aggregate_user_tipsRouter,
  alembic_version: alembic_versionsRouter,
  app_name_metrics: app_name_metricsRouter,
  associated_wallets: associated_walletsRouter,
  audio_transactions_history: audio_transactions_historiesRouter,
  audius_data_txs: audius_data_txsRouter,
  blocks: blocksRouter,
  challenge_disbursements: challenge_disbursementsRouter,
  challenge_listen_streak: challenge_listen_streaksRouter,
  challenge_profile_completion: challenge_profile_completionsRouter,
  challenges: challengesRouter,
  chat: chatsRouter,
  chat_ban: chat_bansRouter,
  chat_blocked_users: chat_blocked_usersRouter,
  chat_member: chat_membersRouter,
  chat_message: chat_messagesRouter,
  chat_message_reactions: chat_message_reactionsRouter,
  chat_permissions: chat_permissionsRouter,
  cid_data: cid_dataRouter,
  delist_status_cursor: delist_status_cursorsRouter,
  developer_apps: developer_appsRouter,
  eth_blocks: eth_blocksRouter,
  follows: followsRouter,
  grants: grantsRouter,
  hourly_play_counts: hourly_play_countsRouter,
  indexing_checkpoints: indexing_checkpointsRouter,
  milestones: milestonesRouter,
  notification: notificationsRouter,
  notification_seen: notification_seensRouter,
  playlist_routes: playlist_routesRouter,
  playlist_seen: playlist_seensRouter,
  playlists: playlistsRouter,
  plays: playsRouter,
  pubkeys: pubkeysRouter,
  reactions: reactionsRouter,
  related_artists: related_artistsRouter,
  remixes: remixesRouter,
  reposts: repostsRouter,
  reward_manager_txs: reward_manager_txsRouter,
  rewards_manager_backfill_txs: rewards_manager_backfill_txsRouter,
  route_metrics: route_metricsRouter,
  rpc_cursor: rpc_cursorsRouter,
  rpc_log: rpc_logsRouter,
  rpclog: rpclogsRouter,
  saves: savesRouter,
  schema_migrations: schema_migrationsRouter,
  schema_version: schema_versionsRouter,
  skipped_transactions: skipped_transactionsRouter,
  spl_token_backfill_txs: spl_token_backfill_txsRouter,
  spl_token_tx: spl_token_txesRouter,
  stems: stemsRouter,
  subscriptions: subscriptionsRouter,
  supporter_rank_ups: supporter_rank_upsRouter,
  track_delist_statuses: track_delist_statusesRouter,
  track_routes: track_routesRouter,
  track_trending_scores: track_trending_scoresRouter,
  tracks: tracksRouter,
  trending_results: trending_resultsRouter,
  ursm_content_nodes: ursm_content_nodesRouter,
  user_balance_changes: user_balance_changesRouter,
  user_balances: user_balancesRouter,
  user_bank_accounts: user_bank_accountsRouter,
  user_bank_backfill_txs: user_bank_backfill_txsRouter,
  user_bank_txs: user_bank_txsRouter,
  user_challenges: user_challengesRouter,
  user_delist_statuses: user_delist_statusesRouter,
  user_events: user_eventsRouter,
  user_listening_history: user_listening_historiesRouter,
  user_pubkeys: user_pubkeysRouter,
  user_tips: user_tipsRouter,
  users: usersRouter
})


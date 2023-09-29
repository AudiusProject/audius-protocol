create or replace function clear_user_records(user_ids integer[])
returns void as $$
begin

  delete from "user_bank_accounts" where "ethereum_address" in (select "wallet" from "users" where "user_id" = any(user_ids));
  delete from "usdc_user_bank_accounts" where "ethereum_address" in (select "wallet" from "users" where "user_id" = any(user_ids));

  delete from "users" where "user_id" = any(user_ids);
  delete from "aggregate_user" where "user_id" = any(user_ids);
  delete from "aggregate_user_tips" where "sender_user_id" = any(user_ids);
  delete from "aggregate_user_tips" where "receiver_user_id" = any(user_ids);
  delete from "user_tips" where "sender_user_id" = any(user_ids);
  delete from "user_tips" where "receiver_user_id" = any(user_ids);
  delete from "user_challenges" where "user_id" = any(user_ids);
  delete from "follows" where "follower_user_id" = any(user_ids);
  delete from "follows" where "followee_user_id" = any(user_ids);
  delete from "user_pubkeys" where "user_id" = any(user_ids);
  delete from "user_events" where "user_id" = any(user_ids);
  delete from "saves" where "user_id" = any(user_ids);
  delete from "challenge_disbursements" where "user_id" = any(user_ids);
  delete from "challenge_profile_completion" where "user_id" = any(user_ids);
  delete from "subscriptions" where "subscriber_id" = any(user_ids);
  delete from "associated_wallets" where "user_id" = any(user_ids);
  delete from "plays" where "user_id" = any(user_ids);
  delete from "related_artists" where "user_id" = any(user_ids);
  delete from "trending_results" where "user_id" = any(user_ids);
  delete from "supporter_rank_ups" where "sender_user_id" = any(user_ids);
  delete from "supporter_rank_ups" where "receiver_user_id" = any(user_ids);
  delete from "user_balance_changes" where "user_id" = any(user_ids);
  delete from "user_listening_history" where "user_id" = any(user_ids);
  delete from "challenge_listen_streak" where "user_id" = any(user_ids);
  delete from "user_balances" where "user_id" = any(user_ids);
  delete from "chat_permissions" where "user_id" = any(user_ids);
  delete from "chat_message_reactions" where "user_id" = any(user_ids);
  delete from "playlist_seen" where "user_id" = any(user_ids);
  delete from "chat_ban" where "user_id" = any(user_ids);
  delete from "chat_blocked_users" where "blocker_user_id" = any(user_ids);
  delete from "chat_blocked_users" where "blockee_user_id" = any(user_ids);
  delete from "chat_member" where "user_id" = any(user_ids);
  delete from "chat_message" where "user_id" = any(user_ids);
  delete from "user_delist_statuses" where "user_id" = any(user_ids);
  delete from "grants" where "user_id" = any(user_ids);
  delete from "notification_seen" where "user_id" = any(user_ids);
  delete from "developer_apps" where "user_id" = any(user_ids);
  delete from "reposts" where "user_id" = any(user_ids);
  delete from "playlists" where "playlist_owner_id" = any(user_ids);
  delete from "playlist_routes" where "owner_id" = any(user_ids);
  delete from "track_delist_statuses" where "owner_id" = any(user_ids);
  delete from "track_routes" where "owner_id" = any(user_ids);
  delete from "tracks" where "owner_id" = any(user_ids);
  delete from "usdc_purchases" where "buyer_user_id" = any(user_ids);
  delete from "usdc_purchases" where "seller_user_id" = any(user_ids);

end;
$$ language plpgsql;
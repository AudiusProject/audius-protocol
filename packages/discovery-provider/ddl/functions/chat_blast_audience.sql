CREATE OR REPLACE FUNCTION chat_blast_audience(blast_id_param TEXT) RETURNS TABLE (
    blast_id TEXT,
    to_user_id INT
) AS $$
BEGIN

  RETURN QUERY
  -- follower_audience
  SELECT chat_blast.blast_id, follower_user_id AS to_user_id
  FROM follows
  JOIN chat_blast ON chat_blast.blast_id = blast_id_param
    AND chat_blast.audience = 'follower_audience'
    AND follows.followee_user_id = chat_blast.from_user_id
    AND follows.is_delete = false
    AND follows.created_at < chat_blast.created_at

  UNION

  -- tipper_audience
  SELECT chat_blast.blast_id, sender_user_id AS to_user_id
  FROM user_tips tip
  JOIN chat_blast ON chat_blast.blast_id = blast_id_param
    AND chat_blast.audience = 'tipper_audience'
    AND receiver_user_id = chat_blast.from_user_id
    AND tip.created_at < chat_blast.created_at

  UNION

  -- remixer_audience
  SELECT chat_blast.blast_id, t.owner_id AS to_user_id
  FROM tracks t
  JOIN remixes ON remixes.child_track_id = t.track_id
  JOIN tracks og ON remixes.parent_track_id = og.track_id
  JOIN chat_blast ON chat_blast.blast_id = blast_id_param
    AND chat_blast.audience = 'remixer_audience'
    AND og.owner_id = chat_blast.from_user_id
    AND (
      chat_blast.audience_content_id IS NULL
      OR (
        chat_blast.audience_content_type = 'track'
        AND chat_blast.audience_content_id = og.track_id
      )
    )

  UNION

  -- customer_audience
  SELECT chat_blast.blast_id, buyer_user_id AS to_user_id
  FROM usdc_purchases p
  JOIN chat_blast ON chat_blast.blast_id = blast_id_param
    AND chat_blast.audience = 'customer_audience'
    AND p.seller_user_id = chat_blast.from_user_id
    AND (
      chat_blast.audience_content_id IS NULL
      OR (
        chat_blast.audience_content_type = p.content_type::text
        AND chat_blast.audience_content_id = p.content_id
      )
    )

  UNION

  -- coin_holder_audience
  SELECT chat_blast.blast_id, u.user_id AS to_user_id
  FROM chat_blast
  JOIN artist_coins ac ON chat_blast.blast_id = blast_id_param
    AND chat_blast.audience = 'coin_holder_audience'
    AND ac.user_id = chat_blast.from_user_id
  JOIN sol_claimable_accounts sca ON sca.mint = ac.mint
  JOIN users u ON u.wallet = sca.ethereum_address
  JOIN (
    SELECT DISTINCT account, mint
    FROM (
      SELECT account, mint, balance,
             ROW_NUMBER() OVER (PARTITION BY account, mint ORDER BY stbc.created_at DESC) as rn
      FROM sol_token_account_balance_changes stbc
      JOIN chat_blast cb ON cb.blast_id = blast_id_param
        AND stbc.created_at < cb.created_at
    ) ranked
    WHERE rn = 1 AND balance > 0
  ) latest_balances ON latest_balances.account = sca.account
    AND latest_balances.mint = ac.mint;

END;
$$ LANGUAGE plpgsql;

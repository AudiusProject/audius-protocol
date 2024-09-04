-- Recreates the extended purchase splits from the information in the purchases table
-- Required to populate purchase details modal
BEGIN;

ALTER TABLE
    usdc_purchases
ADD
    COLUMN IF NOT EXISTS splits JSONB;

WITH relevant_timestamps AS (
    SELECT
        user_id,
        MAX(block_timestamp) AS block_timestamp,
        signature
    FROM
        user_payout_wallet_history
        JOIN usdc_purchases ON seller_user_id = user_id
    WHERE
        block_timestamp < usdc_purchases.created_at
    GROUP BY
        user_id,
        signature
)
UPDATE
    usdc_purchases
SET
    splits = jsonb_build_array(
        jsonb_build_object(
            'user_id',
            usdc_purchases.seller_user_id,
            'amount',
            usdc_purchases.amount,
            'percentage',
            100.0,
            'eth_wallet',
            users.wallet,
            'payout_wallet',
            COALESCE(
                user_payout_wallet_history.spl_usdc_payout_wallet,
                usdc_user_bank_accounts.bank_account
            )
        )
    )
FROM
    usdc_purchases AS up
    JOIN users ON users.user_id = up.seller_user_id
    LEFT JOIN usdc_user_bank_accounts ON users.wallet = usdc_user_bank_accounts.ethereum_address
    LEFT JOIN relevant_timestamps ON relevant_timestamps.user_id = users.user_id
    AND relevant_timestamps.signature = up.signature
    LEFT JOIN user_payout_wallet_history ON user_payout_wallet_history.user_id = users.user_id
    AND user_payout_wallet_history.block_timestamp = relevant_timestamps.block_timestamp
WHERE
    up.splits IS NULL
    AND up.signature = usdc_purchases.signature;

ALTER TABLE
    usdc_purchases
ALTER COLUMN
    splits
SET
    NOT NULL;

COMMIT;
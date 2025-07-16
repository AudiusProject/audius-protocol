/* 

Adds tables for the Solana indexer in order to support artist coins.

Unlike previous iterations of Solana indexing, all the information needed to populate
these tables must come from the transactions themselves, not from any related information
from the Open Audio Protocol or any other source. This prevents the indexer from becoming
stuck and falling behind.

 */

BEGIN;

CREATE TABLE IF NOT EXISTS artist_coins (
    mint VARCHAR NOT NULL PRIMARY KEY,
    ticker VARCHAR NOT NULL,
    user_id INT NOT NULL,
    decimals INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE artist_coins IS 'Stores the token mints for artist coins that the indexer is tracking and their tickers.';
CREATE INDEX IF NOT EXISTS artist_coins_ticker_idx ON artist_coins (ticker, user_id);
COMMENT ON INDEX artist_coins_ticker_idx IS 'Used for getting mint address by ticker.';
CREATE INDEX IF NOT EXISTS artist_coins_user_id_idx ON artist_coins (user_id);
COMMENT ON INDEX artist_coins_user_id_idx IS 'Used for getting coins minted by a particular artist.';


CREATE TABLE IF NOT EXISTS sol_slot_checkpoint (
    id INT PRIMARY KEY DEFAULT 1,
    slot BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE sol_slot_checkpoint IS 'Stores the most recent slot that the indexer has received.';


CREATE TABLE IF NOT EXISTS sol_token_account_balance_changes (
    signature VARCHAR NOT NULL,
    mint VARCHAR NOT NULL,
    account VARCHAR NOT NULL,
    change BIGINT NOT NULL,
    balance BIGINT NOT NULL,
    slot BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    block_timestamp TIMESTAMP NOT NULL,

    PRIMARY KEY (signature, mint, account)
);
COMMENT ON TABLE sol_token_account_balance_changes IS 'Stores token balance changes for all accounts of tracked mints.';
CREATE INDEX IF NOT EXISTS sol_token_account_balance_changes_mint_idx ON sol_token_account_balance_changes (mint, slot);
COMMENT ON INDEX sol_token_account_balance_changes_mint_idx IS 'Used for getting recent transactions by mint.';
CREATE INDEX IF NOT EXISTS sol_token_account_balance_changes_account_idx ON sol_token_account_balance_changes (account, slot);
COMMENT ON INDEX sol_token_account_balance_changes_account_idx IS 'Used for getting recent transactions by account.';


CREATE TABLE IF NOT EXISTS sol_claimable_accounts (
	signature VARCHAR NOT NULL,
	instruction_index INT NOT NULL,
	slot BIGINT NOT NULL,
	
	mint VARCHAR NOT NULL,
	ethereum_address VARCHAR NOT NULL,
	account VARCHAR NOT NULL,
	
	PRIMARY KEY (signature, instruction_index)
);
COMMENT ON TABLE sol_claimable_accounts IS 'Stores claimable tokens program Create instructions for tracked mints.';
CREATE INDEX IF NOT EXISTS sol_claimable_accounts_ethereum_address_idx ON sol_claimable_accounts (ethereum_address, mint);
COMMENT ON INDEX sol_claimable_accounts_ethereum_address_idx IS 'Used for getting account by user wallet and mint.';
CREATE INDEX IF NOT EXISTS sol_claimable_accounts_account_idx ON sol_claimable_accounts (account);
COMMENT ON INDEX sol_claimable_accounts_account_idx IS 'Used for getting user wallet by account.';


CREATE TABLE IF NOT EXISTS sol_claimable_account_transfers (
	signature VARCHAR NOT NULL,
	instruction_index INT NOT NULL,
	amount BIGINT NOT NULL,
	slot BIGINT NOT NULL,
	
	from_account VARCHAR NOT NULL,
	to_account VARCHAR NOT NULL,
	sender_eth_address VARCHAR NOT NULL,
	
	PRIMARY KEY (signature, instruction_index)
);
COMMENT ON TABLE sol_claimable_account_transfers IS 'Stores claimable tokens program Transfer instructions for tracked mints.';
CREATE INDEX IF NOT EXISTS sol_claimable_account_transfers_from_idx ON sol_claimable_account_transfers (from_account);
COMMENT ON INDEX sol_claimable_account_transfers_from_idx IS 'Used for getting transfers by recipient.';
CREATE INDEX IF NOT EXISTS sol_claimable_account_transfers_to_idx ON sol_claimable_account_transfers (to_account);
COMMENT ON INDEX sol_claimable_account_transfers_to_idx IS 'Used for getting transfers by sender.';
CREATE INDEX IF NOT EXISTS sol_claimable_account_transfers_sender_eth_address_idx ON sol_claimable_account_transfers (sender_eth_address);
COMMENT ON INDEX sol_claimable_account_transfers_sender_eth_address_idx IS 'Used for getting transfers by sender user wallet.';


CREATE TABLE IF NOT EXISTS sol_reward_disbursements (
	signature VARCHAR NOT NULL,
	instruction_index INT NOT NULL,
	amount BIGINT NOT NULL,
	slot BIGINT NOT NULL,
	
	user_bank VARCHAR NOT NULL,
	challenge_id VARCHAR NOT NULL,
	specifier VARCHAR NOT NULL,
	
	PRIMARY KEY (signature, instruction_index)
);
COMMENT ON TABLE sol_reward_disbursements IS 'Stores reward manager program Evaluate instructions for tracked mints.';
CREATE INDEX IF NOT EXISTS sol_reward_disbursements_user_bank_idx ON sol_reward_disbursements (user_bank);
COMMENT ON INDEX sol_reward_disbursements_user_bank_idx IS 'Used for getting reward disbursements for a user.';
CREATE INDEX IF NOT EXISTS sol_reward_disbursements_challenge_idx ON sol_reward_disbursements (challenge_id, specifier);
COMMENT ON INDEX sol_reward_disbursements_challenge_idx IS 'Used for getting reward disbursements for a specific challenge type or claim.';


CREATE TABLE IF NOT EXISTS sol_payments (
	signature VARCHAR NOT NULL,
	instruction_index INT NOT NULL,
	amount BIGINT NOT NULL,
	slot BIGINT NOT NULL,
	
	route_index INT NOT NULL,
	to_account VARCHAR NOT NULL,
	
	
	PRIMARY KEY (signature, instruction_index, route_index)
);
COMMENT ON TABLE sol_payments IS 'Stores payment router program Route instruction recipients and amounts for tracked mints.';
CREATE INDEX IF NOT EXISTS sol_payments_to_account ON sol_payments (to_account);
COMMENT ON INDEX sol_payments_to_account IS 'Used for getting payments to a particular user.';


CREATE TABLE IF NOT EXISTS sol_purchases (
	signature VARCHAR NOT NULL,
	instruction_index INT NOT NULL,
	amount BIGINT NOT NULL,
	slot BIGINT NOT NULL,
	
	from_account VARCHAR NOT NULL,

	content_type VARCHAR NOT NULL,
	content_id INT NOT NULL,
	buyer_user_id INT NOT NULL,
	access_type VARCHAR NOT NULL,
	valid_after_blocknumber BIGINT NOT NULL,
	is_valid BOOLEAN,
	
	city VARCHAR,
	region VARCHAR,
	country VARCHAR,
	
	PRIMARY KEY (signature, instruction_index)
);
COMMENT ON TABLE sol_purchases IS 'Stores payment router program Route instructions that are paired with purchase information for tracked mints.';
COMMENT ON COLUMN sol_purchases.valid_after_blocknumber IS 'Purchase transactions include the blocknumber that the content was most recently updated in order to ensure that the relevant pricing information has been indexed before evaluating whether the purchase is valid.';
COMMENT ON COLUMN sol_purchases.is_valid IS 'A purchase is valid if it meets the pricing information set by the artist. If the pricing information is not available yet (as indicated by the valid_after_blocknumber), then is_valid will be NULL which indicates a "pending" state.';
CREATE INDEX IF NOT EXISTS sol_purchases_from_account_idx ON sol_purchases (from_account, is_valid);
COMMENT ON INDEX sol_purchases_from_account_idx IS 'Used for getting purchases by a user via their account.';
CREATE INDEX IF NOT EXISTS sol_purchases_buyer_user_id_idx ON sol_purchases (buyer_user_id, is_valid);
COMMENT ON INDEX sol_purchases_buyer_user_id_idx IS 'Used for getting purchases by a user.';
CREATE INDEX IF NOT EXISTS sol_purchases_content_idx ON sol_purchases (content_id, content_type, access_type, is_valid);
COMMENT ON INDEX sol_purchases_content_idx IS 'Used for getting sales of particular content.';
CREATE INDEX IF NOT EXISTS sol_purchases_valid_idx ON sol_purchases (is_valid, valid_after_blocknumber);
COMMENT ON INDEX sol_purchases_valid_idx IS 'Used for updating purchases to be valid after the specified blocknumber is reached.';


CREATE TABLE IF NOT EXISTS sol_swaps (
	signature VARCHAR NOT NULL,
	instruction_index INT NOT NULL,
	slot BIGINT NOT NULL,
	
	from_mint VARCHAR NOT NULL,
	from_account VARCHAR NOT NULL,
	from_amount BIGINT NOT NULL,
	
	to_mint VARCHAR NOT NULL,
	to_account VARCHAR NOT NULL,
	to_amount BIGINT NOT NULL,
	
	PRIMARY KEY (signature, instruction_index)
);
COMMENT ON TABLE sol_swaps IS 'Stores eg. Jupiter swaps for tracked mints.';
CREATE INDEX IF NOT EXISTS sol_swaps_from_mint_idx ON sol_swaps (from_mint);
CREATE INDEX IF NOT EXISTS sol_swaps_from_account_idx ON sol_swaps (from_account);
CREATE INDEX IF NOT EXISTS sol_swaps_to_mint_idx ON sol_swaps (to_mint);
CREATE INDEX IF NOT EXISTS sol_swaps_to_account_idx ON sol_swaps (to_account);


CREATE TABLE IF NOT EXISTS sol_token_transfers (
	signature VARCHAR NOT NULL,
	instruction_index INT NOT NULL,
	amount BIGINT NOT NULL,
	slot BIGINT NOT NULL,
	
	from_account VARCHAR NOT NULL,
	to_account VARCHAR NOT NULL,
	
	PRIMARY KEY (signature, instruction_index)
);
COMMENT ON TABLE sol_token_transfers IS 'Stores SPL token transfers for tracked mints.';
CREATE INDEX IF NOT EXISTS sol_token_transfers_from_account_idx ON sol_token_transfers (from_account);
CREATE INDEX IF NOT EXISTS sol_token_transfers_to_account_idx ON sol_token_transfers (to_account);

COMMIT;
CREATE TABLE IF NOT EXISTS crowdfund_contributions (
  ethereum_address VARCHAR NOT NULL,
  content_id INTEGER NOT NULL,
  content_type INTEGER NOT NULL,
  amount BIGINT NOT NULL,
  PRIMARY KEY (content_id, content_type, ethereum_address)
);
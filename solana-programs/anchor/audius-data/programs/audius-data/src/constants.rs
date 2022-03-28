/// SECP Offset Struct constants
pub const ETH_ADDRESS_OFFSET: usize = 12;
pub const MESSAGE_OFFSET: usize = 97;

/// Size of admin account
pub const ADMIN_ACCOUNT_SIZE: usize = 8 + // anchor prefix
32 + // authority: Pubkey
32 + // verifier: Pubkey
1; // is_write_enabled: bool

/// Size of user account
pub const USER_ACCOUNT_SIZE: usize = 8 + // anchor prefix
20 + // eth_address: [u8; 20]
6 + // replica set: [u16; 3]
32; // authority: Pubkey

/// Size of user authority delegation account
pub const USER_AUTHORITY_DELEGATE_ACCOUNT_SIZE: usize = 8 + // anchor prefix
32 + // delegate_authority: Pubkey
32; // user_storage_account: Pubkey

/// Size of user content node account
/// 8 bytes (anchor prefix) + 32 (PublicKey) + 20 (Ethereum PublicKey Bytes)
pub const CONTENT_NODE_ACCOUNT_SIZE: usize = 8 + 32 + 20;

/// Seed for content node accounts
pub const CONTENT_NODE_SEED_PREFIX: &[u8; 5] = b"sp_id";

/// Size of authority delegation account
pub const AUTHORITY_DELEGATION_STATUS_ACCOUNT_SIZE: usize = 8 + // anchor prefix
1; // is_revoked: bool

/// Seed for AuthorityDelegation PDA
pub const AUTHORITY_DELEGATION_STATUS_SEED: &[u8; 27] = b"authority-delegation-status";

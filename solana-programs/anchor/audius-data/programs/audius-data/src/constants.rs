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
32; // authority: Pubkey

/// Size of user authority delegation account
pub const USER_AUTHORITY_DELEGATE_ACCOUNT_SIZE: usize = 8 + // anchor prefix
32 + // delegate_authority: Pubkey
32; // user_storage_account: Pubkey

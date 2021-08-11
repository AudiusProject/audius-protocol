//! State types

mod reward_manager;
mod sender_account;
mod verified_messages;

pub use reward_manager::*;
pub use sender_account::*;
pub use verified_messages::*;

/// Accounts are created with data zeroed out, so uninitialized state instances
/// will have the version set to 0.
pub const UNINITIALIZED_VERSION: u8 = 0;

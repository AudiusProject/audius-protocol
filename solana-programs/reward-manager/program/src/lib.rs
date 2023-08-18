#![deny(missing_docs)]

//! Audius Reward Manager program

pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;
pub mod utils;

/// Current program version
pub const PROGRAM_VERSION: u8 = 1;

#[cfg(not(feature = "no-entrypoint"))]
pub mod entrypoint;

// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;

// stage: CDpzvz7DfgbF95jSSCHLX3ERkugyfgn9Fw8ypNZ1hfXp
// prod: DDZDcYdQFEMwcu2Mwo75yGFjJ1mUQyyXLWzhZLEVFcei
solana_program::declare_id!("DDZDcYdQFEMwcu2Mwo75yGFjJ1mUQyyXLWzhZLEVFcei");

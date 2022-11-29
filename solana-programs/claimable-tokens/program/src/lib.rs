#![deny(missing_docs)]

//! Audius claimable token Solana program

pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;
pub mod utils;

#[cfg(not(feature = "no-entrypoint"))]
pub mod entrypoint;

// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;

solana_program::declare_id!("testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9");

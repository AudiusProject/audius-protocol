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

solana_program::declare_id!("G4pFwHLdYPHCjLkhHHdw9WmqXiY7FtcFd1npNVhihz5s");

#![deny(missing_docs)]

//! A program signature service for the Audius

pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;

/// Current program version
pub const PROGRAM_VERSION: u8 = 1;

#[cfg(not(feature = "no-entrypoint"))]
pub mod entrypoint;

// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;

solana_program::declare_id!("3Cm1K6H3t9fG1pKHgCTxoSSW3nCX9VftWZGgHJAkSaQ3");

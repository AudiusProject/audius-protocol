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

// TEMP
// Export current sdk types for downstream users building with a different sdk version
pub use solana_program;

solana_program::declare_id!("5mpjDRgoRYRmSnAXZTfB2bBkbpwvRjobXUjb4WYjF225");

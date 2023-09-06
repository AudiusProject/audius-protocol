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

// stage: 2sjQNmUfkV6yKKi4dPR8gWRgtyma5aiymE3aXL2RAZww
// prod: Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ
solana_program::declare_id!("Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ");

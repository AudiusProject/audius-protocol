//! Error types

use num_derive::FromPrimitive;
use solana_program::{decode_error::DecodeError, program_error::ProgramError};
use thiserror::Error;

/// Errors that may be returned by the Audius program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum AudiusError {
    /// Invalid instruction
    #[error("Invalid instruction")]
    InvalidInstruction,
    /// Signer group already initialized
    #[error("Signer group already initialized")]
    SignerGroupAlreadyInitialized,
    /// Uninitialized signer group
    #[error("Uninitialized signer group")]
    UninitializedSignerGroup,
    /// Signer is already initialized
    #[error("Signer is already initialized")]
    SignerAlreadyInitialized,
    /// Valid signer isn't initialized
    #[error("Valid signer isn't initialized")]
    ValidSignerNotInitialized,
    /// Signer doesn't belong to this group
    #[error("Signer doesnt belong to this group")]
    WrongSignerGroup,
    /// Wrong owner
    #[error("Wrong owner")]
    WrongOwner,
    /// Signature missing
    #[error("Signature missing")]
    SignatureMissing,
    /// Signature verification failed
    #[error("Signature verification failed")]
    SignatureVerificationFailed,
    /// Secp256 instruction losing
    #[error("Secp256 instruction losing")]
    Secp256InstructionLosing,
    /// Signer group owner disabled
    #[error("Signer group owner disabled")]
    SignerGroupOwnerDisabled,
}
impl From<AudiusError> for ProgramError {
    fn from(e: AudiusError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
impl<T> DecodeError<T> for AudiusError {
    fn type_of() -> &'static str {
        "Audius Error"
    }
}

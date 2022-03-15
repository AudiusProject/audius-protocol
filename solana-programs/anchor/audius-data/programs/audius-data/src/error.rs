use anchor_lang::prelude::*;

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Signature verification failed.")]
    SignatureVerification,
    #[msg("Invalid Id.")]
    InvalidId,
}

use anchor_lang::prelude::*;

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("This authority's delegation status is revoked.")]
    RevokedAuthority,
    #[msg("The expected program derived address was not found.")]
    ProgramDerivedAddressNotFound,
    #[msg("This authority has not been delegated access to the user.")]
    InvalidUserAuthorityDelegation,
    #[msg("The given authority does not belong to the user so delegate accounts must be provided.")]
    MissingDelegateAccount,
    #[msg("Signature verification failed.")]
    SignatureVerification,
    #[msg("Invalid Id.")]
    InvalidId,
}

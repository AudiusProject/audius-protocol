use anchor_lang::prelude::{msg, ProgramError, Pubkey};

// Program
pub fn validate_user_delegate_authority(a: Pubkey) -> Result<(), ProgramError> {
    msg!("validate_user_delegate_authority {:?}", a);
    return Ok(());
}

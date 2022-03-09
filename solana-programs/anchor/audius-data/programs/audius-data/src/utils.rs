use crate::{ErrorCode, User, UserAuthorityDelegate};

use anchor_lang::{prelude::*, solana_program::system_program};

/// Validate the authority account that signed the transaction
///  is the user's authority or the user's delegate authority
pub fn validate_user_authority<'info>(
    program_id: &Pubkey,
    user: &Account<'info, User>,
    user_delegate_authority: &AccountInfo<'info>,
    authority: &Signer,
) -> Result<()> {
    if user.authority != authority.key() {
        // Reject if system program provided as user delegate_auth
        if user_delegate_authority.key() == system_program::id() {
            return Err(ErrorCode::Unauthorized.into());
        }

        // Derive a target delegation account address from the user's storage PDA and provided user authority
        // In the happy case this will match the account created in add_user_authority_delegate
        // If there is a mismatch between the provided and derived value, we reject the transaction
        let (derived_delegate_auth_acct, _) = Pubkey::find_program_address(
            &[
                &user.key().to_bytes()[..32],
                &authority.key().to_bytes()[..32],
            ],
            program_id,
        );
        // Reject if PDA derivation is mismatched
        if derived_delegate_auth_acct != user_delegate_authority.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        // Attempt to deserialize data from the derived delegate account
        let user_del_acct: UserAuthorityDelegate = UserAuthorityDelegate::try_deserialize(
            &mut &user_delegate_authority.try_borrow_data()?[..],
        )?;
        // Confirm that the delegate authority and user match the function parameters
        if user_del_acct.user_storage_account != user.key()
            || user_del_acct.delegate_authority != authority.key()
        {
            return Err(ErrorCode::Unauthorized.into());
        }
    }
    Ok(())
}

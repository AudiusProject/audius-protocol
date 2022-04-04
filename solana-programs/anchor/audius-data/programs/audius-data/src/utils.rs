use crate::{ErrorCode, User, UserAuthorityDelegate, AuthorityDelegationStatus, constants::AUTHORITY_DELEGATION_STATUS_SEED};

use anchor_lang::{prelude::*, solana_program::system_program};

/// Validate the authority account that signed the transaction
/// is the user's authority or the user's delegate authority
pub fn validate_user_authority<'info>(
    program_id: &Pubkey,
    user: &Account<'info, User>,
    user_authority_delegate: &AccountInfo<'info>,
    authority: &Signer,
    authority_delegation_status: &AccountInfo<'info>,
) -> Result<()> {
    if user.authority != authority.key() {
        // Authority must be a delegate
        // Reject if user_authority_delegate or authority_delegation_status is not provided
        if (user_authority_delegate.key() == system_program::id()) || (authority_delegation_status.key() == system_program::id()) {
            return Err(ErrorCode::MissingDelegateAccount.into());
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
        if derived_delegate_auth_acct != user_authority_delegate.key() {
            return Err(ErrorCode::ProgramDerivedAddressNotFound.into());
        }
        // Attempt to deserialize data from the derived delegate account
        let user_authority_delegate_account: UserAuthorityDelegate = UserAuthorityDelegate::try_deserialize(
            &mut &user_authority_delegate.try_borrow_data()?[..],
        )?;
        // Confirm that the delegate authority and user match the function parameters
        if user_authority_delegate_account.user_storage_account != user.key()
            || user_authority_delegate_account.delegate_authority != authority.key()
        {
            return Err(ErrorCode::InvalidUserAuthorityDelegation.into());
        }
        let (derived_authority_delegation_status_account, _) = Pubkey::find_program_address(
        &[
            AUTHORITY_DELEGATION_STATUS_SEED,
                &authority.key().to_bytes()[..32],
            ],
            program_id,
        );

        // Reject if PDA derivation is mismatched
        if derived_authority_delegation_status_account != authority_delegation_status.key() {
            return Err(ErrorCode::ProgramDerivedAddressNotFound.into());
        }

        let authority_delegation_status_account: AuthorityDelegationStatus = AuthorityDelegationStatus::try_deserialize(
            &mut &authority_delegation_status.try_borrow_data()?[..],
        )?;
        
        // Reject if app delegate is revoked
        if authority_delegation_status_account.is_revoked {
            return Err(ErrorCode::RevokedAuthority.into());
        }
    }
    Ok(())
}

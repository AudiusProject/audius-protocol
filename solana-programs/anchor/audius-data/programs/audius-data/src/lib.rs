//! The Audius Data Program is intended to bring all user data functionality to Solana through the
//! Anchor framework
pub mod constants;
pub mod error;
pub mod utils;

use crate::{constants::*, error::ErrorCode, utils::*};
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // default program ID to be replaced in start.sh

#[program]
pub mod audius_data {
    use anchor_lang::solana_program::secp256k1_program;
    use anchor_lang::solana_program::sysvar;
    use std::str::FromStr;

    /*
        User & Admin Functions
    */

    use super::*;
    /// Initialize an instance of Audius with admin keypair.
    /// The notion of admin here may be expanded to other functionality as well
    pub fn init_admin(
        ctx: Context<Initialize>,
        authority: Pubkey,
        verifier: Pubkey,
    ) -> Result<()> {
        let audius_admin = &mut ctx.accounts.admin;
        audius_admin.authority = authority;
        audius_admin.verifier = verifier;
        audius_admin.is_write_enabled = true;
        Ok(())
    }

    /// Verifies a user by asserting that the audius_admin's verifier matches the signed verifier account
    pub fn update_is_verified(
        ctx: Context<UpdateIsVerified>,
        base: Pubkey,
        _user_handle: UserHandle,
    ) -> Result<()> {
        // Validate that the audius admin verifier matches the verifier passed in
        if ctx.accounts.audius_admin.verifier != ctx.accounts.verifier.key() {
            return Err(ErrorCode::Unauthorized.into());
        }

        let admin_key: &Pubkey = &ctx.accounts.audius_admin.key();
        let (base_pda, _bump) =
            Pubkey::find_program_address(&[&admin_key.to_bytes()[..32]], ctx.program_id);

        // Confirm the base PDA matches the expected value provided the target audius admin
        if base_pda != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        Ok(())
    }

    /// Initialize a user account from the admin account.
    /// The user's account is derived from the admin base PDA + handle bytes.
    /// Populates the user account with their Ethereum address as bytes and an empty Pubkey for their Solana identity.
    /// Allows the user to later "claim" their account by submitting a signed object and setting their own identity.
    /// Important to note that the metadata object is simply logged out to be picked up by the Audius indexing layer.
    pub fn init_user(
        ctx: Context<InitializeUser>,
        base: Pubkey,
        eth_address: [u8; 20],
        handle_seed: [u8; 16],
        _user_bump: u8,
        _metadata: String,
    ) -> Result<()> {
        // Confirm that the base used for user account seed is derived from this Audius admin storage account
        let (derived_base, _) = Pubkey::find_program_address(
            &[&ctx.accounts.admin.key().to_bytes()[..32]],
            ctx.program_id,
        );

        if derived_base != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        // Confirm that the derived pda from base is the same as the user storage account
        let (derived_user_acct, _) = Pubkey::find_program_address(
            &[&derived_base.to_bytes()[..32], &handle_seed],
            ctx.program_id,
        );
        if derived_user_acct != ctx.accounts.user.key() {
            return Err(ErrorCode::Unauthorized.into());
        }

        if ctx.accounts.authority.key() != ctx.accounts.admin.authority {
            return Err(ErrorCode::Unauthorized.into());
        }

        let audius_user_acct = &mut ctx.accounts.user;
        audius_user_acct.eth_address = eth_address;

        Ok(())
    }

    /// Functionality to confirm signed object and add a Solana Pubkey to a user's account.
    /// Performs instruction introspection and expects a minimum of 2 instructions [secp, current instruction].
    pub fn init_user_sol(
        ctx: Context<InitializeUserSolIdentity>,
        user_authority: Pubkey,
    ) -> Result<()> {
        msg!("Audius::InitUserSol");
        let audius_user_acct = &mut ctx.accounts.user;
        let index_current_instruction =
            sysvar::instructions::load_current_index_checked(&ctx.accounts.sysvar_program)?;

        // Instruction must contain at least one prior
        if index_current_instruction < 1 {
            return Err(ErrorCode::SignatureVerification.into());
        }

        // Eth_address offset (12) + address (20) + signature (65) + message (32)
        let secp_data =
            sysvar::instructions::load_instruction_at_checked(0, &ctx.accounts.sysvar_program)?;

        if secp_data.program_id != secp256k1_program::id() {
            return Err(ErrorCode::Unauthorized.into());
        }
        let instruction_signer =
            secp_data.data[ETH_ADDRESS_OFFSET..ETH_ADDRESS_OFFSET + 20].to_vec();

        if instruction_signer != audius_user_acct.eth_address {
            return Err(ErrorCode::Unauthorized.into());
        }

        audius_user_acct.authority = user_authority;

        let message = secp_data.data[MESSAGE_OFFSET..].to_vec();

        if message != user_authority.to_bytes() {
            return Err(ErrorCode::Unauthorized.into());
        }

        Ok(())
    }

    /// Functionality to create user without admin privileges
    pub fn create_user(
        ctx: Context<CreateUser>,
        base: Pubkey,
        eth_address: [u8; 20],
        _handle_seed: [u8; 16],
        _user_bump: u8,
        metadata: String,
        user_authority: Pubkey,
    ) -> Result<()> {
        msg!("Audius::CreateUser");

        // Confirm that the base used for user account seed is derived from this Audius admin storage account
        let (derived_base, _) = Pubkey::find_program_address(
            &[&ctx.accounts.audius_admin.key().to_bytes()[..32]],
            ctx.program_id,
        );

        if derived_base != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        // Confirm admin is disabled
        if ctx.accounts.audius_admin.is_write_enabled {
            return Err(ErrorCode::Unauthorized.into());
        }

        // Eth_address offset (12) + address (20) + signature (65) + message (32)
        let secp_data =
            sysvar::instructions::load_instruction_at_checked(0, &ctx.accounts.sysvar_program)?;

        if secp_data.program_id != secp256k1_program::id() {
            return Err(ErrorCode::Unauthorized.into());
        }
        let instruction_signer =
            secp_data.data[ETH_ADDRESS_OFFSET..ETH_ADDRESS_OFFSET + 20].to_vec();
        if instruction_signer != eth_address {
            return Err(ErrorCode::Unauthorized.into());
        }

        let audius_user_acct = &mut ctx.accounts.user;
        audius_user_acct.eth_address = eth_address;
        audius_user_acct.authority = user_authority;

        let message = secp_data.data[MESSAGE_OFFSET..].to_vec();

        if message != user_authority.to_bytes() {
            return Err(ErrorCode::Unauthorized.into());
        }

        msg!("AudiusUserMetadata = {:?}", metadata);

        Ok(())
    }

    /// Permissioned function to log an update to User metadata
    pub fn update_user(ctx: Context<UpdateUser>, metadata: String) -> Result<()> {
        msg!("Audius::UpdateUser");
        validate_user_authority(
            ctx.program_id,
            &ctx.accounts.user,
            &ctx.accounts.user_delegate_authority,
            &ctx.accounts.user_authority,
        )?;
        msg!("AudiusUserMetadata = {:?}", metadata);
        Ok(())
    }

    /// Permissioned function to log an update to Admin metadata
    pub fn update_admin(ctx: Context<UpdateAdmin>, is_write_enabled: bool) -> Result<()> {
        if ctx.accounts.admin.authority != ctx.accounts.admin_authority.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        ctx.accounts.admin.is_write_enabled = is_write_enabled;
        Ok(())
    }

    /*
        Entity related functions
    */
    pub fn manage_entity(
        ctx: Context<ManageEntity>,
        base: Pubkey,
        _user_handle: UserHandle,
        _entity_type: EntityTypes,
        _management_action: ManagementActions,
        _id: String,
        _metadata: String,
    ) -> Result<()> {
        // Confirm the base PDA matches the expected value provided the target audius admin
        let admin_key: &Pubkey = &ctx.accounts.audius_admin.key();
        let (base_pda, _bump) =
            Pubkey::find_program_address(&[&admin_key.to_bytes()[..32]], ctx.program_id);
        if base_pda != base {
            return Err(ErrorCode::Unauthorized.into());
        }
        // Reject if update submitted with invalid user authority
        if ctx.accounts.authority.key() != ctx.accounts.user.authority {
            return Err(ErrorCode::Unauthorized.into());
        }
        Ok(())
    }

    pub fn write_entity_social_action(
        ctx: Context<WriteEntitySocialAction>,
        base: Pubkey,
        _user_handle: UserHandle,
        _entity_social_action: EntitySocialActionValues,
        _entity_type: EntityTypes,
        _id: String,
    ) -> Result<()> {
        let admin_key: &Pubkey = &ctx.accounts.audius_admin.key();
        let (base_pda, _bump) =
            Pubkey::find_program_address(&[&admin_key.to_bytes()[..32]], ctx.program_id);

        // Confirm the base PDA matches the expected value provided the target audius admin
        if base_pda != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        if ctx.accounts.authority.key() != ctx.accounts.user.authority {
            return Err(ErrorCode::Unauthorized.into());
        }
        Ok(())
    }

    /// Follow a user, transaction sent from 1 known valid user to another
    /// Both User accounts are re-derived from the handle seed and validated
    /// Only the follower must have already claimed their solana public key -
    /// in order to facilitate the scenario where an 'initialized' user follows an 'unitialized' user
    /// Note that both follow and unfollow are handled in this single function through an enum, with identical
    /// validation for both paths.
    pub fn follow_user(
        ctx: Context<FollowUser>,
        base: Pubkey,
        user_action: UserAction,
        _follower_handle: UserHandle,
        _followee_handle: UserHandle,
    ) -> Result<()> {
        match user_action {
            UserAction::FollowUser => {
                msg!("Audius::FollowUser");
            }
            UserAction::UnfollowUser => {
                msg!("Audius::UnfollowUser");
            }
        };

        let admin_key: &Pubkey = &ctx.accounts.audius_admin.key();
        let (base_pda, _bump) =
            Pubkey::find_program_address(&[&admin_key.to_bytes()[..32]], ctx.program_id);

        // Confirm the base PDA matches the expected value provided the target audius admin
        if base_pda != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        // Confirm the authority for this follower has signed the transaction
        if ctx.accounts.follower_user_storage.authority != ctx.accounts.authority.key() {
            return Err(ErrorCode::Unauthorized.into());
        }

        Ok(())
    }

    // Enable an account to perform actions on behalf of a given user
    pub fn add_user_authority_delegate(
        ctx: Context<AddUserAuthorityDelegate>,
        _base: Pubkey,
        _handle_seed: [u8; 16],
        _user_bump: u8,
        user_authority_delegate: Pubkey,
    ) -> Result<()> {
        // Only permitted to user authority
        if ctx.accounts.user.authority != ctx.accounts.user_authority.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        // Assign incoming delegate fields
        // Maintain the user's storage account and the incoming delegate authority key
        ctx.accounts
            .user_authority_delegate_pda
            .user_storage_account = ctx.accounts.user.key();
        ctx.accounts.user_authority_delegate_pda.delegate_authority = user_authority_delegate;
        Ok(())
    }

    // Disable an account that has been delegated authority for this user
    pub fn remove_user_authority_delegate(
        ctx: Context<RemoveUserAuthorityDelegate>,
        _base: Pubkey,
        _handle_seed: [u8; 16],
        _user_bump: u8,
        _user_authority_delegate: Pubkey,
        _delegate_bump: u8,
    ) -> Result<()> {
        // Only permitted to user authority
        if ctx.accounts.user.authority != ctx.accounts.user_authority.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        // Refer to context here - https://docs.solana.com/developing/programming-model/transactions#multiple-instructions-in-a-single-transaction
        let dummy_owner_field = Pubkey::from_str("11111111111111111111111111111111").unwrap();
        ctx.accounts.user_authority_delegate_pda.delegate_authority = dummy_owner_field;
        ctx.accounts
            .user_authority_delegate_pda
            .user_storage_account = dummy_owner_field;
        Ok(())
    }
}

/// Instructions
#[derive(Accounts)]
/// Instruction container to initialize an instance of Audius, with the incoming admin keypair
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = ADMIN_ACCOUNT_SIZE)]
    pub admin: Account<'info, AudiusAdmin>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container to initialize a user account, must be invoked from an existing Audius
/// `admin` account.
/// `user` is a PDA derived from the Audius account and handle.
/// `authority` is a signer key matching the admin value stored in AudiusAdmin root. Only the
///  admin of this Audius root program may initialize users through this function
/// `payer` is the account responsible for the lamports required to allocate this account.
/// `system_program` is required for PDA derivation.
#[derive(Accounts)]
#[instruction(base: Pubkey, eth_address: [u8;20], handle_seed: [u8;16])]
pub struct InitializeUser<'info> {
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        init,
        payer = payer,
        seeds = [&base.to_bytes()[..32], handle_seed.as_ref()],
        bump,
        space = USER_ACCOUNT_SIZE
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container to allow a user to add their Solana public key as part of their identity.
/// `user` is the target user PDA.
/// The global sys var program is required to enable instruction introspection.
#[derive(Accounts)]
pub struct InitializeUserSolIdentity<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    /// CHECK: This is required since we load an instruction at index - 1 to verify eth signature
    pub sysvar_program: AccountInfo<'info>,
}

/// Instruction container to create a user account.
/// `user` is the target user PDA.
/// The global sys var program is required to enable instruction introspection.
#[derive(Accounts)]
#[instruction(base: Pubkey, eth_address: [u8;20], handle_seed: [u8;16])]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [&base.to_bytes()[..32], handle_seed.as_ref()],
        bump,
        space = USER_ACCOUNT_SIZE
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub audius_admin: Account<'info, AudiusAdmin>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is required since we load an instruction at index - 1 to verify eth signature
    pub sysvar_program: AccountInfo<'info>,
}

/// Instruction container to allow updates to a given User account.
/// `user` is the target user PDA.
/// `user_authority` is a signer field which must match the `authority` field in the User account.
#[derive(Accounts)]
pub struct UpdateUser<'info> {
    #[account()]
    pub user: Account<'info, User>,
    #[account()]
    pub user_authority: Signer<'info>,
    /// CHECK: Delegate authority account, can be defaulted to SystemProgram for no-op
    #[account()]
    pub user_delegate_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(mut)]
    pub admin: Account<'info, AudiusAdmin>,
    #[account(mut)]
    pub admin_authority: Signer<'info>,
}

/// Instruction container to allow user delegation
/// Allocates a new account that will be used for fallback in auth scenarios
#[derive(Accounts)]
#[instruction(base: Pubkey, handle_seed: [u8;16], user_bump:u8, user_authority_delegate: Pubkey)]
pub struct AddUserAuthorityDelegate<'info> {
    #[account()]
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        seeds = [&base.to_bytes()[..32], handle_seed.as_ref()],
        bump = user_bump
    )]
    pub user: Account<'info, User>,
    #[account(
        init,
        payer = payer,
        seeds = [&user.key().to_bytes()[..32], &user_authority_delegate.to_bytes()[..32]],
        bump,
        space = USER_AUTHORITY_DELEGATE_ACCOUNT_SIZE
    )]
    pub user_authority_delegate_pda: Account<'info, UserAuthorityDelegate>,
    #[account()]
    pub user_authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container to remove allocated user authority delegation
/// Returns funds to payer
#[derive(Accounts)]
#[instruction(base: Pubkey, handle_seed: [u8;16], user_bump:u8, user_authority_delegate: Pubkey, delegate_bump:u8)]
pub struct RemoveUserAuthorityDelegate<'info> {
    #[account()]
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        seeds = [&base.to_bytes()[..32], handle_seed.as_ref()],
        bump = user_bump
    )]
    pub user: Account<'info, User>,
    #[account(
        mut,
        close = payer,
        seeds = [&user.key().to_bytes()[..32], &user_authority_delegate.to_bytes()[..32]],
        bump = delegate_bump
    )]
    pub user_authority_delegate_pda: Account<'info, UserAuthorityDelegate>,
    #[account()]
    pub user_authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container for entity management
/// Confirms that user.authority matches signer authority field
#[derive(Accounts)]
#[instruction(base: Pubkey, user_handle: UserHandle, _entity_type: EntityTypes, _management_action:ManagementActions, _id: String, _metadata: String)]
// Instruction base pda, handle
pub struct ManageEntity<'info> {
    #[account()]
    pub audius_admin: Account<'info, AudiusAdmin>,
    // Audiusadmin
    #[account(
        seeds = [&base.to_bytes()[..32], user_handle.seed.as_ref()],
        bump = user_handle.bump
    )]
    pub user: Account<'info, User>,
    #[account()]
    pub authority: Signer<'info>,
}

/// Instruction container for track social action event
/// Confirm that the user authority matches signer authority field
#[derive(Accounts)]
#[instruction(base: Pubkey, user_handle: UserHandle)]
pub struct WriteEntitySocialAction<'info> {
    // TODO - Verify removal here
    #[account()]
    pub audius_admin: Account<'info, AudiusAdmin>,
    #[account(seeds = [&base.to_bytes()[..32], user_handle.seed.as_ref()], bump = user_handle.bump)]
    pub user: Account<'info, User>,
    #[account()]
    // User authority field
    pub authority: Signer<'info>,
}

/// Instruction container for follow
#[derive(Accounts)]
#[instruction(base: Pubkey, user_instr:UserAction, follower_handle: UserHandle, followee_handle: UserHandle)]
pub struct FollowUser<'info> {
    #[account(mut)]
    pub audius_admin: Account<'info, AudiusAdmin>,
    // Confirm the follower PDA matches the expected value provided the target handle and base
    #[account(mut, seeds = [&base.to_bytes()[..32], follower_handle.seed.as_ref()], bump = follower_handle.bump)]
    pub follower_user_storage: Account<'info, User>,
    // Confirm the followee PDA matches the expected value provided the target handle and base
    #[account(mut, seeds = [&base.to_bytes()[..32], followee_handle.seed.as_ref()], bump = followee_handle.bump)]
    pub followee_user_storage: Account<'info, User>,
    // User update authority field
    #[account(mut)]
    pub authority: Signer<'info>,
}

/// Instruction container for verifying a user
#[derive(Accounts)]
#[instruction(base: Pubkey, user_handle: UserHandle)]
pub struct UpdateIsVerified<'info> {
    pub audius_admin: Account<'info, AudiusAdmin>,
    // Confirm the follower PDA matches the expected value provided the target handle and base
    #[account(seeds = [&base.to_bytes()[..32], user_handle.seed.as_ref()], bump = user_handle.bump)]
    pub user: Account<'info, User>,
    pub verifier: Signer<'info>,
}

// END Instructions

/// Audius root account
#[account]
pub struct AudiusAdmin {
    pub authority: Pubkey,
    pub verifier: Pubkey,
    pub is_write_enabled: bool,
}

/// User storage account
#[account]
pub struct User {
    pub eth_address: [u8; 20],
    pub authority: Pubkey,
}

/// User delegated authority account
#[account]
pub struct UserAuthorityDelegate {
    // The account that is given permission to operate on this user's behalf
    pub delegate_authority: Pubkey,
    // PDA of user storage account enabling operations
    pub user_storage_account: Pubkey,
}

// User actions enum, used to follow/unfollow based on function arguments
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum UserAction {
    FollowUser,
    UnfollowUser,
}

// Track actions enum, used to save / repost based on function arguments
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EntitySocialActionValues {
    AddSave,
    DeleteSave,
    AddRepost,
    DeleteRepost,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ManagementActions {
    Create,
    Update,
    Delete,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EntityTypes {
    Track,
    Playlist,
}

// Seed & bump used to validate the user's handle with the account base
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub struct UserHandle {
    pub seed: [u8; 16],
    pub bump: u8,
}

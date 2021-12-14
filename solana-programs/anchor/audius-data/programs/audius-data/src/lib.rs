//! The Audius Data Program is intended to bring all user data functionality to Solana through the
//! Anchor framework
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod audius_data {
    use std::str::FromStr;
    use anchor_lang::solana_program::sysvar;
    use anchor_lang::solana_program::secp256k1_program;

    /*
        User & Admin Functions
    */

    use super::*;
    /// Initialize an instance of Audius with admin keypair.
    /// The notion of admin here may be expanded to other functionality as well
    pub fn init_admin(ctx: Context<Initialize>, authority: Pubkey) -> ProgramResult {
        msg!("Audius::InitAdmin");
        let audius_admin = &mut ctx.accounts.admin;
        audius_admin.authority = authority;
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
        _handle_seed: [u8; 16],
        _user_bump: u8,
        metadata: String,
    ) -> ProgramResult {
        msg!("Audius::InitUser");
        // Confirm that the base used for user account seed is derived from this Audius admin storage account
        let (derived_base, _) = find_program_address_pubkey(ctx.accounts.admin.key(), ctx.program_id);

        if derived_base != base {
            return Err(ErrorCode::Unauthorized.into());
        }
        if ctx.accounts.authority.key() != ctx.accounts.admin.authority {
            return Err(ErrorCode::Unauthorized.into());
        }

        let audius_user_acct = &mut ctx.accounts.user;
        audius_user_acct.eth_address = eth_address;

        msg!("AudiusUserMetadata = {:?}", metadata);

        Ok(())
    }

    /// Functionality to confirm signed object and add a Solana Pubkey to a user's account.
    /// Performs instruction introspection and expects a minimum of 2 instructions [secp, currenttinstruction].
    pub fn init_user_sol(ctx: Context<InitializeUserSolIdentity>, user_authority: Pubkey) -> ProgramResult {
        msg!("Audius::InitUserSol");
        let audius_user_acct = &mut ctx.accounts.user;
        let index_current_instruction = sysvar::instructions::load_current_index_checked(
            &ctx.accounts.sysvar_program
        )?;

        // Instruction must contain at least one prior
        if index_current_instruction < 1 {
            return Err(ErrorCode::SignatureVerification.into());
        }

        // Eth_address offset (12) + address (20) + signature (65) = 97
        // TODO: Validate message contents
        let eth_address_offset = 12;
        let secp_data = sysvar::instructions::load_instruction_at_checked(
            0,
            &ctx.accounts.sysvar_program)?;

        if secp_data.program_id != secp256k1_program::id() {
            return Err(ErrorCode::Unauthorized.into());
        }
        let instruction_signer =
            secp_data.data[eth_address_offset..eth_address_offset + 20].to_vec();

        // Update if valid
        if instruction_signer == audius_user_acct.eth_address {
            audius_user_acct.authority = user_authority;
        }
        Ok(())
    }

    /// Permissioned function to log an update to User metadata
    pub fn update_user(ctx: Context<UpdateUser>, metadata: String) -> ProgramResult {
        msg!("Audius::UpdateUser");
        if ctx.accounts.user.authority != ctx.accounts.user_authority.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        msg!("AudiusUserMetadata = {:?}", metadata);
        Ok(())
    }

    // User TODOS:
    // - Disable audius admin signing
    // - Enable happy path flow with both eth address and sol key

    /*
        Track related functions
    */
    pub fn create_track(ctx: Context<CreateTrack>, metadata: String) -> ProgramResult {
        msg!("Audius::CreateTrack");
        if ctx.accounts.authority.key() != ctx.accounts.user.authority.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        // Set owner to user storage account
        ctx.accounts.track.owner = ctx.accounts.user.key();
        msg!("AudiusTrackMetadata = {:?}", metadata);
        Ok(())
    }

    // pub fn update_track
    pub fn update_track(ctx: Context<UpdateTrack>, metadata: String) -> ProgramResult {
        msg!("Audius::UpdateTrack");
        if ctx.accounts.user.key() != ctx.accounts.track.owner.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        if ctx.accounts.authority.key() != ctx.accounts.user.authority {
            return Err(ErrorCode::Unauthorized.into());
        }
        msg!("AudiusTrackMetadata = {:?}", metadata);
        Ok(())
    }

    // pub fn delete_track
    pub fn delete_track(ctx: Context<DeleteTrack>) -> ProgramResult {
        msg!("Audius::DeleteTrack");
        if ctx.accounts.user.key() != ctx.accounts.track.owner.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        if ctx.accounts.authority.key() != ctx.accounts.user.authority {
            return Err(ErrorCode::Unauthorized.into());
        }
        // Manually overwrite owner field
        // Refer to context here - https://docs.solana.com/developing/programming-model/transactions#multiple-instructions-in-a-single-transaction
        let dummy_owner_field = Pubkey::from_str("11111111111111111111111111111111").unwrap();
        ctx.accounts.track.owner = dummy_owner_field;
        Ok(())
    }
}

/// Size of admin account, 8 bytes (anchor prefix) + 32 (PublicKey)
pub const ADMIN_ACCOUNT_SIZE: usize = 8 + 32;

/// Size of user account
/// 8 bytes (anchor prefix) + 32 (PublicKey) + 20 (Ethereum PublicKey Bytes)
pub const USER_ACCOUNT_SIZE: usize = 8 + 32 + 20;

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
#[instruction(base: Pubkey, eth_address: [u8;20], handle_seed: [u8;16], user_bump: u8)]
pub struct InitializeUser<'info> {
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        init,
        payer = payer,
        seeds = [&base.to_bytes()[..32], handle_seed.as_ref()],
        bump = user_bump,
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
    pub sysvar_program: AccountInfo<'info>
}

/// Instruction container to allow updates to a given User account.
/// `user` is the target user PDA.
/// `user_authority` is a signer field which must match the `authority` field in the User account.
#[derive(Accounts)]
pub struct UpdateUser<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub user_authority: Signer<'info>,
}


/// Instruction container for track creation
/// Confirms that user.authority matches signer authority field
/// Payer is provided to facilitate an independent feepayer
#[derive(Accounts)]
pub struct CreateTrack<'info> {
    #[account(init, payer = payer, space = 8 + 32)]
    pub track: Account<'info, Track>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>
}

/// Instruction container for track updates
/// Confirm that the user authority matches signer authority field
#[derive(Accounts)]
pub struct UpdateTrack<'info> {
    #[account()]
    pub track: Account<'info, Track>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

/// Instruction container for track deletes
/// Removes track storage account entirely
#[derive(Accounts)]
pub struct DeleteTrack<'info> {
    // Return funds to the payer of this transaction
    #[account(mut, close = payer)]
    pub track: Account<'info, Track>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

// END Instructions

/// Audius root account
#[account]
pub struct AudiusAdmin {
    pub authority: Pubkey,
}

/// User storage account
#[account]
pub struct User {
    pub eth_address: [u8; 20],
    pub authority: Pubkey,
}

/// Track storage account
#[account]
pub struct Track {
    pub owner: Pubkey,
}

// Errors
#[error]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Signature verification failed.")]
    SignatureVerification,
}

// Util functions
pub fn find_program_address_pubkey(base_pubkey : Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[&base_pubkey.to_bytes()[..32]], program_id)
}
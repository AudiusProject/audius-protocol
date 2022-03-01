//! The Audius Data Program is intended to bring all user data functionality to Solana through the
//! Anchor framework

use anchor_lang::prelude::*;

declare_id!("ARByaHbLDmzBvWdSTUxu25J5MJefDSt3HSRWZBQNiTGi");

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
    /// track_id_offset is the starting point for uploaded tracks
    /// playlist_id_offset is the starting point for uploaded playlists
    pub fn init_admin(
        ctx: Context<Initialize>,
        authority: Pubkey,
        verifier: Pubkey,
        track_id_offset: u64,
        playlist_id_offset: u64,
    ) -> Result<()> {
        msg!("Audius::InitAdmin");
        let audius_admin = &mut ctx.accounts.admin;
        audius_admin.authority = authority;
        audius_admin.verifier = verifier;
        audius_admin.track_id = track_id_offset;
        audius_admin.playlist_id = playlist_id_offset;
        audius_admin.is_write_enabled = true;
        Ok(())
    }

    /// Verifies a user by asserting that the audius_admin's verifier matches the signed verifier account
    pub fn update_is_verified(
        ctx: Context<UpdateIsVerified>,
        base: Pubkey,
        _user_handle: UserHandle
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
        metadata: String,
    ) -> Result<()> {
        msg!("Audius::InitUser");
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

        msg!("AudiusUserMetadata = {:?}", metadata);

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

        // Eth_address offset (12) + address (20) + signature (65) = 97
        // TODO: Validate message contents
        let eth_address_offset = 12;
        let secp_data =
            sysvar::instructions::load_instruction_at_checked(0, &ctx.accounts.sysvar_program)?;

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

        // Eth_address offset (12) + address (20) + signature (65) = 97
        // TODO: Validate message contents
        let eth_address_offset = 12;
        let secp_data =
            sysvar::instructions::load_instruction_at_checked(0, &ctx.accounts.sysvar_program)?;

        if secp_data.program_id != secp256k1_program::id() {
            return Err(ErrorCode::Unauthorized.into());
        }
        let instruction_signer =
            secp_data.data[eth_address_offset..eth_address_offset + 20].to_vec();
        if instruction_signer != eth_address {
            return Err(ErrorCode::Unauthorized.into());
        }

        let audius_user_acct = &mut ctx.accounts.user;
        audius_user_acct.eth_address = eth_address;
        audius_user_acct.authority = user_authority;

        msg!("AudiusUserMetadata = {:?}", metadata);

        Ok(())
    }

    /// Permissioned function to log an update to User metadata
    pub fn update_user(ctx: Context<UpdateUser>, metadata: String) -> Result<()> {
        msg!("Audius::UpdateUser");
        if ctx.accounts.user.authority != ctx.accounts.user_authority.key() {
            return Err(ErrorCode::Unauthorized.into());
        }
        msg!("AudiusUserMetadata = {:?}", metadata);
        Ok(())
    }

    /// Permissioned function to log an update to Admin metadata
    pub fn update_admin(ctx: Context<UpdateAdmin>,  is_write_enabled: bool) -> Result<()> {
        if ctx.accounts.admin.authority != ctx.accounts.admin_authority.key() { // could be has_one
            return Err(ErrorCode::Unauthorized.into());
        }
        ctx.accounts.admin.is_write_enabled = is_write_enabled;
        Ok(())
    }

    // User TODOS:
    // - Enable happy path flow with both eth address and sol key

    /*
        Track related functions
    */
    pub fn create_track(ctx: Context<CreateTrack>, metadata: String) -> Result<()> {
        msg!("Audius::CreateTrack");
        if ctx.accounts.authority.key() != ctx.accounts.user.authority {
            return Err(ErrorCode::Unauthorized.into());
        }
        // Set owner to user storage account
        ctx.accounts.track.owner = ctx.accounts.user.key();
        ctx.accounts.track.track_id = ctx.accounts.audius_admin.track_id;
        // Increment global track ID after assignment to this track in particular
        // Ensures each track has a unique numeric ID
        ctx.accounts.audius_admin.track_id = ctx.accounts.audius_admin.track_id + 1;
        msg!("AudiusTrackMetadata = {:?}", metadata);
        Ok(())
    }

    pub fn update_track(ctx: Context<UpdateTrack>, metadata: String) -> Result<()> {
        msg!("Audius::UpdateTrack");
        if ctx.accounts.user.key() != ctx.accounts.track.owner {
            return Err(ErrorCode::Unauthorized.into());
        }
        if ctx.accounts.authority.key() != ctx.accounts.user.authority {
            return Err(ErrorCode::Unauthorized.into());
        }
        msg!("AudiusTrackMetadata = {:?}", metadata);
        Ok(())
    }

    pub fn delete_track(ctx: Context<DeleteTrack>) -> Result<()> {
        msg!("Audius::DeleteTrack");
        if ctx.accounts.user.key() != ctx.accounts.track.owner {
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
    /*
        Playlist related functions
    */
    pub fn create_playlist(ctx: Context<CreatePlaylist>, metadata: String) -> Result<()> {
        msg!("Audius::CreatePlaylist");
        if ctx.accounts.authority.key() != ctx.accounts.user.authority {
            return Err(ErrorCode::Unauthorized.into());
        }
        // Set owner to user storage account
        ctx.accounts.playlist.owner = ctx.accounts.user.key();
        ctx.accounts.playlist.playlist_id = ctx.accounts.audius_admin.playlist_id;
        ctx.accounts.audius_admin.playlist_id = ctx.accounts.audius_admin.playlist_id + 1;
        msg!("AudiusPlaylistMetadata = {:?}", metadata);
        Ok(())
    }

    pub fn update_playlist(ctx: Context<UpdatePlaylist>, metadata: String) -> Result<()> {
        msg!("Audius::UpdatePlaylist");
        if ctx.accounts.user.key() != ctx.accounts.playlist.owner {
            return Err(ErrorCode::Unauthorized.into());
        }
        if ctx.accounts.authority.key() != ctx.accounts.user.authority {
            return Err(ErrorCode::Unauthorized.into());
        }
        msg!("AudiusPlaylistMetadata = {:?}", metadata);
        Ok(())
    }

    pub fn delete_playlist(ctx: Context<DeletePlaylist>) -> Result<()> {
        msg!("Audius::DeletePlaylist");
        if ctx.accounts.user.key() != ctx.accounts.playlist.owner {
            return Err(ErrorCode::Unauthorized.into());
        }
        if ctx.accounts.authority.key() != ctx.accounts.user.authority {
            return Err(ErrorCode::Unauthorized.into());
        }
        // Manually overwrite owner field
        // Refer to context here - https://docs.solana.com/developing/programming-model/transactions#multiple-instructions-in-a-single-transaction
        let dummy_owner_field = Pubkey::from_str("11111111111111111111111111111111").unwrap();
        ctx.accounts.playlist.owner = dummy_owner_field;
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
}

/// Size of admin account, 8 bytes (anchor prefix) + 32 (PublicKey) + 32 (PublicKey) + 8 (track id) + 8 (playlist id) + 1 (is_write_enabled)
pub const ADMIN_ACCOUNT_SIZE: usize = 8 + 32 + 32 + 8 + 8 + 1;

/// Size of user account
/// 8 bytes (anchor prefix) + 32 (PublicKey) + 20 (Ethereum PublicKey Bytes)
pub const USER_ACCOUNT_SIZE: usize = 8 + 32 + 20;

/// Size of track account
/// 8 bytes (anchor prefix) + 32 (PublicKey) + 8 (track offset ID)
pub const TRACK_ACCOUNT_SIZE: usize = 8 + 32 + 8;

/// Size of playlist account
/// 8 bytes (anchor prefix) + 32 (PublicKey) + 8 (id)
pub const PLAYLIST_ACCOUNT_SIZE: usize = 8 + 32 + 8;

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
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub user_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(mut)]
    pub admin: Account<'info, AudiusAdmin>,
    #[account(mut)]
    pub admin_authority: Signer<'info>,
}

/// Instruction container for track creation
/// Confirms that user.authority matches signer authority field
/// Payer is provided to facilitate an independent feepayer
#[derive(Accounts)]
pub struct CreateTrack<'info> {
    #[account(init, payer = payer, space = TRACK_ACCOUNT_SIZE)]
    pub track: Account<'info, Track>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub audius_admin: Account<'info, AudiusAdmin>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
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
    // User update authority field
    pub authority: Signer<'info>,
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
    // User update authority field
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
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

/// Instruction container for playlist creation
/// Confirms that user.authority matches signer authority field
/// Payer is provided to facilitate an independent feepayer
#[derive(Accounts)]
pub struct CreatePlaylist<'info> {
    #[account(init, payer = payer, space = PLAYLIST_ACCOUNT_SIZE)]
    pub playlist: Account<'info, Playlist>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub audius_admin: Account<'info, AudiusAdmin>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container for playlist updates
/// Confirm that the user authority matches signer authority field
#[derive(Accounts)]
pub struct UpdatePlaylist<'info> {
    #[account()]
    pub playlist: Account<'info, Playlist>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

/// Instruction container for playlist deletes
/// Removes playlist storage account entirely
#[derive(Accounts)]
pub struct DeletePlaylist<'info> {
    // Return funds to the payer of this transaction
    #[account(mut, close = payer)]
    pub playlist: Account<'info, Playlist>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
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
    pub track_id: u64,
    pub playlist_id: u64,
    pub is_write_enabled: bool,
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
    pub track_id: u64,
}

/// Playlist storage account
#[account]
pub struct Playlist {
    pub owner: Pubkey,
    pub playlist_id: u64,
}

// Errors
#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Signature verification failed.")]
    SignatureVerification,
}

// User actions enum, used to follow/unfollow based on function arguments
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum UserAction {
    FollowUser,
    UnfollowUser,
}

// Seed & bump used to validate the user's handle with the account base
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub struct UserHandle {
    pub seed: [u8;16],
    pub bump: u8,
}


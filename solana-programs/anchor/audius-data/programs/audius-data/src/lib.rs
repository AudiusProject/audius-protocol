//! The Audius Data Program is intended to bring all user data functionality to Solana through the
//! Anchor framework
pub mod constants;
pub mod error;
pub mod utils;

use crate::{constants::*, error::ErrorCode, utils::*};
use anchor_lang::prelude::*;
use std::collections::BTreeMap;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"); // default program ID to be replaced in start.sh

#[program]
pub mod audius_data {
    use anchor_lang::solana_program::{
        secp256k1_program,
        sysvar
    };
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
        _user_id_seed_bump: UserIdSeedBump,
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
    /// The user's account is derived from the admin base PDA + user ID bytes.
    /// Populates the user account with their Ethereum address as bytes and an empty Pubkey for their Solana identity.
    /// Allows the user to later "claim" their account by submitting a signed object and setting their own identity.
    /// Important to note that the metadata object is simply logged out to be picked up by the Audius indexing layer.
    pub fn init_user(
        ctx: Context<InitializeUser>,
        base: Pubkey,
        eth_address: [u8; 20],
        replica_set: [u16; 3],
        _replica_set_bumps: [u8; 3],
        user_id: u32,
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
            &[&derived_base.to_bytes()[..32], &user_id.to_le_bytes()],
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
        audius_user_acct.replica_set = replica_set;

        Ok(())
    }

    /// Create a content node account from the admin account.
    /// The content node's account is derived from the admin base PDA + sp_id bytes.
    pub fn create_content_node(
        ctx: Context<CreateContentNode>,
        base: Pubkey,
        sp_id: u16,
        authority: Pubkey,
        owner_eth_address: [u8; 20],
    ) -> Result<()> {

        // Confirm that the base used for content node account seed is derived from this Audius admin storage account
        let (derived_base, _) = Pubkey::find_program_address(
            &[&ctx.accounts.admin.key().to_bytes()[..32]],
            ctx.program_id,
        );

        if derived_base != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        // Confirm that the derived pda from base is the same as the user storage account
        let (derived_content_node, _) = Pubkey::find_program_address(
            &[&derived_base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, sp_id.to_le_bytes().as_ref()],
            ctx.program_id,
        );
        if derived_content_node != ctx.accounts.content_node.key() {
            return Err(ErrorCode::Unauthorized.into());
        }

        if ctx.accounts.authority.key() != ctx.accounts.admin.authority {
            return Err(ErrorCode::Unauthorized.into());
        }

        let content_node = &mut ctx.accounts.content_node;
        content_node.owner_eth_address = owner_eth_address;
        content_node.authority = authority;

        Ok(())
    }

    /// Create a content node account from other content nodes.
    pub fn public_create_or_update_content_node(
        ctx: Context<PublicCreateOrUpdateContentNode>,
        base: Pubkey,
        _p1: ProposerSeedBump,
        _p2: ProposerSeedBump,
        _p3: ProposerSeedBump,
        _sp_id: u16,
        authority: Pubkey,
        owner_eth_address: [u8; 20],
    ) -> Result<()> {

        // validate that there are no dupes in the replica
        let proposers = [
            (&ctx.accounts.proposer1, &ctx.accounts.proposer1_authority),
            (&ctx.accounts.proposer2, &ctx.accounts.proposer2_authority),
            (&ctx.accounts.proposer3, &ctx.accounts.proposer3_authority),
        ];

        // Ensure that no proposer's owner eth address is repeated
        let mut eth_addresses = BTreeMap::new();
        if !proposers.iter().all(move |(proposer, authority)| return match eth_addresses.insert(proposer.owner_eth_address, true) {
            Some(_) => false,
            None => proposer.authority == authority.key()
        }) {
            // duplicate owner eth address - err
            return Err(ErrorCode::Unauthorized.into());
        }

        // Confirm that the base used for user account seed is derived from this Audius admin storage account
        let (derived_base, _) = Pubkey::find_program_address(
            &[&ctx.accounts.admin.key().to_bytes()[..32]],
            ctx.program_id,
        );

        if derived_base != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        let content_node = &mut ctx.accounts.content_node;
        content_node.owner_eth_address = owner_eth_address;
        content_node.authority = authority;

        Ok(())
    }

    /// Closes a content node account from other content nodes.
    pub fn public_delete_content_node(
        ctx: Context<PublicDeleteContentNode>,
        base: Pubkey,
        _p_delete: ProposerSeedBump,
        _p1: ProposerSeedBump,
        _p2: ProposerSeedBump,
        _p3: ProposerSeedBump,
    ) -> Result<()> {

        if &ctx.accounts.admin.authority != &ctx.accounts.admin_authority.key() {
            // todoL break
            return Err(ErrorCode::Unauthorized.into());
        }
        // validate that there are no dupes in the replica
        let proposers = [
            (&ctx.accounts.proposer1, &ctx.accounts.proposer1_authority),
            (&ctx.accounts.proposer2, &ctx.accounts.proposer2_authority),
            (&ctx.accounts.proposer3, &ctx.accounts.proposer3_authority),
        ];

        // Ensure that no proposer's owner eth address is repeated
        let mut eth_addresses = BTreeMap::new();
        if !proposers.iter().all(move |(proposer, authority)| return match eth_addresses.insert(proposer.owner_eth_address, true) {
            Some(_) => false,
            None => proposer.authority == authority.key()
        }) {
            // duplicate owner eth address - err
            return Err(ErrorCode::Unauthorized.into());
        }

        // Confirm that the base used for user account seed is derived from this Audius admin storage account
        let (derived_base, _) = Pubkey::find_program_address(
            &[&ctx.accounts.admin.key().to_bytes()[..32]],
            ctx.program_id,
        );

        if derived_base != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        // Refer to context here - https://docs.solana.com/developing/programming-model/transactions#multiple-instructions-in-a-single-transaction
        let dummy_owner_field = Pubkey::from_str("11111111111111111111111111111111").unwrap();

        let content_node = &mut ctx.accounts.content_node;
        content_node.authority = dummy_owner_field;

        Ok(())
    }

    /// Update a user's replica set
    pub fn update_user_replica_set(
        ctx: Context<UpdateUserReplicaSet>,
        base: Pubkey,
        _user_id_seed_bump: UserIdSeedBump,
        replica_set: [u16;3],
        _replica_set_bumps: [u8; 3]
    ) -> Result<()> {

        // Confirm that the base used for user account seed is derived from this Audius admin storage account
        let (derived_base, _) = Pubkey::find_program_address(
            &[&ctx.accounts.admin.key().to_bytes()[..32]],
            ctx.program_id,
        );

        if derived_base != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        let user_replica_set = &ctx.accounts.user.replica_set;

        let did_user_sign = ctx.accounts.user.authority == ctx.accounts.cn_authority.key();
        let mut is_valid_authority = did_user_sign;
        let proposers = [&ctx.accounts.cn1, &ctx.accounts.cn2, &ctx.accounts.cn3];

        // Validate that a content node in the replica signed the tx if the user's authority did not
        if !is_valid_authority {
            for proposer in proposers {
                if proposer.authority == ctx.accounts.cn_authority.key() {
                    is_valid_authority = true;
                    // Validate that one of the user's replica set nodes signed the transaction
                    if !user_replica_set.iter().any(|cn| {
                        let (cn_account_pda, _bump) = Pubkey::find_program_address(
                            &[
                                &base.to_bytes()[..32],
                                CONTENT_NODE_SEED_PREFIX,
                                &cn.to_le_bytes()
                            ], &ctx.program_id);
                        return cn_account_pda == proposer.key();
                    }) {
                        return Err(ErrorCode::Unauthorized.into());
                    }
                }
            }    
        }

        if !is_valid_authority {
            return Err(ErrorCode::Unauthorized.into());
        }

        let user_acct = &mut ctx.accounts.user;
        user_acct.replica_set = replica_set;
        Ok(())
    }
    
    /// Functionality to confirm signed object and add a Solana Pubkey to a user's account.
    /// Performs instruction introspection and expects a minimum of 2 instructions [secp, current instruction].
    pub fn init_user_sol(
        ctx: Context<InitializeUserSolIdentity>,
        user_authority: Pubkey,
    ) -> Result<()> {
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
        replica_set: [u16; 3],
        _replica_set_bumps: [u8; 3],
        _user_id: u32,
        _user_bump: u8,
        _metadata: String,
        user_authority: Pubkey,
    ) -> Result<()> {
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
        audius_user_acct.replica_set = replica_set;

        let message = secp_data.data[MESSAGE_OFFSET..].to_vec();

        if message != user_authority.to_bytes() {
            return Err(ErrorCode::Unauthorized.into());
        }

        Ok(())
    }

    /// Permissioned function to log an update to User metadata
    pub fn update_user(ctx: Context<UpdateUser>, _metadata: String) -> Result<()> {
        validate_user_authority(
            ctx.program_id,
            &ctx.accounts.user,
            &ctx.accounts.user_authority_delegate,
            &ctx.accounts.user_authority,
            &ctx.accounts.authority_delegation_status,
        )?;
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
        _user_id_seed_bump: UserIdSeedBump,
        _entity_type: EntityTypes,
        _management_action: ManagementActions,
        _id: u64,
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
        validate_user_authority(
            ctx.program_id,
            &ctx.accounts.user,
            &ctx.accounts.user_authority_delegate,
            &ctx.accounts.authority,
            &ctx.accounts.authority_delegation_status,
        )?;
        
        Ok(())
    }

    pub fn write_entity_social_action(
        ctx: Context<WriteEntitySocialAction>,
        base: Pubkey,
        _user_id_seed_bump: UserIdSeedBump,
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

        // validate user has authority and check for delegate
        validate_user_authority(
            ctx.program_id,
            &ctx.accounts.user,
            &ctx.accounts.user_authority_delegate,
            &ctx.accounts.authority,
            &ctx.accounts.authority_delegation_status,
        )?;

        Ok(())
    }

    /*
        User social action functions

        Follow/subscribe a user, transaction sent from 1 known valid source user to another target user
        Both User accounts are re-derived from the user id seed and validated
        Only the follower must have already claimed their solana public key -
        in order to facilitate the scenario where an 'initialized' user follows an 'unitialized' user
        Note that both follow/subscribe and unfollow/unsubscribe are handled in this single function through an enum, with identical
        validation for both paths.
    */
    pub fn write_user_social_action(
        ctx: Context<WriteUserSocialAction>,
        base: Pubkey,
        _user_action: UserAction,
        _source_user_id_seed_bump: UserIdSeedBump,
        _target_user_id_seed_bump: UserIdSeedBump,
    ) -> Result<()> {
        let admin_key: &Pubkey = &ctx.accounts.audius_admin.key();
        let (base_pda, _bump) =
            Pubkey::find_program_address(&[&admin_key.to_bytes()[..32]], ctx.program_id);

        // Confirm the base PDA matches the expected value provided the target audius admin
        if base_pda != base {
            return Err(ErrorCode::Unauthorized.into());
        }

        // validate user has authority and check for delegate
        validate_user_authority(
            ctx.program_id,
            &ctx.accounts.source_user_storage,
            &ctx.accounts.user_authority_delegate,
            &ctx.accounts.authority,
            &ctx.accounts.authority_delegation_status,
        )?;

        Ok(())
    }
    
    /// Initializes a AuthorityDelegation PDA for an authority
    pub fn init_authority_delegation_status(
        ctx: Context<InitAuthorityDelegationStatus>,
        _authority_name: String,
    ) -> Result<()> {

        ctx.accounts.authority_delegation_status_pda.is_revoked = false;

        Ok(())
    }

    /// Revokes an authority's delegation
    pub fn revoke_authority_delegation(
        ctx: Context<RevokeAuthorityDelegationStatus>,
        _authority_delegation_bump: u8,
    ) -> Result<()> {
        // TODO add user validation

        ctx.accounts.authority_delegation_status_pda.is_revoked = true;

        Ok(())
    }

    /// Enable an account to perform actions on behalf of a given user
    pub fn add_user_authority_delegate(
        ctx: Context<AddUserAuthorityDelegate>,
        _base: Pubkey,
        _user_id_seed_bump: UserIdSeedBump,
        delegate_pubkey: Pubkey,
    ) -> Result<()> {
        // validate signer is the user or delegate
        validate_user_authority(
            ctx.program_id,
            &ctx.accounts.user,
            &ctx.accounts.signer_user_authority_delegate,
            &ctx.accounts.authority,
            &ctx.accounts.authority_delegation_status,
        )?;

        // Assign incoming delegate fields
        // Maintain the user's storage account and the incoming delegate authority key
        ctx.accounts
            .current_user_authority_delegate
            .user_storage_account = ctx.accounts.user.key();
        ctx.accounts.current_user_authority_delegate.delegate_authority = delegate_pubkey;
        Ok(())
    }

    // Disable an account that has been delegated authority for this user
    pub fn remove_user_authority_delegate(
        ctx: Context<RemoveUserAuthorityDelegate>,
        _base: Pubkey,
        _user_id_seed_bump: UserIdSeedBump,
        _user_authority_delegate: Pubkey,
        _delegate_bump: u8,
    ) -> Result<()> {
        // validate signer is the user or delegate
        validate_user_authority(
            ctx.program_id,
            &ctx.accounts.user,
            &ctx.accounts.signer_user_authority_delegate,
            &ctx.accounts.authority,
            &ctx.accounts.authority_delegation_status,
        )?;

        // Refer to context here - https://docs.solana.com/developing/programming-model/transactions#multiple-instructions-in-a-single-transaction
        let dummy_owner_field = Pubkey::from_str("11111111111111111111111111111111").unwrap();
        ctx.accounts.current_user_authority_delegate.delegate_authority = dummy_owner_field;
        ctx.accounts
            .current_user_authority_delegate
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
/// `user` is a PDA derived from the Audius account and user ID.
/// `authority` is a signer key matching the admin value stored in AudiusAdmin root. Only the
///  admin of this Audius root program may initialize users through this function
/// `payer` is the account responsible for the lamports required to allocate this account.le
/// `system_program` is required for PDA derivation.
#[derive(Accounts)]
#[instruction(base: Pubkey, eth_address: [u8;20], replica_set: [u16; 3], replica_set_bumps:[u8; 3], user_id: u32)]
pub struct InitializeUser<'info> {
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        init,
        payer = payer,
        seeds = [&base.to_bytes()[..32], &user_id.to_le_bytes()],
        bump,
        space = USER_ACCOUNT_SIZE
    )]
    pub user: Account<'info, User>,
    #[account(seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, &replica_set[0].to_le_bytes()], bump = replica_set_bumps[0])]
    pub cn1: Account<'info, ContentNode>,
    #[account(seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, &replica_set[1].to_le_bytes()], bump = replica_set_bumps[1])]
    pub cn2: Account<'info, ContentNode>,
    #[account(seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, &replica_set[2].to_le_bytes()], bump = replica_set_bumps[2])]
    pub cn3: Account<'info, ContentNode>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container to initialize a content node account, 
/// must be invoked from an existing Audius `admin` account.
#[derive(Accounts)]
#[instruction(base: Pubkey, sp_id: u16)]
pub struct CreateContentNode<'info> {
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        init,
        payer = payer,
        seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, sp_id.to_le_bytes().as_ref()],
        bump,
        space = CONTENT_NODE_ACCOUNT_SIZE
    )]
    pub content_node: Account<'info, ContentNode>,
    #[account()]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container for creating a content node with 3 proposers
#[derive(Accounts)]
#[instruction(base: Pubkey, p1: ProposerSeedBump, p2: ProposerSeedBump, p3: ProposerSeedBump, sp_id: u16)]
pub struct PublicCreateOrUpdateContentNode<'info> {
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        init_if_needed,
        payer = payer,
        seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, sp_id.to_le_bytes().as_ref()],
        bump,
        space = CONTENT_NODE_ACCOUNT_SIZE
    )]
    pub content_node: Account<'info, ContentNode>,
    #[account(seeds = [&base.to_bytes()[..32], p1.seed.as_ref()], bump = p1.bump)]
    pub proposer1: Account<'info, ContentNode>,
    pub proposer1_authority: Signer<'info>,
    #[account(seeds = [&base.to_bytes()[..32], p2.seed.as_ref()], bump = p2.bump)]
    pub proposer2: Account<'info, ContentNode>,
    pub proposer2_authority: Signer<'info>,
    #[account(seeds = [&base.to_bytes()[..32], p3.seed.as_ref()], bump = p3.bump)]
    pub proposer3: Account<'info, ContentNode>,
    pub proposer3_authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container for deleteing a content node with 3 proposers
#[derive(Accounts)]
#[instruction(base: Pubkey, p_delete: ProposerSeedBump, p1: ProposerSeedBump, p2: ProposerSeedBump, p3: ProposerSeedBump)]
pub struct PublicDeleteContentNode<'info> {
    pub admin: Account<'info, AudiusAdmin>,
    /// CHECK: Delegate authority account, can be defaulted to SystemProgram for no-op
    #[account(mut)]
    pub admin_authority: AccountInfo<'info>,    
    #[account(
        mut,
        close = admin_authority,
        seeds = [&base.to_bytes()[..32], p_delete.seed.as_ref()],
        bump = p_delete.bump
    )]
    pub content_node: Account<'info, ContentNode>,
    // NOTE: Potentially use remain_accounts and then can set a variable number of proposers 
    // https://book.anchor-lang.com/chapter_3/the_program_module.html#context
    #[account(seeds = [&base.to_bytes()[..32], p1.seed.as_ref()], bump = p1.bump)]
    pub proposer1: Account<'info, ContentNode>,
    pub proposer1_authority: Signer<'info>,
    #[account(seeds = [&base.to_bytes()[..32], p2.seed.as_ref()], bump = p2.bump)]
    pub proposer2: Account<'info, ContentNode>,
    pub proposer2_authority: Signer<'info>,
    #[account(seeds = [&base.to_bytes()[..32], p3.seed.as_ref()], bump = p3.bump)]
    pub proposer3: Account<'info, ContentNode>,
    pub proposer3_authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container for updating a user's replica set signed by the user's authority or a content node
#[derive(Accounts)]
#[instruction(base: Pubkey, user_id_seed_bump: UserIdSeedBump, replica_set: [u16; 3], replica_set_bumps: [u8; 3])]
pub struct UpdateUserReplicaSet<'info> {
    pub admin: Account<'info, AudiusAdmin>,
    #[account(mut, seeds = [&base.to_bytes()[..32], &user_id_seed_bump.user_id.to_le_bytes()], bump=user_id_seed_bump.bump)]
    pub user: Account<'info, User>,
    #[account(seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, &replica_set[0].to_le_bytes()], bump = replica_set_bumps[0])]
    pub cn1: Account<'info, ContentNode>,
    #[account(seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, &replica_set[1].to_le_bytes()], bump = replica_set_bumps[1])]
    pub cn2: Account<'info, ContentNode>,
    #[account(seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, &replica_set[2].to_le_bytes()], bump = replica_set_bumps[2])]
    pub cn3: Account<'info, ContentNode>,
    pub cn_authority: Signer<'info>,    
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
#[instruction(
    base: Pubkey,
    eth_address: [u8;20],
    replica_set: [u16; 3],
    replica_set_bumps:[u8; 3],
    _user_id: u32,
    _user_bump: u8,
    _metadata: String,
    _user_authority: Pubkey,
)]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [&base.to_bytes()[..32], &_user_id.to_le_bytes()],
        bump,
        space = USER_ACCOUNT_SIZE
    )]
    pub user: Account<'info, User>,
    #[account(seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, &replica_set[0].to_le_bytes()], bump = replica_set_bumps[0])]
    pub cn1: Account<'info, ContentNode>,
    #[account(seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, &replica_set[1].to_le_bytes()], bump = replica_set_bumps[1])]
    pub cn2: Account<'info, ContentNode>,
    #[account(seeds = [&base.to_bytes()[..32], CONTENT_NODE_SEED_PREFIX, &replica_set[2].to_le_bytes()], bump = replica_set_bumps[2])]
    pub cn3: Account<'info, ContentNode>,
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
    /// CHECK: When signer is a delegate, validate UserAuthorityDelegate PDA  (default SystemProgram when signer is user)
    #[account()]
    pub user_authority_delegate: AccountInfo<'info>,
    /// CHECK: When signer is a delegate, validate AuthorityDelegationStatus PDA  (default SystemProgram when signer is user)
    #[account()]
    pub authority_delegation_status: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(mut)]
    pub admin: Account<'info, AudiusAdmin>,
    #[account(mut)]
    pub admin_authority: Signer<'info>,
}

/// Instruction container to initialize an AuthorityDelegationStatus.
/// The authority initializes itself as a delegate.
/// `delegate_authority` is the authority that will become a delegate
/// `authority_delegation_status_pda` is the target PDA for the authority's delegation
#[derive(Accounts)]
#[instruction(authority_name: String)]
pub struct InitAuthorityDelegationStatus<'info> {
    /// CHECK: Delegate authority account
    #[account()]
    pub delegate_authority: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds = [AUTHORITY_DELEGATION_STATUS_SEED, delegate_authority.key().as_ref()],
        bump,
        space = AUTHORITY_DELEGATION_STATUS_ACCOUNT_SIZE
    )]
    pub authority_delegation_status_pda: Account<'info, AuthorityDelegationStatus>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container to revoke an AuthorityDelegationStatus.
/// The authority revokes itself as a delegate.
/// `delegate_authority` is the authority that will become a delegate
/// `authority_delegation_pda` is the target PDA for the authority's delegation
#[derive(Accounts)]
#[instruction(authority_delegation_status_bump: u8)]
pub struct RevokeAuthorityDelegationStatus<'info> {
    #[account()]
    pub delegate_authority: Signer<'info>,
    #[account(
        mut, 
        seeds = [AUTHORITY_DELEGATION_STATUS_SEED, delegate_authority.key().as_ref()],
        bump = authority_delegation_status_bump,
    )]
    pub authority_delegation_status_pda: Account<'info, AuthorityDelegationStatus>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container to allow user delegation
/// Allocates a new account that will be used for fallback in auth scenarios
#[derive(Accounts)]
#[instruction(base: Pubkey, user_id_seed_bump: UserIdSeedBump, delegate_pubkey: Pubkey)]
pub struct AddUserAuthorityDelegate<'info> {
    #[account()]
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        seeds = [&base.to_bytes()[..32], &user_id_seed_bump.user_id.to_le_bytes()],
        bump = user_id_seed_bump.bump
    )]
    pub user: Account<'info, User>,
    #[account(
        init,
        payer = payer,
        seeds = [&user.key().to_bytes()[..32], &delegate_pubkey.to_bytes()[..32]],
        bump,
        space = USER_AUTHORITY_DELEGATE_ACCOUNT_SIZE
    )]
    pub current_user_authority_delegate: Account<'info, UserAuthorityDelegate>,
    /// CHECK: When signer is a delegate, validate UserAuthorityDelegate PDA  (default SystemProgram when signer is user)
    #[account()]
    pub signer_user_authority_delegate: AccountInfo<'info>,
    /// CHECK: When signer is a delegate, validate AuthorityDelegationStatus PDA (default SystemProgram when signer is user)
    #[account()]
    pub authority_delegation_status: AccountInfo<'info>,
    #[account()]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container to remove allocated user authority delegation
/// Returns funds to payer
#[derive(Accounts)]
#[instruction(base: Pubkey, user_id_seed_bump: UserIdSeedBump, delegate_pubkey: Pubkey, delegate_bump:u8)]
pub struct RemoveUserAuthorityDelegate<'info> {
    #[account()]
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        seeds = [&base.to_bytes()[..32], &user_id_seed_bump.user_id.to_le_bytes()],
        bump = user_id_seed_bump.bump
    )]
    pub user: Account<'info, User>,
    #[account(
        mut,
        close = payer,
        seeds = [&user.key().to_bytes()[..32], &delegate_pubkey.to_bytes()[..32]],
        bump = delegate_bump
    )]
    pub current_user_authority_delegate: Account<'info, UserAuthorityDelegate>,
    /// CHECK: When signer is a delegate, validate UserAuthorityDelegate PDA  (default SystemProgram when signer is user)
    #[account()]
    pub signer_user_authority_delegate: AccountInfo<'info>, // provided for authority authentication
    /// CHECK: When signer is a delegate, validate AuthorityDelegationStatus PDA  (default SystemProgram when signer is user)
    #[account()]
    pub authority_delegation_status: AccountInfo<'info>,
    #[account()]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Instruction container for entity management
/// Confirms that user.authority matches signer authority field
#[derive(Accounts)]
#[instruction(
    base: Pubkey,
    user_id_seed_bump: UserIdSeedBump,
    _entity_type: EntityTypes,
    _management_action:ManagementActions,
    _id: u64,
    _metadata: String
)]
// Instruction base pda, user id
pub struct ManageEntity<'info> {
    #[account()]
    pub audius_admin: Account<'info, AudiusAdmin>,
    // Audiusadmin
    #[account(
        seeds = [&base.to_bytes()[..32], &user_id_seed_bump.user_id.to_le_bytes()],
        bump = user_id_seed_bump.bump
    )]
    pub user: Account<'info, User>,
    #[account()]
    pub authority: Signer<'info>,
    /// CHECK: When signer is a delegate, validate UserAuthorityDelegate PDA  (default SystemProgram when signer is user)
    #[account()]
    pub user_authority_delegate: AccountInfo<'info>,
    /// CHECK: When signer is a delegate, validate AuthorityDelegationStatus PDA  (default SystemProgram when signer is user)
    #[account()]
    pub authority_delegation_status: AccountInfo<'info>,
}

/// Instruction container for track social action event
/// Confirm that the user authority matches signer authority field
#[derive(Accounts)]
#[instruction(base: Pubkey, user_id_seed_bump: UserIdSeedBump)]
pub struct WriteEntitySocialAction<'info> {
    // TODO - Verify removal here
    #[account()]
    pub audius_admin: Account<'info, AudiusAdmin>,
    #[account(seeds = [&base.to_bytes()[..32], &user_id_seed_bump.user_id.to_le_bytes()], bump = user_id_seed_bump.bump)]
    pub user: Account<'info, User>,
    #[account()]
    pub authority: Signer<'info>, 
    /// CHECK: When signer is a delegate, validate UserAuthorityDelegate PDA  (default SystemProgram when signer is user)
    #[account()]
    pub user_authority_delegate: AccountInfo<'info>,
    /// CHECK: When signer is a delegate, validate AuthorityDelegationStatus PDA  (default SystemProgram when signer is user)
    #[account()]
    pub authority_delegation_status: AccountInfo<'info>,
}

/// Instruction container for user social actions
#[derive(Accounts)]
#[instruction(base: Pubkey, user_instr:UserAction, source_user_id_seed_bump: UserIdSeedBump, target_user_id_seed_bump: UserIdSeedBump)]
pub struct WriteUserSocialAction<'info> {
    #[account(mut)]
    pub audius_admin: Account<'info, AudiusAdmin>,
    // Confirm the source user PDA matches the expected value provided the target user id and base
    #[account(mut, seeds = [&base.to_bytes()[..32], &source_user_id_seed_bump.user_id.to_le_bytes()], bump = source_user_id_seed_bump.bump)]
    pub source_user_storage: Account<'info, User>,
    // Confirm the target user PDA matches the expected value provided the target user id and base
    #[account(mut, seeds = [&base.to_bytes()[..32], &target_user_id_seed_bump.user_id.to_le_bytes()], bump = target_user_id_seed_bump.bump)]
    pub target_user_storage: Account<'info, User>,
    /// CHECK: When signer is a delegate, validate UserAuthorityDelegate PDA  (default SystemProgram when signer is user)
    #[account()]
    pub user_authority_delegate: AccountInfo<'info>,
    /// CHECK: When signer is a delegate, validate AuthorityDelegationStatus PDA  (default SystemProgram when signer is user)
    #[account()]
    pub authority_delegation_status: AccountInfo<'info>,
    // User update authority field
    #[account(mut)]
    pub authority: Signer<'info>,
}

/// Instruction container for verifying a user
#[derive(Accounts)]
#[instruction(base: Pubkey, user_id_seed_bump: UserIdSeedBump)]
pub struct UpdateIsVerified<'info> {
    pub audius_admin: Account<'info, AudiusAdmin>,
    #[account(seeds = [&base.to_bytes()[..32], &user_id_seed_bump.user_id.to_le_bytes()], bump = user_id_seed_bump.bump)]
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
    pub replica_set: [u16; 3]
}

/// Content Node storage account
#[account]
pub struct ContentNode {
    pub owner_eth_address: [u8; 20],
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

/// Authority delegation status account
#[account]
pub struct AuthorityDelegationStatus {
    // Revoke status for an authority's delegation eligibility
    pub is_revoked: bool,
}

// User actions enum, used to follow/unfollow based on function arguments
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum UserAction {
    FollowUser,
    UnfollowUser,
    SubscribeUser,
    UnsubscribeUser,
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

// Seed & bump used to validate the user's ID with the account base
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub struct UserIdSeedBump {
    pub user_id: u32,
    pub bump: u8,
}

// Seed & bump used to validate a content node 
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub struct ProposerSeedBump {
    pub seed: [u8; 7],
    pub bump: u8,
}
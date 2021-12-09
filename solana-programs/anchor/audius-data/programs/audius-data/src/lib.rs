use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod audius_data {
    use anchor_lang::solana_program::sysvar;
    use anchor_lang::solana_program::secp256k1_program;

    use super::*;
    // Initialize an admin address
    pub fn initialize_admin(ctx: Context<Initialize>, authority: Pubkey) -> ProgramResult {
        let audius_admin = &mut ctx.accounts.admin;
        audius_admin.authority = authority;
        Ok(())
    }

    // Initialize user from admin account
    pub fn init_user(
        ctx: Context<InitializeUser>,
        base: Pubkey,
        eth_address: [u8; 20],
        _handle_seed: [u8; 16],
        _user_bump: u8,
        metadata: String,
    ) -> ProgramResult {
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

        msg!("User metadata = {:?}", metadata);

        Ok(())
    }

    // Allow user to claim account
    pub fn init_user_sol(ctx: Context<InitializeUserSolIdentity>, sol_pub_key: Pubkey) -> ProgramResult {
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
            audius_user_acct.solana_pub_key = sol_pub_key;
        }
        Ok(())
    }

    // Pending functions:
    // - Update user with sol pub key after initialization
}

// Instructions
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + 32)]
    pub admin: Account<'info, AudiusAdmin>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(base: Pubkey, eth_address: [u8;20], handle_seed: [u8;16], user_bump: u8)]
pub struct InitializeUser<'info> {
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        init,
        payer = payer,
        seeds = [&base.to_bytes()[..32], handle_seed.as_ref()],
        bump = user_bump,
        space = 8 + 32 + 20
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeUserSolIdentity<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub sysvar_program: AccountInfo<'info>
}

// END Instructions

// Storage
#[account]
pub struct AudiusAdmin {
    pub authority: Pubkey,
}

#[account]
// User storage account
pub struct User {
    pub eth_address: [u8; 20],
    pub solana_pub_key: Pubkey,
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
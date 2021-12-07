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

    pub fn init_user(
        ctx: Context<InitializeUser>,
        eth_address: [u8; 20],
        _handle_seed: [u8; 16],
        _user_bump: u8,
        metadata: String,
    ) -> ProgramResult {
        let audius_user_acct = &mut ctx.accounts.user;
        audius_user_acct.eth_address = eth_address;

        if ctx.accounts.authority.key() != ctx.accounts.admin.authority {
            return Err(ErrorCode::Unauthorized.into());
        }

        msg!("User metadata = {:?}", metadata);

        Ok(())
    }

    pub fn init_user_sol(ctx: Context<InitializeUserSolIdentity>, sol_pub_key: Pubkey) -> ProgramResult {
        let audius_user_acct = &mut ctx.accounts.user;
        let index_current_instruction = sysvar::instructions::load_current_index_checked(
            &ctx.accounts.sysvar_program
        )?;
        // instruction must contain at least one prior
        if index_current_instruction < 1 {
            return Err(ErrorCode::Unauthorized.into());
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
#[instruction(eth_address: [u8;20], handle_seed: [u8;16], user_bump: u8)]
pub struct InitializeUser<'info> {
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        init,
        payer = payer,
        seeds = [handle_seed.as_ref()],
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
// TODO: Consider whether this has to be linked to root
pub struct User {
    pub eth_address: [u8; 20],
    pub solana_pub_key: Pubkey,
}

// Errors
#[error]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}

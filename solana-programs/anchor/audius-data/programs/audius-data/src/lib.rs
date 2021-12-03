use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod audius_data {
    const USER_PDA_SEED: &[u8] = b"user";

    use super::*;
    // Initialize an admin address
    pub fn initialize_admin(ctx: Context<Initialize>, authority: Pubkey) -> ProgramResult {
        let audius_admin = &mut ctx.accounts.admin;
        audius_admin.authority = authority;
        Ok(())
    }

    pub fn init_user(ctx: Context<InitializeUser>, eth_address: [u8;20], _user_bump: u8) -> ProgramResult {
        let audius_user_acct = &mut ctx.accounts.user;
        audius_user_acct.eth_address = eth_address;

        let (user_authority, _user_bump) =
            Pubkey::find_program_address(&[USER_PDA_SEED], ctx.program_id);
        msg!("{:?}, {:?}", user_authority, _user_bump);

        if ctx.accounts.authority.key() != ctx.accounts.admin.authority {
            return Err(ErrorCode::Unauthorized.into());
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
#[instruction(eth_address: [u8;20], user_bump: u8)]
pub struct InitializeUser<'info> {
    // TODO: Enforce owner constraints
    pub admin: Account<'info, AudiusAdmin>,
    #[account(
        init,
        payer = payer,
        seeds = [b"user".as_ref()],
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

// Storage
#[account]
pub struct AudiusAdmin {
    pub authority: Pubkey
}

#[account]
// TODO: Consider whether this has to be linked to root
pub struct User {
    pub eth_address: [u8;20],
    pub solana_pub_key: Pubkey
}

// Errors
#[error]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}
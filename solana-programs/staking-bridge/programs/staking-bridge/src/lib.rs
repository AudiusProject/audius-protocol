use anchor_lang::prelude::*;
use anchor_spl::token::{
    Token
};

declare_id!("HEDM7Zg7wNVSCWpV4TF7zp6rgj44C43CXnLtpY68V7bV");

#[program]
pub mod staking_bridge {
    use super::*;

    /**
     * Creates the PDA.
     * This instruction can be called by anyone.
     * Immediately returns successfully because Anchor handles
     * the PDA creation via the CreatePda struct account macros.
     */
    pub fn create_pda(ctx: Context<CreatePda>) -> Result<()> {
        Ok(())
    }

    pub fn swap(ctx: Context<Swap>) -> Result<()> {
        Ok(())
    }

    pub fn post_message(ctx: Context<PostMessage>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePda<'info> {
    #[account(
        init,
        seeds = [b"staking_bridge".as_ref()],
        payer = payer,
        bump,
        space = 8
    )]
    /// CHECK: This is the PDA owned by this program. This account holds both SOL USDC and SOL AUDIO. It is used to swap between the two tokens. This PDA is also used to transfer SOL AUDIO to ETH AUDIO via the wormhole.
    pub staking_bridge_pda: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

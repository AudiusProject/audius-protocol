use anchor_lang::prelude::*;

declare_id!("BsBDtuZLBxpdhKLeLw299uxWuqJTXzv3x8nAzgqDsu2F");

#[program]
pub mod crowdfund {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

use anchor_lang::prelude::*;

declare_id!("HEDM7Zg7wNVSCWpV4TF7zp6rgj44C43CXnLtpY68V7bV");

#[program]
pub mod staking_bridge {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

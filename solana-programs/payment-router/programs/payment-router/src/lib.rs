use anchor_lang::prelude::*;

declare_id!("6pca6uGGV5GYKY8W9aGfJbWPx4pe5mW8wLaP9c3LUNpp");

#[program]
pub mod payment_router {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

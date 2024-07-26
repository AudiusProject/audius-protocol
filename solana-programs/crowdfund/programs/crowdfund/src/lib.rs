use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};

declare_id!("BsBDtuZLBxpdhKLeLw299uxWuqJTXzv3x8nAzgqDsu2F");

#[program]
pub mod crowdfund {
    use super::*;

    pub fn start_campaign(
        ctx: Context<StartCampaignCtx>,
        content_id: u64,
        content_type: u8,
        data: Campaign,
    ) -> Result<()> {
        msg!("Starting campaign: {:?}", ctx.program_id);

        let campaign_account = &mut ctx.accounts.campaign_account;
        campaign_account.destination_wallet = data.destination_wallet;
        campaign_account.funding_threshold = data.funding_threshold;
        campaign_account.content_id = content_id;
        campaign_account.content_type = content_type;
        campaign_account.fee_payer_wallet = *ctx.accounts.fee_payer_wallet.key;
        campaign_account.bump = ctx.bumps.campaign_account;

        msg!("Campaign account: {:?}", campaign_account.key().to_string());

        Ok(())
    }

    // pub fn contribute(ctx: Context<ContributeCtx>, amount: u64) -> Result<()> {
    //     msg!("Contributing to campaign: {:?}", ctx.program_id);

    //     Ok(())
    // }
}

// #[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
// pub enum ContentType {
//     Track,
//     Album,
// }

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Campaign {
    destination_wallet: Pubkey,
    funding_threshold: u64,
    // content_id: u64,
    // content_type: u8,
    fee_payer_wallet: Pubkey,
    // funding_deadline: i64,
}

#[account]
pub struct CampaignAccount {
    destination_wallet: Pubkey,
    funding_threshold: u64,
    content_id: u64,
    content_type: u8,
    fee_payer_wallet: Pubkey,
    bump: u8,
    // funding_deadline: i64,
}

#[derive(Accounts)]
#[instruction(content_id: u64, content_type: u8, data: Campaign)]
pub struct StartCampaignCtx<'info> {
    #[account(mut)]
    pub fee_payer_wallet: Signer<'info>,
    #[account(
        init,
        payer = fee_payer_wallet,
        space = 8 + 32 + 8 + 8 + 1 + 32 + 1,
        seeds = [
            b"campaign",
            content_id.try_to_vec().unwrap().as_slice(),
            content_type.try_to_vec().unwrap().as_slice()
            ],
        bump
    )]
    pub campaign_account: Account<'info, CampaignAccount>,
    pub system_program: Program<'info, System>,
}

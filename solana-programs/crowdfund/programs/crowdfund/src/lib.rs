use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use anchor_spl::token::{Token, TokenAccount};
use int_enum::IntEnum;

declare_id!("4UkTdMM9dNqjUAEjAJVj8Rec83bG747V9dZP7HLK2LJk");

#[error_code]
pub enum CustomError {
    #[msg("Content type not supported")]
    InvalidContentType
}

#[program]
pub mod crowdfund {
    use super::*;

    pub fn start_campaign(
        ctx: Context<StartCampaignCtx>,
        campaign: Campaign,
    ) -> Result<()> {
        msg!("Starting campaign: {:?}", ctx.program_id);

        let content_type = match ContentType::try_from(campaign.content_type) {
            Err(_) => return err!(CustomError::InvalidContentType),
            Ok(f) => f,
        };

        let campaign_account = &mut ctx.accounts.campaign_account;
        campaign_account.destination_wallet = campaign.destination_wallet;
        campaign_account.funding_threshold = campaign.funding_threshold;
        campaign_account.content_id = campaign.content_id;
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

#[repr(u8)]
#[derive(IntEnum, AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
pub enum ContentType {
    Track = 1,
    Album = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Campaign {
    destination_wallet: Pubkey,
    funding_threshold: u64,
    content_id: u32,
    content_type: u8,
}

#[account]
pub struct CampaignAccount {
    destination_wallet: Pubkey,
    funding_threshold: u64,
    content_id: u32,
    content_type: ContentType,
    fee_payer_wallet: Pubkey,
    bump: u8,
    // funding_deadline: i64,
}

#[derive(Accounts)]
#[instruction(campaign: Campaign)]
pub struct StartCampaignCtx<'info> {
    #[account(mut)]
    pub fee_payer_wallet: Signer<'info>,
    #[account(
        init,
        payer = fee_payer_wallet,
        space = 8 + 32 + 8 + 4 + 1 + 32 + 1,
        seeds = [
            b"campaign",
            campaign.content_id.try_to_vec().unwrap().as_slice(),
            campaign.content_type.try_to_vec().unwrap().as_slice()
            ],
        bump
    )]
    pub campaign_account: Account<'info, CampaignAccount>,
    #[account(
        init,
        payer = fee_payer_wallet,
        token::mint = mint,
        token::authority = campaign_account
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    /// CHECK: We're only using this for deriving the token account
    pub mint: UncheckedAccount<'info>,
}

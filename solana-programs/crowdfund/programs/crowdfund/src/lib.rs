use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use anchor_spl::token::spl_token;
use anchor_spl::token::{Token, TokenAccount};
use int_enum::IntEnum;

declare_id!("4UkTdMM9dNqjUAEjAJVj8Rec83bG747V9dZP7HLK2LJk");

#[error_code]
pub enum CustomError {
    #[msg("Content type not supported")]
    InvalidContentType,
    #[msg("Campaign not funded")]
    CampaignNotFunded,
}

#[program]
pub mod crowdfund {
    use std::cmp::min;

    use spl_token::solana_program::program::invoke_signed;

    use super::*;

    pub fn start_campaign(
        ctx: Context<StartCampaignCtx>,
        campaign: StartCampaignInstructionData,
    ) -> Result<()> {
        msg!("Starting campaign: {:?}", ctx.program_id);

        // let content_type = match ContentType::try_from(campaign.content_type) {
        //     Err(_) => return err!(CustomError::InvalidContentType),
        //     Ok(f) => f,
        // };

        let campaign_account = &mut ctx.accounts.campaign_account;
        campaign_account.destination_wallet = campaign.destination_wallet;
        campaign_account.funding_threshold = campaign.funding_threshold;
        campaign_account.content_id = campaign.content_id;
        campaign_account.content_type = campaign.content_type;
        campaign_account.fee_payer_wallet = *ctx.accounts.fee_payer_wallet.key;
        campaign_account.bump = ctx.bumps.campaign_account;

        msg!("Campaign account: {:?}", campaign_account.key().to_string());

        Ok(())
    }

    pub fn contribute(ctx: Context<ContributeCtx>, data: ContributeInstructionData) -> Result<()> {
        let campaign_account: Account<CampaignAccount> = ctx.accounts.campaign_account.clone();
        let threshold = campaign_account.funding_threshold;
        let balance = ctx.accounts.escrow_token_account.amount;
        let amount = min(threshold - balance, data.amount);
        let receiver = ctx.accounts.escrow_token_account.to_account_info();
        let sender_token_account = ctx.accounts.sender_token_account.to_account_info();
        let sender = ctx.accounts.sender_owner.to_account_info();
        let account_infos = &[
            sender_token_account.clone(),
            receiver.clone(),
            sender.clone(),
        ];

        let transfer = &spl_token::instruction::transfer(
            &spl_token::id(),
            sender_token_account.key,
            receiver.key,
            sender.key,
            &[sender.key],
            amount,
        )?;
        invoke(transfer, account_infos)?;

        Ok(())
    }

    pub fn unlock(ctx: Context<UnlockCtx>, _data: UnlockInstructionData) -> Result<()> {
        let campaign_account: Account<CampaignAccount> = ctx.accounts.campaign_account.clone();
        let owner = ctx.accounts.campaign_account.to_account_info();
        let amount = ctx.accounts.escrow_token_account.amount;
        let threshold = campaign_account.funding_threshold;

        if amount < threshold {
            // TODO: if it's the owner, they can end campaign early?
            return Err(CustomError::CampaignNotFunded.into());
        }

        let receiver = ctx.accounts.destination_account.to_account_info();
        let sender = ctx.accounts.escrow_token_account.to_account_info();
        let account_infos = &[sender.clone(), receiver.clone(), owner.clone()];

        let transfer = &spl_token::instruction::transfer(
            &spl_token::id(),
            sender.key,
            receiver.key,
            owner.key,
            &[owner.key],
            amount,
        )?;
        invoke_signed(
            transfer,
            account_infos,
            &[&[
                b"campaign".as_ref(),
                campaign_account.content_id.try_to_vec().unwrap().as_slice(),
                campaign_account
                    .content_type
                    .try_to_vec()
                    .unwrap()
                    .as_slice(),
                &[campaign_account.bump],
            ]],
        )?;

        msg!("Campaign fully funded! Unlocking funds");

        Ok(())
    }
}

#[repr(u8)]
#[derive(IntEnum, AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
pub enum ContentType {
    Track = 1,
    Album = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct StartCampaignInstructionData {
    destination_wallet: Pubkey,
    funding_threshold: u64,
    content_id: u32,
    content_type: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ContributeInstructionData {
    content_id: u32,
    content_type: u8,
    amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct UnlockInstructionData {
    content_id: u32,
    content_type: u8,
}

#[account]
pub struct CampaignAccount {
    destination_wallet: Pubkey,
    funding_threshold: u64,
    content_id: u32,
    content_type: u8,
    fee_payer_wallet: Pubkey,
    bump: u8,
    // funding_deadline: i64,
}

#[derive(Accounts)]
#[instruction(campaign: StartCampaignInstructionData)]
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
        token::authority = campaign_account,
        seeds = [
            b"escrow", 
            campaign.content_id.try_to_vec().unwrap().as_slice(),
            campaign.content_type.try_to_vec().unwrap().as_slice()
        ],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    /// CHECK: We're only using this for deriving the token account
    pub mint: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(data: ContributeInstructionData)]
pub struct ContributeCtx<'info> {
    pub sender_owner: Signer<'info>,
    #[account(mut, token::authority = sender_owner)]
    pub sender_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [
            b"campaign",
            data.content_id.try_to_vec().unwrap().as_slice(),
            data.content_type.try_to_vec().unwrap().as_slice()
        ],
        bump
    )]
    pub campaign_account: Account<'info, CampaignAccount>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = campaign_account,
        seeds = [
            b"escrow", 
            data.content_id.try_to_vec().unwrap().as_slice(),
            data.content_type.try_to_vec().unwrap().as_slice()
        ],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    /// CHECK: We're only using this for deriving the token account
    pub mint: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(data: UnlockInstructionData)]
pub struct UnlockCtx<'info> {
    #[account(mut, address = campaign_account.fee_payer_wallet)]
    /// CHECK:
    pub fee_payer_wallet: UncheckedAccount<'info>,
    #[account(
        mut,
        close = fee_payer_wallet,
        seeds = [
            b"campaign",
            data.content_id.try_to_vec().unwrap().as_slice(),
            data.content_type.try_to_vec().unwrap().as_slice()
        ],
        bump
    )]
    pub campaign_account: Account<'info, CampaignAccount>,
    #[account(
        mut,
        seeds = [
            b"escrow", 
            data.content_id.try_to_vec().unwrap().as_slice(),
            data.content_type.try_to_vec().unwrap().as_slice()
        ],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, address = campaign_account.destination_wallet)]
    pub destination_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    /// CHECK: We're only using this for deriving the token account
    pub mint: UncheckedAccount<'info>,
}

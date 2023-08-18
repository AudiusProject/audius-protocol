use anchor_lang::prelude::*;
use anchor_lang::{
    AnchorDeserialize,
    AnchorSerialize,
};
use anchor_spl::token::Token;

pub mod constant;
pub mod error;
pub mod utils;

use crate::utils::{
    check_recipient_amounts,
    check_sender,
    execute_transfers
};

declare_id!("6pca6uGGV5GYKY8W9aGfJbWPx4pe5mW8wLaP9c3LUNpp");

#[program]
pub mod payment_router {
    use super::*;

    pub fn create_pda(_ctx: Context<CreatePDA>) -> Result<()> {
        Ok(())
    }

    pub fn route<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, Route<'info>>,
        payment_router_pda_bump: u8,
        amounts: Vec<u64>,
        total_amount: u64,
        is_audio: bool,
    ) -> Result<()> {
        let sender = &ctx.accounts.sender;
        let sender_owner = &ctx.accounts.sender_owner;
        let remaining_accounts = ctx.remaining_accounts;

        check_sender(
            sender.to_account_info(),
            sender_owner.to_account_info(),
            is_audio
        )?;
        check_recipient_amounts(
            remaining_accounts,
            amounts.clone(),
            total_amount
        )?;
        execute_transfers(
            sender.clone(),
            sender_owner.clone(),
            remaining_accounts,
            amounts.clone(),
            is_audio,
            payment_router_pda_bump
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePDA<'info> {
    #[account(
        init,
        seeds = [b"payment_router".as_ref()],
        payer = payer,
        bump,
        space = 8
    )]
    /// CHECK: This is the PDA owned by this program. This account will temporarily hold SOL USDC and SOL AUDIO tokens
    /// before transferring them over to given recipients, all within the same transaction.
    pub payment_router_pda: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(payment_router_pda_bump: u8, _amounts: Vec<u8>, _total_amount: u64, _is_audio: bool)]
pub struct Route<'info> {
    #[account(mut)]
    /// CHECK: This is the token account owned by the PDA.
    pub sender: AccountInfo<'info>,
    #[account(
        seeds = [b"payment_router".as_ref()],
        bump = payment_router_pda_bump
    )]
    /// CHECK: This is the PDA initialized in the CreatePDA instruction.
    pub sender_owner: AccountInfo<'info>,
    pub spl_token: Program<'info, Token>,
}

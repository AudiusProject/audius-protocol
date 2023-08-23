use anchor_lang::prelude::*;
use anchor_lang::{
    AnchorDeserialize,
    AnchorSerialize,
};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::
    {
        TokenAccount,
        Mint,
        Token
    }
};

pub mod error;
pub mod router;

use crate::router::{
    SOL_AUDIO_TOKEN_ADDRESS,
    check_recipient_amounts,
    check_sender,
    execute_transfers
};

declare_id!("6pca6uGGV5GYKY8W9aGfJbWPx4pe5mW8wLaP9c3LUNpp");

#[program]
pub mod payment_router {
    use super::*;

    pub fn create_payment_router_balance_pda(_ctx: Context<CreatePaymentRouterBalancePDA>) -> Result<()> {
        Ok(())
    }

    pub fn create_payment_router_balance_ata(
        _ctx: Context<CreatePaymentRouterBalanceAta>,
        _payment_router_pda_bump: u8
    ) -> Result<()> {
        Ok(())
    }

    pub fn route<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, Route<'info>>,
        payment_router_pda_bump: u8,
        amounts: Vec<u64>,
        total_amount: u64
    ) -> Result<()> {
        let sender = &ctx.accounts.sender.to_account_info();
        let sender_owner = &ctx.accounts.sender_owner.to_account_info();
        let remaining_accounts = ctx.remaining_accounts;

        check_sender(
            sender.clone(),
            sender_owner.clone()
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
            payment_router_pda_bump
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePaymentRouterBalancePDA<'info> {
    #[account(
        init,
        seeds = [b"payment_router".as_ref()],
        payer = payer,
        bump,
        space = 8
    )]
    /// CHECK: This is the PDA owned by this program. This account will temporarily hold SOL USDC and SOL AUDIO tokens
    /// before transferring them over to given recipients, all within the same transaction.
    pub payment_router_pda: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(payment_router_pda_bump: u8)]
pub struct CreatePaymentRouterBalanceAta<'info> {
    #[account(
        seeds = [b"payment_router".as_ref()],
        bump = payment_router_pda_bump,
    )]
    /// CHECK: This is the PDA owned by this program. This account holds both SOL USDC and SOL AUDIO. It is used to swap between the two tokens. This PDA is also used to transfer SOL AUDIO to ETH AUDIO via the wormhole.
    pub payment_router_pda: UncheckedAccount<'info>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = audio_mint,
        associated_token::authority = payment_router_pda,
    )]
    pub audio_token_account: Account<'info, TokenAccount>,
    #[account(address = SOL_AUDIO_TOKEN_ADDRESS.parse::<Pubkey>().unwrap())]
    pub audio_mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    payment_router_pda_bump: u8,
    _amounts: Vec<u64>,
    _total_amount: u64
)]
pub struct Route<'info> {
    #[account(mut)]
    /// CHECK: This is the token account owned by the PDA.
    pub sender: UncheckedAccount<'info>,
    #[account(
        seeds = [b"payment_router".as_ref()],
        bump = payment_router_pda_bump
    )]
    /// CHECK: This is the PDA initialized in the CreatePaymentRouterBalancePDA instruction.
    pub sender_owner: UncheckedAccount<'info>,
    pub spl_token: Program<'info, Token>,
}

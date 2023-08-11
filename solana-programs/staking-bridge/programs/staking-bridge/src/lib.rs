use anchor_lang::prelude::*;
use anchor_spl::token::Token;

pub mod constant;
pub mod error;
pub mod raydium_utils;
pub mod wormhole_utils;

use crate::raydium_utils::{
    check_token_accounts,
    check_raydium_pdas,
    swap
};
use crate::wormhole_utils::{
    check_wormhole_pdas,
    approve_wormhole_transfer,
    wormhole_transfer
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

    pub fn raydium_swap(
        ctx: Context<RaydiumSwap>,
        amount_in: u64,
        minimum_amount_out: u64,
        vault_nonce: u64,
        staking_bridge_pda_bump: u8
    ) -> Result<()> {
        // let accounts = ctx.accounts;
        // // CHECK: check mints and token accounts and owner
        // check_token_accounts(accounts)?;
        // check_raydium_pdas(
        //     accounts,
        //     vault_nonce
        // )?;
        // swap(
        //     accounts,
        //     amount_in,
        //     minimum_amount_out,
        //     staking_bridge_pda_bump
        // )?;
        Ok(())
    }

    pub fn post_wormhole_message(
        ctx: Context<PostWormholeMessage>,
        nonce: u32,
        amount: u64,
        fee: u64,
        target_address: [u8; 32],
        target_chain: u16,
        token_address: [u8; 32],
        token_chain: u16,
        config_bump: u8,
        wrapped_mint_bump: u8,
        wrapped_meta_bump: u8,
        authority_signer_bump: u8,
        bridge_config_bump: u8,
        emitter_bump: u8,
        sequence_bump: u8,
        fee_collector_bump: u8,
        staking_bridge_pda_bump: u8,
    ) -> Result<()> {
        // let accounts = ctx.accounts;
        // // CHECK: check mints and token accounts and owner
        // // CHECK: lock chain, token address, and target address
        // check_wormhole_pdas(
        //     accounts,
        //     config_bump,
        //     wrapped_mint_bump,
        //     wrapped_meta_bump,
        //     authority_signer_bump,
        //     bridge_config_bump,
        //     emitter_bump,
        //     sequence_bump,
        //     fee_collector_bump,
        //     token_address,
        //     token_chain,
        // )?;
        // approve_wormhole_transfer(
        //     from,
        //     authority_signer,
        //     from_owner,
        //     amount,
        //     staking_bridge_pda_bump
        // )?;
        // wormhole_transfer(
        //     accounts,
        //     nonce,
        //     amount,
        //     fee,
        //     target_address,
        //     target_chain,
        //     staking_bridge_pda_bump
        // )?;
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

#[derive(AnchorDeserialize, AnchorSerialize, Default)]
pub struct Amounts {
    pub amount_in: u64,
    pub minimum_amount_out: u64,
}

#[derive(Accounts)]
#[instruction(
  _amount_in: u64,
  _minimum_amount_out: u64,
  _vault_nonce: u64,
  staking_bridge_pda_bump: u8
)]
pub struct RaydiumSwap<'info> {
    /// CHECK: This is the Raydium Liquidity Pool V4 program id
    pub program_id: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub amm: AccountInfo<'info>,
    #[account()]
    /// CHECK: ok
    pub amm_authority: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub amm_open_orders: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub amm_target_orders: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub pool_coin_token_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub pool_pc_token_account: AccountInfo<'info>,
    #[account()]
    /// CHECK: This is the Serum DEX program
    pub serum_program: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the market address
    pub serum_market: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_bids: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_asks: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_event_queue: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_coin_vault_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub serum_pc_vault_account: AccountInfo<'info>,
    #[account()]
    /// CHECK: ok
    pub serum_vault_signer: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub user_source_token_account: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: ok
    pub user_destination_token_account: AccountInfo<'info>,
    #[account(
        seeds = [b"staking_bridge".as_ref()],
        bump = staking_bridge_pda_bump
    )]
    /// CHECK: This is the PDA initialized in the CreatePDA instruction.
    pub user_source_owner: AccountInfo<'info>,
    pub spl_token_program: Program<'info, Token>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Default)]
pub struct PostWormholeMessageData {
    pub nonce: u32,
    pub amount: u64,
    pub fee: u64,
    pub target_address: [u8; 32],
    pub target_chain: u16,
}

#[derive(Accounts)]
#[instruction(
    _nonce: u32,
    _amount: u64,
    _fee: u64,
    _target_address: [u8; 32],
    _target_chain: u16,
    _token_address: [u8; 32],
    _token_chain: u16,
    _config_bump: u8,
    _wrapped_mint_bump: u8,
    _wrapped_meta_bump: u8,
    _authority_signer_bump: u8,
    _bridge_config_bump: u8,
    _emitter_bump: u8,
    _sequence_bump: u8,
    _fee_collector_bump: u8,
    staking_bridge_pda_bump: u8
)]
pub struct PostWormholeMessage<'info> {
    /// CHECK: This is the Token Bridge program id
    pub program_id: AccountInfo<'info>,
    /// CHECK: This is the Core Bridge program id
    pub bridge_id: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    /// CHECK: This is the config PDA owned by the Token Bridge program_id
    pub config: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the wrapped mint PDA, which also depends on the origin token chain and origin token address, owned by the Token Bridge program_id
    pub wrapped_mint: AccountInfo<'info>,
    #[account()]
    /// CHECK: This is the wrapped meta PDA, which also depends on the wrapped mint, owned by the Token Bridge program_id
    pub wrapped_meta: AccountInfo<'info>,
    #[account()]
    /// CHECK: This is the authority signer PDA owned by the Token Bridge program_id
    pub authority_signer: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the bridge PDA owned by the Core Bridge bridge_id
    pub bridge_config: AccountInfo<'info>,
    #[account()]
    /// CHECK: This is the emitter PDA owned by the Token Bridge program_id
    pub emitter: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the sequence PDA, which also depends on the emitter, owned by the Core Bridge bridge_id
    pub sequence: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the fee collector PDA owned by the Core Bridge bridge_id
    pub fee_collector: AccountInfo<'info>,
    #[account(mut)]
    pub message: Signer<'info>,
    #[account(
        seeds = [b"staking_bridge".as_ref()],
        bump = staking_bridge_pda_bump
    )]
    #[account(mut)]
    /// CHECK: This is the PDA initialized in the CreatePDA instruction.
    pub from_owner: AccountInfo<'info>,
    #[account(mut)]
    /// CHECK: This is the associated token account of the PDA, from which the tokens will be transferred
    pub from: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub spl_token: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
